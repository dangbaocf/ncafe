/**
 * Ncafe Đợt A – module Cài đặt D1 cho worker ncafe-chamcong.
 *
 * CaiDat (bảng Key/Value) + WifiQuan + WifiCho + NhatKySua.
 * CoSo / Ca / NhanVien để commit kế tiếp (có bảng chuyên, UI riêng).
 *
 * PIN: env.ADMIN_PIN (toàn quyền), env.QL_PIN (chỉ "Quán mất mạng" + đổi PIN bản thân).
 * Mã bí mật (QR_SECRET, TG_TOKEN, FEED_SECRET, API_KEY, TG_WEBHOOK_SECRET) KHÔNG lưu CaiDat,
 * dùng wrangler secret put. UI chỉ nút "ĐỔI" (sẽ làm commit sau).
 */

import { cfg, cfgTat, fmtDT, up, ipChuan } from './d1.js';

/* ============ 1. Nhóm cài đặt (hiện thị trên UI) ============ */
export const NHOM = [
  ['bimat',   'Mã bí mật',           'admin'],
  ['wifi',    'Wi-Fi',               'admin'],
  ['nguong',  'Ngưỡng trễ / chấm',   'admin'],
  ['com',     'Cơm',                 'admin'],
  ['luong',   'Lương',               'admin'],
  ['tg',      'Telegram',            'admin'],
  ['bt',      'Bảng tin',            'admin'],
  ['luutru',  'Lưu trữ / ảnh',       'admin'],
  ['xeplich', 'Xếp lịch (chỉ xem)',  'admin'],
  ['khac',    'Khác',                'admin']
];

/* ============ 2. Mặc định 70+ khoá – xem bang-cai-dat.md =============
 * mỗi phần tử: { nhom, nhan, giaTri, kieu, help?, ds?, chi? }
 *   kieu: 'text' | 'int' | 'real' | 'time' | 'bool' | 'enum' | 'secret' | 'ro'
 *   bool: Có / Không. enum: ds=[...]. secret: UI nút ĐỔI, không hiện giá trị.
 *   ro (read-only): UI chỉ xem, không sửa (áp dụng luật B).
 */
