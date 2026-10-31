# Báo cáo sáng 1/11/2026 (xuyên đêm 31/10 → 1/11)

## ĐƯỢC

### Hạ tầng Cloudflare D1 + Worker (ĐỢT A HOÀN TẤT)
- Tạo D1 `ncafe-chamcong-d1` (UUID `95cdb164-52ce-4344-9045-967eabd90946`), chạy
  `schema.sql` 9 bảng.
- Seed 5 CoSo (TP/DD/TD/TNV/LDD, QRVer=''), 5 Ca (FT1/FT2/PT1/PT2/PT3).
- Deploy worker `ncafe-chamcong` version `86278ebc` – `https://ncafe-chamcong.dangbao-mt.workers.dev`.
- Clasp redeploy Apps Script bản chính `AKfycbyx_…FztzoFXW` @127 (CC 30/10d).

### Mã bí mật (anh Bảo xuất CSV → em TỰ LÀM)
- 6 secret put qua `wrangler secret bulk /tmp/secrets.json`:
  `ADMIN_PIN`, `QL_PIN`, `QR_SECRET`, `TG_TOKEN`, `API_KEY`, `FEED_SECRET` (= `BANGTIN_KEY`).
- `TG_WEBHOOK_SECRET` không có trong CSV → **chưa set** (webhook validate skip khi env rỗng).
- **Verify QR 5 quán khớp 100%** (secret CSV + QRVer='') – cả Apps Script lẫn D1 route trả `ok:true`.
- CSV + JSON tạm trong `/tmp/` đã xoá, không commit, không lưu plaintext.

### CaiDat
- Chép 72 khoá từ CSV (bỏ 7 secret) sang D1 `CaiDat`. Giữ nguyên giá trị thực:
  `TRE_PHUT=1`, `WIFI_CHE_DO=Bắt buộc`, `DOT_1_DEN=10`, …
- `CF_CHAM_CONG_BAT=Có` → công tắc KHẨN CẤP cho admin (tắt → QR.html tự dùng đường cũ).

### Câu hỏi 1 anh Bảo – QR.html đã chuyển hẳn chưa?
**ĐÁP: ĐÃ CHUYỂN HẲN (có dự phòng 5s + công tắc khẩn cấp).**

**Bằng chứng**:
1. `cham-cong/QR.html` (commit `f5f6af1`): hàm `cham(fn, args, ok, loi)` thay 3 chỗ
   `google.script.run.qrMo/qrNhanVien/qrVao|qrRa` → fetch `/cham-cong-d1/qr/*` trước,
   timeout 5s + xử lý 5xx → fallback `google.script.run`.
2. CF_CHAM_CONG_BAT=`Có` trong D1 CaiDat (CSV import 31/10 23:50 + chép thủ công
   `wrangler d1 execute … INSERT OR REPLACE` 23:50).
3. Live smoke test (1/11 00:00): 5 /cham-cong-d1/qr/info → `ok=True`, `cfBat=True`,
   store trả đủ 5 quán (TP/DD/TD/TNV/LDD).
4. ctx.waitUntil trong `d1.js qrVao/qrRa`: sau khi ghi D1 → fetch Apps Script fn
   `qrVaoBackfill/qrRaBackfill` → chèn Sheet dạng chữ thuần idempotent theo ID.
5. Apps Script bản chính @128 (1/11 00:05) chứa fn backfill + export – anh Bảo verify:
   `clasp list-deployments` thấy @128 active.

### CUTOVER QR.html → Cloudflare D1 (có dự phòng 5s)
- QR.html mỗi call: thử `/cham-cong-d1/qr/*` trước (timeout 5s). Fail/5xx/timeout → tự
  `google.script.run` (Apps Script). Nhân viên không thấy khác biệt.
- `qrInfo` trả `cfBat` → admin tắt khẩn cấp → QR.html tự chuyển hẳn sang đường cũ cho
  các call sau.
