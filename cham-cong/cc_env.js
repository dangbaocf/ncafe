const fs=require('fs');
global.__CCDIR = require('path').resolve(process.cwd());    // cwd lúc chạy test = thư mục cham-cong
global.__NCDIR = require('path').dirname(global.__CCDIR);   // thư mục cha = ncafe root
function pad(n){return String(n).padStart(2,'0');}
global.Utilities={computeDigest:(alg,s)=>Array.from(require('crypto').createHash('sha256').update(String(s)).digest()), base64EncodeWebSafe:(b)=>(typeof b==='string'?Buffer.from(b,'utf8'):Buffer.from(b.map(x=>x&255))).toString('base64').replace(/\+/g,'-').replace(/\//g,'_'), Charset:{UTF_8:'UTF-8',US_ASCII:'US-ASCII'}, computeHmacSha256Signature:(v,k)=>Array.from(require('crypto').createHmac('sha256',Buffer.from(String(k),'utf8')).update(Buffer.from(String(v),'utf8')).digest()).map(x=>x>127?x-256:x), getUuid:()=>require('crypto').randomUUID(), DigestAlgorithm:{SHA_256:'sha256'},formatDate:(d,tz,f)=>{d=new Date(d.getTime()+7*3600e3);const Y=d.getUTCFullYear(),M=pad(d.getUTCMonth()+1),D=pad(d.getUTCDate()),h=pad(d.getUTCHours()),m=pad(d.getUTCMinutes()),s=pad(d.getUTCSeconds());
 return f.replace('yyyy',Y).replace('yy',String(Y).slice(2)).replace('MM',M).replace('dd',D).replace('HH',h).replace('mm',m).replace('ss',s);},base64Decode:x=>[],newBlob:()=>({})};

// ===== (29/10) MÔ PHỎNG GOOGLE SHEET TIẾNG VIỆT TỰ ĐỔI KIỂU KHI GHI CHỮ (giống thật) =====
global.VN_SHEET=true;
function vnDoi(x){ if(!global.VN_SHEET || typeof x!=='string') return x; if(x.charAt(0)==="'") return x.slice(1); const t=x.trim(); if(t==='') return x;
  if(/^\d{1,3}(\.\d{3})+$/.test(t)) return +t.replace(/\./g,'');                                   // 14.254.129.209 → 14254129209
  if(/^-?\d+(,\d+)?$/.test(t)) return +t.replace(',','.');                                          // 7,5 → 7.5 · 0912345678 → 912345678
  if(/^\d{4}-\d{1,2}$/.test(t)) return new Date(t.replace(/-(\d)$/,'-0$1')+'-01T00:00:00+07:00');   // 2026-10 → ngày 01/10/2026
  if(/^\d{4}-\d{2}-\d{2}$/.test(t)) return new Date(t+'T00:00:00+07:00');
  if(/^\d{4}-\d{2}-\d{2}[ T]\d{1,2}:\d{2}(:\d{2})?$/.test(t)) return new Date(t.replace(' ','T').replace(/T(\d):/,'T0$1:')+'+07:00');
  if(/^\d{1,2}:\d{2}(:\d{2})?$/.test(t)){ const p=t.split(':'); return new Date(Date.UTC(1899,11,30,+p[0],+p[1],+(p[2]||0))-7*3600e3); }   // giờ
  let m=t.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?$/); if(m && +m[1]<=31 && +m[2]<=12) return new Date((m[3]||'2026')+'-'+('0'+m[2]).slice(-2)+'-'+('0'+m[1]).slice(-2)+'T00:00:00+07:00');
  if(/^(true|false)$/i.test(t)) return /^true$/i.test(t);
  return x; }