export const DEFAULTS = {
  // --- Mã bí mật (secret ở wrangler, UI nút ĐỔI riêng) ---
  'ADMIN_PIN':  { nhom:'bimat', nhan:'Mã admin',          giaTri:'',    kieu:'secret', help:'Đổi mã admin đăng nhập web' },
  'QL_PIN':     { nhom:'bimat', nhan:'Mã quản lý',        giaTri:'',    kieu:'secret', help:'Đổi mã quản lý đăng nhập web' },
  'QR_SECRET':  { nhom:'bimat', nhan:'Mã QR',             giaTri:'',    kieu:'secret', help:'ĐỔI sẽ làm QR 5 quầy hỏng, phải in lại' },
  'TG_TOKEN':   { nhom:'bimat', nhan:'Mã bot Telegram',   giaTri:'',    kieu:'secret' },
  'FEED_SECRET':{ nhom:'bimat', nhan:'Mã bảng tin',       giaTri:'',    kieu:'secret' },
  'API_KEY':    { nhom:'bimat', nhan:'Khoá API nội bộ',   giaTri:'',    kieu:'secret' },
  'TG_WEBHOOK_SECRET': { nhom:'bimat', nhan:'Khoá webhook Telegram', giaTri:'', kieu:'secret' },

  // --- Wi-Fi ---
  'WIFI_CHE_DO':            { nhom:'wifi', nhan:'Chế độ Wi-Fi', giaTri:'Cảnh báo', kieu:'enum', ds:['Tắt','Cảnh báo','Bắt buộc'] },
  'WIFI_CHO_XAC_NHAN':      { nhom:'wifi', nhan:'Tự nhận IP khi Bắt buộc', giaTri:'Không', kieu:'bool' },
  'WIFI_CHO_XAC_NHAN_NV':   { nhom:'wifi', nhan:'Tự nhận khi ≥ N nhân viên khác', giaTri:'2', kieu:'int' },
  'WIFI_CHO_XAC_NHAN_GIO':  { nhom:'wifi', nhan:'Trong N giờ gần nhất', giaTri:'2', kieu:'int' },
  'WIFI_TU_THEM':           { nhom:'wifi', nhan:'Tự thêm IP khi 2 NV + GPS (legacy)', giaTri:'Có', kieu:'bool' },
  'WIFI_TU_MAT_MANG':       { nhom:'wifi', nhan:'Tự nhận quán mất mạng', giaTri:'Có', kieu:'bool' },
  'WIFI_MOBILE_REGEX':      { nhom:'wifi', nhan:'Từ khoá nhận mạng di động (regex)', giaTri:'mobile|cellular|wireless|viettel\\s*mobile|mobifone|vinaphone|vietnamobile|reddi|itel|gmobile', kieu:'text' },
  'QR_BAN_KINH':            { nhom:'wifi', nhan:'Bán kính QR (m)', giaTri:'100', kieu:'int' },

  // --- Ngưỡng ---
  'NHAC_NHO_PHUT':       { nhom:'nguong', nhan:'Trễ ≤ N phút chỉ nhắc',  giaTri:'10', kieu:'int' },
  'TRE_PHUT':            { nhom:'nguong', nhan:'Trễ > N cần duyệt',      giaTri:'10', kieu:'int' },
  'TRU_GIO_TRE_PHUT':    { nhom:'nguong', nhan:'Trễ > N thì trừ giờ',    giaTri:'15', kieu:'int' },
  'TRE_XEM_LAI_PHUT':    { nhom:'nguong', nhan:'Trễ cao bất thường (phút)', giaTri:'30', kieu:'int' },
  'VE_SOM_PHUT':         { nhom:'nguong', nhan:'Về sớm (phút)',          giaTri:'10', kieu:'int' },
  'RA_MUON_PHUT':        { nhom:'nguong', nhan:'Ra muộn (phút)',         giaTri:'30', kieu:'int' },
  'LECH_PHUT':           { nhom:'nguong', nhan:'Chấm lệch ca (phút)',    giaTri:'30', kieu:'int' },
  'LAM_TRON_PHUT':       { nhom:'nguong', nhan:'Làm tròn giờ (phút)',    giaTri:'15', kieu:'int' },
  'TANG_CA_TU_PHUT':     { nhom:'nguong', nhan:'Tăng ca từ N phút',      giaTri:'30', kieu:'int' },
  'GIO_DEM_TU':          { nhom:'nguong', nhan:'Giờ đêm từ',             giaTri:'22:00', kieu:'time' },
  'GIO_BAT_THUONG_NGAY': { nhom:'nguong', nhan:'Ca dài bất thường (giờ/ngày)',  giaTri:'12',  kieu:'int' },
  'GIO_BAT_THUONG_THANG':{ nhom:'nguong', nhan:'Giờ bất thường / tháng',       giaTri:'300', kieu:'int' },
  // Ngưỡng kiểm tra tự động (anh Bảo bổ sung 31/10) – dùng cho đợt D (kiểm sáng/tối)
  'LECH_DUYET_PHUT':     { nhom:'nguong', nhan:'Lệch giờ duyệt so với giờ quét (phút)', giaTri:'30', kieu:'int', help:'Giờ duyệt chênh giờ quét quá N phút thì cảnh báo' },
  'CHO_DUYET_NGAY':      { nhom:'nguong', nhan:'Ca "Chờ xác nhận" quá N ngày',  giaTri:'3',  kieu:'int', help:'Nhắc QL duyệt sớm' },
  'VANG_SO_NGAY':        { nhom:'nguong', nhan:'Cảnh báo nghỉ việc khi vắng > N ngày', giaTri:'10', kieu:'int', help:'Admin bấm xác nhận mới đổi "Nghỉ việc" (đợt 2 mục 2)' },

  // --- Cơm (các khoá COM_TU_<ViTri>, COM_GIA_<ViTri> hiển thị động theo vị trí) ---
  'COM_FT_LUON':   { nhom:'com', nhan:'FT luôn có cơm',            giaTri:'Không', kieu:'bool' },
  'COM_NGAY_GAY':  { nhom:'com', nhan:'Ngày ca gãy có cơm',        giaTri:'Có',    kieu:'bool' },
  // Theo vị trí – mặc định ngưỡng 8 giờ, mức 20 nghìn.
  'COM_TU_PC':   { nhom:'com', nhan:'Pha chế – ngưỡng cơm (giờ)',    giaTri:'8', kieu:'real' },
  'COM_TU_PV':   { nhom:'com', nhan:'Phục vụ – ngưỡng cơm (giờ)',    giaTri:'8', kieu:'real' },
  'COM_TU_BV':   { nhom:'com', nhan:'Bảo vệ – ngưỡng cơm (giờ)',     giaTri:'8', kieu:'real' },
  'COM_TU_RL':   { nhom:'com', nhan:'Rửa ly – ngưỡng cơm (giờ)',     giaTri:'8', kieu:'real' },
  'COM_TU_QL':   { nhom:'com', nhan:'Quản lý – ngưỡng cơm (giờ)',    giaTri:'8', kieu:'real' },
  'COM_GIA_PC':  { nhom:'com', nhan:'Pha chế – mức cơm (nghìn)',     giaTri:'20', kieu:'int' },
  'COM_GIA_PV':  { nhom:'com', nhan:'Phục vụ – mức cơm (nghìn)',     giaTri:'20', kieu:'int' },
  'COM_GIA_BV':  { nhom:'com', nhan:'Bảo vệ – mức cơm (nghìn)',      giaTri:'20', kieu:'int' },
  'COM_GIA_RL':  { nhom:'com', nhan:'Rửa ly – mức cơm (nghìn)',      giaTri:'20', kieu:'int' },
  'COM_GIA_QL':  { nhom:'com', nhan:'Quản lý – mức cơm (nghìn)',     giaTri:'20', kieu:'int' },

  // --- Lương (theo vị trí) ---
  'LUONG_PC': { nhom:'luong', nhan:'Pha chế – đơn giá (nghìn/giờ)',  giaTri:'30', kieu:'real' },
  'LUONG_PV': { nhom:'luong', nhan:'Phục vụ – đơn giá (nghìn/giờ)',  giaTri:'25', kieu:'real' },
  'LUONG_BV': { nhom:'luong', nhan:'Bảo vệ – đơn giá (nghìn/giờ)',   giaTri:'22', kieu:'real' },
  'LUONG_RL': { nhom:'luong', nhan:'Rửa ly – đơn giá (nghìn/giờ)',   giaTri:'23', kieu:'real' },
  'LUONG_QL': { nhom:'luong', nhan:'Quản lý – đơn giá (nghìn/giờ)',  giaTri:'22', kieu:'real' },
  'GIO_CHUAN_NGAY': { nhom:'luong', nhan:'Giờ chuẩn / ngày',        giaTri:'8',  kieu:'int' },
  'NGAY_CHUAN':     { nhom:'luong', nhan:'Ngày chuẩn / tháng',      giaTri:'26', kieu:'int' },
  'HE_SO_TANG_CA':  { nhom:'luong', nhan:'Hệ số tăng ca',           giaTri:'1',  kieu:'real' },
  'KY_TANG_LUONG_THANG':{ nhom:'luong', nhan:'Chu kỳ xét tăng (tháng)', giaTri:'6', kieu:'int' },
  'NGAY_TRA_LUONG': { nhom:'luong', nhan:'Ngày trả lương',          giaTri:'3',  kieu:'int' },
  'DOT_1_DEN':      { nhom:'luong', nhan:'Ngày cuối đợt 1',         giaTri:'10', kieu:'int' },
  'DOT_2_DEN':      { nhom:'luong', nhan:'Ngày cuối đợt 2',         giaTri:'20', kieu:'int' },
  'PHAN_HOI_NGAY':  { nhom:'luong', nhan:'NV phản hồi trong N ngày', giaTri:'3', kieu:'int' },
  'DE_XUAT_GIO':    { nhom:'luong', nhan:'Đề xuất giờ theo',         giaTri:'nv', kieu:'enum', ds:['nv','cham'], help:'nv = NV khai; cham = giờ chấm thực tế' },
  'TU_DUYET_KHOP':  { nhom:'luong', nhan:'Tự duyệt khớp lịch (luật B – luôn Không)', giaTri:'Không', kieu:'ro' },

  // --- Telegram ---
  'TG_CHAT':       { nhom:'tg', nhan:'Nhóm chung',             giaTri:'', kieu:'text' },
  'TG_CHAT_TP':    { nhom:'tg', nhan:'Nhóm Trần Phú',          giaTri:'', kieu:'text' },
  'TG_CHAT_DD':    { nhom:'tg', nhan:'Nhóm Đống Đa',           giaTri:'', kieu:'text' },
  'TG_CHAT_TD':    { nhom:'tg', nhan:'Nhóm Tản Đà',            giaTri:'', kieu:'text' },
  'TG_CHAT_TNV':   { nhom:'tg', nhan:'Nhóm Trưng Nữ Vương',    giaTri:'', kieu:'text' },
  'TG_CHAT_LDD':   { nhom:'tg', nhan:'Nhóm Lê Đình Dương',     giaTri:'', kieu:'text' },
  'TG_ADMIN_IDS':  { nhom:'tg', nhan:'Admin user ID (CSV)',    giaTri:'', kieu:'text' },
  'TG_ANH':        { nhom:'tg', nhan:'Gửi kèm ảnh chấm',       giaTri:'Có', kieu:'bool' },
  'TG_MUC':        { nhom:'tg', nhan:'Mức báo',                giaTri:'tatca', kieu:'enum', ds:['tatca','chuy','tat'] },
  'TG_NHAC_CA':    { nhom:'tg', nhan:'Nhắc quên chấm ra',      giaTri:'Có', kieu:'bool' },
  'TG_NHAC_SAU_PHUT':{ nhom:'tg', nhan:'Nhắc N phút sau khi hết ca', giaTri:'60', kieu:'int' },
  'TG_TONGKET':    { nhom:'tg', nhan:'Tổng kết cuối ngày',     giaTri:'Không', kieu:'bool' },
  'TG_TONGKET_GIO':{ nhom:'tg', nhan:'Giờ tổng kết',           giaTri:'23', kieu:'int' },
  'NHAC_DUYET':    { nhom:'tg', nhan:'Nhắc QL duyệt',          giaTri:'Có', kieu:'bool' },
  'NHAC_DUYET_GIO':{ nhom:'tg', nhan:'Giờ nhắc duyệt',         giaTri:'22', kieu:'int' },
  'KIEM_SANG_GIO': { nhom:'tg', nhan:'Giờ kiểm sáng (đợt D)',  giaTri:'6',  kieu:'int' },
  'KIEM_TOI_GIO':  { nhom:'tg', nhan:'Giờ kiểm tối (đợt D)',   giaTri:'23', kieu:'int' },

  // --- Bảng tin ---
  'BANGTIN_URL':             { nhom:'bt', nhan:'URL bảng tin', giaTri:'https://ncafe-bangtin.dangbao-mt.workers.dev', kieu:'text' },
  'BANGTIN_KEY':             { nhom:'bt', nhan:'Khoá bảng tin (= FEED_SECRET)', giaTri:'', kieu:'secret' },
  // Ngày đặc biệt + sinh nhật quán (anh Bảo bổ sung 31/10). Lưu JSON vì mỗi mục có cấu trúc.
  'BANGTIN_NGAY_DAC_BIET':   { nhom:'bt', nhan:'Ngày đặc biệt (JSON [{ngay, ten, lap:"nam"}])', giaTri:'[]', kieu:'json', help:'VD: [{"ngay":"20-10","ten":"Phụ nữ Việt Nam","lap":"nam"}] – ngay dạng MM-DD lặp hàng năm hoặc YYYY-MM-DD 1 lần' },
  'BANGTIN_SN_QUAN':         { nhom:'bt', nhan:'Sinh nhật quán (JSON {MaCS: YYYY-MM-DD})',         giaTri:'{}', kieu:'json', help:'VD: {"TP":"2010-05-20","DD":"2015-11-01"}' },

  // --- Lưu trữ ---
  'DRIVE_FOLDER_ID':     { nhom:'luutru', nhan:'Folder Drive ảnh',                       giaTri:'', kieu:'text' },
  'LUU_TRU_SAU_NGAY':    { nhom:'luutru', nhan:'Tự lưu trữ tháng đã chốt sau N ngày',   giaTri:'10', kieu:'int' },
  'LUU_TRU_FOLDER_ID':   { nhom:'luutru', nhan:'Folder Drive lưu trữ',                   giaTri:'', kieu:'text' },
  'SAO_LUU_FOLDER_ID':   { nhom:'luutru', nhan:'Folder Drive sao lưu Sheet',             giaTri:'', kieu:'text' },
  'ANH_GIU_NGAY':        { nhom:'luutru', nhan:'Giữ ảnh N ngày (R2 lifecycle)',          giaTri:'90', kieu:'int' },

  // --- Xếp lịch (áp luật B – chỉ để xem) ---
  'DOC_LICH':      { nhom:'xeplich', nhan:'Đọc lịch (luật B – luôn Không)', giaTri:'Không', kieu:'ro' },
  'LICH_SHEET_ID': { nhom:'xeplich', nhan:'Sheet ID lịch', giaTri:'', kieu:'text' },
  'XEP_LICH_URL':  { nhom:'xeplich', nhan:'URL app Xếp lịch', giaTri:'', kieu:'text' },

  // --- Khác ---
  'CF_URL':             { nhom:'khac', nhan:'URL Cloudflare NV', giaTri:'https://ncafe-chamcong.dangbao-mt.workers.dev', kieu:'text' },
  'CF_CHAM_CONG_BAT':   { nhom:'khac', nhan:'🔥 CÔNG TẮC: Chấm công qua Cloudflare', giaTri:'Có', kieu:'bool', help:'Bật → QR.html gọi /cham-cong-d1/qr/*. Tắt KHẨN CẤP → dùng đường cũ (Apps Script). Mặc định BẬT sau 1/11.' },
  'PHIEN_GIO':          { nhom:'khac', nhan:'Giữ đăng nhập (giờ)',           giaTri:'12', kieu:'int',  help:'Trang quản lý tự nhớ đăng nhập trong N giờ (localStorage). Mặc định 12. Admin đổi tại đây.' },
  'TRA_CUU_MAX_NGAY':   { nhom:'khac', nhan:'Tra cứu: tối đa N ngày', giaTri:'93', kieu:'int' },
  'TRA_CUU_CHIA_TRANG': { nhom:'khac', nhan:'Tra cứu: chia trang / N dòng', giaTri:'100', kieu:'int' },
  'RECONCILE_GIO':      { nhom:'khac', nhan:'Giờ reconcile CF↔Sheet đêm', giaTri:'02:00', kieu:'time' }
};

