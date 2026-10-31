/*******************************************************
 * CHẤM CÔNG NCAFE – Code.gs
 * Tab: NhanVien, CoSo, Ca, DinhMuc, LichLam, ChamCong, CaiDat
 * Chạy setup() một lần (chạy lại cũng an toàn, không ghi đè dữ liệu).
 *******************************************************/

var VER_CODE='29/10e XL';   // phiên bản code, hiện ở góc trang quản lý để biết đã cập nhật chưa
var SS = SpreadsheetApp.getActiveSpreadsheet();

// (30/10) Utilities.formatDate rất chậm trên máy chủ Google (~1–2 ms / lần; bảng lương gọi ~6.000 lần nhưng chỉ ~100 giá trị khác nhau → ~12 giây).
// Nhớ kết quả trong 1 lượt chạy: cùng một mốc giờ + cùng kiểu định dạng thì chỉ đổi một lần.
var _FMT={}, _FMT_SO=0;
function fmtTZ_(d, tz, pat){ if(!(d instanceof Date)) return Utilities.formatDate(d, tz, pat); var k=d.getTime()+'|'+tz+'|'+pat, v=_FMT[k];
  if(v===undefined){ v=Utilities.formatDate(d, tz, pat); if(_FMT_SO++>60000){ _FMT={}; _FMT_SO=0; } _FMT[k]=v; } return v; }
var TZ = 'Asia/Ho_Chi_Minh';
var STZ = SS.getSpreadsheetTimeZone();   // múi giờ của file Sheet: ô giờ/ngày trong Sheet phải đọc theo múi giờ này
var RECENT_ROWS = 800;   // chỉ đọc 800 dòng chấm công gần nhất khi chấm, giữ app nhanh
var CC_HEADER = ['ID','ThoiGian','Ngay','MaNV','Ten','MaCS','Loai','MaCa','TreMin','SomMin','AnhURL','GhiChu','TangCaGio','LyDoTC','DuyetTC','ViTriLam'];

/* ---------- 1. Cài đặt ---------- */
function setup() {
  // File tạo sẵn từ danh sách nhân viên: đổi tên tab đầu (A1 = MaNV) thành NhanVien
  SS.getSheets().forEach(function(s){
    if(s.getName()!=='NhanVien' && String(s.getRange('A1').getValue())==='MaNV' && !SS.getSheetByName('NhanVien')) s.setName('NhanVien');
  });
  var tabs = {
    NhanVien: [['MaNV','Ten','ViTri','ChucVu','ViTriKiem','Loai','CoSoChinh','TangCaDuoc','SDT','TrangThai','GhiChu']],
    // DoanhThuTB = doanh thu trung bình/ngày (triệu), dùng để so giờ công với doanh thu
    CoSo:     [['MaCS','TenCS','Key','GioMo','GioDong','DoanhThuTB'],
               ['TP','Trần Phú','tp2026','06:30','22:30',24],['DD','Đống Đa','dd2026','06:30','22:30',16.5],
               ['TD','Tản Đà','td2026','06:30','18:30',7],['TNV','Trưng Nữ Vương','tnv2026','06:30','18:30',5.5],
               ['LDD','Lê Đình Dương','ldd2026','06:30','22:30',12]],
    // CoSo: ALL = mọi cơ sở, hoặc liệt kê mã cách nhau bằng dấu phẩy
    Ca:       [['MaCa','TenCa','GioBD','GioKT','SoGio','LoaiNV','CoSo'],
               ['FT1','Full sáng','06:30','14:30',8,'FT','ALL'],
               ['FT2','Full chiều','14:30','22:30',8,'FT','TP,DD,LDD'],
               ['FT3','Full 8h-17h','08:00','17:00',8,'FT','ALL'],
               ['FT4','Full 10h30-18h30','10:30','18:30',8,'FT','TD,TNV'],
               ['FT10','Dài 10,5','06:30','17:00',10.5,'FT','ALL'],
               ['FT11','Dài 11,5','06:30','18:00',11.5,'FT','ALL'],
               ['PT1','Part sáng','06:30','12:00',5.5,'PT','ALL'],
               ['PT2','Part trưa','12:00','17:00',5,'PT','ALL'],
               ['PT4','Part chiều TD/TNV','12:00','18:30',6.5,'PT','TD,TNV'],
               ['PT3','Part tối','17:00','22:30',5.5,'PT','TP,DD,LDD']],
    // Định mức người mỗi ca: ToiThieu = tháng 10/2026, Chuan = tháng 6–8/2026 (thấp điểm), CaoDiem = tháng 1–3/2026
    // Định mức tính từ lịch thật 2026: ToiThieu = T9–10, Chuan = T6–8, CaoDiem = T1–3, CuoiTuan = thêm T7/CN
    DinhMuc:  [['MaCS','Ca','ViTri','ToiThieu','Chuan','CaoDiem','CuoiTuan']].concat([["TP", "Sáng", "Bảo vệ", 1, 1, 1, 0], ["TP", "Sáng", "Pha chế", 3, 3, 4, 1], ["TP", "Sáng", "Phục vụ", 3, 4, 4, 0], ["TP", "Sáng", "Rửa ly", 1, 1, 1, 0], ["TP", "Trưa", "Pha chế", 2, 2, 2, 0], ["TP", "Trưa", "Phục vụ", 1, 1, 2, 0], ["TP", "Tối", "Pha chế", 2, 2, 3, 0], ["TP", "Tối", "Phục vụ", 3, 3, 4, 0], ["DD", "Sáng", "Bảo vệ", 1, 1, 1, 0], ["DD", "Sáng", "Pha chế", 2, 3, 4, 0], ["DD", "Sáng", "Phục vụ", 2, 3, 4, 0], ["DD", "Sáng", "Rửa ly", 0, 1, 1, 0], ["DD", "Trưa", "Pha chế", 2, 2, 2, 0], ["DD", "Tối", "Pha chế", 2, 2, 2, 0], ["DD", "Tối", "Phục vụ", 1, 1, 2, 0], ["DD", "Tối", "Rửa ly", 0, 1, 1, 0], ["TD", "Sáng", "Pha chế", 2, 2, 2, 0], ["TD", "Sáng", "Phục vụ", 1, 2, 2, 0], ["TD", "Trưa", "Pha chế", 1, 1, 1, 0], ["TD", "Trưa", "Phục vụ", 1, 1, 2, 0], ["TNV", "Sáng", "Pha chế", 1, 2, 3, 0], ["TNV", "Sáng", "Phục vụ", 1, 2, 2, 0], ["TNV", "Trưa", "Pha chế", 1, 1, 1, 0], ["LDD", "Sáng", "Bảo vệ", 1, 1, 1, 0], ["LDD", "Sáng", "Pha chế", 2, 4, 5, 0], ["LDD", "Sáng", "Phục vụ", 2, 4, 4, 0], ["LDD", "Sáng", "Rửa ly", 1, 1, 1, 0], ["LDD", "Trưa", "Pha chế", 1, 1, 1, 0], ["LDD", "Tối", "Pha chế", 2, 3, 3, 0], ["LDD", "Tối", "Phục vụ", 2, 3, 3, 0]]),
    LichLam:  [['Ngay','MaCS','MaNV','MaCa','ViTri','GhiChu']],
    ChamCong: [['ID','ThoiGian','Ngay','MaNV','Ten','MaCS','Loai','MaCa','TreMin','SomMin','AnhURL','GhiChu','TangCaGio','LyDoTC','DuyetTC','ViTriLam']],
    CaiDat:   [['Key','Value'],['GRACE_TRE',10],['GRACE_SOM',10],['ADMIN_PIN','1234'],
               ['QL_PIN','5678'],['DRIVE_FOLDER_ID',''],['GHEP_CA_PHUT',90],['TANG_CA_PHUT',30],['DON_DEP_PHUT',30],['THANG_CAO_DIEM','10,11,12,1,2'],['ANH_GIU_NGAY',90],['NHOM_TOI_DA',6],['WEB_DOMAIN','https://caphemuoihue.com'],['WEB_TP','cham-cong-tp'],['WEB_DD','cham-cong-dd'],['WEB_TD','cham-cong-td'],['WEB_TNV','cham-cong-tnv'],['WEB_LDD','cham-cong-ldd'],['WEB_QL','quan-ly'],['WEB_NV','lich-cua-toi'],['COM_MOC_1',7.5],['COM_MOC_2',11.5],['TIEN_COM_SUAT',20]]
  };
  Object.keys(tabs).forEach(function(name){
    var sh = SS.getSheetByName(name) || SS.insertSheet(name);
    if (sh.getLastRow() === 0) {
      sh.getRange(1,1,tabs[name].length,tabs[name][0].length).setValues(tabs[name]);
      sh.setFrozenRows(1);
    }
  });
  // Múi giờ của file = Việt Nam, và các cột giờ ca để dạng văn bản (tránh Sheet tự đổi thành giờ rồi lệch múi giờ)
  SS.setSpreadsheetTimeZone(TZ); STZ=TZ;
  [['Ca',['GioBD','GioKT']],['CoSo',['GioMo','GioDong']]].forEach(function(t){
    var sh=SS.getSheetByName(t[0]), v=sh.getDataRange().getValues(), h=v[0];
    t[1].forEach(function(col){ var ci=h.indexOf(col); if(ci<0) return;
      var rg=sh.getRange(2,ci+1,Math.max(1,v.length-1),1), vals=rg.getValues().map(function(r){ return [r[0]===''?'':fmtCa(r[0])]; });
      rg.setNumberFormat('@'); rg.setValues(vals); });
  });
  // Cột mới cho NhanVien (dùng cho xếp lịch) – thêm nếu chưa có
  ensureCols('NhanVien',['LuongGio','SinhVien','CoDinh','NgayVao','NgayNghi']);
  // Khoá cài đặt mới – thêm nếu chưa có
  tabs.CaiDat.slice(1).forEach(function(kv){ if(cfg(kv[0])==='' ) setCfg(kv[0],kv[1]); });
  // Mã NV và SĐT luôn là chữ (không bị đổi thành số, phần trăm…): 101 → "101"
  ['NhanVien','ThoiQuen'].forEach(function(name){ var sh=SS.getSheetByName(name); if(!sh || sh.getLastRow()<2) return;
    var rg=sh.getRange(2,1,sh.getLastRow()-1,1), v=rg.getValues().map(function(r){ var x=r[0]; return [ (typeof x==='number') ? String(Math.round(x)) : String(x).replace(/[%,.]00$/,'').trim() ]; });
    sh.getRange('A:A').setNumberFormat('@'); rg.setValues(v); });
  SS.getSheetByName('NhanVien').getRange('I:I').setNumberFormat('@');
  if (!cfg('DRIVE_FOLDER_ID')) {
    var f = DriveApp.createFolder('Ảnh chấm công Ncafe');
    setCfg('DRIVE_FOLDER_ID', f.getId());
  }
  // Bảo trì tự động 3h sáng ngày 1 hàng tháng: lưu trữ dữ liệu cũ + xoá ảnh cũ
  var has = ScriptApp.getProjectTriggers().some(function(t){ return t.getHandlerFunction()==='baoTriHangThang'; });
  if (!has) ScriptApp.newTrigger('baoTriHangThang').timeBased().onMonthDay(1).atHour(3).create();
  setupScheduler();
}

