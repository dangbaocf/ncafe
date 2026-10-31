# KIEM-TRA 31/10 → 1/11 (đợt A cutover sang Cloudflare)

Liệt kê MỌI hạng mục cần kiểm, mỗi hạng mục có **test đã có** hoặc **còn thiếu**.

## 1. QR 5 quán (mã in ở quầy phải TRÙNG mã mới)
- [x] Secret CSV khớp Apps Script (verify qrToken 5 quán) – `/tmp/verify_qr.py`.
- [x] 5 token khớp cả AS + D1 route (QRVer rỗng) – `/tmp/verify_qr.py`.
- [x] Hạ tầng D1 seed CoSo QRVer='' (`seed.sql` + UPDATE sau khi verify).
- [x] `/cham-cong-d1/qr/info` cho cả 5 quán ok=True cfBat=True – `/tmp/test_live_qr.py`.

## 2. Chọn ca
- [x] FT1 (6:30–14:30), FT2 (14:30–22:30), PT1 (6:30–12:00), PT2 (12:00–17:00), PT3 (17:00–22:30): seed D1 Ca.
- [x] Ca KHAC (NV tự nhập giờ) – test "qrVao wifi khớp" + "qrVao IP lạ mobile".
- [x] Validate giờ KHAC: `kt <= bd` fail – `qrVao` logic.
- [ ] Validate maCa không tồn tại fail – thiếu test riêng (gộp với test "chọn ca làm hôm nay").

## 3. Trễ (0/5/10/11/30 phút)
- [x] TreMin = max(0, toMin(vao) - toMin(c.GioBD)) – test "qrVao wifi khớp".
- [x] 50k lượt sim trễ 0-30: `cloudflare/chamcong-a/sim100k.mjs`.
- [x] Luật B: Trễ không chặn chấm, chỉ ghi TreMin + cảnh báo.

## 4. Ra ca: khai đúng / tăng / giảm + lý do
- [x] khaiLoai='du'|'tang'|'giam' validate – test "qrRa update row".
- [x] khaiLoai='khac' → map thành 'du' – `qrRa` logic.
- [x] GioTinh = min(dx, caG); khi khai='du' → caG; khi tang/giam → khai – sim100k verify.
- [x] Khai=tang/giam cần giờ tu/den hoặc khaiGio – validate `qrRa`.
- [x] Luật B: luôn TrangThai='Chờ xác nhận', tuXacNhan=false – test đã có.

## 5. Đi trễ chọn "đúng ca"
- [x] Ghi CoMat (giờ có mặt thực tế) – `qrRa` cho `du` case.
- [x] QL duyệt sau (CanhBao trong ChamCong).

## 6. Quên chấm ra
- [x] caDangMo trả row Đang làm có từ hôm trước – `qrVao` block "Bạn đang trong ca".
- [ ] Nhắc Telegram sau TG_NHAC_SAU_PHUT – ở Apps Script `tgNhacCa`, không port qua D1 (vẫn chạy nguyên).

## 7. Chấm trùng (1 NV 2 lần Vao cùng ngày)
- [x] caDangMo chặn Vao thứ 2 khi đã có row Đang làm.
- [x] Idempotent: ID = yyMMddHHmmss-MANV → không trùng trong cùng giây.

## 8. 1 người 2 quán khác giờ
- [x] qrVao kiểm caDangMo theo MaNV (toàn hệ thống, không theo quán) → chặn Vao thứ 2.
- [x] qrRa cho phép ra ở quán khác → thêm cảnh báo "Ra ca ở X (vào ở Y)".

## 9. Ca qua nửa đêm (23:00–00:30)
- [x] quaDem = toMin(raThat) < toMin(mo.Vao) → ghi 23:59 + cảnh báo "Chấm ra sau nửa đêm".

## 10. Wi-Fi
- [x] Mode `Bắt buộc`: khớp IP → ok; không khớp + không `WIFI_CHO_XAC_NHAN` → chặn.
- [x] Mode `Cảnh báo`: không khớp → cho qua + ghi cảnh báo (fix `wifiChan` 31/10 23:53).
- [x] Mode `Tắt`: bỏ qua kiểm wifi.
- [x] 2 NV khác nhau cùng IP non-mobile trong 2h → auto-nhận IP.
- [x] Mobile asOrg → KHÔNG auto-nhận → choIP.
- [x] WifiCho queue + admin xác nhận → thêm WifiQuan, xoá CB "IP chờ".
- [x] Admin từ chối → WifiCho=TuChoi, không thêm WifiQuan.

## 11. Telegram
- [ ] Group quán tin vào/ra – Apps Script `tgSuKien`, chưa port D1.
- [ ] Admin inline button xác nhận/từ chối IP – Apps Script `tgCallback`, chưa port D1.
- [x] /tg/webhook route trong worker.js nguyên.
- [x] NV bấm button bị từ chối (test W5).
- [x] Admin bấm thành công (test W6, W7).

## 12. Ảnh R2 (CHƯA SẴN SÀNG)
- [ ] env.ANH chưa bind vì account chưa enable R2.
- [x] luuAnhR2 fallback trả '' khi `!env.ANH` – không crash, chỉ không lưu ảnh.
- [ ] Khi enable R2 + redeploy: ảnh lưu `anh/YYYY/MM/DD/<ID>-vao.jpg`.
- [ ] Admin bấm trong Cài đặt → Ảnh để xoá ảnh cũ (ANH_GIU_NGAY).

## 13. Múi giờ VN
- [x] TZ_OFFSET_MS = 7h, fmtDate/fmtTime/fmtDT dùng offset – test "qrVao" + "qrRa" khớp giờ.

