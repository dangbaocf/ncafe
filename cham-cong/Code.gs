/*******************************************************
 * CHẤM CÔNG NCAFE – app riêng (dự án Apps Script mới)
 * Giữ: danh sách nhân viên (bản gốc, cấp mã), quán, ca, chấm công, giờ đã xác nhận, lương.
 * Chỉ ĐỌC lịch đã xếp từ app Xếp lịch (CaiDat LICH_SHEET_ID) để biết ca hôm nay và so đúng lịch.
 * App Xếp lịch chỉ ĐỌC Sheet này để học. Hai app không sửa dữ liệu của nhau.
 *******************************************************/
var VER='CC 01/11a';
var SS = SpreadsheetApp.getActiveSpreadsheet();

// (30/10) Utilities.formatDate rất chậm trên máy chủ Google (~1–2 ms / lần; bảng lương gọi ~6.000 lần nhưng chỉ ~100 giá trị khác nhau → ~12 giây).
// Nhớ kết quả trong 1 lượt chạy: cùng một mốc giờ + cùng kiểu định dạng thì chỉ đổi một lần.
var _FMT={}, _FMT_SO=0;
function fmtTZ_(d, tz, pat){ if(!(d instanceof Date)) return Utilities.formatDate(d, tz, pat); var k=d.getTime()+'|'+tz+'|'+pat, v=_FMT[k];
  if(v===undefined){ v=Utilities.formatDate(d, tz, pat); if(_FMT_SO++>60000){ _FMT={}; _FMT_SO=0; } _FMT[k]=v; } return v; }
var TZ = 'Asia/Ho_Chi_Minh';

/* ---------- 1. Cài đặt lần đầu ---------- */
// Mọi hệ số admin sửa được (tab Bảng lương → Hệ số, hoặc sửa thẳng tab CaiDat). Tiền lương tính bằng NGHÌN đồng như bảng lương cũ.
var CAI_DAT_MAC_DINH=[['ADMIN_PIN','1234'],['QL_PIN','5678'],['QR_BAN_KINH',100],['TRE_PHUT',10],['LECH_PHUT',30],
  ['HE_SO_TANG_CA',1],['NGAY_CHUAN',26],['GIO_CHUAN_NGAY',8],['KY_TANG_LUONG_THANG',6],['DOT_1_DEN',10],['DOT_2_DEN',20],['NGAY_TRA_LUONG',3],
  ['GIO_BAT_THUONG_NGAY',12],['WIFI_CHE_DO','Cảnh báo'],['WIFI_TU_THEM','Có'],['FILE_CC_CFMH',''],['FILE_CC_LDD',''],['FILE_CC_TNV',''],['FILE_BANG_LUONG',''],['LAM_TRON_PHUT',15],['TANG_CA_TU_PHUT',30],['GIO_DEM_TU','22:00'],['GIO_BAT_THUONG_THANG',300],
  ['LUONG_Quản lý',30],['LUONG_Pha chế',25],['LUONG_Phục vụ',22],['LUONG_Thu ngân',23],['LUONG_Rửa ly',22],['LUONG_Bảo vệ',22],['LUONG_Support',0],
  ['COM_FT_LUON','Không'],['COM_NGAY_GAY','Có'],['COM_TU_Quản lý',8],['COM_GIA_Quản lý',20],['COM_TU_Pha chế',8],['COM_GIA_Pha chế',20],['COM_TU_Phục vụ',8],['COM_GIA_Phục vụ',20],['COM_TU_Thu ngân',8],['COM_GIA_Thu ngân',20],
  ['COM_TU_Rửa ly',8],['COM_GIA_Rửa ly',20],['COM_TU_Bảo vệ',8],['COM_GIA_Bảo vệ',20],
  ['LICH_SHEET_ID',''],['DOC_LICH','Có'],['XEP_LICH_URL',''],['DRIVE_FOLDER_ID',''],['ANH_GIU_NGAY',90],['CF_URL',''],['API_KEY',''],['LUU_TRU_SAU_NGAY',10],['LUU_TRU_FOLDER_ID',''],
  ['TG_TOKEN',''],['TG_CHAT',''],['TG_CHAT_TP',''],['TG_CHAT_DD',''],['TG_CHAT_TD',''],['TG_CHAT_TNV',''],['TG_CHAT_LDD',''],['DE_XUAT_GIO','nv'],['NHAC_NHO_PHUT',10],['TRU_GIO_TRE_PHUT',15],['BANGTIN_URL',''],['BANGTIN_KEY',''],['VE_SOM_PHUT',10],['RA_MUON_PHUT',30],['TU_DUYET_KHOP','Không'],['NHAC_DUYET','Có'],['NHAC_DUYET_GIO',22],['PHAN_HOI_NGAY',3],
  ['TG_MUC','tatca'],['TG_NHAC_CA','Có'],['TG_NHAC_SAU_PHUT',60],['TG_TONGKET','Không'],['TG_TONGKET_GIO',23],['TG_ANH','Có']];
var NV_SEED = {"H": ["MaNV", "Ten", "ViTri", "ChucVu", "ViTriKiem", "Loai", "CoSoChinh", "CoDinh", "TangCaDuoc", "SDT", "TrangThai", "LuongGio", "NgayVao", "GhiChu"], "D": [["101", "C Sương (Võ Thị Tuyết Sương)", "Quản lý", "Quản lý", "Pha chế, Thu ngân", "FT", "TP", "", "Có", "0942644832", "Đang làm", "", "", "Luân phiên TP, ĐĐ, LĐD"], ["102", "My (Nguyễn Huyền My)", "Quản lý", "Quản lý", "Pha chế, Thu ngân", "FT", "DD", "", "Có", "0705939583", "Đang làm", "", "", "Luân phiên ĐĐ, TĐ, LĐD"], ["103", "Nhỏ (Võ Thị Thiện Lương)", "Quản lý", "Quản lý", "Pha chế, Thu ngân", "FT", "TP", "", "Có", "", "Đang làm", "", "", "Luân phiên TP, ĐĐ, TĐ, LĐD"], ["201", "Thanh (Bùi Thị Phương Thanh)", "Pha chế", "Trưởng ca", "Thu ngân", "FT", "TP", "", "Có", "0355884240", "Đang làm", "", "", "Trưởng ca sáng TP"], ["202", "Lài (Hồ Lài)", "Pha chế", "Trưởng ca", "Thu ngân", "FT", "TD", "", "Có", "", "Đang làm", "", "", "Full TĐ, luân phiên TNV, ĐĐ"], ["203", "Nhung (Kim Nhung)", "Pha chế", "Trưởng ca", "Thu ngân", "FT", "TNV", "", "Có", "0343513085", "Đang làm", "", "", "Full TNV, luân phiên TP, LĐD"], ["204", "Quỳnh (Trần Thị Như Quỳnh)", "Pha chế", "Trưởng ca", "Thu ngân", "FT", "LDD", "", "Có", "0826003020", "Đang làm", "", "", "Hay điều sang TP"], ["205", "Linh (Kiều Linh)", "Pha chế", "Nhân viên", "", "FT", "TP", "", "Có", "", "Đang làm", "", "", "Luân phiên TP, TĐ, TNV"], ["206", "Nam", "Pha chế", "Nhân viên", "", "FT", "DD", "", "Có", "", "Đang làm", "", "", "Luân phiên ĐĐ, TP"], ["207", "Phương", "Pha chế", "Nhân viên", "Phục vụ", "FT", "DD", "", "Có", "", "Đang làm", "", "", "Luân phiên ĐĐ, TĐ"], ["208", "C Anh (Kim Anh)", "Pha chế", "Nhân viên", "", "FT", "DD", "", "Có", "", "Đang làm", "", "", "Luân phiên ĐĐ, TNV, TĐ"], ["209", "Thảo (Minh Thảo)", "Pha chế", "Nhân viên", "Thu ngân", "FT", "LDD", "", "Có", "0935663325", "Đang làm", "", "", "Hay điều sang ĐĐ ca tối"], ["210", "Mai (Đặng Thị Xuân Mai)", "Pha chế", "Nhân viên", "Thu ngân", "FT", "LDD", "", "Có", "0777833147", "Đang làm", "", "", "Chủ yếu thu ngân LĐD"], ["211", "Mẫn", "Pha chế", "Nhân viên", "", "PT", "TNV", "", "Có", "", "Đang làm", "", "", "Full TNV"], ["212", "Thục Anh", "Pha chế", "Nhân viên", "", "PT", "DD", "", "Có", "", "Đang làm", "", "", ""], ["213", "Trâm (Thuỳ Trâm)", "Pha chế", "Nhân viên", "", "PT", "TP", "", "Có", "", "Đang làm", "", "", "Luân phiên TP, TĐ, ĐĐ"], ["214", "Hà An", "Pha chế", "Nhân viên", "", "PT", "TP", "", "Không", "", "Đang làm", "", "", ""], ["215", "Ngọc", "Pha chế", "Nhân viên", "Phục vụ", "PT", "DD", "", "Không", "", "Đang làm", "", "", "Vào từ cuối tháng 9"], ["216", "NhiH", "Pha chế", "Nhân viên", "", "FT", "DD", "", "Có", "", "Đang làm", "", "", "Mới từ 19/10, anh xác nhận FT/PT"], ["217", "Trí (Quang Trí)", "Pha chế", "Nhân viên", "", "PT", "LDD", "", "Có", "0795602744", "Đang làm", "", "", "Ca tối LĐD"], ["301", "Khang (Ngô Nguyễn Hoàng Khang)", "Phục vụ", "Trưởng ca", "Bảo vệ, Pha chế", "FT", "LDD", "", "Có", "0767423781", "Đang làm", "", "", ""], ["302", "Châu (Minh Châu)", "Phục vụ", "Nhân viên", "", "FT", "TP", "", "Có", "", "Đang làm", "", "", "Luân phiên TP, TĐ, ĐĐ"], ["303", "H Anh (Huyền Anh)", "Phục vụ", "Nhân viên", "Giữ xe", "FT", "DD", "", "Có", "", "Đang làm", "", "", "Luân phiên ĐĐ, TP, TĐ, TNV"], ["304", "Đan (Linh Đan)", "Phục vụ", "Nhân viên", "Thu ngân, Pha chế", "FT", "DD", "", "Có", "", "Đang làm", "", "", "Luân phiên ĐĐ, TĐ, TP"], ["305", "Thư", "Phục vụ", "Nhân viên", "", "FT", "TD", "", "Có", "", "Đang làm", "", "", "Full/gãy TĐ, ĐĐ"], ["306", "K Hưng (Khánh Hưng)", "Bảo vệ", "Nhân viên", "Phục vụ, Giữ xe", "FT", "TP", "", "Có", "", "Đang làm", "", "", "Bảo vệ ngày TP, kiêm phục vụ"], ["307", "Kim (Tôn Nữ Thiên Kim)", "Phục vụ", "Nhân viên", "Thu ngân", "FT", "LDD", "", "Có", "0967063916", "Đang làm", "", "", ""], ["308", "Trung (Đức Trung)", "Phục vụ", "Nhân viên", "", "FT", "LDD", "", "Có", "0935431541", "Đang làm", "", "", ""], ["309", "Lam (Thanh Lam)", "Phục vụ", "Nhân viên", "", "PT", "TNV", "", "Có", "", "Đang làm", "", "", "Luân phiên TNV, TP, TĐ"], ["310", "T An", "Phục vụ", "Nhân viên", "", "PT", "TNV", "", "Không", "", "Đang làm", "", "", ""], ["311", "Yến", "Phục vụ", "Nhân viên", "", "PT", "TNV", "", "Có", "", "Đang làm", "", "", "Có làm full TNV"], ["312", "Dung (Thuỳ Dung)", "Phục vụ", "Nhân viên", "", "PT", "TP", "", "Có", "", "Đang làm", "", "", ""], ["313", "Đường", "Phục vụ", "Nhân viên", "", "PT", "TP", "", "Không", "", "Đang làm", "", "", "Ca tối TP"], ["314", "Quân", "Phục vụ", "Nhân viên", "", "PT", "TP", "", "Không", "", "Đang làm", "", "", "Luân phiên TP, ĐĐ, TĐ"], ["315", "P Anh", "Phục vụ", "Nhân viên", "", "PT", "DD", "", "Không", "", "Đang làm", "", "", ""], ["316", "Trung", "Phục vụ", "Nhân viên", "", "PT", "DD", "", "Không", "", "Đang làm", "", "", "Khác Đức Trung LĐD"], ["317", "Hoàng", "Phục vụ", "Nhân viên", "Pha chế", "PT", "DD", "", "Có", "", "Đang làm", "", "", ""], ["318", "Sương", "Phục vụ", "Nhân viên", "", "PT", "DD", "", "Không", "", "Đang làm", "", "", "Khác C Sương quản lý"], ["319", "Hân", "Phục vụ", "Nhân viên", "", "PT", "DD", "", "Không", "", "Đang làm", "", "", ""], ["320", "Phụng", "Phục vụ", "Nhân viên", "", "PT", "TP", "", "Không", "", "Đang làm", "", "", ""], ["321", "Nhi", "Phục vụ", "Nhân viên", "", "PT", "TP", "", "Không", "", "Đang làm", "", "", "Ca trưa/tối"], ["322", "Nhi2", "Phục vụ", "Nhân viên", "", "PT", "TP", "", "Không", "", "Đang làm", "", "", "Mới từ 19/10"], ["323", "Dũng", "Phục vụ", "Nhân viên", "", "PT", "TP", "", "Không", "", "Đang làm", "", "", "Mới từ 19/10, khác Dung"], ["324", "Việt", "Phục vụ", "Nhân viên", "", "PT", "TP", "", "Không", "", "Đang làm", "", "", "Mới từ 19/10"], ["325", "Hiếu", "Phục vụ", "Nhân viên", "", "PT", "TP", "", "Không", "", "Đang làm", "", "", "Mới từ 19/10"], ["326", "Vy", "Phục vụ", "Nhân viên", "", "PT", "TD", "", "Không", "", "Đang làm", "", "", ""], ["327", "Hưng (H.Hưng)", "Phục vụ", "Nhân viên", "", "PT", "DD", "", "Không", "", "Đang làm", "", "", "Mới từ 19/10, khác K Hưng"], ["328", "Nguyên", "Phục vụ", "Nhân viên", "", "PT", "TP", "", "Không", "", "Đang làm", "", "", "Làm cả TP và LĐD"], ["329", "Nhơn", "Phục vụ", "Nhân viên", "", "PT", "LDD", "", "Có", "", "Đang làm", "", "", ""], ["330", "Uyên (P.Uyên)", "Phục vụ", "Nhân viên", "", "PT", "LDD", "", "Không", "", "Đang làm", "", "", "Mới từ 19/10"], ["401", "Cô Tuấn", "Rửa ly", "Nhân viên", "", "FT", "DD", "", "Không", "", "Đang làm", "", "", ""], ["402", "Cô Minh", "Rửa ly", "Nhân viên", "", "FT", "DD", "", "Không", "", "Đang làm", "", "", "Tối ĐĐ, có sáng TNV"], ["403", "Phan Tám", "Rửa ly", "Nhân viên", "", "FT", "TP", "Có", "Có", "", "Đang làm", "", "", "Cố định TP"], ["404", "C. Vân", "Rửa ly", "Nhân viên", "", "FT", "LDD", "Có", "Không", "", "Đang làm", "", "", "Cố định LĐD"], ["405", "Cô Loan", "Rửa ly", "Nhân viên", "", "FT", "TD", "", "Không", "", "Đang làm", "", "", "Linh động các cơ sở"], ["406", "Cô Hoà", "Rửa ly", "Nhân viên", "", "FT", "LDD", "", "Có", "0985800256", "Đang làm", "", "", ""], ["407", "Chị Huệ", "Rửa ly", "Nhân viên", "", "FT", "LDD", "", "Không", "0779584552", "Đang làm", "", "", ""], ["501", "A Nhân", "Bảo vệ", "Nhân viên", "Kỹ thuật các cơ sở", "FT", "TP", "Có", "Không", "", "Đang làm", "", "", "Sáng cố định TP"], ["502", "A Lộc", "Bảo vệ", "Nhân viên", "Kho, chở hàng, phụ order", "FT", "DD", "", "Không", "", "Đang làm", "", "", "Kiêm quản lý kho"], ["503", "Chú Lạc", "Bảo vệ", "Nhân viên", "", "FT", "TP", "Có", "Không", "", "Đang làm", "", "", "Cố định TP"], ["504", "Chú Hùng", "Bảo vệ", "Nhân viên", "", "FT", "DD", "", "Có", "", "Đang làm", "", "", ""], ["505", "Chú Tịnh", "Bảo vệ", "Nhân viên", "", "PT", "LDD", "", "Không", "", "Đang làm", "", "", ""], ["601", "Support 1", "Support", "Hỗ trợ", "Pha chế, Phục vụ", "PT", "", "", "Có", "", "Support", "", "", "Người nhà, gọi khi thiếu – đổi tên"], ["602", "Support 2", "Support", "Hỗ trợ", "Pha chế, Phục vụ", "PT", "", "", "Có", "", "Support", "", "", "Người nhà, gọi khi thiếu – đổi tên"], ["603", "Support 3", "Support", "Hỗ trợ", "Pha chế, Phục vụ", "PT", "", "", "Có", "", "Support", "", "", "Người nhà, gọi khi thiếu – đổi tên"], ["604", "Support 4", "Support", "Hỗ trợ", "Pha chế, Phục vụ", "PT", "", "", "Có", "", "Support", "", "", "Người nhà, gọi khi thiếu – đổi tên"]]};
function setup(){
  SS.setSpreadsheetTimeZone(TZ);
  var tabs={
    CaiDat:[['Key','Value']].concat(CAI_DAT_MAC_DINH),
    CoSo:[['MaCS','TenCS','GioMo','GioDong','ViDo','KinhDo','BanKinh','QRVer'],['TP','Trần Phú','06:30','22:30','','',100,''],['DD','Đống Đa','06:30','22:30','','',100,''],
          ['TD','Tản Đà','06:30','18:30','','',100,''],['TNV','Trưng Nữ Vương','06:30','18:30','','',100,''],['LDD','Lê Đình Dương','06:30','22:30','','',100,'']],
    Ca:[['MaCa','TenCa','GioBD','GioKT','SoGio','CoSo'],['PT1','Sáng 6h30–12h','06:30','12:00',5.5,'ALL'],['PT2','Trưa 12h–17h','12:00','17:00',5,'ALL'],
        ['PT3','Tối 17h–22h30','17:00','22:30',5.5,'TP,DD,LDD'],['PT4','Chiều 12h–18h30','12:00','18:30',6.5,'TD,TNV'],['FT1','8h sáng 6h30–14h30','06:30','14:30',8,'ALL'],
        ['FT2','8h chiều 14h30–22h30','14:30','22:30',8,'TP,DD,LDD'],['FT3','8h 8h–17h','08:00','17:00',8,'ALL'],['FT4','8h 10h30–18h30','10:30','18:30',8,'TD,TNV'],
        ['FT10','10,5h 6h30–17h','06:30','17:00',10.5,'ALL'],['FT11','11,5h 6h30–18h','06:30','18:00',11.5,'ALL'],['FT12','Full 6h30–18h30','06:30','18:30',12,'TD,TNV']],
    NhanVien:[NV_SEED.H].concat(NV_SEED.D),
    ChamCong:[['ID','Ngay','MaNV','Ten','MaCS','MaCa','CaBD','CaKT','ViTri','Vao','Ra','TreMin','GioThuc','KhaiLoai','KhaiGio','KhaiGhiChu','TrangThai','GioTinh','XacNhanBoi','XacNhanLuc','CanhBao','AnhVao','AnhRa','ViDo','KinhDo','KhoangCach','ThietBi']],
    TaiKhoan:[['Ten','PIN','VaiTro','SuaGio','GhiChu','Quan'],['Admin','1234','Admin','Có','Toàn quyền'],['Quản lý','5678','Quản lý','Không','Chấm công, xác nhận giờ']],
    LuongNhap:[['Thang','MaNV','Muc','GiaTri']],
    MucLuong:[['Ma','Ten','Loai','An']],
    TamUng:[['ID','Ngay','Thang','MaNV','SoTien','GhiChu','Boi']],
    NgayLe:[['Ngay','Ten','HeSo']],
    NhatKySua:[['Luc','Boi','Thang','MaNV','Muc','Cu','Moi']],
    ChotThang:[['Thang','Luc','Boi']],
    DuyetDot:[['Thang','Dot','Luc','Boi']],
    LichSuLuong:[['Ngay','MaNV','Kieu','Tu','Len','GhiChu','Boi']],
    ThietBi:[['MaNV','ThietBi','LanDau']]
  };
  Object.keys(tabs).forEach(function(n){ var sh=SS.getSheetByName(n);
    if(!sh) sh=SS.insertSheet(n);
    var v=tabs[n], w=v[0].length; v=v.map(function(r){ r=r.slice(0,w); while(r.length<w) r.push(''); return r; });   // mọi dòng đủ số cột như tiêu đề
    if(sh.getLastRow()===0){ sh.getRange(1,1,v.length,w).setValues(v); sh.setFrozenRows(1); }   // tab mới hoặc tab trống
    else if(sh.getLastRow()===1 && v.length>1){ sh.getRange(2,1,v.length-1,w).setValues(v.slice(1)); } });   // chỉ có dòng tiêu đề: nạp lại dữ liệu mẫu (quán, ca, nhân viên, tài khoản)
  ensureCols('NhanVien',['KieuLuong','LuongCoBan','NgayChuan','GioChuanNgay']);
  var co={}; rows('CaiDat').forEach(function(r){ co[r.Key]=1; }); CAI_DAT_MAC_DINH.forEach(function(kv){ if(!co[kv[0]]) SS.getSheetByName('CaiDat').appendRow(kv); }); _CFG=null;
  if(!cfg('API_KEY')) setCfg('API_KEY', Utilities.getUuid().replace(/-/g,''));
  try{ ensureCols('ChamCong',XN_COT); ensureCols('TaiKhoan',['Quan']); }catch(e){}
  try{ if(!ScriptApp.getProjectTriggers().some(function(t){ return t.getHandlerFunction&&t.getHandlerFunction()==='tuDongLuuTru'; })) ScriptApp.newTrigger('tuDongLuuTru').timeBased().everyDays(1).atHour(3).create(); }catch(e){}
  tgDamBaoTrigger();
  ['NhanVien','ChamCong','ThietBi','LuongNhap','TamUng','LichSuLuong'].forEach(function(n){ try{ SS.getSheetByName(n).getRange('A:A').setNumberFormat('@'); }catch(e){} });
  try{ SS.getSheetByName('ChamCong').getRange('C:C').setNumberFormat('@'); }catch(e){}
  return 'Đã cài đặt';
}

