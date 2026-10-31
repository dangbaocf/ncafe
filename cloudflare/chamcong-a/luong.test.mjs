/**
 * Test đơn vị luong.js (skeleton). Chạy: node cloudflare/chamcong-a/luong.test.mjs
 */
import { luongGioNV, tinhComNgay, trangThaiRow, treThongKe, tinhNhanh, vtLuong, nghin, nghinTien, so } from './luong.js';
import { cfgTat } from './d1.js';

function mkDB(caiDat) {
  const t = { CaiDat: Object.entries(caiDat).map(([k, v]) => ({ Key: k, Value: String(v) })) };
  return {
    _tables: t,
    prepare(sql) {
      return {
        _sql: sql.trim(), _args: [], bind(...a) { this._args = a; return this; },
        async all() {
          if (this._sql.replace(/\s+/g, ' ') === 'SELECT Key, Value FROM CaiDat') return { results: t.CaiDat };
          throw new Error('MOCK không hiểu: ' + this._sql);
        },
        async first() { const rs = await this.all(); return rs.results[0] || null; },
        async run() { return { success: true }; }
      };
    }
  };
}
function mkEnv(cfg) { const env = { DB: mkDB(cfg || {}) }; cfgTat(env); return env; }

let pass = 0, fail = 0;
async function T(name, fn) {
  try { const r = await fn(); if (r === true) { pass++; console.log('✔ ' + name); }
    else { fail++; console.log('✘ ' + name + ' — ' + r); } }
  catch (e) { fail++; console.log('✘ ' + name + ' — ' + e.message); }
}

await T('so + nghin + nghinTien parse đúng dấu "," và 1000', async () => {
  if (so('25,5') !== 25.5) return 'so sai';
  if (nghin('25000') !== 25) return 'nghin 25000 → 25';
  if (nghin('25') !== 25) return 'nghin 25 → 25';
  if (nghinTien('7800000') !== 7800) return 'nghinTien 7.8M → 7800';
  return true;
});

await T('vtLuong map ViTri + ChucVu đúng', async () => {
  if (vtLuong({ ViTri: 'Pha chế' }) !== 'Pha chế') return 'Pha chế sai';
  if (vtLuong({ ChucVu: 'Quản lý', ViTri: 'Pha chế' }) !== 'Quản lý') return 'Quản lý ưu tiên';
  if (vtLuong({}) !== 'Phục vụ') return 'default Phục vụ';
  return true;
});

await T('luongGioNV ưu tiên LuongGio NV; fallback cfg LUONG_<ViTri>', async () => {
  const env = mkEnv({ 'LUONG_Pha chế': '30', 'LUONG_Phục vụ': '25' });
  const g1 = await luongGioNV(env, { MaNV: '1', ViTri: 'Pha chế' });
  if (g1 !== 30) return 'Pha chế = 30, got ' + g1;
  const g2 = await luongGioNV(env, { MaNV: '2', ViTri: 'Pha chế', LuongGio: '35000' });
  if (g2 !== 35) return 'LuongGio NV override = 35, got ' + g2;
  const g3 = await luongGioNV(env, { MaNV: '3', ViTri: 'Lạ hoắc' });
  if (g3 !== 25) return 'fallback Phục vụ = 25, got ' + g3;
  return true;
});

await T('tinhComNgay: ≥ ngưỡng vị trí → có 1 suất; dưới → không', async () => {
  const env = mkEnv({ 'COM_TU_Pha chế': '8', 'COM_GIA_Pha chế': '20' });
  const r1 = await tinhComNgay(env, 7.5, { ViTri: 'Pha chế' });
  const r2 = await tinhComNgay(env, 8, { ViTri: 'Pha chế' });
  if (r1.coCom) return '7.5h không có cơm';
  if (!r2.coCom || r2.mucNghin !== 20) return '8h phải có cơm 20k';
  return true;
});

await T('trangThaiRow: Đang làm ngày cũ → "Quên chấm ra"', async () => {
  if (trangThaiRow({ TrangThai: 'Đang làm', Ngay: '2026-10-15' }, '2026-11-01') !== 'Quên chấm ra') return 'sai';
  if (trangThaiRow({ TrangThai: 'Đang làm', Ngay: '2026-11-01' }, '2026-11-01') !== 'Đang làm') return 'hôm nay giữ';
  if (trangThaiRow({ TrangThai: 'Đã xác nhận' }, '2026-11-01') !== 'Đã xác nhận') return 'duyệt giữ';
  return true;
});

await T('treThongKe: ≤10p = nhắc; >10p = trễ; >30 = xemLai; "xin phép" = phep', async () => {
  const env = mkEnv({ NHAC_NHO_PHUT: '10', TRE_XEM_LAI_PHUT: '30' });
  const cc = [
    { TreMin: 0, TrangThai: 'Đã xác nhận' },
    { TreMin: 5, TrangThai: 'Đã xác nhận' },
    { TreMin: 15, TrangThai: 'Đã xác nhận' },
    { TreMin: 35, TrangThai: 'Đã xác nhận' },
    { TreMin: 20, TrangThai: 'Chờ xác nhận', LyDo: 'xin phép bận' }
  ];
  const r = await treThongKe(env, cc);
  if (r.lan10 !== 1) return 'lan10 (≤10) = 1, got ' + r.lan10;
  if (r.lan !== 3) return 'lan (>10) = 3, got ' + r.lan;
  if (r.xemLai !== 1) return 'xemLai (>30) = 1, got ' + r.xemLai;
  if (r.phep !== 1) return 'phep = 1, got ' + r.phep;
  return true;
});

await T('tinhNhanh T10 1 NV với 3 ca Đã xác nhận + 1 Chờ', async () => {
  const env = mkEnv({ 'LUONG_Pha chế': '30', 'COM_TU_Pha chế': '8', 'COM_GIA_Pha chế': '20' });
  const nv = { MaNV: '101', Ten: 'Thanh', ViTri: 'Pha chế' };
  const cc = [
    { MaNV: '101', Ngay: '2026-10-15', GioTinh: 8, TrangThai: 'Đã xác nhận' },
    { MaNV: '101', Ngay: '2026-10-16', GioTinh: 8, TrangThai: 'Đã xác nhận' },
    { MaNV: '101', Ngay: '2026-10-17', GioTinh: 7.5, TrangThai: 'Đã xác nhận' },   // < 8h không cơm
    { MaNV: '101', Ngay: '2026-10-18', GioTinh: 8, TrangThai: 'Chờ xác nhận' }      // không vào gio
  ];
  const r = await tinhNhanh(env, nv, cc, '2026-10');
  if (r.gio !== 23.5) return 'gio = 23.5, got ' + r.gio;
  if (r.soCa !== 4) return 'soCa = 4';
  if (r.choXN !== 1) return 'choXN = 1';
  if (r.luongGio !== 30) return 'luongGio = 30';
  if (r.tienCom !== 40) return 'tienCom = 40 (2 ngày × 20k), got ' + r.tienCom;
  if (r.tienLuong !== 705) return 'tienLuong = 23.5 × 30 = 705, got ' + r.tienLuong;
  return true;
});

console.log('\nKẾT QUẢ luong.test: ' + pass + ' đạt, ' + fail + ' lỗi');
if (fail > 0) process.exit(1);
