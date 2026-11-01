# Việc tồn (cập nhật 1/11/2026)

Mọi việc anh Bảo giao chưa XONG. Mỗi việc 1 dòng: **tên** – trạng thái – thứ tự (theo lệnh anh).
Luật XONG (CLAUDE.md luật 0): ✓ khi đúng đủ + đang chạy thật + có bằng chứng.
Xong mỗi việc → cập nhật file này, báo anh 1 dòng.

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
