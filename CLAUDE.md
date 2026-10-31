# Ncafe – Chấm công & Xếp lịch: TOÀN BỘ YÊU CẦU CỦA ANH BẢO

Chủ dự án: anh Bảo (Ncafe, 5 quán: TP Trần Phú, DD Đống Đa, TD Tản Đà, TNV Trưng Nữ Vương, LDD Lê Đình Dương).
Trả lời bằng tiếng Việt. Mỗi lần sửa lỗi: tóm tắt LỖI GÌ – VÌ SAO – ĐÃ SỬA GÌ.

> Đây là "luật gốc". Mọi thay đổi phải giữ nguyên các yêu cầu dưới đây.
> Yêu cầu mới mâu thuẫn với yêu cầu cũ → hỏi anh Bảo trước, không tự quyết.
> Khi anh Bảo chốt yêu cầu mới → cập nhật file này + thêm test tương ứng.

## 0. Luật làm việc
- Trước khi sửa: giải thích bằng tiếng Việt sẽ sửa gì, chờ anh Bảo đồng ý.
- Giữ nguyên mọi yêu cầu cũ; mỗi yêu cầu mới phải có test.
- Chạy toàn bộ test trước khi deploy; có test fail thì KHÔNG deploy.
- Deploy bản thử trước, anh Bảo duyệt rồi mới lên bản chính.
- clasp: chỉ cập nhật bản triển khai đang dùng của app Chấm công (`AKfycbyx_dtu8KSl5sqtHihWyDLmlhoV-Ea9g_MPeMfk7a_gHI6obVgEKXfsCUehFztzoFXW`) → link /exec giữ nguyên. Không tạo bản triển khai mới.
- KHÔNG đụng app Xếp lịch (bản triển khai `AKfycbzpbUSCCkI2nvj6AEh7lXc851hFxcwlTtZBTZrxpWOD1D8V4qHdZFG9P5w2bYuHVCeB`) trừ khi anh Bảo yêu cầu rõ.
- Wrangler: giữ nguyên biến môi trường (`keep_vars = true`), không drop/migrate D1 khi chưa được đồng ý.
- Sau khi sửa lỗi: tóm tắt gộp — lỗi gì, vì sao, đã thay đổi gì.
- Anh Bảo không đọc code: báo cáo bằng tiếng Việt dễ hiểu, ngắn gọn.
- Không thêm tính năng anh không yêu cầu.
- CHỈ báo khi gặp LỖI và khi XONG MỖI ĐỢT (tóm tắt: đã làm gì, test bao nhiêu pass, đã lên bản chính chưa). Không báo mỗi bước đang chạy. (Chốt 30/10, xác nhận lại 31/10.)

## 1. Hệ thống
- 2 app TÁCH RIÊNG: Chấm công (nguồn dữ liệu) và Xếp lịch (chỉ quản lý dùng, lấy dữ liệu từ Chấm công).
- Chấm công Apps Script: giữ tối thiểu file (`Code.gs` + `QuanLy.html` + `appsscript.json`).
- Cloudflare Worker: `ncafe-chamcong` (trang nhân viên/QR), `ncafe-bangtin` (bảng tin, cron 5 phút, D1 `ncafe-bangtin`).
- Google Sheet app "Chấm công Ncafe": `13dWFGvrAJPixKnCYiffJmghERkfQDL4o2xYLPBc_gTo`.
- Dữ liệu mỗi tháng tự tách ra file Google Sheet riêng (anh sẽ copy rồi xoá).
- File nguồn cũ: lịch LĐD `1-xHHjHV9X59i91iAKR3zKhXy6PGhhE8ieXym8_LLmmo`; lịch QL nội bộ `1G0qiq46HjuIR4GdQ2F12-YxQy5gwZiVf63lGtZ7JEE0`; lịch TP/ĐĐ/TĐ `1u_WaOGqMjkhLxwaYqS9HqUZDHTH60cO7FtrRjEtuJrs`; chấm công LĐD `10hCjD_HZsgTnS5wX3VdxqqU7TBoBHxXoum5jEqxzxjQ`; chấm công TP/TĐ/ĐĐ `1OaoZndDhLiGMIzEyxlSekSZHD7iigvvRIkvdSxALg14`; chấm công TNV `15XIfvP2GKjkjrFKS0qX0RATQNMwyHTEib8kU6U9yeeo`.
- Giờ công 1–24/10 nhập từ file chấm công cũ; từ 25/10 chấm công trực tiếp trên app.

## 2. Đường dẫn truy cập (mỗi nhóm chỉ nhớ 1 link)
- Nhân viên: quét QR in sẵn ở quầy để chấm công; mọi việc khác ở `caphemuoihue.com/nhanvien`.
- Quản lý: hub `caphemuoihue.com/quanly` → `/quanlychamcong` (chấm công) và `/quan-ly` (xếp lịch).
- Trang cũ `/cham-cong-tp|dd|td|tnv|ldd` hiện thông báo "đã chuyển sang app mới".
- Không đưa link `script.google.com` thô cho nhân viên.

