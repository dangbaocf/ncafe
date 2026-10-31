/* ===================== BẢN NHÁP TUẦN – SỬA NHƯ GOOGLE SHEET =====================
   Lưới bố cục y hệt tab "Lịch T10": gõ "Châu (8)", "Thư full", "Nam gãy", "Phương (15h)"…; app đọc bằng cùng bộ đọc với file quán.
   Phím: mũi tên / Enter / Tab / Delete / F2 · Ctrl+C/X/V (dán qua lại với Google Sheet) · Ctrl+Shift+V dán chỉ chữ · Ctrl+Z / Ctrl+Y
   Kéo ô đang chọn sang ô khác = chuyển người (giữ màu quán của ô đích). Tự lưu sau 2–3 giây. */
var NH={tuan:'', luoi:null, k:'CFMH', sel:{r:3,c:1,r2:3,c2:1}, sua:false, undo:[], redo:[], dirty:false, t:null, token:'', ten:'', khoa:null, chiXem:false, nv:[], dm:{}, file:{}, loi:{}, keo:null, chuot:false, kq:null, giuQuyen:false, nguon:''};
var NH_MAU=[['#ffffff','Trần Phú'],['#ffe599','Tản Đà'],['#b6d7a8','Đống Đa'],['#c9daf8','TNV']];
var NH_RONG={CFMH:17, LDD:9};
function nhTok(){ try{ var t=sessionStorage.getItem('nhTok'); if(!t){ t=String(Math.random()).slice(2,12); sessionStorage.setItem('nhTok',t); } return t; }catch(e){ return NH.token||String(Math.random()).slice(2,12); } }
function nhBoDau(s){ return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase().replace(/\s+/g,' ').trim(); }
function nhNorm(s){ return String(s||'').toLowerCase().normalize('NFC').replace(/\s+/g,' ').trim(); }
function nhL(){ return NH.luoi[NH.k]; }
function nhO(r,c){ var L=nhL(); return (L.v[r]&&L.v[r][c]!=null)?L.v[r][c]:''; }
function nhHien(x){ var m=String(x).match(/^D:(\d{4})-(\d{2})-(\d{2})$/); return m?(m[3]+'/'+m[2]):String(x); }
function nhCot(c){ return String.fromCharCode(65+c); }
function nhRongCot(c){ if(NH.k==='CFMH') return (c===0||c===9)?110:(c===8?22:118); return c===0?120:(c===1?54:118); }
function nhChuanSel(){ var s=NH.sel; return {r1:Math.min(s.r,s.r2), r2:Math.max(s.r,s.r2), c1:Math.min(s.c,s.c2), c2:Math.max(s.c,s.c2)}; }
function nhDamBao(r){ var L=nhL(), w=NH_RONG[NH.k]; while(L.v.length<=r){ var mau=L.bg.length?L.bg[L.bg.length-1].slice():[]; while(mau.length<w) mau.push('#ffffff'); L.v.push(Array(w).fill('')); L.bg.push(mau.map(function(){ return '#ffffff'; })); } }
// ---------- mở / tải ----------
function nhMo(){ NH.token=nhTok(); NH.tuan=$('nTuan').value||$('tuan').value; $('nTuan').value=NH.tuan; $('nhTT').textContent='Đang tải…'; $('nhChua').classList.add('hide'); $('nhKhung').classList.add('hide');
  google.script.run.withSuccessHandler(function(r){ if(!r.ok){ $('nhTT').textContent=r.msg; return; } NH.nv=r.nv; NH.dm=r.dm; NH.file=r.file; NH.khoa=r.khoa; NH.chiXem=!!r.khoa; NH.giuQuyen=false; NH.undo=[]; NH.redo=[]; NH.tuan=r.tuan; $('nTuan').value=r.tuan;
      $('nhTruoc').classList.toggle('hide', !r.coTruoc);
      if(!r.nhap){ NH.luoi=null; $('nhChua').classList.remove('hide'); $('nhChuaLC').textContent=r.lichChinh?('Bắt đầu từ lịch chính thức đang dùng ('+r.lichChinh+' ca)'):'Lịch chính thức tuần này chưa có'; $('nhChuaLC').disabled=!r.lichChinh; $('nhTT').textContent=''; return; }
      NH.luoi=r.nhap.luoi; ['CFMH','LDD'].forEach(function(k){ var L=NH.luoi[k]; L.v=L.v||[]; L.bg=L.bg||[]; L.dam=L.dam||[]; });
      NH.nguon=r.nhap.nguon||''; $('nhKhung').classList.remove('hide'); nhBaoNguon(r.nhap); nhBaoKhoa(); NH.sel={r:3,c:1,r2:3,c2:1}; nhVe(); nhKiemTra(); $('nhTT').textContent='Bản nháp lưu lúc '+r.nhap.luc+(r.nhap.boi?' ('+r.nhap.boi+')':''); })
  .withFailureHandler(function(e){ $('nhTT').textContent='Lỗi: '+(e.message||e); }).layNhapLuoi({pin:PIN, tuan:NH.tuan, token:nhTok()}); }
