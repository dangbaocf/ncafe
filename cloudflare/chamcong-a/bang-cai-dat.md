# Bảng cài đặt Ncafe (soát 31/10/2026)

Mục j của ĐỢT A. Mọi khoá đều chuyển sang **D1 (`CaiDat` hoặc bảng chuyên)**. Mã bí mật dùng `wrangler secret` (không lưu D1). "Màn hình chỉnh" là tab Cài đặt của web app sau khi code đợt A xong.

### 1. Mã bí mật (lưu Cloudflare `wrangler secret` – che giá trị, chỉ nút "ĐỔI")
| Khoá | Mặc định | Code đang dùng | Màn hình chỉnh | Ai được sửa |
|---|---|---|---|---|
| `ADMIN_PIN` | `1234` | `taiKhoan`, `authRole`, `tkDayDu` | Cài đặt → Mã bí mật → ĐỔI | admin |
| `QL_PIN` | `5678` | `taiKhoan`, `authRole` | Cài đặt → Mã bí mật → ĐỔI | admin |
| `QR_SECRET` | *UUID sinh lần đầu* | `qrToken`, `qrStore` | Cài đặt → Mã bí mật → ĐỔI (cảnh báo "QR 5 QUẦY HỎNG, PHẢI IN LẠI" + gõ XÁC NHẬN) | admin |
| `TG_TOKEN` | – | `tgGui`, `tgGuiAnh`, `tgEditTin_`, `tgAnswerCallback_`, `tgSetWebhook` | Cài đặt → Telegram → ĐỔI | admin |
| `FEED_SECRET` (= `BANGTIN_KEY`) | – | `btCfg_`, `btGui_`, `btToken_` | Cài đặt → Bảng tin → ĐỔI | admin |
| `API_KEY` | – | Worker↔Apps Script auth | Cài đặt → Mã bí mật → ĐỔI | admin |
| `TG_WEBHOOK_SECRET` | – | Worker `/tg/webhook` verify | Cài đặt → Telegram → ĐỔI | admin |

### 2. Wi-Fi
| Khoá | Mặc định | Code đang dùng | Màn hình chỉnh | Ai được sửa |
|---|---|---|---|---|
| `WIFI_CHE_DO` | `Cảnh báo` | `wifiCheDo`, `wifiChan` | Cài đặt → Wi-Fi → công tắc (Tắt / Cảnh báo / Bắt buộc) | admin |
| `WIFI_CHO_XAC_NHAN` | `Không` | `wifiChan` nhánh choIP | Cài đặt → Wi-Fi → công tắc "Tự nhận IP khi Bắt buộc" | admin |
| `WIFI_CHO_XAC_NHAN_NV` | `2` (mới) | `wifiDemNVKhacCho` | Cài đặt → Wi-Fi → luật tự nhận | admin |
| `WIFI_CHO_XAC_NHAN_GIO` | `2` (mới, đơn vị giờ) | `wifiDemNVKhacCho` | Cài đặt → Wi-Fi → luật tự nhận | admin |
| `WIFI_TU_THEM` | `Có` | `wifiTuThem_` (legacy) | Cài đặt → Wi-Fi → "Tự thêm IP khi 2 NV + GPS" (legacy, có thể bỏ) | admin |
| `WIFI_TU_MAT_MANG` | `Có` | `wifiMatMang_` | Cài đặt → Wi-Fi → "Tự nhận quán mất mạng" | admin |
| `WifiQuan` *(bảng)* | – | `wifiDs`, `wifiThem`, `wifiBo` | Cài đặt → Wi-Fi → bảng IP từng quán (+ Thêm / Gỡ) | admin |
| `WifiCho` *(bảng)* | – | `wifiXacNhanIP`, `tgCallback` | Cài đặt → Wi-Fi → IP đang chờ (Xác nhận / Từ chối) | admin |
| `QR_BAN_KINH` | `100` (m) | `canhBao` (so GPS quán) | Cài đặt → QR → bán kính | admin |

