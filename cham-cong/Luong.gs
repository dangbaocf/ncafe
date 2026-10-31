/*******************************************************
 * LƯƠNG – app Chấm công Ncafe (chỉ admin)
 * Đơn vị: NGHÌN đồng (như bảng lương cũ). Mọi hệ số sửa được (tab CaiDat hoặc khung "Hệ số" trên bảng lương).
 * Tổng nhận = Tiền lương + Tiền cơm + Giờ nghỉ có lương × lương giờ + Phụ cấp + Thưởng + (mục cộng thêm)
 * CÒN LẠI   = Tổng nhận − Tạm ứng − Trừ lỗi − (mục trừ thêm)
 * THỰC NHẬN = CÒN LẠI + Thưởng thêm
 * Tiền lương: theo giờ  = giờ làm × lương giờ (+ phần tăng ca, ngày lễ theo hệ số)
 *             cố định   = số ngày làm × (lương cơ bản / ngày chuẩn) − giờ thiếu so với ca × lương giờ quy đổi (+ tăng ca, ngày lễ)
 *******************************************************/
var MUC_CO_SAN=[['gio','Giờ làm'],['ngay','Ngày công'],['luong','Lương giờ'],['lcb','Lương cơ bản'],['tienLuong','Tiền lương'],['com','Tiền cơm'],['nghi','Giờ nghỉ có lương'],['pc','Phụ cấp'],['thuong','Thưởng'],
  ['tn','Tổng nhận'],['ung','Tạm ứng'],['tru','Trừ lỗi'],['con','CÒN LẠI'],['thuongThem','Thưởng thêm'],['thuc','THỰC NHẬN']];
var MUC_BO_DUOC=['com','nghi','pc','thuong','ung','tru','thuongThem'];   // mục có sẵn admin bỏ được (các dòng tự tính luôn giữ)
var MUC_NHAP=['gio','luong','lcb','com','nghi','pc','thuong','tru','thuongThem'];  // mục admin sửa / nhập tay

function laAdmin(p){ return authRole(p&&p.pin)==='admin'; }
function sh_(n){ return SS.getSheetByName(n); }
function shChot(){ var sh=SS.getSheetByName('ChotLuong'); if(!sh){ sh=SS.insertSheet('ChotLuong'); sh.getRange(1,1,1,3).setValues([['Thang','MaNV','DuLieu']]); sh.getRange('A:B').setNumberFormat('@'); } return sh; }
function luuBanChot(th, list){ xoaBanChot(th); var v=list.map(function(o){ return [th, String(o.MaNV), JSON.stringify(o)]; }); if(v.length) shChot().getRange(shChot().getLastRow()+1,1,v.length,3).setValues(v); }
function xoaBanChot(th){ var sh=SS.getSheetByName('ChotLuong'); if(!sh) return; var v=sh.getDataRange().getValues(); for(var i=v.length-1;i>=1;i--) if(String(v[i][0])===String(th)) sh.deleteRow(i+1); }
function banChot(th){ var sh=SS.getSheetByName('ChotLuong'); if(!sh) return null; var o={}, co=false; sh.getDataRange().getValues().slice(1).forEach(function(r){ if(String(r[0])!==String(th)) return; try{ o[up(r[1])]=JSON.parse(r[2]); co=true; }catch(e){} }); return co?o:null; }
function thangDaChot(th){ return memoRows_('ChotThang').some(function(r){ return thKey_(r.Thang)===thKey_(th); }); }
function ghiNhatKy(boi, th, ma, muc, cu, moi){ try{ sh_('NhatKySua').appendRow([new Date(), boi, th?thGhi_(th):'', String(ma||''), muc, cu===undefined?'':cu, moi===undefined?'':moi]); }catch(e){} }
function so(v){ var x=+String(v==null?'':v).replace(',','.'); return isFinite(x)?x:0; }
function nghin(v){ var x=so(v); return x>=1000?x/1000:x; }   // lương giờ, tiền cơm: nhập 25000 hay 25 đều hiểu là 25 nghìn
function nghinTien(v){ var x=so(v); return x>=100000?x/1000:x; }   // số tiền lớn (lương cơ bản, tạm ứng): nhập 7.800.000 hay 7800 đều hiểu là 7.800 nghìn
function maMoi(dau){ return dau+fmtTZ_(new Date(),TZ,'yyMMddHHmmss')+Math.floor(Math.random()*1e4); }
function cong(th,n){ var y=+th.slice(0,4), m=+th.slice(5,7)-1+n; return fmtTZ_(new Date(Date.UTC(y,m,15,5)),TZ,'yyyy-MM'); }
function cuoiThang(th){ var y=+th.slice(0,4), m=+th.slice(5,7); return new Date(Date.UTC(y,m,0,5)).getUTCDate(); }
function themThang(iso, n){ var d=new Date(String(iso).slice(0,10)+'T12:00:00+07:00'); var y=d.getUTCFullYear(), m=d.getUTCMonth()+n, day=d.getUTCDate(); var dd=new Date(Date.UTC(y,m,1,5)), last=new Date(Date.UTC(y,m+1,0,5)).getUTCDate(); dd.setUTCDate(Math.min(day,last)); return fmtDate(dd); }
function thamNien(iso){ if(!iso) return ''; var a=new Date(iso+'T12:00:00+07:00'), b=new Date(); var m=(b.getUTCFullYear()-a.getUTCFullYear())*12+b.getUTCMonth()-a.getUTCMonth(); if(m<0) return ''; return m>=12?(Math.floor(m/12)+' năm '+(m%12)+' tháng'):(m+' tháng'); }
// Lịch sử lương: đọc 1 lần cho cả lượt tính (trước đây mỗi nhân viên đọc lại cả bảng → tra cứu / bảng lương / nhân sự chậm 15–30 giây)
var _LSL=null; function lslRows_(){ return _LSL||(_LSL=(sh_('LichSuLuong')?rows('LichSuLuong'):[])); }
function kyTangLuong(n){
  var ls=lslRows_().filter(function(r){ return up(r.MaNV)===up(n.MaNV); }).sort(function(a,b){ return dateKey(a.Ngay)<dateKey(b.Ngay)?-1:1; });
  var lan=ls.length?ls[ls.length-1]:null, goc=lan?dateKey(lan.Ngay):dateKey(n.NgayVao);
  if(n.Loai!=='FT' || !goc) return {ky:'', den:false, lan:lan?{Ngay:dateKey(lan.Ngay),Tu:lan.Tu,Len:lan.Len,Kieu:lan.Kieu}:null};
  var ky=themThang(goc, +cfg('KY_TANG_LUONG_THANG')||6); return {ky:ky, den:ky<=fmtDate(new Date()), lan:lan?{Ngay:dateKey(lan.Ngay),Tu:lan.Tu,Len:lan.Len,Kieu:lan.Kieu}:null}; }

/* ---------- cấu hình: tiền cơm theo vị trí, hệ số, ngày lễ, mục lương ---------- */
var VI_TRI_LUONG=['Quản lý','Pha chế','Phục vụ','Thu ngân','Rửa ly','Bảo vệ'];
function cauHinhLuong(p){ var _q=khongQuyen(p.pin,'luong',1); if(_q) return _q;
  return {ok:true, com:dsViTri().map(function(v){ return {ViTri:v, Tu:+cfg('COM_TU_'+v)||8, Gia:nghin(cfg('COM_GIA_'+v))||20, LuongGio:nghin(cfg('LUONG_'+v))}; }),
    comFT:String(cfg('COM_FT_LUON')||'Có'), comGay:String(cfg('COM_NGAY_GAY')||'Có'),
    heSo:{HE_SO_TANG_CA:+cfg('HE_SO_TANG_CA')||1, NGAY_CHUAN:+cfg('NGAY_CHUAN')||26, GIO_CHUAN_NGAY:+cfg('GIO_CHUAN_NGAY')||8, KY_TANG_LUONG_THANG:+cfg('KY_TANG_LUONG_THANG')||6,
      DOT_1_DEN:+cfg('DOT_1_DEN')||10, DOT_2_DEN:+cfg('DOT_2_DEN')||20, TRE_PHUT:+cfg('TRE_PHUT')||10, LECH_PHUT:+cfg('LECH_PHUT')||30, GIO_BAT_THUONG_NGAY:+cfg('GIO_BAT_THUONG_NGAY')||12, GIO_BAT_THUONG_THANG:+cfg('GIO_BAT_THUONG_THANG')||300},
    ngayLe:rows('NgayLe').map(function(r){ return {Ngay:dateKey(r.Ngay), Ten:r.Ten, HeSo:+r.HeSo||1}; }), muc:mucLuong()}; }
function luuCauHinh(p){ if(!laAdmin(p)) return {ok:false,msg:'Chỉ admin'};
  var ngayAD=String(p.ngayApDung||fmtTZ_(new Date(),TZ,'yyyy-MM')+'-01').slice(0,10); if(!/^\d{4}-\d{2}-\d{2}$/.test(ngayAD)) return {ok:false,msg:'Ngày áp dụng không hợp lệ'};
  var doi=[], ktra=function(key, moi){ var cu=cfg(key); if(String(cu)===String(moi)) return; var L=lsHeSo_()[key]; if(L && L.length && ngayAD<L[L.length-1].ngay) throw new Error(key+' đã đổi từ ngày '+L[L.length-1].ngay.split('-').reverse().join('/')+'. Ngày áp dụng phải từ ngày đó trở đi.'); doi.push([key,cu,moi]); };
  try{ (p.com||[]).forEach(function(c){ ['Tu','Gia','LuongGio'].forEach(function(k){ if(c[k]===undefined) return; ktra((k==='Tu'?'COM_TU_':(k==='Gia'?'COM_GIA_':'LUONG_'))+c.ViTri, so(c[k])); }); });
    Object.keys(p.heSo||{}).forEach(function(k){ if(HS_CO_NGAY.test(k)) ktra(k, so(p.heSo[k])); }); }catch(e){ return {ok:false,msg:e.message}; }
  doi.forEach(function(x){ ghiLsHeSo(ngayAD, x[0], x[1]===''||x[1]==null?x[2]:x[1], x[2]); setCfg(x[0], x[2]); ghiNhatKy('Admin','','',x[0]+' (áp dụng từ '+ngayAD.split('-').reverse().join('/')+')',x[1],x[2]); });
  ['COM_FT_LUON','COM_NGAY_GAY'].forEach(function(k){ var v=(p.chon||{})[k]; if(v!==undefined && String(v)!==String(cfg(k))){ ghiNhatKy('Admin','','',k,cfg(k),v); setCfg(k, v==='Không'?'Không':'Có'); } });
  Object.keys(p.heSo||{}).forEach(function(k){ if(HS_CO_NGAY.test(k)) return; var cu=cfg(k); if(String(cu)!==String(p.heSo[k])){ setCfg(k, so(p.heSo[k])); ghiNhatKy('Admin','','',k,cu,p.heSo[k]); } });
  if(p.ngayLe){ var sh=sh_('NgayLe'); if(sh.getLastRow()>1) sh.getRange(2,1,sh.getLastRow()-1,3).clearContent();
    var v=p.ngayLe.filter(function(x){ return x.Ngay; }).map(function(x){ return [x.Ngay, x.Ten||'', so(x.HeSo)||1]; }); if(v.length) sh.getRange(2,1,v.length,3).setValues(v); }
  return {ok:true}; }