## 3. Cơ sở & nhân sự
- 5 quán: Trần Phú (TP), Đống Đa (ĐĐ), Tản Đà (TĐ), Trưng Nữ Vương (TNV), Lê Đình Dương (LĐD). Nhân viên xoay quán → dữ liệu gộp chung.
- Vị trí: PC pha chế (kiêm thu ngân, không có vai trò thu ngân chính thức), PV phục vụ, BV bảo vệ, RL rửa ly, QL quản lý. Người nhà (3–4 người) bù linh hoạt, ghi "support".
- Mã nhân viên theo tên: `PC-THANH`, `PV-CHAU`…
- Vắng khỏi lịch > ~10 ngày = coi như nghỉ việc.
- Thêm/bớt nhân sự chỉ qua app, chỉ admin.
- Tên gọi: "Nhỏ" = Võ Thị Thiện Lương (QL); "C Anh" = Kim Anh; Nguyên ở TP và LĐD là một người; Nguyên và H.Nguyên là 2 người khác nhau; Đan = Linh Đan; Mạ có trong bảng lương nhưng không xếp ca; A Nhân = BV ca sáng cố định TP, kiêm kỹ thuật/bảo trì mọi quán; A Lộc = BV kiêm giao hàng kho, quản lý kho, phụ order ở ĐĐ; Chú Lạc = BV cố định; K Hưng = BV làm được phục vụ; Phan Tám = RL cố định TP; C. Vân = RL cố định LĐD; Cô Loan = RL lưu động; Cô Minh, Cô Tuấn = RL; "Khang BV" = Khang làm bảo vệ hôm đó.

## 4. Ca làm
- Full-time 8h: 6:30–14:30, 14:30–22:30.
- Part-time: 6:30–12:00, 12:00–17:00, 17:00–22:30.
- Ca tối kết thúc 22:30; LĐD, ĐĐ, TP được về muộn tới 23:00 nếu dọn trễ.
- Bảo vệ không có ca tối; bảo vệ ngày 6:30–17:00.
- Ký hiệu lịch cũ: "gãy" = ca gãy (sáng, nghỉ trưa, tối quay lại); "gãy" ở khối sáng không ghi giờ = 6:30–12:00, phần tối đếm lùi từ 22:30; "8-5h" = 8:00–17:00; "(10,5)"/"(11,5)" = bắt đầu 6:30, làm chừng đó giờ; giờ khối Sáng đếm tới từ 6:30; giờ khối Tối đếm lùi từ 22:30; "full" + tên lặp ở khối sau không ghi giờ = làm liên tục từ 6:30 đến hết khối đó; "nvm" = nhân viên mới.
- Người làm ca 8h/10,5h bắt đầu 6:30 hiện ở cả khối Sáng và Trưa.
- Ở LĐD chỉ full-time làm ca gãy.

## 5. Chấm công
- Quét QR in cố định ở quầy (không đổi theo tháng, không dùng màn hình).
- Chỉ chấm được khi dùng Wi-Fi quán (IP đã đăng ký; mạng Viettel, VNPT, FPT). Được vào ở quán này, ra ở quán khác nếu IP trong danh sách. Không hiển thị việc kiểm tra vị trí cho nhân viên.
- Vào ca: mã NV, vị trí, ca, chụp ảnh, ngày giờ. Ca phát sinh: NV tự nhập giờ bắt đầu/kết thúc.
- Ra ca: NV khai đúng ca / tăng ca / giảm ca (kèm giờ và lý do).
- Đến trễ mà chọn "đúng ca" → cần QL xác nhận.
- Đúng giờ: thường đến trước ~10 phút. Trễ ≤10 phút = nhắc nhở; >10 phút = "trễ", đối chiếu lịch để QL xác nhận.
- MỌI ca đều cần QL duyệt. Giờ được tính = giờ QL duyệt/sửa (không phải giờ chấm thô). Tăng ca chỉ tính khi QL xác nhận.
- QL duyệt/sửa tại một chỗ, hằng ngày; đợt 1–10 / 11–20 / 21–cuối tháng chỉ để khoá sổ.
- Trả lương theo giờ thực làm kể cả khi trễ.
- NV xem giờ đã duyệt từng ngày ngay sau khi duyệt; KHÔNG xem lương.
- Phát hiện NV quên chấm ra (vẫn "đang làm" sau khi ca kết thúc).

## 6. Phân quyền
- Nhân viên: chấm công, xem giờ đã duyệt, đăng ký lịch, báo hư hỏng, bảng tin. Không xem lương.
- Quản lý: duyệt giờ, tra giờ NV (không thấy lương), xem/in mã QR, xếp lịch. Sửa giờ chỉ khi admin cấp quyền. Không thêm/xoá NV, không xem bảng lương.
- Admin: toàn quyền, cấu hình mọi thứ trong app; chỉ admin tính lương, xem tổng giờ và lương.
- Những thứ thay đổi theo tình hình → QL/admin chỉnh trong app, có lịch sử thay đổi.
- Sẽ bàn giao cho admin khác → cần hướng dẫn riêng cho nhân viên, quản lý, admin.

## 7. Lương (chỉ admin)
- Giữ bố cục + màu bảng lương hiện tại: 1 tab/tháng, NV theo cột, nhóm full-time / part-time / quản lý.
- Công thức: giờ × đơn giá + tiền cơm + giờ nghỉ có lương + phụ cấp + thưởng − tạm ứng − trừ lỗi.
- Tiền cơm: 1 bữa/ngày khi tổng giờ đã duyệt trong ngày ≥7,5h; không tự động cho ngày ca gãy hoặc full-time; ngưỡng chỉnh được theo vị trí (cập nhật 28/10).
- Full-time: lương cố định (chia theo ngày/giờ, trừ khi trễ/về sớm) hoặc theo giờ. Xét tăng lương mỗi 6 tháng theo ngày vào làm.
- Gộp giờ NV xoay quán trên tất cả các quán trong tháng.
- Admin sửa/thêm/xoá khoản lương ngay tại chỗ.
- Trả lương ngày 3 hằng tháng; trả được theo kỳ lẻ (ví dụ 1–15).
- In bảng lương theo quán và theo từng NV; phiếu lương chỉ hiện số tiền. QL gửi phiếu lương dạng ảnh.
- Sau này: so sánh lương giữa các vị trí.

## 8. Thông báo (Telegram, 5 group – mỗi quán 1 group, có bot)
- Báo từng lượt vào/ra ca về group của quán đó.
- Nhắc 1 giờ sau khi ca kết thúc: nêu tên ai quên chấm vào/ra.
- Báo hư hỏng: NV hoặc QL báo, gửi về group quán + trang quản lý; mức Gấp / Bình thường.

