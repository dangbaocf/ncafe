/*******************************************************
 * KHẢO SÁT NHÂN VIÊN + DANH SÁCH NHÂN SỰ – app Chấm công
 * Khảo sát để lấy dữ liệu xếp lịch / đào tạo app. Nhân viên chọn quán → chọn tên → xác minh số điện thoại → trả lời → nhận mã.
 * Câu trả lời lưu ở tab KhaoSat (mỗi lần gửi một dòng). Admin đối chiếu rồi mới nạp thông tin cơ bản vào danh sách nhân viên.
 * App Xếp lịch chỉ ĐỌC tab KhaoSat và kỹ năng đã xác nhận để xếp lịch.
 *******************************************************/
var KS_HEADER=['ID','MaNV','LoaiNguoi','NgayGui','XacMinh','SDT','DuLieu','Nap','NapLuc','KyNang'];
function ksSheet(){ var sh=SS.getSheetByName('KhaoSat'); if(!sh){ sh=SS.insertSheet('KhaoSat'); sh.getRange(1,1,1,KS_HEADER.length).setValues([KS_HEADER]); sh.getRange('B:B').setNumberFormat('@'); sh.getRange('F:F').setNumberFormat('@'); } return sh; }
function soDT(v){ return sdtDoc_(v).replace(/[^\d]/g,''); }   // (29/10) thêm lại số 0 đầu bị Google Sheet làm mất
function tachTen(t){ t=String(t||''); var m=t.match(/^(.*?)\s*\((.*)\)\s*$/); return m?{goi:m[1].trim(), full:m[2].trim()}:{goi:t.trim(), full:''}; }

/* ---------- phía nhân viên (không cần đăng nhập) ---------- */
// Danh sách để chọn tên: không lộ số điện thoại, chỉ cho biết hồ sơ đã có số hay chưa
function ksDanhSach(){ return {ok:true, stores:rows('CoSo').map(function(c){ return {MaCS:c.MaCS,TenCS:c.TenCS}; }),
  list:rows('NhanVien').filter(dangLam).map(function(n){ var t=tachTen(n.Ten); return {ma:String(n.MaNV), goi:t.goi, full:t.full, vt:n.ViTri, cs:n.CoSoChinh, coSdt:soDT(n.SDT).length>=9}; })}; }
// Xác minh: hồ sơ có số → phải khớp 4 số cuối; chưa có số → nhập cả số (admin kiểm lại)
function ksXacMinh(p){ var n=nvByMa(p.ma); if(!n || !dangLam(n)) return {ok:false,msg:'Không tìm thấy tên này trong danh sách'};
  var s=soDT(n.SDT), xm;
  if(s.length>=9){ if(String(p.sdt4||'')!==s.slice(-4)) return {ok:false,msg:'4 số cuối điện thoại không khớp hồ sơ'}; xm='khớp'; }
  else { if(soDT(p.sdtFull).length<9) return {ok:false,msg:'Nhập số điện thoại của bạn'}; xm='chưa có số'; }
  var t=tachTen(n.Ten), cu=ksMoiNhat()[up(n.MaNV)];
  return {ok:true, xacMinh:xm, hoSo:{ma:String(n.MaNV), hoTen:t.full, tenGoi:t.goi, sdt:xm==='khớp'?s:soDT(p.sdtFull), ngayVao:dateKey(n.NgayVao), loai:n.Loai, viTri:n.ViTri, quan:n.CoSoChinh}, cu:cu?cu.data:null}; }
function ksGui(p){ var d=p.data||{}; var lock=LockService.getScriptLock(); lock.waitLock(20000);
  try{ var sh=ksSheet(), id='K'+fmtTZ_(new Date(),TZ,'yyMMddHHmmss')+Math.floor(Math.random()*1e4);
    if(p.moi){ if(!String(d.hoTen||'').trim() || soDT(d.sdt).length<9) return {ok:false,msg:'Điền họ tên và số điện thoại'};
      sh.appendRow([id,'','mới',new Date(),'mới',sdtGhi_(soDT(d.sdt)),JSON.stringify(d),'','','']); return {ok:true, moi:true}; }
    var x=ksXacMinh(p); if(!x.ok) return x;
    sh.appendRow([id, x.hoSo.ma, 'cũ', new Date(), x.xacMinh, soDT(d.sdt)||x.hoSo.sdt, JSON.stringify(d), '', '', '']);
    return {ok:true, ma:x.hoSo.ma}; } finally { lock.releaseLock(); } }

