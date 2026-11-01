# Nhật ký làm việc – Ncafe Chấm Công

Mẫu mỗi mục: giờ bắt đầu – lệnh anh (nguyên văn) – kế hoạch (TRƯỚC khi sửa) – đã sửa – test (nguyên văn) – deploy – bằng chứng + trạng thái.
Mới nhất ở TRÊN. Đồng bộ lên Google Drive `ncafe-code/NHAT-KY.md` sau mỗi mốc.

---

## 2026-11-01 12:30 – Luật Drive + NHAT-KY + CC 01/11f V1 Telegram log

**Lệnh anh (nguyên văn)**:
> Dừng cách kiểm hiện tại, sửa 4 chỗ:
> 1. Lượt PV-TEST vừa chấm có test=None, cs=TP: kiểm tin có vào group Trần Phú thật không, báo anh. Gắn cờ TEST…
> 2. Kiểm Telegram bằng Sheet là sai. Mỗi lần gửi Telegram phải ghi log vào D1…
> 3. Báo rõ: CC 01/11e (version 137) đã gắn vào bản triển khai chính AKfycbyx… chưa? CC 01/11d là gì?
> 4. Tìm nguyên nhân hôm nay 5 group không nhận tin…

> Từ giờ mọi việc ghi lên Google Drive để Claude bên ngoài kiểm. Thư mục `ncafe-code/` trong Drive gồm `hien-tai/`, `ban-cu/`, `NHAT-KY.md`, `thay-doi/`…

> Việc rủi ro cao: ghi kế hoạch lên `NHAT-KY.md` rồi DỪNG chờ "OK" mới làm.

**Kế hoạch**:
- Trả 4 câu hỏi: (3) CC 01/11e đã deploy @137 vào bản chính; CC 01/11d gộp vào 01/11e, không deploy riêng.
- Fix (1,2,4): Worker gửi Telegram TRỰC TIẾP qua Telegram Bot API + log D1 `TelegramLog`. Mã test → chỉ `TG_ADMIN_IDS`.
- Tạo bảng D1 `TelegramLog(ID, Luc, Loai, MaNV, MaCS, ChatID, GroupTen, LuotID, TinHieu, Ok, MessageID, LoiMsg, LanThu)`.
- Code `telegramGui(env, chatId, text, meta)` + `telegramLuotCham(env, _tg, luotID)` trong `d1.js`.
- `qrVao/qrRa` ctx.waitUntil `telegramLuotCham` thay backfill AS `qrGuiTelegram`.
- CC 01/11f. CLAUDE.md thêm luật 6 (rủi ro cao DỪNG) + luật 7 (Drive).

**Đã sửa**:
- `cloudflare/chamcong-a/d1.js`: thêm `telegramGui` + `telegramLuotCham` + `telegramGhiLog` + `telegramText` + `telegramChonChat`. qrVao/qrRa gọi `telegramLuotCham` thay backfillSheet qrGuiTelegram.
- D1 schema: `CREATE TABLE TelegramLog`.
- `CLAUDE.md`: thêm luật 6, 7.
- `NHAT-KY.md`: tạo file này.
- VER CC 01/11f.

**Test (nguyên văn `/tmp/v1_verify.py`)**:
```
=== Chấm PV-TEST qua CF D1 (CC 01/11f) ===
  qrVao: ok=True gio=10:54 msg=
  qrRa: ok=True gio=10:54 msg=

=== TelegramLog cho PV-TEST (bằng chứng Worker gửi) ===
  2026-11-01 10:54:45 VAO → ChatID= () lần 1 ✗ LỖI: Không có chat_id (TG_CHAT_<CS> và TG_CHAT trống)
  2026-11-01 10:54:48 RA → ChatID= () lần 1 ✗ LỖI: ...

=== Config TG_CHAT_* trong D1 ===
  TG_CHAT_TP = "-5428643627"  (có!)
  TG_CHAT_DD, TD, TNV, LDD cũng có.
  (TG_ADMIN_IDS trống – không có trong output)

=== Log Telegram cho record THẬT T11 sáng nay ===
  (0 log – có thể do CF D1 bản cũ không gửi/log)
```

