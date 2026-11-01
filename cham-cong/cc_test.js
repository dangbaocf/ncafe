(0,eval)(fs.readFileSync(__CCDIR+'/dist/Code.gs','utf8'));   // kiểm thử đúng bản gộp anh dán
const out=[]; let pass=0, fail=0;
function T(name, fn){ let r; if(typeof _TKROWS!=='undefined') _TKROWS=null; if(typeof _LSL!=='undefined') _LSL=null; if(typeof _MEMO!=='undefined') _MEMO={}; try{ r=fn(); }catch(e){ r='LỖI '+e.message+' '+(e.stack||'').split('\n')[1]; } if(r===true){ pass++; out.push('✔ '+name); } else { fail++; out.push('✘ '+name+' — '+r); } }
CCSS.insertSheet('CaiDat').d=[['Key','Value'],['ADMIN_PIN','1234']]; CCSS.insertSheet('CoSo'); CCSS.insertSheet('Ca').d=[['MaCa','TenCa','GioBD','GioKT','SoGio','CoSo']];   // CoSo trống, Ca chỉ có tiêu đề   // giống lần chạy trước bị dừng giữa chừng: CaiDat có, CoSo trống
setup();
const sh=n=>CCSS.getSheetByName(n);
T('CC0 Chạy setup lại sau lần bị dừng giữa chừng: tab trống hoặc chỉ có tiêu đề được điền đủ, mọi dòng đủ cột', ()=> (rows('CoSo').length===5 && rows('Ca').length>=8 && sh('CoSo').d.every(r=>r.length===8) && rows('NhanVien').length>=60 && rows('TaiKhoan').length===2) || JSON.stringify(sh('CoSo').d));
// lịch đã xếp bên app Xếp lịch (chỉ đọc)
const L=XLSS.insertSheet('LichLam'); L.d=[['Ngay','MaCS','MaNV','MaCa','ViTri','GhiChu'],['2026-11-02','TP','313','PT1','Phục vụ',''],['2026-11-02','TP','201','FT1','Pha chế',''],['2026-11-02','DD','305','FT1','Phục vụ',''],['2026-11-02','TNV','601','PT1','Phục vụ','Support']];
setCfg('LICH_SHEET_ID','XL'); _LICH=null;
const tk=cs=>qrToken(cs);
T('CC1 Có đủ nhân viên, quán, ca sau cài đặt; mã nhân viên dạng chữ', ()=> rows('NhanVien').length>=60 && rows('CoSo').length===5 && rows('Ca').length>=11 || 'thiếu');
T('CC2 Mã QR cố định theo quán (không đổi theo tháng); mã sai / quán khác bị chặn; admin đổi mã thì mã cũ hết dùng', ()=>{ const t0=qrToken('TP'); at('2026-11-02','06:00'); const a=qrInfo({cs:'TP',t:t0}).ok; at('2027-03-15','06:00'); const b=qrInfo({cs:'TP',t:t0}).ok; fake=null;
  const c=qrInfo({cs:'TP',t:'x'}).ok, d=qrInfo({cs:'DD',t:t0}).ok, q=doiMaQR({pin:'5678',maCS:'TD'}); const tdCu=qrToken('TD'); doiMaQR({pin:'1234',maCS:'TD'}); const e=qrInfo({cs:'TD',t:tdCu}).ok, f=qrInfo({cs:'TD',t:qrToken('TD')}).ok;
  return (a&&b&&!c&&!d&&!q.ok&&!e&&f)||[a,b,c,d,q.ok,e,f].join(); });
T('CC3 Vào ca: lấy ca + vị trí từ lịch đã xếp; đi trễ quá 10 phút ghi số phút; điện thoại mới / không định vị bị đánh dấu', ()=>{ at('2026-11-02','06:45'); const i=qrNhanVien({cs:'TP',t:tk('TP'),maNV:'313',deviceId:'d313'}); const r=qrVao({cs:'TP',t:tk('TP'),maNV:'313',deviceId:'d313',photo:'data:image/jpeg;base64,AA',lat:'',lng:''}); fake=null;
  const row=rows('ChamCong').find(x=>String(x.MaNV)==='313'); return (i.ok && i.lich[0].MaCa==='PT1' && r.ok && r.tre===15 && row.MaCa==='PT1' && row.ViTri==='Phục vụ' && /Không lấy được định vị/.test(row.CanhBao) && /Điện thoại mới/.test(row.CanhBao)) || JSON.stringify({i,r,row}); });
T('CC4 Không có lịch: nhân viên phải chọn ca; có ca thì vào được', ()=>{ at('2026-11-02','06:33'); const a=qrVao({cs:'TP',t:tk('TP'),maNV:'321',deviceId:'d321'}); const b=qrVao({cs:'TP',t:tk('TP'),maNV:'321',deviceId:'d321',maCa:'PT1',viTri:'Phục vụ'}); fake=null; return (!a.ok && b.ok) || JSON.stringify([a,b]); });
T('CC5 Ra ca khai đúng ca, giờ khớp lịch → gắn khớp lịch, tạm tính đủ giờ ca, vẫn chờ quản lý duyệt', ()=>{ L.d.push(['2026-11-02','TP','321','PT1','Phục vụ','']); _LICH=null; at('2026-11-02','12:05'); const r=qrRa({cs:'TP',t:tk('TP'),maNV:'321',deviceId:'d321',khaiLoai:'dung'}); fake=null; const row=rows('ChamCong').find(x=>String(x.MaNV)==='321'); L.d.pop(); _LICH=null; return (r.ok && r.khopLich && row.TrangThai==='Chờ xác nhận' && +row.GioTinh===5.5) || JSON.stringify(row); });
T('CC6 Ra ca khai tăng ca → chờ quản lý xác nhận, tạm tính tối đa bằng giờ ca; quản lý xác nhận thì tính đúng số giờ đó', ()=>{ at('2026-11-02','13:40'); const r=qrRa({cs:'TP',t:tk('TP'),maNV:'313',deviceId:'d313',khaiLoai:'tang',khaiGio:'7',ghiChu:'đông khách'}); fake=null;
  let row=rows('ChamCong').find(x=>String(x.MaNV)==='313'); const tam=+row.GioTinh; const d=canDuyet({pin:'5678'}).list.some(x=>x.ID===row.ID); const x0=xuLy({pin:'5678',id:row.ID,viec:'xacNhan',gio:'6,5'}); const x=xuLy({pin:'1234',id:row.ID,viec:'xacNhan',gio:'6,5'}); row=rows('ChamCong').find(x=>String(x.MaNV)==='313');
  return (r.ok && r.trangThai==='Chờ xác nhận' && tam===5.5 && d && !x0.ok && x0.canQuyen && x.ok && row.TrangThai==='Đã xác nhận' && +row.GioTinh===6.5) || JSON.stringify({r,tam,d,row}); });
T('CC7 Khai đúng ca nhưng giờ chấm lệch hơn 30 phút → chuyển quản lý xem', ()=>{ at('2026-11-02','06:30'); qrVao({cs:'TP',t:tk('TP'),maNV:'201',deviceId:'d201'}); at('2026-11-02','13:30'); const r=qrRa({cs:'TP',t:tk('TP'),maNV:'201',deviceId:'d201',khaiLoai:'dung'}); fake=null; return (r.ok && r.trangThai==='Chờ xác nhận' && !r.tuXacNhan) || JSON.stringify(r); });
T('CC8 Quên chấm ra: hôm sau hiện "Quên chấm ra"; quản lý nhập giờ ra rồi xác nhận', ()=>{ at('2026-11-02','06:31'); qrVao({cs:'DD',t:tk('DD'),maNV:'305',deviceId:'d305'}); at('2026-11-03','08:00');
  const it=canDuyet({pin:'5678'}).list.find(x=>x.MaNV==='305'); const a0=xuLy({pin:'5678',id:it.ID,viec:'gioRa',ra:'14:30'}); const a=xuLy({pin:'1234',id:it.ID,viec:'gioRa',ra:'14:30'}); const b=xuLy({pin:'5678',id:it.ID,viec:'dungCa'}); fake=null; const row=rows('ChamCong').find(x=>String(x.MaNV)==='305');
  return (it.TrangThai==='Quên chấm ra' && !a0.ok && a.ok && b.ok && row.TrangThai==='Đã xác nhận' && +row.GioTinh===8) || JSON.stringify(row); });
T('CC9 Đã nghỉ việc thì không chấm công được', ()=>{ suaNhanVien({pin:'1234',maNV:'322',TrangThai:'Đã nghỉ'}); const r=qrNhanVien({cs:'TP',t:tk('TP'),maNV:'322',deviceId:'x'}); return (!r.ok && /nghỉ việc/.test(r.msg)) || JSON.stringify(r); });
T('CC10 Cấp mã nhân viên mới theo vị trí (pha chế 2xx, phục vụ 3xx…), trạng thái thử việc, chặn trùng tên', ()=>{ const a=themNhanVien({pin:'1234',ten:'Nguyễn Văn Mới',viTri:'Pha chế',loai:'PT',coSo:'TP',sdt:'0901234567'}); const b=themNhanVien({pin:'1234',ten:'Nguyễn Văn Mới',viTri:'Phục vụ'}); const n=nvByMa(a.maNV);
  return (a.ok && /^2\d\d$/.test(a.maNV) && n.TrangThai==='Thử việc' && !b.ok && /mã nhân viên Ncafe của bạn là/.test(a.tin)) || JSON.stringify({a,b}); });
T('CC14 Hôm nay & Lịch – chấm công: so với lịch, người có lịch chưa chấm hiện ra; người nhà (Support) trong lịch không tính', ()=>{ at('2026-11-02','09:00'); const h=homNay({pin:'5678',ngay:'2026-11-02'}); const l=lichChamCong({pin:'5678',tuan:'2026-11-02'}); fake=null;
  return (h.ok && h.list.length>=3 && !h.chuaCham.some(c=>c.MaNV==='601') && l.ok && l.lich.length===3 && l.people.length>=3) || JSON.stringify({h:h.chuaCham,l:l.lich}); });
T('CC15 Chưa nối app Xếp lịch vẫn chấm công được (nhân viên chọn ca)', ()=>{ setCfg('LICH_SHEET_ID',''); _LICH=null; at('2026-11-05','06:30'); const i=qrNhanVien({cs:'TNV',t:tk('TNV'),maNV:'310',deviceId:'d'}); const r=qrVao({cs:'TNV',t:tk('TNV'),maNV:'310',deviceId:'d',maCa:'PT1',viTri:'Phục vụ'}); fake=null; setCfg('LICH_SHEET_ID','XL'); _LICH=null; return (i.ok && i.lich.length===0 && i.cas.length>5 && r.ok) || JSON.stringify({i,r}); });
T('CC16 Không vào ca 2 lần khi chưa ra; trang QR mở đúng file', ()=>{ at('2026-11-05','07:00'); const r=qrVao({cs:'TNV',t:tk('TNV'),maNV:'310',deviceId:'d',maCa:'PT1'}); fake=null; const g=doGet({parameter:{page:'qr',cs:'TP',t:'x'}}); return (!r.ok && /Ra ca trước/.test(r.msg)) || JSON.stringify(r); });

// ---------- L. Lương (admin) ----------
const H=sh('ChamCong').d[0]; let ID=0;
function addCC(ngay,ma,cs,maCa,vao,ra,gio,tt,extra){ const c=caMap()[maCa]; const o=Object.assign({ID:'T'+(++ID),Ngay:ngay,MaNV:ma,Ten:'x',MaCS:cs,MaCa:maCa,CaBD:c.GioBD,CaKT:c.GioKT,ViTri:'Phục vụ',Vao:vao,Ra:ra,TreMin:0,GioThuc:gio,KhaiLoai:'dung',KhaiGio:gio,TrangThai:tt||'Đã xong',GioTinh:gio},extra||{}); sh('ChamCong').d.push(H.map(k=>o[k]!==undefined?o[k]:'')); return o.ID; }
const A={pin:'1234'};
T('L1 Công thức như bảng cũ: Tổng nhận = giờ × lương giờ + cơm + giờ nghỉ có lương × lương giờ + phụ cấp + thưởng; Còn lại trừ tạm ứng, trừ lỗi; Thực nhận cộng thưởng thêm', ()=>{
  suaNhanVien({pin:'1234',maNV:'302',LuongGio:25,KieuLuong:'Giờ'});
  ['2026-12-01','2026-12-02','2026-12-03'].forEach(d=>addCC(d,'302','TP','FT1','06:30','14:30',8)); addCC('2026-12-04','302','TD','PT1','06:30','12:00',5.5);
  [['nghi',16],['pc',300],['thuong',300],['tru',20],['thuongThem',100]].forEach(x=>luuO({pin:'1234',thang:'2026-12',maNV:'302',muc:x[0],giaTri:x[1]}));
  themTamUng({pin:'1234',thang:'2026-12',maNV:'302',soTien:'500',ghiChu:'ứng giữa tháng',vanGhi:true});
  const x=bangLuong({pin:'1234',thang:'2026-12'}).list.find(o=>o.MaNV==='302'); const tn=29.5*25+3*20+16*25+300+300;   // 3 ngày 8h có cơm, ngày 5,5h không (quy tắc full time mặc định tắt)
  return (x.gio===29.5 && x.soSuat===3 && x.com===60 && x.tn===tn && x.con===tn-500-20 && x.thuc===tn-520+100 && x.theoCS.TP===24 && x.theoCS.TD===5.5 && x.ngayCS.TP===3) || JSON.stringify(x); });
T('L2 Tiền cơm chỉ theo tổng giờ đã duyệt trong ngày ≥ 8h: ca gãy 4,5h + 3,5h = 8h có; ca gãy 3h + 3h = 6h không; full time 5,5h không; 2 ô cũ (full time / ca gãy) bật cũng không còn tác dụng; mốc và giá sửa được', ()=>{
  addCC('2026-12-05','302','TP','PT1','06:30','11:00',4.5); addCC('2026-12-05','302','TP','PT3','17:00','20:30',3.5);
  addCC('2026-12-06','302','TP','PT1','06:30','09:30',3); addCC('2026-12-06','302','TP','PT3','19:30','22:30',3);
  luuCauHinh({pin:'1234',chon:{COM_FT_LUON:'Có',COM_NGAY_GAY:'Có'}}); _CFG=null; const a=bangLuong({pin:'1234',thang:'2026-12'}).list.find(o=>o.MaNV==='302');   // 3 ngày 8h + ngày gãy 8h = 4 suất
  luuCauHinh({pin:'1234',com:[{ViTri:'Phục vụ',Tu:9,Gia:25}]}); _CFG=null; const b=bangLuong({pin:'1234',thang:'2026-12'}).list.find(o=>o.MaNV==='302');
  luuCauHinh({pin:'1234',chon:{COM_FT_LUON:'Không',COM_NGAY_GAY:'Không'},com:[{ViTri:'Phục vụ',Tu:8,Gia:20}]}); _CFG=null;
  return (nvByMa('302').Loai==='FT' && a.soSuat===4 && a.comNgay['2026-12-04']===false && a.comNgay['2026-12-06']===false && a.comNgay['2026-12-05']===true && b.soSuat===0 && b.com===0) || JSON.stringify({a:a.soSuat,cn:a.comNgay,b:b.soSuat}); });
T('L3 Full time lương cố định: lương cơ bản ÷ ngày chuẩn = lương ngày; về sớm trừ theo giờ quy đổi; tăng ca đã xác nhận cộng theo giờ quy đổi', ()=>{
  suaNhanVien({pin:'1234',maNV:'201',KieuLuong:'Cố định',LuongCoBan:7800}); // 7.800k ÷ 26 = 300k/ngày ÷ 8h = 37,5k/giờ
  addCC('2026-12-01','201','TP','FT1','06:30','14:30',8); addCC('2026-12-02','201','TP','FT1','06:30','14:30',8); addCC('2026-12-03','201','TP','FT1','06:30','12:30',6,'Đã xác nhận');
  addCC('2026-12-04','201','DD','FT1','06:30','16:30',10,'Đã xác nhận');
  const x=bangLuong({pin:'1234',thang:'2026-12'}).list.find(o=>o.MaNV==='201'); const tien=4*300-2*37.5+2*37.5*1;
  return (x.KieuLuong==='Cố định' && x.luongNgay===300 && x.luongGioQD===37.5 && Math.abs(x.tienLuong-tien)<0.01 && x.ngay===3.75 && x.gioThieu===2 && x.gioTC===2) || JSON.stringify(x); });
T('L4 Hệ số tăng ca và ngày lễ điều chỉnh được (lương theo giờ)', ()=>{ suaNhanVien({pin:'1234',maNV:'303',LuongGio:20,KieuLuong:'Giờ'});
  addCC('2026-12-10','303','TP','PT1','06:30','14:00',7.5,'Đã xác nhận'); addCC('2026-12-24','303','TP','PT1','06:30','12:00',5.5);
  luuCauHinh({pin:'1234',heSo:{HE_SO_TANG_CA:1.5},ngayLe:[{Ngay:'2026-12-24',Ten:'Noel',HeSo:2}]}); _CFG=null;
  const x=bangLuong({pin:'1234',thang:'2026-12'}).list.find(o=>o.MaNV==='303'); luuCauHinh({pin:'1234',heSo:{HE_SO_TANG_CA:1},ngayLe:[]}); _CFG=null;
  const tien=13*20 + 2*20*0.5 + 5.5*20*1; return (x.gioTC===2 && Math.abs(x.tienLuong-tien)<0.01) || JSON.stringify({tl:x.tienLuong,tien,tc:x.gioTC}); });
T('L5 Thêm / bỏ mục lương: mục cộng vào Tổng nhận, mục trừ trừ khỏi Còn lại; bỏ mục có sẵn thì không tính; hiện lại được', ()=>{
  const a=themMucLuong({pin:'1234',ten:'Phụ cấp xăng',loai:'cong'}), b=themMucLuong({pin:'1234',ten:'Phạt đi trễ',loai:'tru'});
  luuO({pin:'1234',thang:'2026-12',maNV:'302',muc:a.ma,giaTri:150}); luuO({pin:'1234',thang:'2026-12',maNV:'302',muc:b.ma,giaTri:30});
  const x0=bangLuong({pin:'1234',thang:'2026-12'}).list.find(o=>o.MaNV==='302'); boMucLuong({pin:'1234',ma:'thuongThem'}); const x1=bangLuong({pin:'1234',thang:'2026-12'}).list.find(o=>o.MaNV==='302'); hienMucLuong({pin:'1234',ma:'thuongThem'}); boMucLuong({pin:'1234',ma:a.ma}); boMucLuong({pin:'1234',ma:b.ma});
  const x2=bangLuong({pin:'1234',thang:'2026-12'}).list.find(o=>o.MaNV==='302');
  return (x0.them[a.ma]===150 && x0.tn===x2.tn+150 && x0.con===x2.con+150-30 && x1.thuc===x1.con && x2.thuongThem===100) || JSON.stringify({x0:[x0.tn,x0.con],x2:[x2.tn,x2.con],x1:[x1.thuc,x1.con]}); });
T('L6 Tạm ứng ghi từng lần; ứng vượt số lương đã làm thì cảnh báo; Kiểm tra chốt báo CÒN LẠI âm', ()=>{ const r=themTamUng({pin:'1234',thang:'2026-12',maNV:'303',soTien:'5000'}); const r2=themTamUng({pin:'1234',thang:'2026-12',maNV:'303',soTien:'5000',vanGhi:true});
  const b=bangLuong({pin:'1234',thang:'2026-12'}); const ds=dsTamUng({pin:'1234',thang:'2026-12'}).list.filter(u=>u.MaNV==='303');
  return (!r.ok && r.canhBao && r2.ok && ds.length===1 && b.kiemTra.some(k=>k.muc==='CÒN LẠI âm' && /303/.test(k.ai))) || JSON.stringify({r,ds,k:b.kiemTra}); });
T('L7 Chốt tháng: có việc cần xem thì hỏi lại; chốt xong lưu tab bản chốt, khoá sửa lương và xử lý chấm công tháng đó; mở chốt được; nhật ký ghi lại', ()=>{
  const id=addCC('2026-12-06','302','TP','FT1','06:30','15:30',9,'Chờ xác nhận');
  const a=chotThang({pin:'1234',thang:'2026-12'}); const b=chotThang({pin:'1234',thang:'2026-12',boQua:true});
  const c=luuO({pin:'1234',thang:'2026-12',maNV:'302',muc:'thuong',giaTri:999}); const d=xuLy({pin:'5678',id:id,viec:'dungCa'}); const e=themTamUng({pin:'1234',thang:'2026-12',maNV:'302',soTien:1});
  const tab=sh('Lương 2026-12 (đã chốt)'); const m=moChot({pin:'1234',thang:'2026-12'}); const f=xuLy({pin:'5678',id:id,viec:'dungCa'});
  const nk=nhatKySua({pin:'1234',thang:'2026-12'}).list; 
  return (!a.ok && a.canKiemTra && b.ok && !c.ok && !d.ok && !e.ok && tab && tab.d.length>3 && m.ok && f.ok && nk.some(x=>x.Muc==='Chốt tháng') && nk.some(x=>x.Muc==='thuong')) || JSON.stringify({a:a.msg,b,c,d,e,m,f}); });
T('L8 Chọn đúng ca mà đi trễ → phải quản lý xác nhận hoặc điều chỉnh', ()=>{ const L=XLSS.getSheetByName('LichLam'); L.d.push(['2026-11-06','TP','313','PT1','Phục vụ','']); _LICH=null;
  at('2026-11-06','06:48'); qrVao({cs:'TP',t:tk('TP'),maNV:'313',deviceId:'d313'}); at('2026-11-06','12:02'); const r=qrRa({cs:'TP',t:tk('TP'),maNV:'313',deviceId:'d313',khaiLoai:'dung'}); fake=null;
  const row=rows('ChamCong').filter(x=>String(x.MaNV)==='313'&&dateKey(x.Ngay)==='2026-11-06')[0]; return (r.ok && r.trangThai==='Chờ xác nhận' && +row.TreMin===18) || JSON.stringify({r,row}); });
T('L9 Đợt giờ công: đợt chưa hết ngày / còn ca chờ thì không duyệt được; duyệt xong nhân viên mới xem được, không có tiền', ()=>{
  const sdt=String(nvByMa('302').SDT||'').replace(/\\D/g,'').slice(-4);
  at('2026-12-08','09:00'); const a=duyetDot({pin:'5678',thang:'2026-12',dot:1}); const v0=gioCongCuaToi({maNV:'302',sdt4:sdt,thang:'2026-12'});
  addCC('2026-12-09','302','TP','PT1','06:30','13:00',6.5,'Chờ xác nhận'); at('2026-12-12','09:00'); const b=duyetDot({pin:'5678',thang:'2026-12',dot:1});
  const pend=rows('ChamCong').filter(x=>dateKey(x.Ngay).slice(0,7)==='2026-12' && x.TrangThai==='Chờ xác nhận' && dateKey(x.Ngay)<='2026-12-10'); pend.forEach(x=>xuLy({pin:'5678',id:x.ID,viec:'dungCa'}));
  const c=duyetDot({pin:'5678',thang:'2026-12',dot:1}); const v1=gioCongCuaToi({maNV:'302',sdt4:sdt,thang:'2026-12'}); fake=null;
  const coTien=JSON.stringify(v1).match(/luong|tien|thuong/i);
  return (!a.ok && v0.ca.every(x=>x.DaDuyet?x.Gio!=null:x.Gio===null) && !b.ok && c.ok && v1.ca.length>=5 && !coTien && v1.dots[0].DaDuyet && !v1.dots[1].DaDuyet) || JSON.stringify({a:a.msg,b:b.msg,c,v1:v1.ca&&v1.ca.length}); });
T('L10 Tăng lương: lưu lịch sử, kỳ xét full time 6 tháng tính từ lần tăng gần nhất (hoặc ngày vào làm)', ()=>{ suaNhanVien({pin:'1234',maNV:'304',NgayVao:'2026-01-10',Loai:'FT',KieuLuong:'Giờ',LuongGio:23});
  const k0=kyTangLuong(nvByMa('304')); const r=tangLuong({pin:'1234',maNV:'304',mucMoi:'24',ghiChu:'kỳ 6 tháng',ngay:'2026-07-15'}); const k1=kyTangLuong(nvByMa('304'));
  const ds=dsNhanVien({pin:'1234'}).list.find(n=>n.MaNV==='304'), q=dsNhanVien({pin:'5678'});
  return (k0.ky==='2026-07-10' && k0.den && r.ok && r.cu===23 && k1.ky==='2027-01-15' && !k1.den && +nvByMa('304').LuongGio===24 && ds.LanTang.Len==24 && !q.ok) || JSON.stringify({k0,k1,r,ds}); });
T('L11 Xoá nhân viên: người đã có chấm công không xoá được (phải cho nghỉ việc); người thêm nhầm xoá được', ()=>{ const a=xoaNhanVien({pin:'1234',maNV:'302'}); const m=themNhanVien({pin:'1234',ten:'Thêm Nhầm',viTri:'Phục vụ'}); const b=xoaNhanVien({pin:'1234',maNV:m.maNV}); const c=xoaNhanVien({pin:'5678',maNV:'302'});
  return (!a.ok && b.ok && !nvByMa(m.maNV) && !c.ok) || JSON.stringify({a,b,c}); });
T('L12 Quyền: quản lý chấm công, xác nhận giờ, tra cứu giờ công (không tiền), xem mã QR; không xem lương, không quản lý nhân sự, không đổi mã / lưu vị trí; admin toàn quyền', ()=>{
  const f=['bangLuong','phieuLuong','cauHinhLuong','luongCoSo','dsTamUng','nhatKySua','dsNhanVien','themNhanVien','suaNhanVien','xoaNhanVien','doiMaQR','luuViTriQuan','tangLuong','caiDat','luuTaiKhoan','luuCa','luuQuan','luuCaiDatChung'].filter(f=>global[f]({pin:'5678',thang:'2026-12',maNV:'302',ten:'X',maCS:'TP',lat:1,lng:1,mucMoi:1,list:[{Ten:'A',PIN:'9999',VaiTro:'Admin'}],kv:{}}).ok);
  const g=['homNay','canDuyet','dsDot','lichChamCong','traCuuGioCong','dsMaQR','dsNhanVienGon'].filter(f=>!global[f]({pin:'5678',thang:'2026-12',maNV:'302'}).ok);
  const tc=traCuuGioCong({pin:'5678',thang:'2026-12',maNV:'302'}); const coTien=['tienLuong','tn','con','thuc','luong','com','lcb'].filter(k=>k in tc.nv);
  return (f.length===0 && g.length===0 && coTien.length===0 && tc.nv.gio>0 && tinNhanMa('302','5678')==='') || ('lọt: '+f.join()+' | thiếu: '+g.join()+' | tiền: '+coTien.join()); });
T('L15 Tài khoản: admin thêm quản lý và cấp quyền điều chỉnh giờ; quản lý được cấp quyền mới đổi được số giờ; phải còn ít nhất 1 admin, không trùng mã', ()=>{
  const id=addCC('2026-12-15','303','TP','PT1','06:30','13:30',7,'Chờ xác nhận',{KhaiLoai:'tang',KhaiGio:7});
  const a=luuTaiKhoan({pin:'1234',list:[{Ten:'QL TP',PIN:'5678',VaiTro:'Quản lý',SuaGio:'Không'}]});   // không còn admin
  const b=luuTaiKhoan({pin:'1234',list:[{Ten:'Admin',PIN:'1234',VaiTro:'Admin'},{Ten:'QL TP',PIN:'1234',VaiTro:'Quản lý'}]});   // trùng mã
  const x1=xuLy({pin:'5678',id:id,viec:'xacNhan',gio:'6.5'});
  const c=luuTaiKhoan({pin:'1234',list:[{Ten:'Admin',PIN:'1234',VaiTro:'Admin'},{Ten:'QL ĐĐ',PIN:'5678',VaiTro:'Quản lý',SuaGio:'Không'},{Ten:'QL TP',PIN:'2468',VaiTro:'Quản lý',SuaGio:'Có'}]});
  const x2=xuLy({pin:'2468',id:id,viec:'xacNhan',gio:'6.5'}); const row=rows('ChamCong').find(r=>r.ID===id); const dn=dangNhap({pin:'2468'});
  return (!a.ok && !b.ok && !x1.ok && c.ok && x2.ok && +row.GioTinh===6.5 && row.XacNhanBoi==='QL TP' && dn.role==='ql' && dn.suaGio) || JSON.stringify({a,b,x1,c,x2,dn}); });