/* ---------- đọc câu trả lời ---------- */
function ksTatCa(){ return (SS.getSheetByName('KhaoSat')?rows('KhaoSat'):[]).map(function(r){ var d={}; try{ d=JSON.parse(r.DuLieu||'{}'); }catch(e){} return {id:String(r.ID), ma:up(r.MaNV), loai:r.LoaiNguoi, luc:r.NgayGui, xacMinh:r.XacMinh, sdt:soDT(r.SDT), data:d, nap:r.Nap, kyNang:r.KyNang, _r:r._r}; }); }
function ksMoiNhat(){ var o={}; ksTatCa().forEach(function(k){ if(k.ma) o[k.ma]=k; }); return o; }

/* ---------- admin: đối chiếu & nạp ---------- */
// Khảo sát: admin và quản lý đều dùng được (mọi thao tác ghi tên người làm vào Nhật ký sửa)
function ksAi_(pin){ var t=tkDayDu(pin); return t?(t.ten||(t.role==='admin'?'Admin':'Quản lý')):''; }
function ksDoiChieu(p){ var _q=khongQuyen(p.pin,'ks',1); if(_q) return _q; if(!authRole(p.pin)) return {ok:false,msg:'Sai mã'};
  var all=ksTatCa(), theoMa={}; all.forEach(function(k){ if(k.ma){ (theoMa[k.ma]=theoMa[k.ma]||[]).push(k); } });
  var dong=[];
  Object.keys(theoMa).forEach(function(m){ var L=theoMa[m], k=L[L.length-1], n=nvByMa(m), t=n?tachTen(n.Ten):{goi:'',full:''}, d=k.data;
    var sdts={}; L.forEach(function(x){ if(x.sdt) sdts[x.sdt]=1; }); var hoTens={}; L.forEach(function(x){ if(x.data.hoTen) hoTens[String(x.data.hoTen).toLowerCase()]=1; });
    var trung=Object.keys(sdts).length>1 || Object.keys(hoTens).length>1;
    var khac={hoTen:!!(t.full && d.hoTen && t.full!==d.hoTen), tenGoi:!!(d.tenGoi && t.goi!==d.tenGoi), sdt:!!(n && soDT(n.SDT) && soDT(n.SDT)!==k.sdt), ngayVao:!!(n && n.NgayVao && dateKey(n.NgayVao)!==d.ngayVao),
      loai:!!(n && d.loai && n.Loai!==d.loai), viTri:!!(n && d.viTriChinh && viTriTuKS(d.viTriChinh,n)!==n.ViTri), quan:!!(n && d.quanChinh && n.CoSoChinh!==d.quanChinh)};
    dong.push({id:k.id, ma:m, hoSo:n?{goi:t.goi, full:t.full, sdt:soDT(n.SDT), ngayVao:dateKey(n.NgayVao), loai:n.Loai, viTri:n.ViTri, quan:n.CoSoChinh}:null,
      ks:{hoTen:d.hoTen, tenGoi:d.tenGoi, sdt:k.sdt, ngayVao:d.ngayVao, loai:d.loai, viTri:d.viTriChinh, quan:d.quanChinh}, data:d, khac:khac, soLan:L.length, trung:trung, xacMinh:k.xacMinh, nap:String(k.nap||''), kyNang:String(k.kyNang||''),
      luc:(k.luc instanceof Date)?fmtTZ_(k.luc,TZ,'dd/MM HH:mm'):String(k.luc)}); });
  all.filter(function(k){ return !k.ma; }).forEach(function(k){ dong.push({id:k.id, ma:'', moi:true, ks:{hoTen:k.data.hoTen, tenGoi:k.data.tenGoi, sdt:k.sdt, ngayVao:k.data.ngayVao, loai:k.data.loai, viTri:k.data.viTriChinh, quan:k.data.quanChinh}, data:k.data, nap:String(k.nap||''), luc:(k.luc instanceof Date)?fmtTZ_(k.luc,TZ,'dd/MM HH:mm'):String(k.luc)}); });
  var chua=rows('NhanVien').filter(function(n){ return dangLam(n) && !theoMa[up(n.MaNV)]; }).map(function(n){ return {ma:String(n.MaNV), goi:tachTen(n.Ten).goi, quan:n.CoSoChinh}; });
  return {ok:true, link:linkNV('khaosat'), dong:dong, chua:chua, tong:rows('NhanVien').filter(dangLam).length}; }