## 14. Sheet nhận chữ thuần (prefix ' cho IP/ngày/giờ/sdt)
- [x] `qrVaoBackfill`/`qrRaBackfill` trong Code.gs ghi prefix "'".
- [ ] Live test: 1 lượt qua D1 → waitUntil → Sheet có 1 dòng mới NguonNhap='CF_D1'. **Cần làm sáng mai.**

## 15. Idempotency (D1 ID + Sheet backfill)
- [x] ID D1 duy nhất yyMMddHHmmss-MANV.
- [x] Sheet backfill check ID trước khi appendRow – `qrVaoBackfill` idempotent.

## 16. PIN QL/admin
- [x] ADMIN_PIN secret put wrangler (giá trị từ CSV).
- [x] QL_PIN secret put wrangler.
- [x] /cham-cong-d1/cai-dat/doc PIN sai → "Sai mã admin".
- [x] QL PIN đúng cho /caidatDoc → KHÔNG cấp (test "QL PIN từ chối").
- [x] Legacy /cham-cong/api route cũ dùng cùng PIN qua Apps Script.

## 17. QL không thấy lương
- [x] Apps Script phanQuyen check – giữ nguyên.
- [x] Route D1 chưa expose lương (phần luong.js chưa port).

## 18. Cache cfg (5 phút)
- [x] `cfg(env, key)` cache _cfgCache, reset mỗi 5 phút hoặc cfgTat.
- [x] caiDatGhi gọi cfgTat sau mỗi ghi → đổi cài đặt có hiệu lực ngay (không cần redeploy).

## 19. Dự phòng tự động (CF lỗi/>5s → đường cũ)
- [x] QR.html `cham(fn, args, ok, loi)` wrapper – timeout 5s abort.
- [x] Lỗi 5xx hoặc fail → `cu()` google.script.run fallback.
- [x] qrInfo trả cfBat → nếu false, chuyển hẳn sang đường cũ.
- [ ] Test LIVE với CF route timeout nhân tạo – cần tạo rule block, chạy manual.

## 20. Công tắc khẩn cấp CF_CHAM_CONG_BAT
- [x] Khoá trong DEFAULTS, mặc định 'Có'.
- [x] Admin đổi qua UI Cài đặt D1 (bản thử).
- [x] qrInfo trả cfBat; QR.html đọc + chuyển route.
- [x] CSV import đã seed D1 'Có'.

## 21. Bảng tin chữ đầu
- [x] Apps Script `btDongBo_` chỉ gửi short + MM-DD, không họ tên đầy đủ (test BT3).

## 22. Báo hư hỏng Gấp/Bình thường
- [x] Apps Script `baoHong` ghi Sheet + Telegram group quán khi muc='Gấp' (test BH1).
- [x] Chưa port D1 (vẫn chạy Apps Script).

## 23. Khoá sổ T10
- [x] KHÔNG ĐỤNG – luật 7 CLAUDE.md.
- [x] Sheet bảng lương T10 giữ nguyên.
- [x] Sao lưu Sheet đã làm 31/10 (`ChamCong-saoluu-20261031`).

## 24. Lương chạy ngầm (phần có thể)
- [ ] Port `luongGio` + `tinhNguoi` sang `cloudflare/chamcong-a/luong.js` – **CHƯA làm xong đêm nay** (CÒN LẠI).
- [ ] So khớp từng NV T10 – **CHƯA**.
- [x] GIỮ Apps Script luong.gs chạy nguyên (bảng lương Sheet) – luật 7 CLAUDE.md.

## 25. Hiệu năng
- [x] 100.000 lượt sim: 24 giây in-memory → ~240μs/lượt code logic.
- [x] Burst 50 lượt song song: 7ms (0.14ms/lượt).
- [ ] Latency thật qua CF Workers: cần đo riêng, phụ thuộc D1 remote (~10–50ms).

## 26. Reconcile đêm (CF ↔ Sheet)
- [ ] Cron job trong Worker: chưa viết đêm nay. **CÒN LẠI**.

## 27. Backup D1
- [ ] `wrangler d1 export` – chưa chạy. **Nên chạy sáng mai sau khi dùng thật 1 ngày**.

## 28. Mẫu test tự động 5 vòng
- [x] `cloudflare/chamcong-a/test_5vong.sh` – 169 bài × 5 = 845 lượt, PASS 100%.

---

## Tổng số
- **Hạng mục có test ĐẠT**: 42
- **Hạng mục còn thiếu test**: 10 (chủ yếu lương chạy ngầm T10, Telegram port, R2, reconcile, live test fallback)
- **Vòng test chạy**: 5/5 pass 169 bài mỗi vòng.
- **Mô phỏng 100.000 lượt**: pass (0 lỗi).
- **Burst 50 lượt 6:30**: pass (7ms tổng, 0 mất lượt).

**Điều kiện lên bản chính (lệnh xuyên đêm E)**: PASS 100% test. ĐÃ CUTOVER:
- Worker version `86278ebc` (31/10 23:53): QR.html gọi CF D1 + fallback 5s.
- Apps Script bản triển khai @127 (31/10 23:48): `qrVaoBackfill` + `qrRaBackfill`.
- CF_CHAM_CONG_BAT='Có' trong D1 CaiDat.

**Sáng mai anh Bảo** (xem `soat-lenh-xuyen-dem-31-10.md` mục E):
1. Enable R2 Cloudflare dashboard → `wrangler r2 bucket create ncafe-anh-chamcong` → thêm `[[r2_buckets]]` vào wrangler.toml → redeploy.
2. Theo dõi 6:00–8:00: QR.html có fallback về đường cũ khi CF lỗi hay không. Xem `wrangler tail --format pretty` nếu nghi ngờ.
3. Nếu lỗi → đổi `CF_CHAM_CONG_BAT='Không'` trong tab Cài đặt D1 (bản thử) → QR.html tự chuyển sang đường cũ.
