/*******************************************************
 * XÁC NHẬN GIỜ – app Chấm công
 * Vào ca: chỉ chấm. Trễ 1–10 phút (NHAC_NHO_PHUT) = nhắc nhở; quá 10 phút = trễ, phải duyệt.
 * Ra ca: nhân viên tự xác nhận đủ ca / tăng ca / giảm ca (giờ thực tế, có mặt lúc, lý do).
 * Quản lý: tab "Xác nhận giờ" – duyệt từng dòng hoặc cả ca một lần, sửa dòng sai, có ghi lý do.
 * Nhân viên: xin phép trước, báo quên chấm, xem giờ đã duyệt từng ngày, phản hồi trong vài ngày.
 *******************************************************/
var XN_COT=['KhaiTu','KhaiDen','CoMat','LyDo','Cach','CoPhep','LyDoSua'];
function nguongXN(){ var nn=+cfg('NHAC_NHO_PHUT')||10; return {nn:nn, tru:Math.max(nn, +cfg('TRU_GIO_TRE_PHUT')||15), som:+cfg('VE_SOM_PHUT')||10, muon:+cfg('RA_MUON_PHUT')||30}; }   // tru: trễ trên mức này mới trừ giờ
function gioGiua(a,b){ return lamTron_((toMin(b)-toMin(a))/60); }
function shXN(n,h){ var sh=SS.getSheetByName(n); if(!sh){ sh=SS.insertSheet(n); sh.getRange(1,1,1,h.length).setValues([h]); try{ sh.getRange('C:C').setNumberFormat('@'); }catch(e){} } return sh; }
function idMoi(t){ return t+fmtTZ_(new Date(),TZ,'yyMMddHHmmss')+Math.floor(Math.random()*1e4); }
// Quyền theo quán: tài khoản quản lý có cột Quan (VD "TP,DD"); trống = mọi quán
function quanCuaTK(tk){ var t=tkRows_().filter(function(x){ return String(x.PIN).trim()===String(tk.pin||'').trim(); })[0];
  var q=t?String(t.Quan||'').split(',').map(function(s){ return up(s.trim()); }).filter(Boolean):[]; return q; }
function tkDayDu(pin){ var tk=taiKhoan(pin); if(!tk) return null; tk.pin=pin; tk.quan=tk.role==='admin'?[]:quanCuaTK(tk); tk.duocCS=function(cs){ return !tk.quan.length || tk.quan.indexOf(up(cs))>-1; }; return tk; }
function dotDaDuyetNgay(ngay){ var th=String(ngay).slice(0,7); return memoRows_('DuyetDot').some(function(r){ if(thKey_(r.Thang)!==th) return false; var kh=khoangDot(th,+r.Dot); return ngay>=kh.tu && ngay<=kh.den; }); }

/* ---------- nhãn lệch & đề xuất ---------- */
function xnNhan(r, coLich){ var t=[], ng=nguongXN(), tre=+r.TreMin||0;
  if(!coLich) t.push(['ngoài lịch','i']);
  if(tre>ng.nn) t.push(['trễ '+tre+"'",'w']); else if(tre>0) t.push(['nhắc nhở: trễ '+tre+"'",'n']);
  if(r.KhaiTu && hhmm(r.Vao) && toMin(hhmm(r.KhaiTu))<toMin(hhmm(r.Vao))-ng.nn) t.push(['khai bắt đầu '+hhmm(r.KhaiTu)+', quét mã '+hhmm(r.Vao),'w']);
  if(r.Ra){ var s=toMin(hhmm(r.CaKT))-toMin(hhmm(r.Ra)); if(s>ng.som) t.push(['về sớm '+s+"'",'w']); if(-s>ng.muon) t.push(['ra muộn '+(-s)+"'",'i']); }
  if(!r.Ra && String(r.TrangThai)==='Đang làm' && dateKey(r.Ngay)<fmtDate(new Date())) t.push(['quên chấm ra','b']);
  if(r.CanhBao && !/Hợp lệ/.test(String(r.CanhBao))) String(r.CanhBao).split('; ').forEach(function(x){ if(x) t.push([x,/Cách quán/.test(x)?'b':'i']); });
  return t; }
// Giờ đề xuất khi duyệt. DE_XUAT_GIO='nv' (mặc định): theo nhân viên xác nhận, quản lý duyệt / sửa. 'cham': theo giờ chấm thực tế – từ giờ vào (hoặc giờ có mặt nhân viên ghi khi chấm muộn) đến giờ ra,
// đến sớm trước giờ bắt đầu ca không tính, làm tròn 15 phút; nhân viên khai giảm ca thì lấy số nhỏ hơn.
function deXuatTheoCham(){ return String(cfg('DE_XUAT_GIO')||'nv')==='cham'; }
// (28/10) Đi trễ quá ngưỡng nhắc nhở → tính từ ĐÚNG giờ đến thực tế, KHÔNG làm tròn (trễ trong ngưỡng: tính như bình thường)
function treQuaNguong_(v, caBD){ return !!(v && caBD && toMin(v)-toMin(caBD) > nguongXN().tru); }
function gioCoTre_(v, ra, caBD){ var m=toMin(ra)-toMin(v); if(treQuaNguong_(v, caBD)) return Math.round(m/60*100)/100; return lamTron_(m/60); }
function xnGioCham(r){ if(!r.Ra) return null; var bd=hhmm(r.CoMat)||hhmm(r.Vao), ca=hhmm(r.CaBD); if(ca && toMin(bd)<toMin(ca)) bd=ca;
  if(ca && toMin(bd)-toMin(ca)<=nguongXN().tru) bd=ca;   // (30/10) trễ chưa quá ngưỡng trừ giờ (15') → không trừ, tính từ giờ bắt đầu ca
  var g=gioCoTre_(bd, hhmm(r.Ra), ca); return g>0?g:0; }
function xnDeXuat(r){ if(!r.Ra) return null;
  if(deXuatTheoCham() && String(r.KhaiLoai)!=='bao-quen'){ var g=xnGioCham(r); if(String(r.KhaiLoai)==='giam' && +r.KhaiGio>0) g=Math.min(g, r.KhaiTu&&r.KhaiDen?gioGiua(hhmm(r.KhaiTu),hhmm(r.KhaiDen)):+r.KhaiGio); return g; }
  var caG=gioGiua(hhmm(r.CaBD),hhmm(r.CaKT)), k=String(r.KhaiLoai||'');
  if(!k) return +r.GioTinh>0?+r.GioTinh:caG;   // không có lời khai (quên chấm ra, quản lý đã sửa): đề xuất giờ đã duyệt / sửa lần trước
  if(k==='du'||k==='dung'){ var lc=xnDuNhungLech_(r); return lc?lc.g:caG; } if(r.KhaiTu && r.KhaiDen) return gioGiua(hhmm(r.KhaiTu),hhmm(r.KhaiDen)); return +r.KhaiGio||null; }
// (28/10) khai "Đủ ca" nhưng giờ chấm cho thấy đến muộn / về sớm quá ngưỡng → đề xuất theo giờ chấm:
// giờ vào làm tròn LÊN, giờ ra làm tròn XUỐNG theo bước làm tròn (15'), không tính trước giờ bắt đầu / sau giờ kết thúc ca. VD 14:28–22:13, ca 14:30–22:30 → 14:30–22:00 = 7,5h
function xnDuNhungLech_(r){ if(!r.Ra || !r.CaBD || !r.CaKT) return null; var ng=nguongXN(), bd=toMin(hhmm(r.CaBD)), kt=toMin(hhmm(r.CaKT)), v=toMin(hhmm(r.CoMat)||hhmm(r.Vao)), ra=toMin(hhmm(r.Ra));
  if(v==null || ra==null || bd==null || kt==null) return null; var tre=v-bd, som=kt-ra; if(!(tre>ng.tru || som>ng.som)) return null;
  var st=Math.max(1,+cfg('LAM_TRON_PHUT')||15), a=tre>ng.tru?v:bd, b=som>ng.som?Math.min(kt, Math.floor(ra/st)*st):kt;   // trễ trên ngưỡng trừ giờ: đúng giờ đến, không làm tròn
  return {g:b>a?Math.round((b-a)/60*100)/100:0, ghi:'khai đủ ca nhưng '+(som>ng.som?'về sớm '+som+'\'':'')+(tre>ng.tru&&som>ng.som?', ':'')+(tre>ng.tru?'đến muộn '+tre+'\'':'')+' → tính '+lichGioCC_(a)+'–'+lichGioCC_(b)}; }
function lichGioCC_(p){ return ('0'+Math.floor(p/60)).slice(-2)+':'+('0'+(p%60)).slice(-2); }
function xnKhop(r, coLich){ var ng=nguongXN(), k=String(r.KhaiLoai||''); if(!(k==='du'||k==='dung') || !coLich || r.MaCa==='KHAC') return false;
  if((+r.TreMin||0)>ng.nn) return false; var s=toMin(hhmm(r.CaKT))-toMin(hhmm(r.Ra)); if(s>ng.som || -s>ng.muon) return false;
  if(/Cách quán|Ra ca ở /.test(String(r.CanhBao||''))) return false; return true; }   // đứng xa quán thì luôn để quản lý xem
function coLichCa(r){ if(!cfg('LICH_SHEET_ID')) return true;   // chưa nối app Xếp lịch: ca nhân viên chọn được coi là lịch
  return lichNgay(r.MaNV, dateKey(r.Ngay)).some(function(l){ return l.MaCS===r.MaCS && (l.MaCa===r.MaCa || (toMin(l.GioBD)<toMin(hhmm(r.CaKT)) && toMin(l.GioKT)>toMin(hhmm(r.CaBD)))); }); }

/* ---------- danh sách cho quản lý ---------- */
// 1 thẻ Xác nhận giờ (dùng cho danh sách và để trả về thẻ đã cập nhật sau khi duyệt / sửa – trang khỏi tải lại cả danh sách)
function xnMuc_(r, today, ten, xp){ var d=dateKey(r.Ngay), cl=coLichCa(r), x=(xp||[]).filter(function(q){ return up(q.MaNV)===up(r.MaNV) && dateKey(q.Ngay)===d; })[0];
    return {ID:String(r.ID), Ngay:d, MaNV:String(r.MaNV), Ten:ten(r.MaNV), MaCS:r.MaCS, Ca:hhmm(r.CaBD)+'–'+hhmm(r.CaKT), CoLich:cl, Vao:hhmm(r.Vao), Ra:hhmm(r.Ra), TrangThai:trangThaiRow(r,today),
      Khop:!!r.Ra && xnKhop(r,cl), Nhan:xnNhan(r,cl), KhaiLoai:String(r.KhaiLoai||''), KhaiTu:hhmm(r.KhaiTu), KhaiDen:hhmm(r.KhaiDen), CoMat:hhmm(r.CoMat), LyDo:r.LyDo||'', Ghi:r.KhaiGhiChu||'',
      GioLich:gioGiua(hhmm(r.CaBD),hhmm(r.CaKT)), GioCham:r.Ra?lam15((toMin(hhmm(r.Ra))-toMin(hhmm(r.Vao)))/60):null, DeXuat:xnDeXuat(r), GioTinh:+r.GioTinh||0,
      Cach:r.Cach||'', CoPhep:r.CoPhep||'', LyDoSua:r.LyDoSua||'', Boi:r.XacNhanBoi||'', Luc:(r.XacNhanLuc instanceof Date)?fmtTZ_(r.XacNhanLuc,TZ,'dd/MM HH:mm'):String(r.XacNhanLuc||''),
      Khoa:dotDaDuyetNgay(d), AnhVao:r.AnhVao||'', AnhRa:r.AnhRa||'', XinPhep:x?{Loai:x.Loai,Gio:hhmm(x.Gio),LyDo:x.LyDo,TrangThai:x.TrangThai}:null}; }
function xnDanhSach(p){ var _q=khongQuyen(p.pin,'duyet',1); if(_q) return _q; var tk=tkDayDu(p.pin); if(!tk) return {ok:false,msg:'Sai mã'}; var today=fmtDate(new Date()), ngay=p.ngay||today, nv={};
  rows('NhanVien').forEach(function(n){ nv[up(n.MaNV)]=n; }); var ten=function(m){ var n=nv[up(m)]; return n?tenNgan(n.Ten):m; };
  var xp=rows_('XinPhep'), ph=rows_('PhanHoi'), bq=rows_('BaoQuen'), vg=rows_('Vang');
  var hop=function(cs){ return tk.duocCS(cs) && (!p.cs || p.cs===cs); };
  var cc=ccRows().filter(function(r){ var d=dateKey(r.Ngay); if(!hop(r.MaCS)) return false; if(p.choDuyet) return ['Chờ xác nhận','Đang làm'].indexOf(String(r.TrangThai))>-1 && (String(r.TrangThai)==='Chờ xác nhận' || d<today); return d===ngay; });
  var list=cc.map(function(r){ return xnMuc_(r, today, ten, xp); });
  // có lịch mà không chấm (đã qua giờ bắt đầu ca 30 phút), chưa đánh dấu vắng
  var vang=[]; if(!p.choDuyet){ var co={}; cc.forEach(function(r){ co[up(r.MaNV)]=1; }); var bayGio=today===ngay?toMin(fmtTime(new Date())):9999;
    lichDaXep().filter(function(l){ return l.Ngay===ngay && hop(l.MaCS) && !co[l.MaNV]; }).forEach(function(l){ var c=caTheoMa(caMap(),l.MaCa); if(!c || (ngay===today && toMin(c.GioBD)+30>bayGio)) return;
      var v=vg.filter(function(x){ return up(x.MaNV)===l.MaNV && dateKey(x.Ngay)===ngay; })[0], x=xp.filter(function(q){ return up(q.MaNV)===l.MaNV && dateKey(q.Ngay)===ngay; })[0];
      vang.push({MaNV:l.MaNV, Ten:ten(l.MaNV), MaCS:l.MaCS, Ca:c.GioBD+'–'+c.GioKT, DaDanhDau:v?{CoPhep:v.CoPhep,LyDo:v.LyDo,Boi:v.Boi}:null, XinPhep:x?{Loai:x.Loai,LyDo:x.LyDo,TrangThai:x.TrangThai}:null}); }); }
  var nvCS=function(m, cs){ return hop(cs || (nv[up(m)]&&nv[up(m)].CoSoChinh) || ''); };
  return {ok:true, ngay:ngay, theoCham:deXuatTheoCham(), suaGio:tk.suaGio, role:tk.role, quan:tk.quan, list:list, vang:vang,
    xinPhep:xp.filter(function(q){ return String(q.TrangThai)==='Chờ' && nvCS(q.MaNV,q.MaCS); }).map(function(q){ return {ID:String(q.ID),Ngay:dateKey(q.Ngay),MaNV:String(q.MaNV),Ten:ten(q.MaNV),MaCS:q.MaCS,Loai:q.Loai,Gio:hhmm(q.Gio),LyDo:q.LyDo}; }),
    baoQuen:bq.filter(function(q){ return String(q.TrangThai)==='Chờ' && nvCS(q.MaNV,q.MaCS); }).map(function(q){ return {ID:String(q.ID),Ngay:dateKey(q.Ngay),MaNV:String(q.MaNV),Ten:ten(q.MaNV),MaCS:q.MaCS,Tu:hhmm(q.Tu),Den:hhmm(q.Den),LyDo:q.LyDo}; }),
    phanHoi:ph.filter(function(q){ return String(q.TrangThai)==='Chờ'; }).map(function(q){ var r=ccRows().filter(function(x){ return String(x.ID)===String(q.CCID); })[0]; return r && hop(r.MaCS)?{ID:String(q.ID),CCID:String(q.CCID),Ngay:dateKey(r.Ngay),MaNV:String(q.MaNV),Ten:ten(q.MaNV),MaCS:r.MaCS,NoiDung:q.NoiDung,GioTinh:+r.GioTinh||0,Ca:hhmm(r.CaBD)+'–'+hhmm(r.CaKT),Vao:hhmm(r.Vao),Ra:hhmm(r.Ra),Tu:hhmm(r.CoMat)||hhmm(r.KhaiTu)||hhmm(r.Vao),Den:hhmm(r.KhaiDen)||hhmm(r.Ra),Cach:String(r.Cach||'')}:null; }).filter(Boolean)}; }