/* ---------- 2. Tiện ích ---------- */
function ensureCols(n, cols){ var sh=SS.getSheetByName(n); if(!sh) return; var lc=Math.max(1,sh.getLastColumn()), h=sh.getRange(1,1,1,lc).getValues()[0];
  cols.forEach(function(k){ if(h.indexOf(k)<0){ h.push(k); sh.getRange(1,h.length).setValue(k); } }); }
function up(s){ return String(s==null?'':s).trim().toUpperCase(); }
var _DO=null, _CCM=false;   // (29/10) đo thời gian từng phần trên máy chủ (chỉ khi gọi qua "chay"); _CCM: dùng lại bảng chấm công trong 1 lượt chỉ-đọc
function doTG_(k, t0){ if(_DO) _DO[k]=(_DO[k]||0)+(Date.now()-t0); }
function rows(n){ var t0=Date.now(), sh=SS.getSheetByName(n); if(!sh) return []; var v=sh.getDataRange().getValues(), h=v.shift();
  var kq=v.map(function(r,i){ var o={_r:i+2}; h.forEach(function(k,j){ o[k]=r[j]; }); o._trong=r.join('')===''; return o; }).filter(function(o){ return !o._trong; }); doTG_('đọc '+n, t0); return kq; }   // _r = đúng số dòng trong Sheet, kể cả khi giữa bảng có dòng trống
var _CFG=null;
// (29/10) Google Sheet tự đổi chữ thành ngày / giờ / số khi ghi (VD "2026-10-29" → ngày, "22:30" → giờ). Đọc: trả lại chữ như lúc ghi.
// Ghi: chữ luôn ghi dạng chữ (dấu ' ở đầu không lưu vào ô) – nhờ vậy "đã gửi tổng kết hôm nay", mốc giờ đêm… so sánh đúng.
function cfgChuan_(v){ if(v instanceof Date && !isNaN(v)){ var y=+fmtTZ_(v,TZ,'yyyy'); return y<1901?fmtTZ_(v,TZ,'HH:mm'):fmtDate(v); } return (typeof v==='string')?v.trim():v; }
function cfg(k){ if(!_CFG){ _CFG={}; rows('CaiDat').forEach(function(r){ var key=String(r.Key||'').trim(); if(key) _CFG[key]=cfgChuan_(r.Value); }); } return _CFG[k]===undefined?'':_CFG[k]; }   // bỏ dấu cách / xuống dòng thừa khi dán
function setCfg(k,v){ var sh=SS.getSheetByName('CaiDat'), d=sh.getDataRange().getValues(); if(_CFG) _CFG[k]=v; var gt=(typeof v==='string' && v!=='')?"'"+v:v;
  for(var i=1;i<d.length;i++) if(d[i][0]===k){ sh.getRange(i+1,2).setValue(gt); return; } sh.appendRow([k,gt]); }
function fmtDate(d){ return fmtTZ_(d,TZ,'yyyy-MM-dd'); }
// (29/10) Số điện thoại: Google Sheet đổi "0905123456" thành số 905123456 (mất số 0 đầu) → đọc thêm lại số 0; ghi dạng chữ
function sdtDoc_(v){ var t=String(v==null?'':v).trim().replace(/^'/,''); var so=t.replace(/[^\d+]/g,''); if(/^[1-9]\d{8}$/.test(so)) return '0'+so; return t; }
function sdtGhi_(v){ var t=sdtDoc_(v); return t?"'"+t:''; }
function fmtTime(d){ return fmtTZ_(d,TZ,'HH:mm'); }
function dateKey(v){ if(v instanceof Date) return fmtDate(v); return String(v||'').slice(0,10); }
function hhmm(v){ if(v instanceof Date) return fmtTZ_(v,TZ,'HH:mm'); var s=String(v||''); var m=s.match(/(\d{1,2}):(\d{2})/); return m?(('0'+m[1]).slice(-2)+':'+m[2]):''; }
// Giờ người dùng gõ trong Cài đặt: "23", "23h", "23h30", "23:00" → "23:00" (trước đây "23" không hiểu → tính sai)
function gioChuan_(v, md){ if(v instanceof Date) return hhmm(v); var s=String(v==null?'':v).trim().toLowerCase(), m=s.match(/^(\d{1,2})\s*(?:[:h.g]\s*(\d{1,2})?)?\s*(?:giờ)?$/);
  if(m && +m[1]<24 && (!m[2] || +m[2]<60)) return ('0'+m[1]).slice(-2)+':'+('0'+(m[2]||'0')).slice(-2); return md||''; }
function macDinh_(k){ var x=CAI_DAT_MAC_DINH.filter(function(a){ return a[0]===k; })[0]; return x?x[1]:''; }
function toMin(v){ var t=hhmm(v); if(!t) return null; var p=t.split(':'); return +p[0]*60 + +p[1]; }
function addDays(d,n){ return new Date(d.getTime()+n*864e5); }
function mondayOf(iso){ var d=new Date(String(iso).slice(0,10)+'T12:00:00+07:00'), w=(d.getUTCDay()+6)%7; return fmtDate(addDays(d,-w)); }
function weekDays(t){ var d0=mondayOf(t), out=[]; for(var i=0;i<7;i++) out.push(fmtDate(addDays(new Date(d0+'T12:00:00+07:00'),i))); return out; }
// Tài khoản: tab TaiKhoan (admin thêm / sửa trong app). Quản lý mặc định chỉ xác nhận giờ; điều chỉnh giờ công cần quyền SuaGio.
var _TKROWS=null;   // bảng TaiKhoan đọc 1 lần mỗi lượt gọi; luuTaiKhoan xoá để đọc lại
function tkRows_(){ return _TKROWS||(_TKROWS=(SS.getSheetByName('TaiKhoan')?rows('TaiKhoan'):[])); }
function taiKhoan(pin){ pin=String(pin||'').trim(); if(!pin) return null;
  var tk=tkRows_();
  if(tk.length){ var a=tk.filter(function(t){ return String(t.PIN).trim()===pin; })[0]; if(!a) return null;
    var ad=/admin/i.test(String(a.VaiTro)), tc=/tr[ưu][ởo]ng ca/i.test(String(a.VaiTro)), role=ad?'admin':(tc?'tc':'ql'), rieng=String(a.SuaGio)==='Có';
    return {role:role, ten:String(a.Ten||''), suaGioRieng:rieng, suaGio:ad || rieng || pqMuc_(role,'suagio')>=2}; }
  if(pin===String(cfg('ADMIN_PIN'))) return {role:'admin',ten:'Admin',suaGio:true}; if(pin===String(cfg('QL_PIN'))) return {role:'ql',ten:'Quản lý',suaGio:false}; return null; }
// Cách tính giờ: 'thucte' = theo giờ chấm vào → ra (khi lịch chưa chuẩn); 'lich' = theo ca trong lịch (trễ / về sớm phải duyệt)
function cheDoThucTe(){ return false; }   // đã thay bằng: nhân viên xác nhận cuối ca + quản lý duyệt
function authRole(pin){ var t=taiKhoan(pin); return t?t.role:null; }
/* ---------- PHÂN QUYỀN theo vai trò (Cài đặt → Phân quyền). Admin luôn đủ quyền; 0 = không, 1 = xem, 2 = xem & sửa ---------- */
var PQ_MUC=[['hom','Hôm nay',1],['lich','Lịch & chấm công',1],
  ['duyet','Xác nhận giờ – duyệt theo lời khai, xin phép, báo quên, vắng, phản hồi, khoá sổ đợt',2],
  ['suagio','Điều chỉnh giờ – sửa giờ, tính theo lịch / giờ chấm, đổi quán, thêm lượt, bỏ duyệt',2],
  ['tra','Tra cứu giờ công',1],['qr','Mã QR (sửa = đổi mã, lưu vị trí quán)',2],['hong','Báo hư hỏng (sửa = báo, nhận việc, đã xong)',2],
  ['ks','Khảo sát (sửa = nạp, cấp mã, gắn mã, xác nhận kỹ năng)',2],['ns','Nhân sự (chỉ xem; không thấy lương nếu không có quyền Lương)',1],
  ['luong','Lương – bảng lương, lương từng cơ sở, phiếu lương, tiền cơm (chỉ xem)',1],['nk','Nhật ký sửa',1]];
var PQ_MAC_DINH={ql:{hom:1,lich:1,duyet:2,suagio:0,tra:1,qr:1,hong:2,ks:2,ns:0,luong:0,nk:0}, tc:{hom:1,lich:1,duyet:1,suagio:0,tra:1,qr:1,hong:2,ks:0,ns:0,luong:0,nk:0}};
function pqBang(){ var o=JSON.parse(JSON.stringify(PQ_MAC_DINH)), c={}; try{ c=JSON.parse(String(cfg('PHAN_QUYEN')||'{}')); }catch(e){}
  ['ql','tc'].forEach(function(r){ PQ_MUC.forEach(function(m){ var v=(c[r]||{})[m[0]]; if(v!==undefined && v!=='') o[r][m[0]]=Math.max(0,Math.min(+v||0,m[2])); }); }); return o; }
function pqMuc_(role, key){ if(role==='admin') return 2; var b=pqBang()[role]; return b?(+b[key]||0):0; }
function quyenTK(tk, key){ if(!tk) return 0; if(tk.role==='admin') return 2; if(key==='suagio' && tk.suaGio) return 2; return pqMuc_(tk.role, key); }
function quyen(pin, key){ return quyenTK(taiKhoan(pin), key); }
function quyenMap(tk){ var o={}; PQ_MUC.forEach(function(m){ o[m[0]]=quyenTK(tk,m[0]); }); o.cd=tk&&tk.role==='admin'?2:0; return o; }
function khongQuyen(pin, key, muc){ var t=taiKhoan(pin); if(!t) return {ok:false,msg:'Sai mã'}; if(quyenTK(t,key)<(muc||1)) return {ok:false,msg:'Tài khoản của bạn không có quyền '+(muc>=2?'sửa':'xem')+' mục này'}; return null; }
function phanQuyen(p){ if(authRole(p.pin)!=='admin') return {ok:false,msg:'Chỉ admin'}; return {ok:true, muc:PQ_MUC, bang:pqBang(), macDinh:PQ_MAC_DINH}; }
function luuPhanQuyen(p){ if(authRole(p.pin)!=='admin') return {ok:false,msg:'Chỉ admin'}; var cu=pqBang(), moi={ql:{},tc:{}};
  ['ql','tc'].forEach(function(r){ PQ_MUC.forEach(function(m){ var v=+((p.bang||{})[r]||{})[m[0]]; moi[r][m[0]]=isNaN(v)?cu[r][m[0]]:Math.max(0,Math.min(v,m[2])); }); });
  setCfg('PHAN_QUYEN', JSON.stringify(moi)); var NH=['Không','Xem','Xem & sửa'], VT={ql:'Quản lý',tc:'Trưởng ca'};
  ['ql','tc'].forEach(function(r){ PQ_MUC.forEach(function(m){ if(cu[r][m[0]]!==moi[r][m[0]]) ghiNhatKy('Admin','','','Phân quyền '+VT[r]+': '+m[1].split(' – ')[0].split(' (')[0], NH[cu[r][m[0]]], NH[moi[r][m[0]]]); }); });
  return {ok:true, bang:moi}; }
function tenNgan(t){ return String(t||'').split(' (')[0]; }
function nvByMa(ma){ return rows('NhanVien').filter(function(n){ return up(n.MaNV)===up(ma); })[0]; }
function dangLam(n){ return n && ['Đã nghỉ','Nghỉ việc'].indexOf(String(n.TrangThai||''))<0; }
// Bảng nhỏ ít đổi (Ca, DuyetDot, ChotThang): đọc 1 lần cho mỗi lượt gọi – trước đây đọc lại cho TỪNG thẻ / từng ngày (Xác nhận giờ 100–500 lần đọc)
var _MEMO={}; function memoRows_(n){ return _MEMO[n]||(_MEMO[n]=(SS.getSheetByName(n)?rows(n):[])); } function memoXoa_(n){ if(n) delete _MEMO[n]; else _MEMO={}; }
function caMap(){ var o={}; memoRows_('Ca').forEach(function(c0){ var c=Object.assign({},c0); c.GioBD=hhmm(c.GioBD); c.GioKT=hhmm(c.GioKT); o[c.MaCa]=c; }); return o; }
function caDung(c, maCS){ var s=String(c.CoSo||'ALL'); return s==='ALL' || s.split(',').map(function(x){return x.trim();}).indexOf(maCS)>-1; }
// Làm tròn giờ công theo Cài đặt chung (mặc định 15 phút; 1 = đúng từng phút)
function lamTron_(h){ var st=Math.max(1,+cfg('LAM_TRON_PHUT')||15); return Math.round(Math.round(h*60/st)*st/60*100)/100; }
function lam15(h){ return lamTron_(h); }
function nguongTC_(){ var v=+cfg('TANG_CA_TU_PHUT'); return (cfg('TANG_CA_TU_PHUT')===''||isNaN(v))?30:Math.max(0,v); }

/* ---------- 3. Trang web ---------- */
function doGet(e){
  var p=String((e&&e.parameter&&e.parameter.page)||'').toLowerCase();
  // Trang nhân viên (quét QR, giờ công, khảo sát, lịch) chạy trên Cloudflare; link Google cũ tự chuyển sang
  var dich={qr:'/cham-cong', giocong:'/gio-cong', khaosat:'/khao-sat', lich:'/lich-cua-toi'}[p];
  if(dich){ var cf=String(cfg('CF_URL')||'').replace(/\/+$/,''), q=p==='qr'?'?cs='+encodeURIComponent(String(e.parameter.cs||''))+'&t='+encodeURIComponent(String(e.parameter.t||'')):'';
    var url=cf?cf+dich+q:'', h=url?'<p style="font-family:sans-serif;padding:20px">Trang này đã chuyển. <a href="'+url+'" target="_top" style="font-weight:700">Bấm vào đây để mở</a></p><script>try{window.top.location.href='+JSON.stringify(url)+';}catch(e){}</script>'
      :'<p style="font-family:sans-serif;padding:20px">Trang nhân viên chạy trên Cloudflare. Admin điền link Worker ở Cài đặt → Cài đặt chung (Trang nhân viên trên Cloudflare).</p>';
    return HtmlService.createHtmlOutput(h).setTitle('Chấm công Ncafe').addMetaTag('viewport','width=device-width, initial-scale=1').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL); }
  return HtmlService.createTemplateFromFile('QuanLy').evaluate().setTitle('Chấm công Ncafe').addMetaTag('viewport','width=device-width, initial-scale=1').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/* ---------- 3b. API cho các trang nhân viên chạy trên Cloudflare (quét QR, giờ công, khảo sát) ---------- */
function apiHam(){ return {qrInfo:qrInfo, qrMo:qrMo, qrNhanVien:qrNhanVien, qrVao:qrVao, qrRa:qrRa, gioCongCuaToi:gioCongCuaToi, ksDanhSach:ksDanhSach, ksXacMinh:ksXacMinh, ksGui:ksGui,
  lichCuaToi:lichCuaToi, luuDangKyBanNV:luuDangKyBanNV, themRanhThem:themRanhThem, xoaRanhThem:xoaRanhThem, nhanCa:nhanCa, huyNhanCa:huyNhanCa,
  xinPhep:xinPhep, baoQuenCham:baoQuenCham, phanHoi:phanHoi, baoHong:baoHong, dsBaoHongNV:dsBaoHongNV,
    bangTinVao:bangTinVao, datBietDanh:datBietDanh,
    demCaChoDuyetT10:demCaChoDuyetT10, kiemWifiTu2510:kiemWifiTu2510, batWifiBatBuoc:batWifiBatBuoc,
    tgCallback:tgCallback, saoLuuSheetNgay:saoLuuSheetNgay,
    qrVaoBackfill:qrVaoBackfill, qrRaBackfill:qrRaBackfill,
    exportBangLuongT10:exportBangLuongT10,
    exportChamCongThang:exportChamCongThang,
    exportCaiDatAll:exportCaiDatAll,
    exportNhanVienAll:exportNhanVienAll,
    exportLichSuLuong:exportLichSuLuong,
    xoaLuotTheoID:xoaLuotTheoID,
    qrDangKySdtBackfill:qrDangKySdtBackfill}; }   // (31/10 đợt A) export fn cho worker gọi qua API_KEY để so khớp lương + (1/11) xoá test + đăng ký SDT cách A
/* (30/10b) Số ca "Chờ xác nhận" trong tháng 10/2026 theo quán – trước kỳ lương 3/11 để QL duyệt hết. Chỉ trả số, không tên nhân viên. */
function demCaChoDuyetT10(){
  var today=fmtDate(new Date()), so={}, tong=0;
  ccRows().forEach(function(r){ var d=dateKey(r.Ngay); if(d<'2026-10-01' || d>'2026-10-31') return;
    if(trangThaiRow(r,today)==='Chờ xác nhận'){ var cs=up(r.MaCS||''); so[cs]=(so[cs]||0)+1; tong++; } });
  return {ok:true, thang:'2026-10', tong:tong, theoCS:so};
}
/* (30/10b) Kiểm tra số IP lạ (không trong WifiQuan) đã thấy từ 25/10/2026 đến nay – để quyết định bật WIFI_CHE_DO = 'Bắt buộc'. */
function kiemWifiTu2510(){
  var tu='2026-10-25', dsIP={};
  wifiDs_().forEach(function(w){ var k=String(w.IP||''); if(k) dsIP[k]=up(w.MaCS||''); });
  var sh=SS.getSheetByName('WifiGanDay'); if(!sh) return {ok:true, tu:tu, laDanhSach:Object.keys(dsIP).length, ngoaiDanhSach:[]};
  var data=sh.getDataRange().getValues(), h=data[0];
  var iIP=h.indexOf('IP'), iLC=h.indexOf('LanCuoi'), iSL=h.indexOf('SoLan'), iQ=h.indexOf('Quan'), iBC=h.indexOf('BiChan'), iGQ=h.indexOf('GanQuan');
  var ngoai=[];
  for(var i=1;i<data.length;i++){
    var r=data[i], ip=String(r[iIP]||''); if(!ip) continue;
    var lc=r[iLC], lcS=lc instanceof Date?fmtTZ_(lc,TZ,'yyyy-MM-dd'):String(lc).slice(0,10); if(lcS<tu) continue;
    if(dsIP[ip]) continue;
    var qjs=r[iQ]; try{ qjs=typeof qjs==='string'?JSON.parse(qjs||'{}'):(qjs||{}); }catch(e){ qjs={}; }
    ngoai.push({ip:ip, lanCuoi:lcS, soLan:+r[iSL]||0, quan:qjs, biChan:+r[iBC]||0, ganQuan:+r[iGQ]||0});
  }
  var theoCS={}; ngoai.forEach(function(x){ Object.keys(x.quan||{}).forEach(function(cs){ theoCS[cs]=(theoCS[cs]||0)+(+x.quan[cs]||0); }); });
  return {ok:true, tu:tu, laDanhSach:Object.keys(dsIP).length, soIPLa:ngoai.length, theoCS:theoCS, ngoaiDanhSach:ngoai.sort(function(a,b){ return b.soLan-a.soLan; }).slice(0,30)};
}
/* (30/10b) Bật chế độ Wi-Fi 'Bắt buộc' sau khi em đã tự kiểm xong. Yêu cầu "capCao" riêng để không ai khác bật được qua Worker public. Admin có thể đổi lại bất kỳ lúc nào trong Cài đặt. */
function batWifiBatBuoc(p){
  if(!p || String(p.capCao||'')!=='bat-wifi-30-10c-ncafe') return {ok:false, msg:'Thiếu capCao'};
  var cu=String(cfg('WIFI_CHE_DO')||'Cảnh báo'); if(/^bắt/i.test(cu)) return {ok:true, cu:cu, moi:cu, daBat:true};
  setCfg('WIFI_CHE_DO','Bắt buộc'); _CFG=null;
  try{ ghiNhatKy('Admin','','','Chế độ wifi quán (30/10b bật sau khi kiểm 25/10→nay)', cu, 'Bắt buộc'); }catch(e){}
  return {ok:true, cu:cu, moi:'Bắt buộc', daBat:true};
}

/* (30/10c) Tự nhận IP wifi quán khi mạng quán đổi IP. Nhánh áp dụng khi WIFI_CHE_DO='Bắt buộc'.
   - NV chấm IP lạ → KHÔNG chặn; ghi row ChamCong bình thường + CanhBao có "IP chờ xác nhận"; thêm row WifiCho.
   - Trong 2h cùng quán + cùng IP, có ≥ 2 NV khác nhau VÀ asOrg không thuộc mạng di động → tự thêm IP vào WifiQuan.
   - 1 NV, hoặc nghi mobile → chờ admin xác nhận trong trang QL (Phase A). Phase B sẽ thêm nút Telegram.
*/
var WIFI_CHO_COT=['ID','Luc','MaCS','MaNV','Ten','IP','AsOrg','CCID','Loai','TrangThai','XuLyBoi','LucXong','Anh','MsgID','ChatID'];
function wifiLaMobile_(asOrg){ var s=String(asOrg||''); if(!s) return false; return /\bmobile\b|cellular|wireless|viettel\s*mobile|mobifone|vinaphone|vietnamobile|reddi|itel|gmobile/i.test(s); }
function wifiDemNVKhacCho_(cs, ip, maNVHienTai, duration){
  var now=Date.now(), nay=up(cs||''), set={}, ipK=ipKhoa_(ip);
  rows('WifiCho').forEach(function(r){
    if(String(r.TrangThai||'Cho')!=='Cho') return;
    if(up(r.MaCS||'')!==nay) return;
    if(ipKhoa_(ipDoc_(r.IP))!==ipK) return;
    var t=r.Luc instanceof Date?r.Luc.getTime():0; if(!t || (now-t)>duration) return;
    var ma=String(r.MaNV||''); if(ma && ma!==String(maNVHienTai)) set[ma]=1;
  });
  return Object.keys(set);
}
function wifiThemTuNhan_(cs, ip, asOrg, dsMaNV){
  if(!ip || !cs) return;
  var sh=SS.getSheetByName('WifiQuan'); if(!sh){ sh=SS.insertSheet('WifiQuan'); sh.appendRow(['IP','MaCS','GhiChu','Ngay','Boi','TrangThai']); }
  var daCo=rows('WifiQuan').some(function(w){ return ipKhop_(ip, w.IP) && up(w.MaCS)===up(cs) && String(w.TrangThai||'Dùng')!=='Bỏ'; });
  if(!daCo){ sh.appendRow([ipGhi_(ip), up(cs), 'Tự nhận '+dsMaNV.length+' NV cùng chấm trong 2h'+(asOrg?' ('+String(asOrg).slice(0,60)+')':''), new Date(), 'Hệ thống', 'Dùng']); memoXoa_('WifiQuan'); }
  wifiXuLyQueueTuNhan_(cs, ip, 'Hệ thống – tự nhận '+dsMaNV.length+' NV');
  try{ ghiNhatKy('Hệ thống','','','Tự thêm IP wifi quán (30/10c)','', ip+' @ '+cs+' / '+dsMaNV.join(',')+' / '+(asOrg||'')); }catch(e){}
  try{ tgGui(tgChatCho(cs), '✅ TỰ NHẬN wifi quán: IP '+ip+' @ '+cs+' – '+dsMaNV.length+' NV cùng chấm trong 2h. Admin gỡ trong trang QL → Mã QR → Wifi quán nếu không đúng.'); }catch(e){}
}
function wifiXuLyQueueTuNhan_(cs, ip, by){
  var sh=SS.getSheetByName('WifiCho'); if(!sh) return;
  var h=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0], iTT=h.indexOf('TrangThai'), iXL=h.indexOf('XuLyBoi'), iLX=h.indexOf('LucXong'), ipK=ipKhoa_(ip);
  rows('WifiCho').forEach(function(r){
    if(String(r.TrangThai||'Cho')!=='Cho') return;
    if(up(r.MaCS)!==up(cs) || ipKhoa_(ipDoc_(r.IP))!==ipK) return;
    sh.getRange(r._r, iTT+1).setValue('Da');
    sh.getRange(r._r, iXL+1).setValue(by||'Tự nhận');
    sh.getRange(r._r, iLX+1).setValue(new Date());
    wifiXoaCB_(String(r.CCID));
  });
  memoXoa_('WifiCho');
}
function wifiXoaCB_(ccid){
  if(!ccid) return;
  var sh=SS.getSheetByName('ChamCong'); if(!sh) return;
  var h=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0], iID=h.indexOf('ID'), iCB=h.indexOf('CanhBao'); if(iID<0||iCB<0) return;
  var data=sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).getValues();
  for(var i=0;i<data.length;i++){
    if(String(data[i][iID])===String(ccid)){
      var cb=String(data[i][iCB]||'').split(';').map(function(x){ return x.trim(); }).filter(function(x){ return x && !/^IP chờ xác nhận/i.test(x); }).join('; ');
      sh.getRange(i+2, iCB+1).setValue(cb); memoXoa_('ChamCong'); return;
    }
  }
}
function wifiQueueCho_(cs, maNV, ten, ip, asOrg, ccid, anh, loai){
  var sh=SS.getSheetByName('WifiCho'); if(!sh){ sh=SS.insertSheet('WifiCho'); sh.appendRow(WIFI_CHO_COT); }
  else{ var hc=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0]; WIFI_CHO_COT.forEach(function(k){ if(hc.indexOf(k)<0){ sh.getRange(1,hc.length+1).setValue(k); hc.push(k); } }); }
  var id=idMoi('W');
  sh.appendRow([id, new Date(), up(cs), String(maNV), ten, ipGhi_(ip), String(asOrg||''), String(ccid||''), String(loai||''), 'Cho', '', '', String(anh||''), '', '']);
  memoXoa_('WifiCho'); return id;
}
function wifiBaoChoIP_(s, n, wc, gio, idCho){
  try{ var cs=s.MaCS, chat=tgChatCho(cs); if(!chat || !idCho) return;
    var txt='🛜 IP CHỜ XÁC NHẬN · '+(s.TenCS||cs)+'\n'+tenNgan(n.Ten)+' ('+String(n.MaNV)+') vừa chấm '+(wc.loai==='RA'?'RA':'VÀO')+' ca lúc '+gio+'\nIP: '+wc.ip+(wc.asOrg?' · '+wc.asOrg:'')+(wc.mobile?' · NGHI MOBILE 4G':'')+'\n(Chỉ quản lý/admin đã khai Telegram ID trong Cài đặt mới bấm được. 2 NV khác nhau trong 2h sẽ tự nhận.)';
    var mk={inline_keyboard:[[{text:'✅ Xác nhận',callback_data:'w|'+idCho+'|a'},{text:'❌ Từ chối',callback_data:'w|'+idCho+'|r'}]]};
    var r=wc.anh?tgGuiAnhNut_(chat, txt, wc.anh, mk):tgGuiNut_(chat, txt, mk);
    if(r && r.message_id){ wifiCapNhatMsg_(idCho, r.chat_id||chat, r.message_id); }
  }catch(e){}
}
function tgGuiNut_(chat, text, markup){
  var tk=String(cfg('TG_TOKEN')||''); if(!tk || !chat) return null;
  try{ var r=UrlFetchApp.fetch('https://api.telegram.org/bot'+tk+'/sendMessage',{method:'post',contentType:'application/json',payload:JSON.stringify({chat_id:chat,text:text,disable_web_page_preview:true,reply_markup:markup}),muteHttpExceptions:true});
    var j=JSON.parse(r.getContentText()||'{}'); return j.ok?{ok:true, message_id:j.result&&j.result.message_id, chat_id:j.result&&j.result.chat&&j.result.chat.id}:null;
  }catch(e){ return null; }
}
function tgGuiAnhNut_(chat, text, anh, markup){
  var tk=String(cfg('TG_TOKEN')||''); if(!tk || !chat) return null;
  var m=String(anh||'').match(/^data:(image\/[a-z]+);base64,(.+)$/); if(!m) return tgGuiNut_(chat, text, markup);
  try{ var blob=Utilities.newBlob(Utilities.base64Decode(m[2]), m[1], 'anh.jpg');
    var r=UrlFetchApp.fetch('https://api.telegram.org/bot'+tk+'/sendPhoto',{method:'post',payload:{chat_id:String(chat),caption:String(text).slice(0,1020),photo:blob,reply_markup:JSON.stringify(markup)},muteHttpExceptions:true});
    var j=JSON.parse(r.getContentText()||'{}'); return j.ok?{ok:true, message_id:j.result&&j.result.message_id, chat_id:j.result&&j.result.chat&&j.result.chat.id, photo:true}:null;
  }catch(e){ return tgGuiNut_(chat, text, markup); }
}
function tgEditTin_(chat, msgId, text, isPhoto){
  var tk=String(cfg('TG_TOKEN')||''); if(!tk || !chat || !msgId) return;
  var endpoint=isPhoto?'editMessageCaption':'editMessageText', body={chat_id:chat, message_id:msgId}; body[isPhoto?'caption':'text']=String(text).slice(0,1020);
  try{ UrlFetchApp.fetch('https://api.telegram.org/bot'+tk+'/'+endpoint,{method:'post',contentType:'application/json',payload:JSON.stringify(body),muteHttpExceptions:true}); }catch(e){}
}
function tgAnswerCallback_(id, text, alert){
  var tk=String(cfg('TG_TOKEN')||''); if(!tk || !id) return;
  try{ UrlFetchApp.fetch('https://api.telegram.org/bot'+tk+'/answerCallbackQuery',{method:'post',contentType:'application/json',payload:JSON.stringify({callback_query_id:id, text:String(text||'').slice(0,200), show_alert:!!alert}),muteHttpExceptions:true}); }catch(e){}
}
function wifiCapNhatMsg_(idCho, chatId, msgId){
  var sh=SS.getSheetByName('WifiCho'); if(!sh) return;
  var h=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0], iMsg=h.indexOf('MsgID'), iChat=h.indexOf('ChatID');
  rows('WifiCho').forEach(function(r){ if(String(r.ID)===String(idCho)){ sh.getRange(r._r, iMsg+1).setValue(String(msgId)); sh.getRange(r._r, iChat+1).setValue(String(chatId)); } });
  memoXoa_('WifiCho');
}
function wifiXacNhanIP_(id, hanhDong, by){   // internal: không check PIN, caller phải check quyền
  var r=rows('WifiCho').filter(function(x){ return String(x.ID)===String(id); })[0]; if(!r) return {ok:false,msg:'Không tìm thấy'};
  if(String(r.TrangThai||'Cho')!=='Cho') return {ok:false,msg:'Đã xử lý trước đó'};
  var cs=up(r.MaCS||''), ip=ipDoc_(r.IP), ccid=String(r.CCID||'');
  if(hanhDong==='nhan'){ wifiThemTuNhan_(cs, ip, String(r.AsOrg||''), [String(r.MaNV)]); return {ok:true, da:'nhan', chat:String(r.ChatID||''), msg:String(r.MsgID||''), photo:!!r.Anh}; }
  if(hanhDong==='tuChoi'){
    var sh=SS.getSheetByName('WifiCho'), h=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
    sh.getRange(r._r, h.indexOf('TrangThai')+1).setValue('TuChoi');
    sh.getRange(r._r, h.indexOf('XuLyBoi')+1).setValue(by||'Admin');
    sh.getRange(r._r, h.indexOf('LucXong')+1).setValue(new Date());
    try{ var sh2=SS.getSheetByName('ChamCong'), h2=sh2.getRange(1,1,1,sh2.getLastColumn()).getValues()[0], iID=h2.indexOf('ID'), iTT=h2.indexOf('TrangThai'), iCB=h2.indexOf('CanhBao');
      var data=sh2.getRange(2,1,sh2.getLastRow()-1,sh2.getLastColumn()).getValues();
      for(var i=0;i<data.length;i++){
        if(String(data[i][iID])===ccid){
          sh2.getRange(i+2, iTT+1).setValue('Từ chối IP');
          var cb=String(data[i][iCB]||'').split(';').map(function(x){ return x.trim(); }).filter(function(x){ return x && !/^IP chờ xác nhận/i.test(x); });
          cb.push('IP bị từ chối ('+(by||'Admin')+')'); sh2.getRange(i+2, iCB+1).setValue(cb.join('; ')); break;
        }
      }
      memoXoa_('ChamCong');
    }catch(e){}
    memoXoa_('WifiCho');
    try{ tgGui(tgChatCho(cs), '❌ TỪ CHỐI IP '+ip+' @ '+cs+' bởi '+(by||'Admin')+'. Lượt chấm của '+r.Ten+' đã huỷ – nhân viên cần chấm lại khi vào wifi quán.'); }catch(e){}
    return {ok:true, da:'tuChoi', chat:String(r.ChatID||''), msg:String(r.MsgID||''), photo:!!r.Anh};
  }
  return {ok:false,msg:'Hành động không hợp lệ'};
}
function wifiDsCho(p){
  if(authRole(p.pin)!=='admin') return {ok:false,msg:'Chỉ admin'};
  var ds=rows('WifiCho').filter(function(r){ return String(r.TrangThai||'Cho')==='Cho'; }).map(function(r){
    return {ID:String(r.ID), Luc:r.Luc instanceof Date?fmtTZ_(r.Luc,TZ,'dd/MM HH:mm'):String(r.Luc||''), MaCS:r.MaCS, MaNV:String(r.MaNV), Ten:r.Ten, IP:ipDoc_(r.IP), AsOrg:r.AsOrg, CCID:String(r.CCID), Loai:r.Loai, Anh:r.Anh||''};
  }).reverse();
  return {ok:true, list:ds};
}
function wifiXacNhanIP(p){
  var role=authRole(p.pin); if(role!=='admin') return {ok:false,msg:'Chỉ admin'};
  var tk=tkDayDu(p.pin), tenAdmin=(tk&&tk.ten)||'Admin';
  return wifiXacNhanIP_(p.id, p.hanhDong, tenAdmin);
}
/* (30/10c Phase B) tgCallback: Telegram gửi callback_query khi admin bấm nút inline.
   - callback_data dạng "w|<idCho>|a" (xác nhận) hoặc "w|<idCho>|r" (từ chối).
   - Check from.id thuộc TG_ADMIN_IDS (comma-separated trong CaiDat); không khớp → answerCallbackQuery "Chỉ quản lý được xác nhận".
   - Khớp → gọi wifiXacNhanIP_ với tên = from.first_name; editMessageCaption/Text thành "✅ Đã xác nhận bởi …" hoặc "❌ Đã từ chối bởi …". */
