# Sổ cập nhật – Ncafe Chấm Công

Mỗi bản 1 khối, bản mới nhất ở ĐẦU. Luật đặt tên: CLAUDE.md luật 0.

---

## CC 01/11a – deploy 1/11 09:15

**Lỗi + nguyên nhân**:
- Trang QR trắng từ ~7:30 ở 5 quán (iPhone Safari + Zalo). Nguyên nhân: D1 `qrNhanVien` port cấu trúc KHÁC AS cũ (thiếu `MaNV, Ten, next, lich, cas, nn, lyDo, dang`) → `r.cas.map()` crash JS.
- Màn hình chấm thiếu ô 4 số cuối SĐT (bản cũ nhiều app có: `LichCuaToi.html`, `GioCong.html`, `KhaoSat.html` dùng `ncafe_sdt4`).
- Danh sách ca D1 chỉ 5 ca (bản cũ 11 ca: PT1-4, FT1-4, FT10-12).
- Hiện "Đã lấy vị trí…" làm NV biết đang kiểm vị trí (CLAUDE.md luật 5 yêu cầu ẩn).
- 10 record TEST sót ở Sheet T11 (do em test chấm thử bằng mã thật 101/102/202/203/204 lúc 07:27 + 07:43).

**Đã sửa**:
- `d1.js qrNhanVien` port đúng cấu trúc AS: thêm `MaNV, Ten, next, lich=[], cas, nn, lyDo, dang`.
- `getCasChoQuan`: lọc Ca D1 theo `CoSo='ALL'` hoặc chứa MaCS.
- Backend `qrDangKySdt` (cách A): NV chưa có SĐT nhập 10 số lần đầu → lưu D1 + đánh dấu `SdtCho='Có'` + waitUntil Sheet; QL duyệt sau.
- `kiemSdt4`: nếu SDT trống → trả `canNhapSdt:true`; nếu có → check 4 số cuối; sai 5 lần/5min/device → khoá 5 phút + Telegram admin (TG_ADMIN_IDS).
- QR.html: màn hình đầu Mã + 4 số cuối SĐT (••••, bàn phím số, nút Tiếp tục chỉ sáng khi đủ, nhớ localStorage, "Không phải tôi"). Màn hình thứ hai "Đăng ký SĐT" cho NV chưa có.
- QR.html ẩn text "Đang/Đã lấy vị trí…" (chỉ hiện khi có lỗi vị trí để NV bật quyền).
- D1 thêm 6 ca thiếu (PT4, FT3, FT4, FT10, FT11, FT12) + chỉnh tên 5 ca sẵn cho khớp bản cũ.
- Thêm cột `NhanVien.SdtCho` để QL biết SĐT nào NV đăng ký lần đầu, chờ duyệt.
- Thêm cột `ThietBi.KhoaDen` cho rate-limit sdt4.
- Chép SDT 31/70 NV từ Sheet sang D1.
- Fn Apps Script mới `xoaLuotTheoID` (API_KEY auth): xoá record Sheet test theo ID.
- Xoá 10 record TEST ở Sheet (ID 072729/072730/072731/072733/072734 + 074357/074358/074359/074400/074402 – các mã 101/102/202/203/204).

**Tính năng mới**:
- Ô 4 số cuối SĐT trên QR (cho NV đã có SDT).
- Đăng ký SĐT lần đầu cách A (NV chưa có SĐT, 39 NV).
- Chống 5 lần sai sdt4 → khoá 5 phút máy + báo Telegram admin.
- Fn backend `qrDangKySdt` + `qrDangKySdtBackfill` (lưu Sheet).
- Fn `xoaLuotTheoID` cho CF xoá dấu test an toàn.
- 11 ca đồng bộ bản cũ (bao gồm ca "BV" FT10 06:30–17:00).

**Giữ nguyên**:
- Cấu trúc Sheet, cách tính lương AS, khoá sổ T10, QR mã in ở quầy, phân quyền NV/QL/admin.
- Luật B (D1 không đọc lịch Xếp lịch), fallback 5s về đường cũ.
- Cài đặt 72 khoá CaiDat D1 giá trị thực.

**Test**:
- cc_test 152/0, d1.test 17/0, luong.test 7/0 = **176/0 bài**.
- 70 mã × 5 quán = **350/350** đạt (`/tmp/tra_70_result.json`).
- Mô phỏng 100.000 lượt ca biên = 0 lỗi.
- SĐT cách A: test TEST A1-A7 (NV-TEST, không mã thật).
- Chưa test iPhone/Zalo thật.

**Rollback**:
- Worker: version trước `715c6915` (trước UI SĐT).
- Apps Script: `clasp redeploy AKfycbyx_…FztzoFXW -V 132 -d "CC 30/10d (quay lại)"`.

**Mã bản deploy**:
- Worker: `a6e4ab17` (`https://ncafe-chamcong.dangbao-mt.workers.dev`).
- Apps Script: @133 (bản triển khai chính `AKfycbyx_…FztzoFXW`).
- Git tag: `CC-01-11a`.

**Anh cần làm**:
- Thử iPhone/Zalo thật ở 5 quán, nhập mã + 4 số cuối SĐT → chấm được chưa.
- Đổi `KIEM_SDT4='Có'` khi muốn bắt buộc; hiện `KIEM_SDT4='Không'` (mặc định) → chưa bắt.
- Enable R2 Cloudflare dashboard (ảnh chưa lưu).

---

(Mẫu khối cho bản sau)
