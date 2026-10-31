// ===================== GIAO DIỆN =====================
const HEAD = String.raw`<!doctype html><html lang="vi"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
:root{--m:#7A1F2B;--onm:#FFFFFF;--g:#C9A227;--gbg:#FFF3CF;--gfill:#F7E3A6;--ink:#2B1B16;--mut:#7A675C;--line:#EBDDC2;--bg:#FFFFFF;--card:#FFFFFF;--soft:#FBF6EC;--err:#B3261E;color-scheme:light}
@media (prefers-color-scheme:dark){:root{--m:#E9A3AC;--onm:#2B1B16;--g:#E3BD52;--gbg:#33280F;--gfill:#5A4716;--ink:#F3E9DC;--mut:#B9A797;--line:#463826;--bg:#17110D;--card:#211913;--soft:#2A2018;--err:#F2948C;color-scheme:dark}}
*{box-sizing:border-box}
body{margin:0;font-family:'Be Vietnam Pro',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:var(--ink);font-size:15px;line-height:1.55}
button{font:inherit;color:inherit;cursor:pointer;border:1px solid var(--line);background:var(--card);border-radius:10px;padding:6px 12px;min-height:36px}
button:disabled{opacity:.55;cursor:default}
.pri{background:var(--m);color:var(--onm);border-color:var(--m);font-weight:600}
.ghost{background:transparent;border-color:transparent;color:var(--mut)}
input,textarea{font:inherit;color:inherit;background:var(--card);border:1px solid var(--line);border-radius:10px;padding:8px 10px;width:100%}
textarea{resize:vertical}
:focus-visible{outline:2px solid var(--g);outline-offset:2px}
.nm{font-weight:600;color:var(--m);text-decoration:underline dotted;text-underline-offset:3px;cursor:pointer}
.muted{color:var(--mut)}.sm{font-size:13px}.err{color:var(--err);font-size:13px}
.chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}
.pp{font-size:13px;padding:2px 9px;border-radius:999px;background:var(--card);border:1px solid var(--line)}
.wig{animation:wig .6s ease-in-out}
@keyframes wig{0%,100%{transform:rotate(0)}25%{transform:rotate(-12deg)}75%{transform:rotate(10deg)}}
.fade{animation:fade .35s ease-out}@keyframes fade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.wig,.fade{animation:none}}
.note{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:12px;margin-top:8px}
.note .nh,.note .nf{display:flex;align-items:center;gap:8px}.note .nh span,.note .nf span{flex:1}
.note textarea{margin:8px 0 6px}
#toast{position:fixed;left:50%;bottom:calc(20px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);background:var(--ink);color:var(--bg);padding:8px 16px;border-radius:999px;font-size:14px;opacity:0;transition:opacity .2s;pointer-events:none;max-width:90vw;text-align:center;z-index:30}
#toast.on{opacity:1}
`;

const MASCOT = String.raw`<svg viewBox="0 0 48 48" width="100%" height="100%" aria-hidden="true"><path d="M10 22h28l-3 18a4 4 0 0 1-4 3H17a4 4 0 0 1-4-3z" fill="#F5DDB0" stroke="#7A1F2B" stroke-width="2" stroke-linejoin="round"/><path d="M38 26c5 0 5 8 0 8" fill="none" stroke="#7A1F2B" stroke-width="2.4" stroke-linecap="round"/><path d="M8 22c2-6 8-9 16-9s14 3 16 9z" fill="#FFF8EA" stroke="#7A1F2B" stroke-width="2" stroke-linejoin="round"/><circle cx="18" cy="16" r="1.6" fill="#C9A227"/><circle cx="27" cy="14.5" r="1.2" fill="#C9A227"/><circle cx="18.5" cy="28" r="2.4" fill="#2B1B16"/><circle cx="29" cy="27.5" r="3.8" fill="#fff" stroke="#2B1B16" stroke-width="1.4"/><circle cx="30" cy="28.5" r="1.7" fill="#2B1B16"/><path d="M17 33.5q7 7 14 0z" fill="#7A1F2B"/><path d="M22 36.2q2.5 3 5 0" fill="#E9798A"/></svg>`;

const NOTE_HTML = String.raw`<div id="note" class="note" hidden>
<div class="nh"><span>✉️ Gửi riêng cho <b id="noteTo"></b></span><button id="noteX" class="ghost" aria-label="Đóng">✕</button></div>
<textarea id="noteTxt" rows="3" maxlength="200" placeholder="Chúc bạn ca làm thật vui nha"></textarea>
<div class="nf"><span class="muted sm">Chỉ người nhận đọc được, có kèm tên bạn</span><button id="noteSend" class="pri">Gửi riêng</button></div>
<div id="noteErr" class="err"></div></div><div id="toast" role="status"></div>`;

const COMMON_JS = String.raw`
var T=(function(){var q=new URLSearchParams(location.search).get('t');try{if(q){sessionStorage.setItem('nb_t',q);return q}return sessionStorage.getItem('nb_t')||''}catch(e){return q||''}})();
var API=location.origin+'/bangtin/api/';
var ME_CODE='';
function call(p,b){return fetch(API+p,{method:b?'POST':'GET',headers:{'Authorization':'Bearer '+T,'Content-Type':'application/json'},body:b?JSON.stringify(b):undefined}).then(function(r){return r.json().catch(function(){return {}}).then(function(j){if(!r.ok)throw new Error(j.error||'Không kết nối được, thử lại sau');return j})})}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function pad(n){return (n<10?'0':'')+n}
function vnNow(){var d=new Date(Date.now()+7*3600000);return {min:d.getUTCHours()*60+d.getUTCMinutes()}}
function hm(ts){var d=new Date(ts+7*3600000);return pad(d.getUTCHours())+':'+pad(d.getUTCMinutes())}
function when(ts){var d=new Date(ts+7*3600000),n=new Date(Date.now()+7*3600000);if(d.toISOString().slice(0,10)===n.toISOString().slice(0,10))return hm(ts);return pad(d.getUTCDate())+'/'+pad(d.getUTCMonth()+1)+' '+hm(ts)}
function nameSpan(to,label){if(!to||to===ME_CODE)return '<b>'+esc(label)+'</b>';return '<span class="nm" role="button" tabindex="0" data-to="'+esc(to)+'" data-l="'+esc(label)+'">'+esc(label)+'</span>'}
function richText(text,people){var h=esc(text),used={};(people||[]).forEach(function(p){var e=esc(p.l),i=p.l?h.indexOf(e):-1;if(i>=0&&!used[p.c]){h=h.slice(0,i)+nameSpan(p.c,p.l)+h.slice(i+e.length);used[p.c]=1}});return {html:h,used:used}}
var TT;function toast(m){var t=document.getElementById('toast');t.textContent=m;t.classList.add('on');clearTimeout(TT);TT=setTimeout(function(){t.classList.remove('on')},2600)}
function openNote(to,label){var n=document.getElementById('note');n.dataset.to=to;n.dataset.l=label;document.getElementById('noteTo').textContent=label;document.getElementById('noteErr').textContent='';n.hidden=false;var t=document.getElementById('noteTxt');t.focus();if(window.onNoteOpen)onNoteOpen();if(window.sendH)sendH()}
function closeNote(){document.getElementById('note').hidden=true;if(window.onNoteClose)onNoteClose();if(window.sendH)sendH()}
document.addEventListener('click',function(e){var n=e.target.closest('.nm');if(n)openNote(n.dataset.to,n.dataset.l)});
document.addEventListener('keydown',function(e){if((e.key==='Enter'||e.key===' ')&&e.target.classList&&e.target.classList.contains('nm')){e.preventDefault();openNote(e.target.dataset.to,e.target.dataset.l)}});
document.getElementById('noteX').onclick=closeNote;
document.getElementById('noteTxt').oninput=function(){document.getElementById('noteErr').textContent=''};
document.getElementById('noteSend').onclick=function(){var n=document.getElementById('note'),t=document.getElementById('noteTxt'),v=t.value.trim(),b=this;if(!v){document.getElementById('noteErr').textContent='Viết lời nhắn trước nha';return}
b.disabled=true;call('message',{to:n.dataset.to,text:v}).then(function(){t.value='';closeNote();toast('Đã gửi riêng cho '+n.dataset.l+' ✓')}).catch(function(e){document.getElementById('noteErr').textContent=e.message}).then(function(){b.disabled=false})};
`;

// ---------- GÓC TRÒ CHUYỆN (dùng chung cho thanh tin và trang bảng tin) ----------
// 4 nhân vật (Bé Muối, Phin, Chị Kem, Anh Đá) trò chuyện 4–5 câu, câu hiện dần có "đang gõ…".
// Cứ 5–10 phút (Cài đặt → chat_phut) đổi chủ đề; mọi người thấy cùng một chủ đề cùng lúc; trong ngày không lặp; đang giao ca thì giữ nguyên.
// {ten} = tên người đang xem (viết hoa chữ đầu), {buoi} = sáng/trưa/chiều/tối, {quan} = quán, {thu} = thứ. Emoji chọn loại máy cũ cũng hiện được.
const CHAT_CSS = String.raw`
.cb-chat{display:flex;flex-direction:column;gap:5px;max-height:320px;overflow-y:auto;overscroll-behavior:contain}
.cb-chat:empty{display:none}
.cb-msg{display:flex;gap:6px;align-items:flex-end}
.cb-msg.me{flex-direction:row-reverse}
.cb-av{width:26px;height:26px;border-radius:50%;flex:none;display:flex;align-items:center;justify-content:center;font-size:15px;border:1px solid var(--line);background:var(--card);overflow:hidden}
.cb-bub{max-width:84%;background:var(--card);border:1px solid var(--line);border-radius:14px 14px 14px 4px;padding:4px 10px 5px;font-size:14px;line-height:1.45}
.cb-msg.me .cb-bub{background:var(--m);color:var(--onm);border-color:var(--m);border-radius:14px 14px 4px 14px}
.cb-who{font-size:11.5px;color:var(--mut);font-weight:600;margin-bottom:1px}
.cb-typing .cb-bub{padding:7px 12px}
.cb-dots span{display:inline-block;width:6px;height:6px;margin:0 1.5px;border-radius:50%;background:var(--mut);animation:cbblink 1.2s infinite}
.cb-dots span:nth-child(2){animation-delay:.2s}.cb-dots span:nth-child(3){animation-delay:.4s}
@keyframes cbblink{0%,80%,100%{opacity:.25}40%{opacity:1}}
@media (prefers-reduced-motion:reduce){.cb-dots span{animation:none;opacity:.6}}
.cb-row{display:flex;gap:6px;margin-top:7px}
.cb-row input{padding:6px 10px;font-size:14px}
.cb-row button{min-height:32px;padding:2px 12px;font-size:13px}
.cb-live{width:8px;height:8px;border-radius:50%;background:#2E9E62;flex:none;box-shadow:0 0 0 3px rgba(46,158,98,.18)}
`;
const CHAT_BOX = String.raw`<div class="cb-chat" id="cbChat" aria-live="polite"></div>`;
const CHAT_INPUT = String.raw`<div class="cb-row"><input id="cbIn" maxlength="120" placeholder="Nhắn với Bé Muối…" aria-label="Nhắn với Bé Muối"><button data-cb="send">Gửi</button></div>`;
const CHAT_JS = String.raw`
var CB={ch:null,slot:'',play:null,stop:0,el:document.getElementById('cbChat')};
var CB_AV={'Bé Muối':'masc','Phin':'☕','Chị Kem':'🍨','Anh Đá':'❄️'};
var CB_REP=['Cảm ơn {ten} đã chia sẻ nha 💛','Nghe vui ghê á! Kể thêm cho mình nghe với 😆','Mình hiểu mà, cố lên nha, có cả nhà ở đây 🤗','Ghi nhận nha! Nhớ uống nước và nghỉ tay chút 💧','Hay quá! {ten} đăng lên bảng tin cho cả nhà cùng đọc đi 📢','Thương {ten} ghê, ca này mình cùng cố gắng nha 💪','Ừa, mình nghe nè. Có gì cần thì nhắn quản lý hoặc bạn thân trong quán nha 💌'];
function cbH(){if(window.sendH)sendH()}
function cbAv(w){var a=CB_AV[w],m=document.getElementById('masc');if(a==='masc')return '<div class="cb-av">'+(m?m.innerHTML:'🙂')+'</div>';return '<div class="cb-av">'+(a?a:esc(String(w||'?').trim().charAt(0)||'?'))+'</div>'}
function cbTen(){var n=CB.ch&&CB.ch.me?String(CB.ch.me.name||'').trim().split(/\s+/).pop():'';return n?n.charAt(0).toUpperCase()+n.slice(1):'bạn'}
function cbFill(t){var m=vnNow().min,buoi=m<660?'sáng':m<780?'trưa':m<1080?'chiều':'tối',thu=['Chủ nhật','Thứ hai','Thứ ba','Thứ tư','Thứ năm','Thứ sáu','Thứ bảy'][new Date(Date.now()+7*3600000).getUTCDay()];
return String(t||'').replace(/\{ten\}/g,cbTen()).replace(/\{buoi\}/g,buoi).replace(/\{quan\}/g,CB.ch&&CB.ch.me&&CB.ch.me.storeName?CB.ch.me.storeName:'quán mình').replace(/\{thu\}/g,thu)}
function cbSeed(s){var h=2166136261;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return function(){h=Math.imul(h^(h>>>15),2246822507);h=Math.imul(h^(h>>>13),3266489909);h^=h>>>16;return (h>>>0)/4294967296}}
function cbLich(){var d=new Date(Date.now()+7*3600000),ymd=d.toISOString().slice(0,10),r=cbSeed('ncafe'+ymd),a=CB.ch.phut[0],b=CB.ch.phut[1],t=0,k=0,now=d.getUTCHours()*3600+d.getUTCMinutes()*60+d.getUTCSeconds(),N=CB.ch.scripts.length,o=[],i,j;
for(i=0;i<N;i++)o.push(i);for(j=N-1;j>0;j--){var x=Math.floor(r()*(j+1)),tmp=o[j];o[j]=o[x];o[x]=tmp}
while(k<1000){var len=(a+Math.floor(r()*(b-a+1)))*60;if(t+len>now)break;t+=len;k++}
return {slot:ymd+':'+k,idx:o[k%N]}}
function cbGiaoCa(){var m=vnNow().min;return [390,720,870,1020,1350].some(function(h){return Math.abs(m-h)<=15})}
function cbMsg(w,t,typing){var me=w==='__me';return '<div class="cb-msg fade'+(me?' me':'')+(typing?' cb-typing':'')+'">'+(me?'':cbAv(w))+'<div class="cb-bub">'+(me||typing?'':'<div class="cb-who">'+esc(w)+'</div>')+(typing?'<span class="cb-dots"><span></span><span></span><span></span></span>':esc(me?t:cbFill(t)))+'</div></div>'}
function cbCuon(){CB.el.scrollTop=CB.el.scrollHeight;cbH()}
function cbNoi(w,t,cb){CB.el.insertAdjacentHTML('beforeend',cbMsg(w,'',true));cbCuon();CB.play=setTimeout(function(){var tg=CB.el.querySelector('.cb-typing');if(tg)tg.remove();CB.el.insertAdjacentHTML('beforeend',cbMsg(w,t));if(w==='Bé Muối'&&window.wig)wig();cbCuon();if(cb)cb()},1200+Math.random()*700)}
function cbPhat(){if(!CB.ch||!CB.ch.scripts.length)return;var L=cbLich();if(L.slot===CB.slot)return;
if(cbGiaoCa()&&CB.slot)return;
CB.slot=L.slot;var sc=CB.ch.scripts[L.idx]||[],daXem=false;try{daXem=sessionStorage.getItem('nb_chat')===L.slot}catch(e){}
clearTimeout(CB.play);CB.stop++;var my=CB.stop;
if(daXem||(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)){CB.el.innerHTML=sc.map(function(m){return cbMsg(m.w,m.t)}).join('');cbCuon();return}
CB.el.innerHTML='';var i=0;
(function tiep(){if(my!==CB.stop)return;if(i>=sc.length){try{sessionStorage.setItem('nb_chat',L.slot)}catch(e){}return}
var m=sc[i++];cbNoi(m.w,m.t,function(){if(my!==CB.stop)return;CB.play=setTimeout(tiep,900+Math.min(2600,cbFill(m.t).length*28))})})()}
function cbTai(){return call('chat').then(function(d){CB.ch=d;var w=document.getElementById('cbWrap');if(w)w.hidden=!(d.scripts&&d.scripts.length);cbPhat()}).catch(function(){})}
document.addEventListener('click',function(e){var a=e.target.closest('[data-cb=send]');if(!a)return;var inp=document.getElementById('cbIn'),v=inp.value.trim();if(!v){inp.placeholder='Gõ gì đó nha, Bé Muối đang nghe 👂';inp.focus();return}
inp.value='';CB.el.insertAdjacentHTML('beforeend',cbMsg('__me',v));cbCuon();cbNoi('Bé Muối',CB_REP[Math.floor(Math.random()*CB_REP.length)])});
document.getElementById('cbIn').addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();var b=document.querySelector('[data-cb=send]');if(b)b.click()}});
setInterval(function(){if(!document.hidden)cbPhat()},20000);
setInterval(function(){if(!document.hidden)cbTai()},3600000);
document.addEventListener('visibilitychange',function(){if(!document.hidden)cbPhat()});
if(T)cbTai();
`;

