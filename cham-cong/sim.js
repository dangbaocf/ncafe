// MÔ PHỎNG NGẪU NHIÊN – chạy: cat cc_env.js sim.js > /tmp/s.js && node /tmp/s.js <seed>
(0,eval)(fs.readFileSync(__CCDIR+'/dist/Code.gs','utf8'));
const SEED=+process.argv[2]||1; let _s=SEED*2654435761>>>0;
const rnd=()=>{ _s=(_s+0x6D2B79F5)>>>0; let t=_s; t=Math.imul(t^t>>>15,t|1); t^=t+Math.imul(t^t>>>7,t|61); return ((t^t>>>14)>>>0)/4294967296; };
const ri=(a,b)=>a+Math.floor(rnd()*(b-a+1)), pick=a=>a[Math.floor(rnd()*a.length)];
const mm=t=>{ const p=String(t).split(':'); return +p[0]*60+(+p[1]); }, hh=m=>String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');
const g15=(a,b)=>Math.round((mm(b)-mm(a))/60*4)/4;
const STAT={ca:0,loai:{},hanhDong:{},kiem:0,loi:[],ngoaiLe:0,quyenDung:0};
const loi=(m)=>{ STAT.loi.push(m); }, kiem=(dk,m)=>{ STAT.kiem++; if(!dk) loi(m); };
const goi=(fn,p)=>{ try{ return global[fn](p); }catch(e){ STAT.ngoaiLe++; loi('NGOẠI LỆ '+fn+': '+e.message); return {ok:false,msg:'exception'}; } };
const dem=(o,k)=>{ o[k]=(o[k]||0)+1; };

setup();
luuTaiKhoan({pin:'1234',list:[{Ten:'Admin',PIN:'1234',VaiTro:'Admin'},{Ten:'QL chung',PIN:'5678',VaiTro:'Quản lý',SuaGio:'Không'},{Ten:'QL TP',PIN:'2468',VaiTro:'Quản lý',SuaGio:'Có',Quan:'TP'},{Ten:'QL DD',PIN:'1357',VaiTro:'Quản lý',SuaGio:'Không',Quan:'DD'}]});
const CS=rows('CoSo').map(c=>c.MaCS), TEN={}; rows('CoSo').forEach(c=>TEN[c.MaCS]=c.TenCS);
const CHAT={}; CS.forEach((c,i)=>{ CHAT[c]='-10'+i; setCfg('TG_CHAT_'+c,CHAT[c]); }); setCfg('TG_TOKEN','TOKOK'); setCfg('TG_MUC','tatca'); _CFG=null;
const LL=XLSS.insertSheet('LichLam'); LL.d=[['Ngay','MaCS','MaNV','MaCa','ViTri','GhiChu']]; setCfg('LICH_SHEET_ID','XL'); _CFG=null;
const CA=rows('Ca').map(c=>({ma:c.MaCa,bd:hhmm(c.GioBD),kt:hhmm(c.GioKT),cs:String(c.CoSo)}));
const caCho=cs=>CA.filter(c=>c.cs==='ALL'||c.cs.split(',').indexOf(cs)>-1);
const NV=rows('NhanVien').filter(n=>dangLam(n) && String(n.SDT||'').replace(/\D/g,'').length>=4 && /^[1-5]\d\d$/.test(String(n.MaNV))).map(n=>String(n.MaNV));
const s4=m=>String(nvByMa(m).SDT).replace(/\D/g,'').slice(-4);
NV.forEach(m=>suaNhanVien({pin:'1234',maNV:m,KieuLuong:'Giờ'}));
const CODINH=NV.slice(0,3); CODINH.forEach(m=>suaNhanVien({pin:'1234',maNV:m,KieuLuong:'Cố định',LuongCoBan:'8000'}));
luuCauHinh({pin:'1234',ngayLe:[{Ngay:'2027-03-15',Ten:'Lễ thử',HeSo:2}]});
const TH='2027-03', NGAY=[]; for(let d=1; d<=28; d++) NGAY.push(TH+'-'+String(d).padStart(2,'0'));
const tk=cs=>qrToken(cs), vtq=cs=>({lat:16.06,lng:108.22});
const RATE0={}; NV.forEach(m=>RATE0[m]=CODINH.indexOf(m)>-1?8000:luongGio(nvByMa(m))); const RAISE={};   // ma -> [{tu, muc}]
const VT3=['Pha chế','Phục vụ','Thu ngân'], BASEPOS={}, POS={}, VTH={}, PERS0={}, VT0={};
dsViTri().forEach(v=>BASEPOS[v]=nghin(cfg('LUONG_'+v))); NV.forEach(m=>{ const n=nvByMa(m); PERS0[m]=nghin(n.LuongGio)>0; VT0[m]=vtLuong(n); });
const posRate=(vt,d)=>{ let v=BASEPOS[vt]||BASEPOS['Phục vụ']; (POS[vt]||[]).forEach(x=>{ if(d>=x.tu) v=x.muc; }); return v; };
const vtAt=(m,d)=>{ let v=VT0[m]; (VTH[m]||[]).forEach(x=>{ if(d>=x.tu) v=x.vt; }); return v; };