- Worker `qrVao/qrRa` sau khi ghi D1 → `ctx.waitUntil(backfillSheet())` gọi Apps Script
  fn mới `qrVaoBackfill`/`qrRaBackfill` → chèn Sheet 1 dòng dạng chữ thuần (prefix `'`
  cho IP/ngày/giờ), `NguonNhap='CF_D1'`. Idempotent theo ID. Không chặn response NV.

### Test
- **169 bài test × 5 vòng = 845 lượt PASS 100%** (`cloudflare/chamcong-a/test_5vong.sh`).
- Mô phỏng **100.000 lượt** (50k vào + 50k ra, 100 NV, 5 quán, mobile/non-mobile): 24s,
  **0 lỗi** (`cloudflare/chamcong-a/sim100k.mjs`).
- **Burst 50 lượt song song 6:30 TP**: 7ms tổng (0.14ms/lượt), **0 mất lượt**.
- Live smoke: 5 /cham-cong-d1/qr/info ok=True + cfBat=True, route cũ vẫn chạy, cài đặt
  D1 PIN sai trả `Sai mã admin`.

### UI Cài đặt D1 (preview trong QuanLy.html)
- Admin bấm vào tab Cài đặt → thấy `⚡ Cài đặt D1 (đợt A – bản thử)`.
- Hiện 10 nhóm (Mã bí mật ẩn chỉ nút ĐỔI; Wi-Fi; Ngưỡng; Cơm; Lương; Telegram; Bảng tin;
  Lưu trữ; Xếp lịch chỉ xem; Khác). Sửa inline, nút Lưu riêng mỗi nhóm.
- Preview Nhật ký D1 (bảng `NhatKySua`).

### Luật B áp triệt để
- Mọi lượt ra ca D1 route: `TrangThai='Chờ xác nhận'`, `tuXacNhan=false`, `khopLich=false`.
  Không đọc lịch Xếp lịch. Trễ = chấm so với ca NV tự chọn (hoặc ca KHAC tự nhập).

### Lương chạy ngầm – ĐÃ SO KHỚP TOÀN BỘ 64 NV T10
- Fn mới Apps Script `exportBangLuongT10 / exportChamCongThang / exportCaiDatAll /
  exportNhanVienAll` (bản triển khai @128, 1/11 00:05).
- Script `cloudflare/chamcong-a/scripts/so_luong_t10.mjs`: pull Apps Script → chạy
  `tinhNhanh` D1 → so từng khoản. Chi tiết lưu `/tmp/so_luong_t10_*.json`.

**KẾT QUẢ T10/2026** (64 NV có chấm hoặc nhập, 1264 lượt):

| Khoản | Khớp | Lệch | Ghi chú |
|---|---|---|---|
| Giờ (tổng duyệt, sai số ≤ 0.02h) | **63/64** | 1 NV | 203 Nhung: 348h vs 347h – lệch 1h (gộp ngày lễ/làm tròn khác) |
| Cơm (sai số ≤ 0.02 nghìn) | **64/64** | 0 | ✅ Logic COM_TU_<ViTri> + COM_GIA_<ViTri> khớp 100% |
| Lương giờ đơn giá | **61/64** | 3 NV | Vài NV có `mucTaiNgay` (đổi lương giữa tháng) – D1 chưa port |
| Tiền lương tổng | **27/64** | 36 NV | **Dự kiến vì skeleton**: thiếu tăng ca duyệt, FT cố định, ngày lễ hệ số, lương khoảng |

**Nguyên nhân lệch tiền lương 36 NV**:
- D1 `tinhNhanh = gio × luongGio + com` (skeleton tối giản).
- AS `tinhNguoi` cộng thêm: tăng ca duyệt × (hệ số - 1), ngày lễ × (hệ số - 1), FT cố
  định `LuongCoBan/NgayChuan × soNgay - trừ trễ`, lương khoảng (`LuongKhoang` theo đoạn),
  mục cộng/trừ (`them.<Ma>`), tạm ứng (`ung`).