function mucLuong(){ var an={}, them=[]; (sh_('MucLuong')?rows('MucLuong'):[]).forEach(function(r){ if(r.An) an[r.Ma]=1; else if(r.Loai==='cong'||r.Loai==='tru') them.push({Ma:String(r.Ma),Ten:r.Ten,Loai:r.Loai}); }); return {an:an, them:them}; }
function themMucLuong(p){ if(!laAdmin(p)) return {ok:false,msg:'Chỉ admin'}; var ten=String(p.ten||'').trim(); if(!ten) return {ok:false,msg:'Nhập tên mục'};
  var ma=maMoi('m'); sh_('MucLuong').appendRow([ma, ten, p.loai==='tru'?'tru':'cong', '']); ghiNhatKy('Admin','','','Thêm mục',' ',ten); return {ok:true, ma:ma}; }
function boMucLuong(p){ if(!laAdmin(p)) return {ok:false,msg:'Chỉ admin'}; var sh=sh_('MucLuong'), v=sh.getDataRange().getValues();
  for(var i=v.length-1;i>=1;i--) if(String(v[i][0])===String(p.ma)){ sh.deleteRow(i+1); ghiNhatKy('Admin','','','Bỏ mục',v[i][1],''); return {ok:true}; }
  if(MUC_BO_DUOC.indexOf(p.ma)<0) return {ok:false,msg:'Mục này luôn giữ'}; sh.appendRow([p.ma,'','','1']); ghiNhatKy('Admin','','','Bỏ mục',p.ma,''); return {ok:true}; }
function hienMucLuong(p){ if(!laAdmin(p)) return {ok:false,msg:'Chỉ admin'}; var sh=sh_('MucLuong'), v=sh.getDataRange().getValues();
  for(var i=v.length-1;i>=1;i--) if(String(v[i][0])===String(p.ma) && v[i][3]) sh.deleteRow(i+1); return {ok:true}; }

/* ---------- tính lương một người trong tháng ---------- */
function nhapThang(th){ var o={}; (sh_('LuongNhap')?rows('LuongNhap'):[]).forEach(function(r){ if(thKey_(r.Thang)!==thKey_(th)) return; var m=up(r.MaNV); o[m]=o[m]||{}; o[m][String(r.Muc)]=r.GiaTri; }); return o; }
function tamUngThang(th){ var o={}; (sh_('TamUng')?rows('TamUng'):[]).forEach(function(r){ if(thKey_(r.Thang)!==thKey_(th)) return; var m=up(r.MaNV); o[m]=(o[m]||0)+nghinTien(r.SoTien); }); return o; }
function ngayLeMap(){ var o={}; rows('NgayLe').forEach(function(r){ o[dateKey(r.Ngay)]=+r.HeSo||1; }); return o; }
function nhomLuong(n){ if(n.ChucVu==='Quản lý' || n.ViTri==='Quản lý') return 'QL'; return n.Loai==='FT'?'FT':'PT'; }
// Mức lương tại một ngày: theo lịch sử "Tăng lương" (có ngày áp dụng). Trước lần tăng đầu tiên = mức cũ; từ lần tăng gần nhất trở đi = mức đang ghi trong hồ sơ.
function lsLuong(n, codinh){ var kieu=codinh?'Lương cơ bản':'Lương giờ'; return lslRows_().filter(function(r){ return up(r.MaNV)===up(n.MaNV) && String(r.Kieu)===kieu; }).sort(function(a,b){ return dateKey(a.Ngay)<dateKey(b.Ngay)?-1:1; }); }
/* (29/10) LƯƠNG RIÊNG THEO KHOẢNG NGÀY (từ ngày – đến ngày) cho từng người: lương giờ cụ thể (k/giờ) hoặc hệ số (× mức thường của ngày đó).
   Hết khoảng → tự về mức thường. Nhiều khoảng chồng nhau → khoảng thêm sau được dùng. Chỉ áp cho lương giờ (không áp lương cố định). */
var _LK=null;
function lkRows_(){ if(_LK) return _LK; _LK=(SS.getSheetByName('LuongKhoang')?rows('LuongKhoang'):[]).filter(function(r){ return r.MaNV && r.TuNgay && r.DenNgay; }).map(function(r){ return {ID:String(r.ID), MaNV:up(r.MaNV), Tu:dateKey(r.TuNgay), Den:dateKey(r.DenNgay), Kieu:String(r.Kieu)==='heso'?'heso':'gio', GiaTri:so(r.GiaTri), GhiChu:String(r.GhiChu||''), Boi:String(r.Boi||'')}; }); return _LK; }
function lkTai_(ma, d){ var L=lkRows_().filter(function(x){ return x.MaNV===up(ma) && x.Tu<=d && d<=x.Den; }); return L.length?L[L.length-1]:null; }
function mucTaiNgay(n, d, codinh, ls){ var g=mucTaiNgay0_(n, d, codinh, ls); if(codinh) return g; var k=lkTai_(n.MaNV, d); if(!k) return g; return k.Kieu==='heso'?Math.round(g*k.GiaTri*100)/100:k.GiaTri; }
function lkMoTa_(x){ return x.Tu.slice(8)+'/'+x.Tu.slice(5,7)+'–'+x.Den.slice(8)+'/'+x.Den.slice(5,7)+': '+(x.Kieu==='heso'?'×'+String(x.GiaTri).replace('.',','):String(x.GiaTri).replace('.',',')+'k/giờ'); }
function dsLuongKhoang(p){ if(!laAdmin(p)) return {ok:false,msg:'Chỉ admin'}; var n=nvByMa(p.maNV); if(!n) return {ok:false,msg:'Không tìm thấy nhân viên'};
  return {ok:true, ten:tenNgan(n.Ten), ma:String(n.MaNV), codinh:String(n.KieuLuong||'')==='Cố định', thuong:luongGio(n), list:lkRows_().filter(function(x){ return x.MaNV===up(n.MaNV); }).map(function(x){ return Object.assign({moTa:lkMoTa_(x)}, x); })}; }
function lkThangChot_(tu, den){ var out=[]; for(var t=tu.slice(0,7); t<=den.slice(0,7); ){ if(thangDaChot(t)) out.push(t); var y=+t.slice(0,4), m=+t.slice(5,7)+1; if(m>12){ m=1; y++; } t=y+'-'+('0'+m).slice(-2); } return out; }
function luuLuongKhoang(p){ if(!laAdmin(p)) return {ok:false,msg:'Chỉ admin'}; var n=nvByMa(p.maNV); if(!n) return {ok:false,msg:'Không tìm thấy nhân viên'};
  if(String(n.KieuLuong||'')==='Cố định') return {ok:false,msg:tenNgan(n.Ten)+' hưởng lương cố định – lương riêng theo ngày chỉ áp cho lương giờ.'};
  var tu=String(p.tu||''), den=String(p.den||''), kieu=p.kieu==='heso'?'heso':'gio', gt=kieu==='heso'?so(p.giaTri):nghin(p.giaTri);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(tu) || !/^\d{4}-\d{2}-\d{2}$/.test(den)) return {ok:false,msg:'Chọn từ ngày và đến ngày'}; if(den<tu) return {ok:false,msg:'"Đến ngày" phải từ "Từ ngày" trở đi'};
  if(!(gt>0) || (kieu==='heso' && gt>5)) return {ok:false,msg:kieu==='heso'?'Hệ số từ 0,1 đến 5 (VD 1,2)':'Nhập lương giờ (VD 28)'};
  var chot=lkThangChot_(tu, den); if(chot.length) return {ok:false,msg:'Tháng '+chot.join(', ')+' đã chốt lương – mở chốt trước khi đặt lương riêng cho khoảng này.'};
  var sh=SS.getSheetByName('LuongKhoang'); if(!sh){ sh=SS.insertSheet('LuongKhoang'); sh.appendRow(['ID','MaNV','TuNgay','DenNgay','Kieu','GiaTri','GhiChu','Boi','Luc']); }
  var x={ID:idMoi('LK'), MaNV:String(n.MaNV), Tu:tu, Den:den, Kieu:kieu, GiaTri:gt};
  sh.appendRow([x.ID, x.MaNV, tu, den, kieu, gt, String(p.ghiChu||'').replace(/[<>]/g,'').slice(0,120), 'Admin', new Date()]); _LK=null;
  ghiNhatKy('Admin', tu.slice(0,7), n.MaNV, 'Lương riêng theo ngày', '', lkMoTa_(x)+(p.ghiChu?' – '+p.ghiChu:'')); return {ok:true, moTa:lkMoTa_(x)}; }
function xoaLuongKhoang(p){ if(!laAdmin(p)) return {ok:false,msg:'Chỉ admin'}; var sh=SS.getSheetByName('LuongKhoang'); if(!sh) return {ok:false,msg:'Không tìm thấy'};
  var x=lkRows_().filter(function(r){ return r.ID===String(p.id); })[0]; if(!x) return {ok:false,msg:'Không tìm thấy'}; var chot=lkThangChot_(x.Tu, x.Den); if(chot.length) return {ok:false,msg:'Tháng '+chot.join(', ')+' đã chốt lương – không xoá được.'};
  var v=sh.getDataRange().getValues(); for(var i=v.length-1;i>=1;i--) if(String(v[i][0])===x.ID){ sh.deleteRow(i+1); break; } _LK=null; ghiNhatKy('Admin', x.Tu.slice(0,7), x.MaNV, 'Xoá lương riêng theo ngày', lkMoTa_(x), ''); return {ok:true}; }
function mucTaiNgay0_(n, d, codinh, ls){ var rieng=nghin(n.LuongGio)>0, cur=codinh?nghinTien(n.LuongCoBan):(rieng?nghin(n.LuongGio):luongMacDinh(n,d)); if(!ls || !ls.length) return cur;
  if(d>=dateKey(ls[ls.length-1].Ngay)) return cur; for(var i=ls.length-1;i>=0;i--) if(d>=dateKey(ls[i].Ngay)) return so(ls[i].Len);
  return (!codinh && String(ls[0].TuMacDinh)==='Có')?luongMacDinh(n,d):so(ls[0].Tu); }
// Mốc giờ đêm từ Cài đặt chung: hiểu "22:00", "22h", "22", "22h30" (sai / trống → 22:00)
function gioDemTu_(){ var m=/^\s*(\d{1,2})\s*(?:[:hg.]\s*(\d{1,2}))?/i.exec(String(cfg('GIO_DEM_TU')||'')); if(!m) return 22*60; var h=+m[1], p=+(m[2]||0); return (h>=0&&h<24&&p<60)?h*60+p:22*60; }
// Giờ ra được tính của 1 lượt (để thống kê giờ đêm): theo cách quản lý duyệt
function raTinh_(r){ var c=String(r.Cach||''), m=c.match(/sửa (\d{2}:\d{2})–(\d{2}:\d{2})/); if(m) return m[2];
  if(/theo lịch/.test(c)) return hhmm(r.CaKT); if(/theo giờ chấm/.test(c)) return hhmm(r.Ra)||hhmm(r.CaKT);
  var kl=String(r.KhaiLoai||''); if((kl==='tang'||kl==='giam') && hhmm(r.KhaiDen)) return hhmm(r.KhaiDen); if(kl==='du') return hhmm(r.CaKT); return hhmm(r.Ra)||hhmm(r.CaKT); }
/* (29/10) THỐNG KÊ ĐI TRỄ (để trừ thưởng): phút trễ = giờ quét mã vào ca so với giờ bắt đầu ca (cột TreMin, app ghi lúc vào ca).
   "Trễ trên ngưỡng" theo Cài đặt chung → Trễ bao nhiêu phút vẫn chỉ là nhắc nhở (mặc định 10'). Có xin phép đến muộn ĐƯỢC ĐỒNG Ý hôm đó → vẫn liệt kê,
   ghi "có phép", KHÔNG cộng vào số lần / số phút trên ngưỡng. Bỏ qua giờ nạp từ file cũ (không có giờ quét thật). */