## 9. App nhân viên (1 app, có tab + nút đăng xuất)
- Tab: Giờ công, Lịch, Báo hư hỏng (sau này thêm Báo cáo kết ca).
- "Lịch của tôi": đăng ký lịch bận tuần sau trước thứ Bảy, muộn nhất Chủ nhật; ca rảnh phát sinh; "rảnh thêm"; nhận ca trống QL đăng.
- Khảo sát NV 1 lần trong app (thâm niên, vị trí chính/phụ, ca thường làm, kinh nghiệm tăng ca…). KHÔNG hỏi: quán muốn làm, phương tiện, số giờ mong muốn/tuần, dự định làm bao lâu.

## 10. Bảng tin vui (Worker ncafe-bangtin)
- Thanh thông báo trên "Lịch của tôi": ai vừa vào/ra ca kèm lời chúc vui; mascot mặt cười ngộ nghĩnh tự hỏi tự trả lời khi không ai tương tác; ngày đặc biệt (20/10, 20/11, sinh nhật quán); sinh nhật NV từ hồ sơ, chỉ hiện chữ cái đầu.
- Bấm tên một người trên thanh → mở ô gửi lời nhắn riêng cho người đó.
- Ai cũng đăng câu hỏi được, không giới hạn; có trang riêng xem toàn bộ bảng tin.

## 11. Xếp lịch (chỉ quản lý)
- Lịch tự động chỉ để THAM KHẢO đến khi anh Bảo duyệt; chỉ lịch đã duyệt là chính thức; lấy lại được phiên bản lịch cũ.
- QL vẫn sửa lịch trong file lịch của quán (Lịch CFMH - NV 2026, LĐD - Lịch NV). "QL - Lịch CFMH" là bảng QL sắp trước khi công bố.
- Bố cục lịch tuần theo mẫu cũ: khối SÁNG/TRƯA/TỐI, mỗi ô 1 người "Tên (giờ)", số người mỗi ngày, thiếu người ghi "tăng ca thêm". Có Sheet riêng "Lịch tuần Ncafe".
- Màu dòng lịch TP/ĐĐ/TĐ/TNV: không màu = TP, vàng = TĐ, xanh lá = ĐĐ, xanh navy = TNV; dòng đỏ = QL/trưởng ca.
- Mỗi ca cần ≥1 PC; TP và ĐĐ ≥2, thiếu thì báo thiếu.
- Định mức tối thiểu (QL tính trong số PC buổi sáng):
  - TP: sáng 3 PC + 3 PV + 1 BV + 1 RL; trưa 2 PC + 3 PV + 1 BV + 1 RL; tối 2 PC + 3 PV.
  - ĐĐ: sáng 3 PC + RL + 3 PV + 1 BV; trưa 1 PC + 1 PC phụ phục vụ + 1 PV; tối 1 PV + 2 PC.
  - LĐD: sáng 2 PC + 3 PV + 1 RL + 1 BV; trưa 2 PC + 2 PV + 1 RL; tối như trưa.
  - TĐ/TNV: sáng 2 PC (hoặc 1 PC + QL) + 1 PV + 1 RL; trưa 1 PC + 1 PV.
- QL và trưởng ca xếp vào vị trí PC/thu ngân giờ cao điểm.
- Ưu tiên quán chính nhưng xoay vòng để không ai ở 1 quán quá lâu.
- Một người làm được 2 quán/ngày nếu giờ không chồng; full-time được làm 7/7.
- Đã xếp 1 ca trong ngày thì không xếp thêm, trừ ca gãy hoặc tăng ca.
- Số giờ/tuần theo thói quen từng người (không cố định 48h); có người xin làm liên tục chỉ nghỉ 1–2 ngày/tháng.
- Tăng ca chia cho người có khả năng/muốn làm thêm.
- Part-time (sinh viên) đổi lịch theo lịch học → xếp quanh giờ bận; phân biệt người ổn định.
- NV TĐ và TNV làm được mọi việc; thu ngân làm được PC và PV; full-time lâu năm (trừ BV, RL) làm được thu ngân/PC cơ bản lúc vắng.
- Quán thiếu người: chủ quán bù và tuyển thử việc. PV mới học ~4 ngày; PC mới cần 1–2 tuần làm cùng full-time lâu năm.
- Quán tự mở cửa, người nhà thu tiền buổi trưa → không cần xếp người giữ chìa/tiền.
- Mô hình nhân sự theo cách anh xếp thực tế T4–T10 (đầy đủ nhất = mẫu, thấp nhất vẫn chạy = tối thiểu), kèm gợi ý tuyển người.
- Quy trình học: QL xếp 1 tuần → gửi vào app để học, kết hợp dữ liệu chấm công.

## 12. Lộ trình 2 đợt – chốt 30/10/2026
Sau khi đối chiếu code vs yêu cầu 1–11, anh Bảo chốt chia 2 đợt. Thứ tự này là bắt buộc; không xáo trộn, không thêm việc ngoài danh sách.

### ĐỢT 1 – làm trước kỳ lương 3/11/2026 (chỉ kiểm tra/sửa, không thêm tính năng lớn)
1. **Mục 5 – Giờ tính lương**: giờ tính lương = **giờ QL đã duyệt**. Cách `cham` trong `xnDuyet` chỉ hợp lệ khi QL **chủ động chọn** duyệt theo giờ chấm. Bảng lương CHỈ cộng giờ các ca đã duyệt; ca chưa duyệt KHÔNG tính. Thêm test khẳng định.
2. **Mục 5 – Tăng ca**: chưa duyệt thì KHÔNG cộng vào lương. Thêm test khẳng định.
3. **Mục 10 – Sinh nhật NV**: bảng tin CHỈ hiện chữ cái đầu. KHÔNG gửi ngày sinh / họ tên đầy đủ ra Worker nếu không cần. Sửa nếu đang lộ.
4. **Mục 8 – Báo hư hỏng mức Gấp**: báo ngay vào Telegram group quán + hiện trên trang QL. Sửa nếu chưa đúng.
5. **Mục 9 – Nút đăng xuất app NV**: đặt ở phần đầu trang (header), hiện ở MỌI tab của app nhân viên.
6. **Mục 7 – Tiền cơm**: GIỮ cách admin sửa trong Cài đặt. KHÔNG làm giao diện riêng.

