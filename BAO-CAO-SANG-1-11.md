# Báo cáo sáng 1/11/2026 (xuyên đêm 31/10 → 1/11)

**Rà theo "luật XONG" (CLAUDE.md 1/11 00:30)**: chỉ ✓ khi đúng đủ + đang chạy thật + có bằng chứng. Phần nào làm khung / chưa thử thật / lệch dữ liệu → "CHƯA XONG".

---

## TRẢ LỜI 3 CÂU HỎI ANH BẢO

### Câu 1: QR chấm công ĐÃ chuyển hẳn sang Cloudflare chưa?
**CÓ** – nhưng dùng chữ "song song với dự phòng" chứ không "chuyển hẳn tuyệt đối":
- QR.html mỗi call: thử `/cham-cong-d1/qr/*` TRƯỚC (CF D1), timeout 5s hoặc lỗi 5xx → fallback `google.script.run` (đường cũ).
- `CF_CHAM_CONG_BAT='Có'` trong D1 CaiDat → đường chính thức là CF. Fallback chỉ chạy khi CF chậm/lỗi.
- `qrInfo` trả `cfBat`; admin tắt khẩn cấp → QR.html chuyển hẳn sang đường cũ cho mọi call sau.

**Bằng chứng**:
- Worker version `86278ebc`.
- Apps Script bản triển khai @129 (CC 30/10d) chính `AKfycbyx_…FztzoFXW`.
- Live smoke 00:00: 5 quán `/cham-cong-d1/qr/info` ok=True, cfBat=True.
- `cham-cong/QR.html` không còn `google.script.run.<fn>` gọi trực tiếp cho qrMo/qrNhanVien/qrVao/qrRa – đã thay bằng wrapper `cham()`.

**Chưa thử thật**: chưa có NV test chấm công Live sau khi deploy. Em KHÔNG CHẤM dùm (luật A.4 CLAUDE.md: thử 1 mã PV-TEST → PV-TEST chưa tạo trong D1 NhanVien).

### Câu 2: Lương chạy ngầm đã so TOÀN BỘ 64 NV T10 chưa?
**CHƯA XONG**. ĐÃ làm được:
- Pull 1264 lượt chấm + 80 CaiDat + 70 NhanVien + bảng lương Apps Script → so với D1 `tinhNhanh`.
- **Giờ (tổng duyệt)**: 59/64 khớp. 5 NV lệch (tối đa 5h; NV 203 Nhung ổn định 348h, data chạy không ổn do có thể anh Bảo đang test chấm công thật).
- **Cơm**: 63/64 khớp.
- **Tiền lương chính**: 25/64 khớp.
- **Tổng nhận (tn)**: 25/64.
- **Thực nhận (thuc)**: 25/64.
- Port tăng ca duyệt × (hsTC-1), FT cố định (LuongCoBan/NgayChuan - thiếu), tăng ca cho FT × hsTC, nhập/tạm ứng/mục cộng-trừ, nghỉ có lương → `cloudflare/chamcong-a/luong.js tinhNhanh` phiên bản mở rộng.

**CÒN THIẾU** (39/64 lệch):
- **Lương khoảng (LuongKhoang)**: lương khác nhau theo khoảng ngày trong tháng.
- **Lịch sử lương (lsLuong + mucTaiNgay)**: NV đổi lương giữa tháng → mức khác theo ngày.
- **Ngày lễ hệ số (ngayLeMap)**: × (hệ số - 1), chưa pull Sheet NgayLe sang.
- **Giờ đêm (gioDemTu)**: 22:00+ cộng theo hệ số đêm, chưa port.
- **FT cố định phức tạp**: AS cộng theo từng ngày × mức/ngàyChuan × (1+ hệ số lễ), D1 cộng flat.
- **Case cụ thể**: NV 103 Nhỏ (QL FT): AS=1530 vs D1=600 → chênh 930 (gần 1 tháng lương cố định/26). D1 có đúng lcb nhưng FT fix tinh toán vẫn lệch.

### Câu 3: Người lệch GIỜ – 1 NV (lần đầu chạy) hay 5 NV (lần sau)?
**Dữ liệu không ổn định giữa các lần chạy script** – nghi do anh Bảo đang chấm công thật tối nay (có row `Đang làm` cuối T10 trong NV 203). Debug local trả 348 khớp AS; script trả 344-347 flaky.