// ---------- THANH THÔNG BÁO (nhúng iframe – trang quét mã sau khi chấm công) ----------
const BAR = HEAD + CHAT_CSS + String.raw`
html,body{background:transparent}
body{padding:2px}
.bar{background:var(--gbg);border:1px solid var(--line);border-radius:16px;padding:8px 10px}
.top{display:flex;gap:8px;align-items:center;flex-wrap:nowrap;min-width:0}
.top .masc{width:30px;height:30px;flex:none}
.top b{font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.top .sp{flex:1}
.top a{color:var(--m);font-weight:600;text-decoration:none;font-size:13px;cursor:pointer;white-space:nowrap}
#cbChat{margin-top:6px}
.news{margin-top:8px;border-top:1px dashed var(--line);padding-top:6px;font-size:13.5px;min-height:22px}
.qbtn{min-height:30px;padding:2px 10px;font-size:13px}
.qbtn.sel{background:var(--m);color:var(--onm);border-color:var(--m)}
</style><title>Góc trò chuyện Ncafe</title></head><body>
<div class="bar">
<div class="top"><div class="masc" id="masc">` + MASCOT + String.raw`</div><b>Góc trò chuyện Ncafe</b><span class="cb-live" title="Đang trò chuyện"></span><span class="sp"></span><a id="mail" hidden>✉️ <span id="unread"></span></a><a id="more">Xem tất cả</a></div>
` + CHAT_BOX + String.raw`
<div class="news" id="slot">Đang tải…</div>
` + CHAT_INPUT + String.raw`
</div>
` + NOTE_HTML + String.raw`
<script>` + COMMON_JS + String.raw`
var D=null,Q=[],QI=0,TM=null,PAUSE=false,LAST=0,CUR=null;
var slot=document.getElementById('slot');
function onNoteOpen(){PAUSE=true}
function onNoteClose(){PAUSE=false}
function sendH(){try{parent.postMessage({type:'ncafe-bangtin-height',h:document.documentElement.scrollHeight},'*')}catch(e){}}
if(window.ResizeObserver)new ResizeObserver(sendH).observe(document.body);
function wig(){var m=document.getElementById('masc');m.classList.remove('wig');void m.offsetWidth;m.classList.add('wig')}
function load(){LAST=Date.now();return call('bar').then(function(d){var first=!D;D=d;ME_CODE=d.me.code;build();foot();if(first)next()}).catch(function(e){slot.innerHTML='<div class="fade muted">'+esc(e.message)+'</div>';sendH()})}
function build(){var it=D.items.slice(),q=it.length?it:[{quiet:D.mode}];Q=q;if(QI>=Q.length)QI=0}
function foot(){var u=encodeURIComponent(T);document.getElementById('more').href='/bangtin?embed=1&t='+u;var m=document.getElementById('mail');m.href='/bangtin?embed=1&t='+u+'#hopthu';m.hidden=!D.unread;document.getElementById('unread').textContent=D.unread+' lời nhắn'}
function next(){clearTimeout(TM);if(!PAUSE&&Q.length){show(Q[QI]);QI=(QI+1)%Q.length}TM=setTimeout(next,Q.length>1?9000:30000)}
function itemHtml(x){var ic={question:'🙋 ',special:'🎉 ',post:'💬 '}[x.kind]||'';var by='';
if(x.kind==='question'||x.kind==='post')by=nameSpan(x.author.c,x.author.name)+(x.kind==='question'?' hỏi: ':': ');
var rt=richText(x.text,x.people),h=(x.pinned?'📌 ':'')+ic+by+rt.html;
var rest=(x.people||[]).filter(function(p){return !rt.used[p.c]});
if(rest.length)h+='<div class="chips">'+rest.slice(0,6).map(function(p){return '<span class="pp">'+nameSpan(p.c,p.l)+'</span>'}).join('')+(rest.length>6?'<span class="pp muted">+'+(rest.length-6)+'</span>':'')+'</div>';
if(x.kind==='question')h+='<div class="chips">'+x.options.map(function(o){return '<button class="qbtn'+(x.myAnswer===o?' sel':'')+'" data-act="ans" data-o="'+esc(o)+'">'+esc(o)+'</button>'}).join('')+'</div><div class="muted sm">'+x.nanswers+' người đã trả lời, đổi ý được đến '+hm(x.expires)+'</div>';
else{var r=0;for(var k in x.reactions)r+=x.reactions[k];if(r||x.ncomments)h+='<div class="muted sm">'+(r?r+' cảm xúc':'')+(r&&x.ncomments?', ':'')+(x.ncomments?x.ncomments+' bình luận':'')+'</div>'}
return h}
function show(x){CUR=x;var h;
if(x.quiet)h=x.quiet==='handover'?'📢 Đang giao ca, tập trung nha 💪':x.quiet==='peak'?'📢 Giờ cao điểm rồi, cố lên cả nhà ☕':'📢 Chưa có tin mới. Chúc cả nhà một ca thật vui!';
else h=itemHtml(x);
slot.innerHTML='<div class="fade">'+h+'</div>';sendH()}
document.addEventListener('click',function(e){var a=e.target.closest('[data-act]');if(!a)return;
if(a.dataset.act==='ans'&&CUR&&CUR.id){var o=a.dataset.o;call('answer',{post_id:CUR.id,choice:o}).then(function(){if(!CUR.myAnswer)CUR.nanswers++;CUR.myAnswer=o;show(CUR);toast('Đã trả lời: '+o)}).catch(function(er){toast(er.message)})}});
setInterval(function(){if(document.hidden)return;var m=vnNow().min,hand=[390,720,870,1020,1350].some(function(h){return Math.abs(m-h)<=15});if(hand&&Date.now()-LAST<180000)return;load()},60000);
document.addEventListener('visibilitychange',function(){if(!document.hidden&&Date.now()-LAST>60000)load()});
` + CHAT_JS + String.raw`
if(!T){slot.textContent='Mở thanh thông báo từ app chấm công nha.'}else load();
</script></body></html>`;

