/*******************************************************
 * LỊCH CỦA TÔI – trang nhân viên trong app Chấm công
 * Nhân viên: xem lịch đã xếp, đăng ký bận tuần (hạn trước thứ 7, chậm nhất hết chủ nhật), báo "rảnh thêm", nhận ca cần người.
 * Lịch đã xếp và ca cần người: ĐỌC từ app Xếp lịch. Đăng ký bận, rảnh thêm, nhận ca: GHI ở đây, app Xếp lịch đọc về.
 *******************************************************/
var KHOI_GIO={'Sáng':[390,720],'Trưa':[720,1020],'Tối':[1020,1380]};
function caTuDo(ma){ var m=String(ma||'').match(/^TD(\d{2})(\d{2})-(\d{2})(\d{2})$/); if(!m) return null; var bd=m[1]+':'+m[2], kt=m[3]+':'+m[4]; return {MaCa:ma, TenCa:'Giờ tự do', GioBD:bd, GioKT:kt, SoGio:(toMin(kt)-toMin(bd))/60, CoSo:'ALL'}; }
function caTheoMa(cm, ma){ return cm[ma] || caTuDo(ma); }
function shOf(n, h){ var sh=SS.getSheetByName(n); if(!sh){ sh=SS.insertSheet(n); sh.getRange(1,1,1,h.length).setValues([h]); try{ sh.getRange('B:C').setNumberFormat('@'); }catch(e){} } return sh; }
/* Vé phiên nhân viên: đăng nhập (mã + 4 số) 1 lần → máy chủ cấp vé; các trang Lịch / Giờ công / Báo hư hỏng dùng vé, không bắt nhập lại.
   Vé giữ 6 giờ kể từ lần dùng gần nhất (dùng là gia hạn) – trong ca làm luôn còn hạn. */
function phienCap_(ma){ try{ var t=Utilities.getUuid().replace(/-/g,'').slice(0,24); CacheService.getScriptCache().put('NVP_'+t, String(ma), 21600); return t; }catch(e){ return ''; } }
function phienDoc_(t){ try{ t=String(t||'').replace(/[^0-9a-z]/gi,''); if(t.length<16) return ''; var c=CacheService.getScriptCache(), m=c.get('NVP_'+t); if(m) c.put('NVP_'+t, m, 21600); return m||''; }catch(e){ return ''; } }
function nvTuPhien_(p){ if(!p || !p.phien || p.ma || p.maNV) return null; var m=phienDoc_(p.phien); if(!m) return {loi:'Phiên đăng nhập đã hết hạn – nhập lại mã nhân viên và 4 số điện thoại.', hetPhien:true};
  var n=nvByMa(m); if(!n) return {loi:'Mã nhân viên không hợp lệ', hetPhien:true}; return {nv:n, phien:String(p.phien)}; }
function nvXacMinh(p){ var k=nvTuPhien_(p)||ksNVcc(p.ma, p.sdt4); if(k.loi) return k; if(!dangLam(k.nv)) return {loi:'Mã này không còn trong danh sách đang làm'}; if(!k.phien) k.phien=phienCap_(k.nv.MaNV); return k; }
function lichXepDoc(ten){ var id=String(cfg('LICH_SHEET_ID')||''); if(!id) return []; try{ var sh=SpreadsheetApp.openById(id).getSheetByName(ten); if(!sh) return []; var v=sh.getDataRange().getValues(), h=v.shift();
  return v.filter(function(r){ return r.join('')!==''; }).map(function(r){ var o={}; h.forEach(function(k,j){ o[k]=r[j]; }); return o; }); }catch(e){ return []; } }

