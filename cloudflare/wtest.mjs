import worker from '/home/claude/cloudflare/worker.mjs';
const env={APPS_SCRIPT_URL:'https://script.google.com/macros/s/X/exec', API_KEY:'k1'};
let last=null; globalThis.fetch=async (u,o)=>{ last={u,o}; const b=JSON.parse(o.body); return new Response(JSON.stringify({ok:true,echo:b.fn,key:b.key,args:b.args}),{headers:{'content-type':'application/json; charset=utf-8'}}); };
const api=(fn,args)=>worker.fetch(new Request('https://caphemuoihue.com/cham-cong/api',{method:'POST',body:JSON.stringify({fn,args})}),env);
const r1=await worker.fetch(new Request('https://caphemuoihue.com/cham-cong?cs=TP&t=abc'),env); const h=await r1.text();
const j2=await (await api('qrInfo',[{cs:'TP',t:'abc'}])).json();
const r3=await api('bangLuong',[{pin:'1234'}]); const j3=await r3.json();
const r7=await api('rows',['NhanVien']); const r8=await api('doGet',[]);
const r4=await worker.fetch(new Request('https://caphemuoihue.com/lich-cua-toi'),env); const r5=await worker.fetch(new Request('https://caphemuoihue.com/khao-sat/'),env); const r6=await worker.fetch(new Request('https://caphemuoihue.com/abc'),env);
const q=await worker.fetch(new Request('https://caphemuoihue.com/quan-ly'),env); const qh=await q.text();
globalThis.fetch=async()=>new Response('<html>lỗi</html>',{headers:{'content-type':'text/html'}}); const r9=await api('qrInfo',[{}]);
console.log(JSON.stringify({page:r1.status, coShim:h.includes('/cham-cong/api'), docURL:h.includes("_q.get('cs')"), api:j2.echo, khoaGui:last && JSON.parse(last.o.body).key,
  quanLy:q.status, quanLyShim:qh.includes('/cham-cong/api'), quanLyKhongCache:q.headers.get('cache-control'), bangLuongQuaWorker:j3.echo, rowsBiChan:r7.status, doGetBiChan:r8.status, googleLoiHTML:r9.status, gc:r4.status, ks:r5.status, nf:r6.status}));
