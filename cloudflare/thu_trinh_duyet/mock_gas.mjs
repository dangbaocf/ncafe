import http from 'node:http'; import fs from 'node:fs';
const D=JSON.parse(fs.readFileSync('/tmp/lct_data.json','utf8')); const LOG=[];
http.createServer((req,res)=>{ let b=''; req.on('data',c=>b+=c); req.on('end',()=>{ let j={}; try{ j=JSON.parse(b);}catch(e){}
  const map={lichCuaToi:D.lich, gioCongCuaToi:D.gio, dsBaoHongNV:D.hong};
  const out=j.key!=='k'?{ok:false,msg:'Sai khoá API'}:(map[j.fn]||{ok:false,msg:'(giả) chưa có '+j.fn});
  fs.appendFileSync('/tmp/mock_gas.log', j.fn+'\n'); setTimeout(()=>{ res.writeHead(200,{'content-type':'application/json'}); res.end(JSON.stringify(out)); }, 1500); }); }).listen(8781,()=>console.log('google giả 8781'));
