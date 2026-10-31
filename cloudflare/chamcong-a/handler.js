/**
 * Route handler cho đợt A – ES module, dự định import vào worker chính `ncafe-chamcong`.
 * Khi worker chính chưa gắn D1/R2 binding, route này KHÔNG hoạt động → 503.
 *
 * Path:
 *   POST /cham-cong-d1/qr/info        → qrInfo
 *   POST /cham-cong-d1/qr/mo          → qrMo (QR info + wifi check + NV info)
 *   POST /cham-cong-d1/qr/nhan-vien   → qrNhanVien
 *   POST /cham-cong-d1/qr/vao         → qrVao (ghi D1, lưu ảnh R2)
 *   POST /cham-cong-d1/qr/ra          → qrRa (update D1, lưu ảnh R2)
 *
 *   POST /cham-cong-d1/cai-dat/doc        → caiDatDoc (admin)
 *   POST /cham-cong-d1/cai-dat/ghi        → caiDatGhi (admin, upsert nhiều khoá)
 *   POST /cham-cong-d1/cai-dat/wifi/ds    → wifiQuanDs
 *   POST /cham-cong-d1/cai-dat/wifi/luu   → wifiQuanLuu (thêm / sửa 1 IP)
 *   POST /cham-cong-d1/cai-dat/wifi/bo    → wifiQuanBo (đánh dấu 'Bỏ')
 *   POST /cham-cong-d1/cai-dat/cho/ds     → wifiChoDs (hàng chờ xác nhận IP)
 *   POST /cham-cong-d1/cai-dat/cho/xu-ly  → wifiChoXuLy ({id, hanh:'da'|'tuchoi'})
 *   POST /cham-cong-d1/cai-dat/nhat-ky    → nhatKyDs
 */

import {
  qrInfo, qrMo, qrNhanVien, qrVao, qrRa
} from './d1.js';
import {
  caiDatDoc, caiDatGhi,
  wifiQuanDs, wifiQuanLuu, wifiQuanBo,
  wifiChoDs, wifiChoXuLy,
  nhatKyDs
} from './caidat.js';

const ROUTES = {
  '/cham-cong-d1/qr/info':         ['qrInfo',       false],
  '/cham-cong-d1/qr/mo':           ['qrMo',         true],
  '/cham-cong-d1/qr/nhan-vien':    ['qrNhanVien',   false],
  '/cham-cong-d1/qr/vao':          ['qrVao',        true],
  '/cham-cong-d1/qr/ra':           ['qrRa',         true],

  '/cham-cong-d1/cai-dat/doc':       ['caiDatDoc',   false],
  '/cham-cong-d1/cai-dat/ghi':       ['caiDatGhi',   false],
  '/cham-cong-d1/cai-dat/wifi/ds':   ['wifiQuanDs',  false],
  '/cham-cong-d1/cai-dat/wifi/luu':  ['wifiQuanLuu', false],
  '/cham-cong-d1/cai-dat/wifi/bo':   ['wifiQuanBo',  false],
  '/cham-cong-d1/cai-dat/cho/ds':    ['wifiChoDs',   false],
  '/cham-cong-d1/cai-dat/cho/xu-ly': ['wifiChoXuLy', false],
  '/cham-cong-d1/cai-dat/nhat-ky':   ['nhatKyDs',    false]
};
const HANDLERS = {
  qrInfo, qrMo, qrNhanVien, qrVao, qrRa,
  caiDatDoc, caiDatGhi,
  wifiQuanDs, wifiQuanLuu, wifiQuanBo,
  wifiChoDs, wifiChoXuLy,
  nhatKyDs
};

function json(o, status) {
  return new Response(JSON.stringify(o), {
    status: status || 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store'
    }
  });
}

/**
 * Gọi từ worker chính trong `fetch(request, env, ctx)`.
 * Trả Response nếu path khớp đợt A, null nếu không khớp (caller tiếp tục xử lý route khác).
 */
export async function handleChamCongD1(request, env, ctx) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '');
  const route = ROUTES[path];
  if (!route) return null;

  if (request.method !== 'POST')
    return json({ ok: false, msg: 'Chỉ nhận POST' }, 405);
  if (!env.DB)
    return json({ ok: false, msg: 'Worker chưa gắn D1 binding (ĐỢT A chưa sẵn sàng)' }, 503);
  // R2 (env.ANH) không bắt buộc – luuAnhR2 tự fallback trả '' nếu thiếu.

  let body;
  try { body = await request.json(); }
  catch (e) { return json({ ok: false, msg: 'Dữ liệu gửi lên không hợp lệ' }, 400); }

  const [fnName, needsRequest] = route;
  const fn = HANDLERS[fnName];
  if (!fn) return json({ ok: false, msg: 'Hàm chưa khai: ' + fnName }, 500);

  try {
    // ctx truyền vào qrVao/qrRa để waitUntil backfill Sheet (31/10 đợt A). Hàm khác bỏ qua ctx.
    const result = needsRequest
      ? await fn(env, request, body, ctx)
      : await fn(env, body);
    return json(result);
  } catch (e) {
    console.log('[chamcong-d1] ' + fnName + ' lỗi:', e.message, e.stack);
    return json({ ok: false, msg: 'Lỗi máy chủ: ' + e.message }, 500);
  }
}