T('L16 Admin chỉnh toàn bộ trong app: ca làm, quán, cài đặt chung (có ghi nhật ký)', ()=>{ const c0=caiDat({pin:'1234'});
  const a=luuCa({pin:'1234',list:c0.ca.concat([{MaCa:'PT5',TenCa:'Chiều ngắn',GioBD:'14:00',GioKT:'18:00',CoSo:'TD,TNV'}])}); const ca=caMap().PT5;
  const b=luuCa({pin:'1234',list:[{MaCa:'X',GioBD:'18:00',GioKT:'10:00'}]});
  const q=luuQuan({pin:'1234',list:[{MaCS:'TP',TenCS:'Trần Phú 1',BanKinh:150}]}); const s=rows('CoSo').find(x=>x.MaCS==='TP');
  const k=luuCaiDatChung({pin:'1234',kv:{TRE_PHUT:15,QR_SECRET:'hack'}}); _CFG=null;
  const nk=nhatKySua({pin:'1234'}).list.filter(x=>/Cài đặt/.test(x.Muc));
  luuQuan({pin:'1234',list:[{MaCS:'TP',TenCS:'Trần Phú',BanKinh:100}]}); luuCaiDatChung({pin:'1234',kv:{TRE_PHUT:10}}); _CFG=null;
  return (a.ok && ca && ca.SoGio===4 && caDung(ca,'TD') && !caDung(ca,'TP') && !b.ok && q.ok && s.TenCS==='Trần Phú 1' && +s.BanKinh===150 && k.ok && cfg('QR_SECRET')!=='hack' && nk.length>=3) || JSON.stringify({a,b,ca,s,k,nk:nk.length}); });
T('L13 Phiếu lương liên kết các cơ sở: công (ngày) và giờ từng quán', ()=>{ const p=phieuLuong({pin:'1234',thang:'2026-12',maNV:'302'}); return (p.ok && p.nv.ngayCS.TP>=4 && p.nv.theoCS.TD===5.5 && p.nv.ngayCS.TD===1) || JSON.stringify(p.nv&&[p.nv.ngayCS,p.nv.theoCS]); });


T('L14 Ca phát sinh: nhân viên tự điền giờ bắt đầu – kết thúc lúc vào ca; ra ca thì quản lý xác nhận', ()=>{ at('2026-11-07','15:10'); const a=qrVao({cs:'DD',t:tk('DD'),maNV:'303',deviceId:'d',maCa:'KHAC',gioBD:'15:00',gioKT:'14:00'});
  const b=qrVao({cs:'DD',t:tk('DD'),maNV:'303',deviceId:'d',maCa:'KHAC',gioBD:'15:00',gioKT:'19:00',viTri:'Phục vụ'}); at('2026-11-07','19:02'); const r=qrRa({cs:'DD',t:tk('DD'),maNV:'303',deviceId:'d',khaiLoai:'dung'}); fake=null;
  const row=rows('ChamCong').filter(x=>String(x.MaNV)==='303'&&dateKey(x.Ngay)==='2026-11-07')[0];
  return (!a.ok && b.ok && row.MaCa==='KHAC' && hhmm(row.CaBD)==='15:00' && hhmm(row.CaKT)==='19:00' && r.trangThai==='Chờ xác nhận' && +row.GioTinh===4) || JSON.stringify({a,b,r,row}); });


// ---------- KS. Khảo sát trong app Chấm công ----------
T('KS1 Khảo sát: danh sách chọn tên không lộ số điện thoại; xác minh 4 số cuối (hồ sơ có số) hoặc nhập cả số (chưa có); gửi xong báo đúng mã', ()=>{
  const ds=ksDanhSach(); const coSdt=ds.list.find(n=>n.coSdt), khong=ds.list.find(n=>!n.coSdt); const lo=JSON.stringify(ds).match(/09\d{8}|07\d{8}/);
  const sdt=soDT(nvByMa(coSdt.ma).SDT);
  const a=ksXacMinh({ma:coSdt.ma,sdt4:'0000'}), b=ksXacMinh({ma:coSdt.ma,sdt4:sdt.slice(-4)}), c=ksXacMinh({ma:khong.ma}), d=ksXacMinh({ma:khong.ma,sdtFull:'0905 123 456'});
  const g=ksGui({ma:khong.ma,sdtFull:'0905123456',data:{hoTen:'Nguyễn Văn Test',tenGoi:'Test',sdt:'0905123456',ngayVao:'2025-03-15',loai:'PT',viTriChinh:'Phục vụ',quanChinh:'DD',ranh:{'T2|Sáng':true},hoTro:{'Pha chế':'Làm một mình được'},tangCa:'Luôn được'}});
  const g2=ksGui({ma:coSdt.ma,sdt4:'0000',data:{}});
  return (!lo && !a.ok && b.ok && b.xacMinh==='khớp' && b.hoSo.sdt===sdt && !c.ok && d.ok && d.xacMinh==='chưa có số' && g.ok && g.ma===khong.ma && !g2.ok) || JSON.stringify({lo,a,b:b.ok,c,d:d.ok,g,g2}); });
T('KS2 Đối chiếu: ô khác hồ sơ được đánh dấu; 2 lần gửi khác người cho cùng một tên bị cảnh báo; nhân viên mới chờ cấp mã; danh sách chưa làm', ()=>{
  const m=ksDanhSach().list.find(n=>!n.coSdt && n.ma!==ksTatCa()[0].ma).ma;
  ksGui({ma:m,sdtFull:'0911111111',data:{hoTen:'Người A',ngayVao:'2025-01-01',loai:'PT',viTriChinh:'Phục vụ',quanChinh:'TP'}}); ksGui({ma:m,sdtFull:'0922222222',data:{hoTen:'Người B',ngayVao:'2026-01-01',loai:'PT',viTriChinh:'Phục vụ',quanChinh:'TP'}});
  ksGui({moi:true,data:{hoTen:'Trần Minh Khoa',tenGoi:'Khoa',sdt:'0987654321',ngayVao:'2026-10-20',loai:'PT',viTriChinh:'Phục vụ',quanChinh:'TNV'}});
  const r=ksDoiChieu({pin:'1234'}); const d1=r.dong.find(x=>x.ma===ksTatCa()[0].ma), d2=r.dong.find(x=>x.ma===m), nm=r.dong.find(x=>x.moi);
  return (r.ok && d1.khac.ngayVao!==undefined && d2.trung && d2.soLan===2 && nm && r.chua.length===r.tong-2 && ksDoiChieu({pin:'5678'}).ok && !ksDoiChieu({pin:'0000'}).ok) || JSON.stringify({d2,nm,chua:r.chua.length,tong:r.tong}); });
T('KS3 Nạp: cập nhật tên, số điện thoại, ngày vào, FT/PT, vị trí, quán chính vào danh sách nhân viên (có nhật ký); cấp mã cho nhân viên mới; xác nhận kỹ năng → vị trí kiêm, tăng ca', ()=>{
  const r=ksDoiChieu({pin:'1234'}); const d=r.dong.find(x=>x.ma && !x.trung); const nm=r.dong.find(x=>x.moi);
  const a=ksNap({pin:'1234',id:d.id}); const n=nvByMa(d.ma); const b=ksCapMa({pin:'1234',id:nm.id}); const c=ksXacNhanKyNang({pin:'1234',ma:d.ma}); const n2=nvByMa(d.ma);
  const nk=nhatKySua({pin:'1234'}).list.filter(x=>/Khảo sát →/.test(x.Muc)); const r2=ksDoiChieu({pin:'1234'});
  return (a.ok && /Test \(Nguyễn Văn Test\)/.test(n.Ten) && String(n.SDT)==='0905123456' && dateKey(n.NgayVao)==='2025-03-15' && n.CoSoChinh==='DD' && b.ok && /^3\d\d$/.test(b.maNV) && nvByMa(b.maNV).TrangThai==='Thử việc' && c.ok && /Pha chế/.test(n2.ViTriKiem) && n2.TangCaDuoc==='Có' && nk.length>=3 && r2.dong.find(x=>x.ma===d.ma).nap==='Đã nạp') || JSON.stringify({a,b,c,n:n&&n.Ten,nk:nk.length}); });
T('NS1 Nhân sự: admin sửa mọi thông tin một người (có nhật ký); danh sách mã theo quán; quản lý không dùng được', ()=>{ const a=suaNhanVien({pin:'1234',maNV:'305',Ten:'Thư (Nguyễn Anh Thư)',SDT:'0933000111',ChucVu:'Trưởng ca',CoSoChinh:'TD'});
  const n=nvByMa('305'); const nk=nhatKySua({pin:'1234'}).list.filter(x=>x.MaNV==='305' && /Nhân sự/.test(x.Muc)); const ds=dsMaTheoQuan({pin:'1234'}); const q=dsMaTheoQuan({pin:'5678'});
  return (a.ok && n.ChucVu==='Trưởng ca' && n.CoSoChinh==='TD' && nk.length>=3 && ds.ok && ds.theoQuan.TD.some(x=>x.ma==='305') && /page=khaosat/.test(ds.link) && !q.ok) || JSON.stringify({a,nk:nk.length,q}); });


// ---------- CF. Trang nhân viên trên Cloudflare ----------
T('CF1 API cho Cloudflare: đúng khoá mới gọi được; hàm nhân viên chạy; hàm trang quản lý (30/10) chạy khi ĐÚNG mã PIN, mã sai bị từ chối; hàm phụ nội bộ (rows) bị chặn', ()=>{
  const key=cfg('API_KEY'); const p=(o)=>JSON.parse(doPost({postData:{contents:JSON.stringify(o)}}).t);
  const a=p({fn:'qrInfo',args:[{cs:'TP',t:qrToken('TP')}],key}), b=p({fn:'qrInfo',args:[{cs:'TP',t:qrToken('TP')}],key:'sai'}), c=p({fn:'bangLuong',args:[{pin:'1234'}],key}), c2=p({fn:'bangLuong',args:[{pin:'0000'}],key}), r=p({fn:'rows',args:['NhanVien'],key}), d=p({fn:'ksDanhSach',args:[],key});
  return (key.length>=20 && a.ok && !b.ok && c.ok && c.list && !c2.ok && !r.ok && /Không cho phép/.test(r.msg) && d.ok) || JSON.stringify({a,b,c:{ok:c.ok},c2,r}); });
T('CF2 Khi cài trang Cloudflare (CF_URL), mã QR, tin gửi mã, link khảo sát đều trỏ về caphemuoihue.com', ()=>{ setCfg('CF_URL','https://caphemuoihue.com/'); const q=dsMaQR({pin:'1234'}).list[0].url, tin=tinNhanMa('302','1234'), ks=ksDoiChieu({pin:'1234'}).link; setCfg('CF_URL','');
  const q2=dsMaQR({pin:'1234'}).list[0].url;
  return (/^https:\/\/caphemuoihue\.com\/cham-cong\?cs=TP&t=/.test(q) && /caphemuoihue\.com\/gio-cong/.test(tin) && /caphemuoihue\.com\/khao-sat/.test(tin) && ks==='https://caphemuoihue.com/khao-sat' && /exec\?page=qr/.test(q2)) || JSON.stringify({q,tin,ks,q2}); });
// ---------- LT. Lưu trữ theo tháng ----------
T('LT1 Lưu trữ: tháng chưa chốt thì không làm; tháng đã chốt → tách ra file riêng (chấm công, tạm ứng, nhập tay, bảng lương đã chốt) và xoá khỏi file chính; bảng lương tháng đó trỏ về file lưu trữ', ()=>{
  addCC('2027-01-05','302','TP','FT1','06:30','14:30',8); themTamUng({pin:'1234',thang:'2027-01',maNV:'302',soTien:200,vanGhi:true}); luuO({pin:'1234',thang:'2027-01',maNV:'302',muc:'thuong',giaTri:300});
  const a=luuTruThang({pin:'1234',thang:'2027-01'}); chotThang({pin:'1234',thang:'2027-01',boQua:true}); const truoc=rows('ChamCong').length;
  const b=luuTruThang({pin:'1234',thang:'2027-01'}); const sau=rows('ChamCong').length; const con=rows('ChamCong').filter(r=>dateKey(r.Ngay).slice(0,7)==='2027-01').length;
  const f=SpreadsheetApp.openById(rows('LuuTru')[0].FileID); const cc=f.getSheetByName('ChamCong'), bl=f.getSheetByName('Bảng lương đã chốt');
  const bang=bangLuong({pin:'1234',thang:'2027-01'}); const c=luuTruThang({pin:'1234',thang:'2027-01'}); const q=luuTruThang({pin:'5678',thang:'2026-12'});
  const kt={cc:cc.d.length, tu:f.getSheetByName('TamUng').d.length, ln:f.getSheetByName('LuongNhap').d.length, bl:!!bl, banChot:!!sh('Lương 2027-01 (đã chốt)'), q:q.ok, ds:dsLuuTru({pin:'1234'}).list.filter(x=>/2027-01/.test(x.Thang)).map(x=>x.Thang+'|'+x.DaLuuTru)};
  return (!a.ok && b.ok && sau===truoc-1 && con===0 && kt.cc===2 && kt.tu===2 && kt.ln===2 && kt.bl && !kt.banChot && bang.luuTru && !c.ok && !kt.q && kt.ds.includes('2027-01|true')) || JSON.stringify({a,b,truoc,sau,con,bang:bang.luuTru,c,kt}); });
T('LT2 Tự động lưu trữ: chỉ tháng đã chốt và đã qua 10 ngày sau cuối tháng (số ngày sửa được); danh sách nhân viên, lịch sử lương vẫn ở file chính', ()=>{
  moChot({pin:'1234',thang:'2026-12'}); chotThang({pin:'1234',thang:'2026-12',boQua:true}); const nv=rows('NhanVien').length, ls=rows('LichSuLuong').length;
  at('2027-01-05','03:00'); const a=tuDongLuuTru(); at('2027-01-11','03:00'); const b=tuDongLuuTru(); fake=null;
  return (a.length===0 && b.some(x=>/2026-12: đã lưu trữ/.test(x)) && rows('NhanVien').length===nv && rows('LichSuLuong').length===ls && !rows('ChamCong').some(r=>dateKey(r.Ngay).slice(0,7)==='2026-12')) || JSON.stringify({a,b}); });


// ---------- LV. Lịch của tôi (nhân viên) ----------
const XLL=XLSS.getSheetByName('LichLam'); const CCN=XLSS.insertSheet('CaCanNguoi'); CCN.d=[['ID','Ngay','MaCS','GioBD','GioKT','ViTri','SoNguoi','GhiChu','TrangThai','DaChon','Luc']];
const sdtOf=m=>String(nvByMa(m).SDT||'').replace(/\D/g,'').slice(-4);
T('LV1 Lịch của tôi: xác minh mã + 4 số cuối; thấy lịch tuần này / tuần sau, kể cả ca giờ tự do; thấy ca cần người đang mở', ()=>{ setCfg('LICH_SHEET_ID','XL'); _LICH=null;
  XLL.d.push(['2027-02-02','TP','305','PT1','Phục vụ',''],['2027-02-04','DD','305','TD1500-1900','Phục vụ','QL thêm tay']); CCN.d.push(['C1','2027-02-06','TP','15:00','19:00','Phục vụ',1,'đông khách','Mở','','']);
  at('2027-02-01','09:00'); const sai=lichCuaToi({ma:'305',sdt4:'0000'}); const r=lichCuaToi({ma:'305',sdt4:sdtOf('305')}); fake=null;
  const td=r.lich.find(l=>l.Ngay==='2027-02-04');
  return (!sai.ok && r.ok && r.lich.length===2 && td && td.TuDo && td.GioBD==='15:00' && td.GioKT==='19:00' && r.caCanNguoi.length===1 && r.tuanSau==='2027-02-08') || JSON.stringify({sai,r}); });
T('LV2 Đăng ký bận tuần sau: trước thứ 7 đúng hạn; thứ 7 – chủ nhật trễ hạn; từ thứ 2 không nhận; gửi lại thay bản cũ', ()=>{ const id={ma:'305',sdt4:sdtOf('305')};
  at('2027-02-03','10:00'); const a=luuDangKyBanNV(Object.assign({tuan:'2027-02-08',ban:[{Ngay:'2027-02-09',Khoi:'Sáng'},{Ngay:'2027-02-10',Khoi:'Cả ngày'}]},id));
  at('2027-02-06','20:00'); const b=luuDangKyBanNV(Object.assign({tuan:'2027-02-08',ban:[{Ngay:'2027-02-11',Khoi:'Tối'}]},id));
  at('2027-02-08','07:00'); const c=luuDangKyBanNV(Object.assign({tuan:'2027-02-08',ban:[]},id)); fake=null;
  const ban=rows('DangKyBan').filter(r=>String(r.MaNV)==='305'&&dateKey(r.Ngay)>='2027-02-08');
  return (a.ok && !a.treHan && b.ok && b.treHan && !c.ok && ban.length===1 && ban[0].Khoi==='Tối' && /trễ hạn/.test(ban[0].Nguon) && rows('DangKyXacNhan').filter(r=>String(r.MaNV)==='305').length===2) || JSON.stringify({a,b,c,ban}); });
T('LV3 Rảnh thêm: báo ngày + giờ (không cho ngày đã qua, giờ ngược); xoá được của mình', ()=>{ const id={ma:'305',sdt4:sdtOf('305')}; at('2027-02-05','09:00');
  const a=themRanhThem(Object.assign({ngay:'2027-02-04',tu:'17:00',den:'22:00'},id)), b=themRanhThem(Object.assign({ngay:'2027-02-06',tu:'22:00',den:'17:00'},id)), c=themRanhThem(Object.assign({ngay:'2027-02-06',tu:'14:00',den:'20:00',ghiChu:'quán nào cũng được'},id));
  const r=lichCuaToi(id); const x=xoaRanhThem(Object.assign({id:r.ranhThem[0].ID},{ma:'302',sdt4:sdtOf('302')})); const y=c.ok && themRanhThem(Object.assign({ngay:'2027-02-07',tu:'08:00',den:'12:00'},id)); fake=null;
  return (!a.ok && !b.ok && c.ok && r.ranhThem.length===1 && !x.ok && rows('RanhThem').length===2) || JSON.stringify({a,b,c,x}); });
T('LV4 Nhận ca cần người: nhận được ca đang mở, không nhận trùng; ca đã đủ người thì không nhận; được chọn rồi thì không tự huỷ', ()=>{ const id={ma:'305',sdt4:sdtOf('305')}; at('2027-02-05','09:00');
  const a=nhanCa(Object.assign({caId:'C1'},id)), b=nhanCa(Object.assign({caId:'C1'},id)); const h=huyNhanCa(Object.assign({caId:'C1'},id)); const a2=nhanCa(Object.assign({caId:'C1'},id));
  CCN.d[1][8]='Đủ người'; CCN.d[1][9]='305'; const c=nhanCa(Object.assign({caId:'C1'},{ma:'302',sdt4:sdtOf('302')})); const d=huyNhanCa(Object.assign({caId:'C1'},id)); const r=lichCuaToi(id); fake=null;
  return (a.ok && !b.ok && h.ok && a2.ok && !c.ok && !d.ok && r.caCanNguoi[0].DuocChon) || JSON.stringify({a,b,h,c,d}); });
T('LV5 Ca giờ tự do trong lịch: quét QR thấy đúng ca, vào ca theo giờ đó; API Cloudflare cho các việc của Lịch của tôi', ()=>{ at('2027-02-04','15:02'); const i=qrNhanVien({cs:'DD',t:tk('DD'),maNV:'305',deviceId:'d305'}); const v=qrVao({cs:'DD',t:tk('DD'),maNV:'305',deviceId:'d305',viTri:'Phục vụ'}); fake=null;
  const key=cfg('API_KEY'); const p=JSON.parse(doPost({postData:{contents:JSON.stringify({fn:'lichCuaToi',args:[{ma:'305',sdt4:sdtOf('305')}],key})}}).t);
  return (i.ok && i.lich[0].MaCa==='TD1500-1900' && i.cas.some(c=>c.MaCa==='TD1500-1900') && v.ok && v.ca==='15:00–19:00' && p.ok) || JSON.stringify({i:i.lich,v,p:p.msg}); });


T('CC17 Cài đặt dán có dấu cách / xuống dòng thừa vẫn đọc đúng', ()=>{ sh('CaiDat').d.push([' LICH_TEST ','  xyz\n']); _CFG=null; const v=cfg('LICH_TEST'); sh('CaiDat').d.pop(); _CFG=null; return v==='xyz' || JSON.stringify(v); });


T('CC18 Nút chuyển sang Xếp lịch: link app Xếp lịch tự thêm ?page=admin để mở thẳng trang quản lý; chưa điền link thì không hiện nút', ()=>{ setCfg('XEP_LICH_URL','https://script.google.com/macros/s/XL/exec'); _CFG=null; const a=dangNhap({pin:'1234'}).xepLichUrl;
  setCfg('XEP_LICH_URL','https://caphemuoihue.com/quanlyxeplich'); _CFG=null; const b=dangNhap({pin:'1234'}).xepLichUrl; setCfg('XEP_LICH_URL',''); _CFG=null; const c=dangNhap({pin:'1234'}).xepLichUrl;
  return (a==='https://script.google.com/macros/s/XL/exec?page=admin' && b==='https://caphemuoihue.com/quanlyxeplich' && c==='') || JSON.stringify({a,b,c}); });


// ---------- TG. Thông báo Telegram ----------
const tgSet=(kv)=>{ Object.keys(kv).forEach(k=>setCfg(k,kv[k])); _CFG=null; };
const viTriQuan=cs=>{ const s=rows('CoSo').find(x=>x.MaCS===cs); return (s && s.ViDo!=='' && s.ViDo!=null)?{lat:+s.ViDo,lng:+s.KinhDo}:{lat:16.06,lng:108.22}; };
['TP','DD'].forEach(cs=>{ const s=rows('CoSo').find(x=>x.MaCS===cs); if(s && (s.ViDo===''||s.ViDo==null)) luuViTriQuan({pin:'1234',maCS:cs,lat:16.06,lng:108.22}); });
const vao=(cs,ma,gio,ngay,extra)=>{ at(ngay||'2027-04-05',gio); const r=qrVao(Object.assign({cs,t:tk(cs),maNV:ma,deviceId:'d'+ma,viTri:'Phục vụ'},viTriQuan(cs),extra||{})); return r; };
const ra=(cs,ma,gio,ngay,extra)=>{ at(ngay||'2027-04-05',gio); const r=qrRa(Object.assign({cs,t:tk(cs),maNV:ma,deviceId:'d'+ma,khaiLoai:'dung'},viTriQuan(cs),extra||{})); return r; };
XLL.d.push(['2027-04-05','TP','313','PT1','Phục vụ',''],['2027-04-05','TP','303','PT1','Phục vụ',''],['2027-04-06','DD','305','PT1','Phục vụ',''],['2027-04-06','DD','305','PT3','Phục vụ',''],['2027-04-07','DD','305','PT1','Phục vụ',''],['2027-04-08','TP','302','FT1','Phục vụ',''],['2027-04-08','DD','313','PT1','Phục vụ',''],['2027-06-03','TP','313','PT1','Phục vụ','']); _LICH=null;
T('TG1 Chỉ chuyện cần chú ý: vào đúng giờ không báo; vào trễ báo; ra đúng ca không báo; khai tăng ca báo kèm "cần quản lý xác nhận"', ()=>{ tgSet({TG_TOKEN:'TOKOK',TG_CHAT:'-1001',TG_MUC:'chuy'}); TG_SENT.length=0;
  // làm quen điện thoại trước để không bị cảnh báo "điện thoại mới"
  sh('ThietBi').d.push(['313','d313',new Date()],['303','d303',new Date()]);
  const a=vao('TP','313','06:31',null,{maCa:'PT1'}); const n1=TG_SENT.length; const b=vao('TP','303','06:55',null,{maCa:'PT1'}); const n2=TG_SENT.length;
  const c=ra('TP','313','12:01',null); const n3=TG_SENT.length; const d=ra('TP','303','14:30',null,{khaiLoai:'tang',khaiGio:'7.5',ghiChu:'ở lại dọn'}); fake=null;
  const m=TG_SENT.map(x=>x.text);
  return (a.ok && b.ok && c.ok && d.ok && n1===0 && n2===1 && /TRỄ 25 phút/.test(m[0]) && n3===1 && m.length===2 && /TĂNG CA \(khai 7,5h, ca 5,5h\)/.test(m[1]) && /quản lý xác nhận/.test(m[1]) && /ở lại dọn/.test(m[1]) && TG_SENT[0].chat_id==='-1001') || JSON.stringify({n1,n2,n3,m}); });
T('TG2 Tất cả lượt vào / ra đều báo; Tắt thì không báo; chưa có mã bot hoặc Telegram lỗi thì chấm công vẫn bình thường', ()=>{ tgSet({TG_MUC:'tatca'}); TG_SENT.length=0;
  sh('ThietBi').d.push(['305','d305',new Date()]); const a=vao('DD','305','06:30','2027-04-06',{maCa:'PT1'}); const b=ra('DD','305','12:00','2027-04-06'); const n=TG_SENT.length;
  tgSet({TG_MUC:'tat'}); const c=vao('DD','305','17:00','2027-04-06',{maCa:'PT3'}); const n2=TG_SENT.length;
  tgSet({TG_MUC:'tatca'}); TG_LOI=true; const d=ra('DD','305','22:30','2027-04-06'); TG_LOI=false; tgSet({TG_TOKEN:''}); const e=vao('DD','305','06:30','2027-04-07',{maCa:'PT1'}); const n3=TG_SENT.length; fake=null; tgSet({TG_TOKEN:'TOKOK'});
  return (a.ok && b.ok && n===2 && /✅ 06:30 · Đống Đa/.test(TG_SENT[0].text) && /🔚 12:00/.test(TG_SENT[1].text) && c.ok && n2===2 && d.ok && e.ok && n3===2) || JSON.stringify({n,n2,n3,d,e}); });
T('TG3 Quán có nhóm riêng thì tin vào nhóm riêng; quán khác vào nhóm chung', ()=>{ tgSet({TG_MUC:'tatca',TG_CHAT_TP:'-1002'}); TG_SENT.length=0;
  sh('ThietBi').d.push(['302','d302',new Date()]); vao('TP','302','06:30','2027-04-08',{maCa:'FT1'}); vao('DD','313','06:30','2027-04-08',{maCa:'PT1'}); fake=null; tgSet({TG_CHAT_TP:''});
  return (TG_SENT[0].chat_id==='-1002' && TG_SENT[1].chat_id==='-1001') || JSON.stringify(TG_SENT.map(x=>x.chat_id)); });
T('TG4 Tổng kết cuối ngày: số người làm, trễ, có lịch mà không chấm, chưa ra ca, chờ duyệt; tự gửi đúng 1 lần vào giờ đã đặt', ()=>{ tgSet({TG_TONGKET:'Có',TG_TONGKET_GIO:23}); TG_SENT.length=0;
  at('2027-04-05','22:00'); tgMoiGio(); const n0=TG_SENT.length; at('2027-04-05','23:05'); tgMoiGio(); tgMoiGio(); fake=null;
  const m=TG_SENT.map(x=>x.text).join('\n');
  return (n0===0 && TG_SENT.length===1 && /TỔNG KẾT NGÀY 05\/04\/2027/.test(m) && /Trần Phú: 2 người làm/.test(m) && /Trễ: H Anh 25p/.test(m) && /Chờ duyệt: 2 lượt/.test(m)) || m; });
T('TG5 Admin: dán mã bot → tìm được các nhóm đã thêm bot (bỏ chat riêng); mã sai báo rõ; lưu cài đặt; gửi thử; quản lý không dùng được', ()=>{
  const a=tgLayNhom({pin:'1234',token:'TOKOK'}), b=tgLayNhom({pin:'1234',token:'SAI'}), q=tgLayNhom({pin:'5678',token:'TOKOK'});
  const l=luuTelegram({pin:'1234',token:'TOKOK',chung:'-1001',rieng:{TP:'-1002'},muc:'chuy',tongKet:'Có',gio:22}); const c=tgCauHinh({pin:'1234'}); TG_SENT.length=0; const g=tgGuiThu({pin:'1234'});
  luuTelegram({pin:'1234',token:'TOKOK',chung:'-1001',rieng:{},muc:'chuy',tongKet:'Có',gio:23});
  return (a.ok && a.nhom.length===2 && a.nhom.some(x=>x.ten==='Ncafe Trần Phú') && !b.ok && /không đúng/.test(b.msg) && !q.ok && l.ok && c.rieng.TP==='-1002' && c.gio===22 && g.ok && TG_SENT.length===2) || JSON.stringify({a,b,c,g}); });


T('TG6 Hết ca 1 tiếng: báo vào nhóm của quán ai quên chấm RA, ai có lịch mà KHÔNG chấm công; người chấm đủ không bị nêu; không báo lại lần 2', ()=>{
  tgSet({TG_TOKEN:'TOKOK',TG_CHAT:'-1001',TG_CHAT_TP:'-1002',TG_NHAC_CA:'Có',TG_NHAC_SAU_PHUT:60}); TG_SENT.length=0;
  XLL.d.push(['2027-05-03','TP','313','PT1','Phục vụ',''],['2027-05-03','TP','303','PT1','Phục vụ',''],['2027-05-03','TP','305','PT1','Phục vụ',''],['2027-05-03','DD','304','PT1','Phục vụ','']); _LICH=null;
  addCC('2027-05-03','313','TP','PT1','06:30','12:00',5.5); addCC('2027-05-03','303','TP','PT1','06:31','',0,'Đang làm'); addCC('2027-05-03','304','DD','PT1','06:30','12:00',5.5);
  const ms=(h)=>new RealDate('2027-05-03T'+h+':00+07:00').getTime();
  const a=tgNhacCa(ms('12:50'),ms('13:05')); const n1=TG_SENT.length; const b=tgNhacCa(ms('13:05'),ms('13:20')); const m=TG_SENT[0]||{};
  return (n1===1 && TG_SENT.length===1 && m.chat_id==='-1002' && /Hết ca 12:00 · Trần Phú/.test(m.text) && /Quên chấm RA:\n• H Anh \(303\)/.test(m.text) && /KHÔNG chấm công:\n• Thư \(305\)/.test(m.text) && !/Đường/.test(m.text) && b.nhom===0) || JSON.stringify({a,b,sent:TG_SENT}); });