/* ============ 3. PIN check ============ */
export async function kiemPin(env, pin, canChiAdmin) {
  const admin = String(env.ADMIN_PIN || '');
  const ql    = String(env.QL_PIN || '');
  const p     = String(pin || '');
  if (!p) return { ok: false, role: '' };
  if (admin && p === admin) return { ok: true, role: 'admin' };
  if (!canChiAdmin && ql && p === ql) return { ok: true, role: 'ql' };
  return { ok: false, role: '' };
}

/** Lấy tag người gọi để ghi NhatKy (không lộ PIN). */
export function nguoiGoi(role, pin) {
  return role + ':' + String(pin || '').slice(0, 2) + '**';
}

/* ============ 4. Nhật ký ghi ============ */
export async function ghiNhatKy(env, by, bang, khoa, cot, cu, moi, lyDo) {
  await env.DB.prepare(
    "INSERT INTO NhatKySua(Luc, Boi, Bang, Khoa, Cot, Cu, Moi, LyDo) VALUES(?1,?2,?3,?4,?5,?6,?7,?8)"
  ).bind(
    fmtDT(new Date()), String(by || ''), String(bang || ''), String(khoa || ''),
    String(cot || ''), String(cu == null ? '' : cu), String(moi == null ? '' : moi),
    String(lyDo || '')
  ).run();
}

