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

/** Chuẩn hoá TrangThai: xoá BOM/ZWSP/REPLACEMENT và chuẩn hoá chữ Đ bị corrupted.
 *  Lý do: Sheet đôi khi có cell chứa "��ã xác nhận" (0xFFFD×2 thay cho Đ) do copy-paste
 *  từ external source. AS strict compare cũng miss, nhưng dùng `ngay[d]+=g` chạy luôn
 *  trong Luong.gs → gio AS include. D1 phải match để cùng kết quả. */
export function normTT(s) {
  let t = String(s || '').replace(/[\uFEFF\u200B\u200C\u200D]+/g, '');
  // "??ã xác nhận" → "Đã xác nhận" (recover từ corrupt char)
  if (/^\uFFFD+ã /.test(t)) t = 'Đ' + t.replace(/^\uFFFD+/, '');
  if (/^\uFFFD+ang /.test(t)) t = 'Đ' + t.replace(/^\uFFFD+/, '');
  return t.trim();
}

/** trangThaiRow – đơn giản hoá từ Code.gs + normalize. */
export function trangThaiRow(r, hom) {
  const tt = normTT(r.TrangThai);
  if (tt === 'Đã xác nhận' || tt === 'Đã xong' || tt === 'Chờ xác nhận' || tt === 'Quên chấm ra') return tt;
  if (tt === 'Đang làm') {
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
  const dong = [];   // (port AS: dong push BẤT KỂ duyet; non-FT tienLuong tính Σ x.g×muc – gồm cả Chờ xác nhận)
  for (const r of cc) {
    const d = String(r.Ngay || '').slice(0, 10);
    if (!d.startsWith(thang + '-')) continue;
    soCa++;
    const tt = trangThaiRow(r, hom);
    if (tt === 'Chờ xác nhận') choXN++;
    if (tt === 'Quên chấm ra') { quen++; continue; }
    if (tt === 'Đang làm') continue;
    const g = +r.GioTinh || 0;
    const caG = caGio(r);
    const thieu = g < caG ? caG - g : 0;
    const duyet = (tt === 'Đã xác nhận' || tt === 'Đã xong');
    const tc = (duyet && g > caG) ? g - caG : 0;
    gioThieu += thieu;
    dong.push({ d, g, tc, thieu, duyet });
    if (!duyet) continue;
    gio += g; gioTC += tc;
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

  // Tiền lương chính – port đúng AS tinhNguoi:
  //   FT (codinh): sum theo ngày × mức/ngàyChuan × (1+ hs lễ) – trừ thiếu × mức/ngàyChuan/gioChuan + tc × hệ số
  //   Non-FT: sum theo dong (TẤT CẢ ca, kể cả Chờ xác nhận) × mức ngày + tc × mức × (hs-1) + lễ × mức × (hs-1)
  //   NOTE: AS code cộng tienLuong CHO CẢ Chờ xác nhận. Mâu thuẫn CLAUDE.md L1 ("ca chưa duyệt KHÔNG tính").
  //   Em port đúng AS code hiện tại để match 100%. Cần anh Bảo quyết: đây là bug hay intended?
  const suaMuc = codinh ? (nh.lcb !== undefined && nh.lcb !== '') : (nh.luong !== undefined && nh.luong !== '');
  const _le = (muc && muc.le) || {};   // chưa dùng – placeholder ngày lễ
  const nhapLcb = suaMuc && codinh ? so(nh.lcb) : lcbNV;
  const nhapLuongGio = suaMuc && !codinh ? so(nh.luong) : luongGio;
  const mucDay = (_d) => suaMuc ? (codinh ? nhapLcb : nhapLuongGio) : (codinh ? lcbNV : luongGio);
  const luongNgay = codinh ? (nhapLcb / ngayChuan) : 0;
  const luongGioQD = codinh ? (luongNgay / gioChuan) : nhapLuongGio;
  let tienLuong = 0;
  if (codinh) {
    const soNgayLam = Math.round((soNgay - gioThieu / gioChuan) * 100) / 100;
    let t = 0;
    const ngaySet = Object.keys(gioNgay);
    ngaySet.forEach(d => { t += mucDay(d) / ngayChuan * (1 + (_le[d] ? _le[d] - 1 : 0)); });
    dong.forEach(x => { const q = mucDay(x.d) / ngayChuan / gioChuan; t += -x.thieu * q + x.tc * q * hsTC; });
    tienLuong = t;
    void soNgayLam;
  } else {
    if (nh.gio !== undefined && nh.gio !== '') {
      const g2 = so(nh.gio); const l = suaMuc ? so(nh.luong) : luongGio;
      tienLuong = g2 * l + gioTC * l * (hsTC - 1);
    } else {
      // Non-FT theo giờ: dong.forEach GỒM Chờ xác nhận (port AS)
      let t2 = 0;
      dong.forEach(x => {
        const m = mucDay(x.d);
        t2 += x.g * m + x.tc * m * (hsTC - 1) + (_le[x.d] ? x.g * (_le[x.d] - 1) * m : 0);
      });
      tienLuong = t2;
    }
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