**4 điều kiện kèm theo (anh Bảo chốt 30/10)**:
1. **QR.html không thêm nút đăng xuất** – trang quét QR dùng vé 1 phiên, không cần.
2. **Bản thử dùng CHUNG Google Sheet thật**, do đó: (a) KHÔNG gửi Telegram vào group quán (tắt hoặc gửi vào group thử riêng); (b) chỉ thử bằng 1 mã nhân viên thử duy nhất (ví dụ `PV-TEST`); (c) xoá dữ liệu thử sau khi xong; (d) KHÔNG duyệt/sửa giờ của nhân viên thật trên bản thử.
3. **Mục 3 Sinh nhật – xoá dữ liệu đã lộ**: ngoài chặn từ giờ, PHẢI xoá tên đầy đủ và năm sinh đã lưu trong D1 `ncafe-bangtin` (cho phép sửa D1 cho việc này; **sao lưu D1 trước khi xoá**).
4. **Mục 1 Giờ chưa duyệt – liệt kê trước khi lên chính**: trước khi redeploy bản chính, liệt kê số ca tháng 10 còn "Chờ xác nhận" theo từng quán, để quản lý duyệt hết trước kỳ lương 3/11.

### ĐỢT 2 – sau 3/11/2026
1. **Mục 1 – Tách Sheet theo tháng**: ngày 1 hằng tháng, cron tự tạo file Google Sheet riêng chứa dữ liệu tháng trước. CHỈ tạo bản sao, KHÔNG tự xoá dữ liệu gốc.
2. **Mục 3 – Vắng >10 ngày**: chỉ CẢNH BÁO admin. Admin bấm xác nhận mới đổi sang "Nghỉ việc"; app KHÔNG tự đổi.
3. **Mục 5 – Wi-Fi quán**: mặc định "Bắt buộc"; admin chuyển tạm được sang "Cảnh báo" trong Cài đặt (khi mạng quán đổi IP), có ghi lịch sử. Trước khi bật mặc định "Bắt buộc", kiểm đủ IP của cả 5 quán.
4. **Mục 11 – Khôi phục lịch**: khôi phục được lịch tuần BẤT KỲ (không chỉ bản liền trước).
5. **ViTriKiem (khả năng kiêm vị trí)**: thêm cột `ViTriKiem` lấy từ khảo sát nhân viên (vị trí chính/phụ), KHÔNG bắt NV nhập lại.
6. Các mục Xếp lịch còn lại (QL vào giờ cao điểm, xoay vòng cứng, part-time quanh giờ bận, tăng ca ai muốn làm thêm…): liệt kê đề xuất, chờ anh Bảo duyệt sau.

### Quy trình bắt buộc cho mỗi đợt (luật 0)
Báo kế hoạch (giải thích tiếng Việt sẽ sửa gì) → chờ anh Bảo "ok" → sửa code + thêm test → chạy toàn bộ test (0 lỗi) → deploy bản thử + gửi link → chờ anh Bảo "duyệt" → mới redeploy bản chính (`AKfycbyx_dtu8KSl5sqtH…FztzoFXW`).

## 13. Kế hoạch TỔNG chuyển đổi (chốt 31/10/2026)
Thay cho mọi yêu cầu trước. Anh Bảo cho em TỰ LÀM toàn bộ theo thứ tự dưới, chỉ hỏi khi cần.

### Nguyên tắc gốc
1. Mọi thao tác xem/sửa/cài đặt chỉ qua **web app `caphemuoihue.com`**. Không ai phải mở Sheet hay sửa code để chỉnh thông số.
2. GIỮ nguyên cách tính giờ/lương (anh đã đối chiếu 25–31/10 là đúng).
3. Giữ luật trong CLAUDE.md + phân quyền NV/QL/admin + link `caphemuoihue.com`. Mã QR in ở quầy DÙNG TIẾP, không in lại.
4. Google Sheet rút về vai trò **nơi NHẬN BẢN XUẤT** (sao lưu, xem, in). Không còn là nguồn thật.
5. Wi-Fi giữ `Cảnh báo`, CHƯA bật Bắt buộc.