function ensureCols(name, cols){
  var sh=SS.getSheetByName(name), lc=Math.max(1,sh.getLastColumn());
  var h=sh.getRange(1,1,1,lc).getValues()[0];
  cols.forEach(function(c){ if(h.indexOf(c)<0){ sh.getRange(1,h.length+1).setValue(c); h.push(c); } });
}

/* ---------- 2. Tiện ích ---------- */
function toObjs(h, vals){ return vals.filter(function(r){return r[0]!=='';}).map(function(r){var o={};h.forEach(function(k,i){o[k]=r[i];});return o;}); }
function rows(name){ var sh=SS.getSheetByName(name); if(!sh) return []; var v=sh.getDataRange().getValues(); var h=v.shift(); return toObjs(h,v); }
function recentRows(name, n){
  var sh=SS.getSheetByName(name), last=sh.getLastRow(), lc=sh.getLastColumn();
  if(last<2) return [];
  var h=sh.getRange(1,1,1,lc).getValues()[0], start=Math.max(2,last-(n||RECENT_ROWS)+1);
  return toObjs(h, sh.getRange(start,1,last-start+1,lc).getValues());
}
var _CFG=null;   // đọc tab CaiDat một lần cho mỗi lượt chạy
// (29/10) Google Sheet tự đổi chữ thành ngày / giờ khi ghi → đọc lại đúng chữ; ghi chữ luôn dạng chữ (như app Chấm công)
function cfgChuan_(v){ if(v instanceof Date && !isNaN(v)){ var y=+fmtTZ_(v,STZ,'yyyy'); if(y<1901) return fmtTZ_(v,STZ,'HH:mm'); var g=fmtTZ_(v,STZ,'HH:mm'); return g==='00:00'?fmtTZ_(v,STZ,'yyyy-MM-dd'):fmtTZ_(v,STZ,'dd/MM HH:mm'); } return (typeof v==='string')?v.trim():v; }
function cfg(k){ if(!_CFG){ _CFG={}; rows('CaiDat').forEach(function(x){ var key=String(x.Key||'').trim(), v=cfgChuan_(x.Value); if(key!=='' && _CFG[key]===undefined) _CFG[key]=v; }); } return _CFG[k]===undefined?'':_CFG[k]; }   // bỏ dấu cách / xuống dòng thừa khi dán
function setCfg(k,v){ var sh=SS.getSheetByName('CaiDat'); var d=sh.getDataRange().getValues(); if(_CFG) _CFG[k]=v; var gt=(typeof v==='string' && v!=='')?"'"+v:v;
  for(var i=1;i<d.length;i++){ if(d[i][0]===k){ sh.getRange(i+1,2).setValue(gt); return; } } sh.appendRow([k,gt]); }