/* (31/10) Sao lưu Google Sheet "Chấm công Ncafe" sang file bản sao trong Drive, lưu trong thư mục "Ncafe - Sao luu Sheet". Chạy 1 lần khi anh Bảo yêu cầu (dùng capCao để không ai khác gọi được). */
function saoLuuSheetNgay(p){
  if(!p || String(p.capCao||'')!=='sao-luu-311026-ncafe') return {ok:false, msg:'Thiếu capCao'};
  var ten=String(p.ten||('ChamCong-saoluu-'+fmtTZ_(new Date(),TZ,'yyyyMMdd')));
  var sheet=SpreadsheetApp.getActive(), id=sheet.getId();
  var folder=null; try{ var fid=cfg('SAO_LUU_FOLDER_ID'); if(fid) folder=DriveApp.getFolderById(fid); }catch(e){}
  if(!folder){ folder=DriveApp.createFolder('Ncafe - Sao luu Sheet'); setCfg('SAO_LUU_FOLDER_ID', folder.getId()); }
  var file=DriveApp.getFileById(id).makeCopy(ten, folder);
  try{ ghiNhatKy('Hệ thống','','','Sao lưu Sheet (31/10)','', ten+' @ '+file.getUrl()); }catch(e){}
  return {ok:true, ten:ten, id:file.getId(), url:file.getUrl(), folder:folder.getName(), folderId:folder.getId()};
}
/* ---- (31/10 đợt A) Backfill từ Cloudflare D1 ----
 * Worker ncafe-chamcong gọi hàm này qua ctx.waitUntil sau khi ghi D1.
 * Idempotent theo cột ID (ChamCong Sheet có cột ID). Ghi chữ thuần (prefix ' cho IP/ngày/giờ/sdt).
 * KHÔNG cần PIN – authz đã qua API_KEY ở lớp doPost. */
/** (1/11 Việc 2 cách A) NV đăng ký SĐT lần đầu qua QR. Worker gọi fn này (API_KEY).
 *  Ghi SDT vào Sheet NhanVien, đánh dấu SdtCho='Có' (QL duyệt sau). */
function qrDangKySdtBackfill(p){
  if (!p || !p.MaNV || !p.SDT) return {ok:false, msg:'Thiếu MaNV/SDT'};
  var sh = SS.getSheetByName('NhanVien'); if (!sh) return {ok:false, msg:'Thiếu bảng NhanVien'};
  try{ ensureCols('NhanVien', ['SdtCho']); }catch(e){}
  var h = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0], iMa = h.indexOf('MaNV'), iSDT = h.indexOf('SDT'), iCho = h.indexOf('SdtCho');
  if (iMa < 0 || iSDT < 0) return {ok:false, msg:'Thiếu cột'};
  var ids = sh.getRange(2, iMa+1, sh.getLastRow()-1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]).toUpperCase() === String(p.MaNV).toUpperCase()) {
      sh.getRange(i+2, iSDT+1).setValue(sdtGhi_(p.SDT));
      if (iCho >= 0) sh.getRange(i+2, iCho+1).setValue(p.SdtCho || 'Có');
      try{ ghiNhatKy('NV đăng ký lần đầu', '', p.MaNV, 'SDT (chờ QL)', '', '••••'); }catch(e){}
      return {ok:true, dong:i+2};
    }
  }
  return {ok:false, msg:'Không tìm thấy NV'};
}

function qrVaoBackfill(p){
  if(!p || !p.ID) return {ok:false, msg:'Thiếu ID'};
  try{ ensureCols('ChamCong', XN_COT); }catch(e){}
  var sh=SS.getSheetByName('ChamCong'); if(!sh) return {ok:false, msg:'Thiếu bảng ChamCong'};
  var h=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0], iID=h.indexOf('ID');
  if(iID<0) return {ok:false, msg:'Thiếu cột ID'};
  if(sh.getLastRow()>1){
    var ids=sh.getRange(2,iID+1,sh.getLastRow()-1,1).getValues();
    for(var i=0;i<ids.length;i++) if(String(ids[i][0])===String(p.ID)) return {ok:true, boQua:'trung_id'};
  }
  var ghi={ID:String(p.ID), Ngay:"'"+String(p.Ngay||''), MaNV:"'"+String(p.MaNV||''), Ten:String(p.Ten||''), MaCS:String(p.MaCS||''),
    MaCa:String(p.MaCa||''), CaBD:"'"+String(p.CaBD||''), CaKT:"'"+String(p.CaKT||''), ViTri:String(p.ViTri||''),
    Vao:"'"+String(p.Vao||''), TreMin:+p.TreMin||0, TrangThai:String(p.TrangThai||'Đang làm'),
    CanhBao:String(p.CanhBao||''), AnhVao:String(p.AnhVao||''), ViDo:p.ViDo==null?'':+p.ViDo||'', KinhDo:p.KinhDo==null?'':+p.KinhDo||'',
    KhoangCach:p.KhoangCach==null?'':+p.KhoangCach||'', ThietBi:"'"+String(p.ThietBi||''), IP:"'"+String(p.IP||''),
    AsOrg:String(p.AsOrg||''), NguonNhap:'CF_D1'};
  var row=h.map(function(k){ return ghi.hasOwnProperty(k)?ghi[k]:''; });
  sh.appendRow(row);
  return {ok:true, dong:sh.getLastRow()};
}
function qrRaBackfill(p){
  if(!p || !p.ID) return {ok:false, msg:'Thiếu ID'};
  try{ ensureCols('ChamCong', XN_COT); }catch(e){}
  var sh=SS.getSheetByName('ChamCong'); if(!sh) return {ok:false, msg:'Thiếu bảng ChamCong'};
  var h=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0], iID=h.indexOf('ID'); if(iID<0) return {ok:false, msg:'Thiếu cột ID'};
  if(sh.getLastRow()<2) return {ok:true, chuaCoVao:true};   // chưa có record vao
  var ids=sh.getRange(2,iID+1,sh.getLastRow()-1,1).getValues(), rowIdx=-1;
  for(var i=0;i<ids.length;i++) if(String(ids[i][0])===String(p.ID)){ rowIdx=i+2; break; }
  if(rowIdx<0) return {ok:true, chuaCoVao:true};   // vao chưa đến (hiếm: ra đến trước vao qua waitUntil)
  var doi={Ra:"'"+String(p.Ra||''), GioThuc:+p.GioThuc||0, KhaiLoai:String(p.KhaiLoai||''), KhaiGio:+p.KhaiGio||0,
    KhaiTu:"'"+String(p.KhaiTu||''), KhaiDen:"'"+String(p.KhaiDen||''), KhaiGhiChu:String(p.KhaiGhiChu||''),
    CoMat:"'"+String(p.CoMat||''), LyDo:String(p.LyDo||''), TrangThai:String(p.TrangThai||'Chờ xác nhận'),
    GioTinh:+p.GioTinh||0, AnhRa:String(p.AnhRa||''), CanhBao:String(p.CanhBao||'')};
  Object.keys(doi).forEach(function(k){ var ci=h.indexOf(k); if(ci>=0) sh.getRange(rowIdx, ci+1).setValue(doi[k]); });
  return {ok:true, dong:rowIdx};
}

/* ---- (1/11 đợt A) Export cho worker gọi qua API_KEY, dùng để so khớp lương song song ----
 * KHÔNG check PIN vì doPost đã check env.API_KEY (worker ncafe-chamcong). Chỉ worker có
 * API_KEY secret, nên nhân viên không gọi được qua /cham-cong/api route (ALLOW cũng
 * cần list, worker build_worker.py gatekeep). */
function exportBangLuongT10(p){
  var th=String((p&&p.thang)||'2026-10');
  var cc=duLieuThang(th), nhap=nhapThang(th), ung=tamUngThang(th), M=mucLuong(), le=ngayLeMap();
  var list=rows('NhanVien').filter(function(n){ var m=up(n.MaNV); return cc[m] || nhap[m] || ung[m] || (dangLam(n) && nghinTien(n.LuongCoBan)>0 && String(n.KieuLuong)==='Cố định'); })
    .map(function(n){ try{ return tinhNguoi(n, cc[up(n.MaNV)]||[], nhap, ung, M, le, th); } catch(e){ return {MaNV:n.MaNV, Ten:n.Ten, _loi:e.message}; } })
    .sort(function(a,b){ return a.MaNV<b.MaNV?-1:1; });
  // Export thêm nhap + ung + muc để D1 so khớp
  return {ok:true, thang:th, list:list, soNV:list.length, nhap:nhap, ung:ung, muc:M, le:le};
}
function exportChamCongThang(p){
  var th=String((p&&p.thang)||'2026-10');
  var out=[]; ccRows().forEach(function(r){ if(dateKey(r.Ngay).slice(0,7)===th) out.push({ID:r.ID, Ngay:dateKey(r.Ngay), MaNV:String(r.MaNV||''), MaCS:String(r.MaCS||''),
    MaCa:String(r.MaCa||''), CaBD:hhmm(r.CaBD), CaKT:hhmm(r.CaKT), ViTri:String(r.ViTri||''),
    Vao:hhmm(r.Vao), Ra:hhmm(r.Ra), TreMin:+r.TreMin||0, GioThuc:+r.GioThuc||0, KhaiLoai:String(r.KhaiLoai||''),
    KhaiGio:+r.KhaiGio||0, GioTinh:+r.GioTinh||0, TrangThai:String(r.TrangThai||'')}); });
  return {ok:true, thang:th, soCa:out.length, cc:out};
}
function exportCaiDatAll(p){
  var out={}; rows('CaiDat').forEach(function(r){ out[String(r.Key)]=String(r.Value); });
  return {ok:true, cfg:out, soKhoa:Object.keys(out).length};
}
function exportNhanVienAll(p){
  var list=rows('NhanVien').map(function(n){ var sdt=sdtDoc_(n.SDT); return {MaNV:String(n.MaNV), Ten:String(n.Ten||''), ViTri:String(n.ViTri||''),
    ChucVu:String(n.ChucVu||''), Loai:String(n.Loai||''), CoSoChinh:String(n.CoSoChinh||''),
    LuongGio:+n.LuongGio||0, LuongCoBan:+n.LuongCoBan||0, KieuLuong:String(n.KieuLuong||''),
    NgayVao:String(n.NgayVao||'').slice(0,10), NgaySinh:String(n.NgaySinh||'').slice(0,10),
    GioChuanNgay:+n.GioChuanNgay||0, NgayChuan:+n.NgayChuan||0,
    SDT:sdt, SDT4:sdt?sdt.slice(-4):'',   // (1/11) chép sang D1 để kiểm sdt4 ở lớp CF (không gửi về điện thoại NV)
    TrangThai:String(n.TrangThai||'Đang làm')}; });
  return {ok:true, list:list, so:list.length};
}
/** (1/11) Xoá record Sheet ChamCong theo danh sách ID. Dùng xoá dấu test từ CF.
 *  Auth qua API_KEY (doPost đã check). KHÔNG cần PIN. */
