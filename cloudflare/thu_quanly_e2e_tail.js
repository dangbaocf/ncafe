;(async()=>{ const http=require('http'); const W=(await import('/home/claude/cloudflare/worker.mjs')).default;
  const env={APPS_SCRIPT_URL:'https://gas.local/exec', API_KEY:cfg('API_KEY')}; const realFetch=globalThis.fetch; globalThis.__soGoi={};
  globalThis.fetch=async(u,o)=>{ if(String(u).startsWith('https://gas.local/')){ const b=JSON.parse(o.body); __soGoi[b.fn]=(__soGoi[b.fn]||0)+1; const out=doPost({postData:{contents:o.body}}); return new Response(out.t,{headers:{'content-type':'application/json; charset=utf-8'}}); } return realFetch(u,o); };
  http.createServer(async(req,res)=>{ const body=await new Promise(r=>{ let d=''; req.on('data',c=>d+=c); req.on('end',()=>r(d)); });
    if(req.url==='/__goi'){ res.end(JSON.stringify(__soGoi)); return; }
    const out=await W.fetch(new Request('http://127.0.0.1:8771'+req.url,{method:req.method,headers:req.headers,body:['GET','HEAD'].includes(req.method)?undefined:body}),env);
    res.writeHead(out.status,Object.fromEntries(out.headers)); res.end(Buffer.from(await out.arrayBuffer())); }).listen(8771,()=>console.log('QL_READY'));
})();