class Range{constructor(sh,r,c,nr,nc){Object.assign(this,{sh,r,c,nr,nc});}
 getBackgrounds(){const o=[];for(let i=0;i<this.nr;i++){const row=[];for(let k=0;k<this.nc;k++){row.push(((this.sh.bg||[])[this.r-1+i]||[])[this.c-1+k]||'#ffffff');}o.push(row);}return o;}
 getValues(){const o=[];for(let i=0;i<this.nr;i++){const row=[];for(let j=0;j<this.nc;j++){row.push((this.sh.d[this.r-1+i]||[])[this.c-1+j]??'');}o.push(row);}return o;}
 getValue(){return this.getValues()[0][0];}
 setValues(v){/*STRICT*/ if(v.length!==this.nr) throw new Error('Số dòng trong dữ liệu không khớp với số dòng trong dải ô. Dữ liệu có '+v.length+' nhưng dải ô có '+this.nr+'.'); v.forEach(r=>{ if(r.length!==this.nc) throw new Error('Số cột trong dữ liệu không khớp với số cột trong dải ô. Dữ liệu có '+r.length+' nhưng dải ô có '+this.nc+'.'); }); v.forEach((row,i)=>row.forEach((x,j)=>{const R=this.r-1+i;this.sh.d[R]=this.sh.d[R]||[];this.sh.d[R][this.c-1+j]=(this.sh.cotChu&&this.sh.cotChu[this.c-1+j])?(typeof x==='string'&&x.charAt(0)==="'"?x.slice(1):x):vnDoi(x);}));return this;}
 setValue(x){return this.setValues([[x]]);} clearContent(){for(let i=0;i<this.nr;i++)this.sh.d[this.r-1+i]=[];return this;}
 setNumberFormat(f){ if(f==='@'){ this.sh.cotChu=this.sh.cotChu||{}; for(let k=0;k<this.nc;k++) this.sh.cotChu[this.c-1+k]=1; } return this;} setFontFamily(){return this;} setVerticalAlignment(){return this;} setWrap(){return this;} setFontWeight(){return this;} setBackground(){return this;} setBackgrounds(){return this;} setFontColor(){return this;} setHorizontalAlignment(){return this;} merge(){return this;} setBorder(){return this;} setFontSize(){return this;}}
class Sheet{constructor(n){this.n=n;this.d=[];}
 getName(){return this.n;} setName(n){this.n=n;} clear(){this.d=[];}
 getLastRow(){let l=0;this.d.forEach((r,i)=>{if(r&&r.some(x=>x!==''&&x!==undefined))l=i+1;});return l;}
 getMaxRows(){return Math.max(1000,this.d.length);} getMaxColumns(){return 26;} getLastColumn(){return Math.max(0,...this.d.map(r=>r?r.length:0));}
 getRange(a,b,c,d){if(typeof a==='string'){ const m=a.match(/^([A-Z]+)\d*:([A-Z]+)\d*$/); const so=t=>t.split('').reduce((n,ch)=>n*26+ch.charCodeAt(0)-64,0); if(m){ const c1=so(m[1]), c2=so(m[2]); return new Range(this,1,c1,1000,c2-c1+1); } return new Range(this,1,1,1,1); } if(c!==undefined&&c<1) throw new Error('Số hàng trong dải ô phải tối thiểu là 1.'); if(d!==undefined&&d<1) throw new Error('Số cột trong dải ô phải tối thiểu là 1.'); if(!(a>=1)||!(b>=1)) throw new Error('Không tìm thấy dải ô ('+a+','+b+')'); return new Range(this,a,b,c||1,d||1);}
 getDataRange(){return new Range(this,1,1,Math.max(1,this.getLastRow()),Math.max(1,this.getLastColumn()));}
 appendRow(r){this.d[this.getLastRow()]=r.map((x,j)=>(this.cotChu&&this.cotChu[j])?(typeof x==='string'&&x.charAt(0)==="'"?x.slice(1):x):vnDoi(x));} setFrozenRows(){} setFrozenColumns(){} setColumnWidth(){} hideColumns(){} deleteRow(i){ this.d.splice(i-1,1); } }