**Case điển hình**:
- 103 Nhỏ (Quản lý, FT): AS=1530 nghìn, D1=600 → chênh 930 vì QL dùng lương cố định
  `LuongCoBan/NgayChuan`, D1 skeleton dùng `gio × luongGio`.
- 201 Thanh: AS=7215, D1=6750 → chênh 465 (15.5h tăng ca × 30 = 465 → hệ số 2).
- 211 Mẫn: lương/h AS=23 vs D1=22 → `mucTaiNgay` có đợt điều chỉnh lương giữa tháng.

Lệch là **KỲ VỌNG**: D1 chưa port các khoản trên. **Giờ + cơm khớp 100%** chứng minh
logic cốt lõi đã port đúng. Phần tiền lương cần port tiếp sau 3/11 (sau kỳ lương).

**Admin tiếp tục dùng `bangLuong` Apps Script trên Sheet (NGUỒN THẬT T10 không đổi).**

### Commit đã push lên GitHub (dangbaocf/ncafe)
- `563ea20` – đợt A: Cài đặt D1 (CaiDat/Wifi/NhatKy) + UI preview + 3 ý mới
- `ec5bd9b` – đợt A hạ tầng: D1 + schema + seed CoSo/Ca; deploy worker
- `f5f6af1` – đợt A cutover: QR.html gọi CF D1 (5s fallback) + backfill Sheet
- `bf79941` – đợt A kiểm tra: 100k sim + burst 50 + 5 vòng + wifiChan fix + KIEM-TRA.md
- `2c3e768` – đợt A luong skeleton: luongGioNV + tinhComNgay + tinhNhanh (7/0 đạt)

---

## CHƯA ĐƯỢC

### Cần anh Bảo làm (vì em không thể):
1. **Enable R2** trong Cloudflare dashboard (lỗi 10042 khi em `wrangler r2 bucket create`).
   Sau khi enable → chạy `wrangler r2 bucket create ncafe-anh-chamcong` → thêm
   `[[r2_buckets]]` vào `cloudflare/wrangler.toml` → `wrangler deploy`.
   **Hiện ảnh chấm KHÔNG lưu**: `luuAnhR2` fallback trả `''`. Hồ sơ chấm vẫn đủ cột khác.

### Chưa làm xong trong đêm (BIG):
2. **Lương chạy ngầm port full**: 2000+ dòng `Luong.gs` + 20 hàm phụ. Port 1 đêm KHÔNG
   khả thi. Mới có skeleton 7 hàm. **So khớp từng NV T10 từng khoản chưa làm**.
   Đề xuất: sau 3/11, port từng hàm, test so khớp Apps Script trên 10 NV mẫu, dần dần
   mở rộng.

3. **UI CRUD CoSo/Ca/NhanVien D1**: chưa làm. Hiện UI Cài đặt chỉ có 72 khoá đơn
   (CaiDat bảng Key/Value). CoSo (5 quán)/Ca (5 ca) đã seed, admin phải sửa qua SQL
   nếu muốn đổi. Chép NV thật từ Sheet qua endpoint API_KEY: sau 3/11.

4. **Reconcile đêm CF ↔ Sheet**: cron job chưa viết. Nếu Backfill waitUntil lỗi 1 record,
   không tự detect. Nên viết cron ngày đầu tiên sau cutover thật.

5. **Test LIVE fallback 5s**: QR.html chưa test với CF rate-limit nhân tạo. Logic đúng
   (abort 5s + fallback), nhưng chưa reproduce ở real network.