function xoaLuotTheoID(p){
  var ids = (p && p.ids) || []; if (!ids.length) return {ok:true, soXoa:0};
  var sh = SS.getSheetByName('ChamCong'); if (!sh) return {ok:false, msg:'Thiếu bảng ChamCong'};
  var h = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0], iID = h.indexOf('ID');
  if (iID < 0) return {ok:false, msg:'Thiếu cột ID'};
  var v = sh.getRange(2, iID+1, sh.getLastRow()-1, 1).getValues();
  var idSet = {}; ids.forEach(function(x){ idSet[String(x)] = 1; });
  var xoa = []; for (var i = v.length-1; i >= 0; i--) if (idSet[String(v[i][0])]) xoa.push(i+2);
  xoa.forEach(function(r){ sh.deleteRow(r); });
  try{ ghiNhatKy('CF xoá test', '', '', 'Xoá lượt test 1/11', '', ids.join(',').slice(0,200)); }catch(e){}
  return {ok:true, soXoa:xoa.length, idXoa:ids};
}

function exportLichSuLuong(p){
  var r = (SS.getSheetByName('LichSuLuong')?rows('LichSuLuong'):[]).map(function(x){
    return {MaNV:String(x.MaNV||''), Kieu:String(x.Kieu||''), Ngay:dateKey(x.Ngay), Tu:+x.Tu||0, Len:+x.Len||0, TuMacDinh:String(x.TuMacDinh||'')};
  });
  var lk = (SS.getSheetByName('LuongKhoang')?rows('LuongKhoang'):[]).map(function(x){
    return {ID:String(x.ID), MaNV:String(x.MaNV||''), Tu:dateKey(x.TuNgay), Den:dateKey(x.DenNgay), Kieu:String(x.Kieu||'gio'), GiaTri:+x.GiaTri||0, GhiChu:String(x.GhiChu||'')};
  });
  return {ok:true, lsLuong:r, luongKhoang:lk};
}
function tgCallback(update){
  try{
    if(!update || !update.callback_query) return {ok:true, bo:'not_callback'};
    var cq=update.callback_query, data=String(cq.data||''), from=cq.from||{}, tenTG=String(from.first_name||'Người lạ');
    if(data.indexOf('w|')!==0) { tgAnswerCallback_(cq.id, 'Không hiểu lệnh'); return {ok:true, bo:'no_prefix'}; }
    var pt=data.split('|'); if(pt.length<3) { tgAnswerCallback_(cq.id, 'Dữ liệu không hợp lệ'); return {ok:true, bo:'short_data'}; }
    var idCho=pt[1], act=pt[2]==='a'?'nhan':(pt[2]==='r'?'tuChoi':'');
    if(!act) { tgAnswerCallback_(cq.id, 'Hành động không rõ'); return {ok:true, bo:'no_act'}; }
    var ids=String(cfg('TG_ADMIN_IDS')||'').split(',').map(function(x){ return x.trim(); }).filter(Boolean);
    if(ids.indexOf(String(from.id||''))<0){ tgAnswerCallback_(cq.id, 'Chỉ quản lý được xác nhận', true); return {ok:true, bo:'not_admin', tenTG:tenTG}; }
    var k=wifiXacNhanIP_(idCho, act, tenTG);
    if(!k.ok){ tgAnswerCallback_(cq.id, k.msg||'Lỗi', true); return {ok:true, bo:'xacnhan_loi', msg:k.msg}; }
    tgAnswerCallback_(cq.id, act==='nhan'?'Đã xác nhận IP':'Đã từ chối IP');
    var chat=cq.message&&cq.message.chat&&cq.message.chat.id || k.chat, msgId=cq.message&&cq.message.message_id || k.msg;
    var isPhoto=!!(cq.message && (cq.message.photo||cq.message.caption));
    var moiCapt=(act==='nhan'?'✅ Đã xác nhận bởi ':'❌ Đã từ chối bởi ')+tenTG+' – lúc '+fmtTime(new Date());
    if(chat && msgId) tgEditTin_(chat, msgId, moiCapt, isPhoto);
    return {ok:true, da:act, bo:tenTG};
  }catch(e){ try{ tgAnswerCallback_(update&&update.callback_query&&update.callback_query.id,'Lỗi máy chủ'); }catch(_){} return {ok:false,msg:e.message}; }
}
/* (30/10c Phase B) Set webhook một lần cho bot Telegram. Admin gọi qua trang quản lý; cần TG_TOKEN và TG_WEBHOOK_SECRET đã khai. */
function tgSetWebhook(p){
  if(authRole(p.pin)!=='admin') return {ok:false,msg:'Chỉ admin'};
  var tk=String(cfg('TG_TOKEN')||''), sec=String(cfg('TG_WEBHOOK_SECRET')||''), url=String(p.url||'').trim();
  if(!tk) return {ok:false,msg:'Chưa cài TG_TOKEN'};
  if(!url) return {ok:false,msg:'Thiếu URL webhook (ví dụ https://ncafe-chamcong.dangbao-mt.workers.dev/tg/webhook)'};
  try{
    var body={url:url, allowed_updates:['callback_query']}; if(sec) body.secret_token=sec;
    var r=UrlFetchApp.fetch('https://api.telegram.org/bot'+tk+'/setWebhook',{method:'post',contentType:'application/json',payload:JSON.stringify(body),muteHttpExceptions:true});
    var j=JSON.parse(r.getContentText()||'{}'); return j.ok?{ok:true, url:url, secret:sec?'(đã đặt)':'(không đặt)'}:{ok:false, msg:j.description||'Telegram từ chối'};
  }catch(e){ return {ok:false, msg:e.message}; }
}
/* (30/10) Trang quản lý chạy trên Cloudflare (/quan-ly): các hàm trang quản lý được gọi qua Worker. Danh sách CỐ ĐỊNH (bài thử API3 kiểm):
   hàm nào cũng tự kiểm mã PIN quản lý / admin; không mở hàm phụ nội bộ (rows, so, cong…). tinNhanMa bắt buộc có mã admin. */
function apiHamQL(){ return {bangLuong:bangLuong, bangLuongKhoang:bangLuongKhoang, bangTinQL:bangTinQL, baoHongQL:baoHongQL, boMucLuong:boMucLuong, bqQuyetDinh:bqQuyetDinh, btDongBo:btDongBo, caiDat:caiDat, capNhatBaoHong:capNhatBaoHong, cauHinhLuong:cauHinhLuong, chay:chay, chinhNapTheoLich:chinhNapTheoLich, chotThang:chotThang, dangNhap:dangNhap, danhMuc:danhMuc, demViec:demViec, doiMaQR:doiMaQR, dsBaoHong:dsBaoHong, dsDot:dsDot, dsLuongKhoang:dsLuongKhoang, dsLuuTru:dsLuuTru, dsMaQR:dsMaQR, dsMaTheoQuan:dsMaTheoQuan, dsNhanVien:dsNhanVien, dsNhanVienGon:dsNhanVienGon, dsSuKien:dsSuKien, dsTamUng:dsTamUng, duyetDot:duyetDot, hienMucLuong:hienMucLuong, homNay:homNay, ksBoQua:ksBoQua, ksCapMa:ksCapMa, ksDoiChieu:ksDoiChieu, ksGanMa:ksGanMa, ksNap:ksNap, ksXacNhanKyNang:ksXacNhanKyNang, lichChamCong:lichChamCong, lichSuHeSo:lichSuHeSo, lichSuLuong:lichSuLuong, luongCoSo:luongCoSo, luongTuBangLuong:luongTuBangLuong, luuCa:luuCa, luuCaiDatChung:luuCaiDatChung, luuCauHinh:luuCauHinh, luuDanhMuc:luuDanhMuc, luuLuongKhoang:luuLuongKhoang, luuO:luuO, luuPhanQuyen:luuPhanQuyen, luuQuan:luuQuan, luuSuKien:luuSuKien, luuTaiKhoan:luuTaiKhoan, luuTelegram:luuTelegram, luuTruThang:luuTruThang, luuViTriQuan:luuViTriQuan, moChot:moChot, moKhoaDot:moKhoaDot, napGioCong:napGioCong, napLuongGio:napLuongGio, napTuFileChamCong:napTuFileChamCong, napTuLich:napTuLich, nhatKySua:nhatKySua, phTraLoi:phTraLoi, phanHoi:phanHoi, phanQuyen:phanQuyen, phieuLuong:phieuLuong, suaNhanVien:suaNhanVien, tangLuong:tangLuong, tgCauHinh:tgCauHinh, tgGuiThu:tgGuiThu, tgLayNhom:tgLayNhom, themMucLuong:themMucLuong, themNgayLePhoBien:themNgayLePhoBien, themNhanVien:themNhanVien, themTamUng:themTamUng, tongHopThang:tongHopThang, traCuuGioCong:traCuuGioCong, traCuuLuoi:traCuuLuoi, wifiBo:wifiBo, wifiDatCheDo:wifiDatCheDo, wifiDatTuThem:wifiDatTuThem, wifiDuLieu:wifiDuLieu, wifiMatMangDat:wifiMatMangDat, wifiThem:wifiThem, wifiDsCho:wifiDsCho, wifiXacNhanIP:wifiXacNhanIP, tgSetWebhook:tgSetWebhook, xinPhep:xinPhep, xnBoDuyet:xnBoDuyet, xnBoVang:xnBoVang, xnDanhSach:xnDanhSach, xnDoiQuan:xnDoiQuan, xnDuyet:xnDuyet, xnThemLuot:xnThemLuot, xnVang:xnVang, xnXoaLuot:xnXoaLuot, xoaGioCong:xoaGioCong, xoaLanTangLuong:xoaLanTangLuong, xoaLuongKhoang:xoaLuongKhoang, xoaNhanVien:xoaNhanVien, xoaSuKien:xoaSuKien, xoaTamUng:xoaTamUng, xpQuyetDinh:xpQuyetDinh, xuatBangLuong:xuatBangLuong, xuatLuongKhoang:xuatLuongKhoang,
    tinNhanMa:function(ma, pin){ return tinNhanMa(ma, pin===undefined||pin===null?'#':pin); }}; }
function doPost(e){ var out;
  try{ var b=JSON.parse((e&&e.postData&&e.postData.contents)||'{}'), key=String(cfg('API_KEY')||'');
    if(!key || String(b.key||'')!==key) out={ok:false,msg:'Sai khoá API'};
    else { IP_KHACH=String(b.ip||'').slice(0,60); AS_ORG_KHACH=String(b.asOrg||'').slice(0,80); var f=apiHam()[b.fn]||apiHamQL()[b.fn]; out=f?f.apply(null, b.args||[]):{ok:false,msg:'Không cho phép'}; } }
  catch(err){ out={ok:false,msg:'Lỗi máy chủ: '+err.message}; }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON); }
// Link trang nhân viên: trên Cloudflare nếu đã cài (CaiDat CF_URL, VD https://caphemuoihue.com), không thì link Apps Script
function linkNV(trang, q){ var cf=String(cfg('CF_URL')||'').replace(/\/+$/,''), exec=ScriptApp.getService().getUrl();
  var duong={qr:'/cham-cong', giocong:'/gio-cong', khaosat:'/khao-sat', lich:'/lich-cua-toi'}[trang];
  return cf ? cf+duong+(q?'?'+q:'') : exec+'?page='+trang+(q?'&'+q:''); }

/* ---------- 4. Lịch đã xếp (chỉ đọc, từ app Xếp lịch) ---------- */
var _LICH=null;
// Mở file Xếp lịch tốn ~0,5–1,5 giây mỗi lần → lưu bản đọc được vào bộ nhớ đệm của Google 3 phút (lịch sửa bên app Xếp lịch hiện ra chậm nhất 3 phút)
var LICH_CACHE_GIAY=600;
function lichCacheDoc_(key){ try{ var c=CacheService.getScriptCache(), n=+c.get(key+'_n'); if(!n) return null; var ks=[]; for(var i=0;i<n;i++) ks.push(key+'_'+i); var g=c.getAll(ks), s='';
  for(var j=0;j<n;j++){ if(g[ks[j]]==null) return null; s+=g[ks[j]]; } return JSON.parse(s); }catch(e){ return null; } }
function lichCacheGhi_(key, L){ try{ var s=JSON.stringify(L), CH=40000, o={}, n=Math.max(1,Math.ceil(s.length/CH)); if(n>200) return; for(var i=0;i<n;i++) o[key+'_'+i]=s.slice(i*CH,(i+1)*CH); o[key+'_n']=String(n); CacheService.getScriptCache().putAll(o, LICH_CACHE_GIAY); }catch(e){} }
function lichXoaCache(){ try{ CacheService.getScriptCache().remove('LICH1_'+String(cfg('LICH_SHEET_ID')||'')+'_n'); }catch(e){} _LICH=null; }
function docLichBat(){ return !/^kh[oô]ng$/i.test(String(cfg('DOC_LICH')||'Có').trim()); }
function lichDaXep(){ if(_LICH!==null) return _LICH; _LICH=[]; var id=String(cfg('LICH_SHEET_ID')||''); if(!id || !docLichBat()) return _LICH;
  var t0=Date.now(), ck='LICH1_'+id, daCo=lichCacheDoc_(ck); if(daCo){ _LICH=daCo; doTG_('lịch (bộ nhớ tạm)', t0); return _LICH; }
  try{ var sh=SpreadsheetApp.openById(id).getSheetByName('LichLam'); if(!sh) return _LICH; var v=sh.getDataRange().getValues(), h=v.shift();
    var ix=function(k){ return h.indexOf(k); };
    _LICH=v.filter(function(r){ return r[ix('Ngay')]!==''; }).map(function(r){ return {Ngay:dateKey(r[ix('Ngay')]),MaCS:r[ix('MaCS')],MaNV:up(r[ix('MaNV')]),MaCa:r[ix('MaCa')],ViTri:r[ix('ViTri')],GhiChu:ix('GhiChu')>-1?r[ix('GhiChu')]:''}; }).filter(function(l){ return !/Support/.test(String(l.GhiChu||'')); });
    lichCacheGhi_(ck, _LICH); doTG_('mở file Xếp lịch (lịch)', t0);
  }catch(err){ _LICH=[]; }
  return _LICH; }
function lichNgay(ma, ngay){ var cm=caMap(); return lichDaXep().filter(function(l){ return l.MaNV===up(ma) && l.Ngay===ngay && caTheoMa(cm,l.MaCa); }).map(function(l){ var c=caTheoMa(cm,l.MaCa); return {MaCS:l.MaCS,MaCa:l.MaCa,ViTri:l.ViTri,GioBD:c.GioBD,GioKT:c.GioKT,SoGio:+c.SoGio}; }).sort(function(a,b){ return toMin(a.GioBD)-toMin(b.GioBD); }); }

/* ---------- 5. Mã QR (in dán quầy, cố định; admin bấm "Đổi mã" khi cần, ví dụ mã bị lộ) ---------- */
function qrSecret(){ var s=cfg('QR_SECRET'); if(!s){ s=Utilities.getUuid(); setCfg('QR_SECRET',s); } return String(s); }
function qrToken(maCS, ver){ if(ver===undefined){ var s=rows('CoSo').filter(function(x){ return x.MaCS===maCS; })[0]; ver=s?String(s.QRVer||''):''; }
  var raw=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, qrSecret()+'|'+maCS+'|'+ver); return Utilities.base64EncodeWebSafe(raw).replace(/[^A-Za-z0-9]/g,'').slice(0,10); }
function qrThang(d){ return fmtTZ_(d||new Date(),TZ,'yyyy-MM'); }
function qrStore(cs,t){ var s=rows('CoSo').filter(function(x){ return x.MaCS===cs; })[0]; if(!s) return null; return t===qrToken(cs, String(s.QRVer||''))?s:null; }
function khoangCach(a,b,c,d){ var R=6371000, r=Math.PI/180, x=Math.sin((c-a)*r/2), y=Math.sin((d-b)*r/2); return Math.round(2*R*Math.asin(Math.sqrt(x*x+Math.cos(a*r)*Math.cos(c*r)*y*y))); }
function thietBiQuen(ma,dev){ return !!dev && rows('ThietBi').some(function(r){ return up(r.MaNV)===up(ma) && String(r.ThietBi)===dev; }); }
function canhBao(s, ma, p){ var cb=[], lat=+p.lat, lng=+p.lng, kc='';
  if(p.lat!=='' && p.lat!=null && isFinite(lat) && isFinite(lng)){ if(s.ViDo!=='' && s.ViDo!=null){ kc=khoangCach(lat,lng,+s.ViDo,+s.KinhDo); var bk=+s.BanKinh||+cfg('QR_BAN_KINH')||100; if(kc>bk+Math.min(+p.acc||0,150)) cb.push('Cách quán '+kc+'m'); } else cb.push('Quán chưa lưu vị trí'); }
  else cb.push('Không lấy được định vị'+(p.loiViTri?' ('+String(p.loiViTri).slice(0,30)+(p.trongApp?', mở trong Zalo / Facebook':'')+')':(p.trongApp?' (mở trong Zalo / Facebook)':'')));
  if(!thietBiQuen(ma,String(p.deviceId||''))) cb.push('Điện thoại mới');
  var wf=wifiKiem_(s.MaCS); if(wf.bat && !wf.ok) cb.push('Không dùng wifi quán'+(wf.ip?' ('+wf.ip+')':'')); else if(wf.suCo) cb.push('Quán mất mạng – chấm bằng 4G');
  return {cb:cb.join('; '), kc:kc, lat:isFinite(lat)?lat:'', lng:isFinite(lng)?lng:''}; }
function luuAnh(data, ten){ if(!data) return ''; try{ var m=String(data).match(/^data:(image\/\w+);base64,(.*)$/); if(!m) return '';
  var id=cfg('DRIVE_FOLDER_ID'), f; if(id){ f=DriveApp.getFolderById(id); } else { f=DriveApp.createFolder('Ảnh chấm công Ncafe'); setCfg('DRIVE_FOLDER_ID', f.getId()); }
  var file=f.createFile(Utilities.newBlob(Utilities.base64Decode(m[2]), m[1], ten+'.jpg')); return 'https://drive.google.com/uc?id='+file.getId(); }catch(e){ return ''; } }

/* ---------- 6. Nhân viên quét QR ---------- */
function ccRows(){ if(_CCM) return _MEMO.__cc||(_MEMO.__cc=rows('ChamCong')); return rows('ChamCong'); }
// Ca đang mở hôm nay; từ 0h đến 4h sáng thì tìm cả ca tối hôm qua chưa chấm ra (tăng ca qua nửa đêm) – tránh chấm nhầm VÀO ca mới
function caDangMo(ma){ var now=new Date(), today=fmtDate(now), L=ccRows().filter(function(r){ return up(r.MaNV)===up(ma) && !r.Ra; });
  var mo=L.filter(function(r){ return dateKey(r.Ngay)===today; })[0]; if(mo) return mo;
  if(parseInt(fmtTZ_(now,TZ,'HH'),10)<4){ var hq=fmtDate(new Date(now.getTime()-864e5)); mo=L.filter(function(r){ return dateKey(r.Ngay)===hq && toMin(hhmm(r.CaKT))>=toMin('17:00'); })[0]; if(mo){ mo._quaDem=true; return mo; } }
  return null; }
function qrInfo(p){ var s=qrStore(p.cs,p.t); if(!s) return {ok:false,msg:'Mã QR không đúng hoặc đã hết hạn. Báo quản lý in mã mới.'}; return {ok:true, store:{MaCS:s.MaCS,TenCS:s.TenCS}}; }
// Mở trang quét mã: kiểm tra mã quán + (nếu điện thoại đã nhớ mã) lấy luôn nhân viên, ca, lịch – 1 lượt gọi thay vì 2
function qrMo(p){ var a=qrInfo(p); if(!a.ok) return a; var w=wifiKiem_(a.store&&a.store.MaCS); var o={ok:true, store:a.store, wifi:{bat:w.bat, ok:w.ok, cheDo:w.cheDo}}; if(String(p.maNV||'').trim()) o.nv=qrNhanVien(p); return o; }
function qrNhanVien(p){
  var s=qrStore(p.cs,p.t); if(!s) return {ok:false,msg:'Mã QR không đúng hoặc đã hết hạn.'};
  var n=nvByMa(p.maNV); if(!n) return {ok:false,msg:'Không tìm thấy mã nhân viên '+p.maNV}; if(!dangLam(n)) return {ok:false,msg:tenNgan(n.Ten)+' đã nghỉ việc, không chấm công được.'};
  var today=fmtDate(new Date()), mo=caDangMo(n.MaNV), li=lichNgay(n.MaNV,today), cm=caMap();
  var cas=Object.keys(cm).filter(function(k){ return caDung(cm[k],s.MaCS); }).map(function(k){ var c=cm[k]; return {MaCa:k,TenCa:c.TenCa,GioBD:c.GioBD,GioKT:c.GioKT,SoGio:+c.SoGio}; }).sort(function(a,b){ return toMin(a.GioBD)-toMin(b.GioBD) || a.SoGio-b.SoGio; });
  li.forEach(function(l){ if(!cas.some(function(x){ return x.MaCa===l.MaCa; })) cas.unshift({MaCa:l.MaCa,TenCa:'Theo lịch',GioBD:l.GioBD,GioKT:l.GioKT,SoGio:l.SoGio}); });   // ca giờ tự do quản lý đã xếp
  var r={ok:true, MaNV:String(n.MaNV), Ten:tenNgan(n.Ten), ViTri:n.ViTri, next:mo?'RA':'VAO', lich:li, cas:cas, nn:nguongXN().nn, lyDo:dmDs('LY_DO_RA_CA')};
  if(mo){ r.dang={Vao:hhmm(mo.Vao), MaCS:mo.MaCS, MaCa:mo.MaCa, CaBD:hhmm(mo.CaBD), CaKT:hhmm(mo.CaKT), SoGio:mo.CaBD?((toMin(mo.CaKT)-toMin(mo.CaBD))/60):0}; }
  return r;
}
/* (30/10) BẢNG TIN (Worker Cloudflare "ncafe-bangtin"): Cài đặt chung → BANGTIN_URL (VD https://ncafe-bangtin.dangbao-mt.workers.dev)
   và BANGTIN_KEY (= FEED_SECRET của Worker). Để trống = tắt. App: cấp "vé" có chữ ký HMAC-SHA256 (giống hàm makeToken của bảng tin),
   báo vào ca / ra ca (hook in/out), đồng bộ danh sách nhân viên + ngày sinh (hook staff) mỗi sáng và khi admin bấm. */