// ---------- TRANG BẢNG TIN ----------
const PAGE = HEAD + CHAT_CSS + String.raw`
body{background:var(--soft);padding-bottom:calc(80px + env(safe-area-inset-bottom,0px))}
.wrap{max-width:640px;margin:0 auto;padding:0 14px}
header.top{display:flex;gap:12px;align-items:center;padding:calc(16px + env(safe-area-inset-top,0px)) 0 10px}
header .masc{width:60px;height:60px;flex:none;cursor:pointer}
h1{font-size:22px;line-height:1.2;margin:0;color:var(--m);font-weight:700;letter-spacing:-.01em}
h2{font-size:17px;margin:22px 0 8px;font-weight:600}
#hello{margin:2px 0 0;color:var(--mut);font-size:14px}
nav.tabs{display:flex;gap:4px;border-bottom:1px solid var(--line);margin-bottom:14px;overflow-x:auto}
nav.tabs button{border:0;border-radius:0;background:transparent;padding:10px 12px;color:var(--mut);border-bottom:3px solid transparent;white-space:nowrap}
nav.tabs button.on{color:var(--m);border-bottom-color:var(--m);font-weight:600}
nav.tabs .sp{flex:1}
#ub{background:var(--m);color:var(--onm);border-radius:999px;padding:0 7px;font-size:12px;margin-left:4px}
#ub:empty{display:none}
.card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:12px 14px;margin-bottom:10px}
.card.pin{border:2px solid var(--g)}
.compose textarea{border:0;padding:4px 0;background:transparent;min-height:48px}
.compose .row{display:flex;gap:8px;align-items:center;margin-top:8px;flex-wrap:wrap}
.compose .row .sp{flex:1;font-size:13px;color:var(--mut)}
.compose label{display:inline-flex;gap:6px;align-items:center;font-size:14px;margin:8px 14px 0 0}
.compose label input[type=checkbox]{width:auto}
.compose label input[type=time]{width:auto;padding:4px 8px}
.chip{border-radius:999px;padding:3px 12px;min-height:32px;font-size:13px}
.chip.on{background:var(--m);color:var(--onm);border-color:var(--m)}
.filter{margin:4px 0 12px}
.ch{display:flex;gap:10px;align-items:flex-start}
.av{width:36px;height:36px;border-radius:50%;background:var(--m);color:var(--onm);display:flex;align-items:center;justify-content:center;font-weight:700;flex:none}
.av.sys{background:var(--gbg);color:var(--ink);font-size:18px}
.cm{flex:1;min-width:0}
.st{font-size:12px;color:var(--mut);border:1px solid var(--line);border-radius:6px;padding:0 6px;margin-left:4px;white-space:nowrap}
.tx{margin:8px 0 0;white-space:pre-wrap;word-wrap:break-word}
.opts{display:grid;gap:6px;margin-top:10px}
.opt{position:relative;display:flex;align-items:center;gap:8px;width:100%;text-align:left;overflow:hidden;padding:8px 12px}
.opt .fill{position:absolute;left:0;top:0;bottom:0;background:var(--gfill);transition:width .3s}
.opt .ol,.opt .on{position:relative}.opt .ol{flex:1}.opt .on{font-weight:600}
.opt.sel{border:2px solid var(--m)}
.who{margin:-2px 0 2px 12px}
.acts{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-top:10px}
.re{border-radius:999px;padding:2px 10px;min-height:32px;font-size:14px}
.re.on{background:var(--gbg);border-color:var(--g)}
.acts .sp{flex:1}
.mini{font-size:13px;min-height:30px;padding:2px 8px}
.coms{margin-top:10px;border-top:1px solid var(--line);padding-top:8px}
.com{font-size:14px;margin:4px 0}
.cin{display:flex;gap:6px;margin-top:6px}
.cin input{padding:6px 10px}
.empty{text-align:center;color:var(--mut);padding:30px 10px}
.wide{width:100%}
.set label{display:block;font-weight:600;margin-top:14px}
.set p{margin:2px 0 6px;font-size:13px;color:var(--mut)}
body .note{position:fixed;left:0;right:0;bottom:0;margin:0;border-radius:18px 18px 0 0;padding:14px 16px calc(14px + env(safe-area-inset-bottom,0px));z-index:20;max-width:640px;margin:0 auto}
#collapse{margin-left:auto}
body.tabmode header.top{display:none}body.tabmode nav.tabs{margin-top:2px}
body.embed{background:transparent}body.embed .wrap{padding:0 4px}body.embed header.top{padding-top:6px}body.embed header .masc{width:40px;height:40px}body.embed h1{font-size:18px}
.cb-card{background:var(--gbg)}.cb-head{display:flex;gap:8px;align-items:center;margin-bottom:6px}.cb-head b{font-size:15px}
.sheet{position:fixed;left:0;right:0;bottom:0;background:var(--card);border-top:1px solid var(--line);border-radius:18px 18px 0 0;padding:16px 16px calc(16px + env(safe-area-inset-bottom,0px));z-index:20;max-width:640px;margin:0 auto}
</style><title>Bảng tin Ncafe</title></head><body>
<div class="wrap">
<header class="top"><div class="masc" id="masc" title="Bé Muối">` + MASCOT + String.raw`</div><div><h1>Bảng tin Ncafe</h1><p id="hello">Đang tải…</p></div><button id="collapse" class="mini" hidden>← Thu gọn</button></header>
<nav class="tabs" role="tablist"><button data-tab="feed" class="on">Bảng tin</button><button data-tab="inbox">Hộp thư<span id="ub"></span></button><button data-tab="set" id="tabSet" hidden>Cài đặt</button><span class="sp"></span><button id="elevBtn" class="ghost">Quyền quản lý</button></nav>
<section id="v-feed">
<div class="card cb-card" id="cbWrap" hidden><div class="cb-head"><b>💬 Góc trò chuyện Ncafe</b><span class="cb-live" title="Đang trò chuyện"></span></div>` + CHAT_BOX + CHAT_INPUT + String.raw`</div>
<div class="card compose">
<textarea id="ct" rows="2" maxlength="1000" placeholder="Hỏi gì đó với cả quán, ví dụ: Trần Phú có ai ăn trưa không?" aria-label="Nội dung bài đăng"></textarea>
<div id="optBox" hidden><input id="co" placeholder="Có, 1 suất; Không ăn" aria-label="Các lựa chọn trả lời"><div class="muted sm">Các lựa chọn cách nhau bằng dấu chấm phẩy ;</div></div>
<div id="mgrBox" hidden><div class="chips" id="cStores"></div><label><input type="checkbox" id="cPin"> Ghim lên đầu</label><label>Hết hạn lúc <input type="time" id="cExp"></label></div>
<div class="row"><button id="addOpt" class="mini">+ Nút trả lời</button><span class="sp" id="cWhere"></span><button id="cSend" class="pri">Đăng</button></div>
<div id="cErr" class="err"></div></div>
<div class="chips filter" id="filter"></div>
<div id="pins"></div><div id="list"></div>
<button id="older" class="wide" hidden>Xem tin cũ hơn</button>
</section>
<section id="v-inbox" hidden><div id="inbox"></div></section>
<section id="v-set" class="set" hidden><div id="setForm"></div><div class="acts"><span class="sp"></span><button id="saveSet" class="pri">Lưu cài đặt</button></div><h2>Tin bị báo cáo hoặc đã ẩn</h2><div id="mod"></div></section>
</div>
<div id="elev" class="sheet" hidden><b>Mở quyền quản lý</b><p class="muted sm">Nhập mã PIN quản lý hoặc admin. Quyền mở trong 12 giờ trên máy này.</p><div class="cin"><input id="pin" type="password" inputmode="numeric" placeholder="Mã PIN" aria-label="Mã PIN"><button id="pinGo" class="pri">Mở</button><button id="pinX" class="ghost" aria-label="Đóng">✕</button></div><div id="pinErr" class="err"></div></div>
` + NOTE_HTML + String.raw`
<script>` + COMMON_JS + String.raw`
var EMBED=new URLSearchParams(location.search).get('embed')==='1',TABMODE=new URLSearchParams(location.search).get('tab')==='1';
history.replaceState(null,'',location.pathname+(EMBED?'?embed=1'+(TABMODE?'&tab=1':''):'')+location.hash);
if(TABMODE)document.body.classList.add('tabmode');
if(EMBED){document.body.classList.add('embed');document.getElementById('collapse').hidden=TABMODE;try{parent.postMessage({type:'ncafe-bangtin-height',h:'full'},'*')}catch(e){}}
document.getElementById('collapse').onclick=function(){location.href='/bangtin/bar?t='+encodeURIComponent(T)};
var ME=null,STORES={},STORE='',LASTID=0,LAST=0,ITEMS={},SEL=['ALL'],BUILT=false;
var EMO=['❤️','😂','👏','🔥'];
var $=function(id){return document.getElementById(id)};
function wig(){var m=$('masc');m.classList.remove('wig');void m.offsetWidth;m.classList.add('wig')}
$('masc').onclick=wig;
function given(n){var w=String(n).trim().split(/\s+/);return w[w.length-1]}
function storeTags(st){return st.map(function(s){return '<span class="st">'+esc(s==='ALL'?'Cả 5 quán':(STORES[s]||s))+'</span>'}).join('')}
function card(x){ITEMS[x.id]=x;
var sys=!x.author.c&&!x.mine&&(x.kind==='summary'||x.kind==='birthday'||x.kind==='special'||x.author.name==='Quản lý'||x.author.name==='Ncafe');
var icon={summary:'👋',birthday:'🎂',special:'🎉'}[x.kind]||'📣';
var h='<article class="card'+(x.pinned?' pin':'')+'" id="p'+x.id+'"><div class="ch"><div class="av'+(sys?' sys':'')+'">'+(sys?icon:esc(String(x.author.name||'?').trim()[0]||'?'))+'</div><div class="cm"><div>'+nameSpan(x.author.c,x.author.name)+(x.mine?' <span class="muted sm">(bạn)</span>':'')+storeTags(x.stores)+'</div><div class="muted sm">'+when(x.created)+(x.pinned?', 📌 đã ghim':'')+'</div></div></div>';
var rt=richText(x.text,x.people);h+='<p class="tx">'+(x.kind==='question'?'🙋 ':'')+rt.html+'</p>';
var rest=(x.people||[]).filter(function(p){return !rt.used[p.c]});
if(rest.length)h+='<div class="chips">'+rest.map(function(p){return '<span class="pp">'+nameSpan(p.c,p.l)+'</span>'}).join('')+'</div>';
if(x.kind==='question')h+=qblock(x);
h+='<div class="acts">'+EMO.map(function(e){var n=x.reactions[e]||0;return '<button class="re'+(x.myReacts.indexOf(e)>=0?' on':'')+'" data-act="react" data-id="'+x.id+'" data-e="'+e+'" aria-label="Thả '+e+'">'+e+(n?' '+n:'')+'</button>'}).join('')+'<span class="sp"></span>';
if(ME&&ME.mgr&&x.kind==='question')h+='<button class="mini ghost" data-act="tg" data-id="'+x.id+'">Gửi Telegram</button>';
if(x.canDelete)h+='<button class="mini ghost" data-act="del" data-id="'+x.id+'">Xoá</button>';
else h+='<button class="mini ghost" data-act="rep" data-kind="post" data-id="'+x.id+'">Báo cáo</button>';
h+='</div><div class="coms">'+(x.comments||[]).map(function(c){return '<div class="com">'+nameSpan(c.c,c.name)+' '+esc(c.text)+' <span class="muted sm">'+when(c.ts)+'</span>'+(c.canDelete&&c.id?' <button class="mini ghost" data-act="cdel" data-id="'+x.id+'" data-cid="'+c.id+'">Xoá</button>':(!c.mine&&c.id?' <button class="mini ghost" data-act="rep" data-kind="comment" data-id="'+c.id+'">Báo cáo</button>':''))+'</div>'}).join('')+
'<div class="cin"><input id="ci'+x.id+'" maxlength="300" placeholder="Bình luận…" aria-label="Bình luận"><button class="mini" data-act="csend" data-id="'+x.id+'">Gửi</button></div></div></article>';
return h}
function qblock(x){var open=x.expires>Date.now(),tot=0;x.options.forEach(function(o){tot+=x.results[o].n});
var h='<div class="opts">';x.options.forEach(function(o){var r=x.results[o],pct=tot?Math.round(r.n*100/tot):0;
h+='<button class="opt'+(x.myAnswer===o?' sel':'')+'" data-act="ans" data-id="'+x.id+'" data-o="'+esc(o)+'"'+(open?'':' disabled')+'><span class="fill" style="width:'+pct+'%"></span><span class="ol">'+esc(o)+'</span><span class="on">'+r.n+'</span></button>'+(r.names.length?'<div class="who muted sm">'+r.names.map(esc).join(', ')+'</div>':'')});
return h+'</div><div class="muted sm" style="margin-top:6px">'+(open?'Đổi ý được đến '+hm(x.expires):'Câu hỏi đã đóng')+(x.pending&&x.pending.length?'. Chưa trả lời: '+x.pending.map(esc).join(', '):'')+'</div>'}
function redraw(id){var el=$('p'+id);if(el&&ITEMS[id])el.outerHTML=card(ITEMS[id])}
function setup(d){ME=d.me;ME_CODE=ME.code;STORES=d.stores;$('hello').textContent='Chào '+given(ME.name)+' 👋'+(ME.role==='admin'?' (admin)':ME.role==='ql'?' (quản lý)':'');
$('ub').textContent=d.unread||'';$('tabSet').hidden=ME.role!=='admin';$('elevBtn').hidden=ME.mgr;$('mgrBox').hidden=!ME.mgr;
$('cWhere').textContent=ME.mgr?'':(ME.todayStores.length?'Đăng cho '+(STORES[ME.todayStores[ME.todayStores.length-1]]||''):'Check in hôm nay để đăng bài');
if(BUILT)return;BUILT=true;
var f='<button class="chip on" data-act="fil" data-s="">Tất cả</button>';for(var k in STORES)f+='<button class="chip" data-act="fil" data-s="'+k+'">'+esc(STORES[k])+'</button>';$('filter').innerHTML=f;
var s='<button class="chip on" data-act="sel" data-s="ALL">Cả 5 quán</button>';for(var k2 in STORES)s+='<button class="chip" data-act="sel" data-s="'+k2+'">'+esc(STORES[k2])+'</button>';$('cStores').innerHTML=s}
function load(more){LAST=Date.now();var q='feed?x=1'+(STORE?'&store='+STORE:'')+(more?'&before='+LASTID:'');
return call(q).then(function(d){setup(d);LASTID=d.last;
if(!more){ITEMS={};$('pins').innerHTML=d.pins.map(card).join('');$('list').innerHTML=(d.items.length||d.pins.length)?d.items.map(card).join(''):'<div class="empty">Chưa có tin nào. Mở đầu bằng một câu chào cả quán đi!</div>'}
else $('list').insertAdjacentHTML('beforeend',d.items.map(card).join(''));
$('older').hidden=!d.more}).catch(function(e){$('hello').textContent=e.message})}
function busy(){var a=document.activeElement;return (a&&(a.tagName==='INPUT'||a.tagName==='TEXTAREA')&&a.value)||!$('note').hidden||!$('elev').hidden||window.scrollY>300}
function tab(t){document.querySelectorAll('nav.tabs [data-tab]').forEach(function(b){b.classList.toggle('on',b.dataset.tab===t)});['feed','inbox','set'].forEach(function(v){$('v-'+v).hidden=v!==t});
if(t==='inbox')loadInbox();if(t==='set')loadSet();history.replaceState(null,'',location.pathname+location.search+(t==='inbox'?'#hopthu':t==='set'?'#caidat':''))}
document.querySelectorAll('nav.tabs [data-tab]').forEach(function(b){b.onclick=function(){tab(b.dataset.tab)}});
function loadInbox(){$('inbox').innerHTML='<div class="empty">Đang tải…</div>';call('inbox').then(function(d){$('ub').textContent='';
$('inbox').innerHTML=d.items.length?d.items.map(function(m){return '<article class="card"><div class="ch"><div class="av">'+esc(String(m.from_name).trim()[0]||'?')+'</div><div class="cm"><b>'+esc(m.from_name)+'</b><div class="muted sm">'+when(m.ts)+(m.read?'':', mới')+'</div></div></div><p class="tx">'+esc(m.text)+'</p><div class="acts"><button class="mini" data-act="reply" data-to="'+esc(m.from_code)+'" data-l="'+esc(m.from_name)+'">Trả lời riêng</button><span class="sp"></span><button class="mini ghost" data-act="rep" data-kind="message" data-id="'+m.id+'">Báo cáo</button></div></article>'}).join(''):'<div class="empty">Chưa có lời nhắn nào. Bấm vào tên ai đó trên bảng tin để gửi lời nhắn riêng.</div>'}).catch(function(e){$('inbox').innerHTML='<div class="empty">'+esc(e.message)+'</div>'})}
var FIELDS=[['special_days','Ngày đặc biệt','Mỗi dòng: ngày/tháng | câu chúc. Tết âm lịch đổi ngày mỗi năm, nhớ sửa lại.'],
['store_bdays','Sinh nhật quán','Mỗi dòng: cơ sở | ngày/tháng | câu chúc (bỏ trống thì dùng câu mặc định). Ví dụ: TNV | 15/03'],
['schedules','Câu hỏi tự đăng hằng ngày','Mỗi dòng: cơ sở | giờ đăng | câu hỏi | lựa chọn 1; lựa chọn 2 | giờ hết hạn. Ví dụ: TP | 09:30 | Trần Phú có ai ăn trưa không? | Có, 1 suất; Không ăn | 10:30'],
['chat','Góc trò chuyện tự động','Mỗi đoạn hội thoại cách nhau bằng một dòng ---. Mỗi dòng: Tên nhân vật | câu nói (nên 4–5 dòng một đoạn). Nhân vật có hình: Bé Muối, Phin, Chị Kem, Anh Đá. Dùng {ten} = tên người đang xem, {buoi} = sáng/trưa/chiều/tối, {quan} = quán, {thu} = thứ.'],
['chat_phut','Đổi chủ đề sau bao nhiêu phút','Ví dụ 5-10: mỗi đoạn hội thoại giữ ngẫu nhiên 5 đến 10 phút rồi sang chủ đề mới (mọi người thấy cùng lúc)'],
['mascot','Bé Muối hỏi và tự trả lời','Mỗi dòng: câu hỏi | câu tự trả lời (bản cũ, không còn dùng trên thanh tin – giữ để tham khảo)'],
['telegram','Nhóm Telegram từng cơ sở','Mỗi dòng: cơ sở | chat id. Ví dụ: TP | -1001234567890'],
['no_bday','Không hiện sinh nhật','Mã nhân viên không muốn công khai sinh nhật, cách nhau bằng dấu phẩy']];
function loadSet(){$('setForm').innerHTML='<p class="muted">Mã cơ sở: TP, DD, TD, TNV, LDD, hoặc ALL cho cả 5 quán.</p>';call('settings').then(function(s){$('setForm').innerHTML+=FIELDS.map(function(f){return '<label for="s_'+f[0]+'">'+f[1]+'</label><p>'+esc(f[2])+'</p><textarea id="s_'+f[0]+'" rows="'+(f[0]==='chat'?14:4)+'">'+esc(s[f[0]]||'')+'</textarea>'}).join('')}).catch(function(e){$('setForm').innerHTML='<p class="err">'+esc(e.message)+'</p>'});loadMod()}
$('saveSet').onclick=function(){var b={};FIELDS.forEach(function(f){var el=$('s_'+f[0]);if(el)b[f[0]]=el.value});call('settings',b).then(function(){toast('Đã lưu cài đặt')}).catch(function(e){toast(e.message)})};
function loadMod(){call('moderate').then(function(d){$('mod').innerHTML=d.items.length?d.items.map(function(m){var k={post:'Bài',comment:'Bình luận',message:'Lời nhắn'}[m.kind];return '<article class="card"><div class="muted sm">'+k+', '+esc(m.who)+', '+when(m.ts)+(m.hidden?', đã ẩn':'')+'</div><p class="tx">'+esc(m.text||'(tin hệ thống)')+'</p><div class="acts">'+(m.hidden?'<button class="mini" data-act="mod" data-a="unhide" data-kind="'+m.kind+'" data-id="'+m.id+'">Hiện lại</button>':'<button class="mini pri" data-act="mod" data-a="hide" data-kind="'+m.kind+'" data-id="'+m.id+'">Ẩn</button><button class="mini" data-act="mod" data-a="keep" data-kind="'+m.kind+'" data-id="'+m.id+'">Giữ lại</button>')+'</div></article>'}).join(''):'<div class="empty">Không có gì cần xử lý.</div>'}).catch(function(e){$('mod').innerHTML='<p class="err">'+esc(e.message)+'</p>'})}
$('addOpt').onclick=function(){var b=$('optBox');b.hidden=!b.hidden;this.textContent=b.hidden?'+ Nút trả lời':'− Bỏ nút trả lời';if(!b.hidden)$('co').focus()};
$('ct').oninput=$('co').oninput=function(){$('cErr').textContent=''};
$('cSend').onclick=function(){var t=$('ct').value.trim(),btn=this;if(!t){$('cErr').textContent='Viết nội dung trước nha';return}
var opts=$('optBox').hidden?[]:$('co').value.split(';').map(function(s){return s.trim()}).filter(Boolean);
if(!$('optBox').hidden&&opts.length<2){$('cErr').textContent='Cần ít nhất 2 lựa chọn, cách nhau bằng dấu ;';return}
var b={text:t,options:opts};if(ME&&ME.mgr){b.stores=SEL;b.pin=$('cPin').checked;b.expires=$('cExp').value}
btn.disabled=true;call('post',b).then(function(){$('ct').value='';$('co').value='';$('cPin').checked=false;$('cExp').value='';toast('Đã đăng');wig();window.scrollTo(0,0);return load()}).catch(function(e){$('cErr').textContent=e.message}).then(function(){btn.disabled=false})};
$('older').onclick=function(){load(true)};
$('elevBtn').onclick=function(){$('elev').hidden=false;$('pin').focus()};
$('pinX').onclick=function(){$('elev').hidden=true};
$('pin').oninput=function(){$('pinErr').textContent=''};
$('pinGo').onclick=function(){var p=$('pin').value.trim();if(!p){$('pinErr').textContent='Nhập mã PIN trước nha';return}
call('elevate',{pin:p}).then(function(d){T=d.token;try{sessionStorage.setItem('nb_t',T)}catch(e){}$('elev').hidden=true;$('pin').value='';BUILT=false;toast(d.role==='admin'?'Đã mở quyền admin':'Đã mở quyền quản lý');load()}).catch(function(e){$('pinErr').textContent=e.message})};
document.addEventListener('click',function(e){var a=e.target.closest('[data-act]');if(!a)return;var act=a.dataset.act,id=Number(a.dataset.id),x=ITEMS[id];
if(act==='fil'){STORE=a.dataset.s;document.querySelectorAll('#filter .chip').forEach(function(c){c.classList.toggle('on',c===a)});load()}
else if(act==='sel'){var s=a.dataset.s;if(s==='ALL')SEL=['ALL'];else{SEL=SEL.filter(function(v){return v!=='ALL'});var i=SEL.indexOf(s);if(i>=0)SEL.splice(i,1);else SEL.push(s);if(!SEL.length)SEL=['ALL']}
document.querySelectorAll('#cStores .chip').forEach(function(c){c.classList.toggle('on',SEL.indexOf(c.dataset.s)>=0)})}
else if(act==='react'&&x){var em=a.dataset.e,k=x.myReacts.indexOf(em);if(k>=0){x.myReacts.splice(k,1);x.reactions[em]--}else{x.myReacts.push(em);x.reactions[em]=(x.reactions[em]||0)+1;wig()}redraw(id);call('react',{post_id:id,emoji:em}).catch(function(er){toast(er.message)})}
else if(act==='ans'&&x){var o=a.dataset.o;call('answer',{post_id:id,choice:o}).then(function(){var me=ME.name;if(x.myAnswer&&x.results[x.myAnswer]){var r=x.results[x.myAnswer];r.n--;var j=r.names.indexOf(me);if(j>=0)r.names.splice(j,1)}else{x.pending=(x.pending||[]).filter(function(n){return n!==me})}
x.myAnswer=o;x.results[o].n++;x.results[o].names.push(me);redraw(id);toast('Đã trả lời: '+o)}).catch(function(er){toast(er.message)})}
else if(act==='csend'&&x){var inp=$('ci'+id),v=inp.value.trim();if(!v){inp.placeholder='Viết bình luận trước nha';inp.focus();return}
call('comment',{post_id:id,text:v}).then(function(){x.comments=x.comments||[];x.comments.push({id:0,c:'',name:ME.name,text:v,ts:Date.now(),mine:true,canDelete:false});redraw(id)}).catch(function(er){toast(er.message)})}
else if(act==='del'){if(!confirm('Xoá tin này?'))return;call('delete',{post_id:id}).then(function(){var el=$('p'+id);if(el)el.remove();toast('Đã xoá')}).catch(function(er){toast(er.message)})}
else if(act==='cdel'&&x){var cid=Number(a.dataset.cid);call('delete',{comment_id:cid}).then(function(){x.comments=x.comments.filter(function(c){return c.id!==cid});redraw(id)}).catch(function(er){toast(er.message)})}
else if(act==='rep'){if(!confirm('Báo cáo nội dung này cho admin?'))return;call('report',{kind:a.dataset.kind,id:id}).then(function(){toast('Đã báo cáo, admin sẽ xem')}).catch(function(er){toast(er.message)})}
else if(act==='tg'){call('telegram',{post_id:id}).then(function(d){toast('Đã gửi vào '+d.sent+' nhóm Telegram')}).catch(function(er){toast(er.message)})}
else if(act==='reply')openNote(a.dataset.to,a.dataset.l);
else if(act==='mod'){call('moderate',{action:a.dataset.a,kind:a.dataset.kind,id:id}).then(function(){toast('Đã cập nhật');loadMod()}).catch(function(er){toast(er.message)})}});
document.addEventListener('keydown',function(e){if(e.key==='Enter'&&e.target.id&&e.target.id.indexOf('ci')===0){var b=e.target.parentNode.querySelector('[data-act=csend]');if(b)b.click()}});
setInterval(function(){if(document.hidden||$('v-feed').hidden||busy())return;var m=vnNow().min,hand=[390,720,870,1020,1350].some(function(h){return Math.abs(m-h)<=15});if(hand&&Date.now()-LAST<180000)return;load()},60000);
` + CHAT_JS + String.raw`
if(!T){$('hello').textContent='Mở bảng tin từ app chấm công nha.'}else{load().then(function(){if(location.hash==='#hopthu')tab('inbox');else if(location.hash==='#caidat'&&ME&&ME.role==='admin')tab('set')})}
</script></body></html>`;
// ===================== NCAFE BẢNG TIN – Cloudflare Worker =====================
// Chạy ở địa chỉ workers.dev (VD https://ncafe-bangtin.dangbao-mt.workers.dev/bangtin) – không cần route trên tên miền.
// D1 binding: DB   ·   Cron: */5 * * * *
// Biến môi trường: FEED_SECRET (bắt buộc, giống BANGTIN_KEY bên app Chấm công), QL_PIN, ADMIN_PIN, TELEGRAM_BOT_TOKEN, DEV_MODE
// (30/10) Thêm Góc trò chuyện tự động (chat box) – cài trong Bảng tin → Cài đặt → "Góc trò chuyện tự động".