/* ============ 5. CaiDat đọc / ghi ============ */
export async function caiDatDoc(env, p) {
  const r = await kiemPin(env, p.pin, true);
  if (!r.ok) return { ok: false, msg: 'Sai mã admin' };

  const rs = await env.DB.prepare('SELECT Key, Value, Updated, UpdatedBy FROM CaiDat').all();
  const daLuu = {};
  (rs.results || []).forEach(x => { daLuu[x.Key] = x; });

  // Nhóm thành { nhom: [ {Key, Value, macDinh, daSua, nhan, kieu, ...} ] }
  const keys = {};
  for (const g of NHOM) keys[g[0]] = [];
  for (const [key, def] of Object.entries(DEFAULTS)) {
    const d = daLuu[key];
    const isSecret = def.kieu === 'secret';
    const giaTriHienThi = isSecret
      ? (env[key] ? '••••••' : '')      // secret: che giá trị, chỉ cho biết có cài hay chưa
      : (d ? String(d.Value) : def.giaTri);
    keys[def.nhom].push({
      Key: key,
      Value: giaTriHienThi,
      macDinh: isSecret ? '' : def.giaTri,
      daSua: !!d,
      daCai: isSecret ? !!env[key] : !!d,
      nhan: def.nhan,
      kieu: def.kieu,
      ds: def.ds || null,
      help: def.help || '',
      Updated: d ? d.Updated : '',
      UpdatedBy: d ? d.UpdatedBy : ''
    });
  }
  return { ok: true, nhom: NHOM, keys };
}