function rows_(n){ return SS.getSheetByName(n)?rows(n):[]; }

/* ---------- quản lý duyệt ---------- */
// cach: 'dexuat' (theo nhân viên xác nhận – mọi quản lý) | 'lich' | 'cham' | 'sua' (cần quyền điều chỉnh giờ)
function xnDuyet(p){ var _q=khongQuyen(p.pin,'duyet',2); if(_q) return _q; var tk=tkDayDu(p.pin); if(!tk) return {ok:false,msg:'Sai mã'}; var cach=p.cach||'dexuat', ids=(p.ids||[]).map(String);
  if(cach!=='dexuat' && !tk.suaGio) return {ok:false,msg:'Tính theo lịch / giờ chấm hoặc sửa giờ cần được admin cấp quyền điều chỉnh giờ.'};
  if((cach==='sua'||cach==='gio') && !String(p.lyDo||'').trim()) return {ok:false,msg:'Ghi lý do sửa'};
  ensureCols('ChamCong',XN_COT); var sh=SS.getSheetByName('ChamCong'), h=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0], now=new Date(), ai=tk.ten||(tk.role==='admin'?'Admin':'Quản lý');
  var xp=rows_('XinPhep'), xong=[], bo=[], cap=[], lk=LockService.getScriptLock(); try{ lk.waitLock(20000); }catch(e){}
  // ghi gộp: mỗi thẻ 1 lần ghi cả dòng (trước đây 7 lần ghi từng ô → duyệt cả ca rất chậm)
  try{ ccRows().filter(function(r){ return ids.indexOf(String(r.ID))>-1; }).forEach(function(r){ var d=dateKey(r.Ngay), doi={}, set=function(k,v){ doi[k]=v; };
    if(!tk.duocCS(r.MaCS)){ bo.push(r.Ten+': không thuộc quán của bạn'); return; }
    if(thangDaChot(d.slice(0,7))){ bo.push(r.Ten+': tháng đã chốt lương'); return; }
    if(dotDaDuyetNgay(d) && tk.role!=='admin'){ bo.push(r.Ten+': đợt đã duyệt, chỉ admin sửa'); return; }
    var caG=gioGiua(hhmm(r.CaBD),hhmm(r.CaKT)), g, mo='';
    if(cach==='dexuat'){ g=xnDeXuat(r); if(g==null){ bo.push(r.Ten+': chưa có giờ ra – dùng Sửa'); return; } mo=deXuatTheoCham()&&String(r.KhaiLoai)!=='bao-quen'?'theo giờ chấm'+(r.CoMat?' (có mặt '+hhmm(r.CoMat)+')':''):'theo nhân viên xác nhận'; if(!deXuatTheoCham()){ var lc=xnDuNhungLech_(r); if(lc && /^(du|dung)$/.test(String(r.KhaiLoai))) mo=lc.ghi; } }
    else if(cach==='lich'){ g=caG; mo='theo lịch'; }
    else if(cach==='cham'){ if(!r.Ra){ bo.push(r.Ten+': chưa có giờ ra'); return; } var vC=hhmm(r.Vao), caC=hhmm(r.CaBD); if(caC && toMin(vC)>toMin(caC) && toMin(vC)-toMin(caC)<=nguongXN().tru) vC=caC;   // trễ chưa quá 15' → không trừ
      g=gioCoTre_(vC, hhmm(r.Ra), hhmm(r.CaBD)); mo='theo giờ chấm'+(treQuaNguong_(hhmm(r.Vao),hhmm(r.CaBD))?' (trễ: tính đúng phút)':''); }
    else if(cach==='gio'){ g=Math.round((+String(p.gio==null?'':p.gio).replace(',','.'))*4)/4; mo='sửa thành '+String(g).replace('.',',')+'h'; }   // (28/10) quản lý nhập thẳng số giờ
    else { var v=hhmm(p.vao), ra=hhmm(p.ra); if(!v || !ra || toMin(ra)<=toMin(v)) return bo.push(r.Ten+': giờ vào / ra không hợp lệ'); g=gioCoTre_(v,ra,hhmm(r.CaBD)); mo='sửa '+v+'–'+ra+(treQuaNguong_(v,hhmm(r.CaBD))?' (trễ: tính đúng phút)':''); if(!r.Ra){ set('Ra',ra); } }
    if(!(g>0) || g>16){ bo.push(r.Ten+': số giờ không hợp lệ'); return; }
    // tăng ca dưới ngưỡng (mặc định 30 phút) không tính: giờ công = giờ ca
    // (28/10) chỉ áp cho giờ APP ĐỀ XUẤT; quản lý tự sửa giờ / bấm "Tính theo giờ chấm" thì giữ đúng số giờ quản lý chọn
    var ngTC=nguongTC_(); if(cach==='dexuat' && caG>0 && g>caG && (g-caG)*60 < ngTC-0.01){ g=caG; mo+=' · tăng ca dưới '+ngTC+"' không tính"; }
    var coXP=xp.some(function(q){ return up(q.MaNV)===up(r.MaNV) && dateKey(q.Ngay)===d && String(q.TrangThai)==='Đồng ý'; });
    var phep=p.coPhep||(coXP?'Có phép':((+r.TreMin||0)>nguongXN().nn || String(r.KhaiLoai)==='giam'?(r.LyDo?'Có lý do':'Không phép'):''));
    set('GioTinh',g); set('TrangThai','Đã xác nhận'); set('Cach',mo); set('CoPhep',phep); set('LyDoSua',String(p.lyDo||'')); set('XacNhanBoi',ai); set('XacNhanLuc',now);
    var dong=h.map(function(k){ return doi.hasOwnProperty(k)?doi[k]:(r[k]===undefined?'':r[k]); }); sh.getRange(r._r,1,1,h.length).setValues([dong]);
    try{ cap.push(xnMuc_(Object.assign({},r,doi), fmtDate(new Date()), function(){ return ''; }, xp)); }catch(e){}
    if(cach!=='dexuat') ghiNhatKy(ai, d.slice(0,7), r.MaNV, 'Xác nhận giờ '+d+' ('+mo+')', xnDeXuat(r)||'', g+(p.lyDo?' – '+p.lyDo:''));
    xong.push(String(r.ID)); }); } finally { try{ lk.releaseLock(); }catch(e){} }
  return {ok:true, xong:xong.length, bo:bo, cap:cap}; }
function xnBoDuyet(p){ var tk=tkDayDu(p.pin); if(!tk) return {ok:false,msg:'Sai mã'}; if(!tk.suaGio) return {ok:false,msg:'Bỏ duyệt cần quyền điều chỉnh giờ'};
  var r=ccRows().filter(function(x){ return String(x.ID)===String(p.id); })[0]; if(!r) return {ok:false,msg:'Không tìm thấy'}; var d=dateKey(r.Ngay);
  if(!tk.duocCS(r.MaCS)) return {ok:false,msg:'Không thuộc quán của bạn'}; if(thangDaChot(d.slice(0,7))) return {ok:false,msg:'Tháng đã chốt lương'};
  if(dotDaDuyetNgay(d) && tk.role!=='admin') return {ok:false,msg:'Đợt đã duyệt, chỉ admin sửa'};
  var sh=SS.getSheetByName('ChamCong'), h=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0]; [['TrangThai','Chờ xác nhận'],['Cach',''],['XacNhanBoi',''],['XacNhanLuc','']].forEach(function(kv){ if(h.indexOf(kv[0])>-1) sh.getRange(r._r,h.indexOf(kv[0])+1).setValue(kv[1]); });
  ghiNhatKy(tk.ten||'Quản lý', d.slice(0,7), r.MaNV, 'Bỏ duyệt giờ '+d, r.GioTinh, '');
  var cap=[]; try{ cap.push(xnMuc_(Object.assign({},r,{TrangThai:'Chờ xác nhận',Cach:'',XacNhanBoi:'',XacNhanLuc:''}), fmtDate(new Date()), function(){ return ''; }, rows_('XinPhep'))); }catch(e){}
  return {ok:true, cap:cap}; }
// Có lịch mà không đến
function xnVang(p){ var _q=khongQuyen(p.pin,'duyet',2); if(_q) return _q; var tk=tkDayDu(p.pin); if(!tk) return {ok:false,msg:'Sai mã'}; if(!tk.duocCS(p.cs)) return {ok:false,msg:'Không thuộc quán của bạn'}; var kh=khoaNgay_(tk, String(p.ngay||'')); if(kh) return {ok:false,msg:kh};
  shXN('Vang',['Ngay','MaNV','MaCS','Ca','CoPhep','LyDo','Boi','Luc']).appendRow([p.ngay, String(p.ma), p.cs, p.ca||'', p.coPhep==='Có phép'?'Có phép':'Không phép', String(p.lyDo||''), tk.ten||'Quản lý', new Date()]); return {ok:true}; }

/* ---------- nhân viên: xin phép, báo quên chấm, phản hồi ---------- */
function nvTK(p){ var k=nvTuPhien_(p)||ksNVcc(p.ma, p.sdt4); if(k.loi) return {loi:k.loi}; if(!dangLam(k.nv)) return {loi:'Mã này không còn trong danh sách đang làm'}; return k; }
function csNgay(n, ngay){ var l=lichNgay(n.MaNV, ngay)[0]; return l?l.MaCS:String(n.CoSoChinh||''); }
function xinPhep(p){ var k=nvTK(p); if(k.loi) return {ok:false,msg:k.loi}; var n=k.nv, ngay=String(p.ngay||'').slice(0,10);
  if(!ngay || ngay<fmtDate(new Date())) return {ok:false,msg:'Chọn ngày từ hôm nay trở đi'}; if(['muon','som','nghi'].indexOf(p.loai)<0) return {ok:false,msg:'Chọn loại xin phép'};
  if(p.loai!=='nghi' && !hhmm(p.gio)) return {ok:false,msg:'Điền giờ đến / giờ về dự kiến'}; if(!String(p.lyDo||'').trim()) return {ok:false,msg:'Chọn hoặc ghi lý do'};
  var cs=csNgay(n,ngay); return khoaGui_(function(){ var cu=trungDong_('XinPhep',function(x){ return up(x.MaNV)===up(n.MaNV) && dateKey(x.Ngay)===ngay && String(x.Loai)===p.loai && hhmm(x.Gio)===(p.loai==='nghi'?'':hhmm(p.gio)) && String(x.TrangThai)==='Chờ'; });
  if(cu) return {ok:true, trung:true, msg:'Đã gửi trước đó, đang chờ quản lý duyệt.'}; shXN('XinPhep',['ID','Ngay','MaNV','MaCS','Loai','Gio','LyDo','Luc','TrangThai','Boi']).appendRow([idMoi('P'), ngay, String(n.MaNV), cs, p.loai, p.loai==='nghi'?'':hhmm(p.gio), String(p.lyDo).slice(0,150), new Date(), 'Chờ', '']);
  try{ tgGui(tgChatCho(cs), '📝 XIN PHÉP · '+ngay.split('-').reverse().join('/')+'\n'+tenNgan(n.Ten)+' ('+n.MaNV+') xin '+({muon:'ĐẾN MUỘN lúc '+hhmm(p.gio),som:'VỀ SỚM lúc '+hhmm(p.gio),nghi:'NGHỈ cả ngày'})[p.loai]+'\nLý do: '+p.lyDo+'\n→ Duyệt ở tab Xác nhận giờ'); }catch(e){}
  return {ok:true}; }); }
function xpQuyetDinh(p){ var _q=khongQuyen(p.pin,'duyet',2); if(_q) return _q; var tk=tkDayDu(p.pin); if(!tk) return {ok:false,msg:'Sai mã'}; var sh=SS.getSheetByName('XinPhep'); if(!sh) return {ok:false,msg:'Không tìm thấy'};
  var r=rows('XinPhep').filter(function(x){ return String(x.ID)===String(p.id); })[0]; if(!r) return {ok:false,msg:'Không tìm thấy'}; if(!tk.duocCS(r.MaCS)) return {ok:false,msg:'Không thuộc quán của bạn'};
  var h=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0]; sh.getRange(r._r,h.indexOf('TrangThai')+1).setValue(p.dongY?'Đồng ý':'Từ chối'); sh.getRange(r._r,h.indexOf('Boi')+1).setValue(tk.ten||'Quản lý'); return {ok:true}; }
/* ---------- CHỐNG GỬI TRÙNG: nhân viên bấm Gửi 2 lần (mạng chậm) chỉ ghi 1 lần ---------- */
// khoá ngắn để 2 lần gửi gần như cùng lúc không cùng lọt qua bước kiểm tra
function khoaGui_(fn){ var lk=LockService.getScriptLock(); try{ lk.waitLock(15000); }catch(e){} try{ return fn(); } finally { try{ lk.releaseLock(); }catch(e){} } }
function trungDong_(ten, f){ var sh=SS.getSheetByName(ten); if(!sh) return null; return rows(ten).filter(f)[0]||null; }
function ganDay_(luc, phut){ var t=(luc instanceof Date)?luc.getTime():0; return t && (new Date().getTime()-t)<phut*60000; }
function baoQuenCham(p){ var k=nvTK(p); if(k.loi) return {ok:false,msg:k.loi}; var n=k.nv, ngay=String(p.ngay||'').slice(0,10), tu=hhmm(p.tu), den=hhmm(p.den);
  if(!ngay || ngay>fmtDate(new Date())) return {ok:false,msg:'Chọn ngày đã làm'}; if(!tu || !den || toMin(den)<=toMin(tu)) return {ok:false,msg:'Giờ ra phải sau giờ vào'};
  if(!String(p.lyDo||'').trim()) return {ok:false,msg:'Ghi lý do'}; var cs=p.cs||csNgay(n,ngay);
  return khoaGui_(function(){ var cu=trungDong_('BaoQuen',function(x){ return up(x.MaNV)===up(n.MaNV) && dateKey(x.Ngay)===ngay && hhmm(x.Tu)===tu && hhmm(x.Den)===den && (String(x.TrangThai)==='Chờ'||String(x.TrangThai)==='Đã duyệt'); });
  if(cu) return {ok:true, trung:true, msg:String(cu.TrangThai)==='Đã duyệt'?'Báo quên chấm này đã được duyệt rồi.':'Đã gửi trước đó, đang chờ quản lý duyệt.'};
  shXN('BaoQuen',['ID','Ngay','MaNV','MaCS','Tu','Den','LyDo','Luc','TrangThai','Boi']).appendRow([idMoi('Q'), ngay, String(n.MaNV), cs, tu, den, String(p.lyDo).slice(0,150), new Date(), 'Chờ', '']);
  try{ tgGui(tgChatCho(cs), '🕘 BÁO QUÊN CHẤM · '+ngay.split('-').reverse().join('/')+'\n'+tenNgan(n.Ten)+' ('+n.MaNV+') làm '+tu+'–'+den+'\nLý do: '+p.lyDo+'\n→ Duyệt ở tab Xác nhận giờ'); }catch(e){}
  return {ok:true}; }); }