/* ---------- xem ---------- */
function lichCuaToi(p){ var k=nvXacMinh(p); if(k.loi) return {ok:false,msg:k.loi}; var n=k.nv, ma=up(n.MaNV), cm=caMap(), today=fmtDate(new Date());
  var d0=mondayOf(today), tuanSau=fmtDate(addDays(new Date(d0+'T12:00:00+07:00'),7)), het=fmtDate(addDays(new Date(d0+'T12:00:00+07:00'),13));
  var lich=lichDaXep().filter(function(l){ return l.MaNV===ma && l.Ngay>=d0 && l.Ngay<=het; }).map(function(l){ var c=caTheoMa(cm,l.MaCa); return c?{Ngay:l.Ngay, MaCS:l.MaCS, GioBD:c.GioBD, GioKT:c.GioKT, ViTri:l.ViTri, TuDo:!!caTuDo(l.MaCa)}:null; }).filter(Boolean)
    .sort(function(a,b){ return (a.Ngay+a.GioBD)<(b.Ngay+b.GioBD)?-1:1; });
  var ban=(SS.getSheetByName('DangKyBan')?rows('DangKyBan'):[]).filter(function(b){ return up(b.MaNV)===ma && dateKey(b.Ngay)>=tuanSau && dateKey(b.Ngay)<=het; }).map(function(b){ return {Ngay:dateKey(b.Ngay), Khoi:b.Khoi}; });
  var xn=(SS.getSheetByName('DangKyXacNhan')?rows('DangKyXacNhan'):[]).filter(function(r){ return up(r.MaNV)===ma && dateKey(r.Tuan)===tuanSau; });
  var ranh=(SS.getSheetByName('RanhThem')?rows('RanhThem'):[]).filter(function(r){ return up(r.MaNV)===ma && dateKey(r.Ngay)>=today; }).map(function(r){ return {ID:String(r.ID), Ngay:dateKey(r.Ngay), Tu:hhmm(r.Tu), Den:hhmm(r.Den), GhiChu:r.GhiChu}; });
  var nhan=(SS.getSheetByName('NhanCa')?rows('NhanCa'):[]).filter(function(r){ return up(r.MaNV)===ma; }), daNhan={}; nhan.forEach(function(r){ daNhan[String(r.CaID)]=String(r.ID); });
  var can=lichXepDoc('CaCanNguoi').filter(function(c){ return dateKey(c.Ngay)>=today && (String(c.TrangThai||'Mở')==='Mở' || daNhan[String(c.ID)]); }).map(function(c){ var chon=String(c.DaChon||'').split(',').map(function(x){ return up(x); });
    return {ID:String(c.ID), Ngay:dateKey(c.Ngay), MaCS:c.MaCS, GioBD:hhmm(c.GioBD), GioKT:hhmm(c.GioKT), ViTri:c.ViTri, SoNguoi:+c.SoNguoi||1, GhiChu:c.GhiChu, TrangThai:String(c.TrangThai||'Mở'), DaNhan:!!daNhan[String(c.ID)], DuocChon:chon.indexOf(ma)>-1}; }).sort(function(a,b){ return (a.Ngay+a.GioBD)<(b.Ngay+b.GioBD)?-1:1; });
  var hanCN=new Date(tuanSau+'T00:00:00+07:00').getTime(), bayGio=new Date().getTime();
  var cong={}; ccRows().forEach(function(r){ if(up(r.MaNV)!==ma) return; var d=dateKey(r.Ngay); if(d<d0 || d>het) return; var tt=trangThaiRow(r,today); (cong[d]=cong[d]||[]).push({Ca:hhmm(r.CaBD)+'–'+hhmm(r.CaKT), MaCS:r.MaCS, Gio:(tt==='Đã xác nhận'||tt==='Đã xong')?so(r.GioTinh):null, TrangThai:tt}); });   // (30/10) không gửi giờ chấm thực tế cho nhân viên
  var xp=(SS.getSheetByName('XinPhep')?rows('XinPhep'):[]).filter(function(r){ return up(r.MaNV)===ma && dateKey(r.Ngay)>=fmtDate(new Date(new Date().getTime()-7*864e5)); }).map(function(r){ return {Ngay:dateKey(r.Ngay), Loai:r.Loai, Gio:hhmm(r.Gio), LyDo:r.LyDo, TrangThai:r.TrangThai}; });
  var bq=(SS.getSheetByName('BaoQuen')?rows('BaoQuen'):[]).filter(function(r){ return up(r.MaNV)===ma && dateKey(r.Ngay)>=fmtDate(new Date(new Date().getTime()-14*864e5)); }).map(function(r){ return {Ngay:dateKey(r.Ngay), Tu:hhmm(r.Tu), Den:hhmm(r.Den), LyDo:r.LyDo, TrangThai:r.TrangThai}; });
  return {ok:true, phien:k.phien, bt:(function(){ try{ var v=btVe_(n,'nv'); return v?{url:v.url, t:v.t}:null; }catch(e){ return null; } })(), cong:cong, xinPhepDs:xp, baoQuenDs:bq, lyDoXinPhep:dmDs('LY_DO_XIN_PHEP'), ma:String(n.MaNV), ten:tenNgan(n.Ten), bietDanh:String(n.BietDanh||''), suKien:(function(){ try{ return suKienSapToi_(n.CoSoChinh, 45); }catch(e){ return []; } })(), loai:n.Loai, today:today, tuanNay:d0, tuanSau:tuanSau, lich:lich, ban:ban, daGui:xn.length?((xn[xn.length-1].LucGui instanceof Date)?fmtTZ_(xn[xn.length-1].LucGui,TZ,'dd/MM HH:mm'):String(xn[xn.length-1].LucGui)):'',
    treHan:bayGio>=hanCN-2*864e5, ranhThem:ranh, caCanNguoi:can, stores:rows('CoSo').map(function(c){ return {MaCS:c.MaCS,TenCS:c.TenCS}; })}; }