export async function caiDatGhi(env, p) {
  const r = await kiemPin(env, p.pin, true);
  if (!r.ok) return { ok: false, msg: 'Sai mã admin' };
  if (!p.kv || typeof p.kv !== 'object') return { ok: false, msg: 'Thiếu dữ liệu kv' };

  const now = fmtDT(new Date());
  const by  = nguoiGoi(r.role, p.pin);
  let doi = 0;
  const loi = [];

  for (const [key, val] of Object.entries(p.kv)) {
    const def = DEFAULTS[key];
    if (!def) { loi.push('Không biết khoá: ' + key); continue; }
    if (def.kieu === 'secret') { loi.push('Khoá bí mật: ' + key + ' (dùng wrangler secret put)'); continue; }
    if (def.kieu === 'ro')     { loi.push('Khoá chỉ đọc: ' + key); continue; }

    // Validate theo kiểu
    const v = String(val == null ? '' : val).trim();
    if (def.kieu === 'int' && v !== '' && !/^-?\d+$/.test(v))      { loi.push(key + ': cần số nguyên'); continue; }
    if (def.kieu === 'real' && v !== '' && !/^-?\d+(\.\d+)?$/.test(v)) { loi.push(key + ': cần số thập phân (dấu .)'); continue; }
    if (def.kieu === 'time' && v !== '') {
      const mt = /^(\d{1,2}):(\d{2})$/.exec(v);
      if (!mt || +mt[1] > 23 || +mt[2] > 59) { loi.push(key + ': cần giờ dạng HH:mm (0-23:0-59)'); continue; }
    }
    if (def.kieu === 'bool' && v !== '' && !['Có','Không'].includes(v)) { loi.push(key + ': cần "Có" hoặc "Không"'); continue; }
    if (def.kieu === 'enum' && v !== '' && !def.ds.includes(v))    { loi.push(key + ': ngoài danh sách'); continue; }
    if (def.kieu === 'json' && v !== '') {
      try { JSON.parse(v); } catch (e) { loi.push(key + ': JSON không hợp lệ (' + e.message + ')'); continue; }
    }

    const old = await env.DB.prepare('SELECT Value FROM CaiDat WHERE Key = ?1').bind(key).first();
    const oldV = old ? String(old.Value) : '';
    if (oldV === v) continue;

    await env.DB.prepare(
      "INSERT INTO CaiDat(Key, Value, Updated, UpdatedBy) VALUES(?1, ?2, ?3, ?4) " +
      "ON CONFLICT(Key) DO UPDATE SET Value=excluded.Value, Updated=excluded.Updated, UpdatedBy=excluded.UpdatedBy"
    ).bind(key, v, now, by).run();
    await ghiNhatKy(env, by, 'CaiDat', key, 'Value', oldV, v, p.lyDo || '');
    doi++;
  }

  await cfgTat(env);
  return { ok: doi > 0 || loi.length === 0, doi, loi };
}

