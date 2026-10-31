# Đợt A – Chuyển lượt chấm sang Cloudflare D1

Trạng thái: **code draft, chưa deploy**. Chờ GitHub + sau 3/11 mới deploy.

## Phạm vi (áp luật B)
Worker nhận quét QR → ghi D1 → trả NV 1–2s → nền gửi sang Google Sheet (chữ thuần).
- Port TOÀN BỘ `qrVao` + `qrRa` + `canhBao` + `wifiChan_` + Telegram + bảng tin hook + lưu ảnh (R2).
- **KHÔNG port** phần khớp/đọc lịch: không `coLichCa`, không `xnKhop`, không `TU_DUYET_KHOP`. Trễ = chấm vs giờ ca NV tự chọn (ca phát sinh so với giờ tự nhập).
- Duyệt giờ + lương vẫn ở Apps Script + Sheet. Sheet lưu bản copy chữ thuần, không bị tự đổi kiểu.
- Chạy SONG SONG ≥ 1 tuần: Worker D1 là primary; Apps Script `qrVao`/`qrRa` cũ chạy nền để backfill Sheet.

### Cài đặt chuyển SANG D1 trong đợt A (chốt 31/10 tối – GỘP TOÀN BỘ):
- **Wi-Fi**: `WifiQuan` (CRUD IP từng quán), `WIFI_CHE_DO`, `WIFI_CHO_XAC_NHAN`, `WIFI_CHO_XAC_NHAN_NV`, `WIFI_CHO_XAC_NHAN_GIO` (luật tự nhận IP: 2 NV / 2 giờ, chỉnh được), `WIFI_TU_MAT_MANG`, `WIFI_TU_THEM`.
- **Ca**: bảng `Ca` (giờ BD/KT theo quán).
- **Ngưỡng**: `NHAC_NHO_PHUT`, `TRU_GIO_TRE_PHUT`, `TRE_PHUT`, `TRE_XEM_LAI_PHUT`, `VE_SOM_PHUT`, `RA_MUON_PHUT`, `LECH_PHUT`, `LAM_TRON_PHUT`, `TANG_CA_TU_PHUT`, `GIO_BAT_THUONG_NGAY`, `GIO_BAT_THUONG_THANG`, `QR_BAN_KINH`, `GIO_DEM_TU`.
- **Cơm**: `COM_TU_*` + `COM_GIA_*` (theo vị trí), `COM_FT_LUON`, `COM_NGAY_GAY`.
- **Lương**: `LUONG_*` (đơn giá theo vị trí), `GIO_CHUAN_NGAY`, `NGAY_CHUAN`, `HE_SO_TANG_CA`, `KY_TANG_LUONG_THANG`, `NGAY_TRA_LUONG`, `DOT_1_DEN`, `DOT_2_DEN`.
- **Telegram**: `TG_CHAT_TP/DD/TD/TNV/LDD`, `TG_CHAT`, `TG_ADMIN_IDS`, `TG_WEBHOOK_SECRET`, `TG_ANH`, `TG_MUC`, `TG_NHAC_CA`, `TG_NHAC_LUC`, `TG_NHAC_SAU_PHUT`, `TG_TONGKET`, `TG_TONGKET_GIO`, `NHAC_DUYET`, `NHAC_DUYET_GIO`, `NHAC_DUYET_DA`.
- **Nhân viên**: toàn bộ hồ sơ bảng `NhanVien` (MaNV, Ten, ViTri, ChucVu, Loai, CoSoChinh, SDT, TrangThai, LuongGio, LuongCoBan, KieuLuong, NgayVao, NgaySinh, ViTriKiem, SinhVien, TangCaDuoc, CoDinh, BietDanh).
- **CoSo**: bảng `CoSo` (MaCS, TenCS, GioMo, GioDong, ViDo, KinhDo, BanKinh, QRVer).
- **Phân quyền**: `PHAN_QUYEN` (tab quyền QL).
- **Phản hồi**: `PHAN_HOI_NGAY`, `DE_XUAT_GIO`.
- **Lưu trữ/sao lưu**: `LUU_TRU_SAU_NGAY`, `DRIVE_FOLDER_ID`, `LUU_TRU_FOLDER_ID`, `SAO_LUU_FOLDER_ID`.
- **Khác**: `DOC_LICH` (dù không dùng theo luật B, giữ cấu hình), `TU_DUYET_KHOP` (set 'Không' theo luật B), `BANGTIN_URL`, `BANGTIN_KEY`, `CF_URL`, `LICH_SHEET_ID`, `XEP_LICH_URL`.

### Mã bí mật – chép NGUYÊN giá trị cũ (KHÔNG đổi) sang `wrangler secret put` trong đợt A:
- `QR_SECRET` (giữ nguyên → QR cũ dùng tiếp), `QRVer` (lưu D1 CoSo, không secret).
- `TG_TOKEN` (secret).
- `FEED_SECRET` (secret, trùng BANGTIN_KEY – chọn 1 nguồn).
- `API_KEY` (secret, đã có trong worker ncafe-chamcong).
- `ADMIN_PIN`, `QL_PIN` (secret, hoặc hashed trong D1 CaiDat với cột `IsSecret=1` ẩn khỏi UI).

Chức năng **"ĐỔI mã"** (sinh mã mới) nằm ở màn hình Cài đặt, có cảnh báo + bắt gõ XÁC NHẬN. KHÔNG đổi trong đợt A.