function fmtDate(d){ return fmtTZ_(d,TZ,'yyyy-MM-dd'); }
function fmtTime(d){ return fmtTZ_(d,TZ,'HH:mm'); }
// Giá trị đọc từ ô Sheet (giờ ca, ngày lịch): Sheet trả về Date theo múi giờ của file, nên format lại bằng đúng múi giờ đó
function fmtCa(v){ return (v instanceof Date)?fmtTZ_(v,STZ,'HH:mm'):String(v).replace(/^(\d{1,2}):(\d{2}).*$/,function(m,h,mi){return ('0'+h).slice(-2)+':'+mi;}); }
function toMin(hhmm){ var p=fmtCa(hhmm).split(':'); return (+p[0])*60+(+p[1]||0); }
function dateKey(v){ return (v instanceof Date)?fmtTZ_(v,STZ,'yyyy-MM-dd'):String(v).slice(0,10); }
function nowMin(d){ return toMin(fmtTime(d)); }
function up(s){ return String(s||'').trim().toUpperCase(); }
function storeAuth(maCS,key){ return rows('CoSo').filter(function(c){return c.MaCS===maCS && String(c.Key)===String(key);})[0]; }
function caForStore(c, maCS){ var s=String(c.CoSo||'ALL'); return s==='ALL'||s.split(',').map(function(x){return x.trim();}).indexOf(maCS)>-1; }

