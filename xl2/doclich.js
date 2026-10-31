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
if(typeof module!=='undefined' && module.exports) module.exports={lichDocTab_:lichDocTab_, lichGopNguoi_:lichGopNguoi_, lichDocO_:lichDocO_, lichKhung_:lichKhung_, lichMauQuan_:lichMauQuan_, lichGio_:lichGio_, lichPhut_:lichPhut_};