### Tạm vẫn ở Sheet (chuyển đợt sau khi anh Bảo báo):
- `ChamCong` row: cột `TrangThai` + `GioTinh` + `XacNhanBoi` + `XacNhanLuc` + `Cach` (phần duyệt).
- `BangLuong`, `TamUng`, `DuyetDot`, `ChotThang`, `NhatKySua` (duyệt + lương).
- Apps Script `xnDuyet`, `bangLuong`, `tinhNguoi`, `phieuLuong` giữ nguyên công thức.
- Worker ghi bản sao `ChamCong` sang Sheet dạng CHỮ THUẦN để Apps Script dùng.

## Hạ tầng cần tạo (sau khi có GitHub, trước khi deploy)
```bash
# D1 (database mới, không đụng ncafe-bangtin)
wrangler d1 create ncafe-chamcong-d1
# cập nhật wrangler.toml với database_id trả về
wrangler d1 execute ncafe-chamcong-d1 --file=cloudflare/chamcong-a/schema.sql --remote

# R2 (ảnh chấm)
wrangler r2 bucket create ncafe-anh-chamcong

# Secrets (em chạy, không in giá trị ra terminal)
wrangler secret put QR_SECRET      --name ncafe-chamcong
wrangler secret put TG_TOKEN       --name ncafe-chamcong
wrangler secret put FEED_SECRET    --name ncafe-chamcong
# API_KEY đã có sẵn
```

## Route Worker mới (thêm vào `cloudflare/worker.js`)
- `POST /cham-cong-d1/qr/info` – thay `qrInfo`.
- `POST /cham-cong-d1/qr/mo` – thay `qrMo` + `qrNhanVien`.
- `POST /cham-cong-d1/qr/vao` – thay `qrVao`.
- `POST /cham-cong-d1/qr/ra` – thay `qrRa`.
- `POST /cham-cong-d1/gio-cong` – thay `gioCongCuaToi`.
- `POST /cham-cong-d1/lich-cua-toi` – thay `lichCuaToi` (bỏ phần lịch Xếp lịch; chỉ hiện ca đã làm + ca đang mở).

Route cũ `/cham-cong/api` giữ nguyên để fallback.

## QR.html (trang quét) – chạy song song
Mỗi lần chấm vào/ra:
1. Gọi `/cham-cong-d1/qr/vao` (Worker D1) – đợi, trả NV OK/lỗi.
2. Trong `ctx.waitUntil` ở Worker: gọi Apps Script `qrVao` để Apps Script ghi Sheet (chữ thuần). Lỗi → log vào `D1.ChamCong.SyncedSheet=2`.

## Reconcile đêm (cron Worker)
- 02:00 mỗi đêm:
  - D1 có mà Sheet thiếu (SyncedSheet=0 hoặc 2) → gọi Apps Script bù.
  - Sheet có mà D1 thiếu → báo admin bất thường (NV lạ sửa Sheet tay? trong giai đoạn chạy song song, Sheet vẫn là nguồn hợp lệ cho tới cutover).
  - Gửi tin Telegram admin: "✅ Đồng bộ CF↔Sheet OK" hoặc list lệch.

## Ảnh chấm công sang R2
- Lưu key: `anh/YYYY/MM/DD/<ID>-vao.jpg`, `anh/YYYY/MM/DD/<ID>-ra.jpg`.
- Worker ghi R2 trong lúc chấm (nhanh hơn Drive).
- Trong D1 lưu key; trong Sheet lưu URL public (R2 presigned hoặc proxy qua Worker).
- Giữ Drive 6 tháng ảnh cũ, không copy sang R2 (ảnh cũ xem qua Drive link cũ).

## Chữ thuần khi gửi Sheet
Cột cần prefix `'`:
- `MaNV` (có thể có số 0 đầu).
- `Ngay` (yyyy-mm-dd, tránh Sheet đổi thành ngày).
- `CaBD`, `CaKT`, `Vao`, `Ra`, `KhaiTu`, `KhaiDen`, `CoMat` (HH:mm, tránh đổi thành giờ số).
- `IP` (14.254.129.209, tránh đổi thành số).
- `SDT` (nếu có).
- Số thập phân Việt (7,5) không prefix – để Sheet nhận số OK.

## Test lộ trình
- Unit (cc_test.js style): mock Worker fetch, test logic migrate.
- Integration: deploy preview Worker (bind D1 preview), quét QR giả bằng curl, kiểm cả 2 bên có row.
- Load: 10 request/giây × 1 phút (mô phỏng 06:30), kiểm latency.
- Cutover test: tuần song song, mỗi đêm reconcile 0 lệch.

## Rollback
Nếu D1 ghi hỏng:
- QR.html đổi về gọi `/cham-cong/api` (Apps Script) – 1 lệnh deploy Worker.
- D1 giữ lại 30 ngày Time Travel.
- Sheet là nguồn hợp lệ trong tuần chạy song song → không mất gì.

## Lịch deploy (dự kiến)
1. **1–3/11**: code locally, test unit. Không deploy.
2. **4/11**: deploy D1 + Worker route mới (`/cham-cong-d1/*`), QR.html vẫn gọi route cũ. Chạy song song NGẦM (Worker ghi D1 khi NV chấm vẫn qua route cũ – wait no, cần gọi route mới mới ghi D1). Thực tế bước này cần đổi QR.html gọi route mới.
3. **4–10/11**: 1 tuần chạy song song, reconcile đêm.
4. **~11/11**: nếu 7 ngày liên tiếp 0 lệch, cutover (QR.html gọi route mới làm primary, Apps Script retire cho chấm).
5. **Sau cutover**: duyệt giờ + lương vẫn ở Apps Script+Sheet. Chuyển duyệt sang Cloudflare là đợt tiếp sau.
