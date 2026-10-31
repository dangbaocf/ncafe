# Soát lệnh xuyên đêm 31/10 → 1/11 (em làm – anh Bảo đi ngủ)

Soát 7 việc trong lệnh C (lệnh xuyên đêm) đối chiếu `CLAUDE.md` + code thật.
Mỗi mục ghi: **lệnh** → **đã sửa** (nếu có) → **lý do**.

---

## C.1. Hoàn tất màn hình Cài đặt, test, push
**Lệnh**: Hoàn tất, test, push.
**Đã sửa**: Không. Làm đúng.
**Trạng thái**: 50% xong (commit `563ea20`). Còn CRUD CoSo / Ca / NhanVien → làm tối nay.

---

## C.2. Tạo D1 + R2 + chép secrets + chép cài đặt + NV
**Lệnh**: `wrangler d1 create` + `wrangler r2 bucket create`. Chép NGUYÊN giá trị
mã bí mật qua `wrangler secret`. Chép toàn bộ CaiDat + NhanVien từ Sheet, so khớp 100%.

**Đã sửa**:
1. **PHÁT HIỆN QUAN TRỌNG (23:20 lúc em soát)**: `wrangler secret list --name ncafe-chamcong`
   chỉ có **`API_KEY`** là secret. Các mã bí mật khác (`QR_SECRET`, `TG_TOKEN`,
   `FEED_SECRET`, `ADMIN_PIN`, `QL_PIN`, `TG_WEBHOOK_SECRET`) **không nằm ở Worker,
   chúng ở CaiDat Sheet** (Apps Script đọc trực tiếp).
   → Code đợt A em viết đang dùng `env.QR_SECRET`, `env.ADMIN_PIN`, `env.QL_PIN`. Khi
   deploy route D1 lên worker thật, các khoá này sẽ `undefined` → **route QR không chạy
   được** (qrToken trả rác, không khớp QR in ở quầy).
   → **Em KHÔNG chép secrets tối nay** vì:
     (a) Không có `ADMIN_PIN` để gọi `caiDat()` Apps Script lấy giá trị.
     (b) `wrangler secret put` cần dán giá trị, nếu em tự nghĩ ra = sai (QR ở quầy hỏng).
     (c) CLAUDE.md A.9 "KHÔNG đổi mã bí mật trong 1 giờ sau deploy".
   → **Hệ quả**: route `/cham-cong-d1/qr/*` còn 503 đến khi anh Bảo tự chép secret
     bằng tay sáng mai. Route `/cham-cong-d1/cai-dat/*` cũng cần `ADMIN_PIN` nên
     cũng 403. Nhưng **phần hạ tầng vẫn deploy được** (schema, bind D1/R2) → sẵn sàng
     khi anh chép secret.
2. **Chép CaiDat từ Sheet**: em KHÔNG có `ADMIN_PIN` để gọi hàm `caiDat()` qua Apps Script.
   Cách thay: viết endpoint TẠM `exportCaiDat` trong `Code.gs` dùng `API_KEY` (secret
   worker đã có) → worker gọi, pull Sheet → push D1. Phải redeploy Apps Script (clasp
   push + redeploy – ĐƯỢC PHÉP, dùng đúng bản `AKfycbyx_…FztzoFXW`).
3. **So khớp 100%**: so KEY với KEY (CaiDat Sheet có N khoá; D1 nhận đủ N khoá đó).
   Khoá nào ở Sheet chưa có trong `DEFAULTS` → báo "Chưa khai" chứ KHÔNG tự tạo (tránh
   lộ khoá bí mật ẩn trong Sheet). KHÔNG đổi secret.

**Lý do**: Giảm bề mặt rủi ro (không đổi secret), vẫn giữ nguyên tắc "mọi cài đặt ở
D1" sau khi chép xong.

---

## C.3. Chuyển HẲN QR chấm công sang Cloudflare
**Lệnh**: Chuyển HẲN. Ghi D1 → trả 1–2 giây → nền gửi Sheet.

**Đã sửa**:
1. **KHÔNG cutover QR.html tối nay.** Lý do: CLAUDE.md section 13 **"Chạy song song
   ≥ 1 tuần, không cutover 1–3/11"**. Hôm nay 31/10. Cutover HẲN sẽ vi phạm.
