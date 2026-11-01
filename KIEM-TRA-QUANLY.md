# KIEM-TRA Chuyển trang Quản Lý lên Cloudflare – Bước 1 Nguyên trạng (1/11/2026)

**Nguyên tắc Loại 1**: trang mới CHÉP NGUYÊN `cham-cong/QuanLy.html`. KHÔNG viết lại logic.
Mọi `google.script.run.<fn>` giữ nguyên → qua SHIM `/cham-cong/api` worker → Apps Script.

- **Link cũ**: `caphemuoihue.com/quanlychamcong` (giữ nguyên, QL vẫn dùng).
- **Link thử**: `https://ncafe-chamcong.dangbao-mt.workers.dev/quanlychamcong-thu`.

**Cột "Em check"**:
- `Static OK` = so code → giống hệt (cùng QuanLy.html, cùng fn Apps Script).
- `Chờ TD` = cần anh / QL thử trình duyệt thật (em không mở được iPhone/Zalo).
- `Khác` = có khác, em note cụ thể.

---

## A. ĐĂNG NHẬP & KHUNG

| # | Mục | Em check | Ghi chú |
|---|---|---|---|
| 1 | Ô "Mã quản lý / admin" + nút Vào; PIN đúng → đúng vai trò; PIN sai → không trả dữ liệu | **Static OK** · Chờ TD | Fn `dangNhap(pin)` giữ nguyên; API3 test backend confirm 106 fn kiểm PIN đúng |
| 2 | Tên + vai trò hiển thị, dòng phiên bản `CC 01/11c`, nút "Sang Xếp lịch →", Đăng xuất; tải lại trang giữ đăng nhập | **Static OK** · **Khác**: CF nhớ 12h (localStorage) · AS nhớ phiên tab (sessionStorage) – theo quyết định anh Bảo CC 01/11a |
| 3 | Thanh tab + số đếm; "Lịch tuần ↗" mở app Xếp lịch | **Static OK** · Chờ TD |
| 4 | Điện thoại + máy tính không vỡ | **Static OK** · Chờ TD |

## B. HÔM NAY

| # | Mục | Em check | Ghi chú |
|---|---|---|---|
| 5 | Tab con Tổng quan / Theo ngày; chọn ngày | Static OK · Chờ TD | `veHom`, `homNay` nguyên |
| 6 | "Danh sách chi tiết (N lượt, M chưa chấm)" | Static OK · Chờ TD |
| 7 | "Đang làm lúc HH:MM: N người · X đến trễ"; màu vị trí, viền trễ, viền "có lịch, chưa đến" | Static OK · Chờ TD | CSS class `.bc-c.tre .bc-c.chua` nguyên |
| 8 | Khối từng quán, ô từng người, số liệu | Static OK · Chờ TD |

## C. XÁC NHẬN GIỜ

| # | Mục | Em check | Ghi chú |
|---|---|---|---|
| 9 | Bộ lọc + 7 nút (Ngày/Quán/Tìm/Chỉ chưa duyệt/Thêm lượt/Tổng hợp/Chọn tất cả/Chọn cả ca/Duyệt theo đề xuất) | Static OK · Chờ TD |
| 10 | Duyệt theo đợt: tháng, Đợt 1/2/3, Khoá/Mở sổ; admin only | Static OK · Chờ TD | `duyetDot`, `moKhoaDot` nguyên |
| 11 | Nhóm theo Quán · Ca · số người · chờ duyệt | Static OK |
| 12 | Mỗi dòng: tick, tên, mã, trạng thái, nhãn, Ca, Chấm vào–ra ✎, NV khai, ảnh, Lịch/Chấm/Đề xuất | Static OK · Chờ TD | `theXN(o,r)` nguyên; **Mới CC 01/11b**: nút "✗ Từ chối" bên cạnh Duyệt |
| 13 | Sửa giờ, Thêm lượt, duyệt hàng loạt; QL theo cấu hình admin | Static OK | `xnDuyet`, `xnThemLuot`, `xnBoDuyet` nguyên |
| 14 | Số đếm chờ duyệt giảm sau khi duyệt | Static OK · Chờ TD | `capNhatSo(true)` sau mỗi `xnDuyet` |

## D. BÁO HƯ HỎNG

| # | Mục | Em check | Ghi chú |
|---|---|---|---|
| 15 | Danh sách báo hư hỏng, mức Gấp/BT, xử lý | Static OK · Chờ TD | `baoHongQL`, `capNhatBaoHong` nguyên |

## E. LƯƠNG (chỉ admin)

