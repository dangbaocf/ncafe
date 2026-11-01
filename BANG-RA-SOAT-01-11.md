# Bảng rà soát mọi yêu cầu anh Bảo (phiên 1/11)

Nguồn: tin anh gửi trong phiên + CLAUDE.md + VIEC-TON.md + CAP-NHAT.md + NHAT-KY.md.

## A. LUẬT (CLAUDE.md)

| # | Yêu cầu | Đã xong | Hàng đợi | Chưa có |
|---|---|---|---|---|
| A1 | Luật XONG (chỉ ✓ khi đúng đủ + bằng chứng) | ✅ CLAUDE.md L10 | | |
| A2 | KHÔNG test mã NV thật, dùng NV-TEST/PV-TEST + cờ TEST | ✅ CLAUDE.md L15 | | |
| A3 | Đối soát bản cũ trước deploy chuyển đổi | ✅ CLAUDE.md L16 | | |
| A4 | VIEC-TON.md luôn đồng bộ | ✅ CLAUDE.md L17 + file hiện có | | |
| A5 | 4 cổng chặn deploy (Data/Bản cũ/Trình duyệt/Người thật) | ✅ CLAUDE.md L31 | | |
| A6 | Giờ cấm deploy 06-07:30, 14-15, 16:30-17:30 | ✅ CLAUDE.md L52 | | |
| A7 | Mỗi lần sửa = 1 bản CC + CAP-NHAT + tin 5 dòng | ✅ CLAUDE.md L56 | | |
| A8 | Rủi ro cao DỪNG chờ "OK" | ✅ CLAUDE.md L62 | | |
| A9 | Ghi Google Drive `ncafe-code/` | ✅ CLAUDE.md L66 | ⏳ chờ anh cài Drive | |
| A10 | NEN-CU.md là nền, lệnh chỉ nói THAY ĐỔI | ✅ CLAUDE.md L72 + NEN-CU.md | | |

## B. HẠ TẦNG & DỮ LIỆU

| # | Yêu cầu | Đã xong | Hàng đợi | Chưa có |
|---|---|---|---|---|
| B1 | D1 ncafe-chamcong-d1 + schema | ✅ 31/10 15:30 | | |
| B2 | Chép 72 CaiDat + 70 NhanVien + 31 SDT từ Sheet | ✅ 1/11 00:00 | | |
| B3 | 6 secret put wrangler | ✅ 1/11 00:00 | | |
| B4 | R2 bucket + ảnh lưu | | ⏳ anh enable R2 CF dashboard | |
| B5 | Chép CoSo toạ độ (ViDo/KinhDo) từ Sheet sang D1 | | | **CHƯA** – cả 5 quán D1 có null, Sheet có |
| B6 | 11 ca D1 khớp bản cũ (PT1-4, FT1-4, FT10-12) | ✅ CC 01/11a | | |
| B7 | Dọn 10 record TEST sáng nay | ✅ xoaLuotTheoID | | |
| B8 | Bù 12 tin Telegram sáng nay (TP/DD/LDD) | ✅ qrGuiTelegram | ⏳ anh kiểm 3 group | |

## C. TRANG CHẤM CÔNG (QR.html)

| # | Yêu cầu | Đã xong | Hàng đợi | Chưa có |
|---|---|---|---|---|
| C1 | Fix trang QR trắng (D1 qrNhanVien cấu trúc) | ✅ CC 01/11a | | |
| C2 | Ô Mã + 4 số cuối SĐT + nhớ localStorage + "Không phải tôi" | ✅ CC 01/11a | | |
| C3 | NV chưa SĐT: form 10 số đăng ký cách A | ✅ CC 01/11a | | |
| C4 | Sdt4 sai 5 lần → khoá 5 phút + Telegram admin | ✅ CC 01/11a | | |
| C5 | Ẩn "Đã lấy vị trí" | ✅ CC 01/11a | | |
| C6 | Thêm ca BV 06:30–17:00 | ✅ FT10 D1 | | |
| C7 | Wi-Fi khớp đúng quán của QR | ✅ CC 01/11a wifiChan | | |
| C8 | Dự phòng QR lỗi/5s → đường cũ | ✅ cham() wrapper CC 01/11a | | |
| C9 | Công tắc CF_CHAM_CONG_BAT | ✅ CC 01/11a | | |

## D. TELEGRAM (V1)

| # | Yêu cầu | Đã xong | Hàng đợi | Chưa có |
|---|---|---|---|---|
| D1 | Worker gửi Telegram trực tiếp + log D1 | ✅ CC 01/11f | | |
| D2 | Tin có ảnh (sendPhoto) + format giống AS | ✅ CC 01/11g | | |
| D3 | TG_ADMIN_IDS cài 8492970897 | ✅ 11:20 1/11 | | |
| D4 | PV-TEST tin admin có ảnh | ✅ 11:22 1/11 (msg 850+851) | | |
| D5 | Mã test → gửi admin only | ✅ telegramChonChat | | |

## E. TAB XÁC NHẬN GIỜ