### 3. Ngưỡng trễ / chấm / ca
| Khoá | Mặc định | Code đang dùng | Màn hình chỉnh | Ai được sửa |
|---|---|---|---|---|
| `NHAC_NHO_PHUT` | `10` | `treThongKe_`, `trangThaiRow`, UI | Cài đặt → Ngưỡng → "Trễ ≤ N phút chỉ nhắc" | admin |
| `TRE_PHUT` | `10` | `canhBao`, UI | Cài đặt → Ngưỡng → "Trễ cần duyệt" | admin |
| `TRU_GIO_TRE_PHUT` | `15` | `xnDeXuat`, `xnDuyet` | Cài đặt → Ngưỡng → "Trễ > N thì trừ giờ" | admin |
| `TRE_XEM_LAI_PHUT` | *30* | `canhBao` lại duyệt | Cài đặt → Ngưỡng → "Trễ cao bất thường" | admin |
| `VE_SOM_PHUT` | `10` | `tgSuKien`, UI xác nhận giờ | Cài đặt → Ngưỡng → "Về sớm" | admin |
| `RA_MUON_PHUT` | `30` | `canhBao`, Telegram | Cài đặt → Ngưỡng → "Ra muộn" | admin |
| `LECH_PHUT` | `30` | `canhBao` lệch giờ ca | Cài đặt → Ngưỡng → "Chấm lệch ca" | admin |
| `LAM_TRON_PHUT` | `15` | `lam15`, `xnDuyet` | Cài đặt → Ngưỡng → "Làm tròn giờ (phút)" | admin |
| `TANG_CA_TU_PHUT` | `30` | `xnDeXuat`, `tinhNguoi` | Cài đặt → Ngưỡng → "Tăng ca từ N phút" | admin |
| `GIO_DEM_TU` | `22:00` | `gioDemTu_`, `tinhNguoi` | Cài đặt → Ngưỡng → "Giờ đêm từ" | admin |
| `GIO_BAT_THUONG_NGAY` | `12` | `tinhNguoi` (ca dài bất thường) | Cài đặt → Ngưỡng → "Ca dài bất thường (giờ/ngày)" | admin |
| `GIO_BAT_THUONG_THANG` | `300` | `tinhNguoi` tháng dài bất thường | Cài đặt → Ngưỡng → "Giờ bất thường / tháng" | admin |
| `Ca` *(bảng)* | – | `caMap`, `caTheoMa` | Cài đặt → Ca → giờ BD/KT từng ca theo quán | admin |
| `CoSo` *(bảng)* | – | `qrInfo`, `canhBao` | Cài đặt → Quán → tên, giờ mở/đóng, toạ độ, bán kính | admin |

### 4. Cơm
| Khoá | Mặc định | Code đang dùng | Màn hình chỉnh | Ai được sửa |
|---|---|---|---|---|
| `COM_FT_LUON` | `Không` | `tinhNguoi` (FT có cơm) | Cài đặt → Cơm → "FT luôn có cơm" | admin |
| `COM_NGAY_GAY` | `Có` | `tinhNguoi` (ca gãy có cơm) | Cài đặt → Cơm → "Ngày ca gãy có cơm" | admin |
| `COM_TU_<ViTri>` | `8` (giờ) | `tinhNguoi` ngưỡng cơm | Cài đặt → Cơm → ngưỡng giờ theo vị trí | admin |
| `COM_GIA_<ViTri>` | `20` (nghìn) | `tinhNguoi` mức cơm | Cài đặt → Cơm → mức cơm theo vị trí | admin |

### 5. Lương
| Khoá | Mặc định | Code đang dùng | Màn hình chỉnh | Ai được sửa |
|---|---|---|---|---|
| `LUONG_<ViTri>` | `30`/`25`/`22`/`23`/`22`/`22`/`0` | `luongGio`, `tinhNguoi` | Cài đặt → Lương → đơn giá theo vị trí | admin |
| `GIO_CHUAN_NGAY` | `8` | `tinhNguoi` chia lương cố định | Cài đặt → Lương → giờ chuẩn / ngày | admin |
| `NGAY_CHUAN` | `26` | `tinhNguoi` | Cài đặt → Lương → ngày chuẩn / tháng | admin |
| `HE_SO_TANG_CA` | `1` | `tinhNguoi` (gấp đôi?) | Cài đặt → Lương → hệ số tăng ca | admin |
| `KY_TANG_LUONG_THANG` | `6` | `luong` → tăng lương chu kỳ | Cài đặt → Lương → chu kỳ xét tăng (tháng) | admin |
| `NGAY_TRA_LUONG` | `3` | thông báo lương | Cài đặt → Lương → ngày trả lương hằng tháng | admin |
| `DOT_1_DEN` | `10` | `khoangDot`, `dsDot` | Cài đặt → Lương → ngày cuối đợt 1 | admin |
| `DOT_2_DEN` | `20` | `khoangDot`, `dsDot` | Cài đặt → Lương → ngày cuối đợt 2 | admin |
| `PHAN_HOI_NGAY` | `3` | `phanHoi` giới hạn ngày | Cài đặt → Lương → NV được phản hồi trong N ngày | admin |
| `DE_XUAT_GIO` | `nv` | `xnDeXuat` nguồn giờ | Cài đặt → Lương → đề xuất giờ theo "NV khai" / "giờ chấm" | admin |
| `TU_DUYET_KHOP` | `Không` | `qrRaLoi` (áp luật B, luôn `Không`) | *Ẩn hoặc read-only trong UI* (luật B) | admin |