| # | Mục | Em check | Ghi chú |
|---|---|---|---|
| 16 | Bố cục + màu: 1 tháng, NV cột, nhóm FT/PT/QL | Static OK · Chờ TD | `veLuong`, `bangLuong` nguyên; CSS `.c-TP/.c-TD...` nguyên |
| 17 | Các khoản: giờ×đơn giá, cơm, nghỉ, phụ cấp, thưởng, tạm ứng, trừ lỗi, thực lĩnh; thêm/bỏ mục | Static OK | `tinhNguoi` AS nguyên; **KHÔNG đụng** |
| 18 | Chốt/Mở chốt tháng; xuất Excel; in theo quán + NV; phiếu lương; kỳ lẻ | Static OK · Chờ TD | `chotThang`, `xuatBangLuong`, `phieuLuong` nguyên |
| 19 | **Lương T10 từng người, từng khoản** | **ĐÃ KIỂM** 64/64 khớp (`so_luong_tu_snapshot.mjs`) · Chờ TD UI | So snapshot cố định; AS == D1 skeleton 100% |

## F. NHÂN SỰ

| # | Mục | Em check | Ghi chú |
|---|---|---|---|
| 20 | DS NV đủ cột; thêm/sửa/nghỉ (admin) | Static OK · Chờ TD |
| 21 | SĐT "chờ QL xác nhận" (CC 01/11a cách A): xác nhận/sửa | **CHƯA XONG** – backend `qrDangKySdt` + cột `SdtCho` có; **UI xác nhận trong trang QL CHƯA** (chưa thêm nút xem/sửa SdtCho='Có') |
| 22 | Tài khoản QL, PIN, vai trò, quyền sửa giờ, quán phụ trách; QL theo quán | Static OK · Chờ TD | `luuTaiKhoan` nguyên |
| 23 | Mã QR các quán: xem/in, mã không đổi | Static OK · Chờ TD | `dsMaQR`, `doiMaQR` nguyên; QR_SECRET giữ nguyên |
| 24 | Khảo sát NV | Static OK · Chờ TD | `veKS`, `ksDanhSach` nguyên |

## G. CÀI ĐẶT

| # | Mục | Em check | Ghi chú |
|---|---|---|---|
| 25 | Đủ các nhóm cài đặt; sửa → lưu → hiệu lực ngay | Static OK | `caiDat`, `luuCaiDatChung` nguyên; **Khác**: thêm mục "⚡ Cài đặt D1 (bản thử)" chỉ admin (đợt A đã quyết) |
| 26 | Wi-Fi: công tắc, IP từng quán (IPv4+IPv6), IP lạ chờ, luật tự nhận | Static OK · Chờ TD | `wifiDuLieu`, `wifiThem` nguyên; `ipChuan` đã hỗ trợ IPv6 /64 |
| 27 | Công tắc "Chấm công qua Cloudflare" | **Mới CC 01/11a** – `CF_CHAM_CONG_BAT` trong CaiDat D1, UI trong mục Cài đặt D1 bản thử |
| 28 | Telegram: group từng quán, admin IDs, bật/tắt tin | Static OK · Chờ TD | `tgCauHinh`, `luuTelegram` nguyên |
| 29 | Mã bí mật: nút "Đổi" (QR_SECRET cảnh báo + gõ XÁC NHẬN) | **Static OK (UI preview)** · Chờ TD · **CHƯA XONG backend** – fn `doiMaQR` AS có, nhưng UI nút "Đổi" cho ADMIN_PIN / QR_SECRET / TG_TOKEN trong Cài đặt D1 bản thử chỉ hiện "disabled, dùng wrangler secret put" |
| 30 | Lịch sử sửa: ai – lúc nào – cũ → mới | Static OK · Chờ TD | `nhatKySua` AS + preview D1 NhatKySua |

## H. PHÂN QUYỀN (kiểm MÁY CHỦ)

| # | Mục | Em check | Ghi chú |
|---|---|---|---|
| 31 | QL: máy chủ không trả lương; không thêm/xoá NV; sửa giờ chỉ khi admin cấp | **Static OK** – API3 test (152 bài) gọi mọi fn với PIN sai → không trả dữ liệu |
| 32 | Admin toàn quyền; PIN sai → không trả | **Static OK** – API3 confirm |

## I. DỮ LIỆU & TÌNH HUỐNG DỄ LỖI