### Thứ tự 8 đợt (lịch ~6–8 tuần)
Anh Bảo đổi thứ tự 31/10 chiều: **A → C → B → D → Cài đặt → E → Xuất/nhập → Mã bí mật** (A trước để giải quyết chậm 6:30). Deploy chính **chỉ sau 3/11**. Khi port chấm công sang Worker, **ÁP luật B luôn**: KHÔNG port phần khớp/đọc lịch, trễ tính theo giờ ca NV tự chọn, lịch chỉ để xem (nếu Xếp lịch còn chạy). A không được deploy khi chưa push lên GitHub; chạy song song ≥ 1 tuần; không cutover 1–3/11.
- **C. TRA CỨU** trong tab Xác nhận giờ (3–5 ngày). Xem mục "Việc chờ deploy sau 3/11" bên dưới.
- **B. Tách Xếp lịch** (3–5 ngày). Chấm công KHÔNG đọc lịch nữa; trễ = so với giờ ca NV tự chọn (ca phát sinh: so với giờ tự nhập); ≤10' nhắc nhở, >10' trễ. Bỏ "có lịch chưa đến", nhãn "ngoài lịch", kiểu duyệt "theo lịch". GIỮ lịch CHỈ ĐỂ XEM trong "Lịch của tôi" (NV) + trang Hôm nay (QL) nếu có lịch; Xếp lịch hỏng → hiện "chưa có lịch", không báo lỗi. Không chạm app Xếp lịch, không chạy lại 136 bài thử Xếp lịch.
- **D. Kiểm tra tự động** (2–3 ngày). Telegram DM thẳng admin (bot `@Cpmhchamcongbot`, anh đã /start lúc 18:34 ngày 31/10 – em lấy chat ID từ webhook update, **KHÔNG được getUpdates vì sẽ phá webhook `tgCallback` đang chạy**). Sáng 6:00 kiểm NV/QL/QR/Worker/Telegram; tối 23:00 kiểm ca dài, quên chấm ra, chấm trùng, 2 quán chồng giờ, lệch giờ duyệt vs giờ quét >30', ca chờ duyệt quá lâu, IP lạ chờ xác nhận, lượt thiếu CF↔Sheet. Khoá sổ đợt: admin upload file Sheet bảng lương thật, app so từng NV (giờ, cơm, tăng ca, nghỉ có lương) – chỉ so, KHÔNG tự sửa. Ổn 1 dòng `✅ Ổn`; không tin = bộ kiểm hỏng. Giờ chỉnh được trong Cài đặt.
- **A. Lượt chấm sang Cloudflare D1 + ảnh R2 + cài đặt chấm công** (2–3 tuần, chạy song song 1 tuần). Chỉ bắt đầu KHI ĐÃ CÓ GITHUB. Worker nhận QR → ghi D1 → trả NV 1–2s → nền gửi Sheet dạng CHỮ THUẦN (`'` đầu các cell IP/ngày/giờ/sdt). Mỗi đêm so 2 bên bằng ID lượt; CF có Sheet thiếu → gửi bù; Sheet có CF thiếu → báo bất thường. **Port TOÀN BỘ logic chấm (qrVao/qrRa + canhBao + wifiChan_ + Telegram + bảng tin hook) sang Worker**. Ảnh **sang R2** (admin đặt số tháng giữ, mặc định 6 tháng). Giữ Drive 6 tháng ảnh cũ rồi xoá dần. **Gộp 31/10: chuyển luôn các cài đặt chấm công cần sang D1 + UI trong tab Cài đặt**: `WifiQuan` (IP), `Ca`, `NHAC_NHO_PHUT`, `TRU_GIO_TRE_PHUT`, luật tự nhận IP (2 NV/2 giờ chỉnh được), `TG_CHAT_*`, `TG_ADMIN_IDS`, `WIFI_CHE_DO`, `WIFI_CHO_XAC_NHAN`. Lương/cơm/đơn giá vẫn ở Sheet (chuyển đợt sau). Mã bí mật vẫn cuối cùng.
- **Cài đặt sang Cloudflare** (1 tuần). Secrets dùng `wrangler secret put` (em tự chuyển qua terminal, KHÔNG in giá trị ra màn hình). Giữ nguyên QR_SECRET + QRVer. Apps Script không còn cần secret vì chức năng Telegram + validate QR **đã port hẳn sang Worker** (anh chọn (b)). Apps Script đọc cài đặt từ Cloudflare, cache cả hai bên; CF lỗi → dùng bản cũ, không dừng chấm, báo admin. Tab CaiDat Sheet giữ 30 ngày rồi xoá.
- **E. Màn hình Cài đặt chi tiết** (1–2 tuần). Mọi hardcoded đưa ra Cài đặt (em liệt kê khi vào đợt, ~15–20 hằng số). Admin đổi được: nhân sự, ca, ngưỡng, Wi-Fi (công tắc Bắt buộc/Cảnh báo, IP từng quán, IP chờ, luật tự nhận: 2 NV/2 giờ chỉnh được cả hai), Telegram, mã bí mật (chỉ nút Đổi), duyệt + **nhập bù ca** (QL nhập giờ VAO/RA + chọn NV + ca + lý do → `ChamCong` tag `NguonNhap='Bu_QL'`), đồng bộ, ảnh, sao lưu. Mọi thay đổi ghi `NhatKySua` (ai–lúc nào–cũ→mới).
- **Xuất/nhập Sheet + sao lưu** (2–3 ngày). Xuất ra Drive `Ncafe - Tra cứu xuất` (bảng lương giữ bố cục + màu cũ); nhập từ file có xem trước, báo dòng lỗi, hoàn tác, sao lưu trước khi nhập. Cron tự sao lưu Sheet hằng tháng.
- **Mã bí mật** (1 ngày, tối quán vắng). Chép từng cái qua wrangler secret, thử QR 5 quán + đăng nhập + Telegram, giữ giá trị cũ đến khi thử xong. Đổi `QR_SECRET` **phải có cảnh báo rõ "QR 5 QUẦY SẼ KHÔNG DÙNG ĐƯỢC, PHẢI IN LẠI"** + bắt admin gõ "XÁC NHẬN" + hiện nút in QR mới. VẪN HỎI anh trước khi đổi QR_SECRET.

### Rủi ro + cách chặn (anh đồng ý toàn bộ 31/10)
- A.3 "ghi 2 bên": UI duyệt đọc **TỪ Cloudflare**, không đọc Sheet (QL quen nhìn Sheet – cần hướng dẫn).
- A.9 "secret lệch": **KHÔNG đổi mã bí mật trong 1 giờ sau mỗi deploy Cloudflare**.
- B.1 "bỏ đọc lịch": QL mất tiện lợi; chấp nhận vì Xếp lịch sẽ là app riêng.
- E "secret port": Telegram có thể gãy vài ngày lần đầu port – chạy song song.
- Lương T10 đã chốt: sao lưu Sheet trước, giữ 1 năm. **Đã sao lưu 31/10 18:38, file `ChamCong-saoluu-20261031` id `1vaW4cQsUMSPiXll0o6Mgr6PGjVJkmazTnq6-kFoVg1s` trong Drive folder `Ncafe - Sao luu Sheet` (id `1s6PqgZyGSCYexv1iWz2xz8OfS2H_xql6`).**