var _XPM=null;
function xpMuonDuyet_(){ if(_XPM) return _XPM; _XPM={}; (SS.getSheetByName('XinPhep')?rows('XinPhep'):[]).forEach(function(r){ if(String(r.Loai)==='muon' && String(r.TrangThai)==='Đồng ý') _XPM[up(r.MaNV)+'|'+dateKey(r.Ngay)]=String(r.LyDo||'có phép'); }); return _XPM; }
// Trễ quá lớn (≥ 2 giờ hoặc quá nửa ca) thường là CHỌN NHẦM CA khi quét mã (VD quét 20:23 mà chọn ca sáng) → không tự cộng, ghi "xem lại" để quản lý kiểm tra
function treThongKe_(L){ var ng=nguongXN().nn, xp=xpMuonDuyet_(), gh=+cfg('TRE_XEM_LAI_PHUT')||120, today=fmtDate(new Date()), o={lan:0, lan10:0, phut10:0, phutTong:0, phep:0, xemLai:0, nguong:ng, ds:[]};
  (L||[]).forEach(function(r){ if(String(r.KhaiLoai)==='nap') return; var t=Math.round(+r.TreMin||0); if(!(t>0)) return; var d=dateKey(r.Ngay), lp=xp[up(r.MaNV)+'|'+d], qua=t>ng;
    var caP=toMin(hhmm(r.CaKT))-toMin(hhmm(r.CaBD)), xl=t>=gh || (caP>0 && t>caP/2), tt=trangThaiRow(r,today), cho=(tt==='Chờ xác nhận');
    o.lan++; if(qua){ if(lp) o.phep++; else if(xl) o.xemLai++; else { o.lan10++; o.phut10+=t; } }
    if(!lp && !(qua&&xl)) o.phutTong+=t;   // tổng thời gian trễ (tham khảo): mọi lần trễ, trừ lần có phép và lần nghi chọn nhầm ca
    o.ds.push({ngay:d, ma:String(r.MaNV), cs:r.MaCS, ca:hhmm(r.CaBD)+'–'+hhmm(r.CaKT), vao:hhmm(r.Vao), tre:t, qua:qua, phep:lp?String(lp):'', xemLai:qua&&!lp&&xl, cho:cho}); });
  o.ds.sort(function(a,b){ return a.ngay<b.ngay?-1:(a.ngay>b.ngay?1:(a.vao<b.vao?-1:1)); }); return o; }
function tinhNguoi(n, cc, nhap, ung, M, le, th){
  var today=fmtDate(new Date()), ma=up(n.MaNV), nh=nhap[ma]||{}, cuoi=(th||today.slice(0,7))+'-31';
  var nC=nvTaiNgay(n, cuoi), codinh=String(n.KieuLuong||'')==='Cố định';
  // hệ số theo từng ngày (có ngày áp dụng); hồ sơ (vị trí, FT/PT, chức vụ) theo từng ngày
  var gioChuanD=function(d){ return so(n.GioChuanNgay)||+hsTaiNgay('GIO_CHUAN_NGAY',d)||8; }, ngayChuanD=function(d){ return so(n.NgayChuan)||+hsTaiNgay('NGAY_CHUAN',d)||26; }, hsTCD=function(d){ return +hsTaiNgay('HE_SO_TANG_CA',d)||1; };
  var vtD=function(d){ return vtLuong(nvTaiNgay(n,d)); }, comTuD=function(d){ return +hsTaiNgay('COM_TU_'+vtD(d),d)||8; }, comGiaD=function(d){ return nghin(hsTaiNgay('COM_GIA_'+vtD(d),d))||20; };
  var ftLuonD=function(d){ return String(cfg('COM_FT_LUON')||'Có')!=='Không' && nvTaiNgay(n,d).Loai==='FT'; }, gayCo=String(cfg('COM_NGAY_GAY')||'Có')!=='Không';
  var demTu=gioDemTu_(), gioLeThuc=0, gioDem=0, ngayDuyet={}, soCaDuyet={}, ngay={}, soCaNgay={}, theoCS={}, ngayCS={}, gio=0, gioTC=0, gioThieu=0, gioLe=0, ngayLe=0, choXN=0, quen=0, dai=[], dong=[];
  cc.forEach(function(r){ var tt=trangThaiRow(r,today); if(tt==='Chờ xác nhận') choXN++; if(tt==='Quên chấm ra'){ quen++; return; } if(tt==='Đang làm') return;
    var g=so(r.GioTinh), caG=(toMin(r.CaKT)-toMin(r.CaBD))/60, d=dateKey(r.Ngay), tc=(tt==='Đã xác nhận' && g>caG)?g-caG:0, thieu=g<caG?caG-g:0, duyet=(tt==='Đã xác nhận'||tt==='Đã xong');
    // (30/10b) Bảng lương CHỈ cộng giờ các ca đã duyệt. Ca "Chờ xác nhận" không vào tổng giờ, không vào theo quán, không vào lễ/đêm/tăng ca.
    ngay[d]=(ngay[d]||0)+g; soCaNgay[d]=(soCaNgay[d]||0)+1; if(duyet){ gio+=g; ngayDuyet[d]=(ngayDuyet[d]||0)+g; soCaDuyet[d]=(soCaDuyet[d]||0)+1; theoCS[r.MaCS]=(theoCS[r.MaCS]||0)+g; } ngayCS[r.MaCS]=ngayCS[r.MaCS]||{}; ngayCS[r.MaCS][d]=1;
    gioTC+=tc; gioThieu+=thieu; if(duyet){ if(le[d]){ gioLe+=g*(le[d]-1); gioLeThuc+=g; } var rt=toMin(raTinh_(r)); if(g>0 && rt>demTu) gioDem+=Math.min(g,(rt-demTu)/60); } dong.push({d:d, g:g, tc:tc, thieu:thieu}); });
  Object.keys(le).forEach(function(d){ if(ngay[d]) ngayLe+=le[d]-1; });
  Object.keys(ngay).forEach(function(d){ if(ngay[d]>(+cfg('GIO_BAT_THUONG_NGAY')||12)) dai.push(d.slice(8)+'/'+d.slice(5,7)+': '+Math.round(ngay[d]*100)/100+'h'); });
  // TIỀN CƠM (1 suất / ngày): tổng giờ ĐÃ ĐƯỢC QUẢN LÝ DUYỆT trong ngày (cộng mọi ca, mọi quán) ≥ mốc của vị trí (mặc định 8h).
  // Dưới mốc thì không có cơm – kể cả ca gãy hay nhân viên full time; ca chờ duyệt chưa tính.
  var coCom={}, lyCom={}; Object.keys(ngayDuyet).forEach(function(d){ var du=ngayDuyet[d]>=comTuD(d); coCom[d]=du; lyCom[d]=du?'đủ '+String(comTuD(d)).replace('.',',')+'h đã duyệt':''; });
  var tienComNgay={}; Object.keys(coCom).forEach(function(d){ if(coCom[d]) tienComNgay[d]=comGiaD(d); });
  var soNgay=Object.keys(ngay).length, soSuat=Object.keys(coCom).filter(function(d){ return coCom[d]; }).length, tienCom=Object.keys(coCom).reduce(function(a,d){ return a+(coCom[d]?comGiaD(d):0); },0);
  var gioChuan=gioChuanD(cuoi), hsTC=hsTCD(cuoi), comTu=comTuD(cuoi), comGia=comGiaD(cuoi);
  var o={comNgay:coCom, comLy:lyCom, comTienNgay:tienComNgay, MaNV:String(n.MaNV), Ten:tenNgan(n.Ten), ViTri:nC.ViTri, Nhom:nhomLuong(nC), Loai:nC.Loai, KieuLuong:codinh?'Cố định':'Giờ', TrangThai:n.TrangThai,
    soNgay:soNgay, soCa:cc.length, soSuat:soSuat, choXN:choXN, quen:quen, dai:dai, theoCS:{}, ngayCS:{}, tamUngDong:ung[ma]||0, sua:{}};
  Object.keys(theoCS).forEach(function(k){ o.theoCS[k]=Math.round(theoCS[k]*100)/100; o.ngayCS[k]=Object.keys(ngayCS[k]).length; });
  var lay=function(k, tinh){ if(nh[k]!==undefined && nh[k]!==''){ o.sua[k]=1; return so(nh[k]); } return tinh; };
  var ls=lsLuong(n, codinh), suaMuc=codinh?(nh.lcb!==undefined&&nh.lcb!==''):(nh.luong!==undefined&&nh.luong!=='');
  o.gio=lay('gio', Math.round(gio*100)/100);
  o.luong=lay('luong', luongGio(n)); if(!codinh && !o.sua.luong) o.luong=mucTaiNgay(n, cuoi, false, ls);
  o.lcb=codinh?lay('lcb', nghinTien(n.LuongCoBan)):0; if(codinh && !o.sua.lcb) o.lcb=mucTaiNgay(n, cuoi, true, ls);
  // mức theo từng ngày (đổi lương / đổi vị trí giữa tháng thì mỗi ngày tính đúng mức của ngày đó)
  var muc=function(d){ return suaMuc?(codinh?o.lcb:o.luong):mucTaiNgay(n, d, codinh, ls); };
  o.khoang=codinh?[]:lkRows_().filter(function(x){ return x.MaNV===up(n.MaNV) && x.Den>=cuoi.slice(0,8)+'01' && x.Tu<=cuoi; }).map(lkMoTa_);
  o.doiLuong=suaMuc?[]:ls.filter(function(x){ return dateKey(x.Ngay).slice(0,7)===cuoi.slice(0,7); }).map(function(x){ return {tu:dateKey(x.Ngay), cu:so(x.Tu), moi:so(x.Len)}; });
  var ngayChuan=ngayChuanD(cuoi), luongNgay=codinh?o.lcb/ngayChuan:0, lgQD=codinh?luongNgay/gioChuan:o.luong;
  o.luongNgay=Math.round(luongNgay*100)/100; o.luongGioQD=Math.round(lgQD*100)/100;
  if(codinh){ o.ngay=Math.round((soNgay-gioThieu/gioChuan)*100)/100; var t=0;
    Object.keys(ngay).forEach(function(d){ t+=muc(d)/ngayChuanD(d)*(1+(le[d]?le[d]-1:0)); });
    dong.forEach(function(x){ var q=muc(x.d)/ngayChuanD(x.d)/gioChuanD(x.d); t+=-x.thieu*q + x.tc*q*hsTCD(x.d); }); o.tienLuong=t; }
  else { o.ngay=soNgay; if(o.sua.gio) o.tienLuong=o.gio*o.luong + gioTC*o.luong*(hsTC-1) + gioLe*o.luong;
    else { var t2=0; dong.forEach(function(x){ var m=muc(x.d); t2+=x.g*m + x.tc*m*(hsTCD(x.d)-1) + (le[x.d]?x.g*(le[x.d]-1)*m:0); }); o.tienLuong=t2; } }
  o.tienLuong=Math.round(o.tienLuong*10)/10; o.gioTC=Math.round(gioTC*100)/100; o.gioLeThuc=Math.round(gioLeThuc*100)/100; o.gioDem=Math.round(gioDem*100)/100; o.gioThieu=Math.round(gioThieu*100)/100;
  o.com=M.an.com?0:lay('com', Math.round(tienCom*10)/10); o.comGia=comGia; o.comTu=comTu;
  ['nghi','pc','thuong','tru','thuongThem'].forEach(function(k){ o[k]=M.an[k]?0:lay(k,0); });
  o.ung=M.an.ung?0:o.tamUngDong;
  o.them={}; var cg=0, tr=0; M.them.forEach(function(m){ var v=lay(m.Ma,0); o.them[m.Ma]=v; if(m.Loai==='cong') cg+=v; else tr+=v; });
  var tre=treThongKe_(cc); o.tre=tre; o.treLan=tre.lan; o.treLan10=tre.lan10; o.trePhut10=tre.phut10; o.trePhep=tre.phep; o.treXemLai=tre.xemLai; o.trePhutTong=tre.phutTong;
  o.tn=Math.round((o.tienLuong + o.com + o.nghi*lgQD + o.pc + o.thuong + cg)*10)/10;
  o.con=Math.round((o.tn - o.ung - o.tru - tr)*10)/10;
  o.thuc=Math.round((o.con + o.thuongThem)*10)/10;
  return o; }