T('TG7 Ca ngoài lịch (tự điền) quên ra cũng bị nhắc; chạy mỗi 15 phút không nhắc trùng; tắt nhắc thì thôi', ()=>{ tgSet({TG_TONGKET:'Không'}); TG_SENT.length=0;
  addCC('2027-05-03','302','DD','PT3','17:02','',0,'Đang làm');   // ca 17:00–22:30 không có trong lịch
  setCfg('TG_NHAC_LUC', new RealDate('2027-05-03T23:20:00+07:00').getTime()); _CFG=null; at('2027-05-03','23:35'); tgMoi15Phut(); const n1=TG_SENT.length; const m=(TG_SENT[0]||{}).text||'';
  at('2027-05-03','23:50'); tgMoi15Phut(); const n2=TG_SENT.length;
  tgSet({TG_NHAC_CA:'Không',TG_NHAC_LUC:new RealDate('2027-05-03T23:20:00+07:00').getTime()}); at('2027-05-03','23:35'); tgMoi15Phut(); const n3=TG_SENT.length; fake=null; tgSet({TG_NHAC_CA:'Có',TG_CHAT_TP:''});
  return (n1===1 && /Hết ca 22:30 · Đống Đa/.test(m) && /Châu \(302\) – vào 17:02/.test(m) && n2===1 && n3===1) || JSON.stringify({n1,n2,n3,m}); });


T('RW1 Giữa bảng chấm công có dòng trống (ai đó xoá nội dung một dòng trong Sheet): ra ca vẫn ghi đúng dòng của người đó', ()=>{ const c=sh('ChamCong'); c.d.splice(5,0,c.d[0].map(()=>''));   // chèn 1 dòng trống ở giữa
  sh('ThietBi').d.push(['313','d313',new Date()]); vao('TP','313','06:30','2027-06-03',{maCa:'PT1'}); const r=ra('TP','313','12:00','2027-06-03'); fake=null;
  const row=rows('ChamCong').find(x=>String(x.MaNV)==='313'&&dateKey(x.Ngay)==='2027-06-03');
  return (r.ok && hhmm(row.Ra)==='12:00' && row.TrangThai==='Chờ xác nhận' && r.khopLich) || JSON.stringify({r,row}); });


// ---------- XN. Xác nhận giờ cuối ca ----------
XLL.d.push(['2027-07-05','TP','303','FT1','Phục vụ',''],['2027-07-05','TP','313','PT1','Phục vụ',''],['2027-07-05','TP','205','FT1','Pha chế',''],['2027-07-05','TP','213','PT1','Phục vụ',''],['2027-07-05','TP','320','PT1','Phục vụ',''],['2027-07-05','DD','304','PT1','Phục vụ','']); _LICH=null;
['303','313','205','213','304'].forEach(m=>sh('ThietBi').d.push([m,'d'+m,new Date()]));
const N='2027-07-05'; setCfg('DE_XUAT_GIO','nv'); _CFG=null;
T('XN1 Ra ca: đủ ca, trễ ≤10 phút (nhắc nhở) → khớp lịch, vẫn chờ duyệt; trễ quá 10 phút thì chờ duyệt, ghi giờ có mặt và lý do; tạm tính không quá giờ ca', ()=>{
  vao('TP','205','06:35',N,{maCa:'FT1'}); const a=ra('TP','205','14:31',N,{khaiLoai:'du'});
  vao('TP','303','07:04',N,{maCa:'FT1'}); const b=ra('TP','303','14:35',N,{khaiLoai:'du',coMat:'06:30',lyDo:'Có mặt đúng giờ, chấm muộn'});
  vao('TP','213','07:30',N,{maCa:'PT1'}); const c=ra('TP','213','12:00',N,{khaiLoai:'giam',tu:'07:30',den:'12:00',lyDo:'Xe hư / lủng lốp'});
  vao('TP','313','06:30',N,{maCa:'PT1'}); const d=ra('TP','313','13:30',N,{khaiLoai:'tang',tu:'06:30',den:'13:30',lyDo:'Đông khách'}); fake=null;
  const r=m=>rows('ChamCong').find(x=>String(x.MaNV)===m&&dateKey(x.Ngay)===N);
  return (a.khopLich && !a.tuXacNhan && r('205').TrangThai==='Chờ xác nhận' && +r('205').TreMin===5 && b.trangThai==='Chờ xác nhận' && hhmm(r('303').CoMat)==='06:30' && /chấm muộn/.test(r('303').LyDo) && +r('303').GioTinh===8
    && c.khaiGio===4.5 && d.khaiGio===7 && +r('313').GioTinh===5.5) || JSON.stringify({a,b,c,d}); });
T('XN2 Danh sách Xác nhận giờ: nhãn nhắc nhở / trễ / ra muộn / ngoài lịch, giờ theo lịch – theo chấm – đề xuất; người có lịch không chấm hiện ở mục vắng', ()=>{
  at(N,'16:00'); vao('DD','304','06:31',N,{maCa:'PT1'}); fake=null; at(N,'16:00'); const L2=xnDanhSach({pin:'1234',ngay:N}); fake=null;
  const g=m=>L2.list.find(x=>x.MaNV===m), nh=m=>g(m).Nhan.map(x=>x[0]).join('|');
  return (L2.ok && /nhắc nhở: trễ 5'/.test(nh('205')) && /trễ 34'/.test(nh('303')) && g('303').GioLich===8 && g('303').GioCham===7.5 && g('303').DeXuat===8 && /ra muộn 90'/.test(nh('313')) && g('313').DeXuat===7
    && L2.vang.some(v=>v.MaNV==='320') && !L2.vang.some(v=>v.MaNV==='205')) || JSON.stringify(L2.list.map(x=>[x.MaNV,x.Nhan,x.DeXuat]).concat(L2.vang)); });
T('XN3 Quản lý duyệt theo nhân viên xác nhận (từng dòng hoặc cả ca); tính theo lịch / giờ chấm / sửa giờ cần quyền điều chỉnh; sửa bắt buộc lý do; bỏ duyệt', ()=>{
  const L2=xnDanhSach({pin:'1234',ngay:N}), id=m=>L2.list.find(x=>x.MaNV===m).ID;
  const a=xnDuyet({pin:'5678',ids:[id('303'),id('313')],cach:'dexuat'}); const b=xnDuyet({pin:'5678',ids:[id('213')],cach:'lich'}); const c=xnDuyet({pin:'2468',ids:[id('213')],cach:'sua',vao:'07:00',ra:'12:00'});
  const d=xnDuyet({pin:'2468',ids:[id('213')],cach:'sua',vao:'07:00',ra:'12:00',lyDo:'đến 7h, quản lý xác nhận'}); const r=m=>rows('ChamCong').find(x=>String(x.MaNV)===m&&dateKey(x.Ngay)===N);
  const e=xnBoDuyet({pin:'5678',id:id('313')}); const f=xnBoDuyet({pin:'2468',id:id('313')});
  return (a.ok && a.xong===2 && +r('303').GioTinh===8 && r('303').TrangThai==='Đã xác nhận' && /nhân viên xác nhận/.test(r('303').Cach) && !!r('303').XacNhanBoi && !b.ok && !c.ok
    && d.ok && +r('213').GioTinh===5 && /sửa 07:00–12:00/.test(r('213').Cach) && !e.ok && f.ok && r('313').TrangThai==='Chờ xác nhận') || JSON.stringify({a,b,c,d,e,f}); });
T('XN-TC Từ chối lượt: bắt lý do, ghi TrangThai=Từ chối + GioTinh=0, giữ lịch sử; thiếu lý do → chặn; đã duyệt → chặn', ()=>{
  const id=m=>(rows('ChamCong').find(x=>String(x.MaNV)===m&&dateKey(x.Ngay)===N)||{}).ID;
  const target=id('313'); if(!target) return 'không có ID 313';
  const a=xnTuChoi({pin:'5678',id:target});   // thiếu lý do
  const b=xnTuChoi({pin:'5678',id:target,lyDo:'test từ chối'});
  const r=rows('ChamCong').find(x=>String(x.ID)===target);
  xnDuyet({pin:'5678',ids:[target],cach:'dexuat'});   // đã duyệt → không từ chối lại được
  const c=xnTuChoi({pin:'5678',id:target,lyDo:'thử lần 2'});
  return (!a.ok && /lý do/i.test(a.msg) && b.ok && r.TrangThai==='Từ chối' && +r.GioTinh===0 && /test từ chối/.test(r.LyDo||'') && !c.ok) || JSON.stringify({a,b,c,r});
});
T('XN4 Quản lý theo quán: tài khoản gắn quán Đống Đa chỉ thấy và chỉ duyệt được Đống Đa; admin thấy hết', ()=>{
  luuTaiKhoan({pin:'1234',list:[{Ten:'Admin',PIN:'1234',VaiTro:'Admin'},{Ten:'Quản lý',PIN:'5678',VaiTro:'Quản lý',SuaGio:'Không'},{Ten:'QL TP',PIN:'2468',VaiTro:'Quản lý',SuaGio:'Có'},{Ten:'QL ĐĐ',PIN:'1357',VaiTro:'Quản lý',SuaGio:'Không',Quan:'DD'}]});
  const a=xnDanhSach({pin:'1357',ngay:N}), ad=xnDanhSach({pin:'1234',ngay:N}); const idTP=ad.list.find(x=>x.MaCS==='TP' && x.TrangThai==='Chờ xác nhận').ID;
  const b=xnDuyet({pin:'1357',ids:[idTP],cach:'dexuat'});
  return (a.list.length>0 && a.list.every(x=>x.MaCS==='DD') && ad.list.some(x=>x.MaCS==='TP') && b.xong===0 && b.bo.length===1) || JSON.stringify({a:a.list.map(x=>x.MaCS),b}); });
T('XN5 Xin phép trước: nhân viên gửi → báo nhóm quán → quản lý đồng ý → dòng chấm công hôm đó hiện "đã xin phép", duyệt thì ghi Có phép', ()=>{ TG_SENT.length=0; const sdt=sdtOf('213');
  at('2027-07-06','06:00'); XLL.d.push(['2027-07-06','TP','213','PT1','Phục vụ','']); _LICH=null;
  const a=xinPhep({ma:'213',sdt4:sdt,ngay:'2027-07-06',loai:'muon',gio:'07:15',lyDo:'Việc gia đình'}); const x0=xnDanhSach({pin:'1234',ngay:'2027-07-06'});
  const q=xpQuyetDinh({pin:'2468',id:x0.xinPhep[0].ID,dongY:true}); vao('TP','213','07:14','2027-07-06',{maCa:'PT1'}); ra('TP','213','12:00','2027-07-06',{khaiLoai:'du',lyDo:'Đã xin phép quản lý'});
  at('2027-07-06','13:00'); const x1=xnDanhSach({pin:'1234',ngay:'2027-07-06'}); const row=x1.list.find(x=>x.MaNV==='213'); const d=xnDuyet({pin:'5678',ids:[row.ID],cach:'dexuat'}); fake=null;
  const rr=rows('ChamCong').find(x=>x.ID===row.ID);
  return (a.ok && /XIN PHÉP/.test((TG_SENT[0]||{}).text||'') && x0.xinPhep.length===1 && q.ok && row.XinPhep && row.XinPhep.TrangThai==='Đồng ý' && d.xong===1 && rr.CoPhep==='Có phép') || JSON.stringify({a,x0:x0.xinPhep,row,d}); });
T('XN6 Báo quên chấm: quên cả vào lẫn ra → duyệt tạo lượt mới đã xác nhận; quên chấm ra → duyệt điền giờ ra cho lượt đang mở', ()=>{ const s1=sdtOf('320'), s2=sdtOf('304');
  at('2027-07-06','20:00'); const a=baoQuenCham({ma:'320',sdt4:s1,ngay:N,tu:'06:30',den:'12:00',lyDo:'Quên mang điện thoại'}); const b=baoQuenCham({ma:'304',sdt4:s2,ngay:N,tu:'06:31',den:'12:05',lyDo:'Quên chấm ra'});
  const ds=xnDanhSach({pin:'1234',ngay:N}); ds.baoQuen.forEach(q=>bqQuyetDinh({pin:'5678',id:q.ID,dongY:true})); fake=null;
  const r320=rows('ChamCong').find(x=>String(x.MaNV)==='320'&&dateKey(x.Ngay)===N), r304=rows('ChamCong').filter(x=>String(x.MaNV)==='304'&&dateKey(x.Ngay)===N);
  return (a.ok && b.ok && ds.baoQuen.length===2 && r320 && r320.TrangThai==='Đã xác nhận' && +r320.GioTinh===5.5 && r304.length===1 && hhmm(r304[0].Ra)==='12:05' && r304[0].TrangThai==='Đã xác nhận') || JSON.stringify({a,b,bq:ds.baoQuen,r320,r304}); });
T('XN7 Nhân viên xem giờ đã duyệt từng ngày (chưa duyệt thì chưa hiện giờ); KHÔNG thấy lý do quản lý sửa / giờ chấm thực tế; phản hồi → quản lý trả lời và mở lại để sửa', ()=>{ const sdt=sdtOf('213');
  const g=gioCongCuaToi({maNV:'213',sdt4:sdt,thang:'2027-07'}); const d5=g.ca.find(x=>x.Ngay===N);
  const p=phanHoi({ma:'213',sdt4:sdt,ccId:d5.ID,noiDung:'Hôm đó em đến 6h45'}); const ds=xnDanhSach({pin:'1234',ngay:N}); const t=phTraLoi({pin:'2468',id:ds.phanHoi[0].ID,traLoi:'Đã kiểm tra camera, sửa lại',moLai:true}); fake=null;
  const rr=rows('ChamCong').find(x=>x.ID===d5.ID);
  return (d5.DaDuyet && d5.Gio===5 && d5.SuaKhac===undefined && d5.LyDoSua===undefined && d5.Vao===undefined && p.ok && ds.phanHoi.length===1 && t.ok && rr.TrangThai==='Chờ xác nhận') || JSON.stringify({d5,p,t}); });   // (30/10) nhân viên không còn thấy lý do / giờ chấm
T('XN8 Đợt đã duyệt thì khoá: quản lý không sửa được, admin vẫn sửa được (có nhật ký)', ()=>{ at('2027-07-12','09:00');
  const ds=xnDanhSach({pin:'1234',ngay:N}); ds.list.filter(x=>x.TrangThai==='Chờ xác nhận').forEach(x=>xnDuyet({pin:'2468',ids:[x.ID],cach:'lich'})); xnDanhSach({pin:'1234',ngay:N}).vang.forEach(v=>xnVang({pin:'5678',ma:v.MaNV,ngay:N,cs:v.MaCS,coPhep:'Không phép'}));
  const k=duyetDot({pin:'5678',thang:'2027-07',dot:1}); const id=xnDanhSach({pin:'1234',ngay:N}).list.find(x=>x.MaNV==='303').ID;
  const a=xnDuyet({pin:'2468',ids:[id],cach:'sua',vao:'06:30',ra:'14:00',lyDo:'thử'}); const b=xnDuyet({pin:'1234',ids:[id],cach:'sua',vao:'06:30',ra:'14:00',lyDo:'admin sửa'}); fake=null;
  return (k.ok && a.bo.length===1 && /chỉ admin/.test(a.bo[0]) && b.xong===1) || JSON.stringify({k,a,b}); });
T('XN9 Tổng hợp tháng: nhắc nhở, trễ có / không phép, phút trễ, về sớm, quên chấm, vắng – không trừ tiền', ()=>{ const t=tongHopThang({pin:'1234',thang:'2027-07'}); const g=m=>t.list.find(x=>x.MaNV===m)||{};
  return (t.ok && g('205').NhacNho===1 && g('303').PhutTre>=34 && g('213').VeSom===0 && g('320').QuenCham===1 && g('304').QuenCham===1 && JSON.stringify(t).indexOf('Luong')<0) || JSON.stringify(t.list); });
T('XN10 Nhắc duyệt cuối ngày: đúng giờ đặt, mỗi quán còn mục chưa duyệt nhận 1 tin, không nhắc lặp', ()=>{ TG_SENT.length=0; tgSet({NHAC_DUYET:'Có',NHAC_DUYET_GIO:22,TG_CHAT_TP:'-1002'});
  addCC('2027-07-20','302','TP','FT1','06:30','14:30',8,'Chờ xác nhận'); at('2027-07-20','21:10'); nhacDuyetCuoiNgay(); const n0=TG_SENT.length; at('2027-07-20','22:05'); nhacDuyetCuoiNgay(); nhacDuyetCuoiNgay(); fake=null; tgSet({TG_CHAT_TP:''});
  const m=TG_SENT.filter(x=>x.chat_id==='-1002').map(x=>x.text).join('\n');
  return (n0===0 && /Trần Phú: còn \d+ mục chưa duyệt/.test(m) && TG_SENT.filter(x=>x.chat_id==='-1002').length===1) || JSON.stringify(TG_SENT); });
T('XN11 Trang nhân viên trên Cloudflare gọi được xin phép, báo quên chấm, phản hồi', ()=>{ const key=cfg('API_KEY'); const p=(fn,a)=>JSON.parse(doPost({postData:{contents:JSON.stringify({fn,args:[a],key})}}).t);
  const a=p('xinPhep',{ma:'205',sdt4:sdtOf('205'),ngay:'2099-01-01',loai:'nghi',lyDo:'Ốm'}), b=p('baoQuenCham',{ma:'205',sdt4:sdtOf('205'),ngay:'2027-07-05',tu:'xx',den:'yy',lyDo:'x'});
  return (a.ok && !b.ok) || JSON.stringify({a,b}); });


T('XN12 Không khoá sổ được đợt chưa có dữ liệu chấm công (tránh khoá nhầm đợt chưa nạp dữ liệu cũ)', ()=>{ at('2027-09-25','09:00'); const a=duyetDot({pin:'1234',thang:'2027-09',dot:1}); fake=null; return (!a.ok && /chưa có dữ liệu/.test(a.msg)) || JSON.stringify(a); });


T('XN13 Đề xuất theo giờ chấm thực tế: chấm muộn nhưng ghi có mặt 06:30 → tính từ 06:30; đến sớm trước ca không tính; khai giảm ca lấy số nhỏ hơn; duyệt ghi "theo giờ chấm"', ()=>{ setCfg('DE_XUAT_GIO','cham'); _CFG=null; const D='2027-08-02';
  XLL.d.push([D,'TP','303','FT1','Phục vụ',''],[D,'TP','205','FT1','Pha chế',''],[D,'TP','213','PT1','Phục vụ','']); _LICH=null;
  vao('TP','303','07:04',D,{maCa:'FT1'}); ra('TP','303','14:31',D,{khaiLoai:'du',coMat:'06:30',lyDo:'Có mặt đúng giờ, chấm muộn'});
  vao('TP','205','06:05',D,{maCa:'FT1'}); const a=ra('TP','205','14:32',D,{khaiLoai:'du'});
  vao('TP','213','06:30',D,{maCa:'PT1'}); ra('TP','213','12:00',D,{khaiLoai:'giam',tu:'06:30',den:'10:00',lyDo:'Ốm / sức khoẻ'});
  at(D,'15:00'); const L2=xnDanhSach({pin:'1234',ngay:D}); fake=null; const g=m=>L2.list.find(x=>x.MaNV===m);
  const d=xnDuyet({pin:'5678',ids:[g('303').ID],cach:'dexuat'}); const rr=rows('ChamCong').find(x=>x.ID===g('303').ID); setCfg('DE_XUAT_GIO','nv'); _CFG=null;
  return (L2.theoCham && g('303').DeXuat===8 && g('205').DeXuat===8 && a.khopLich && g('213').DeXuat===3.5 && d.xong===1 && +rr.GioTinh===8 && /theo giờ chấm \(có mặt 06:30\)/.test(rr.Cach)) || JSON.stringify(L2.list.map(x=>[x.MaNV,x.DeXuat,x.TrangThai])); });


T('XN14 Mặc định lượt nào cũng phải duyệt (cả lượt khớp lịch, có nhãn khớp lịch); bật "Tự xác nhận lượt khớp lịch" thì lượt khớp tự xong', ()=>{ const D='2027-08-09'; XLL.d.push([D,'TP','205','FT1','Pha chế',''],[D,'TP','303','FT1','Phục vụ','']); _LICH=null;
  vao('TP','205','06:28',D,{maCa:'FT1'}); const a=ra('TP','205','14:31',D,{khaiLoai:'du'}); tgSet({TU_DUYET_KHOP:'Có'}); vao('TP','303','06:29',D,{maCa:'FT1'}); const b=ra('TP','303','14:30',D,{khaiLoai:'du'}); tgSet({TU_DUYET_KHOP:'Không'});
  at(D,'15:00'); const L2=xnDanhSach({pin:'1234',ngay:D}); fake=null; const g=m=>L2.list.find(x=>x.MaNV===m);
  return (a.trangThai==='Chờ xác nhận' && a.khopLich && g('205').Khop && b.trangThai==='Đã xong' && g('303').TrangThai==='Đã xong') || JSON.stringify({a,b}); });


T('GO1 Bản gộp: link Google cũ của trang nhân viên tự chuyển sang Cloudflare; link trần mở trang quản lý', ()=>{ setCfg('CF_URL','https://ncafe-chamcong.dangbao-mt.workers.dev/'); _CFG=null;
  const a=doGet({parameter:{page:'qr',cs:'TP',t:'abc'}}), b=doGet({parameter:{page:'lich'}}), c=doGet({parameter:{}});
  return (/workers\.dev\/cham-cong\?cs=TP&t=abc/.test(a.h) && /workers\.dev\/lich-cua-toi/.test(b.h) && c.n==='QuanLy') || JSON.stringify({a,b,c}); });


T('PAY1 Tăng lương có ngày áp dụng: tháng trước giữ mức cũ, từ ngày áp dụng tính mức mới; tháng đã chốt không đổi', ()=>{
  suaNhanVien({pin:'1234',maNV:'209',KieuLuong:'Giờ',LuongGio:'24'});
  addCC('2027-10-20','209','LDD','FT1','06:30','14:30',8,'Đã xác nhận'); addCC('2027-11-03','209','LDD','FT1','06:30','14:30',8,'Đã xác nhận');
  at('2027-11-05','09:00'); const a=tangLuong({pin:'1234',maNV:'209',mucMoi:'25',ngay:'2027-11-01',ghiChu:'tăng'});
  const t10=bangLuong({pin:'1234',thang:'2027-10'}).list.find(x=>x.MaNV==='209'), t11=bangLuong({pin:'1234',thang:'2027-11'}).list.find(x=>x.MaNV==='209'); fake=null;
  return (a.ok && t10.luong===24 && t10.tienLuong===192 && t11.luong===25 && t11.tienLuong===200) || JSON.stringify({a,t10:[t10.luong,t10.tienLuong],t11:[t11.luong,t11.tienLuong]}); });


// ---------- AD. Admin sửa / huỷ được mọi thứ ----------
T('AD1 Thêm lượt thay nhân viên (cần quyền), chặn trùng giờ; đổi quán; xoá lượt chấm nhầm chỉ admin, có nhật ký', ()=>{ at('2027-12-02','20:00');
  const a=xnThemLuot({pin:'5678',ma:'205',cs:'TP',ngay:'2027-12-02',vao:'06:30',ra:'14:30',lyDo:'quên đt'}); const b=xnThemLuot({pin:'2468',ma:'205',cs:'TP',ngay:'2027-12-02',vao:'06:30',ra:'14:30',lyDo:'quên đt'});
  const c=xnThemLuot({pin:'2468',ma:'205',cs:'TP',ngay:'2027-12-02',vao:'10:00',ra:'12:00',lyDo:'trùng'}); const id=b.id;
  const d=xnDoiQuan({pin:'2468',id,cs:'DD'}); const r1=rows('ChamCong').find(x=>x.ID===id); const e=xnXoaLuot({pin:'2468',id,lyDo:'thử'}); const f=xnXoaLuot({pin:'1234',id,lyDo:'chấm thử'}); fake=null;
  return (!a.ok && b.ok && b.gio===8 && !c.ok && d.ok && r1.MaCS==='DD' && r1.TrangThai==='Đã xác nhận' && !e.ok && f.ok && !rows('ChamCong').some(x=>x.ID===id) && rows('NhatKySua').some(x=>/Xoá lượt chấm công/.test(x.Muc))) || JSON.stringify({a,b,c,d,e,f}); });
T('AD2 Bỏ đánh dấu vắng; mở khoá đợt (chỉ admin) rồi quản lý sửa lại được; xoá lần tăng lương bấm nhầm trả mức cũ', ()=>{ at('2027-07-12','09:00');
  xnVang({pin:'5678',ma:'205',ngay:'2027-07-21',cs:'TP',ca:'06:30–14:30',coPhep:'Không phép'}); const v0=rows('Vang').filter(x=>dateKey(x.Ngay)==='2027-07-21').length; const bv=xnBoVang({pin:'5678',ma:'205',ngay:'2027-07-21'}); const v1=rows('Vang').filter(x=>dateKey(x.Ngay)==='2027-07-21').length;
  const q=moKhoaDot({pin:'2468',thang:'2027-07',dot:1}); const m=moKhoaDot({pin:'1234',thang:'2027-07',dot:1}); const id=xnDanhSach({pin:'1234',ngay:'2027-07-05'}).list.find(x=>x.MaNV==='303').ID;
  const s=xnDuyet({pin:'2468',ids:[id],cach:'sua',vao:'06:30',ra:'14:30',lyDo:'sau khi mở khoá'}); fake=null;
  const lg0=nvByMa('209').LuongGio; const x=xoaLanTangLuong({pin:'1234',maNV:'209'}); const lg1=nvByMa('209').LuongGio;
  return (v0>=1 && bv.ok && v1===v0-1 && !q.ok && m.ok && s.xong===1 && +lg0===25 && x.ok && +lg1===24) || JSON.stringify({v0,v1,bv,q,m,s,lg0,lg1,x}); });


T('MN1 Tăng ca qua nửa đêm: 0h–4h quét mã vẫn là RA ca tối hôm qua (không mở ca mới); ghi giờ ra 23:59 kèm cảnh báo giờ thật; khai tăng ca vẫn đúng giờ', ()=>{
  vao('LDD','301','16:58','2027-12-10',{maCa:'PT3'}); at('2027-12-11','00:20'); const n=qrNhanVien({cs:'LDD',t:tk('LDD'),maNV:'301',deviceId:'d301'});
  const r=qrRa(Object.assign({cs:'LDD',t:tk('LDD'),maNV:'301',deviceId:'d301',khaiLoai:'tang',tu:'17:00',den:'23:59',lyDo:'dọn kho'},viTriQuan('LDD'))); at('2027-12-11','05:00'); const n2=qrNhanVien({cs:'LDD',t:tk('LDD'),maNV:'301',deviceId:'d301'}); fake=null;
  const row=rows('ChamCong').find(x=>String(x.MaNV)==='301'&&dateKey(x.Ngay)==='2027-12-10'); const moi=rows('ChamCong').filter(x=>String(x.MaNV)==='301'&&dateKey(x.Ngay)==='2027-12-11');
  return (n.next==='RA' && r.ok && hhmm(row.Ra)==='23:59' && /sau nửa đêm lúc 00:20/.test(row.CanhBao) && moi.length===0 && n2.next==='VAO') || JSON.stringify({n:n.next,r,row,moi:moi.length,n2:n2.next}); });


// ---------- HS. Ngày áp dụng cho hệ số lương & hồ sơ; DM. danh mục ----------
T('HS1 Đổi lương giờ mặc định vị trí từ 15/1: trước 15/1 tính mức cũ, từ 15/1 mức mới; người có lương riêng không bị ảnh hưởng; ngày áp dụng lùi về trước lần đổi trước bị chặn', ()=>{
  suaNhanVien({pin:'1234',maNV:'312',KieuLuong:'Giờ',LuongGio:''}); const vt=vtLuong(nvByMa('312')), cu=nghin(cfg('LUONG_'+vt));
  addCC('2028-01-10','312','TP','FT1','06:30','14:30',8,'Đã xác nhận'); addCC('2028-01-20','312','TP','FT1','06:30','14:30',8,'Đã xác nhận');
  const a=luuCauHinh({pin:'1234',ngayApDung:'2028-01-15',com:[{ViTri:vt,LuongGio:String(cu+3)}]}); const b=luuCauHinh({pin:'1234',ngayApDung:'2028-01-01',com:[{ViTri:vt,LuongGio:String(cu+5)}]});
  at('2028-02-02','09:00'); const o=bangLuong({pin:'1234',thang:'2028-01'}).list.find(x=>x.MaNV==='312'); fake=null;
  return (a.ok && !b.ok && o.tienLuong===Math.round((8*cu+8*(cu+3))*10)/10 && o.luong===cu+3) || JSON.stringify({a,b,cu,o:o&&[o.tienLuong,o.luong]}); });