### Quyền em được anh Bảo cấp 31/10 (lưu `.claude/settings.json` ở project)
**Tự làm KHÔNG hỏi**:
- Đọc/sửa/tạo file trong `~/Documents/ncafe/`.
- Chạy test, build (`python3`, `node`, `npm`, `npx`, `bash run_tests.sh`).
- `git` local.
- `clasp push`, `clasp version`, `clasp redeploy` ĐÚNG bản triển khai `AKfycbyx_dtu8KSl5sqtHihWyDLmlhoV-Ea9g_MPeMfk7a_gHI6obVgEKXfsCUehFztzoFXW`; `clasp pull`, `clasp list-*`, `clasp status`.
- `wrangler deploy`, `wrangler d1 execute`/`export` (ncafe-chamcong, ncafe-bangtin), `wrangler d1 list`, `wrangler secret put`/`list`, `wrangler deployments list`, `wrangler rollback`, `wrangler whoami`, `wrangler tail`.
- `curl` (gọi Worker API).
- Tạo bản sao lưu, nén (`zip`, `tar`, `gzip`).

**VẪN PHẢI HỎI anh trước**:
- `rm -rf…`, `rm -r…`, `sudo` (bị deny).
- `clasp deploy` (tạo bản mới), `clasp delete-*`, `clasp undeploy`.
- `wrangler delete`, `wrangler d1 delete`, `wrangler secret delete`, `wrangler kv namespace delete`.
- Đổi `QR_SECRET` (dù đã có capCao – vẫn báo trước).
- Đọc/ghi file ngoài `~/Documents/ncafe/` (trừ bộ nhớ `~/.claude/projects/.../memory/`).

### LÀM NGAY 31/10 (đã làm xong)
- ✅ `.gitignore` + settings.json ở `.claude/`.
- ⚠️ `git init`: **Xcode Command Line Tools hỏng** (`xcrun: invalid active developer path`). Anh cần chạy `xcode-select --install` (GUI, 5–10 phút) để fix. Hoặc `sudo xcode-select --reset`. Trong lúc chờ, em tạo **ZIP baseline** ở `/Users/dangbao/Documents/ncafe-baseline-20261031-1835.zip` (693 KB).
- ✅ Sao lưu Sheet "Chấm công Ncafe" → `ChamCong-saoluu-20261031` trong Drive folder `Ncafe - Sao luu Sheet`.
- ✅ Deploy @126 (chỉ thêm hàm `saoLuuSheetNgay` nội bộ, không ảnh hưởng logic chấm). Test 152/0 pass.

### Việc chờ anh (báo trước khi bắt đầu đợt A)
- **Tạo GitHub account private** + đưa em thông tin (user+repo URL) để em `git remote add + push`.
- **Fix Xcode CLT** (`xcode-select --install`) để `git` chạy. Trước khi fix xong, em dùng ZIP baseline tạm.

### Việc chờ deploy sau 3/11/2026
**TRA CỨU mới trong tab "Xác nhận giờ"** (chốt 31/10, deploy SAU 3/11):
- Bộ lọc: khoảng ngày (nút nhanh Hôm nay/Hôm qua/Tuần này/Tháng này/Đợt 1/2/3), quán, tên-mã NV (gợi ý không dấu), trạng thái, "chỉ chưa duyệt".
- "Chưa duyệt" = `Chờ xác nhận` + `Quên chấm ra` + `Chờ xác nhận IP` (lọc theo `CanhBao LIKE '%IP chờ xác nhận%'`, KHÔNG đổi schema). KHÔNG tính `Từ chối IP`, KHÔNG tính `Đang làm`.
- "Chờ xác nhận IP" nhận diện qua `CanhBao` chứa chuỗi `"IP chờ xác nhận"` (giữ nguyên hạ tầng).
- Dòng tổng: số ca, tổng giờ chấm, tổng giờ đã duyệt, **số lần trễ (chỉ >10')**, **số lần nhắc nhở (1–10')** (tách riêng để anh thấy cả hai), số ca chờ duyệt.
- Admin xuất Sheet: tạo file mới mỗi lần, đặt trong thư mục Drive riêng tên **`Ncafe - Tra cứu xuất`**. Không đụng Sheet gốc.
- Nhớ bộ lọc: localStorage trình duyệt (từng máy).
- Giới hạn khoảng: tối đa **93 ngày**. Trên 500 dòng → chia trang 100 dòng/trang.
- 3 TRA CỨU cùng tồn tại: `traCuuGioCong` (phiếu lương), `traCuuLuoi` (lưới NV × ngày), và TRA CỨU mới trong "Xác nhận giờ". **Sau 2 tuần dùng thử (deploy + 14 ngày), anh Bảo quyết bỏ cái nào** – em sẽ nhắc vào tin đầu tiên sau mốc đó.
- Bài thử mới: lọc theo khoảng ngày, lọc theo tên không dấu, lọc theo trạng thái, dòng tổng tính đúng (4 bài).

---

## Cấu trúc mã nguồn (kỹ thuật)
- `cham-cong/` – app Chấm công. Nguồn: `Code.gs, Luong.gs, NhanSu.gs, LichNV.gs, XacNhan.gs`, `QuanLy.html` (trang quản lý), `QR.html`, `LichCuaToi.html`, `GioCong.html`, `KhaoSat.html`.
  - `build_dist.py` ghép các .gs thành **`dist/Code.gs`** (dự án Apps Script chỉ có 1 file Code.gs + QuanLy.html).
  - Kiểm thử: chạy từ `cham-cong/`: `cat cc_env.js cc_test.js > /tmp/cc_run.js && node /tmp/cc_run.js` → phải "140+ đạt, 0 lỗi" (bật `VN_SHEET`).
  - Mô phỏng: `cat cc_env.js sim.js > /tmp/s.js && ./runsim.sh 1 2 3 …` (mỗi seed 1 tháng).