function luongGio(n){ var v=nghin(n.LuongGio); if(v>0) return v; return nghin(cfg('LUONG_'+vtLuong(n)))||nghin(cfg('LUONG_Phục vụ'))||0; }
function duLieuThang(th){ var cc={}; ccRows().forEach(function(r){ if(dateKey(r.Ngay).slice(0,7)!==th) return; var m=up(r.MaNV); (cc[m]=cc[m]||[]).push(r); }); return cc; }

/* ---------- bảng lương tháng (mẫu cũ: nhân viên theo cột, nhóm FT / PT / Quản lý) ---------- */
function bangLuong(p){ var _q=khongQuyen(p.pin,'luong',1); if(_q) return _q;
  if(p.tu && p.den) return bangLuongKy_(p);
  var th=String(p.thang||fmtTZ_(new Date(),TZ,'yyyy-MM')), lt=thangDaLuuTru(th);
  if(lt) return {ok:true, thang:th, khoa:true, luuTru:String(lt.URL), list:[], muc:mucLuong(), stores:rows('CoSo').map(function(c){ return {MaCS:c.MaCS,TenCS:c.TenCS}; }), kiemTra:[]};
  var snap=thangDaChot(th)?banChot(th):null;   // tháng đã chốt: hiện đúng số liệu lúc chốt, đổi lương / hệ số sau này không ảnh hưởng
  if(snap) return {ok:true, thang:th, khoa:true, list:Object.keys(snap).map(function(k){ return snap[k]; }).sort(function(a,b){ return a.MaNV<b.MaNV?-1:1; }), muc:mucLuong(), stores:rows('CoSo').map(function(c){ return {MaCS:c.MaCS,TenCS:c.TenCS}; }), kiemTra:[], banChot:true};
  var cc=duLieuThang(th), nhap=nhapThang(th), ung=tamUngThang(th), M=mucLuong(), le=ngayLeMap();
  var list=rows('NhanVien').filter(function(n){ var m=up(n.MaNV); return cc[m] || nhap[m] || ung[m] || (dangLam(n) && (nghinTien(n.LuongCoBan)>0 && String(n.KieuLuong)==='Cố định')); })
    .map(function(n){ return tinhNguoi(n, cc[up(n.MaNV)]||[], nhap, ung, M, le, th); }).sort(function(a,b){ return a.MaNV<b.MaNV?-1:1; });
  return {ok:true, thang:th, khoa:thangDaChot(th), list:list, muc:M, stores:rows('CoSo').map(function(c){ return {MaCS:c.MaCS,TenCS:c.TenCS}; }), kiemTra:kiemTra(list, th)}; }
// Bảng lương MỘT KỲ trong tháng (VD 1–15): cùng mẫu bảng lương tháng, chỉ giờ đã chấm trong kỳ × lương giờ + tiền cơm.
// Phụ cấp, thưởng, tạm ứng, trừ lỗi, mục thêm tính ở bảng cả tháng → để trống. Chỉ xem, không sửa / chốt ở chế độ này.
function bangLuongKy_(p){ var tu=String(p.tu), den=String(p.den);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(tu)||!/^\d{4}-\d{2}-\d{2}$/.test(den)||den<tu) return {ok:false,msg:'Chọn từ ngày – đến ngày'};
  if(tu.slice(0,7)!==den.slice(0,7)) return {ok:false,msg:'Kỳ lương phải nằm trong cùng 1 tháng (VD 01–15 hoặc 16–cuối tháng)'};
  var th=tu.slice(0,7), dl=duLieuThang(th), M=mucLuong(), le=ngayLeMap(), cc={};
  Object.keys(dl).forEach(function(m){ var L=dl[m].filter(function(r){ var d=dateKey(r.Ngay); return d>=tu && d<=den; }); if(L.length) cc[m]=L; });
  var list=rows('NhanVien').filter(function(n){ return cc[up(n.MaNV)]; }).map(function(n){ return tinhNguoi(n, cc[up(n.MaNV)], {}, {}, M, le, th); }).sort(function(a,b){ return a.MaNV<b.MaNV?-1:1; });
  return {ok:true, thang:th, khoa:true, ky:{tu:tu, den:den}, list:list, muc:M, stores:rows('CoSo').map(function(c){ return {MaCS:c.MaCS,TenCS:c.TenCS}; }), kiemTra:[]}; }
function luuO(p){ if(!laAdmin(p)) return {ok:false,msg:'Chỉ admin'}; var th=String(p.thang); if(thangDaChot(th)) return {ok:false,msg:'Tháng '+th+' đã chốt. Mở chốt để sửa.'};
  var muc=String(p.muc), M=mucLuong(); if(MUC_NHAP.indexOf(muc)<0 && !M.them.some(function(m){ return m.Ma===muc; })) return {ok:false,msg:'Mục này không sửa tay được'};
  var sh=sh_('LuongNhap'), v=sh.getDataRange().getValues(), gt=(p.giaTri===''||p.giaTri===null)?'':so(p.giaTri), cu='';
  for(var i=1;i<v.length;i++) if(thKey_(v[i][0])===th && up(v[i][1])===up(p.maNV) && String(v[i][2])===muc){ cu=v[i][3]; if(gt==='') sh.deleteRow(i+1); else sh.getRange(i+1,4).setValue(gt); ghiNhatKy('Admin',th,p.maNV,muc,cu,gt); return {ok:true}; }
  if(gt!=='') sh.appendRow([thGhi_(th), String(p.maNV), muc, gt]); ghiNhatKy('Admin',th,p.maNV,muc,'',gt); return {ok:true}; }

/* ---------- tạm ứng: ghi từng lần, cảnh báo vượt số lương đã làm ---------- */
function dsTamUng(p){ var _q=khongQuyen(p.pin,'luong',1); if(_q) return _q; var th=String(p.thang);
  return {ok:true, list:rows('TamUng').filter(function(r){ return thKey_(r.Thang)===th && (!p.maNV || up(r.MaNV)===up(p.maNV)); }).map(function(r){ var n=nvByMa(r.MaNV); return {ID:String(r.ID),Ngay:dateKey(r.Ngay),MaNV:String(r.MaNV),Ten:n?tenNgan(n.Ten):r.MaNV,SoTien:nghinTien(r.SoTien),GhiChu:r.GhiChu}; })}; }
function themTamUng(p){ if(!laAdmin(p)) return {ok:false,msg:'Chỉ admin'}; var th=String(p.thang), tien=nghinTien(p.soTien); if(thangDaChot(th)) return {ok:false,msg:'Tháng đã chốt'};
  var n=nvByMa(p.maNV); if(!n) return {ok:false,msg:'Không tìm thấy nhân viên'}; if(!(tien>0)) return {ok:false,msg:'Nhập số tiền'};
  var cc=duLieuThang(th)[up(n.MaNV)]||[], o=tinhNguoi(n, cc, nhapThang(th), tamUngThang(th), mucLuong(), ngayLeMap(), th), conLai=o.tn-o.ung-o.tru;
  if(tien>conLai && !p.vanGhi) return {ok:false, canhBao:true, msg:tenNgan(n.Ten)+' mới làm được '+Math.round(o.tn*10)/10+' nghìn trong tháng, đã ứng '+o.ung+' nghìn. Ứng thêm '+tien+' nghìn sẽ vượt số lương đã làm.'};
  var id=maMoi('U')+'-'+up(n.MaNV);
  sh_('TamUng').appendRow([id, p.ngay||fmtDate(new Date()), thGhi_(th), String(n.MaNV), tien, String(p.ghiChu||''), 'Admin']); ghiNhatKy('Admin',th,n.MaNV,'Tạm ứng','',tien+(p.ghiChu?' ('+p.ghiChu+')':'')); return {ok:true}; }
function xoaTamUng(p){ if(!laAdmin(p)) return {ok:false,msg:'Chỉ admin'}; var sh=sh_('TamUng'), v=sh.getDataRange().getValues();
  for(var i=1;i<v.length;i++) if(String(v[i][0])===String(p.id)){ if(thangDaChot(thKey_(v[i][2]))) return {ok:false,msg:'Tháng đã chốt'}; sh.deleteRow(i+1); ghiNhatKy('Admin',v[i][2],v[i][3],'Xoá tạm ứng',v[i][4],''); return {ok:true}; }
  return {ok:false,msg:'Không tìm thấy'}; }

/* ---------- kiểm tra trước khi chốt, chốt tháng (lưu bản chốt riêng), mở chốt ---------- */
function kiemTra(list, th){ var out=[], gioThang=+cfg('GIO_BAT_THUONG_THANG')||300;
  list.forEach(function(o){ var t=o.Ten+' ('+o.MaNV+')';
    if(o.choXN) out.push({muc:'Chờ xác nhận', ai:t, chiTiet:o.choXN+' ca chưa được quản lý xác nhận'});
    if(o.quen) out.push({muc:'Quên chấm ra', ai:t, chiTiet:o.quen+' ca chưa có giờ ra (không tính lương)'});
    if(o.dai.length) out.push({muc:'Giờ bất thường', ai:t, chiTiet:'Ngày quá dài: '+o.dai.join(', ')});
    if(o.gio>gioThang) out.push({muc:'Giờ bất thường', ai:t, chiTiet:'Tháng '+o.gio+'h (trên '+gioThang+'h)'});
    if(o.KieuLuong==='Cố định' ? !(o.lcb>0) : (!(o.luong>0) && o.gio>0)) out.push({muc:'Thiếu mức lương', ai:t, chiTiet:o.KieuLuong==='Cố định'?'Chưa có lương cơ bản':'Chưa có lương giờ'});
    if(o.con<0) out.push({muc:'CÒN LẠI âm', ai:t, chiTiet:'Còn lại '+o.con+' nghìn (tạm ứng / trừ vượt lương)'}); });
  return out; }
function chotThang(p){ if(!laAdmin(p)) return {ok:false,msg:'Chỉ admin'}; memoXoa_('ChotThang'); var th=String(p.thang); if(thangDaChot(th)) return {ok:false,msg:'Tháng đã chốt rồi'};
  var b=bangLuong(p); if(b.kiemTra.length && !p.boQua) return {ok:false, canKiemTra:true, kiemTra:b.kiemTra, msg:'Còn '+b.kiemTra.length+' việc cần xem trước khi chốt'};
  var tab=xuatBangLuong({pin:p.pin, thang:th, ten:'Lương '+th+' (đã chốt)'}); luuBanChot(th, b.list); sh_('ChotThang').appendRow([thGhi_(th), new Date(), 'Admin']); ghiNhatKy('Admin',th,'','Chốt tháng','',tab.tab||''); memoXoa_('ChotThang'); return {ok:true, tab:tab.tab}; }