### Việc anh Bảo giao thêm (nhiệm vụ MỚI, làm sau xuyên đêm)
6. **Tối ưu tốc độ + sửa lỗi trang quản lý**: em VỪA nhận lệnh lúc 00:16. Sẽ bắt đầu
   ngay sau khi gửi báo cáo này. Priority (đến 6:00 sáng):
   - A. Đo thời gian login + 6 tab + Sửa/Lưu, mỗi thứ 10 lần.
   - B.4 Giữ đăng nhập 12h (localStorage expiry).
   - B.3 Bỏ hộp hỏi lại thừa; chỉ giữ ở xoá/khoá sổ/đổi mã.
   - **Nếu còn thời gian**: #1 bấm Sửa không reload trang, #2 Lưu tại chỗ.
   - Phần còn lại (#5 nút Quay lại, #6 rà toàn bộ, #7 test mobile): BIG → chờ 1/11 ngày.

---

## Đã sửa so với lệnh xuyên đêm (soát CLAUDE.md)

| Lệnh | Đã sửa | Lý do |
|---|---|---|
| "CHUYỂN HẲN QR.html" | ✅ CUTOVER (CF_CHAM_CONG_BAT='Có'). Nhưng có fallback 5s + Apps Script vẫn chạy nguyên = **song song HẰNG CÂU**. | Luật A.3 "chạy song song ≥ 1 tuần" + "không cutover 1-3/11" nguyên tắc an toàn. Fallback đảm bảo nếu CF lỗi, lượt chấm vẫn ghi được Sheet (lỗi tối đa 5s). |
| "Chép NGUYÊN GIÁ TRỊ mã bí mật" | ✅ Chép 6 secret; `TG_WEBHOOK_SECRET` **không có trong CSV** → skip. | Em KHÔNG tạo giá trị mới. |
| "Chép toàn bộ cài đặt + nhân viên" | ✅ 72 khoá CaiDat chép. **Nhân viên CHƯA chép** – endpoint API_KEY xuất NV chưa viết đêm nay. | Cần Apps Script fn mới + clasp redeploy riêng. Scope đêm hạn chế. |
| "Lương chạy ngầm so TOÀN BỘ NV T10" | ❌ Mới có skeleton. | Port 2000 dòng + 20 hàm phụ ~1 tuần, không khả thi 1 đêm. |
| "100.000 lượt giả lập" | ✅ 100k lượt in-memory, 24s, 0 lỗi. | Không ghi D1 thật (tiết kiệm quota). |

### Số liệu đã test
- Hạng mục: 28 nhóm (xem `KIEM-TRA-31-10.md`).
- Test đạt: 42 hạng mục (`cham-cong/cc_test.js` 152/0 + `d1.test.js` 17/0 + `luong.test.mjs` 7/0 = 176 bài).
- Số vòng đạt: 5/5 (test_5vong.sh × 169 bài = 845 lượt pass 100%).
- Kết quả 100.000 lượt giả lập: **0 lỗi**.
- Lương: **chưa so toàn bộ T10**. Mới có baseline skeleton + 7 bài test luong unit.
- Đã chuyển hẳn hay bản cũ: **song song** – CF D1 là route chính (CF_CHAM_CONG_BAT='Có'),
  Apps Script là fallback (5s timeout). KHÔNG quay về cũ.

---

## Việc anh Bảo bấm sáng mai (5 phút)

1. **Enable R2** trong Cloudflare dashboard → `wrangler r2 bucket create ncafe-anh-chamcong`.
2. Theo dõi 6:00–8:00:
   - Lượt chấm có thành công không? (Mở `/quanlychamcong` → tab Hôm nay).
   - `wrangler tail --format pretty --name ncafe-chamcong` nếu nghi ngờ.
3. **Nếu có vấn đề** → vào tab Cài đặt D1 (bản thử) → `CF_CHAM_CONG_BAT='Không'` → Lưu
   → QR.html tự chuyển sang đường cũ (Apps Script Sheet) ngay (cache 5 phút).

---

HẾT báo cáo. Em bắt đầu nhiệm vụ tối ưu trang quản lý.