- `xep-lich/` – app Xếp lịch: `Code.gs, Scheduler.gs, Admin.html, DangKy.html, KhaoSat.html, CheckIn.html, ChamCongQR.html`. Kiểm thử: `bash run_tests.sh` (136+ đạt).
- `cloudflare/` – Worker `ncafe-chamcong` (trang nhân viên: quét mã, Lịch của tôi, trang quản lý `/quan-ly`). `build_worker.py` nhúng `QR.html` / `LichCuaToi.html` / `GioCong.html` / `KhaoSat.html` / `QuanLy.html` vào `worker.js`. Biến môi trường: `APPS_SCRIPT_URL`, `API_KEY`.
- `bangtin/` – Worker bảng tin `ncafe-bangtin` (`worker.js`; chạy thử: `node e2e.mjs` với D1 giả lập SQLite trong `d1mock.mjs`, `node serve.mjs` mở cổng 8770). Góc trò chuyện: kịch bản trong `DEFAULTS.chat` / Cài đặt → chat, nhịp `chat_phut`.
- `xl2/` – bộ đọc file lịch quán (`doclich.js`, nhúng vào `Scheduler.gs` & `Admin.html` & `XacNhan.gs`), dữ liệu lịch thật T6–T10 cho bài thử.
- `demo/` – demo chạy 2 app trong trình duyệt (`runtime.js` giả lập Apps Script).
- Các script còn `/home/claude/...`: `demo/build.py`, `xep-lich/test_all.js`, `xep-lich/run_tests.sh`, `cloudflare/thu_trinh_duyet/*`, `cloudflare/wtest.mjs`, `cloudflare/thu_quanly_e2e_tail.js`.

## Triển khai (KHÔNG copy dán – dùng clasp + wrangler)
- App Chấm công: script ID `1f1OnkFGnpq02FXZkhFNvbr7KuE_MlpwGvLF-CAco8HfZVoYE-k-VcuuH`. Bản triển khai CHÍNH: `AKfycbyx_dtu8KSl5sqtHihWyDLmlhoV-Ea9g_MPeMfk7a_gHI6obVgEKXfsCUehFztzoFXW`.
- App Xếp lịch: bản triển khai `AKfycbzpbUSCCkI2nvj6AEh7lXc851hFxcwlTtZBTZrxpWOD1D8V4qHdZFG9P5w2bYuHVCeB` (script ID `1zJU8UQDsW6RcPs0hn7ndLUA4ecYhMZ84UnkJj1287x9wOfcwOCC91Rt6`).
- Quy trình mỗi lần cập nhật Chấm công:
  1. Sửa nguồn → chạy kiểm thử (phải 0 lỗi, bật `VN_SHEET`).
  2. Tăng phiên bản: `VER` (Code.gs) và `VER_TRANG` (QuanLy.html) PHẢI giống nhau, sửa luôn dòng cuối `HẾT … bản CC …`.
  3. `python3 build_dist.py` → copy `cham-cong/QuanLy.html` + `cham-cong/pull_check/appsscript.json` vào `cham-cong/dist/` → `clasp push -f` từ `dist/`.
  4. `clasp version "<mô tả>"` → nhận số N → `clasp redeploy AKfycbyx_dtu8KSl5sqtH…FztzoFXW -V N -d "<mô tả>"`. KHÔNG dùng `clasp deploy` (sẽ tạo bản triển khai mới = link mới).
  5. Worker đổi: `python3 cloudflare/build_worker.py` → `cd cloudflare && wrangler deploy`. Bảng tin đổi: `cd bangtin && wrangler deploy`.
- `wrangler.toml` 2 Worker đặt `keep_vars = true`, không khai `[vars]`.

## Phiên bản hiện tại
- App Chấm công: **CC 30/10c @125** (wifi tự nhận + Telegram button Phase B, triển khai `AKfycbyx_dtu8KSl5sqtH…FztzoFXW`, 31/10 15:56).
- App Xếp lịch: **29/10e XL** (chưa đụng).
- Worker `ncafe-chamcong`: version `d3b834e4` · `https://ncafe-chamcong.dangbao-mt.workers.dev` (31/10 15:57).
- Worker `ncafe-bangtin`: version `50f18921`, cron `*/5`, D1 binding `DB` · `https://ncafe-bangtin.dangbao-mt.workers.dev` (30/10 22:10).