function btCfg_(){ var u=String(cfg('BANGTIN_URL')||'').trim().replace(/\/+$/,'').replace(/\/bangtin$/,''), k=String(cfg('BANGTIN_KEY')||'').trim(); return (u && k)?{url:u, key:k}:null; }
function btB64_(x){ return Utilities.base64EncodeWebSafe(x).replace(/=+$/,''); }
function btToken_(n, role){ var c=btCfg_(); if(!c || !n) return '';
  var p=Utilities.base64EncodeWebSafe(JSON.stringify({c:up(n.MaNV), n:tenNgan(n.Ten), s:up(n.CoSoChinh||''), r:role||'nv', x:Date.now()+12*3600e3}), Utilities.Charset.UTF_8).replace(/=+$/,'');
  return p+'.'+btB64_(Utilities.computeHmacSha256Signature(p, c.key, Utilities.Charset.UTF_8)); }
function btVe_(n, role){ var c=btCfg_(); if(!c || !n) return null; return {url:c.url, t:btToken_(n, role)}; }
function btGui_(o){ var c=btCfg_(); if(!c) return false; try{ var r=UrlFetchApp.fetch(c.url+'/bangtin/api/hook', {method:'post', contentType:'application/json', headers:{'X-Feed-Key':c.key}, payload:JSON.stringify(o), muteHttpExceptions:true}); return r.getResponseCode()===200; }catch(e){ return false; } }
function btDongBo_(){ var c=btCfg_(); if(!c) return {ok:false, msg:'Chưa cài BANGTIN_URL / BANGTIN_KEY'};
  // (30/10b) Bảo mật: KHÔNG gửi họ tên đầy đủ và năm sinh ra Worker; chỉ gửi chữ cái đầu các từ ("V.T.T.L") + MM-DD.
  var chuDau_=function(s){ return String(s||'').trim().split(/\s+/).filter(Boolean).map(function(w){ return w.charAt(0).toUpperCase(); }).join('.'); };
  var list=rows('NhanVien').filter(function(n){ return n.MaNV && dangLam(n); }).map(function(n){ var dobFull=n.NgaySinh?dateKey(n.NgaySinh):''; return {code:up(n.MaNV), short:chuDau_(tenNgan(n.Ten)), store:up(n.CoSoChinh||''), dob:dobFull?dobFull.slice(5):'', role:/qu[aả]n l[yý]/i.test(String(n.ChucVu||'')+' '+String(n.ViTri||''))?'ql':'nv'}; });
  var ok=btGui_({type:'staff', list:list}); return ok?{ok:true, so:list.length, coNgaySinh:list.filter(function(x){ return x.dob; }).length}:{ok:false, msg:'Bảng tin không nhận – kiểm tra BANGTIN_URL và BANGTIN_KEY (= FEED_SECRET)'}; }
function btDongBo(p){ if(authRole(p.pin)!=='admin') return {ok:false,msg:'Chỉ admin'}; var r=btDongBo_(); if(r.ok) setCfg('BANGTIN_DONGBO_NGAY', fmtDate(new Date())); return r; }
function btHangNgay_(){ if(!btCfg_()) return; var h=fmtDate(new Date()); if(String(cfg('BANGTIN_DONGBO_NGAY'))===h) return; if(btDongBo_().ok) setCfg('BANGTIN_DONGBO_NGAY', h); }
/* (30/10) SỐ VIỆC CHƯA XỬ LÝ – chấm đỏ trên tiêu đề tab trang quản lý. Mỗi tab chỉ đếm khi tài khoản có quyền xem tab đó;
   quản lý chỉ đếm quán mình phụ trách. Trả kèm chi tiết để rê chuột xem. */
function demViec(p){ var tk=tkDayDu(p.pin); if(!tk) return {ok:false,msg:'Sai mã'};
  // (30/10) tối ưu: nhớ kết quả 60 giây cho mỗi tài khoản – đổi tab liên tục không phải đếm lại
  var ck='DV_'+String(p.pin).replace(/[^0-9A-Za-z]/g,'').slice(0,40), cc0=null; try{ cc0=CacheService.getScriptCache(); var cu=cc0.get(ck); if(cu && !p.moi) return JSON.parse(cu); }catch(e){}
  var kq=demViec_(p, tk); try{ if(cc0 && kq.ok) cc0.put(ck, JSON.stringify(kq), 60); }catch(e){} return kq; }
function demViec_(p, tk){ var now=new Date(), today=fmtDate(now), nowM=toMin(fmtTime(now)), tu40=fmtDate(new Date(now.getTime()-40*864e5)), so={}, ct={};
  var nvMap={}; rows('NhanVien').forEach(function(n){ nvMap[up(n.MaNV)]=n; });
  var trong=function(cs, ma){ if(tk.duocCS(cs)) return true; var n=nvMap[up(ma)]; return !!(n && tk.duocCS(n.CoSoChinh)); };
  var CC=ccRows();
  if(quyen(p.pin,'hom')>=1){ var cm=caMap(), co={}, chua=0, quen=0;
    CC.forEach(function(r){ if(dateKey(r.Ngay)!==today) return; co[up(r.MaNV)]=1; if(!trong(r.MaCS,r.MaNV)) return; var kt=hhmm(r.CaKT);
      if(trangThaiRow(r,today)==='Đang làm' && kt && nowM>toMin(kt)+60) quen++; });
    try{ lichDaXep().forEach(function(l){ if(l.Ngay!==today || co[up(l.MaNV)] || !tk.duocCS(l.MaCS)) return; var c=caTheoMa(cm,l.MaCa); if(c && nowM>toMin(c.GioBD)+15) chua++; }); }catch(e){}
    so.hom=chua+quen; ct.hom=(chua?chua+' người có lịch chưa đến':'')+(chua&&quen?' · ':'')+(quen?quen+' người quá giờ chưa chấm ra':''); }
  if(quyen(p.pin,'duyet')>=1){ var a=0, b=0, c=0, d=0;
    CC.forEach(function(r){ var k=dateKey(r.Ngay); if(k<tu40 || k>today) return; if(trangThaiRow(r,today)==='Chờ xác nhận' && trong(r.MaCS,r.MaNV)) a++; });
    rows_('XinPhep').forEach(function(q){ if(String(q.TrangThai)==='Chờ' && trong(q.MaCS,q.MaNV)) b++; });
    rows_('BaoQuen').forEach(function(q){ if(String(q.TrangThai)==='Chờ' && trong(q.MaCS,q.MaNV)) c++; });
    rows_('PhanHoi').forEach(function(q){ if(String(q.TrangThai)==='Chờ' && trong(q.MaCS,q.MaNV)) d++; });
    so.duyet=a+b+c+d; ct.duyet=[a?a+' ca chờ duyệt':'', b?b+' xin phép':'', c?c+' báo quên chấm':'', d?d+' ghi chú nhân viên':''].filter(Boolean).join(' · '); }
  if(quyen(p.pin,'hong')>=1){ var h=bhDs_(function(r){ return String(r.TrangThai)!=='Đã xong' && tk.duocCS(r.MaCS); }).length; so.hong=h; ct.hong=h?h+' báo hỏng chưa xong':''; }
  if(quyen(p.pin,'luong')>=1){ var th=today.slice(0,7), y=+th.slice(0,4), m=+th.slice(5,7)-1; if(m<1){ m=12; y--; } var tr=y+'-'+('0'+m).slice(-2), dot=0, chot=0;
    var coDL=function(t){ return CC.some(function(r){ return dateKey(r.Ngay).slice(0,7)===t; }); };
    try{ (dsDot({pin:p.pin, thang:th}).list||[]).forEach(function(x){ if(!x.DaDuyet && x.Den<today) dot++; }); }catch(e){}
    if(coDL(tr)){ try{ (dsDot({pin:p.pin, thang:tr}).list||[]).forEach(function(x){ if(!x.DaDuyet) dot++; }); }catch(e){} if(!thangDaChot(tr)) chot=1; }
    so.luong=dot+chot; ct.luong=[dot?dot+' đợt đã qua chưa khoá sổ':'', chot?'tháng '+(+tr.slice(5))+' chưa chốt lương':''].filter(Boolean).join(' · '); }
  if(quyen(p.pin,'ks')>=1){ try{ var k=ksDoiChieu({pin:p.pin}), n=(k.dong||[]).filter(function(x){ return x.nap!=='Đã nạp' && (x.moi || !x.ma || (x.khac||[]).length>0); }).length; so.ns=n; ct.ns=n?n+' khảo sát chưa xử lý':''; }catch(e){} }
  return {ok:true, so:so, ct:ct, luc:fmtTime(now)}; }
// (30/10) Trang quản lý → Cài đặt → Thông báo sự kiện: bảng tin đầy đủ cho admin (quyền admin) / quản lý (quyền quản lý), không phải nhập PIN bảng tin
function bangTinQL(p){ var role=authRole(p.pin); if(!role) return {ok:false,msg:'Sai mã'}; var c=btCfg_(); if(!c) return {ok:false, tat:true, msg:'Chưa nối bảng tin: Cài đặt chung → điền BANGTIN_URL và BANGTIN_KEY.'};
  var tk=tkDayDu(p.pin)||{}, ten=String(tk.ten||'').trim()||(role==='admin'?'Admin':'Quản lý'), ma=role==='admin'?'ADMIN':('QL-'+(tenBoDau_(ten).toUpperCase().replace(/[^A-Z0-9]+/g,'').slice(0,14)||'QUANLY'));
  var cs=(tk.quan&&tk.quan.length)?tk.quan[0]:'';
  return {ok:true, url:c.url, t:btToken_({MaNV:ma, Ten:ten, CoSoChinh:cs}, role==='admin'?'admin':'ql'), vaiTro:role}; }
// Trang "Lịch của tôi": vé vào bảng tin cho nhân viên đã đăng nhập
function bangTinVao(p){ var k=nvXacMinh(p); if(k.loi) return {ok:false, msg:k.loi}; var v=btVe_(k.nv, 'nv'); return v?{ok:true, url:v.url, t:v.t}:{ok:false, tat:true}; }
function qrVao(p){ var r=qrVaoLoi(p); if(r.ok && r._tg){ try{ r._tg.anh=p.photo; tgSuKien(r._tg); }catch(e){} try{ if(btCfg_()){ btGui_({type:'in', code:up(r._tg.ma), name:r._tg.ten, store:r._tg.cs, ts:Date.now()}); r.bt=btVe_(nvByMa(p.maNV), 'nv'); } }catch(e){} } delete r._tg; return r; }
function qrVaoLoi(p){
  var s=qrStore(p.cs,p.t); if(!s) return {ok:false,msg:'Mã QR không đúng hoặc đã hết hạn.'};
  var n=nvByMa(p.maNV); if(!n || !dangLam(n)) return {ok:false,msg:'Mã nhân viên không hợp lệ'};
  var wc=wifiChan_(s, n, 'VAO', p); if(wc && !wc.choIP) return wc;
  if(caDangMo(n.MaNV)) return {ok:false,msg:'Bạn đang trong ca, hãy chấm Ra ca trước.'};
  // Đọc lịch, tính cảnh báo và TẢI ẢNH lên Drive TRƯỚC khi khoá (tải ảnh 1–2 giây) → giờ cao điểm 06:30 không phải xếp hàng chờ nhau
  var now=new Date(), today=fmtDate(now), vao=fmtTime(now), cm=caMap(), id=fmtTZ_(now,TZ,'yyMMddHHmmss')+'-'+up(n.MaNV), anh=luuAnh(p.photo, id+'-vao'), cb=canhBao(s, n.MaNV, p);
  if(wc && wc.choIP){ cb.cb=(cb.cb?cb.cb+'; ':'')+'IP chờ xác nhận ('+wc.ip+')'; }   // (30/10c) note IP chờ vào CanhBao, trạng thái vẫn "Đang làm"
  var lock=LockService.getScriptLock(); if(!lock.tryLock(25000)) return {ok:false, banLai:true, msg:'Đang đông người chấm cùng lúc – bấm lại sau vài giây.'};
  try{
    if(caDangMo(n.MaNV)) return {ok:false,msg:'Bạn đang trong ca, hãy chấm Ra ca trước.'};
    var li=lichNgay(n.MaNV,today).filter(function(l){ return toMin(l.GioKT)>toMin(vao)-30; })[0];
    var maCa=p.maCa || (li?li.MaCa:''), c=caTheoMa(cm,maCa);
    if(maCa==='KHAC'){   // ca phát sinh: nhân viên tự điền giờ bắt đầu – kết thúc
      var bd=hhmm(p.gioBD), kt=hhmm(p.gioKT); if(!bd || !kt || toMin(kt)<=toMin(bd) || toMin(kt)-toMin(bd)>16*60) return {ok:false,msg:'Điền giờ bắt đầu và kết thúc ca (kết thúc sau bắt đầu)'};
      c={MaCa:'KHAC', GioBD:bd, GioKT:kt, SoGio:(toMin(kt)-toMin(bd))/60}; }
    if(!c) return {ok:false,msg:'Chọn ca làm hôm nay'};
    var tre=Math.max(0, toMin(vao)-toMin(c.GioBD));   // ghi đúng số phút trễ: 1–10' = nhắc nhở, quá 10' = trễ (phải duyệt)
    var row=[id, today, String(n.MaNV), tenNgan(n.Ten), s.MaCS, maCa, c.GioBD, c.GioKT, p.viTri||(li&&li.ViTri)||n.ViTri, vao, '', tre, '', '', '', '', 'Đang làm', '', '', '', cb.cb, anh, '', cb.lat, cb.lng, cb.kc, String(p.deviceId||'')];
    SS.getSheetByName('ChamCong').appendRow(row);
    if(p.deviceId && !thietBiQuen(n.MaNV,String(p.deviceId))) SS.getSheetByName('ThietBi').appendRow([String(n.MaNV),String(p.deviceId),now]);
    if(wc && wc.choIP) try{ var _idCho=wifiQueueCho_(up(s.MaCS), String(n.MaNV), tenNgan(n.Ten), wc.ip, wc.asOrg, id, anh, 'VAO'); wc.anh=anh; wifiBaoChoIP_(s, n, wc, vao, _idCho); }catch(e){}
    var quen=!/Điện thoại mới/.test(String(cb&&cb.cb||''));   // kiểm tra TRƯỚC khi ghi nhận máy (lượt này đã thêm máy vào danh sách)
    return {ok:true, loai:'VAO', gio:vao, tre:tre, ca:c.GioBD+'–'+c.GioKT, goi:tenNgan(n.Ten), bietDanh:quen?String(n.BietDanh||''):'', choIP:!!(wc&&wc.choIP), msgIP:wc&&wc.msg||'', _tg:{loai:'VAO', cs:s.MaCS, tenCS:s.TenCS, ten:tenNgan(n.Ten), ma:String(n.MaNV), gio:vao, ca:c.GioBD+'–'+c.GioKT, viTri:row[8], tre:tre, cb:cb.cb, tuDo:maCa==='KHAC'}};
  } finally { lock.releaseLock(); }
}
// Ra ca: nhân viên khai giờ (đúng ca / tăng ca / giảm ca). Đúng ca và giờ chấm khớp → tự tính; còn lại chờ quản lý xác nhận.
function qrRa(p){ var r=qrRaLoi(p); if(r.ok && r._tg){ try{ r._tg.anh=p.photo; tgSuKien(r._tg); }catch(e){} try{ if(btCfg_()){ btGui_({type:'out', code:up(r._tg.ma), name:r._tg.ten, store:r._tg.cs, ts:Date.now()}); r.bt=btVe_(nvByMa(p.maNV), 'nv'); } }catch(e){} } delete r._tg; return r; }
function qrRaLoi(p){
  var s=qrStore(p.cs,p.t); if(!s) return {ok:false,msg:'Mã QR không đúng hoặc đã hết hạn.'};
  var n=nvByMa(p.maNV); if(!n) return {ok:false,msg:'Mã nhân viên không hợp lệ'};
  var loai=p.khaiLoai==='dung'?'du':p.khaiLoai; if(['du','tang','giam'].indexOf(loai)<0) return {ok:false,msg:'Chọn: đủ ca, tăng ca hoặc giảm ca'};
  var wc=wifiChan_(s, n, 'RA', p); if(wc && !wc.choIP) return wc;
  var mo0=caDangMo(n.MaNV); if(!mo0) return {ok:false,msg:'Không tìm thấy lượt vào ca hôm nay.'};
  var anhRa=luuAnh(p.photo, mo0.ID+'-ra'), cbTruoc=canhBao(s, n.MaNV, p);   // tải ảnh + cảnh báo TRƯỚC khi khoá
  var lock=LockService.getScriptLock(); if(!lock.tryLock(25000)) return {ok:false, banLai:true, msg:'Đang đông người chấm cùng lúc – bấm lại sau vài giây.'};
  try{
    var mo=caDangMo(n.MaNV); if(!mo) return {ok:false,msg:'Không tìm thấy lượt vào ca hôm nay.'};
    var now=new Date(), raThat=fmtTime(now), ra=mo._quaDem?'23:59':raThat, thuc=lam15((toMin(ra)-toMin(hhmm(mo.Vao)))/60), caG=gioGiua(hhmm(mo.CaBD),hhmm(mo.CaKT)), tu='', den='', khaiGio=caG;
    if(loai!=='du'){ tu=hhmm(p.tu); den=hhmm(p.den);
      if(tu && den){ if(toMin(den)<=toMin(tu)) return {ok:false,msg:'Giờ kết thúc phải sau giờ bắt đầu'}; khaiGio=gioGiua(tu,den); }
      else { khaiGio=+String(p.khaiGio||'').replace(',','.'); if(!(khaiGio>0)) return {ok:false,msg:'Điền giờ làm thực tế'}; } }
    ensureCols('ChamCong',XN_COT);
    var sh=SS.getSheetByName('ChamCong'), h=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0], doi={}, set=function(k,v){ if(h.indexOf(k)>-1) doi[k]=v; };
    var cb=cbTruoc; if(mo._quaDem) cb.cb=(cb.cb?cb.cb+'; ':'')+'Chấm ra sau nửa đêm lúc '+raThat+' (ghi 23:59)';
    if(wc && wc.choIP){ cb.cb=(cb.cb?cb.cb+'; ':'')+'IP chờ xác nhận ('+wc.ip+')'; try{ var _idChoR=wifiQueueCho_(up(s.MaCS), String(n.MaNV), tenNgan(n.Ten), wc.ip, wc.asOrg, String(mo.ID), anhRa, 'RA'); wc.anh=anhRa; wifiBaoChoIP_(s, n, wc, raThat, _idChoR); }catch(e){} }
    var khacQuan=up(s.MaCS)!==up(mo.MaCS)?'Ra ca ở '+s.TenCS+' (vào ở '+mo.MaCS+')':''; if(khacQuan) cb.cb=(cb.cb?cb.cb+'; ':'')+khacQuan; var r2={}; Object.keys(mo).forEach(function(k){ r2[k]=mo[k]; }); r2.Ra=ra; r2.KhaiLoai=loai; if(cb.cb) r2.CanhBao=(mo.CanhBao?mo.CanhBao+'; ':'')+cb.cb;
    var khopLich=xnKhop(r2, coLichCa(r2)), khop=String(cfg('TU_DUYET_KHOP'))==='Có' && khopLich, tt=khop?'Đã xong':'Chờ xác nhận';   // mặc định: mọi lượt đều chờ quản lý duyệt
    set('Ra',ra); set('GioThuc',thuc); set('KhaiLoai',loai); set('KhaiGio',khaiGio); set('KhaiTu',tu); set('KhaiDen',den); var coMat=loai==='du'?(hhmm(p.coMat)||''):''; set('CoMat',coMat); set('LyDo',String(p.lyDo||'').slice(0,150));
    set('KhaiGhiChu',String(p.ghiChu||'')); set('CoMat',coMat);
    r2.CoMat=coMat; r2.KhaiGio=khaiGio; r2.KhaiTu=tu; r2.KhaiDen=den; var dx=xnDeXuat(r2); if(dx==null) dx=khaiGio;
    set('TrangThai',tt); set('GioTinh',khop?dx:Math.min(dx,caG));   // chưa duyệt: tạm tính không quá giờ ca
    set('Cach',khop?'khớp lịch – tự xác nhận':'');   // (trước đây dòng này nằm trong chú thích nên không chạy)
    set('AnhRa', anhRa); var them=[mo._quaDem?'Chấm ra sau nửa đêm lúc '+raThat+' (ghi 23:59)':'', khacQuan].filter(Boolean).join('; ');
    if(them) set('CanhBao', (mo.CanhBao?mo.CanhBao+'; ':'')+them); else if(cb.cb && !mo.CanhBao) set('CanhBao', cb.cb);
    var dong=h.map(function(k){ return doi.hasOwnProperty(k)?doi[k]:(mo[k]===undefined?'':mo[k]); }); sh.getRange(mo._r,1,1,h.length).setValues([dong]);   // ghi cả dòng 1 lần
    var ng=nguongXN(), som=toMin(hhmm(mo.CaKT))-toMin(ra);
    return {ok:true, loai:'RA', gio:ra, trangThai:tt, khaiGio:khaiGio, caGio:caG, tuXacNhan:khop, khopLich:khopLich, _tg:{loai:'RA', cs:s.MaCS, tenCS:s.TenCS, ten:tenNgan(n.Ten), ma:String(n.MaNV), gio:ra, ca:hhmm(mo.CaBD)+'–'+hhmm(mo.CaKT), khaiLoai:loai, khaiGio:khaiGio, caGio:caG, gioThuc:thuc, vao:hhmm(mo.Vao),
      tu:tu, den:den, coMat:coMat, khaiSom:(tu && toMin(tu)<toMin(hhmm(mo.Vao))-ng.nn)?hhmm(mo.Vao):'', lyDo:String(p.lyDo||''), tre:+mo.TreMin||0, som:som>ng.som?som:0, choDuyet:!khop, khopLich:khopLich, ghiChu:String(p.ghiChu||''), cb:cb.cb}};
  } finally { lock.releaseLock(); }
}

/* ---------- 7. Quản lý ---------- */
function trangThaiRow(r, today){ var tt=String(r.TrangThai||''); if(tt==='Đang làm' && dateKey(r.Ngay)<today) return 'Quên chấm ra'; return tt; }
function rowOut(r, role, today){ var o={ID:r.ID, Ngay:dateKey(r.Ngay), MaNV:String(r.MaNV), Ten:r.Ten, MaCS:r.MaCS, MaCa:r.MaCa, CaBD:hhmm(r.CaBD), CaKT:hhmm(r.CaKT), ViTri:r.ViTri, Vao:hhmm(r.Vao), Ra:hhmm(r.Ra), TreMin:+r.TreMin||0,
  GioThuc:+r.GioThuc||0, KhaiLoai:r.KhaiLoai, KhaiGio:+r.KhaiGio||0, KhaiGhiChu:r.KhaiGhiChu, TrangThai:trangThaiRow(r,today), CanhBao:r.CanhBao, AnhVao:r.AnhVao, AnhRa:r.AnhRa};
  if(role==='admin') o.GioTinh=+r.GioTinh||0; return o; }