| # | Yêu cầu | Đã xong | Hàng đợi | Chưa có |
|---|---|---|---|---|
| E1 | Nút ✓ Duyệt tại dòng | ✅ sẵn có | | |
| E2 | Nút ✗ Từ chối tại dòng + lý do | ✅ CC 01/11b (prompt) | ⏳ V9c đổi inline + nhanh | |
| E3 | Nút Xoá tại dòng (admin) | | ⏳ V9c khôi phục | **CHƯA** – chỉ trong form Sửa |
| E4 | Tra cứu từ ngày đến ngày | | ⏳ V9a mới | |
| E5 | Nhãn "Quên chấm ra" lặp 2 lần | | ⏳ V9d | **CHƯA kiểm** |
| E6 | Dòng Quên chấm ra: gợi ý giờ ra = CaKT | | ⏳ V9e | |

## F. TRANG QL (chuyển lên CF)

| # | Yêu cầu | Đã xong | Hàng đợi | Chưa có |
|---|---|---|---|---|
| F1 | Giữ đăng nhập 12h | ✅ CC 01/11a | | |
| F2 | Bỏ confirm thừa (ksBoQua, luuViTriQuan,…) | ✅ CC 01/11d gộp e | | |
| F3 | Nút Quay lại dialog con | ✅ CC 01/11d | | |
| F4 | History pushState Back không văng | ✅ CC 01/11d | | |
| F5 | Toast "Đã lưu" + chống bấm 2 lần | ✅ CC 01/11d (partial, chỉ Cài đặt) | ⏳ còn Nhân sự, Lương, QR | |
| F6 | Bấm Sửa không reload trang | | | **CHƯA** – scope BIG |
| F7 | Lưu inline không reload | | | **CHƯA** – scope BIG |
| F8 | Route /quanlychamcong-thu + bảng đối chiếu | ✅ CC 01/11c + KIEM-TRA-QUANLY.md | ⏳ anh test iPhone | |

## G. LƯƠNG & TÍNH TOÁN

| # | Yêu cầu | Đã xong | Hàng đợi | Chưa có |
|---|---|---|---|---|
| G1 | Lương T10 khớp 64/64 với snapshot cố định | ✅ 1/11 | | |
| G2 | Port ngày lễ hệ số, lsLuong, LuongKhoang, giờ đêm | | ⏳ Việc cũ #7 | |
| G3 | 100.000 lượt + ca biên PASS | ✅ sim100k_bien.mjs | | |

## H. V1-V9 HÀNG ĐỢI

| # | Việc | Trạng thái |
|---|---|---|
| V1 TELEGRAM | ✅ XONG |
| V2 ĐƯỜNG CŨ VỀ D1 | CHƯA |
| V3 WI-FI IPv6 | CHƯA |
| V4 TỰ PHỤC HỒI | CHƯA |
| V5 TỰ KIỂM + NHỊP TIM | CHƯA |
| V6 ĐIỀU KHIỂN TỪ XA | CHƯA |
| V7 KIEM-KE.md | ⏳ 1 phần (NEN-CU.md xong) |
| V8 ĐỐI SOÁT TOÀN HỆ THỐNG | CHƯA |
| V9 CHUYỂN TRANG QL | ⏳ bước 1 xong, chờ anh test iPhone |

## I. CÁC MỤC NGƯỜI THẬT (chờ)

| # | Việc | Trạng thái |
|---|---|---|
| I1 | Anh chụp Script Properties | ⏳ |
| I2 | Anh chụp Trigger UI | ⏳ |
| I3 | Anh chụp Bản triển khai | ⏳ |
| I4 | Anh cài Google Drive for Desktop | ⏳ |
| I5 | Anh test iPhone/Zalo trang QR | ⏳ |
| I6 | Anh test iPhone /quanlychamcong-thu | ⏳ |

---

## MỤC MỚI THÊM VÀO HÀNG ĐỢI (từ tin anh vừa gửi)

- **V10 CÀI TRÌNH DUYỆT TỰ ĐỘNG**: Playwright/Puppeteer chạy macOS 12 (Playwright không hỗ trợ chrome mac12 em thử trước; cần cách khác: cài Chrome local + CDP hoặc Puppeteer-core). Từ nay "mở trang thật thử đủ luồng" = dùng công cụ này.
- **V11 KIỂM 4 QUÁN LƯỢT CHẤM THẬT ĐẦU TIÊN SAU CC 01/11g**: TP, DD, TD, LDD. Khi có lượt mới → kiểm log TelegramLog + tin có ảnh trong group → báo anh từng quán.
- **V12 CHÉP CoSo TOẠ ĐỘ TỪ SHEET SANG D1**: fix "Quán chưa lưu vị trí" (hiện cả 5 quán D1 có `ViDo/KinhDo=null`).

## V9 "Sửa trang quản lý" – chi tiết (xếp SAU khi anh xác nhận bước 1 Chuyển trang QL)

- **V9a** Tra cứu từ ngày đến ngày ở tab Xác nhận giờ.
- **V9b** Từ chối: bỏ `prompt()` → ô nhập inline trong dòng + lý do chọn nhanh ("Không đi làm", "Chấm nhầm", "Trùng lượt", "Khác"), vẫn bắt buộc lý do.
- **V9c** Khôi phục nút Xoá cho admin TẠI DÒNG (hiện chỉ nằm trong form Sửa).
- **V9d** Nhãn "Quên chấm ra" bị lặp 2 lần → chỉ hiện 1.
- **V9e** Dòng Quên chấm ra: gợi ý giờ ra = `CaKT` để QL bấm Duyệt hoặc sửa.