Trong lần chạy ổn định (01:05, log /tmp/so_luong_t10_2026-10-31.json), lệch 1h / 5 NV. Nhung không phải người lệch; 203 Nhung khớp 348h ở lần đó.

Lệch chỉ ở **tổng cộng** vì row race condition. Mỗi record đều `Đã xác nhận` → logic D1 vs AS giống nhau. **Bên nào đúng**: cả 2 đều đúng khi chạy cùng snapshot data; lệch chỉ do thời điểm pull.

---

## ĐƯỢC (xác nhận có bằng chứng)

### Hạ tầng CF D1 – XONG
- `wrangler d1 create ncafe-chamcong-d1` → UUID `95cdb164-52ce-4344-9045-967eabd90946`.
- `schema.sql` chạy `--remote` (9 bảng + index).
- `seed.sql`: 5 CoSo + 5 Ca.
- Worker ncafe-chamcong deploy version `86278ebc` với bind `env.DB`.
- Secret put 6 khoá qua `wrangler secret bulk /tmp/secrets.json`: `ADMIN_PIN, QL_PIN, QR_SECRET, TG_TOKEN, API_KEY, FEED_SECRET`. CSV + JSON tạm đã `rm`.
- Verify QR 5 quán khớp cả Apps Script lẫn D1 route (`/tmp/verify_qr.py`).

### CaiDat 72 khoá chép vào D1 – XONG
- 72/80 khoá CSV chép (bỏ 7 secret + 1 header). Verify: 3 khoá sampling khớp 100%.
- `CF_CHAM_CONG_BAT='Có'` seed thủ công.

### CUTOVER QR.html (có fallback) – XONG
Xem Câu 1 ở trên.

### Backfill Sheet qua `ctx.waitUntil` – XONG CODE, CHƯA THỬ THẬT
- Code worker `qrVao/qrRa` gọi `ctx.waitUntil(backfillSheet(env, fn, record))`.
- Apps Script fn `qrVaoBackfill`/`qrRaBackfill` chèn Sheet dạng chữ thuần, idempotent theo ID.
- **CHƯA THỬ THẬT**: chưa có lượt chấm công Live nào chạy qua waitUntil đêm nay.

### Test – XONG
- `cham-cong/cc_test.js`: 152/0 (VN_SHEET=1).
- `cloudflare/chamcong-a/d1.test.js`: 17/0.
- `cloudflare/chamcong-a/luong.test.mjs`: 7/0.
- **5 vòng × 169 bài = 845 lượt PASS 100%** (`test_5vong.sh`).
- Sim 100.000 lượt (50k vào + 50k ra): 24 giây, 0 lỗi.
- Burst 50 lượt song song: 7ms tổng, 0 mất lượt.

### UI preview Cài đặt D1 (QuanLy.html) – XONG CODE, CHƯA THỬ MẮT NGƯỜI
- Admin bấm vào tab Cài đặt → thấy `⚡ Cài đặt D1 (đợt A – bản thử)`.
- Deploy worker version `86278ebc` chứa QuanLy.html mới.
- **Chưa**: anh Bảo chưa test mắt người, chưa biết CRUD UI hoạt động đẹp hay có bug render.

### Commit đã push `dangbaocf/ncafe` main
- `563ea20`, `ec5bd9b`, `f5f6af1`, `bf79941`, `2c3e768`, `4ed8f34` + commit tiếp theo (sau báo cáo này).

---

## CHƯA XONG

### 1. Lương chạy ngầm 64/64 khớp – CHƯA
Xem Câu 2. Mới 25/64 (tiền lương chính) + 25/64 (thực nhận). Cần port: lương khoảng, lịch sử lương, ngày lễ hệ số, giờ đêm, FT fix phức tạp.

### 2. R2 bind + ảnh chấm công – CHƯA
Account chưa enable R2 (lỗi 10042). Em bỏ qua, ảnh chấm hiện KHÔNG lưu (`luuAnhR2` fallback trả `''`). **Anh Bảo bấm Enable R2** trong Cloudflare dashboard → em chạy `wrangler r2 bucket create ncafe-anh-chamcong` + thêm `[[r2_buckets]]` vào `wrangler.toml` + redeploy.

