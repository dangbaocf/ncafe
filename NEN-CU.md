# NỀN CŨ – Bản đồ hệ thống Ncafe trước 31/10 (quét từng dòng code)

Nguồn: `cham-cong/Code.gs, LichNV.gs, Luong.gs, NhanSu.gs, XacNhan.gs` + `QR.html, QuanLy.html, LichCuaToi.html, GioCong.html, KhaoSat.html`.
Mục đích: mỗi thay đổi về sau phải GIỮ NGUYÊN các mục dưới đây, trừ chỗ anh Bảo đã quyết đổi.

---

## 1. TABLE SHEET (bản cũ) ↔ D1 (CF)

| # | Tên bảng Sheet | Dùng ở (file.gs) | Có trong D1 CF? | Khớp số dòng? |
|---|---|---|---|---|
| 1.1 | **CaiDat** | Code.gs L21-26 (CAI_DAT_MAC_DINH), rows('CaiDat') | ✅ `CaiDat(Key, Value, Updated, UpdatedBy)` | 80 AS vs 74 D1 (6 secret không lưu D1 – đúng) + 2 D1 only (CF_CHAM_CONG_BAT, KIEM_SDT4) |
| 1.2 | **CoSo** | Code.gs L33-34 NV_SEED | ✅ `CoSo(MaCS, TenCS, GioMo, GioDong, ViDo, KinhDo, BanKinh, QRVer)` | 5/5 |
| 1.3 | **Ca** | Code.gs L35-38 (11 ca) | ✅ `Ca(MaCa, TenCa, GioBD, GioKT, SoGio, CoSo)` | 11/11 (CC 01/11a chép) |
| 1.4 | **NhanVien** | Code.gs L28, apiHam qrNhanVien, etc. | ✅ `NhanVien(MaNV, Ten, ViTri, ChucVu, Loai, CoSoChinh, SDT, SdtCho, TrangThai, LuongGio, LuongCoBan, KieuLuong, NgayVao, NgaySinh)` | 70/70 (SDT 31/70 chép) |
| 1.5 | **ChamCong** | Code.gs L40 (27 cột), XacNhan.gs, Luong.gs | ✅ `ChamCong(ID, Ngay, MaNV, Ten, MaCS, MaCa, CaBD, CaKT, ViTri, Vao, Ra, TreMin, GioThuc, KhaiLoai, KhaiGio, KhaiTu, KhaiDen, KhaiGhiChu, CoMat, LyDo, TrangThai, GioTinh, XacNhanBoi, XacNhanLuc, Cach, GhiChu, CanhBao, AnhVao, AnhRa, ViDo, KinhDo, KhoangCach, ThietBi, IP, AsOrg, NguonNhap, Created, Updated, SyncedSheet, SyncedLuc)` | D1 chỉ record qua CF (dual-write Sheet) |
| 1.6 | **TaiKhoan** | Code.gs L41 | ❌ chưa trong D1 (admin đăng nhập dùng AS). Secret ADMIN_PIN/QL_PIN đã put wrangler. |
| 1.7 | **ThietBi** | Code.gs qrVao insert | ✅ `ThietBi(MaNV, Dev, Luc, KhoaDen)` – thêm cột KhoaDen cho sdt4 (CC 01/11a) |
| 1.8 | **WifiQuan** | Code.gs L216 | ✅ `WifiQuan(IP, MaCS, GhiChu, Ngay, Boi, TrangThai)` |
| 1.9 | **WifiCho** | Code.gs L249 | ✅ `WifiCho(ID, Luc, MaCS, MaNV, Ten, IP, AsOrg, CCID, Loai, TrangThai, XuLyBoi, LucXong, Anh, MsgID, ChatID)` |
| 1.10 | **WifiGanDay** | Code.gs (cache 2h) | ❌ chưa D1. CF dùng `WifiCho` + logic 2h trong `wifiDemNVKhacCho` |
| 1.11 | **NhatKySua** | Code.gs L22 ghiNhatKy | ✅ `NhatKySua(ID, Luc, Boi, Bang, Khoa, Cot, Cu, Moi, LyDo)` |
| 1.12 | **TelegramLog** | ❌ chưa có ở AS | ✅ `TelegramLog(ID, Luc, Loai, MaNV, MaCS, ChatID, GroupTen, LuotID, TinHieu, Ok, MessageID, LoiMsg, LanThu)` – CF ONLY (CC 01/11f, V1) |
| 1.13 | **BaoHong** | XacNhan.gs | ❌ chưa D1 (QL dùng AS fn `baoHongQL`) |
| 1.14 | **BaoQuen** | LichNV.gs, Luong.gs, XacNhan.gs | ❌ chưa D1 |
| 1.15 | **DangKyBan**, **DangKyXacNhan**, **NhanCa**, **RanhThem**, **XinPhep** | LichNV.gs (đăng ký lịch NV) | ❌ chưa D1 |
| 1.16 | **PhanHoi** | Luong.gs | ❌ chưa D1 |
| 1.17 | **ChotLuong**, **LuuTru**, **LuongKhoang**, **LichSuLuong**, **DuyetDot** | Luong.gs, XacNhan.gs | ❌ chưa D1 (lương + chốt sổ vẫn ở AS Sheet) |
| 1.18 | **SuKien**, **Vang**, **KhaoSat** | XacNhan.gs, NhanSu.gs | ❌ chưa D1 |