function moChot(p){ if(!laAdmin(p)) return {ok:false,msg:'Chỉ admin'}; memoXoa_('ChotThang'); var sh=sh_('ChotThang'), v=sh.getDataRange().getValues();
  for(var i=v.length-1;i>=1;i--) if(thKey_(v[i][0])===thKey_(p.thang)){ sh.deleteRow(i+1); xoaBanChot(String(p.thang)); ghiNhatKy('Admin',p.thang,'','Mở chốt tháng','đã chốt','mở'); memoXoa_('ChotThang'); return {ok:true}; } return {ok:false,msg:'Tháng này chưa chốt'}; }
function xuatBangLuong(p){ var b=bangLuong(p); if(!b.ok) return b; var name=p.ten||(b.ky?'Lương '+b.ky.tu.slice(8)+'–'+b.ky.den.slice(8)+'.'+b.thang.slice(5,7)+'.'+b.thang.slice(0,4):'Lương '+b.thang), sh=SS.getSheetByName(name); if(sh) sh.clear(); else sh=SS.insertSheet(name);
  var them=b.muc.them, H=['Mã','Tên','Nhóm','Kiểu lương'].concat(b.stores.map(function(s){return 'Giờ '+s.TenCS;})).concat(['Giờ làm','Ngày công','Lương giờ','Lương cơ bản','Tiền lương','Tiền cơm','Giờ nghỉ có lương','Phụ cấp','Thưởng'])
    .concat(them.filter(function(m){return m.Loai==='cong';}).map(function(m){return m.Ten;})).concat(['Tổng nhận','Tạm ứng','Trừ lỗi']).concat(them.filter(function(m){return m.Loai==='tru';}).map(function(m){return m.Ten;})).concat(['CÒN LẠI','Thưởng thêm','THỰC NHẬN']);
  var v=[H].concat(b.list.map(function(x){ return [x.MaNV,x.Ten,{FT:'Full time',PT:'Part time',QL:'Quản lý'}[x.Nhom],x.KieuLuong].concat(b.stores.map(function(s){ return x.theoCS[s.MaCS]||0; }))
    .concat([x.gio,x.ngay,x.luong,x.lcb,x.tienLuong,x.com,x.nghi,x.pc,x.thuong]).concat(them.filter(function(m){return m.Loai==='cong';}).map(function(m){return x.them[m.Ma]||0;}))
    .concat([x.tn,x.ung,x.tru]).concat(them.filter(function(m){return m.Loai==='tru';}).map(function(m){return x.them[m.Ma]||0;})).concat([x.con,x.thuongThem,x.thuc]); }));
  sh.getRange(1,1,v.length,H.length).setValues(v); return {ok:true, tab:name, url:SS.getUrl()}; }

/* ---------- bảng lương từng cơ sở (5 hộ kinh doanh) ---------- */
function luongCoSo(p){ var b=bangLuong(p); if(!b.ok) return b; var cs=String(p.maCS||'TP');
  var list=b.list.filter(function(x){ return x.theoCS[cs]; }).map(function(x){ var tl=x.gio?x.theoCS[cs]/x.gio:0;
    return {MaNV:x.MaNV, Ten:x.Ten, Nhom:x.Nhom, gio:x.theoCS[cs], ngay:x.ngayCS[cs]||0, tyLe:Math.round(tl*100), tienLuong:Math.round(x.tienLuong*tl*10)/10, com:Math.round(x.com*tl*10)/10,
      khac:Math.round((x.nghi*x.luongGioQD+x.pc+x.thuong+x.thuongThem)*tl*10)/10, tong:Math.round((x.tienLuong+x.com+x.nghi*x.luongGioQD+x.pc+x.thuong+x.thuongThem)*tl*10)/10}; });
  return {ok:true, thang:b.thang, ky:b.ky||null, maCS:cs, list:list, stores:b.stores}; }

/* ---------- tra cứu giờ công & phiếu lương từng người ---------- */
function traCuuGioCong(p){ var role=authRole(p.pin); if(!role) return {ok:false,msg:'Sai mã'}; if(quyen(p.pin,'tra')<1 && quyen(p.pin,'luong')<1) return {ok:false,msg:'Tài khoản của bạn không có quyền xem mục này'}; if(role!=='admin') role=quyen(p.pin,'luong')>=1?'admin':role; var th=String(p.thang), n=nvByMa(p.maNV); if(!n) return {ok:false,msg:'Không tìm thấy'};
  var today=fmtDate(new Date()), cc=(duLieuThang(th)[up(n.MaNV)]||[]).sort(function(a,b){ return (dateKey(a.Ngay)+hhmm(a.Vao))<(dateKey(b.Ngay)+hhmm(b.Vao))?-1:1; }), le=ngayLeMap();
  var o=tinhNguoi(n, cc, nhapThang(th), tamUngThang(th), mucLuong(), le, th), ngay={}; var snap=banChot(th); if(snap && snap[up(n.MaNV)]) o=snap[up(n.MaNV)];
  cc.forEach(function(r){ var tt=trangThaiRow(r,today); if(tt==='Quên chấm ra'||tt==='Đang làm') return; var d=dateKey(r.Ngay); ngay[d]=(ngay[d]||0)+so(r.GioTinh); });
  if(role!=='admin'){ var gon={}; ['MaNV','Ten','ViTri','Nhom','Loai','soNgay','soCa','gio','theoCS','ngayCS','choXN','quen'].forEach(function(k){ gon[k]=o[k]; }); o=gon; }   // quản lý: chỉ giờ công, không tiền
  return {ok:true, admin:role==='admin', nv:o, ca:cc.map(function(r){ var d=dateKey(r.Ngay); return {Ngay:d, MaCS:r.MaCS, CaBD:hhmm(r.CaBD), CaKT:hhmm(r.CaKT), Vao:hhmm(r.Vao), Ra:hhmm(r.Ra), Gio:so(r.GioTinh), TrangThai:trangThaiRow(r,today), KhaiLoai:r.KhaiLoai, NgayGio:Math.round((ngay[d]||0)*100)/100, Com:role==='admin'?!!o.comNgay[d]:null, ComLy:role==='admin'?((o.comLy||{})[d]||''):'', ComTien:role==='admin'?((o.comTienNgay||{})[d]||0):0, Le:role==='admin'?(le[d]||0):0}; })}; }
function phieuLuong(p){ var _q=khongQuyen(p.pin,'luong',1); if(_q) return _q;
  if(p.tu && p.den){ var b=bangLuongKy_(p); if(!b.ok) return b; var n0=nvByMa(p.maNV); if(!n0) return {ok:false,msg:'Không tìm thấy'}; var o=b.list.filter(function(x){ return up(x.MaNV)===up(p.maNV); })[0];
    if(!o) return {ok:false,msg:tenNgan(n0.Ten)+' không có giờ công trong kỳ '+b.ky.tu.slice(8)+'/'+b.ky.tu.slice(5,7)+' – '+b.ky.den.slice(8)+'/'+b.ky.den.slice(5,7)};
    return {ok:true, thang:b.thang, ky:b.ky, nv:o, muc:mucLuong(), ghiChuPhieu:dm('GHI_CHU_PHIEU'), stores:b.stores}; }
  var t=traCuuGioCong(p); if(!t.ok) return t; var M=mucLuong(); return {ok:true, thang:p.thang, nv:t.nv, muc:M, ghiChuPhieu:dm('GHI_CHU_PHIEU'), stores:rows('CoSo').map(function(c){ return {MaCS:c.MaCS,TenCS:c.TenCS}; })}; }

/* ---------- nhân sự: tăng lương (lưu lịch sử), xoá người thêm nhầm ---------- */
function tangLuong(p){ _LSL=null; if(!laAdmin(p)) return {ok:false,msg:'Chỉ admin'}; var n=nvByMa(p.maNV); if(!n) return {ok:false,msg:'Không tìm thấy'};
  if(p.ngay && !/^\d{4}-\d{2}-\d{2}$/.test(String(p.ngay))) return {ok:false,msg:'Ngày áp dụng không hợp lệ'};
  var lsCu=lsLuong(n, String(n.KieuLuong||'')==='Cố định'); if(p.ngay && lsCu.length && String(p.ngay)<dateKey(lsCu[lsCu.length-1].Ngay)) return {ok:false,msg:'Đã có lần đổi lương từ '+dateKey(lsCu[lsCu.length-1].Ngay).split('-').reverse().join('/')+'. Ngày áp dụng phải sau ngày đó.'};
  var codinh=String(n.KieuLuong||'')==='Cố định', key=codinh?'LuongCoBan':'LuongGio', cu=codinh?nghinTien(n.LuongCoBan):luongGio(n), moi=codinh?nghinTien(p.mucMoi):nghin(p.mucMoi); if(!(moi>0)) return {ok:false,msg:'Nhập mức mới'};
  var sh=sh_('NhanVien'), h=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0]; sh.getRange(n._r, h.indexOf(key)+1).setValue(moi);
  ensureCols('LichSuLuong',['TuMacDinh']); var shL=sh_('LichSuLuong'), hL=shL.getRange(1,1,1,shL.getLastColumn()).getValues()[0], oL={Ngay:p.ngay||fmtDate(new Date()), MaNV:String(n.MaNV), Kieu:codinh?'Lương cơ bản':'Lương giờ', Tu:cu, Len:moi, GhiChu:String(p.ghiChu||''), Boi:'Admin', TuMacDinh:(!codinh && !(nghin(n.LuongGio)>0))?'Có':''};
  shL.appendRow(hL.map(function(k){ return oL[k]!==undefined?oL[k]:''; })); ghiNhatKy('Admin','',n.MaNV,codinh?'Tăng lương cơ bản':'Tăng lương giờ',cu,moi);
  _LSL=null; return {ok:true, cu:cu, moi:moi, ngay:p.ngay||fmtDate(new Date())}; }
function lichSuLuong(p){ var _q=khongQuyen(p.pin,'luong',1); if(_q) return _q; return {ok:true, list:rows('LichSuLuong').filter(function(r){ return !p.maNV || up(r.MaNV)===up(p.maNV); }).map(function(r){ return {Ngay:dateKey(r.Ngay),MaNV:String(r.MaNV),Kieu:r.Kieu,Tu:r.Tu,Len:r.Len,GhiChu:r.GhiChu}; })}; }
function xoaNhanVien(p){ if(!laAdmin(p)) return {ok:false,msg:'Chỉ admin'}; var n=nvByMa(p.maNV); if(!n) return {ok:false,msg:'Không tìm thấy'};
  if(ccRows().some(function(r){ return up(r.MaNV)===up(n.MaNV); })) return {ok:false,msg:tenNgan(n.Ten)+' đã có chấm công nên không xoá được. Hãy bấm Nghỉ việc để giữ lịch sử.'};
  sh_('NhanVien').deleteRow(n._r); ghiNhatKy('Admin','',n.MaNV,'Xoá nhân viên',tenNgan(n.Ten),''); return {ok:true}; }
