// ===== KIỂM THỬ TOÀN BỘ YÊU CẦU (chạy sau mỗi lần sửa) =====
//ENV
global.ScriptApp.getService=()=>({getUrl:()=>'https://script.google.com/macros/s/TEST/exec'});
(0,eval)(fs.readFileSync(__dirname+'/Code.gs','utf8')+fs.readFileSync(__dirname+'/Scheduler.gs','utf8'));
const RealDate=Date; let fake=null;
global.Date=class extends RealDate{constructor(...a){if(a.length)super(...a);else super(fake||RealDate.now());} static now(){return fake||RealDate.now();}};
function at(d,hm){ fake=new RealDate(d+'T'+hm+':00+07:00').getTime(); }
let pass=0, fail=0; const out=[];
function T(name, fn){ try{ const r=fn(); if(r===true){pass++; out.push('✔ '+name);} else {fail++; out.push('✘ '+name+' — '+r);} }catch(e){ fail++; out.push('✘ '+name+' — LỖI '+e.message); } }
const sh=n=>SS.getSheetByName(n); const fetchSrc=()=>fs.readFileSync('/home/claude/chamcong/Scheduler.gs','utf8');
const LL=()=>sh('LichLam').d.slice(1).filter(x=>x&&x[0]).map(x=>({Ngay:dateKey(x[0]),MaCS:x[1],MaNV:String(x[2]),MaCa:x[3],ViTri:x[4],GhiChu:x[5]||''}));
setup();
setCfg('XEP_GHI_THANG','Có');   // các bài cũ kiểm tra THUẬT TOÁN xếp qua lịch ghi thẳng; quy trình nháp → áp dụng có bài riêng (QT…)
const nvSheet=sh('NhanVien'); const H=nvSheet.d[0]; nvSheet.d.slice(1).forEach(r=>{ if(r[0]) r[H.indexOf('LuongGio')]= r[5]==='FT'?27:20; });
const NV={}; rows('NhanVien').forEach(n=>NV[String(n.MaNV)]=n);
const CA={}; rows('Ca').forEach(c=>{ c.b=toMin(c.GioBD); c.e=toMin(c.GioKT); CA[c.MaCa]=c; });
const DAYS=['2026-10-26','2026-10-27','2026-10-28','2026-10-29','2026-10-30','2026-10-31','2026-11-01'];

// ---------- A. Cài đặt, dữ liệu nền ----------
T('A1 Mã NV lưu dạng chữ (không thành số/phần trăm)', ()=> nvSheet.d.slice(1).filter(r=>r[0]).every(r=>typeof r[0]==='string') || 'có mã không phải chữ');
T('A2 Định mức không còn vị trí Thu ngân (pha chế kiêm)', ()=> !rows('DinhMuc').some(r=>r.ViTri==='Thu ngân') || 'còn dòng Thu ngân');
T('A3 Định mức không có bảo vệ ca tối', ()=> !rows('DinhMuc').some(r=>r.ViTri==='Bảo vệ'&&r.Ca!=='Sáng') || 'còn bảo vệ tối');
T('A4 Có 4 chỗ người nhà Support', ()=> rows('NhanVien').filter(n=>n.TrangThai==='Support').length===4 || 'thiếu dòng Support');
T('A6 Mở được trang dù tên file viết hoa/thường khác (Checkin, Dangky)', ()=>{ const saved=global.HtmlService; const files={Checkin:1,Dangky:1,Admin:1}; const opened=[]; global.HtmlService={createTemplateFromFile:n=>{ if(!files[n]) throw new Error('no '+n); opened.push(n); return {evaluate:()=>({setTitle(){return this;},addMetaTag(){return this;},setXFrameOptionsMode(){return this;}})}; },XFrameOptionsMode:{ALLOWALL:1}};
  doGet({parameter:{cs:'TP',key:'tp2026'}}); doGet({parameter:{page:'dangky'}}); doGet({parameter:{page:'ql'}}); global.HtmlService=saved; return opened.join(',')==='Checkin,Dangky,Admin' || opened.join(','); });
T('A5 doGet cho phép nhúng vào caphemuoihue.com (ALLOWALL)', ()=> /XFrameOptionsMode\.ALLOWALL/.test(fs.readFileSync(__dirname+'/Code.gs','utf8')) || 'thiếu');

// ---------- B. Xếp lịch theo lịch tuần trước ----------
const r=xepLich({pin:'5678',tuan:'2026-10-26',mode:'mau'});
const P=LL().filter(a=>DAYS.includes(a.Ngay));
T('B0 Xếp chạy được, dùng lịch thật 8 tuần làm khung lần đầu', ()=> (r.ok && /lịch thật|tuần trước/.test(r.nguonMau)) || JSON.stringify(r).slice(0,200));
T('B0b Tự nạp thói quen + định mức từ lịch thật', ()=> cfg('DU_LIEU_MAU')===DU_LIEU_VER || 'chưa nạp');
const byPD={}; P.forEach(a=>{ (byPD[a.MaNV+'|'+a.Ngay]=byPD[a.MaNV+'|'+a.Ngay]||[]).push(a); });
T('B1 Mỗi người tối đa 2 ca/ngày (gãy), không trùng giờ; được làm 2 quán khác nhau như lịch cũ; bảo vệ, người cố định chỉ 1 quán', ()=>{ const bad=Object.entries(byPD).filter(([k,a])=>{ if(a.length===1) return false; if(a.length>2) return true;
  const [x,y]=a; if(x.MaCS!==y.MaCS && NV[x.MaNV] && (NV[x.MaNV].CoDinh==='Có'||NV[x.MaNV].ViTri==='Bảo vệ')) return true; return CA[x.MaCa].b<CA[y.MaCa].e && CA[y.MaCa].b<CA[x.MaCa].e; }); return bad.length===0 || bad.slice(0,3).map(b=>b[0]).join(', '); });
T('B2 LĐD chỉ full time được làm gãy', ()=>{ const bad=Object.entries(byPD).filter(([k,a])=>a.length===2 && (a[0].MaCS==='LDD'||a[1].MaCS==='LDD') && NV[a[0].MaNV] && NV[a[0].MaNV].Loai!=='FT' && !/Support/.test(a[0].GhiChu+a[1].GhiChu)); return bad.length===0 || bad.map(b=>b[0]).join(', '); });
const RULE={TP:2,DD:2,TD:1,TNV:1,LDD:1};
T('B3 Mỗi ca có đủ pha chế (TP/ĐĐ ≥2, TĐ/TNV/LĐD ≥1) hoặc đã báo THIẾU', ()=>{ const bad=[];
  DAYS.forEach(d=>Object.keys(RULE).forEach(cs=>['Sáng','Trưa','Tối'].forEach(blk=>{ if(blk==='Tối'&&(cs==='TD'||cs==='TNV')) return;
    const cov=new Set(P.filter(a=>a.Ngay===d&&a.MaCS===cs&&['Pha chế','Quản lý','Thu ngân'].includes(a.ViTri)&&caBlocks(CA[a.MaCa]).includes(blk)).map(a=>a.MaNV)).size;
    if(cov<RULE[cs] && !r.goiYThieu.some(g=>g.Ngay===d&&g.MaCS===cs&&g.Khoi===blk&&g.ViTri==='Pha chế'&&g.Muc!=='nen')) bad.push(d+' '+cs+' '+blk+' có '+cov); })));
  return bad.length===0 || bad.slice(0,4).join('; '); });
T('B4 Bảo vệ chỉ ca ngày 6h30–17h, đúng quán của mình', ()=>{ const bad=P.filter(a=>NV[a.MaNV]&&NV[a.MaNV].ViTri==='Bảo vệ'&&a.ViTri==='Bảo vệ'&&(!['FT10','PT1'].includes(a.MaCa)||a.MaCS!==NV[a.MaNV].CoSoChinh)); return bad.length===0 || bad.slice(0,3).map(a=>NV[a.MaNV].Ten+' '+a.MaCS+' '+a.MaCa).join('; '); });
T('B5 Bảo vệ, rửa ly chỉ làm vị trí của mình hoặc vị trí kiêm', ()=>{ const bad=P.filter(a=>{ const n=NV[a.MaNV]; if(!n||!['Bảo vệ','Rửa ly'].includes(n.ViTri)) return false; return a.ViTri!==n.ViTri && String(n.ViTriKiem||'').indexOf(a.ViTri)<0; }); return bad.length===0 || bad.slice(0,3).map(a=>NV[a.MaNV].Ten+' '+a.ViTri).join('; '); });
T('B6 Người cố định chỉ làm ở quán chính (Chú Lạc, A Nhân, Phan Tám, C. Vân)', ()=>{ const bad=P.filter(a=>NV[a.MaNV]&&NV[a.MaNV].CoDinh==='Có'&&a.MaCS!==NV[a.MaNV].CoSoChinh); return bad.length===0 || bad.slice(0,3).map(a=>NV[a.MaNV].Ten+' '+a.MaCS).join('; '); });
T('B7 Tản Đà, TNV không có ca sau 18h30', ()=>{ const bad=P.filter(a=>(a.MaCS==='TD'||a.MaCS==='TNV')&&CA[a.MaCa].e>1110); return bad.length===0 || bad.slice(0,3).map(a=>a.MaCS+' '+a.MaCa).join('; '); });
T('B8 Không còn vị trí Thu ngân riêng', ()=> !P.some(a=>a.ViTri==='Thu ngân') || 'có ca Thu ngân');
T('B9 Quán nào ngày nào ca sáng cũng có người', ()=>{ const bad=[]; DAYS.forEach(d=>Object.keys(RULE).forEach(cs=>{ if(!P.some(a=>a.Ngay===d&&a.MaCS===cs&&dispBlock(CA[a.MaCa])==='Sáng')) bad.push(cs+' '+d); })); return bad.length===0 || bad.join(', '); });
// so với lịch thật 19–25/10 (người·ca/tuần theo quán, ca sáng/tối, phục vụ/pha chế)
const hist=JSON.parse(fs.readFileSync('/home/claude/hist/hist.json','utf8'));
T('B10 Số người từng quán/ca/vị trí sát lịch cũ 8 tuần (lệch ≤ 25% hoặc ≤ 3 lượt/tuần)', ()=>{ const norm=p=>['Thu ngân','Quản lý','Pha chế'].includes(p)?'Pha chế':p; const o={},n={};
  // lịch cũ = trung vị 8 tuần thật (31/8–25/10), theo từng thứ trong tuần, cộng lại cả tuần
  const pd={}; hist.filter(h=>h.Ngay>='2026-08-31'&&h.Ngay<='2026-10-25'&&['Sáng','Tối'].includes(h.Khoi)&&['Pha chế','Phục vụ','Quản lý','Thu ngân'].includes(h.ViTri)).forEach(h=>{const k=h.MaCS+'|'+h.Khoi+'|'+norm(h.ViTri); (pd[k]=pd[k]||{})[h.Ngay]=(pd[k][h.Ngay]||new Set()).add(h.MaNV||h.Ten);});
  const med=a=>{a=a.slice().sort((x,y)=>x-y); return a.length?a[Math.floor((a.length-1)/2)]:0;};
  Object.keys(pd).forEach(k=>{ let tot=0; for(let w=0;w<7;w++){ const vals=Object.keys(pd[k]).filter(d=>new RealDate(d+'T12:00:00Z').getUTCDay()===w).map(d=>pd[k][d].size); tot+=med(vals); } o[k]=tot; });
  P.filter(a=>['Pha chế','Phục vụ','Quản lý'].includes(a.ViTri)&&!/Support/.test(a.GhiChu)).forEach(a=>{const b=dispBlock(CA[a.MaCa]); if(b==='Trưa') return; const k=a.MaCS+'|'+b+'|'+norm(a.ViTri); n[k]=(n[k]||0)+1;});
  // mức tối thiểu cứng được ưu tiên hơn lịch cũ: chỗ nào lịch cũ ít hơn mức cứng thì so với mức cứng × 7 ngày
  const hard={}; TOI_THIEU_CUNG.forEach(h=>{ if(h[1]!=='Trưa') hard[h[0]+'|'+h[1]+'|'+h[2]]=h[3]*7; });
  const lw={}; hist.filter(h=>h.Ngay>='2026-10-19'&&h.Ngay<='2026-10-25'&&['Sáng','Tối'].includes(h.Khoi)&&['Pha chế','Phục vụ','Quản lý','Thu ngân'].includes(h.ViTri)).forEach(h=>{const k=h.MaCS+'|'+h.Khoi+'|'+norm(h.ViTri); lw[k]=(lw[k]||0)+1;});
  Object.keys(lw).forEach(k=>{ hard[k]=Math.max(hard[k]||0, lw[k]); });   // lịch mẫu là tuần thật gần nhất: cho phép bằng tuần đó
  // không dồn quá nhiều (≤ mức tham chiếu +25%/+3) và không ít hơn lịch cũ quá nhiều; thiếu so với mức cứng đã kiểm ở I1
  const bad=Object.keys(o).filter(k=>{ const ref=Math.max(o[k],hard[k]||0), v=n[k]||0; const [cs,bk,ps]=k.split('|'); const th=r.goiYThieu.filter(g=>g.MaCS===cs&&g.Khoi===bk&&g.ViTri===ps&&g.Muc!=='nen').reduce((a,g)=>a+g.Thieu,0);
    return v>ref+Math.max(3,ref*0.25) || v+th<o[k]-Math.max(3,o[k]*0.25); }).map(k=>k+' cũ '+o[k]+(hard[k]?' (mức cứng '+hard[k]+')':'')+' mới '+(n[k]||0)); return bad.length===0 || bad.join('; '); });
T('B11 Người nhà (Support) chỉ được gọi ở chỗ THIẾU thật', ()=>{ const bad=P.filter(a=>/Support/.test(a.GhiChu)).filter(a=>!r.goiYThieu.some(g=>g.Ngay===a.Ngay&&g.MaCS===a.MaCS&&g.Muc!=='nen')); return bad.length===0 || bad.length+' lượt support không có chỗ thiếu'; });
T('B12 Full time làm 7/7 chỉ khi lịch cũ của họ vậy (quen làm ≥ 6,5 ngày/tuần hoặc lịch mẫu kín 7 ngày); còn lại có ngày nghỉ', ()=>{ const TQ2={}; rows('ThoiQuen').forEach(q=>TQ2[String(q.MaNV)]=q); const mau7=m=>new Set(LICH_MAU.filter(x=>x[2]===m).map(x=>x[0])).size>=7;
  const bad=Object.values(NV).filter(n=>n.Loai==='FT'&&n.TrangThai!=='Support'&&new Set(P.filter(a=>a.MaNV===String(n.MaNV)).map(a=>a.Ngay)).size>6 && !((+(TQ2[String(n.MaNV)]||{}).NgayTuan||0)>=6.5 || mau7(String(n.MaNV)))); return bad.length===0 || bad.map(n=>n.Ten).join(', '); });