**Nhận xét**: D1 hiện có 11/18 bảng cốt lõi của chấm công (CaiDat, CoSo, Ca, NhanVien, ChamCong, WifiQuan, WifiCho, ThietBi, NhatKySua, TelegramLog mới). Phần lương + xin phép + đăng ký lịch + báo hỏng + khảo sát vẫn ở Sheet.

---

## 2. SPREADSHEET IDS (file khác active)

| # | Tên hằng số / Key | File.dòng | Giá trị | Dùng |
|---|---|---|---|---|
| 2.1 | `LICH_SHEET_ID` | CaiDat Sheet | `1u_WaOGqMjkhLxwaYqS9HqUZDHTH60cO7FtrRjEtuJrs` (TP/ĐĐ/TĐ) | LichNV.gs L17 `lichXepDoc` |
| 2.2 | `FILE_LICH_LDD` | CaiDat / FILE_LICH_MD | mã Sheet LĐD | XacNhan.gs L545 |
| 2.3 | `FILE_LICH_CFMH` | CaiDat / FILE_LICH_MD | mã Sheet CFMH | XacNhan.gs L545 |
| 2.4 | `FILE_BANG_LUONG` | CaiDat / fileId_() | mã Sheet bảng lương | XacNhan.gs L413 `luongTuBangLuong` |
| 2.5 | `SAO_LUU_FOLDER_ID` | CaiDat / tự sinh | Drive folder | Code.gs L349 `saoLuuSheetNgay` |
| 2.6 | `LUU_TRU_FOLDER_ID` | CaiDat / tự sinh | Drive folder | Luong.gs L307 `thuMucLuuTru` |
| 2.7 | `DRIVE_FOLDER_ID` | CaiDat / tự sinh | Drive folder (ảnh chấm) | Code.gs L573 `luuAnh` |

**Nền cũ dùng Drive để lưu ảnh**. CF D1 dự định dùng R2 (chưa bind, lỗi 10042).

---

## 3. UrlFetchApp (gọi ra ngoài)