function bqQuyetDinh(p){ var _q=khongQuyen(p.pin,'duyet',2); if(_q) return _q; var tk=tkDayDu(p.pin); if(!tk) return {ok:false,msg:'Sai mã'}; var r=rows_('BaoQuen').filter(function(x){ return String(x.ID)===String(p.id); })[0]; if(!r) return {ok:false,msg:'Không tìm thấy'};
  if(!tk.duocCS(r.MaCS)) return {ok:false,msg:'Không thuộc quán của bạn'}; var ngay=dateKey(r.Ngay), kh=khoaNgay_(tk, ngay); if(kh && p.dongY) return {ok:false,msg:kh};
  var sh=SS.getSheetByName('BaoQuen'), h=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
  if(p.dongY){ ensureCols('ChamCong',XN_COT); var tu=hhmm(r.Tu), den=hhmm(r.Den), g=gioGiua(tu,den), n=nvByMa(r.MaNV), ai=tk.ten||'Quản lý';
    var mo=ccRows().filter(function(x){ return up(x.MaNV)===up(r.MaNV) && dateKey(x.Ngay)===ngay && !x.Ra; })[0], cs=SS.getSheetByName('ChamCong'), hc=cs.getRange(1,1,1,cs.getLastColumn()).getValues()[0];
    if(mo){ var set=function(k,v){ cs.getRange(mo._r,hc.indexOf(k)+1).setValue(v); }; set('Ra',den); set('GioThuc',g); set('KhaiLoai','bao-quen'); set('KhaiGio',g); set('GioTinh',gioGiua(hhmm(mo.Vao)<tu?hhmm(mo.Vao):tu,den)); set('TrangThai','Đã xác nhận'); set('Cach','báo quên chấm ra'); set('LyDo',r.LyDo); set('XacNhanBoi',ai); set('XacNhanLuc',new Date()); }
    else { var o={ID:'BQ-'+r.ID, Ngay:ngay, MaNV:String(r.MaNV), Ten:n?tenNgan(n.Ten):'', MaCS:r.MaCS, MaCa:'KHAC', CaBD:tu, CaKT:den, ViTri:n?n.ViTri:'', Vao:tu, Ra:den, TreMin:0, GioThuc:g, KhaiLoai:'bao-quen', KhaiGio:g, TrangThai:'Đã xác nhận', GioTinh:g, XacNhanBoi:ai, XacNhanLuc:new Date(), Cach:'báo quên chấm', LyDo:r.LyDo, CanhBao:'Nhân viên báo quên chấm'};
      cs.appendRow(hc.map(function(k){ return o[k]!==undefined?o[k]:''; })); }
    ghiNhatKy(ai, ngay.slice(0,7), r.MaNV, 'Duyệt báo quên chấm '+ngay, '', tu+'–'+den); }
  sh.getRange(r._r,h.indexOf('TrangThai')+1).setValue(p.dongY?'Đã duyệt':'Từ chối'); sh.getRange(r._r,h.indexOf('Boi')+1).setValue(tk.ten||'Quản lý'); return {ok:true}; }
function phanHoi(p){ var k=nvTK(p); if(k.loi) return {ok:false,msg:k.loi}; var r=ccRows().filter(function(x){ return String(x.ID)===String(p.ccId) && up(x.MaNV)===up(k.nv.MaNV); })[0];
  if(!r) return {ok:false,msg:'Không tìm thấy ngày công này'}; if(!String(p.noiDung||'').trim()) return {ok:false,msg:'Ghi nội dung phản hồi'};
  var han=+cfg('PHAN_HOI_NGAY')||3, luc=r.XacNhanLuc instanceof Date?r.XacNhanLuc:new Date(); if(new Date().getTime()-luc.getTime()>han*864e5+864e5) return {ok:false,msg:'Đã quá '+han+' ngày, báo trực tiếp quản lý'};
  return khoaGui_(function(){ var cu=trungDong_('PhanHoi',function(x){ return String(x.CCID)===String(r.ID) && up(x.MaNV)===up(k.nv.MaNV) && String(x.TrangThai)==='Chờ' && String(x.NoiDung).trim()===String(p.noiDung).trim().slice(0,300); });
  if(cu) return {ok:true, trung:true, msg:'Đã gửi trước đó.'};
  shXN('PhanHoi',['ID','CCID','MaNV','NoiDung','Luc','TrangThai','TraLoi','Boi']).appendRow([idMoi('H'), String(r.ID), String(k.nv.MaNV), String(p.noiDung).slice(0,300), new Date(), 'Chờ', '', '']);
  try{ tgGui(tgChatCho(r.MaCS), '💬 PHẢN HỒI GIỜ CÔNG · '+dateKey(r.Ngay).split('-').reverse().join('/')+'\n'+tenNgan(k.nv.Ten)+' ('+k.nv.MaNV+'): '+p.noiDung+'\n→ Trả lời ở tab Xác nhận giờ'); }catch(e){}
  return {ok:true}; }); }
function phTraLoi(p){ var _q=khongQuyen(p.pin,'duyet',2); if(_q) return _q; var tk=tkDayDu(p.pin); if(!tk) return {ok:false,msg:'Sai mã'}; var r=rows_('PhanHoi').filter(function(x){ return String(x.ID)===String(p.id); })[0]; if(!r) return {ok:false,msg:'Không tìm thấy'};
  // (28/10) sửa giờ ngay trong khung phản hồi: duyệt lại ca đó với giờ vào / ra mới (giữ lịch sử sửa như nút Sửa)
  if(p.vao && p.ra){ var d=xnDuyet({pin:p.pin, ids:[String(r.CCID)], cach:'sua', vao:p.vao, ra:p.ra, coPhep:'Có phép', lyDo:('Theo phản hồi: '+String(r.NoiDung||'')).slice(0,140)}); if(!d.ok) return d; if(d.bo && d.bo.length) return {ok:false, msg:d.bo.join(' · ')}; }
  var sh=SS.getSheetByName('PhanHoi'), h=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0]; sh.getRange(r._r,h.indexOf('TraLoi')+1).setValue(String(p.traLoi||'')); sh.getRange(r._r,h.indexOf('TrangThai')+1).setValue('Đã trả lời'); sh.getRange(r._r,h.indexOf('Boi')+1).setValue(tk.ten||'Quản lý');
  if(p.moLai){ var b=xnBoDuyet({pin:p.pin,id:r.CCID}); if(!b.ok) return b; }
  var moi=ccRows().filter(function(x){ return String(x.ID)===String(r.CCID); })[0]; return {ok:true, gio:moi?(+moi.GioTinh||0):null}; }

/* ---------- tổng hợp tháng (để đánh giá, không trừ tiền) ---------- */
function tongHopThang(p){ var _q=khongQuyen(p.pin,'duyet',1); if(_q) return _q; var tk=tkDayDu(p.pin); if(!tk) return {ok:false,msg:'Sai mã'}; var th=String(p.thang||fmtTZ_(new Date(),TZ,'yyyy-MM')), ng=nguongXN(), o={}, nv={};
  rows('NhanVien').forEach(function(n){ nv[up(n.MaNV)]=n; }); var lay=function(m){ m=up(m); return o[m]=o[m]||{MaNV:m, Ten:nv[m]?tenNgan(nv[m].Ten):m, NhacNho:0, TreCoPhep:0, TreKhongPhep:0, PhutTre:0, VeSom:0, QuenCham:0, VangCoPhep:0, VangKhongPhep:0}; };
  ccRows().filter(function(r){ return dateKey(r.Ngay).slice(0,7)===th && tk.duocCS(r.MaCS); }).forEach(function(r){ var x=lay(r.MaNV), tre=+r.TreMin||0;
    if(tre>ng.nn){ x.PhutTre+=tre; if(/Có phép|Có lý do/.test(String(r.CoPhep||'')) || /theo lịch/.test(String(r.Cach||''))) x.TreCoPhep++; else x.TreKhongPhep++; } else if(tre>0) x.NhacNho++;
    if(r.Ra && toMin(hhmm(r.CaKT))-toMin(hhmm(r.Ra))>ng.som) x.VeSom++;
    if(String(r.KhaiLoai)==='bao-quen' || /quên/.test(String(r.Cach||'')) || (!r.Ra && dateKey(r.Ngay)<fmtDate(new Date()))) x.QuenCham++; });
  rows_('Vang').filter(function(v){ return dateKey(v.Ngay).slice(0,7)===th && tk.duocCS(v.MaCS); }).forEach(function(v){ var x=lay(v.MaNV); if(v.CoPhep==='Có phép') x.VangCoPhep++; else x.VangKhongPhep++; });
  return {ok:true, thang:th, list:Object.keys(o).map(function(k){ return o[k]; }).sort(function(a,b){ return (b.TreKhongPhep*10+b.VangKhongPhep*20+b.QuenCham)-(a.TreKhongPhep*10+a.VangKhongPhep*20+a.QuenCham); })}; }

/* ---------- nhắc duyệt cuối ngày ---------- */
function nhacDuyetCuoiNgay(){ if(String(cfg('NHAC_DUYET'))==='Không' || !cfg('TG_TOKEN')) return; var now=new Date(), gio=parseInt(fmtTZ_(now,TZ,'HH'),10), today=fmtDate(now);
  if(gio!==(+cfg('NHAC_DUYET_GIO')||22) || String(cfg('NHAC_DUYET_DA'))===today) return; setCfg('NHAC_DUYET_DA', today);
  var dem={}; ccRows().forEach(function(r){ if(String(r.TrangThai)==='Chờ xác nhận' || (String(r.TrangThai)==='Đang làm' && dateKey(r.Ngay)<today)) dem[r.MaCS]=(dem[r.MaCS]||0)+1; });
  rows_('XinPhep').concat(rows_('BaoQuen')).forEach(function(q){ if(String(q.TrangThai)==='Chờ') dem[q.MaCS]=(dem[q.MaCS]||0)+1; });
  var ten={}; rows('CoSo').forEach(function(s){ ten[s.MaCS]=s.TenCS; });
  Object.keys(dem).forEach(function(cs){ tgGui(tgChatCho(cs), '🔔 '+(ten[cs]||cs)+': còn '+dem[cs]+' mục chưa duyệt (giờ công / xin phép / báo quên).\n→ Vào tab Xác nhận giờ để duyệt trong hôm nay.'); }); }

/* ---------- quyền sửa đầy đủ cho admin / quản lý có quyền điều chỉnh giờ ---------- */
function xnSheet_(){ ensureCols('ChamCong',XN_COT); var sh=SS.getSheetByName('ChamCong'); return {sh:sh, h:sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0]}; }
function khoaNgay_(tk, d){ if(thangDaChot(d.slice(0,7))) return 'Tháng đã chốt lương'; if(dotDaDuyetNgay(d) && tk.role!=='admin') return 'Đợt đã khoá sổ, chỉ admin sửa'; return ''; }
// Quản lý thêm lượt chấm công thay nhân viên (quên điện thoại, máy hỏng…)
function xnThemLuot(p){ var tk=tkDayDu(p.pin); if(!tk) return {ok:false,msg:'Sai mã'}; if(!tk.suaGio) return {ok:false,msg:'Thêm lượt cần quyền điều chỉnh giờ'};
  var n=nvByMa(p.ma); if(!n) return {ok:false,msg:'Không tìm thấy mã nhân viên'}; var cs=up(p.cs||''), ngay=String(p.ngay||'').slice(0,10), v=hhmm(p.vao), ra=hhmm(p.ra);
  if(!rows('CoSo').some(function(s){ return s.MaCS===cs; })) return {ok:false,msg:'Chọn quán'}; if(!tk.duocCS(cs)) return {ok:false,msg:'Không thuộc quán của bạn'};
  if(!/^\d{4}-\d{2}-\d{2}$/.test(ngay) || ngay>fmtDate(new Date())) return {ok:false,msg:'Chọn ngày đã làm'}; if(!v || !ra || toMin(ra)<=toMin(v)) return {ok:false,msg:'Giờ ra phải sau giờ vào'};
  if(!String(p.lyDo||'').trim()) return {ok:false,msg:'Ghi lý do'}; var k=khoaNgay_(tk, ngay); if(k) return {ok:false,msg:k};
  var trung=ccRows().some(function(r){ return up(r.MaNV)===up(n.MaNV) && dateKey(r.Ngay)===ngay && toMin(hhmm(r.Vao))<toMin(ra) && toMin(hhmm(r.Ra)||'23:59')>toMin(v); });
  if(trung) return {ok:false,msg:'Đã có lượt chấm công trùng giờ này – dùng Sửa ở lượt đó'};
  var g=gioGiua(v,ra); if(g>16) return {ok:false,msg:'Số giờ không hợp lệ'}; var x=xnSheet_(), ai=tk.ten||'Quản lý';
  var o={ID:'QL-'+fmtTZ_(new Date(),TZ,'yyMMddHHmmss')+'-'+n.MaNV, Ngay:ngay, MaNV:String(n.MaNV), Ten:tenNgan(n.Ten), MaCS:cs, MaCa:'KHAC', CaBD:v, CaKT:ra, ViTri:n.ViTri, Vao:v, Ra:ra, TreMin:0, GioThuc:g,
    KhaiLoai:'quan-ly-them', KhaiGio:g, TrangThai:'Đã xác nhận', GioTinh:g, XacNhanBoi:ai, XacNhanLuc:new Date(), Cach:'quản lý thêm', LyDoSua:String(p.lyDo), CanhBao:'Quản lý thêm thay nhân viên'};
  x.sh.appendRow(x.h.map(function(c){ return o[c]!==undefined?o[c]:''; })); ghiNhatKy(ai, ngay.slice(0,7), n.MaNV, 'Thêm lượt chấm công '+ngay+' '+cs, '', v+'–'+ra+' ('+p.lyDo+')'); return {ok:true, id:o.ID, gio:g}; }
// Xoá lượt chấm nhầm (chấm thử, chấm trùng) – chỉ admin, có nhật ký
function xnXoaLuot(p){ var tk=tkDayDu(p.pin); if(!tk || tk.role!=='admin') return {ok:false,msg:'Chỉ admin xoá được lượt chấm công'}; if(!String(p.lyDo||'').trim()) return {ok:false,msg:'Ghi lý do xoá'};
  var r=ccRows().filter(function(x){ return String(x.ID)===String(p.id); })[0]; if(!r) return {ok:false,msg:'Không tìm thấy'}; var d=dateKey(r.Ngay); if(thangDaChot(d.slice(0,7))) return {ok:false,msg:'Tháng đã chốt lương'};
  SS.getSheetByName('ChamCong').deleteRow(r._r); ghiNhatKy('Admin', d.slice(0,7), r.MaNV, 'Xoá lượt chấm công '+d+' '+r.MaCS, hhmm(r.Vao)+'–'+(hhmm(r.Ra)||'?')+' · '+(+r.GioTinh||0)+'h', 'đã xoá: '+p.lyDo); return {ok:true}; }