// 1) Lịch cả tháng
const CAS=[]; NGAY.forEach(ng=>{ const ban={}; CS.forEach(cs=>{ const k=ri(2,4); for(let i=0;i<k;i++){ const m=pick(NV); if(ban[m]) continue; ban[m]=1; const c=pick(caCho(cs));
  LL.d.push([ng,cs,m,c.ma,'Phục vụ','']); CAS.push({ng,cs,m,c}); } }); });
_LICH=null;
const LOAI=[['dung_gio',28],['nhac_nho',14],['tre',10],['cham_muon',8],['vang',7],['quen_ra',5],['bao_quen',5],['nham_quan',5],['ve_som',6],['tang_ca',6],['xin_phep_muon',6]];
const tong=LOAI.reduce((a,x)=>a+x[1],0), chonLoai=()=>{ let r=rnd()*tong; for(const x of LOAI){ if((r-=x[1])<0) return x[0]; } return 'dung_gio'; };
const KY={}; // id lượt -> giờ kỳ vọng sau khi duyệt
const caG=c=>g15(c.bd,c.kt);

// 2) Từng ngày: sự kiện vào / ra theo giờ, rồi quản lý duyệt sáng hôm sau
NGAY.forEach((ng,di)=>{
  // đổi lương giờ mặc định của một vị trí từ hôm nay
  if(rnd()<0.06){ const vt=pick(VT3), moi=posRate(vt,ng)+ri(1,2); at(ng,'06:00'); const r=goi('luuCauHinh',{pin:'1234',ngayApDung:ng,com:[{ViTri:vt,LuongGio:String(moi)}]}); fake=null;
    if(r.ok){ (POS[vt]=POS[vt]||[]).push({tu:ng,muc:moi}); dem(STAT.hanhDong,'đổi lương vị trí có ngày áp dụng'); } else loi('Đổi lương vị trí lỗi: '+r.msg); }
  // nhân viên đổi vị trí từ hôm nay
  if(rnd()<0.06){ const ung=NV.filter(m=>CODINH.indexOf(m)<0 && !PERS0[m] && nvByMa(m).ChucVu!=='Quản lý'); if(ung.length){ const m=pick(ung), cu=vtAt(m,ng), moi=pick(VT3.filter(v=>v!==cu)); at(ng,'06:00');
    const r=goi('suaNhanVien',{pin:'1234',maNV:m,ViTri:moi,ngayApDung:ng}); fake=null; if(r.ok){ (VTH[m]=VTH[m]||[]).push({tu:ng,vt:moi}); dem(STAT.hanhDong,'nhân viên đổi vị trí có ngày áp dụng'); } } }
  // tăng lương giữa tháng (ngẫu nhiên)
  if(rnd()<0.12){ const m=pick(NV), cu=luongGio(nvByMa(m)), moi=cu+ri(1,3); at(ng,'07:00'); const r=goi('tangLuong',{pin:'1234',maNV:m,mucMoi:String(moi),ngay:ng,ghiChu:'mô phỏng'});
    if(r.ok){ (RAISE[m]=RAISE[m]||[]).push({tu:ng,muc:moi}); dem(STAT.hanhDong,'tăng lương có ngày áp dụng'); } fake=null; }
  const ev=[], hom=CAS.filter(x=>x.ng===ng);
  hom.forEach(x=>{ const L=chonLoai(); x.loai=L; STAT.ca++; dem(STAT.loai,L); const bd=mm(x.c.bd), kt=mm(x.c.kt);
    const vao=(t,cs,extra)=>ev.push({t,f:()=>{ at(ng,hh(t)); const r=goi('qrVao',Object.assign({cs:cs||x.cs,t:tk(cs||x.cs),maNV:x.m,deviceId:'d'+x.m,maCa:x.c.ma,viTri:'Phục vụ'},vtq(),extra||{}));
      if(!r.ok) loi('Vào ca thất bại '+ng+' '+x.m+' '+x.c.ma+' '+(cs||x.cs)+': '+r.msg); fake=null; }});
    const ra=(t,khai)=>ev.push({t,f:()=>{ if(t>=1440){ const d2=new Date(ng+'T12:00:00+07:00'); d2.setDate(d2.getDate()+1); at(d2.toISOString().slice(0,10),hh(t-1440)); if(khai.den&&mm(khai.den)>=1440) khai.den='23:59'; } else at(ng,hh(t)); const r=goi('qrRa',Object.assign({cs:x.cs,t:tk(x.cs),maNV:x.m,deviceId:'d'+x.m},vtq(),khai)); if(!r.ok) loi('Ra ca thất bại '+ng+' '+x.m+': '+r.msg); fake=null; }});
    if(L==='dung_gio'){ vao(bd-ri(0,15)); ra(kt+ri(0,8),{khaiLoai:'du'}); x.ky=caG(x.c); }
    else if(L==='nhac_nho'){ vao(bd+ri(1,10)); ra(kt+ri(0,5),{khaiLoai:'du'}); x.ky=caG(x.c); }
    else if(L==='tre'){ const v=bd+ri(11,60); x.vao=hh(v); vao(v); const t=kt+ri(0,5); x.ra=hh(t); ra(t,{khaiLoai:'du',lyDo:'Kẹt xe / mưa lớn'}); x.ky=(v-bd>15)?Math.round((kt-v)/60*100)/100:caG(x.c); }   // (30/10) trễ trên 15' (ngưỡng trừ giờ) mới tính đúng phút; 11–15' đủ ca
    else if(L==='cham_muon'){ vao(bd+ri(15,45)); ra(kt+ri(0,5),{khaiLoai:'du',coMat:x.c.bd,lyDo:'Có mặt đúng giờ, chấm muộn (mã QR / mạng / hết pin)'}); x.ky=caG(x.c); }
    else if(L==='quen_ra'){ vao(bd-ri(0,10)); x.ky=caG(x.c); }
    else if(L==='nham_quan'){ const cs2=pick(CS.filter(c=>c!==x.cs && caCho(c).some(k=>k.ma===x.c.ma))); if(!cs2){ x.loai='dung_gio'; vao(bd); ra(kt,{khaiLoai:'du'}); x.ky=caG(x.c); return; }
      x.cs2=cs2; vao(bd-ri(0,10),cs2); ev.push({t:kt+ri(0,5),f:()=>{ at(ng,hh(kt+3)); const r=goi('qrRa',Object.assign({cs:cs2,t:tk(cs2),maNV:x.m,deviceId:'d'+x.m,khaiLoai:'du'},vtq())); if(!r.ok) loi('Ra ca (nhầm quán) thất bại: '+r.msg); fake=null; }}); x.ky=caG(x.c); }
    else if(L==='ve_som'){ const v=bd-ri(0,10), r2=kt-ri(30,120); vao(v); const tu=hh(Math.max(v,bd)); ra(r2,{khaiLoai:'giam',tu,den:hh(r2),lyDo:'Ốm / sức khoẻ'}); x.ky=g15(tu,hh(r2)); }
    else if(L==='tang_ca'){ vao(bd-ri(0,10)); const r2=kt+ri(30,90), den=r2>=1440?'23:59':hh(r2); ra(r2,{khaiLoai:'tang',tu:x.c.bd,den,lyDo:'Đông khách, quản lý giữ lại'}); x.ky=g15(x.c.bd,den); if(r2>=1440) dem(STAT.loai,'qua_nua_dem'); }
    else if(L==='xin_phep_muon'){ ev.push({t:-1,f:()=>{ at(ng,'05:00'); const r=goi('xinPhep',{ma:x.m,sdt4:s4(x.m),ngay:ng,loai:'muon',gio:hh(bd+30),lyDo:'Việc gia đình'}); if(!r.ok) loi('Xin phép thất bại: '+r.msg); fake=null; }});
      const v=bd+ri(20,35); vao(v); ra(kt+ri(0,5),{khaiLoai:'du',lyDo:'Đã xin phép quản lý'}); x.ky=Math.round((kt-v)/60*100)/100; }   // (28/10) có phép vẫn chỉ tính giờ thực làm
    else if(L==='bao_quen'){ x.ky=caG(x.c); }
    // 'vang': không làm gì
  });
  // ca gãy: người có ca sáng (kết thúc ≤ 14:30) làm thêm ca tối 17:00–22:30 cùng ngày, có trong lịch
  hom.filter(x=>mm(x.c.kt)<=mm('14:30') && ['TP','DD','LDD'].indexOf(x.cs)>-1 && x.loai!=='quen_ra' && x.loai!=='vang' && x.loai!=='bao_quen' && x.loai!=='nham_quan').slice(0,2).forEach(x=>{ if(rnd()<0.5) return; const c=CA.find(k=>k.ma==='PT3'); LL.d.push([ng,x.cs,x.m,'PT3','Phục vụ','']); _LICH=null;
    const y={ng,cs:x.cs,m:x.m,c,loai:'ca_gay',ky:caG(c)}; CAS.push(y); STAT.ca++; dem(STAT.loai,'ca_gay');
    ev.push({t:mm('16:55'),f:()=>{ at(ng,'16:55'); const r=goi('qrVao',Object.assign({cs:x.cs,t:tk(x.cs),maNV:x.m,deviceId:'d'+x.m,maCa:'PT3',viTri:'Phục vụ'},vtq())); if(!r.ok) loi('Vào ca gãy thất bại: '+r.msg); fake=null; }});
    ev.push({t:mm('22:31'),f:()=>{ at(ng,'22:31'); const r=goi('qrRa',Object.assign({cs:x.cs,t:tk(x.cs),maNV:x.m,deviceId:'d'+x.m,khaiLoai:'du'},vtq())); if(!r.ok) loi('Ra ca gãy thất bại: '+r.msg); fake=null; }}); });
  // thao tác sai cố tình – app phải chặn
  ev.push({t:mm('10:00'),f:()=>{ at(ng,'10:00'); const dang=ccRows().find(r=>dateKey(r.Ngay)===ng && r.TrangThai==='Đang làm'); if(dang){ const a=goi('qrVao',Object.assign({cs:dang.MaCS,t:tk(dang.MaCS),maNV:String(dang.MaNV),deviceId:'d'+dang.MaNV,maCa:'PT1'},vtq())); kiem(!a.ok,'Quét vào 2 lần không bị chặn'); STAT.quyenDung++; }
    const ranh=NV.find(z=>!ccRows().some(r=>dateKey(r.Ngay)===ng && String(r.MaNV)===z)); if(ranh){ const b=goi('qrRa',Object.assign({cs:'TP',t:tk('TP'),maNV:ranh,deviceId:'d'+ranh,khaiLoai:'du'},vtq())); kiem(!b.ok,'Ra ca khi chưa vào không bị chặn'); STAT.quyenDung++; }
    const c=goi('qrVao',Object.assign({cs:'TP',t:'MA-GIA',maNV:NV[5],deviceId:'x',maCa:'PT1'},vtq())); kiem(!c.ok,'Mã QR giả không bị chặn'); STAT.quyenDung++; fake=null; }});
  // ngoài lịch: 1–2 người không có lịch đi làm thêm
  const daChon={}; for(let i=0;i<ri(0,2);i++){ const tu=NV.filter(z=>!hom.some(x=>x.m===z) && !daChon[z]); if(!tu.length) break; const m=pick(tu); daChon[m]=1; const cs=pick(CS), c=pick(caCho(cs)); const x={ng,cs,m,c,loai:'ngoai_lich',ky:caG(c)}; CAS.push(x); STAT.ca++; dem(STAT.loai,'ngoai_lich');
    ev.push({t:mm(c.bd),f:()=>{ at(ng,c.bd); const r=goi('qrVao',Object.assign({cs,t:tk(cs),maNV:m,deviceId:'d'+m,maCa:c.ma,viTri:'Phục vụ'},vtq())); if(!r.ok) loi('Vào ngoài lịch thất bại: '+r.msg); fake=null; }});
    ev.push({t:mm(c.kt),f:()=>{ at(ng,c.kt); goi('qrRa',Object.assign({cs,t:tk(cs),maNV:m,deviceId:'d'+m,khaiLoai:'du'},vtq())); fake=null; }}); }
  ev.sort((a,b)=>a.t-b.t).forEach(e=>e.f());

  // nhân viên báo quên chấm (tối cùng ngày)
  CAS.filter(x=>x.ng===ng && x.loai==='bao_quen').forEach(x=>{ at(ng,'23:00'); const r=goi('baoQuenCham',{ma:x.m,sdt4:s4(x.m),ngay:ng,tu:x.c.bd,den:x.c.kt,lyDo:'Quên điện thoại'}); if(!r.ok) loi('Báo quên chấm thất bại: '+r.msg); fake=null; });

  // 3) Sáng hôm sau: quản lý xử lý
  const mai=di<NGAY.length-1?NGAY[di+1]:'2027-03-29'; at(mai,'09:00');
  const ds=goi('xnDanhSach',{pin:'1234',ngay:ng}), byId={}; (ds.list||[]).forEach(o=>byId[o.ID]=o);
  // phạm vi quán
  const dTP=goi('xnDanhSach',{pin:'2468',ngay:ng}), dDD=goi('xnDanhSach',{pin:'1357',ngay:ng});
  kiem((dTP.list||[]).every(o=>o.MaCS==='TP') && (dDD.list||[]).every(o=>o.MaCS==='DD'), 'Quản lý theo quán thấy lượt quán khác ngày '+ng);
  // xin phép, báo quên
  (ds.xinPhep||[]).forEach(q=>{ const r=goi('xpQuyetDinh',{pin:'5678',id:q.ID,dongY:rnd()<0.9}); kiem(r.ok,'Duyệt xin phép lỗi'); dem(STAT.hanhDong,'duyệt xin phép'); });
  (ds.baoQuen||[]).forEach(q=>{ const r=goi('bqQuyetDinh',{pin:'5678',id:q.ID,dongY:true}); kiem(r.ok,'Duyệt báo quên lỗi: '+r.msg); dem(STAT.hanhDong,'duyệt báo quên chấm'); });
  const lay=()=>goi('xnDanhSach',{pin:'1234',ngay:ng}).list||[];
  // gắn lượt chấm công với kịch bản
  lay().forEach(o=>{ const x=CAS.find(z=>z.ng===ng && z.m===o.MaNV && !z.id); if(x){ x.id=o.ID; } });
  // thử quyền (phải bị chặn)
  const mot=lay().find(o=>o.TrangThai==='Chờ xác nhận' && o.MaCS==='TP');
  if(mot){ const a=goi('xnDuyet',{pin:'5678',ids:[mot.ID],cach:'lich'}); kiem(!a.ok,'Quản lý không quyền vẫn tính theo lịch được'); const b=goi('xnDuyet',{pin:'1357',ids:[mot.ID],cach:'dexuat'}); kiem(b.xong===0,'QL Đống Đa duyệt được lượt Trần Phú');
    const c=goi('xnXoaLuot',{pin:'2468',id:mot.ID,lyDo:'x'}); kiem(!c.ok,'Quản lý xoá được lượt chấm công'); STAT.quyenDung+=3; }
  // xử lý từng lượt
  lay().forEach(o=>{ const x=CAS.find(z=>z.id===o.ID);
    if(o.TrangThai==='Đã xác nhận' || o.TrangThai==='Đã xong'){ if(x && x.loai==='bao_quen') KY[o.ID]=x.ky; return; }
    if(o.TrangThai==='Đang làm' || o.TrangThai==='Quên chấm ra'){ const r=goi('xnDuyet',{pin:'1234',ids:[o.ID],cach:'sua',vao:o.Ca.split('–')[0],ra:o.Ca.split('–')[1],lyDo:'quên chấm ra, quản lý xác nhận'}); kiem(r.xong===1,'Sửa quên chấm ra lỗi: '+JSON.stringify(r)); KY[o.ID]=g15(o.Ca.split('–')[0],o.Ca.split('–')[1]); dem(STAT.hanhDong,'sửa lượt quên chấm ra'); return; }
    if(x && x.cs2){ const r=goi('xnDoiQuan',{pin:'1234',id:o.ID,cs:x.cs,lyDo:'quét nhầm QR'}); kiem(r.ok,'Đổi quán lỗi'); dem(STAT.hanhDong,'đổi quán (quét nhầm QR)'); o.MaCS=x.cs;
      kiem(ccRows().find(z=>z.ID===o.ID).MaCS===x.cs,'Đổi quán không lưu'); }
    const pinQL=o.MaCS==='DD'?'1357':(o.MaCS==='TP'?'2468':'5678'), u=rnd();
    if(x && x.loai==='tre' && u<0.5 && x.vao){ const r=goi('xnDuyet',{pin:'1234',ids:[o.ID],cach:'cham'}); kiem(r.xong===1,'Tính theo giờ chấm lỗi'); { const bdC=mm(x.c.bd), v0=mm(x.vao), tuC=(v0>bdC && v0-bdC<=15)?bdC:v0, phut=mm(x.ra)-tuC; KY[o.ID]=(v0-bdC>15)?Math.round(phut/60*100)/100:Math.round(phut/15)*15/60; }   // (30/10) trễ ≤ 15' không trừ (tính từ giờ ca, làm tròn 15'); trên 15' đúng phút
      dem(STAT.hanhDong,'duyệt theo giờ chấm'); return; }
    if(u<0.06){ const v=o.Ca.split('–')[0], r2=hh(mm(o.Ca.split('–')[1])-30); const r=goi('xnDuyet',{pin:'1234',ids:[o.ID],cach:'sua',vao:v,ra:r2,lyDo:'quản lý điều chỉnh'}); kiem(r.xong===1,'Sửa giờ lỗi'); KY[o.ID]=g15(v,r2); dem(STAT.hanhDong,'sửa giờ'); return; }
    const r=goi('xnDuyet',{pin:pinQL,ids:[o.ID],cach:'dexuat'}); kiem(r.xong===1,'Duyệt theo đề xuất lỗi ('+pinQL+' '+o.MaCS+'): '+JSON.stringify(r)); KY[o.ID]=o.DeXuat; dem(STAT.hanhDong,'duyệt theo đề xuất');
    if(x && o.DeXuat!==x.ky) loi('Đề xuất '+o.DeXuat+'h khác kỳ vọng '+x.ky+'h ('+x.loai+' '+ng+' '+x.m+')');
    if(rnd()<0.04){ const b=goi('xnBoDuyet',{pin:'2468',id:o.ID}); if(o.MaCS==='TP') kiem(b.ok,'Bỏ duyệt lỗi'); const r3=goi('xnDuyet',{pin:'5678',ids:[o.ID],cach:'dexuat'}); kiem(r3.ok,'Duyệt lại lỗi'); dem(STAT.hanhDong,'bỏ duyệt rồi duyệt lại'); }
  });
  // vắng: đánh dấu, hoặc quản lý TP thêm lượt thay (quên điện thoại)
  (goi('xnDanhSach',{pin:'1234',ngay:ng}).vang||[]).forEach(v=>{ if(v.DaDanhDau) return;
    if(v.MaCS==='TP' && rnd()<0.4){ const p=v.Ca.split('–'); const r=goi('xnThemLuot',{pin:'2468',ma:v.MaNV,cs:'TP',ngay:ng,vao:p[0],ra:p[1],lyDo:'quên điện thoại'}); kiem(r.ok,'Thêm lượt thay lỗi: '+r.msg); if(r.ok) KY[r.id]=g15(p[0],p[1]); dem(STAT.hanhDong,'quản lý thêm lượt thay'); }
    else { const r=goi('xnVang',{pin:'5678',ma:v.MaNV,ngay:ng,cs:v.MaCS,ca:v.Ca,coPhep:rnd()<0.5?'Có phép':'Không phép'}); kiem(r.ok,'Đánh dấu vắng lỗi'); dem(STAT.hanhDong,'đánh dấu vắng');
      if(rnd()<0.1){ const b=goi('xnBoVang',{pin:'5678',ma:v.MaNV,ngay:ng}); kiem(b.ok,'Bỏ vắng lỗi'); dem(STAT.hanhDong,'bỏ đánh dấu vắng'); } } });
  // nhân viên phản hồi một lượt đã duyệt; quản lý trả lời và mở lại, rồi duyệt lại
  if(rnd()<0.3){ const o=lay().find(z=>z.TrangThai==='Đã xác nhận' && z.MaCS==='TP' && /^[1-5]/.test(z.MaNV)); if(o){ const r=goi('phanHoi',{ma:o.MaNV,sdt4:s4(o.MaNV),ccId:o.ID,noiDung:'giờ chưa đúng'}); kiem(r.ok,'Phản hồi lỗi: '+r.msg);
    const ph=(goi('xnDanhSach',{pin:'1234',ngay:ng}).phanHoi||[]).find(z=>z.CCID===o.ID); kiem(!!ph,'Không thấy phản hồi trong tab Xác nhận giờ');
    if(ph){ const t=goi('phTraLoi',{pin:'2468',id:ph.ID,traLoi:'đã kiểm tra',moLai:true}); kiem(t.ok,'Trả lời & mở lại lỗi'); const d=goi('xnDuyet',{pin:'5678',ids:[o.ID],cach:'dexuat'}); kiem(d.xong===1,'Duyệt lại sau phản hồi lỗi'); KY[o.ID]=o.DeXuat; dem(STAT.hanhDong,'phản hồi → mở lại → duyệt lại'); } } }
  // không còn dòng chờ của ngày này
  const con=lay().filter(o=>o.TrangThai!=='Đã xác nhận' && o.TrangThai!=='Đã xong'); kiem(!con.length,'Còn '+con.length+' lượt chưa duyệt ngày '+ng+': '+con.map(o=>o.MaNV+' '+o.TrangThai).join(', '));
  fake=null;
});

