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
 */

import {
  qrInfo, qrMo, qrNhanVien, qrVao, qrRa
} from './d1.js';

const ROUTES = {
  '/cham-cong-d1/qr/info': ['qrInfo', false],
  '/cham-cong-d1/qr/mo': ['qrMo', true],
  '/cham-cong-d1/qr/nhan-vien': ['qrNhanVien', false],
  '/cham-cong-d1/qr/vao': ['qrVao', true],
  '/cham-cong-d1/qr/ra': ['qrRa', true]
};
const HANDLERS = { qrInfo, qrMo, qrNhanVien, qrVao, qrRa };

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
  if (!env.DB || !env.ANH)
    return json({ ok: false, msg: 'Worker chưa gắn D1/R2 binding (ĐỢT A chưa sẵn sàng)' }, 503);

  let body;
  try { body = await request.json(); }
  catch (e) { return json({ ok: false, msg: 'Dữ liệu gửi lên không hợp lệ' }, 400); }

  const [fnName, needsRequest] = route;
  const fn = HANDLERS[fnName];
  if (!fn) return json({ ok: false, msg: 'Hàm chưa khai: ' + fnName }, 500);

  try {
    const result = needsRequest
      ? await fn(env, request, body)
      : await fn(env, body);
    // ctx.waitUntil cho backfill Sheet (phase sau)
    return json(result);
  } catch (e) {
    console.log('[chamcong-d1] ' + fnName + ' lỗi:', e.message, e.stack);
    return json({ ok: false, msg: 'Lỗi máy chủ: ' + e.message }, 500);
  }
}
