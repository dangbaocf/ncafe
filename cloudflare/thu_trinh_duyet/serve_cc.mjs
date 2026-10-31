import http from 'node:http'; import W from '/home/claude/cloudflare/worker.mjs';
const env={APPS_SCRIPT_URL:'http://127.0.0.1:8781', API_KEY:'k'};
http.createServer(async (req,res)=>{ const body=await new Promise(r=>{let d='';req.on('data',c=>d+=c);req.on('end',()=>r(d));});
  const rq=new Request('http://127.0.0.1:8780'+req.url,{method:req.method,headers:req.headers,body:['GET','HEAD'].includes(req.method)?undefined:body});
  const out=await W.fetch(rq,env,{waitUntil(){}}); res.writeHead(out.status,Object.fromEntries(out.headers)); res.end(Buffer.from(await out.arrayBuffer())); }).listen(8780,()=>console.log('worker chấm công 8780'));
