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