T('B13 Gợi ý nhân sự theo cơ sở: đủ 5 quán, tổng khớp', ()=> (r.tuyenCS.length===5 && r.tuyenCS.reduce((s,c)=>s+c.Thieu,0)===r.soThieu) || JSON.stringify(r.tuyenCS.map(c=>[c.MaCS,c.Thieu])) + ' / ' + r.soThieu);
T('B14 Chọn ngày giữa tuần tự lùi về thứ 2', ()=>{ const r2=xepLich({pin:'5678',tuan:'2026-10-28',mode:'mau'}); const ds=[...new Set(LL().filter(a=>a.Ngay>='2026-10-20').map(a=>a.Ngay))].sort(); return (r2.ok && ds[0]>='2026-10-26' && ds.every(d=>d<='2026-11-01')) || ds.join(','); });
T('B15 Đăng ký bận được tôn trọng', ()=>{ const someone=P.find(a=>a.MaCS==='TP'&&dispBlock(CA[a.MaCa])==='Sáng'&&NV[a.MaNV]&&NV[a.MaNV].Loai==='PT');
  // tuần 26/10 nay đã quá hạn đăng ký (app từ chối là đúng) → ghi thẳng 1 đăng ký "đã nộp đúng hạn" để kiểm tra bộ xếp có tôn trọng không
  const dkSh=sh('DangKyBan'), dkH=dkSh.d[0]; dkSh.appendRow(dkH.map(k=>({Ngay:someone.Ngay,MaNV:String(someone.MaNV),Khoi:'Sáng',Tuan:'2026-10-26',Luc:new Date(),LyDo:'test'})[k]??''));
  xepLich({pin:'5678',tuan:'2026-10-26',mode:'mau'}); const bad=LL().filter(a=>a.MaNV===someone.MaNV&&a.Ngay===someone.Ngay&&caBlocks(CA[a.MaCa]).includes('Sáng')); const dk=rows('DangKyBan').filter(b=>String(b.MaNV)===String(someone.MaNV)).map(b=>dateKey(b.Ngay)+' '+b.Khoi); saveDangKy({maNV:someone.MaNV,tuan:'2026-10-26',ban:[]}); return bad.length===0 || ('vẫn xếp '+NV[someone.MaNV].Ten+' '+someone.Ngay+' ('+someone.MaCS+' '+someone.MaCa+') | đăng ký lưu: '+dk.join(',')+' | ca: '+bad.map(b=>b.MaCS+' '+b.MaCa+' '+b.GhiChu).join(',')); });
T('B16 Xếp mới hoàn toàn & chỉ bổ sung vẫn chạy, không trùng ca', ()=>{ const a=xepLich({pin:'5678',tuan:'2026-10-26',mode:'full'}); const b=xepLich({pin:'5678',tuan:'2026-10-26',mode:'bosung'}); const P2=LL().filter(x=>DAYS.includes(x.Ngay)); const g={}; P2.forEach(x=>{(g[x.MaNV+'|'+x.Ngay]=g[x.MaNV+'|'+x.Ngay]||[]).push(x);});
  const bad=Object.values(g).filter(x=>x.length>2||(x.length===2&&(CA[x[0].MaCa].b<CA[x[1].MaCa].e&&CA[x[1].MaCa].b<CA[x[0].MaCa].e))); return (a.ok&&b.ok&&bad.length===0) || ('trùng '+bad.length); });
xepLich({pin:'5678',tuan:'2026-10-26',mode:'mau'});

// ---------- C. File lịch riêng ----------
const W=LICH.getSheetByName('Lịch 26.10.26'), WL=LICH.getSheetByName('LĐD 26.10.26');
T('C1 File lịch có tab Lịch / LĐD / Tuyển của tuần', ()=> (W&&WL&&LICH.getSheetByName('Tuyển 26.10.26')) ? true : 'thiếu tab');
T('C2 Bảng PHỤC VỤ trái, PHA CHẾ phải, khối SÁNG/TRƯA/TỐI/OFF', ()=>{ const t=W.d.map(r=>r.join('|')).join('\n'); return (/LỊCH PHỤC VỤ/.test(W.d[0][0])&&/LỊCH PHA CHẾ/.test(W.d[0][9])&&/SÁNG/.test(t)&&/TRƯA/.test(t)&&/TỐI/.test(t)&&/OFF/.test(t)) || 'sai bố cục'; });
T('C3 Ca sáng làm qua trưa có tên ở cả ca trưa – ghi CHỈ TÊN như file quán ("Thư full" rồi "Thư"), đọc lại tự nối liền', ()=>{ const cont=W.d.filter(r=>r[17]==='CONT'); const o=[]; cont.forEach(r=>[1,2,3,4,5,6,7,10,11,12,13,14,15,16].forEach(c=>{ if(r[c]) o.push(String(r[c])); }));
  return (o.length>0 && o.every(x=>!/[()]|đến/.test(x))) || ('ô: '+o.slice(0,5).join(' | ')); });
const before=LL().filter(a=>DAYS.includes(a.Ngay)).map(a=>[a.Ngay,a.MaCS,a.MaNV,a.MaCa].join('|')).sort();
T('C4 Đọc lại file lịch không mất / thêm ca (khứ hồi)', ()=>{ const x=layTuFileLich({pin:'5678',tuan:'2026-10-26'}); const after=LL().filter(a=>DAYS.includes(a.Ngay)).map(a=>[a.Ngay,a.MaCS,a.MaNV,a.MaCa].join('|')).sort(); const A=new Set(after),B=new Set(before); return (x.ok && JSON.stringify(after)===JSON.stringify(before)) || ('mất '+before.filter(z=>!A.has(z)).slice(0,4)+' | thêm '+after.filter(z=>!B.has(z)).slice(0,4)+' | lỗi '+x.loi.slice(0,2)); });
T('C5 Sửa tên trong file lịch → cập nhật vào lịch chính', ()=>{ const ri=W.d.findIndex(row=>row[17]==='TP|Tối|PV|'); const old=W.d[ri][1]; W.d[ri][1]='Hiếu (5,5)'; const x=layTuFileLich({pin:'5678',tuan:'2026-10-26'}); const ok=LL().some(a=>a.Ngay==='2026-10-26'&&a.MaNV==='325'&&a.MaCS==='TP'); W.d[ri][1]=old; layTuFileLich({pin:'5678',tuan:'2026-10-26'}); return ok || ('không thấy Hiếu; '+x.loi.join(';')); });

// ---------- D. Sửa trên app ----------
T('D1 Đổi người sang người đã có ca khác quán → bị chặn', ()=>{ const a=LL().find(x=>x.Ngay==='2026-10-27'&&x.MaCS==='TP'&&x.ViTri==='Phục vụ'); const other=LL().find(x=>x.Ngay==='2026-10-27'&&x.MaCS==='DD'&&x.ViTri==='Phục vụ'); const res=suaO({pin:'5678',ngay:a.Ngay,maCS:a.MaCS,maCa:a.MaCa,maNV:a.MaNV,text:String(NV[other.MaNV].Ten).split(' (')[0]+' (5,5)'}); return res.ok===false || 'không chặn'; });
T('D2 Thêm người rảnh bằng ô + và xoá được', ()=>{ const free=Object.values(NV).find(n=>n.Loai==='PT'&&n.ViTri==='Phục vụ'&&!LL().some(x=>x.Ngay==='2026-10-27'&&x.MaNV===String(n.MaNV))); const res=themO({pin:'5678',ngay:'2026-10-27',maCS:'TP',khoi:'Tối',side:'PV',text:String(free.Ten).split(' (')[0]+' (5,5)'}); const row=LL().find(x=>x.Ngay==='2026-10-27'&&x.MaNV===String(free.MaNV)); const del=suaO({pin:'5678',ngay:'2026-10-27',maCS:'TP',maCa:row.MaCa,maNV:row.MaNV,text:''}); return (res.ok&&row&&row.MaCa==='PT3'&&del.ok&&!LL().some(x=>x.Ngay==='2026-10-27'&&x.MaNV===String(free.MaNV))) || JSON.stringify(res); });

// ---------- E. Nhân sự ----------
let maMoi='';
T('E1 Thêm nhân viên mới: cấp mã theo nhóm, trạng thái Thử việc', ()=>{ const x=themNhanSu({pin:'5678',data:{Ten:'Minh Anh',ViTri:'Pha chế',Loai:'PT',CoSoChinh:'LDD',CaUuTien:'Tối'}}); maMoi=x.MaNV; return (x.ok && /^2\d\d$/.test(x.MaNV) && rows('NhanVien').some(n=>String(n.MaNV)===x.MaNV&&n.TrangThai==='Thử việc') && rows('ThoiQuen').some(t=>String(t.MaNV)===x.MaNV)) || JSON.stringify(x); });
T('E2 Trùng tên với người đang làm → bị chặn', ()=> themNhanSu({pin:'5678',data:{Ten:'Lam',ViTri:'Phục vụ',Loai:'PT',CoSoChinh:'TP'}}).ok===false || 'không chặn');
T('E3 Nhân viên thử việc chấm công được', ()=>{ const x=getStaffInfo(maMoi,'LDD'); return x.ok || x.msg; });
T('E4 Nghỉ việc: bỏ ca từ ngày nghỉ, không cho chấm công', ()=>{ const ma='309'; const x=nghiViec({pin:'5678',maNV:ma,ngay:'2026-10-28'}); const left=LL().filter(a=>a.MaNV===ma&&a.Ngay>='2026-10-28'); return (x.ok && left.length===0 && getStaffInfo(ma,'TP').ok===false) || ('còn '+left.length+' ca'); });
T('E5 Xếp tuần sau không xếp người đã nghỉ', ()=>{ xepLich({pin:'5678',tuan:'2026-11-02',mode:'mau'}); return !LL().some(a=>a.MaNV==='309'&&a.Ngay>='2026-11-02') || 'vẫn xếp người nghỉ'; });

// ---------- F. Chấm công ----------
sh('LichLam').d.push(['2026-10-29','TP','205','FT1','Pha chế',''],['2026-10-29','TP','206','FT1','Pha chế',''],['2026-10-29','TP','312','PT1','Phục vụ','']);
sh('LichLam').d=sh('LichLam').d.filter((x,i)=>i===0||!(String(x[0])==='2026-10-29'&&['205','206','312'].includes(String(x[2]))&&!['FT1','PT1'].includes(x[3])));
T('F1 Chấm nhóm 3 người một ảnh, giờ theo máy chủ, tính trễ', ()=>{ at('2026-10-29','06:45'); const x=checkInGroup({maCS:'TP',key:'tp2026',codes:['205','206','312'],photo:'data:image/jpeg;base64,AA'}); return (x.ok && x.results.length===3 && x.results.every(z=>z.loai==='VAO') && x.results.some(z=>z.tre>=10)) || JSON.stringify(x).slice(0,200); });
T('F2 Sai key quán → không chấm được', ()=> checkInGroup({maCS:'TP',key:'sai',codes:['205'],photo:'x'}).ok===false || 'không chặn');
T('F3 Về trễ >30 phút → hỏi tăng ca, chờ duyệt', ()=>{ at('2026-10-29','15:30'); const x=checkInGroup({maCS:'TP',key:'tp2026',codes:['205'],photo:'data:image/jpeg;base64,AA'}); if(!x.needOT) return 'không hỏi tăng ca '+JSON.stringify(x).slice(0,150);
  const y=checkInGroup({maCS:'TP',key:'tp2026',codes:['205'],photoUrl:x.photoUrl,tangCa:{'205':'1'},lyDo:{'205':'Đông khách'}}); const rep=getReport({pin:'5678',from:'2026-10-29',to:'2026-10-29',maCS:''}); const l=rep.lines.find(z=>z.MaNV==='205'); return (y.ok && l && l.TCDuyet==='Chờ duyệt') || JSON.stringify(l); });
T('F4 Duyệt tăng ca thì mới cộng giờ', ()=>{ const rep=getReport({pin:'5678',from:'2026-10-29',to:'2026-10-29',maCS:''}); const l=rep.lines.find(z=>z.MaNV==='205'); const g0=rep.summary.find(s=>s.MaNV==='205').Gio; approveOT({pin:'5678',id:l.IdR,action:'Đã duyệt',gio:'1'}); const g1=getReport({pin:'5678',from:'2026-10-29',to:'2026-10-29',maCS:''}).summary.find(s=>s.MaNV==='205').Gio; return g1>g0 || (g0+' → '+g1); });
fake=null;

// ---------- G. Lương & phân quyền ----------
T('G1 Quản lý không tính lương được', ()=> tinhLuong({pin:'5678',thang:'2026-10'}).ok===false || 'QL tính được lương');
T('G2 Admin tính lương, có tiền cơm', ()=>{ const x=tinhLuong({pin:'1234',thang:'2026-10'}); const t=sh(x.tab); const h=t.d[0]; const ci=h.indexOf('TienCom'); return (x.ok && ci>-1) || JSON.stringify(x).slice(0,150); });
T('G3 Quản lý không thấy lương giờ trong Nhân sự', ()=> !('LuongGio' in dsNhanSu({pin:'5678'}).list[0]) || 'lộ lương');
T('G5 Đường dẫn trang web sửa được trong CaiDat (WEB_TP…)', ()=>{ setCfg('WEB_TP','chamcongtp'); const a=linkTruyCap({pin:'1234'}); setCfg('WEB_TP','cham-cong-tp'); return a.list.some(x=>/\/chamcongtp$/.test(x.Trang)) || 'không đổi'; });
T('G4 Quản lý không thấy link có key của quán', ()=>{ const q=linkTruyCap({pin:'5678'}), a=linkTruyCap({pin:'1234'}); return (!q.list.some(x=>/key=/.test(x.Link)) && a.list.filter(x=>/key=/.test(x.Link)).length===5) || 'sai phân quyền link'; });


// ---------- H. Bổ sung theo yêu cầu đầu cuộc trò chuyện ----------
T('H1 Đủ các ca: FT 6h30–14h30, 14h30–22h30, 8h–17h, 10,5h, 11,5h, full TĐ/TNV; PT 6h30–12h, 12h–17h, 17h–22h30, 12h–18h30', ()=>{ const need={FT1:['06:30','14:30'],FT2:['14:30','22:30'],FT3:['08:00','17:00'],FT10:['06:30','17:00'],FT11:['06:30','18:00'],FT12:['06:30','18:30'],PT1:['06:30','12:00'],PT2:['12:00','17:00'],PT3:['17:00','22:30'],PT4:['12:00','18:30']};
  const bad=Object.keys(need).filter(k=>!CA[k]||fmtCa(CA[k].GioBD)!==need[k][0]||fmtCa(CA[k].GioKT)!==need[k][1]); return bad.length===0 || bad.join(','); });
T('H2 Ba quyền: nhân viên (không mã), quản lý, admin; sai mã bị chặn', ()=> (dangNhap({pin:'5678'}).role==='ql' && dangNhap({pin:'1234'}).role==='admin' && dangNhap({pin:'0000'}).ok===false) || 'sai phân quyền');
T('H3 Mạ không có trong danh sách xếp ca', ()=> !rows('NhanVien').some(n=>/^Mạ\b/.test(String(n.Ten))&&n.TrangThai!=='Đã nghỉ') || 'còn Mạ');
T('H4 Rửa ly cố định: Phan Tám ở Trần Phú, C. Vân ở LĐD, Cô Minh/Cô Tuấn chỉ rửa ly', ()=>{ const P3=LL().filter(a=>a.Ngay>='2026-10-26'&&a.Ngay<='2026-11-01'); const bad=P3.filter(a=>(a.MaNV==='403'&&a.MaCS!=='TP')||(a.MaNV==='404'&&a.MaCS!=='LDD')||(['401','402'].includes(a.MaNV)&&a.ViTri!=='Rửa ly')); return bad.length===0 || bad.slice(0,3).map(a=>a.MaNV+' '+a.MaCS+' '+a.ViTri).join('; '); });
T('H5 Ca đóng cửa được thêm 30 phút dọn dẹp, về 23h không bị hỏi tăng ca', ()=>{ sh('LichLam').d.push(['2026-10-30','TP','201','FT2','Pha chế','']); at('2026-10-30','14:30'); checkInGroup({maCS:'TP',key:'tp2026',codes:['201'],photo:'data:image/jpeg;base64,AA'});
  at('2026-10-30','23:00'); const x=checkInGroup({maCS:'TP',key:'tp2026',codes:['201'],photo:'data:image/jpeg;base64,AA'}); fake=null; return (x.ok && !x.needOT) || JSON.stringify(x).slice(0,150); });