| # | URL | File.dòng | Fn | Giá trị bí mật | Dùng ở CF? |
|---|---|---|---|---|---|
| 3.1 | `https://api.telegram.org/bot<TG_TOKEN>/sendMessage` | Code.gs L274, L835 | `tgGuiNut_`, `tgGui` | TG_TOKEN **** | ✅ CF `telegramGui` (CC 01/11f) |
| 3.2 | `https://api.telegram.org/bot<TG_TOKEN>/sendPhoto` | Code.gs L282, L842 | `tgGuiAnhNut_`, `tgGuiAnh` | TG_TOKEN **** | ✅ CF `telegramGui` sendPhoto (CC 01/11g) |
| 3.3 | `https://api.telegram.org/bot<TG_TOKEN>/<endpoint>` (generic) | Code.gs L289 | `tgEditTin_` | TG_TOKEN **** | ❌ chưa port CF |
| 3.4 | `https://api.telegram.org/bot<TG_TOKEN>/answerCallbackQuery` | Code.gs L293 | `tgAnswerCallback_` | TG_TOKEN **** | ❌ worker có `/tg/webhook` → forward AS |
| 3.5 | `https://api.telegram.org/bot<TG_TOKEN>/setWebhook` | Code.gs L520 | `tgSetWebhook` | TG_TOKEN **** | ❌ gọi 1 lần, không cần CF |
| 3.6 | `<BANGTIN_URL>/bangtin/api/hook` | Code.gs L605 | `btGui_` | FEED_SECRET **** | ❌ chưa port CF (CF chưa gửi bảng tin trực tiếp) |
| 3.7 | `https://api.telegram.org/bot<TG_TOKEN>/getUpdates` | Code.gs L893 | `tgLayNhom` | TG_TOKEN **** | ⚠️ CHỈ dùng khi admin lấy ID lần đầu – KHÔNG dùng khi webhook đang chạy (phá tgCallback) |

---

## 4. ScriptApp TRIGGER (bản cũ)

| # | Hàm | Lịch | Mục đích | CF có cron tương ứng? |
|---|---|---|---|---|
| 4.1 | `tuDongLuuTru` | 1 lần/ngày lúc 3:00 | Lưu trữ Sheet tháng cũ | ❌ CF chưa có |
| 4.2 | `tgMoi15Phut` | 15 phút/lần | Nhắc quên chấm ra + tổng kết cuối ngày | ❌ CF chưa có |

**Nền cũ còn trigger KHÁC** chưa đọc được từ grep (ví dụ `tgCallback` webhook – đã deploy manual). Anh Bảo cần chụp màn hình "Trình kích hoạt" trong Apps Script Editor:
- Mở script.google.com → mở project Chấm công Ncafe.
- Menu trái → ⏰ "Trình kích hoạt" (Triggers).
- Chụp danh sách tất cả trigger (tên hàm, cột "Kiểu sự kiện", "Nguồn", "Thời gian").
- Gửi em, em bổ sung bảng.

---

## 5. CacheService (bộ nhớ đệm)

| # | Key | Giá trị | TTL | File.dòng | CF có? |
|---|---|---|---|---|---|
| 5.1 | `LICH1_<LICH_SHEET_ID>_*` | Lịch tuần đã xếp (JSON) | `LICH_CACHE_GIAY` | Code.gs L543-546 | ❌ Luật B – CF không đọc lịch |
| 5.2 | `DV_<pin>` | Danh sách NV theo PIN (dsNhanVienGon) | mặc định | Code.gs L617 | ❌ CF chưa có, mỗi call pull mới |
| 5.3 | `WIFI_THU_<MaCS>` | Danh sách IP thử lạ 2h | 2h | Code.gs L937 | ✅ CF dùng `WifiCho` (D1) với query 2h |
| 5.4 | `WIFI_CHAN_<IP>_<ngay>` | Flag báo chặn 1 lần/ngày | 6h | Code.gs L979 | ❌ CF chưa có |
| 5.5 | `NVP_<token>` | Phiên NV đăng nhập (24h) | 24h | LichNV.gs L12 | ❌ CF chưa có phiên NV cho app NV |

---

## 6. LockService (chống đua)

| # | Fn dùng | Thời gian wait | Mục đích |
|---|---|---|---|
| 6.1 | `qrVao` (Code.gs L658) | tryLock(25000) | Chống 2 lượt chấm cùng lúc 1 NV |
| 6.2 | `qrRa` (Code.gs L685) | tryLock(25000) | Chống 2 lượt ra cùng lúc |
| 6.3 | `xinPhep`/khác (Code.gs L771) | waitLock(20000) | Chống đua ghi Sheet |

**CF**: D1 nhanh + idempotent theo ID → ít cần lock. Nhưng NV cùng lúc chấm có thể trùng ca → cần kiểm `caDangMo` trước.

