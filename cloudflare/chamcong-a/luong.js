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

/** Tính giờ ca gốc từ CaBD/CaKT (phút). */
function toMin(hm) { const m = /^(\d{1,2}):(\d{1,2})$/.exec(String(hm || '')); return m ? +m[1] * 60 + +m[2] : 0; }
function caGio(r) { return (toMin(r.CaKT) - toMin(r.CaBD)) / 60; }

/** TÍNH 1 NV theo tháng (ĐỦ phần lớn khoản).
 *  Port tăng ca duyệt (hsTC), FT cố định (LuongCoBan/NgayChuan trừ thiếu + cộng tăng), nhập
 *  cộng/trừ (nhap[maNV]), tạm ứng (ung[maNV]). CHƯA: ngày lễ hệ số (cần Sheet NgayLe),
 *  lương khoảng LuongKhoang, lịch sử lương lsLuong, giờ đêm (gioDemTu).
 *
 *  params:
 *    env, nv, cc (ChamCong rows), thang ('yyyy-MM'),
 *    nhap: {<maNV>: {gio?, luong?, com?, nghi?, pc?, thuong?, tru?, lcb?, thuongThem?, <mamuc>:val}}
 *    ung:  {<maNV>: tổng tạm ứng (nghìn)}
 *    muc:  {an: {...}, them: [{Ma,Ten,Loai}]}  (mục cộng/trừ danh mục)
 */
export async function tinhNhanh(env, nv, cc, thang, nhap, ung, muc) {
  nhap = nhap || {}; ung = ung || {}; muc = muc || { an: {}, them: [] };
  const ma = String(nv.MaNV || '').toUpperCase();
  const nh = nhap[ma] || {};
  const codinh = String(nv.KieuLuong || '') === 'Cố định';
  const gioChuan = (+nv.GioChuanNgay || +(await cfg(env, 'GIO_CHUAN_NGAY')) || 8);
  const ngayChuan = (+nv.NgayChuan || +(await cfg(env, 'NGAY_CHUAN')) || 26);
  const hsTC = +(await cfg(env, 'HE_SO_TANG_CA')) || 1;

  const hom = thang + '-32';
  let gio = 0, gioTC = 0, gioThieu = 0, soCa = 0, choXN = 0, quen = 0;
  const gioNgay = {}, ngayMap = {}, soNgayCo = {};
  for (const r of cc) {
    const d = String(r.Ngay || '').slice(0, 10);
    if (!d.startsWith(thang + '-')) continue;
    soCa++;
    const tt = trangThaiRow(r, hom);
    if (tt === 'Chờ xác nhận') choXN++;
    if (tt === 'Quên chấm ra') { quen++; continue; }
    if (tt !== 'Đã xác nhận' && tt !== 'Đã xong') continue;
    const g = +r.GioTinh || 0;
    const caG = caGio(r);
    const tc = g > caG ? g - caG : 0;
    const thieu = g < caG ? caG - g : 0;
    gio += g; gioTC += tc; gioThieu += thieu;
    gioNgay[d] = (gioNgay[d] || 0) + g;
    ngayMap[d] = true;
    soNgayCo[d] = true;
  }
  const soNgay = Object.keys(ngayMap).length;

  // Tiền cơm theo ngày
  let tienCom = 0;
  for (const d of Object.keys(gioNgay)) {
    const c = await tinhComNgay(env, gioNgay[d], nv);
    if (c.coCom) tienCom += c.mucNghin;
  }

  // Lương giờ (hoặc cố định)
  const luongGio = await luongGioNV(env, nv);
  const lcbNV = nghinTien(nv.LuongCoBan);
  const luongNgay = codinh ? (lcbNV / ngayChuan) : 0;
  const luongGioQD = codinh ? (luongNgay / gioChuan) : luongGio;

  // Tiền lương chính
  let tienLuong = 0;
  if (codinh) {
    // FT cố định: cộng theo ngày có công, trừ thiếu giờ, cộng tăng ca × hsTC
    const soNgayLam = Math.round((soNgay - gioThieu / gioChuan) * 100) / 100;
    tienLuong = soNgayLam * (lcbNV / ngayChuan) + gioTC * luongGioQD * hsTC;
  } else {
    // Giờ: cộng gio × luong + tăng ca × luong × (hsTC - 1)
    const g = (nh.gio !== undefined && nh.gio !== '') ? so(nh.gio) : gio;
    const l = (nh.luong !== undefined && nh.luong !== '') ? so(nh.luong) : luongGio;
    tienLuong = g * l + gioTC * l * (hsTC - 1);
  }

  // Mục cộng/trừ (nhap)
  const an = muc.an || {};
  const pick = (k, def) => (nh[k] !== undefined && nh[k] !== '') ? so(nh[k]) : def;
  const nghi = an.nghi ? 0 : pick('nghi', 0);
  const pc = an.pc ? 0 : pick('pc', 0);
  const thuong = an.thuong ? 0 : pick('thuong', 0);
  const tru = an.tru ? 0 : pick('tru', 0);
  const thuongThem = an.thuongThem ? 0 : pick('thuongThem', 0);
  const comNhap = an.com ? 0 : (nh.com !== undefined && nh.com !== '' ? so(nh.com) : tienCom);
  const ungNV = an.ung ? 0 : (ung[ma] || 0);

  let congThem = 0, truThem = 0;
  (muc.them || []).forEach(m => {
    const v = pick(m.Ma, 0);
    if (m.Loai === 'cong') congThem += v; else truThem += v;
  });

  // Nghỉ có lương: nghi × luongGioQD (chuyển giờ nghỉ sang tiền)
  const tienNghi = nghi * luongGioQD;

  const tongNhan = tienLuong + comNhap + tienNghi + pc + thuong + congThem;
  const con = tongNhan - ungNV - tru - truThem;
  const thuc = con + thuongThem;

  return {
    MaNV: String(nv.MaNV), Ten: nv.Ten, ViTri: vtLuong(nv),
    gio: Math.round(gio * 100) / 100,
    gioTC: Math.round(gioTC * 100) / 100,
    gioThieu: Math.round(gioThieu * 100) / 100,
    soCa, soNgay, choXN, quen,
    luongGio, luongGioQD: Math.round(luongGioQD * 100) / 100,
    luongNgay: Math.round(luongNgay * 100) / 100,
    lcb: lcbNV, codinh,
    tienCom: Math.round(comNhap * 10) / 10,
    tienLuong: Math.round(tienLuong * 10) / 10,
    nghi, pc, thuong, tru, thuongThem,
    ung: Math.round(ungNV * 10) / 10,
    congThem, truThem,
    tn: Math.round(tongNhan * 10) / 10,
    con: Math.round(con * 10) / 10,
    thuc: Math.round(thuc * 10) / 10
  };
}