T('HS2 Tiền cơm đổi giữa tháng: mỗi ngày đủ cơm tính đúng mức của ngày đó', ()=>{ const vt=vtLuong(nvByMa('312')), g0=nghin(cfg('COM_GIA_'+vt))||20;
  const a=luuCauHinh({pin:'1234',ngayApDung:'2028-01-18',com:[{ViTri:vt,Gia:String(g0+5)}]}); at('2028-02-02','09:00'); const o=bangLuong({pin:'1234',thang:'2028-01'}).list.find(x=>x.MaNV==='312'); fake=null;
  return (a.ok && o.soSuat===2 && o.com===g0+(g0+5)) || JSON.stringify({a,o:o&&[o.soSuat,o.com,g0]}); });
T('HS3 Chuyển PT → FT và đổi vị trí từ 15/3: trước ngày đó tính theo hồ sơ cũ, sau đó theo hồ sơ mới; bảng lương xếp theo hồ sơ cuối tháng', ()=>{
  suaNhanVien({pin:'1234',maNV:'313',KieuLuong:'Giờ',LuongGio:'',Loai:'PT',ViTri:'Phục vụ'}); const r0=nghin(cfg('LUONG_Phục vụ')), r1=nghin(cfg('LUONG_Pha chế'));
  addCC('2028-03-10','313','TP','PT1','06:30','12:00',5.5,'Đã xác nhận'); addCC('2028-03-20','313','TP','PT1','06:30','12:00',5.5,'Đã xác nhận');
  const a=suaNhanVien({pin:'1234',maNV:'313',Loai:'FT',ViTri:'Pha chế',ngayApDung:'2028-03-15'}); at('2028-04-02','09:00'); const o=bangLuong({pin:'1234',thang:'2028-03'}).list.find(x=>x.MaNV==='313'); fake=null;
  const comFT=String(cfg('COM_FT_LUON')||'Có')!=='Không';
  return (a.ok && o.tienLuong===Math.round((5.5*r0+5.5*r1)*10)/10 && o.Nhom==='FT' && o.ViTri==='Pha chế' && (!comFT || o.soSuat===1)) || JSON.stringify({a,r0,r1,o:o&&[o.tienLuong,o.Nhom,o.ViTri,o.soSuat]}); });
T('HS4 Tăng lương riêng lần đầu (trước đó dùng mức vị trí): ngày trước lần tăng vẫn theo mức vị trí từng ngày', ()=>{
  const vt=vtLuong(nvByMa('312')); addCC('2028-01-25','312','TP','FT1','06:30','14:30',8,'Đã xác nhận'); at('2028-01-26','08:00'); const a=tangLuong({pin:'1234',maNV:'312',mucMoi:'40',ngay:'2028-01-25'}); fake=null;
  const cu=nghin(hsTaiNgay('LUONG_'+vt,'2028-01-10')), moi=nghin(hsTaiNgay('LUONG_'+vt,'2028-01-20')); at('2028-02-02','09:00'); const o=bangLuong({pin:'1234',thang:'2028-01'}).list.find(x=>x.MaNV==='312'); fake=null;
  return (a.ok && o.tienLuong===Math.round((8*cu+8*moi+8*40)*10)/10) || JSON.stringify({a,cu,moi,o:o&&o.tienLuong}); });
T('DM1 Danh mục trong Cài đặt: thêm vị trí mới, không bỏ được vị trí còn người dùng; mẫu tin nhắn có chỗ chèn; lý do mẫu tới màn hình ra ca & xin phép; chú thích phiếu lương', ()=>{
  const c=danhMuc({pin:'1234'}); const a=luuDanhMuc({pin:'1234',viTri:c.viTri.concat(['Bếp']),chucVu:c.chucVu,lyDoRa:['Kẹt xe','Khác'],lyDoXP:['Ốm','Đi thi'],mauTin:'Chào {ten} – mã {ma} – lịch {link_lich}',ghiChuPhieu:'Trả lương ngày 5.'});
  const b=luuDanhMuc({pin:'1234',viTri:['Bếp'],chucVu:c.chucVu}); const q=luuDanhMuc({pin:'5678',viTri:['x']});
  const tin=tinNhanMa('313','1234'); const n=qrNhanVien({cs:'TP',t:tk('TP'),maNV:'313',deviceId:'d313'}); const l=lichCuaToi({ma:'313',sdt4:sdtOf('313')}); const dn=dangNhap({pin:'1234'});
  const th=themNhanVien({pin:'1234',ten:'Bếp Thử',viTri:'Bếp',loai:'PT',coSo:'TP',sdt:'0900000999'});
  return (a.ok && !b.ok && /Còn nhân viên/.test(b.msg) && !q.ok && /^Chào [^–]+ – mã 313 – lịch http/.test(tin) && n.lyDo.join()==='Kẹt xe,Khác' && l.lyDoXinPhep.join()==='Ốm,Đi thi' && dn.dsViTri.indexOf('Bếp')>-1 && th.ok && rows('NhatKySua').some(x=>/Danh mục: DS_VI_TRI/.test(x.Muc))) || JSON.stringify({a,b,q,tin,ly:n.lyDo,xp:l.lyDoXinPhep,th}); });


// ---------- NAP. Nạp / xoá dữ liệu giờ công ----------
T('NAP1 Dán bảng: đọc ngày dd/mm, mã hoặc tên, mã hoặc tên quán, giờ vào–ra hoặc số giờ + buổi; báo dòng lỗi; bỏ qua ngày đã có lượt, thay thế khi chọn', ()=>{ const ten=tenNgan(nvByMa('309').Ten), tq=rows('CoSo').find(s=>s.MaCS==='TNV').TenCS;
  addCC('2028-05-03','302','TP','FT1','06:40','14:30',8,'Chờ xác nhận');
  const text='Ngày\tMã\tQuán\tVào\tRa\n03/05/2028\t302\tTP\t06:30\t14:30\n04/05/2028\t'+ten+'\t'+tq+'\t17:00\t22:30\n05/05/2028\t302\tTP\t5,5\tSáng\n06/05/2028\t999\tTP\t06:30\t12:00\n07/05/2028\t302\tXYZ\t06:30\t12:00';
  const k=napGioCong({pin:'1234',text,thuNghiem:true}); const bad=napGioCong({pin:'1234',text}); const q=napGioCong({pin:'5678',text});
  const ok=text.split('\n').slice(0,4).join('\n'); const a=napGioCong({pin:'1234',text:ok}); const b=napGioCong({pin:'1234',text:ok.split('\n').slice(0,2).join('\n'),thayThe:true});
  const d3=rows('ChamCong').filter(x=>String(x.MaNV)==='302'&&dateKey(x.Ngay)==='2028-05-03'), d5=rows('ChamCong').find(x=>String(x.MaNV)==='302'&&dateKey(x.Ngay)==='2028-05-05'), d4=rows('ChamCong').find(x=>String(x.MaNV)==='309'&&dateKey(x.Ngay)==='2028-05-04');
  return (k.hopLe===3 && k.loi.length===2 && !bad.ok && !q.ok && a.them===2 && a.boQua.length===1 && b.them===1 && b.thayThe===1 && d3.length===1 && d3[0].TrangThai==='Đã xác nhận' && +d3[0].GioTinh===8 && d3[0].KhaiLoai==='nap'
    && hhmm(d5.Vao)==='06:30' && hhmm(d5.Ra)==='12:00' && /ước tính/.test(d5.CanhBao) && d4.MaCS==='TNV' && +d4.GioTinh===5.5) || JSON.stringify({k,a,b,d3:d3.length}); });
T('NAP2 Nạp theo lịch đã xếp trong khoảng ngày và quán đã chọn; xem trước không ghi', ()=>{ XLL.d.push(['2028-05-10','TP','205','FT1','Pha chế',''],['2028-05-10','DD','304','PT1','Phục vụ',''],['2028-05-11','TP','213','PT1','Phục vụ','']); _LICH=null;
  const x=napTuLich({pin:'1234',tu:'2028-05-10',den:'2028-05-11',cs:['TP'],thuNghiem:true}); const n0=rows('ChamCong').filter(r=>dateKey(r.Ngay)>='2028-05-10'&&dateKey(r.Ngay)<='2028-05-11').length;
  const a=napTuLich({pin:'1234',tu:'2028-05-10',den:'2028-05-11',cs:['TP']}); const L=rows('ChamCong').filter(r=>dateKey(r.Ngay)>='2028-05-10'&&dateKey(r.Ngay)<='2028-05-11');
  at('2028-06-02','09:00'); const o=bangLuong({pin:'1234',thang:'2028-05'}).list.find(z=>z.MaNV==='205'); fake=null;
  return (x.hopLe===2 && n0===0 && a.them===2 && L.length===2 && L.every(r=>r.MaCS==='TP' && r.Cach==='nạp từ lịch') && o && o.gio===8) || JSON.stringify({x,a,L:L.length,o:o&&o.gio}); });
T('NAP3 Xoá giờ công theo khoảng / quán / loại: xem trước đúng số; bắt buộc lý do; chỉ admin; tháng đã chốt bị chặn; có nhật ký', ()=>{
  addCC('2028-05-12','303','TNV','FT1','06:30','14:30',8,'Đã xác nhận'); addCC('2028-05-12','304','DD','PT1','06:30','12:00',5.5,'Đã xác nhận');
  const x=xoaGioCong({pin:'1234',tu:'2028-05-01',den:'2028-05-31',cs:['TNV','DD'],loai:'app',thuNghiem:true}); const a=xoaGioCong({pin:'1234',tu:'2028-05-01',den:'2028-05-31',cs:['TNV','DD'],loai:'app'}); const q=xoaGioCong({pin:'5678',tu:'2028-05-01',den:'2028-05-31',loai:'app',lyDo:'x'});
  const b=xoaGioCong({pin:'1234',tu:'2028-05-01',den:'2028-05-31',cs:['TNV','DD'],loai:'app',lyDo:'nạp lại theo lịch'}); const conNap=rows('ChamCong').filter(r=>dateKey(r.Ngay).slice(0,7)==='2028-05' && r.MaCS==='TNV' && r.KhaiLoai==='nap').length;
  const conApp=rows('ChamCong').filter(r=>dateKey(r.Ngay).slice(0,7)==='2028-05' && ['TNV','DD'].indexOf(r.MaCS)>-1 && r.KhaiLoai!=='nap').length;
  return (x.soLuot===2 && x.gio===13.5 && !a.ok && !q.ok && b.ok && b.soLuot===2 && conApp===0 && conNap===1 && rows('NhatKySua').some(z=>/Xoá giờ công 2028-05-01/.test(z.Muc))) || JSON.stringify({x,a,q,b,conNap,conApp}); });


T('NAP4 Dán số giờ + buổi theo quy tắc quán: Sáng 06:30 + giờ, Trưa 12:00 + giờ, Tối kết thúc lúc đóng cửa (tối 8h ở TP = 14:30–22:30)', ()=>{
  const k=napGioCong({pin:'1234',text:'20/10/2026\t302\tTP\t8\tTối\n19/10/2026\t310\tTNV\t8\tSáng\n19/10/2026\t321\tTP\t5\tTrưa\n21/10/2026\t313\tDD\t5,5\tTối',thuNghiem:true}); const g=k.xem.map(o=>o.vao+'–'+o.ra+' '+o.gio);
  return (g.join('|')==='14:30–22:30 8|06:30–14:30 8|12:00–17:00 5|17:00–22:30 5.5') || JSON.stringify(g); });
T('COM1 Tiền cơm theo giờ đã duyệt: ngày 8h chờ duyệt chưa có cơm, duyệt xong có; ca gãy 5,5h + 5,5h đã duyệt có; Lài full time làm 5,5h không có; tra cứu ghi lý do', ()=>{
  luuCauHinh({pin:'1234',chon:{COM_FT_LUON:'Không'},ngayApDung:'2028-08-01'}); _CFG=null;
  suaNhanVien({pin:'1234',maNV:'315',Loai:'PT',KieuLuong:'Giờ'}); addCC('2028-08-05','315','TP','FT1','06:30','14:30',8,'Chờ xác nhận'); addCC('2028-08-06','315','TP','PT1','06:30','12:00',5.5,'Đã xác nhận'); addCC('2028-08-06','315','TP','PT3','17:00','22:30',5.5,'Đã xác nhận'); addCC('2028-08-07','315','TP','PT1','06:30','12:00',5.5,'Đã xác nhận');
  suaNhanVien({pin:'1234',maNV:'202',Loai:'FT',KieuLuong:'Giờ'}); addCC('2028-08-08','202','TNV','PT1','06:27','12:11',5.5,'Đã xác nhận');
  at('2028-09-02','09:00'); const a=bangLuong({pin:'1234',thang:'2028-08'}).list.find(x=>x.MaNV==='315'); const l=bangLuong({pin:'1234',thang:'2028-08'}).list.find(x=>x.MaNV==='202'); const tc=traCuuGioCong({pin:'1234',thang:'2028-08',maNV:'315'}); fake=null;
  const ly=d=>(tc.ca.find(c=>c.Ngay===d)||{}).ComLy;
  const id=rows('ChamCong').find(x=>String(x.MaNV)==='315'&&dateKey(x.Ngay)==='2028-08-05').ID; xnDuyet({pin:'1234',ids:[id],cach:'dexuat'});
  at('2028-09-02','09:00'); const b=bangLuong({pin:'1234',thang:'2028-08'}).list.find(x=>x.MaNV==='315'); fake=null;
  return (a.soSuat===1 && /đủ 8h đã duyệt/.test(ly('2028-08-06')) && !tc.ca.find(c=>c.Ngay==='2028-08-05').Com && b.soSuat===2 && l.soSuat===0) || JSON.stringify({a:a.soSuat,b:b.soSuat,l:l&&l.soSuat,l6:ly('2028-08-06')}); });
T('KH1 Tổng hợp theo khoảng ngày (VD 10–20): số ngày, ca, giờ, suất cơm, tiền cơm từng người; quản lý không thấy tiền', ()=>{
  suaNhanVien({pin:'1234',maNV:'319',Loai:'PT',KieuLuong:'Giờ'}); ['2028-10-09','2028-10-10','2028-10-15','2028-10-21'].forEach(d=>addCC(d,'319','DD','FT1','06:30','14:30',8,'Đã xác nhận')); addCC('2028-10-12','319','DD','PT1','06:30','12:00',5.5,'Đã xác nhận');
  at('2028-10-25','09:00'); const a=tongHopKhoang({pin:'1234',tu:'2028-10-10',den:'2028-10-20'}), q=tongHopKhoang({pin:'5678',tu:'2028-10-10',den:'2028-10-20'}); fake=null;
  const x=a.list.find(z=>z.MaNV==='319'), y=q.list.find(z=>z.MaNV==='319'); const gia=nghin(cfg('COM_GIA_'+vtLuong(nvByMa('319'))))||20;
  return (x.soNgay===3 && x.ca===3 && x.gio===21.5 && x.suat===2 && x.tienCom===2*gia && x.theoCS.DD===21.5 && y && y.tienCom===undefined && y.suat===2) || JSON.stringify({x,y}); });


T('KH2 Tra cứu dạng lưới: mỗi ô có khung giờ từng ca, tổng giờ ngày, cơm; tổng cuối hàng / cuối cột; lọc quán; quản lý theo quán không thấy quán khác', ()=>{
  addCC('2028-10-15','319','TP','PT3','17:00','22:30',5.5,'Đã xác nhận');
  at('2028-10-25','09:00'); const a=traCuuLuoi({pin:'1234',tu:'2028-10-10',den:'2028-10-20'}), b=traCuuLuoi({pin:'1234',tu:'2028-10-10',den:'2028-10-20',cs:'TP'}), c=traCuuLuoi({pin:'1357',tu:'2028-10-10',den:'2028-10-20'}), e=traCuuLuoi({pin:'1234',tu:'2028-10-01',den:'2028-12-31'}); fake=null;
  const y=a.list.find(z=>z.MaNV==='319'), d15=y.ngay['2028-10-15'], col15=a.cot.find(z=>z.ngay==='2028-10-15');
  return (a.ngays.length===11 && d15.ca.length===2 && d15.gio===13.5 && d15.com && /đủ 8h/.test(d15.ly) && y.soNgay===3 && y.gio===27 && y.suat===2 && col15.gio>=13.5
    && b.list.find(z=>z.MaNV==='319').gio===5.5 && c.list.every(z=>Object.keys(z.ngay).every(k=>z.ngay[k].ca.every(q=>q.cs==='DD'))) && !e.ok) || JSON.stringify({n:a.ngays.length,d15,y:y&&[y.soNgay,y.gio,y.suat],b:b.list.find(z=>z.MaNV==='319'),e}); });


T('TG8 Ra ca giảm / tăng ca: không dính "có mặt" từ lần chọn đủ ca; cảnh báo khai giờ bắt đầu sớm hơn giờ quét; số giờ dùng dấu phẩy', ()=>{ tgSet({TG_MUC:'tatca',TG_CHAT:'-1001',TG_CHAT_LDD:''}); TG_SENT.length=0; const D='2028-11-03'; XLL.d.push([D,'LDD','301','FT1','Phục vụ',''],[D,'LDD','307','FT10','Phục vụ','']); _LICH=null;
  sh('ThietBi').d.push(['301','d301',new Date()],['307','d307',new Date()]);
  vao('LDD','301','07:04',D,{maCa:'FT1'}); const a=ra('LDD','301','14:31',D,{khaiLoai:'giam',tu:'07:04',den:'14:30',coMat:'06:30',lyDo:'Khác'});
  vao('LDD','307','06:57',D,{maCa:'FT10'}); const b=ra('LDD','307','17:26',D,{khaiLoai:'tang',tu:'06:29',den:'17:26',lyDo:'Khác'}); fake=null;
  const r1=rows('ChamCong').find(x=>String(x.MaNV)==='301'&&dateKey(x.Ngay)===D), m=TG_SENT.map(x=>x.text).join('\n'); at(D,'20:00'); const L=xnDanhSach({pin:'1234',ngay:D}); fake=null; const k=L.list.find(z=>z.MaNV==='307');
  return (!r1.CoMat && !/khai có mặt 06:30/.test(m) && /GIẢM CA 07:04–14:30 \(khai 7,5h, ca 8h\)/.test(m) && /quét mã lúc 07:04/.test(m) && /Khai bắt đầu 06:29 sớm hơn giờ quét mã 06:57/.test(m) && k.Nhan.some(t=>/khai bắt đầu 06:29, quét mã 06:57/.test(t[0]))) || JSON.stringify({co:r1.CoMat,m,nhan:k&&k.Nhan}); });


T('KQ1 Vào ca ở quán này, quét ra ở quán khác: ra được, lượt ghi cảnh báo "Ra ca ở … (vào ở …)" để quản lý chia giờ, không tự xác nhận', ()=>{ const D='2028-11-10'; XLL.d.push([D,'TP','313','FT1','Phục vụ','']); _LICH=null; sh('ThietBi').d.push(['313','d313',new Date()]);
  vao('TP','313','06:30',D,{maCa:'FT1'}); at(D,'14:31'); const r=qrRa(Object.assign({cs:'DD',t:tk('DD'),maNV:'313',deviceId:'d313',khaiLoai:'du'},viTriQuan('DD'))); fake=null;
  const row=rows('ChamCong').find(x=>String(x.MaNV)==='313'&&dateKey(x.Ngay)===D);
  return (r.ok && row.MaCS==='TP' && /Ra ca ở Đống Đa \(vào ở TP\)/.test(row.CanhBao) && !r.khopLich) || JSON.stringify({r,cb:row.CanhBao}); });


// ---------- BH. Báo hư hỏng ----------
T('BH1 Nhân viên báo hư hỏng (xác minh mã + 4 số): báo nhóm Telegram quán; quản lý quán khác không thấy; nhận việc → xong → báo xong; danh sách nhân viên thấy trạng thái', ()=>{ tgSet({TG_TOKEN:'TOKOK',TG_CHAT_DD:'-1003'}); TG_SENT.length=0;
  const a=baoHong({ma:'304',sdt4:sdtOf('304'),cs:'DD',mon:'Máy pha cà phê',moTa:'rò nước vòi hơi',mucDo:'Gấp'}); const coSo=rows('NhanVien').find(n=>String(n.SDT||'').replace(/\D/g,'').length>=4&&dangLam(n)); const sai=baoHong({ma:String(coSo.MaNV),sdt4:'0000',cs:'DD',mon:'x'}); const thieu=baoHong({ma:'304',sdt4:sdtOf('304'),cs:'DD',mon:''});
  const m=(TG_SENT.find(x=>x.chat_id==='-1003')||{}).text||''; const tp=baoHong({ma:'313',sdt4:sdtOf('313'),cs:'TP',mon:'Máy xay'}); const qDD=dsBaoHong({pin:'1357'}); const id=a.id;
  const k1=capNhatBaoHong({pin:'1357',id:tp.id,tt:'Đang xử lý'}); const k2=capNhatBaoHong({pin:'1357',id,tt:'Đang xử lý',ghiChu:'đã gọi thợ'}); const k3=capNhatBaoHong({pin:'1357',id,tt:'Đã xong',ghiChu:'thay gioăng 150k'});
  const nv=dsBaoHongNV({ma:'304',sdt4:sdtOf('304'),cs:'DD'}); const ql=baoHongQL({pin:'1357',cs:'TP',mon:'Tủ lạnh'}); const ql2=baoHongQL({pin:'1357',cs:'DD',mon:'Tủ lạnh',moTa:'không lạnh'}); tgSet({TG_CHAT_DD:''});
  const x=nv.list.find(z=>z.ID===id);
  return (a.ok && !sai.ok && !thieu.ok && /🚨 BÁO HƯ HỎNG · Đống Đa · GẤP/.test(m) && /Máy pha cà phê: rò nước/.test(m) && qDD.list.some(z=>z.ID===id) && !qDD.list.some(z=>z.ID===tp.id) && !k1.ok && k2.ok && k3.ok && x.TrangThai==='Đã xong' && /150k/.test(x.GhiChuXuLy) && TG_SENT.some(z=>/ĐÃ SỬA XONG/.test(z.text)) && !ql.ok && ql2.ok) || JSON.stringify({a,sai,thieu,m,k1,k2,k3,x,ql,ql2}); });


T('KS9 Quản lý dùng được Khảo sát: xem đối chiếu, nạp, xác nhận kỹ năng, cấp mã nhân viên mới; nhật ký ghi tên quản lý; quản lý vẫn không tự thêm nhân viên ngoài khảo sát', ()=>{
  const a=ksDoiChieu({pin:'1357'}); const g=ksGui({moi:true,data:{hoTen:'Trần Văn Khảo',tenGoi:'Khảo',sdt:'0905111222',viTriChinh:'Phục vụ',loai:'PT',quanChinh:'DD',ngayVao:'2028-12-01'}});
  const b=ksDoiChieu({pin:'1357'}); const d=b.dong.find(x=>x.moi && (x.data||{}).hoTen==='Trần Văn Khảo');
  const c=ksCapMa({pin:'1357',id:d.id}); const tu=themNhanVien({pin:'1357',ten:'Ai đó',viTri:'Phục vụ'}); const sai=ksDoiChieu({pin:'0000'});
  return (a.ok && g.ok && c.ok && c.maNV && nvByMa(c.maNV) && !tu.ok && !sai.ok && rows('NhatKySua').some(z=>/Khảo sát: cấp mã mới/.test(z.Muc) && z.Boi==='QL ĐĐ')) || JSON.stringify({a:a.ok,g,c,tu,sai,nk:rows('NhatKySua').slice(-2)}); });


// ---------- PQ. Phân quyền ----------
T('PQ1 Mặc định: Trưởng ca xem Xác nhận giờ nhưng không duyệt; báo / xử lý hư hỏng được; không xem Khảo sát, Lương; Quản lý giữ quyền cũ; đăng nhập trả bản đồ quyền', ()=>{
  sh('TaiKhoan').d.push(['TC Test','2222','Trưởng ca','Không','','']);
  const L=dangNhap({pin:'2222'}), Lq=dangNhap({pin:'1357'}), La=dangNhap({pin:'1234'}); const D='2028-12-02';
  addCC(D,'302','TP','FT1','06:30','14:30',8,'Chờ xác nhận'); const id=rows('ChamCong').find(x=>String(x.MaNV)==='302'&&dateKey(x.Ngay)===D).ID;
  const xem=xnDanhSach({pin:'2222',ngay:D}), duyet=xnDuyet({pin:'2222',ids:[id],cach:'dexuat'}), hong=baoHongQL({pin:'2222',cs:'TP',mon:'Máy xay'}), ks=ksDoiChieu({pin:'2222'}), bl=bangLuong({pin:'2222',thang:'2028-12'}), ql=xnDuyet({pin:'1357',ids:[id],cach:'dexuat'});
  return (L.ok && L.role==='tc' && L.quyen.duyet===1 && L.quyen.hong===2 && L.quyen.ks===0 && L.quyen.cd===0 && Lq.quyen.duyet===2 && Lq.quyen.ks===2 && La.quyen.luong===2 && La.quyen.cd===2
    && xem.ok && !duyet.ok && hong.ok && !ks.ok && !bl.ok && ql.ok) || JSON.stringify({L:L.quyen,xem:xem.ok,duyet,hong,ks:ks.ok,bl:bl.ok,ql}); });
T('PQ2 Admin đổi bảng phân quyền: Trưởng ca được duyệt; Quản lý được xem Lương & Nhân sự (thấy lương) nhưng không sửa; mức vượt giới hạn bị chặn về "xem"; quản lý không đổi được phân quyền; có nhật ký', ()=>{
  const b=phanQuyen({pin:'1234'}).bang; b.tc.duyet=2; b.ql.luong=1; b.ql.ns=2; b.ql.nk=1;
  const s=luuPhanQuyen({pin:'1234',bang:b}), s2=luuPhanQuyen({pin:'1357',bang:b}); const D='2028-12-03';
  addCC(D,'303','TP','FT1','06:30','14:30',8,'Chờ xác nhận'); const id=rows('ChamCong').find(x=>String(x.MaNV)==='303'&&dateKey(x.Ngay)===D).ID;
  const d=xnDuyet({pin:'2222',ids:[id],cach:'dexuat'}); at('2029-01-02','09:00'); const bl=bangLuong({pin:'1357',thang:'2028-12'}); fake=null; const sua=luuO({pin:'1357',thang:'2028-12',maNV:'303',k:'PhuCap',v:'100'}); const ns=dsNhanVien({pin:'1357'}), nk=nhatKySua({pin:'1357'});
  const b2=phanQuyen({pin:'1234'}).bang; b2.ql.luong=0; luuPhanQuyen({pin:'1234',bang:b2}); const ns2=dsNhanVien({pin:'1357'});
  return (s.ok && s.bang.ql.ns===1 && !s2.ok && d.ok && bl.ok && !sua.ok && ns.ok && ns.list[0].LuongGio!==undefined && nk.ok && ns2.ok && ns2.list[0].LuongGio===undefined && rows('NhatKySua').some(z=>/Phân quyền Trưởng ca: Xác nhận giờ/.test(z.Muc))) || JSON.stringify({s:s.bang&&s.bang.ql,s2,d,bl:bl.ok,sua,ns:ns.ok&&ns.list[0].LuongGio,ns2:ns2.list&&ns2.list[0].LuongGio}); });
T('PQ3 Điều chỉnh giờ theo bảng phân quyền (Trưởng ca được sửa giờ / thêm lượt); ô riêng "có quyền điều chỉnh giờ" của tài khoản vẫn cộng thêm; đặt lại mặc định', ()=>{
  const D='2028-12-04'; at('2028-12-05','09:00'); const a=xnThemLuot({pin:'2222',ma:'304',ngay:D,cs:'TP',vao:'06:30',ra:'12:00',lyDo:'quên điện thoại'});
  const b=phanQuyen({pin:'1234'}).bang; b.tc.suagio=2; luuPhanQuyen({pin:'1234',bang:b}); const c=xnThemLuot({pin:'2222',ma:'304',ngay:D,cs:'TP',vao:'06:30',ra:'12:00',lyDo:'quên điện thoại'}); fake=null;
  luuPhanQuyen({pin:'1234',bang:phanQuyen({pin:'1234'}).macDinh}); const e=dangNhap({pin:'2222'}), r=dangNhap({pin:'2468'});
  return (!a.ok && c.ok && e.quyen.suagio===0 && e.quyen.duyet===1 && r.quyen.suagio===2) || JSON.stringify({a,c,e:e.quyen,r:r.quyen}); });


T('SP1 Tốc độ: lịch Xếp lịch đọc từ bộ nhớ đệm (không mở lại file trong 3 phút); tài khoản đọc 1 lần mỗi lượt; xoá bộ nhớ đệm thì đọc lại', ()=>{
  CACHE_BAT=true; let mo=0; const ob=SpreadsheetApp.openById; SpreadsheetApp.openById=function(id){ mo++; return ob(id); };
  lichXoaCache(); _LICH=null; const a=lichDaXep().length; _LICH=null; const b=lichDaXep().length; const m1=mo;
  XLL.d.push(['2028-12-20','TP','302','FT1','Phục vụ','']); _LICH=null; const c1=lichDaXep().length; lichXoaCache(); const c2=lichDaXep().length;
  SpreadsheetApp.openById=ob; CACHE_BAT=false; _LICH=null;
  let doc=0; const R=Object.getPrototypeOf(SpreadsheetApp.getActiveSpreadsheet().getSheetByName('TaiKhoan').getDataRange()), gv=R.getValues; R.getValues=function(){ if(this.sh.n==='TaiKhoan'&&this.r===1) doc++; return gv.apply(this,arguments); };
  _TKROWS=null; xnDanhSach({pin:'1357',ngay:'2028-12-02'}); R.getValues=gv;
  return (a>0 && b===a && m1===1 && c1===a && c2===a+1 && doc===1) || JSON.stringify({a,b,m1,c1,c2,doc}); });