function dangNhap(p){ try{ return dangNhap_(p); }catch(e){ return {ok:false, msg:'Lỗi máy chủ khi đăng nhập: '+(e&&e.message||e)+' – báo người cài app (bản '+VER+')'}; } }
function dangNhap_(p){ var tk=taiKhoan(p.pin); if(!tk) return {ok:false,msg:'Sai mã'}; var role=tk.role;
  var xl=String(cfg('XEP_LICH_URL')||''); if(xl && /\/exec$/.test(xl)) xl+='?page=admin';
  return {ok:true, role:role, ten:tk.ten, suaGio:tk.suaGio, quyen:quyenMap(tk), xepLichUrl:xl, nn:nguongXN().nn, dsViTri:dsViTri(), dsChucVu:dmDs('DS_CHUC_VU'), ver:VER, appUrl:(function(){ try{ return ScriptApp.getService().getUrl(); }catch(e){ return ''; } })(), stores:rows('CoSo').map(function(c){ return {MaCS:c.MaCS,TenCS:c.TenCS}; }), coLich:!!cfg('LICH_SHEET_ID'), phienGio:(+cfg('PHIEN_GIO')||12)}; }
function homNay(p){ var _q=khongQuyen(p.pin,'hom',1); if(_q) return _q; var role=authRole(p.pin); if(!role) return {ok:false,msg:'Sai mã'}; return homNayNoiBo(p.ngay, role); }
function homNayNoiBo(ngay, role){
  var d=ngay||fmtDate(new Date()), today=fmtDate(new Date()), cm=caMap(), nv={}; rows('NhanVien').forEach(function(n){ nv[up(n.MaNV)]=n; });
  var cc=ccRows().filter(function(r){ return dateKey(r.Ngay)===d; }).map(function(r){ var o=rowOut(r,role,today); var li=lichNgay(r.MaNV,d); o.Lich=li.length?li.map(function(l){ return l.GioBD+'–'+l.GioKT+' '+l.MaCS; }).join(', '):''; o.KhacQuan=li.length && !li.some(function(l){return l.MaCS===r.MaCS;}); return o; });
  var co={}; cc.forEach(function(o){ co[up(o.MaNV)]=1; });
  var chua=lichDaXep().filter(function(l){ return l.Ngay===d && !co[l.MaNV] && caTheoMa(cm,l.MaCa); }).map(function(l){ var n=nv[l.MaNV], c=caTheoMa(cm,l.MaCa); return {MaNV:l.MaNV, Ten:n?tenNgan(n.Ten):l.MaNV, MaCS:l.MaCS, Lich:c.GioBD+'–'+c.GioKT, ViTri:l.ViTri}; });
  return {ok:true, ngay:d, list:cc, chuaCham:chua};
}
function lichChamCong(p){ var _q=khongQuyen(p.pin,'lich',1); if(_q) return _q; var role=authRole(p.pin); if(!role) return {ok:false,msg:'Sai mã'};
  var days=weekDays(p.tuan||fmtDate(new Date())), today=fmtDate(new Date()), cm=caMap(), nv={}; rows('NhanVien').forEach(function(n){ nv[up(n.MaNV)]=n; });
  var cc=ccRows().filter(function(r){ return days.indexOf(dateKey(r.Ngay))>-1; }).map(function(r){ return rowOut(r,role,today); });
  var lich=lichDaXep().filter(function(l){ return days.indexOf(l.Ngay)>-1 && caTheoMa(cm,l.MaCa); }).map(function(l){ var c=caTheoMa(cm,l.MaCa); return {Ngay:l.Ngay,MaNV:l.MaNV,MaCS:l.MaCS,GioBD:c.GioBD,GioKT:c.GioKT}; });
  var ma={}; cc.forEach(function(o){ ma[up(o.MaNV)]=1; }); lich.forEach(function(l){ ma[l.MaNV]=1; });
  var people=Object.keys(ma).map(function(m){ var n=nv[m]; return {MaNV:m, Ten:n?tenNgan(n.Ten):m, ViTri:n?n.ViTri:''}; }).sort(function(a,b){ return a.MaNV<b.MaNV?-1:1; });
  return {ok:true, days:days, people:people, cc:cc, lich:lich, coLich:!!cfg('LICH_SHEET_ID')};
}
function canDuyet(p){ var _q=khongQuyen(p.pin,'duyet',1); if(_q) return _q; var role=authRole(p.pin); if(!role) return {ok:false,msg:'Sai mã'}; var today=fmtDate(new Date());
  return {ok:true, list:ccRows().map(function(r){ return rowOut(r,role,today); }).filter(function(o){ return o.TrangThai==='Chờ xác nhận' || o.TrangThai==='Quên chấm ra' || (o.CanhBao && o.TrangThai!=='Đã xác nhận' && !/Hợp lệ/.test(o.CanhBao)); }).reverse()}; }
function xuLy(p){ var tk=taiKhoan(p.pin); if(!tk) return {ok:false,msg:'Sai mã'}; var role=tk.role;
  var r=ccRows().filter(function(x){ return String(x.ID)===String(p.id); })[0]; if(!r) return {ok:false,msg:'Không tìm thấy lượt chấm công'};
  if(thangDaChot(dateKey(r.Ngay).slice(0,7))) return {ok:false,msg:'Tháng '+dateKey(r.Ngay).slice(0,7)+' đã chốt lương, không sửa được. Admin mở chốt nếu cần.'};
  var sh=SS.getSheetByName('ChamCong'), h=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0], set=function(k,v){ sh.getRange(r._r, h.indexOf(k)+1).setValue(v); };
  var caG=(toMin(r.CaKT)-toMin(r.CaBD))/60, ai=tk.ten||(role==='admin'?'Admin':'Quản lý'), now=new Date();
  // không có quyền điều chỉnh: chỉ xác nhận đúng như nhân viên khai, hoặc tính đúng ca; không đổi số giờ, không nhập giờ ra
  var gioKhai=(String(r.KhaiLoai)==='dung'||!r.KhaiLoai)?caG:+r.KhaiGio;
  if(!tk.suaGio && (p.viec==='gioRa' || (p.viec==='xacNhan' && Math.abs(+String(p.gio).replace(',','.')-gioKhai)>0.001)))
    return {ok:false, canQuyen:true, msg:'Điều chỉnh giờ công cần được admin cấp quyền. Bạn chỉ xác nhận được đúng số giờ nhân viên khai ('+gioKhai+'h) hoặc tính đúng ca.'};
  if(p.viec==='xacNhan'){ var g=+String(p.gio).replace(',','.'); if(!(g>0) || g>16) return {ok:false,msg:'Số giờ không hợp lệ'}; set('GioTinh',g); set('TrangThai','Đã xác nhận'); set('XacNhanBoi',ai); set('XacNhanLuc',now); }
  else if(p.viec==='dungCa'){ set('GioTinh',caG); set('TrangThai','Đã xác nhận'); set('XacNhanBoi',ai); set('XacNhanLuc',now); }
  else if(p.viec==='gioRa'){ var ra=hhmm(p.ra); if(!ra) return {ok:false,msg:'Giờ ra không hợp lệ'}; var thuc=lam15((toMin(ra)-toMin(r.Vao))/60);
    set('Ra',ra); set('GioThuc',thuc); set('KhaiLoai','quản lý nhập'); set('KhaiGio',thuc); set('TrangThai','Chờ xác nhận'); set('GioTinh',Math.min(caG,thuc)); }
  else if(p.viec==='hopLe'){ set('CanhBao', String(r.CanhBao||'')+' → Hợp lệ ('+ai+')'); }
  else return {ok:false,msg:'Việc không hợp lệ'};
  return {ok:true}; }

/* ---------- 8. Nhân sự: cấp mã ---------- */
function dsNhanVienGon(p){ if(!authRole(p.pin)) return {ok:false,msg:'Sai mã'}; return {ok:true, list:rows('NhanVien').map(function(n){ return {MaNV:String(n.MaNV),Ten:n.Ten,ViTri:n.ViTri,TrangThai:n.TrangThai||'Đang làm'}; })}; }
function goiYKhaoSat(){ var o={}; var id=String(cfg('LICH_SHEET_ID')||''); if(!id) return o;
  try{ var sh=SpreadsheetApp.openById(id).getSheetByName('KhaoSat'); if(!sh) return o; var v=sh.getDataRange().getValues(), h=v.shift(), iM=h.indexOf('MaNV'), iD=h.indexOf('DuLieu');
    v.forEach(function(r){ try{ var d=JSON.parse(r[iD]||'{}'); if(d.batDau) o[up(r[iM])]=d.batDau; }catch(e){} }); }catch(e){} return o; }
var DAU_MA={'Quản lý':1,'Pha chế':2,'Phục vụ':3,'Thu ngân':2,'Rửa ly':4,'Bảo vệ':5,'Support':6};
function capMa(viTri){ var dau=DAU_MA[viTri]||3, max=dau*100; rows('NhanVien').forEach(function(n){ var m=+String(n.MaNV).replace(/\D/g,''); if(Math.floor(m/100)===dau && m>max) max=m; }); return String(max+1); }
function dsNhanVien(p){ var _q=khongQuyen(p.pin,'ns',1); if(_q) return _q; var role=authRole(p.pin), xemLuong=quyen(p.pin,'luong')>=1;
  var gy=goiYKhaoSat();
  return {ok:true, role:role, khaoSat:linkNV('khaosat'), list:rows('NhanVien').map(function(n){ var o={MaNV:String(n.MaNV),Ten:n.Ten,ViTri:n.ViTri,ChucVu:n.ChucVu,Loai:n.Loai,CoSoChinh:n.CoSoChinh,SDT:sdtDoc_(n.SDT),TrangThai:n.TrangThai||'Đang làm',NgayVao:dateKey(n.NgayVao),NgaySinh:n.NgaySinh?dateKey(n.NgaySinh):'',ViTriKiem:String(n.ViTriKiem||''),TangCaDuoc:String(n.TangCaDuoc||''),CoDinh:String(n.CoDinh||''),SinhVien:String(n.SinhVien||'')};
    if(xemLuong){ o.LuongGio=n.LuongGio; o.KieuLuong=n.KieuLuong||'Giờ'; o.LuongCoBan=n.LuongCoBan; var k=kyTangLuong(n); o.KyXet=k.ky; o.DenKy=k.den; o.LanTang=k.lan; o.ThamNien=thamNien(dateKey(n.NgayVao)); if(!n.NgayVao && gy[up(n.MaNV)]) o.GoiYNgayVao=gy[up(n.MaNV)]+'-01'; var hn=fmtDate(new Date()); o.LuongKhoang=lkRows_().filter(function(x){ return x.MaNV===up(n.MaNV) && x.Den>=hn; }).map(lkMoTa_); } return o; })}; }
var _KS_CAP_MA=false;   // bật tạm khi quản lý cấp mã từ khảo sát (client không đặt được biến này)
function themNhanVien(p){ var role=authRole(p.pin); if(role!=='admin' && !(role && _KS_CAP_MA)) return {ok:false,msg:'Chỉ admin thêm nhân viên'};
  var ten=String(p.ten||'').trim(); if(!ten) return {ok:false,msg:'Nhập tên'}; var vt=p.viTri||'Phục vụ';
  if(rows('NhanVien').some(function(n){ return dangLam(n) && tenNgan(n.Ten).toLowerCase()===tenNgan(ten).toLowerCase(); })) return {ok:false,msg:'Đã có người tên "'+tenNgan(ten)+'" đang làm. Thêm họ hoặc chữ phân biệt (VD: '+tenNgan(ten)+' 2).'};
  var lock=LockService.getScriptLock(); lock.waitLock(20000);
  try{ var ma=capMa(vt), sh=SS.getSheetByName('NhanVien'), h=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
    var o={MaNV:ma,Ten:ten,ViTri:vt,ChucVu:p.chucVu||'',Loai:p.loai||'PT',CoSoChinh:p.coSo||'',SDT:sdtGhi_(p.sdt),TrangThai:'Thử việc',NgayVao:p.ngayVao||fmtDate(new Date()),
      LuongGio:(role==='admin'&&p.luongGio)?nghin(p.luongGio):'', KieuLuong:(role==='admin'&&p.kieuLuong==='Cố định')?'Cố định':'Giờ', LuongCoBan:(role==='admin'&&p.luongCoBan)?nghinTien(p.luongCoBan):''};
    sh.appendRow(h.map(function(k){ return o[k]!==undefined?o[k]:''; })); return {ok:true, maNV:ma, tin:tinNhanMa(ma, p.pin)}; } finally { lock.releaseLock(); } }
function suaNhanVien(p){ var role=authRole(p.pin); if(role!=='admin') return {ok:false,msg:'Chỉ admin sửa nhân sự'}; if(p.NgaySinh!==undefined && p.NgaySinh!=='') try{ ensureCols('NhanVien',['NgaySinh']); }catch(e){}
  var n=nvByMa(p.maNV); if(!n) return {ok:false,msg:'Không tìm thấy'}; var sh=SS.getSheetByName('NhanVien'), h=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
  ensureCols('NhanVien',['ViTriKiem','TangCaDuoc','CoDinh','SinhVien']); h=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
  var cho=['Ten','ViTri','ChucVu','Loai','CoSoChinh','SDT','TrangThai','NgayVao','NgaySinh','ViTriKiem','TangCaDuoc','CoDinh','SinhVien']; if(role==='admin') cho=cho.concat(['LuongGio','KieuLuong','LuongCoBan','NgayChuan','GioChuanNgay']);   // ViTriKiem…SinhVien: app Xếp lịch đọc từ đây
  if(p.LuongGio!==undefined && p.LuongGio!=='') p.LuongGio=nghin(p.LuongGio); if(p.LuongCoBan!==undefined && p.LuongCoBan!=='') p.LuongCoBan=nghinTien(p.LuongCoBan);
  var ngayAD=String(p.ngayApDung||fmtDate(new Date())).slice(0,10);
  cho.forEach(function(k){ if(p[k]===undefined || h.indexOf(k)<0) return; var cu=(k==='NgayVao'||k==='NgaySinh')?dateKey(n[k]):(k==='SDT'?sdtDoc_(n[k]):String(n[k]==null?'':n[k])); if((k==='SDT'?sdtDoc_(p[k]):String(p[k]))===cu) return; sh.getRange(n._r, h.indexOf(k)+1).setValue(k==='SDT'?sdtGhi_(p[k]):p[k]);
    if(['ViTri','Loai','ChucVu'].indexOf(k)>-1) ghiLsNV(ngayAD, n.MaNV, k, cu, p[k], tk2Ten(p.pin));
    ghiNhatKy(tk2Ten(p.pin),'',n.MaNV,'Nhân sự: '+k+(['ViTri','Loai','ChucVu'].indexOf(k)>-1?' (áp dụng từ '+ngayAD.split('-').reverse().join('/')+')':''),cu,p[k]); }); return {ok:true}; }
function tk2Ten(pin){ var t=taiKhoan(pin); return t?(t.ten||'Admin'):''; }
function tinNhanMa(ma, pin){ if(pin!==undefined && authRole(pin)!=='admin') return ''; var n=nvByMa(ma); if(!n) return '';
  var thay={ten:tenNgan(n.Ten), ma:String(n.MaNV), link_lich:linkNV('lich'), link_giocong:linkNV('giocong'), link_khaosat:linkNV('khaosat')};
  return dm('MAU_TIN_MA').replace(/\{(ten|ma|link_lich|link_giocong|link_khaosat)\}/g, function(_,k){ return thay[k]; }); }

/* ---------- 9. Mã QR & vị trí quán ---------- */
function dsMaQR(p){ var _q=khongQuyen(p.pin,'qr',1); if(_q) return _q; if(!authRole(p.pin)) return {ok:false,msg:'Sai mã'}; var exec=ScriptApp.getService().getUrl();
  return {ok:true, cf:!!cfg('CF_URL'), list:rows('CoSo').map(function(c){ var sc=suCoDen_(c.MaCS); return {MaCS:c.MaCS,TenCS:c.TenCS,suCo:sc?{den:gioHM_(+sc.den), ly:sc.ly, ai:sc.ai}:null,coViTri:c.ViDo!==''&&c.ViDo!=null,BanKinh:+c.BanKinh||100,url:linkNV('qr','cs='+c.MaCS+'&t='+qrToken(c.MaCS,String(c.QRVer||'')))}; })}; }
function doiMaQR(p){ var _q=khongQuyen(p.pin,'qr',2); if(_q) return _q; ensureCols('CoSo',['QRVer']); var s=rows('CoSo').filter(function(c){ return c.MaCS===p.maCS; })[0]; if(!s) return {ok:false,msg:'Không tìm thấy quán'};
  var sh=SS.getSheetByName('CoSo'), h=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0]; sh.getRange(s._r, h.indexOf('QRVer')+1).setValue((+s.QRVer||0)+1); return {ok:true}; }
function luuViTriQuan(p){ var _q=khongQuyen(p.pin,'qr',2); if(_q) return _q; var s=rows('CoSo').filter(function(c){return c.MaCS===p.maCS;})[0]; if(!s) return {ok:false,msg:'Không tìm thấy quán'};
  var sh=SS.getSheetByName('CoSo'), h=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0]; sh.getRange(s._r,h.indexOf('ViDo')+1).setValue(+p.lat); sh.getRange(s._r,h.indexOf('KinhDo')+1).setValue(+p.lng); return {ok:true}; }

/* ---------- 10. Lương: xem file Luong.gs ---------- */


/* ---------- 11. Cài đặt (admin chỉnh toàn bộ trong app) ---------- */
var NHAN_CAI_DAT={LAM_TRON_PHUT:'Làm tròn giờ công (phút): 15 = tròn 15 phút như hiện nay; 1 = tính đúng từng phút. Áp dụng cho lượt duyệt từ lúc đổi',TANG_CA_TU_PHUT:'Tăng ca dưới bao nhiêu phút thì không tính (VD 30: làm quá ca 20 phút vẫn tính bằng giờ ca; 0 = phút nào cũng tính)',GIO_DEM_TU:'Giờ làm sau mốc này tính là giờ đêm (chỉ để thống kê, VD 22:00)',DOC_LICH:'Đọc lịch từ app Xếp lịch (Có / Không). Không = bỏ so lịch: không còn nhãn khớp lịch / ngoài lịch, không báo vắng hay "có lịch mà không chấm", nhân viên tự chọn ca khi vào',DE_XUAT_GIO:'Giờ đề xuất khi duyệt',NHAC_NHO_PHUT:'Trễ bao nhiêu phút vẫn chỉ là nhắc nhở (quá mức này là trễ, phải duyệt, đếm vào số lần đi trễ)',BANGTIN_URL:'Bảng tin: địa chỉ Worker ncafe-bangtin (VD https://ncafe-bangtin.dangbao-mt.workers.dev). Để trống = tắt bảng tin',BANGTIN_KEY:'Bảng tin: khoá bí mật – dán đúng giá trị FEED_SECRET của Worker ncafe-bangtin',TRU_GIO_TRE_PHUT:'Trễ trên bao nhiêu phút thì TRỪ GIỜ (giờ công tính từ lúc đến thực tế, quản lý xác nhận lại khi duyệt). Từ mức nhắc nhở đến mức này: đếm là đi trễ nhưng không trừ giờ',VE_SOM_PHUT:'Về sớm quá (phút) thì đánh dấu',RA_MUON_PHUT:'Ra muộn quá (phút) thì đánh dấu',TU_DUYET_KHOP:'Tự xác nhận lượt khớp lịch, không cần duyệt (Có / Không – mặc định Không: lượt nào cũng phải duyệt)',NHAC_DUYET_GIO:'Giờ nhắc quản lý duyệt trong ngày (0–23)',PHAN_HOI_NGAY:'Nhân viên được phản hồi trong bao nhiêu ngày',CF_URL:'Trang nhân viên trên Cloudflare (VD: https://caphemuoihue.com) – để trống nếu chưa cài',API_KEY:'Khoá API (dán vào biến API_KEY của Worker Cloudflare)',LUU_TRU_SAU_NGAY:'Tự lưu trữ tháng đã chốt sau bao nhiêu ngày (tính từ cuối tháng)',QR_BAN_KINH:'Bán kính chấm công quanh quán (m)',TRE_PHUT:'Trễ / về sớm quá (phút) thì cần xác nhận',LECH_PHUT:'Giờ chấm lệch ca quá (phút) thì cần xác nhận',
  LICH_SHEET_ID:'ID Google Sheet app Xếp lịch (đọc lịch, khảo sát)',XEP_LICH_URL:'Link app Xếp lịch',DRIVE_FOLDER_ID:'Thư mục Drive lưu ảnh chấm công',ANH_GIU_NGAY:'Giữ ảnh chấm công (ngày)',LUU_TRU_FOLDER_ID:'Thư mục Drive chứa file lưu trữ từng tháng'};
function caiDat(p){ if(authRole(p.pin)!=='admin') return {ok:false,msg:'Chỉ admin'};
  return {ok:true, taiKhoan:rows('TaiKhoan').map(function(t){ return {Ten:t.Ten,PIN:String(t.PIN),VaiTro:/admin/i.test(String(t.VaiTro))?'Admin':(/tr[ưu][ởo]ng ca/i.test(String(t.VaiTro))?'Trưởng ca':'Quản lý'),SuaGio:/admin/i.test(String(t.VaiTro))?'Có':(String(t.SuaGio)==='Có'?'Có':'Không'),GhiChu:t.GhiChu,Quan:String(t.Quan||'')}; }),
    quan:rows('CoSo').map(function(s){ return {MaCS:s.MaCS,TenCS:s.TenCS,GioMo:hhmm(s.GioMo),GioDong:hhmm(s.GioDong),BanKinh:+s.BanKinh||100,coViTri:s.ViDo!==''&&s.ViDo!=null}; }),
    ca:rows('Ca').map(function(x){ return {MaCa:x.MaCa,TenCa:x.TenCa,GioBD:hhmm(x.GioBD),GioKT:hhmm(x.GioKT),SoGio:+x.SoGio,CoSo:String(x.CoSo||'ALL')}; }),
    chung:Object.keys(NHAN_CAI_DAT).map(function(k){ var v=cfg(k); if(v==='' || v==null) v=macDinh_(k); if(k==='GIO_DEM_TU') v=gioChuan_(v,'22:00'); return {Key:k,Nhan:NHAN_CAI_DAT[k],Value:String(v)}; })}; }