// Đổi quán của lượt (quét nhầm mã QR quán khác) – lương tính cho đúng quán
function xnDoiQuan(p){ var tk=tkDayDu(p.pin); if(!tk) return {ok:false,msg:'Sai mã'}; if(!tk.suaGio) return {ok:false,msg:'Đổi quán cần quyền điều chỉnh giờ'};
  var cs=up(p.cs||''); if(!rows('CoSo').some(function(s){ return s.MaCS===cs; })) return {ok:false,msg:'Chọn quán'};
  var r=ccRows().filter(function(x){ return String(x.ID)===String(p.id); })[0]; if(!r) return {ok:false,msg:'Không tìm thấy'}; if(!tk.duocCS(r.MaCS) || !tk.duocCS(cs)) return {ok:false,msg:'Không thuộc quán của bạn'};
  var k=khoaNgay_(tk, dateKey(r.Ngay)); if(k) return {ok:false,msg:k}; var x=xnSheet_(); x.sh.getRange(r._r, x.h.indexOf('MaCS')+1).setValue(cs);
  ghiNhatKy(tk.ten||'Quản lý', dateKey(r.Ngay).slice(0,7), r.MaNV, 'Đổi quán lượt '+dateKey(r.Ngay), r.MaCS, cs+(p.lyDo?' – '+p.lyDo:'')); return {ok:true}; }
// Bỏ đánh dấu vắng (đánh nhầm)
function xnBoVang(p){ var _q=khongQuyen(p.pin,'duyet',2); if(_q) return _q; var tk=tkDayDu(p.pin); if(!tk) return {ok:false,msg:'Sai mã'}; var sh=SS.getSheetByName('Vang'); if(!sh) return {ok:false,msg:'Không tìm thấy'};
  var r=rows('Vang').filter(function(x){ return up(x.MaNV)===up(p.ma) && dateKey(x.Ngay)===String(p.ngay); })[0]; if(!r) return {ok:false,msg:'Không tìm thấy'};
  if(!tk.duocCS(r.MaCS)) return {ok:false,msg:'Không thuộc quán của bạn'}; var k=khoaNgay_(tk, String(p.ngay)); if(k) return {ok:false,msg:k};
  sh.deleteRow(r._r); return {ok:true}; }
// Mở khoá đợt đã khoá sổ – chỉ admin
function moKhoaDot(p){ memoXoa_('DuyetDot'); var tk=tkDayDu(p.pin); if(!tk || tk.role!=='admin') return {ok:false,msg:'Chỉ admin'}; if(thangDaChot(thKey_(p.thang))) return {ok:false,msg:'Tháng đã chốt lương – mở chốt tháng trước'};
  var sh=SS.getSheetByName('DuyetDot'); if(!sh) return {ok:false,msg:'Đợt chưa khoá'}; var r=rows('DuyetDot').filter(function(x){ return thKey_(x.Thang)===thKey_(p.thang) && +x.Dot===+p.dot; })[0]; if(!r) return {ok:false,msg:'Đợt chưa khoá'};
  sh.deleteRow(r._r); ghiNhatKy('Admin', String(p.thang), '', 'Mở khoá đợt '+p.dot, 'đã khoá', 'mở'); memoXoa_('DuyetDot'); return {ok:true}; }
// Lịch sử tăng lương: xoá lần gần nhất (bấm nhầm) → trả mức lương về như trước
function xoaLanTangLuong(p){ _LSL=null; if(authRole(p.pin)!=='admin') return {ok:false,msg:'Chỉ admin'}; var n=nvByMa(p.maNV); if(!n) return {ok:false,msg:'Không tìm thấy'};
  var codinh=String(n.KieuLuong||'')==='Cố định', ls=lsLuong(n, codinh); if(!ls.length) return {ok:false,msg:'Chưa có lần tăng lương nào'}; var cuoi=ls[ls.length-1];
  var sh=SS.getSheetByName('NhanVien'), h=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0]; sh.getRange(n._r, h.indexOf(codinh?'LuongCoBan':'LuongGio')+1).setValue(cuoi.Tu);
  SS.getSheetByName('LichSuLuong').deleteRow(cuoi._r); ghiNhatKy('Admin','',n.MaNV,'Xoá lần tăng lương '+dateKey(cuoi.Ngay), cuoi.Tu+' → '+cuoi.Len, 'trả về '+cuoi.Tu); _LSL=null; return {ok:true, ve:+cuoi.Tu}; }

/* ---------- Danh mục sửa trong Cài đặt (vị trí, chức vụ, lý do mẫu, mẫu tin nhắn, chú thích phiếu lương) ---------- */
var DM_MAC_DINH={DS_VI_TRI:'Quản lý|Pha chế|Phục vụ|Thu ngân|Rửa ly|Bảo vệ|Support', DS_CHUC_VU:'Trưởng ca|Phó quản lý|Quản lý',
  LY_DO_RA_CA:'Có mặt đúng giờ, chấm muộn (mã QR / mạng / hết pin)|Đã xin phép quản lý|Xe hư / lủng lốp|Ốm / sức khoẻ|Việc gia đình|Kẹt xe / mưa lớn|Đông khách, quản lý giữ lại|Quán vắng, quản lý cho về|Khác',
  LY_DO_XIN_PHEP:'Ốm / sức khoẻ|Việc gia đình|Xe hư|Đi học / thi|Khác',
  MAU_TIN_MA:'Chào {ten}, mã nhân viên Ncafe của bạn là {ma}.\n• Chấm công: quét mã QR dán ở quầy, nhập mã {ma} (lần đầu), chụp ảnh, bấm Vào ca / Ra ca.\n• Xem lịch, đăng ký bận, xin phép, báo quên chấm: {link_lich}\n• Xem giờ công đã duyệt: {link_giocong}\n• Làm khảo sát nhân viên: {link_khaosat}',
  GHI_CHU_PHIEU:'Lương trả ngày 3 tháng sau. Thắc mắc về giờ làm báo quản lý trước ngày chốt.'};
function dm(key){ var v=String(cfg(key)||''); return v||DM_MAC_DINH[key]; }
function dmDs(key){ return dm(key).split('|').map(function(s){ return s.trim(); }).filter(Boolean); }
function dsViTri(){ return dmDs('DS_VI_TRI'); }
function danhMuc(p){ if(authRole(p.pin)!=='admin') return {ok:false,msg:'Chỉ admin'};
  return {ok:true, viTri:dsViTri(), chucVu:dmDs('DS_CHUC_VU'), lyDoRa:dmDs('LY_DO_RA_CA'), lyDoXP:dmDs('LY_DO_XIN_PHEP'), mauTin:dm('MAU_TIN_MA'), ghiChuPhieu:dm('GHI_CHU_PHIEU')}; }
function luuDanhMuc(p){ if(authRole(p.pin)!=='admin') return {ok:false,msg:'Chỉ admin'};
  var sach=function(a){ var o=[]; (a||[]).forEach(function(s){ s=String(s||'').replace(/\|/g,'/').trim(); if(s && o.indexOf(s)<0) o.push(s); }); return o; };
  var vt=sach(p.viTri), cv=sach(p.chucVu), ra=sach(p.lyDoRa), xp=sach(p.lyDoXP); if(!vt.length) return {ok:false,msg:'Cần ít nhất 1 vị trí'};
  var dang=rows('NhanVien').filter(dangLam);
  var boVT=dsViTri().filter(function(v){ return vt.indexOf(v)<0 && dang.some(function(n){ return n.ViTri===v; }); }); if(boVT.length) return {ok:false,msg:'Còn nhân viên đang ở vị trí: '+boVT.join(', ')+'. Đổi vị trí cho họ trước rồi mới bỏ.'};
  var boCV=dmDs('DS_CHUC_VU').filter(function(v){ return cv.indexOf(v)<0 && dang.some(function(n){ return n.ChucVu===v; }); }); if(boCV.length) return {ok:false,msg:'Còn nhân viên đang giữ chức vụ: '+boCV.join(', ')};
  var kv={DS_VI_TRI:vt.join('|'), DS_CHUC_VU:cv.join('|'), LY_DO_RA_CA:(ra.length?ra:dmDs('LY_DO_RA_CA')).join('|'), LY_DO_XIN_PHEP:(xp.length?xp:dmDs('LY_DO_XIN_PHEP')).join('|'),
    MAU_TIN_MA:String(p.mauTin||'').trim()||DM_MAC_DINH.MAU_TIN_MA, GHI_CHU_PHIEU:String(p.ghiChuPhieu==null?dm('GHI_CHU_PHIEU'):p.ghiChuPhieu).trim()};
  var doi=0; Object.keys(kv).forEach(function(k){ var cu=dm(k); if(cu!==kv[k]){ setCfg(k, kv[k]); ghiNhatKy('Admin','','','Danh mục: '+k, cu, kv[k]); doi++; } }); _CFG=null; return {ok:true, doi:doi}; }

/* ---------- Nạp / xoá dữ liệu giờ công (tháng cũ, sửa dữ liệu chấm sai) – chỉ admin, có nhật ký ---------- */
function ngayNap_(s){ s=String(s||'').trim(); var m=s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/); if(m) return m[1]+'-'+('0'+m[2]).slice(-2)+'-'+('0'+m[3]).slice(-2);
  m=s.match(/^(\d{1,2})[\/.-](\d{1,2})(?:[\/.-](\d{2,4}))?$/); if(!m) return ''; var y=m[3]?(m[3].length===2?'20'+m[3]:m[3]):fmtTZ_(new Date(),TZ,'yyyy'); return y+'-'+('0'+m[2]).slice(-2)+'-'+('0'+m[1]).slice(-2); }
function gioNap_(s){ s=String(s||'').trim().toLowerCase().replace(/\s/g,'').replace('h',':').replace(/:$/,':00'); var m=s.match(/^(\d{1,2})(?::(\d{2}))?$/); if(!m) return ''; var h=+m[1], mi=+(m[2]||0); if(h>23||mi>59) return ''; return ('0'+h).slice(-2)+':'+('0'+mi).slice(-2); }
var _NAPNV=null, _NAPCS=null;   // đọc danh sách nhân viên / quán 1 lần cho cả lượt nạp (dán vài trăm dòng không bị chậm)
function timNV_(x){ x=String(x||'').trim(); if(!x) return null; if(!_NAPNV) _NAPNV=rows('NhanVien'); var n=_NAPNV.filter(function(k){ return up(k.MaNV)===up(x); })[0]; if(n) return n; var L=_NAPNV.filter(function(k){ return tenNgan(k.Ten).toLowerCase()===x.toLowerCase() || String(k.Ten).toLowerCase()===x.toLowerCase() || String(k.Ten).toLowerCase().indexOf('('+x.toLowerCase()+')')>-1; }); return L.length===1?L[0]:(L.length>1?'trung':null); }
function timCS_(x){ x=String(x||'').trim(); if(!_NAPCS) _NAPCS=rows('CoSo'); var L=_NAPCS; var c=L.filter(function(s){ return up(s.MaCS)===up(x) || String(s.TenCS).toLowerCase()===x.toLowerCase(); })[0]; return c?c.MaCS:''; }
// Tách 1 dòng dán từ Excel: Ngày | Mã hoặc tên | Quán | Vào | Ra   (hoặc: Ngày | Mã | Quán | Số giờ | Buổi)
function tachDongNap_(line){ var c=line.indexOf('\t')>-1?line.split('\t'):(line.indexOf(';')>-1?line.split(';'):line.split(',')); c=c.map(function(s){ return String(s).trim(); });
  if(c.length===4 && /^\d{1,2}[:h]?\d{0,2}\s*[-–]\s*\d{1,2}[:h]?\d{0,2}$/.test(c[3])){ var t=c[3].split(/[-–]/); c=[c[0],c[1],c[2],t[0],t[1]]; } return c; }
var BUOI_NAP={'sáng':'06:30','sang':'06:30','trưa':'11:00','trua':'11:00','chiều':'12:00','chieu':'12:00','tối':'17:00','toi':'17:00'};
function kiemDongNap_(c, i){ var o={dong:i+1, goc:c.join(' | ')}; var ngay=ngayNap_(c[0]); if(!ngay){ o.loi='Ngày không đọc được'; return o; }
  var n=timNV_(c[1]); if(n==='trung'){ o.loi='Tên "'+c[1]+'" trùng nhiều người – dùng mã NV'; return o; } if(!n){ o.loi='Không tìm thấy nhân viên "'+c[1]+'"'; return o; }
  var cs=timCS_(c[2]); if(!cs){ o.loi='Không tìm thấy quán "'+c[2]+'"'; return o; }
  var v=gioNap_(c[3]), r=gioNap_(c[4]), uoc=false;
  if(!(v && r)){ var g=+String(c[3]||'').replace(',','.'); if(!(g>0 && g<=16)){ o.loi='Thiếu giờ vào – ra hoặc số giờ'; return o; }
    // Sáng: từ giờ mở cửa + số giờ · Trưa / chiều: từ 12:00 + số giờ · Tối: kết thúc lúc đóng cửa, lùi lại số giờ (VD tối 8h ở TP = 14:30–22:30)
    var q=(_NAPCS||[]).filter(function(s){ return s.MaCS===cs; })[0]||{}, mo=hhmm(q.GioMo)||'06:30', dong=hhmm(q.GioDong)||'22:30', b=String(c[4]||'').toLowerCase().trim(), phut=Math.round(g*60);
    if(/^t[ốo]i/.test(b)){ r=dong; v=hh_(Math.max(0,toMin(dong)-phut)); } else if(/^(tr[ưu]a|chi[ềe]u)/.test(b)){ v='12:00'; r=hh_(toMin(v)+phut); } else { v=mo; r=hh_(toMin(v)+phut); } uoc=true; }
  if(toMin(r)<=toMin(v)){ o.loi='Giờ ra phải sau giờ vào'; return o; } if(gioGiua(v,r)>16){ o.loi='Quá 16 giờ'; return o; }
  o.ngay=ngay; o.ma=String(n.MaNV); o.ten=tenNgan(n.Ten); o.cs=cs; o.vao=v; o.ra=r; o.gio=gioGiua(v,r); o.uoc=uoc; return o; }