T('VT1 Không lấy được định vị: nhãn ghi rõ lý do (chưa cho phép / hết thời gian / mở trong Zalo) để quản lý và nhân viên biết cách sửa; quán chưa lưu vị trí vẫn ghi riêng', ()=>{
  const s=rows('CoSo').find(x=>x.MaCS==='TP'), sNo=Object.assign({},s,{ViDo:'',KinhDo:''});
  const a=canhBao(s,'302',{lat:'',lng:'',loiViTri:'chưa cho phép',deviceId:'x'}).cb, b=canhBao(s,'302',{lat:'',lng:'',loiViTri:'hết thời gian chờ',trongApp:1,deviceId:'x'}).cb, c=canhBao(sNo,'302',{lat:16.06,lng:108.2,acc:20,deviceId:'x'}).cb, d=canhBao(s,'302',{lat:'',lng:''}).cb;
  return (/Không lấy được định vị \(chưa cho phép\)/.test(a) && /hết thời gian chờ, mở trong Zalo/.test(b) && /Quán chưa lưu vị trí/.test(c) && /^Không lấy được định vị(;|$)/.test(d)) || JSON.stringify({a,b,c,d}); });


T('DL1 Tắt "Đọc lịch từ app Xếp lịch": không mở file Xếp lịch, không có nhãn khớp lịch / vắng; bật lại thì đọc lại', ()=>{
  let mo=0; const ob=SpreadsheetApp.openById; SpreadsheetApp.openById=function(id){ mo++; return ob(id); };
  setCfg('DOC_LICH','Không'); _CFG=null; _LICH=null; const a=lichDaXep().length, m1=mo; const x=xnDanhSach({pin:'1234',ngay:'2026-11-02'});
  setCfg('DOC_LICH','Có'); _CFG=null; _LICH=null; const b=lichDaXep().length; SpreadsheetApp.openById=ob;
  return (a===0 && m1===0 && x.ok && (x.vang||[]).length===0 && b>0) || JSON.stringify({a,m1,b,vang:(x.vang||[]).length}); });
T('PQ4 Bảng tài khoản trong Cài đặt giữ đúng vai trò Trưởng ca (lưu lại không bị đổi thành Quản lý)', ()=>{
  const r=caiDat({pin:'1234'}); const tc=r.taiKhoan.find(t=>t.PIN==='2222');
  const s=luuTaiKhoan({pin:'1234',list:r.taiKhoan}); const r2=caiDat({pin:'1234'}).taiKhoan.find(t=>t.PIN==='2222');
  return (tc && tc.VaiTro==='Trưởng ca' && s.ok && r2.VaiTro==='Trưởng ca' && dangNhap({pin:'2222'}).role==='tc') || JSON.stringify({tc,s,r2}); });


T('XN9 Duyệt / sửa / bỏ duyệt trả về thẻ đã cập nhật (trang thay tại chỗ, không tải lại); thẻ giống hệt thẻ trong danh sách', ()=>{
  const D='2029-03-03'; addCC(D,'305','TP','FT1','06:30','14:30',8,'Chờ xác nhận'); addCC(D,'309','TP','FT1','06:40','14:30',8,'Chờ xác nhận'); at('2029-03-04','09:00');
  const L=xnDanhSach({pin:'1234',ngay:D}).list, a=L.find(x=>x.MaNV==='305'), b=L.find(x=>x.MaNV==='309');
  const r1=xnDuyet({pin:'1234',ids:[a.ID,b.ID],cach:'dexuat'}); const r2=xnDuyet({pin:'1234',ids:[b.ID],cach:'sua',vao:'06:40',ra:'13:40',coPhep:'Có lý do',lyDo:'về sớm'});
  const r3=xnBoDuyet({pin:'1234',id:a.ID}); const L2=xnDanhSach({pin:'1234',ngay:D}).list; fake=null;
  const c2=r2.cap[0], l2=L2.find(x=>x.ID===b.ID), c3=r3.cap[0];
  const giong=k=>JSON.stringify(c2[k])===JSON.stringify(l2[k]);
  return (r1.cap.length===2 && r1.cap.every(x=>x.TrangThai==='Đã xác nhận') && c2.GioTinh===7 && c2.Cach==='sửa 06:40–13:40' && ['TrangThai','GioTinh','Vao','Ra','Cach','CoPhep','LyDoSua','Nhan','DeXuat','GioCham','Khoa'].every(giong) && c3.TrangThai==='Chờ xác nhận' && c3.ID===a.ID) || JSON.stringify({r1:r1.cap.length,c2,l2,c3}); });


T('TG9 Vào / ra ca và báo hư hỏng gửi ẢNH kèm chữ vào nhóm quán; tắt "gửi kèm ảnh" thì gửi chữ như cũ', ()=>{ tgSet({TG_TOKEN:'TOKOK',TG_MUC:'tatca',TG_CHAT_DD:'-1003'}); TG_SENT.length=0; const D='2029-04-02';
  const ANH='data:image/jpeg;base64,'+Buffer.from('anh-that').toString('base64'); sh('ThietBi').d.push(['312','d312',new Date()]);
  const v1=vao('DD','312','06:30',D,{photo:ANH,maCa:'FT1'}); const a=TG_SENT.slice(-1)[0]||{loi:v1}; const r1=ra('DD','312','14:30',D,{khaiLoai:'du',photo:ANH}); const b=TG_SENT.slice(-1)[0]||{loi:r1};
  baoHong({ma:'312',sdt4:sdtOf('312'),cs:'DD',mon:'Máy xay',photo:ANH}); const c=TG_SENT.slice(-1)[0];
  luuTelegram({pin:'1234',token:'TOKOK',chung:'',rieng:{DD:'-1003'},muc:'tatca',nhacCa:'Có',sauPhut:60,tongKet:'Không',gio:23,anh:'Không'}); _CFG=null; const v2=vao('DD','312','17:00',D,{photo:ANH,maCa:'PT3'}); const d=TG_SENT.slice(-1)[0]||{loi:v2}; fake=null;
  tgSet({TG_CHAT_DD:'',TG_ANH:'Có'});
  return (a._anh && /vào ca/.test(a.text) && a.chat_id==='-1003' && b._anh && /ra ca/.test(b.text) && c._anh && /BÁO HƯ HỎNG/.test(c.text) && !d._anh && /vào ca/.test(d.text)) || JSON.stringify({a,b,c,d}); });