function nhatKySua(p){ var _q=khongQuyen(p.pin,'nk',1); if(_q) return _q; return {ok:true, list:rows('NhatKySua').filter(function(r){ return !p.thang || thKey_(r.Thang)===thKey_(p.thang) || !r.Thang; }).slice(-300).reverse().map(function(r){ return {Luc:(r.Luc instanceof Date)?fmtTZ_(r.Luc,TZ,'dd/MM HH:mm'):String(r.Luc),Boi:r.Boi,Thang:thKey_(r.Thang),MaNV:String(r.MaNV||''),Muc:r.Muc,Cu:r.Cu,Moi:r.Moi}; })}; }

/* ---------- đợt giờ công (1–10, 11–20, 21–cuối tháng): quản lý duyệt, nhân viên xem ---------- */
function khoangDot(th, dot){ var d1=+cfg('DOT_1_DEN')||10, d2=+cfg('DOT_2_DEN')||20, last=cuoiThang(th), a=[1,d1+1,d2+1][dot-1], b=[d1,d2,last][dot-1];
  return {tu:th+'-'+('0'+a).slice(-2), den:th+'-'+('0'+b).slice(-2), nhan:a+'–'+b+'/'+(+th.slice(5,7))}; }
function dsDot(p){ if(!authRole(p.pin)) return {ok:false,msg:'Sai mã'}; var th=String(p.thang), today=fmtDate(new Date()), duyet={};
  rows('DuyetDot').forEach(function(r){ if(thKey_(r.Thang)===th) duyet[+r.Dot]=(r.Luc instanceof Date)?fmtTZ_(r.Luc,TZ,'dd/MM HH:mm'):String(r.Luc); });
  var CC=ccRows(), BQ=(SS.getSheetByName('BaoQuen')?rows('BaoQuen'):[]);   // đọc 1 lần cho cả 3 đợt (trước đây 3 lần)
  return {ok:true, thang:th, list:[1,2,3].map(function(k){ var kh=khoangDot(th,k), cho=CC.filter(function(r){ var d=dateKey(r.Ngay); if(d<kh.tu||d>kh.den) return false; var tt=trangThaiRow(r,today); return tt==='Chờ xác nhận'||tt==='Quên chấm ra'; }).length + BQ.filter(function(q){ var d=dateKey(q.Ngay); return String(q.TrangThai)==='Chờ' && d>=kh.tu && d<=kh.den; }).length;
    return {Dot:k, Nhan:kh.nhan, Tu:kh.tu, Den:kh.den, ChoXuLy:cho, DaDuyet:duyet[k]||'', XongNgay:kh.den<today}; })}; }
function duyetDot(p){ memoXoa_('DuyetDot'); var _q=khongQuyen(p.pin,'duyet',2); if(_q) return _q; var role=authRole(p.pin); if(!role) return {ok:false,msg:'Sai mã'}; var th=String(p.thang), k=+p.dot, ds=dsDot(p).list[k-1]; if(!ds) return {ok:false,msg:'Đợt không hợp lệ'};
  if(ds.DaDuyet) return {ok:false,msg:'Đợt này đã duyệt'}; if(!ds.XongNgay) return {ok:false,msg:'Đợt '+ds.Nhan+' chưa hết ngày'};
  if(!ccRows().some(function(r){ var d=dateKey(r.Ngay); return d>=ds.Tu && d<=ds.Den; })) return {ok:false,msg:'Đợt '+ds.Nhan+' chưa có dữ liệu chấm công trong app. Nạp dữ liệu cũ trước rồi mới khoá sổ.'};
  if(ds.ChoXuLy) return {ok:false,msg:'Còn '+ds.ChoXuLy+' lượt chờ xác nhận / quên chấm ra trong đợt '+ds.Nhan+'. Xử lý ở tab Xác nhận giờ trước.'};
  sh_('DuyetDot').appendRow([thGhi_(th), k, new Date(), role==='admin'?'Admin':'Quản lý']); memoXoa_('DuyetDot'); return {ok:true}; }
// Nhân viên xem giờ công từng ngày ngay khi quản lý duyệt (không có tiền). Đợt đã duyệt = đã khoá sổ.
function gioCongCuaToi(p){ var k=nvTuPhien_(p)||ksNVcc(p.maNV,p.sdt4); if(k.loi) return {ok:false,msg:k.loi, hetPhien:!!k.hetPhien}; if(!k.phien) k.phien=phienCap_(k.nv.MaNV); var n=k.nv, th=String(p.thang||fmtTZ_(new Date(),TZ,'yyyy-MM')), today=fmtDate(new Date());
  var duyet={}; rows('DuyetDot').forEach(function(r){ if(thKey_(r.Thang)===th) duyet[+r.Dot]=1; });
  var dots=[1,2,3].map(function(d){ var kh=khoangDot(th,d); return {Dot:d, Nhan:kh.nhan, Tu:kh.tu, Den:kh.den, DaDuyet:!!duyet[d]}; });
  var ph={}; (SS.getSheetByName('PhanHoi')?rows('PhanHoi'):[]).forEach(function(r){ ph[String(r.CCID)]={NoiDung:r.NoiDung, TrangThai:r.TrangThai, TraLoi:r.TraLoi}; });
  var han=+cfg('PHAN_HOI_NGAY')||3, ng=+cfg('NHAC_NHO_PHUT')||10;
  var ca=ccRows().filter(function(r){ return up(r.MaNV)===up(n.MaNV) && dateKey(r.Ngay).slice(0,7)===th; })
    .sort(function(a,b){ return (dateKey(a.Ngay)+hhmm(a.Vao))<(dateKey(b.Ngay)+hhmm(b.Vao))?-1:1; })
    .map(function(r){ var tt=trangThaiRow(r,today), da=tt==='Đã xác nhận'||tt==='Đã xong', luc=r.XacNhanLuc instanceof Date?r.XacNhanLuc.getTime():0, tre=+r.TreMin||0;
      // (30/10) Trang của NHÂN VIÊN: chỉ ca theo lịch + tổng giờ đã duyệt. Không gửi giờ chấm thực tế, ghi chú / lý do quản lý điều chỉnh, số phút trễ.
      var caG=Math.round((toMin(hhmm(r.CaKT))-toMin(hhmm(r.CaBD)))/60*100)/100, g=da?so(r.GioTinh):null;
      return {ID:String(r.ID), Ngay:dateKey(r.Ngay), MaCS:r.MaCS, Ca:hhmm(r.CaBD)+'–'+hhmm(r.CaKT), CaGio:caG, Gio:g, DaDuyet:da, TrangThai:tt,
        DiTre:tre>5, TangCa:!!(da && caG>0 && g>caG+0.01),
        PhanHoi:ph[String(r.ID)]||null, ChoPhanHoi:da && !ph[String(r.ID)] && (!luc || new Date().getTime()-luc<=han*864e5+864e5)}; });
  return {ok:true, phien:k.phien, ten:tenNgan(n.Ten), maNV:String(n.MaNV), thang:th, dots:dots, ca:ca, hanPhanHoi:han, stores:rows('CoSo').map(function(c){ return {MaCS:c.MaCS,TenCS:c.TenCS}; })}; }

function ksNVcc(maNV, sdt4){ var n=nvByMa(maNV); if(!n) return {loi:'Không tìm thấy mã '+maNV}; var sdt=String(n.SDT||'').replace(/\D/g,''); if(sdt.length>=4 && String(sdt4||'')!==sdt.slice(-4)) return {loi:'4 số cuối điện thoại không khớp'}; return {nv:n}; }


/* ================= LƯU TRỮ THEO THÁNG =================
   Tháng đã CHỐT lương và đã qua LUU_TRU_SAU_NGAY ngày (mặc định 10) sau cuối tháng → tự tách ra một file Google Sheet riêng
   ("Chấm công Ncafe – Lưu trữ YYYY-MM": chấm công, tạm ứng, nhập tay, duyệt đợt, nhật ký, bảng lương đã chốt),
   rồi xoá các dòng đó khỏi file chính cho nhẹ. File lưu trữ anh copy về máy / Drive khác rồi xoá được; app không cần nó nữa.
   Danh sách nhân viên, lịch sử tăng lương, tài khoản, cài đặt luôn ở file chính. */
function thangDaLuuTru(th){ return (SS.getSheetByName('LuuTru')?rows('LuuTru'):[]).filter(function(r){ return thKey_(r.Thang)===thKey_(th); })[0]; }
function thuMucLuuTru(){ var id=String(cfg('LUU_TRU_FOLDER_ID')||''); if(id){ try{ return DriveApp.getFolderById(id); }catch(e){} }
  var f=DriveApp.createFolder('Lưu trữ chấm công Ncafe'); setCfg('LUU_TRU_FOLDER_ID', f.getId()); return f; }
function locRa(tenTab, giu){ var sh=SS.getSheetByName(tenTab); if(!sh || sh.getLastRow()<2) return {ra:[], h:sh?sh.getRange(1,1,1,Math.max(1,sh.getLastColumn())).getValues()[0]:[]};
  var v=sh.getDataRange().getValues(), h=v.shift(), ra=[], o=[]; v.forEach(function(r){ if(r.join('')==='') return; if(giu(r,h)) o.push(r); else ra.push(r); });
  sh.getRange(2,1,v.length,h.length).clearContent(); if(o.length) sh.getRange(2,1,o.length,h.length).setValues(o); return {ra:ra, h:h}; }
function luuTruThang(p){ var th=String(p.thang); if(p.pin!==undefined && !laAdmin(p)) return {ok:false,msg:'Chỉ admin'};
  if(!thangDaChot(th)) return {ok:false,msg:'Tháng '+th+' chưa chốt lương nên chưa lưu trữ được.'}; if(thangDaLuuTru(th)) return {ok:false,msg:'Tháng '+th+' đã lưu trữ rồi.'};
  var lock=LockService.getScriptLock(); lock.waitLock(30000);
  try{ var file=SpreadsheetApp.create('Chấm công Ncafe – Lưu trữ '+th), dem=0;
    var ghi=function(ten, d){ var s=file.insertSheet(ten); var v=[d.h].concat(d.ra); if(v[0].length) s.getRange(1,1,v.length,v[0].length).setValues(v); dem+=d.ra.length; };
    var trongThang=function(i){ return function(r,h){ var x=h.indexOf(i); var val=r[x]; var k=thKey_(val); return k!==th; }; };   // thKey_: hiểu cả chữ "2027-01", "'2027-01" lẫn ngày
    ghi('ChamCong', locRa('ChamCong', function(r,h){ var x=r[h.indexOf('Ngay')]; return ((x instanceof Date)?fmtDate(x):String(x)).slice(0,7)!==th; }));
    ghi('TamUng', locRa('TamUng', trongThang('Thang'))); ghi('LuongNhap', locRa('LuongNhap', trongThang('Thang'))); ghi('DuyetDot', locRa('DuyetDot', trongThang('Thang')));
    ghi('NhatKySua', locRa('NhatKySua', function(r,h){ return String(r[h.indexOf('Thang')]||'')!==th; }));
    var bc=SS.getSheetByName('Lương '+th+' (đã chốt)'); if(bc){ var vv=bc.getDataRange().getValues(); var s2=file.insertSheet('Bảng lương đã chốt'); s2.getRange(1,1,vv.length,vv[0].length).setValues(vv); try{ SS.deleteSheet(bc); }catch(e){} }
    try{ var dau=file.getSheets()[0]; if(dau && dau.getName && /^(Sheet1|Trang tính1)$/.test(dau.getName())) file.deleteSheet(dau); }catch(e){}
    try{ DriveApp.getFileById(file.getId()).moveTo(thuMucLuuTru()); }catch(e){}
    var lt=SS.getSheetByName('LuuTru'); if(!lt){ lt=SS.insertSheet('LuuTru'); lt.getRange(1,1,1,5).setValues([['Thang','FileID','URL','Luc','SoDong']]); }
    lt.appendRow([thGhi_(th), file.getId(), file.getUrl(), new Date(), dem]); ghiNhatKy('Admin',th,'','Lưu trữ tháng','',file.getUrl());
    return {ok:true, url:file.getUrl(), soDong:dem}; } finally { lock.releaseLock(); } }
