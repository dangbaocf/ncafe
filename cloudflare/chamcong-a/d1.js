/**
 * Ncafe Đợt A – module Cloudflare Worker chấm công D1.
 *
 * Áp luật B: KHÔNG đọc lịch Xếp lịch, KHÔNG có "khớp lịch". Trễ = chấm vs giờ ca NV tự chọn
 * (ca phát sinh so với giờ tự nhập).
 *
 * Code chạy trên Cloudflare Workers (ES module), KHÔNG phụ thuộc Google Apps Script runtime.
 * Toàn bộ helper được port từ cham-cong/Code.gs tương đương (giữ tên hàm cho dễ đối chiếu).
 */

/* ============ 1. Hằng số & helper thời gian / IP (port từ Code.gs) ============ */
export const TZ = 'Asia/Ho_Chi_Minh';
export const TZ_OFFSET_MS = 7 * 3600 * 1000;   // VN UTC+7, không có DST

/** Trả 'yyyy-MM-dd' theo giờ VN. */
export function fmtDate(d) {
  const t = new Date((d instanceof Date ? d.getTime() : d) + TZ_OFFSET_MS);
  return t.toISOString().slice(0, 10);
}
/** Trả 'HH:mm' theo giờ VN. */
export function fmtTime(d) {
  const t = new Date((d instanceof Date ? d.getTime() : d) + TZ_OFFSET_MS);
  return t.toISOString().slice(11, 16);
}
/** 'yyyy-MM-dd HH:mm:ss' theo giờ VN – dùng cho cột Luc / Updated. */
export function fmtDT(d) {
  const t = new Date((d instanceof Date ? d.getTime() : d) + TZ_OFFSET_MS);
  return t.toISOString().slice(0, 19).replace('T', ' ');
}
/** Chuẩn hoá chuỗi giờ về HH:mm (chấp nhận 6:30, 06:30, 6h30, 6.30…). */
export function hhmm(x) {
  if (!x) return '';
  const s = String(x).trim();
  const m = /^(\d{1,2})[:hH.](\d{1,2})/.exec(s);
  if (!m) return /^\d{1,2}$/.test(s) ? (s.padStart(2, '0') + ':00') : '';
  const h = +m[1], p = +m[2];
  if (h < 0 || h > 23 || p < 0 || p > 59) return '';
  return String(h).padStart(2, '0') + ':' + String(p).padStart(2, '0');
}
export function toMin(hm) {
  const m = /^(\d{1,2}):(\d{1,2})$/.exec(hhmm(hm));
  return m ? +m[1] * 60 + +m[2] : 0;
}
/** Tên gọi NV: 'Đan (Linh Đan)' → 'Đan'. */
export function tenNgan(t) { return String(t || '').split(' (')[0]; }
/** Chữ cái đầu các từ: 'Võ Thị Thiện Lương' → 'V.T.T.L'. */
export function chuDau(t) {
  return String(t || '').trim().split(/\s+/).filter(Boolean)
    .map(w => w.charAt(0).toUpperCase()).join('.');
}
export function up(x) { return String(x || '').toUpperCase().trim(); }
export function so(x) { return +String(x == null ? 0 : x).replace(',', '.') || 0; }

/** ID lượt chấm: yyMMddHHmmss-MANV. */
export function idMoi(now, maNV) {
  const t = new Date(now.getTime() + TZ_OFFSET_MS).toISOString().replace(/[-:T]/g, '').slice(2, 14);
  return t + '-' + up(maNV);
}

/* ============ 2. IP – chuẩn hoá cho IPv4 bị Sheet đổi kiểu + IPv6 /64 ============
 * Vì D1 lưu text, không có vấn đề Sheet. Nhưng vẫn giữ `ipKhop` để so với Pattern có '*'. */