const nghi=NV[NV.length-1]; suaNhanVien({pin:'1234',maNV:nghi,TrangThai:'Đã nghỉ'}); at('2027-03-28','12:00'); kiem(!goi('qrVao',Object.assign({cs:'TP',t:tk('TP'),maNV:nghi,deviceId:'z',maCa:'PT2'},vtq())).ok,'Người đã nghỉ vẫn chấm công được'); STAT.quyenDung++; fake=null; suaNhanVien({pin:'1234',maNV:nghi,TrangThai:'Đang làm'});
// 4) Cuối tháng: khoá sổ 3 đợt
at('2027-04-02','09:00');
const dot=goi('dsDot',{pin:'1234',thang:TH}); (dot.list||[]).forEach(d=>kiem(!d.ChoXuLy,'Đợt '+d.Dot+' còn '+d.ChoXuLy+' lượt chờ'));
[1,2,3].forEach(d=>{ const r=goi('duyetDot',{pin:'5678',thang:TH,dot:d}); kiem(r.ok,'Khoá sổ đợt '+d+' lỗi: '+r.msg); });
const motTP=ccRows().find(r=>dateKey(r.Ngay).slice(0,7)===TH && r.MaCS==='TP');
if(motTP){ const a=goi('xnDuyet',{pin:'2468',ids:[motTP.ID],cach:'sua',vao:'06:30',ra:'12:00',lyDo:'x'}); kiem(a.xong===0 && /chỉ admin/.test((a.bo||[])[0]||''),'Quản lý sửa được lượt trong đợt đã khoá');
  const b=goi('xnDuyet',{pin:'1234',ids:[motTP.ID],cach:'sua',vao:'06:30',ra:'12:00',lyDo:'admin sửa sau khoá'}); kiem(b.xong===1,'Admin không sửa được sau khoá'); KY[motTP.ID]=5.5; }