/* ============ 6. WifiQuan CRUD ============ */
export async function wifiQuanDs(env, p) {
  const r = await kiemPin(env, p.pin, true);
  if (!r.ok) return { ok: false, msg: 'Sai mã admin' };
  const rs = await env.DB.prepare('SELECT IP, MaCS, GhiChu, Ngay, Boi, TrangThai FROM WifiQuan ORDER BY MaCS, IP').all();
  return { ok: true, ds: rs.results || [] };
}

export async function wifiQuanLuu(env, p) {
  const r = await kiemPin(env, p.pin, true);
  if (!r.ok) return { ok: false, msg: 'Sai mã admin' };
  const ip = ipChuan(p.ip), maCS = up(p.maCS);
  if (!ip || !maCS) return { ok: false, msg: 'Thiếu IP hoặc mã quán' };

  const by = nguoiGoi(r.role, p.pin);
  const old = await env.DB.prepare('SELECT TrangThai, GhiChu FROM WifiQuan WHERE IP = ?1 AND MaCS = ?2').bind(ip, maCS).first();
  const now = fmtDT(new Date());

  if (old) {
    const tt = String(p.trangThai || old.TrangThai || 'Dùng');
    await env.DB.prepare('UPDATE WifiQuan SET TrangThai = ?1, GhiChu = ?2 WHERE IP = ?3 AND MaCS = ?4')
      .bind(tt, String(p.ghiChu || old.GhiChu || ''), ip, maCS).run();
    await ghiNhatKy(env, by, 'WifiQuan', ip + '|' + maCS, 'TrangThai', String(old.TrangThai || ''), tt, p.lyDo || '');
  } else {
    await env.DB.prepare(
      "INSERT INTO WifiQuan(IP, MaCS, GhiChu, Ngay, Boi, TrangThai) VALUES(?1,?2,?3,?4,?5,?6)"
    ).bind(ip, maCS, String(p.ghiChu || ''), now.slice(0, 10), by, String(p.trangThai || 'Dùng')).run();
    await ghiNhatKy(env, by, 'WifiQuan', ip + '|' + maCS, 'TrangThai', '', String(p.trangThai || 'Dùng'), p.lyDo || 'Thêm thủ công');
  }
  await cfgTat(env);
  return { ok: true };
}