export function ipChuan(ip) {
  const s = String(ip || '').trim();
  if (!s) return '';
  if (s.includes(':')) {
    // IPv6 – lấy /64
    const parts = s.split(':');
    if (parts.length < 4) return s;
    return parts.slice(0, 4).join(':') + '::/64';
  }
  return s;
}
export function ipKhop(ip, pattern) {
  const i = String(ip || ''), p = String(pattern || '');
  if (!i || !p) return false;
  if (p.includes(':') && p.endsWith('::/64')) {
    // IPv6 /64
    return i.includes(':') && i.split(':').slice(0, 4).join(':') === p.replace('::/64', '');
  }
  if (p.includes('*')) {
    const re = new RegExp('^' + p.replace(/\./g, '\\.').replace(/\*/g, '[0-9]+') + '$');
    return re.test(i);
  }
  if (p.includes('/')) {
    // CIDR IPv4 đơn giản (chỉ /24, /16, /8)
    const [base, mask] = p.split('/');
    const b = base.split('.').map(Number), x = i.split('.').map(Number);
    const m = +mask;
    if (m === 24) return b[0] === x[0] && b[1] === x[1] && b[2] === x[2];
    if (m === 16) return b[0] === x[0] && b[1] === x[1];
    if (m === 8) return b[0] === x[0];
  }
  return i === p;
}

/* ============ 3. QR token (port từ qrSecret + qrToken trong Code.gs) ============
 * SHA256(secret + '|' + maCS + '|' + ver), base64url, lấy 10 ký tự alnum.
 * secret được port từ Apps Script CaiDat sang Cloudflare secret env.QR_SECRET. */
export async function qrToken(env, maCS, ver) {
  const raw = String(env.QR_SECRET || '') + '|' + up(maCS) + '|' + String(ver || '');
  const bytes = new TextEncoder().encode(raw);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  const b64 = btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
    .replace(/[^A-Za-z0-9]/g, '');
  return b64.slice(0, 10);
}
/** Trả CoSo nếu token khớp, null nếu không. */
export async function qrStore(env, maCS, token) {
  const cs = await getCoSo(env, maCS);
  if (!cs) return null;
  const t = await qrToken(env, cs.MaCS, cs.QRVer || '');
  return t === token ? cs : null;
}

/* ============ 4. D1 helper: NhanVien / CoSo / Ca / CaiDat ============ */
export async function getNhanVien(env, maNV) {
  const r = await env.DB.prepare('SELECT * FROM NhanVien WHERE MaNV = ?1').bind(up(maNV)).first();
  return r || null;
}
export async function dangLam(nv) {
  if (!nv) return false;
  const tt = String(nv.TrangThai || 'Đang làm');
  return tt !== 'Nghỉ việc' && tt !== 'Đã nghỉ';
}
export async function getCoSo(env, maCS) {
  const r = await env.DB.prepare('SELECT * FROM CoSo WHERE MaCS = ?1').bind(up(maCS)).first();
  return r || null;
}
export async function getCa(env, maCa) {
  if (!maCa) return null;
  const r = await env.DB.prepare('SELECT * FROM Ca WHERE MaCa = ?1').bind(up(maCa)).first();
  return r || null;
}

/* CaiDat cache per-request (Workers runtime: biến global reset mỗi request isolate).
 * Có thể nâng cấp dùng KV cache sau nếu latency là vấn đề. */
let _cfgCache = null, _cfgLuc = 0;
export async function cfgTat(env) { _cfgCache = null; _cfgLuc = 0; }
export async function cfg(env, key) {
  if (!_cfgCache || Date.now() - _cfgLuc > 300000) {
    const rs = await env.DB.prepare('SELECT Key, Value FROM CaiDat').all();
    _cfgCache = {}; (rs.results || []).forEach(r => { _cfgCache[r.Key] = r.Value; });
    _cfgLuc = Date.now();
  }
  return _cfgCache[key];
}

/* ============ 5. Ca đang mở ============ */
export async function caDangMo(env, maNV) {
  const today = fmtDate(new Date());
  const r = await env.DB.prepare(
    "SELECT * FROM ChamCong WHERE MaNV = ?1 AND Ngay >= ?2 AND TrangThai = 'Đang làm' ORDER BY Vao DESC LIMIT 1"
  ).bind(up(maNV), today).first();
  return r || null;
}