// Chạy tự động mỗi ngày 3h sáng (cài sẵn khi chạy setup)
function tuDongLuuTru(){ var sau=+cfg('LUU_TRU_SAU_NGAY')||10, today=fmtDate(new Date()), kq=[];
  rows('ChotThang').forEach(function(r){ var th=thKey_(r.Thang); if(thangDaLuuTru(th)) return;
    var han=fmtDate(new Date(new Date(th+'-'+('0'+cuoiThang(th)).slice(-2)+'T12:00:00+07:00').getTime()+sau*864e5)); if(today>=han){ var x=luuTruThang({thang:th}); kq.push(th+': '+(x.ok?'đã lưu trữ':x.msg)); } });
  return kq; }
function dsLuuTru(p){ if(!laAdmin(p)) return {ok:false,msg:'Chỉ admin'}; var da={}; (SS.getSheetByName('LuuTru')?rows('LuuTru'):[]).forEach(function(r){ da[thKey_(r.Thang)]=r; });
  var sau=+cfg('LUU_TRU_SAU_NGAY')||10;
  return {ok:true, sau:sau, list:rows('ChotThang').map(function(r){ var th=thKey_(r.Thang), x=da[th]; return {Thang:th, DaLuuTru:!!x, URL:x?x.URL:'', Luc:x?((x.Luc instanceof Date)?fmtTZ_(x.Luc,TZ,'dd/MM/yyyy'):String(x.Luc)):'', SoDong:x?x.SoDong:''}; }).sort(function(a,b){ return a.Thang<b.Thang?1:-1; })}; }

/* ---------- Ngày áp dụng cho hệ số lương & thay đổi hồ sơ (vị trí, FT/PT, chức vụ) ---------- */
var HS_CO_NGAY=/^(COM_TU_|COM_GIA_|LUONG_|HE_SO_TANG_CA$|NGAY_CHUAN$|GIO_CHUAN_NGAY$)/;
var _LSHS=null, _LSNV=null;
function lsHeSo_(){ if(_LSHS) return _LSHS; _LSHS={}; (sh_('LichSuHeSo')?rows('LichSuHeSo'):[]).forEach(function(r){ (_LSHS[r.Key]=_LSHS[r.Key]||[]).push({ngay:dateKey(r.NgayApDung), tu:r.Tu, len:r.Len}); });
  Object.keys(_LSHS).forEach(function(k){ _LSHS[k].sort(function(a,b){ return a.ngay<b.ngay?-1:1; }); }); return _LSHS; }
// Giá trị hệ số tại ngày d: trước lần đổi đầu tiên = mức cũ; sau đó = mức của lần đổi gần nhất ≤ d
function hsTaiNgay(key, d){ var L=lsHeSo_()[key]; if(!L || !L.length || !d) return cfg(key); if(d<L[0].ngay) return L[0].tu; var v=L[0].len; L.forEach(function(x){ if(x.ngay<=d) v=x.len; }); return v; }
function lsNV_(){ if(_LSNV) return _LSNV; _LSNV={}; (sh_('LichSuNhanVien')?rows('LichSuNhanVien'):[]).forEach(function(r){ var k=up(r.MaNV)+'|'+r.Truong; (_LSNV[k]=_LSNV[k]||[]).push({ngay:dateKey(r.NgayApDung), tu:String(r.Tu==null?'':r.Tu), len:String(r.Len==null?'':r.Len)}); });
  Object.keys(_LSNV).forEach(function(k){ _LSNV[k].sort(function(a,b){ return a.ngay<b.ngay?-1:1; }); }); return _LSNV; }
// Hồ sơ nhân viên tại ngày d (vị trí, FT/PT, chức vụ theo lịch sử có ngày áp dụng)
function nvTaiNgay(n, d){ var o={}; Object.keys(n).forEach(function(k){ o[k]=n[k]; }); if(!d) return o; var H=lsNV_();
  ['ViTri','Loai','ChucVu'].forEach(function(f){ var L=H[up(n.MaNV)+'|'+f]; if(!L || !L.length) return; if(d<L[0].ngay){ o[f]=L[0].tu; return; } var v=L[0].len; L.forEach(function(x){ if(x.ngay<=d) v=x.len; }); o[f]=v; }); return o; }
function vtLuong(n){ return n.ChucVu==='Quản lý'?'Quản lý':n.ViTri; }
// Lương giờ mặc định theo vị trí tại ngày d (khi nhân viên không có lương riêng)
function luongMacDinh(n, d){ var nd=nvTaiNgay(n,d); return nghin(hsTaiNgay('LUONG_'+vtLuong(nd), d))||nghin(hsTaiNgay('LUONG_Phục vụ', d))||0; }
function ghiLsHeSo(ngay, key, tu, len, ai){ var sh=sh_('LichSuHeSo'); if(!sh){ sh=SS.insertSheet('LichSuHeSo'); sh.getRange(1,1,1,6).setValues([['NgayApDung','Key','Tu','Len','Boi','Luc']]); try{ sh.getRange('A:A').setNumberFormat('@'); }catch(e){} }
  sh.appendRow([ngay, key, tu, len, ai||'Admin', new Date()]); _LSHS=null; }
function ghiLsNV(ngay, ma, truong, tu, len, ai){ var sh=sh_('LichSuNhanVien'); if(!sh){ sh=SS.insertSheet('LichSuNhanVien'); sh.getRange(1,1,1,7).setValues([['NgayApDung','MaNV','Truong','Tu','Len','Boi','Luc']]); try{ sh.getRange('A:B').setNumberFormat('@'); }catch(e){} }
  sh.appendRow([ngay, String(ma), truong, tu, len, ai||'Admin', new Date()]); _LSNV=null; }
function lichSuHeSo(p){ if(!laAdmin(p)) return {ok:false,msg:'Chỉ admin'}; return {ok:true, list:(sh_('LichSuHeSo')?rows('LichSuHeSo'):[]).map(function(r){ return {Ngay:dateKey(r.NgayApDung), Key:r.Key, Tu:r.Tu, Len:r.Len, Boi:r.Boi}; }).reverse().slice(0,40)}; }


/* ---------- Tổng hợp giờ công & tiền cơm theo khoảng ngày (VD 10–20/10), mọi nhân viên ---------- */
function tongHopKhoang(p){ var _q=khongQuyen(p.pin,'tra',1); if(_q) return _q; var role=authRole(p.pin); if(!role) return {ok:false,msg:'Sai mã'}; if(role!=='admin' && quyen(p.pin,'luong')>=1) role='admin'; var tu=String(p.tu||''), den=String(p.den||''); if(!tu||!den||den<tu) return {ok:false,msg:'Chọn khoảng ngày'};
  var thang=[], d=new Date(tu.slice(0,7)+'-01T12:00:00+07:00'); while(fmtTZ_(d,TZ,'yyyy-MM')<=den.slice(0,7)){ thang.push(fmtTZ_(d,TZ,'yyyy-MM')); d.setMonth(d.getMonth()+1); }
  var nv={}; rows('NhanVien').forEach(function(n){ nv[up(n.MaNV)]=n; }); var M=mucLuong(), le=ngayLeMap(), today=fmtDate(new Date()), kq={};
  thang.forEach(function(th){ var dl=duLieuThang(th), nh=nhapThang(th), ung=tamUngThang(th);
    Object.keys(dl).forEach(function(m){ var n=nv[m]; if(!n) return; var o=tinhNguoi(n, dl[m], nh, ung, M, le, th), x=kq[m]=kq[m]||{MaNV:String(n.MaNV), Ten:tenNgan(n.Ten), ViTri:n.ViTri, ngay:{}, gio:0, ca:0, suat:0, tienCom:0, choDuyet:0, theoCS:{}};
      dl[m].forEach(function(r){ var dd=dateKey(r.Ngay); if(dd<tu||dd>den) return; var tt=trangThaiRow(r,today); if(tt==='Đang làm'||tt==='Quên chấm ra') return; var g=so(r.GioTinh);
        x.gio+=g; x.ca++; x.ngay[dd]=(x.ngay[dd]||0)+g; x.theoCS[r.MaCS]=(x.theoCS[r.MaCS]||0)+g; if(tt==='Chờ xác nhận') x.choDuyet++; });
      Object.keys(o.comNgay||{}).forEach(function(dd){ if(dd<tu||dd>den||!o.comNgay[dd]) return; x.suat++; x.tienCom+=(o.comTienNgay||{})[dd]||0; }); }); });
  var L=Object.keys(kq).map(function(m){ var x=kq[m]; x.soNgay=Object.keys(x.ngay).length; x.gio=Math.round(x.gio*100)/100; Object.keys(x.theoCS).forEach(function(k){ x.theoCS[k]=Math.round(x.theoCS[k]*100)/100; }); delete x.ngay; if(role!=='admin') delete x.tienCom; return x; })
    .filter(function(x){ return x.ca>0; }).sort(function(a,b){ return a.MaNV<b.MaNV?-1:1; });
  return {ok:true, tu:tu, den:den, admin:role==='admin', list:L}; }