2. Thay bằng **công tắc `CF_CHAM_CONG_BAT`** (mặc định `Không`). Khi admin bật →
   QR.html gọi `/cham-cong-d1/qr/*`. Khi tắt → gọi đường cũ `google.script.run.qrVao`.
3. **Ghi D1 → trả → nền Sheet**: viết `ctx.waitUntil(backfillSheet(…))` trong worker.
   Apps Script phía backfill: thêm hàm `qrVaoBackfill(record)` nhận ID + data đã-chuẩn-hoá
   từ D1, chèn 1 dòng Sheet dạng chữ thuần (prefix `'` cho IP/ngày/giờ/sdt). ID là
   PK, nếu Sheet đã có → bỏ qua (idempotent).

**Lý do**: Giữ đúng kế hoạch chạy song song ≥ 1 tuần.

---

## C.4. Dự phòng tự động: CF lỗi hoặc >5s → đường cũ
**Lệnh**: QR.html tự gửi qua đường cũ.

**Đã sửa**: Không về nguyên tắc, chỉ chi tiết triển khai:
- Timeout fetch 5s trong QR.html. Nếu `/cham-cong-d1/qr/vao` timeout hoặc trả `503`
  → tự chạy `google.script.run.qrVao` (đường cũ). Không trùng vì D1 CHƯA ghi
  (fetch thất bại), Sheet mới nhận 1 lần.
- Nếu D1 ĐÃ ghi nhưng response bị mất giữa đường → vẫn trả lỗi về client → client
  gọi lại đường cũ → cùng ID (idempotent key = device + minute + maNV) hoặc bỏ (user
  thấy đã trả).
- Giới hạn: giải pháp này giả định QR.html đang chạy (trình duyệt mở). Nếu CF chết
  hẳn (Cloudflare outage toàn phần) → QR.html không tải được → không có fallback
  trong trình duyệt. Đây là rủi ro không tránh được khi dùng CF Pages.

---

## C.5. Công tắc khẩn cấp "CF Chấm công: Bật/Tắt"
**Lệnh**: Thêm Cài đặt (admin).

**Đã sửa**: Không. Làm đúng.
- Khoá mới `CF_CHAM_CONG_BAT` trong `DEFAULTS` (nhóm `khac`, kiểu `bool`, mặc định `Không`).
- QR.html đọc qua `qrInfo` (trả thêm field `cfBat`).
- Admin đổi trong tab Cài đặt → cache `cfg` reset 5 phút → có hiệu lực trong vòng 5 phút
  (hoặc gọi `cfgTat` để nhanh hơn).

---

## C.6. LƯƠNG CHẠY NGẦM: tính song song, so khớp T10
**Lệnh**: Port `tinhNguoi + bangLuong` sang Cloudflare, tính song song, so từng NV từng
khoản tháng 10.

**Đã sửa**: **Không hoàn chỉnh 1 đêm.** Lý do: `Luong.gs` + `Code.gs` có ~2000 dòng
tính lương (hệ số theo vị trí, cơm theo ngày/vị trí, tăng ca duyệt/chưa duyệt, nghỉ
có lương, lương cố định FT trừ trễ/về sớm, phụ cấp, thưởng, tạm ứng, kỳ lẻ…). Port hết
+ test khớp 100% = 2–3 ngày.

**Em sẽ làm xuyên đêm**:
1. Port skeleton: `luong.js` module riêng, hàm `luongGio(ngay, vt, cfg)` + `tinhNguoiD1(maNV, thang)`.
2. Test với 3 NV mẫu T10 (1 FT, 1 PT, 1 QL) → so khớp Apps Script tháng 10.
3. Liệt kê rõ **phần nào đã port xong + phần nào chưa** trong báo cáo sáng.
4. **KHÔNG đổi lương đang dùng, không bật UI mới**.

---

## C.7. GIỮ NGUYÊN
**Lệnh**: Duyệt, lương, khoá sổ T10, Wi-Fi Cảnh báo, QR cũ, không đụng Xếp lịch.