/* ============ 6. Wi-Fi (port từ Code.gs wifiKiem_, wifiChan_, wifiLaMobile_, …) ============ */
export function wifiLaMobile(asOrg) {
  const s = String(asOrg || '');
  if (!s) return false;
  return /\bmobile\b|cellular|wireless|viettel\s*mobile|mobifone|vinaphone|vietnamobile|reddi|itel|gmobile/i.test(s);
}
export async function wifiCheDo(env) {
  const v = String(await cfg(env, 'WIFI_CHE_DO') || 'Cảnh báo');
  if (/^bắt/i.test(v)) return 'batbuoc';
  if (/^tắt/i.test(v)) return 'tat';
  return 'canhbao';
}
export async function wifiDs(env) {
  // Toàn bộ IP registered, lọc TrangThai != 'Bỏ'
  const rs = await env.DB.prepare("SELECT IP, MaCS FROM WifiQuan WHERE TrangThai <> 'Bỏ'").all();
  return rs.results || [];
}
export async function wifiKiem(env, maCS, ip) {
  const cd = await wifiCheDo(env);
  const ds = await wifiDs(env);
  if (cd === 'tat' || !ds.length) return { bat: false, ok: true, ip, cheDo: cd };
  const w = ds.find(x => ipKhop(ip, x.IP));
  return { bat: true, ok: !!w, khop: !!w, ip, cheDo: cd, cs: w ? up(w.MaCS) : '' };
}
/** 2h, cùng quán + cùng IP, trả danh sách MaNV khác (unique). */
export async function wifiDemNVKhacCho(env, maCS, ip, maNVHienTai, durationMs) {
  const since = fmtDT(new Date(Date.now() - durationMs));
  const rs = await env.DB.prepare(
    "SELECT DISTINCT MaNV FROM WifiCho WHERE MaCS = ?1 AND IP = ?2 AND TrangThai = 'Cho' AND Luc >= ?3 AND MaNV <> ?4"
  ).bind(up(maCS), ip, since, up(maNVHienTai)).all();
  return (rs.results || []).map(r => String(r.MaNV));
}
export async function wifiThemTuNhan(env, maCS, ip, asOrg, dsMaNV) {
  if (!ip || !maCS) return;
  // Kiểm có IP chưa (so khớp ipKhop qua pattern đã lưu)
  const ds = await wifiDs(env);
  const daCo = ds.some(w => ipKhop(ip, w.IP) && up(w.MaCS) === up(maCS));
  if (!daCo) {
    await env.DB.prepare(
      "INSERT OR IGNORE INTO WifiQuan(IP, MaCS, GhiChu, Ngay, Boi, TrangThai) VALUES(?1, ?2, ?3, ?4, 'Hệ thống', 'Dùng')"
    ).bind(ip, up(maCS), 'Tự nhận ' + dsMaNV.length + ' NV trong 2h' + (asOrg ? ' (' + String(asOrg).slice(0, 60) + ')' : ''), fmtDate(new Date())).run();
  }
  // Xử lý queue: cập nhật WifiCho Cho → Da; xoá CB "IP chờ xác nhận" trong ChamCong row liên quan
  const rs = await env.DB.prepare(
    "SELECT ID, CCID FROM WifiCho WHERE MaCS = ?1 AND IP = ?2 AND TrangThai = 'Cho'"
  ).bind(up(maCS), ip).all();
  const now = fmtDT(new Date()), by = 'Hệ thống – tự nhận ' + dsMaNV.length + ' NV';
  for (const r of (rs.results || [])) {
    await env.DB.prepare("UPDATE WifiCho SET TrangThai='Da', XuLyBoi=?1, LucXong=?2 WHERE ID=?3").bind(by, now, r.ID).run();
    if (r.CCID) await wifiXoaCB(env, r.CCID);
  }
  // Nhật ký
  await env.DB.prepare(
    "INSERT INTO NhatKySua(Boi, Bang, Khoa, Cot, Cu, Moi, LyDo) VALUES('Hệ thống', 'WifiQuan', ?1, 'TrangThai', '', 'Dùng', 'Tự nhận ' || ?2 || ' NV cùng chấm trong 2h')"
  ).bind(ip + '|' + up(maCS), String(dsMaNV.length)).run();
}
export async function wifiXoaCB(env, ccid) {
  const r = await env.DB.prepare("SELECT CanhBao FROM ChamCong WHERE ID = ?1").bind(ccid).first();
  if (!r) return;
  const cb = String(r.CanhBao || '').split(';').map(s => s.trim())
    .filter(s => s && !/^IP chờ xác nhận/i.test(s)).join('; ');
  await env.DB.prepare("UPDATE ChamCong SET CanhBao = ?1, Updated = ?2 WHERE ID = ?3")
    .bind(cb, fmtDT(new Date()), ccid).run();
}
export async function wifiQueueCho(env, maCS, maNV, ten, ip, asOrg, ccid, anh, loai) {
  const id = 'W' + idMoi(new Date(), maNV);
  await env.DB.prepare(
    "INSERT INTO WifiCho(ID, Luc, MaCS, MaNV, Ten, IP, AsOrg, CCID, Loai, TrangThai, Anh) VALUES(?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, 'Cho', ?10)"
  ).bind(id, fmtDT(new Date()), up(maCS), up(maNV), ten, ip, asOrg || '', String(ccid || ''), String(loai || ''), String(anh || '')).run();
  return id;
}
/**
 * Trả null nếu được chấm (pass through), hoặc {choIP, ip, asOrg, mobile, msg} khi chế độ Bắt buộc + IP lạ.
 * KHÔNG dùng GPS (nhân viên không thấy kiểm vị trí) – chỉ dùng ASN mobile để quyết tự nhận.
 */
