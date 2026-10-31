const fs=require('fs');
function pad(n){return String(n).padStart(2,'0');}
global.Utilities={computeDigest:(alg,s)=>Array.from(require('crypto').createHash('sha256').update(String(s)).digest()), base64EncodeWebSafe:(b)=>Buffer.from(b.map(x=>x&255)).toString('base64').replace(/\+/g,'-').replace(/\//g,'_'), getUuid:()=>require('crypto').randomUUID(), DigestAlgorithm:{SHA_256:'sha256'},formatDate:(d,tz,f)=>{d=new Date(d.getTime()+7*3600e3);const Y=d.getUTCFullYear(),M=pad(d.getUTCMonth()+1),D=pad(d.getUTCDate()),h=pad(d.getUTCHours()),m=pad(d.getUTCMinutes()),s=pad(d.getUTCSeconds());
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
 getValues(){const o=[];for(let i=0;i<this.nr;i++){const row=[];for(let j=0;j<this.nc;j++){row.push((this.sh.d[this.r-1+i]||[])[this.c-1+j]??'');}o.push(row);}return o;}
 getValue(){return this.getValues()[0][0];}
 getBackgrounds(){const o=[];for(let i=0;i<this.nr;i++){const row=[];for(let j=0;j<this.nc;j++){row.push(((this.sh.bg||[])[this.r-1+i]||[])[this.c-1+j]||'#ffffff');}o.push(row);}return o;}
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
const sheets=[new Sheet('Chấm công Ncafe')];
sheets[0].d=fs.readFileSync('nhanvien.tsv','utf8').trim().split('\n').map(l=>l.split('\t'));
function mkSS(sh){ return {getName:()=>'File lịch thử',getId:()=>'LICHFILE',getUrl:()=>'https://docs.google.com/spreadsheets/d/LICHFILE',setSpreadsheetTimeZone(){},getSheets:()=>sh,getSheetByName:n=>sh.find(s=>s.n===n)||null,insertSheet:n=>{const s=new Sheet(n);sh.push(s);return s;}}; }
const lichSheets=[new Sheet('Sheet1')]; const LICH=mkSS(lichSheets);
global.FILES={}; global.SpreadsheetApp={create:()=>LICH, openById:(id)=>FILES[id]||LICH, getActiveSpreadsheet:()=>({getSpreadsheetTimeZone:()=>'Asia/Ho_Chi_Minh',setSpreadsheetTimeZone(){},getSheets:()=>sheets,getSheetByName:n=>sheets.find(s=>s.n===n)||null,insertSheet:n=>{const s=new Sheet(n);sheets.push(s);return s;}})};
global.DriveApp={createFolder:()=>({getId:()=>'F1'}),getFolderById:()=>({getFoldersByName:()=>({hasNext:()=>false}),createFolder:()=>({createFile:()=>({setSharing(){},getId:()=>'IMG'})}),getFolders:()=>({hasNext:()=>false})}),Access:{},Permission:{}};
global.CacheService={getScriptCache:()=>({_m:(global._CACHE=global._CACHE||{}),get(k){ return this._m[k]===undefined?null:this._m[k]; },put(k,v){ this._m[k]=String(v); },remove(k){ delete this._m[k]; },getAll(ks){ const o={}; ks.forEach(k=>{ if(this._m[k]!==undefined) o[k]=this._m[k]; }); return o; },putAll(o){ Object.assign(this._m,o); },removeAll(ks){ ks.forEach(k=>delete this._m[k]); }})};
global.LockService={getScriptLock:()=>({waitLock(){},releaseLock(){}})};
global.ScriptApp={getProjectTriggers:()=>[],newTrigger:()=>({timeBased:()=>({onMonthDay:()=>({atHour:()=>({create(){}})})})})};
