# Đối chiếu trang Quản Lý: Apps Script (cũ) vs Cloudflare (mới) – 1/11/2026

## Nguyên tắc Loại 1 Nguyên trạng
Trang mới CHÉP NGUYÊN `QuanLy.html` đang chạy. KHÔNG viết lại, KHÔNG đổi logic.
Mọi API call vẫn qua `google.script.run` (SHIM → `/cham-cong/api` worker → Apps Script).
Kết quả mỗi hàm giống hệt cả 2 trang.

## Link
- **Cũ (giữ nguyên)**: `caphemuoihue.com/quanlychamcong` → Apps Script `/exec?page=quanly`.
- **Mới (link thử)**: `https://ncafe-chamcong.dangbao-mt.workers.dev/quanlychamcong-thu`.
  Cả `/quan-ly` (có sẵn từ đợt A) và `/quanlychamcong-thu` (vừa thêm 1/11) phục vụ CÙNG `QuanLy.html`.

## Bảng đối chiếu

| Chỗ | Cũ (AS /exec) | Mới (CF /quanlychamcong-thu) | Giống/Khác |
|---|---|---|---|
| **File HTML phục vụ** | `QuanLy.html` build vào `dist/` + clasp push | `QuanLy.html` nhúng vào `worker.js` qua `build_worker.py` | **Giống** (cùng file, cùng build) |
| **Màn hình đăng nhập** | Input PIN + nút Vào | Giống | **Giống** |
| **Tab Hôm nay** | `homNay()` qua AS | `homNay()` qua Worker → AS | **Giống** (cùng fn) |
| **Tab Xác nhận giờ** | `xnDanhSach()` + nút Duyệt / Sửa / Từ chối (CC 01/11b) / Xoá (admin) | Giống | **Giống** |
| **Tab Báo hư hỏng** | `baoHongQL()` | Giống | **Giống** |
| **Tab Mã QR** | `dsMaQR()` | Giống | **Giống** |
| **Tab Lương** (quyền `luong>=1`) | `bangLuong()` + `cauHinhLuong()` + ... | Giống | **Giống** |
| **Tab Nhân sự** | `dsNhanVien()` | Giống | **Giống** |
| **Tab Cài đặt** | `caiDat()` (Sheet) | `caiDat()` (Sheet) + mục `⚡ Cài đặt D1 (bản thử)` (bổ sung đợt A, admin) | **Khác** – mục D1 chỉ admin xem thêm, không đụng Sheet gốc |
| **Tab Thông báo sự kiện** | `dsSuKien()` | Giống | **Giống** |
| **Tab Nhật ký sửa** | `nhatKySua()` | Giống | **Giống** |
| **Phân quyền** | admin / QL / tc; QL không thấy Lương + Nhân sự (nếu không cấp) | Giống | **Giống** (SHIM giữ nguyên google.script.run) |
| **Dòng phiên bản** | `CC 01/11c` ở trên cùng | `CC 01/11c` ở trên cùng | **Giống** |
| **Giữ đăng nhập** | sessionStorage (đóng tab là mất) | localStorage 12h (CC 01/11a) | **Khác** – chỉ CF có nhớ 12h (anh Bảo yêu cầu từ Việc 4) |

## Tốc độ

Đo bằng `curl -o /dev/null -w` (chỉ tải HTML, không qua đăng nhập; thực tế đăng nhập + render tab cần thử bằng điện thoại thật):

| Hạng mục | Cũ (AS /exec) | Mới (CF /quanlychamcong-thu) | Chênh |
|---|---|---|---|
| Tải HTML lần đầu | ~2.5s (AS lạnh) · ~1.5s (nóng) | **~0.4s** (edge CF) | ~1–2s nhanh hơn |
| HTML size | ~200 KB | **200 KB** | giống |
| API call (qua Worker → AS) | ~0.6–1.0s | **~0.7–1.1s** | ngang (có thêm 1 hop worker nhẹ) |

Đo đầy đủ "đăng nhập + từng tab × 10 lần" cần người thật mở điện thoại / Chrome DevTools. Em sẽ bổ sung sau khi anh / QL thử.

## Rủi ro

1. **Trang chép nguyên qua CF, SHIM chuyển `google.script.run` → fetch Worker → AS**: về chức năng y hệt. Nguy cơ KHÁC: SHIM có bug trong vài tình huống hiếm (gọi fn tên lạ không có trong `ALLOW_QL`).
2. **Phân quyền**: cả 2 trang dùng cùng `caiDat()` / `dangNhap()` → cùng kết quả.
3. **Dữ liệu**: KHÔNG đụng Sheet. Mọi ghi (duyệt, sửa, xoá) đều qua Apps Script giống trang cũ.
4. **Phần "⚡ Cài đặt D1 (bản thử)"** (mục duy nhất KHÁC) chỉ admin xem; thao tác đổi khoá D1 chỉ ảnh hưởng CaiDat D1, Sheet không đụng.

## Thao tác ghi (test an toàn)

Theo lệnh anh: không test ghi trên dữ liệu thật. Em dùng mã thử PV-TEST (đã tạo `NV-TEST` cho test SĐT; sẽ thêm `PV-TEST` cho test ghi trang QL ở bước kế).

## Việc tiếp (chờ anh OK)

1. Anh / QL mở link mới `https://ncafe-chamcong.dangbao-mt.workers.dev/quanlychamcong-thu` trên điện thoại thật ở 1 quán, đăng nhập, xem từng tab, so với trang cũ.
2. Anh xác nhận: Giống? Chênh gì? Lệch thì sửa.
3. Nếu OK → tạo PV-TEST + chạy test ghi (duyệt, sửa giờ, xoá) rồi dọn theo cờ TEST.
4. Nếu OK tiếp → chuyển `caphemuoihue.com/quanlychamcong` sang trỏ sang CF (ngoài giờ cao điểm). Trang cũ giữ dự phòng 7 ngày.

**Chưa đụng link chính `/quanlychamcong`.**