const STORES = { TP: 'Trần Phú', DD: 'Đống Đa', TD: 'Tản Đà', TNV: 'Trưng Nữ Vương', LDD: 'Lê Đình Dương' };
// [phút trong ngày, tên ca, biểu tượng] – giờ giao ca
const SLOTS = [[390, 'sáng', '☀️'], [720, 'trưa', '🌤️'], [870, 'chiều', '⛅'], [1020, 'tối', '🌙'], [1350, 'tối muộn', '🌙']];
const HANDOVER = SLOTS.map(s => s[0]);
const EMOJIS = ['❤️', '😂', '👏', '🔥'];
// Góc trò chuyện: mỗi đoạn 4–5 câu, cách nhau bằng dòng ---. "Tên | câu nói". {ten} {buoi} {quan} {thu}
const CHAT_MAC_DINH = [
`Bé Muối | {ten} ơi, {buoi} nay ăn gì chưa đó?
Phin | Chắc lại uống cà phê thay cơm rồi 😅
Chị Kem | Không được nha, ăn no mới pha ngon được!
Bé Muối | Nghỉ tay ăn miếng gì đi rồi mình làm tiếp nha 🥖`,
`Phin | Hôm qua mình ngủ có 5 tiếng thôi á…
Anh Đá | Thảo nào nay mắt díp lại 😴
Chị Kem | Tối nay tắt điện thoại sớm 30 phút thử xem, ngủ ngon hơn hẳn.
Bé Muối | {ten} cũng vậy nha, ngủ đủ thì mai cười tươi hơn 😊`,
`Bé Muối | Có ai từng bị khách khó tính làm buồn chưa?
Anh Đá | Có chứ, lúc đó muốn tan chảy luôn 😵
Chị Kem | Nhớ là họ khó với ly nước, không phải với con người mình.
Phin | Hít một hơi, cười một cái, rồi mọi chuyện sẽ qua ☕
Bé Muối | {ten} mà gặp chuyện vậy thì nói với trưởng ca nha, có cả nhà ở đây!`,
`Chị Kem | Tuần này ai đang ôn thi không?
Phin | Mình nè, vừa làm vừa học mệt ghê.
Bé Muối | Giỏi lắm luôn á! Vừa đi làm vừa đi học đâu phải chuyện dễ 💪
Anh Đá | Thi xong nhớ thưởng cho mình một ly cà phê muối nha 😆`,
`Bé Muối | {ten} có biết điều tuyệt nhất của ca hôm nay là gì không?
Phin | Là gì vậy?
Bé Muối | Là có {ten} ở đây đó 😍
Chị Kem | Ui sến quá mà nói thật 😂`,
`Anh Đá | Uống nước chưa cả nhà? Mình nhắc thôi chứ không ép 💧
Phin | Pha cả trăm ly cho khách mà quên uống cho mình…
Chị Kem | Để một chai nước ngay chỗ mình đứng, nhìn thấy là nhớ uống.
Bé Muối | {ten} uống một ngụm luôn đi, mình chờ nè 👀`,
`Phin | Hôm nay mình lỡ làm đổ một ly, buồn ghê.
Chị Kem | Ai mà chưa từng làm đổ đâu, mình đổ cả khay rồi nè 🙈
Anh Đá | Quan trọng là lần sau cầm chắc tay hơn thôi.
Bé Muối | Lỗi nhỏ thôi, mình vẫn là đồng đội xịn của nhau mà 🤝`,
`Bé Muối | Cuối tuần này mọi người định làm gì?
Chị Kem | Về nhà ăn cơm mẹ nấu, nhớ quá trời.
Anh Đá | Mình đi ngủ bù, ngủ tới trưa luôn 😴
Phin | {ten} thì sao, có kế hoạch gì vui chưa?`,
`Chị Kem | Hôm nay nhắn hỏi thăm gia đình chưa?
Phin | Bận quá quên mất…
Bé Muối | Một tin "con vẫn ổn nha" thôi là ở nhà yên tâm rồi.
Anh Đá | Giờ nghỉ nhắn liền đi, tốn có 10 giây à 📱`,
`Bé Muối | Có ai đang để dành tiền cho một ước mơ không?
Phin | Mình để dành mua xe máy mới 🛵
Chị Kem | Mình thì muốn đi Đà Lạt một chuyến.
Anh Đá | Mỗi ca làm là một bước gần hơn đó nha!
Bé Muối | {ten} cũng vậy, cố lên, ước mơ nào cũng đáng 🌟`,
`Phin | Mẹo nè: mỏi tay thì xoay cổ tay vài vòng lúc rảnh.
Chị Kem | Đứng lâu thì nhón gót lên xuống chục lần cho đỡ mỏi chân.
Anh Đá | Vai cứng thì nhún vai lên xuống 5 lần nha.
Bé Muối | {ten} thử liền đi, khoẻ người ra liền 🙆`,
`Bé Muối | Hôm nay ai được khách khen chưa?
Chị Kem | Có chị khách khen cà phê muối béo vừa đúng gu luôn 😍
Phin | Được khen một câu là quên hết mệt.
Bé Muối | {ten} mà được khen thì kể cho cả nhà nghe với nha!`,
`Anh Đá | Trời Đà Nẵng hôm nay sao đó mọi người?
Chị Kem | Nắng thì nhớ uống nước, mưa thì nhớ mang áo mưa nha.
Phin | Đi đường cẩn thận, đến trễ chút còn hơn vội vàng.
Bé Muối | {ten} về tới nhà nhắn một tiếng cho yên tâm nha 🏍️`,
`Bé Muối | Có ai mới vào làm chưa quen việc không?
Phin | Hồi đầu mình pha sai công thức hoài à 😅
Chị Kem | Hỏi nhiều không sao hết, ai cũng từng là người mới.
Anh Đá | Cứ hỏi trưởng ca hoặc người làm lâu, không ai cười đâu.
Bé Muối | {ten} mà thấy bạn mới lúng túng thì giúp một tay nha 🤗`,
`Chị Kem | Lâu rồi bạn có làm điều gì cho riêng mình chưa?
Phin | Đọc sách, nghe nhạc, đi dạo… nghe xa xỉ ghê 😆
Bé Muối | Chỉ 15 phút mỗi ngày thôi cũng được, mình xứng đáng mà.
Anh Đá | Tối nay thử một bài nhạc chill rồi ngủ nha 🎧`,
`Phin | Có ai mê cà phê muối từ lần đầu uống không?
Anh Đá | Mình nè, lần đầu tưởng mặn ai dè béo béo ngon ghê.
Chị Kem | Mình pha cho người khác mà cũng ghiền luôn 😂
Bé Muối | Cảm ơn cả nhà đã làm ra những ly ngon nhất mỗi ngày ☕💛`,
`Bé Muối | Nếu hôm nay hơi mệt thì cũng không sao đâu nha.
Chị Kem | Ai cũng có ngày năng lượng thấp mà.
Phin | Làm chậm lại một chút, cẩn thận là được rồi.
Bé Muối | {ten} đã cố gắng rất nhiều rồi đó, tụi mình thấy hết 💛`,
`Anh Đá | Ai có bài hát nào nghe là vui liền không?
Phin | Mình nghe nhạc Trịnh lúc pha sáng sớm, tâm hồn bay bổng 🎶
Chị Kem | Mình thì nhạc sôi động cho tỉnh ngủ!
Bé Muối | {ten} gợi ý cho cả nhà một bài đi, đăng lên bảng tin nha 🎵`,
`Chị Kem | Cảm ơn ca trước đã dọn quầy sạch sẽ nha!
Phin | Nhận được quầy gọn gàng là vui cả ca.
Anh Đá | Ca mình cũng để lại sạch sẽ cho ca sau nha.
Bé Muối | Làm việc với nhau vui là vì vậy đó 🙌`,
`Bé Muối | Có ai đang có chuyện buồn trong lòng không?
Chị Kem | Đôi khi nói ra được một chút là nhẹ người lắm.
Phin | Lời nhắn riêng trên bảng tin thì chỉ người nhận đọc được thôi nha.
Bé Muối | {ten} cần người lắng nghe thì cứ tìm quản lý hoặc bạn thân trong quán nha 💌`,
`Phin | Mình vừa học được cách vẽ latte art hình trái tim 💗
Anh Đá | Dạy mình với!
Chị Kem | Mỗi tháng học thêm một kỹ năng là giỏi lên thấy rõ luôn.
Bé Muối | {ten} muốn học gì thì nói trưởng ca nha, cả quán cùng giúp 📚`,
`Bé Muối | Nụ cười của mình cũng là một món trong menu đó nha 😁
Anh Đá | Món này miễn phí mà khách thích nhất.
Chị Kem | Cười với khách, khách cười lại, ca làm vui hẳn.
Phin | {ten} cười một cái đi, thấy rồi nha 😆`,
`Chị Kem | Ai biết quán ăn sáng nào ngon gần quán mình không?
Phin | Bánh mì đầu hẻm giòn rụm luôn.
Anh Đá | Mình mê bún bò, người Huế mà 😋
Bé Muối | {ten} có quán ruột thì đăng lên bảng tin cho cả nhà thử nha 🍜`,
`Bé Muối | Tháng này ai đi làm đều đặn chưa nghỉ buổi nào?
Phin | Ráng giữ phong độ nè 💪
Chị Kem | Đi làm đúng giờ là cách tôn trọng đồng đội đẹp nhất.
Bé Muối | {ten} giữ vững nha, tụi mình tự hào về bạn lắm 🏅`,
`Anh Đá | Hôm nay bạn biết ơn điều gì?
Chị Kem | Mình biết ơn vì có đồng nghiệp dễ thương.
Phin | Mình biết ơn ly cà phê sáng nay 😂
Bé Muối | {ten} thử nghĩ một điều nhỏ thôi, sẽ thấy ngày dễ thương hơn 🌼`,
`Phin | Có ai thấy mình tiến bộ hơn tháng trước không?
Chị Kem | Mình pha nhanh hơn hẳn rồi nè!
Anh Đá | Mình nhớ hết tên món mà không cần nhìn menu 😎
Bé Muối | {ten} chắc chắn cũng tiến bộ, chỉ là chưa để ý thôi đó ✨`,
`Bé Muối | Ca tối về khuya nhớ đi chung với bạn cho an toàn nha.
Anh Đá | Đường vắng thì chạy chậm thôi.
Chị Kem | Về tới nhà nhắn vào nhóm một tiếng nha.
Bé Muối | {ten} về an toàn là cả nhà yên tâm rồi 🌙`,
`Chị Kem | Có ai đang tập thể dục không, rủ nhau với!
Phin | Mình chạy bộ ở biển buổi sáng nè 🏃
Anh Đá | Mình chỉ tập… bưng khay thôi 😂
Bé Muối | Khoẻ người thì làm gì cũng vui, {ten} thử đi bộ 15 phút mỗi ngày nha!`,
`Bé Muối | Nếu được làm một món nước, {ten} sẽ là món gì?
Phin | Mình là cà phê đen, đắng mà tỉnh táo 😎
Chị Kem | Mình là cà phê muối, mặn mà dễ thương 😌
Anh Đá | Mình là ly đá, đi đâu cũng mát ❄️`,
`Phin | Hôm nay ai bị việc dí không?
Chị Kem | Bài tập, hoá đơn, tin nhắn chưa trả lời… đủ cả 😵
Bé Muối | Làm từng việc một thôi, xong cái nào gạch cái đó.
Anh Đá | {ten} xong ca rồi tính tiếp, giờ tập trung pha cho đẹp nha ☕`,
`Bé Muối | Ai muốn kể một kỷ niệm vui ở quán không?
Chị Kem | Có lần khách đặt 30 ly, cả quán chạy như thi đấu 😂
Phin | Xong việc ai cũng cười rồi ăn mừng bằng ly trà đá.
Bé Muối | Kỷ niệm đẹp toàn là lúc mình làm cùng nhau đó 💛`,
`Anh Đá | Bận thì bận, nhớ cho mắt nghỉ khỏi điện thoại chút nha.
Chị Kem | Nhìn ra xa 20 giây là mắt đỡ mỏi liền.
Phin | Mà khoan, đọc hết đoạn này rồi hẵng nghỉ nha 😆
Bé Muối | {ten} chăm sóc bản thân trước nha, mình quý bạn lắm 💖`,
`Bé Muối | Nghe nói sắp tới có nhiều ngày đông khách lắm đó!
Phin | Chuẩn bị tinh thần chiến đấu thôi 💪
Chị Kem | Đông thì mệt nhưng vui, ca trôi nhanh ghê.
Anh Đá | {ten} nhớ ăn no ngủ đủ để có sức nha!`,
`Chị Kem | Lời khen dành cho {ten} hôm nay: bạn làm việc rất có tâm 👏
Phin | Khách không nói ra nhưng ai cũng cảm nhận được.
Anh Đá | Cả quán chạy êm là nhờ từng người như bạn đó.
Bé Muối | Cảm ơn {ten} vì đã ở đây cùng Ncafe 💛`,
`Bé Muối | Thử đoán xem hôm nay quán nào bán nhiều cà phê muối nhất?
Phin | Trần Phú chắc rồi, đông muốn xỉu 😅
Chị Kem | Lê Đình Dương cũng không vừa đâu nha!
Anh Đá | Quán nào cũng đỉnh vì có {ten} và đồng đội 😎`,
`Phin | Ai có mẹo nhớ công thức nhanh không?
Chị Kem | Mình đọc to lúc pha, vài lần là thuộc.
Anh Đá | Dán giấy nhớ ở quầy, nhìn hoài thành quen.
Bé Muối | Không nhớ thì hỏi, hỏi không có gì phải ngại cả nha {ten} 😊`
].join('\n---\n');
const DEFAULTS = {
  special_days: [
    '08/03 | Hôm nay 8/3 rồi! Chúc các bạn nữ Ncafe luôn xinh và vui 🌷',
    '01/06 | 1/6 rồi, ai còn là trẻ con trong tim thì cười một cái nào 🎈',
    '20/10 | Hôm nay 20/10 rồi! Các bạn nam làm thay các bạn nữ nha 💐',
    '20/11 | Hôm nay 20/11 rồi, nhớ gửi hoa cho thầy cô nha 🌹',
    '01/01 | Chúc mừng năm mới! Năm nay cả nhà Ncafe cùng bùng nổ nha 🎆',
    '06/02 | Mùng 1 Tết rồi! Chúc cả nhà Ncafe an khang, quán đông khách 🧧'
  ].join('\n'),
  store_bdays: '',
  schedules: '',
  chat: CHAT_MAC_DINH,
  chat_phut: '5-10',
  mascot: [
    'Hôm nay bạn thế nào? | Chắc đang bận pha cà phê... thôi mình tự trả lời: vui lắm!',
    'Ăn sáng chưa đó? | Im lặng là chưa ăn rồi. Nhớ ăn gì đó nha!',
    'Uống đủ nước chưa? | Không trả lời là chưa. Uống ly nước đi nè 💧',
    'Hôm nay khách đông không? | Mình đoán là đông. Cố lên, cả ca đang ở bên bạn!',
    'Cười một cái được không? | Thấy rồi nha, cười xinh ghê 😆'
  ].join('\n'),
  telegram: '',
  no_bday: ''
};