export async function wifiChan(env, cs, nv, loai, p) {
  const ip = String((p && p.ip) || '');
  const asOrg = String((p && p.asOrg) || '');
  const w = await wifiKiem(env, cs.MaCS, ip);
  if (!w.bat || w.ok) return null;
  if (String(await cfg(env, 'WIFI_CHO_XAC_NHAN') || 'Không') !== 'Có') {
    // Fallback: chế độ Bắt buộc cũ – chặn
    return { ok: false, msg: 'Hãy kết nối Wi-Fi của quán rồi chấm lại' };
  }
  const mobile = wifiLaMobile(asOrg);
  if (ip && !mobile) {
    const khac = await wifiDemNVKhacCho(env, cs.MaCS, ip, nv.MaNV, 2 * 3600 * 1000);
    if (khac.length >= 1) {
      await wifiThemTuNhan(env, cs.MaCS, ip, asOrg, [String(nv.MaNV)].concat(khac));
      const w2 = await wifiKiem(env, cs.MaCS, ip);
      if (w2.ok) return null;
    }
  }
  return { choIP: true, ip, asOrg, mobile, loai, msg: 'Đã ghi nhận, đang chờ xác nhận mạng quán' };
}

/* ============ 7. Cảnh báo chấm (port canhBao trong Code.gs) ============
 * Trả { cb, lat, lng, kc } – chuỗi cảnh báo ngăn cách '; ', toạ độ và khoảng cách để lưu row.
 * Áp luật B: KHÔNG so lịch, chỉ nhãn vị trí (nếu quán đã lưu toạ độ) + điện thoại mới. */
export function khoangCach(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = x => x * Math.PI / 180;
  const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(a)));
}
export async function canhBao(env, cs, maNV, p) {
  const out = { cb: '', lat: '', lng: '', kc: '' };
  const parts = [];
  // Vị trí quán
  if (p && p.lat != null && p.lat !== '' && isFinite(+p.lat)) {
    out.lat = +p.lat; out.lng = +p.lng;
    if (cs.ViDo != null && cs.ViDo !== '') {
      const kc = khoangCach(+p.lat, +p.lng, +cs.ViDo, +cs.KinhDo);
      out.kc = kc;
      const bk = (+cs.BanKinh || +(await cfg(env, 'QR_BAN_KINH')) || 100);
      if (kc > bk + Math.min(+p.acc || 0, 150)) parts.push('Cách quán ' + kc + 'm');
    } else parts.push('Quán chưa lưu vị trí');
  }
  // Điện thoại mới (deviceId chưa có trong ThietBi)
  if (p && p.deviceId) {
    const dv = String(p.deviceId).slice(0, 40);
    const r = await env.DB.prepare("SELECT 1 FROM ThietBi WHERE MaNV = ?1 AND Dev = ?2 LIMIT 1").bind(up(maNV), dv).first();
    if (!r) parts.push('Điện thoại mới');
  }
  out.cb = parts.join('; ');
  return out;
}

/* ============ 8. Lưu ảnh R2 ============ */
export async function luuAnhR2(env, dataUrl, keyPath) {
  if (!dataUrl || !env.ANH) return '';
  const m = String(dataUrl).match(/^data:(image\/[a-z]+);base64,(.+)$/);
  if (!m) return '';
  const bin = Uint8Array.from(atob(m[2]), c => c.charCodeAt(0));
  await env.ANH.put(keyPath, bin, { httpMetadata: { contentType: m[1] } });
  return keyPath;
}