function mkSS(id){ const sh=[]; return {id, sh, getId:()=>id, getUrl:()=>'https://docs.google.com/spreadsheets/d/'+id, setSpreadsheetTimeZone(){}, getSheets:()=>sh, getSheetByName:n=>sh.find(s=>s.n===n)||null, insertSheet:n=>{const s=new Sheet(n); s.getSheetId=()=>sh.length; sh.push(s); return s;}}; }
const CCSS=mkSS('CC'), XLSS=mkSS('XL');
const FILES={}; let nF=0;
global.SpreadsheetApp={getActiveSpreadsheet:()=>CCSS, openById:(id)=>id==='XL'?XLSS:(FILES[id]||CCSS), create:(n)=>{ const id='F'+(++nF); const s=mkSS(id); s.name=n; s.insertSheet('Sheet1'); s.deleteSheet=(x)=>{ const i=s.sh.indexOf(x); if(i>-1) s.sh.splice(i,1); }; FILES[id]=s; return s; }};
CCSS.deleteSheet=(x)=>{ const i=CCSS.sh.indexOf(x); if(i>-1) CCSS.sh.splice(i,1); };
global.TG_SENT=[]; global.TG_LOI=false;
global.UrlFetchApp={fetch:(url,o)=>{ if(TG_LOI) throw new Error('mất mạng'); const m=url.match(/bot([^/]+)\/(\w+)$/); if(!m) return {getContentText:()=>'{}'};
  if(m[1]!=='TOKOK') return {getContentText:()=>JSON.stringify({ok:false,description:'Unauthorized'})};
  if(m[2]==='getUpdates') return {getContentText:()=>JSON.stringify({ok:true,result:[{my_chat_member:{chat:{id:-1001,title:'Ncafe Chấm công',type:'supergroup'}}},{message:{chat:{id:-1002,title:'Ncafe Trần Phú',type:'group'},text:'hi'}},{message:{chat:{id:55,type:'private'}}}]})};
  const b=typeof o.payload==='string'?JSON.parse(o.payload):Object.assign({},o.payload,{photo:'[ảnh]',text:o.payload.caption,_anh:m[2]==='sendPhoto'}); TG_SENT.push(b); return {getContentText:()=>JSON.stringify({ok:true})}; }};
global.ContentService={createTextOutput:(t)=>({t, setMimeType(){ return this; }}), MimeType:{JSON:'json'}};
global.DriveApp={createFolder:()=>({getId:()=>'DIR',createFile:()=>({getId:()=>'IMG'})}),getFolderById:()=>({createFile:()=>({getId:()=>'IMG'})}),getFileById:()=>({moveTo(){}})};
global.LockService={getScriptLock:()=>({waitLock(){},tryLock(){ return !global.KHOA_BAN; },releaseLock(){}})};
global.ScriptApp={getService:()=>({getUrl:()=>'https://script.google.com/macros/s/CC/exec'}),getProjectTriggers:()=>[],newTrigger:()=>{ const c={timeBased:()=>c,everyDays:()=>c,everyHours:()=>c,everyMinutes:()=>c,atHour:()=>c,create:()=>c}; return c; },deleteTrigger:()=>{}};
global.HtmlService={createTemplateFromFile:(n)=>({n, evaluate(){ return {n, setTitle(){return this;},addMetaTag(){return this;},setXFrameOptionsMode(){return this;}}; }}),createHtmlOutput:(h)=>({h, setTitle(){return this;},addMetaTag(){return this;},setXFrameOptionsMode(){return this;}}),XFrameOptionsMode:{ALLOWALL:1}};
const RealDate=Date; let fake=null;
global.Date=class extends RealDate{constructor(...a){if(a.length)super(...a);else super(fake||RealDate.now());} static now(){return fake||RealDate.now();}};
function at(d,hm){ fake=new RealDate(d+'T'+hm+':00+07:00').getTime(); }

globalThis.global=globalThis;

global.CACHE_BAT=false; const _CACHE={};
global.CacheService={getScriptCache:()=>({get:k=>CACHE_BAT&&k in _CACHE?_CACHE[k]:null, getAll:ks=>{const o={}; ks.forEach(k=>{ if(CACHE_BAT&&k in _CACHE) o[k]=_CACHE[k]; }); return o;}, put:(k,v)=>{_CACHE[k]=v;}, putAll:o=>{Object.assign(_CACHE,o);}, remove:k=>{delete _CACHE[k];}})};