function nhBaoNguon(n){ var b=$('nhNguon'); if(/^sheet:/.test(NH.nguon)){ b.innerHTML='Bản nháp đã <b>xuất ra Google Sheet</b> (tab "'+esc(NH.nguon.slice(6))+'"). Nếu đang sửa ở Sheet thì bấm <button class="second mini" onclick="nhLayVe(\'nhap\')">Lấy về từ tab Nháp</button> trước khi sửa tiếp ở đây.'; b.classList.remove('hide'); } else b.classList.add('hide'); }
function nhBaoKhoa(){ var b=$('nhKhoa'); if(NH.khoa && NH.chiXem){ b.innerHTML='<b>'+esc(NH.khoa.ten||'Người khác')+'</b> đang sửa bản nháp tuần này (từ '+esc(NH.khoa.luc||'')+'). Bạn đang <b>chỉ xem</b>. <button class="second mini" onclick="NH.chiXem=false;NH.giuQuyen=true;nhBaoKhoa();nhVe()">Vẫn sửa (giành quyền)</button>'; b.classList.remove('hide'); } else b.classList.add('hide'); }
function nhTao(cach){ var fn=cach==='lc'?'taoNhapTuLichChinh':(cach==='truoc'?'layLaiNhapTruoc':'layNhapTuSheet'); $('nhTT').textContent='Đang tạo bản nháp…';
  google.script.run.withSuccessHandler(function(r){ if(!r.ok){ alert(r.msg); $('nhTT').textContent=''; return; } if(r.loi&&r.loi.length) alert('Lưu ý: '+r.loi.join(' · ')); nhMo(); }).withFailureHandler(function(e){ alert('Lỗi: '+(e.message||e)); })[fn]({pin:PIN, tuan:$('nTuan').value}); }
function nhLayVe(kieu){ if(NH.dirty) nhLuu(); var tab=kieu==='nhap'?('Nháp '+NH.tuan.slice(8,10)+'.'+NH.tuan.slice(5,7)):'';
  if(!confirm('Lấy tuần này từ '+(tab?'tab "'+tab+'"':'tab tháng (Lịch T'+(+NH.tuan.slice(5,7))+')')+' của 2 file quán vào bản nháp web?\n(Bản nháp hiện tại được giữ, bấm "Lấy lại bản nháp trước" để quay lại.)')) return;
  $('nhTT').textContent='Đang đọc file quán…'; google.script.run.withSuccessHandler(function(r){ if(!r.ok){ alert(r.msg); $('nhTT').textContent=''; return; } if(r.loi&&r.loi.length) alert('Lưu ý: '+r.loi.join(' · ')); nhMo(); })
    .withFailureHandler(function(e){ alert('Lỗi: '+(e.message||e)); }).layNhapTuSheet({pin:PIN, tuan:NH.tuan, tab:tab}); }
function nhXuat(){ if(NH.dirty) nhLuu(); $('nhTT').textContent='Đang xuất ra Google Sheet…';
  google.script.run.withSuccessHandler(function(r){ if(!r.ok){ alert(r.msg); return; } NH.nguon='sheet:'+r.tab; nhBaoNguon(); $('nhTT').innerHTML='Đã xuất: '+r.file.map(function(f){ return f.loi?'<span class="bad">'+esc(f.ten)+': '+esc(f.loi)+'</span>':'<a target="_blank" href="'+esc(f.url)+'">'+esc(f.ten)+' → tab '+esc(f.tab)+'</a>'; }).join(' · '); })
    .withFailureHandler(function(e){ alert('Lỗi: '+(e.message||e)); }).xuatNhapRaSheet({pin:PIN, tuan:NH.tuan}); }
// ---------- vẽ lưới ----------
function nhVe(){ var L=nhL(), w=NH_RONG[NH.k], dam={}; (L.dam||[]).forEach(function(r){ dam[r]=1; }); var loi=NH.loi[NH.k]||{};
  var h='<table class="nhT"><colgroup><col style="width:38px">'; for(var c=0;c<w;c++) h+='<col style="width:'+nhRongCot(c)+'px">'; h+='</colgroup><tr class="nhHd"><th></th>'; for(c=0;c<w;c++) h+='<th>'+nhCot(c)+'</th>'; h+='</tr>';
  for(var r=0;r<L.v.length;r++){ h+='<tr'+(r<3?' class="nhDau nhDau'+r+'"':'')+'><th class="nhSo">'+(r+1)+'</th>';
    for(c=0;c<w;c++){ var x=nhO(r,c), bg=(L.bg[r]&&L.bg[r][c])||'#ffffff', l=loi[r+'|'+c];
      h+='<td data-r="'+r+'" data-c="'+c+'" style="background:'+bg+(dam[r]?';font-weight:700':'')+(bg==='#38761d'?';color:#fff':'')+'"'+(l?' class="nhLoi" title="'+esc(l)+'"':'')+'>'+esc(nhHien(x))+'</td>'; }
    h+='</tr>'; }
  h+='</table>'; $('nhBang').innerHTML=h; nhVeChon();
  document.querySelectorAll('.nhTab').forEach(function(b){ b.classList.toggle('on', b.dataset.k===NH.k); });
  $('nhUndo').disabled=!NH.undo.length; $('nhRedo').disabled=!NH.redo.length; $('nhLuoi').classList.toggle('nhChiXem', NH.chiXem); }