### 6. Telegram
| Khoá | Mặc định | Code đang dùng | Màn hình chỉnh | Ai được sửa |
|---|---|---|---|---|
| `TG_CHAT` | – | `tgChatCho` fallback | Cài đặt → Telegram → group chung | admin |
| `TG_CHAT_<MaCS>` | – (TP/ĐĐ/TĐ/TNV/LĐD) | `tgChatCho` | Cài đặt → Telegram → group từng quán | admin |
| `TG_ADMIN_IDS` | – (CSV user ID) | `tgCallback` xác nhận IP | Cài đặt → Telegram → danh sách admin bấm | admin |
| `TG_ANH` | `Có` | `tgAnhBat`, `tgGuiAnh` | Cài đặt → Telegram → "Gửi kèm ảnh chấm" | admin |
| `TG_MUC` | `tatca` | `tgSuKien` lọc tin | Cài đặt → Telegram → mức báo (Tất cả / Chú ý / Tắt) | admin |
| `TG_NHAC_CA` | `Có` | `tgNhacCa` | Cài đặt → Telegram → "Nhắc quên chấm ra" | admin |
| `TG_NHAC_LUC` | *00* (lần nhắc gần nhất) | `tgNhacCa` | *tự quản lý, ẩn UI* | – |
| `TG_NHAC_SAU_PHUT` | `60` | `tgNhacCa` | Cài đặt → Telegram → "Nhắc N phút sau khi hết ca" | admin |
| `TG_TONGKET` | `Không` | `tgTongKet` | Cài đặt → Telegram → "Tổng kết cuối ngày" | admin |
| `TG_TONGKET_GIO` | `23` | `tgTongKet` | Cài đặt → Telegram → giờ tổng kết | admin |
| `TG_DA_TONGKET` | – (ngày đã tổng kết) | `tgTongKet` | *tự quản lý, ẩn UI* | – |
| `NHAC_DUYET` | `Có` | `tgNhacDuyet_` | Cài đặt → Telegram → "Nhắc QL duyệt" | admin |
| `NHAC_DUYET_GIO` | `22` | `tgNhacDuyet_` | Cài đặt → Telegram → giờ nhắc duyệt | admin |
| `NHAC_DUYET_DA` | – (ngày đã nhắc) | `tgNhacDuyet_` | *tự quản lý, ẩn UI* | – |
| `KIEM_SANG_GIO` *(mới)* | `6` | kiểm tra tự động (đợt D) | Cài đặt → Kiểm tra → "Giờ kiểm sáng" | admin |
| `KIEM_TOI_GIO` *(mới)* | `23` | kiểm tra tự động (đợt D) | Cài đặt → Kiểm tra → "Giờ kiểm tối" | admin |

### 7. Bảng tin
| Khoá | Mặc định | Code đang dùng | Màn hình chỉnh | Ai được sửa |
|---|---|---|---|---|
| `BANGTIN_URL` | `https://ncafe-bangtin.dangbao-mt.workers.dev` | `btCfg_`, `btGui_`, `btVe_` | Cài đặt → Bảng tin → URL | admin |
| `BANGTIN_KEY` *(= `FEED_SECRET`)* | – | `btCfg_` HMAC | Cài đặt → Bảng tin → ĐỔI (secret) | admin |
| `BANGTIN_DONGBO_NGAY` | – | `btDongBo_` đánh dấu ngày | *tự quản lý, ẩn UI* | – |

### 8. Lưu trữ / sao lưu / ảnh
| Khoá | Mặc định | Code đang dùng | Màn hình chỉnh | Ai được sửa |
|---|---|---|---|---|
| `DRIVE_FOLDER_ID` | *tự sinh* | `luuAnh` (Google Drive) | Cài đặt → Ảnh → folder Drive (xem lại ảnh cũ) | admin |
| `LUU_TRU_SAU_NGAY` | `10` | `luuTruThang`, cron | Cài đặt → Sao lưu → "Tự lưu trữ tháng đã chốt sau N ngày" | admin |
| `LUU_TRU_FOLDER_ID` | *tự sinh* | `luuTruThang` | Cài đặt → Sao lưu → folder lưu trữ | admin |
| `SAO_LUU_FOLDER_ID` | *tự sinh* | `saoLuuSheetNgay` | Cài đặt → Sao lưu → folder sao lưu Sheet | admin |
| `ANH_GIU_NGAY` | `90` | *đợt A: dùng cho R2 xoá ảnh cũ* | Cài đặt → Ảnh → "Giữ ảnh N ngày" (R2 lifecycle) | admin |