function luuTaiKhoan(p){ if(authRole(p.pin)!=='admin') return {ok:false,msg:'Chỉ admin'}; _TKROWS=null; var L=(p.list||[]).filter(function(t){ return String(t.PIN||'').trim(); });
  if(!L.some(function(t){ return t.VaiTro==='Admin'; })) return {ok:false,msg:'Phải còn ít nhất 1 tài khoản Admin'};
  var pins={}; for(var i=0;i<L.length;i++){ var k=String(L[i].PIN).trim(); if(k.length<4) return {ok:false,msg:'Mã đăng nhập ít nhất 4 ký tự ('+L[i].Ten+')'}; if(pins[k]) return {ok:false,msg:'Trùng mã đăng nhập: '+k}; pins[k]=1; }
  ensureCols('TaiKhoan',['Quan']); var sh=SS.getSheetByName('TaiKhoan'), w=6; if(sh.getLastRow()>1) sh.getRange(2,1,sh.getLastRow()-1,w).clearContent();
  var v=L.map(function(t){ return [String(t.Ten||''), String(t.PIN).trim(), t.VaiTro==='Admin'?'Admin':(t.VaiTro==='Trưởng ca'?'Trưởng ca':'Quản lý'), t.VaiTro==='Admin'?'Có':(t.SuaGio==='Có'?'Có':'Không'), String(t.GhiChu||''), t.VaiTro==='Admin'?'':String(t.Quan||'').toUpperCase().replace(/\s/g,'')]; });
  sh.getRange(2,1,v.length,w).setValues(v); try{ sh.getRange('B:B').setNumberFormat('@'); }catch(e){} ghiNhatKyCD('Tài khoản', '', v.length+' tài khoản'); _TKROWS=null; return {ok:true}; }
function luuCaiDatChung(p){ if(authRole(p.pin)!=='admin') return {ok:false,msg:'Chỉ admin'}; if(p.kv && p.kv.CHE_DO_GIO!==undefined && ['thucte','lich'].indexOf(p.kv.CHE_DO_GIO)<0) p.kv.CHE_DO_GIO='lich'; Object.keys(p.kv||{}).forEach(function(k){ if(!NHAN_CAI_DAT[k]) return; var cu=String(cfg(k)); if(cu!==String(p.kv[k])){ setCfg(k, p.kv[k]); ghiNhatKyCD(k,cu,p.kv[k]); } }); return {ok:true}; }
function luuQuan(p){ if(authRole(p.pin)!=='admin') return {ok:false,msg:'Chỉ admin'}; var sh=SS.getSheetByName('CoSo'), h=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
  (p.list||[]).forEach(function(q){ var s=rows('CoSo').filter(function(x){ return x.MaCS===q.MaCS; })[0];
    if(!s){ if(!q.MaCS || !q.TenCS) return; sh.appendRow(h.map(function(k){ return {MaCS:up(q.MaCS),TenCS:q.TenCS,GioMo:q.GioMo||'06:30',GioDong:q.GioDong||'22:30',BanKinh:+q.BanKinh||100}[k]||''; })); ghiNhatKyCD('Thêm quán','',q.TenCS); return; }
    ['TenCS','GioMo','GioDong','BanKinh'].forEach(function(k){ if(q[k]!==undefined && String(q[k])!==String(k==='BanKinh'?s[k]:(k.indexOf('Gio')===0?hhmm(s[k]):s[k]))){ sh.getRange(s._r,h.indexOf(k)+1).setValue(k==='BanKinh'?+q[k]:q[k]); ghiNhatKyCD('Quán '+s.MaCS+' – '+k, s[k], q[k]); } }); });
  return {ok:true}; }
function luuCa(p){ if(authRole(p.pin)!=='admin') return {ok:false,msg:'Chỉ admin'}; memoXoa_('Ca'); var L=(p.list||[]).filter(function(x){ return x.MaCa && hhmm(x.GioBD) && hhmm(x.GioKT); });
  for(var i=0;i<L.length;i++){ if(toMin(L[i].GioKT)<=toMin(L[i].GioBD)) return {ok:false,msg:'Ca '+L[i].MaCa+': giờ kết thúc phải sau giờ bắt đầu'}; }
  var sh=SS.getSheetByName('Ca'); if(sh.getLastRow()>1) sh.getRange(2,1,sh.getLastRow()-1,6).clearContent();
  var v=L.map(function(x){ return [up(x.MaCa), x.TenCa||'', hhmm(x.GioBD), hhmm(x.GioKT), Math.round((toMin(x.GioKT)-toMin(x.GioBD))/60*100)/100, String(x.CoSo||'ALL').trim()||'ALL']; });
  if(v.length) sh.getRange(2,1,v.length,6).setValues(v); ghiNhatKyCD('Danh sách ca','',v.length+' ca'); memoXoa_('Ca'); return {ok:true}; }
function ghiNhatKyCD(muc, cu, moi){ try{ SS.getSheetByName('NhatKySua').appendRow([new Date(),'Admin','','','Cài đặt: '+muc, cu, moi]); }catch(e){} }


/* ---------- 12. Thông báo Telegram ----------
   Mỗi lượt vào / ra ca gửi tin vào nhóm Telegram (nhóm riêng của quán nếu có, không thì nhóm chung).
   Mức "chuy": chỉ báo chuyện cần chú ý (trễ, về sớm, tăng / giảm ca, ca tự điền, điện thoại mới, xa quán, cần duyệt).
   Tổng kết cuối ngày: ai làm, ai vắng so với lịch, ai quên ra ca, còn bao nhiêu lượt chờ duyệt. Lỗi gửi tin không bao giờ làm hỏng việc chấm công. */
function tgChatCho(cs){ return String(cfg('TG_CHAT_'+cs)||cfg('TG_CHAT')||''); }
function tgGui(chat, text){ var tk=String(cfg('TG_TOKEN')||''); if(!tk || !chat) return {ok:false,msg:'Chưa cài mã bot hoặc nhóm'};
  try{ var r=UrlFetchApp.fetch('https://api.telegram.org/bot'+tk+'/sendMessage',{method:'post',contentType:'application/json',payload:JSON.stringify({chat_id:chat,text:text,disable_web_page_preview:true}),muteHttpExceptions:true});
    var j=JSON.parse(r.getContentText()||'{}'); return j.ok?{ok:true}:{ok:false,msg:j.description||'Telegram từ chối'}; }catch(e){ return {ok:false,msg:e.message}; } }
// Gửi ẢNH kèm chữ vào nhóm (như báo doanh thu có ảnh). Ảnh là ảnh nhân viên chụp lúc chấm (đã nén ~50–100 KB).
function tgAnhBat(){ return String(cfg('TG_ANH')||'Có')!=='Không'; }
function tgGuiAnh(chat, text, anh){ var tk=String(cfg('TG_TOKEN')||''); if(!tk || !chat) return {ok:false,msg:'Chưa cài mã bot hoặc nhóm'};
  var m=String(anh||'').match(/^data:(image\/[a-z]+);base64,(.+)$/); if(!m || !tgAnhBat()) return tgGui(chat, text);
  try{ var blob=Utilities.newBlob(Utilities.base64Decode(m[2]), m[1], 'anh.jpg');
    var r=UrlFetchApp.fetch('https://api.telegram.org/bot'+tk+'/sendPhoto',{method:'post',payload:{chat_id:String(chat),caption:String(text).slice(0,1020),photo:blob},muteHttpExceptions:true});
    var j=JSON.parse(r.getContentText()||'{}'); if(j.ok) return {ok:true}; }catch(e){}
  return tgGui(chat, text); }
function tgCanhBaoText(cb){ return cb?' · ⚠️ '+String(cb).split('; ').join(', '):''; }
function tgSuKien(e){ var muc=String(cfg('TG_MUC')||'tatca'); if(muc==='tat' || !cfg('TG_TOKEN')) return; var t='';
  if(e.loai==='VAO'){ var nn=nguongXN().nn, chuY=e.tre>nn || e.cb || e.tuDo; if(muc==='chuy' && !chuY) return;
    t=(e.tre>nn?'⚠️ ':'✅ ')+e.gio+' · '+e.tenCS+'\n'+e.ten+' ('+e.ma+') vào ca '+e.ca+(e.viTri?' · '+e.viTri:'')+(e.tre>nn?'\nTRỄ '+e.tre+' phút':(e.tre>0?' · nhắc nhở: trễ '+e.tre+"'":''))+(e.tuDo?' · 📝 ca tự điền':'')+tgCanhBaoText(e.cb); }
  else { var chuY2=!e.khopLich || e.som>0 || e.khaiLoai!=='du' || e.cb; if(muc==='chuy' && !chuY2) return;
    var sg=function(x){ return String(Math.round((+x||0)*100)/100).replace('.',',')+'h'; };
    var kh=e.khaiLoai==='du'?'xác nhận ĐỦ CA '+sg(e.caGio):(e.khaiLoai==='tang'?'TĂNG CA':'GIẢM CA')+(e.tu?' '+e.tu+'–'+e.den:'')+' (khai '+sg(e.khaiGio)+', ca '+sg(e.caGio)+')';
    t=(e.khopLich?'🔚 ':'❗ ')+e.gio+' · '+e.tenCS+'\n'+e.ten+' ('+e.ma+') ra ca '+e.ca+' · '+kh+(e.tre>nguongXN().nn?'\nChấm vào trễ '+e.tre+"' (quét mã lúc "+e.vao+')'+(e.coMat?' – khai có mặt '+e.coMat:''):'')+(e.khaiSom?'\n⚠️ Khai bắt đầu '+e.tu+' sớm hơn giờ quét mã '+e.khaiSom:'')+(e.lyDo?'\nLý do: '+e.lyDo:'')+(e.ghiChu?' · '+e.ghiChu:'')+tgCanhBaoText(e.cb)+(e.choDuyet?(e.khopLich?' · khớp lịch, chờ duyệt':'\n→ Lệch lịch – chờ quản lý xác nhận ở tab Xác nhận giờ'):' · ✓ khớp lịch'); }
  tgGuiAnh(tgChatCho(e.cs), t, e.anh); }
function tgTongKet(ngay){ var d=ngay||fmtDate(new Date()), h=homNayNoiBo(d,'admin'), st=rows('CoSo'), theo={}, dong=[];
  st.forEach(function(s){ theo[s.MaCS]={ten:s.TenCS, lam:{}, tre:[], dang:[], cho:0, vang:[]}; });
  var nnX=nguongXN().nn; h.list.forEach(function(o){ var q=theo[o.MaCS]; if(!q) return; q.lam[o.MaNV]=1; if(+o.TreMin>nnX) q.tre.push(o.Ten+' '+o.TreMin+'p'); else if(+o.TreMin>0) (q.nn=q.nn||[]).push(o.Ten+' '+o.TreMin+'p'); if(o.TrangThai==='Đang làm') q.dang.push(o.Ten); if(o.TrangThai==='Chờ xác nhận') q.cho++; });
  if(!cheDoThucTe()) h.chuaCham.forEach(function(o){ var q=theo[o.MaCS]; if(q) q.vang.push(o.Ten+' ('+o.Lich+')'); });
  var gui={}; st.forEach(function(s){ var q=theo[s.MaCS], chat=tgChatCho(s.MaCS); if(!chat) return;
    var t='🏠 '+q.ten+': '+Object.keys(q.lam).length+' người làm'+(q.tre.length?'\n• Trễ: '+q.tre.join(', '):'')+(q.nn&&q.nn.length?'\n• Nhắc nhở (trễ ≤ '+nnX+"'): "+q.nn.join(', '):'')+(q.vang.length?'\n• Có lịch nhưng không chấm: '+q.vang.join(', '):'')+(q.dang.length?'\n• Chưa ra ca (quên?): '+q.dang.join(', '):'')+(q.cho?'\n• Chờ duyệt: '+q.cho+' lượt':'');
    (gui[chat]=gui[chat]||[]).push(t); });
  var dd=d.split('-').reverse().join('/'); Object.keys(gui).forEach(function(chat){ tgGui(chat, '📋 TỔNG KẾT NGÀY '+dd+'\n\n'+gui[chat].join('\n\n')); }); return {ok:true, nhom:Object.keys(gui).length}; }
function tgMoiGio(){ if(String(cfg('TG_TONGKET'))!=='Có' || !cfg('TG_TOKEN')) return; var now=new Date(), gio=parseInt(fmtTZ_(now,TZ,'HH'),10), today=fmtDate(now);
  if(gio===(+cfg('TG_TONGKET_GIO')||23) && String(cfg('TG_DA_TONGKET'))!==today){ setCfg('TG_DA_TONGKET', today); tgTongKet(today); } }
// Chạy mỗi 15 phút: nhắc ai quên chấm công khi ca kết thúc được X phút (mặc định 60), và tổng kết cuối ngày nếu bật
function tgDamBaoTrigger(){ try{ var T=ScriptApp.getProjectTriggers();
  T.forEach(function(t){ if(t.getHandlerFunction && t.getHandlerFunction()==='tgMoiGio') ScriptApp.deleteTrigger(t); });
  if(!T.some(function(t){ return t.getHandlerFunction&&t.getHandlerFunction()==='tgMoi15Phut'; })) ScriptApp.newTrigger('tgMoi15Phut').timeBased().everyMinutes(15).create(); }catch(e){} }
function tgMoi15Phut(){ try{ btHangNgay_(); }catch(e){}   // (30/10) đồng bộ nhân viên sang bảng tin mỗi ngày 1 lần
  if(!cfg('TG_TOKEN')) return; var now=new Date().getTime(), last=+cfg('TG_NHAC_LUC')||0;
  if(!last || now-last>6*3600e3) last=now-15*60e3;   // lần đầu hoặc nghỉ lâu: chỉ xét 15 phút gần nhất, không nhắc lại chuyện cũ
  setCfg('TG_NHAC_LUC', now); _CFG=null;
  if(String(cfg('TG_NHAC_CA'))!=='Không') tgNhacCa(last, now);
  try{ tgMoiGio(); }catch(e){} try{ nhacDuyetCuoiNgay(); }catch(e){} }
// Ca nào có hạn (giờ kết thúc + X phút) rơi vào khoảng (tu, den]: ai có lịch mà không chấm vào, ai đã vào mà quên chấm ra → báo nhóm của quán
function tgNhacCa(tu, den){ var tre=+cfg('TG_NHAC_SAU_PHUT')||60, cm=caMap(), nv={}, ten=function(m){ var n=nv[up(m)]; return n?tenNgan(n.Ten):m; };
  rows('NhanVien').forEach(function(n){ nv[up(n.MaNV)]=n; });
  var han=function(ngay, kt){ return new Date(ngay+'T'+kt+':00+07:00').getTime()+tre*60e3; }, trong=function(t){ return t>tu && t<=den; };
  var ngays=[fmtDate(new Date(den)), fmtDate(new Date(den-864e5))], nhom={}, them=function(cs, kt, ngay, loai, s){ var k=cs+'|'+ngay+'|'+kt; (nhom[k]=nhom[k]||{cs:cs,kt:kt,ngay:ngay,quen:[],vang:[]})[loai].push(s); };
  var cc=ccRows(), daBao={};
  ngays.forEach(function(ngay){ var ccN=cc.filter(function(r){ return dateKey(r.Ngay)===ngay; });
    (cheDoThucTe()?[]:lichDaXep()).filter(function(l){ return l.Ngay===ngay; }).forEach(function(l){ var c=caTheoMa(cm,l.MaCa); if(!c || !trong(han(ngay,c.GioKT))) return;
      var cua=ccN.filter(function(r){ return up(r.MaNV)===l.MaNV && (r.MaCa===l.MaCa || (toMin(hhmm(r.CaBD))<toMin(c.GioKT) && toMin(hhmm(r.CaKT))>toMin(c.GioBD))); });
      if(!cua.length) them(l.MaCS, c.GioKT, ngay, 'vang', ten(l.MaNV)+' ('+l.MaNV+') – lịch '+c.GioBD+'–'+c.GioKT);
      else cua.filter(function(r){ return r.TrangThai==='Đang làm'; }).forEach(function(r){ daBao[r.ID]=1; them(r.MaCS, c.GioKT, ngay, 'quen', ten(r.MaNV)+' ('+up(r.MaNV)+') – vào '+hhmm(r.Vao)); }); });
    ccN.filter(function(r){ return r.TrangThai==='Đang làm' && !daBao[r.ID] && trong(han(ngay, hhmm(r.CaKT))); }).forEach(function(r){ them(r.MaCS, hhmm(r.CaKT), ngay, 'quen', ten(r.MaNV)+' ('+up(r.MaNV)+') – vào '+hhmm(r.Vao)+' (ca '+hhmm(r.CaBD)+'–'+hhmm(r.CaKT)+')'); }); });
  var tenCS={}; rows('CoSo').forEach(function(s){ tenCS[s.MaCS]=s.TenCS; }); var gui=0;
  Object.keys(nhom).sort().forEach(function(k){ var g=nhom[k];
    var t='⏰ Hết ca '+g.kt+' · '+(tenCS[g.cs]||g.cs)+' (đã qua '+tre+' phút)'+(g.quen.length?'\nQuên chấm RA:\n• '+g.quen.join('\n• '):'')+(g.vang.length?'\nCó lịch nhưng KHÔNG chấm công:\n• '+g.vang.join('\n• '):'')+'\n→ Nhắc nhân viên; quản lý bổ sung giờ ở tab Xác nhận giờ';
    if(tgGui(tgChatCho(g.cs), t).ok) gui++; });
  return {ok:true, nhom:Object.keys(nhom).length, gui:gui}; }
// Admin: tìm các nhóm đã thêm bot (cần nhắn 1 tin bất kỳ vào nhóm sau khi thêm bot)
function tgLayNhom(p){ if(authRole(p.pin)!=='admin') return {ok:false,msg:'Chỉ admin'}; var tk=String(p.token||cfg('TG_TOKEN')||'').trim(); if(!tk) return {ok:false,msg:'Dán mã bot trước'};
  try{ var r=UrlFetchApp.fetch('https://api.telegram.org/bot'+tk+'/getUpdates',{muteHttpExceptions:true}), j=JSON.parse(r.getContentText()||'{}'); if(!j.ok) return {ok:false,msg:'Mã bot không đúng ('+(j.description||'lỗi')+')'};
    var o={}; (j.result||[]).forEach(function(u){ [u.message,u.my_chat_member,u.channel_post,u.edited_message].forEach(function(m){ if(m && m.chat && m.chat.type!=='private') o[m.chat.id]=m.chat.title||String(m.chat.id); }); });
    return {ok:true, nhom:Object.keys(o).map(function(k){ return {id:k, ten:o[k]}; })}; }catch(e){ return {ok:false,msg:e.message}; } }
function luuTelegram(p){ if(authRole(p.pin)!=='admin') return {ok:false,msg:'Chỉ admin'};
  var kv={TG_TOKEN:String(p.token||'').trim(), TG_CHAT:String(p.chung||''), TG_MUC:['tatca','chuy','tat'].indexOf(p.muc)>-1?p.muc:'tatca', TG_NHAC_CA:p.nhacCa==='Không'?'Không':'Có', TG_NHAC_SAU_PHUT:Math.min(240,Math.max(15,+p.sauPhut||60)), TG_TONGKET:p.tongKet==='Có'?'Có':'Không', TG_TONGKET_GIO:Math.min(23,Math.max(0,+p.gio||23)), TG_ANH:p.anh==='Không'?'Không':'Có'};
  rows('CoSo').forEach(function(s){ kv['TG_CHAT_'+s.MaCS]=String((p.rieng||{})[s.MaCS]||''); });
  Object.keys(kv).forEach(function(k){ if(String(cfg(k))!==String(kv[k])) setCfg(k, kv[k]); }); _CFG=null; tgDamBaoTrigger(); return {ok:true}; }
function tgGuiThu(p){ if(authRole(p.pin)!=='admin') return {ok:false,msg:'Chỉ admin'}; var chats={};
  if(cfg('TG_CHAT')) chats[cfg('TG_CHAT')]='nhóm chung'; rows('CoSo').forEach(function(s){ var c=cfg('TG_CHAT_'+s.MaCS); if(c) chats[c]=(chats[c]?chats[c]+', ':'nhóm ')+s.TenCS; });
  if(!Object.keys(chats).length) return {ok:false,msg:'Chưa chọn nhóm nào'};
  var kq=Object.keys(chats).map(function(c){ var r=tgGui(c,'🔔 Thử thông báo chấm công Ncafe ('+chats[c]+') – nếu thấy tin này là đã nối xong.'); return chats[c]+': '+(r.ok?'đã gửi':'LỖI – '+r.msg); });
  return {ok:true, kq:kq}; }
function tgCauHinh(p){ if(authRole(p.pin)!=='admin') return {ok:false,msg:'Chỉ admin'}; var r={};
  rows('CoSo').forEach(function(s){ r[s.MaCS]=String(cfg('TG_CHAT_'+s.MaCS)||''); });
  return {ok:true, token:String(cfg('TG_TOKEN')||''), chung:String(cfg('TG_CHAT')||''), rieng:r, muc:String(cfg('TG_MUC')||'tatca'), nhacCa:String(cfg('TG_NHAC_CA')||'Có'), sauPhut:+cfg('TG_NHAC_SAU_PHUT')||60, tongKet:String(cfg('TG_TONGKET')||'Không'), gio:+cfg('TG_TONGKET_GIO')||23, anh:String(cfg('TG_ANH')||'Có'), stores:rows('CoSo').map(function(s){ return {MaCS:s.MaCS,TenCS:s.TenCS}; })}; }

/* ---------- WIFI QUÁN: chỉ chấm công khi điện thoại dùng wifi của một quán trong hệ thống ----------
   Trình duyệt không đọc được tên wifi → so ĐỊA CHỈ IP mạng: Worker Cloudflare gửi IP thật của điện thoại (tách khỏi dữ liệu nhân viên gửi, không giả được).
   Vào quán A ra quán B vẫn hợp lệ, miễn IP nằm trong danh sách wifi của hệ thống. */
var IP_KHACH='';   // chỉ doPost (qua Worker có khoá API) mới đặt giá trị này
var AS_ORG_KHACH='';   // (30/10c) tên nhà mạng từ Cloudflare (request.cf.asOrganization) – dùng để phát hiện IP mobile khi tự nhận wifi quán
function wifiCheDo_(){ var v=String(cfg('WIFI_CHE_DO')||'Cảnh báo'); return /^bắt/i.test(v)?'batbuoc':(/^tắt/i.test(v)?'tat':'canhbao'); }
/* (29/10) Lỗi 1: Google Sheet định dạng Việt Nam coi dấu chấm là phân cách nghìn → IP 14.254.129.209 bị đổi thành SỐ 14254129209
   (chỉ khi 3 cụm sau đều đủ 3 chữ số) → không khớp, mỗi lần chấm thành 1 dòng mới, tự thêm wifi không chạy. Khôi phục khi đọc, ghi dạng chữ.
   Lỗi 2: mạng IPv6 cấp cho MỖI điện thoại 1 địa chỉ riêng (cùng 4 cụm đầu) → 1 wifi hiện thành nhiều IP. Gộp theo 4 cụm đầu (/64). */