// báo quên chấm cho ngày nằm trong đợt đã khoá: quản lý không duyệt được, admin duyệt được
{ const m=NV[7]; const ngq=NGAY.find(d=>!ccRows().some(r=>dateKey(r.Ngay)===d && String(r.MaNV)===m)); if(ngq){ const a=goi('baoQuenCham',{ma:m,sdt4:s4(m),ngay:ngq,tu:'06:30',den:'12:00',lyDo:'quên'}); kiem(a.ok,'Báo quên sau khoá lỗi gửi');
  const q=(goi('xnDanhSach',{pin:'1234',ngay:ngq}).baoQuen||[]).find(z=>z.MaNV===m); const b=goi('bqQuyetDinh',{pin:'5678',id:q.ID,dongY:true}); kiem(!b.ok,'Quản lý duyệt được báo quên trong đợt đã khoá'); STAT.quyenDung++;
  const c=goi('bqQuyetDinh',{pin:'1234',id:q.ID,dongY:true}); kiem(c.ok,'Admin không duyệt được báo quên sau khoá'); const row=ccRows().find(r=>dateKey(r.Ngay)===ngq && String(r.MaNV)===m); if(row) KY[row.ID]=5.5; } }
fake=null;

// 5) KIỂM TRA TOÀN BỘ
const ccT=ccRows().filter(r=>dateKey(r.Ngay).slice(0,7)===TH);
ccT.forEach(r=>{ kiem(['Đã xác nhận','Đã xong'].indexOf(String(r.TrangThai))>-1,'Lượt '+r.ID+' trạng thái '+r.TrangThai); kiem(+r.GioTinh>0 && +r.GioTinh<=16,'Lượt '+r.ID+' giờ '+r.GioTinh);
  if(KY[r.ID]!=null) kiem(Math.abs(+r.GioTinh-KY[r.ID])<0.001,'Giờ đã duyệt '+r.GioTinh+' ≠ kỳ vọng '+KY[r.ID]+' ('+r.ID+' '+r.Cach+')'); });