function hh_(m){ m=Math.min(m,23*60+59); return ('0'+Math.floor(m/60)).slice(-2)+':'+('0'+(m%60)).slice(-2); }
// Ghi các dòng đã kiểm: bỏ qua nếu nhân viên đã có lượt trùng giờ hôm đó, hoặc thay thế nếu chọn
function ghiNap_(L, thayThe, nguon){ var x=xnSheet_(), cc=ccRows(), cm=caMap(), xoa=[], them=[], boQua=[], chot={};
  L.forEach(function(o){ var th=o.ngay.slice(0,7); if(chot[th]===undefined) chot[th]=thangDaChot(th); if(chot[th]){ boQua.push(o.dong+': tháng đã chốt lương'); return; }
    var trung=cc.filter(function(r){ return up(r.MaNV)===o.ma && dateKey(r.Ngay)===o.ngay && xoa.indexOf(r._r)<0 && toMin(hhmm(r.Vao))<toMin(o.ra) && toMin(hhmm(r.Ra)||'23:59')>toMin(o.vao); });
    if(trung.length && !thayThe){ boQua.push(o.dong+': '+o.ten+' '+o.ngay.split('-').reverse().join('/')+' đã có lượt chấm công'); return; }
    trung.forEach(function(r){ xoa.push(r._r); });
    var ca=Object.keys(cm).map(function(k){ return cm[k]; }).filter(function(c){ return c.GioBD===o.vao && c.GioKT===o.ra; })[0], n=timNV_(o.ma);
    them.push({ID:'NAP-'+o.ngay.replace(/-/g,'')+'-'+o.ma+'-'+o.vao.replace(':',''), Ngay:o.ngay, MaNV:o.ma, Ten:o.ten, MaCS:o.cs, MaCa:ca?ca.MaCa:'KHAC', CaBD:o.vao, CaKT:o.ra, ViTri:n?n.ViTri:'', Vao:o.vao, Ra:o.ra, TreMin:0, GioThuc:o.gio,
      KhaiLoai:'nap', KhaiGio:o.gio, TrangThai:'Đã xác nhận', GioTinh:o.gio, XacNhanBoi:'Admin', XacNhanLuc:new Date(), Cach:nguon, CanhBao:'Dữ liệu nạp'+(o.uoc?' (giờ vào/ra ước tính theo số giờ)':'')+(o.ghi?' · '+o.ghi:'')}); });
  xoa.sort(function(a,b){ return b-a; }).forEach(function(r){ x.sh.deleteRow(r); });
  if(them.length){ var v=them.map(function(o){ return x.h.map(function(k){ return o[k]!==undefined?o[k]:''; }); }); var start=x.sh.getLastRow()+1; x.sh.getRange(start,1,v.length,x.h.length).setValues(v); }
  return {them:them.length, thayThe:xoa.length, boQua:boQua}; }
function napGioCong(p){ if(authRole(p.pin)!=='admin') return {ok:false,msg:'Chỉ admin'}; _NAPNV=null; _NAPCS=null;
  var dong=String(p.text||'').split(/\r?\n/).map(function(s){ return s.replace(/\s+$/,''); }).filter(function(s){ return s.trim(); });
  var kq=dong.map(function(s,i){ return kiemDongNap_(tachDongNap_(s), i); }), tot=kq.filter(function(o){ return !o.loi; }), loi=kq.filter(function(o){ return o.loi && !(o.dong===1 && o.loi==='Ngày không đọc được'); });
  var tong=tot.reduce(function(a,o){ return a+o.gio; },0); if(p.thuNghiem) return {ok:true, hopLe:tot.length, loi:loi.map(function(o){ return 'Dòng '+o.dong+': '+o.loi+' ('+o.goc+')'; }), tongGio:Math.round(tong*100)/100, xem:tot.slice(0,8)};
  if(loi.length) return {ok:false, msg:'Còn '+loi.length+' dòng lỗi – bấm Kiểm tra để xem và sửa trước khi nạp'};
  var g=ghiNap_(tot, !!p.thayThe, 'nạp tay'); ghiNhatKy('Admin','','','Nạp giờ công (dán bảng)','',g.them+' lượt'+(g.thayThe?', thay '+g.thayThe+' lượt cũ':'')+(g.boQua.length?', bỏ qua '+g.boQua.length:'')); return {ok:true, them:g.them, thayThe:g.thayThe, boQua:g.boQua}; }
function napTuLich(p){ if(authRole(p.pin)!=='admin') return {ok:false,msg:'Chỉ admin'}; _NAPNV=null; _NAPCS=null; var tu=String(p.tu||''), den=String(p.den||''), css=(p.cs||[]).map(up); if(!tu||!den||den<tu) return {ok:false,msg:'Chọn khoảng ngày'};
  _LICH=null; var cm=caMap(), L=lichDaXep().filter(function(l){ return l.Ngay>=tu && l.Ngay<=den && (!css.length || css.indexOf(l.MaCS)>-1); });
  var ds=L.map(function(l,i){ var c=caTheoMa(cm,l.MaCa); if(!c) return {dong:i+1, loi:'Không có ca '+l.MaCa}; var n=nvByMa(l.MaNV); return {dong:i+1, ngay:l.Ngay, ma:l.MaNV, ten:n?tenNgan(n.Ten):l.MaNV, cs:l.MaCS, vao:c.GioBD, ra:c.GioKT, gio:gioGiua(c.GioBD,c.GioKT), uoc:false}; }).filter(function(o){ return !o.loi; });
  if(p.thuNghiem) return {ok:true, hopLe:ds.length, tongGio:Math.round(ds.reduce(function(a,o){ return a+o.gio; },0)*100)/100, nguoi:Object.keys(ds.reduce(function(a,o){ a[o.ma]=1; return a; },{})).length};
  var g=ghiNap_(ds, !!p.thayThe, 'nạp từ lịch'); ghiNhatKy('Admin','','','Nạp giờ công từ lịch '+tu+' → '+den+(css.length?' ('+css.join(',')+')':''),'',g.them+' lượt'+(g.thayThe?', thay '+g.thayThe:'')+(g.boQua.length?', bỏ qua '+g.boQua.length:'')); return {ok:true, them:g.them, thayThe:g.thayThe, boQua:g.boQua}; }
// Xoá giờ công theo khoảng ngày / quán / loại (chấm bằng app, đã nạp, tất cả)
function xoaGioCong(p){ if(authRole(p.pin)!=='admin') return {ok:false,msg:'Chỉ admin'}; var tu=String(p.tu||''), den=String(p.den||''), css=(p.cs||[]).map(up), loai=p.loai||'app'; if(!tu||!den||den<tu) return {ok:false,msg:'Chọn khoảng ngày'};
  var L=ccRows().filter(function(r){ var d=dateKey(r.Ngay), nap=String(r.KhaiLoai)==='nap'; return d>=tu && d<=den && (!css.length || css.indexOf(up(r.MaCS))>-1) && (loai==='tatca' || (loai==='nap'?nap:!nap)); });
  var chot=L.filter(function(r){ return thangDaChot(dateKey(r.Ngay).slice(0,7)); }); if(chot.length) return {ok:false,msg:'Có '+chot.length+' lượt thuộc tháng đã chốt lương – mở chốt trước'};
  var gio=Math.round(L.reduce(function(a,r){ return a+(+r.GioTinh||0); },0)*100)/100; if(p.thuNghiem) return {ok:true, soLuot:L.length, gio:gio};
  if(!String(p.lyDo||'').trim()) return {ok:false,msg:'Ghi lý do xoá'}; var sh=SS.getSheetByName('ChamCong'); L.map(function(r){ return r._r; }).sort(function(a,b){ return b-a; }).forEach(function(r){ sh.deleteRow(r); });
  ghiNhatKy('Admin', tu.slice(0,7), '', 'Xoá giờ công '+tu+' → '+den+(css.length?' ('+css.join(',')+')':'')+' – '+({app:'chấm bằng app',nap:'đã nạp',tatca:'tất cả'})[loai], L.length+' lượt · '+gio+'h', 'đã xoá: '+p.lyDo); return {ok:true, soLuot:L.length, gio:gio}; }

/* ---------- BÁO HƯ HỎNG: nhân viên / quản lý báo, quản lý xử lý, báo nhóm Telegram quán ---------- */
var BH_COT=['ID','Luc','MaCS','MaNV','Ten','Mon','MoTa','MucDo','Anh','TrangThai','XuLyBoi','GhiChuXuLy','LucXong'];
function bhLuu_(cs, ma, ten, p){ var mon=String(p.mon||'').trim(), mota=String(p.moTa||'').trim(); if(!mon) return {ok:false,msg:'Ghi món / thiết bị bị hư'};
  if(!rows('CoSo').some(function(s){ return s.MaCS===cs; })) return {ok:false,msg:'Chọn quán'};
  var cu=trungDong_('BaoHong',function(x){ return up(x.MaCS)===up(cs) && String(x.MaNV||'')===String(ma||'') && String(x.Ten||'')===String(ten||'') && String(x.Mon).trim()===mon.slice(0,80) && String(x.MoTa||'').trim()===mota.slice(0,400) && ganDay_(x.Luc,10); });
  if(cu) return {ok:true, id:String(cu.ID), trung:true, msg:'Đã báo trước đó.'};
  var id=idMoi('H'), anh=''; try{ if(p.photo) anh=luuAnh(p.photo, 'hong-'+id)||''; }catch(e){}
  var muc=p.mucDo==='Gấp'?'Gấp':'Bình thường';
  shXN('BaoHong',BH_COT).appendRow([id, new Date(), cs, ma, ten, mon.slice(0,80), mota.slice(0,400), muc, anh, 'Mới', '', '', '']);
  var tenCS=(rows('CoSo').filter(function(s){ return s.MaCS===cs; })[0]||{}).TenCS||cs;
  try{ tgGuiAnh(tgChatCho(cs), (muc==='Gấp'?'🚨':'🛠')+' BÁO HƯ HỎNG · '+tenCS+(muc==='Gấp'?' · GẤP':'')+'\n'+mon+(mota?': '+mota:'')+'\nNgười báo: '+ten+(ma?' ('+ma+')':'')+'\n→ Xử lý ở tab Báo hư hỏng', p.photo); }catch(e){}
  return {ok:true, id:id}; }
function bhDs_(loc){ return (SS.getSheetByName('BaoHong')?rows('BaoHong'):[]).filter(loc).map(function(r){ return {ID:String(r.ID), Luc:(r.Luc instanceof Date)?fmtTZ_(r.Luc,TZ,'dd/MM HH:mm'):String(r.Luc||''), MaCS:r.MaCS, MaNV:String(r.MaNV||''), Ten:r.Ten, Mon:r.Mon, MoTa:r.MoTa, MucDo:r.MucDo, Anh:r.Anh||'', TrangThai:r.TrangThai, XuLyBoi:r.XuLyBoi||'', GhiChuXuLy:r.GhiChuXuLy||'', LucXong:(r.LucXong instanceof Date)?fmtTZ_(r.LucXong,TZ,'dd/MM HH:mm'):String(r.LucXong||'')}; }).reverse(); }
// nhân viên (trang Lịch của tôi)
function baoHong(p){ var k=nvTK(p); if(k.loi) return {ok:false,msg:k.loi}; var n=k.nv; return bhLuu_(up(p.cs||n.CoSoChinh||''), String(n.MaNV), tenNgan(n.Ten), p); }
function dsBaoHongNV(p){ var k=nvTK(p); if(k.loi) return {ok:false,msg:k.loi}; var n=k.nv, cs=up(p.cs||n.CoSoChinh||''), han=new Date(new Date().getTime()-30*864e5);
  return {ok:true, cs:cs, stores:rows('CoSo').map(function(s){ return {MaCS:s.MaCS,TenCS:s.TenCS}; }), list:bhDs_(function(r){ return up(r.MaCS)===cs && (String(r.TrangThai)!=='Đã xong' || (r.LucXong instanceof Date && r.LucXong>han)); }).slice(0,30)}; }
// quản lý / admin (tab Báo hư hỏng)
function dsBaoHong(p){ var _q=khongQuyen(p.pin,'hong',1); if(_q) return _q; var tk=tkDayDu(p.pin); if(!tk) return {ok:false,msg:'Sai mã'}; var cs=up(p.cs||''), tt=String(p.tt||'');
  return {ok:true, list:bhDs_(function(r){ return tk.duocCS(r.MaCS) && (!cs || up(r.MaCS)===cs) && (!tt || (tt==='chua'?String(r.TrangThai)!=='Đã xong':String(r.TrangThai)===tt)); }).slice(0,200)}; }
function baoHongQL(p){ var _q=khongQuyen(p.pin,'hong',2); if(_q) return _q; var tk=tkDayDu(p.pin); if(!tk) return {ok:false,msg:'Sai mã'}; var cs=up(p.cs||''); if(!tk.duocCS(cs)) return {ok:false,msg:'Không thuộc quán của bạn'}; return bhLuu_(cs, '', tk.ten||(tk.role==='admin'?'Admin':'Quản lý'), p); }
function capNhatBaoHong(p){ var _q=khongQuyen(p.pin,'hong',2); if(_q) return _q; var tk=tkDayDu(p.pin); if(!tk) return {ok:false,msg:'Sai mã'}; var sh=SS.getSheetByName('BaoHong'); if(!sh) return {ok:false,msg:'Không tìm thấy'};
  var r=rows('BaoHong').filter(function(x){ return String(x.ID)===String(p.id); })[0]; if(!r) return {ok:false,msg:'Không tìm thấy'}; if(!tk.duocCS(r.MaCS)) return {ok:false,msg:'Không thuộc quán của bạn'};
  var tt=['Mới','Đang xử lý','Đã xong'].indexOf(p.tt)>-1?p.tt:'Đang xử lý', h=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0], set=function(k,v){ sh.getRange(r._r,h.indexOf(k)+1).setValue(v); }, ai=tk.ten||(tk.role==='admin'?'Admin':'Quản lý');
  set('TrangThai',tt); set('XuLyBoi',ai); if(p.ghiChu!==undefined) set('GhiChuXuLy',String(p.ghiChu||'').slice(0,300)); set('LucXong', tt==='Đã xong'?new Date():'');
  if(tt==='Đã xong'){ try{ tgGui(tgChatCho(r.MaCS), '✅ ĐÃ SỬA XONG · '+r.Mon+(p.ghiChu?'\n'+p.ghiChu:'')+'\n('+ai+')'); }catch(e){} }
  return {ok:true}; }