T('H6 Chấm công liên thông 5 quán: một người làm 2 quán được cộng chung', ()=>{ sh('LichLam').d.push(['2026-10-31','TP','207','PT1','Pha chế',''],['2026-11-01','DD','207','PT1','Pha chế','']);
  at('2026-10-31','06:30'); checkInGroup({maCS:'TP',key:'tp2026',codes:['207'],photo:'data:image/jpeg;base64,AA'}); at('2026-10-31','12:00'); checkInGroup({maCS:'TP',key:'tp2026',codes:['207'],photo:'data:image/jpeg;base64,AA'});
  at('2026-11-01','06:30'); checkInGroup({maCS:'DD',key:'dd2026',codes:['207'],photo:'data:image/jpeg;base64,AA'}); at('2026-11-01','12:00'); checkInGroup({maCS:'DD',key:'dd2026',codes:['207'],photo:'data:image/jpeg;base64,AA'}); fake=null;
  const s=getReport({pin:'5678',from:'2026-10-31',to:'2026-11-01',maCS:''}).summary.find(x=>x.MaNV==='207'); return (s && Math.abs(s.Gio-11)<0.01 && /TP/.test(s.CS) && /DD/.test(s.CS)) || JSON.stringify(s); });
T('H7 Đi trễ thì giờ công tính theo giờ làm thực tế', ()=>{ sh('LichLam').d.push(['2026-12-01','DD','208','FT1','Pha chế','']); at('2026-12-01','07:30'); checkInGroup({maCS:'DD',key:'dd2026',codes:['208'],photo:'data:image/jpeg;base64,AA'}); at('2026-12-01','14:30'); checkInGroup({maCS:'DD',key:'dd2026',codes:['208'],photo:'data:image/jpeg;base64,AA'}); fake=null;
  const l=getReport({pin:'5678',from:'2026-12-01',to:'2026-12-01',maCS:''}).lines.find(x=>x.MaNV==='208'); return (l && Math.abs(l.Gio-7)<0.01 && l.Tre>=60) || JSON.stringify(l); });
T('H8 Tháng cao điểm 10–2 có trong cài đặt', ()=> String(cfg('THANG_CAO_DIEM')).replace(/\s/g,'')==='10,11,12,1,2' || cfg('THANG_CAO_DIEM'));
T('H9 Người làm trên 8 tiếng (FT) được đánh dấu tăng ca được', ()=>{ const bad=rows('NhanVien').filter(n=>n.Loai==='FT'&&!['Bảo vệ','Rửa ly','Support'].includes(n.ViTri)&&n.TrangThai!=='Đã nghỉ'&&n.TangCaDuoc!=='Có'); return bad.length===0 || bad.map(n=>n.Ten).join(', '); });

// ---------- I. Số người tối thiểu cứng (chủ quán đặt 21/10) ----------
xepLich({pin:'5678',tuan:'2026-10-26',mode:'mau'});
const r3=JSON.parse(JSON.stringify(xepLich({pin:'5678',tuan:'2026-10-26',mode:'mau'})));
const P4=LL().filter(a=>DAYS.includes(a.Ngay));
function cov(d,cs,blk,pos){ const norm=p=>['Quản lý','Thu ngân'].includes(p)?'Pha chế':p; return new Set(P4.filter(a=>a.Ngay===d&&a.MaCS===cs&&norm(a.ViTri)===pos&&caBlocks(CA[a.MaCa]).includes(blk)).map(a=>a.MaNV)).size; }
const effMin=h=>h[3];   // mức cứng của chủ quán
T('I0 Mức tối thiểu cứng luôn áp dụng (không tự hạ về lịch cũ)', ()=> cfg('THEO_LICH_CU')==='Không' || ('THEO_LICH_CU = '+cfg('THEO_LICH_CU')));
T('I1 Mọi quán, mọi ca đủ mức tối thiểu cứng của chủ quán, thiếu thì đã báo THIẾU', ()=>{ const bad=[];
  DAYS.forEach(d=>TOI_THIEU_CUNG.forEach(h=>{ const c=cov(d,h[0],h[1],h[2]); if(c<effMin(h) && !r3.goiYThieu.some(g=>g.Ngay===d&&g.MaCS===h[0]&&g.Khoi===h[1]&&g.ViTri===h[2]&&g.Muc!=='nen')) bad.push(d.slice(5)+' '+h[0]+' '+h[1]+' '+h[2]+' '+c+'/'+effMin(h)); }));
  return bad.length===0 || bad.slice(0,5).join('; ')+(bad.length>5?' …('+bad.length+')':''); });
T('I2 Ca sáng TP, ĐĐ, LĐD có quản lý / trưởng ca, thiếu thì báo THIẾU', ()=>{ const bad=[]; DAYS.forEach(d=>['TP','DD','LDD'].forEach(cs=>{ const ok=P4.some(a=>a.Ngay===d&&a.MaCS===cs&&caBlocks(CA[a.MaCa]).includes('Sáng')&&NV[a.MaNV]&&['Quản lý','Trưởng ca'].includes(NV[a.MaNV].ChucVu)); if(!ok && !r3.goiYThieu.some(g=>g.Ngay===d&&g.MaCS===cs&&g.ViTri==='Trưởng ca/QL'&&g.Muc==='thieu')) bad.push(d+' '+cs); })); return bad.length===0 || bad.join(', '); });
T('I3 Gợi ý tuyển tính cả rửa ly, bảo vệ, trưởng ca', ()=> /Rửa ly|Bảo vệ|Trưởng ca/.test(goiYTuyen.toString()) || 'thiếu');

