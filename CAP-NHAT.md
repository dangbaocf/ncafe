# Sổ cập nhật – Ncafe Chấm Công

Mỗi bản 1 khối, bản mới nhất ở ĐẦU. Luật đặt tên: CLAUDE.md luật 0.

---

## CC 01/11c – deploy 1/11 11:55

**Sửa + Mới**:
- Thêm route `/quanlychamcong-thu` trỏ sang `QuanLy.html` nhúng CF (bước 1 Chuyển trang QL lên CF – Loại 1 Nguyên trạng).
- Vẫn giữ `/quan-ly` route cũ, 2 route cùng content.
- `caphemuoihue.com/quanlychamcong` CHƯA đụng, trang cũ (Apps Script) giữ nguyên chạy.

**Giữ nguyên**: giao diện, tab, nút, chữ, dữ liệu, phân quyền. Chỉ chép nguyên, không viết lại logic.

**Test**: curl `/quanlychamcong-thu` → HTTP 200, 200KB, ~0.4s. Chưa test đăng nhập + từng tab bằng điện thoại thật.

**Bằng chứng**: `DOI-CHIEU-QL-01-11.md` – bảng Chỗ|Cũ|Mới|Giống/Khác (1 KHÁC: mục "⚡ Cài đặt D1 bản thử" chỉ admin xem thêm, không đụng Sheet).

**Rollback**: Worker version trước `4196f4ce` (bỏ route alias) · Apps Script giữ @135 CC 01/11b (có xnTuChoi).

**Mã bản**: Worker `d0c76943` · Apps Script @136 · git tag `CC-01-11c`.

**Anh cần làm**: Mở link thử `https://ncafe-chamcong.dangbao-mt.workers.dev/quanlychamcong-thu` trên điện thoại thật, đăng nhập, xem từng tab so với trang cũ. KHÔNG đổi `/quanlychamcong` cho tới khi anh OK.

---

## CC 01/11b – deploy 1/11 11:50

**Lỗi + nguyên nhân**:
- Thiếu nút "Từ chối" tại dòng tab Xác nhận giờ. Trước đó chỉ có "Duyệt" + "Sửa" (trong Sửa có "Xoá lượt chấm nhầm" admin). Khi QL muốn từ chối (NV khai sai, không có mặt) → phải "Sửa" + ghi lý do → không trực quan.

**Đã sửa**:
- `XacNhan.gs` thêm fn `xnTuChoi(id, lyDo)`: bắt lý do, ghi `TrangThai='Từ chối'` + `GioTinh=0` + `LyDoSua` + `Cach='Từ chối'` + `XacNhanBoi` + log `NhatKySua`. Chặn nếu lượt đã duyệt / không thuộc quán QL / tháng đã chốt lương.
- `apiHamQL` thêm `xnTuChoi`.
- `QuanLy.html` thêm nút "✗ Từ chối" bên cạnh "✓ Duyệt" cho mọi lượt `Chờ xác nhận` / `Quên chấm ra`. Bấm → `prompt('Lý do từ chối…')` → gọi `xnTuChoi` không reload trang.

**Tính năng mới**: Nút Từ chối tại dòng tab Xác nhận giờ.

**Giữ nguyên**: nút Duyệt, Sửa, tick duyệt hàng loạt, Xoá (trong Sửa form, chỉ admin), Bỏ duyệt. Cách tính lương, khoá sổ T10, QR cũ.

**Test**: cc_test **153/0** (thêm `XN-TC`), d1 17/0, luong 7/0. Chưa test iPhone thật (chờ anh).

**Rollback**: Worker version trước `155dbbdc` · Apps Script @134 CC 01/11a.

**Mã bản**: Worker `4196f4ce` · Apps Script @135 · git tag `CC-01-11b`.

**Anh cần làm**: Vào tab Xác nhận giờ, bấm "✗ Từ chối" trên 1 lượt Chờ xác nhận, điền lý do, kiểm Nhật ký sửa.

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