// ---------- tiện ích ----------
const enc = s => new TextEncoder().encode(s);
const pad = n => (n < 10 ? '0' : '') + n;
function fail(m) { const e = new Error(m); e.user = true; throw e; }
function json(o, s = 200) { return new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } }); }
function bad(m, s = 400) { return json({ error: m }, s); }
function html(h) { return new Response(h, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } }); }
function vn(d = new Date()) {
  const t = new Date(d.getTime() + 7 * 3600e3);
  return { ymd: t.toISOString().slice(0, 10), md: pad(t.getUTCDate()) + '/' + pad(t.getUTCMonth() + 1), min: t.getUTCHours() * 60 + t.getUTCMinutes() };
}
const vnMin = ts => Math.floor((ts / 60000 + 420) % 1440);
const dayStart = v => Date.parse(v.ymd + 'T00:00:00+07:00');
function modeOf(min) {
  if (HANDOVER.some(h => Math.abs(min - h) <= 15)) return 'handover';
  if (min >= 450 && min < 600) return 'peak';
  return 'free';
}
const isMgr = me => me.role === 'ql' || me.role === 'admin';
const clean = (s, n) => String(s == null ? '' : s).replace(/\s+\n/g, '\n').trim().slice(0, n);
function initials(name) { return String(name).trim().split(/\s+/).filter(Boolean).map(w => w[0].toUpperCase()).join('.'); }
function givenName(name) { const w = String(name).trim().split(/\s+/); return w[w.length - 1] || name; }
function normDob(d) {
  const s = String(d || '').trim(); let m;
  if ((m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s))) return pad(+m[3]) + '/' + pad(+m[2]);
  if ((m = /^(\d{1,2})[\/\-.](\d{1,2})/.exec(s))) return pad(+m[1]) + '/' + pad(+m[2]);
  return '';
}
const lines = s => String(s || '').split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
const parts = l => l.split('|').map(x => x.trim());
function parseHM(s) { const m = /^(\d{1,2})[:hH](\d{2})?$/.exec(String(s || '').trim()); return m ? (+m[1]) * 60 + (+(m[2] || 0)) : -1; }
function normStores(s) {
  const a = String(s || '').split(',').map(x => x.trim().toUpperCase()).map(x => (x === 'TẤT CẢ' || x === 'TAT CA' ? 'ALL' : x));
  if (a.includes('ALL')) return ['ALL'];
  return a.filter(x => STORES[x]);
}
function storeCode(x) { // nhận cả 'TP', 'tp', 'Trần Phú', 'cham-cong-tp'…
  const n = String(x || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/^cham-cong-/, '').trim();
  const m = [['TP', /^(tp|tran phu)/], ['DD', /^(dd|dong da)/], ['TD', /^(td|tan da)/], ['TNV', /^(tnv|trung nu vuong)/], ['LDD', /^(ldd|le dinh duong)/]].find(a => a[1].test(n));
  return m ? m[0] : String(x || '').toUpperCase();
}
const parseMascot = s => lines(s).map(l => { const p = parts(l); return { q: p[0], a: p[1] || '' }; });
// Góc trò chuyện: đoạn cách nhau bằng dòng "---"; mỗi dòng "Tên | câu" (hoặc "Tên: câu")
function parseChat(s) {
  return String(s || '').split(/\n\s*-{3,}\s*(?:\n|$)/).map(b => lines(b).map(l => {
    let i = l.indexOf('|'); if (i < 0) i = l.indexOf(':');
    return i > 0 ? { w: l.slice(0, i).trim().slice(0, 30), t: l.slice(i + 1).trim().slice(0, 300) } : { w: 'Bé Muối', t: l.slice(0, 300) };
  }).filter(m => m.t).slice(0, 8)).filter(b => b.length >= 2);
}
function parsePhut(s) { const m = /(\d+)\s*[-–]\s*(\d+)/.exec(String(s || '')); let a = m ? +m[1] : (+s || 7), b = m ? +m[2] : a; a = Math.min(Math.max(a, 2), 60); b = Math.min(Math.max(b, a), 60); return [a, b]; }
function hash(s) { let h = 0; for (const c of s) h = (h * 31 + c.codePointAt(0)) | 0; return (h >>> 0).toString(36); }

