/**
 * BỘ TÍNH THAM CHIẾU ĐỘC LẬP (independent reference).
 * Viết lại từ LUẬT trong `CLAUDE.md` mục 4–7 (ca làm, chấm công, phân quyền, lương).
 * KHÔNG đọc / copy code đang chạy (Luong.gs, luong.js).
 *
 * Mục tiêu: so khớp 3 bên:
 *   1. AS Luong.gs (`exportBangLuongT10`) – production hiện tại
 *   2. D1 luong.js (`tinhNhanh`) – lương chạy ngầm Cloudflare
 *   3. Bộ này (`tinhThamChieu`) – luật thuần
 *
 * Khi 3 bên khớp → logic đúng. Lệch → NÊU case luật chưa rõ hoặc code đang sai.
 */

/* ===== Hằng số theo CLAUDE.md ===== */
// Mục 4 Ca làm:
//   FT 6:30–14:30, 14:30–22:30
//   PT 6:30–12:00, 12:00–17:00, 17:00–22:30
//   LDD/ĐĐ/TP: về muộn tới 23:00 nếu dọn trễ
//   BV không có ca tối; BV ngày 6:30–17:00
export const CA_CHUAN = {
  FT1: { bd: '06:30', kt: '14:30' },
  FT2: { bd: '14:30', kt: '22:30' },
  PT1: { bd: '06:30', kt: '12:00' },
  PT2: { bd: '12:00', kt: '17:00' },
  PT3: { bd: '17:00', kt: '22:30' },
  BV1: { bd: '06:30', kt: '17:00' }
};

/* ===== Helpers thuần ===== */
export function toMin(hm) {
  const m = /^(\d{1,2}):(\d{1,2})$/.exec(String(hm || ''));
  return m ? +m[1] * 60 + +m[2] : 0;
}
export function parseVnd(x) {
  // "25,5" → 25.5; "25000" → 25000
  return +String(x == null ? '0' : x).replace(',', '.') || 0;
}
export function nghin(x) { const n = parseVnd(x); return n >= 1000 ? n / 1000 : n; }
export function nghinTien(x) { const n = parseVnd(x); return n >= 100000 ? n / 1000 : n; }

/* ===== CLAUDE.md mục 5 – Trễ ===== */
// "Đúng giờ: thường đến trước ~10 phút. Trễ ≤10 phút = nhắc nhở; >10 phút = 'trễ'."
// NHAC_NHO_PHUT (mặc định 10) từ cài đặt.
export function phanLoaiTre(treMin, nhacNho) {
  const n = +nhacNho || 10;
  if (treMin <= 0) return 'dungGio';
  if (treMin <= n) return 'nhacNho';
  return 'tre';
}

/* ===== CLAUDE.md mục 5 – Giờ tính lương ===== */
// "MỌI ca đều cần QL duyệt. Giờ được tính = giờ QL duyệt/sửa (không phải giờ chấm thô).
//  Tăng ca chỉ tính khi QL xác nhận."
// Áp dụng:
//   row.TrangThai='Đã xác nhận' hoặc 'Đã xong' → cộng GioTinh vào tổng giờ.
//   Khác → KHÔNG cộng.
export function duyet(r) {
  const t = String(r.TrangThai || '').replace(/[\uFFFD\uFEFF]/g, '').trim();
  return t === 'Đã xác nhận' || t === 'Đã xong' ||
         /ã xác nhận$/.test(t) || /ã xong$/.test(t);   // chịu được corrupt FFFD
}

/* ===== CLAUDE.md mục 7 – Lương ===== */
// "Công thức: giờ × đơn giá + tiền cơm + giờ nghỉ có lương + phụ cấp + thưởng − tạm ứng − trừ lỗi."
// Theo giờ: lương = giờ(đã duyệt) × đơn giá
// Cố định: (giờ đã duyệt / giờ chuẩn ngày) × (lương cơ bản / ngày chuẩn)
// Tiền cơm (CLAUDE.md): 1 bữa/ngày khi tổng giờ ≥ 7.5h (ngưỡng chỉnh được theo vị trí).
//
// LƯU Ý: CLAUDE.md KHÔNG nói rõ "cộng tiền lương cho ca Chờ xác nhận" – luật rõ ràng là
// KHÔNG cộng (mục 5). Nhưng code AS Luong.gs cộng (bug cũ?). Tham chiếu TUÂN LUẬT:
// chỉ cộng ca đã duyệt vào tiền lương chính.