// ---------- GT. Làm tròn, ngưỡng tăng ca, tách giờ ----------
T('GT1 Làm tròn theo cài đặt: 15 phút (mặc định) 06:30–14:22 = 7,75h; 1 phút = 7,87h', ()=>{ const a=gioGiua('06:30','14:22'); setCfg('LAM_TRON_PHUT',1); _CFG=null; const b=gioGiua('06:30','14:22'); setCfg('LAM_TRON_PHUT',15); _CFG=null; return (a===7.75 && b===7.87) || JSON.stringify({a,b}); });
T('GT2 Tăng ca dưới 30 phút không tính (duyệt ra giờ ca, ghi chú rõ); từ 30 phút tính; đặt 0 thì phút nào cũng tính; tra cứu ghi "tăng ca 30\'"', ()=>{ const D='2029-05-02';
  addCC(D,'302','TP','FT1','06:30','14:50',8,'Chờ xác nhận',{KhaiLoai:'tang',KhaiTu:'06:30',KhaiDen:'14:50',KhaiGio:8.33}); addCC(D,'303','TP','FT1','06:30','15:00',8,'Chờ xác nhận',{KhaiLoai:'tang',KhaiTu:'06:30',KhaiDen:'15:00',KhaiGio:8.5});
  const L=rows('ChamCong').filter(x=>dateKey(x.Ngay)===D), a=L.find(x=>String(x.MaNV)==='302'), b=L.find(x=>String(x.MaNV)==='303');
  // (28/10) quy tắc chỉ áp cho giờ APP ĐỀ XUẤT ("Duyệt theo đề xuất"); quản lý sửa tay thì giữ đúng giờ đã nhập
  at('2029-05-03','09:00'); const r=xnDuyet({pin:'1234',ids:[a.ID,b.ID],cach:'dexuat'}); const r2={cap:r.cap.filter(x=>x.ID===b.ID)};
  setCfg('TANG_CA_TU_PHUT',0); _CFG=null; const r3=xnDuyet({pin:'1234',ids:[a.ID],cach:'dexuat'}); setCfg('TANG_CA_TU_PHUT',30); _CFG=null;
  const g=id=>+rows('ChamCong').find(x=>x.ID===id).GioTinh; const tl=traCuuLuoi({pin:'1234',tu:D,den:D}); fake=null; const kb=tl.list.find(x=>x.MaNV==='303').ngay[D].ca[0];
  return (r.cap.find(x=>x.ID===a.ID).GioTinh===8 && /tăng ca dưới 30' không tính/.test(r.cap.find(x=>x.ID===a.ID).Cach) && r2.cap[0].GioTinh===8.5 && g(a.ID)===8.25 && kb.tc===30) || JSON.stringify({r:r.cap.map(x=>[x.GioTinh,x.Cach]),r2:r2.cap[0].GioTinh,a:g(a.ID),kb}); });
T('GT3 Bảng lương tách giờ: tăng ca, ngày lễ, sau 22h (chỉ thống kê)', ()=>{ const D='2029-06-02', D2='2029-06-03';
  luuCauHinh({pin:'1234',ngayLe:[{Ngay:D,HeSo:2,Ten:'Lễ thử'}]}); _CFG=null;
  addCC(D,'304','TP','FT1','06:30','14:30',8,'Đã xác nhận',{KhaiLoai:'du'}); addCC(D2,'304','TP','FT2','14:30','22:30',8,'Đã xác nhận',{KhaiLoai:'du'}); addCC('2029-06-04','304','TP','FT1','06:30','15:30',9,'Đã xác nhận',{KhaiLoai:'tang',KhaiDen:'15:30'});
  at('2029-07-02','09:00'); const o=bangLuong({pin:'1234',thang:'2029-06'}).list.find(x=>x.MaNV==='304'); fake=null;
  return (o.gio===25 && o.gioLeThuc===8 && o.gioDem===0.5 && o.gioTC===1) || JSON.stringify({gio:o.gio,le:o.gioLeThuc,dem:o.gioDem,tc:o.gioTC}); });


T('DUP1 Bấm gửi 2 lần chỉ ghi 1 lần: báo quên chấm, xin phép, phản hồi, báo hư hỏng; Telegram chỉ 1 tin; bị từ chối thì gửi lại được', ()=>{ tgSet({TG_TOKEN:'TOKOK',TG_CHAT:'-1001'}); const ID={ma:'313',sdt4:sdtOf('313')}; at('2029-07-10','09:00');
  const n=t=>(SS.getSheetByName(t)?rows(t).length:0); const q0=n('BaoQuen'), p0=n('XinPhep'), h0=n('BaoHong'), ph0=n('PhanHoi'); TG_SENT.length=0;
  const a1=baoQuenCham(Object.assign({},ID,{ngay:'2029-07-09',tu:'06:30',den:'14:30',lyDo:'quên'})), a2=baoQuenCham(Object.assign({},ID,{ngay:'2029-07-09',tu:'06:30',den:'14:30',lyDo:'quên'}));
  const b1=xinPhep(Object.assign({},ID,{ngay:'2029-07-12',loai:'nghi',lyDo:'ốm'})), b2=xinPhep(Object.assign({},ID,{ngay:'2029-07-12',loai:'nghi',lyDo:'ốm'}));
  const c1=baoHong(Object.assign({},ID,{cs:'TP',mon:'Máy xay',moTa:'kêu to'})), c2=baoHong(Object.assign({},ID,{cs:'TP',mon:'Máy xay',moTa:'kêu to'}));
  addCC('2029-07-08','313','TP','FT1','06:30','14:30',8,'Đã xác nhận'); const cc=rows('ChamCong').find(x=>String(x.MaNV)==='313'&&dateKey(x.Ngay)==='2029-07-08');
  const d1=phanHoi(Object.assign({},ID,{ccId:cc.ID,noiDung:'em đến 6h'})), d2=phanHoi(Object.assign({},ID,{ccId:cc.ID,noiDung:'em đến 6h'}));
  const tg=TG_SENT.length; const bq=rows('BaoQuen').filter(x=>String(x.MaNV)==='313'&&dateKey(x.Ngay)==='2029-07-09'); bqQuyetDinh({pin:'1234',id:bq[0].ID,dongY:false});
  const a3=baoQuenCham(Object.assign({},ID,{ngay:'2029-07-09',tu:'06:30',den:'14:30',lyDo:'quên, gửi lại'})); fake=null;
  return (a1.ok && a2.ok && a2.trung && b2.trung && c2.trung && d2.trung && n('BaoQuen')===q0+2 && n('XinPhep')===p0+1 && n('BaoHong')===h0+1 && n('PhanHoi')===ph0+1 && tg===4 && a3.ok && !a3.trung) || JSON.stringify({a2,b2,c2,d2,q:n('BaoQuen')-q0,p:n('XinPhep')-p0,h:n('BaoHong')-h0,ph:n('PhanHoi')-ph0,tg,a3}); });


// ---------- BLK. Bảng lương theo khoảng ngày, nạp lương hàng loạt ----------
T('BLK1 Bảng lương 1–15 + 16–cuối cộng lại bằng cả tháng (giờ, tiền lương, suất cơm); quản lý không có quyền Lương bị chặn; xuất ra tab Sheet', ()=>{ const th='2029-08';
  [['2029-08-03',8],['2029-08-10',5.5],['2029-08-15',8],['2029-08-20',9],['2029-08-28',7]].forEach(([d,g])=>addCC(d,'305','TP','FT1','06:30','14:30',g,'Đã xác nhận'));
  at('2029-09-02','09:00'); const a=bangLuongKhoang({pin:'1234',tu:th+'-01',den:th+'-15'}), b=bangLuongKhoang({pin:'1234',tu:th+'-16',den:th+'-31'}), c=bangLuong({pin:'1234',thang:th}), q=bangLuongKhoang({pin:'1357',tu:th+'-01',den:th+'-15'});
  const x=xuatLuongKhoang({pin:'1234',tu:th+'-01',den:th+'-15'}); fake=null;
  const A=a.list.find(y=>y.MaNV==='305'), B=b.list.find(y=>y.MaNV==='305'), C=c.list.find(y=>y.MaNV==='305');
  return (A.gio===21.5 && B.gio===16 && A.gio+B.gio===C.gio && Math.abs(A.tienLuong+B.tienLuong-C.tienLuong)<0.2 && A.soSuat+B.soSuat===C.soSuat && A.soNgay===3 && !q.ok && x.ok && !!SS.getSheetByName(x.ten)) || JSON.stringify({A,B,C:C&&[C.gio,C.tienLuong,C.soSuat],q,x}); });
T('BLK2 Nạp lương giờ hàng loạt: kiểm tra trước; người chưa có lương ghi thẳng; người đã có lương ghi như tăng lương từ ngày áp dụng; lương cố định báo lỗi; quản lý không làm được', ()=>{
  suaNhanVien({pin:'1234',maNV:'306',LuongGio:20}); suaNhanVien({pin:'1234',maNV:'402',KieuLuong:'Cố định',LuongCoBan:'6000'});
  const t1='Mã\tLương giờ\n307\t23\n306\t24,5\nCô Minh\t20', k=napLuongGio({pin:'1234',text:t1,ngay:'2029-10-01',thuNghiem:true}), sai=napLuongGio({pin:'1234',text:t1,ngay:'2029-10-01'});
  const ok=napLuongGio({pin:'1234',text:'307\t23\n306\t24,5',ngay:'2029-10-01'}), q=napLuongGio({pin:'1357',text:'307\t23',ngay:'2029-10-01'});
  const ls=rows('LichSuLuong').filter(x=>String(x.MaNV)==='306'); suaNhanVien({pin:'1234',maNV:'402',KieuLuong:'Giờ'});
  return (k.hopLe===2 && k.loi.length===1 && !sai.ok && ok.ok && ok.doi===2 && nghin(nvByMa('307').LuongGio)===23 && nghin(nvByMa('306').LuongGio)===24.5 && ls.length===1 && dateKey(ls[0].Ngay)==='2029-10-01' && !q.ok) || JSON.stringify({k,sai,ok,q,ls:ls.length}); });


// ---------- DR. Đọc file cũ trên Drive ----------
T('DR1 Nạp giờ từ file chấm công cũ: CFMH là tổng, phần TNV ghi TNV, phần gãy ghi "gãy ?", LĐD đọc theo dòng (ngày ghi sai), tên đã xác nhận, cấp mã người mới, tổng giờ khớp file', ()=>{
  const D=s=>new Date(s+'T00:00:00+07:00'), mk=(tabs)=>{ const s=SpreadsheetApp.create('F'); Object.keys(tabs).forEach(k=>{ s.insertSheet(k).d=tabs[k]; }); return s.getId(); };
  const cf=mk({'11.1 TP':[['STT',1,2,3],['Tên Nhân viên','Kim Nhung','Trung','Nhã'],[D('2029-11-01'),14,5.5,'Off'],[D('2029-11-02'),'11',' ',6],['Total',25,5.5,6]],'Trễ 11.1 TP':[['x'],['y','Kim Nhung'],[D('2029-11-01'),99]]});
  const ln=mk({'T11':[['STT',1,2],['Tên Nhân viên','Đức Trung','Thu Hiền'],[D('1929-10-01'),8,5],[D('1929-10-02'),'off',5]]});
  const tv=mk({'T11':[['STT',1,2],['Tên Nhân viên','Kim Nhung TNV','Kim Nhung gãy'],[D('2029-11-01'),8.5,5.5],[D('2029-11-02'),11,'']]});
  setCfg('FILE_CC_CFMH',cf); setCfg('FILE_CC_LDD',ln); setCfg('FILE_CC_TNV',tv); _CFG=null; at('2029-11-05','09:00');
  const k=napTuFileChamCong({pin:'1234',tu:'2029-11-01',den:'2029-11-02',thuNghiem:true}), a=napTuFileChamCong({pin:'1234',tu:'2029-11-01',den:'2029-11-02'}), q=napTuFileChamCong({pin:'1357',tu:'2029-11-01',den:'2029-11-02'}); fake=null;
  const L=rows('ChamCong').filter(r=>r.KhaiLoai==='nap' && dateKey(r.Ngay).slice(0,7)==='2029-11'), nh=L.filter(r=>String(r.MaNV)==='203'&&dateKey(r.Ngay)==='2029-11-01');
  return (k.tongGio===44.5 && k.tao.indexOf('Nhã')>-1 && k.bo.indexOf('Thu Hiền')>-1 && a.ok && a.maMoi['Nhã'] && L.length===6 && nh.length===2 && nh.every(r=>r.MaCS==='TNV') && /gãy \?/.test(nh[1].CanhBao)
    && L.some(r=>String(r.MaNV)==='316'&&r.MaCS==='DD'&&+r.GioTinh===5.5) && L.some(r=>String(r.MaNV)==='308'&&r.MaCS==='LDD'&&dateKey(r.Ngay)==='2029-11-01'&&+r.GioTinh===8) && !q.ok) || JSON.stringify({k,a,L:L.map(r=>[r.MaNV,r.MaCS,dateKey(r.Ngay),r.GioTinh])}); });
T('DR2 Lấy lương giờ từ BẢNG LƯƠNG CFM: tab tháng mới nhất có dòng "Lương giờ", nhiều nhóm (FT, PT), xem trước rồi nạp', ()=>{
  const s=SpreadsheetApp.create('BL'); s.insertSheet('Tháng 1').d=[['T1/2026'],['Lương tháng 1',1,2],['Full time','Phương Thanh','Hồ Lài'],['Giờ làm',200,180],['Lương giờ',20,20]];
  s.insertSheet('Tháng 9').d=[['T9/2026'],['Lương tháng 9',1,2,3],['Full time','Phương Thanh','Hồ Lài','Kim Nhung'],['Giờ làm',250,240,300],['Lương giờ',28,'26',25],[''],['Lương tháng 9',1,2],['Part time','Hà An','Ai Lạ'],['Giờ làm',100,50],['Lương giờ','21,5',19]];
  setCfg('FILE_BANG_LUONG',s.getId()); _CFG=null;
  const k=luongTuBangLuong({pin:'1234',ngay:'2026-10-01',thuNghiem:true}), a=luongTuBangLuong({pin:'1234',ngay:'2026-10-01'});
  return (k.tab==='Tháng 9' && k.hopLe+k.coDinh.length===4 && k.khongRo.some(x=>/Ai Lạ/.test(x)) && a.ok && !a.loi.length && nghin(nvByMa('202').LuongGio)===26 && nghin(nvByMa('214').LuongGio)===21.5) || JSON.stringify({k,a}); });


// ---------- WF. Wifi quán ----------
T('WF1 Wifi quán – Cảnh báo: chưa có IP thì không kiểm tra; có IP: wifi bất kỳ quán nào trong hệ thống đều hợp lệ (vào TP bằng wifi ĐĐ được), khác IP thì vẫn chấm nhưng có nhãn', ()=>{ const D='2029-12-03';
  IP_KHACH='9.9.9.9'; const a=vao('TP','302','06:30',D,{maCa:'FT1'}); const ra0=ra('TP','302','14:30',D,{khaiLoai:'du'});
  wifiThem({pin:'1234',ip:'113.161.72.15',cs:'DD'}); _CFG=null;
  IP_KHACH='113.161.72.15'; const b=vao('TP','303','06:30',D,{maCa:'FT1'}); IP_KHACH='42.1.2.3'; const c=vao('TD','304','06:30',D,{maCa:'FT1'}); IP_KHACH=''; fake=null;
  const cb=m=>String(rows('ChamCong').find(x=>String(x.MaNV)===m&&dateKey(x.Ngay)===D).CanhBao||'');
  return (a.ok && !/wifi/.test(cb('302')) && b.ok && !/wifi/.test(cb('303')) && c.ok && /Không dùng wifi quán \(42\.1\.2\.3\)/.test(cb('304'))) || JSON.stringify({a,b,c,cb:[cb('302'),cb('303'),cb('304')]}); });
T('WF2 Wifi quán – Bắt buộc: khác IP thì chặn (vào và ra), báo Telegram nhóm quán 1 lần / IP / ngày; IPv6 so cùng dải /64; IP dạng 14.226.5.* khớp cả dải', ()=>{ const D='2029-12-04'; CACHE_BAT=true; tgSet({TG_TOKEN:'TOKOK',TG_CHAT_TP:'-1009'}); TG_SENT.length=0;
  wifiDatCheDo({pin:'1234',cheDo:'batbuoc'}); wifiThem({pin:'1234',ip:'2402:800:6331:abcd:1:2:3:4',cs:'TP'}); wifiThem({pin:'1234',ip:'14.226.5.*',cs:'TD'}); _CFG=null; memoXoa_('WifiQuan');
  IP_KHACH='42.9.9.9'; const x1=vao('TP','305','06:30',D,{maCa:'FT1'}), x2=vao('TP','305','06:31',D,{maCa:'FT1'}); const tg=TG_SENT.filter(m=>/bị chặn chấm công/.test(m.text)).length;
  IP_KHACH='2402:800:6331:abcd:ffff::9'; const v6=vao('TP','305','06:32',D,{maCa:'FT1'}); IP_KHACH='42.9.9.9'; const r1=ra('TP','305','14:30',D,{khaiLoai:'du'});
  IP_KHACH='14.226.5.77'; const r2=ra('TP','305','14:31',D,{khaiLoai:'du'}); IP_KHACH='';
  const mo=qrMo({cs:'TP',t:tk('TP')}); wifiDatCheDo({pin:'1234',cheDo:'canhbao'}); _CFG=null; fake=null; tgSet({TG_CHAT_TP:''}); CACHE_BAT=false;
  return (!x1.ok && /wifi của quán/.test(x1.msg) && !x2.ok && tg===1 && v6.ok && !r1.ok && r2.ok && mo.wifi.bat && !mo.wifi.ok && mo.wifi.cheDo==='batbuoc') || JSON.stringify({x1,x2,tg,v6,r1,r2,mo:mo.wifi}); });
T('WF3 Wifi quán – bảng "IP gặp gần đây" (số lần, quán, bị chặn, đã có), admin thêm / bỏ / đổi chế độ, quản lý không làm được; IP chỉ lấy từ Worker (doPost), không lấy từ dữ liệu gửi lên', ()=>{
  const d=wifiDuLieu({pin:'1234'}), g=d.gan.find(x=>x.IP==='42.9.9.9'), g2=d.gan.find(x=>x.IP==='113.161.72.15');
  const q1=wifiThem({pin:'1357',ip:'1.1.1.1',cs:'TP'}), q2=wifiDatCheDo({pin:'1357',cheDo:'tat'}), q3=wifiDuLieu({pin:'1357'});
  const bo=wifiBo({pin:'1234',ip:'14.226.5.*'}); const d2=wifiDuLieu({pin:'1234'});
  const key=cfg('API_KEY'); const p=(o)=>JSON.parse(doPost({postData:{contents:JSON.stringify(o)}}).t);
  wifiDatCheDo({pin:'1234',cheDo:'batbuoc'}); _CFG=null;
  const m1=p({key,fn:'qrMo',args:[{cs:'TP',t:tk('TP'),ip:'113.161.72.15',_ip:'113.161.72.15'}],ip:'8.8.8.8'}), m2=p({key,fn:'qrMo',args:[{cs:'TP',t:tk('TP')}],ip:'113.161.72.15'});
  wifiDatCheDo({pin:'1234',cheDo:'canhbao'}); IP_KHACH=''; _CFG=null;
  wifiDs_().forEach(w=>wifiBo({pin:'1234',ip:w.IP}));
  return (g && g.biChan>=1 && g.quan.TP>=1 && !g.daCo && g2 && g2.daCo && !q1.ok && !q2.ok && !q3.ok && bo.ok && d2.ds.length===d.ds.length-1 && m1.wifi.ok===false && m2.wifi.ok===true) || JSON.stringify({g,g2,q1,bo,m1:m1.wifi,m2:m2.wifi}); });


T('WF4 Tự nhận IP wifi mới: 2 nhân viên, 2 điện thoại, GPS đúng vị trí cùng quán → tự thêm, người thứ 2 chấm được luôn, báo Telegram; GPS sai / cùng 1 điện thoại / tắt tự thêm thì vẫn chặn', ()=>{ const D='2029-12-10'; tgSet({TG_TOKEN:'TOKOK',TG_CHAT_TP:'-1009'}); TG_SENT.length=0; CACHE_BAT=true;
  wifiThem({pin:'1234',ip:'113.161.72.15',cs:'TP'}); wifiDatCheDo({pin:'1234',cheDo:'batbuoc'}); wifiDatTuThem({pin:'1234',bat:true}); _CFG=null; memoXoa_('WifiQuan');
  const xa=Object.assign({},viTriQuan('TP')); xa.lat=+xa.lat+0.05;
  IP_KHACH='27.0.0.5'; const a1=vao('TP','306','06:30',D,{maCa:'FT1'}), c1=vao('TP','307','06:31',D,Object.assign({maCa:'FT1'},xa)), a2=vao('TP','306','06:32',D,{maCa:'FT1'});
  const b1=vao('TP','309','06:33',D,{maCa:'FT1'}), a3=vao('TP','306','06:34',D,{maCa:'FT1'}); const tg=TG_SENT.filter(m=>/TỰ THÊM IP wifi mới 27\.0\.0\.5/.test(m.text)).length;
  IP_KHACH='27.0.0.6'; const s1=vao('TP','310','06:35',D,{maCa:'FT1',deviceId:'chung'}), s2=vao('TP','311','06:36',D,{maCa:'FT1',deviceId:'chung'});
  wifiDatTuThem({pin:'1234',bat:false}); _CFG=null; IP_KHACH='27.0.0.7'; const t1=vao('TP','312','06:37',D,{maCa:'FT1'}), t2=vao('TP','313','06:38',D,{maCa:'FT1'});
  const ds=wifiDs_().map(w=>w.IP+'|'+w.Boi);
  wifiDatTuThem({pin:'1234',bat:true}); wifiDatCheDo({pin:'1234',cheDo:'canhbao'}); wifiDs_().forEach(w=>wifiBo({pin:'1234',ip:w.IP})); IP_KHACH=''; _CFG=null; fake=null; CACHE_BAT=false; tgSet({TG_CHAT_TP:''});
  return (!a1.ok && !c1.ok && !a2.ok && b1.ok && a3.ok && tg===1 && ds.indexOf('27.0.0.5|App')>-1 && !s1.ok && !s2.ok && !t1.ok && !t2.ok && ds.every(x=>!/27\.0\.0\.[67]/.test(x))) || JSON.stringify({a1:a1.ok,c1:c1.ok,a2:a2.ok,b1,a3:a3.ok,tg,ds,s2:s2.ok,t2:t2.ok}); });


T('BLK3 Bảng lương theo kỳ: cùng mẫu bảng tháng (đủ trường), kỳ 1–15 + 16–cuối cộng bằng cả tháng, chỉ xem; lương từng cơ sở theo kỳ; xuất tab đặt tên theo kỳ; kỳ vắt 2 tháng bị từ chối', ()=>{ const th='2030-01';
  [['2030-01-05','TP',8],['2030-01-12','DD',5.5],['2030-01-20','TP',9]].forEach(([d,cs,g])=>addCC(d,'306',cs,'FT1','06:30','14:30',g,'Đã xác nhận')); at('2030-02-02','09:00');
  const T=bangLuong({pin:'1234',thang:th}), A=bangLuong({pin:'1234',thang:th,tu:th+'-01',den:th+'-15'}), B=bangLuong({pin:'1234',thang:th,tu:th+'-16',den:th+'-31'});
  const t=T.list.find(x=>x.MaNV==='306'), a=A.list.find(x=>x.MaNV==='306'), b=B.list.find(x=>x.MaNV==='306');
  const cs=luongCoSo({pin:'1234',thang:th,maCS:'DD',tu:th+'-01',den:th+'-15'}), x=xuatBangLuong({pin:'1234',thang:th,tu:th+'-01',den:th+'-15'}), sai=bangLuong({pin:'1234',thang:th,tu:th+'-20',den:'2030-02-05'}); fake=null;
  const giongKhoa=Object.keys(t).filter(k=>!(k in a)).filter(k=>!/^(sua|them)$/.test(k));
  return (A.ok && A.khoa && A.ky.tu===th+'-01' && giongKhoa.length===0 && a.gio===13.5 && b.gio===9 && a.gio+b.gio===t.gio && Math.abs(a.tienLuong+b.tienLuong-t.tienLuong)<0.2 && cs.ok && cs.ky && cs.list.find(y=>y.MaNV==='306').gio===5.5 && x.ok && x.tab==='Lương 01–15.01.2030' && !sai.ok) || JSON.stringify({giongKhoa,a:a&&a.gio,b:b&&b.gio,t:t&&t.gio,cs:cs.list,x,sai}); });


T('GD1 Mốc giờ đêm hiểu "23", "23h", "22:30", trống → 22:00 (trước đây gõ "23" thì mọi giờ đều bị tính là giờ đêm)', ()=>{ const k=v=>{ setCfg('GIO_DEM_TU',v); _CFG=null; return gioDemTu_(); };
  const r=[k('23'),k('23h'),k('22:30'),k('22h30'),k(''),k('abc')]; setCfg('GIO_DEM_TU','22:00'); _CFG=null;
  return JSON.stringify(r)===JSON.stringify([1380,1380,1350,1350,1320,1320]) || JSON.stringify(r); });


T('PL2 Phiếu lương theo kỳ: đúng số giờ / tiền của kỳ; người không có giờ trong kỳ báo rõ; Cài đặt chung hiện giá trị mặc định khi ô trống', ()=>{ const th='2030-03';
  [['2030-03-04',8],['2030-03-20',5.5]].forEach(([d,g])=>addCC(d,'307','LDD','FT1','06:30','14:30',g,'Đã xác nhận')); at('2030-04-02','09:00');
  const a=phieuLuong({pin:'1234',thang:th,maNV:'307',tu:th+'-01',den:th+'-15'}), b=phieuLuong({pin:'1234',thang:th,maNV:'307',tu:th+'-16',den:th+'-31'}), k=phieuLuong({pin:'1234',thang:th,maNV:'308',tu:th+'-01',den:th+'-15'}); fake=null;
  const cd=caiDat({pin:'1234'}).chung, lt=cd.find(x=>x.Key==='LAM_TRON_PHUT');
  return (a.ok && a.ky.tu===th+'-01' && a.nv.gio===8 && b.nv.gio===5.5 && !k.ok && /không có giờ công trong kỳ/.test(k.msg) && lt && lt.Value!=='') || JSON.stringify({a:a.nv&&a.nv.gio,b:b.nv&&b.nv.gio,k,lt}); });


T('VE1 Vé phiên nhân viên: đăng nhập 1 lần ở Lịch của tôi → Giờ công, Báo hư hỏng, xin phép, báo quên chấm dùng vé, không cần nhập lại; vé sai / hết hạn báo rõ để đăng nhập lại', ()=>{ CACHE_BAT=true; at('2030-05-05','09:00');
  const a=lichCuaToi({ma:'305',sdt4:sdtOf('305')}), v=a.phien;
  const g=gioCongCuaToi({phien:v}), l2=lichCuaToi({phien:v}), h=dsBaoHongNV({phien:v}), x=xinPhep({phien:v,ngay:'2030-05-09',loai:'nghi',lyDo:'việc nhà'}), b=baoHong({phien:v,cs:'TP',mon:'Quạt',moTa:'kêu'});
  const sai=lichCuaToi({phien:'abcdef0123456789abcdef01'}), sai2=gioCongCuaToi({phien:'xyz'}), dangNhapLai=gioCongCuaToi({maNV:'305',sdt4:sdtOf('305')}); fake=null; CACHE_BAT=false;
  return (a.ok && v && v.length===24 && g.ok && g.maNV==='305' && l2.ok && l2.ma==='305' && h.ok && x.ok && b.ok && !sai.ok && /hết hạn/.test(sai.msg) && !sai2.ok && sai2.hetPhien && dangNhapLai.ok && !!dangNhapLai.phien) || JSON.stringify({a:a.ok,v,g:g.ok,l2:l2.ok,h:h.ok,x,b,sai,sai2,dl:dangNhapLai.ok}); });


T('ON1 Giờ cao điểm: ảnh tải TRƯỚC khi khoá; khoá bận thì báo "bấm lại sau vài giây" (không lỗi); ra ca ghi cả dòng 1 lần, đúng dữ liệu; lượt khớp lịch tự xác nhận ghi rõ cách duyệt', ()=>{ const D='2030-06-03';
  global.KHOA_BAN=true; const b1=vao('TP','314','06:30',D,{maCa:'FT1',photo:'data:image/jpeg;base64,'+Buffer.from('x').toString('base64')}); global.KHOA_BAN=false;
  const v=vao('TP','314','06:31',D,{maCa:'FT1'}); const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ChamCong'); const R=sh.getRange(1,1,1,1).__proto__; let ghi=0; const sv=R.setValue, svs=R.setValues; R.setValue=function(){ if(this.sh.n==='ChamCong') ghi++; return sv.apply(this,arguments); }; R.setValues=function(){ if(this.sh.n==='ChamCong') ghi++; return svs.apply(this,arguments); };
  const r=ra('TP','314','14:31',D,{khaiLoai:'du'}); R.setValue=sv; R.setValues=svs; const row=rows('ChamCong').find(x=>String(x.MaNV)==='314'&&dateKey(x.Ngay)===D);
  setCfg('TU_DUYET_KHOP','Có'); _CFG=null; const XL=SpreadsheetApp.openById('XL').getSheetByName('LichLam'); XL.d.push([D,'TP','315','FT1','Phục vụ','']); _LICH=null;
  vao('TP','315','06:30',D,{maCa:'FT1'}); ra('TP','315','14:30',D,{khaiLoai:'du'}); const r2=rows('ChamCong').find(x=>String(x.MaNV)==='315'&&dateKey(x.Ngay)===D); setCfg('TU_DUYET_KHOP','Không'); _CFG=null; fake=null;
  return (!b1.ok && b1.banLai && /bấm lại/.test(b1.msg) && v.ok && r.ok && ghi<=2 && hhmm(row.Ra)==='14:31' && row.TrangThai==='Chờ xác nhận' && row.KhaiLoai==='du' && (r2.TrangThai!=='Đã xong' || /khớp lịch – tự xác nhận/.test(r2.Cach))) || JSON.stringify({b1,v,r,ghi,row:{Ra:row&&row.Ra,TT:row&&row.TrangThai},r2:r2&&[r2.TrangThai,r2.Cach]}); });


T('NS9 Nhân sự là hồ sơ duy nhất: sửa vị trí kiêm, tăng ca được, cố định, sinh viên ở app Chấm công (app Xếp lịch đọc từ đây); quản lý không sửa được', ()=>{
  const q=suaNhanVien({pin:'5678',maNV:'307',ViTriKiem:'Pha chế'}), a=suaNhanVien({pin:'1234',maNV:'307',ViTriKiem:'Pha chế, Thu ngân',TangCaDuoc:'Có',CoDinh:'Không',SinhVien:'Có'}); _CFG=null; const n=nvByMa('307');
  return (!q.ok && a.ok && n.ViTriKiem==='Pha chế, Thu ngân' && n.SinhVien==='Có' && n.TangCaDuoc==='Có') || JSON.stringify({q,a,k:n.ViTriKiem,sv:n.SinhVien}); });


T('PH5 Phản hồi: quản lý sửa giờ ngay trong khung phản hồi (ca ngày khác) + trả lời trong 1 lần; ca được duyệt lại đúng giờ mới, ghi lý do theo phản hồi', ()=>{ const D='2030-07-01';
  addCC(D,'302','TP','FT1','06:30','14:30',8,'Đã xác nhận'); at('2030-07-02','09:00');
  const cc=rows('ChamCong').filter(x=>String(x.MaNV)==='302'&&dateKey(x.Ngay)===D).pop();
  const ph=phanHoi({ma:'302',sdt4:sdtOf('302'),ccId:cc.ID,noiDung:'em có ở lại tăng ca thêm 30p'});
  const ds=xnDanhSach({pin:'1234',ngay:'2030-07-02'}), it=(ds.phanHoi||[]).find(x=>x.CCID===String(cc.ID));
  const kq=phTraLoi({pin:'1234',id:it&&it.ID,traLoi:'ok em',vao:'06:30',ra:'15:00'}); const moi=rows('ChamCong').find(x=>x.ID===cc.ID), p2=rows('PhanHoi').find(x=>String(x.ID)===String(it&&it.ID)); fake=null;
  return (ph.ok && it && it.Tu && it.Ca && kq.ok && kq.gio===8.5 && +moi.GioTinh===8.5 && /Theo phản hồi/.test(moi.LyDoSua||moi.LyDo||'') && p2.TrangThai==='Đã trả lời' && p2.TraLoi==='ok em') || JSON.stringify({ph, it, kq, gio:moi&&moi.GioTinh, ly:moi&&(moi.LyDoSua||moi.LyDo), tt:p2&&p2.TrangThai}); });


T('NL1 Chỉnh giờ đã nạp theo lịch tháng (file lịch quán thật T9–T10): giờ vào theo lịch, giờ ra = vào + số giờ, quán theo lịch; số giờ giữ nguyên; lượt đã sửa tay giữ nguyên; có xem trước', ()=>{
  const LC=JSON.parse(require('fs').readFileSync(__NCDIR+'/xl2/lich_cu.json','utf8'));
  const mk=(tabs)=>{ const ss=mkSS('L'+Object.keys(FILES).length); Object.entries(tabs).forEach(([ten,T])=>{ const s=ss.insertSheet(ten); s.d=T.v.map(r=>r.map(x=>typeof x==='string'&&/^D:\d{4}-\d{2}-\d{2}$/.test(x)?new Date(x.slice(2)+'T12:00:00+07:00'):x)); s.bg=T.bg; }); return ss; };
  FILES[FILE_LICH_MD.CFMH]=mk({'Lịch T9':LC.CFMH['Lịch T9'],'Lịch T10':LC.CFMH['Lịch T10']}); FILES[FILE_LICH_MD.LDD]=mk({'Lịch T10':LC.LDD['Lịch T10']});
  // lượt nạp giống dữ liệu thật: Châu (302) 01/10 nạp TP 06:30–12:00 5,5h – lịch là TP 14:30–22:30; 1 lượt đã sửa tay
  const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ChamCong'), h=sh.d[0], nap=(d,ma,cs,vao,ra,gio,cach)=>{ const o={ID:'NAP-'+d+'-'+ma,Ngay:d,MaNV:ma,Ten:nvByMa(ma)?tenNgan(nvByMa(ma).Ten):ma,MaCS:cs,MaCa:'KHAC',CaBD:vao,CaKT:ra,Vao:vao,Ra:ra,GioThuc:gio,KhaiLoai:'nap',KhaiGio:gio,TrangThai:'Đã xác nhận',GioTinh:gio,Cach:cach||'nạp từ file chấm công cũ',CanhBao:'Dữ liệu nạp (giờ vào/ra ước tính theo số giờ)'}; sh.d.push(h.map(k=>o[k]??'')); };
  nap('2026-10-01','302','TP','06:30','12:00',5.5); nap('2026-10-02','302','TP','06:30','14:30',8,'sửa 06:30–14:30');
  const xem=chinhNapTheoLich({pin:'1234',tu:'2026-10-01',den:'2026-10-02',thuNghiem:true}); const truoc=rows('ChamCong').find(r=>r.ID==='NAP-2026-10-01-302');
  const ap=chinhNapTheoLich({pin:'1234',tu:'2026-10-01',den:'2026-10-02'}); const sau=rows('ChamCong').find(r=>r.ID==='NAP-2026-10-01-302'), tay=rows('ChamCong').find(r=>r.ID==='NAP-2026-10-02-302'), ql=chinhNapTheoLich({pin:'5678',tu:'2026-10-01',den:'2026-10-01',thuNghiem:true});
  return (xem.ok && xem.soDoi>=1 && hhmm(truoc.Vao)==='06:30' && ap.ok && hhmm(sau.Vao)==='17:00' && hhmm(sau.Ra)==='22:30' && +sau.GioTinh===5.5 && sau.MaCS==='TP' && /theo lịch tháng/.test(sau.CanhBao) && hhmm(tay.Vao)==='06:30' && ap.giuTay>=1 && !ql.ok) || JSON.stringify({xem:{soDoi:xem.soDoi,vd:xem.vd,loi:xem.loi,kl:xem.khongLich}, sau:sau&&[hhmm(sau.Vao),hhmm(sau.Ra),sau.GioTinh,sau.MaCS], tay:tay&&hhmm(tay.Vao), ql}); });


T('GD1 Khai "Đủ ca" mà về sớm quá ngưỡng: đề xuất theo giờ chấm (vào làm tròn lên, ra làm tròn xuống): Trí 14:28–22:13 ca 14:30–22:30 → 7,5h; Mai 16:44–22:13 ca 17:00–22:30 → 5h; về sớm 5\' vẫn đủ ca 8h', ()=>{
  const mk=(id,vao,ra,bd,kt)=>({ID:id,Ra:ra,Vao:vao,CaBD:bd,CaKT:kt,KhaiLoai:'du',GioTinh:0});
  const tri=xnDeXuat(mk('a','14:28','22:13','14:30','22:30')), mai=xnDeXuat(mk('b','16:44','22:13','17:00','22:30')), du=xnDeXuat(mk('c','14:29','22:25','14:30','22:30')), lc=xnDuNhungLech_(mk('a','14:28','22:13','14:30','22:30'));
  return (tri===7.5 && mai===5 && du===8 && /về sớm 17/.test(lc.ghi) && /14:30–22:00/.test(lc.ghi)) || JSON.stringify({tri,mai,du,lc}); });
T('GD2 Quản lý sửa tay không bị quy tắc "tăng ca dưới 30\' không tính" kéo lại: Mai ca 07:40–12:00, sửa 07:40–12:15 → 4,5h; "Tính theo giờ chấm" → 4,5h; nhập thẳng số giờ 7,5 được; tài khoản không có quyền sửa giờ bị chặn', ()=>{ const D='2030-08-04';
  addCC(D,'210','LDD','FT1','07:40','12:15',0,'Chờ xác nhận',{CaBD:'07:40',CaKT:'12:00',KhaiLoai:'du'}); const r=rows('ChamCong').filter(x=>String(x.MaNV)==='210'&&dateKey(x.Ngay)===D).pop();
  const dx=xnDuyet({pin:'1234',ids:[String(r.ID)],cach:'dexuat'}), g0=+rows('ChamCong').find(x=>x.ID===r.ID).GioTinh;
  const s=xnDuyet({pin:'1234',ids:[String(r.ID)],cach:'sua',vao:'07:40',ra:'12:15',coPhep:'Có phép',lyDo:'ở lại dọn quầy'}), g1=+rows('ChamCong').find(x=>x.ID===r.ID).GioTinh;
  const c=xnDuyet({pin:'1234',ids:[String(r.ID)],cach:'cham'}), g2=+rows('ChamCong').find(x=>x.ID===r.ID).GioTinh;
  const n=xnDuyet({pin:'1234',ids:[String(r.ID)],cach:'gio',gio:'7,5',coPhep:'Có phép',lyDo:'thử'}), g3=+rows('ChamCong').find(x=>x.ID===r.ID).GioTinh, nl=xnDuyet({pin:'1234',ids:[String(r.ID)],cach:'gio',gio:'5'});
  const ql=xnDuyet({pin:'5678',ids:[String(r.ID)],cach:'gio',gio:'5',lyDo:'x'});
  return (dx.ok && g0===4.25 && s.ok && g1===4.5 && c.ok && g2===4.5 && n.ok && g3===7.5 && !nl.ok && !ql.ok) || JSON.stringify({g0,g1,g2,g3,s,nl,ql}); });


T('TR1 Đi trễ quá ngưỡng nhắc nhở (10\') tính đúng phút thực tế, không làm tròn; trễ trong ngưỡng tính đủ ca: đề xuất, "theo giờ chấm" và sửa tay đều vậy', ()=>{
  const mk=(vao,ra)=>({ID:'x',Ra:ra,Vao:vao,CaBD:'14:30',CaKT:'22:30',KhaiLoai:'du',GioTinh:0});
  const tre12=xnDeXuat(mk('14:42','22:31')), tre8=xnDeXuat(mk('14:38','22:31')), tre17=xnDeXuat(mk('14:47','22:31')), cham=xnGioCham(mk('14:47','22:30')), cham7=xnGioCham(mk('14:37','22:30')), cham12=xnGioCham(mk('14:42','22:30'));
  const D='2030-09-02'; addCC(D,'217','LDD','FT2','14:42','22:30',0,'Chờ xác nhận',{CaBD:'14:30',CaKT:'22:30',KhaiLoai:'du'}); const r=rows('ChamCong').filter(x=>String(x.MaNV)==='217'&&dateKey(x.Ngay)===D).pop();
  const s=xnDuyet({pin:'1234',ids:[String(r.ID)],cach:'sua',vao:'14:47',ra:'22:30',coPhep:'Có lý do',lyDo:'đến muộn'}), g=+rows('ChamCong').find(x=>x.ID===r.ID).GioTinh, c=rows('ChamCong').find(x=>x.ID===r.ID).Cach;
  const s2=xnDuyet({pin:'1234',ids:[String(r.ID)],cach:'sua',vao:'14:30',ra:'22:13',coPhep:'Có lý do',lyDo:'về sớm'}), g2=+rows('ChamCong').find(x=>x.ID===r.ID).GioTinh;
  return (tre12===8 && tre8===8 && tre17===7.72 && cham===7.72 && cham7===8 && cham12===8 && s.ok && g===7.72 && /trễ: tính đúng phút/.test(c) && g2===7.75) || JSON.stringify({tre12,tre8,tre17,cham,cham7,cham12,g,c,g2}); });


T('BD1 Biệt danh: nhân viên tự đặt (lọc ký tự lạ, tối đa 24 ký tự); trang của tôi thấy; lời chào khi vào ca chỉ có biệt danh nếu chấm bằng điện thoại quen của chính người đó; quản lý không thấy trong bảng nhân sự', ()=>{
  const s4=sdtOf('305'); const d=datBietDanh({ma:'305',sdt4:s4,bietDanh:'  Bé <b>Thư</b>  '}), sai=datBietDanh({ma:'305',sdt4:'0000',bietDanh:'x'});
  const lt=lichCuaToi({ma:'305',sdt4:s4}); const D1='2030-10-01', D2='2030-10-02';
  const v1=vao('TP','305','06:30',D1,{maCa:'FT1',deviceId:'DEV-THU'}); ra('TP','305','14:30',D1,{khaiLoai:'du',deviceId:'DEV-THU'});
  const v2=vao('TP','305','06:30',D2,{maCa:'FT1',deviceId:'DEV-THU'}); ra('TP','305','14:30',D2,{khaiLoai:'du',deviceId:'DEV-THU'});
  const v3=vao('TP','305','06:30','2030-10-03',{maCa:'FT1',deviceId:'DEV-LA'}); const ds=dsNhanVien({pin:'1234'}).list.find(n=>n.MaNV==='305'); fake=null;
  return (d.ok && d.bietDanh==='Bé Thư' && !sai.ok && lt.bietDanh==='Bé Thư' && v1.ok && v1.goi==='Thư' && v1.bietDanh==='' && v2.bietDanh==='Bé Thư' && v3.bietDanh==='' && !('BietDanh' in ds)) || JSON.stringify({d,sai:sai.ok,lt:lt.bietDanh,v1:[v1.ok,v1.bietDanh,v1.goi],v2:v2.bietDanh,v3:v3.bietDanh,ds:Object.keys(ds)}); });


T('SK1 Thông báo sự kiện: admin thêm sự kiện (mọi quán / 1 quán), thêm ngày lễ phổ biến (bấm 2 lần không trùng); nhân viên thấy trong 45 ngày tới đúng quán của mình, kèm ngày lễ trong bảng lương; quản lý không thêm được', ()=>{
  at('2031-11-01','09:00');
  const a=luuSuKien({pin:'1234',ngay:'2031-11-05',ten:'Họp toàn quán',ghiChu:'14h tại Trần Phú'}), b=luuSuKien({pin:'1234',ngay:'2031-11-07',ten:'Kiểm kho Đống Đa',quan:'DD'}), c=luuSuKien({pin:'1234',ngay:'2032-03-01',ten:'Quá xa'}), ql=luuSuKien({pin:'5678',ngay:'2031-11-06',ten:'x'});
  const l1=themNgayLePhoBien({pin:'1234',nam:'2031'}), l2=themNgayLePhoBien({pin:'1234',nam:'2031'});
  luuCauHinh({pin:'1234',ngayLe:[{Ngay:'2031-11-25',HeSo:2,Ten:'Lễ thử bảng lương'}]}); _CFG=null;
  const tp=suKienSapToi_('TP',45).map(x=>x.Ten), dd=suKienSapToi_('DD',45).map(x=>x.Ten), lt=lichCuaToi({ma:'305',sdt4:sdtOf('305')}); fake=null;
  return (a.ok && b.ok && !ql.ok && l1.ok && l1.them===12 && l2.them===0 && tp.includes('Họp toàn quán') && !tp.includes('Kiểm kho Đống Đa') && dd.includes('Kiểm kho Đống Đa') && tp.includes('Ngày Nhà giáo Việt Nam') && tp.includes('Lễ thử bảng lương') && !tp.includes('Quá xa') && Array.isArray(lt.suKien) && lt.suKien.length>0) || JSON.stringify({a,b,ql:ql.ok,l1,l2,tp,dd,lt:lt.suKien}); });


T('WF9 Wifi – Google Sheet tiếng Việt đổi IP 14.254.129.209 thành số: đọc lại đúng, không còn mỗi lượt 1 dòng; IPv6 mỗi điện thoại 1 địa chỉ được gộp thành 1 mạng; TỰ THÊM wifi chạy được cho cả 2 trường hợp (2 người, 2 máy, đúng vị trí)', ()=>{
  // giả lập ô Sheet định dạng VN: chữ dạng 1-3 số + (.3 số)x3 bị đổi thành số (trừ khi có dấu ' ở đầu)
  const SH=Object.getPrototypeOf(SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ChamCong')), R=Object.getPrototypeOf(SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ChamCong').getDataRange());
  const vn=x=>{ if(typeof x!=='string') return x; if(x.charAt(0)==="'") return x.slice(1); return /^\d{1,3}(\.\d{3}){3}$/.test(x)?+x.replace(/\./g,''):x; };
  const ap=SH.appendRow, sv=R.setValues; SH.appendRow=function(r){ return ap.call(this, r.map(vn)); }; R.setValues=function(v){ return sv.call(this, v.map(r=>r.map(vn))); };
  try{
    const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName('WifiGanDay'); if(sh) sh.d=[sh.d[0]]; const wq=SpreadsheetApp.getActiveSpreadsheet().getSheetByName('WifiQuan'); if(wq) wq.d=[wq.d[0]]; memoXoa_('WifiQuan');
    wifiThem({pin:'1234',ip:'1.55.50.209',cs:'TNV'}); memoXoa_('WifiQuan');   // đã có 1 wifi (TNV) → app đang kiểm tra wifi → mới tự nhận wifi mới
    const doc=[ipDoc_(14254129209), ipDoc_(116105174168), ipDoc_('1.55.50.209'), ipDoc_(14254129209.0)];
    // vị trí quán để có "đúng vị trí"
    const cs=SpreadsheetApp.getActiveSpreadsheet().getSheetByName('CoSo'), h=cs.d[0]; cs.d.forEach((r,i)=>{ if(i>0){ r[h.indexOf('ViDo')]=16.06; r[h.indexOf('KinhDo')]=108.22; } });
    const D='2029-12-20', gps={lat:16.06,lng:108.22,acc:10};
    IP_KHACH='14.254.129.209'; const a1=vao('TP','302','06:30',D,Object.assign({maCa:'FT1',deviceId:'M1'},gps)), a2=vao('TP','303','06:31',D,Object.assign({maCa:'FT1',deviceId:'M2'},gps));
    IP_KHACH='2402:800:6294:fe29:f008:6c6e:d05:787e'; const b1=vao('DD','304','06:30',D,Object.assign({maCa:'FT1',deviceId:'M3'},gps));
    IP_KHACH='2402:800:6294:fe29:dd04:a788:6beb:825b'; const b2=vao('DD','305','06:31',D,Object.assign({maCa:'FT1',deviceId:'M4'},gps)); IP_KHACH='';
    const d=wifiDuLieu({pin:'1234'}), tp=d.gan.filter(g=>g.IP==='14.254.129.209'), dd=d.gan.filter(g=>g.IP==='2402:800:6294:fe29::/64'), ds=d.ds.map(w=>w.IP);
    IP_KHACH='2402:800:6294:fe29:1111:2222:3333:4444'; const k6=wifiKiem_(); IP_KHACH='14.254.129.209'; const k4=wifiKiem_(); IP_KHACH=''; fake=null;
    return (doc[0]==='14.254.129.209' && doc[1]==='116.105.174.168' && doc[2]==='1.55.50.209' && doc[3]==='14.254.129.209' && a1.ok && a2.ok && b1.ok && b2.ok && tp.length===1 && tp[0].soLan===2 && dd.length===1 && dd[0].v6 && ds.includes('14.254.129.209') && ds.includes('2402:800:6294:fe29::/64') && k6.ok && k4.ok)
      || JSON.stringify({doc, tp, dd, ds, k6, k4, a1:a1.ok, b2:b2.ok, gan:d.gan.map(g=>g.IP)});
  } finally { SH.appendRow=ap; R.setValues=sv; } });


T('MM1 Quán mất mạng – TỰ NHẬN: chế độ Bắt buộc, người 1 dùng 4G bị chặn; người 2 (máy khác, địa chỉ khác) đúng vị trí → app tự cho chấm bằng 4G, báo Telegram; người 1 thử lại được; nhãn "Quán mất mạng"; có người chấm bằng wifi quán → tự kiểm tra lại, báo Telegram; GPS sai thì không tính', ()=>{ const D='2030-11-04'; tgSet({TG_TOKEN:'TOKOK',TG_CHAT_TP:'-1009'}); TG_SENT.length=0; CACHE_BAT=true;
  wifiThem({pin:'1234',ip:'14.254.129.209',cs:'TP'}); wifiDatCheDo({pin:'1234',cheDo:'batbuoc'}); _CFG=null; memoXoa_('WifiQuan');
  const xa=Object.assign({},viTriQuan('TP')); xa.lat=+xa.lat+0.05;
  IP_KHACH='27.72.10.1'; const g1=vao('TP','307','06:20',D,Object.assign({maCa:'FT1'},xa)); IP_KHACH='27.72.10.2'; const g2=vao('TP','308','06:21',D,Object.assign({maCa:'FT1'},xa));   // GPS sai: không tính
  const chuaMo=!suCoDen_('TP');
  IP_KHACH='2401:d800:24db:58c8:1:2:3:4'; const a1=vao('TP','302','06:25',D,{maCa:'FT1'});
  IP_KHACH='116.98.63.59'; const b1=vao('TP','303','06:27',D,{maCa:'FT1'}); const tg1=TG_SENT.filter(m=>/MẤT ĐIỆN \/ MẤT MẠNG/.test(m.text)).length;
  IP_KHACH='2401:d800:24db:58c8:1:2:3:4'; const a2=vao('TP','302','06:28',D,{maCa:'FT1'});
  const nhan=String((rows('ChamCong').find(x=>String(x.MaNV)==='303'&&dateKey(x.Ngay)===D)||{}).CanhBao||''), dang=!!suCoDen_('TP'), ds=dsMaQR({pin:'1234'}).list.find(c=>c.MaCS==='TP');
  IP_KHACH='14.254.129.209'; const c1=vao('TP','304','08:30',D,{maCa:'FT1'}); const tg2=TG_SENT.filter(m=>/wifi quán đã có lại/.test(m.text)).length, het=!suCoDen_('TP');
  IP_KHACH='27.72.10.9'; const d1=vao('TP','305','08:35',D,{maCa:'FT1'});
  wifiDatCheDo({pin:'1234',cheDo:'canhbao'}); wifiDs_().forEach(w=>wifiBo({pin:'1234',ip:w.IP})); IP_KHACH=''; _CFG=null; fake=null; CACHE_BAT=false; tgSet({TG_CHAT_TP:''});
  return (!g1.ok && !g2.ok && chuaMo && !a1.ok && /mất điện \/ mất mạng/.test(a1.msg) && b1.ok && tg1===1 && a2.ok && /Quán mất mạng – chấm bằng 4G/.test(nhan) && dang && ds.suCo && ds.suCo.ly==='tự nhận' && c1.ok && tg2===1 && het && !d1.ok)
    || JSON.stringify({g1:g1.ok,chuaMo,a1,b1,tg1,a2:a2.ok,nhan,dang,ds:ds.suCo,c1:c1.ok,tg2,het,d1:d1.ok}); });
T('MM2 Quán mất mạng – BẤM TAY: quản lý quán đó bấm "Quán mất mạng" → chấm bằng 4G được đến hết ngày; quản lý quán khác không bấm được cho quán này; "Có mạng lại" → kiểm tra lại', ()=>{ const D='2030-11-05'; CACHE_BAT=true;
  wifiThem({pin:'1234',ip:'14.254.129.209',cs:'TP'}); wifiDatCheDo({pin:'1234',cheDo:'batbuoc'}); _CFG=null; memoXoa_('WifiQuan'); at(D,'07:00');
  const ddQL=wifiMatMangDat({pin:'1357',cs:'TP',bat:true}), tp=wifiMatMangDat({pin:'2468',cs:'TP',bat:true}); _CFG=null;
  IP_KHACH='27.72.10.3'; const a=vao('TP','306','07:05',D,{maCa:'FT1'}); const sc=suCoDen_('TP');
  const tat=wifiMatMangDat({pin:'1234',cs:'TP',bat:false}); _CFG=null; IP_KHACH='27.72.10.4'; const b=vao('TP','307','07:10',D,{maCa:'FT1'});
  wifiDatCheDo({pin:'1234',cheDo:'canhbao'}); wifiDs_().forEach(w=>wifiBo({pin:'1234',ip:w.IP})); IP_KHACH=''; _CFG=null; fake=null; CACHE_BAT=false;
  return (!ddQL.ok && tp.ok && a.ok && sc && sc.ly==='quản lý' && tat.ok && !b.ok) || JSON.stringify({ddQL,tp,a:a.ok,sc,tat,b:b.ok}); });


T('TH1 Google Sheet đổi chữ "2026-10" thành NGÀY: sửa tay trong bảng lương được lưu (sửa lần 2 cập nhật đúng dòng) và ÁP DỤNG; khoá sổ đợt được nhận; chốt tháng khoá sửa; nhật ký sửa lọc đúng tháng; dữ liệu cũ đã thành ngày vẫn đọc đúng', ()=>{
  const SH=Object.getPrototypeOf(SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ChamCong')), R=Object.getPrototypeOf(SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ChamCong').getDataRange());
  const vn=x=>{ if(typeof x!=='string') return x; if(x.charAt(0)==="'") return x.slice(1); return /^\d{4}-\d{2}$/.test(x)?new Date(x+'-01T00:00:00+07:00'):x; };
  const ap=SH.appendRow, sv=R.setValues, s1=R.setValue; SH.appendRow=function(r){ return ap.call(this, r.map(vn)); }; R.setValues=function(v){ return sv.call(this, v.map(r=>r.map(vn))); }; R.setValue=function(v){ return s1.call(this, vn(v)); };
  try{ const th='2031-03';
    addCC('2031-03-05','306','TP','FT1','06:30','14:30',8,'Đã xác nhận'); at('2031-04-02','09:00');
    // dòng cũ đã bị đổi thành ngày (như dữ liệu thật mã 211)
    const ln=SpreadsheetApp.getActiveSpreadsheet().getSheetByName('LuongNhap')||SpreadsheetApp.getActiveSpreadsheet().insertSheet('LuongNhap'); if(!ln.d.length) ln.d=[['Thang','MaNV','Muc','GiaTri']]; ln.d.push([new Date('2031-03-01T00:00:00+07:00'),'306','thuong',50]);
    const t0=bangLuong({pin:'1234',thang:th}).list.find(x=>x.MaNV==='306');
    const a=luuO({pin:'1234',thang:th,maNV:'306',muc:'luong',giaTri:'31'}), b=luuO({pin:'1234',thang:th,maNV:'306',muc:'luong',giaTri:'33'});
    const soDong=ln.d.filter((r,i)=>i>0 && String(r[1])==='306' && r[2]==='luong').length, t1=bangLuong({pin:'1234',thang:th}).list.find(x=>x.MaNV==='306');
    const dd=duyetDot({pin:'1234',thang:th,dot:1}), ds=dsDot({pin:'1234',thang:th}), khoa=dotDaDuyetNgay('2031-03-05');
    const ch=chotThang({pin:'1234',thang:th}), daChot=thangDaChot(th), sua=luuO({pin:'1234',thang:th,maNV:'306',muc:'luong',giaTri:'40'});
    const nk=nhatKySua({pin:'1234',thang:th}).list||[]; moChot({pin:'1234',thang:th}); const moRoi=!thangDaChot(th); fake=null;
    return (t0.thuong===50 && a.ok && b.ok && soDong===1 && t1.luong===33 && t1.sua && t1.sua.luong && dd.ok && ds.list && ds.list[0] && ds.list[0].DaDuyet && khoa && ch.ok && daChot && !sua.ok && nk.filter(x=>x.Thang).length>=3 && nk.filter(x=>x.Thang).every(x=>x.Thang==='2031-03') && moRoi)
      || JSON.stringify({thuong:t0&&t0.thuong, a,b,soDong, luong:t1&&t1.luong, sua1:t1&&t1.sua, dd, dot:ds.list&&ds.list[0], khoa, ch:ch.ok, daChot, sua:sua.ok, nk:nk.slice(0,3).map(x=>x.Thang), moRoi});
  } finally { SH.appendRow=ap; R.setValues=sv; R.setValue=s1; } });


T('LK1 Lương riêng theo khoảng ngày: chỉ ngày trong khoảng tính mức riêng (lương giờ hoặc hệ số), ngày ngoài khoảng về mức thường; khoảng sau đè khoảng trước; tháng đã chốt không đặt / xoá được; lương cố định bị từ chối; quản lý không làm được', ()=>{ const th='2031-05';
  [['2031-05-03',8],['2031-05-10',8],['2031-05-20',8]].forEach(([d,g])=>addCC(d,'306','TP','FT1','06:30','14:30',g,'Đã xác nhận')); at('2031-06-02','09:00');
  const n=nvByMa('306'), thuong=mucTaiNgay(n,'2031-05-03',false,lsLuong(n,false));
  const a=luuLuongKhoang({pin:'1234',maNV:'306',tu:'2031-05-08',den:'2031-05-12',kieu:'gio',giaTri:'30'}), q=luuLuongKhoang({pin:'5678',maNV:'306',tu:'2031-05-08',den:'2031-05-12',kieu:'gio',giaTri:'30'});
  const L1=bangLuong({pin:'1234',thang:th}).list.find(x=>x.MaNV==='306'), mong1=Math.round((8*thuong+8*30+8*thuong)*1000);
  const b=luuLuongKhoang({pin:'1234',maNV:'306',tu:'2031-05-18',den:'2031-05-31',kieu:'heso',giaTri:'1,5'});
  const L2=bangLuong({pin:'1234',thang:th}).list.find(x=>x.MaNV==='306'), mong2=Math.round((8*thuong+8*30+8*thuong*1.5)*1000);
  const sai=luuLuongKhoang({pin:'1234',maNV:'306',tu:'2031-05-12',den:'2031-05-08',kieu:'gio',giaTri:'30'});
  const codinh=rows('NhanVien').find(x=>String(x.KieuLuong)==='Cố định'), cd=codinh?luuLuongKhoang({pin:'1234',maNV:String(codinh.MaNV),tu:'2031-05-01',den:'2031-05-02',kieu:'gio',giaTri:'30'}):{ok:false};
  chotThang({pin:'1234',thang:th,boQua:true}); const sauChot=luuLuongKhoang({pin:'1234',maNV:'306',tu:'2031-05-25',den:'2031-06-05',kieu:'gio',giaTri:'40'}), ds=dsLuongKhoang({pin:'1234',maNV:'306'}), xoa=xoaLuongKhoang({pin:'1234',id:ds.list[0].ID}); moChot({pin:'1234',thang:th});
  const tien=x=>Math.round(+x.tienLuong*(+x.tienLuong<100000?1000:1)); fake=null;
  return (a.ok && !q.ok && tien(L1)===mong1 && b.ok && tien(L2)===mong2 && (L2.khoang||[]).length===2 && !sai.ok && !cd.ok && !sauChot.ok && /đã chốt/.test(sauChot.msg) && !xoa.ok && ds.list.length===2)
    || JSON.stringify({a,q:q.ok,thuong,t1:L1&&L1.tienLuong,mong1,b,t2:L2&&L2.tienLuong,mong2,k:L2&&L2.khoang,sai:sai.ok,cd,sauChot,xoa,n:ds.list&&ds.list.length}); });


T('TU2 Xoá tạm ứng: xoá được khi tháng chưa chốt (biến mất khỏi bảng lương); tháng đã chốt thì không xoá được – kể cả dòng cũ có tháng đã bị Google đổi thành ngày', ()=>{ const th='2031-07';
  addCC('2031-07-03','306','TP','FT1','06:30','14:30',8,'Đã xác nhận'); at('2031-08-02','09:00');
  const a=themTamUng({pin:'1234',thang:th,maNV:'306',soTien:150,vanGhi:true}), ds1=dsTamUng({pin:'1234',thang:th}).list||[], u1=bangLuong({pin:'1234',thang:th}).list.find(x=>x.MaNV==='306').ung;
  const x=xoaTamUng({pin:'1234',id:ds1[0]&&ds1[0].ID}), ds2=dsTamUng({pin:'1234',thang:th}).list||[], u2=bangLuong({pin:'1234',thang:th}).list.find(x=>x.MaNV==='306').ung;
  const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName('TamUng'); sh.d.push(['TU-cu','2031-07-05',new Date('2031-07-01T00:00:00+07:00'),'306',200,'cũ','Admin']);   // dòng cũ: tháng dạng ngày
  chotThang({pin:'1234',thang:th,boQua:true}); const q=xoaTamUng({pin:'1234',id:'TU-cu'}), con=sh.d.some(r=>r[0]==='TU-cu'), ql=xoaTamUng({pin:'5678',id:'TU-cu'}); moChot({pin:'1234',thang:th}); fake=null;
  return (a.ok && ds1.length===1 && u1>0 && x.ok && ds2.length===0 && u2===0 && !q.ok && /chốt/.test(q.msg) && con && !ql.ok) || JSON.stringify({a,ds1:ds1.length,u1,x,ds2:ds2.length,u2,q,con}); });
T('KS4 Khảo sát nhân viên mới: gắn vào mã có sẵn (đã gắn thì không gắn lại); bỏ qua câu trả lời → biến mất khỏi danh sách đối chiếu; quản lý không có quyền khảo sát mức 2 bị chặn', ()=>{
  ksGui({moi:true,data:{hoTen:'Lê Văn Gắn',tenGoi:'Gắn',sdt:'0977000111',ngayVao:'2026-10-20',loai:'PT',viTriChinh:'Phục vụ',quanChinh:'TP'}});
  ksGui({moi:true,data:{hoTen:'Phạm Bỏ Qua',tenGoi:'Bỏ',sdt:'0977000222',ngayVao:'2026-10-21',loai:'PT',viTriChinh:'Phục vụ',quanChinh:'DD'}});
  const r=ksDoiChieu({pin:'1234'}), g=r.dong.find(x=>x.moi && /Gắn/.test(JSON.stringify(x))), b=r.dong.find(x=>x.moi && /Bỏ Qua/.test(JSON.stringify(x)));
  const a=ksGanMa({pin:'1234',id:g.id,ma:'305'}), a2=ksGanMa({pin:'1234',id:g.id,ma:'306'}), bq=ksBoQua({pin:'1234',id:b.id});
  const r2=ksDoiChieu({pin:'1234'}), conBo=r2.dong.some(x=>/Bỏ Qua/.test(JSON.stringify(x))), gan=r2.dong.find(x=>x.id===g.id);
  return (a.ok && a.ma==='305' && !a2.ok && bq.ok && !conBo && gan && gan.ma==='305') || JSON.stringify({a,a2,bq,conBo,gan:gan&&gan.ma}); });
T('SK2 Xoá sự kiện: biến mất khỏi danh sách quản lý và trang "Lịch của tôi"; quản lý không xoá được', ()=>{ at('2031-11-01','09:00');
  luuSuKien({pin:'1234',ngay:'2031-11-06',ten:'Sự kiện để xoá'}); const L=dsSuKien({pin:'1234'}).list, x=L.find(e=>e.Ten==='Sự kiện để xoá');
  const ql=xoaSuKien({pin:'5678',id:x.ID}), a=xoaSuKien({pin:'1234',id:x.ID}), con=dsSuKien({pin:'1234'}).list.some(e=>e.Ten==='Sự kiện để xoá'), nv=suKienSapToi_('TP',45).some(e=>e.Ten==='Sự kiện để xoá'); fake=null;
  return (!ql.ok && a.ok && !con && !nv) || JSON.stringify({ql,a,con,nv}); });


T('TRE1 Thống kê đi trễ: trễ 3\' chỉ nhắc nhở (đếm số lần, không cộng); trễ 12\' cộng vào "trên 10\'"; trễ 25\' có xin phép được đồng ý → ghi có phép, không cộng; giờ nạp từ file cũ bỏ qua; bảng lương, tra cứu, phiếu lương cùng số', ()=>{ const th='2031-09', ma='306';
  addCC('2031-09-02',ma,'TP','FT1','06:33','14:30',8,'Đã xác nhận',{TreMin:3});
  addCC('2031-09-03',ma,'TP','FT1','06:42','14:30',7.8,'Đã xác nhận',{TreMin:12});
  at('2031-09-03','20:00'); const xp=xinPhep({ma:ma,sdt4:sdtOf(ma),ngay:'2031-09-04',loai:'muon',gio:'07:00',lyDo:'Đi học / thi'}); const idx=rows('XinPhep').filter(x=>String(x.MaNV)===ma && dateKey(x.Ngay)==='2031-09-04').pop(); const dy=xpQuyetDinh({pin:'1234',id:idx&&idx.ID,dongY:true}); _XPM=null;
  addCC('2031-09-04',ma,'TP','FT1','06:55','14:30',7.6,'Đã xác nhận',{TreMin:25});
  addCC('2031-09-05',ma,'TP','FT1','06:30','14:30',8,'Đã xác nhận',{TreMin:40,KhaiLoai:'nap'});
  addCC('2031-09-06',ma,'TP','FT1','20:23','22:30',2,'Đã xác nhận',{TreMin:833});   // quét 20:23 mà chọn ca sáng → xem lại, không cộng
  at('2031-10-02','09:00'); _XPM=null;
  const bl=bangLuong({pin:'1234',thang:th}).list.find(x=>x.MaNV===ma), tc=traCuuLuoi({pin:'1234',tu:'2031-09-01',den:'2031-09-30'}).list.find(x=>x.MaNV===ma), pl=phieuLuong({pin:'1234',thang:th,maNV:ma});
  const p=(pl.nv||pl.o||pl), tr=tc&&tc.tre; fake=null;
  return (xp.ok && dy.ok && bl.treLan===4 && bl.treLan10===1 && bl.trePhut10===12 && bl.trePhutTong===15 && bl.trePhep===1 && bl.treXemLai===1 && tr && tr.lan===4 && tr.lan10===1 && tr.phut10===12 && tr.phep===1 && tr.ds.length===4 && tr.ds[2].phep && tr.ds[3].xemLai && !tr.ds[0].qua && tr.ds[1].qua && (p.treLan10===1 || (p.list&&p.list[0]&&p.list[0].treLan10===1)))
    || JSON.stringify({xp,dy,bl:bl&&[bl.treLan,bl.treLan10,bl.trePhut10,bl.trePhep],tr:tr&&{lan:tr.lan,l10:tr.lan10,p10:tr.phut10,phep:tr.phep,ds:tr.ds.map(x=>x.ngay+':'+x.tre+(x.phep?'P':''))},pl:Object.keys(pl)}); });


T('NV1 Trang Giờ công của NHÂN VIÊN: không gửi giờ chấm thực tế, ghi chú / lý do quản lý điều chỉnh, số phút trễ; chỉ ca theo lịch + giờ đã duyệt; trễ trên 5\' có nhãn "đi trễ" (trễ 3\' thì không); duyệt quá giờ ca có nhãn "có tăng ca"', ()=>{ const ma='308';
  addCC('2032-01-05',ma,'TP','FT1','06:33','14:30',8,'Đã xác nhận',{TreMin:3});
  addCC('2032-01-06',ma,'TP','FT1','06:42','16:30',10,'Đã xác nhận',{TreMin:12,Cach:'sửa 06:42–16:30',LyDoSua:'ở lại dọn kho'});
  at('2032-01-07','10:00'); const r=gioCongCuaToi({maNV:ma,sdt4:sdtOf(ma),thang:'2032-01'}); const a=(r.ca||[]).find(c=>c.Ngay==='2032-01-05'), b=(r.ca||[]).find(c=>c.Ngay==='2032-01-06'); fake=null;
  const lo=JSON.stringify(r.ca||[]); const coLo=/06:33|06:42|16:30"|ở lại dọn kho|sửa 06:42|"Vao"|"Ra"|"Cach"|"LyDoSua"|TreMin/.test(lo);
  return (r.ok && a && b && !coLo && a.Ca==='06:30–14:30' && a.Gio===8 && !a.DiTre && !a.TangCa && b.Gio===10 && b.DiTre && b.TangCa && b.CaGio===8) || JSON.stringify({ok:r.ok,a,b,coLo}); });


T('NV2 Lịch của tôi: ngày KHÔNG có lịch nhưng có đi làm → dữ liệu có quán + ca đã làm (trang hiện thay cho "nghỉ"); không gửi giờ chấm thực tế (cả ca đã duyệt lẫn chờ duyệt)', ()=>{ const ma='309';
  at('2032-02-02','09:00'); const t0=lichCuaToi({ma:ma,sdt4:sdtOf(ma)}); const d0=t0.tuanNay;
  const ngay=d0; addCC(ngay,ma,'TP','FT10','06:41','17:02',10.5,'Đã xác nhận');
  const ngay2=d0.slice(0,8)+('0'+(+d0.slice(8)+1)).slice(-2); addCC(ngay2,ma,'DD','PT1','06:35','12:01','','Chờ xác nhận');
  at(ngay2,'15:00'); const r=lichCuaToi({ma:ma,sdt4:sdtOf(ma)}); fake=null;
  const c1=((r.cong||{})[ngay]||[])[0], c2=((r.cong||{})[ngay2]||[])[0], coLich=(r.lich||[]).some(l=>l.Ngay===ngay), lo=JSON.stringify(r.cong||{});
  return (r.ok && !coLich && c1 && c1.MaCS==='TP' && c1.Ca==='06:30–17:00' && c1.Gio===10.5 && c2 && c2.MaCS==='DD' && c2.Gio===null && !/06:41|17:02|06:35|12:01|"Vao"|"Ra"/.test(lo))
    || JSON.stringify({ok:r.ok, msg:r.msg, coLich, c1, c2, lo:lo.slice(0,300)}); });


T('BT1 Bảng tin: vé do app ký được Worker bảng tin CHẤP NHẬN (kiểm bằng đúng cách của Worker, tên tiếng Việt); chấm vào / ra gửi sự kiện in / out đúng mã, tên, quán, kèm vé; Lịch của tôi lấy vé sau khi đăng nhập; ngày sinh lưu trong hồ sơ và được đồng bộ; chưa cài thì không gửi gì, không có vé', ()=>{
  const crypto=require('crypto'), SECRET='Bí-mật-FEED-123';
  const verify=(t)=>{ const [p,s]=String(t||'').split('.'); if(!p||!s) return null; const sig=crypto.createHmac('sha256',Buffer.from(SECRET,'utf8')).update(Buffer.from(p,'utf8')).digest('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); if(sig!==s) return null;
    const u=JSON.parse(Buffer.from(p.replace(/-/g,'+').replace(/_/g,'/'),'base64').toString('utf8')); return (u.c && u.x>Date.now())?u:null; };
  const calls=[], goc=UrlFetchApp.fetch; UrlFetchApp.fetch=(url,o)=>{ if(/\/bangtin\/api\/hook$/.test(url)){ calls.push({url, key:o.headers['X-Feed-Key'], body:JSON.parse(o.payload)}); return {getResponseCode:()=>200, getContentText:()=>'{"ok":true}'}; } return goc(url,o); };
  try{ const D='2032-03-02';
    const v0=vao('TP','303','06:25',D,{maCa:'FT1'}), sau0=calls.length; ra('TP','303','14:31',D);
    luuCaiDatChung({pin:'1234',kv:{BANGTIN_URL:'https://ncafe-bangtin.dangbao-mt.workers.dev/',BANGTIN_KEY:SECRET}}); _CFG=null;
    const sua=suaNhanVien({pin:'1234',maNV:'304',NgaySinh:'1999-11-20'}); _CFG=null;
    const v1=vao('TD','304','06:28',D,{maCa:'FT1'}); const ve=v1.bt&&verify(v1.bt.t);
    const r1=ra('TD','304','14:30',D); const veRa=r1.bt&&verify(r1.bt.t);
    const coSdt=rows('NhanVien').find(n=>soDT(n.SDT).length>=9 && dangLam(n)); const lich=bangTinVao({ma:'304',sdt4:sdtOf('304')}), veL=lich.ok&&verify(lich.t), sai=bangTinVao({ma:String(coSdt.MaNV),sdt4:'0000'}), saiLich=lichCuaToi({ma:String(coSdt.MaNV),sdt4:'0000'});
    const tamper=lich.ok?verify(lich.t.replace(/^./,c=>c==='a'?'b':'a')):null;
    const db=btDongBo({pin:'1234'}), dbQL=btDongBo({pin:'5678'}); const st=calls.find(c=>c.body.type==='staff'); const s304=st&&st.body.list.find(x=>x.code==='304');
    const vin=calls.find(c=>c.body.type==='in'), vout=calls.find(c=>c.body.type==='out'), n304=nvByMa('304');
    luuCaiDatChung({pin:'1234',kv:{BANGTIN_URL:'',BANGTIN_KEY:''}}); _CFG=null; fake=null;
    return (v0.ok && sau0===0 && !v0.bt && sua.ok && v1.ok && v1.bt && v1.bt.url==='https://ncafe-bangtin.dangbao-mt.workers.dev' && ve && ve.c==='304' && ve.n===tenNgan(n304.Ten) && ve.s===String(n304.CoSoChinh).toUpperCase() && ve.r==='nv' && ve.x>Date.now()+11*3600e3
        && r1.ok && veRa && vin && vin.key===SECRET && vin.body.code==='304' && vin.body.store==='TD' && vin.body.name===tenNgan(n304.Ten) && vout && vout.body.store==='TD'
        && lich.ok && veL && veL.c==='304' && !sai.ok && !saiLich.ok && tamper===null && db.ok && db.so>10 && !dbQL.ok && s304 && s304.dob==='11-20' && s304.name===undefined && db.coNgaySinh>=1)   // (30/10b) dob chỉ MM-DD, không gửi name đầy đủ
      || JSON.stringify({v0:{ok:v0.ok,bt:v0.bt},sau0,sua,v1:{ok:v1.ok,bt:v1.bt&&v1.bt.url},ve,r1:r1.ok,veRa:!!veRa,vin:vin&&vin.body,vout:vout&&vout.body,lich:{ok:lich.ok,msg:lich.msg},veL:!!veL,sai:sai.ok,tamper,db,dbQL:dbQL.ok,s304});
  } finally { UrlFetchApp.fetch=goc; } });


T('BT2 Bảng tin trong trang quản lý: chưa nối thì báo rõ; admin nhận vé quyền admin, quản lý nhận vé quyền quản lý (Worker chấp nhận); sai mã bị từ chối', ()=>{
  const crypto=require('crypto'), SECRET='khoa-thu-BT2';
  const verify=(t)=>{ const [p,s]=String(t||'').split('.'); if(!p||!s) return null; const sig=crypto.createHmac('sha256',Buffer.from(SECRET,'utf8')).update(Buffer.from(p,'utf8')).digest('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); if(sig!==s) return null; return JSON.parse(Buffer.from(p.replace(/-/g,'+').replace(/_/g,'/'),'base64').toString('utf8')); };
  const chua=bangTinQL({pin:'1234'});
  luuCaiDatChung({pin:'1234',kv:{BANGTIN_URL:'https://ncafe-bangtin.dangbao-mt.workers.dev',BANGTIN_KEY:SECRET}}); _CFG=null;
  const ad=bangTinQL({pin:'1234'}), ql=bangTinQL({pin:'2468'}), sai=bangTinQL({pin:'0000'}); const va=verify(ad.t), vq=verify(ql.t);
  luuCaiDatChung({pin:'1234',kv:{BANGTIN_URL:'',BANGTIN_KEY:''}}); _CFG=null;
  return (!chua.ok && chua.tat && ad.ok && va && va.r==='admin' && va.c==='ADMIN' && ql.ok && vq && vq.r==='ql' && /^QL-/.test(vq.c) && !sai.ok) || JSON.stringify({chua,ad:{ok:ad.ok,va},ql:{ok:ql.ok,vq,msg:ql.msg},sai}); });


T('SO1 Số đỏ trên tab: Xác nhận giờ đếm ca chờ duyệt + xin phép + báo quên + ghi chú; Báo hư hỏng đếm báo chưa xong; Hôm nay đếm người quá giờ chưa chấm ra; quản lý chỉ thấy quán mình; tab không có quyền thì không có số', ()=>{ const D='2032-04-06';
  at(D,'06:20'); const v=vao('TP','303','06:31',D,{maCa:'FT1'}); vao('DD','305','06:33',D,{maCa:'FT1'});
  at(D,'08:00'); const xp=xinPhep({ma:'306',sdt4:sdtOf('306'),ngay:'2032-04-07',loai:'muon',gio:'07:00',lyDo:'Đi học / thi'});
  const bh=baoHong({ma:'306',sdt4:sdtOf('306'),cs:'TP',mon:'Máy xay',moTa:'kêu to',mucDo:'Bình thường'});
  at(D,'16:00'); const ad=demViec({pin:'1234'}), ql=demViec({pin:'2468'}), sai=demViec({pin:'0000'});
  const tkQL=tkDayDu('2468'); fake=null;
  return (ad.ok && ad.so.duyet>=1 && /xin phép/.test(ad.ct.duyet) && ad.so.hong>=1 && ad.so.hom>=2 && /chưa chấm ra/.test(ad.ct.hom) && ql.ok && !sai.ok
      && (tkQL.quan.length? (ql.so.hom||0)<=(ad.so.hom||0) : true) && ad.so.luong!==undefined)
    || JSON.stringify({v:v.ok, xp, bh:bh&&bh.ok, ad, ql:{so:ql.so,quan:tkQL&&tkQL.quan}, sai}); });


T('API1 Mọi chức năng trang nhân viên gọi (Lịch của tôi, quét mã, Giờ công, Khảo sát) đều có trong danh sách cho phép của Worker Cloudflare VÀ của app (apiHam) – thiếu là nhân viên bấm bị "Không cho phép"', ()=>{
  const fs=require('fs'), goi=new Set();
  ['LichCuaToi.html','QR.html','GioCong.html','KhaoSat.html'].forEach(f=>{ const s=fs.readFileSync(__CCDIR+'/'+f,'utf8');
    [/\)\.(\w+)\((?:Object\.assign|\{)/g,/goi\('(\w+)'/g,/run\.(\w+)\(/g].forEach(re=>{ let m; while((m=re.exec(s))) goi.add(m[1]); }); });
  ['withSuccessHandler','withFailureHandler'].forEach(x=>goi.delete(x));
  const b=fs.readFileSync(__NCDIR+'/cloudflare/build_worker.py','utf8'), al=(b.match(/ALLOW=\[([^\]]*)\]/)||[])[1]||'', ALLOW=(al.match(/'(\w+)'/g)||[]).map(x=>x.replace(/'/g,''));
  const H=Object.keys(apiHam()); const thieuW=[...goi].filter(x=>!ALLOW.includes(x)), thieuA=[...goi].filter(x=>!H.includes(x)), khongCo=[...goi].filter(x=>typeof globalThis[x]!=='function' && typeof eval('typeof '+x)!=='undefined' && eval('typeof '+x)!=='function');
  return (goi.size>=10 && !thieuW.length && !thieuA.length && !khongCo.length) || JSON.stringify({goi:[...goi],thieuW,thieuA,khongCo}); });


T('LCT1 Trang Lịch của tôi: mọi biến mà đoạn TỰ ĐĂNG NHẬP (lúc vừa mở trang) dùng tới phải khai báo TRƯỚC đoạn đó – nếu không trang đứng mãi ở "Đang mở…" (lỗi 30/10)', ()=>{
  const l=require('fs').readFileSync(__CCDIR+'/LichCuaToi.html','utf8');
  const tuDong=l.indexOf("veNav(); setTimeout(tai,0)"), khaiBT=l.indexOf("BT={tai:false"), veNavFn=l.indexOf('function veNav(){'), seg=l.slice(veNavFn, l.indexOf('\n', veNavFn));
  const dungBT=/\bBT\./.test(seg.replace(/typeof BT[^;]*;/,'')) && !/var bt=/.test(seg);
  return (tuDong>0 && khaiBT>0 && khaiBT<tuDong && !dungBT) || JSON.stringify({tuDong, khaiBT, dungBT}); });


T('API2 Trang Lịch của tôi: biến bảng tin (BT) phải có trước đoạn TỰ ĐĂNG NHẬP lúc mở trang – nếu không, máy đã nhớ mã sẽ kẹt mãi ở "Đang mở…" (lỗi 30/10)', ()=>{
  const l=require('fs').readFileSync(__CCDIR+'/LichCuaToi.html','utf8'), s=l.slice(l.indexOf('<script>'));
  const khai=s.search(/(^|\n)var [^\n;]*\bBT=\{/), tuDong=s.indexOf('veNav(); setTimeout(tai,0)'), veNavAnToan=/function veNav\(\)\{ var bt=\(typeof BT==='object'/.test(s);
  return (khai>0 && tuDong>0 && khai<tuDong && veNavAnToan) || JSON.stringify({khai,tuDong,veNavAnToan}); });


T('API3 Trang quản lý trên Cloudflare: (1) mọi hàm có kiểm mã mà trang quản lý dùng đều có trong apiHamQL VÀ danh sách cho phép của Worker; (2) không mở hàm phụ nội bộ (rows, so, cong, quyen, taiKhoan); (3) gọi TỪNG hàm bằng mã PIN SAI: không hàm nào trả dữ liệu, không bảng nào bị đổi', ()=>{
  const fs=require('fs'), q=fs.readFileSync(__CCDIR+'/QuanLy.html','utf8'), js=(q.match(/<script[^>]*>[\s\S]*?<\/script>/g)||[]).join('\n');
  const src=fs.readdirSync(__CCDIR).filter(f=>/\.gs$/.test(f)).map(f=>fs.readFileSync(__CCDIR+'/'+f,'utf8')).join('\n');
  const ten=new Set((src.match(/\bfunction (\w+)\(/g)||[]).map(x=>x.slice(9,-1))), tok=new Set(js.match(/\b[A-Za-z]\w*\b/g)||[]);
  const body=f=>{ const i=src.indexOf('function '+f+'('), j=src.indexOf('\nfunction ',i+10); return src.slice(i, j>0?j:i+4000).slice(0,2500); };
  const kiem=/authRole\(|khongQuyen\(|tkDayDu\(|\bquyen\(|dangNhap_\(|taiKhoan\(|laAdmin\(|nvTK\(|nvXacMinh\(|\bbangLuong\(p\)|\bbangLuongKhoang\(p\)/;
  const H=apiHamQL(), K=Object.keys(H);
  const can=[...tok].filter(x=>ten.has(x) && !x.endsWith('_') && kiem.test(body(x)) && !['quyen','taiKhoan'].includes(x));
  const thieuApp=can.filter(x=>!H[x]), w=fs.readFileSync(__NCDIR+'/cloudflare/worker.js','utf8'), AQ=JSON.parse((w.match(/const ALLOW_QL = (\[.*?\]);/)||[])[1]||'[]'), thieuW=K.filter(x=>!AQ.includes(x));
  const moNham=['rows','so','cong','quyen','taiKhoan','cuoiThang','kiemTra','luongGio','maMoi','canhBao','dsViTri'].filter(x=>H[x]||AQ.includes(x));
  const chup=()=>JSON.stringify(SS.getSheets().map(s=>[s.getName?s.getName():s.n, JSON.stringify(s.getDataRange().getValues())]));
  const truoc=chup(), loThong=[];
  K.forEach(k=>{ let r; try{ r=k==='chay'?H.chay('bangLuong',{pin:'0000'}):k==='tinNhanMa'?H.tinNhanMa('101'):H[k]({pin:'0000',thang:'2032-04',maNV:'101',ma:'101',ngay:'2032-04-06',id:'1',kv:{API_KEY:'x'}}); }catch(e){ r={ok:false}; }
    const ok = r===''||r===null||r===undefined||(r && r.ok===false)||(Array.isArray(r)&&!r.length); if(!ok) loThong.push(k+': '+JSON.stringify(r).slice(0,80)); });
  const sau=chup();
  return (K.length>=90 && !thieuApp.length && !thieuW.length && !moNham.length && !loThong.length && truoc===sau) || JSON.stringify({n:K.length,thieuApp,thieuW,moNham,loThong:loThong.slice(0,8),doiDuLieu:truoc!==sau});
});

/* ===== (30/10b) ĐỢT 1 – 5 bài thử mới ===== */

T('L1 Giờ CHỜ XÁC NHẬN không vào bảng lương: cùng 1 NV có 2 ca ngày 2026-10-15, ca Đã xác nhận 7h + ca Chờ xác nhận 8h → bảng lương chỉ cộng 7h; theoCS cũng chỉ 7h; nếu duyệt luôn ca thứ 2 thì bảng lương lên 15h', ()=>{
  // Chuẩn bị
  SS.getSheetByName('ChamCong').d = [['ID','Ngay','MaNV','TenCho','MaCS','MaCa','CaBD','CaKT','ViTri','Vao','Ra','TreMin','KhaiLoai','KhaiGio','KhaiTu','KhaiDen','TrangThai','GioThuc','GioTinh','XacNhanBoi','XacNhanLuc','GhiChu','CB','Anh','GC','Lat','Lng','Khoang','Dev']];
  var sh=SS.getSheetByName('ChamCong');
  var th='2026-10'; _TKROWS=null; _LSL=null;
  sh.appendRow(['C1', new Date('2026-10-15T07:00:00+07:00'), '201','Thanh','TP','FT1','06:30','14:30','Pha chế','06:30','14:30',0,'du','','','','Đã xác nhận',8,7,'admin',new Date(),'','','', '', 0,0,0,'']);
  sh.appendRow(['C2', new Date('2026-10-15T15:00:00+07:00'), '201','Thanh','TP','FT2','14:30','22:30','Pha chế','14:30','22:30',0,'du','','','','Chờ xác nhận',8,8,'',null,'','','', '', 0,0,0,'']);
  var n=rows('NhanVien').filter(x=>String(x.MaNV)==='201')[0];
  var dl=duLieuThang(th), cc=dl['201']||[], o=tinhNguoi(n, cc, nhapThang(th), tamUngThang(th), mucLuong(), ngayLeMap(), th);
  if(o.gio!==7) return 'o.gio sau khi chỉ 1 ca duyệt = '+o.gio+' (phải 7)';
  if((o.theoCS||{}).TP!==7) return 'o.theoCS.TP = '+((o.theoCS||{}).TP)+' (phải 7)';
  // Duyệt luôn ca 2
  sh.d.find(r=>r[0]==='C2')[16]='Đã xác nhận'; sh.d.find(r=>r[0]==='C2')[18]=8;
  _TKROWS=null; _LSL=null;
  var o2=tinhNguoi(n, duLieuThang(th)['201']||[], nhapThang(th), tamUngThang(th), mucLuong(), ngayLeMap(), th);
  if(o2.gio!==15) return 'sau duyệt o2.gio = '+o2.gio+' (phải 15)';
  return true;
});

T('L2 Tăng ca CHỈ tính khi QL xác nhận: ca 2026-10-20 FT1 (6:30-14:30 = 8h), nhân viên khai GioTinh=10 (tăng 2h), trạng thái Chờ xác nhận → o.gioTC = 0; chuyển Đã xác nhận → o.gioTC = 2', ()=>{
  var sh=SS.getSheetByName('ChamCong');
  sh.d=[sh.d[0]];
  sh.appendRow(['T1', new Date('2026-10-20T07:00:00+07:00'), '201','Thanh','TP','FT1','06:30','14:30','Pha chế','06:30','16:30',0,'tang','10','14:30','16:30','Chờ xác nhận',10,10,'',null,'','','', '', 0,0,0,'']);
  var n=rows('NhanVien').filter(x=>String(x.MaNV)==='201')[0], th='2026-10'; _TKROWS=null; _LSL=null;
  var oA=tinhNguoi(n, duLieuThang(th)['201']||[], nhapThang(th), tamUngThang(th), mucLuong(), ngayLeMap(), th);
  if(oA.gio!==0) return 'ca Chờ: o.gio phải 0, nhận '+oA.gio;
  if(oA.gioTC!==0) return 'ca Chờ: o.gioTC phải 0, nhận '+oA.gioTC;
  // Duyệt
  sh.d.find(r=>r[0]==='T1')[16]='Đã xác nhận'; _TKROWS=null; _LSL=null;
  var oB=tinhNguoi(n, duLieuThang(th)['201']||[], nhapThang(th), tamUngThang(th), mucLuong(), ngayLeMap(), th);
  if(oB.gio!==10) return 'duyệt: o.gio phải 10, nhận '+oB.gio;
  if(oB.gioTC!==2) return 'duyệt: o.gioTC phải 2, nhận '+oB.gioTC;
  return true;
});

T('BT3 btDongBo_ chỉ gửi short + MM-DD, KHÔNG gửi họ tên đầy đủ và năm sinh ra Worker (mục 3 ĐỢT 1)', ()=>{
  setCfg('BANGTIN_URL','https://bt.test'); setCfg('BANGTIN_KEY','k');
  var sh=SS.getSheetByName('NhanVien'), h=sh.d[0];
  if(h.indexOf('NgaySinh')<0) h.push('NgaySinh');
  var iMa=h.indexOf('MaNV'), iDOB=h.indexOf('NgaySinh');
  var row=sh.d.find(function(r){ return String(r[iMa])==='201'; }); if(!row) return 'không có NV 201';
  while(row.length<=iDOB) row.push('');
  row[iDOB]=new Date('1990-07-15T12:00:00+07:00');
  _TKROWS=null; _LSL=null;
  global.__btPayload=null;
  var cu=global.UrlFetchApp; global.UrlFetchApp={fetch:function(u,opt){ try{ global.__btPayload=JSON.parse(opt.payload); }catch(e){} return {getResponseCode:function(){return 200;}}; }};
  var r=btDongBo_();
  global.UrlFetchApp=cu;
  if(!r || !r.ok) return 'btDongBo_ thất bại: '+JSON.stringify(r);
  var p=global.__btPayload; if(!p || !Array.isArray(p.list)) return 'không bắt được payload';
  var l201=p.list.find(function(x){ return x.code==='201'; }); if(!l201) return 'không thấy NV 201 trong payload';
  if(l201.name!==undefined) return 'KHÔNG được gửi field name, nhận: '+JSON.stringify(l201);
  if(!l201.short || l201.short.indexOf('.')<0 && l201.short.length>1) return 'short phải có chữ cái đầu, nhận: '+l201.short;
  if(/[a-zàáâãèéêìíòóôõùúăđĩũơư]/.test(l201.short)) return 'short phải viết hoa, nhận: '+l201.short;
  if(!l201.dob) return 'dob rỗng, phải "07-15"';
  if(/^\d{4}/.test(l201.dob)) return 'payload lộ năm sinh: dob='+l201.dob;
  if(l201.dob!=='07-15') return 'dob phải "07-15" (MM-DD), nhận '+l201.dob;
  return true;
});

T('BH1 Báo hư hỏng mức GẤP → có gọi Telegram group quán + ghi BaoHong; mức Bình thường cũng ghi BaoHong (tgGuiAnh hiện gửi cả 2 với icon khác nhau)', ()=>{
  setCfg('TG_TOKEN','x'); setCfg('TG_CHAT_TP','-100');
  var tgCalls=[]; var cu=global.UrlFetchApp; global.UrlFetchApp={fetch:function(u,opt){ tgCalls.push({url:u, payload:opt&&opt.payload||''}); return {getResponseCode:function(){return 200;}, getContentText:function(){ return '{"ok":true}'; }}; }};
  var n=rows('NhanVien').filter(x=>String(x.MaNV)==='201')[0];
  // Gấp
  var r1=baoHong({ma:'201', sdt4:(n.SDT+'').slice(-4), cs:'TP', mon:'Máy pha số 2', moTa:'Không ra nước', mucDo:'Gấp'});
  if(!r1 || !r1.ok) return 'Gấp thất bại: '+JSON.stringify(r1);
  var guiGap=tgCalls.filter(function(c){ return /BÁO HƯ HỎNG/.test(c.payload) && /GẤP/.test(c.payload) && /🚨/.test(c.payload); }).length;
  if(guiGap<1) return 'Gấp phải gửi Telegram có icon 🚨, nhận '+guiGap+' call có GẤP';
  var dsBH1=rows('BaoHong').filter(function(x){ return x.MucDo==='Gấp' && x.Mon==='Máy pha số 2'; });
  if(dsBH1.length!==1) return 'Gấp phải có 1 dòng BaoHong MucDo=Gấp';
  // Bình thường
  tgCalls.length=0;
  var r2=baoHong({ma:'201', sdt4:(n.SDT+'').slice(-4), cs:'TP', mon:'Đèn bàn 3', moTa:'Hỏng công tắc', mucDo:'Bình thường'});
  if(!r2 || !r2.ok) return 'Bình thường thất bại: '+JSON.stringify(r2);
  var dsBH2=rows('BaoHong').filter(function(x){ return x.Mon==='Đèn bàn 3'; });
  if(dsBH2.length!==1 || dsBH2[0].MucDo!=='Bình thường') return 'Bình thường phải có 1 dòng BaoHong MucDo=Bình thường';
  global.UrlFetchApp=cu;
  return true;
});

T('UI1 Trang KhaoSat.html có nút "Đăng xuất" ở header + hàm dangXuat() xoá đủ 3 localStorage key (ncafe_ma, ncafe_sdt4, ncafe_phien) – áp dụng cho mục 5 ĐỢT 1', ()=>{
  var ks=fs.readFileSync(__CCDIR+'/KhaoSat.html','utf8');
  if(ks.indexOf('Đăng xuất')<0) return 'không thấy "Đăng xuất" trong KhaoSat.html';
  if(!/function\s+dangXuat/.test(ks)) return 'không thấy hàm dangXuat()';
  ['ncafe_ma','ncafe_sdt4','ncafe_phien'].forEach(function(k){ if(ks.indexOf("'"+k+"'")<0 && ks.indexOf('"'+k+'"')<0) throw new Error('dangXuat không xoá '+k); });
  // Phải nằm trước thẻ </body> và trước phần script chính (nằm ở đầu, header)
  if(ks.indexOf('onclick="dangXuat()"') > ks.indexOf('<div id="ph"')) return 'nút Đăng xuất phải nằm TRÊN khối #ph (header)';
  return true;
});

/* ===== (30/10c) Wi-Fi tự nhận IP khi chế độ Bắt buộc – 4 bài thử ===== */
function _resetWifiTest_(){ _TKROWS=null; _LSL=null; _CFG=null;
  setCfg('WIFI_CHE_DO','Bắt buộc'); setCfg('WIFI_CHO_XAC_NHAN','Có'); setCfg('WIFI_TU_THEM','Không'); setCfg('TG_TOKEN',''); setCfg('TG_CHAT_TP',''); setCfg('TG_CHAT_DD','');
  // Có ít nhất 1 IP đăng ký cho quán khác để wifiKiem_ trả bat=true
  var w=SS.getSheetByName('WifiQuan')||SS.insertSheet('WifiQuan'); w.d=[['IP','MaCS','GhiChu','Ngay','Boi','TrangThai'],[ipGhi_('192.168.1.1'),'LDD','seed',new Date(),'test','Dùng']];
  var c=SS.getSheetByName('WifiCho'); if(c) c.d=[WIFI_CHO_COT];
  memoXoa_('WifiQuan'); memoXoa_('WifiCho'); _TKROWS=null;
}

T('W1 Chế độ Bắt buộc + 2 NV khác nhau cùng IP lạ non-mobile trong 2h → tự nhận: WifiQuan có IP, các WifiCho chuyển "Da"', ()=>{
  _resetWifiTest_();
  var ipLa='10.9.9.9';
  global.IP_KHACH=ipLa; global.AS_ORG_KHACH='FPT TELECOM';
  var s={MaCS:'TP',TenCS:'Trần Phú'};
  var n1=rows('NhanVien').filter(x=>String(x.MaNV)==='201')[0];
  var n2=rows('NhanVien').filter(x=>String(x.MaNV)==='202')[0];
  if(!n1 || !n2) return 'thiếu NV 201/202';
  // Lần 1 NV1 — wifiChan_ trả choIP (chưa đủ 2 NV)
  var w1=wifiChan_(s, n1, 'VAO', {});
  if(!w1 || !w1.choIP) return 'lần 1 phải choIP, nhận '+JSON.stringify(w1);
  wifiQueueCho_('TP','201','Thanh',ipLa,'FPT TELECOM','ccW1a','','VAO');
  // Lần 2 NV2 — wifiChan_ phải phát hiện 2 NV khác nhau trong 2h → tự nhận
  var w2=wifiChan_(s, n2, 'VAO', {});
  var daCo=rows('WifiQuan').some(w=>ipKhop_(ipLa, w.IP) && up(w.MaCS)==='TP' && String(w.TrangThai||'Dùng')!=='Bỏ');
  if(!daCo) return 'phải thêm IP vào WifiQuan sau 2 NV';
  var dsA=rows('WifiCho').filter(x=>String(x.CCID)==='ccW1a');
  if(!dsA.length || String(dsA[0].TrangThai)!=='Da') return 'WifiCho NV1 phải chuyển "Da", nhận: '+JSON.stringify(dsA[0]&&dsA[0].TrangThai);
  // w2 không phải choIP vì sau khi tự nhận, wifiChan_ gọi lại wifiKiem_ → w.ok=true → trả null
  if(w2 && w2.choIP) return 'sau khi tự nhận, lần 2 phải pass (null), nhận '+JSON.stringify(w2);
  return true;
});

T('W2 Chế độ Bắt buộc + 1 NV chấm IP lạ non-mobile → choIP, WifiCho "Cho", WifiQuan KHÔNG thêm', ()=>{
  _resetWifiTest_();
  var ipLa='10.8.8.8';
  global.IP_KHACH=ipLa; global.AS_ORG_KHACH='VNPT CORP';
  var s={MaCS:'DD',TenCS:'Đống Đa'};
  var n=rows('NhanVien').filter(x=>String(x.MaNV)==='201')[0];
  var w=wifiChan_(s, n, 'VAO', {});
  if(!w || !w.choIP) return 'phải choIP';
  if(w.mobile) return 'VNPT CORP không phải mobile';
  wifiQueueCho_('DD','201','Thanh',ipLa,'VNPT CORP','ccW2','','VAO');
  var daCo=rows('WifiQuan').some(w=>ipKhop_(ipLa, w.IP) && up(w.MaCS)==='DD' && String(w.TrangThai||'Dùng')!=='Bỏ');
  if(daCo) return 'KHÔNG được thêm WifiQuan với 1 NV';
  var ds=rows('WifiCho').filter(x=>String(x.CCID)==='ccW2');
  if(!ds.length || String(ds[0].TrangThai)!=='Cho') return 'WifiCho phải "Cho"';
  return true;
});

T('W3 Mobile asOrg (Viettel Mobile): 2 NV khác nhau cùng IP → vẫn KHÔNG tự nhận (phải chờ admin xác nhận)', ()=>{
  _resetWifiTest_();
  var ipLa='2402:800:aaaa::1';
  global.IP_KHACH=ipLa; global.AS_ORG_KHACH='Viettel Mobile';
  var s={MaCS:'TP',TenCS:'TP'};
  var n1=rows('NhanVien').filter(x=>String(x.MaNV)==='201')[0];
  var n2=rows('NhanVien').filter(x=>String(x.MaNV)==='202')[0];
  var w1=wifiChan_(s, n1, 'VAO', {});
  if(!w1 || !w1.choIP) return 'lần 1 phải choIP';
  if(!w1.mobile) return 'phải nhận Viettel Mobile là mobile';
  wifiQueueCho_('TP','201','a',ipLa,'Viettel Mobile','ccW3a','','VAO');
  var w2=wifiChan_(s, n2, 'VAO', {});
  if(!w2 || !w2.choIP) return 'lần 2 vẫn phải choIP (mobile không auto)';
  var daCo=rows('WifiQuan').some(w=>ipKhop_(ipLa, w.IP) && up(w.MaCS)==='TP' && String(w.TrangThai||'Dùng')!=='Bỏ');
  if(daCo) return 'KHÔNG được tự nhận khi là mobile';
  return true;
});

T('W4 Admin xác nhận IP qua wifiXacNhanIP: hanhDong="nhan" → WifiQuan + "Da"; hanhDong="tuChoi" → ChamCong "Từ chối IP" + WifiCho "TuChoi"', ()=>{
  _resetWifiTest_();
  setCfg('ADMIN_PIN','1234');
  // nhan
  var idA=wifiQueueCho_('TP','201','a','10.11.11.11','FPT TELECOM','ccW4a','','VAO');
  var r1=wifiXacNhanIP({pin:'1234', id:idA, hanhDong:'nhan'});
  if(!r1 || !r1.ok) return 'nhan thất bại: '+JSON.stringify(r1);
  var daCo=rows('WifiQuan').some(w=>ipKhop_('10.11.11.11', w.IP) && up(w.MaCS)==='TP' && String(w.TrangThai||'Dùng')!=='Bỏ');
  if(!daCo) return 'nhan phải thêm IP vào WifiQuan';
  var dsA=rows('WifiCho').filter(x=>String(x.ID)===idA);
  if(!dsA.length || String(dsA[0].TrangThai)!=='Da') return 'nhan phải chuyển WifiCho "Da"';
  // tuChoi + verify ChamCong row chuyển "Từ chối IP"
  var sh=SS.getSheetByName('ChamCong'), h=sh.d[0], row=new Array(h.length).fill('');
  row[h.indexOf('ID')]='ccW4b'; row[h.indexOf('Ngay')]=new Date(); row[h.indexOf('MaNV')]='202'; row[h.indexOf('MaCS')]='DD'; row[h.indexOf('TrangThai')]='Đang làm'; row[h.indexOf('CanhBao')]='IP chờ xác nhận (10.12.12.12)';
  sh.d.push(row); _TKROWS=null; memoXoa_('ChamCong');
  var idB=wifiQueueCho_('DD','202','b','10.12.12.12','VNPT','ccW4b','','VAO');
  var r2=wifiXacNhanIP({pin:'1234', id:idB, hanhDong:'tuChoi'});
  if(!r2 || !r2.ok) return 'tuChoi thất bại: '+JSON.stringify(r2);
  _TKROWS=null; memoXoa_('ChamCong');
  var cc=rows('ChamCong').filter(x=>String(x.ID)==='ccW4b')[0];
  if(!cc) return 'không tìm được ChamCong ccW4b';
  if(String(cc.TrangThai)!=='Từ chối IP') return 'ChamCong phải "Từ chối IP", nhận: '+String(cc.TrangThai);
  var dsB=rows('WifiCho').filter(x=>String(x.ID)===idB);
  if(!dsB.length || String(dsB[0].TrangThai)!=='TuChoi') return 'WifiCho phải "TuChoi"';
  return true;
});

/* ===== (30/10c Phase B) Telegram callback – 3 bài thử ===== */

T('W5 tgCallback: nhân viên (TG id KHÔNG trong TG_ADMIN_IDS) bấm nút → bị từ chối, WifiCho KHÔNG đổi', ()=>{
  _resetWifiTest_();
  setCfg('TG_ADMIN_IDS','111111'); setCfg('TG_TOKEN','x'); setCfg('TG_CHAT_TP','-100');
  var tgCalls=[]; var cu=global.UrlFetchApp; global.UrlFetchApp={fetch:function(u,opt){ tgCalls.push({u:u, body:opt&&opt.payload||''}); return {getResponseCode:function(){return 200;}, getContentText:function(){ return '{"ok":true}'; }}; }};
  var id=wifiQueueCho_('TP','201','a','10.20.20.20','FPT','ccW5','','VAO');
  var r=tgCallback({callback_query:{id:'cb1', from:{id:999999, first_name:'LạHoắc'}, data:'w|'+id+'|a', message:{chat:{id:-100}, message_id:555}}});
  if(!r || !r.ok) return 'tgCallback phải trả ok';
  if(r.bo!=='not_admin') return 'phải bo=not_admin, nhận '+r.bo;
  var ds=rows('WifiCho').filter(x=>String(x.ID)===id);
  if(String(ds[0].TrangThai)!=='Cho') return 'WifiCho phải giữ "Cho", nhận '+ds[0].TrangThai;
  var answered=tgCalls.some(c=>/answerCallbackQuery/.test(c.u) && /Chỉ quản lý/.test(c.body));
  if(!answered) return 'phải gọi answerCallbackQuery với "Chỉ quản lý"';
  global.UrlFetchApp=cu;
  return true;
});

T('W6 tgCallback: admin bấm "✅ Xác nhận" → IP thêm vào WifiQuan, WifiCho "Da", editMessage trong Telegram', ()=>{
  _resetWifiTest_();
  setCfg('TG_ADMIN_IDS','1234567'); setCfg('TG_TOKEN','x'); setCfg('TG_CHAT_TP','-100');
  var tgCalls=[]; var cu=global.UrlFetchApp; global.UrlFetchApp={fetch:function(u,opt){ tgCalls.push({u:u, body:opt&&opt.payload||''}); return {getResponseCode:function(){return 200;}, getContentText:function(){ return '{"ok":true}'; }}; }};
  var id=wifiQueueCho_('TP','201','Thanh','10.30.30.30','FPT TELECOM','ccW6','','VAO');
  var r=tgCallback({callback_query:{id:'cb2', from:{id:1234567, first_name:'Bảo'}, data:'w|'+id+'|a', message:{chat:{id:-100}, message_id:777}}});
  if(!r || !r.ok || r.da!=='nhan') return 'phải xác nhận, nhận '+JSON.stringify(r);
  var daCo=rows('WifiQuan').some(w=>ipKhop_('10.30.30.30', w.IP) && up(w.MaCS)==='TP');
  if(!daCo) return 'WifiQuan phải có IP mới';
  var ds=rows('WifiCho').filter(x=>String(x.ID)===id);
  if(String(ds[0].TrangThai)!=='Da') return 'WifiCho phải "Da", nhận '+ds[0].TrangThai;
  var edited=tgCalls.some(c=>/editMessageText|editMessageCaption/.test(c.u) && /xác nhận bởi Bảo/i.test(c.body));
  if(!edited) return 'phải editMessage có "xác nhận bởi Bảo", calls: '+JSON.stringify(tgCalls.map(c=>c.u));
  global.UrlFetchApp=cu;
  return true;
});

T('W7 tgCallback: admin bấm "❌ Từ chối" → WifiCho "TuChoi", ChamCong "Từ chối IP", editMessage', ()=>{
  _resetWifiTest_();
  setCfg('TG_ADMIN_IDS','1234567'); setCfg('TG_TOKEN','x'); setCfg('TG_CHAT_DD','-200');
  var tgCalls=[]; var cu=global.UrlFetchApp; global.UrlFetchApp={fetch:function(u,opt){ tgCalls.push({u:u, body:opt&&opt.payload||''}); return {getResponseCode:function(){return 200;}, getContentText:function(){ return '{"ok":true}'; }}; }};
  // Seed ChamCong row
  var sh=SS.getSheetByName('ChamCong'), h=sh.d[0], row=new Array(h.length).fill('');
  row[h.indexOf('ID')]='ccW7'; row[h.indexOf('Ngay')]=new Date(); row[h.indexOf('MaNV')]='201'; row[h.indexOf('MaCS')]='DD'; row[h.indexOf('TrangThai')]='Đang làm'; row[h.indexOf('CanhBao')]='IP chờ xác nhận (10.40.40.40)';
  sh.d.push(row); _TKROWS=null; memoXoa_('ChamCong');
  var id=wifiQueueCho_('DD','201','Thanh','10.40.40.40','VNPT','ccW7','','VAO');
  var r=tgCallback({callback_query:{id:'cb3', from:{id:1234567, first_name:'Bảo'}, data:'w|'+id+'|r', message:{chat:{id:-200}, message_id:888, caption:'(photo)', photo:[{}]}}});
  if(!r || !r.ok || r.da!=='tuChoi') return 'phải từ chối, nhận '+JSON.stringify(r);
  _TKROWS=null; memoXoa_('ChamCong');
  var cc=rows('ChamCong').filter(x=>String(x.ID)==='ccW7')[0];
  if(!cc || String(cc.TrangThai)!=='Từ chối IP') return 'ChamCong phải "Từ chối IP", nhận '+(cc&&cc.TrangThai);
  var ds=rows('WifiCho').filter(x=>String(x.ID)===id);
  if(String(ds[0].TrangThai)!=='TuChoi') return 'WifiCho phải "TuChoi"';
  var edited=tgCalls.some(c=>/editMessageCaption/.test(c.u) && /từ chối bởi Bảo/i.test(c.body));
  if(!edited) return 'phải editMessageCaption cho photo msg';
  global.UrlFetchApp=cu;
  return true;
});

console.log(out.join('\n')); console.log('KẾT QUẢ: '+pass+' đạt, '+fail+' lỗi');