export async function wifiQuanBo(env, p) {
  const r = await kiemPin(env, p.pin, true);
  if (!r.ok) return { ok: false, msg: 'Sai mã admin' };
  const ip = ipChuan(p.ip), maCS = up(p.maCS);
  if (!ip || !maCS) return { ok: false, msg: 'Thiếu IP hoặc mã quán' };
  const by = nguoiGoi(r.role, p.pin);
  await env.DB.prepare("UPDATE WifiQuan SET TrangThai = 'Bỏ' WHERE IP = ?1 AND MaCS = ?2").bind(ip, maCS).run();
  await ghiNhatKy(env, by, 'WifiQuan', ip + '|' + maCS, 'TrangThai', 'Dùng', 'Bỏ', p.lyDo || '');
  await cfgTat(env);
  return { ok: true };
}

/* ============ 7. WifiCho (hàng đợi xác nhận IP) ============ */
export async function wifiChoDs(env, p) {
  const r = await kiemPin(env, p.pin, true);
  if (!r.ok) return { ok: false, msg: 'Sai mã admin' };
  const rs = await env.DB.prepare(
    "SELECT ID, Luc, MaCS, MaNV, Ten, IP, AsOrg, CCID, Loai, TrangThai, XuLyBoi, LucXong " +
    "FROM WifiCho WHERE TrangThai='Cho' ORDER BY Luc DESC"
  ).all();
  return { ok: true, ds: rs.results || [] };
}

