import http from 'node:http';
import W from './worker.mjs';
import { makeD1 } from './d1mock.mjs';
const env = { DB: makeD1(), FEED_SECRET: 'khoa-bang-tin-THU', ADMIN_PIN: '99', QL_PIN: '88', DEV_MODE: '1' };
http.createServer(async (req, res) => {
  const body = await new Promise(r => { let d = ''; req.on('data', c => d += c); req.on('end', () => r(d)); });
  const rq = new Request('http://127.0.0.1:8770' + req.url, { method: req.method, headers: req.headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : body });
  const out = await W.fetch(rq, env); res.writeHead(out.status, Object.fromEntries(out.headers)); res.end(Buffer.from(await out.arrayBuffer()));
}).listen(8770, () => console.log('chạy ở 8770'));