function nhTd(r,c){ return $('nhBang').querySelector('td[data-r="'+r+'"][data-c="'+c+'"]'); }
function nhVeChon(){ var s=nhChuanSel(); $('nhBang').querySelectorAll('td.nhChon,td.nhHT').forEach(function(t){ t.classList.remove('nhChon','nhHT'); });
  for(var r=s.r1;r<=s.r2;r++) for(var c=s.c1;c<=s.c2;c++){ var t=nhTd(r,c); if(t) t.classList.add('nhChon'); }
  var a=nhTd(NH.sel.r,NH.sel.c); if(a){ a.classList.add('nhHT'); nhDatO(a); }
  $('nhViTri').textContent=nhCot(NH.sel.c)+(NH.sel.r+1)+(s.r1!==s.r2||s.c1!==s.c2?(':'+nhCot(s.c2)+(s.r2+1)):'')+'  '+(nhO(NH.sel.r,NH.sel.c)?'· '+nhHien(nhO(NH.sel.r,NH.sel.c)):'');
  var l=(NH.loi[NH.k]||{})[NH.sel.r+'|'+NH.sel.c]; $('nhViTri').title=l||''; if(l) $('nhViTri').textContent+='  ⚠ '+l; }
// ô nhập (textarea ẩn) luôn nằm trên ô đang chọn: gõ là sửa (gõ tiếng Việt Telex/VNI vẫn đúng)
function nhDatO(td){ var n=$('nhIn'), g=$('nhLuoi'); if(!td) return; var gr=g.getBoundingClientRect(), tr=td.getBoundingClientRect();
  n.style.left=(tr.left-gr.left+g.scrollLeft)+'px'; n.style.top=(tr.top-gr.top+g.scrollTop)+'px'; n.style.width=Math.max(tr.width,150)+'px'; n.style.height=tr.height+'px';
  if(!NH.sua && document.activeElement!==n && NH.dangMo) try{ n.focus({preventScroll:true}); }catch(e){ n.focus(); } }
function nhDi(dr,dc,mo){ var L=nhL(), w=NH_RONG[NH.k], br=mo?NH.sel.r2:NH.sel.r, bc=mo?NH.sel.c2:NH.sel.c, r=Math.max(0,br+dr), c=Math.max(0,Math.min(w-1,bc+dc)), them=false;
  if(r>=L.v.length){ if(mo || NH.chiXem) r=L.v.length-1; else { nhDamBao(r); them=true; } }   // đi quá dòng cuối → thêm dòng như Sheet
  if(mo){ NH.sel.r2=r; NH.sel.c2=c; } else NH.sel={r:r,c:c,r2:r,c2:c};
  if(them) nhVe(); else nhVeChon(); var t=nhTd(r,c); if(t) t.scrollIntoView({block:'nearest',inline:'nearest'}); }
// ---------- thay đổi + hoàn tác ----------
function nhChup(){ NH.undo.push({k:NH.k, s:JSON.stringify(nhL())}); if(NH.undo.length>150) NH.undo.shift(); NH.redo=[]; }
function nhDoi(){ NH.dirty=true; $('nhTT').textContent='Đang sửa…'; clearTimeout(NH.t); NH.t=setTimeout(nhLuu, 2500); clearTimeout(NH.tk); NH.tk=setTimeout(nhKiemTra, 350); nhVe(); }
function nhHoanTac(lai){ var tu=lai?NH.redo:NH.undo, ve=lai?NH.undo:NH.redo; if(!tu.length) return; var x=tu.pop(); ve.push({k:x.k, s:JSON.stringify(NH.luoi[x.k])}); NH.luoi[x.k]=JSON.parse(x.s); NH.k=x.k; nhDoi(); }
function nhKhoa(){ if(NH.chiXem){ $('nhTT').textContent='Đang chỉ xem – bấm "Vẫn sửa" ở trên nếu muốn sửa'; return true; } return false; }
function nhGhi(r,c,v){ nhDamBao(r); var L=nhL(); if(c>=NH_RONG[NH.k]) return; L.v[r][c]=String(v==null?'':v).replace(/\s+/g,' ').trim(); }
function nhXoaChon(){ if(nhKhoa()) return; var s=nhChuanSel(); nhChup(); for(var r=s.r1;r<=s.r2;r++) for(var c=s.c1;c<=s.c2;c++) if(!/^D:/.test(nhO(r,c))) nhGhi(r,c,''); nhDoi(); }
function nhTo(mau){ if(nhKhoa()) return; var s=nhChuanSel(), L=nhL(); nhChup(); for(var r=s.r1;r<=s.r2;r++){ nhDamBao(r); for(var c=s.c1;c<=s.c2;c++) L.bg[r][c]=mau; } nhDoi(); }
function nhThemDong(){ if(nhKhoa()) return; var L=nhL(), r=nhChuanSel().r2; nhChup(); L.v.splice(r+1,0,Array(NH_RONG[NH.k]).fill('')); L.bg.splice(r+1,0,(L.bg[r]||[]).slice()); L.dam=(L.dam||[]).map(function(x){ return x>r?x+1:x; }); NH.sel={r:r+1,c:NH.sel.c,r2:r+1,c2:NH.sel.c}; nhDoi(); }
function nhXoaDong(){ if(nhKhoa()) return; var L=nhL(), s=nhChuanSel(); if(s.r1<3){ alert('Không xoá 3 dòng tiêu đề (tên tuần, thứ, ngày).'); return; } var co=false; for(var r=s.r1;r<=s.r2;r++) if((L.v[r]||[]).join('')) co=true;
  if(co && !confirm('Xoá '+(s.r2-s.r1+1)+' dòng (có tên người)? Có thể hoàn tác bằng Ctrl+Z.')) return; nhChup(); L.v.splice(s.r1,s.r2-s.r1+1); L.bg.splice(s.r1,s.r2-s.r1+1); L.dam=(L.dam||[]).filter(function(x){ return x<s.r1||x>s.r2; }).map(function(x){ return x>s.r2?x-(s.r2-s.r1+1):x; }); NH.sel={r:s.r1,c:NH.sel.c,r2:s.r1,c2:NH.sel.c}; nhDoi(); }