// ---------- token ----------
function b64u(bytes) { let s = ''; bytes.forEach(b => (s += String.fromCharCode(b))); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function unb64u(s) { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; const bin = atob(s); return new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0))); }
async function hmac(secret, msg) {
  const k = await crypto.subtle.importKey('raw', enc(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64u(new Uint8Array(await crypto.subtle.sign('HMAC', k, enc(msg))));
}
async function makeToken(env, u) { const p = b64u(enc(JSON.stringify(u))); return p + '.' + (await hmac(env.FEED_SECRET, p)); }
async function auth(req, env) {
  const h = req.headers.get('Authorization') || '';
  const t = h.startsWith('Bearer ') ? h.slice(7) : '';
  const [p, s] = t.split('.');
  if (!p || !s || !env.FEED_SECRET) return null;
  if ((await hmac(env.FEED_SECRET, p)) !== s) return null;
  let u; try { u = JSON.parse(unb64u(p)); } catch (e) { return null; }
  if (!u.c || !u.x || u.x < Date.now()) return null;
  return { code: String(u.c).toUpperCase(), name: String(u.n || u.c), store: String(u.s || '').toUpperCase(), role: u.r || 'nv' };
}

// ---------- CSDL ----------
let READY = false;
async function ensure(env) {
  if (READY) return;
  const q = [
    'CREATE TABLE IF NOT EXISTS staff(code TEXT PRIMARY KEY, name TEXT, short TEXT, store TEXT, dob TEXT, role TEXT, active INTEGER DEFAULT 1)',
    'CREATE TABLE IF NOT EXISTS events(id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT, code TEXT, name TEXT, store TEXT, ts INTEGER, ymd TEXT, summarized INTEGER DEFAULT 0)',
    'CREATE INDEX IF NOT EXISTS ev_day ON events(ymd, code)',
    'CREATE TABLE IF NOT EXISTS posts(id INTEGER PRIMARY KEY AUTOINCREMENT, kind TEXT, stores TEXT, author_code TEXT, author_name TEXT, text TEXT, people TEXT, options TEXT, subject_code TEXT, pinned INTEGER DEFAULT 0, expires INTEGER, created INTEGER, ymd TEXT, hidden INTEGER DEFAULT 0, reported INTEGER DEFAULT 0)',
    'CREATE INDEX IF NOT EXISTS posts_created ON posts(created)',
    'CREATE TABLE IF NOT EXISTS answers(post_id INTEGER, code TEXT, name TEXT, choice TEXT, ts INTEGER, PRIMARY KEY(post_id, code))',
    'CREATE TABLE IF NOT EXISTS reactions(post_id INTEGER, code TEXT, emoji TEXT, PRIMARY KEY(post_id, code, emoji))',
    'CREATE TABLE IF NOT EXISTS comments(id INTEGER PRIMARY KEY AUTOINCREMENT, post_id INTEGER, code TEXT, name TEXT, text TEXT, ts INTEGER, hidden INTEGER DEFAULT 0, reported INTEGER DEFAULT 0)',
    'CREATE INDEX IF NOT EXISTS com_post ON comments(post_id)',
    'CREATE TABLE IF NOT EXISTS messages(id INTEGER PRIMARY KEY AUTOINCREMENT, to_code TEXT, from_code TEXT, from_name TEXT, text TEXT, ts INTEGER, read INTEGER DEFAULT 0, hidden INTEGER DEFAULT 0, reported INTEGER DEFAULT 0)',
    'CREATE INDEX IF NOT EXISTS msg_to ON messages(to_code)',
    'CREATE TABLE IF NOT EXISTS settings(k TEXT PRIMARY KEY, v TEXT)'
  ];
  await env.DB.batch(q.map(s => env.DB.prepare(s)));
  READY = true;
}
async function getS(env, k) { const r = await env.DB.prepare('SELECT v FROM settings WHERE k=?').bind(k).first(); return r ? r.v : (DEFAULTS[k] !== undefined ? DEFAULTS[k] : null); }
async function setS(env, k, v) { await env.DB.prepare('INSERT INTO settings(k,v) VALUES(?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v').bind(k, v).run(); }
async function myStoresToday(env, code, ymd) {
  const r = (await env.DB.prepare("SELECT store FROM events WHERE ymd=? AND code=? AND type='in' ORDER BY ts").bind(ymd, code).all()).results;
  return [...new Set(r.map(x => x.store).filter(Boolean))];
}
async function unreadCount(env, code) { const r = await env.DB.prepare('SELECT COUNT(*) n FROM messages WHERE to_code=? AND read=0 AND hidden=0').bind(code).first(); return r ? r.n : 0; }
async function insertPost(env, p) {
  const v = vn(new Date(p.created));
  return env.DB.prepare('INSERT INTO posts(kind,stores,author_code,author_name,text,people,options,subject_code,pinned,expires,created,ymd) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)')
    .bind(p.kind, ',' + p.stores.join(',') + ',', p.author_code || 'SYSTEM', p.author_name || 'Ncafe', p.text, JSON.stringify(p.people || []), JSON.stringify(p.options || []), p.subject_code || null, p.pinned ? 1 : 0, p.expires, p.created, v.ymd).run();
}

// ---------- đọc bảng tin ----------
function canSee(p, me, my, mgr) {
  if (mgr || p.author_code === me.code || p.kind !== 'question') return true;
  const st = p.stores.split(',').filter(Boolean);
  if (st.includes('ALL')) return my.length > 0;
  return st.some(s => my.includes(s));
}
function shape(p, me, mgr, R, C, A, E, now, light) {
  const stores = p.stores.split(',').filter(Boolean);
  const x = {
    id: p.id, kind: p.kind, stores, created: p.created, expires: p.expires, text: p.text,
    pinned: !!(p.pinned && p.expires > now), people: JSON.parse(p.people || '[]'),
    author: { c: p.author_code && p.author_code !== 'SYSTEM' && p.author_code !== me.code ? p.author_code : '', name: p.author_name },
    mine: p.author_code === me.code, canDelete: mgr || p.author_code === me.code
  };
  if (p.kind === 'birthday') { // không bao giờ gửi mã/tên thật của người sinh nhật cho người khác
    if (p.subject_code === me.code) { x.text = 'Chúc mừng sinh nhật ' + givenName(me.name) + '! Hôm nay cả quán thương bạn nhất 🥳'; x.people = []; }
    else { const l = (x.people[0] || {}).l || ''; x.text = 'Hôm nay là sinh nhật bạn ' + l + ' 🎂 Bấm vào tên để gửi lời chúc nha!'; x.people = [{ c: 'p:' + p.id, l }]; }
  }
  x.reactions = {}; x.myReacts = [];
  R.filter(r => r.post_id === p.id).forEach(r => { x.reactions[r.emoji] = (x.reactions[r.emoji] || 0) + 1; if (r.code === me.code) x.myReacts.push(r.emoji); });
  const cs = C.filter(c => c.post_id === p.id); x.ncomments = cs.length;
  if (!light) x.comments = cs.map(c => ({ id: c.id, c: c.code === me.code ? '' : c.code, name: c.name, text: c.text, ts: c.ts, mine: c.code === me.code, canDelete: mgr || c.code === me.code }));
  if (p.kind === 'question') {
    x.options = JSON.parse(p.options || '[]'); x.results = {};
    x.options.forEach(o => (x.results[o] = { n: 0, names: [] }));
    const done = new Set();
    A.filter(a => a.post_id === p.id).forEach(a => {
      done.add(a.code);
      if (x.results[a.choice]) { x.results[a.choice].n++; x.results[a.choice].names.push(a.name); }
      if (a.code === me.code) x.myAnswer = a.choice;
    });
    const pend = new Map();
    E.filter(e => e.ymd === p.ymd && (stores.includes('ALL') || stores.includes(e.store))).forEach(e => { if (!done.has(e.code)) pend.set(e.code, e.name); });
    x.pending = [...pend.values()]; x.nanswers = done.size;
  }
  return x;
}
async function loadItems(env, me, v, o) {
  const now = Date.now(), mgr = isMgr(me);
  let q = 'SELECT * FROM posts WHERE hidden=0 AND created>=?'; const a = [o.since];
  if (o.before) { q += ' AND id<?'; a.push(o.before); }
  if (o.store) { q += " AND (stores LIKE ? OR stores=',ALL,')"; a.push('%,' + o.store + ',%'); }
  if (o.pinsOnly) { q += ' AND pinned=1 AND expires>?'; a.push(now); }
  q += ' ORDER BY id DESC LIMIT ?'; a.push(o.limit || 30);
  const rows = (await env.DB.prepare(q).bind(...a).all()).results;
  const myStores = await myStoresToday(env, me.code, v.ymd);
  const lastId = rows.length ? rows[rows.length - 1].id : 0;
  const vis = rows.filter(p => canSee(p, me, myStores, mgr));
  if (!vis.length) return { items: [], raw: rows.length, lastId, myStores };
  const ids = JSON.stringify(vis.map(p => p.id));
  const ymds = JSON.stringify([...new Set(vis.filter(p => p.kind === 'question').map(p => p.ymd))]);
  const res = await env.DB.batch([
    env.DB.prepare('SELECT post_id,code,emoji FROM reactions WHERE post_id IN (SELECT value FROM json_each(?))').bind(ids),
    env.DB.prepare('SELECT id,post_id,code,name,text,ts FROM comments WHERE hidden=0 AND post_id IN (SELECT value FROM json_each(?)) ORDER BY id').bind(ids),
    env.DB.prepare('SELECT post_id,code,name,choice FROM answers WHERE post_id IN (SELECT value FROM json_each(?))').bind(ids),
    env.DB.prepare("SELECT DISTINCT code,name,store,ymd FROM events WHERE type='in' AND ymd IN (SELECT value FROM json_each(?))").bind(ymds)
  ]);
  const [R, C, A, E] = res.map(r => r.results || []);
  return { items: vis.map(p => shape(p, me, mgr, R, C, A, E, now, o.light)), raw: rows.length, lastId, myStores };
}
async function barData(env, me, v) {
  const now = Date.now(), mode = modeOf(v.min), ds = dayStart(v);
  const { items } = await loadItems(env, me, v, { since: now - 3 * 86400e3, limit: 60, light: true });
  const pins = items.filter(x => x.pinned);
  const special = items.filter(x => (x.kind === 'birthday' || x.kind === 'special') && x.created >= ds);
  const qs = items.filter(x => x.kind === 'question' && !x.pinned && x.expires > now).sort((a, b) => (a.myAnswer ? 1 : 0) - (b.myAnswer ? 1 : 0));
  const sums = items.filter(x => x.kind === 'summary' && x.created >= ds).slice(0, 2);
  const posts = items.filter(x => x.kind === 'post' && !x.pinned && x.created >= now - 3 * 3600e3).slice(0, 3);
  const out = (mode === 'handover' ? pins : mode === 'peak' ? pins.concat(qs) : pins.concat(special, qs, sums, posts)).slice(0, 8);
  return { mode, items: out, unread: await unreadCount(env, me.code), me: { code: me.code, name: me.name, role: me.role } };
}
async function feedData(env, me, v, url) {
  const now = Date.now();
  const s = (url.searchParams.get('store') || '').toUpperCase(), store = STORES[s] ? s : '';
  const before = Number(url.searchParams.get('before')) || 0;
  const r = await loadItems(env, me, v, { since: now - 30 * 86400e3, before, store, limit: 30 });
  let pins = [];
  if (!before) pins = (await loadItems(env, me, v, { since: now - 30 * 86400e3, store, pinsOnly: true, limit: 10 })).items;
  const pinIds = new Set(pins.map(p => p.id));
  return {
    me: { code: me.code, name: me.name, role: me.role, mgr: isMgr(me), todayStores: r.myStores },
    stores: STORES, pins, items: r.items.filter(x => !pinIds.has(x.id)), more: r.raw >= 30, last: r.lastId,
    unread: await unreadCount(env, me.code)
  };
}

// ---------- ghi ----------
async function getVisiblePost(env, me, v, id) {
  const p = await env.DB.prepare('SELECT * FROM posts WHERE id=? AND hidden=0').bind(Number(id)).first();
  if (!p) fail('Tin này không còn nữa');
  if (!canSee(p, me, await myStoresToday(env, me.code, v.ymd), isMgr(me))) fail('Bạn không xem được tin này');
  return p;
}
async function dup(env, table, col, code, text) {
  const r = await env.DB.prepare('SELECT 1 FROM ' + table + ' WHERE ' + col + '=? AND text=? AND ' + (table === 'posts' ? 'created' : 'ts') + '>?').bind(code, text, Date.now() - 60000).first();
  if (r) fail('Bạn vừa gửi nội dung này rồi');
}
async function createPost(env, me, v, b) {
  const now = Date.now(), mgr = isMgr(me);
  const text = clean(b.text, 1000); if (!text) fail('Viết nội dung trước nha');
  const options = [...new Set((Array.isArray(b.options) ? b.options : []).map(o => clean(o, 40)).filter(Boolean))].slice(0, 6);
  if (options.length === 1) fail('Cần ít nhất 2 lựa chọn trả lời');
  let stores;
  if (mgr) {
    stores = normStores((b.stores || []).join(','));
    if (!stores.length) fail('Chọn ít nhất một cơ sở');
  } else {
    const my = await myStoresToday(env, me.code, v.ymd);
    if (!my.length) fail('Bạn cần check in hôm nay trước khi đăng');
    stores = [my[my.length - 1]];
  }
  let expires = dayStart(v) + (24 * 60 - 1) * 60000;
  if (mgr && b.expires) { const m = parseHM(b.expires); if (m < 0) fail('Giờ hết hạn không đúng'); expires = dayStart(v) + m * 60000; if (expires <= now) fail('Giờ hết hạn đã qua rồi'); }
  await dup(env, 'posts', 'author_code', me.code, text);
  const r = await insertPost(env, { kind: options.length ? 'question' : 'post', stores, author_code: me.code, author_name: me.name, text, options, pinned: mgr && b.pin, expires, created: now });
  return { ok: true, id: r.meta.last_row_id };
}
async function api(r, me, b, url, env, method) {
  const v = vn(), now = Date.now(), mgr = isMgr(me), admin = me.role === 'admin';
  switch (r) {
    case 'bar': return json(await barData(env, me, v));
    case 'feed': return json(await feedData(env, me, v, url));
    case 'chat': return json({ scripts: parseChat(await getS(env, 'chat')), phut: parsePhut(await getS(env, 'chat_phut')), me: { name: me.name, store: me.store, storeName: STORES[me.store] || '' } });
    case 'post': return json(await createPost(env, me, v, b));
    case 'answer': {
      const p = await getVisiblePost(env, me, v, b.post_id);
      if (p.kind !== 'question') fail('Tin này không phải câu hỏi');
      if (p.expires <= now) fail('Câu hỏi đã hết hạn');
      if (!JSON.parse(p.options || '[]').includes(b.choice)) fail('Lựa chọn không hợp lệ');
      await env.DB.prepare('INSERT INTO answers(post_id,code,name,choice,ts) VALUES(?,?,?,?,?) ON CONFLICT(post_id,code) DO UPDATE SET choice=excluded.choice,name=excluded.name,ts=excluded.ts').bind(p.id, me.code, me.name, b.choice, now).run();
      return json({ ok: true });
    }
    case 'react': {
      if (!EMOJIS.includes(b.emoji)) fail('Biểu tượng không hợp lệ');
      const p = await getVisiblePost(env, me, v, b.post_id);
      const d = await env.DB.prepare('DELETE FROM reactions WHERE post_id=? AND code=? AND emoji=?').bind(p.id, me.code, b.emoji).run();
      if (!d.meta.changes) await env.DB.prepare('INSERT INTO reactions(post_id,code,emoji) VALUES(?,?,?)').bind(p.id, me.code, b.emoji).run();
      return json({ ok: true });
    }
    case 'comment': {
      const text = clean(b.text, 300); if (!text) fail('Viết bình luận trước nha');
      const p = await getVisiblePost(env, me, v, b.post_id);
      await dup(env, 'comments', 'code', me.code, text);
      await env.DB.prepare('INSERT INTO comments(post_id,code,name,text,ts) VALUES(?,?,?,?,?)').bind(p.id, me.code, me.name, text, now).run();
      return json({ ok: true });
    }
    case 'delete': {
      if (b.comment_id) {
        const c = await env.DB.prepare('SELECT code FROM comments WHERE id=?').bind(Number(b.comment_id)).first();
        if (!c) fail('Bình luận không còn nữa');
        if (!mgr && c.code !== me.code) fail('Bạn chỉ xoá được bình luận của mình');
        await env.DB.prepare('DELETE FROM comments WHERE id=?').bind(Number(b.comment_id)).run();
      } else {
        const p = await env.DB.prepare('SELECT author_code FROM posts WHERE id=?').bind(Number(b.post_id)).first();
        if (!p) fail('Tin này không còn nữa');
        if (!mgr && p.author_code !== me.code) fail('Bạn chỉ xoá được tin của mình');
        const id = Number(b.post_id);
        await env.DB.batch(['DELETE FROM posts WHERE id=?', 'DELETE FROM reactions WHERE post_id=?', 'DELETE FROM comments WHERE post_id=?', 'DELETE FROM answers WHERE post_id=?'].map(s => env.DB.prepare(s).bind(id)));
      }
      return json({ ok: true });
    }
    case 'report': {
      const t = { post: 'posts', comment: 'comments', message: 'messages' }[b.kind]; if (!t) fail('Loại không hợp lệ');
      const extra = t === 'messages' ? ' AND to_code=?' : '';
      const st = env.DB.prepare('UPDATE ' + t + ' SET reported=1 WHERE id=?' + extra);
      await (extra ? st.bind(Number(b.id), me.code) : st.bind(Number(b.id))).run();
      return json({ ok: true });
    }
    case 'message': {
      const text = clean(b.text, 200); if (!text) fail('Viết lời nhắn trước nha');
      let to = String(b.to || '');
      if (to.startsWith('p:')) { // sinh nhật ẩn tên
        const p = await env.DB.prepare('SELECT subject_code FROM posts WHERE id=?').bind(Number(to.slice(2))).first();
        if (!p || !p.subject_code) fail('Không tìm thấy người nhận');
        to = p.subject_code;
      }
      to = to.toUpperCase();
      if (!to) fail('Không tìm thấy người nhận');
      if (to === me.code) fail('Không gửi cho chính mình được nha 😄');
      await dup(env, 'messages', 'from_code', me.code, text);
      await env.DB.prepare('INSERT INTO messages(to_code,from_code,from_name,text,ts) VALUES(?,?,?,?,?)').bind(to, me.code, me.name, text, now).run();
      return json({ ok: true });
    }
    case 'inbox': {
      const m = (await env.DB.prepare('SELECT id,from_code,from_name,text,ts,read FROM messages WHERE to_code=? AND hidden=0 ORDER BY id DESC LIMIT 60').bind(me.code).all()).results;
      await env.DB.prepare('UPDATE messages SET read=1 WHERE to_code=? AND read=0').bind(me.code).run();
      return json({ items: m });
    }
    case 'elevate': {
      const pin = String(b.pin || '');
      let role = '';
      if (env.ADMIN_PIN && pin === env.ADMIN_PIN) role = 'admin';
      else if (env.QL_PIN && pin === env.QL_PIN) role = 'ql';
      if (!role) fail('Sai mã PIN');
      return json({ token: await makeToken(env, { c: me.code, n: me.name, s: me.store, r: role, x: now + 12 * 3600e3 }), role });
    }
    case 'telegram': {
      if (!mgr) fail('Chỉ quản lý gửi được');
      const p = await env.DB.prepare('SELECT * FROM posts WHERE id=?').bind(Number(b.post_id)).first();
      if (!p || p.kind !== 'question') fail('Chỉ gửi được câu hỏi');
      const ans = (await env.DB.prepare('SELECT name,choice FROM answers WHERE post_id=?').bind(p.id).all()).results;
      const opts = JSON.parse(p.options || '[]');
      let msg = '🙋 ' + p.text + '\n';
      opts.forEach(o => { const ns = ans.filter(a => a.choice === o).map(a => a.name); msg += '• ' + o + ': ' + ns.length + (ns.length ? ' (' + ns.join(', ') + ')' : '') + '\n'; });
      const chats = {}; lines(await getS(env, 'telegram')).forEach(l => { const q = parts(l); if (q[1]) chats[q[0].toUpperCase()] = q[1]; });
      const st = p.stores.split(',').filter(Boolean);
      const targets = st.includes('ALL') ? Object.values(chats) : st.map(s => chats[s]).filter(Boolean);
      if (!targets.length) fail('Chưa có nhóm Telegram cho cơ sở này (vào Cài đặt để thêm)');
      if (!env.TELEGRAM_BOT_TOKEN) fail('Chưa cài TELEGRAM_BOT_TOKEN trên Cloudflare');
      let sent = 0;
      for (const chat of targets) {
        const res = await fetch('https://api.telegram.org/bot' + env.TELEGRAM_BOT_TOKEN + '/sendMessage', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ chat_id: chat, text: msg }) });
        if (res.ok) sent++;
      }
      if (!sent) fail('Telegram không nhận tin. Kiểm tra bot đã ở trong nhóm chưa');
      return json({ ok: true, sent });
    }
    case 'settings': {
      if (!admin) fail('Chỉ admin');
      if (method === 'POST') { for (const k of Object.keys(DEFAULTS)) if (typeof b[k] === 'string') await setS(env, k, b[k].slice(0, k === 'chat' ? 80000 : 20000)); }
      const out = {}; for (const k of Object.keys(DEFAULTS)) out[k] = await getS(env, k);
      return json(out);
    }
    case 'moderate': {
      if (!admin) fail('Chỉ admin');
      const T = { post: 'posts', comment: 'comments', message: 'messages' };
      if (method === 'POST') {
        const t = T[b.kind]; if (!t) fail('Loại không hợp lệ');
        const set = { hide: 'hidden=1,reported=0', keep: 'reported=0', unhide: 'hidden=0' }[b.action]; if (!set) fail('Thao tác không hợp lệ');
        await env.DB.prepare('UPDATE ' + t + ' SET ' + set + ' WHERE id=?').bind(Number(b.id)).run();
      }
      const res = await env.DB.batch([
        env.DB.prepare("SELECT 'post' kind,id,author_name who,text,created ts,hidden FROM posts WHERE reported=1 OR hidden=1 ORDER BY id DESC LIMIT 30"),
        env.DB.prepare("SELECT 'comment' kind,id,name who,text,ts,hidden FROM comments WHERE reported=1 OR hidden=1 ORDER BY id DESC LIMIT 30"),
        env.DB.prepare("SELECT 'message' kind,id,from_name || ' → ' || to_code who,text,ts,hidden FROM messages WHERE reported=1 OR hidden=1 ORDER BY id DESC LIMIT 30")
      ]);
      return json({ items: res.flatMap(x => x.results).sort((a, b) => b.ts - a.ts) });
    }
  }
  return bad('Không có chức năng này', 404);
}

