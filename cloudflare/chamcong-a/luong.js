/**
 * Ncafe Đợt A – skeleton tính lương song song trên Cloudflare.
 *
 * **GHI CHÚ QUAN TRỌNG (31/10 00:00)**:
 * Port đầy đủ `tinhNguoi + bangLuong + 20 hàm phụ` (~2000 dòng Luong.gs + Code.gs)
 * KHÔNG xong trong 1 đêm. File này chứa SKELETON các hàm cốt lõi để BẮT ĐẦU port:
 *   1. `luongGioNV(nv, cfg)`: đơn giá / giờ cho 1 NV
 *   2. `tinhComNgay(gioDuyet, viTri, cfg)`: 1 suất cơm / ngày khi tổng giờ duyệt ≥ ngưỡng vị trí
 *   3. `treThongKe(cc, cfg)`: thống kê trễ (lan, phut10, phep, xemLai)
 *   4. `trangThaiRow(r)`: Chờ xác nhận / Đã xác nhận / Đang làm / Quên chấm ra
 *
 * CHƯA port: `tinhNguoi` (phức tạp – ngày lễ, lương cố định FT, lương khoảng, hệ số theo
 * ngày, tăng ca duyệt, giảm ca, giờ đêm, nghỉ có lương, tạm ứng, mục cộng/trừ). Admin
 * tiếp tục dùng `bangLuong` Apps Script trên Google Sheet (NGUỒN THẬT T10).
 *
 * Em sẽ port tiếp sau 3/11 (sau kỳ lương). Mỗi hàm port xong → test so khớp
 * với Apps Script trên 10 NV mẫu T10 → thêm test suite.
 */

import { cfg } from './d1.js';

export function so(x) { return +String(x == null ? '' : x).replace(',', '.') || 0; }

/** Chuyển 25000 → 25, 25 → 25 (hiểu "25 nghìn") */
export function nghin(v) { const x = so(v); return x >= 1000 ? x / 1000 : x; }

/** Chuyển 7800000 → 7800, 7800 → 7800 */
export function nghinTien(v) { const x = so(v); return x >= 100000 ? x / 1000 : x; }

/** vtLuong (từ Luong.gs line ~71): chuẩn hoá vị trí/chức vụ về key cfg LUONG_<...> */
export function vtLuong(n) {
  if (!n) return 'Phục vụ';
  if (n.ChucVu === 'Quản lý' || n.ViTri === 'Quản lý') return 'Quản lý';
  const v = String(n.ViTri || '').trim();
  if (!v) return 'Phục vụ';
  return v;
}

/** luongGio(nv) – Port từ Luong.gs line 169.
 *  Ưu tiên LuongGio của chính NV; không có → cfg LUONG_<ViTri>, fallback LUONG_Phục vụ. */
export async function luongGioNV(env, nv) {
  const v = nghin(nv.LuongGio);
  if (v > 0) return v;
  const key = 'LUONG_' + vtLuong(nv);
  const direct = await cfg(env, key);
  if (direct) return nghin(direct);
  const pv = await cfg(env, 'LUONG_Phục vụ');
  return nghin(pv) || 0;
}

/** Cơm 1 suất / ngày khi tổng giờ đã-duyệt ≥ COM_TU_<ViTri> (mặc định 8h).
 *  Trả { coCom, mucNghin, ly }. */
export async function tinhComNgay(env, gioDaDuyet, nv) {
  const vt = vtLuong(nv);
  const ngTu = +(await cfg(env, 'COM_TU_' + vt)) || 8;
  const comGia = nghin(await cfg(env, 'COM_GIA_' + vt)) || 20;
  const coCom = gioDaDuyet >= ngTu;
  return { coCom, mucNghin: coCom ? comGia : 0, nguong: ngTu, ly: coCom ? ('đủ ' + ngTu + 'h đã duyệt') : '' };
}

/** trangThaiRow – đơn giản hoá từ Code.gs. */
export function trangThaiRow(r, hom) {
  const tt = String(r.TrangThai || '');
  if (tt === 'Đã xác nhận' || tt === 'Đã xong' || tt === 'Chờ xác nhận' || tt === 'Quên chấm ra') return tt;
  if (tt === 'Đang làm') {
    // Nếu ngày < hôm nay và vẫn Đang làm → Quên chấm ra
    if (hom && String(r.Ngay) < hom) return 'Quên chấm ra';
    return 'Đang làm';
  }
  return tt;
}

/** treThongKe – từ XacNhan.gs / Code.gs treThongKe_. */
export async function treThongKe(env, cc) {
  const nn = +(await cfg(env, 'NHAC_NHO_PHUT')) || 10;
  const xemLaiP = +(await cfg(env, 'TRE_XEM_LAI_PHUT')) || 30;
  let lan = 0, lan10 = 0, phut10 = 0, phutTong = 0, phep = 0, xemLai = 0;
  for (const r of cc) {
    const t = +r.TreMin || 0;
    const duyet = ['Đã xác nhận', 'Đã xong'].includes(String(r.TrangThai));
    if (t <= 0) continue;
    phutTong += t;
    if (t <= nn) { lan10++; phut10 += t; }
    else { lan++; }
    if (t > xemLaiP) xemLai++;
    const ghi = String(r.LyDo || '') + ' ' + String(r.CanhBao || '');
    if (/xin phép|đã xin phép/i.test(ghi)) phep++;
    void duyet; // placeholder
  }
  return { lan, lan10, phut10, phutTong, phep, xemLai };
}

/** TÍNH NHANH 1 NV theo tháng (SKELETON – chưa cover full tinhNguoi).
 *  Trả { gio, com, luong, luongGio, soCa, soNgay, choXN, quen } cho **so sánh baseline** với Apps Script bangLuong. */
export async function tinhNhanh(env, nv, cc, thang) {
  const hom = thang + '-32';   // mock "cuối tháng" để trangThaiRow coi Đang làm = Quên
  let gio = 0, soCa = 0, choXN = 0, quen = 0;
  const ngayMap = {}, gioNgay = {};
  for (const r of cc) {
    const d = String(r.Ngay || '').slice(0, 10);
    if (!d.startsWith(thang + '-')) continue;
    soCa++;
    const tt = trangThaiRow(r, hom);
    if (tt === 'Chờ xác nhận') choXN++;
    if (tt === 'Quên chấm ra') { quen++; continue; }
    if (tt !== 'Đã xác nhận' && tt !== 'Đã xong') continue;
    const g = +r.GioTinh || 0;
    gio += g;
    ngayMap[d] = true;
    gioNgay[d] = (gioNgay[d] || 0) + g;
  }
  // Tiền cơm
  let tienCom = 0;
  for (const d of Object.keys(gioNgay)) {
    const c = await tinhComNgay(env, gioNgay[d], nv);
    if (c.coCom) tienCom += c.mucNghin;
  }
  const luongGio = await luongGioNV(env, nv);
  return {
    MaNV: String(nv.MaNV), Ten: nv.Ten, ViTri: vtLuong(nv),
    gio: Math.round(gio * 100) / 100, soCa, soNgay: Object.keys(ngayMap).length,
    choXN, quen, luongGio, tienCom, tienLuong: Math.round(gio * luongGio * 100) / 100
  };
}