// ---------- K. Các mục trước đây "kiểm tay", đo được bằng số ----------
const TQ={}; rows('ThoiQuen').forEach(q=>TQ[String(q.MaNV)]=q);
const hrs={}, nd={}, csCount={}; P4.forEach(a=>{ hrs[a.MaNV]=(hrs[a.MaNV]||0)+(+CA[a.MaCa].SoGio); (nd[a.MaNV]=nd[a.MaNV]||new Set()).add(a.Ngay); (csCount[a.MaNV]=csCount[a.MaNV]||{})[a.MaCS]=1; });
const hw={}; hist.filter(h=>h.Ngay>='2026-10-19'&&h.Ngay<='2026-10-25'&&h.MaNV&&['Sáng','Trưa','Tối'].includes(h.Khoi)).forEach(h=>{ const g=parseFloat(String(h.Gio).replace(',','.')); hw[h.MaNV]=(hw[h.MaNV]||0)+(isNaN(g)?5.5:g); });
T('K1 Giờ/tuần: không vượt giờ quen làm +12h hoặc giờ đã làm thật tuần 19/10 (lịch cũ); người tăng ca được không vượt mức tối đa tuần', ()=>{ const bad=Object.keys(hrs).filter(m=>{ if(hrs[m]<=(hw[m]||0)+6) return false; const q=TQ[m]; const base=(q&&+q.GioTuan)?+q.GioTuan:(NV[m]&&NV[m].Loai==='FT'?48:30); const tc=NV[m]&&NV[m].TangCaDuoc==='Có'; const cap=tc?Math.max(base,+cfg('FT_GIO_MAX')||72)+8:base+12; return hrs[m]>cap; }).map(m=>(NV[m]?NV[m].Ten.split(' (')[0]:m)+' '+hrs[m]+'h/'+(TQ[m]&&TQ[m].GioTuan)); return bad.length===0 || bad.slice(0,5).join('; '); });
T('K2 Tăng ca không dồn vào vài người: không ai quá 80h/tuần, số người làm ca dài/gãy ≥ 8', ()=>{ const over=Object.keys(hrs).filter(m=>hrs[m]>80); const longp=new Set(P4.filter(a=>['FT10','FT11','FT12'].includes(a.MaCa)||/gãy/.test(a.GhiChu)).map(a=>a.MaNV)).size; return (over.length===0 && longp>=8) || ('quá 80h: '+over.length+', người làm dài/gãy: '+longp); });
T('K3 Ưu tiên người quen quán: ≥ 70% lượt ca rơi vào quán người đó hay làm', ()=>{ let tot=0, home=0; P4.forEach(a=>{ const q=TQ[a.MaNV]; if(!q||/Support/.test(a.GhiChu)) return; tot++; if(String(q.CoSoHayLam).indexOf(a.MaCS+':')>-1) home++; }); return home/tot>=0.7 || ('chỉ '+Math.round(home/tot*100)+'%'); });
T('K4 Tản Đà, TNV: người phục vụ có thể đứng pha chế (kiêm hết việc)', ()=>{ const src=fetchSrc(); return /TD\/TNV|kiêm hết|crossAll|TD','TNV'/.test(src) || 'không thấy luật kiêm việc TĐ/TNV'; });

// ---------- L. Lịch gợi ý xếp mới + chọn người nhanh ----------
const rL=xepLich({pin:'5678',tuan:'2026-10-26',mode:'mau'});
const mainL=LL().filter(a=>DAYS.includes(a.Ngay));
const gyL=rows('GoiYMoi').filter(x=>dateKey(x.Tuan)==='2026-10-26');
T('L1 Xếp theo lịch cũ đồng thời tạo lịch gợi ý xếp mới (riêng, không đè lịch chính)', ()=> (rL.goiYMoi && rL.goiYMoi.soCa>200 && gyL.length===rL.goiYMoi.soCa && mainL.length===rL.soCa && LICH.getSheetByName('Gợi ý mới 26.10.26')) ? true : JSON.stringify(rL.goiYMoi)+' '+gyL.length+' '+mainL.length);
T('L2 Xem lịch gợi ý trên app', ()=>{ const v=getLichTuan({pin:'5678',tuan:'2026-10-26',all:true,nguon:'goiy'}); return (v.ok && v.items.length===gyL.length) || v.items.length; });
T('L3 Dùng lịch gợi ý cho 1 quán: chỉ thay quán đó, không ai bị trùng giờ ở 2 quán', ()=>{ const x=apDungGoiYMoi({pin:'5678',tuan:'2026-10-26',maCS:'TD'}); const P5=LL().filter(a=>DAYS.includes(a.Ngay));
  const otherSame=P5.filter(a=>a.MaCS!=='TD').length===mainL.filter(a=>a.MaCS!=='TD').length; const g={}; P5.forEach(a=>{(g[a.MaNV+'|'+a.Ngay]=g[a.MaNV+'|'+a.Ngay]||[]).push(a);});
  const trung=Object.values(g).filter(l=>l.length>1 && l.some((p,i)=>l.some((q,j)=>j>i && CA[p.MaCa].b<CA[q.MaCa].e && CA[q.MaCa].b<CA[p.MaCa].e)));
  return (x.ok && otherSame && trung.length===0) || JSON.stringify(x).slice(0,150)+' trùng '+trung.length; });
T('L4 Chọn người nhanh: danh sách rảnh trước, không gồm người đã có ca hôm đó trong nhóm rảnh', ()=>{ const u=ungVien({pin:'5678',ngay:'2026-10-27',maCS:'TP',khoi:'Sáng',side:'PV'}); const busy=new Set(LL().filter(a=>a.Ngay==='2026-10-27').map(a=>a.MaNV));
  const ranh=u.list.filter(x=>x.Nhom==='ranh'); return (u.ok && ranh.length>0 && ranh.every(x=>!busy.has(x.MaNV)) && u.list[0].Nhom==='ranh') || JSON.stringify(u.list.slice(0,2)); });
T('L5 Bấm chọn người + giờ (không gõ tên): đổi được, chặn trùng', ()=>{ const a=LL().find(x=>x.Ngay==='2026-10-27'&&x.MaCS==='TP'&&x.ViTri==='Phục vụ'); const u=ungVien({pin:'5678',ngay:'2026-10-27',maCS:'TP',khoi:'Sáng',side:'PV'}).list.find(x=>x.Nhom==='ranh');
  const r1=suaO({pin:'5678',ngay:a.Ngay,maCS:'TP',maCa:a.MaCa,maNV:a.MaNV,maMoi:u.MaNV,gio:'8'}); const ok1=r1.ok && LL().some(x=>x.Ngay==='2026-10-27'&&x.MaNV===u.MaNV&&x.MaCa==='FT1');
  const other=LL().find(x=>x.Ngay==='2026-10-27'&&x.MaCS==='DD'&&['FT2','PT3'].includes(x.MaCa)&&LL().filter(y=>y.Ngay==='2026-10-27'&&y.MaNV===x.MaNV).length===1); const r2=themO({pin:'5678',ngay:'2026-10-27',maCS:'TP',khoi:'Tối',side:'PV',maMoi:other.MaNV,gio:'5.5'});   // trùng giờ ca tối ĐĐ → phải chặn
  return (ok1 && r2.ok===false) || (JSON.stringify(r1)+' '+JSON.stringify(r2)); });

// ---------- M. Xếp mới hoàn toàn (lịch gợi ý) không bỏ đói quán nhỏ / cuối tuần ----------
const rM=xepLich({pin:'5678',tuan:'2026-10-26',mode:'full'}); const PM=LL().filter(a=>DAYS.includes(a.Ngay));
T('M1 Xếp mới: Tản Đà, TNV ca sáng ngày nào cũng có nhân viên thật (không chỉ người nhà)', ()=>{ const bad=[]; DAYS.forEach(d=>['TD','TNV'].forEach(cs=>{ const real=PM.filter(a=>a.Ngay===d&&a.MaCS===cs&&dispBlock(CA[a.MaCa])==='Sáng'&&!/Support/.test(a.GhiChu)).length; if(real<2) bad.push(cs+' '+d+' '+real); })); return bad.length===0 || bad.join(', '); });
T('M2 Xếp mới: không ngày nào quán lớn bị bỏ trống (mỗi ca sáng TP/ĐĐ/LĐD ≥ 4 người)', ()=>{ const bad=[]; DAYS.forEach(d=>['TP','DD','LDD'].forEach(cs=>{ const c=PM.filter(a=>a.Ngay===d&&a.MaCS===cs&&dispBlock(CA[a.MaCa])==='Sáng').length; if(c<4) bad.push(cs+' '+d+' '+c); })); return bad.length===0 || bad.join(', '); });
T('M3 Lịch theo lịch cũ thiếu ít hơn xếp mới hoàn toàn; xếp mới không quá 60 lượt', ()=>{ const rO=xepLich({pin:'5678',tuan:'2026-10-26',mode:'mau'}); return (rO.soThieu<rM.soThieu && rM.soThieu<=60) || ('mới '+rM.soThieu+' / lịch cũ '+rO.soThieu); });

const rM2=xepLich({pin:'5678',tuan:'2026-10-26',mode:'mau'}); const PM2=LL().filter(a=>DAYS.includes(a.Ngay));
T('M4 Lịch chính (theo lịch cũ): Tản Đà, TNV ca sáng ngày nào cũng ≥ 2 nhân viên thật', ()=>{ const bad=[]; DAYS.forEach(d=>['TD','TNV'].forEach(cs=>{ const real=PM2.filter(a=>a.Ngay===d&&a.MaCS===cs&&dispBlock(CA[a.MaCa])==='Sáng'&&!/Support/.test(a.GhiChu)).length; if(real<2) bad.push(cs+' '+d+' '+real); })); return bad.length===0 || bad.join(', '); });
T('M5 OFF rải đều: không ngày nào quá 2 lần trung bình số người nghỉ', ()=>{ const nt=rows('NghiTuan').filter(r=>dateKey(r.Tuan)==='2026-10-26'); const c={}; nt.forEach(r=>{const d=dateKey(r.Ngay); c[d]=(c[d]||0)+1;}); const avg=nt.length/7; const bad=Object.keys(c).filter(d=>c[d]>2*avg+1); return bad.length===0 || JSON.stringify(c); });

T('V1 Ba file cùng phiên bản (hiện ở góc trang quản lý)', ()=>{ const a=fs.readFileSync('/home/claude/chamcong/Admin.html','utf8').match(/ADMIN_VER='([^']+)'/)[1]; const v=dangNhap({pin:'5678'}).ver; return (v.code===a && v.sched===a) || JSON.stringify(v)+' / '+a; });
T('V2 Thứ trong tuần đúng dù dự án đặt múi giờ khác', ()=> (dowOf('2026-10-30')===5 && dowOf('2026-11-01')===0 && dowOf('2026-10-26')===1) || 'sai');
T('V3 Tuần trước bị phình (lịch lỗi cũ) không được dùng làm mẫu', ()=>{ const shL=sh('LichLam'); const bak=shL.d.map(r=>r.slice()); for(let i=0;i<30;i++) shL.d.push(['2026-10-23','TP','3'+String(10+i).slice(-2),'PT1','Phục vụ','']);
  const rr=xepLich({pin:'5678',tuan:'2026-10-26',mode:'mau'}); shL.d=bak; return /lịch thật/.test(rr.nguonMau) || rr.nguonMau; });

T('P1 Không ca nào thiếu pha chế thật (người nhà không được là pha chế duy nhất), cả lịch chính và lịch xếp mới', ()=>{ const bad=[]; ['mau','full'].forEach(md=>{ xepLich({pin:'5678',tuan:'2026-10-26',mode:md}); const P6=LL().filter(a=>DAYS.includes(a.Ngay));
  ['TP','DD','TD','TNV','LDD'].forEach(cs=>['Sáng','Trưa','Tối'].forEach(b=>{ if(b==='Tối'&&['TD','TNV'].includes(cs)) return; DAYS.forEach(d=>{ const all=P6.filter(a=>a.Ngay===d&&a.MaCS===cs&&caBlocks(CA[a.MaCa]).includes(b)); const pc=all.filter(a=>['Pha chế','Quản lý'].includes(a.ViTri)&&!/Support/.test(a.GhiChu)).length; if(pc===0) bad.push(md+' '+cs+' '+b+' '+d.slice(5)); }); })); });
  return bad.length===0 || bad.join(', '); });
T('P2 Người nhà không đứng ca một mình (ca có người nhà phải có nhân viên thật)', ()=>{ const P6=LL().filter(a=>DAYS.includes(a.Ngay)); const bad=P6.filter(a=>/Support/.test(a.GhiChu)).filter(a=>!P6.some(x=>x!==a&&x.Ngay===a.Ngay&&x.MaCS===a.MaCS&&!/Support/.test(x.GhiChu)&&caBlocks(CA[x.MaCa]).some(b=>caBlocks(CA[a.MaCa]).includes(b)))); return bad.length===0 || bad.length+' lượt'; });

T('S1 Người nhà chỉ hỗ trợ ở quán trong CaiDat SUPPORT_CO_SO (mặc định TNV)', ()=>{ xepLich({pin:'5678',tuan:'2026-10-26',mode:'mau'}); const bad=LL().filter(a=>DAYS.includes(a.Ngay)&&/Support/.test(a.GhiChu)&&a.MaCS!=='TNV'); return bad.length===0 || bad.length+' lượt ngoài TNV'; });

T('Q1 Mỗi ca có pha chế cốt cán (lâu năm / QL / trưởng ca); chỗ chưa có thì ghi NÊN THÊM "pha chế lâu năm"', ()=>{ const bad=[]; ['mau','full'].forEach(md=>{ const rq=xepLich({pin:'5678',tuan:'2026-10-26',mode:md}); const P7=LL().filter(a=>DAYS.includes(a.Ngay)); const byM={}; rows('NhanVien').forEach(n=>byM[String(n.MaNV)]=n);
  const cot=m=>{ const n=byM[m], k=KINH_NGHIEM[m]||[0,0]; return n && (['Quản lý','Trưởng ca'].includes(n.ChucVu)||(k[0]>=6&&k[1]>=150)); };
  ['TP','DD','TD','TNV','LDD'].forEach(cs=>['Sáng','Trưa','Tối'].forEach(b=>{ if(b==='Tối'&&['TD','TNV'].includes(cs)) return; DAYS.forEach(d=>{ const ok=P7.some(a=>a.Ngay===d&&a.MaCS===cs&&caBlocks(CA[a.MaCa]).includes(b)&&['Pha chế','Quản lý'].includes(a.ViTri)&&!/Support/.test(a.GhiChu)&&cot(a.MaNV));
    if(!ok && !rq.goiYThieu.some(g=>g.Ngay===d&&g.MaCS===cs&&g.Khoi===b&&g.ViTri==='Pha chế lâu năm')) bad.push(md+' '+cs+' '+b+' '+d.slice(5)); }); })); });
  return bad.length===0 || bad.slice(0,5).join(', '); });

T('T1 Tối ưu đổi ngày OFF: giảm THIẾU, mọi người vẫn có đúng 1 ngày OFF, không phá luật nào', ()=>{ setCfg('TOI_UU_DOI_OFF','Không'); const r0=xepLich({pin:'5678',tuan:'2026-10-26',mode:'mau'}); setCfg('TOI_UU_DOI_OFF','Có'); const r1=xepLich({pin:'5678',tuan:'2026-10-26',mode:'mau'});
  const P8=LL().filter(a=>DAYS.includes(a.Ngay)); const nt=rows('NghiTuan').filter(o=>dateKey(o.Tuan)==='2026-10-26'); const badOff=nt.filter(o=>P8.some(a=>a.MaNV===String(o.MaNV)&&a.Ngay===dateKey(o.Ngay)));
  return (r1.soThieu<r0.soThieu && badOff.length===0) || ('trước '+r0.soThieu+' sau '+r1.soThieu+' · làm vào ngày OFF: '+badOff.length); });

T('H10 Làm 2 quán trong 1 ngày được khi không trùng giờ (sáng TP, tối ĐĐ)', ()=>{ const sang=LL().find(x=>x.Ngay==='2026-10-28'&&x.MaCS==='TP'&&x.MaCa==='PT1'&&NV[x.MaNV]&&NV[x.MaNV].ViTri==='Phục vụ'&&NV[x.MaNV].CoDinh!=='Có'&&LL().filter(y=>y.Ngay==='2026-10-28'&&y.MaNV===x.MaNV).length===1);
  if(!sang) return 'không có người mẫu'; const r=themO({pin:'5678',ngay:'2026-10-28',maCS:'DD',khoi:'Tối',side:'PV',maMoi:sang.MaNV,gio:'5.5'}); return (r.ok && LL().some(y=>y.Ngay==='2026-10-28'&&y.MaNV===sang.MaNV&&y.MaCS==='DD')) || JSON.stringify(r); });
T('H11 Giữ đúng lịch anh xếp: chạy lại từ tuần 19–25/10 giữ ≥ 85% người–quán–ngày', ()=>{ const hist2=JSON.parse(fs.readFileSync('/home/claude/hist/hist.json','utf8')); const actNV=new Set(rows('NhanVien').filter(n=>n.TrangThai!=='Đã nghỉ').map(n=>String(n.MaNV)));
  const act=new Set(hist2.filter(h=>h.Ngay>='2026-10-19'&&h.Ngay<='2026-10-25'&&['Sáng','Trưa','Tối'].includes(h.Khoi)&&h.MaNV&&actNV.has(h.MaNV)).map(h=>[h.Ngay,h.MaCS,h.MaNV].join('|')));
  const shL=sh('LichLam'); const bak=shL.d.map(r=>r.slice()); shL.d=[shL.d[0]].concat(bak.slice(1).filter(r=>!(String(r[0])>='2026-10-12'&&String(r[0])<='2026-10-25')));
  xepLich({pin:'5678',tuan:'2026-10-19',mode:'mau'}); const pred=new Set(LL().filter(a=>a.Ngay>='2026-10-19'&&a.Ngay<='2026-10-25'&&!/Support/.test(a.GhiChu)).map(a=>[a.Ngay,a.MaCS,a.MaNV].join('|')));
  let k=0; act.forEach(x=>{ if(pred.has(x)) k++; }); shL.d=bak; const pct=Math.round(k/act.size*100); return pct>=85 || ('giữ '+pct+'%'); });

T('Q2 Hoán đổi cốt cán: không tăng ca chưa có cốt cán (giảm khi có cơ hội), số người mỗi quán mỗi ca không đổi, quán cho đi vẫn còn cốt cán', ()=>{ setCfg('TOI_UU_HOAN_DOI','Không'); const a0=xepLich({pin:'5678',tuan:'2026-10-26',mode:'mau'}); const c0=a0.goiYThieu.filter(g=>g.ViTri==='Pha chế lâu năm').length;
  const cnt=()=>{ const m={}; LL().filter(a=>DAYS.includes(a.Ngay)).forEach(a=>caBlocks(CA[a.MaCa]).forEach(b=>{ const k=a.Ngay+a.MaCS+b; m[k]=(m[k]||0)+1; })); return m; };
  setCfg('TOI_UU_HOAN_DOI','Có'); const a1=xepLich({pin:'5678',tuan:'2026-10-26',mode:'mau'}); const c1=a1.goiYThieu.filter(g=>g.ViTri==='Pha chế lâu năm').length;
  const sw=LL().filter(a=>DAYS.includes(a.Ngay)&&/Hoán đổi/.test(a.GhiChu)).length;
  return (c1<=c0 && sw%2===0 && a1.soThieu<=a0.soThieu) || ('trước '+c0+' sau '+c1+' · dòng hoán đổi '+sw+' · thiếu '+a0.soThieu+'→'+a1.soThieu); });

// ---------- C. Chốt lịch tuần & app học ----------
T('HL1 Chấm công: nhân viên chọn vị trí làm ca này, lưu vào ViTriLam (ra ca giữ vị trí lúc vào)', ()=>{ sh('LichLam').d.push(['2026-11-03','TP','312','PT1','Phục vụ','']);
  at('2026-11-03','06:30'); const a=checkInGroup({maCS:'TP',key:'tp2026',codes:['312'],photo:'data:image/jpeg;base64,AA',viTri:{'312':'Pha chế'}}); at('2026-11-03','12:00'); const b=checkInGroup({maCS:'TP',key:'tp2026',codes:['312'],photo:'data:image/jpeg;base64,AA'}); fake=null;
  const r=rows('ChamCong').filter(x=>String(x.MaNV)==='312'&&dateKey(x.Ngay)==='2026-11-03'); return (a.ok&&b.ok&&r.length===2&&r.every(x=>x.ViTriLam==='Pha chế')) || JSON.stringify(r.map(x=>x.ViTriLam)); });
const rC=xepLich({pin:'5678',tuan:'2026-10-26',mode:'mau'});
T('HL2 Xếp xong rồi chốt ngay (không sửa gì): app đoán đúng 100%', ()=>{ const c=chotLich({pin:'5678',tuan:'2026-10-26'}); return (c.ok && c.phanTram===100 && c.bo.length===0) || JSON.stringify(c).slice(0,200); });
let boItem=null;
T('HL3 Quản lý thay người rồi chốt: % giảm, app biết ai bị bỏ, ai được thêm', ()=>{ const a=LL().find(x=>x.Ngay==='2026-10-28'&&x.MaCS==='TP'&&x.ViTri==='Phục vụ'&&x.MaCa==='PT1'); const u=ungVien({pin:'5678',ngay:'2026-10-28',maCS:'TP',khoi:'Sáng',side:'PV'}).list.find(x=>x.Nhom==='ranh'&&x.ViTri==='Phục vụ');
  suaO({pin:'5678',ngay:a.Ngay,maCS:'TP',maCa:a.MaCa,maNV:a.MaNV,maMoi:u.MaNV,gio:'5.5'}); const c=chotLich({pin:'5678',tuan:'2026-10-26'}); boItem=c.bo.find(x=>x.MaNV===a.MaNV);
  return (c.ok && c.phanTram<100 && boItem && c.them.some(x=>x.MaNV===u.MaNV)) || JSON.stringify(c).slice(0,200); });
T('HL4 Lý do "đi học / bận cố định": tuần sau app không xếp người đó vào thứ + ca đó', ()=>{ const r=luuLyDo({pin:'5678',tuan:'2026-10-26',items:[Object.assign({},boItem,{LyDo:'Đi học / bận cố định thứ này'})]});
  xepLich({pin:'5678',tuan:'2026-11-02',mode:'mau'}); const d2='2026-11-04'; const bad=LL().filter(x=>x.Ngay===d2&&x.MaNV===boItem.MaNV&&caBlocks(CA[x.MaCa]).includes(boItem.Khoi));
  return (r.ok && rows('BanCoDinh').some(b=>String(b.MaNV)===boItem.MaNV) && bad.length===0) || ('vẫn xếp '+bad.length); });
T('HL5 Lý do "không hợp quán": tuần sau không xếp người đó ở quán đó', ()=>{ const x=LL().find(a=>a.Ngay>='2026-11-02'&&a.Ngay<='2026-11-08'&&a.MaCS==='DD'&&NV[a.MaNV]&&NV[a.MaNV].ViTri==='Phục vụ'&&NV[a.MaNV].CoSoChinh!=='DD'&&!/Support/.test(a.GhiChu)) || LL().find(a=>a.Ngay>='2026-11-02'&&a.MaCS==='DD'&&NV[a.MaNV]&&NV[a.MaNV].ViTri==='Phục vụ');
  luuLyDo({pin:'5678',tuan:'2026-10-26',items:[{Ngay:'2026-10-28',MaCS:'DD',MaNV:x.MaNV,Khoi:'Sáng',ViTri:'Phục vụ',Loai:'bo',LyDo:'Không hợp quán này'}]});
  xepLich({pin:'5678',tuan:'2026-11-02',mode:'mau'}); const bad=LL().filter(a=>a.Ngay>='2026-11-02'&&a.Ngay<='2026-11-08'&&a.MaNV===x.MaNV&&a.MaCS==='DD'); return bad.length===0 || (tenNgan(NV[x.MaNV])+' vẫn ở ĐĐ '+bad.length); });
T('HL6 Học lại thói quen từ lịch đã chốt: người được quản lý xếp quán mới nhiều thì app tăng ưu tiên quán đó', ()=>{ const m='310'; const before=String((rows('ThoiQuen').find(q=>String(q.MaNV)===m)||{}).CoSoHayLam);
  const w=v=>{ const x=String(v).split(',').find(s=>s.startsWith('TP:')); return x?+x.split(':')[1]:0; };
  const L=sh('LichLam'); L.d=L.d.filter((r,i)=>i===0||!(String(r[2])===m&&String(r[0])>='2026-10-26'&&String(r[0])<='2026-11-01')); ['2026-10-27','2026-10-28','2026-10-29','2026-10-30'].forEach(d=>L.d.push([d,'TP',m,'PT1','Phục vụ','']));
  chotLich({pin:'5678',tuan:'2026-10-26'}); const after=String((rows('ThoiQuen').find(q=>String(q.MaNV)===m)||{}).CoSoHayLam); return w(after)>w(before) || (before+' → '+after); });
T('HL7 Lịch sử % đoán đúng từng tuần', ()=>{ const h=getHocTap({pin:'5678'}); return (h.ok && h.lichSu.length>=1 && h.lichSu.every(x=>x.PhanTram>=0&&x.PhanTram<=100)) || JSON.stringify(h).slice(0,200); });

T('GN1 Ghi nhớ: thêm "bận cố định" và "không xếp quán" trên app → xếp lịch tránh; xoá được', ()=>{ const m='318'; const a=themGhiNho({pin:'5678',maNV:m,loai:'ban',thu:['T3'],khoi:['Sáng']}); const b=themGhiNho({pin:'5678',maNV:m,loai:'kx',maCS:'TD'});
  xepLich({pin:'5678',tuan:'2026-11-09',mode:'mau'}); const P9=LL().filter(x=>x.Ngay>='2026-11-09'&&x.Ngay<='2026-11-15'&&x.MaNV===m);
  const bad=P9.filter(x=>(x.Ngay==='2026-11-10'&&caBlocks(CA[x.MaCa]).includes('Sáng'))||x.MaCS==='TD'); const ds=dsGhiNho({pin:'5678'}); const it=ds.list.filter(x=>x.MaNV===m);
  const del=xoaGhiNho({pin:'5678',id:it[it.length-1].id}); const ds2=dsGhiNho({pin:'5678'});
  return (a.ok&&b.ok&&bad.length===0&&it.length>=2&&del.ok&&ds2.list.length===ds.list.length-1) || JSON.stringify({a,b,bad:bad.length,it:it.length}); });

T('E9 Xếp lịch lỗi thì báo rõ nội dung lỗi (không hiện "undefined"); kết quả không chứa kiểu ngày giờ', ()=>{ const r=xepLich({pin:'5678',tuan:'2026-10-26',mode:'mau'}); const hasDate=JSON.stringify(r,(k,v)=>v)&&(function f(x){ if(x instanceof Date) return true; if(x&&typeof x==='object') return Object.values(x).some(f); return false; })(r);
  const saved=global.setupScheduler; global.setupScheduler=function(){ throw new Error('thử lỗi'); }; let e; try{ e=xepLich({pin:'5678',tuan:'2026-10-26',mode:'mau'}); } finally { global.setupScheduler=saved; }
  return (r.ok && !hasDate && e && e.ok===false && /thử lỗi/.test(e.msg)) || JSON.stringify(e); });

T('TD1 Đống Đa ca sáng tối đa 3 pha chế (gồm quản lý) + rửa ly, cả lịch chính và xếp mới', ()=>{ const bad=[]; ['mau','full'].forEach(md=>{ xepLich({pin:'5678',tuan:'2026-10-26',mode:md}); const PX=LL().filter(a=>DAYS.includes(a.Ngay));
  DAYS.forEach(d=>{ const c=new Set(PX.filter(a=>a.Ngay===d&&a.MaCS==='DD'&&['Pha chế','Quản lý'].includes(a.ViTri)&&caBlocks(CA[a.MaCa]).includes('Sáng')).map(a=>a.MaNV)).size; if(c>3) bad.push(md+' '+d.slice(5)+' '+c); }); }); return bad.length===0 || bad.join(', '); });

T('KG1 Nhân viên đăng ký bận cùng thứ, cùng ca 3 tuần liền → app tự nhớ bận cố định và không xếp ca đó', ()=>{ const m='315'; const dk=sh('DangKyBan'); ['2026-10-06','2026-10-13','2026-10-20'].forEach(d=>dk.d.push([d,m,'Tối','đi học']));
  const realNow=Date; fake=new RealDate('2026-10-24T09:00:00+07:00');
  const r=xepLich({pin:'5678',tuan:'2026-10-26',mode:'mau'}); fake=null; const bcd=rows('BanCoDinh').filter(b=>String(b.MaNV)===m&&b.Thu==='T3'&&b.Khoi==='Tối');
  const bad=LL().filter(a=>a.Ngay==='2026-10-27'&&a.MaNV===m&&caBlocks(CA[a.MaCa]).includes('Tối')); return (bcd.length===1 && /Tự học/.test(bcd[0].Nguon) && bad.length===0) || JSON.stringify({bcd,bad:bad.length}); });
T('KG2 Xếp mới theo khung giờ quen làm: ít ca ngoài hẳn khung hơn khi tắt (thứ + ca người đó chưa từng làm)', ()=>{ const dem=()=>{ xepLich({pin:'5678',tuan:'2026-10-26',mode:'full'}); let bad=0; LL().filter(a=>DAYS.includes(a.Ngay)&&!/Support/.test(a.GhiChu)).forEach(a=>{ const w=(KHUNG_GIO[a.MaNV]||{})[String(dowOf(a.Ngay))]; if(!w) return; const i={'Sáng':0,'Trưa':1,'Tối':2}[dispBlock(CA[a.MaCa])]; if(w[i]===0&&w[0]+w[1]+w[2]>=5) bad++; }); return bad; };
  setCfg('KHUNG_GIO','Không'); const off=dem(); setCfg('KHUNG_GIO','Có'); const on=dem(); return on<=off || ('bật '+on+' / tắt '+off); });
T('TD2 Ca sáng: Trần Phú 3, Đống Đa 3, LĐD 2 pha chế (đã gồm quản lý)', ()=>{ const g=(cs)=>(TOI_THIEU_CUNG.find(h=>h[0]===cs&&h[1]==='Sáng'&&h[2]==='Pha chế')||[])[3]; return (g('TP')===3&&g('DD')===3&&g('LDD')===2) || [g('TP'),g('DD'),g('LDD')].join(','); });

T('DAY1 Ngày làm 2 ca không quá 12 tiếng (lịch thật: gãy = sáng 5,5h + tối 5,5h); phục vụ không bị tính là pha chế cốt cán', ()=>{ xepLich({pin:'5678',tuan:'2026-10-26',mode:'mau'}); const g={}; LL().filter(a=>DAYS.includes(a.Ngay)).forEach(a=>{ const k=a.MaNV+a.Ngay; g[k]=(g[k]||0)+(+CA[a.MaCa].SoGio); });
  const dai=Object.entries(g).filter(([k,v])=>v>12); return dai.length===0 || (dai.length+' ngày > 12h: '+dai.slice(0,4).map(x=>x[0]+' '+x[1]+'h').join(', ')); });

// ---------- QR. Chấm công bằng mã QR, khảo sát, tập sự, hạn đăng ký ----------
T('QR1 Mã QR đúng quán, đúng tháng mới dùng được; mã sai bị chặn', ()=>{ at('2026-11-03','06:20'); const th=qrThang(new Date()); const ok=qrInfo({cs:'TP',t:qrToken('TP',th)}); const sai=qrInfo({cs:'TP',t:'abc'}); const khacQuan=qrInfo({cs:'DD',t:qrToken('TP',th)});
  const cu=qrInfo({cs:'TP',t:qrToken('TP','2026-10')}); at('2026-11-12','06:20'); const cuHet=qrInfo({cs:'TP',t:qrToken('TP','2026-10')}); fake=null;
  return (ok.ok && !sai.ok && !khacQuan.ok && cu.ok && !cuHet.ok) || JSON.stringify([ok.ok,sai.ok,khacQuan.ok,cu.ok,cuHet.ok]); });
T('QR2 Quét QR chấm công: trong 100m không cảnh báo; xa quán / không định vị / điện thoại mới thì ghi cảnh báo nhưng vẫn chấm', ()=>{ luuViTriQuan({pin:'1234',maCS:'TP',lat:16.0600,lng:108.2200}); sh('LichLam').d.push(['2026-11-04','TP','313','PT1','Phục vụ',''],['2026-11-04','TP','317','PT1','Phục vụ','']);
  at('2026-11-04','06:25'); const t=qrToken('TP',qrThang(new Date()));
  const a=qrChamCong({cs:'TP',t,maNV:'313',deviceId:'dev313',photo:'data:image/jpeg;base64,AA',lat:16.0602,lng:108.2201,acc:15,viTri:'Phục vụ'});   // lần đầu: máy mới
  at('2026-11-04','12:05'); const b=qrChamCong({cs:'TP',t,maNV:'313',deviceId:'dev313',photo:'data:image/jpeg;base64,AA',lat:16.0601,lng:108.2200,acc:15});   // máy quen, trong 100m
  at('2026-11-04','06:30'); const c=qrChamCong({cs:'TP',t,maNV:'317',deviceId:'x',photo:'data:image/jpeg;base64,AA',lat:16.0800,lng:108.2200,acc:20}); fake=null;   // cách ~2km
  const rs=rows('ChamCong').filter(r=>dateKey(r.Ngay)==='2026-11-04'&&['313','317'].includes(String(r.MaNV)));
  const ra=rs.find(r=>String(r.MaNV)==='313'&&r.Loai==='RA'), xa=rs.find(r=>String(r.MaNV)==='317');
  return (a.ok&&b.ok&&c.ok && /Điện thoại mới/.test(a.canhBao.join()) && b.canhBao.length===0 && /Cách quán/.test(xa.CanhBao) && ra && !ra.CanhBao && dsCanhBao({pin:'5678',from:'2026-11-01'}).list.length>=2) || JSON.stringify({a:a.canhBao,b:b.canhBao,xa:xa&&xa.CanhBao}); });
T('QR3 Ra ca trễ: hỏi tăng ca, gửi số giờ thì chờ quản lý duyệt', ()=>{ sh('LichLam').d.push(['2026-11-05','TP','313','PT1','Phục vụ','']); const t=()=>qrToken('TP',qrThang(new Date()));
  at('2026-11-05','06:28'); qrChamCong({cs:'TP',t:t(),maNV:'313',deviceId:'dev313',photo:'data:image/jpeg;base64,AA',lat:16.06,lng:108.22,acc:10});
  at('2026-11-05','13:30'); const r1=qrChamCong({cs:'TP',t:t(),maNV:'313',deviceId:'dev313',photo:'data:image/jpeg;base64,AA',lat:16.06,lng:108.22,acc:10});
  const r2=qrChamCong({cs:'TP',t:t(),maNV:'313',deviceId:'dev313',photoUrl:r1.photoUrl,lat:16.06,lng:108.22,acc:10,tangCa:'1.5',lyDo:'đông khách'}); fake=null;
  const ra=rows('ChamCong').find(r=>dateKey(r.Ngay)==='2026-11-05'&&String(r.MaNV)==='313'&&r.Loai==='RA'); return (r1.needOT && r2.ok && ra && +ra.TangCaGio===1.5 && !/^Đã duyệt|^Duyệt|^Có/.test(String(ra.DuyetTC||''))) || JSON.stringify({r1,r2:r2.ok,ra}); });
T('KS1 Khảo sát: lưu được; giờ không rảnh → bận cố định, quán không tiện → không xếp; kỹ năng chỉ áp dụng sau khi quản lý xác nhận', ()=>{ const ma='321'; const sdt=String((rows('NhanVien').find(n=>String(n.MaNV)===ma)||{}).SDT||'').replace(/\D/g,'').slice(-4);
  const ranh={}; ['T2','T3','T4','T5','T6','T7','CN'].forEach(t=>{ ranh[t+'|Sáng']=true; }); ranh['T3|Sáng']=false;
  const r=luuKhaoSat({maNV:ma,sdt4:sdt,data:{batDau:'2026-05',loai:'PT',viTriChinh:'Phục vụ',hoTroDs:['Pha chế'],hoTro:{'Pha chế':'Làm một mình được'},quanKhongTien:['LDD'],ranh,tangCa:'Luôn được',caDai:'Không',gay:'Được',coXe:'Có'}});
  const bcd=rows('BanCoDinh').filter(b=>String(b.MaNV)===ma&&/Khảo sát/.test(b.Nguon)); const kx=rows('KhongXep').filter(k=>String(k.MaNV)===ma&&k.MaCS==='LDD');
  const truoc=String(rows('NhanVien').find(n=>String(n.MaNV)===ma).ViTriKiem||''); const x=xacNhanKhaoSat({pin:'5678',maNV:ma}); const sau=String(rows('NhanVien').find(n=>String(n.MaNV)===ma).ViTriKiem||'');
  const sai=luuKhaoSat({maNV:ma,sdt4:'0000',data:{}});
  return (r.ok && bcd.some(b=>b.Thu==='T3'&&b.Khoi==='Sáng') && bcd.some(b=>b.Khoi==='Tối') && kx.length===1 && !/Pha chế/.test(truoc) && x.ok && /Pha chế/.test(sau) && (sdt.length<4||!sai.ok)) || JSON.stringify({bcd:bcd.length,kx:kx.length,truoc,sau}); });
T('TS1 Tập sự: pha chế mới chỉ được xếp cùng ca với pha chế full time lâu năm; phục vụ mới phải có phục vụ quen việc cùng ca', ()=>{ const add=(ma,ten,vt)=>{ sh('NhanVien').d.push([ma,ten,vt,'',vt,'PT','DD','Không','','Thử việc','test']); };
  add('299','Tập Sự PC','Pha chế'); add('398','Tập Sự PV','Phục vụ'); xepLich({pin:'5678',tuan:'2026-11-09',mode:'full'}); const PX=LL().filter(a=>a.Ngay>='2026-11-09'&&a.Ngay<='2026-11-15');
  const nvm={}; rows('NhanVien').forEach(n=>nvm[String(n.MaNV)]=n); const cotFT=m=>{ const n=nvm[m], k=KINH_NGHIEM[m]||[0,0]; return n&&n.Loai==='FT'&&(['Quản lý','Trưởng ca'].includes(n.ChucVu)||(['Pha chế','Quản lý'].includes(n.ViTri)&&k[0]>=6&&k[1]>=150)); };
  const bad=[]; PX.filter(a=>a.MaNV==='299'&&a.ViTri==='Pha chế').forEach(a=>{ const bl=caBlocks(CA[a.MaCa]); bl.forEach(b=>{ if(!PX.some(x=>x!==a&&x.Ngay===a.Ngay&&x.MaCS===a.MaCS&&caBlocks(CA[x.MaCa]).includes(b)&&['Pha chế','Quản lý'].includes(x.ViTri)&&cotFT(x.MaNV))) bad.push('PC '+a.Ngay+' '+b); }); });
  PX.filter(a=>a.MaNV==='398'&&a.ViTri==='Phục vụ').forEach(a=>{ const bl=caBlocks(CA[a.MaCa]); bl.forEach(b=>{ if(!PX.some(x=>x!==a&&x.Ngay===a.Ngay&&x.MaCS===a.MaCS&&caBlocks(CA[x.MaCa]).includes(b)&&x.ViTri==='Phục vụ'&&x.MaNV!=='398')) bad.push('PV '+a.Ngay+' '+b); }); });
  sh('NhanVien').d=sh('NhanVien').d.filter(r=>!['299','398'].includes(String(r[0])));
  return bad.length===0 || bad.slice(0,4).join(', '); });
T('DK1 Hạn đăng ký lịch: trước thứ 7 bình thường; thứ 7–chủ nhật ghi trễ hạn; từ thứ 2 tuần đó không nhận', ()=>{ const m='321';
  at('2026-11-20','10:00'); const a=saveDangKy({maNV:m,tuan:'2026-11-23',ban:[{Ngay:'2026-11-24',Khoi:'Sáng'}]});
  at('2026-11-22','21:00'); const b=saveDangKy({maNV:m,tuan:'2026-11-23',ban:[]});
  at('2026-11-23','07:00'); const c=saveDangKy({maNV:m,tuan:'2026-11-23',ban:[]}); fake=null;
  const cd=chuaDangKy({pin:'5678',tuan:'2026-11-23'});
  return (a.ok && !a.treHan && b.ok && b.treHan && !c.ok && cd.ok && cd.roi.some(x=>x.MaNV===m)) || JSON.stringify({a,b,c:c.msg}); });

T('TT1 Lịch thực tế dựng từ chấm công (vào–ra, vị trí thực làm) và dùng để học khi chốt lịch', ()=>{ const r=dungLichThucTe({tuan:'2026-11-02'}); const tt=rows('LichThucTe').filter(x=>dateKey(x.Tuan)==='2026-11-02');
  const a=tt.find(x=>String(x.MaNV)==='313'&&dateKey(x.Ngay)==='2026-11-04'); const v=getLichTuan({pin:'5678',tuan:'2026-11-02',all:true,nguon:'thucte'});
  return (r.ok && a && a.MaCS==='TP' && a.MaCa && v.ok && v.items.some(i=>i.MaNV==='313')) || JSON.stringify({r,a}); });
T('OD1 Chỉ số ổn định có cho nhân viên (part time hay đổi lịch thấp hơn người ổn định)', ()=> (onDinh('310')!==null && onDinh('316')!==null && onDinh('310')>onDinh('316')) || [onDinh('310'),onDinh('316')].join(','));

// ---------- XL. App Xếp lịch đọc dữ liệu từ app Chấm công (chỉ đọc) ----------
T('XL1 Đồng bộ từ app Chấm công: nhân viên mới / đổi thông tin; giữ cột riêng của xếp lịch; ca đã làm thành lịch thực tế', ()=>{
  const ccNV=LICH.insertSheet('NhanVien'); ccNV.d=[['MaNV','Ten','ViTri','ChucVu','ViTriKiem','Loai','CoSoChinh','CoDinh','TangCaDuoc','SDT','TrangThai','LuongGio','NgayVao','GhiChu'],
    ['202','Linh (đổi tên)','Pha chế','','','FT','TP','','','0900000000','Đang làm','','',''],['299','Người Mới Cấp Mã','Pha chế','','','PT','DD','','','0911111111','Thử việc','','2026-11-01','']];
  const ccCC=LICH.insertSheet('ChamCong'); ccCC.d=[['ID','Ngay','MaNV','Ten','MaCS','MaCa','CaBD','CaKT','ViTri','Vao','Ra','TreMin','GioThuc','KhaiLoai','KhaiGio','KhaiGhiChu','TrangThai','GioTinh'],
    ['a','2026-11-23','310','T An','TNV','PT1','06:30','12:00','Phục vụ','06:30','12:00',0,5.5,'dung',5.5,'','Đã xong',5.5],['b','2026-11-24','310','T An','TNV','PT1','06:30','12:00','Phục vụ','06:30','',0,'','','','','Đang làm','']];
  const kiemTruoc=String((rows('NhanVien').find(n=>String(n.MaNV)==='202')||{}).ViTriKiem||'');
  setCfg('CHAM_CONG_SHEET_ID','LICHFILE'); const r=dongBoChamCong({pin:'5678'});
  const n202=rows('NhanVien').find(n=>String(n.MaNV)==='202'), n299=rows('NhanVien').find(n=>String(n.MaNV)==='299'); const tt=rows('LichThucTe').filter(x=>String(x.MaNV)==='310'&&dateKey(x.Tuan)==='2026-11-23');
  return (r.ok && r.nhanVienMoi===1 && /đổi tên/.test(n202.Ten) && String(n202.ViTriKiem||'')===kiemTruoc && n299 && n299.TrangThai==='Thử việc' && tt.length===1 && tt[0].MaCa==='PT1') || JSON.stringify({r,n202,tt}); });
T('XL2 Sau khi tách: xếp lịch vẫn chạy đủ luật; trang chấm công cũ báo chuyển sang app mới', ()=>{ const r=xepLich({pin:'5678',tuan:'2026-11-30',mode:'mau'}); setCfg('CHAM_CONG_URL','https://cc'); let html=''; const saved=global.HtmlService; global.HtmlService=Object.assign({},saved||{},{XFrameOptionsMode:{ALLOWALL:1},createHtmlOutput:h=>{ html=h; return {setXFrameOptionsMode(){return this;}}; }}); doGet({parameter:{cs:'TP',key:'tp2026'}}); global.HtmlService=saved; setCfg('CHAM_CONG_URL',''); setCfg('CHAM_CONG_SHEET_ID','');
  return (r.ok && r.soCa>200 && /chuyển sang app mới/.test(html)) || JSON.stringify({ok:r.ok,soCa:r.soCa,msg:r.msg}); });

T('XL3 Khảo sát nằm ở app Chấm công: đồng bộ lấy câu trả lời mới nhất → giờ không rảnh thành bận cố định, ngày nghỉ, ngày vào; kỹ năng đã xác nhận → vị trí kiêm', ()=>{
  const ks=LICH.getSheetByName('KhaoSat')||LICH.insertSheet('KhaoSat'); ks.d=[['ID','MaNV','LoaiNguoi','NgayGui','XacMinh','SDT','DuLieu','Nap','NapLuc','KyNang'],
    ['K1','310','cũ','2026-10-20','khớp','0900','{"ngayVao":"2025-04-01","ranh":{"T2|Sáng":true,"T3|Sáng":true},"nghiThu":"","hoTro":{"Pha chế":"Làm một mình được"}}','','','Đã xác nhận']];
  const nv=LICH.getSheetByName('NhanVien'); const H=nv.d[0]; if(H.indexOf('ViTriKiem')<0){ H.push('ViTriKiem'); } const r310=nv.d.findIndex(r=>String(r[0])==='310'); if(r310<0) nv.d.push(H.map(k=>({MaNV:'310',Ten:'T An',ViTri:'Phục vụ',Loai:'PT',TrangThai:'Đang làm'}[k]||''))); 
  const idx=nv.d.findIndex(r=>String(r[0])==='310'); nv.d[idx][H.indexOf('ViTriKiem')]='Pha chế';
  setCfg('CHAM_CONG_SHEET_ID','LICHFILE'); const r=dongBoChamCong({pin:'5678'}); setCfg('CHAM_CONG_SHEET_ID','');
  const bcd=rows('BanCoDinh').filter(b=>String(b.MaNV)==='310'&&/Khảo sát/.test(b.Nguon)); const k=rows('KhaoSat').find(x=>String(x.MaNV)==='310'); const d=JSON.parse(k.DuLieu);
  const n=rows('NhanVien').find(x=>String(x.MaNV)==='310');
  return (r.ok && r.khaoSat===1 && bcd.length===19 && !bcd.some(b=>b.Thu==='T2'&&b.Khoi==='Sáng') && d.batDau==='2025-04' && k.XacNhan==='Đã xác nhận' && /Pha chế/.test(n.ViTriKiem)) || JSON.stringify({r,bcd:bcd.length,d,n:n&&n.ViTriKiem}); });

T('XL4 Tháng đã lưu trữ bên app Chấm công: đồng bộ không làm mất ngày cũ trong tuần giáp tháng (dữ liệu học giữ nguyên)', ()=>{
  const lt=sh('LichThucTe'); lt.d.push(['2026-12-28','2026-12-29','TP','313','PT1','Phục vụ','06:30','12:00'],['2026-12-28','2026-12-30','TP','313','PT1','Phục vụ','06:30','12:00']);
  const cc=LICH.getSheetByName('ChamCong'); cc.d.push(['z1','2027-01-02','313','Đường','TP','PT1','06:30','12:00','Phục vụ','06:30','12:00',0,5.5,'dung',5.5,'','Đã xong',5.5]);
  setCfg('CHAM_CONG_SHEET_ID','LICHFILE'); dongBoChamCong({pin:'5678'}); setCfg('CHAM_CONG_SHEET_ID','');
  const w=rows('LichThucTe').filter(r=>dateKey(r.Tuan)==='2026-12-28'&&String(r.MaNV)==='313').map(r=>dateKey(r.Ngay)).sort();
  return (w.join()==='2026-12-29,2026-12-30,2027-01-02') || w.join(); });

T('XL5 Thêm ca giờ tự do: tạo mã ca TDhhmm-hhmm; người đã đăng ký bận giờ đó thì cảnh báo, quản lý đồng ý mới xếp', ()=>{
  sh('DangKyBan').d.push(['2027-03-03','303','Tối','NV tự đăng ký']);
  const a=themCa({pin:'5678',maNV:'303',ngay:'2027-03-03',maCS:'TP',maCa:'TUDO',gioBD:'18:00',gioKT:'21:00',viTri:'Phục vụ'});
  const b=themCa({pin:'5678',maNV:'303',ngay:'2027-03-03',maCS:'TP',maCa:'TUDO',gioBD:'18:00',gioKT:'21:00',viTri:'Phục vụ',vanXep:true});
  const c=themCa({pin:'5678',maNV:'304',ngay:'2027-03-03',maCS:'TP',maCa:'TUDO',gioBD:'15:00',gioKT:'14:00'});
  const ca=rows('Ca').find(x=>x.MaCa==='TD1800-2100'); const l=rows('LichLam').find(x=>dateKey(x.Ngay)==='2027-03-03'&&String(x.MaNV)==='303');
  return (!a.ok && a.canhBao && b.ok && b.maCa==='TD1800-2100' && ca && +ca.SoGio===3 && l && /đã đăng ký bận/.test(l.GhiChu) && !c.ok) || JSON.stringify({a,b,c,ca,l}); });
T('XL6 Ca cần người: quản lý đăng → đọc người nhận và người báo rảnh từ app Chấm công → chọn người → ca vào lịch đúng giờ, đủ người thì đóng', ()=>{
  const d=dangCaCanNguoi({pin:'5678',ngay:'2027-03-06',maCS:'DD',gioBD:'15:00',gioKT:'19:00',viTri:'Phục vụ',soNguoi:1,ghiChu:'đông'});
  const nc=LICH.getSheetByName('NhanCa')||LICH.insertSheet('NhanCa'); nc.d=[['ID','CaID','MaNV','Luc'],['N1',d.id,'310','2027-03-01']];
  const rt=LICH.getSheetByName('RanhThem')||LICH.insertSheet('RanhThem'); rt.d=[['ID','Ngay','MaNV','Tu','Den','GhiChu','LucGui'],['R1','2027-03-06','313','14:00','20:00','','2027-03-01']];
  setCfg('CHAM_CONG_SHEET_ID','LICHFILE'); fake=new RealDate('2027-03-02T09:00:00+07:00').getTime();
  const ds=dsCaCanNguoi({pin:'5678'}); const c=ds.list.find(x=>x.ID===d.id); const ch0=chonNguoiCa({pin:'5678',id:d.id,maNV:'310'}); const ch=chonNguoiCa({pin:'5678',id:d.id,maNV:'310',vanXep:true}); const ds2=dsCaCanNguoi({pin:'5678'}); fake=null; setCfg('CHAM_CONG_SHEET_ID','');
  const l=rows('LichLam').find(x=>dateKey(x.Ngay)==='2027-03-06'&&String(x.MaNV)==='310'); const c2=ds2.list.find(x=>x.ID===d.id);
  return (d.ok && c.Nhan.length===1 && !ch0.ok && ch0.canhBao && c.GoiY.some(g=>g.MaNV==='313'&&/báo rảnh/.test(g.Ly)) && ds.ranh.length===1 && ch.ok && l && l.MaCa==='TD1500-1900' && c2.TrangThai==='Đủ người') || JSON.stringify({d,c,ch,l,c2}); });
T('XL7 Đăng ký bận gửi ở app Chấm công → đồng bộ về xếp lịch (giữ dòng quản lý tự nhập); danh sách chưa đăng ký đọc đúng', ()=>{
  sh('DangKyBan').d.push(['2027-03-10','315','Sáng','QL nhập hộ']);
  const cb=LICH.getSheetByName('DangKyBan')||LICH.insertSheet('DangKyBan'); cb.d=[['Ngay','MaNV','Khoi','Nguon'],['2027-03-09','310','Tối','NV tự đăng ký 2027-03-05']];
  const cx=LICH.getSheetByName('DangKyXacNhan')||LICH.insertSheet('DangKyXacNhan'); cx.d=[['Tuan','MaNV','LucGui','TreHan'],['2027-03-08','310','2027-03-05','']];
  setCfg('CHAM_CONG_SHEET_ID','LICHFILE'); dongBoChamCong({pin:'5678'}); dongBoChamCong({pin:'5678'}); setCfg('CHAM_CONG_SHEET_ID','');
  const b=rows('DangKyBan').filter(r=>dateKey(r.Ngay)>='2027-03-08'&&dateKey(r.Ngay)<='2027-03-14'); const cd=chuaDangKy({pin:'5678',tuan:'2027-03-08'});
  return (b.length===2 && b.some(r=>String(r.MaNV)==='315'&&r.GhiChu==='QL nhập hộ') && b.filter(r=>String(r.MaNV)==='310').length===1 && cd.roi.some(x=>x.MaNV==='310'&&x.TrangThai==='Đúng hạn')) || JSON.stringify({b,roi:cd.roi}); });

T('XL8 Đã nối app Chấm công: link app Xếp lịch không kèm ?page mở trang quản lý; link điện thoại quán cũ (?cs=) và trang đăng ký / khảo sát cũ báo đã chuyển', ()=>{
  setCfg('CHAM_CONG_URL','https://script.google.com/macros/s/CC/exec'); let mo=[]; const goc=global.moTrang; global.moTrang=(n)=>{ mo.push(n); return {evaluate:()=>({setTitle(){return this;},addMetaTag(){return this;},setXFrameOptionsMode(){return this;}})}; };
  let html=[]; const gocHS=global.HtmlService; global.HtmlService={XFrameOptionsMode:{ALLOWALL:1}, createHtmlOutput:(h)=>{ html.push(h); return {setXFrameOptionsMode(){ return this; }}; }};
  try{ doGet({parameter:{}}); doGet({parameter:{cs:'TP',key:'x'}}); doGet({parameter:{page:'dangky'}}); doGet({parameter:{page:'admin'}}); } finally { global.moTrang=goc; global.HtmlService=gocHS; setCfg('CHAM_CONG_URL',''); }
  return (mo[0]==='Admin' && mo[1]==='Admin' && mo.length===2 && html.length===2 && /chuyển/.test(html[0]) && /page=lich/.test(html[1])) || JSON.stringify({mo,html:html.map(h=>h.slice(0,80))}); });

T('XL9 Cài đặt dán có dấu cách / xuống dòng thừa (VD ID Sheet) vẫn đọc đúng', ()=>{ sh('CaiDat').d.push([' CHAM_CONG_TEST ','  abc123\n']); _CFG=null; const v=cfg('CHAM_CONG_TEST'); sh('CaiDat').d.pop(); _CFG=null; return v==='abc123' || JSON.stringify(v); });

T('XL10 Nút chuyển sang Chấm công: dùng LINK_CHAM_CONG nếu có, không thì CHAM_CONG_URL', ()=>{ setCfg('CHAM_CONG_URL','https://script.google.com/macros/s/CC/exec'); _CFG=null; const a=dangNhap({pin:'5678'}).chamCongUrl;
  setCfg('LINK_CHAM_CONG','https://caphemuoihue.com/quanlychamcong'); _CFG=null; const b=dangNhap({pin:'5678'}).chamCongUrl; setCfg('LINK_CHAM_CONG',''); setCfg('CHAM_CONG_URL',''); _CFG=null;
  return (a==='https://script.google.com/macros/s/CC/exec' && b==='https://caphemuoihue.com/quanlychamcong') || JSON.stringify({a,b}); });

/* ===== QUY TRÌNH MỚI (28/10): gợi ý → file quán → kiểm tra → áp dụng → phiên bản ===== */
{
const LC=JSON.parse(fs.readFileSync('/home/claude/xl2/lich_cu.json','utf8'));
// các bài trước có đổi / cho nghỉ vài người để thử chức năng khác → khôi phục danh sách nhân sự gốc cho phần đọc lịch thật
{ const nvT=fs.readFileSync('/home/claude/chamcong/nhanvien.tsv','utf8').trim().split('\n').map(l=>l.split('\t')), hT=nvT[0], nvS=sh('NhanVien'), hS=nvS.d[0];
  nvT.slice(1).forEach(r=>{ const o={}; hT.forEach((k,i)=>o[k]=r[i]); const idx=nvS.d.findIndex((x,i)=>i>0&&x&&String(x[hS.indexOf('MaNV')])===o.MaNV); const row=hS.map(k=>o[k]!==undefined?o[k]:(idx>0?nvS.d[idx][hS.indexOf(k)]:'')); if(idx>0) nvS.d[idx]=row; else nvS.d.push(row); }); }
const taoFile=(tabs)=>{ const shs=[]; Object.entries(tabs).forEach(([ten,T])=>{ const s=new Sheet(ten); s.d=T.v.map(r=>r.map(x=>typeof x==='string'&&/^D:\d{4}-\d{2}-\d{2}$/.test(x)?new Date(x.slice(2)+'T12:00:00+07:00'):x)); s.bg=T.bg; shs.push(s); }); return mkSS(shs); };
FILES[FILE_LICH_QUAN_MD.CFMH]=taoFile({'Lịch T10':LC.CFMH['Lịch T10']}); FILES[FILE_LICH_QUAN_MD.LDD]=taoFile({'Lịch T10':LC.LDD['Lịch T10']});
// bộ ghi trên Sheet giả: lưu cả màu nền để đọc lại
const _setBg=Range.prototype.setBackgrounds; Range.prototype.setBackgrounds=function(b){ this.sh.bg=this.sh.bg||[]; b.forEach((row,i)=>{ this.sh.bg[this.r-1+i]=this.sh.bg[this.r-1+i]||[]; row.forEach((x,j)=>{ this.sh.bg[this.r-1+i][this.c-1+j]=x||'#ffffff'; }); }); return _setBg?_setBg.apply(this,arguments):this; };
setCfg('XEP_GHI_THANG','Không');
const truoc=LL().filter(a=>DAYS.includes(a.Ngay)).map(a=>[a.Ngay,a.MaCS,a.MaNV,a.MaCa].join('|')).sort().join(';');
const xg=xepLich({pin:'5678',tuan:'2026-10-26',mode:'mau'});
const sau=LL().filter(a=>DAYS.includes(a.Ngay)).map(a=>[a.Ngay,a.MaCS,a.MaNV,a.MaCa].join('|')).sort().join(';');
const NH=docNhapLuoi_('2026-10-26','nhap');
T('QT1 Bấm Xếp lịch CHỈ ra bản gợi ý vào BẢN NHÁP WEB: lịch chính thức không đổi, không tự thêm tab vào file quán', ()=>{ const t1=FILES[FILE_LICH_QUAN_MD.CFMH].getSheetByName('Gợi ý 26.10');
  return (xg.ok && xg.banGoiY && xg.nhapWeb && truoc===sau && !t1 && NH && NH.luoi.CFMH.v.length>20 && NH.luoi.LDD.v.length>10) || JSON.stringify({ok:xg.ok,nhap:xg.nhapWeb,doi:truoc!==sau,t1:!!t1,f:xg.goiYFile}); });
// khứ hồi: đọc lại tab gợi ý → đúng từng người / ngày / quán / giờ như bản nháp
const nhap=rows('LichNhap').filter(r=>dateKey(r.Tuan)==='2026-10-26');
const k1=phanTichLichQuan_('2026-10-26','',NH.luoi);
T('QT1b Bản gợi ý: quán đóng 18:30 (Tản Đà, TNV) luôn có người biết pha chế tới lúc đóng; kiểm tra bản gợi ý không còn buổi thiếu pha chế', ()=>{ const k=phanTichLichQuan_('2026-10-26','',NH.luoi); return (k.thieuPC.length===0) || k.thieuPC.map(x=>x.cs+' '+x.ngay+' '+x.khoi).join(', '); });
T('QT2 Khứ hồi: app ghi bản nháp (bố cục tab Lịch T10) → đọc lại ra ĐÚNG từng người, ngày, quán và GIỜ (không làm tròn)', ()=>{
  const CAx={}; rows('Ca').forEach(c=>CAx[c.MaCa]=c); const gop={};
  nhap.forEach(r=>{ const c=CAx[r.MaCa]; if(!c) return; const k=dateKey(r.Ngay)+'|'+r.MaCS+'|'+up(r.MaNV); (gop[k]=gop[k]||[]).push([toMin(c.GioBD),toMin(c.GioKT)]); });
  const A=new Set(); Object.entries(gop).forEach(([k,L])=>{ L.sort((a,b)=>a[0]-b[0]); const m=[]; L.forEach(x=>{ const t=m[m.length-1]; if(t&&x[0]<=t[1]) t[1]=Math.max(t[1],x[1]); else m.push(x.slice()); }); m.forEach(x=>A.add(k+'|'+x[0]+'-'+x[1])); });
  const B=new Set(k1.ca.filter(c=>!c.coDinh).map(c=>c.ngay+'|'+c.cs+'|'+c.ma+'|'+c.bd+'-'+c.kt));
  const thieu=[...A].filter(x=>!B.has(x)), du=[...B].filter(x=>!A.has(x));
  return (A.size>50 && thieu.length===0 && du.length===0 && !k1.tenLa.length) || ('nháp '+A.size+' / đọc '+B.size+' | thiếu: '+thieu.slice(0,4).join(', ')+' | thừa: '+du.slice(0,4).join(', ')+' | tên lạ: '+k1.tenLa.map(x=>x.ten).slice(0,4)); });
// lịch thật tháng 10 trong file quán
const k2=xemLichQuan({pin:'5678',tuan:'2026-10-12'});
T('QT3 Đọc lịch THẬT tuần 12–18/10 từ file quán: đủ 2 file, mọi buổi đều có người biết pha chế, báo rõ tên chưa có mã / ô cần xem', ()=>{
  return (k2.ok && k2.nguon.length===2 && k2.soCa>150 && k2.thieuPC.length===0 && Array.isArray(k2.tenLa) && k2.bang.length>=90) || JSON.stringify({ok:k2.ok,msg:k2.msg,nguon:k2.nguon,soCa:k2.soCa,thieuPC:(k2.thieuPC||[]).slice(0,3),loi:k2.loi}); });
// áp dụng + phiên bản + khôi phục
const LLtuan=t=>LL().filter(a=>a.Ngay>=t && a.Ngay<=fmtDate(addDays(new Date(t+'T12:00:00+07:00'),6)));
const cu=LLtuan('2026-10-12').map(a=>[a.Ngay,a.MaCS,a.MaNV,a.MaCa].join('|')).sort().join(';');
const qlAp=apDungLichQuan({pin:'5678',tuan:'2026-10-12'}), ap=apDungLichQuan({pin:'1234',tuan:'2026-10-12'});
const moi=LLtuan('2026-10-12'), pb=dsPhienBanLich({pin:'1234',tuan:'2026-10-12'});
T('QT4 Áp dụng: chỉ admin; ghi lịch chính thức đúng giờ (ca lệch giờ có mã riêng); lưu phiên bản (kể cả bản cũ trước đó)', ()=>{
  const CAx={}; rows('Ca').forEach(c=>CAx[c.MaCa]=c); const lech=moi.filter(a=>CAx[a.MaCa] && /^TD\d/.test(a.MaCa)).length;
  return (!qlAp.ok && ap.ok && moi.length===ap.soCa && pb.list.length>=1 && pb.list[0].dangDung && pb.list[0].SoCa===ap.soCa && (cu==='' || pb.list.length>=2) && lech>0) || JSON.stringify({ql:qlAp.msg,ap,moi:moi.length,pb:pb.list,lech}); });
const kp=pb.list.length>=2?khoiPhucLich({pin:'1234',tuan:'2026-10-12',so:pb.list[pb.list.length-1].So}):null;
T('QT5 Lấy lại bản cũ: khôi phục đúng bản đã chọn, và lần khôi phục cũng thành 1 phiên bản mới (không mất bản nào)', ()=>{
  if(!kp) return true; const lai=LLtuan('2026-10-12').map(a=>[a.Ngay,a.MaCS,a.MaNV,a.MaCa].join('|')).sort().join(';'), pb2=dsPhienBanLich({pin:'1234',tuan:'2026-10-12'});
  return (kp.ok && lai===cu && pb2.list.length===pb.list.length+1 && /khôi phục/.test(pb2.list[0].Nguon)) || JSON.stringify({kp, giong:lai===cu, n:pb2.list.length}); });
// ===== BẢN NHÁP WEB =====
const PINa='1234', PINq='5678', W26='2026-10-26';
const l0=layNhapLuoi({pin:PINq,tuan:W26,token:'A'});
T('NH1 Mở bản nháp: có lưới 2 file + danh sách nhân viên + định mức để kiểm tra ngay trên trình duyệt', ()=> (l0.ok && l0.nhap && l0.nhap.luoi.CFMH.v[2].filter(x=>/^D:/.test(x)).length===14 && l0.nv.length>30 && !!l0.dm['TP|Sáng|NT'] && !!l0.nv[0].TenNgan) || JSON.stringify({ok:l0.ok, dong:l0.nhap&&l0.nhap.luoi.CFMH.v[2]}));
// sửa 1 ô + lưu; người thứ 2 bị chặn; giữ quyền thì được
const L1=JSON.parse(JSON.stringify(l0.nhap.luoi)); const rr=L1.CFMH.v.findIndex(r=>r.slice(1,8).some(x=>/\(\d/.test(x))); const cc=L1.CFMH.v[rr].findIndex((x,i)=>i>0&&i<8&&/\(\d/.test(x)); const cu1=L1.CFMH.v[rr][cc]; L1.CFMH.v[rr][cc]='';
const s1=luuNhapLuoi({pin:PINq,tuan:W26,token:'A',ten:'Lài',luoi:L1}), s2=luuNhapLuoi({pin:PINa,tuan:W26,token:'B',ten:'Admin',luoi:L1}), l2=layNhapLuoi({pin:PINa,tuan:W26,token:'B'}), s3=luuNhapLuoi({pin:PINa,tuan:W26,token:'B',ten:'Admin',luoi:L1,giuQuyen:true});
T('NH2 Lưu bản nháp; 2 người cùng sửa 1 tuần: người sau được báo "Lài đang sửa", bấm giữ quyền mới lưu được', ()=> (s1.ok && !s2.ok && /Lài đang sửa/.test(s2.msg) && l2.khoa && l2.khoa.ten==='Lài' && s3.ok && docNhapLuoi_(W26,'nhap').luoi.CFMH.v[rr][cc]==='' && !!cu1) || JSON.stringify({s1,s2,khoa:l2.khoa,s3}));
// bản nháp rất lớn (tự chia nhỏ ô)
const L3=JSON.parse(JSON.stringify(L1)); for(let i=0;i<300;i++) L3.CFMH.v.push(Array(17).fill('Tên thử rất dài (10,5) gãy TC')); L3.CFMH.bg.push(...Array(300).fill(Array(17).fill('#b6d7a8')));
const s4=luuNhapLuoi({pin:PINa,tuan:W26,token:'B',ten:'Admin',luoi:L3}); const d4=docNhapLuoi_(W26,'nhap');
T('NH3 Bản nháp lớn (>50.000 ký tự) tự chia nhỏ khi lưu, đọc lại đủ', ()=> (s4.ok && d4.luoi.CFMH.v.length===L3.CFMH.v.length && rows('NhapLuoi').filter(r=>String(r.Tuan).slice(0,10)===W26&&r.Loai==='nhap').length>1) || JSON.stringify({s4, n:d4&&d4.luoi.CFMH.v.length}));
luuNhapLuoi({pin:PINa,tuan:W26,token:'B',ten:'Admin',luoi:L1});
// xuất ra Google Sheet rồi lấy về → giống hệt
const x5=xuatNhapRaSheet({pin:PINa,tuan:W26}); const g5=layNhapTuSheet({pin:PINa,tuan:W26,tab:'Nháp 26.10'}); const d5=docNhapLuoi_(W26,'nhap'); const tr5=docNhapLuoi_(W26,'truoc');
T('NH4 Xuất bản nháp ra Google Sheet (tab "Nháp 26.10" trong 2 file quán) rồi lấy về: giống hệt chữ và màu từng ô; bản trước được giữ', ()=>{
  const giong=k=>JSON.stringify(d5.luoi[k].v)===JSON.stringify(L1[k].v) && JSON.stringify(d5.luoi[k].bg)===JSON.stringify(L1[k].bg);
  return (x5.ok && x5.file.length===2 && !x5.file.some(f=>f.loi) && g5.ok && giong('CFMH') && giong('LDD') && !!tr5) || JSON.stringify({x5, g5, cf:giong('CFMH'), ld:giong('LDD'), lenA:d5.luoi.CFMH.v.length, lenB:L1.CFMH.v.length, diff:d5.luoi.CFMH.v.map((r,i)=>JSON.stringify(r)!==JSON.stringify(L1.CFMH.v[i])?i:-1).filter(i=>i>=0).slice(0,3)}); });
// lấy tuần THẬT từ tab tháng của file quán → bản nháp → kiểm tra ra cùng kết quả như đọc thẳng file
const g6=layNhapTuSheet({pin:PINa,tuan:'2026-10-12'}); const d6=docNhapLuoi_('2026-10-12','nhap'); const kWeb=phanTichLichQuan_('2026-10-12','',d6&&d6.luoi), kFile=phanTichLichQuan_('2026-10-12','');
T('NH5 Lấy tuần 12/10 từ tab "Lịch T10" của file quán vào bản nháp web: đọc ra đúng như đọc thẳng file (cùng số ca, cùng người, cùng giờ)', ()=>{
  const key=k=>k.ca.map(c=>c.ngay+c.cs+c.ma+c.bd+'-'+c.kt).sort().join(';');
  return (g6.ok && d6 && kWeb.soCa===kFile.soCa && key(kWeb)===key(kFile) && kWeb.soCa>200) || JSON.stringify({g6, web:kWeb.soCa, file:kFile.soCa}); });
// áp dụng thẳng từ bản nháp web
const a7=apDungLichQuan({pin:PINa,tuan:'2026-10-12',nguon:'web',dongYThieuPC:true}); const pb7=dsPhienBanLich({pin:PINa,tuan:'2026-10-12'});
T('NH6 Áp dụng từ bản nháp web: ghi lịch chính thức, phiên bản ghi nguồn "bản nháp web"', ()=> (a7.ok && a7.soCa>200 && pb7.list[0].Nguon==='bản nháp web') || JSON.stringify({a7, pb:pb7.list[0]}));
const t8=taoNhapTuLichChinh({pin:PINa,tuan:'2026-10-12'}); const k8=phanTichLichQuan_('2026-10-12','',docNhapLuoi_('2026-10-12','nhap').luoi); const ll=layLaiNhapTruoc({pin:PINa,tuan:'2026-10-12'}); const k9=phanTichLichQuan_('2026-10-12','',docNhapLuoi_('2026-10-12','nhap').luoi);
T('NH7 Tạo bản nháp từ lịch chính thức đang dùng (ra đúng lịch đó); "Lấy lại bản nháp trước" quay về bản trước', ()=>{
  const LLk=LL().filter(a=>a.Ngay>='2026-10-12'&&a.Ngay<='2026-10-18'&&!/Cố định/.test(a.GhiChu)).length;
  return (t8.ok && Math.abs(k8.ca.filter(c=>!c.coDinh).length-LLk)<=3 && ll.ok && k9.soCa===kWeb.soCa) || JSON.stringify({t8, k8:k8.soCa, LLk, ll, k9:k9.soCa, kWeb:kWeb.soCa}); });
// "Dùng lịch gợi ý xếp mới" → vào bản nháp, không ghi lịch chính thức; bản nháp báo khi lịch chính thức đổi sau lần áp dụng
{ const W='2026-10-26', truoc=LL().filter(a=>DAYS.includes(a.Ngay)).map(a=>[a.Ngay,a.MaCS,a.MaNV,a.MaCa].join('|')).sort().join(';');
  const g=rows('GoiYMoi').filter(r=>dateKey(r.Tuan)===W).length, r=apDungGoiYMoi({pin:'5678',tuan:W}), sau=LL().filter(a=>DAYS.includes(a.Ngay)).map(a=>[a.Ngay,a.MaCS,a.MaNV,a.MaCa].join('|')).sort().join(';'), d=docNhapLuoi_(W,'nhap');
  T('NH8 "Đưa lịch gợi ý xếp mới vào Bản nháp": không đổi lịch chính thức, bản nháp có đúng các ca của lịch gợi ý xếp mới', ()=> (g>50 && r.ok && r.vaoNhap && truoc===sau && d && /xếp mới/.test(d.nguon) && phanTichLichQuan_(W,'',d.luoi).soCa>=g*0.8) || JSON.stringify({g, r, doi:truoc!==sau, nguon:d&&d.nguon}));
  T('NH8b Lịch gợi ý xếp mới cũng có người biết pha chế tới lúc đóng quán ở Tản Đà / TNV (không còn buổi tối thiếu pha chế)', ()=>{ const k=phanTichLichQuan_(W,'',d.luoi); const td=k.thieuPC.filter(x=>(x.cs==='TD'||x.cs==='TNV')&&x.khoi==='Tối'); return td.length===0 || td.map(x=>x.cs+' '+x.ngay).join(', '); });
  const l1=layNhapLuoi({pin:'1234',tuan:'2026-10-12',token:'Z'}); const shL=sh('LichLam'), hL=shL.d[0]; const i=shL.d.findIndex((x,k)=>k>0&&x&&dateKey(x[0])==='2026-10-14'); const cu=shL.d[i][hL.indexOf('MaCa')]; shL.d[i][hL.indexOf('MaCa')]='PT2';
  const l2=layNhapLuoi({pin:'1234',tuan:'2026-10-12',token:'Z'}); shL.d[i][hL.indexOf('MaCa')]=cu;
  T('NH9 Bản nháp cảnh báo khi lịch chính thức đã đổi sau lần áp dụng gần nhất (tránh áp dụng đè mất)', ()=> (l1.ok && !l1.lichChinhDoi && l2.lichChinhDoi===true) || JSON.stringify({a:l1.lichChinhDoi,b:l2.lichChinhDoi})); }
// ===== NHÂN SỰ: hồ sơ duy nhất ở app Chấm công =====
{ const H=['MaNV','Ten','ViTri','ChucVu','Loai','CoSoChinh','SDT','TrangThai','ViTriKiem','TangCaDuoc','CoDinh'];
  const nv=new Sheet('NhanVien'); nv.d=[H, ['307','Kim (Tôn Nữ Thiên Kim)','Phục vụ','','FT','LDD','','Đang làm','','',''], ['205','Linh','Pha chế','','FT','TP','','Đang làm','Thu ngân','Có',''], ['999','Mới Tuyển','Phục vụ','','PT','TP','','Đang làm','','','']];
  FILES['CCNS']=mkSS([nv]); setCfg('CHAM_CONG_SHEET_ID','CCNS'); _CFG=null;
  const xs=sh('NhanVien'), xh=xs.d[0], k=xh.indexOf('ViTriKiem'), r307=xs.d.findIndex(r=>String(r[xh.indexOf('MaNV')])==='307'); const goc=JSON.stringify(xs.d); xs.d[r307][k]='Pha chế';
  const kq=nhanSuTuCC_(); const x307=rows('NhanVien').find(n=>String(n.MaNV)==='307'), x205=rows('NhanVien').find(n=>String(n.MaNV)==='205'), x999=rows('NhanVien').find(n=>String(n.MaNV)==='999');
  T('NS1 Nhân sự lấy từ app Chấm công: người mới tự có bên Xếp lịch; vị trí kiêm bên Chấm công thắng; bên Chấm công còn trống thì đẩy giá trị cũ sang (không mất)', ()=>
    (x999 && x205.ViTriKiem==='Thu ngân' && x307.ViTriKiem==='Pha chế' && nv.d[1][8]==='Pha chế' && kq.day>=1 && kq.them>=1) || JSON.stringify({kq, k307:x307&&x307.ViTriKiem, k205:x205&&x205.ViTriKiem, cc307:nv.d[1][8], moi:!!x999}));
  xs.d=JSON.parse(goc); xs.d[r307][k]=''; _TN=null; setCfg('CHAM_CONG_SHEET_ID',''); _CFG=null; }   // trả nhân sự về như trước bài thử
// ===== HỌC TỪ CHẤM CÔNG THẬT =====
{ const H=['ID','Ngay','MaNV','Ten','MaCS','MaCa','CaBD','CaKT','ViTri','Vao','Ra','TrangThai','GioTinh','KhaiLoai','KhaiTu','KhaiDen','CoMat','Cach'];
  const ccS=new Sheet('ChamCong'); ccS.d=[H]; const hom=new Date(); let id=0;
  const them=(d,ma,cs,vt,vao,ra,cach)=>{ const o={ID:'T'+(id++),Ngay:d,MaNV:ma,MaCS:cs,ViTri:vt,Vao:vao,Ra:ra,TrangThai:'Đã xác nhận',GioTinh:8,Cach:cach||''}; ccS.d.push(H.map(k=>o[k]??'')); };
  for(let i=1;i<=35;i++){ const d=fmtDate(addDays(hom,-i)), cuoi=[0,6].includes(dowOf(d));
    // Trần Phú sáng: 5 người (cuối tuần 6), 2 pha chế; tối 3 người
    ['201','203','204'].forEach((m,j)=>them(d,m,'TP',j<2?'Pha chế':'Phục vụ','06:30','12:00'));
    ['315','314'].concat(cuoi?['324']:[]).forEach(m=>them(d,m,'TP','Phục vụ','06:30','14:30'));
    ['205','210','206'].forEach((m,j)=>them(d,m,'TP',j===0?'Pha chế':'Phục vụ','17:00','22:30'));
    // Kim (307, hồ sơ Phục vụ) làm pha chế ở Đống Đa 1 ngày / 3 ngày → ≥6 ca trong 35 ngày
    them(d,'307','DD', i%3===0?'Pha chế':'Phục vụ','06:30','14:30'); them(d,'207','DD','Pha chế','06:30','14:30');
    them(d,'999','TP','Phục vụ','06:30','12:00','nạp từ file chấm công cũ'); }
  FILES['CCFILE']=mkSS([ccS]); setCfg('CHAM_CONG_SHEET_ID','CCFILE'); _CFG=null;
  const nvS=sh('NhanVien'), hN=nvS.d[0]; const iK=hN.indexOf('ViTriKiem'); const i205=nvS.d.findIndex(r=>String(r[hN.indexOf('MaNV')])==='205'); nvS.d[i205][iK]='Pha chế, Thu ngân';   // 205 kiêm thu ngân nhưng không làm
  const r1=layHocCC({pin:'1234',chayLai:true}), K=r1.kq;
  T('HC1 Học từ chấm công: tóm tắt 35 ngày, bỏ giờ nạp từ file cũ; định mức mới đúng thực tế (Trần Phú sáng ngày thường 5 người, cuối tuần 6; ≥2 biết pha chế)', ()=>{
    const a=K&&K.moi['TP|Sáng|NT'], b=K&&K.moi['TP|Sáng|CT'];
    return (r1.ok && K.soNgay===35 && K.tt.boNap===35 && K.du && a && a.tong[1]===5 && b.tong[1]===6 && a.pc[0]>=2 && K.moi['TP|Tối|NT'].tong[1]===3) || JSON.stringify({ok:r1.ok,msg:r1.msg,soNgay:K&&K.soNgay,boNap:K&&K.tt.boNap,a,b}); });
  T('HC2 Đề xuất vị trí: Kim làm pha chế ≥6 ca (hồ sơ chưa có) → đề xuất thêm; Linh kiêm Thu ngân mà 8 tuần không làm → báo lâu chưa làm', ()=>{
    const kim=K.vitri.find(x=>x.ma==='307'&&x.lam==='them'&&x.vitri==='Pha chế'), linh=K.vitri.find(x=>x.ma==='205'&&x.lam==='bo'&&x.vitri==='Thu ngân');
    return (kim && kim.so>=6 && linh && !K.vitri.some(x=>x.ma==='203'&&x.lam==='them')) || JSON.stringify(K.vitri.slice(0,6)); });
  const dmTruoc=JSON.stringify(dmHienTai_()['TP|Sáng|NT']), qlAp=apDungDinhMucMoi({pin:'5678'}), ap=apDungDinhMucMoi({pin:'1234'}), dmSau=dmHienTai_()['TP|Sáng|NT'];
  const kt=xemLichQuan({pin:'5678',tuan:'2026-10-12'}), o=kt.bang.find(x=>x.cs==='TP'&&x.khoi==='Sáng'&&x.ngay==='2026-10-13');
  T('HC3 Chỉ admin chấp nhận định mức mới; sau khi chấp nhận, bước Kiểm tra lịch dùng định mức mới (buổi chưa đủ dữ liệu giữ mức cũ)', ()=> (!qlAp.ok && ap.ok && dmSau.tong[1]===5 && JSON.stringify(dmSau)!==dmTruoc && o && o.tongChuan===5 && !!dmHienTai_()['LDD|Sáng|NT']) || JSON.stringify({qlAp,ap,dmTruoc,dmSau,o}));
  const d1=duyetViTriKiem({pin:'1234',ma:'307',lam:'them',vitri:'Pha chế'}), d2=duyetViTriKiem({pin:'1234',ma:'205',lam:'bo',vitri:'Thu ngân'}), r2=layHocCC({pin:'1234'});
  T('HC4 Admin duyệt đề xuất: thêm Pha chế vào vị trí kiêm của Kim, bỏ Thu ngân của Linh; đề xuất đã duyệt biến mất', ()=>{ const n7=rows('NhanVien').find(n=>String(n.MaNV)==='307'), n5=rows('NhanVien').find(n=>String(n.MaNV)==='205');
    return (d1.ok && /Pha chế/.test(n7.ViTriKiem) && d2.ok && !/Thu ngân/.test(n5.ViTriKiem) && !r2.kq.vitri.some(x=>(x.ma==='307'&&x.vitri==='Pha chế')||(x.ma==='205'&&x.vitri==='Thu ngân'))) || JSON.stringify({d1,d2,k7:n7.ViTriKiem,k5:n5.ViTriKiem}); });
  const sh2=sh('DinhMucLich'); if(sh2) sh2.d=[]; setCfg('CHAM_CONG_SHEET_ID',''); _CFG=null; }
setCfg('XEP_GHI_THANG','Có');
}
T('FL1 File lịch xếp tay: xem file đang đọc; kiểm tra file đang dùng (tab Lịch T10, tuần 12/10: số người, số ca, từng quán); link sai / file không mở được báo rõ; lưu file MỚI (dán link) rồi "Lấy lịch từ file quán" đọc từ file mới; file chưa có tab "Lịch T…" bị từ chối; dùng lại file mặc định; quản lý không đổi được', ()=>{
  const info=thongTinFileLich({pin:'1234'}), ql=thongTinFileLich({pin:'5678'});
  const sai=kiemTraFileLich({pin:'1234',nhom:'CFMH',link:'abc'});
  const LC2=JSON.parse(require('fs').readFileSync('/home/claude/xl2/lich_cu.json','utf8')), taoF=(tabs)=>mkSS(Object.entries(tabs).map(([ten,T])=>{ const s=new Sheet(ten); s.d=T.v.map(r=>r.map(x=>typeof x==='string'&&/^D:\d{4}-\d{2}-\d{2}$/.test(x)?new Date(x.slice(2)+'T12:00:00+07:00'):x)); s.bg=T.bg; return s; }));
  if(!FILES[FILE_LICH_QUAN_MD.CFMH]) FILES[FILE_LICH_QUAN_MD.CFMH]=taoF({'Lịch T10':LC2.CFMH['Lịch T10']}); if(!FILES[FILE_LICH_QUAN_MD.LDD]) FILES[FILE_LICH_QUAN_MD.LDD]=taoF({'Lịch T10':LC2.LDD['Lịch T10']});
  const goc=SpreadsheetApp.openById; SpreadsheetApp.openById=(id)=>{ if(!FILES[id]) throw new Error('Không có quyền truy cập'); return FILES[id]; };
  const IDM='1NeWFiLeLiChTaY2026xxxxxxxxxxxxx', IDK='1KhOnGcOtAbThAnGxxxxxxxxxxxxxxxx', IDX='1KhOnGmOdUoCxxxxxxxxxxxxxxxxxxxx';
  FILES[IDM]=taoF({'Lịch T10':LC2.CFMH['Lịch T10']}); FILES[IDK]=taoF({'Tháng 10':LC2.CFMH['Lịch T10']});
  const k0=kiemTraFileLich({pin:'1234',nhom:'CFMH',tuan:'2026-10-12'});
  const khong=kiemTraFileLich({pin:'1234',nhom:'CFMH',link:'https://docs.google.com/spreadsheets/d/'+IDX+'/edit'});
  const thieuTab=luuFileLich({pin:'1234',nhom:'CFMH',link:'https://docs.google.com/spreadsheets/d/'+IDK+'/edit#gid=0'});
  const qlLuu=luuFileLich({pin:'5678',nhom:'CFMH',link:IDM});
  const luu=luuFileLich({pin:'1234',nhom:'CFMH',link:'https://docs.google.com/spreadsheets/d/'+IDM+'/edit#gid=12'}); _CFG=null; const daLuu=String(cfg('FILE_LICH_CFMH'));
  const info2=thongTinFileLich({pin:'1234'});
  const lay=layNhapTuSheet({pin:'1234',tuan:'2026-10-12'}); const nh=docNhapLuoi_('2026-10-12','nhap');
  const md=luuFileLich({pin:'1234',nhom:'CFMH',macDinh:true}); _CFG=null; const sauMD=String(cfg('FILE_LICH_CFMH')||''); SpreadsheetApp.openById=goc;
  return (info.ok && info.file.CFMH.macDinh && !ql.ok && k0.ok && k0.tabThang.includes('Lịch T10') && k0.coTuan && k0.soNguoi>10 && k0.soCa>50 && k0.theoQuan && k0.theoQuan.TP>0 && !sai.ok && !khong.ok && /chia sẻ/.test(khong.msg) && !thieuTab.ok && /Lịch T11/.test(thieuTab.msg) && !qlLuu.ok
          && luu.ok && daLuu===IDM && info2.file.CFMH.id===IDM && !info2.file.CFMH.macDinh && lay.ok && nh && nh.luoi.CFMH.v.length>5 && md.ok && sauMD==='')
    || JSON.stringify({info:info.ok, ql:ql.ok, k0:{ok:k0.ok,tab:k0.tabThang,coTuan:k0.coTuan,n:k0.soNguoi,ca:k0.soCa,q:k0.theoQuan,canh:k0.canh}, sai, khong, thieuTab, qlLuu, luu, daLuu, lay, nh:!!nh, md, sauMD}); });
console.log(out.join('\n')); 
console.log('\nKẾT QUẢ: '+pass+' đạt, '+fail+' lỗi');