/* ---------- NẠP TỪ FILE CHẤM CÔNG CŨ & BẢNG LƯƠNG TRÊN DRIVE (app tự mở file, admin chỉ bấm Xem trước → Nạp) ---------- */
var NAP_FILE_MD={FILE_CC_CFMH:'1OaoZndDhLiGMIzEyxlSekSZHD7iigvvRIkvdSxALg14', FILE_CC_LDD:'10hCjD_HZsgTnS5wX3VdxqqU7TBoBHxXoum5jEqxzxjQ', FILE_CC_TNV:'15XIfvP2GKjkjrFKS0qX0RATQNMwyHTEib8kU6U9yeeo', FILE_BANG_LUONG:'1_ekFSqkyGV_joPBwEePm14-CWElqXKPDplVSDfJuD3s'};
function fileId_(k){ return String(cfg(k)||NAP_FILE_MD[k]||''); }
function tenTho_(s){ return String(s||'').toLowerCase().replace(/[.]/g,' ').replace(/\s+/g,' ').trim(); }
function tenBoDau_(s){ return tenTho_(String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D')); }
// Tên trong file cũ → mã. Đã xác nhận với chủ quán: Trung (file CFMH) = 316, Sương = 318, Dũng = 323, Nhi1 = 321, C. Huệ = 407;
// H.Nguyên, Nhã, Sang là người khác → cấp mã mới để trống; Thu Hiền bỏ qua.
var NAP_SUA_TEN={CFMH:{'trung':'316','sương':'318','dũng':'323','nhi1':'321','h nguyên':'+H.Nguyên','nhã':'+Nhã','sang':'+Sang'},
  LDD:{'c huệ':'407','thu hiền':'-'}, TNV:{}, LUONG:{'trung':'316','sương':'318','dũng':'323','nhi1':'321','h nguyên':'+H.Nguyên','nhã':'+Nhã','sang':'+Sang','thu hiền':'-'}};
function maTuTen_(ten, nguon, NV){ var k=tenTho_(ten); if(!k) return {bo:true};
  var o=(NAP_SUA_TEN[nguon]||{})[k]; if(o==='-') return {bo:true};
  if(o && o.charAt(0)==='+'){ var ex=NV.filter(function(n){ return tenTho_(tenNgan(n.Ten))===tenTho_(o.slice(1)); })[0]; return ex?{ma:String(ex.MaNV)}:{tao:o.slice(1)}; }
  if(o) return {ma:o};
  var nhom=nguon==='LDD'?['LDD']:['TP','DD','TD','TNV'], uu=function(c){ if(c.length<2) return c; var d=c.filter(function(n){ return nhom.indexOf(up(n.CoSoChinh))>-1; }); return d.length?d:c; };
  var day=function(n){ var t=String(n.Ten||''), i=t.indexOf('('); return i>-1?t.slice(i+1).replace(')',''):''; };
  var thu=[function(n){ return tenTho_(tenNgan(n.Ten))===k; }, function(n){ var f=tenTho_(day(n)); return f && k.length>=4 && (f===k || f.slice(-k.length-1)===' '+k); },
    function(n){ return tenBoDau_(tenNgan(n.Ten))===tenBoDau_(k); }, function(n){ var w=k.split(' ').pop(); return k.indexOf(' ')>0 && tenTho_(tenNgan(n.Ten))===w; }];
  for(var i=0;i<thu.length;i++){ var c=uu(NV.filter(thu[i])); if(c.length===1) return {ma:String(c[0].MaNV)}; if(c.length>1) return {loi:'"'+ten+'" trùng: '+c.map(function(n){ return n.MaNV+' '+tenNgan(n.Ten); }).join(', ')}; }
  return {loi:'"'+ten+'" chưa có trong danh sách nhân viên'}; }
function soGio_(g){ var x=(typeof g==='number')?g:parseFloat(String(g||'').replace(',','.')); return x>0&&x<24?x:0; }
// Đọc 1 tab chấm công: hàng 2 là tên, cột A là ngày. theoDong: ngày ghi sai (tab chép từ tháng trước) → dòng thứ n là ngày n.
function docTabCC_(sh, thang, theoDong){ var v=sh.getDataRange().getValues(), out=[]; if(v.length<3) return out; var ten=v[1], soNgay=new Date(+thang.slice(0,4), +thang.slice(5,7), 0).getDate();
  for(var r=2;r<v.length;r++){ var a=v[r][0], d=null; if(/^total|^tổng/i.test(String(a||'').trim())) break;
    if(a instanceof Date && fmtDate(a).slice(0,7)===thang) d=fmtDate(a); else if(theoDong && a!=='' && a!=null && r-1<=soNgay) d=thang+'-'+('0'+(r-1)).slice(-2);
    if(!d) continue; for(var c=1;c<ten.length;c++){ var t=String(ten[c]||'').trim(), g=soGio_(v[r][c]); if(t && g) out.push({ngay:d, cot:t, gio:g}); } }
  return out; }
function themGio_(H, cs){ var h=Math.floor(H*60); return {v:cs, r:cs+h}; }
function napTuFileChamCong(p){ if(authRole(p.pin)!=='admin') return {ok:false,msg:'Chỉ admin'}; _NAPNV=null;
  var tu=String(p.tu||''), den=String(p.den||''); if(!/^\d{4}-\d{2}-\d{2}$/.test(tu)||!/^\d{4}-\d{2}-\d{2}$/.test(den)||den<tu||tu.slice(0,7)!==den.slice(0,7)) return {ok:false,msg:'Chọn khoảng ngày trong cùng 1 tháng'};
  var thang=tu.slice(0,7), m=String(+thang.slice(5,7)), NV=rows('NhanVien'), loi=[], tao={}, bo={}, ghi={};
  var mo=function(k){ try{ return SpreadsheetApp.openById(fileId_(k)); }catch(e){ loi.push('Không mở được file '+k+' ('+e.message+')'); return null; } };
  var cf=mo('FILE_CC_CFMH'), ld=mo('FILE_CC_LDD'), tn=mo('FILE_CC_TNV'); if(!cf && !ld) return {ok:false,msg:loi.join('; ')};
  var ma=function(ten, nguon){ var x=maTuTen_(ten, nguon, NV); if(x.bo){ bo[ten]=1; return null; } if(x.tao){ tao[x.tao]=1; return '+'+x.tao; } if(x.loi){ if(loi.indexOf(x.loi)<0) loi.push(x.loi); return null; } return x.ma; };
  var G={}, cong=function(d, k, loai, g){ if(d<tu||d>den) return; var o=G[d+'|'+k]=G[d+'|'+k]||{ngay:d, ma:k, cf:0, tnv:0, gay:0, ldd:0}; o[loai]+=g; };
  if(cf) cf.getSheets().filter(function(s){ return new RegExp('^'+m+'\\.').test(s.getName()) && !/trễ/i.test(s.getName()); }).forEach(function(s){ docTabCC_(s, thang, false).forEach(function(e){ var k=ma(e.cot,'CFMH'); if(k) cong(e.ngay, k, 'cf', e.gio); }); });
  if(tn){ var st=tn.getSheetByName('T'+m); if(st) docTabCC_(st, thang, false).forEach(function(e){ var k=ma(e.cot.replace(/\s*(tnv|gãy|gay)\s*$/i,''),'TNV'); if(k) cong(e.ngay, k, /gãy|gay/i.test(e.cot)?'gay':'tnv', e.gio); }); }
  if(ld){ var sl=ld.getSheetByName('T'+m); if(sl) docTabCC_(sl, thang, true).forEach(function(e){ var k=ma(e.cot,'LDD'); if(k) cong(e.ngay, k, 'ldd', e.gio); }); }
  // chia giờ theo quán: CFMH là tổng (đã gồm giờ TNV chép sang) → phần TNV ghi TNV, phần gãy ghi TNV kèm "gãy ?", phần còn lại ghi quán chính; LĐD ghi LĐD
  var dong=[], theoNguoi={}, nv=function(k){ return k.charAt(0)==='+'?null:NV.filter(function(n){ return up(n.MaNV)===up(k); })[0]; };
  Object.keys(G).sort().forEach(function(key){ var o=G[key], n=nv(o.ma), csChinh=n?up(n.CoSoChinh||'TP'):'TP', phan=[];
    if(csChinh==='LDD' || !csChinh) csChinh='TP';
    if(o.cf>0){ var a=Math.min(o.tnv,o.cf), b=Math.min(o.gay,o.cf-a), c=Math.round((o.cf-a-b)*100)/100;
      if(a>0) phan.push({cs:'TNV', g:a, ghi:o.tnv!==a?'file TNV ghi '+o.tnv+'h':''}); if(b>0) phan.push({cs:'TNV', g:b, ghi:'gãy ? – kiểm tra quán'}); if(c>0) phan.push({cs:(a>0||b>0)&&csChinh==='TNV'?'TP':csChinh, g:c, ghi:(a>0||b>0)?'phần ngoài file TNV':''}); }
    else if(o.tnv+o.gay>0){ if(o.tnv>0) phan.push({cs:'TNV', g:o.tnv, ghi:'chỉ có ở file TNV'}); if(o.gay>0) phan.push({cs:'TNV', g:o.gay, ghi:'gãy ? – kiểm tra quán'}); }
    if(o.ldd>0) phan.push({cs:'LDD', g:o.ldd, ghi:''});
    var bd=6*60+30; phan.forEach(function(x){ var phut=Math.round(x.g*60), v=bd, r=Math.min(bd+phut, 23*60+59); bd=r;
      dong.push({dong:(n?tenNgan(n.Ten):o.ma.slice(1))+' '+o.ngay.slice(8)+'/'+o.ngay.slice(5,7), ngay:o.ngay, ma:o.ma, ten:n?tenNgan(n.Ten):o.ma.slice(1), cs:x.cs, vao:hh_(v), ra:hh_(r), gio:x.g, uoc:true, ghi:x.ghi});
      var t=theoNguoi[o.ma]=theoNguoi[o.ma]||{ma:o.ma.charAt(0)==='+'?'(mới)':o.ma, ten:n?tenNgan(n.Ten):o.ma.slice(1), gio:0, ngay:{}, ghi:0}; t.gio+=x.g; t.ngay[o.ngay]=1; if(x.ghi) t.ghi++; }); });
  var tong=dong.reduce(function(s,x){ return s+x.gio; },0), TN=Object.keys(theoNguoi).map(function(k){ var t=theoNguoi[k]; return {ma:t.ma, ten:t.ten, gio:Math.round(t.gio*100)/100, soNgay:Object.keys(t.ngay).length, ghi:t.ghi}; }).sort(function(a,b){ return a.ma<b.ma?-1:1; });
  if(p.thuNghiem) return {ok:true, soDong:dong.length, soNguoi:TN.length, tongGio:Math.round(tong*100)/100, theoNguoi:TN, tao:Object.keys(tao), bo:Object.keys(bo), loi:loi};
  // tạo mã cho người mới (để trống thông tin, xoá sau nếu không cần)
  var maMoi={}; Object.keys(tao).forEach(function(t){ var r=themNhanVien({pin:p.pin, ten:t, viTri:'Phục vụ', loai:'PT', coSo:'TP'}); if(r.ok) maMoi[t]=String(r.maNV); else loi.push('Không tạo được mã cho '+t+': '+r.msg); });
  _NAPNV=null; dong.forEach(function(x){ if(x.ma.charAt(0)==='+'){ x.ma=maMoi[x.ma.slice(1)]||''; } }); dong=dong.filter(function(x){ return x.ma; });
  var g=ghiNap_(dong, !!p.thayThe, 'nạp từ file chấm công cũ');
  ghiNhatKy('Admin', thang, '', 'Nạp giờ từ file chấm công cũ '+tu+' → '+den, '', g.them+' lượt'+(g.boQua.length?', bỏ qua '+g.boQua.length:'')+(Object.keys(maMoi).length?', cấp mã mới: '+Object.keys(maMoi).map(function(t){ return t+'='+maMoi[t]; }).join(', '):''));
  return {ok:true, them:g.them, thayThe:g.thayThe, boQua:g.boQua, maMoi:maMoi, loi:loi}; }

// Lương giờ từng người lấy từ BẢNG LƯƠNG CFM (tab "Tháng N" mới nhất có dòng "Lương giờ")
function luongTuBangLuong(p){ if(authRole(p.pin)!=='admin') return {ok:false,msg:'Chỉ admin'}; _NAPNV=null; var ss; try{ ss=SpreadsheetApp.openById(fileId_('FILE_BANG_LUONG')); }catch(e){ return {ok:false,msg:'Không mở được file bảng lương: '+e.message}; }
  var NV=rows('NhanVien'), doc=function(s){ var v=s.getDataRange().getValues(), cap=[];
    for(var r=0;r<v.length;r++){ if(!/^lương giờ/i.test(String(v[r][0]||'').trim())) continue; var names=null;
      // hàng tên = hàng ngay sau dòng "Lương tháng …" gần nhất phía trên (mỗi nhóm FT / PT / QL có tiêu đề riêng)
      for(var k=r-1;k>=Math.max(0,r-10);k--){ if(/^lương tháng/i.test(String(v[k][0]||'').trim())){ names=v[k+1]; break; } }
      if(!names) for(var k2=r-1;k2>=Math.max(0,r-8);k2--){ var dem=0; for(var c=1;c<v[k2].length;c++){ var t=String(v[k2][c]||'').trim(); if(t && /[a-zà-ỹ]/i.test(t) && isNaN(+t.replace(',','.'))) dem++; } if(dem>=2){ names=v[k2]; break; } }
      if(!names) continue; for(var c2=1;c2<names.length;c2++){ var ten=String(names[c2]||'').trim(), w=soGio_(v[r][c2])||(+String(v[r][c2]||'').replace(',','.')>0?+String(v[r][c2]).replace(',','.'):0); if(ten && w>0) cap.push({ten:ten, luong:w}); } }
    return cap; };
  var tabs=ss.getSheets().map(function(s){ var mm=/^\s*tháng\s*(\d+)/i.exec(s.getName()); return mm?{s:s, m:+mm[1]}:null; }).filter(Boolean).sort(function(a,b){ return b.m-a.m; });
  var chon=null, cap=[]; for(var i=0;i<tabs.length;i++){ if(p.thang && tabs[i].m!==+p.thang) continue; var c=doc(tabs[i].s); if(c.length>=3){ chon=tabs[i]; cap=c; break; } }
  if(!chon) return {ok:false,msg:'Không tìm thấy dòng "Lương giờ" trong file bảng lương'};
  var dong=[], khongRo=[], seen={}; cap.forEach(function(x){ var r=maTuTen_(x.ten,'LUONG',NV); if(r.bo) return; if(!r.ma){ khongRo.push(x.ten+(r.tao?' (chưa có mã – nạp giờ trước)':'')); return; } if(seen[r.ma]) return; seen[r.ma]=1; dong.push(r.ma+'\t'+x.luong); });
  var kq=napLuongGio({pin:p.pin, text:dong.join('\n'), ngay:p.ngay, thuNghiem:p.thuNghiem, boQuaCoDinh:true});
  kq.tab=chon.s.getName(); kq.khongRo=khongRo; kq.text=dong.join('\n'); return kq; }

/* ========== ĐỌC LỊCH TỪ FILE CỦA QUÁN (bố cục tab "Lịch T10": Phục vụ bên trái, Pha chế bên phải; LĐD file riêng) ==========
   Hàm thuần: nhận bảng giá trị + bảng màu nền của 1 tab → danh sách ca theo tuần. Dùng chung cho app và để thử trên lịch cũ.
   Quy tắc giờ (chủ quán xác nhận 26/10 và 28/10):
   - Số KHÔNG có chữ h = số giờ làm: Sáng tính từ 06:30, Trưa từ 12:00, Tối tính ngược từ giờ đóng quán.
   - Số CÓ chữ h = giờ bắt đầu ("15h", "5h30" = 17:30 ở Trưa/Tối); khoảng "12h30-6h" = 12:30–18:00, "2r-5h" = 14:30–17:00 (r = rưỡi).
   - Chỉ có tên: cả khung buổi (Sáng 06:30–12:00, Trưa 12:00–17:00, Tối 17:00–đóng quán).
   - full: từ 06:30, nối liền tới hết buổi sau có cùng tên (không giờ); không có buổi sau → hết 17:00 (quán đóng 18:30 thì tới 18:30).
   - gãy (ở Sáng): phần sáng 06:30–12:00; phần tối lấy ở khối Tối nếu có, không có thì báo để kiểm tra.
   - QL = chỗ trống của quản lý (bỏ qua); "?" = cần sửa; "nvm" sau tên bỏ qua.
   - Màu ô: không màu / đỏ / hồng = Trần Phú, vàng = Tản Đà, xanh lá = Đống Đa, xanh dương = TNV. */
var LICH_GIO_DONG = {TP:'22:30', DD:'22:30', LDD:'22:30', TD:'18:30', TNV:'18:30'};
function lichPhut_(hm){ var m=String(hm||'').match(/(\d{1,2}):(\d{2})/); return m?(+m[1])*60+(+m[2]):null; }
function lichGio_(p){ p=Math.max(0,Math.min(23*60+59,Math.round(p))); return ('0'+Math.floor(p/60)).slice(-2)+':'+('0'+(p%60)).slice(-2); }
function lichMauQuan_(hex){ hex=String(hex||'').toLowerCase().replace('#','');
  if(!/^[0-9a-f]{6}$/.test(hex) || hex==='ffffff') return 'TP';
  var r=parseInt(hex.slice(0,2),16), g=parseInt(hex.slice(2,4),16), b=parseInt(hex.slice(4,6),16), mx=Math.max(r,g,b), mn=Math.min(r,g,b);
  if(mx-mn<18) return 'TP';                                   // xám
  if(r>=200 && g>=190 && b<190 && Math.abs(r-g)<60) return 'TD'; // vàng
  if(g>=r && g>=b) return 'DD';                               // xanh lá
  if(b>=r && b>=g) return 'TNV';                              // xanh dương
  return 'TP';                                                // đỏ / hồng / cam
}
function lichKhoi_(s){ s=String(s||'').trim().toLowerCase(); if(/^s[áa]ng/.test(s)) return 'Sáng'; if(/^tr[ưu]a/.test(s)) return 'Trưa'; if(/^t[ốo]i/.test(s)) return 'Tối'; if(/^off/.test(s)) return 'OFF'; return ''; }
function lichNgay_(v){ if(v instanceof Date) return v; var s=String(v||''); var m=s.match(/^D:(\d{4}-\d{2}-\d{2})/); if(m) return new Date(m[1]+'T12:00:00+07:00'); return null; }
function lichNgayKey_(d){ var x=new Date(d.getTime()+7*3600e3); return x.getUTCFullYear()+'-'+('0'+(x.getUTCMonth()+1)).slice(-2)+'-'+('0'+x.getUTCDate()).slice(-2); }
// "15h" "5h30" "6h" "12h30" "2r" → phút (Trưa/Tối: số < 12 là buổi chiều)
function lichMoc_(s, chieu){ s=String(s||'').trim().toLowerCase(); var m=s.match(/^(\d{1,2})\s*(?:(h|:|\.|g)\s*(\d{1,2})?|(r))?$/); if(!m) return null;
  var h=+m[1], p=m[4]?30:(m[3]?+m[3]:0); if(h>23||p>59) return null; if(chieu && h>=1 && h<=9) h+=12; return h*60+p; }   // buổi chiều: 1h–9h = 13h–21h; 10h, 11h, 12h giữ nguyên
// đọc 1 ô: tên + kiểu giờ
function lichDocO_(t){ t=String(t==null?'':t).normalize('NFC').replace(/\s+/g,' ').trim(); if(!t) return null;   // NFC: "gãy" gõ bằng bộ dấu tổ hợp
  if(/^(QL|TN|PC|PV|BV|RL)$/i.test(t) || /^(thi[ếe]u|n[êe]n th[êe]m)\b/i.test(t) || /thi[ếe]u \d|\+\d+ (phục vụ|pha chế|bảo vệ|rửa ly)/i.test(t)) return {boQua:true};   // dòng "THIẾU / NÊN THÊM" của bản gợi ý
  if(/^\?+$/.test(t)) return {hoi:true, raw:t};
  if(/\(support\)/i.test(t)){ var ts=t.replace(/\(support\)/i,'').replace(/\s+/g,' ').trim(); return ts?{support:true, ten:ts, raw:t, loai:'ten', gio:null}:{boQua:true}; }   // người nhà hỗ trợ: tính là có người đứng quầy, không vào lịch / lương
  var o={raw:t, gay:/(^|[\s(])gãy(?=[\s)]|$)/i.test(t), full:/(^|\s)full(\s|$)/i.test(t), tc:/(^|\s)\+?TC(\s|$)/.test(t), gio:null, bd:null, kt:null, loai:'ten', lo:''};
  var dq=t.match(/(?:^|[\s\-–])(TP|TĐ|TD|ĐĐ|DD|TNV|LĐD|LDD)\s*$/); if(dq){ o.cs={'TĐ':'TD','ĐĐ':'DD','LĐD':'LDD'}[dq[1]]||dq[1]; t=t.slice(0,dq.index).replace(/[\s\-–]+$/,''); }
  if(/\([^)]*$/.test(t)) t+=')';                                   // "Nhơn (8,5"  → thiếu ngoặc đóng
  if(/^[^(]*\)/.test(t)) t=t.replace(/(\S+)\)/,'($1)');                // "Khang 5,5)" → thiếu ngoặc mở
  if(!/\(/.test(t)){ var sg=t.match(/^(.*?\D)\s+(\d{1,2}(?:[.,]\d+|h\d{0,2}|r)?(?:\s*-\s*\d{1,2}(?:h\d{0,2}|r)?h?)?)((?:\s+(?:gãy|full|TC))*)$/i); if(sg) t=sg[1].trim()+' ('+sg[2]+')'+sg[3]; }   // giờ không ngoặc
  var m=t.match(/\(([^)]*)\)/), p=m?m[1].trim().toLowerCase().replace(/\s+/g,''):'';
  if(p){ var r=p.match(/^([0-9hgr:.]+)-([0-9hgr:.]+)$/), s=p.match(/^\d{1,2}(?:[.,]\d+)?$/), st=p.match(/^\d{1,2}(?:h|g|:)\d{0,2}$|^\d{1,2}r$/);
    if(r){ o.loai='khoang'; o.k1=r[1].replace(/h$/,''); o.k2=r[2].replace(/h$/,''); }
    else if(s){ o.loai='gio'; o.gio=+p.replace(',','.'); }
    else if(st){ o.loai='batdau'; o.k1=p.replace(/h$/,''); }
    else if(/^(gãy|full|support|nvm)$/i.test(p)){ }
    else o.lo='Không hiểu "('+m[1]+')"'; }
  o.ten=t.replace(/\([^)]*\)/g,' ').replace(/(^|\s)(gãy|full|nvm|QL|support|off)(?=\s|$)/gi,' ').replace(/(^|\s)\+?TC(?=\s|$)/g,' ').replace(/\s+/g,' ').trim();
  if(!o.ten) return {boQua:true};
  return o; }