---

## 7. apiHam / apiHamQL (fn trang web gọi xuống)

### 7.1 `apiHam()` (28 fn, cho app nhân viên qua Worker SHIM)
`qrInfo, qrMo, qrNhanVien, qrVao, qrRa, gioCongCuaToi, ksDanhSach, ksXacMinh, ksGui, lichCuaToi, luuDangKyBanNV, themRanhThem, xoaRanhThem, nhanCa, huyNhanCa, xinPhep, baoQuenCham, phanHoi, baoHong, dsBaoHongNV, bangTinVao, datBietDanh, demCaChoDuyetT10, kiemWifiTu2510, batWifiBatBuoc, tgCallback, saoLuuSheetNgay, qrVaoBackfill, qrRaBackfill, exportBangLuongT10, exportChamCongThang, exportCaiDatAll, exportNhanVienAll, exportLichSuLuong, xoaLuotTheoID, qrDangKySdtBackfill, qrGuiTelegram` (37 fn)

### 7.2 `apiHamQL()` (90+ fn, cho trang quản lý)
Xem chi tiết `cham-cong/Code.gs` L420-425.

**Worker build_worker.py tự extract apiHamQL → ALLOW_QL** (test API3 trong cc_test.js).

---

## 8. MÀN HÌNH / NÚT HTML (bản cũ)

### 8.1 `QR.html` (trang quét QR chấm công)
- Màn 1: ô Mã NV + 4 số cuối SĐT (CC 01/11a) + nút Tiếp tục.
- Màn 2 (NV chưa có SĐT): form 10 số đăng ký SĐT lần đầu (CC 01/11a, cách A).
- Màn 3: Danh sách Ca (chips) + Vị trí (chips) + Chụp ảnh + nút Vào ca.
- Màn 4 (ra ca): Đủ/Tăng/Giảm + Lý do + nút Ra ca.
- Màn 5: "Đã chấm công" + lời chào + bảng tin iframe + nút Xong.

### 8.2 `QuanLy.html` (trang quản lý)
- Màn đăng nhập: ô PIN + nút Vào.
- Thanh tab 13 tab: Hôm nay, Lịch & chấm công, Xác nhận giờ, Tra cứu, Mã QR, Báo hư hỏng, Khảo sát, Nhân sự, Bảng lương, Phiếu lương, Nhật ký sửa, Cài đặt, Thông báo sự kiện.
- Mỗi tab có hàm riêng `veHom, veLich, veXN, veTra, veQR, veHongQL, veKS, veNS, veLuong, vePhieu, veNK, veCD, veTB`.

### 8.3 `LichCuaToi.html`, `GioCong.html`, `KhaoSat.html` (app NV)
- Đăng nhập: Mã + 4 số cuối SĐT.
- `LichCuaToi`: xem lịch tuần + đăng ký lịch bận + rảnh thêm + nhận ca trống + bảng tin.
- `GioCong`: xem giờ tháng + đợt.
- `KhaoSat`: khảo sát NV lần đầu.

---

## 9. HẰNG SỐ VIẾT CỨNG (code bản cũ)

Em quét grep các regex / số cứng trong Code.gs, chọn những cái quan trọng:

| # | Hằng số | Giá trị | File.dòng | Nên đưa ra Cài đặt? |
|---|---|---|---|---|
| 9.1 | QR token length | 10 ký tự | Code.gs qrToken | KHÔNG (ảnh hưởng QR cũ) |
| 9.2 | Lock tryLock timeout | 25000 ms (qrVao/qrRa) | L658, L685 | Giữ cứng |
| 9.3 | waitLock timeout | 20000 ms | L771 | Giữ cứng |
| 9.4 | WIFI 2h cửa sổ | `2 * 3600 * 1000` ms | wifiChan_ | ✅ CF có `WIFI_CHO_XAC_NHAN_GIO` |
| 9.5 | TG_NHAC_SAU_PHUT default | 60 phút | L27 | ✅ đã CaiDat |
| 9.6 | CACHE WIFI_CHAN TTL | 6h (21600s) | L979 | Giữ cứng |
| 9.7 | CACHE phien NVP TTL | 24h | LichNV.gs L12 | Giữ cứng |
| 9.8 | `TRA_CUU_MAX_NGAY` | 93 (chưa dùng cứng, note bang-cai-dat) | – | ✅ CF DEFAULT |
| 9.9 | Regex mobile wifi | `mobile\|cellular\|...` | Code.gs wifiLaMobile_ | ✅ CF `WIFI_MOBILE_REGEX` DEFAULT |