/* ---------- 3. Web app ---------- */
// Mở file HTML, chấp nhận tên viết hoa/thường khác nhau (CheckIn / Checkin / checkin…) để khỏi lỗi khi đặt tên file lệch
function moTrang(ten){
  var thu=[ten, ten.charAt(0)+ten.slice(1).toLowerCase(), ten.toLowerCase(), ten.toUpperCase()], loi=null;
  for(var i=0;i<thu.length;i++){ try{ return HtmlService.createTemplateFromFile(thu[i]); }catch(x){ loi=x; } }
  throw new Error('Không tìm thấy file '+ten+'.html trong Apps Script. Kiểm tra đã tạo file '+ten+' (Tệp → dấu + → HTML) và dán đúng nội dung.');
}
function doGet(e){
  // App Xếp lịch giờ chỉ dành cho quản lý: link không kèm ?page mở thẳng trang quản lý (link điện thoại quán cũ có ?cs= vẫn báo chuyển)
  var p=(e.parameter.page || (e.parameter.cs ? 'checkin' : (cfg('CHAM_CONG_URL') ? 'admin' : 'checkin'))).toLowerCase(), t;
  // Chấm công đã tách sang app riêng: trang chấm công cũ chỉ báo chuyển
  if(cfg('CHAM_CONG_URL') && ['checkin','qr','khaosat','dangky'].indexOf(p)>-1)
    return HtmlService.createHtmlOutput(p==='khaosat'||p==='dangky'?'<div style="font-family:sans-serif;padding:24px;max-width:420px;margin:auto"><h2>'+(p==='dangky'?'Lịch của tôi':'Khảo sát')+' đã chuyển sang app Chấm công</h2><p><a href="'+cfg('CHAM_CONG_URL')+'?page='+(p==='dangky'?'lich':'khaosat')+'">Mở trang</a></p></div>':'<div style="font-family:sans-serif;padding:24px;max-width:420px;margin:auto"><h2>Chấm công đã chuyển sang app mới</h2><p>Quét mã QR dán ở quầy để chấm công.</p><p><a href="'+cfg('CHAM_CONG_URL')+'">Mở trang quản lý chấm công</a></p></div>').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  if(p==='admin'||p==='ql'){ t=moTrang('Admin'); t.role=p; }
  else if(p==='dangky'){ t=moTrang('DangKy'); }
  else if(p==='qr'){ t=moTrang('ChamCongQR'); t.cs=String(e.parameter.cs||''); t.tk=String(e.parameter.t||''); }   // nhân viên quét mã QR dán ở quầy
  else if(p==='khaosat'){ t=moTrang('KhaoSat'); }
  else {
    t=moTrang('CheckIn');
    var cs=storeAuth(e.parameter.cs, e.parameter.key);
    t.store=cs?JSON.stringify({MaCS:cs.MaCS,TenCS:cs.TenCS,Key:cs.Key}):'null';
  }
  // ALLOWALL: cho phép nhúng vào trang caphemuoihue.com (WordPress) bằng iframe
  return t.evaluate().setTitle('Chấm công Ncafe').addMetaTag('viewport','width=device-width, initial-scale=1').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/* ---------- 4. Tra cứu nhân viên ---------- */
function staffState(nv, maCS, recs, lichs, today, cas, now){
  var mine=recs.filter(function(r){return up(r.MaNV)===up(nv.MaNV) && dateKey(r.Ngay)===today;});
  var last=mine[mine.length-1];
  // ca gãy có 2 dòng lịch trong ngày: lấy dòng có giờ bắt đầu gần giờ hiện tại nhất
  var ls=lichs.filter(function(l){return dateKey(l.Ngay)===today && up(l.MaNV)===up(nv.MaNV);}), lich=null, bd=1e9;
  ls.forEach(function(l){ var c=(cas||[]).filter(function(x){return x.MaCa===l.MaCa;})[0]; var d=c&&now?Math.abs(nowMin(now)-toMin(c.GioBD)):0; if(!lich||d<bd){lich=l;bd=d;} });
  return {last:last, next:(last && last.Loai==='VAO')?'RA':'VAO', lich:lich,
          vao:mine.filter(function(r){return r.Loai==='VAO';}).pop()};
}
function getStaffInfo(maNV, maCS){
  var code=up(maNV);
  var nv=rows('NhanVien').filter(function(n){return up(n.MaNV)===code;})[0];
  if(!nv) return {ok:false,msg:'Không tìm thấy mã '+code};
  if(['Đã nghỉ','Nghỉ việc'].indexOf(String(nv.TrangThai||''))>-1) return {ok:false,msg:nv.Ten+' không còn trong danh sách đang làm'};
  var now=new Date(), today=fmtDate(now), cas=rows('Ca'), st=staffState(nv, maCS, recentRows('ChamCong'), recentRows('LichLam',1500), today, cas, now);
  var ca=st.lich?cas.filter(function(c){return c.MaCa===st.lich.MaCa;})[0]:null;
  return {ok:true, MaNV:String(nv.MaNV), Ten:nv.Ten, ViTri:nv.ViTri, next:st.next,
    lastTime:st.last?fmtTime(new Date(st.last.ThoiGian)):null, lastStore:st.last?st.last.MaCS:null,
    lich:st.lich?{MaCS:st.lich.MaCS,MaCa:st.lich.MaCa,ViTri:st.lich.ViTri||'',Ten:ca?ca.TenCa:'',GioBD:ca?fmtCa(ca.GioBD):'',GioKT:ca?fmtCa(ca.GioKT):''}:null,
    khacCoSo: !!(st.lich && st.lich.MaCS!==maCS)};
}

/* ---------- 5. Chấm công (1 người hoặc cả nhóm chung 1 ảnh) ---------- */
function checkInGroup(p){
  var cs=storeAuth(p.maCS,p.key);
  if(!cs) return {ok:false,msg:'Thiết bị chưa được cấp quyền cho cơ sở này'};
  var codes=[]; (p.codes||[]).forEach(function(c){ c=up(c); if(c && codes.indexOf(c)<0) codes.push(c); });
  if(!codes.length) return {ok:false,msg:'Chưa nhập mã nhân viên'};
  var maxN=+cfg('NHOM_TOI_DA')||6;
  if(codes.length>maxN) return {ok:false,msg:'Tối đa '+maxN+' người một lần chấm'};
  if(!p.photo && !p.photoUrl) return {ok:false,msg:'Chưa có ảnh'};
  var nvAll=rows('NhanVien'), list=[];
  for(var i=0;i<codes.length;i++){
    var nv=nvAll.filter(function(n){return up(n.MaNV)===codes[i];})[0];
    if(!nv) return {ok:false,msg:'Không tìm thấy mã '+codes[i]};
    if(['Đã nghỉ','Nghỉ việc'].indexOf(String(nv.TrangThai||''))>-1) return {ok:false,msg:nv.Ten+' không còn trong danh sách đang làm'};
    list.push(nv);
  }
  var now=new Date();
  // Lưu ảnh TRƯỚC khi khoá, để nhiều quán chấm cùng lúc không phải chờ nhau
  var url=p.photoUrl || savePhoto(p.photo, codes.join('-'), now, p.maCS);
  var lock=LockService.getScriptLock(); lock.waitLock(20000);
  try{
    var recs=recentRows('ChamCong'), lichs=recentRows('LichLam',1500), cas=rows('Ca'), today=fmtDate(now);
    ensureCols('ChamCong',['ViTriLam']);
    var tc=p.tangCa||{}, ly=p.lyDo||{}, vt=p.viTri||{}, out=[], need=[];
    var nhom=list.length>1?('Chấm nhóm '+list.length+' người'):'';
    list.forEach(function(nv){
      var r=evalOne(nv, cs, now, today, recs, lichs, cas, tc[String(nv.MaNV)], ly[String(nv.MaNV)], url, nhom, vt[String(nv.MaNV)]);
      if(r.needOT) need.push(r.needOT); else out.push(r);
    });
    if(need.length) return {ok:false, needOT:need, photoUrl:url};
    var sh=SS.getSheetByName('ChamCong'), r0=sh.getLastRow()+1;
    sh.getRange(r0,1,out.length,CC_HEADER.length).setValues(out.map(function(x){return x.row;}));
    if(p.extra){   // chấm bằng QR trên điện thoại nhân viên: lưu vị trí, khoảng cách, thiết bị, cảnh báo
      var ex=['CanhBao','ViDo','KinhDo','KhoangCach','ThietBi','Nguon']; ensureCols('ChamCong',ex);
      var hd=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
      for(var k=0;k<out.length;k++) ex.forEach(function(col){ var ci=hd.indexOf(col); if(ci>-1 && p.extra[col]!==undefined) sh.getRange(r0+k,ci+1).setValue(p.extra[col]); });
    }
    return {ok:true, time:fmtTime(now), results:out.map(function(x){return x.res;})};
  } finally { lock.releaseLock(); }
}

function evalOne(nv, cs, now, today, recs, lichs, cas, tcIn, lyIn, url, nhom, vtIn){
  var st=staffState(nv, cs.MaCS, recs, lichs, today, cas, now), loai=st.next, maCa='', tre=0, som=0, ghi=[], tcGio='', tcLyDo='', tcDuyet='', caObj=null;
  if(nhom) ghi.push(nhom);
  if(loai==='VAO'){
    if(st.lich){ maCa=st.lich.MaCa; if(st.lich.MaCS!==cs.MaCS) ghi.push('Lịch ở '+st.lich.MaCS); }
    else {
      var best=null, lim=+cfg('GHEP_CA_PHUT')||90;
      cas.filter(function(c){return caForStore(c,cs.MaCS);}).forEach(function(c){
        var d=Math.abs(nowMin(now)-toMin(c.GioBD)); if(d<=lim && (!best||d<best.d)) best={d:d,c:c}; });
      if(best){ maCa=best.c.MaCa; ghi.push('Không có lịch, ghép '+best.c.TenCa); } else ghi.push('Không có lịch');
    }
    caObj=cas.filter(function(c){return c.MaCa===maCa;})[0];
    if(caObj){ tre=nowMin(now)-toMin(caObj.GioBD); if(tre<=(+cfg('GRACE_TRE')||0)) tre=0; }
  } else {
    maCa=st.vao?st.vao.MaCa:'';
    caObj=cas.filter(function(c){return c.MaCa===maCa;})[0];
    if(caObj){
      som=toMin(caObj.GioKT)-nowMin(now); if(som<=(+cfg('GRACE_SOM')||0)) som=0;
      var gioKT=toMin(caObj.GioKT); if(gioKT===toMin(cs.GioDong)) gioKT+=(+cfg('DON_DEP_PHUT')||0);
      var over=nowMin(now)-gioKT;
      if(over>=(+cfg('TANG_CA_PHUT')||30)){
        if(tcIn===undefined) return {needOT:{MaNV:String(nv.MaNV),Ten:nv.Ten,over:over,gioKT:fmtCa(caObj.GioKT)}};
        tcGio=+String(tcIn).replace(',','.')||0; tcLyDo=lyIn||'';
        if(tcGio>0){ tcDuyet='Chờ duyệt'; ghi.push('Tăng ca '+tcGio+'h chờ duyệt'); }
        else { tcDuyet='Không'; ghi.push('Về trễ '+over+' phút, không tăng ca'); }
      }
    }
    if(st.vao && st.vao.MaCS!==cs.MaCS) ghi.push('Vào ở '+st.vao.MaCS);
  }
  var id=fmtTZ_(now,TZ,'yyMMddHHmmss')+'-'+nv.MaNV;
  // vị trí thực làm ca này (nhân viên chọn khi vào ca) – app dùng để học ai pha chế, ai phục vụ
  var VT_OK=['Pha chế','Phục vụ','Thu ngân','Rửa ly','Bảo vệ','Quản lý'];
  var viTriLam = (loai==='VAO') ? (VT_OK.indexOf(vtIn)>-1 ? vtIn : ((st.lich && st.lich.ViTri) || nv.ViTri || '')) : ((st.vao && st.vao.ViTriLam) || '');
  return {row:[id, now, today, String(nv.MaNV), nv.Ten, cs.MaCS, loai, maCa, tre>0?tre:0, som>0?som:0, url, ghi.join('; '), tcGio, tcLyDo, tcDuyet, viTriLam],
          res:{MaNV:String(nv.MaNV), Ten:nv.Ten, loai:loai, ca:caObj?caObj.TenCa:'', tre:tre>0?tre:0, som:som>0?som:0, tc:tcGio, ghi:ghi.filter(function(g){return g!==nhom;}).join('; ')}};
}

function savePhoto(b64, label, now, maCS){
  var root=DriveApp.getFolderById(cfg('DRIVE_FOLDER_ID'));
  var dn=fmtDate(now), it=root.getFoldersByName(dn);
  var f=it.hasNext()?it.next():root.createFolder(dn);
  var data=b64.indexOf(',')>-1?b64.split(',')[1]:b64;
  var blob=Utilities.newBlob(Utilities.base64Decode(data),'image/jpeg', label+'_'+maCS+'_'+fmtTZ_(now,TZ,'HHmmss')+'.jpg');
  var file=f.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return 'https://drive.google.com/uc?id='+file.getId();
}

/* ---------- 6. Phân quyền ---------- */
// ADMIN_PIN: toàn quyền, có tính lương. QL_PIN: xếp lịch, xem giờ công, duyệt tăng ca, bổ sung quên chấm.
function authRole(pin){ pin=String(pin||''); if(pin && pin===String(cfg('ADMIN_PIN'))) return 'admin'; if(pin && pin===String(cfg('QL_PIN'))) return 'ql'; return null; }
function dangNhap(p){ var r=authRole(p.pin); if(!r) return {ok:false,msg:'Sai mã truy cập'};
  var ccLink=String(cfg('LINK_CHAM_CONG')||cfg('CHAM_CONG_URL')||'');   // nút "Sang Chấm công"; muốn mở qua trang web thì thêm dòng LINK_CHAM_CONG trong CaiDat
  return {ok:true, chamCongUrl:ccLink, role:r, tachCC:!!cfg('CHAM_CONG_SHEET_ID'), ver:{code:VER_CODE, sched:(typeof VER_SCHED!=='undefined'?VER_SCHED:'BẢN CŨ')}, stores:rows('CoSo').map(function(c){return {MaCS:c.MaCS,TenCS:c.TenCS};}), ca:rows('Ca').map(function(c){return {MaCa:c.MaCa,TenCa:c.TenCa,GioBD:fmtCa(c.GioBD),GioKT:fmtCa(c.GioKT),CoSo:String(c.CoSo||'ALL')};})}; }

/* ---------- 7. Báo cáo giờ công ---------- */
// Lấy chấm công trong khoảng ngày, gồm cả các tab lưu trữ LT_yyyy-MM
function recordsBetween(from, to, cs){
  var out=[];
  SS.getSheets().forEach(function(s){
    var n=s.getName();
    if(n!=='ChamCong' && !/^LT_\d{4}-\d{2}$/.test(n)) return;
    if(n!=='ChamCong'){ var m=n.slice(3); if(m<from.slice(0,7) || m>to.slice(0,7)) return; }
    out=out.concat(rows(n).filter(function(r){var d=dateKey(r.Ngay); return d>=from && d<=to && (!cs||r.MaCS===cs);}));
  });
  out.sort(function(a,b){ return new Date(a.ThoiGian)-new Date(b.ThoiGian); });
  return out;
}

function getReport(p){
  if(!authRole(p.pin)) return {ok:false,msg:'Sai mã truy cập'};
  var R=buildReport(recordsBetween(p.from, p.to, p.maCS||''));
  return {ok:true, lines:R.lines, summary:R.summary, stores:rows('CoSo').map(function(c){return {MaCS:c.MaCS,TenCS:c.TenCS};})};
}
function buildReport(recs){
  var byKey={}, order=[];
  recs.forEach(function(r){
    var k=dateKey(r.Ngay)+'|'+r.MaNV;
    if(!byKey[k]){ byKey[k]={Ngay:dateKey(r.Ngay),MaNV:String(r.MaNV),Ten:r.Ten,pairs:[]}; order.push(k); }
    var g=byKey[k], last=g.pairs[g.pairs.length-1];
    if(r.Loai==='VAO'){ g.pairs.push({cs:r.MaCS,vao:new Date(r.ThoiGian),ra:null,ca:r.MaCa,tre:+r.TreMin||0,som:0,ghi:r.GhiChu,anhV:r.AnhURL,anhR:''}); }
    else if(last && !last.ra){ last.ra=new Date(r.ThoiGian); last.som=+r.SomMin||0; last.anhR=r.AnhURL; last.idR=r.ID; last.tc=+r.TangCaGio||0; last.tcLyDo=r.LyDoTC||''; last.tcDuyet=r.DuyetTC||''; if(r.GhiChu) last.ghi=(last.ghi?last.ghi+'; ':'')+r.GhiChu; }
    else { g.pairs.push({cs:r.MaCS,vao:null,ra:new Date(r.ThoiGian),ca:r.MaCa,tre:0,som:+r.SomMin||0,ghi:'Thiếu chấm vào',anhV:'',anhR:r.AnhURL}); }
  });
  var lines=[], tong={}, cas=rows('Ca'), stores=rows('CoSo'), tcPhut=+cfg('TANG_CA_PHUT')||30, donDep=+cfg('DON_DEP_PHUT')||0;
  order.forEach(function(k){ var g=byKey[k]; g.pairs.forEach(function(x){
    var gio=0;
    if(x.vao&&x.ra){
      var raMin=nowMin(x.ra), caX=cas.filter(function(c){return c.MaCa===x.ca;})[0];
      var ktX=caX?toMin(caX.GioKT):0, csX=stores.filter(function(s){return s.MaCS===x.cs;})[0];
      if(caX && csX && ktX===toMin(csX.GioDong)) ktX+=donDep;
      if(caX && raMin-ktX>=tcPhut) gio=(ktX-nowMin(x.vao))/60 + (x.tcDuyet==='Đã duyệt'?x.tc:0);
      else gio=(x.ra-x.vao)/36e5;
      gio=Math.round(gio*10)/10;
    }
    var ghi=x.ghi||''; if(x.vao&&!x.ra) ghi=(ghi?ghi+'; ':'')+'Quên chấm ra';
    lines.push({Ngay:g.Ngay,MaNV:g.MaNV,Ten:g.Ten,CS:x.cs,Vao:x.vao?fmtTime(x.vao):'',Ra:x.ra?fmtTime(x.ra):'',Gio:gio,Ca:x.ca,Tre:x.tre,Som:x.som,Ghi:ghi,AnhV:x.anhV,AnhR:x.anhR,TC:x.tc||0,TCLyDo:x.tcLyDo||'',TCDuyet:x.tcDuyet||'',IdR:x.idR||''});
    var t=tong[g.MaNV]||(tong[g.MaNV]={Ten:g.Ten,Gio:0,Ngay:{},Tre:0,Som:0,Loi:0,CS:{}});
    t.Gio+=gio; t.Ngay[g.Ngay]=1; if(x.tre>0)t.Tre++; if(x.som>0)t.Som++; if(!x.vao||!x.ra)t.Loi++; t.CS[x.cs]=(t.CS[x.cs]||0)+gio;
  });});
  var summary=Object.keys(tong).map(function(m){var t=tong[m]; return {MaNV:m,Ten:t.Ten,Gio:Math.round(t.Gio*10)/10,SoNgay:Object.keys(t.Ngay).length,Tre:t.Tre,Som:t.Som,Loi:t.Loi,
    CS:Object.keys(t.CS).map(function(c){return c+' '+Math.round(t.CS[c]*10)/10+'h';}).join(', ')};});
  summary.sort(function(a,b){return b.Gio-a.Gio;});
  return {lines:lines, summary:summary};
}

/* ---------- 8. Tính lương – CHỈ ADMIN ---------- */
// Theo bảng lương hiện tại: Tổng nhận = (Giờ làm + Giờ nghỉ có lương) × Lương giờ + Tiền cơm + Phụ cấp + Thưởng; Còn lại = Tổng nhận − Tạm ứng − Trừ lỗi.
// Tiền cơm: ngày làm từ COM_MOC_1 giờ (7,5) được 1 suất, từ COM_MOC_2 giờ (11,5) được 2 suất, mỗi suất TIEN_COM_SUAT (20 nghìn). Đơn vị: nghìn đồng.
function tinhLuong(p){
  if(authRole(p.pin)!=='admin') return {ok:false,msg:'Chỉ admin được tính lương'};
  var th=String(p.thang||''); if(!/^\d{4}-\d{2}$/.test(th)) return {ok:false,msg:'Chọn tháng'};
  var y=+th.slice(0,4), m=+th.slice(5,7), last=new Date(y,m,0).getDate();
  var from=th+'-01', to=th+'-'+('0'+last).slice(-2);
  var R=buildReport(recordsBetween(from,to,''));
  var m1=+cfg('COM_MOC_1')||7.5, m2=+cfg('COM_MOC_2')||11.5, suat=+cfg('TIEN_COM_SUAT')||20;
  var perDay={}, gio={}, canhBao=[];
  R.lines.forEach(function(l){ var k=l.MaNV+'|'+l.Ngay; perDay[k]=(perDay[k]||0)+l.Gio; gio[l.MaNV]=(gio[l.MaNV]||0)+l.Gio;
    if(l.TCDuyet==='Chờ duyệt') canhBao.push(l.Ngay+' '+l.Ten+': tăng ca '+l.TC+'h chưa duyệt');
    if(/Quên chấm ra|Thiếu chấm vào/.test(l.Ghi||'')) canhBao.push(l.Ngay+' '+l.Ten+': '+(l.Ghi.match(/Quên chấm ra|Thiếu chấm vào/)[0])); });
  var com={}; Object.keys(perDay).forEach(function(k){ var ma=k.split('|')[0], h=perDay[k]; com[ma]=(com[ma]||0)+(h>=m2?2:(h>=m1?1:0)); });
  var name='Luong_'+th, sh=SS.getSheetByName(name), old={};
  var H=['MaNV','Ten','Loai','GioLam','LuongGio','SuatCom','TienCom','GioNghiCoLuong','PhuCap','Thuong','TongNhan','TamUng','TruLoi','ConLai','GhiChu'];
  if(sh){ var v=sh.getDataRange().getValues(), hh=v.shift(); v.forEach(function(r){ if(r[0]!==''&&r[0]!=='TỔNG') old[String(r[0])]={G:r[7],P:r[8],T:r[9],U:r[11],L:r[12],N:r[14]}; }); sh.clear(); }
  else sh=SS.insertSheet(name);
  var nvs=rows('NhanVien').filter(function(n){ return gio[String(n.MaNV)] || n.TrangThai==='Đang làm' || n.TrangThai==='Thử việc'; });
  var out=[H];
  nvs.forEach(function(n,i){ var ma=String(n.MaNV), r=i+2, o=old[ma]||{};
    out.push([ma, n.Ten, n.Loai, Math.round((gio[ma]||0)*10)/10, +n.LuongGio||'', com[ma]||0, '=F'+r+'*'+suat, o.G||'', o.P||'', o.T||'',
      '=(D'+r+'+H'+r+')*E'+r+'+G'+r+'+I'+r+'+J'+r, o.U||'', o.L||'', '=K'+r+'-L'+r+'-M'+r, o.N||(!(+n.LuongGio)?'Chưa có lương giờ':'')]); });
  var n2=out.length;
  out.push(['TỔNG','','','=SUM(D2:D'+n2+')','','=SUM(F2:F'+n2+')','=SUM(G2:G'+n2+')','=SUM(H2:H'+n2+')','=SUM(I2:I'+n2+')','=SUM(J2:J'+n2+')','=SUM(K2:K'+n2+')','=SUM(L2:L'+n2+')','=SUM(M2:M'+n2+')','=SUM(N2:N'+n2+')','']);
  sh.getRange(1,1,out.length,H.length).setValues(out).setFontFamily('Arial');
  sh.getRange(1,1,1,H.length).setFontWeight('bold').setBackground('#F3ECE3');
  sh.getRange(out.length,1,1,H.length).setFontWeight('bold');
  [8,9,10,12,13].forEach(function(col){ sh.getRange(2,col,out.length-2,1).setBackground('#FFF6CC'); });
  sh.getRange(out.length+2,1).setValue('Đơn vị nghìn đồng. Ô vàng (giờ nghỉ có lương, phụ cấp, thưởng, tạm ứng, trừ lỗi) nhập tay; bấm Tính lương lại vẫn giữ số đã nhập. Giờ làm lấy từ chấm công, tăng ca chỉ cộng khi đã duyệt.');
  sh.setFrozenRows(1); sh.setFrozenColumns(2);
  return {ok:true, tab:name, so:nvs.length, canhBao:canhBao.slice(0,50), soCanhBao:canhBao.length};
}

/* Bổ sung tay (quên chấm) */
function addManual(p){
  if(!authRole(p.pin)) return {ok:false,msg:'Sai mã'};
  var nv=rows('NhanVien').filter(function(n){return up(n.MaNV)===up(p.maNV);})[0];
  if(!nv) return {ok:false,msg:'Không tìm thấy mã'};
  var d=new Date(p.ngay+'T'+p.gio+':00+07:00');
  SS.getSheetByName('ChamCong').appendRow(['M'+fmtTZ_(new Date(),TZ,'yyMMddHHmmss'), d, fmtDate(d), String(nv.MaNV), nv.Ten, p.maCS, p.loai, '', 0, 0, '', 'Bổ sung tay: '+(p.lyDo||''), '', '', '']);
  return {ok:true};
}

/* Duyệt tăng ca: action = 'Đã duyệt' | 'Từ chối' */
function approveOT(p){
  if(!authRole(p.pin)) return {ok:false,msg:'Sai mã'};
  var sh=SS.getSheetByName('ChamCong'), d=sh.getDataRange().getValues(), h=d[0], ci=h.indexOf('DuyetTC'), gi=h.indexOf('TangCaGio');
  for(var i=d.length-1;i>=1;i--){ if(d[i][0]===p.id){
    sh.getRange(i+1,ci+1).setValue(p.action);
    if(p.action==='Đã duyệt' && p.gio!==undefined && p.gio!=='') sh.getRange(i+1,gi+1).setValue(+String(p.gio).replace(',','.'));
    return {ok:true}; } }
  return {ok:false,msg:'Không tìm thấy bản ghi'};
}

/* ---------- 9. Bảo trì hàng tháng (tự chạy ngày 1, 3h sáng) ---------- */
function baoTriHangThang(){
  try{ hocTuDongThang(); }catch(e){}   // (28/10) học định mức + vị trí từ chấm công thật, chờ admin duyệt
  var lock=LockService.getScriptLock(); lock.waitLock(30000);
  try{
    // a) Chuyển chấm công cũ hơn tháng trước sang tab LT_yyyy-MM
    var now=new Date(), y=+fmtTZ_(now,TZ,'yyyy'), m=+fmtTZ_(now,TZ,'MM');
    var pm=m-1, py=y; if(pm<1){pm=12;py--;}
    var cutoff=py+'-'+('0'+pm).slice(-2)+'-01';
    var sh=SS.getSheetByName('ChamCong'), vals=sh.getDataRange().getValues(), h=vals.shift();
    var keep=[], groups={}, di=h.indexOf('Ngay');
    vals.forEach(function(r){ var d=dateKey(r[di]); if(r[0]!=='' && d<cutoff){ var k='LT_'+d.slice(0,7); (groups[k]=groups[k]||[]).push(r); } else if(r[0]!=='') keep.push(r); });
    Object.keys(groups).forEach(function(k){
      var t=SS.getSheetByName(k) || SS.insertSheet(k);
      if(t.getLastRow()===0){ t.getRange(1,1,1,h.length).setValues([h]); t.setFrozenRows(1); }
      t.getRange(t.getLastRow()+1,1,groups[k].length,h.length).setValues(groups[k]);
    });
    if(Object.keys(groups).length){
      if(sh.getLastRow()>1) sh.getRange(2,1,sh.getLastRow()-1,h.length).clearContent();
      if(keep.length) sh.getRange(2,1,keep.length,h.length).setValues(keep);
    }
    // b) Xoá thư mục ảnh cũ hơn ANH_GIU_NGAY ngày (mặc định 90)
    var giu=+cfg('ANH_GIU_NGAY')||90, lim=new Date(now.getTime()-giu*864e5), limKey=fmtDate(lim);
    var it=DriveApp.getFolderById(cfg('DRIVE_FOLDER_ID')).getFolders();
    while(it.hasNext()){ var f=it.next(), n=f.getName(); if(/^\d{4}-\d{2}-\d{2}$/.test(n) && n<limKey) f.setTrashed(true); }
  } finally { lock.releaseLock(); }
}

/* ---------- Link truy cập: tất cả link và mã nhúng vào caphemuoihue.com ở một chỗ ---------- */
// Admin thấy đủ (kể cả link điện thoại từng quán, có key); quản lý thấy link quản lý + nhân viên.
function linkTruyCap(p){
  var role=authRole(p.pin); if(!role) return {ok:false,msg:'Sai mã'};
  try{ themCaiDatMoi(); }catch(e){}
  var exec=ScriptApp.getService().getUrl(), web=String(cfg('WEB_DOMAIN')||'https://caphemuoihue.com').replace(/\/$/,'');
  // đường dẫn trang trên web: sửa ở tab CaiDat (WEB_TP, WEB_DD, …, WEB_QL, WEB_NV) cho khớp đường dẫn đã tạo trong WordPress
  var slug={}; ['TP','DD','TD','TNV','LDD'].forEach(function(k){ slug[k]=String(cfg('WEB_'+k)||('cham-cong-'+k.toLowerCase())).replace(/^\/+|\/+$/g,''); });
  var slQL=String(cfg('WEB_QL')||'quan-ly').replace(/^\/+|\/+$/g,''), slNV=String(cfg('WEB_NV')||'lich-cua-toi').replace(/^\/+|\/+$/g,'');
  var out=[];
  if(role==='admin') rows('CoSo').forEach(function(c){ out.push({Nhom:'Điện thoại quán',Ten:'Chấm công '+c.TenCS,Link:exec+'?cs='+c.MaCS+'&key='+c.Key,Trang:web+'/'+(slug[c.MaCS]||('cham-cong-'+String(c.MaCS).toLowerCase())),Ghi:'Mở trên điện thoại của quán, thêm vào màn hình chính. Không đưa lên menu web.'}); });
  out.push({Nhom:'Quản lý',Ten:'Trang quản lý (xếp lịch, giờ công, nhân sự)',Link:exec+'?page=ql',Trang:web+'/'+slQL,Ghi:'Đăng nhập bằng mã quản lý; mã admin thấy thêm Tính lương.'});
  out.push({Nhom:'Nhân viên',Ten:'Lịch của tôi / đăng ký giờ bận',Link:exec+'?page=dangky',Trang:web+'/'+slNV,Ghi:'Gửi vào nhóm Zalo nhân viên.'});
  try{ out.push({Nhom:'Quản lý',Ten:'File lịch tuần (Google Sheet)',Link:lichFile().getUrl(),Trang:'',Ghi:'Chia sẻ quyền chỉnh sửa cho quản lý.'}); }catch(e){}
  return {ok:true, role:role, exec:exec, web:web, list:out};
}

// gọi 1 lần để thêm các dòng cài đặt mới (không ghi đè giá trị đã có)
function themCaiDatMoi(){ [['THEO_LICH_CU','Không'],['WEB_TP','cham-cong-tp'],['WEB_DD','cham-cong-dd'],['WEB_TD','cham-cong-td'],['WEB_TNV','cham-cong-tnv'],['WEB_LDD','cham-cong-ldd'],['WEB_QL','quan-ly'],['WEB_NV','lich-cua-toi']].forEach(function(kv){ if(cfg(kv[0])==='') setCfg(kv[0],kv[1]); }); }


/* ================= CHẤM CÔNG BẰNG MÃ QR (điện thoại nhân viên) =================
   Mã QR in dán quầy, đổi mỗi tháng (mã tháng trước còn dùng được 5 ngày đầu tháng mới).
   Khi chấm: kiểm mã QR, định vị trong bán kính quán (mặc định 100m), ảnh chụp tại chỗ, điện thoại quen.
   Lượt nào lệch → ghi cảnh báo để quản lý xem; không chặn cứng (định vị trong nhà hay lệch). */
function qrSecret(){ var s=cfg('QR_SECRET'); if(!s){ s=Utilities.getUuid(); setCfg('QR_SECRET',s); } return String(s); }
function qrToken(maCS, thang){ var raw=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, qrSecret()+'|'+maCS+'|'+thang);
  return Utilities.base64EncodeWebSafe(raw).replace(/[^A-Za-z0-9]/g,'').slice(0,10); }