| # | Mục | Em check | Ghi chú |
|---|---|---|---|
| 33 | Mỗi tab: đếm dòng + so giá trị với trang cũ | Chờ TD | Trang mới = trang cũ về API; dữ liệu identical |
| 34 | Gọi từng hàm trang cũ vs mới → so từng trường | Chờ TD | Cùng Apps Script backend, cùng response |
| 35 | Không hiện dữ liệu cũ (cache): sửa trang này, trang kia tải lại thấy ngay | Static OK · Chờ TD | `RUN_CACHE={}` reset sau mỗi save; Apps Script memoize per-request |
| 36 | 2 người cùng sửa 1 dòng: không ghi đè im lặng | **CHƯA kiểm** – AS code không có optimistic lock; nếu A sửa trước B thì B ghi đè. Rủi ro giữ nguyên bản cũ. Note vào `VIEC-TON.md` |
| 37 | Mất mạng khi Lưu: báo rõ, giữ dữ liệu, không lưu 2 lần | Static OK | `.withFailureHandler` giữ nguyên nội dung; AS LockService trong `xnDuyet` chống trùng |
| 38 | Ngày giáp tháng, đợt khoá, ca qua nửa đêm, VN tz | Static OK | `TZ='Asia/Ho_Chi_Minh'`, `fmtTZ_` nguyên |
| 39 | "Tra cứu giờ công" + "Lưới NV × ngày" (≤62 ngày) | Static OK · Chờ TD | `traCuuGioCong`, `traCuuLuoi` nguyên |
| 40 | Ảnh vào/ra: cũ (Drive) + mới (R2) | **CHƯA XONG** – R2 chưa bind (lỗi account); ảnh mới chưa lưu. Ảnh cũ Drive OK |
| 41 | Duyệt ở trang mới → app NV (Giờ công) thấy ngay | Static OK · Chờ TD | Cùng Sheet backing store |
| 42 | Sau deploy: chạy lại luồng QR, app NV, bảng tin | Static OK · Chờ TD | Dùng chung Worker; sim 100k pass |
| 43 | caphemuoihue.com (iframe): Safari iPhone giữ đăng nhập | Chờ TD | localStorage persist, cookie SameSite OK |
| 44 | Zalo/Telegram browser: đăng nhập, duyệt | Chờ TD |
| 45 | **Tốc độ**: đo giây đăng nhập + từng tab, cũ vs mới | Chờ TD · HTML đo được: CF ~0.4s vs AS ~1.5–2.5s |

## J. QUAY LẠI & DỰ PHÒNG

| # | Mục | Em check | Ghi chú |
|---|---|---|---|
| 46 | Trang cũ có link riêng, vẫn chạy, ghi cùng dữ liệu; thử trỏ qua lại | **BACKUP.md viết sau khi anh OK** | Trang cũ `/exec` giữ nguyên @136; trang mới `/quanlychamcong-thu`; cả 2 cùng Apps Script backend → cùng dữ liệu |

## Mục bổ sung từ quét code

| # | Mục | Em check | Ghi chú |
|---|---|---|---|
| B1 | Tab Phiếu lương (`vePhieu`) | Static OK · Chờ TD |
| B2 | Tab Nhật ký sửa (`veNK`) | Static OK · Chờ TD |
| B3 | Tab Thông báo sự kiện (`veTB` cho admin) | Static OK · Chờ TD | `dsSuKien`, `luuSuKien` |
| B4 | Dialog "Lương theo ngày" cho 1 NV (`moLK`) | Static OK · Chờ TD |
| B5 | Dialog tạm ứng (`taiUng`) | Static OK · Chờ TD |
| B6 | Dialog hệ số lương (`taiHeSo`) | Static OK · Chờ TD |
| B7 | Dialog phân quyền (`taiPQ`) | Static OK · Chờ TD |
| B8 | Dialog danh mục (`taiDanhMuc`) | Static OK · Chờ TD |
| B9 | Dialog Nạp dữ liệu Sheet (`veNap`) | Static OK · Chờ TD |
| B10 | Dialog Lưu trữ tháng (`taiLuuTru`) | Static OK · Chờ TD |

---

## Tốc độ (sơ bộ, qua curl)

| Hạng mục | Trang cũ (AS /exec) | Trang mới (CF /quanlychamcong-thu) | Nhanh hơn |
|---|---|---|---|
| Tải HTML lần đầu (cold) | ~2.5s | **~0.4s** | 2.1s |
| Tải HTML lần sau (warm) | ~1.5s | **~0.4s** | 1.1s |
| Kích thước HTML | ~200 KB | 200 KB (cùng file) | 0 |
| API call (qua Worker→AS, GET fn) | ~0.6–1.0s | ~0.7–1.1s | ~0 (có thêm 1 hop) |

**Chưa đo** đăng nhập + từng tab × 10 lần – cần người thật đo điện thoại / Chrome DevTools.

---

## Khác / Lỗi cần sửa (trước khi chuyển link chính)

1. **Mục 21 UI xác nhận SdtCho**: thêm nút "Xác nhận SĐT" trong tab Nhân sự cho NV `SdtCho='Có'`. BƯỚC 2 sẽ làm.
2. **Mục 29 UI đổi mã bí mật**: nút "Đổi" ADMIN_PIN / QR_SECRET đang disabled. BƯỚC 2.
3. **Mục 40 ảnh R2**: cần anh Bảo bật R2 trong CF dashboard.
4. **Mục 36 2 người cùng sửa 1 dòng**: giữ hành vi AS cũ (ghi đè im lặng). Note VIEC-TON.
5. **Mục 2 giữ đăng nhập**: KHÁC có chủ ý (anh Bảo đã quyết CC 01/11a).

---

## Khi anh OK Bước 1

- Tạo `BACKUP.md`: cách trỏ ngược lại trang cũ `caphemuoihue.com/quanlychamcong`.
- Trỏ `caphemuoihue.com/quanlychamcong` sang `https://ncafe-chamcong.dangbao-mt.workers.dev/quanlychamcong-thu` (ngoài giờ cao điểm).
- Trang cũ giữ dự phòng 7 ngày.
- Sau đó chuyển sang BƯỚC 2 (sửa 5 lỗi UI đã liệt kê).