export async function wifiChoXuLy(env, p) {
  const r = await kiemPin(env, p.pin, true);
  if (!r.ok) return { ok: false, msg: 'Sai mã admin' };
  if (!p.id) return { ok: false, msg: 'Thiếu ID' };
  const act = p.hanh === 'da' ? 'Da' : (p.hanh === 'tuchoi' ? 'TuChoi' : '');
  if (!act) return { ok: false, msg: 'Hành động phải là "da" hoặc "tuchoi"' };

  const row = await env.DB.prepare('SELECT MaCS, IP, CCID FROM WifiCho WHERE ID = ?1').bind(String(p.id)).first();
  if (!row) return { ok: false, msg: 'Không tìm thấy' };
  const by  = nguoiGoi(r.role, p.pin);
  const now = fmtDT(new Date());

  await env.DB.prepare('UPDATE WifiCho SET TrangThai = ?1, XuLyBoi = ?2, LucXong = ?3 WHERE ID = ?4')
    .bind(act, by, now, String(p.id)).run();

  if (act === 'Da') {
    // Thêm IP vào WifiQuan nếu chưa
    const daCo = await env.DB.prepare('SELECT 1 FROM WifiQuan WHERE IP = ?1 AND MaCS = ?2').bind(row.IP, row.MaCS).first();
    if (!daCo) {
      await env.DB.prepare(
        "INSERT INTO WifiQuan(IP, MaCS, GhiChu, Ngay, Boi, TrangThai) VALUES(?1,?2,?3,?4,?5,'Dùng')"
      ).bind(row.IP, row.MaCS, 'Admin xác nhận từ hàng chờ', now.slice(0, 10), by).run();
    }
    // Xoá cảnh báo "IP chờ xác nhận" trong row ChamCong liên quan
    if (row.CCID) {
      const cc = await env.DB.prepare('SELECT CanhBao FROM ChamCong WHERE ID = ?1').bind(row.CCID).first();
      if (cc) {
        const cb = String(cc.CanhBao || '').split(';').map(s => s.trim())
          .filter(s => s && !/^IP chờ xác nhận/i.test(s)).join('; ');
        await env.DB.prepare('UPDATE ChamCong SET CanhBao = ?1, Updated = ?2 WHERE ID = ?3').bind(cb, now, row.CCID).run();
      }
    }
    await ghiNhatKy(env, by, 'WifiCho', String(p.id), 'TrangThai', 'Cho', 'Da', p.lyDo || 'Admin xác nhận');
    await cfgTat(env);
  } else {
    await ghiNhatKy(env, by, 'WifiCho', String(p.id), 'TrangThai', 'Cho', 'TuChoi', p.lyDo || 'Admin từ chối');
  }

  return { ok: true };
}

/* ============ 8. Nhật ký ============ */
export async function nhatKyDs(env, p) {
  const r = await kiemPin(env, p.pin, true);
  if (!r.ok) return { ok: false, msg: 'Sai mã admin' };
  const lim = Math.min(Math.max(parseInt(p.gioiHan, 10) || 100, 1), 500);
  const bang = String(p.bang || '').trim();
  let q = 'SELECT ID, Luc, Boi, Bang, Khoa, Cot, Cu, Moi, LyDo FROM NhatKySua';
  const args = [];
  if (bang) { q += ' WHERE Bang = ?1'; args.push(bang); }
  q += ' ORDER BY ID DESC LIMIT ?' + (args.length + 1);
  args.push(lim);
  const rs = await env.DB.prepare(q).bind(...args).all();
  return { ok: true, ds: rs.results || [] };
}