function nhChuyen(r0,c0,r1,c1){ if(nhKhoa()) return; if(/^D:/.test(nhO(r0,c0))) return; var dich=nhO(r1,c1); nhChup(); nhGhi(r1,c1,nhO(r0,c0)); nhGhi(r0,c0,dich); NH.sel={r:r1,c:c1,r2:r1,c2:c1}; nhDoi(); }  // hoán đổi: ô đích có người thì đổi chỗ 2 người
// ---------- sửa ô ----------
function nhBatDauSua(giu){ if(nhKhoa()) return; var x=nhO(NH.sel.r,NH.sel.c); if(/^D:/.test(x)){ $('nhTT').textContent='Ô ngày không sửa ở đây'; return; } var n=$('nhIn'); NH.sua=true; n.classList.add('nhSua'); if(giu) n.value=x; n.focus(); try{ n.setSelectionRange(n.value.length,n.value.length); }catch(e){} nhGoiY(); }
function nhXong(dr,dc){ var n=$('nhIn'); if(!NH.sua) return; var v=n.value; NH.sua=false; n.classList.remove('nhSua'); $('nhGY').classList.add('hide'); n.value='';
  if(v.replace(/\s+/g,' ').trim()!==String(nhO(NH.sel.r,NH.sel.c))){ nhChup(); nhGhi(NH.sel.r,NH.sel.c,v); nhDoi(); } if(dr||dc) nhDi(dr||0,dc||0); else nhVeChon(); }
