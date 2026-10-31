# Backup trước khi deploy ĐỢT 1 (30/10/2026)

Ghi lại phiên bản đang chạy TRƯỚC khi em sửa. Nếu bản mới có lỗi → quay lại bằng các lệnh ở cuối file.

## Phiên bản đang chạy (TRƯỚC khi deploy ĐỢT 1)
- **App Chấm công Google Apps Script**:
  - Script ID: `1f1OnkFGnpq02FXZkhFNvbr7KuE_MlpwGvLF-CAco8HfZVoYE-k-VcuuH`
  - Bản triển khai chính: `AKfycbyx_dtu8KSl5sqtHihWyDLmlhoV-Ea9g_MPeMfk7a_gHI6obVgEKXfsCUehFztzoFXW`
  - Phiên bản (version) đang trỏ: **@121** (`CC 30/10a`, 30/10/2026 20:41)
- **Worker `ncafe-chamcong`**:
  - URL: `https://ncafe-chamcong.dangbao-mt.workers.dev`
  - Version ID: `16b99363-acfc-45f8-82e6-d4070d057f56`
  - Deploy lúc: 2026-10-30T05:07:48.106Z (có cập nhật 20:41 cùng mã)
- **Worker `ncafe-bangtin`**:
  - URL: `https://ncafe-bangtin.dangbao-mt.workers.dev`
  - Version ID: `09d733c8-d2a5-4317-b320-97dbf3656b06`
  - Cron: `*/5 * * * *`, D1 binding `DB` → database `ncafe-bangtin` (UUID `c5885d43-8745-4442-a7af-8c1546dc3e1f`)
- **D1 `ncafe-bangtin`**: sao lưu đặt tại `bangtin/backup/bangtin-YYYYMMDD-HHMM.sql` (xem danh sách file dưới).

## Cách quay lại bản cũ (nếu bản mới lỗi)
```bash
# 1. Quay lại Apps Script bản chính về version 121 (giữ nguyên link /exec)
clasp redeploy AKfycbyx_dtu8KSl5sqtHihWyDLmlhoV-Ea9g_MPeMfk7a_gHI6obVgEKXfsCUehFztzoFXW -V 121 -d "ROLLBACK về CC 30/10a"

# 2. Quay lại Worker ncafe-chamcong về version 16b99363
cd /Users/dangbao/Documents/ncafe/cloudflare
wrangler rollback 16b99363-acfc-45f8-82e6-d4070d057f56 --name ncafe-chamcong

# 3. Quay lại Worker ncafe-bangtin về version 09d733c8
cd /Users/dangbao/Documents/ncafe/bangtin
wrangler rollback 09d733c8-d2a5-4317-b320-97dbf3656b06 --name ncafe-bangtin

# 4. Nếu D1 bị thay đổi dữ liệu nhạy cảm (bảng staff), khôi phục từ sao lưu:
cd /Users/dangbao/Documents/ncafe/bangtin
wrangler d1 execute ncafe-bangtin --file=backup/bangtin-<YYYYMMDD-HHMM>.sql --remote
```

## Backup D1 trước UPDATE sinh nhật
Danh sách file sao lưu trong `bangtin/backup/`:
- `bangtin-20261030-2132.sql` – trước UPDATE xoá tên đầy đủ (còn 69 rows có `name` ≠ `short`).

## Sau khi deploy ĐỢT 1 thành công (30/10/2026 22:12)
- Chấm công: **CC 30/10b @122** · triển khai chính giữ nguyên `AKfycbyx_dtu8KSl5sqtH…FztzoFXW`.
- Worker `ncafe-chamcong`: version `70163c23-b470-45ac-a50d-336c1710af05`.
- Worker `ncafe-bangtin`: version `50f18921-60c2-4aaf-a4f5-b8c33feea62e`.
- D1 `ncafe-bangtin.staff`: `name` = `short` (69 rows), `dob` dạng `dd/mm` (không có năm).

## Sau khi deploy wifi tự nhận (30/10/2026 23:27)
- Chấm công: **CC 30/10c @124**.
- Worker `ncafe-chamcong`: version `7b9e778e-36a1-4181-86f3-27f7776f9b03`.

## Sau khi deploy Phase B – Telegram button (31/10/2026 15:57)
- Chấm công: **CC 30/10c @125**.
- Worker `ncafe-chamcong`: version `d3b834e4-660b-41ef-a5f3-f5b3dca927c2`.
- CaiDat MẶC ĐỊNH: `WIFI_CHE_DO='Cảnh báo'`, `WIFI_CHO_XAC_NHAN='Không'`, `TG_ADMIN_IDS=''`, `TG_WEBHOOK_SECRET=''` → **chưa bật** tính năng mới. Anh Bảo bật trong Cài đặt khi sẵn sàng.

## Sau khi deploy @126 (31/10/2026 18:38) – thêm `saoLuuSheetNgay`
- Chấm công: **CC 30/10c @126**.
- Worker `ncafe-chamcong`: version `e94f7382-06f1-43bb-a0cd-a93bb65efbe9`.
- ZIP baseline code: `/Users/dangbao/Documents/ncafe-baseline-20261031-1835.zip` (693 KB).
- Bản sao Sheet đã tạo: `ChamCong-saoluu-20261031` – ID `1vaW4cQsUMSPiXll0o6Mgr6PGjVJkmazTnq6-kFoVg1s` – trong folder `Ncafe - Sao luu Sheet` (Drive folder id `1s6PqgZyGSCYexv1iWz2xz8OfS2H_xql6`).

Rollback về CC 30/10c @125 nếu @126 lỗi:
```bash
clasp redeploy AKfycbyx_dtu8KSl5sqtHihWyDLmlhoV-Ea9g_MPeMfk7a_gHI6obVgEKXfsCUehFztzoFXW -V 125 -d "ROLLBACK về @125"
cd /Users/dangbao/Documents/ncafe/cloudflare && wrangler rollback d3b834e4-660b-41ef-a5f3-f5b3dca927c2 --name ncafe-chamcong
```

Rollback về CC 30/10b @122 nếu bản @124 lỗi:
```bash
clasp redeploy AKfycbyx_dtu8KSl5sqtHihWyDLmlhoV-Ea9g_MPeMfk7a_gHI6obVgEKXfsCUehFztzoFXW -V 122 -d "ROLLBACK về CC 30/10b"
cd /Users/dangbao/Documents/ncafe/cloudflare && wrangler rollback 70163c23-b470-45ac-a50d-336c1710af05 --name ncafe-chamcong
```

Nếu phải rollback về bản 30/10a (@121) + bản Worker trước đó: dùng các lệnh ở mục "Cách quay lại bản cũ" phía trên.