### 9. Xếp lịch (áp luật B – chỉ để xem)
| Khoá | Mặc định | Code đang dùng | Màn hình chỉnh | Ai được sửa |
|---|---|---|---|---|
| `DOC_LICH` | `Có` | *đợt A: ép `Không` khi tính trễ* | Cài đặt → Xếp lịch → "Đọc lịch (chỉ để xem)" | admin |
| `LICH_SHEET_ID` | – | `lichNgay` fallback | Cài đặt → Xếp lịch → Sheet ID | admin |
| `XEP_LICH_URL` | – | `linkNV` | Cài đặt → Xếp lịch → URL app Xếp lịch | admin |

### 10. Khác
| Khoá | Mặc định | Code đang dùng | Màn hình chỉnh | Ai được sửa |
|---|---|---|---|---|
| `CF_URL` | `https://ncafe-chamcong.dangbao-mt.workers.dev` | `linkNV` → tạo URL /cham-cong | Cài đặt → Trang NV → URL Cloudflare | admin |
| `PHAN_QUYEN` | – (JSON) | `taiKhoan`, `tkDayDu` | Cài đặt → Phân quyền → tab QL / admin / NV | admin |
| `WIFI_SUCO_<MaCS>` | – (timestamp) | `wifiMatMang_` admin bấm | *tự quản lý, UI "Quán mất mạng"* | QL/admin |

### 11. Hardcoded trong code (chưa phải CaiDat) – cần đưa ra Cài đặt
| Nguồn hardcoded | Giá trị | Nên đưa thành khoá | Màn hình chỉnh |
|---|---|---|---|
| `wifiLaMobile_` regex | `mobile\|cellular\|wireless\|viettel mobile\|mobifone\|vinaphone\|vietnamobile\|reddi\|itel\|gmobile` | `WIFI_MOBILE_REGEX` | Cài đặt → Wi-Fi → từ khoá nhận mạng di động |
| `wifiChan_` cửa sổ 2h | `2 * 3600 * 1000` ms | `WIFI_CHO_XAC_NHAN_GIO` (đã liệt kê) | Cài đặt → Wi-Fi |
| `TG_NHAC_SAU_PHUT` default | `60` | *đã có* | – |
| 93 ngày tối đa Tra cứu | hardcode | `TRA_CUU_MAX_NGAY` | Cài đặt → Tra cứu |
| 500 dòng Tra cứu chia trang | hardcode | `TRA_CUU_CHIA_TRANG` | Cài đặt → Tra cứu |
| Reconcile window đêm | `02:00` | `RECONCILE_GIO` (mới) | Cài đặt → Đồng bộ |
| QR token length | `10` ký tự | *giữ hardcode* (ảnh hưởng QR cũ) | – |

### 12. Phân quyền "Ai được sửa" (giải thích)
- **admin**: toàn quyền. Thao tác secret, đổi mã, phân quyền.
- **QL**: không đụng mục này được. Trang Cài đặt chỉ hiện mục "Quán mất mạng" + mật khẩu bản thân.
- **NV**: không có tab Cài đặt.

### 13. Lưu đâu trong D1
- Bảng `CaiDat (Key TEXT PRIMARY KEY, Value TEXT, Updated TEXT, UpdatedBy TEXT)` – cho mọi khoá đơn (nhóm 2–10).
- Bảng chuyên: `CoSo`, `Ca`, `NhanVien`, `WifiQuan`, `WifiCho`, `PhanQuyen` (JSON cột `Config`).
- Bảng `NhatKySua` ghi mọi thay đổi (ai – khi – khoá – cũ → mới).
- Mã bí mật: KHÔNG lưu D1, dùng `wrangler secret put` (`env.<KEY>` trong Worker).

### 14. Giá trị HIỆN TẠI trong CaiDat Sheet (chưa đọc được từ máy em)
Em không có PIN admin để gọi `caiDat` nên chưa đọc giá trị thực. **Trước khi bật chép sang D1**, em sẽ gọi admin API đọc 1 lần, so với mặc định ở bảng này, chỉ chép khoá nào đã sửa khác mặc định (giảm nhiễu). Những khoá *tự quản lý* (TG_NHAC_LUC, TG_DA_TONGKET, BANGTIN_DONGBO_NGAY, WIFI_SUCO_*, NHAC_DUYET_DA) sẽ KHÔNG chép – để trống, app tự tính lại.
