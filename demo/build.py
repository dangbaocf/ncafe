import json
rt=open('/home/claude/demo2/runtime.js',encoding='utf-8').read()
F={'cc':open('/home/claude/chamcong2/Code.gs',encoding='utf-8').read()+'\n'+open('/home/claude/chamcong2/Luong.gs',encoding='utf-8').read()+'\n'+open('/home/claude/chamcong2/NhanSu.gs',encoding='utf-8').read()+'\n'+open('/home/claude/chamcong2/LichNV.gs',encoding='utf-8').read()+'\n'+open('/home/claude/chamcong2/XacNhan.gs',encoding='utf-8').read(),
   'lct':open('/home/claude/chamcong2/LichCuaToi.html',encoding='utf-8').read(),
   'ksp':open('/home/claude/chamcong2/KhaoSat.html',encoding='utf-8').read(),
   'gc':open('/home/claude/chamcong2/GioCong.html',encoding='utf-8').read(),
   'xl':open('/home/claude/chamcong/Code.gs',encoding='utf-8').read()+'\n'+open('/home/claude/chamcong/Scheduler.gs',encoding='utf-8').read(),
   'qr':open('/home/claude/chamcong2/QR.html',encoding='utf-8').read(),
   'ql':open('/home/claude/chamcong2/QuanLy.html',encoding='utf-8').read(),
   'ad':open('/home/claude/chamcong/Admin.html',encoding='utf-8').read(),
   'dk':open('/home/claude/chamcong/DangKy.html',encoding='utf-8').read(),
}
J=json.dumps(F,ensure_ascii=False).replace('</','<\\/')
page=r'''<!DOCTYPE html>
<html lang="vi"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Demo 2 app Ncafe – Chấm công & Xếp lịch</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
:root{--bg:#EDF0EF;--panel:#FFFFFF;--ink:#24160F;--muted:#6B6460;--line:#D5DBD9;--salt:#2F5D62;--salt2:#DCE8E6;--coffee:#6B4226;color-scheme:light}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#141918;--panel:#1E2423;--ink:#ECE7E2;--muted:#A39D98;--line:#33403E;--salt:#7FB3B8;--salt2:#22393B;--coffee:#D7A47A;color-scheme:dark}}
:root[data-theme="dark"]{--bg:#141918;--panel:#1E2423;--ink:#ECE7E2;--muted:#A39D98;--line:#33403E;--salt:#7FB3B8;--salt2:#22393B;--coffee:#D7A47A;color-scheme:dark}
:root{box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}
*{box-sizing:border-box;margin:0}
body{background:var(--bg);color:var(--ink);font-family:"Be Vietnam Pro",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;line-height:1.5}
.wrap{max-width:1320px;margin:0 auto;padding:16px}
h1{font-size:24px;font-weight:800;letter-spacing:-.01em}
.lead{color:var(--muted);font-size:14px;max-width:80ch;margin-top:4px}
.apps{display:flex;gap:6px;margin:14px 0 10px;flex-wrap:wrap}
.apps button{font:inherit;font-weight:700;font-size:15px;padding:10px 16px;border-radius:12px;border:1.5px solid var(--salt);background:var(--panel);color:var(--salt);cursor:pointer}
.apps button[aria-pressed="true"]{background:var(--salt);color:#fff}
.hint{font-size:13px;color:var(--muted);background:var(--panel);border:1px dashed var(--line);border-radius:10px;padding:8px 10px;margin-bottom:10px}
.hint b{color:var(--ink)}
.grid{display:grid;grid-template-columns:380px 1fr;gap:16px;align-items:start}
@media(max-width:980px){.grid{grid-template-columns:1fr}}
.phone{background:var(--ink);border-radius:34px;padding:10px;position:relative}
.phone .top{display:flex;gap:6px;align-items:center;justify-content:space-between;padding:4px 8px 8px;color:#fff;font-size:12px}
.phone select{font:inherit;font-size:12.5px;border-radius:8px;border:0;padding:4px 6px}
.phone iframe{width:100%;height:700px;border:0;border-radius:24px;background:#EDF0EF;display:block}
.screen{background:var(--panel);border:1px solid var(--line);border-radius:16px;overflow:hidden}
.screen .bar{padding:8px 12px;font-size:12.5px;color:var(--muted);border-bottom:1px solid var(--line);display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap}
.screen iframe{width:100%;height:900px;border:0;display:block;background:#EDF0EF}
#loading{position:fixed;inset:0;background:var(--bg);display:flex;align-items:center;justify-content:center;flex-direction:column;gap:10px;z-index:10;font-weight:600}
.spin{width:28px;height:28px;border:3px solid var(--line);border-top-color:var(--salt);border-radius:50%;animation:s 1s linear infinite}@keyframes s{to{transform:rotate(360deg)}}
.hide,#loading.hide{display:none}
.tgbox{margin-top:14px;background:#E7EEF5;border:1px solid #C9D6E3;border-radius:16px;padding:12px}
.tgh{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;font-weight:700;color:#24384A;margin-bottom:8px}.tgs{font-weight:400;font-size:12.5px;color:#4A5D70}
#tgList{max-height:340px;overflow:auto;display:flex;flex-direction:column;gap:8px}
.tgm{align-self:flex-start;max-width:640px;background:#fff;border-radius:4px 14px 14px 14px;padding:8px 12px;box-shadow:0 1px 1px rgba(0,0,0,.08);white-space:pre-wrap;font-size:14px;color:#1B1B1B}
.tgm .tgn{font-size:12px;font-weight:700;color:#2B7BB9;margin-bottom:2px}.tgm .tgt{font-size:11px;color:#8A97A5;text-align:right;margin-top:2px}.tge{color:#4A5D70;font-size:13.5px}
@media (prefers-color-scheme:dark){.tgbox{background:#1C2733;border-color:#2B3A4A}.tgh{color:#DDE7F0}.tgs,.tge{color:#9FB2C4}.tgm{background:#26364A;color:#F0F4F8}.tgm .tgn{color:#7CC0F2}}
</style></head><body>
<div id="loading"><div class="spin"></div><div id="ldmsg">Đang chạy 2 app với dữ liệu mẫu…</div></div>
<div class="wrap">
<h1>Demo 2 app Ncafe</h1>
<p class="lead">Đây là <b>đúng code thật</b> của 2 app, chạy ngay trong trình duyệt với dữ liệu mẫu (66 nhân viên thật, lịch xếp tự động, chấm công giả lập tuần này). Thao tác ở app này thấy ngay ở app kia. Tải lại trang là về dữ liệu ban đầu; không ghi gì vào Google Sheet thật.</p>
<div class="apps"><button id="bCC" aria-pressed="true">App Chấm công</button><button id="bXL" aria-pressed="false">App Xếp lịch</button></div>
<section id="vCC">
  <div class="hint">Bên trái: <b>điện thoại nhân viên</b> sau khi quét QR ở quầy (đổi quán ở ô trên). Thử mã <span id="maHint"><b>313</b></span> hoặc mã bất kỳ ở tab Nhân sự; nút "Chụp ảnh" trong demo tự tạo ảnh. Ô trên điện thoại chọn <b>"Lịch của tôi"</b> (xem lịch, đăng ký bận, rảnh thêm, nhận ca), <b>"Khảo sát nhân viên"</b> (chọn quán → chọn tên → xác minh → trả lời → nhận mã; demo: người hồ sơ chưa có số điện thoại thì nhập số bất kỳ, người đã có số thì xem 4 số cuối ở tab Nhân sự) hoặc <b>"Giờ công của tôi"</b> để xem giờ đã duyệt (<span id="gcHint"></span>). Vào ca có nút <b>"Giờ khác (tự điền)"</b> cho ca phát sinh. Bên phải: <b>trang quản lý chấm công</b> – mã <b>5678</b> (quản lý: chấm công, xác nhận giờ như khai, tra cứu giờ công không có tiền, xem / in mã QR), <b>2468</b> (quản lý <b>được cấp quyền điều chỉnh giờ</b>) hoặc <b>1234</b> (admin toàn quyền: <b>Nhân sự</b> – tìm, lọc, sửa, danh sách mã theo quán; <b>Khảo sát</b> – đối chiếu, nạp, cấp mã, xác nhận kỹ năng; bảng lương, phiếu lương, nhật ký sửa, <b>Cài đặt</b> tài khoản / quán / ca / cài đặt chung).</div>
  <div class="grid">
    <div class="phone"><div class="top"><span>Điện thoại nhân viên</span><select id="selCS"></select></div><iframe id="fQR" title="Điện thoại nhân viên"></iframe></div>
    <div class="screen"><div class="bar"><span>Trang quản lý – App Chấm công</span><button id="rQL" style="font:inherit;font-size:12px;border:0;background:none;color:var(--salt);cursor:pointer">Tải lại trang này</button></div><iframe id="fQL" title="Quản lý chấm công"></iframe></div>
  </div>
  <div class="tgbox"><div class="tgh"><span>📣 Nhóm Telegram (mô phỏng) – tin app tự gửi</span><span class="tgs">Mỗi quán một nhóm. Tin đầu tiên là mẫu "nhắc quên chấm công" lúc 13:00 cho ca kết thúc 12:00. Cài ở tab Cài đặt → Thông báo Telegram (đang để: <b id="tgMucHint">từng người vào / ra</b>)</span></div><div id="tgList"><p class="tge">Chưa có tin. Thử cho một nhân viên Vào ca / Ra ca ở điện thoại bên trái.</p></div></div>
</section>
<section id="vXL" class="hide">
  <div class="hint">Bên trái: <b>điện thoại nhân viên – trang "Lịch của tôi" của app Chấm công</b> (<span id="lHint"></span>): xem lịch, đăng ký bận tuần sau, báo rảnh thêm, nhận ca cần người. App Xếp lịch giờ chỉ dành cho quản lý.<span id="ksHint" class="hide"></span> Bên phải: <b>trang xếp lịch</b> – mã <b>5678</b>. Thử: tab <b>Ca cần người</b> → đăng ca → bên trái nhân viên bấm "Tôi nhận" → bên phải tải lại tab, bấm Chọn → ca vào lịch. Tab <b>Lịch tuần</b>: Tạo lịch tuần này → sửa như Google Sheet → Áp dụng.</div>
  <div class="grid">
    <div class="phone"><div class="top"><span>Trang nhân viên</span><select id="selXL"><option value="lich">Lịch của tôi (app Chấm công)</option></select></div><iframe id="fNV" title="Trang nhân viên"></iframe></div>
    <div class="screen"><div class="bar"><span>Trang quản lý – App Xếp lịch</span><button id="rAD" style="font:inherit;font-size:12px;border:0;background:none;color:var(--salt);cursor:pointer">Tải lại trang này</button></div><iframe id="fAD" title="Quản lý xếp lịch"></iframe></div>
  </div>
</section>
</div>
<script>
'''+rt+r'''
</script>
<script>
var FILES='''+J+r''';
var APPS={};
window.__call=function(app,fn,args,s,f){ setTimeout(function(){ var A=APPS[app]; if(!A||!A[fn]){ f&&f({message:'Không có hàm '+fn}); return; }
  try{ var r=A[fn].apply(null, JSON.parse(JSON.stringify(args||[]))); r=(r===undefined)?null:JSON.parse(JSON.stringify(r)); s&&s(r); }catch(e){ console.error(e); f&&f({message:String((e&&e.message)||e)}); } }, 120); };
function shim(app, extra){ return '<script>(function(){ var APP='+JSON.stringify(app)+';'+
 'function mk(s,f){ return new Proxy({}, {get:function(t,k){ if(k==="withSuccessHandler") return function(x){ return mk(x,f); }; if(k==="withFailureHandler") return function(x){ return mk(s,x); }; if(k==="withUserObject") return function(){ return mk(s,f); }; return function(){ parent.__call(APP,k,Array.prototype.slice.call(arguments),s,f); }; }}); }'+
 'window.google={script:{run:mk(null,null),host:{close:function(){}}}};'+(extra||'')+'})();<\/script>'; }
function nap(iframe, html, app, extra){ var h=html.replace(/<head>/i,'<head>'+shim(app,extra)); iframe.srcdoc=h; }
function today(){ return new Date(Date.now()+7*3600e3).toISOString().slice(0,10); }
function nowMin(){ var d=new Date(Date.now()+7*3600e3); return d.getUTCHours()*60+d.getUTCMinutes(); }
var TOADO={TP:[16.0678,108.2208],DD:[16.0712,108.2145],TD:[16.0612,108.2133],TNV:[16.0396,108.2075],LDD:[16.0491,108.2187]};
function khoiTao(){
  var CC=APPS.CC=loadApp('CC','Chấm công Ncafe',FILES.cc); CC.setup(); CC.setCfg('LICH_SHEET_ID','XL'); CC.setCfg('KHAO_SAT_URL','(demo: tab App Xếp lịch → Khảo sát)');
  Object.keys(TOADO).forEach(function(cs){ CC.luuViTriQuan({pin:'1234',maCS:cs,lat:TOADO[cs][0],lng:TOADO[cs][1]}); });
  var XL=APPS.XL=loadApp('XL','Xếp lịch Ncafe',FILES.xl); XL.setup(); XL.setCfg('CHAM_CONG_SHEET_ID','CC'); XL.setCfg('CHAM_CONG_URL','#');
  var t=today(), d0=XL.mondayOf(t), d1=XL.fmtDate(XL.addDays(new Date(d0+'T12:00:00+07:00'),7));
  XL.xepLich({pin:'5678',tuan:d0,mode:'mau'}); XL.xepLich({pin:'5678',tuan:d1,mode:'mau'});
  // chấm công giả lập theo lịch tuần này (các ngày đã qua + sáng nay)
  var cm=CC.caMap(), nv={}; CC.rows('NhanVien').forEach(function(n){ nv[String(n.MaNV)]=n; });
  var ccSh=REG_SS.CC.sh.filter(function(s){return s.n==='ChamCong';})[0], H=ccSh.d[0], tb=REG_SS.CC.sh.filter(function(s){return s.n==='ThietBi';})[0];
  var mau=XL.rows('LichLam').filter(function(l){ var d=XL.dateKey(l.Ngay); return d>=d0 && d<=XL.fmtDate(XL.addDays(new Date(d0+'T12:00:00+07:00'),6)) && !/Support/.test(String(l.GhiChu||'')) && cm[l.MaCa]; });
  var lich=[], dau=t.slice(0,8)+'01';   // cả tháng tới hôm nay: các ngày trước lấy theo mẫu cùng thứ của tuần này
  for(var dd=new Date(dau+'T12:00:00+07:00'); XL.fmtDate(dd)<=t; dd=XL.addDays(dd,1)){ var ds=XL.fmtDate(dd), w=(dd.getUTCDay()+6)%7, md=XL.fmtDate(XL.addDays(new Date(d0+'T12:00:00+07:00'),w));
    mau.filter(function(l){ return XL.dateKey(l.Ngay)===md; }).forEach(function(l){ lich.push({Ngay:ds,MaCS:l.MaCS,MaNV:l.MaNV,MaCa:l.MaCa,ViTri:l.ViTri,GhiChu:l.GhiChu}); }); }
  var hh=function(m){ return ('0'+Math.floor(m/60)).slice(-2)+':'+('0'+(m%60)).slice(-2); }, seed=7, rnd=function(a,b){ seed=(seed*9301+49297)%233280; return a+Math.floor(seed/233280*(b-a+1)); };
  var dacBiet=0, giam=0, quen=0, treN=0, qua=lich.filter(function(l){ return XL.dateKey(l.Ngay)<t; });
  lich.forEach(function(l,i){ var d=XL.dateKey(l.Ngay), c=cm[l.MaCa], n=nv[String(l.MaNV)]; if(!n) return; var bd=XL.toMin(c.GioBD), kt=XL.toMin(c.GioKT), caG=(kt-bd)/60;
    if(d===t && bd>nowMin()) return;
    var vao=bd+rnd(-6,4), tre=0; if(i%23===5 && d>=XL.fmtDate(XL.addDays(new Date(t+'T12:00:00+07:00'),-6)) && treN<2){ vao=bd+rnd(15,25); tre=vao-bd; treN++; }
    var o={ID:'D'+i, Ngay:d, MaNV:String(l.MaNV), Ten:String(n.Ten).split(' (')[0], MaCS:l.MaCS, MaCa:l.MaCa, CaBD:c.GioBD, CaKT:c.GioKT, ViTri:l.ViTri, Vao:hh(vao), Ra:'', TreMin:tre, GioThuc:'', KhaiLoai:'', KhaiGio:'', KhaiGhiChu:'', TrangThai:'Đang làm', GioTinh:'', CanhBao:'', ViDo:TOADO[l.MaCS][0], KinhDo:TOADO[l.MaCS][1], KhoangCach:rnd(3,40), ThietBi:'demo-'+l.MaNV};
    if(d<t){ var ra=kt+rnd(-3,7), loai='dung', kg=caG, tt='Đã xong', gt=caG, ghi='';
      var gan=d>=XL.fmtDate(XL.addDays(new Date(t+'T12:00:00+07:00'),-6));   // tình huống cần duyệt chỉ ở mấy ngày gần đây
      if(gan && dacBiet<2 && i%17===3){ ra=kt+rnd(85,100); loai='tang'; kg=Math.round((ra-vao)/60*2)/2; tt='Chờ xác nhận'; gt=caG; ghi=['đông khách, dọn kho','thiếu người ca sau'][dacBiet]; dacBiet++; }
      else if(gan && giam<2 && i%29===11){ ra=kt-60; loai='giam'; kg=caG-1; tt='Chờ xác nhận'; gt=caG-1; ghi='xin về sớm'; giam++; }
      else if(!quen && d===XL.fmtDate(XL.addDays(new Date(t+'T12:00:00+07:00'),-1)) && i%7===3){ ra=null; quen=1; }
      if(tre && loai==='dung'){ tt='Chờ xác nhận'; gt=Math.min(caG,Math.round((ra-vao)/15)/4); }
      if(ra!==null){ o.Ra=hh(ra); o.GioThuc=Math.round((ra-vao)/15)/4; o.KhaiLoai=loai; o.KhaiGio=kg; o.KhaiGhiChu=ghi; o.TrangThai=tt; o.GioTinh=gt; } }
    if(d>=XL.fmtDate(XL.addDays(new Date(t+'T12:00:00+07:00'),-3))){ if(i%31===7) o.CanhBao='Điện thoại mới'; if(i%53===13){ o.CanhBao='Cách quán 320m'; o.KhoangCach=320; } }
    ccSh.d.push(H.map(function(k){ return o[k]!==undefined?o[k]:''; })); tb.d.push([String(l.MaNV),'demo-'+l.MaNV,new Date()]); });
  // vài thiết lập lương mẫu: lương cố định, ngày vào làm, lịch sử tăng lương, đợt đã duyệt
  CC.suaNhanVien({pin:'1234',maNV:'201',KieuLuong:'Cố định',LuongCoBan:7800,NgayVao:'2024-04-10'});
  CC.suaNhanVien({pin:'1234',maNV:'202',NgayVao:'2025-11-02',LuongGio:25}); CC.suaNhanVien({pin:'1234',maNV:'102',NgayVao:'2023-06-01'});
  CC.tangLuong({pin:'1234',maNV:'202',mucMoi:26,ghiChu:'kỳ 6 tháng',ngay:'2026-05-02'}); CC.tangLuong({pin:'1234',maNV:'202',mucMoi:25,ghiChu:'(dữ liệu mẫu)',ngay:'2026-05-02'});
  // vài câu trả lời khảo sát mẫu
  var ksMau=CC.ksDanhSach().list; var k1=ksMau.filter(function(n){ return n.coSdt; })[0], k2=ksMau.filter(function(n){ return !n.coSdt; })[3], k3=ksMau.filter(function(n){ return !n.coSdt; })[7];
  var sdt1=String(CC.nvByMa(k1.ma).SDT).replace(/\D/g,'');
  CC.ksGui({ma:k1.ma,sdt4:sdt1.slice(-4),data:{hoTen:k1.full,tenGoi:k1.goi,sdt:sdt1,ngayVao:'2023-06-01',loai:'FT',viTriChinh:'Quản lý / trưởng ca',quanChinh:k1.cs,ngoaiGio:'Không',hoTroDs:['Pha chế','Thu ngân'],hoTro:{'Pha chế':'Làm một mình được','Thu ngân':'Làm một mình được'},truongCa:'Được',caHay:['Sáng'],ranh:{'T2|Sáng':true,'T3|Sáng':true,'T4|Sáng':true,'T5|Sáng':true,'T6|Sáng':true,'T7|Sáng':true},lichDoi:'Không đi học',caMo:'Được',caDong:'Thỉnh thoảng',nghiThu:'CN',tet:'Ở lại làm cả Tết',tangCa:'Luôn được',caDai:'Được',gay:'Được',lamThay:'Thường được'}});
  CC.ksGui({ma:k2.ma,sdtFull:'0905 111 222',data:{hoTen:'Nguyễn Thị '+k2.goi,tenGoi:k2.goi,sdt:'0905111222',ngayVao:'2025-09-01',loai:'PT',viTriChinh:k2.vt,quanChinh:k2.cs,ngoaiGio:'Đi học',caHay:['Sáng'],ranh:{'T2|Sáng':true,'T4|Sáng':true,'T6|Tối':true,'T7|Sáng':true,'CN|Sáng':true},lichDoi:'Cố định cả kỳ',thangThi:['6','12'],tet:'Về quê vài ngày',tangCa:'Báo trước thì được',lamThay:'Thỉnh thoảng'}});
  CC.ksGui({ma:k3.ma,sdtFull:'0935 222 333',data:{hoTen:'Trần Văn '+k3.goi,tenGoi:k3.goi,ngayVao:'2025-03-15',loai:'PT',viTriChinh:k3.vt,quanChinh:k3.cs,ranh:{'T3|Tối':true}}});
  CC.ksGui({ma:k3.ma,sdtFull:'0905 999 888',data:{hoTen:'Lê Thị '+k3.goi,tenGoi:k3.goi,ngayVao:'2026-01-10',loai:'PT',viTriChinh:k3.vt,quanChinh:k3.cs,ranh:{'T5|Sáng':true}}});
  CC.ksGui({moi:true,data:{hoTen:'Trần Minh Khoa',tenGoi:'Khoa',sdt:'0987654321',ngayVao:t,loai:'PT',viTriChinh:'Phục vụ',quanChinh:'TNV',ranh:{'T2|Tối':true}}});
  var mai=XL.fmtDate(XL.addDays(new Date(t+'T12:00:00+07:00'),1)), kia=XL.fmtDate(XL.addDays(new Date(t+'T12:00:00+07:00'),2));
  var banMai={}; XL.rows('LichLam').forEach(function(l){ if(XL.dateKey(l.Ngay)===mai) banMai[String(l.MaNV)]=1; });
  window.MA_LICH=(CC.rows('NhanVien').filter(function(n){ return n.Loai==='PT' && !banMai[String(n.MaNV)] && n.TrangThai!=='Đã nghỉ'; })[0]||{MaNV:'305'}).MaNV;
  XL.dangCaCanNguoi({pin:'5678',ngay:mai,maCS:'TP',gioBD:'15:00',gioKT:'19:00',viTri:'Phục vụ',soNguoi:1,ghiChu:'đông khách cuối tuần'});
  XL.dangCaCanNguoi({pin:'5678',ngay:kia,maCS:'DD',gioBD:'17:00',gioKT:'22:30',viTri:'Pha chế',soNguoi:1,ghiChu:''});
  ['310','313'].forEach(function(m,i){ var n=CC.nvByMa(m); CC.themRanhThem({ma:m,sdt4:String(n.SDT||'').replace(/\D/g,'').slice(-4),ngay:i?kia:mai,tu:'14:00',den:'20:00',ghiChu:i?'':'quán nào cũng được'}); });
  CC.setCfg('XEP_LICH_URL','https://script.google.com/macros/s/XL/exec'); XL.setCfg('CHAM_CONG_URL','https://script.google.com/macros/s/CC/exec');
  CC.luuTelegram({pin:'1234',token:'DEMO',chung:'-1001',rieng:{TP:'-1101',DD:'-1102',TD:'-1103',TNV:'-1104',LDD:'-1105'},muc:'tatca',nhacCa:'Có',sauPhut:60,tongKet:'Không',gio:23});
  try{ var mo=function(h){ return new Date(t+'T'+h+':00+07:00').getTime(); }; CC.tgNhacCa(mo('12:59'), mo('13:01')); }catch(e){}   // mẫu: ca kết thúc 12:00, sau 1 tiếng app nhắc ai quên chấm
  CC.luuTaiKhoan({pin:'1234',list:[{Ten:'Admin',PIN:'1234',VaiTro:'Admin'},{Ten:'Quản lý',PIN:'5678',VaiTro:'Quản lý',SuaGio:'Không'},{Ten:'Quản lý TP (có quyền)',PIN:'2468',VaiTro:'Quản lý',SuaGio:'Có'}]});
  var dsDot=CC.dsDot({pin:'5678',thang:t.slice(0,7)}).list; dsDot.forEach(function(d){ if(d.XongNgay && !d.ChoXuLy) CC.duyetDot({pin:'5678',thang:t.slice(0,7),dot:d.Dot}); });
  XL.dongBoChamCong();
  return {CC:CC, XL:XL};
}
var GEO_STUB=function(cs){ var c=TOADO[cs]||TOADO.TP; return 'try{ Object.defineProperty(navigator,"geolocation",{value:{getCurrentPosition:function(ok){ setTimeout(function(){ ok({coords:{latitude:'+(c[0]+0.0001)+',longitude:'+(c[1]+0.0001)+',accuracy:15}}); },100); }}}); }catch(e){}'+
  'var _ck=HTMLInputElement.prototype.click; HTMLInputElement.prototype.click=function(){ if(this.id==="cam" && window.S){ var cv=document.createElement("canvas"); cv.width=240; cv.height=240; var g=cv.getContext("2d"); g.fillStyle="#2F5D62"; g.fillRect(0,0,240,240); g.fillStyle="#fff"; g.font="bold 38px sans-serif"; g.textAlign="center"; g.fillText("ẢNH",120,110); g.font="20px sans-serif"; g.fillText("tự chụp (demo)",120,150); window.S.photo=cv.toDataURL("image/jpeg",0.7); window.ve(); return; } return _ck.apply(this,arguments); };'; };
function moQR(){ var cs=document.getElementById('selCS').value, CC=APPS.CC; if(cs==='giocong'){ nap(document.getElementById('fQR'), FILES.gc, 'CC'); return; } if(cs==='khaosat'){ nap(document.getElementById('fQR'), FILES.ksp, 'CC'); return; } if(cs==='lich'){ nap(document.getElementById('fQR'), FILES.lct, 'CC'); return; } var tk=CC.qrToken(cs);
  nap(document.getElementById('fQR'), FILES.qr.replace("<?= cs ?>",cs).replace("<?= tk ?>",tk), 'CC', GEO_STUB(cs)); }
function moNV(){ nap(document.getElementById('fNV'), FILES.lct, 'CC', ''); }
setTimeout(function(){
  try{ khoiTao(); }catch(e){ document.getElementById('ldmsg').textContent='Lỗi khởi tạo demo: '+e.message; console.error(e); return; }
  var sel=document.getElementById('selCS'); APPS.CC.rows('CoSo').forEach(function(c){ var o=document.createElement('option'); o.value=c.MaCS; o.textContent='QR '+c.TenCS; sel.appendChild(o); }); var og=document.createElement('option'); og.value='giocong'; og.textContent='Giờ công của tôi'; sel.appendChild(og); var ok3=document.createElement('option'); ok3.value='lich'; ok3.textContent='Lịch của tôi'; sel.appendChild(ok3); var ok2=document.createElement('option'); ok2.value='khaosat'; ok2.textContent='Khảo sát nhân viên'; sel.appendChild(ok2);
  sel.onchange=moQR; moQR(); nap(document.getElementById('fQL'), FILES.ql, 'CC');
  document.getElementById('rQL').onclick=function(){ nap(document.getElementById('fQL'), FILES.ql, 'CC'); };
  document.getElementById('rAD').onclick=function(){ nap(document.getElementById('fAD'), FILES.ad, 'XL'); };
  var nvs=APPS.XL.rows('NhanVien'), n=nvs.filter(function(x){ return x.Loai==='PT' && String(x.SDT||'').replace(/\D/g,'').length>=4 && x.TrangThai!=='Đã nghỉ'; })[0];
  document.getElementById('ksHint').innerHTML=n?('thử mã <b>'+n.MaNV+'</b> ('+String(n.Ten).split(' (')[0]+'), 4 số cuối điện thoại <b>'+String(n.SDT).replace(/\D/g,'').slice(-4)+'</b>'):'';
  var ten=function(m){ var x=nvs.filter(function(y){return String(y.MaNV)===m;})[0]; return x?String(x.Ten).split(' (')[0]:''; };
  var lh=APPS.CC.nvByMa(window.MA_LICH); document.getElementById('lHint').innerHTML='thử mã <b>'+window.MA_LICH+'</b>'+(lh&&String(lh.SDT||'').replace(/\D/g,'')?', 4 số cuối <b>'+String(lh.SDT).replace(/\D/g,'').slice(-4)+'</b>':'');
  var g=nvs.filter(function(x){ return String(x.MaNV)==='202'; })[0]; if(g && !String(g.SDT||'').replace(/\D/g,'')) g={SDT:''}; document.getElementById('gcHint').innerHTML='mã <b>202</b>, 4 số cuối <b>'+(g?String(g.SDT||'').replace(/\D/g,'').slice(-4):'')+'</b>';
  document.getElementById('maHint').innerHTML='<b>313</b> ('+ten('313')+'), <b>303</b> ('+ten('303')+')';
  document.getElementById('selXL').onchange=moNV; var xlLoaded=false;
  document.getElementById('bCC').onclick=function(){ this.setAttribute('aria-pressed','true'); document.getElementById('bXL').setAttribute('aria-pressed','false'); document.getElementById('vCC').classList.remove('hide'); document.getElementById('vXL').classList.add('hide'); };
  document.getElementById('bXL').onclick=function(){ this.setAttribute('aria-pressed','true'); document.getElementById('bCC').setAttribute('aria-pressed','false'); document.getElementById('vXL').classList.remove('hide'); document.getElementById('vCC').classList.add('hide');
    if(!xlLoaded){ xlLoaded=true; nap(document.getElementById('fAD'), FILES.ad, 'XL'); moNV(); } };
  document.getElementById('loading').classList.add('hide');
}, 50);

window.onTG=function(){ var L=window.TG_LOG||[], el=document.getElementById('tgList'); if(!el) return;
  el.innerHTML=L.length?L.slice(0,60).map(function(m){ var e=function(x){ return String(x).replace(/[&<>]/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c]; }); }; return '<div class="tgm"><div class="tgn">Nhóm '+e(m.nhom)+'</div>'+e(m.text)+'<div class="tgt">'+('0'+m.luc.getHours()).slice(-2)+':'+('0'+m.luc.getMinutes()).slice(-2)+'</div></div>'; }).join(''):'<p class="tge">Chưa có tin.</p>';
  try{ var muc=APPS.CC.cfg('TG_MUC'); document.getElementById('tgMucHint').textContent={tatca:'từng người vào / ra',chuy:'chỉ chuyện cần chú ý',tat:'tắt'}[muc]||muc; }catch(e){} };
setTimeout(function(){ window.onTG(); },9000);
</script></body></html>'''
open('/mnt/user-data/outputs/demo-2-app-ncafe.html','w',encoding='utf-8').write(page)
print(len(page))
