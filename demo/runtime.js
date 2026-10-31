/* ===== Môi trường Google Apps Script giả lập trong trình duyệt (chỉ cho demo) ===== */
(function(){
var REG={};   // id -> spreadsheet
function pad(n){ return String(n).padStart(2,'0'); }
function fmt(d,tz,f){ d=new Date(new Date(d).getTime()+7*3600e3); var t={yyyy:d.getUTCFullYear(),yy:String(d.getUTCFullYear()).slice(2),MM:pad(d.getUTCMonth()+1),dd:pad(d.getUTCDate()),HH:pad(d.getUTCHours()),H:d.getUTCHours(),mm:pad(d.getUTCMinutes()),m:d.getUTCMinutes(),ss:pad(d.getUTCSeconds()),d:d.getUTCDate()};
  return String(f).replace(/yyyy|yy|MM|dd|HH|H|mm|ss|m|d/g,function(k){ return t[k]; }); }

/* (29/10) Giống Google Sheet tiếng Việt: chữ tự đổi kiểu khi ghi (IP → số, "2026-10" → ngày, "06:30" → giờ, "0905…" → số…); cột định dạng văn bản ('@') hoặc dấu ' ở đầu thì giữ chữ */
function vnDoi(x){ if(typeof x!=='string') return x; if(x.charAt(0)==="'") return x.slice(1); var t=x.trim(); if(t==='') return x;
  if(/^\d{1,3}(\.\d{3})+$/.test(t)) return +t.replace(/\./g,'');
  if(/^-?\d+(,\d+)?$/.test(t)) return +t.replace(',','.');
  if(/^\d{4}-\d{1,2}$/.test(t)) return new Date(t.replace(/-(\d)$/,'-0$1')+'-01T00:00:00+07:00');
  if(/^\d{4}-\d{2}-\d{2}$/.test(t)) return new Date(t+'T00:00:00+07:00');
  if(/^\d{1,2}:\d{2}(:\d{2})?$/.test(t)){ var p=t.split(':'); return new Date(Date.UTC(1899,11,30,+p[0],+p[1],+(p[2]||0))-7*3600e3); }
  var m=t.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?$/); if(m && +m[1]<=31 && +m[2]<=12) return new Date((m[3]||'2026')+'-'+('0'+m[2]).slice(-2)+'-'+('0'+m[1]).slice(-2)+'T00:00:00+07:00');
  if(/^(true|false)$/i.test(t)) return /^true$/i.test(t); return x; }
function vnO(sh, j, x){ return (sh.cotChu && sh.cotChu[j])?(typeof x==='string' && x.charAt(0)==="'"?x.slice(1):x):vnDoi(x); }
function chain(target){ return new Proxy(target,{get:function(o,k){ if(k in o) return o[k]; if(typeof k==='symbol') return undefined; return function(){ return chain(o); }; }}); }
function Range(sh,r,c,nr,nc){ this.sh=sh; this.r=r; this.c=c; this.nr=nr; this.nc=nc; }
Range.prototype.getValues=function(){ var o=[]; for(var i=0;i<this.nr;i++){ var row=[]; for(var j=0;j<this.nc;j++){ var v=(this.sh.d[this.r-1+i]||[])[this.c-1+j]; row.push(v===undefined?'':v); } o.push(row); } return o; };
Range.prototype.getValue=function(){ return this.getValues()[0][0]; };
Range.prototype.getBackgrounds=function(){ var o=[]; for(var i=0;i<this.nr;i++){ var row=[]; for(var j=0;j<this.nc;j++){ row.push(((this.sh.bg||[])[this.r-1+i]||[])[this.c-1+j]||'#ffffff'); } o.push(row); } return o; };
Range.prototype.setBackgrounds=function(b){ var s=this.sh; s.bg=s.bg||[]; for(var i=0;i<b.length;i++){ s.bg[this.r-1+i]=s.bg[this.r-1+i]||[]; for(var j=0;j<b[i].length;j++) s.bg[this.r-1+i][this.c-1+j]=b[i][j]||'#ffffff'; } return chain(this); };
Range.prototype.getDisplayValues=function(){ return this.getValues().map(function(r){ return r.map(String); }); };
Range.prototype.setValues=function(v){ var s=this; if(v.length!==this.nr) throw new Error('Số dòng trong dữ liệu không khớp với số dòng trong dải ô. Dữ liệu có '+v.length+' nhưng dải ô có '+this.nr+'.'); v.forEach(function(r){ if(r.length!==s.nc) throw new Error('Số cột trong dữ liệu không khớp với số cột trong dải ô. Dữ liệu có '+r.length+' nhưng dải ô có '+s.nc+'.'); }); v.forEach(function(row,i){ row.forEach(function(x,j){ var R=s.r-1+i; s.sh.d[R]=s.sh.d[R]||[]; s.sh.d[R][s.c-1+j]=vnO(s.sh, s.c-1+j, x); }); }); return chain(this); };
Range.prototype.setValue=function(x){ return this.setValues([[x]]); };
Range.prototype.setNumberFormat=function(f){ if(f==='@'){ this.sh.cotChu=this.sh.cotChu||{}; for(var k=0;k<this.nc;k++) this.sh.cotChu[this.c-1+k]=1; } return chain(this); };
Range.prototype.clearContent=function(){ for(var i=0;i<this.nr;i++) this.sh.d[this.r-1+i]=[]; return chain(this); };
Range.prototype.clear=Range.prototype.clearContent;
Range.prototype.getRow=function(){ return this.r; }; Range.prototype.getNumRows=function(){ return this.nr; };
function Sheet(n,ss){ this.n=n; this.d=[]; this.ss=ss; this.id=Math.floor(Math.random()*1e6); }
Sheet.prototype.getName=function(){ return this.n; }; Sheet.prototype.setName=function(n){ this.n=n; return chain(this); };
Sheet.prototype.clear=function(){ this.d=[]; this.bg=[]; return chain(this); }; Sheet.prototype.clearContents=Sheet.prototype.clear;
Sheet.prototype.getLastRow=function(){ var l=0; this.d.forEach(function(r,i){ if(r && r.some(function(x){ return x!=='' && x!==undefined && x!==null; })) l=i+1; }); return l; };
Sheet.prototype.getLastColumn=function(){ return Math.max(0,Math.max.apply(null,[0].concat(this.d.map(function(r){ return r?r.length:0; })))); };
Sheet.prototype.getMaxRows=function(){ return Math.max(1000,this.d.length); }; Sheet.prototype.getMaxColumns=function(){ return 26; };
Sheet.prototype.getRange=function(a,b,c,d){ if(typeof a==='string'){ var mm=a.match(/^([A-Z]+)\d*:([A-Z]+)\d*$/), so=function(t){ return t.split('').reduce(function(n,ch){ return n*26+ch.charCodeAt(0)-64; },0); }; if(mm){ var c1=so(mm[1]); return chain(new Range(this,1,c1,1000,so(mm[2])-c1+1)); } return chain(new Range(this,1,1,1,1)); } if((c!==undefined&&c<1)||(d!==undefined&&d<1)) throw new Error('Số hàng / cột trong dải ô phải tối thiểu là 1.'); return chain(new Range(this,a,b,c||1,d||1)); };
Sheet.prototype.getDataRange=function(){ return chain(new Range(this,1,1,Math.max(1,this.getLastRow()),Math.max(1,this.getLastColumn()))); };
Sheet.prototype.appendRow=function(r){ var sh=this; this.d[this.getLastRow()]=r.map(function(x,j){ return vnO(sh, j, x); }); return chain(this); };
Sheet.prototype.deleteRow=function(i){ this.d.splice(i-1,1); return chain(this); };
Sheet.prototype.getSheetId=function(){ return this.id; };
function SS(id,name){ this.id=id; this.name=name||id; this.sh=[]; REG[id]=this; }
SS.prototype.getId=function(){ return this.id; }; SS.prototype.getName=function(){ return this.name; };
SS.prototype.getUrl=function(){ return 'https://docs.google.com/spreadsheets/d/'+this.id; };
SS.prototype.getSheets=function(){ return this.sh.map(chain); };
SS.prototype.getSheetByName=function(n){ var s=this.sh.filter(function(x){ return x.n===n; })[0]; return s?chain(s):null; };
SS.prototype.insertSheet=function(n){ var s=new Sheet(n,this); this.sh.push(s); return chain(s); };
SS.prototype.deleteSheet=function(s){ this.sh=this.sh.filter(function(x){ return x.n!==s.n; }); };
SS.prototype.setSpreadsheetTimeZone=function(){}; SS.prototype.getSpreadsheetTimeZone=function(){ return 'Asia/Ho_Chi_Minh'; };
SS.prototype.setActiveSheet=function(){};
var hashBytes=function(s){ s=String(s); var out=[], h=2166136261; for(var k=0;k<32;k++){ for(var i=0;i<s.length;i++){ h^=s.charCodeAt(i)+k; h=Math.imul(h,16777619)>>>0; } out.push(h&255); } return out; };
// 2 file lịch của quán (demo): có sẵn tab tháng trống; app ghi tab "Gợi ý dd.mm" vào đây
(function(){ [['1u_WaOGqMjkhLxwaYqS9HqUZDHTH60cO7FtrRjEtuJrs','Lịch CFMH - NV 2026'],['1-xHHjHV9X59i91iAKR3zKhXy6PGhhE8ieXym8_LLmmo','LĐD - Lịch NV']].forEach(function(f){ var x=new SS(f[0],f[1]); x.insertSheet('Lịch T10'); x.insertSheet('Lịch T11'); }); })();
window.makeEnv=function(appId, name){
  var me=REG[appId]||new SS(appId,name);
  return {
    SpreadsheetApp:{getActiveSpreadsheet:function(){ return chain(me); }, openById:function(id){ var s=REG[id]; if(!s) throw new Error('Không mở được Sheet '+id); return chain(s); }, create:function(n){ var x=new SS('F'+Math.floor(Math.random()*1e9),n); x.insertSheet('Sheet1'); return chain(x); }},
    Utilities:{formatDate:fmt, computeDigest:function(a,s){ return hashBytes(s); }, DigestAlgorithm:{SHA_256:'SHA_256'}, base64EncodeWebSafe:function(b){ return btoa(String.fromCharCode.apply(null,b.map(function(x){return x&255;}))).replace(/\+/g,'-').replace(/\//g,'_'); },
      getUuid:function(){ return (crypto.randomUUID?crypto.randomUUID():String(Math.random()).slice(2)); }, newBlob:function(){ return {}; }, base64Decode:function(){ return []; }, sleep:function(){} },
    DriveApp:{createFolder:function(){ return {getId:function(){return 'F1';}, createFile:function(){ return {getId:function(){return 'IMG';}, setSharing:function(){}}; }}; }, getFolderById:function(){ return {createFile:function(){ return {getId:function(){return 'IMG';}, setSharing:function(){}}; }, getFoldersByName:function(){ return {hasNext:function(){return false;}}; }, createFolder:function(){ return {createFile:function(){ return {getId:function(){return 'IMG';}, setSharing:function(){}}; }}; }, getFolders:function(){ return {hasNext:function(){return false;}}; }}; }, Access:{}, Permission:{}},
    LockService:{getScriptLock:function(){ return {waitLock:function(){}, releaseLock:function(){}, tryLock:function(){ return true; }}; }},
    ScriptApp:{getService:function(){ return {getUrl:function(){ return 'https://demo.ncafe/'+appId; }}; }, getProjectTriggers:function(){ return []; }, newTrigger:function(){ return chain({}); }, deleteTrigger:function(){}},
    HtmlService:{createHtmlOutput:function(){ return chain({}); }, createTemplateFromFile:function(){ return chain({}); }, XFrameOptionsMode:{ALLOWALL:1}},
    PropertiesService:{getScriptProperties:function(){ var p={}; return {getProperty:function(k){return p[k]||null;}, setProperty:function(k,v){p[k]=v;}}; }},
    Logger:{log:function(){}}, Session:{getScriptTimeZone:function(){ return 'Asia/Ho_Chi_Minh'; }},
    UrlFetchApp:{fetch:function(url,o){ var m=String(url).match(/api\.telegram\.org\/bot[^/]*\/(\w+)/); if(!m) return {getContentText:function(){ return '{}'; }};
      if(m[1]==='getUpdates') return {getContentText:function(){ return JSON.stringify({ok:true,result:[['-1001','Ncafe Chấm công (chung)'],['-1101','Ncafe Trần Phú'],['-1102','Ncafe Đống Đa'],['-1103','Ncafe Tản Đà'],['-1104','Ncafe Trưng Nữ Vương'],['-1105','Ncafe Lê Đình Dương']].map(function(g){ return {message:{chat:{id:g[0],title:g[1],type:'group'}}}; })}); }};
      var b=JSON.parse(o.payload||'{}'), ten={'-1001':'Ncafe Chấm công (chung)','-1101':'Ncafe Trần Phú','-1102':'Ncafe Đống Đa','-1103':'Ncafe Tản Đà','-1104':'Ncafe Trưng Nữ Vương','-1105':'Ncafe Lê Đình Dương'}[String(b.chat_id)]||String(b.chat_id);
      (window.TG_LOG=window.TG_LOG||[]).unshift({nhom:ten, text:b.text, luc:new Date()}); try{ window.onTG && window.onTG(); }catch(e){}
      return {getContentText:function(){ return JSON.stringify({ok:true}); }}; }},
    ContentService:{createTextOutput:function(t){ return chain({t:t}); }, MimeType:{JSON:'json'}}
  };
};
window.loadApp=function(appId, name, code){
  var env=window.makeEnv(appId, name), keys=Object.keys(env), names=[], re=/^function\s+([A-Za-z0-9_$]+)\s*\(/gm, m;
  while((m=re.exec(code))) names.push(m[1]);
  var f=new Function(keys.join(','), code+'\nreturn {'+names.map(function(n){ return JSON.stringify(n)+':'+n; }).join(',')+'};');
  return f.apply(null, keys.map(function(k){ return env[k]; }));
};
window.REG_SS=REG;
})();