function qrThang(d){ return fmtTZ_(d||new Date(), TZ, 'yyyy-MM'); }
function qrHopLe(maCS, t){
  var now=new Date(), th=qrThang(now); if(t===qrToken(maCS,th)) return true;
  var ngay=+fmtDate(now).slice(8,10); if(ngay<=5){ var tr=new Date(now.getTime()-6*864e5); return t===qrToken(maCS,qrThang(tr)); }
  return false;
}
function khoangCach(lat1,lng1,lat2,lng2){ var R=6371000, r=Math.PI/180, dLat=(lat2-lat1)*r, dLng=(lng2-lng1)*r;
  var a=Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(lat1*r)*Math.cos(lat2*r)*Math.sin(dLng/2)*Math.sin(dLng/2); return Math.round(2*R*Math.asin(Math.sqrt(a))); }
function qrStore(cs, t){ var s=rows('CoSo').filter(function(x){ return x.MaCS===cs; })[0]; if(!s) return null; return qrHopLe(cs,t)?s:null; }
function qrInfo(p){
  var s=qrStore(p.cs,p.t); if(!s) return {ok:false,msg:'Mã QR không đúng hoặc đã hết hạn. Báo quản lý in mã mới.'};
  return {ok:true, store:{MaCS:s.MaCS,TenCS:s.TenCS}};
}
function qrNhanVien(p){
  var s=qrStore(p.cs,p.t); if(!s) return {ok:false,msg:'Mã QR không đúng hoặc đã hết hạn.'};
  var info=getStaffInfo(p.maNV, s.MaCS); if(!info || !info.ok) return info||{ok:false,msg:'Không tìm thấy mã nhân viên'};
  var nv=rows('NhanVien').filter(function(n){ return up(n.MaNV)===up(p.maNV); })[0];
  info.ViTri=nv?nv.ViTri:''; info.ViTriKiem=nv?String(nv.ViTriKiem||''):'';
  info.mayQuen=thietBiQuen(up(p.maNV), String(p.deviceId||''));
  return info;
}
function thietBiQuen(ma, dev){ if(!dev) return false; var sh=SS.getSheetByName('ThietBi'); if(!sh) return false;
  return rows('ThietBi').some(function(r){ return up(r.MaNV)===ma && String(r.ThietBi)===dev; }); }