function viTriTuKS(v, n){ if(v==='Quản lý / trưởng ca') return (n && n.ViTri==='Quản lý')?'Quản lý':(n?n.ViTri:'Pha chế'); return v; }
function ksDong(id){ return ksTatCa().filter(function(k){ return k.id===String(id); })[0]; }
function ksDanhDau(k, cot, val){ var sh=ksSheet(), h=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0]; sh.getRange(k._r, h.indexOf(cot)+1).setValue(val); }
// Nạp thông tin cơ bản (không đụng chấm công, lương)
function ksNap(p){ var _q=khongQuyen(p.pin,'ks',2); if(_q) return _q; if(!authRole(p.pin)) return {ok:false,msg:'Sai mã'}; var AI=ksAi_(p.pin); var k=ksDong(p.id); if(!k || !k.ma) return {ok:false,msg:'Không tìm thấy câu trả lời'};
  var n=nvByMa(k.ma); if(!n) return {ok:false,msg:'Mã '+k.ma+' không còn trong danh sách'}; var d=k.data, t=tachTen(n.Ten);
  var goi=String(d.tenGoi||t.goi).trim(), full=String(d.hoTen||t.full).trim(), moi={Ten:full?goi+' ('+full+')':goi, SDT:sdtGhi_(k.sdt||soDT(n.SDT)), NgayVao:d.ngayVao||dateKey(n.NgayVao), Loai:d.loai||n.Loai, ViTri:viTriTuKS(d.viTriChinh,n)||n.ViTri, CoSoChinh:d.quanChinh||n.CoSoChinh};
  if(d.viTriChinh==='Quản lý / trưởng ca' && n.ViTri!=='Quản lý') moi.ChucVu='Trưởng ca';
  var sh=SS.getSheetByName('NhanVien'), h=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
  Object.keys(moi).forEach(function(c){ var i=h.indexOf(c); if(i<0) return; var cu=c==='NgayVao'?dateKey(n[c]):String(n[c]==null?'':n[c]); if(String(moi[c])!==cu){ sh.getRange(n._r,i+1).setValue(moi[c]); ghiNhatKy(AI,'',n.MaNV,'Khảo sát → '+c,cu,moi[c]); } });
  ksDanhDau(k,'Nap','Đã nạp'); ksDanhDau(k,'NapLuc',new Date()); return {ok:true}; }
function ksCapMa(p){ var _q=khongQuyen(p.pin,'ks',2); if(_q) return _q; if(!authRole(p.pin)) return {ok:false,msg:'Sai mã'}; var AI=ksAi_(p.pin); var k=ksDong(p.id); if(!k || k.ma) return {ok:false,msg:'Không phải đăng ký mới'}; var d=k.data;
  var vt=d.viTriChinh==='Quản lý / trưởng ca'?'Pha chế':(d.viTriChinh||'Phục vụ');
  _KS_CAP_MA=true; try{ var r=themNhanVien({pin:p.pin, ten:String(d.tenGoi||String(d.hoTen||'').split(' ').pop())+(d.hoTen?' ('+d.hoTen+')':''), viTri:vt, loai:d.loai||'PT', coSo:d.quanChinh||'', sdt:k.sdt, ngayVao:d.ngayVao||fmtDate(new Date())}); } finally { _KS_CAP_MA=false; }
  if(!r.ok) return r; ghiNhatKy(AI,'',r.maNV,'Khảo sát: cấp mã mới','',String(d.hoTen||'')); ksDanhDau(k,'MaNV',r.maNV); ksDanhDau(k,'Nap','Đã cấp mã'); ksDanhDau(k,'NapLuc',new Date()); return {ok:true, maNV:r.maNV, tin:r.tin}; }