// ---------- nhận dữ liệu từ Apps Script ----------
async function hook(req, env) {
  if (!env.FEED_SECRET || req.headers.get('X-Feed-Key') !== env.FEED_SECRET) return bad('Sai khoá', 403);
  const b = await req.json().catch(() => ({}));
  if (b.type === 'staff') {
    const list = Array.isArray(b.list) ? b.list : [];
    const st = [env.DB.prepare('UPDATE staff SET active=0')];
    for (const s of list) {
      if (!s.code) continue;
      st.push(env.DB.prepare('INSERT INTO staff(code,name,short,store,dob,role,active) VALUES(?,?,?,?,?,?,1) ON CONFLICT(code) DO UPDATE SET name=excluded.name,short=excluded.short,store=excluded.store,dob=excluded.dob,role=excluded.role,active=1')
        .bind(String(s.code).toUpperCase(), s.short || s.name || s.code, s.short || initials(s.name || s.code), storeCode(s.store), normDob(s.dob), s.role || 'nv'));
    }
    await env.DB.batch(st);
    return json({ ok: true, count: st.length - 1 });
  }
  if (b.type === 'in' || b.type === 'out') {
    if (!b.code) return bad('Thiếu mã nhân viên');
    const ts = Number(b.ts) || Date.now();
    await env.DB.prepare('INSERT INTO events(type,code,name,store,ts,ymd) VALUES(?,?,?,?,?,?)')
      .bind(b.type, String(b.code).toUpperCase(), b.name || b.code, storeCode(b.store), ts, vn(new Date(ts)).ymd).run();
    return json({ ok: true });
  }
  return bad('type không hợp lệ');
}