// khung giờ 1 ô theo buổi + quán
function lichKhung_(o, khoi, cs){ var dong=lichPhut_(LICH_GIO_DONG[cs]||'22:30'), sm=6*60+30, tr=12*60, toi=17*60, hetTrua=(dong<=18*60+30)?dong:toi;
  var dau={'Sáng':sm,'Trưa':tr,'Tối':toi}[khoi], cuoi={'Sáng':tr,'Trưa':hetTrua,'Tối':dong}[khoi], chieu=khoi!=='Sáng';
  if(o.loai==='gio'){ if(khoi==='Tối' || dau+o.gio*60>dong) return {bd:dong-o.gio*60, kt:dong}; return {bd:dau, kt:dau+o.gio*60}; }   // vượt giờ đóng quán → tính ngược từ giờ đóng
  if(o.loai==='batdau'){ var b=lichMoc_(o.k1, chieu); if(b==null) return {lo:'Không hiểu giờ bắt đầu "'+o.raw+'"'}; return {bd:b, kt:Math.max(b+60, b>=cuoi?dong:cuoi)}; }
  if(o.loai==='khoang'){ var a=lichMoc_(o.k1, chieu), z=lichMoc_(o.k2, chieu||lichMoc_(o.k2,false)<(a||0));
    if(a!=null && z!=null && z<=a){ a=lichMoc_(o.k1,false); z=lichMoc_(o.k2, lichMoc_(o.k2,false)<=a); }        // "8-5h" ở buổi chiều = 08:00–17:00
    if(a!=null && z!=null && a<6*60){ a+=720; z+=(z<=12*60?720:0); }                                              // "2r-5h" ở buổi sáng = 14:30–17:00
    if(a==null||z==null||z<=a) return {lo:'Không hiểu khoảng giờ "'+o.raw+'"'}; return {bd:a, kt:z}; }
  if(o.full){ return {bd:sm, kt:(dong<=18*60+30)?dong:toi, full:true}; }
  return {bd:dau, kt:cuoi}; }
/* Đọc 1 tab tháng của file CFMH (2 phía PV / PC) hoặc LĐD. tuan = 'yyyy-mm-dd' (thứ 2) → chỉ lấy tuần đó; bỏ trống → mọi tuần.
   Trả về {tuan:{ 'yyyy-mm-dd': {o:[{ngay,cs,ben,khoi,ten,raw,bd,kt,gay,full,tc,lo,hang,cot}], off:[{ngay,ten}]}}, loi:[] } */
function lichDocTab_(v, bg, kieu, tuan){ var kq={tuan:{}, loi:[]}, R=v.length;
  var o=function(r,c){ return (v[r]&&v[r][c]!=null)?v[r][c]:''; }, mau=function(r,c){ return (bg&&bg[r]&&bg[r][c])||'#ffffff'; };
  var ngayHang=function(r, c0){ var ds=[]; for(var i=0;i<7;i++){ var d=lichNgay_(o(r,c0+i)); if(!d) return null; ds.push(lichNgayKey_(d)); } return ds; };
  var phia = kieu==='LDD' ? [{c0:-1, ben:'?'}] : [{nhan:0, c0:1, ben:'PV'}, {nhan:9, c0:10, ben:'PC'}];
  var coNhanPC=false; if(kieu!=='LDD') for(var rr=0;rr<R && !coNhanPC;rr++){ if(lichKhoi_(o(rr,9))) coNhanPC=true; }
  phia.forEach(function(P){
    var ds=null, khoi='', vaiNhom='', trong=0, tuanKey='';
    for(var r=0;r<R;r++){
      if(P.ben==='?'){ for(var cc=0;cc<=6;cc++){ if(ngayHang(r,cc)){ P.c0=cc; P.nhan=Math.max(0,cc-2); P.vai=cc-1; break; } } if(P.c0<0) continue; }
      var d=ngayHang(r, P.c0); if(d){ ds=d; tuanKey=d[0]; khoi=khoi||'Sáng'; trong=0; if(!kq.tuan[tuanKey]) kq.tuan[tuanKey]={o:[],off:[]}; continue; }
      var nhan=String(o(r,P.nhan)).trim();
      if(/LỊCH (PHỤC VỤ|PHA CHẾ|LÊ ĐÌNH)/i.test(nhan)){ ds=null; khoi=''; continue; }
      var k=lichKhoi_(nhan) || (P.ben==='PC' && !coNhanPC ? lichKhoi_(String(o(r,0)).trim()) : ''); if(k){ khoi=k; vaiNhom=''; trong=0; if(!ds){ continue; } }
      if(!ds || !khoi) continue; if(tuan && tuanKey!==tuan) continue;
      if(P.vai!=null){ var vn=String(o(r,P.vai)).trim().toUpperCase(); if(/^(PC|TN|QL)/.test(vn)) vaiNhom='PC'; else if(/^(PV|RL|BV)/.test(vn)) vaiNhom='PV'; }
      // dòng chú thích màu ở cuối khối ("Cs Tản Đà"...) → hết tuần
      // chỉ xét cột của BÊN MÌNH (dòng chú thích màu bên phục vụ nằm cùng hàng với pha chế tối bên phải)
      var coChu=false, chuThich=false; for(var c=Math.max(0,P.c0-2);c<Math.min(v[r].length,P.c0+7);c++){ var t=String(o(r,c)); if(/^cs\s/i.test(t.trim())) chuThich=true; if(t.trim()) coChu=true; }
      if(chuThich){ ds=null; continue; }
      if(!coChu){ if(++trong>6 && khoi==='OFF') ds=null; continue; } trong=0;
      for(var i=0;i<7;i++){ var raw=o(r,P.c0+i); if(raw===''||raw==null) continue; var t=String(raw).trim(); if(!t) continue;
        var ngay=ds[i];
        if(khoi==='OFF'){ t.split(/[,\/;]|\s{2,}/).forEach(function(x){ var y=lichDocO_(x); if(y && y.ten) kq.tuan[tuanKey].off.push({ngay:ngay, ten:y.ten, raw:x.trim()}); }); continue; }
        var x=lichDocO_(t); if(!x || x.boQua) continue;
        var cs=x.cs||(kieu==='LDD'?'LDD':lichMauQuan_(mau(r,P.c0+i)));
        var ben=P.ben==='?'?(vaiNhom||''):P.ben;
        if(x.hoi){ kq.tuan[tuanKey].o.push({ngay:ngay, cs:cs, ben:ben, khoi:khoi, ten:'', raw:t, lo:'Ô ghi "?" – cần điền người', hang:r+1, cot:P.c0+i+1}); continue; }
        if(x.support){ var ks=lichKhung_(x, khoi, cs); kq.tuan[tuanKey].o.push({ngay:ngay, cs:cs, ben:ben||'PC', khoi:khoi, ten:x.ten, raw:t, bd:ks.bd, kt:ks.kt, support:true, hang:r+1, cot:P.c0+i+1}); continue; }
        var kh=lichKhung_(x, khoi, cs);
        kq.tuan[tuanKey].o.push({ngay:ngay, cs:cs, ben:ben, khoi:khoi, ten:x.ten, raw:t, bd:kh.bd, kt:kh.kt, gay:x.gay, full:x.full||!!kh.full, tc:x.tc, coGio:x.loai!=='ten', lo:x.lo||kh.lo||'', hang:r+1, cot:P.c0+i+1}); }
    } });
  return kq; }
/* Gộp theo người / ngày: full + cùng tên ở buổi sau (không giờ) → làm liền; các ca liền nhau cùng quán → 1 ca; gãy sáng không có tối → báo. */
function lichGopNguoi_(ds){ var nhom={}, kq=[], lo=[];
  ds.forEach(function(e){ if(!e.ma) return; var k=e.ngay+'|'+e.ma; (nhom[k]=nhom[k]||[]).push(e); });
  Object.keys(nhom).forEach(function(k){ var L=nhom[k].filter(function(e){ return e.bd!=null; }).sort(function(a,b){ return a.bd-b.bd; });
    var fu=L.filter(function(e){ return e.full; })[0];
    if(fu){ L.forEach(function(e){ if(e!==fu && !e.coGio && e.cs===fu.cs && e.bd>=fu.bd){ fu.kt=Math.max(fu.kt, e.kt); e.bo=true; } }); L=L.filter(function(e){ return !e.bo; }); }
    var KHB={'Sáng':[390,720],'Trưa':[720,1020],'Tối':[1020,1350]};
    L=L.filter(function(e){ if(e.coGio || e.full) return true; var w=KHB[e.khoi]||[e.bd,e.kt];
      return !L.some(function(x){ return x!==e && (x.coGio||x.full) && x.cs===e.cs && Math.min(x.kt,w[1])-Math.max(x.bd,w[0])>0; }); });
    var gop=[]; L.forEach(function(e){ var t=gop[gop.length-1]; if(t && t.cs===e.cs && e.bd<=t.kt){ t.kt=Math.max(t.kt,e.kt); t.raw+=' + '+e.raw; if(e.ben==='PC') t.ben='PC'; } else gop.push({ngay:e.ngay,cs:e.cs,ben:e.ben,khoi:e.khoi,ten:e.ten,ma:e.ma,raw:e.raw,bd:e.bd,kt:e.kt,gay:e.gay,tc:e.tc,hang:e.hang,cot:e.cot}); });
    for(var i=1;i<gop.length;i++){ if(gop[i].bd<gop[i-1].kt) lo.push({ngay:gop[i].ngay, ten:gop[i].ten, lo:'Trùng giờ: '+gop[i-1].cs+' '+lichGio_(gop[i-1].bd)+'–'+lichGio_(gop[i-1].kt)+' và '+gop[i].cs+' '+lichGio_(gop[i].bd)+'–'+lichGio_(gop[i].kt)}); }
    var g=gop.filter(function(e){ return e.gay; }); if(g.length && gop.length===1 && gop[0].kt<=12*60) lo.push({ngay:gop[0].ngay, ten:gop[0].ten, lo:'Ghi "gãy" nhưng chưa thấy ca tối – kiểm tra'});
    var tong=gop.reduce(function(s,e){ return s+(e.kt-e.bd); },0); if(tong>14*60) lo.push({ngay:gop[0].ngay, ten:gop[0].ten, lo:'Tổng '+Math.round(tong/6)/10+' giờ trong ngày – kiểm tra'});
    gop.forEach(function(e){ kq.push(e); }); });
  return {ca:kq, lo:lo}; }