/* ---------- đăng ký bận tuần sau ---------- */
function luuDangKyBanNV(p){ var k=nvXacMinh(p); if(k.loi) return {ok:false,msg:k.loi}; var ma=up(k.nv.MaNV), days=weekDays(p.tuan), d0=days[0];
  var hanCN=new Date(d0+'T00:00:00+07:00').getTime(), bayGio=new Date().getTime();
  if(bayGio>=hanCN) return {ok:false,msg:'Đã quá hạn đăng ký tuần '+d0.slice(8)+'/'+d0.slice(5,7)+' (hạn chót hết chủ nhật). Báo trực tiếp quản lý để đổi lịch.'};
  var tre=bayGio>=hanCN-2*864e5;
  var lock=LockService.getScriptLock(); lock.waitLock(20000);
  try{ var sh=shOf('DangKyBan',['Ngay','MaNV','Khoi','Nguon']), v=sh.getDataRange().getValues(), h=v.shift();
    var giu=v.filter(function(r){ return r.join('')!=='' && !(up(r[1])===ma && days.indexOf(dateKey(r[0]))>-1); });
    var them=(p.ban||[]).filter(function(b){ return days.indexOf(b.Ngay)>-1 && ['Sáng','Trưa','Tối','Cả ngày'].indexOf(b.Khoi)>-1; }).map(function(b){ return [b.Ngay, ma, b.Khoi, 'NV tự đăng ký '+fmtDate(new Date())+(tre?' (trễ hạn)':'')+(p.ghiChu?' – '+String(p.ghiChu).slice(0,100):'')]; });
    var all=giu.concat(them); if(v.length) sh.getRange(2,1,v.length,h.length).clearContent(); if(all.length) sh.getRange(2,1,all.length,4).setValues(all);
    shOf('DangKyXacNhan',['Tuan','MaNV','LucGui','TreHan']).appendRow([d0, ma, new Date(), tre?'Trễ hạn':'']);
    return {ok:true, so:them.length, treHan:tre}; } finally { lock.releaseLock(); } }

/* ---------- rảnh thêm (ngoài lịch) ---------- */
function themRanhThem(p){ var k=nvXacMinh(p); if(k.loi) return {ok:false,msg:k.loi}; var tu=hhmm(p.tu), den=hhmm(p.den), ngay=String(p.ngay||'').slice(0,10);
  if(!ngay || ngay<fmtDate(new Date())) return {ok:false,msg:'Chọn ngày từ hôm nay trở đi'}; if(!tu || !den || toMin(den)<=toMin(tu)) return {ok:false,msg:'Giờ kết thúc phải sau giờ bắt đầu'};
  shOf('RanhThem',['ID','Ngay','MaNV','Tu','Den','GhiChu','LucGui']).appendRow(['R'+fmtTZ_(new Date(),TZ,'yyMMddHHmmss')+Math.floor(Math.random()*1e4), ngay, String(k.nv.MaNV), tu, den, String(p.ghiChu||'').slice(0,100), new Date()]);
  return {ok:true}; }
function xoaRanhThem(p){ var k=nvXacMinh(p); if(k.loi) return {ok:false,msg:k.loi}; var sh=SS.getSheetByName('RanhThem'); if(!sh) return {ok:false,msg:'Không tìm thấy'}; var v=sh.getDataRange().getValues();
  for(var i=v.length-1;i>=1;i--) if(String(v[i][0])===String(p.id) && up(v[i][2])===up(k.nv.MaNV)){ sh.deleteRow(i+1); return {ok:true}; } return {ok:false,msg:'Không tìm thấy'}; }

/* ---------- nhận ca cần người ---------- */
function nhanCa(p){ var k=nvXacMinh(p); if(k.loi) return {ok:false,msg:k.loi}; var ma=up(k.nv.MaNV);
  var c=lichXepDoc('CaCanNguoi').filter(function(x){ return String(x.ID)===String(p.caId); })[0]; if(!c) return {ok:false,msg:'Ca này không còn'};
  if(String(c.TrangThai||'Mở')!=='Mở') return {ok:false,msg:'Ca này đã đủ người'}; if(dateKey(c.Ngay)<fmtDate(new Date())) return {ok:false,msg:'Ca này đã qua'};
  var sh=shOf('NhanCa',['ID','CaID','MaNV','Luc']); if(rows('NhanCa').some(function(r){ return String(r.CaID)===String(p.caId) && up(r.MaNV)===ma; })) return {ok:false,msg:'Bạn đã nhận ca này rồi'};
  sh.appendRow(['N'+fmtTZ_(new Date(),TZ,'yyMMddHHmmss')+Math.floor(Math.random()*1e4), String(p.caId), String(k.nv.MaNV), new Date()]); return {ok:true}; }
function huyNhanCa(p){ var k=nvXacMinh(p); if(k.loi) return {ok:false,msg:k.loi}; var sh=SS.getSheetByName('NhanCa'); if(!sh) return {ok:false,msg:'Không tìm thấy'}; var v=sh.getDataRange().getValues();
  var c=lichXepDoc('CaCanNguoi').filter(function(x){ return String(x.ID)===String(p.caId); })[0];
  if(c && String(c.DaChon||'').split(',').map(function(x){ return up(x); }).indexOf(up(k.nv.MaNV))>-1) return {ok:false,msg:'Quản lý đã chọn bạn cho ca này. Muốn đổi, báo trực tiếp quản lý.'};
  for(var i=v.length-1;i>=1;i--) if(String(v[i][1])===String(p.caId) && up(v[i][2])===up(k.nv.MaNV)){ sh.deleteRow(i+1); return {ok:true}; } return {ok:false,msg:'Không tìm thấy'}; }