function nhHuy(){ var n=$('nhIn'); NH.sua=false; n.classList.remove('nhSua'); n.value=''; $('nhGY').classList.add('hide'); nhVeChon(); }
// gợi ý tên khi gõ
function nhGoiY(){ var n=$('nhIn'), g=$('nhGY'), t=n.value, m=t.match(/^([^(0-9]*)/), ten=(m?m[1]:'').replace(/(^|\s)(gãy|full|nvm|TC)(\s|$)/gi,' ').trim(), k=nhBoDau(ten);
  if(!NH.sua || !k){ g.classList.add('hide'); NH.gyI=-1; return; }
  var L=NH.nv.filter(function(x){ var a=nhBoDau(x.TenNgan), b=nhBoDau(x.Ten); return a.indexOf(k)===0 || b.indexOf(k)>-1 || x.MaNV===ten; }).slice(0,7);
  if(!L.length || (L.length===1 && nhNorm(L[0].TenNgan)===nhNorm(ten))){ g.classList.add('hide'); NH.gyI=-1; return; }
  NH.gyL=L; NH.gyI=-1; g.innerHTML=L.map(function(x,i){ return '<div data-i="'+i+'"><b>'+esc(x.TenNgan)+'</b> <span>'+esc(x.MaNV)+' · '+esc(x.ViTri)+' · '+esc(x.CoSoChinh)+'</span></div>'; }).join('');
  g.style.left=n.style.left; g.style.top=(parseFloat(n.style.top)+n.offsetHeight)+'px'; g.classList.remove('hide');
  g.querySelectorAll('div').forEach(function(d){ d.onmousedown=function(e){ e.preventDefault(); nhChonGY(+d.dataset.i); }; }); }
function nhChonGY(i){ var x=NH.gyL[i], n=$('nhIn'); if(!x) return; var t=n.value, m=t.match(/^([^(0-9]*)(.*)$/), sau=(m?m[2]:'')||'', kw=((m?m[1]:'').match(/(^|\s)(gãy|full|nvm|TC)(?=\s|$)/gi)||[]).join(' ');
  n.value=(x.TenNgan+(sau?' '+sau.trim():'')+(kw?' '+kw.trim():'')).replace(/\s+/g,' ').trim()+(sau||kw?'':' '); $('nhGY').classList.add('hide'); NH.gyI=-1; n.focus(); }
// ---------- copy / cắt / dán ----------
function nhRgbHex(s){ var m=String(s||'').match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/); if(m) return '#'+[m[1],m[2],m[3]].map(function(x){ return ('0'+(+x).toString(16)).slice(-2); }).join(''); s=String(s||'').trim().toLowerCase(); return /^#[0-9a-f]{6}$/.test(s)?s:''; }
function nhCopy(e, cat){ if(NH.sua) return; var s=nhChuanSel(), L=nhL(), txt=[], html='<table>'; for(var r=s.r1;r<=s.r2;r++){ var row=[]; html+='<tr>'; for(var c=s.c1;c<=s.c2;c++){ var x=nhHien(nhO(r,c)); row.push(x); html+='<td style="background-color:'+((L.bg[r]&&L.bg[r][c])||'#ffffff')+'">'+esc(x)+'</td>'; } txt.push(row.join('\t')); html+='</tr>'; } html+='</table>';
  e.clipboardData.setData('text/plain', txt.join('\n')); e.clipboardData.setData('text/html', '<meta charset="utf-8">'+html); e.preventDefault();
  NH.clipNoiBo={s:JSON.stringify({v:txt}), html:html}; if(cat){ if(nhKhoa()) return; nhChup(); for(r=s.r1;r<=s.r2;r++) for(c=s.c1;c<=s.c2;c++) if(!/^D:/.test(nhO(r,c))) nhGhi(r,c,''); nhDoi(); } }
function nhDan(e){ if(NH.sua) return; e.preventDefault(); if(nhKhoa()) return; var cd=e.clipboardData, html=cd.getData('text/html'), txt=cd.getData('text/plain'), O=[], B=null, chiChu=!!NH.shiftDan; NH.shiftDan=false;
  if(html && /<table/i.test(html)){ try{ var doc=new DOMParser().parseFromString(html,'text/html'); B=[]; doc.querySelectorAll('tr').forEach(function(tr){ var row=[], rb=[]; tr.querySelectorAll('td,th').forEach(function(td){ var sp=+(td.getAttribute('colspan')||1), x=(td.innerText||td.textContent||'').replace(/\s+/g,' ').trim(), bg=nhRgbHex(td.style.backgroundColor||td.getAttribute('bgcolor'))||'#ffffff'; for(var i=0;i<sp;i++){ row.push(i?'':x); rb.push(bg); } }); O.push(row); B.push(rb); }); }catch(err){ O=[]; B=null; } }
  if(!O.length){ B=null; O=String(txt||'').replace(/\r/g,'').replace(/\n$/,'').split('\n').map(function(l){ return l.split('\t'); }); }
  if(!O.length) return; nhChup(); var r0=NH.sel.r, c0=NH.sel.c, L=nhL(), w=NH_RONG[NH.k], s=nhChuanSel();
  // dán 1 ô vào cả vùng đang chọn (như Sheet)
  if(O.length===1 && O[0].length===1 && (s.r2>s.r1||s.c2>s.c1)){ for(var r=s.r1;r<=s.r2;r++) for(var c=s.c1;c<=s.c2;c++){ nhGhi(r,c,O[0][0]); if(B && !chiChu) L.bg[r][c]=B[0][0]; } }
  else { O.forEach(function(row,i){ row.forEach(function(x,j){ var c=c0+j; if(c>=w) return; nhDamBao(r0+i); nhGhi(r0+i,c,/^\d{1,2}\/\d{1,2}$/.test(x)&&r0+i<3?nhO(r0+i,c):x); if(B && !chiChu && B[i] && B[i][j]) L.bg[r0+i][c]=B[i][j]; }); });
    NH.sel={r:r0,c:c0,r2:Math.min(r0+O.length-1,L.v.length-1),c2:Math.min(c0+Math.max.apply(null,O.map(function(x){ return x.length; }))-1,w-1)}; }
  nhDoi(); }
// ---------- chuột ----------
function nhChuotXuong(e){ var td=e.target.closest('td'); if(!td) return; if(NH.sua) nhXong(); var r=+td.dataset.r, c=+td.dataset.c;
  if(e.shiftKey){ NH.sel.r2=r; NH.sel.c2=c; nhVeChon(); e.preventDefault(); return; }
  var dangChon=(NH.sel.r===r && NH.sel.c===c && NH.sel.r2===r && NH.sel.c2===c); NH.keo={r:r,c:c,chuyen:false, coThe:dangChon && !!nhO(r,c) && !/^D:/.test(nhO(r,c))}; NH.chuot=true;
  NH.sel={r:r,c:c,r2:r,c2:c}; nhVeChon(); e.preventDefault(); }
function nhChuotDi(e){ if(!NH.chuot) return; var td=e.target.closest&&e.target.closest('td'); if(!td) return; var r=+td.dataset.r, c=+td.dataset.c;
  if(NH.keo && NH.keo.coThe && (r!==NH.keo.r||c!==NH.keo.c)){ NH.keo.chuyen=true; $('nhLuoi').classList.add('nhKeo'); $('nhLuoi').querySelectorAll('td.nhDich').forEach(function(t){ t.classList.remove('nhDich'); }); td.classList.add('nhDich'); return; }
  if(!NH.keo || !NH.keo.chuyen){ NH.sel.r2=r; NH.sel.c2=c; nhVeChon(); } }
function nhChuotLen(e){ if(!NH.chuot) return; NH.chuot=false; $('nhLuoi').classList.remove('nhKeo'); var td=e.target.closest&&e.target.closest('td');
  if(NH.keo && NH.keo.chuyen && td){ nhChuyen(NH.keo.r, NH.keo.c, +td.dataset.r, +td.dataset.c); } NH.keo=null; $('nhIn').focus(); }
// ---------- phím ----------
function nhPhim(e){ var n=$('nhIn'), ctrl=e.ctrlKey||e.metaKey, gy=!$('nhGY').classList.contains('hide');
  if(NH.sua){
    if(gy && (e.key==='ArrowDown'||e.key==='ArrowUp')){ e.preventDefault(); var ds=$('nhGY').querySelectorAll('div'); NH.gyI=Math.max(0,Math.min(ds.length-1,NH.gyI+(e.key==='ArrowDown'?1:-1))); ds.forEach(function(d,i){ d.classList.toggle('on',i===NH.gyI); }); return; }
    if(gy && NH.gyI>=0 && (e.key==='Enter'||e.key==='Tab')){ e.preventDefault(); nhChonGY(NH.gyI); return; }
    if(e.key==='Enter'){ e.preventDefault(); nhXong(e.shiftKey?-1:1,0); return; } if(e.key==='Tab'){ e.preventDefault(); nhXong(0,e.shiftKey?-1:1); return; }
    if(e.key==='Escape'){ e.preventDefault(); nhHuy(); return; } return; }
  if(ctrl && (e.key==='z'||e.key==='Z')){ e.preventDefault(); nhHoanTac(e.shiftKey); return; } if(ctrl && (e.key==='y'||e.key==='Y')){ e.preventDefault(); nhHoanTac(true); return; }
  if(ctrl && (e.key==='a'||e.key==='A')){ e.preventDefault(); NH.sel={r:0,c:0,r2:nhL().v.length-1,c2:NH_RONG[NH.k]-1}; nhVeChon(); return; }
  if(ctrl && e.shiftKey && (e.key==='v'||e.key==='V')){ NH.shiftDan=true; return; }
  if(ctrl) return;
  var mv={ArrowUp:[-1,0],ArrowDown:[1,0],ArrowLeft:[0,-1],ArrowRight:[0,1]}[e.key]; if(mv){ e.preventDefault(); nhDi(mv[0],mv[1],e.shiftKey); return; }
  if(e.key==='Enter'||e.key==='F2'){ e.preventDefault(); nhBatDauSua(true); return; } if(e.key==='Tab'){ e.preventDefault(); nhDi(0,e.shiftKey?-1:1); return; }
  if(e.key==='Delete'||e.key==='Backspace'){ e.preventDefault(); nhXoaChon(); return; } }
function nhGo(){ var n=$('nhIn'); if(!NH.sua && n.value){ if(NH.chiXem||/^D:/.test(nhO(NH.sel.r,NH.sel.c))){ n.value=''; nhKhoa(); return; } NH.sua=true; n.classList.add('nhSua'); } if(NH.sua) nhGoiY(); }
// ---------- lưu + khoá ----------
function nhLuu(){ clearTimeout(NH.t); if(!NH.dirty || !NH.luoi) return; if(!NH.ten){ try{ NH.ten=localStorage.getItem('xlTen')||''; }catch(e){} if(!NH.ten){ NH.ten=(prompt('Tên của bạn (để người khác biết ai đang sửa bản nháp):')||(ROLE==='admin'?'Admin':'Quản lý')).trim(); try{ localStorage.setItem('xlTen',NH.ten); }catch(e){} } }
  var gui=JSON.parse(JSON.stringify(NH.luoi)); NH.dirty=false; $('nhTT').textContent='Đang lưu…';
  google.script.run.withSuccessHandler(function(r){ if(!r.ok){ NH.dirty=true; if(r.khoa){ NH.khoa=r.khoa; NH.chiXem=true; nhBaoKhoa(); nhVe(); } $('nhTT').innerHTML='<span class="bad">Chưa lưu: '+esc(r.msg)+'</span>'; return; } NH.giuQuyen=false; $('nhTT').textContent='✓ Đã lưu lúc '+r.luc; })
    .withFailureHandler(function(e){ NH.dirty=true; $('nhTT').innerHTML='<span class="bad">Chưa lưu được (mạng) – app tự thử lại</span>'; NH.t=setTimeout(nhLuu, 8000); })
    .luuNhapLuoi({pin:PIN, tuan:NH.tuan, token:NH.token, ten:NH.ten, luoi:gui, giuQuyen:NH.giuQuyen}); }
setInterval(function(){ if(NH.luoi && !NH.chiXem && NH.dangMo && !NH.dirty) google.script.run.withSuccessHandler(function(r){ if(r && !r.ok && r.khoa){ NH.khoa=r.khoa; NH.chiXem=true; nhBaoKhoa(); nhVe(); } }).giuKhoaNhap({pin:PIN, tuan:NH.tuan, token:NH.token, ten:NH.ten||(ROLE==='admin'?'Admin':'Quản lý')}); }, 60000);
window.addEventListener('beforeunload', function(){ if(NH.dirty) nhLuu(); try{ google.script.run.nhaKhoaNhap({pin:PIN, tuan:NH.tuan, token:NH.token}); }catch(e){} });
// ---------- kiểm tra ngay trên trình duyệt (cùng bộ đọc với file quán) ----------
function nhTimNV(ten, cs){ var k=nhNorm(ten), L=NH.nv, c;
  c=L.filter(function(n){ return nhNorm(n.TenNgan)===k || n.MaNV===k; }); var m=k.match(/^(.*)\s(\d{3})$/); if(m){ var x=L.filter(function(n){ return n.MaNV===m[2]; }); if(x.length) return x[0]; }
  if(c.length===1) return c[0];
  if(!c.length) c=L.filter(function(n){ var t=String(n.Ten), sh=nhNorm(t.split(' (')[0]), inner=(t.match(/\(([^)]*)\)/)||[])[1]; return sh===k || nhNorm(t)===k || (inner && nhNorm(inner)===k); });
  if(!c.length){ var kk=k.replace(/\s/g,''); c=L.filter(function(n){ return nhNorm(n.TenNgan).replace(/\s/g,'')===kk; }); }
  if(!c.length) return null; var h=c.filter(function(n){ return n.CoSoChinh===cs; }); return h[0]||c[0]; }
function nhBietPC(n){ return !!n && (n.ViTri==='Pha chế' || n.ViTri==='Quản lý' || n.ChucVu==='Quản lý' || n.ChucVu==='Trưởng ca' || /pha chế/i.test(n.ViTriKiem||'')); }
function nhKiemTra(){ if(!NH.luoi) return; var monday=NH.tuan, loi={CFMH:{},LDD:{}}, ds=[], la={}, can=[], o=[], off=[];
  ['CFMH','LDD'].forEach(function(k){ var L=NH.luoi[k]; if(!L.v.length) return; var w=lichDocTab_(L.v, L.bg, k, monday).tuan[monday]; if(!w){ can.push({lo:'Bản nháp '+(k==='LDD'?'LĐD':'CFMH')+': chưa thấy dòng ngày của tuần'}); return; }
    w.o.forEach(function(e){ e.k=k; o.push(e); }); off=off.concat(w.off); });
  o.forEach(function(e){ var cell=e.k+'|'+(e.hang-1)+'|'+(e.cot-1);
    if(e.lo){ loi[e.k][(e.hang-1)+'|'+(e.cot-1)]=e.lo; can.push({ngay:e.ngay, o:e.raw, lo:e.lo, cell:cell}); if(!e.ten||e.bd==null) return; }
    var n=nhTimNV(e.ten, e.cs); if(!n){ loi[e.k][(e.hang-1)+'|'+(e.cot-1)]='Chưa có "'+e.ten+'" trong danh sách nhân viên'; la[e.ten]=la[e.ten]||{ten:e.ten, so:0, cell:cell}; la[e.ten].so++; return; }
    e.ma=n.MaNV; e.n=n; ds.push(e); });
  var g=lichGopNguoi_(ds); g.lo.forEach(function(x){ var e=ds.filter(function(y){ return y.ten===x.ten && y.ngay===x.ngay; })[0]; if(e) loi[e.k][(e.hang-1)+'|'+(e.cot-1)]=x.lo; can.push({ngay:x.ngay, o:x.ten, lo:x.lo, cell:e?e.k+'|'+(e.hang-1)+'|'+(e.cot-1):''}); });
  var byMa={}; NH.nv.forEach(function(n){ byMa[n.MaNV]=n; });
  var KH={'Sáng':[390,720],'Trưa':[720,1020],'Tối':[1020,1350]}, dem={}, nguoi={}; g.ca.forEach(function(c){ nguoi[c.ma]=1; Object.keys(KH).forEach(function(k){ var a=KH[k][0], b=KH[k][1]; if(Math.min(c.kt,b)-Math.max(c.bd,a)>=60){ var key=c.cs+'|'+c.ngay+'|'+k, x=dem[key]=dem[key]||{tong:{},pc:{}}; x.tong[c.ma]=1; if(c.ben==='PC'||nhBietPC(byMa[c.ma])) x.pc[c.ma]=1; } }); });
  var days=[], d0=new Date(monday+'T12:00:00'); for(var i=0;i<7;i++){ var d=new Date(d0.getTime()+i*864e5); days.push(d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2)); }
  var thieuPC=[], thieu=[]; ['TP','DD','TD','TNV','LDD'].forEach(function(cs){ days.forEach(function(d){ var loai=([0,6].indexOf(new Date(d+'T12:00:00').getDay())>-1)?'CT':'NT'; Object.keys(KH).forEach(function(k){ var dm=NH.dm[cs+'|'+k+'|'+loai]; if(!dm) return; var x=dem[cs+'|'+d+'|'+k]||{tong:{},pc:{}}, t=Object.keys(x.tong).length, p=Object.keys(x.pc).length;
    if(p<1) thieuPC.push({cs:cs,ngay:d,khoi:k}); else if(p<dm.pc[0]) thieu.push({cs:cs,ngay:d,khoi:k,loai:'pha chế',co:p,can:dm.pc[0]}); if(t<dm.tong[0]) thieu.push({cs:cs,ngay:d,khoi:k,loai:'người',co:t,can:dm.tong[0]}); }); }); });
  NH.loi=loi; NH.kq={soCa:g.ca.length, soNguoi:Object.keys(nguoi).length, thieuPC:thieuPC, thieu:thieu, tenLa:Object.keys(la).map(function(x){ return la[x]; }), can:can}; nhVeKQ(); nhVe(); }