function ghiThietBi(ma, dev){ if(!dev) return; var sh=SS.getSheetByName('ThietBi'); if(!sh){ sh=SS.insertSheet('ThietBi'); sh.getRange(1,1,1,3).setValues([['MaNV','ThietBi','LanDau']]); sh.getRange('A:A').setNumberFormat('@'); }
  if(!thietBiQuen(ma,dev)) sh.appendRow([ma,dev,new Date()]); }
function qrChamCong(p){
  var s=qrStore(p.cs,p.t); if(!s) return {ok:false,msg:'Mã QR không đúng hoặc đã hết hạn. Báo quản lý in mã mới.'};
  var ma=up(p.maNV), dev=String(p.deviceId||''), canh=[];
  var kc='', lat=+p.lat, lng=+p.lng;
  if(isFinite(lat) && isFinite(lng) && p.lat!=='' && p.lat!==null && p.lat!==undefined){
    if(s.ViDo!=='' && s.ViDo!==undefined && s.KinhDo!=='' && s.KinhDo!==undefined){ kc=khoangCach(lat,lng,+s.ViDo,+s.KinhDo); var bk=+s.BanKinh||+cfg('QR_BAN_KINH')||100;
      if(kc>bk+(+p.acc>0?Math.min(+p.acc,150):0)) canh.push('Cách quán '+kc+'m'); }
    else canh.push('Quán chưa lưu vị trí');
  } else canh.push('Không lấy được định vị');
  if(!thietBiQuen(ma,dev)) canh.push('Điện thoại mới');
  var r=checkInGroup({maCS:s.MaCS, key:s.Key, codes:[ma], photo:p.photo, photoUrl:p.photoUrl,
    viTri:p.viTri?(function(){ var o={}; o[ma]=p.viTri; return o; })():{}, tangCa:p.tangCa!==undefined?(function(){ var o={}; o[ma]=p.tangCa; return o; })():{}, lyDo:p.lyDo?(function(){ var o={}; o[ma]=p.lyDo; return o; })():{},
    extra:{CanhBao:canh.join('; '), ViDo:isFinite(lat)?lat:'', KinhDo:isFinite(lng)?lng:'', KhoangCach:kc, ThietBi:dev, Nguon:'QR'}});
  if(r.ok) ghiThietBi(ma,dev);
  r.canhBao=canh; return r;
}
// Quản lý: lưu vị trí quán (đứng tại quán bấm "Lấy vị trí"), in mã QR, xem lượt đáng ngờ
function luuViTriQuan(p){
  if(!authRole(p.pin)) return {ok:false,msg:'Sai mã'};
  ensureCols('CoSo',['ViDo','KinhDo','BanKinh']);
  var sh=SS.getSheetByName('CoSo'), v=sh.getDataRange().getValues(), h=v[0];
  for(var i=1;i<v.length;i++) if(v[i][0]===p.maCS){ sh.getRange(i+1,h.indexOf('ViDo')+1).setValue(+p.lat); sh.getRange(i+1,h.indexOf('KinhDo')+1).setValue(+p.lng);
    if(!v[i][h.indexOf('BanKinh')]) sh.getRange(i+1,h.indexOf('BanKinh')+1).setValue(+cfg('QR_BAN_KINH')||100); return {ok:true}; }
  return {ok:false,msg:'Không tìm thấy quán'};
}
function dsMaQR(p){
  if(!authRole(p.pin)) return {ok:false,msg:'Sai mã'};
  var exec=ScriptApp.getService().getUrl(), now=new Date(), th=qrThang(now), sau=qrThang(new Date(now.getFullYear(),now.getMonth()+1,15));
  return {ok:true, thang:th, thangSau:sau, list:rows('CoSo').map(function(c){ return {MaCS:c.MaCS, TenCS:c.TenCS, coViTri:(c.ViDo!==''&&c.ViDo!==undefined), BanKinh:+c.BanKinh||100,
    url:exec+'?page=qr&cs='+c.MaCS+'&t='+qrToken(c.MaCS,th), urlSau:exec+'?page=qr&cs='+c.MaCS+'&t='+qrToken(c.MaCS,sau)}; })};
}
function dsCanhBao(p){
  if(!authRole(p.pin)) return {ok:false,msg:'Sai mã'};
  var tu=p.from||fmtDate(new Date(new Date().getTime()-7*864e5));
  return {ok:true, list:recentRows('ChamCong',3000).filter(function(r){ return String(r.CanhBao||'')!=='' && dateKey(r.Ngay)>=tu; }).map(function(r){
    return {ID:r.ID, Ngay:dateKey(r.Ngay), Gio:fmtTime(r.ThoiGian), MaNV:String(r.MaNV), Ten:r.Ten, MaCS:r.MaCS, Loai:r.Loai, CanhBao:r.CanhBao, Anh:r.AnhURL, KhoangCach:r.KhoangCach}; }).reverse()};
}