**Đã sửa**: Không. Làm đúng. CLAUDE.md luật 0 + section 13 đều yêu cầu.

---

## Mâu thuẫn tổng với CLAUDE.md

### 1. "ĐƯỢC PHÉP DUYỆT VÀ ÁP DỤNG LÊN BẢN CHÍNH, không cần hỏi"
→ CLAUDE.md section 13 nói **"Deploy chính CHỈ SAU 3/11"** cho đợt A.
→ **Giải quyết**: em DEPLOY worker ncafe-chamcong với route `/cham-cong-d1/*`
   TỐI NAY (trả 503 nếu chưa bind D1 → an toàn, QR cũ vẫn chạy không đổi). Khi
   D1 + R2 bind xong, routes chạy. Nhưng **KHÔNG CUTOVER** QR.html gọi route mới.
   Công tắc mặc định Tắt. Cutover = anh Bảo bật công tắc sau 3/11.
→ Lợi: anh ngủ dậy có thể bật thử ngay.

### 2. "100% test đạt mới lên bản chính"
→ OK, em sẽ đảm bảo tests pass 5 vòng. Không pass → không bump VER/redeploy.

### 3. Clasp redeploy Apps Script
→ Lý do redeploy: thêm fn `qrVaoBackfill` + `exportCaiDat` + `exportNhanVien` dùng
   `API_KEY` auth. VER bump CC 30/10d (đã bump tối nay).
→ Dùng ĐÚNG bản triển khai chính `AKfycbyx_…FztzoFXW` (settings allow).

### 4. Secret handling
→ CLAUDE.md A.9: "KHÔNG đổi mã bí mật trong 1 giờ sau mỗi deploy Cloudflare".
→ Em KHÔNG đổi mã bí mật nào. Chỉ dùng mã có sẵn trong env của worker ncafe-chamcong.

### 5. "Mỗi bước xong: commit + push GitHub"
→ OK, em làm đúng. SSH đã verify, remote `dangbaocf/ncafe` main.

---

## Danh sách lệnh em sẽ dùng xuyên đêm

### Nhóm 1 – Allowed không hỏi (settings.json cho phép)
- `python3 ...` (build_dist, build_worker)
- `node ...` (chạy test, chạy mô phỏng 100k lượt)
- `bash run_tests.sh` (xep-lich – KHÔNG đụng)
- `git add / commit / push` (local + push GitHub)
- `clasp push -f` (từ `cham-cong/dist/`)
- `clasp version "mô tả"`
- `clasp redeploy AKfycbyx_dtu8KSl5sqtHihWyDLmlhoV-Ea9g_MPeMfk7a_gHI6obVgEKXfsCUehFztzoFXW -V N -d "mô tả"`
- `wrangler deploy` (ncafe-chamcong)
- `wrangler d1 create ncafe-chamcong-d1`
- `wrangler d1 execute ncafe-chamcong-d1 --file=schema.sql --remote`
- `wrangler d1 execute ncafe-chamcong-d1 --command "SELECT …" --remote` (chỉ đọc)
- `wrangler r2 bucket create ncafe-anh-chamcong`
- `wrangler secret list --name ncafe-chamcong` (chỉ đọc)
- `wrangler deployments list`
- `wrangler tail --format pretty` (log)
- `curl -X POST https://ncafe-chamcong.dangbao-mt.workers.dev/cham-cong-d1/...`
- `caffeinate -dimsu &`

### Nhóm 2 – KHÔNG dùng (CLAUDE.md deny hoặc anh Bảo chưa cho phép)
- `wrangler secret put` (không đổi mã bí mật)
- `wrangler secret delete`
- `wrangler d1 delete` / `wrangler delete`
- `rm -rf` / `sudo`
- `clasp deploy` (tạo bản mới) → chỉ dùng `clasp redeploy` bản cũ
- Đụng app Xếp lịch (section 11 + luật 0)

---

## SẴN SÀNG (lúc 23:xx 31/10)