function nhDd(d){ return d?d.slice(8)+'/'+d.slice(5,7):''; }
function nhVeKQ(){ var r=NH.kq, TEN={TP:'Trần Phú',DD:'Đống Đa',TD:'Tản Đà',TNV:'TNV',LDD:'LĐD'}, h='<div class="nhSum"><b>'+r.soCa+' ca · '+r.soNguoi+' người</b></div>';
  var den=function(cell,txt){ return cell?'<a href="#" onclick="nhDen(\''+cell+'\');return false">'+txt+'</a>':txt; };
  h+=r.thieuPC.length?'<div class="nhDo"><b>⛔ '+r.thieuPC.length+' buổi không có người biết pha chế</b><br>'+r.thieuPC.map(function(x){ return TEN[x.cs]+' '+nhDd(x.ngay)+' '+x.khoi; }).join(' · ')+'</div>':'<div class="nhXanh">✓ Buổi nào cũng có người biết pha chế</div>';
  if(r.tenLa.length) h+='<div class="nhVang"><b>Tên chưa có mã</b><br>'+r.tenLa.map(function(x){ return den(x.cell,'<b>'+esc(x.ten)+'</b>')+' ×'+x.so; }).join(' · ')+'</div>';
  if(r.can.length) h+='<details open class="nhCan"><summary><b>'+r.can.length+' chỗ cần xem</b></summary>'+r.can.map(function(x){ return '<div>'+nhDd(x.ngay)+' '+den(x.cell,'<b>'+esc(x.o||'')+'</b>')+': '+esc(x.lo)+'</div>'; }).join('')+'</details>';
  if(r.thieu.length) h+='<details class="nhCan"><summary><b>'+r.thieu.length+' buổi dưới mức thường xếp</b></summary>'+r.thieu.map(function(x){ return '<div>'+TEN[x.cs]+' '+nhDd(x.ngay)+' '+x.khoi+': '+x.co+'/'+x.can+' '+x.loai+'</div>'; }).join('')+'</details>';
  h+='<p class="sub" style="margin-top:6px">Bảo vệ, rửa ly, cô / chú làm cố định không ghi trong lịch: app tự thêm ca quen khi Áp dụng.</p>'; $('nhKT').innerHTML=h; }