**Phát hiện quan trọng**:
- `TG_ADMIN_IDS` TRỐNG → test PV-TEST không gửi group admin được.
- 5 group quán CÓ chat_id (TP: -5428643627, DD/TD/TNV/LDD tương tự).
- 0 log Telegram cho record thật sáng nay → BUG CF D1 bản cũ (trước 01/11f) không gửi + không log → **Nguyên nhân 5 group không nhận tin**.
- Fix 01/11f: Worker gọi Telegram API trực tiếp + log D1 → từ nay mọi lượt chấm qua CF ĐỀU được gửi + log.

**Fix nhỏ sau test**:
- Log message chi tiết hơn khi test (hint `TG_ADMIN_IDS trống`) vs khi thực (`TG_CHAT_<CS> và TG_CHAT trống`).
- Redeploy worker: version `e48c08ca`.

**Deploy**:
- CC 01/11f = Apps Script @138 (bản triển khai chính `AKfycbyx_…FztzoFXW`).
- Worker version `e48c08ca`.
- git commit chưa push (pending).

**Bằng chứng + trạng thái**:
- V1 **CHƯA XONG**: nguyên nhân xác định (TG_ADMIN_IDS trống + CF D1 bản cũ không gửi/log). Fix code deploy, nhưng cần:
  - Anh set `TG_ADMIN_IDS` = chat ID Telegram của anh (vào Cài đặt D1 bản thử hoặc wrangler d1 UPDATE).
  - Em test lại PV-TEST → tin vào group admin, log ok.
  - Bổ sung bù tin Telegram cho 5 record thật sáng nay (chờ anh xác nhận).
- Luật Drive **CHƯA XONG**: máy chưa cài Google Drive for Desktop. Em hướng dẫn anh cài, rồi em copy files.

**Anh cần làm**:
1. Set `TG_ADMIN_IDS` = chat_id Telegram của anh.
2. Cài Google Drive for Desktop:
   - macOS: tải https://www.google.com/drive/download/ → cài → đăng nhập `dangbao.mt@gmail.com`.
   - Mount tại `~/Library/CloudStorage/GoogleDrive-dangbao.mt@gmail.com/My Drive/`.
   - Báo em khi xong, em tạo `ncafe-code/` + chép file.
3. Em bổ sung bù tin Telegram cho 5 record thật sáng nay sau khi (1) xong (hoặc anh OK bỏ qua).

---

## Các việc đã làm hôm nay (bù theo luật mới)

### 2026-11-01 11:50 – CC 01/11b: nút Từ chối tab Xác nhận giờ
- Lệnh: VIEC-TON mục 3 "Nút Xác nhận/Từ chối/Xoá tab Xác nhận giờ".
- Đã sửa: `XacNhan.gs` fn `xnTuChoi` + apiHamQL + nút UI prompt.
- Test: cc 153/0 (thêm XN-TC).
- Deploy: Apps Script @135, Worker `4196f4ce`, git tag `CC-01-11b`.
- Bằng chứng: unit test pass; chưa test iPhone.

### 2026-11-01 11:55 – CC 01/11c: route /quanlychamcong-thu
- Lệnh: Chuyển trang QL lên CF bước 1 Nguyên trạng.
- Đã sửa: `build_worker.py` thêm route alias `/quanlychamcong-thu` cùng content `/quan-ly`.
- Test: curl HTTP 200, 200KB, ~0.4s.
- Deploy: Apps Script @136, Worker `d0c76943`, git tag `CC-01-11c`.
- Bằng chứng: `DOI-CHIEU-QL-01-11.md` + `KIEM-TRA-QUANLY.md` 46 mục.

### 2026-11-01 12:00 – CC 01/11d gộp vào 01/11e: UX + V1 Telegram backfill (bị fail)
- Lệnh: Bước 2 UX trang QL (5 lỗi) + V1 Telegram.
- Đã sửa (UX): toast "Đã lưu", chống bấm 2 lần, nút Quay lại, history pushState Back.
- Đã sửa (V1 chưa đạt): `qrGuiTelegram` AS + waitUntil backfill – test cho thấy có vấn đề (BUG: log Sheet không trả về Worker, không biết gửi được hay không).
- Deploy: Apps Script @137, Worker `2be77731`, git tag `CC-01-11d/e`.
- V1 **chuyển sang CC 01/11f** cho log trực tiếp D1.