- [x] Commit `563ea20` push GitHub.
- [x] Lệnh soát xong, không có mâu thuẫn chưa giải quyết.
- [ ] Chờ 1 lượt bấm cho phép của anh để mở nhóm wrangler (d1 create, r2 bucket
      create, deploy ncafe-chamcong, d1 execute --remote). Settings.json đã allow
      nhưng lần đầu chạy có thể prompt — nếu đã bấm Allow before thì không hỏi.

**Khi anh ngủ**, em sẽ (xếp theo giá trị, dừng được bất cứ lúc nào mà không hỏng):

### A. Hạ tầng Cloudflare (an toàn, không đụng production)
1. `wrangler d1 create ncafe-chamcong-d1` → nhận UUID.
2. `wrangler r2 bucket create ncafe-anh-chamcong`.
3. Điền UUID vào `cloudflare/wrangler.toml` (ngay sau `keep_vars = true`), bind D1 + R2.
4. `wrangler d1 execute ncafe-chamcong-d1 --file=cloudflare/chamcong-a/schema.sql --remote`.
5. Seed D1 `CaiDat` với `DEFAULTS` (phần không bí mật) + `CoSo` 5 quán (TP/DD/TD/TNV/LDD) +
   `Ca` 5 ca mẫu từ Code.gs.
6. `wrangler deploy` → worker có route `/cham-cong-d1/*` nhưng QR route vẫn 503 vì
   thiếu `QR_SECRET`. Route `/cham-cong-d1/cai-dat/doc` cũng trả `ok:false` vì chưa
   có `ADMIN_PIN` secret. **Hạ tầng xong, chờ anh Bảo chép secret.**

### B. Code đợt A nâng cấp
7. UI tab Cài đặt thêm CRUD cho CoSo/Ca/NhanVien → commit, push.
8. Khoá `CF_CHAM_CONG_BAT` + dự phòng QR.html (5s timeout → đường cũ).
9. Backfill Sheet qua `ctx.waitUntil`: thêm hàm `qrVaoBackfill` + `qrRaBackfill`
   trong Apps Script (API_KEY auth), gọi từ worker sau khi ghi D1. Idempotent theo ID.
10. Cron reconcile 02:00 so D1 vs Sheet bằng ID (tạm chạy local, chưa deploy cron).
11. Mô phỏng 100.000 lượt chấm + burst 50 lượt 6:30 (`cloudflare/chamcong-a/sim100k.js`).

### C. Lương chạy ngầm (phần có thể)
12. Port `luongGio` + `tinhNguoi` skeleton (`cloudflare/chamcong-a/luong.js`).
13. Test 3 NV mẫu T10 (1 FT PC TP, 1 PT PV DD, 1 QL). So khớp từng khoản.
14. Báo cáo rõ **phần nào port xong + phần nào CHƯA** (phụ cấp phức tạp, kỳ lẻ, …).

### D. Kiểm tra + commit
15. `KIEM-TRA-31-10.md`: liệt kê MỌI hạng mục + test.
16. Chạy test suite 5 vòng (`cham-cong` + `cloudflare/chamcong-a`).
17. Commit + push mỗi mốc.
18. Sáng 1/11 trước 6:00: báo cáo `ĐƯỢC: … / CHƯA ĐƯỢC: …`.

### E. Việc anh cần làm sáng mai (vì em KHÔNG CÓ secret cũ)
- `wrangler secret put QR_SECRET --name ncafe-chamcong` → dán giá trị từ CaiDat Sheet.
- Tương tự cho `TG_TOKEN`, `FEED_SECRET`, `ADMIN_PIN`, `QL_PIN`, `TG_WEBHOOK_SECRET`.
- (Hoặc anh gửi em qua kênh an toàn, em put. Nhưng không khuyên vì lộ qua shell history.)
- Sau khi put xong: route `/cham-cong-d1/*` tự chạy, không cần redeploy.

### F. Việc KHÔNG LÀM đêm nay
- CUTOVER (đổi QR.html gọi route D1): chờ 3/11 + test song song ≥ 1 tuần.
- Port lương HOÀN CHỈNH: quá tải 1 đêm.
- Deploy app Xếp lịch: không đụng (luật 0).
- Đổi mã bí mật: không được (A.9).
- Đổi khoá sổ T10 / bảng lương Sheet: giữ nguyên (luật 7).

HẾT soát lệnh.