// lương = tổng giờ × mức lương đúng ngày (có tăng lương giữa tháng)
const muc=(m,d)=>{ if(CODINH.indexOf(m)>-1 || PERS0[m]){ let v=RATE0[m]; (RAISE[m]||[]).forEach(x=>{ if(d>=x.tu) v=x.muc; }); return v; }
  const R=RAISE[m]||[]; if(R.length && d>=R[0].tu){ let v=R[0].muc; R.forEach(x=>{ if(d>=x.tu) v=x.muc; }); return v; } return posRate(vtAt(m,d),d); };
at('2027-04-02','10:00'); const BL=goi('bangLuong',{pin:'1234',thang:TH}); fake=null;
const LE={'2027-03-15':2};
(BL.list||[]).forEach(o=>{ const L=ccT.filter(r=>up(r.MaNV)===o.MaNV); let ky=0;
  if(o.KieuLuong==='Cố định'){ const ngay={}; L.forEach(r=>{ ngay[dateKey(r.Ngay)]=1; }); Object.keys(ngay).forEach(d=>{ ky+=muc(o.MaNV,d)/26*(LE[d]||1); });
    L.forEach(r=>{ const d=dateKey(r.Ngay), g=+r.GioTinh, cg=(mm(hhmm(r.CaKT))-mm(hhmm(r.CaBD)))/60, q=muc(o.MaNV,d)/26/8; ky+=-(g<cg?cg-g:0)*q + ((String(r.TrangThai)==='Đã xác nhận'&&g>cg)?g-cg:0)*q; }); }
  else L.forEach(r=>{ const d=dateKey(r.Ngay); ky+=(+r.GioTinh)*muc(o.MaNV,d)*(LE[d]||1); });
  ky=Math.round(ky*10)/10; kiem(Math.abs(o.tienLuong-ky)<0.11,'Tiền lương '+o.MaNV+' ('+o.KieuLuong+') = '+o.tienLuong+' ≠ kỳ vọng '+ky); kiem(Math.abs(o.gio-L.reduce((a,r)=>a+(+r.GioTinh),0))<0.011,'Giờ làm bảng lương '+o.MaNV+' lệch'); });
