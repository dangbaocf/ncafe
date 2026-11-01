# Việc tồn (cập nhật 1/11/2026)

Mọi việc anh Bảo giao chưa XONG. Mỗi việc 1 dòng: **tên** – trạng thái – thứ tự.
Luật XONG (CLAUDE.md): ✓ khi đúng đủ + đang chạy thật + có bằng chứng.
Xong mỗi việc → cập nhật file này, báo anh 1 dòng.

## Hàng đợi V1-V12 (1/11 chốt)

- **V1 TELEGRAM** – ✅ XONG 11:22 1/11. Admin ID 8492970897, PV-TEST tin có ảnh msg_id 850+851.
- **V2 ĐƯỜNG CŨ VỀ D1** – CHƯA. Mọi lượt qua Apps Script phải tự về D1. Bổ sung các lượt sáng nay còn thiếu. Xong khi: PV-TEST qua đường cũ → hiện ở D1 + trang QL. Bằng chứng: số lượt đường cũ hôm nay = số đã về D1.
- **V3 WI-FI** – CHƯA. Thêm dải IPv6 các quán (Nhỏ 103 bị chặn 2402:800:…); Sheet "Cảnh báo" → đúng "Bắt buộc". Xong khi: IPv6 quán chấm được, IP lạ vẫn chặn. Bằng chứng: bảng IP từng quán + kết quả thử.
- **V4 TỰ PHỤC HỒI** – CHƯA. QR lỗi/>5s/không hiện → tự chuyển đường cũ (đã có cham() wrapper); Telegram lỗi → gửi lại; 23:30 so D1–Sheet, lệch → tự gửi bù. Bằng chứng: bảng 3 tình huống + kết quả.
- **V5 TỰ KIỂM + NHỊP TIM** – CHƯA. Mỗi 10' 05:45–22:30 kiểm QR 5 quán + app NV + QL + bảng tin + đồng bộ + Telegram. Lỗi → group admin kèm mô tả cho Claude Code. 05:45 + 23:30 luôn gửi "Báo cáo hệ thống" dù ổn. DỪNG chờ anh xác nhận nhận.
- **V6 ĐIỀU KHIỂN TỪ XA** – CHƯA. Hướng dẫn MacBook cắm điện, không ngủ, tự chạy sau khởi động, điều khiển Claude Code từ điện thoại. DỪNG chờ anh thử.
- **V7 KIỂM KÊ HỆ THỐNG (KIEM-KE.md)** – CHƯA. 8 phần: QR 5 quán, app NV, trang QL, Telegram, bảng tin, cron, D1–Sheet, nối Xếp lịch. Mỗi phần: màn hình/nút/hàm/bảng/cron/link + bản đồ liên thông. Đối chiếu 4 nguồn: code cũ, cài đặt Sheet, dữ liệu T6–T10, CLAUDE.md. Đánh số mọi yêu cầu CLAUDE.md. DỪNG gửi anh duyệt.
- **V8 ĐỐI SOÁT TOÀN HỆ THỐNG** – CHƯA. Theo kế hoạch V7 đã duyệt. 8 phần × 3 lớp (màn hình/liên thông/dữ liệu). Khác (ngoài quyết định) → vá, 1 bản update/chỗ.
- **V9 CHUYỂN TRANG QUẢN LÝ** – CHƯA (bước 1 Nguyên trạng đã deploy /quanlychamcong-thu, chờ anh test). T11+ dữ liệu D1, T10 trở về Sheet (chỉ xem). Lương T10 phải khớp 64/64. T11 chạy song song. DỪNG danh sách kiểm tra duyệt + DỪNG trước trỏ link thật.

## MỤC MỚI THÊM 1/11 (từ tin anh)