function nhDen(cell){ var p=cell.split('|'); NH.k=p[0]; NH.sel={r:+p[1],c:+p[2],r2:+p[1],c2:+p[2]}; nhVe(); var t=nhTd(+p[1],+p[2]); if(t) t.scrollIntoView({block:'center',inline:'center'}); $('nhIn').focus(); }
// ---------- áp dụng từ bản nháp ----------
function nhApDung(dongY){ if(ROLE!=='admin'){ alert('Chỉ admin (chủ quán) mới áp dụng được.'); return; } if(NH.dirty) nhLuu();
  if(!dongY && !confirm('Áp dụng bản nháp ('+(NH.kq?NH.kq.soCa:'?')+' ca) làm LỊCH CHÍNH THỨC tuần '+NH.tuan+'?\nLịch đang dùng được lưu thành phiên bản, lấy lại được.')) return;
  var b=$('nhAp'); b.disabled=true; b.textContent='Đang áp dụng…';
  setTimeout(function(){ google.script.run.withSuccessHandler(function(r){ b.disabled=false; b.textContent='✓ Áp dụng';
      if(!r.ok && r.canXacNhan){ if(confirm(r.msg+'\n\nVẫn áp dụng?')) nhApDung(true); return; } if(!r.ok){ alert(r.msg); return; }
      $('nhTT').innerHTML='<b style="color:#2E7D5B">✓ Đã áp dụng phiên bản '+r.phienBan+'</b>: '+r.soCa+' ca, '+r.soNguoi+' người'+(r.hoc?' · '+esc(r.hoc):''); })
    .withFailureHandler(function(e){ b.disabled=false; b.textContent='✓ Áp dụng'; alert('Lỗi: '+(e.message||e)); })
    .apDungLichQuan({pin:PIN, tuan:NH.tuan, nguon:'web', dongYThieuPC:!!dongY}); }, NH.dirty?1500:0); }
// ---------- gắn sự kiện ----------
function nhChonTab(k){ if(NH.sua) nhXong(); NH.k=k; NH.sel={r:3,c:1,r2:3,c2:1}; nhVe(); }
function nhGan(){ if(NH.daGan) return; NH.daGan=true; var g=$('nhLuoi'), n=$('nhIn');
  g.addEventListener('mousedown', nhChuotXuong); document.addEventListener('mousemove', nhChuotDi); document.addEventListener('mouseup', nhChuotLen);
  g.addEventListener('dblclick', function(e){ if(e.target.closest('td')) nhBatDauSua(true); });
  n.addEventListener('keydown', nhPhim); n.addEventListener('input', nhGo); n.addEventListener('blur', function(){ setTimeout(function(){ if(NH.sua && document.activeElement!==n) nhXong(); }, 150); });
  n.addEventListener('copy', function(e){ nhCopy(e,false); }); n.addEventListener('cut', function(e){ nhCopy(e,true); }); n.addEventListener('paste', nhDan);
  g.addEventListener('scroll', function(){ var a=nhTd(NH.sel.r,NH.sel.c); if(a) nhDatO(a); }); }