// trang Giờ công của tôi
NV.slice(0,40).forEach(m=>{ const g=goi('gioCongCuaToi',{maNV:m,sdt4:s4(m),thang:TH}); if(!g.ok) return loi('Giờ công của tôi lỗi '+m+': '+g.msg);
  g.ca.forEach(c=>{ const r=ccT.find(z=>String(z.ID)===c.ID); kiem(r && c.DaDuyet && Math.abs(c.Gio-(+r.GioTinh))<0.001,'Giờ công của tôi '+m+' '+c.Ngay+' hiện '+c.Gio+' ≠ '+(r&&r.GioTinh)); }); });
// tổng hợp tháng khớp dữ liệu
const TH2=goi('tongHopThang',{pin:'1234',thang:TH}); const sum=k=>(TH2.list||[]).reduce((a,x)=>a+x[k],0);
kiem(sum('NhacNho')===ccT.filter(r=>+r.TreMin>0 && +r.TreMin<=10).length,'Tổng hợp: số nhắc nhở lệch');
kiem(sum('TreCoPhep')+sum('TreKhongPhep')===ccT.filter(r=>+r.TreMin>10).length,'Tổng hợp: số lần trễ lệch');
kiem(sum('VangCoPhep')+sum('VangKhongPhep')===rows_('Vang').filter(v=>dateKey(v.Ngay).slice(0,7)===TH).length,'Tổng hợp: số vắng lệch');
// Telegram: tin vào / ra đúng nhóm quán
TG_SENT.forEach(t=>{ const mt=String(t.text).match(/^[^\n]*? \d\d:\d\d · ([^\n(]+?)(\n| \()/); if(!mt) return; const cs=CS.find(c=>TEN[c]===mt[1].trim()); if(cs) kiem(t.chat_id===CHAT[cs],'Tin Telegram quán '+mt[1]+' gửi nhầm nhóm'); });

console.log(JSON.stringify({seed:SEED, loiTat:STAT.loi.slice(0,40), ca:STAT.ca, loai:STAT.loai, hanhDong:STAT.hanhDong, kiemTra:STAT.kiem, thuQuyen:STAT.quyenDung, tinTelegram:TG_SENT.length, ngoaiLe:STAT.ngoaiLe, loi:STAT.loi.length, loiDau:STAT.loi.slice(0,8)}));