/* ---------- Tra cứu giờ công dạng lưới (giống Lịch & chấm công): nhân viên × ngày, có tổng cuối hàng / cuối cột ---------- */
function traCuuLuoi(p){ var _q=khongQuyen(p.pin,'tra',1); if(_q) return _q; var tk=tkDayDu(p.pin); if(!tk) return {ok:false,msg:'Sai mã'}; var admin=quyenTK(tk,'luong')>=1, tu=String(p.tu||''), den=String(p.den||'');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(tu)||!/^\d{4}-\d{2}-\d{2}$/.test(den)||den<tu) return {ok:false,msg:'Chọn khoảng ngày'};
  var ngays=[], d=new Date(tu+'T12:00:00+07:00'); while(fmtDate(d)<=den && ngays.length<62){ ngays.push(fmtDate(d)); d.setDate(d.getDate()+1); }
  if(fmtDate(d)<=den) return {ok:false,msg:'Chọn tối đa 62 ngày'};
  var thang=[]; ngays.forEach(function(x){ if(thang.indexOf(x.slice(0,7))<0) thang.push(x.slice(0,7)); });
  var nv={}; rows('NhanVien').forEach(function(n){ nv[up(n.MaNV)]=n; }); var M=mucLuong(), le=ngayLeMap(), today=fmtDate(new Date()), kq={}, csLoc=up(p.cs||''), maLoc=up(p.ma||'');
  thang.forEach(function(th){ var dl=duLieuThang(th), nh=nhapThang(th), ung=tamUngThang(th);
    Object.keys(dl).forEach(function(m){ var n=nv[m]; if(!n || (maLoc && m!==maLoc)) return;
      var L=dl[m].filter(function(r){ var x=dateKey(r.Ngay); return x>=tu && x<=den && tk.duocCS(r.MaCS) && (!csLoc || up(r.MaCS)===csLoc); }); if(!L.length) return;
      var o=tinhNguoi(n, dl[m], nh, ung, M, le, th), y=kq[m]=kq[m]||{MaNV:String(n.MaNV), Ten:tenNgan(n.Ten), ViTri:n.ViTri, Loai:n.Loai, ngay:{}, soNgay:0, gio:0, suat:0, tienCom:0, choDuyet:0, quen:0, _L:[]}; y._L=y._L.concat(L);
      L.sort(function(a,b){ return hhmm(a.Vao)<hhmm(b.Vao)?-1:1; }).forEach(function(r){ var x=dateKey(r.Ngay), tt=trangThaiRow(r,today), g=(tt==='Đang làm'||tt==='Quên chấm ra')?0:so(r.GioTinh), c=y.ngay[x]=y.ngay[x]||{ca:[], gio:0};
        var k={cs:r.MaCS, vao:hhmm(r.Vao)||hhmm(r.CaBD), ra:hhmm(r.Ra)}; if(tt!=='Đã xác nhận' && tt!=='Đã xong') k.tt=tt;
        else { var caG2=(toMin(hhmm(r.CaKT))-toMin(hhmm(r.CaBD)))/60; if(caG2>0 && g>caG2+0.001) k.tc=Math.round((g-caG2)*60); } c.ca.push(k); c.gio=Math.round((c.gio+g)*100)/100;
        if(tt==='Chờ xác nhận') y.choDuyet++; if(tt==='Quên chấm ra') y.quen++; });
      Object.keys(y.ngay).forEach(function(x){ if(x.slice(0,7)!==th) return; var c=y.ngay[x]; c.com=!!(o.comNgay||{})[x]; c.ly=(o.comLy||{})[x]||''; if(admin && c.com) c.tien=(o.comTienNgay||{})[x]||0; }); }); });
  var L=Object.keys(kq).map(function(m){ var y=kq[m]; y.tre=treThongKe_(y._L); delete y._L; Object.keys(y.ngay).forEach(function(x){ var c=y.ngay[x]; if(c.gio>0||c.ca.length) y.soNgay++; y.gio+=c.gio; if(c.com){ y.suat++; y.tienCom+=c.tien||0; } }); y.gio=Math.round(y.gio*100)/100; if(!admin) delete y.tienCom; return y; })
    .sort(function(a,b){ return a.MaNV<b.MaNV?-1:1; });
  var cot=ngays.map(function(x){ var g=0, s=0, n=0; L.forEach(function(y){ var c=y.ngay[x]; if(!c) return; g+=c.gio; n++; if(c.com) s++; }); return {ngay:x, gio:Math.round(g*100)/100, nguoi:n, suat:s}; });
  return {ok:true, admin:admin, tu:tu, den:den, ngays:ngays, list:L, cot:cot}; }

/* ---------- BẢNG LƯƠNG THEO KHOẢNG NGÀY (VD trả lương 1–15/10): giờ đã chấm trong khoảng × lương giờ + tiền cơm ---------- */
// Không gồm phụ cấp, thưởng, tạm ứng, trừ lỗi (các mục này tính ở bảng lương cả tháng).
function bangLuongKhoang(p){ var _q=khongQuyen(p.pin,'luong',1); if(_q) return _q; var tu=String(p.tu||''), den=String(p.den||'');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(tu)||!/^\d{4}-\d{2}-\d{2}$/.test(den)||den<tu) return {ok:false,msg:'Chọn từ ngày – đến ngày'};
  var thang=[], d=new Date(tu.slice(0,7)+'-15T12:00:00+07:00'); while(fmtTZ_(d,TZ,'yyyy-MM')<=den.slice(0,7) && thang.length<3){ thang.push(fmtTZ_(d,TZ,'yyyy-MM')); d.setMonth(d.getMonth()+1); }
  if(thang[thang.length-1]<den.slice(0,7)) return {ok:false,msg:'Khoảng ngày tối đa 3 tháng'};
  var nv={}; rows('NhanVien').forEach(function(n){ nv[up(n.MaNV)]=n; }); var M=mucLuong(), le=ngayLeMap(), kq={};
  thang.forEach(function(th){ var dl=duLieuThang(th);
    Object.keys(dl).forEach(function(m){ var n=nv[m]; if(!n) return; var L=dl[m].filter(function(r){ var x=dateKey(r.Ngay); return x>=tu && x<=den; }); if(!L.length) return;
      var o=tinhNguoi(n, L, {}, {}, M, le, th), y=kq[m]=kq[m]||{MaNV:String(n.MaNV), Ten:tenNgan(n.Ten), Nhom:o.Nhom, ViTri:o.ViTri, KieuLuong:o.KieuLuong, luong:o.luong, lcb:o.lcb, gio:0, soNgay:0, soSuat:0, com:0, tienLuong:0, choXN:0, quen:0, theoCS:{}};
      y.gio+=o.gio; y.soNgay+=o.soNgay; y.soSuat+=o.soSuat; y.com+=o.com; y.tienLuong+=o.tienLuong; y.choXN+=o.choXN; y.quen+=o.quen; y.luong=o.luong;
      Object.keys(o.theoCS).forEach(function(k){ y.theoCS[k]=(y.theoCS[k]||0)+o.theoCS[k]; }); }); });
  var r2=function(x){ return Math.round(x*100)/100; }, thuTu={QL:0,FT:1,PT:2};
  var L=Object.keys(kq).map(function(m){ var y=kq[m]; y.gio=r2(y.gio); y.com=r2(y.com); y.tienLuong=Math.round(y.tienLuong*10)/10; y.tong=Math.round((y.tienLuong+y.com)*10)/10; Object.keys(y.theoCS).forEach(function(k){ y.theoCS[k]=r2(y.theoCS[k]); }); return y; })
    .sort(function(a,b){ return (thuTu[a.Nhom]||9)-(thuTu[b.Nhom]||9) || (a.MaNV<b.MaNV?-1:1); });
  return {ok:true, tu:tu, den:den, list:L, stores:rows('CoSo').map(function(s){ return {MaCS:s.MaCS,TenCS:s.TenCS}; })}; }
function xuatLuongKhoang(p){ if(!laAdmin(p)) return {ok:false,msg:'Chỉ admin'}; var b=bangLuongKhoang(p); if(!b.ok) return b;
  var f=function(x){ return x.slice(8)+'.'+x.slice(5,7); }, name='Lương '+f(b.tu)+'–'+f(b.den)+'.'+b.den.slice(0,4), sh=SS.getSheetByName(name); if(sh) sh.clear(); else sh=SS.insertSheet(name);
  var H=['Mã','Tên','Nhóm','Kiểu lương'].concat(b.stores.map(function(s){ return 'Giờ '+s.TenCS; })).concat(['Số ngày','Tổng giờ','Lương giờ','Tiền lương','Suất cơm','Tiền cơm','Tổng (nghìn đồng)','Ca chờ duyệt','Quên chấm ra']);
  var v=b.list.map(function(y){ return [y.MaNV,y.Ten,y.Nhom,y.KieuLuong].concat(b.stores.map(function(s){ return y.theoCS[s.MaCS]||''; })).concat([y.soNgay,y.gio,y.KieuLuong==='Cố định'?'':y.luong,y.tienLuong,y.soSuat,y.com,y.tong,y.choXN||'',y.quen||'']); });
  sh.getRange(1,1,1,H.length).setValues([H]).setFontWeight('bold'); if(v.length) sh.getRange(2,1,v.length,H.length).setValues(v); sh.setFrozenRows(1);
  ghiNhatKy('Admin', b.tu.slice(0,7), '', 'Xuất bảng lương '+b.tu+' → '+b.den, '', name); return {ok:true, ten:name, so:v.length}; }

/* ---------- NẠP LƯƠNG GIỜ HÀNG LOẠT (dán từ bảng lương thực tế): "Mã NV hoặc tên | Lương giờ (nghìn)" ---------- */
// Người chưa có lương riêng: ghi thẳng (áp cho mọi tháng chưa chốt). Đã có lương khác: ghi như "Tăng lương" từ ngày áp dụng.
function napLuongGio(p){ if(!laAdmin(p)) return {ok:false,msg:'Chỉ admin'}; _NAPNV=null; var ngay=String(p.ngay||'').slice(0,10);
  var coDinh=[], dong=String(p.text||'').split(/\r?\n/).map(function(s){ return s.trim(); }).filter(Boolean), kq=[], loi=[];
  dong.forEach(function(s,i){ var c=s.indexOf('\t')>-1?s.split('\t'):(s.indexOf(';')>-1?s.split(';'):s.split('|')); c=c.map(function(x){ return String(x).trim(); });
    if(c.length<2){ if(i>0) loi.push('Dòng '+(i+1)+': cần 2 cột (mã hoặc tên | lương giờ)'); return; }
    var n=timNV_(c[0]), m=nghin(String(c[1]).replace(',','.')); if(n==='trung'){ loi.push('Dòng '+(i+1)+': tên "'+c[0]+'" trùng nhiều người – dùng mã'); return; }
    if(!n){ if(i>0 || /^\d/.test(c[0])) loi.push('Dòng '+(i+1)+': không tìm thấy "'+c[0]+'"'); return; } if(!(m>0)){ loi.push('Dòng '+(i+1)+': lương giờ không hợp lệ ('+c[1]+')'); return; }
    if(String(n.KieuLuong||'')==='Cố định'){ if(p.boQuaCoDinh){ coDinh.push(tenNgan(n.Ten)); return; } loi.push('Dòng '+(i+1)+': '+tenNgan(n.Ten)+' đang hưởng lương cố định – sửa trong Nhân sự'); return; }
    kq.push({n:n, m:m}); });
  if(p.thuNghiem) return {ok:true, hopLe:kq.length, loi:loi, coDinh:coDinh, xem:kq.slice(0,80).map(function(x){ return {ma:String(x.n.MaNV), ten:tenNgan(x.n.Ten), cu:luongGio(x.n), rieng:nghin(x.n.LuongGio)>0, moi:x.m}; })};
  if(loi.length) return {ok:false, msg:'Còn '+loi.length+' dòng lỗi – bấm Kiểm tra để xem'};
  var doi=0, giu=0; kq.forEach(function(x){ var n=x.n, cu=nghin(n.LuongGio);
    if(cu===x.m){ giu++; return; }
    if(!(cu>0)){ var r=suaNhanVien({pin:p.pin, maNV:n.MaNV, LuongGio:x.m}); if(r.ok) doi++; }
    else { var r2=tangLuong({pin:p.pin, maNV:n.MaNV, mucMoi:x.m, ngay:ngay||fmtDate(new Date()), ghiChu:'Nạp từ bảng lương thực tế'}); if(r2.ok) doi++; else loi.push(tenNgan(n.Ten)+': '+r2.msg); } });
  ghiNhatKy('Admin','','','Nạp lương giờ hàng loạt', '', doi+' người'+(giu?', '+giu+' giữ nguyên':'')); return {ok:true, doi:doi, giu:giu, loi:loi}; }

/* (29/10) Google Sheet tự đổi chữ "2026-10" thành NGÀY 01/10/2026 → so String(...) với "2026-10" không khớp: sửa tay trong bảng lương không áp dụng,
   khoá sổ đợt / chốt tháng không nhận, nhật ký lọc sai. Đọc: hiểu cả chữ lẫn ngày. Ghi: dạng chữ (dấu ' đầu không lưu vào ô). */
function thKey_(v){ if(v instanceof Date && !isNaN(v)) return fmtTZ_(v, TZ, 'yyyy-MM'); var s=String(v==null?'':v).trim().replace(/^'/,''); var m=s.match(/^(\d{4})-(\d{1,2})(?!\d)/); return m?m[1]+'-'+('0'+m[2]).slice(-2):s; }
function thGhi_(th){ th=thKey_(th); return th?"'"+th:''; }