## Bài học kỹ thuật (đừng lặp lại)
- Google Sheet tiếng Việt TỰ ĐỔI KIỂU khi ghi chữ: `14.254.129.209`→số, `2026-10`→ngày, `2026-10-05`→ngày, `06:30`→giờ, `0905…`→số (mất 0 đầu), `7,5`→7.5. → Ghi chữ dạng `"'"+chữ` (hàm `thGhi_`, `ipGhi_`, `sdtGhi_`, `setCfg`); đọc bằng `dateKey`, `hhmm`, `thKey_`, `ipDoc_`, `sdtDoc_`, `cfgChuan_`. Không so `String(ô)===…` với ngày/tháng/giờ.
- `Utilities.formatDate` rất chậm trên máy chủ Google → luôn gọi qua `fmtTZ_` (có nhớ kết quả).
- Đi trễ: ≤10' nhắc nhở (`NHAC_NHO_PHUT`); >10' đếm là trễ; >15' (`TRU_GIO_TRE_PHUT`) mới trừ giờ (tính từ giờ đến thực tế). Phiếu lương chỉ ghi số lần trễ.
- Trang của NHÂN VIÊN (Giờ công, quét mã): KHÔNG hiện giờ chấm thực tế, ghi chú/lý do QL điều chỉnh, số phút trễ. Chỉ ca theo lịch + giờ đã duyệt; nhãn "có tăng ca" khi duyệt quá giờ ca; nhãn đỏ nhạt "đi trễ" khi trễ > 5'. Nút ghi chú tên là "📝 Ghi chú của bạn". Lời chào khi vào ca: trễ 1–5' khung vàng, > 5' khung đỏ. Câu chữ nhẹ nhàng, tế nhị.
- Lộ trình đã thống nhất: (1) ổn định – kho code GitHub riêng tư, bản thử nghiệm (bản sao Sheet + link thử), sao lưu tự động mỗi đêm, báo lỗi máy chủ về Telegram, tạm ngừng tính năng mới đến hết kỳ lương T11; (2) tăng tốc trên nền hiện tại; (3) đầu 2027 chuyển dữ liệu sang Cloudflare D1, Google Sheet thành báo cáo.
- Bảng tin: Worker riêng `ncafe-bangtin` (D1 binding `DB`, cron `*/5`, biến `FEED_SECRET`). Chạy ở workers.dev (tên miền `caphemuoihue.com` KHÔNG ở Cloudflare → không gắn route được). App Chấm công: Cài đặt chung `BANGTIN_URL` + `BANGTIN_KEY` (= `FEED_SECRET`); `btToken_` ký vé HMAC-SHA256 base64url không `=` giống `makeToken` của bảng tin; `qrVao`/`qrRa` gửi hook in/out và trả `r.bt`; `bangTinVao` cho trang Lịch của tôi; `btDongBo_` gửi NV + NgaySinh mỗi sáng (trong `tgMoi15Phut`). Bài thử BT1 kiểm vé bằng đúng thuật toán của Worker.
- Chức năng mới cho trang nhân viên phải thêm vào CẢ 2 danh sách: `ALLOW` trong `cloudflare/build_worker.py` VÀ `apiHam()` trong Code.gs (bài thử API1 kiểm tra).
- Thử trang nhân viên QUA WORKER THẬT trên máy: `cloudflare/thu_trinh_duyet/` (mock_gas.mjs 8781 + serve_cc.mjs 8780 + bangtin/serve.mjs 8770; `pwtudong.py` thử tự đăng nhập). Luôn thử cả trường hợp máy đã lưu đăng nhập.
- (30/10) Trang quản lý chạy trên Worker ở `/quan-ly`. Hàm QL gọi qua Worker nằm DUY NHẤT trong `apiHamQL()` (Code.gs); `build_worker.py` tự đọc danh sách này làm `ALLOW_QL`. Thêm hàm QL mới: thêm vào `apiHamQL` (hàm phải tự kiểm mã PIN). Bài thử API3 gọi mọi hàm bằng PIN sai, đòi không trả dữ liệu, không đổi bảng. Không đưa hàm phụ (`rows`, `so`, `cong`…) vào danh sách.
- Chạy thử trang quản lý trọn vẹn trên máy: `cat cham-cong/cc_env.js cham-cong/cc_test.js cloudflare/thu_quanly_e2e_tail.js > /tmp/ql.js && node /tmp/ql.js` rồi mở http://127.0.0.1:8771/quan-ly (mã 1234).
- (30/10) Biến global test KHÔNG được trùng tên biến nội bộ Code.gs. Code.gs có `_CC=null` reset cache → dùng `__CCDIR` / `__NCDIR` cho test runner.
- (30/10) Trước khi push lần đầu phải pull live về thư mục riêng (`cham-cong/pull_check/`, `xep-lich/pull_check/`) để đối chiếu danh sách file – `clasp push` thay toàn bộ, thiếu file nào bị xoá file đó trên Google.

## Nhật ký triển khai 30/10/2026 (bản CC 30/10a @121)
Lần đầu dùng clasp + wrangler trên máy anh Bảo (macOS 12.6, node 20 qua nvm). Login: `clasp login` và `wrangler login`, cả hai bằng `dangbao.mt@gmail.com` (Cloudflare account `e542d6bfc6961205441fcfdfc124873d`). Bật `Google Apps Script API` tại `https://script.google.com/home/usersettings` một lần cho tài khoản.

5 bước deploy (từ `~/Documents/ncafe`):
- **A.** `cd cham-cong/dist && clasp push -f` → push 3 file (`Code.gs`, `QuanLy.html`, `appsscript.json`).
- **B.** `clasp version "CC 30/10a"` → tạo phiên bản **121**.
- **C.** `clasp redeploy AKfycbyx_dtu8KSl5sqtHihWyDLmlhoV-Ea9g_MPeMfk7a_gHI6obVgEKXfsCUehFztzoFXW -V 121 -d "CC 30/10a"` – cập nhật bản triển khai chính sang @121, link /exec cũ giữ nguyên.
- **D.** `cd cloudflare && wrangler deploy` → `ncafe-chamcong`.
- **E.** `cd bangtin && wrangler deploy` → `ncafe-bangtin`.

Lần đầu push app Xếp lịch cần xử lý trước: nguồn `xep-lich/Scheduler.gs` tên khác bản live `Schedule.gs`; `CheckIn.html` ↔ `Checkin.html`; `DangKy.html` ↔ `Dangky.html`; 2 file nguồn `ChamCongQR.html`+`KhaoSat.html` chưa có trên Google (`build_copy.py` ghi chú "FILE MỚI"). 30/10 KHÔNG push Xếp lịch, giữ nguyên @`AKfycbzpbUSCCkI2nvj6AEh7lXc851hFxcwlTtZBTZrxpWOD1D8V4qHdZFG9P5w2bYuHVCeB`.