- **V10 TRÌNH DUYỆT TỰ ĐỘNG** – CHƯA. Playwright/Puppeteer chạy macOS 12 (Playwright không hỗ trợ chrome mac12; cần Puppeteer-core + Chrome local hoặc Chrome headless CLI). Từ nay "mở trang thật thử đủ luồng" = dùng công cụ này, chỉ gọi API là CHƯA ĐỦ (ghi CLAUDE.md luật 4 cổng #3).
- **V11 KIỂM 4 QUÁN LƯỢT CHẤM THẬT ĐẦU TIÊN SAU CC 01/11g** – CHƯA. Khi TP/DD/TD/LDD có lượt chấm mới → kiểm log TelegramLog + tin có ảnh trong group → báo anh từng quán.
- **V12 CHÉP CoSo TOẠ ĐỘ (ViDo/KinhDo) TỪ SHEET SANG D1** – CHƯA. Hiện cả 5 quán D1 có `null` → "Quán chưa lưu vị trí". Fix: export AS CoSo + UPDATE D1.
- **V13 Sửa trang quản lý (SAU khi chuyển lên CF – mỗi mục 1 bản update)**:
  - V13a Tra cứu từ ngày đến ngày ở tab Xác nhận giờ.
  - V13b Từ chối: bỏ prompt → ô inline + lý do chọn nhanh ("Không đi làm", "Chấm nhầm", "Trùng lượt", "Khác"), vẫn bắt buộc.
  - V13c **Khôi phục nút Xoá cho admin TẠI DÒNG** (hiện chỉ trong form Sửa).
  - V13d Nhãn "Quên chấm ra" bị lặp 2 lần → chỉ hiện 1.
  - V13e Dòng Quên chấm ra: gợi ý giờ ra = CaKT.

---

## Việc cũ sau V9 (xếp sau, bỏ việc trùng V3+V9)

## Thứ tự ưu tiên

1. **Dọn dữ liệu test 1/11** – ĐANG CHỜ ANH DUYỆT – đã liệt kê danh sách Sheet (10 record test); D1 đã sạch; TG_ADMIN_IDS trống nên không có tin Telegram test.
2. **Ô SĐT trang QR (cách A)** – ĐANG LÀM – backend đã có check sdt4 + chống 5 sai + khoá 5 phút; UI đang ở bản đơn giản (1 ô Mã) để Việc 1 trang trắng ổn. Cần thêm: màn hình mã + 4 số cuối; nhớ localStorage; "Không phải tôi"; CÁCH A (NV chưa có SĐT lần đầu nhập 10 số → lưu + chấm luôn, QL duyệt sau). Sau test đạt → bật `KIEM_SDT4='Có'`.
3. **Nút Xác nhận/Từ chối/Xoá tab Xác nhận giờ** – CHƯA – mỗi dòng có nút tại chỗ, không reload; Từ chối bắt lý do + không tính giờ, giữ lịch sử; Xoá chỉ admin + bắt lý do + confirm 1 lần + xoá D1+Sheet + ghi lịch sử; giữ tick duyệt hàng loạt.
4. **Thêm ca BV 06:30–17:00 + các ca thực T10 + ẩn "Đã lấy vị trí" + Wi-Fi nhận IPv6** – CHƯA – ca BV1 có trong seed.sql rồi (6:30–17:00) nhưng cần verify UI hiện; cần ẩn text "Đã lấy vị trí" khỏi QR.html; Wi-Fi check IPv6 (chuẩn hoá IPv6 /64 đã có trong `ipChuan`).
5. **Đối chiếu CLAUDE.md** – CHƯA – đi từng dòng yêu cầu CLAUDE.md, lập bảng Đúng/Chưa/Sai + chỗ nào. Thêm luật: trước mỗi deploy đối chiếu phần bị thay đổi với yêu cầu liên quan.
6. **Tối ưu + sửa lỗi trang quản lý** – CHƯA (đã làm 2/7 phần: giữ 12h + bỏ confirm thừa) – còn: Sửa/Lưu inline không reload; nút Quay lại mọi màn con; rà toàn bộ bug; test mobile+desktop; đo tốc độ 10×6 tab.
7. **Lương chạy ngầm 64/64** – ĐÃ 64/64 khớp (gio, cơm, TC, thiếu, lương, tn, thuc) với snapshot cố định. CÒN: port các khoản tổng quát (ngày lễ hệ số, lsLuong, LuongKhoang, giờ đêm) để kỳ T11+ vẫn khớp.
8. **Bảng luật tính giờ + test 100.000 lượt** – ĐÃ có sim100k.mjs + sim100k_bien.mjs (100k lượt ca biên) + thamchieu.js. CÒN: cập nhật bảng luật theo yêu cầu "liệt kê luật chưa rõ" khi phát hiện mới.
9. **Kiểm tra tự động (đợt D)** – CHƯA – cron sáng 6:00 / tối 23:00; kiểm quên chấm ra, trùng, 2 quán chồng giờ, ca chờ duyệt > N ngày, IP lạ chờ, lệch CF↔Sheet; DM Telegram admin.
10. **Tra cứu mới trong tab Xác nhận giờ** – CHƯA – bộ lọc khoảng ngày + quán + mã/tên không dấu + trạng thái; dòng tổng; xuất Sheet riêng; tối đa 93 ngày; chia trang 100 dòng.
11. **So sánh app có sẵn** – CHƯA – đối soát từng màn hình, bước, ô, nút giữa bản cũ Apps Script và bản mới Cloudflare. Lập bảng Giống/Khác; danh sách ca đủ bản cũ + T10 thực tế (6:30–17:00, 6:30–18:00, 8:00–17:00, ca gãy…).

---

## Việc đã XONG (lưu lịch sử)

- Hạ tầng D1 + schema + seed CoSo/Ca mẫu (31/10 15:30).
- Chép 72 CaiDat + 70 NhanVien + 31 SDT sang D1 (1/11 00:00).
- Secrets 6 khoá put wrangler (ADMIN_PIN, QL_PIN, QR_SECRET, TG_TOKEN, API_KEY, FEED_SECRET).
- Fix trang QR trắng (D1 qrNhanVien port cấu trúc AS); verify Node sim 5/5 không crash; anh thử iPhone 7:58 OK.
- Lương chạy ngầm 64/64 khớp (snapshot cố định).
- 100.000 lượt + ca biên PASS 100%.
- Luật XONG đưa vào CLAUDE.md.