---

## 10. CẦN ANH BẢO CHỤP MÀN HÌNH (không đọc được từ code)

### 10.1 Script Properties (Thuộc tính tập lệnh)
Mở `script.google.com` → project **Chấm công Ncafe** → menu bánh răng (⚙️) → **Cài đặt dự án** → cuộn xuống phần **Thuộc tính tập lệnh** (Script Properties).
- Chụp màn hình danh sách (tên khoá; **che giá trị** nếu bí mật).
- Em thấy code HIỆN KHÔNG DÙNG `PropertiesService` (grep rỗng), nhưng vẫn có thể còn giá trị từ phiên bản cũ.

### 10.2 Trình kích hoạt (Triggers)
Mở Apps Script → menu trái → ⏰ **Trình kích hoạt** → chụp bảng:
- Hàm được chạy
- Loại sự kiện (Clock, Spreadsheet, Form…)
- Nguồn
- Loại thời gian (phút, giờ, ngày)
- Tần suất

Em thấy code tạo 2 trigger auto (`tuDongLuuTru` 3:00 + `tgMoi15Phut` 15') nhưng có thể còn trigger khác anh thêm tay.

### 10.3 Bản triển khai
Script Apps → **Triển khai** → **Quản lý bản triển khai** → chụp danh sách.
- Chính: `AKfycbyx_dtu8KSl5sqtHihWyDLmlhoV-Ea9g_MPeMfk7a_gHI6obVgEKXfsCUehFztzoFXW` (@139 CC 01/11g).
- Có bản khác không?

---

## 11. ĐẾM MỤC THEO LOẠI (tóm tắt)

- **Table Sheet**: 18 bảng ở AS → 11 đã trong D1 (61%) + 7 chưa.
- **Spreadsheet IDs khác**: 7 file (lịch, lương, Drive folder).
- **UrlFetchApp**: 7 pattern (Telegram sendMessage/sendPhoto/webhook/callback/getUpdates + Bảng tin + Workera).
- **Trigger**: 2 trong code (chụp thêm từ UI).
- **CacheService**: 5 key.
- **LockService**: 3 chỗ.
- **apiHam/apiHamQL**: 37 + 90+ fn.
- **Màn hình HTML**: QR (5 màn), QuanLy (13 tab), 3 app NV.
- **Hằng số cứng cần note**: 9 mục.

**Thiếu/lệch trên Cloudflare** cần vá tiếp:
- 7 bảng Sheet chưa trong D1 (BaoHong, BaoQuen, DangKy*, LichSuLuong, LuongKhoang, PhanHoi, SuKien, XinPhep, Vang, DuyetDot, ChotLuong, LuuTru, KhaoSat).
- Cron 2 trigger `tuDongLuuTru` + `tgMoi15Phut` → CF chưa có (V5 nhịp tim sẽ thay).
- Phiên NV app LichCuaToi/GioCong (NVP_token) → CF chưa có.

---

## Luật dùng NEN-CU.md (ghi CLAUDE.md luật 8 mới 1/11)

1. Lệnh anh chỉ nói phần THAY ĐỔI. Mọi mục trong NEN-CU.md mặc định giữ nguyên và chạy như cũ.
2. Trước khi sửa: liệt kê các mục NEN-CU.md mà phần sửa đụng / phụ thuộc, ghi NHAT-KY.md.
3. Sau khi sửa: kiểm lại từng mục đó còn chạy đúng.
4. Phát hiện thứ trong code cũ mà NEN-CU.md chưa có → bổ sung vào NEN-CU.md trước rồi mới làm tiếp.