function ipDoc_(v){ if(typeof v==='number' && isFinite(v)){ var s0=String(Math.round(v)); if(s0.length>=10 && s0.length<=12){ var o=[s0.slice(0,s0.length-9), s0.slice(-9,-6), s0.slice(-6,-3), s0.slice(-3)]; if(o.every(function(x){ return +x<=255; })) return o.map(function(x){ return String(+x); }).join('.'); } return s0; }
  var t=String(v==null?'':v).trim().replace(/^'/,''); if(/^\d{10,12}$/.test(t)) return ipDoc_(+t); return t; }
function ipGhi_(ip){ return "'"+String(ip||''); }   // ghi dạng chữ (dấu ' không lưu vào ô)
function ipKhoa_(ip){ ip=ipDoc_(ip).toLowerCase(); return ip.indexOf(':')>-1 && ip.indexOf('::/64')<0 ? ipChuan_(ip) : ip; }   // 1 mạng = 1 khoá
function ipChuan_(ip){ ip=String(ip||'').trim().toLowerCase(); if(ip.indexOf(':')>-1){ var g=ip.split('::')[0].split(':'); return g.slice(0,4).join(':')+'::/64'; } return ip; }
function wifiDs_(){ return memoRows_('WifiQuan').filter(function(w){ return String(w.TrangThai||'Dùng')!=='Bỏ' && String(w.IP||'').trim(); }).map(function(w){ var o=Object.assign({},w); o.IP=ipDoc_(w.IP); return o; }); }
function ipKhop_(ip, mau){ ip=ipDoc_(ip).toLowerCase(); mau=ipDoc_(mau).toLowerCase(); if(!ip||!mau) return false;
  if(mau.indexOf('::/64')>-1) return ipChuan_(ip)===mau; if(mau.indexOf('*')>-1) return ip.indexOf(mau.split('*')[0])===0; return ip===mau; }
function wifiKiem_(cs){ var ds=wifiDs_(), cd=wifiCheDo_(); if(cd==='tat' || !ds.length) return {bat:false, ok:true, ip:IP_KHACH, cheDo:cd};
  var w=ds.filter(function(x){ return ipKhop_(IP_KHACH, x.IP); })[0], o={bat:true, ok:!!w, khop:!!w, ip:IP_KHACH, cheDo:cd, cs:w?up(w.MaCS):''};
  if(!o.ok && cs){ var sc=suCoDen_(cs); if(sc){ o.ok=true; o.suCo=sc; } } return o; }
/* (29/10) QUÁN MẤT MẠNG: 2 nhân viên (2 máy) chấm ĐÚNG VỊ TRÍ quán trong 60 phút, mỗi người 1 địa chỉ khác nhau, không ai dùng wifi quán
   → quán đang mất điện / mất mạng, mọi người dùng 4G → tạm cho chấm không cần wifi 3 giờ (còn người chấm bằng 4G thì gia hạn), báo Telegram.
   Wifi quán có lại (có người chấm bằng wifi của chính quán đó) → tự kiểm tra lại. Quản lý cũng bấm tay được ("Quán mất mạng" / "Có mạng lại").
   (Cùng 1 địa chỉ lạ → là wifi ĐỔI địa chỉ → phần "tự thêm IP mới" lo.) */
var SUCO_PHUT=180;
function suCoDen_(cs){ var v=String(cfg('WIFI_SUCO_'+up(cs))||''); if(!v) return null; try{ var o=JSON.parse(v); return (o && +o.den>Date.now())?o:null; }catch(e){ return null; } }
function suCoDat_(cs, den, ly, ai){ setCfg('WIFI_SUCO_'+up(cs), den?JSON.stringify({den:den, ly:ly||'', ai:ai||'', tu:Date.now()}):''); _CFG=null; }
function gioHM_(ms){ return fmtTZ_(new Date(ms),TZ,'HH:mm'); }
function wifiMatMang_(s, n, p){ if(String(cfg('WIFI_TU_MAT_MANG')||'Có')==='Không') return false; var cs=up(s.MaCS), c=CacheService.getScriptCache(), k='WIFI_THU_'+cs, L=[], now=Date.now();
  try{ L=JSON.parse(c.get(k)||'[]'); }catch(e){}
  L=L.filter(function(x){ return now-x.t<60*60e3 && x.ma!==String(n.MaNV); }); L.push({ma:String(n.MaNV), ten:tenNgan(n.Ten), d:String(p&&p.deviceId||'').slice(0,40), ip:ipKhoa_(IP_KHACH), t:now});
  try{ c.put(k, JSON.stringify(L).slice(0,90000), 3600); }catch(e){}
  var dk=wifiDs_(); L=L.filter(function(x){ return !dk.some(function(w){ return ipKhop_(x.ip, w.IP); }); });   // địa chỉ đã thành wifi quán → không tính
  var ma={}, d={}, ip={}, nguoiIP={}; L.forEach(function(x){ ma[x.ma]=1; if(x.d) d[x.d]=1; ip[x.ip]=1; (nguoiIP[x.ip]=nguoiIP[x.ip]||{})[x.ma]=1; });
  if(Object.keys(nguoiIP).some(function(k){ return Object.keys(nguoiIP[k]).length>1; })) return false;   // 1 địa chỉ lạ có ≥ 2 người → là wifi (đổi địa chỉ), không phải 4G
  if(Object.keys(ma).length<2 || Object.keys(d).length<2 || Object.keys(ip).length<2) return false;
  var den=now+SUCO_PHUT*60e3, ten=L.map(function(x){ return x.ten; }).join(', '); suCoDat_(cs, den, 'tự nhận', ten); try{ c.remove(k); }catch(e){}
  ghiNhatKy('App','','','Quán mất mạng (tự nhận)','',cs+' – '+ten+' chấm đúng vị trí bằng 4G');
  try{ tgGui(tgChatCho(cs), '⚡ '+s.TenCS+': có vẻ quán đang MẤT ĐIỆN / MẤT MẠNG – '+ten+' chấm đúng vị trí quán bằng 4G.\nApp tạm cho chấm công KHÔNG cần wifi đến '+gioHM_(den)+' (còn người chấm bằng 4G thì tự gia hạn). Có wifi lại thì app tự kiểm tra như cũ.\nNếu quán vẫn có mạng: trang quản lý → Cài đặt → Mã QR & wifi → "Có mạng lại".'); }catch(e){}
  return true; }
function wifiCoLai_(s){ var cs=up(s.MaCS), sc=suCoDen_(cs); if(!sc) return; suCoDat_(cs, 0);
  ghiNhatKy('App','','','Quán có mạng lại','',cs); try{ tgGui(tgChatCho(cs), '✅ '+s.TenCS+': wifi quán đã có lại – app kiểm tra wifi như bình thường.'); }catch(e){} }
// Quản lý / admin bấm tay: quán đang mất mạng (tới hết hôm nay) / có mạng lại
function wifiMatMangDat(p){ var _q=khongQuyen(p.pin,'qr',1); if(_q) return _q; var tk=tkDayDu(p.pin); if(!tk) return {ok:false,msg:'Sai mã'}; var cs=up(p.cs||'');
  var s=rows('CoSo').filter(function(c){ return up(c.MaCS)===cs; })[0]; if(!s) return {ok:false,msg:'Không tìm thấy quán'}; if(!tk.duocCS(cs)) return {ok:false,msg:'Quán này không thuộc tài khoản của bạn'};
  var ai=tk.ten||(tk.role==='admin'?'Admin':'Quản lý');
  if(p.bat){ var den=new Date(fmtDate(new Date())+'T23:59:00+07:00').getTime(); suCoDat_(cs, den, 'quản lý', ai); ghiNhatKy(ai,'','','Quán mất mạng (bấm tay)','',cs);
    try{ tgGui(tgChatCho(cs), '⚡ '+s.TenCS+': '+ai+' báo quán MẤT MẠNG – tạm cho chấm công không cần wifi đến hết hôm nay (có wifi lại thì app tự kiểm tra như cũ).'); }catch(e){} }
  else wifiCoLai_(s);
  return {ok:true}; }
// Ghi IP gặp lúc chấm (1 dòng / IP) để admin chọn "Là wifi quán"
function ghiIP_(cs, ma, w, loai, kc, dev, gpsOk){ if(!IP_KHACH) return null; try{ var ten='WifiGanDay', sh=SS.getSheetByName(ten); if(!sh){ sh=SS.insertSheet(ten); sh.appendRow(['IP','LanDau','LanCuoi','SoLan','Quan','NhanVien','BiChan','GanQuan','DungViTri']); }
  var hd=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0]; if(hd.indexOf('DungViTri')<0) sh.getRange(1,hd.length+1).setValue('DungViTri');
  var ip=ipKhoa_(IP_KHACH), L=rows(ten), x=L.filter(function(r){ return ipKhoa_(r.IP)===ip; })[0], now=new Date(), q={}, nv={};
  if(x){ try{ q=JSON.parse(x.Quan||'{}'); }catch(e){} try{ nv=JSON.parse(x.NhanVien||'{}'); }catch(e){} }
  q[cs]=(q[cs]||0)+1; nv[ma]=1; var ganQuan=(+(x&&x.GanQuan)||0)+(gpsOk?1:0), dv={}; try{ dv=JSON.parse((x&&x.DungViTri)||'{}'); }catch(e){}
  // ai chấm ĐÚNG VỊ TRÍ QUÁN từ IP này trong 6 giờ gần nhất (để tự nhận IP wifi mới)
  var han=now.getTime()-6*3600e3; Object.keys(dv).forEach(function(k){ if(!(dv[k].t>han)) delete dv[k]; }); if(gpsOk) dv[ma]={cs:cs, d:String(dev||'').slice(0,40), t:now.getTime()};
  var dong=[ipGhi_(ip), x?x.LanDau:now, now, (+(x&&x.SoLan)||0)+1, JSON.stringify(q), JSON.stringify(nv).slice(0,2000), (+(x&&x.BiChan)||0)+(w.bat&&!w.ok&&w.cheDo==='batbuoc'?1:0), ganQuan, JSON.stringify(dv).slice(0,3000)];
  if(x) sh.getRange(x._r,1,1,dong.length).setValues([dong]); else sh.appendRow(dong); return dv; }catch(e){ return null; } }
// Tự nhận IP wifi mới: ≥ 2 nhân viên khác nhau, 2 điện thoại khác nhau, GPS đúng vị trí CÙNG một quán, trong 6 giờ → thêm vào danh sách + báo Telegram
function wifiTuThemBat_(){ return String(cfg('WIFI_TU_THEM')||'Có')!=='Không'; }
function wifiTuThem_(s, dv){ if(!dv || !wifiTuThemBat_()) return false; var cs=up(s.MaCS), ma=Object.keys(dv).filter(function(k){ return dv[k].cs===cs; });
  var dev={}; ma.forEach(function(k){ if(dv[k].d) dev[dv[k].d]=1; }); if(ma.length<2 || Object.keys(dev).length<2) return false;
  var ten=ma.map(function(k){ var n=nvByMa(k); return n?tenNgan(n.Ten):k; }).join(', '), sh=SS.getSheetByName('WifiQuan'); if(!sh){ sh=SS.insertSheet('WifiQuan'); sh.appendRow(['IP','MaCS','GhiChu','Ngay','Boi','TrangThai']); }
  var khoa=ipKhoa_(IP_KHACH); if(wifiDs_().some(function(w){ return ipKhop_(IP_KHACH, w.IP); })) return false;
  sh.appendRow([ipGhi_(khoa), cs, 'Tự thêm: '+ten+' đúng vị trí quán', new Date(), 'App', 'Dùng']); memoXoa_('WifiQuan');
  ghiNhatKy('App','','','Tự thêm wifi quán','',khoa+' ('+cs+') – '+ten);
  try{ tgGui(tgChatCho(cs), '📶 '+s.TenCS+': đã TỰ THÊM IP wifi mới '+khoa+' (có thể modem vừa khởi động lại).\n'+ten+' chấm đúng vị trí quán từ IP này. Ai vừa bị chặn thì tải lại trang và quét lại.\nNếu đây KHÔNG phải wifi quán: trang quản lý → Mã QR → Wifi quán → Bỏ.'); }catch(e){}
  return true; }
function wifiBaoChan_(s, n){ try{ var k='WIFI_CHAN_'+IP_KHACH+'_'+fmtDate(new Date()), c=CacheService.getScriptCache(); if(c.get(k)) return; c.put(k,'1',21600);
  tgGui(tgChatCho(s.MaCS), '⚠️ '+s.TenCS+': '+tenNgan(n.Ten)+' ('+n.MaNV+') bị chặn chấm công vì không dùng wifi quán (IP '+(IP_KHACH||'không rõ')+').'+(wifiTuThemBat_()?'\nNếu wifi quán vừa đổi IP: khi thêm 1 bạn nữa (điện thoại khác) quét đúng vị trí quán, app sẽ TỰ THÊM IP mới. Hoặc vào trang quản lý → Mã QR → Wifi quán → "Là wifi quán".':'\nNếu wifi quán vừa đổi IP (modem khởi động lại): trang quản lý → Mã QR → Wifi quán → bấm "Là wifi quán".')); }catch(e){} }
// Kiểm tra khi vào / ra ca: Bắt buộc → chặn; Cảnh báo → cho chấm, ghi nhãn để quản lý xem khi duyệt
function wifiChan_(s, n, loai, p){ var w=wifiKiem_(s.MaCS); var kc='', gpsOk=false; try{ if(p && p.lat!=='' && p.lat!=null && isFinite(+p.lat) && s.ViDo!=='' && s.ViDo!=null){ kc=khoangCach(+p.lat,+p.lng,+s.ViDo,+s.KinhDo); gpsOk=kc<=(+s.BanKinh||+cfg('QR_BAN_KINH')||100)+Math.min(+p.acc||0,150); } }catch(e){}
  // (30/10c) Nếu bật WIFI_CHO_XAC_NHAN='Có' (admin bật trong Cài đặt): chế độ Bắt buộc + IP lạ → KHÔNG chặn, ghi queue + chờ xác nhận.
  // Tự nhận IP khi trong 2h cùng quán có ≥ 2 NV khác nhau đã chấm cùng IP VÀ IP không thuộc mạng di động 4G.
  if(w.bat && !w.ok && String(cfg('WIFI_CHO_XAC_NHAN')||'Không')==='Có'){
    var ip=IP_KHACH, asOrg=AS_ORG_KHACH, mobile=wifiLaMobile_(asOrg);
    try{
      if(ip && !mobile){
        var khac=wifiDemNVKhacCho_(up(s.MaCS), ip, String(n.MaNV), 2*3600*1000);
        if(khac.length>=1){ wifiThemTuNhan_(up(s.MaCS), ip, asOrg, [String(n.MaNV)].concat(khac)); w=wifiKiem_(s.MaCS); }
      }
    }catch(e){}
    if(!w.ok) return {choIP:true, ip:ip, asOrg:asOrg, mobile:mobile, loai:loai, msg:'Đã ghi nhận, đang chờ xác nhận mạng quán'};
  }
  var dv=ghiIP_(up(s.MaCS), String(n.MaNV), w, loai, kc, p&&p.deviceId, gpsOk);
  if(w.bat && w.khop && w.cs===up(s.MaCS)) wifiCoLai_(s);   // wifi của chính quán dùng được lại → hết "mất mạng"
  if(w.bat && !w.ok && gpsOk && wifiTuThem_(s, dv)) w=wifiKiem_(s.MaCS);
  if(w.bat && !w.ok && gpsOk && wifiMatMang_(s, n, p)) w=wifiKiem_(s.MaCS);
  if(w.bat && w.suCo && gpsOk && w.suCo.ly==='tự nhận' && +w.suCo.den-Date.now()<2*3600e3) suCoDat_(up(s.MaCS), Date.now()+SUCO_PHUT*60e3, 'tự nhận', w.suCo.ai);   // còn chấm 4G → gia hạn
  if(w.bat && !w.ok && w.cheDo==='batbuoc'){ wifiBaoChan_(s, n); return {ok:false, wifi:false, msg:'Bạn chưa dùng wifi của quán. Bật wifi quán (tắt 4G / VPN), rồi quét lại mã QR.'+(gpsOk?' Nếu quán đang mất điện / mất mạng: khi có thêm 1 bạn quét đúng vị trí quán, app tự cho chấm bằng 4G – thử lại sau ít phút, hoặc nhờ quản lý bấm "Quán mất mạng".':'')}; }
  return null; }
function wifiDuLieu(p){ if(authRole(p.pin)!=='admin') return {ok:false,msg:'Chỉ admin'}; var han=new Date().getTime()-30*864e5, G={};
  (SS.getSheetByName('WifiGanDay')?rows('WifiGanDay'):[]).filter(function(r){ return r.LanCuoi instanceof Date && r.LanCuoi.getTime()>han; }).forEach(function(r){ var k=ipKhoa_(r.IP); if(!k) return;
    var q={}; try{ q=JSON.parse(r.Quan||'{}'); }catch(e){} var nv={}; try{ nv=JSON.parse(r.NhanVien||'{}'); }catch(e){}
    var g=G[k]||(G[k]={IP:k, last:0, soLan:0, quan:{}, nv:{}, biChan:0, ganQuan:0, soDong:0}); g.soDong++; g.soLan+=(+r.SoLan||0); g.biChan+=(+r.BiChan||0); g.ganQuan+=(+r.GanQuan||0);
    Object.keys(q).forEach(function(c){ g.quan[c]=(g.quan[c]||0)+q[c]; }); Object.keys(nv).forEach(function(m){ g.nv[m]=1; }); if(r.LanCuoi.getTime()>g.last) g.last=r.LanCuoi.getTime(); });
  var gan=Object.keys(G).map(function(k){ var g=G[k]; return {IP:k, v6:k.indexOf(':')>-1, lanCuoi:fmtTZ_(new Date(g.last),TZ,'dd/MM HH:mm'), soLan:g.soLan, quan:g.quan, soNV:Object.keys(g.nv).length, biChan:g.biChan, ganQuan:g.ganQuan}; })
    .sort(function(a,b){ return b.soLan-a.soLan; });
  var ds=wifiDs_().map(function(w){ return {IP:String(w.IP), MaCS:up(w.MaCS), GhiChu:String(w.GhiChu||''), Ngay:w.Ngay instanceof Date?fmtDate(w.Ngay):String(w.Ngay||'')}; });
  gan.forEach(function(g){ g.daCo=ds.some(function(w){ return ipKhop_(g.IP, w.IP); }); });
  return {ok:true, cheDo:String(cfg('WIFI_CHE_DO')||'Cảnh báo'), tuThem:wifiTuThemBat_(), ds:ds, gan:gan}; }
function wifiDatTuThem(p){ if(authRole(p.pin)!=='admin') return {ok:false,msg:'Chỉ admin'}; setCfg('WIFI_TU_THEM', p.bat?'Có':'Không'); _CFG=null; ghiNhatKy('Admin','','','Tự thêm IP wifi mới','',p.bat?'Bật':'Tắt'); return {ok:true}; }
function wifiThem(p){ if(authRole(p.pin)!=='admin') return {ok:false,msg:'Chỉ admin'}; var ip=String(p.ip||'').trim(); if(!/^[0-9a-f.:*\/]{3,60}$/i.test(ip)) return {ok:false,msg:'IP không hợp lệ'};
  if(ip.indexOf(':')>-1 && ip.indexOf('::/64')<0) ip=ipChuan_(ip); var sh=SS.getSheetByName('WifiQuan'); if(!sh){ sh=SS.insertSheet('WifiQuan'); sh.appendRow(['IP','MaCS','GhiChu','Ngay','Boi','TrangThai']); }
  if(wifiDs_().some(function(w){ return String(w.IP).toLowerCase()===ip.toLowerCase(); })) return {ok:true, msg:'Đã có'};
  sh.appendRow([ipGhi_(ip), up(p.cs||''), String(p.ghiChu||'').slice(0,100), new Date(), 'Admin', 'Dùng']); memoXoa_('WifiQuan'); ghiNhatKy('Admin','','','Thêm wifi quán','',ip+' ('+up(p.cs||'')+')'); return {ok:true}; }
function wifiBo(p){ if(authRole(p.pin)!=='admin') return {ok:false,msg:'Chỉ admin'}; var sh=SS.getSheetByName('WifiQuan'); if(!sh) return {ok:false,msg:'Chưa có danh sách'};
  var h=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0], x=rows('WifiQuan').filter(function(w){ return ipDoc_(w.IP)===String(p.ip) && String(w.TrangThai||'Dùng')!=='Bỏ'; })[0]; if(!x) return {ok:false,msg:'Không tìm thấy'};
  sh.getRange(x._r, h.indexOf('TrangThai')+1).setValue('Bỏ'); memoXoa_('WifiQuan'); ghiNhatKy('Admin','','','Bỏ wifi quán', String(p.ip), ''); return {ok:true}; }
function wifiDatCheDo(p){ if(authRole(p.pin)!=='admin') return {ok:false,msg:'Chỉ admin'}; var v={tat:'Tắt',canhbao:'Cảnh báo',batbuoc:'Bắt buộc'}[p.cheDo]; if(!v) return {ok:false,msg:'Chế độ không hợp lệ'};
  var cu=String(cfg('WIFI_CHE_DO')||'Cảnh báo'); setCfg('WIFI_CHE_DO', v); _CFG=null; ghiNhatKy('Admin','','','Chế độ wifi quán', cu, v); return {ok:true}; }

// (29/10) Đo thời gian máy chủ tính cho các mục nặng (trang quản lý hiện "máy chủ x,xs · tổng y,ys" cho admin)
function chay(fn, p){ var H={homNay:homNay, xnDanhSach:xnDanhSach, bangLuong:bangLuong, luongCoSo:luongCoSo, traCuuLuoi:traCuuLuoi, traCuuGioCong:traCuuGioCong, lichChamCong:lichChamCong, dsDot:dsDot, dsNhanVien:dsNhanVien, phieuLuong:phieuLuong};
  var h=H[fn]; if(!h) return {ok:false,msg:'Không hỗ trợ'}; _DO={}; _CCM=true; var t=Date.now(), r;
  try{ r=h(p||{}); } finally { _CCM=false; delete _MEMO.__cc; }
  if(r && typeof r==='object'){ r._ms=Date.now()-t; var pha={}; Object.keys(_DO).forEach(function(k){ if(_DO[k]>=50) pha[k]=_DO[k]; }); r._pha=pha; } _DO=null; return r; }