export function tinhCom(gioDuyetNgay, viTri, cfg) {
  const ngTu = parseVnd(cfg['COM_TU_' + viTri] || cfg['COM_TU_' + viTri.replace(/\s/g, '')]) || 8;
  const mucNghin = nghin(cfg['COM_GIA_' + viTri] || cfg['COM_GIA_' + viTri.replace(/\s/g, '')]) || 20;
  return gioDuyetNgay >= ngTu ? mucNghin : 0;
}

export function tinhThamChieu(nv, cc, thang, cfg, nhap, ung) {
  nhap = nhap || {}; ung = ung || {};
  const ma = String(nv.MaNV).toUpperCase();
  const nh = nhap[ma] || {};
  const codinh = String(nv.KieuLuong || '') === 'Cố định';
  const vt = String(nv.ViTri || 'Phục vụ');
  const luongGio = nghin(nv.LuongGio) || nghin(cfg['LUONG_' + vt]) || nghin(cfg['LUONG_Phục vụ']) || 0;
  const lcb = nghinTien(nv.LuongCoBan);
  const ngayChuan = +nv.NgayChuan || +cfg.NGAY_CHUAN || 26;
  const gioChuan = +nv.GioChuanNgay || +cfg.GIO_CHUAN_NGAY || 8;
  const hsTC = +cfg.HE_SO_TANG_CA || 1;

  let gio = 0, gioTC = 0, soCa = 0;
  const gioNgay = {}, ngayCo = {};
  for (const r of cc) {
    const d = String(r.Ngay || '').slice(0, 10);
    if (!d.startsWith(thang + '-')) continue;
    soCa++;
    if (!duyet(r)) continue;   // CLAUDE.md luật L1: chỉ cộng khi duyệt
    const g = parseVnd(r.GioTinh);
    const caG = (toMin(r.CaKT) - toMin(r.CaBD)) / 60;
    gio += g;
    if (g > caG) gioTC += g - caG;
    gioNgay[d] = (gioNgay[d] || 0) + g;
    ngayCo[d] = true;
  }

  // Tiền cơm theo ngày (chỉ ngày có tổng giờ duyệt ≥ ngưỡng)
  let tienCom = 0;
  for (const d of Object.keys(gioNgay)) tienCom += tinhCom(gioNgay[d], vt, cfg);

  // Nhap sửa override
  const sua = {};
  const pick = (k, def) => {
    if (nh[k] !== undefined && nh[k] !== '') { sua[k] = 1; return parseVnd(nh[k]); }
    return def;
  };
  const gioFinal = pick('gio', gio);
  const luongFinal = pick('luong', luongGio);
  const lcbFinal = pick('lcb', lcb);
  const comFinal = pick('com', tienCom);
  const nghi = pick('nghi', 0);
  const pc = pick('pc', 0);
  const thuong = pick('thuong', 0);
  const tru = pick('tru', 0);
  const thuongThem = pick('thuongThem', 0);

  // Lương chính (theo luật thuần – KHÔNG cộng Chờ xác nhận)
  let tienLuong;
  if (codinh) {
    const soNgayLam = Object.keys(ngayCo).length;
    tienLuong = soNgayLam * (lcbFinal / ngayChuan) + gioTC * (lcbFinal / ngayChuan / gioChuan) * hsTC;
  } else {
    tienLuong = gioFinal * luongFinal + gioTC * luongFinal * (hsTC - 1);
  }

  const luongGioQD = codinh ? (lcbFinal / ngayChuan / gioChuan) : luongFinal;
  const tienNghi = nghi * luongGioQD;
  const ungNV = ung[ma] || 0;

  const tn = tienLuong + comFinal + tienNghi + pc + thuong;
  const con = tn - ungNV - tru;
  const thuc = con + thuongThem;

  return {
    MaNV: String(nv.MaNV), Ten: nv.Ten, ViTri: vt, codinh,
    gio: Math.round(gio * 100) / 100,
    gioTC: Math.round(gioTC * 100) / 100,
    soCa, soNgay: Object.keys(ngayCo).length,
    luongGio: luongFinal, lcb: lcbFinal,
    tienCom: Math.round(comFinal * 10) / 10,
    tienLuong: Math.round(tienLuong * 10) / 10,
    tn: Math.round(tn * 10) / 10,
    thuc: Math.round(thuc * 10) / 10,
    sua
  };
}