/* (28/10) CHỈNH GIỜ ĐÃ NẠP TỪ FILE CŨ THEO LỊCH THÁNG (file lịch quán):
   file chấm công cũ chỉ có số giờ/ngày → lúc nạp giờ vào/ra ước tính từ 06:30 và quán theo quán chính. Đọc lịch tháng (cùng bộ đọc với app Xếp lịch)
   → ca sáng: giờ vào = giờ bắt đầu ca, giờ ra = vào + số giờ; ca chiều / tối: giờ ra = giờ kết thúc ca, giờ vào tính ngược (SỐ GIỜ GIỮ NGUYÊN); quán = quán của ca trong lịch.
   Chỉ chỉnh lượt nạp chưa ai sửa tay; tháng đã chốt lương thì bỏ qua. */
var FILE_LICH_MD={CFMH:'1u_WaOGqMjkhLxwaYqS9HqUZDHTH60cO7FtrRjEtuJrs', LDD:'1-xHHjHV9X59i91iAKR3zKhXy6PGhhE8ieXym8_LLmmo'};
function chinhNapTheoLich(p){ if(authRole(p.pin)!=='admin') return {ok:false,msg:'Chỉ admin'};
  var tu=String(p.tu||''), den=String(p.den||''); if(!/^\d{4}-\d{2}-\d{2}$/.test(tu)||!/^\d{4}-\d{2}-\d{2}$/.test(den)||den<tu) return {ok:false,msg:'Chọn khoảng ngày'};
  var NV=rows('NhanVien'), lich={}, loi=[], thangs={}; for(var dd=new Date(tu+'T12:00:00+07:00'); fmtDate(dd)<=den; dd=new Date(dd.getTime()+864e5)){ var mm=+fmtDate(dd).slice(5,7); thangs[mm]=1; thangs[mm===1?12:mm-1]=1; }
  [['CFMH','FILE_LICH_CFMH'],['LDD','FILE_LICH_LDD']].forEach(function(f){ var ss; try{ ss=SpreadsheetApp.openById(String(cfg(f[1])||FILE_LICH_MD[f[0]])); }catch(e){ loi.push('Không mở được file lịch '+f[0]+': '+e.message); return; }
    ss.getSheets().filter(function(sh){ return Object.keys(thangs).some(function(x){ return new RegExp('^\\s*l[iị]ch\\s*t\\s*'+x+'\\s*$','i').test(sh.getName()); }); }).forEach(function(sh){ var rg=sh.getDataRange(), kq=lichDocTab_(rg.getValues(), rg.getBackgrounds(), f[0], '');
      Object.keys(kq.tuan).forEach(function(tk){ var ds=kq.tuan[tk].o.filter(function(e){ return e.ten && e.bd!=null && e.ngay>=tu && e.ngay<=den; }).map(function(e){ var x=maTuTen_(e.ten, f[0], NV); if(!x || !x.ma) return null; e.ma=String(x.ma); return e; }).filter(Boolean);
        lichGopNguoi_(ds).ca.forEach(function(c){ var k=c.ngay+'|'+up(c.ma); (lich[k]=lich[k]||[]).push(c); }); }); }); });
  var sh=SS.getSheetByName('ChamCong'), v=sh.getDataRange().getValues(), h=v[0], ix={}; h.forEach(function(k,i){ ix[k]=i; }); var cm=caMap();
  var soNap=0, doi=0, doiQuan=0, giuTay=0, khongLich=0, vd=[], chot={};
  for(var r=1;r<v.length;r++){ var row=v[r]; if(String(row[ix.KhaiLoai])!=='nap') continue; var d=dateKey(row[ix.Ngay]); if(!d || d<tu || d>den) continue; soNap++;
    var th=d.slice(0,7); if(chot[th]===undefined) chot[th]=thangDaChot(th); if(chot[th]) continue;
    var cach=String(row[ix.Cach]||''); if(cach && cach.indexOf('nạp')<0){ giuTay++; continue; }   // quản lý đã sửa tay → giữ
    // cùng "nhóm file" với lượt nạp: TNV, LĐD có file chấm công riêng (quán chắc chắn) → chỉ khớp ca của đúng quán đó; file CFMH gộp TP / ĐĐ / TĐ → chọn trong 3 quán này
    var csNap=up(row[ix.MaCS]), nhom=(csNap==='TNV'||csNap==='LDD')?[csNap]:['TP','DD','TD'];
    var L=(lich[d+'|'+up(row[ix.MaNV])]||[]).filter(function(c){ return nhom.indexOf(c.cs)>-1; }).slice().sort(function(a,b){ return a.bd-b.bd; }); if(!L.length){ khongLich++; continue; }
    var chinh=L.slice().sort(function(a,b){ return (b.kt-b.bd)-(a.kt-a.bd); })[0], gio=+row[ix.GioTinh]||+row[ix.GioThuc]||0, cs=chinh.cs, vao, ra;
    if(L[0].bd>=12*60){ ra=L[L.length-1].kt; vao=Math.max(0, ra-Math.round(gio*60)); }   // ca chiều / tối: về theo giờ kết thúc ca, tính ngược giờ vào
    else { vao=L[0].bd; ra=Math.min(vao+Math.round(gio*60), 23*60+59); }                   // ca sáng: vào theo giờ bắt đầu ca
    var vaoCu=hhmm(row[ix.Vao]), raCu=hhmm(row[ix.Ra]), csCu=up(row[ix.MaCS]);
    if(lichGio_(vao)===vaoCu && lichGio_(ra)===raCu && cs===csCu) continue;
    doi++; if(cs!==csCu) doiQuan++;
    if(vd.length<12) vd.push(String(row[ix.Ten])+' '+d.slice(8)+'/'+d.slice(5,7)+' ('+gio+'h): '+csCu+' '+vaoCu+'–'+raCu+' → '+cs+' '+lichGio_(vao)+'–'+lichGio_(ra));
    if(!p.thuNghiem){ var bd=lichGio_(L[0].bd), kt=lichGio_(L[L.length-1].kt), ca=Object.keys(cm).map(function(k){ return cm[k]; }).filter(function(c){ return hhmm(c.GioBD)===bd && hhmm(c.GioKT)===kt; })[0];
      row[ix.Vao]=lichGio_(vao); row[ix.Ra]=lichGio_(ra); row[ix.CaBD]=bd; row[ix.CaKT]=kt; row[ix.MaCS]=cs; if(ix.MaCa!==undefined) row[ix.MaCa]=ca?ca.MaCa:'KHAC';
      if(ix.CanhBao!==undefined) row[ix.CanhBao]=String(row[ix.CanhBao]||'Dữ liệu nạp').replace(/\s*\(giờ vào\/ra ước tính theo số giờ\)/,'')+' (giờ vào/ra, quán theo lịch tháng)'; } }
  if(!p.thuNghiem && doi){ var lk=LockService.getScriptLock(); lk.waitLock(30000); try{ sh.getRange(1,1,v.length,h.length).setValues(v); } finally { lk.releaseLock(); }
    try{ _CC=null; }catch(e){} ghiNhatKy('Admin', tu.slice(0,7), '', 'Chỉnh giờ vào/ra, quán của giờ đã nạp theo lịch tháng '+tu+' → '+den, '', doi+' lượt ('+doiQuan+' đổi quán)'); }
  return {ok:true, soNap:soNap, soDoi:doi, doiQuan:doiQuan, giuTay:giuTay, khongLich:khongLich, vd:vd, loi:loi}; }

// (28/10) Biệt danh: nhân viên tự đặt ở trang "Lịch của tôi", chỉ hiện cho chính họ (lời chào khi chấm công bằng điện thoại của mình, trang cá nhân).
// Quản lý không thấy trong các bảng.
function datBietDanh(p){ var k=nvTK(p); if(k.loi) return {ok:false,msg:k.loi}; var bd=String(p.bietDanh||'').replace(/<[^>]*>/g,'').replace(/[<>"'`\\]/g,'').replace(/\s+/g,' ').trim().slice(0,24);
  ensureCols('NhanVien',['BietDanh']); var sh=SS.getSheetByName('NhanVien'), v=sh.getDataRange().getValues(), h=v[0], im=h.indexOf('MaNV'), ib=h.indexOf('BietDanh');
  for(var i=1;i<v.length;i++) if(up(v[i][im])===up(k.nv.MaNV)){ sh.getRange(i+1,ib+1).setValue(bd); try{ _NV=null; }catch(e){} return {ok:true, bietDanh:bd}; }
  return {ok:false,msg:'Không tìm thấy nhân viên'}; }

/* (29/10) THÔNG BÁO SỰ KIỆN: ngày lễ (bảng NgayLe – dùng cho tính lương) + sự kiện admin thêm (họp, tiệc cuối năm…).
   Nhân viên thấy ở đầu trang "Lịch của tôi" các mục trong 45 ngày tới (theo quán của mình). */
var SK_COT=['ID','Ngay','DenNgay','Ten','GhiChu','Quan'];
var NGAY_LE_PHO_BIEN=[['01-01','Tết Dương lịch'],['02-14','Lễ Tình nhân (Valentine)'],['03-08','Quốc tế Phụ nữ'],['04-30','Ngày Giải phóng miền Nam'],['05-01','Quốc tế Lao động'],['06-01','Quốc tế Thiếu nhi'],['09-02','Quốc khánh'],['10-20','Ngày Phụ nữ Việt Nam'],['11-20','Ngày Nhà giáo Việt Nam'],['12-24','Đêm Giáng sinh'],['12-25','Lễ Giáng sinh'],['12-31','Đêm Giao thừa dương lịch']];
function skSh_(){ var sh=SS.getSheetByName('SuKien'); if(!sh){ sh=SS.insertSheet('SuKien'); sh.getRange(1,1,1,SK_COT.length).setValues([SK_COT]); } return sh; }
function dsSuKien(p){ if(authRole(p.pin)!=='admin') return {ok:false,msg:'Chỉ admin'}; skSh_();
  var L=rows('SuKien').filter(function(r){ return r.Ten; }).map(function(r){ return {ID:String(r.ID), Ngay:dateKey(r.Ngay), DenNgay:r.DenNgay?dateKey(r.DenNgay):'', Ten:String(r.Ten), GhiChu:String(r.GhiChu||''), Quan:String(r.Quan||'')}; }).sort(function(a,b){ return a.Ngay<b.Ngay?-1:1; });
  var le=rows('NgayLe').filter(function(r){ return r.Ngay; }).map(function(r){ return {Ngay:dateKey(r.Ngay), Ten:String(r.Ten||'Ngày lễ')}; }).sort(function(a,b){ return a.Ngay<b.Ngay?-1:1; });
  return {ok:true, list:L, ngayLe:le, stores:rows('CoSo').map(function(s){ return {MaCS:s.MaCS, TenCS:s.TenCS}; })}; }
function luuSuKien(p){ if(authRole(p.pin)!=='admin') return {ok:false,msg:'Chỉ admin'}; var ngay=String(p.ngay||''), den=String(p.denNgay||''), ten=String(p.ten||'').replace(/[<>]/g,'').trim().slice(0,80);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(ngay) || !ten) return {ok:false,msg:'Điền ngày và tên sự kiện'}; if(den && (!/^\d{4}-\d{2}-\d{2}$/.test(den) || den<ngay)) return {ok:false,msg:'"Đến ngày" phải sau ngày bắt đầu'};
  var sh=skSh_(), v=sh.getDataRange().getValues(), h=v[0], id=String(p.id||''), dong=[id||idMoi('SK'), ngay, den, ten, String(p.ghiChu||'').replace(/[<>]/g,'').slice(0,200), String(p.quan||'')];
  for(var i=1;i<v.length;i++) if(id && String(v[i][0])===id){ sh.getRange(i+1,1,1,SK_COT.length).setValues([dong]); return {ok:true}; }
  sh.appendRow(dong); return {ok:true}; }
function xoaSuKien(p){ if(authRole(p.pin)!=='admin') return {ok:false,msg:'Chỉ admin'}; var sh=skSh_(), v=sh.getDataRange().getValues();
  for(var i=v.length-1;i>=1;i--) if(String(v[i][0])===String(p.id)){ sh.deleteRow(i+1); return {ok:true}; } return {ok:false,msg:'Không tìm thấy'}; }
function themNgayLePhoBien(p){ if(authRole(p.pin)!=='admin') return {ok:false,msg:'Chỉ admin'}; var nam=String(p.nam||new Date().getFullYear()).slice(0,4); if(!/^\d{4}$/.test(nam)) return {ok:false,msg:'Năm không hợp lệ'};
  var co={}; rows('SuKien').forEach(function(r){ co[dateKey(r.Ngay)+'|'+String(r.Ten)]=1; }); var sh=skSh_(), them=0;
  NGAY_LE_PHO_BIEN.forEach(function(x){ var d=nam+'-'+x[0]; if(co[d+'|'+x[1]]) return; sh.appendRow([idMoi('SK'), d, '', x[1], '', '']); them++; }); return {ok:true, them:them}; }
// các mục trong N ngày tới cho 1 nhân viên (quán của họ; sự kiện để trống quán = mọi quán)
function suKienSapToi_(cs, soNgay){ var hom=fmtDate(new Date()), den=fmtDate(new Date(new Date().getTime()+(soNgay||45)*864e5)), out=[], co={};
  (SS.getSheetByName('SuKien')?rows('SuKien'):[]).forEach(function(r){ if(!r.Ten) return; var a=dateKey(r.Ngay), b=r.DenNgay?dateKey(r.DenNgay):a, q=String(r.Quan||'').split(',').map(function(s){ return up(s.trim()); }).filter(Boolean);
    if(b<hom || a>den || (q.length && cs && q.indexOf(up(cs))<0)) return; var k=a+'|'+String(r.Ten); if(co[k]) return; co[k]=1; out.push({Ngay:a, DenNgay:b!==a?b:'', Ten:String(r.Ten), GhiChu:String(r.GhiChu||''), Le:NGAY_LE_PHO_BIEN.some(function(x){ return x[1]===String(r.Ten); })}); });
  rows('NgayLe').forEach(function(r){ var a=dateKey(r.Ngay); if(!a || a<hom || a>den) return; var ten=String(r.Ten||'Ngày lễ'), k=a+'|'+ten; if(co[k]) return; co[k]=1; out.push({Ngay:a, DenNgay:'', Ten:ten, GhiChu:'', Le:true}); });
  return out.sort(function(x,y){ return x.Ngay<y.Ngay?-1:1; }).slice(0,8); }