// Người đăng ký "nhân viên mới" nhưng thật ra đã có mã (chọn nhầm quán, tên khác hồ sơ…): gắn câu trả lời vào mã có sẵn, sau đó bấm Nạp
function ksGanMa(p){ var _q=khongQuyen(p.pin,'ks',2); if(_q) return _q; if(!authRole(p.pin)) return {ok:false,msg:'Sai mã'}; var AI=ksAi_(p.pin); var k=ksDong(p.id); if(!k || k.ma) return {ok:false,msg:'Câu trả lời này đã có mã'};
  var nv=nvByMa(p.ma); if(!nv) return {ok:false,msg:'Không tìm thấy mã '+p.ma}; ksDanhDau(k,'MaNV',String(nv.MaNV)); ksDanhDau(k,'LoaiNguoi','cũ (admin gắn)');
  ghiNhatKy(AI,'',nv.MaNV,'Khảo sát: gắn câu trả lời nhân viên mới vào mã có sẵn','',k.id); return {ok:true, ma:String(nv.MaNV)}; }
function ksBoQua(p){ var _q=khongQuyen(p.pin,'ks',2); if(_q) return _q; if(!authRole(p.pin)) return {ok:false,msg:'Sai mã'}; var AI=ksAi_(p.pin); var k=ksDong(p.id); if(!k) return {ok:false,msg:'Không tìm thấy'}; ksSheet().deleteRow(k._r); ghiNhatKy(AI,'',k.ma,'Bỏ câu trả lời khảo sát',k.data.hoTen||'',''); return {ok:true}; }
// Xác nhận kỹ năng: vị trí "làm một mình được" thành vị trí kiêm; tăng ca theo câu trả lời (app Xếp lịch đọc về)
function ksXacNhanKyNang(p){ var _q=khongQuyen(p.pin,'ks',2); if(_q) return _q; if(!authRole(p.pin)) return {ok:false,msg:'Sai mã'}; var AI=ksAi_(p.pin); var k=ksMoiNhat()[up(p.ma)]; if(!k) return {ok:false,msg:'Chưa có khảo sát'};
  var n=nvByMa(p.ma), d=k.data, kiem=p.kiem||Object.keys(d.hoTro||{}).filter(function(v){ return d.hoTro[v]==='Làm một mình được'; });
  ensureCols('NhanVien',['ViTriKiem','TangCaDuoc']); var sh=SS.getSheetByName('NhanVien'), h=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
  sh.getRange(n._r, h.indexOf('ViTriKiem')+1).setValue(kiem.join(', ')); if(d.tangCa) sh.getRange(n._r, h.indexOf('TangCaDuoc')+1).setValue(d.tangCa==='Không'?'Không':'Có');
  ksDanhDau(k,'KyNang','Đã xác nhận'); ghiNhatKy(AI,'',n.MaNV,'Xác nhận kỹ năng','',kiem.join(', ')); return {ok:true, kiem:kiem}; }

/* ---------- danh sách mã theo quán (in dán quầy / gửi nhóm Zalo) ---------- */
function dsMaTheoQuan(p){ var _q=khongQuyen(p.pin,'ns',1); if(_q) return _q; if(authRole(p.pin)!=='admin') return {ok:false,msg:'Chỉ admin'}; var o={};
  rows('NhanVien').filter(dangLam).forEach(function(n){ var q=n.CoSoChinh||'Khác'; (o[q]=o[q]||[]).push({ma:String(n.MaNV), ten:tachTen(n.Ten).goi, vt:n.ViTri}); });
  return {ok:true, stores:rows('CoSo').map(function(c){ return {MaCS:c.MaCS,TenCS:c.TenCS}; }), theoQuan:o, link:linkNV('khaosat'), linkGioCong:linkNV('giocong'), linkLich:linkNV('lich')}; }