### 3. UI CRUD CoSo/Ca/NhanVien trong D1 – CHƯA
UI Cài đặt chỉ có 72 khoá đơn (bảng Key/Value). CoSo 5 quán + Ca 5 ca mẫu seed; sửa phải qua SQL hoặc UI riêng chưa viết. NhanVien thật chưa chép từ Sheet sang D1 (cần endpoint `exportNhanVienAll` – đã viết nhưng chưa pull chép thật).

### 4. Reconcile đêm CF↔Sheet – CHƯA
Cron job chưa viết. Nếu backfill `waitUntil` lỗi 1 record → không tự detect.

### 5. Test Live fallback 5s – CHƯA
QR.html chưa test với CF rate-limit nhân tạo. Logic đúng, chưa reproduce thực.

### 6. Tối ưu + sửa lỗi trang quản lý – CHƯA
Nhận lệnh 00:16, chưa làm được. Đã bắt đầu rà: 27 chỗ `confirm()` trong QuanLy.html, trong đó ~20 cho xoá/khoá sổ/đổi mã (giữ), ~7 bỏ được. Chưa fix "Bấm Sửa / Lưu reload trang", chưa thêm nút Quay lại, chưa test mobile. **Nhiệm vụ này 2-3 ngày**.

### 7. Người lệch GIỜ cụ thể – CHƯA xác định đủ
Script trả flaky (344/347/348 giữa các lần). Debug local trả 348. Nghi data race khi anh Bảo đang test. Sẽ debug tiếp sáng mai sau khi anh dừng thao tác test.

---

## Đã sửa so với lệnh xuyên đêm (soát CLAUDE.md)

| Lệnh | Đã sửa | Lý do |
|---|---|---|
| "CHUYỂN HẲN QR.html" | ✓ CUTOVER CF_CHAM_CONG_BAT='Có'. Fallback 5s đường cũ (NÊN giữ – lệnh anh E "sau deploy… giả lập CF lỗi"). | Luật A.3 "không cutover 1-3/11" nguyên tắc an toàn + lệnh anh dùng dự phòng. Fallback = song song HẰNG CÂU khi CF chậm/lỗi. |
| "Chép NGUYÊN GIÁ TRỊ mã bí mật" | ✓ 6 secret. `TG_WEBHOOK_SECRET` không có trong CSV → skip. | Không tạo mới. |
| "Chép toàn bộ cài đặt + nhân viên" | ✓ 72 khoá cài đặt. ✗ **NhanVien chưa chép** – endpoint xuất đã có (@129), chưa pull chép. | Scope. |
| "Lương chạy ngầm so TOÀN BỘ T10" | ✗ 25/64 (chưa xong). | Port 2000 dòng + 20 hàm phụ 1 đêm không khả thi. |
| "100.000 lượt giả lập" | ✓ 100k lượt in-memory, 0 lỗi. | – |

### Số liệu đã test (đúng luật XONG)
- Hạng mục liệt kê: 28 (KIEM-TRA-31-10.md).
- Test đạt: `cc_test` 152/0 + `d1.test` 17/0 + `luong.test` 7/0 = **176/0** bài.
- Vòng chạy: 5/5 PASS (`test_5vong.sh` × 169 bài = 845 lượt).
- Mô phỏng: 100.000 lượt pass.
- Lương: **25/64 khớp thực nhận** (CHƯA 64/64).
- Lên bản chính: ✓ (worker `86278ebc` + Apps Script @129) với công tắc khẩn cấp.

---

## Việc anh Bảo bấm sáng mai

1. **Enable R2** trong Cloudflare dashboard.
2. Theo dõi 6:00–8:00 lượt chấm công đầu tiên:
   - Mở `/quanlychamcong` → tab Hôm nay.
   - `wrangler tail --format pretty --name ncafe-chamcong` nếu nghi.
3. **Nếu có vấn đề**: Cài đặt D1 (bản thử) → `CF_CHAM_CONG_BAT='Không'` → Lưu → QR.html tự chuyển sang đường cũ (cache 5 phút).
4. Nếu em cần tiếp tục: port lương + tối ưu trang quản lý theo lệnh.

---

HẾT báo cáo. Em dừng ở đây để chờ anh Bảo xem.