// ---------- việc định kỳ (cron 5 phút) ----------
async function summarize(env, v, S, label, icon, now) {
  const ev = (await env.DB.prepare('SELECT * FROM events WHERE ymd=? AND summarized=0 AND ts<=? ORDER BY ts').bind(v.ymd, now).all()).results;
  if (!ev.length) return 0;
  const by = {};
  ev.forEach(e => { if (!e.store) return; const g = (by[e.store] = by[e.store] || { in: new Map(), out: new Map() }); if (g[e.type]) g[e.type].set(e.code, e); });
  let n = 0;
  for (const [store, g] of Object.entries(by)) {
    const name = STORES[store] || store;
    if (g.in.size) {
      const list = [...g.in.values()], ontime = S >= 0 ? list.filter(e => vnMin(e.ts) <= S).length : 0;
      const head = S >= 0 && S < 1350 ? icon + ' Ca ' + label + ' ' + name + ' chào sân: ' : '👋 ' + name + ': ';
      await insertPost(env, { kind: 'summary', stores: [store], text: head + list.length + ' bạn vào ca' + (ontime ? ', ' + ontime + ' bạn đến sớm hoặc đúng giờ 👏' : '') + '. Chúc cả ca thật vui!', people: list.map(e => ({ c: e.code, l: e.name })), expires: now, created: now });
      n++;
    }
    if (g.out.size) {
      const list = [...g.out.values()];
      await insertPost(env, { kind: 'summary', stores: [store], text: '❤️ Cảm ơn ' + list.length + ' bạn vừa ra ca ở ' + name + '. Về nghỉ ngơi nha!', people: list.map(e => ({ c: e.code, l: e.name })), expires: now, created: now });
      n++;
    }
  }
  await env.DB.prepare('UPDATE events SET summarized=1 WHERE id IN (SELECT value FROM json_each(?))').bind(JSON.stringify(ev.map(e => e.id))).run();
  return n;
}
async function daily(env, v, now) {
  const flag = 'flag:' + v.ymd + ':daily';
  if (await env.DB.prepare('SELECT 1 FROM settings WHERE k=?').bind(flag).first()) return;
  await setS(env, flag, '1');
  for (const l of lines(await getS(env, 'special_days'))) {
    const [md, text] = parts(l);
    if (normDob(md) === v.md && text) await insertPost(env, { kind: 'special', stores: ['ALL'], text, expires: now, created: now });
  }
  for (const l of lines(await getS(env, 'store_bdays'))) {
    const [s, md, text] = parts(l), st = normStores(s);
    if (st.length && normDob(md) === v.md) await insertPost(env, { kind: 'special', stores: st, text: text || ('Hôm nay là sinh nhật quán ' + st.map(x => STORES[x] || 'Ncafe').join(', ') + '! Cả nhà cười thật tươi nha 🎉'), expires: now, created: now });
  }
  const skip = new Set(String(await getS(env, 'no_bday') || '').split(/[\s,;]+/).map(x => x.toUpperCase()).filter(Boolean));
  const bd = (await env.DB.prepare('SELECT * FROM staff WHERE active=1 AND dob=?').bind(v.md).all()).results.filter(s => !skip.has(s.code));
  const count = {}; bd.forEach(s => (count[s.short] = (count[s.short] || 0) + 1));
  for (const s of bd) {
    const label = count[s.short] > 1 && s.store ? s.short + ' (' + s.store + ')' : s.short;
    await insertPost(env, { kind: 'birthday', stores: ['ALL'], text: '', people: [{ l: label }], subject_code: s.code, expires: now, created: now });
  }
  // dọn dữ liệu cũ: bảng tin chỉ hiện 30 ngày, quá 90 ngày thì xoá
  const old = now - 90 * 86400e3, oldYmd = vn(new Date(now - 7 * 86400e3)).ymd;
  await env.DB.batch([
    env.DB.prepare('DELETE FROM reactions WHERE post_id IN (SELECT id FROM posts WHERE created<?)').bind(old),
    env.DB.prepare('DELETE FROM comments WHERE post_id IN (SELECT id FROM posts WHERE created<?)').bind(old),
    env.DB.prepare('DELETE FROM answers WHERE post_id IN (SELECT id FROM posts WHERE created<?)').bind(old),
    env.DB.prepare('DELETE FROM posts WHERE created<?').bind(old),
    env.DB.prepare('DELETE FROM events WHERE ts<?').bind(old),
    env.DB.prepare('DELETE FROM messages WHERE ts<?').bind(old),
    env.DB.prepare("DELETE FROM settings WHERE k LIKE 'flag:%' AND k<?").bind('flag:' + oldYmd)
  ]);
}
async function tick(env) {
  const now = Date.now(), v = vn();
  await daily(env, v, now);
  for (const [S, label, icon] of SLOTS) {
    if (v.min >= S + 20 && v.min < S + 60) {
      const flag = 'flag:' + v.ymd + ':sum:' + S;
      if (!(await env.DB.prepare('SELECT 1 FROM settings WHERE k=?').bind(flag).first())) { await setS(env, flag, '1'); await summarize(env, v, S, label, icon, now); }
    }
  }
  // câu hỏi đăng tự động hằng ngày: "TP | 09:30 | Câu hỏi | Lựa chọn 1; Lựa chọn 2 | 10:30"
  for (const l of lines(await getS(env, 'schedules'))) {
    const [s, at, text, opts, exp] = parts(l), T = parseHM(at), st = normStores(s);
    if (T < 0 || !text || !st.length || v.min < T || v.min >= T + 30) continue;
    const flag = 'flag:' + v.ymd + ':sch:' + hash(l);
    if (await env.DB.prepare('SELECT 1 FROM settings WHERE k=?').bind(flag).first()) continue;
    await setS(env, flag, '1');
    const options = String(opts || '').split(';').map(o => o.trim()).filter(Boolean).slice(0, 6);
    const E = parseHM(exp);
    await insertPost(env, { kind: options.length >= 2 ? 'question' : 'post', stores: st, author_name: 'Quản lý', text, options: options.length >= 2 ? options : [], expires: E > v.min ? dayStart(v) + E * 60000 : dayStart(v) + 1439 * 60000, created: now });
  }
}

// ---------- chế độ thử (DEV_MODE=1) ----------
async function dev(url, env) {
  if (env.DEV_MODE !== '1') return new Response('Not found', { status: 404 });
  const q = url.searchParams, code = (q.get('code') || 'TEST-AN').toUpperCase(), name = q.get('name') || 'Nguyễn Văn An', store = (q.get('store') || 'TP').toUpperCase();
  const a = q.get('action');
  if (a === 'in' || a === 'out') {
    await env.DB.prepare('INSERT INTO events(type,code,name,store,ts,ymd) VALUES(?,?,?,?,?,?)').bind(a, code, name, store, Date.now(), vn().ymd).run();
    return html('<meta charset="utf-8"><p>Đã ghi ' + a + ' cho ' + name + ' tại ' + store + '. <a href="javascript:history.back()">Quay lại</a></p>');
  }
  if (a === 'sum') { const n = await summarize(env, vn(), -1, '', '', Date.now()); return html('<meta charset="utf-8"><p>Đã tạo ' + n + ' tin tổng kết.</p>'); }
  if (a === 'daily') { await setS(env, 'flag:' + vn().ymd + ':daily', ''); await env.DB.prepare('DELETE FROM settings WHERE k=?').bind('flag:' + vn().ymd + ':daily').run(); await daily(env, vn(), Date.now()); return html('<meta charset="utf-8"><p>Đã chạy việc hằng ngày.</p>'); }
  const t = encodeURIComponent(await makeToken(env, { c: code, n: name, s: store, r: q.get('role') || 'nv', x: Date.now() + 24 * 3600e3 }));
  return html('<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><body style="font-family:system-ui;padding:16px;line-height:1.8">' +
    '<h3>Chế độ thử: ' + name + ' (' + code + ', ' + store + ')</h3>' +
    '<a href="/bangtin/bar?t=' + t + '">Mở thanh thông báo</a><br><a href="/bangtin?t=' + t + '">Mở bảng tin</a><br>' +
    '<a href="?action=in&code=' + code + '&name=' + encodeURIComponent(name) + '&store=' + store + '">Giả lập check in</a><br>' +
    '<a href="?action=out&code=' + code + '&name=' + encodeURIComponent(name) + '&store=' + store + '">Giả lập check out</a><br>' +
    '<a href="?action=sum">Tạo tin tổng kết ngay</a><br><a href="?action=daily">Chạy sinh nhật và ngày đặc biệt</a></body>');
}

// ---------- định tuyến ----------
export default {
  async fetch(req, env) {
    try {
      if (!env.DB) return bad('Chưa gắn D1 với tên DB', 500);
      await ensure(env);
      const url = new URL(req.url), p = url.pathname.replace(/\/+$/, '');
      if (p === '/bangtin' && req.method === 'GET') return html(PAGE);
      if (p === '/bangtin/bar') return html(BAR);
      if (p === '/bangtin/dev') return dev(url, env);
      if (p === '/bangtin/api/hook' && req.method === 'POST') return hook(req, env);
      if (p.startsWith('/bangtin/api/')) {
        const me = await auth(req, env);
        if (!me) return bad('Phiên đăng nhập hết hạn. Mở lại app chấm công nha.', 401);
        const b = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
        return await api(p.slice(13), me, b, url, env, req.method);
      }
      return new Response('Not found', { status: 404 });
    } catch (e) {
      return e.user ? bad(e.message) : bad('Lỗi máy chủ: ' + e.message, 500);
    }
  },
  async scheduled(event, env, ctx) {
    ctx.waitUntil((async () => { await ensure(env); await tick(env); })());
  }
};
