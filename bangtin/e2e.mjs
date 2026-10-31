import W from './worker.mjs';
import { makeD1 } from './d1mock.mjs';
import fs from 'node:fs';
const ve = JSON.parse(fs.readFileSync('/tmp/ve.json', 'utf8'));
const env = { DB: makeD1(), FEED_SECRET: 'khoa-bang-tin-THU', ADMIN_PIN: '99', QL_PIN: '88', DEV_MODE: '1' };
const B = 'http://127.0.0.1:8770';
const go = async (path, o = {}) => { const h = { 'Content-Type': 'application/json' }; if (o.t) h.Authorization = 'Bearer ' + o.t; if (o.key) h['X-Feed-Key'] = o.key;
  const r = await W.fetch(new Request(B + path, { method: o.body ? 'POST' : 'GET', headers: h, body: o.body ? JSON.stringify(o.body) : undefined }), env); const tx = await r.text(); let j = null; try { j = JSON.parse(tx); } catch (e) {} return { s: r.status, j, tx }; };
const KQ = []; const ok = (ten, dk, ct = '') => KQ.push([dk ? '✔' : '✘', ten, ct]);
const scripts = (h) => [...h.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
// 1. trang + cú pháp script trong trang
for (const p of ['/bangtin/bar', '/bangtin']) { const r = await go(p); let loi = ''; try { scripts(r.tx).forEach(s => new Function(s)); } catch (e) { loi = e.message; } ok('Trang ' + p + ' mở được, script đúng cú pháp', r.s === 200 && !loi, loi); }
ok('Thanh tin là "Góc trò chuyện Ncafe"', (await go('/bangtin/bar')).tx.includes('Góc trò chuyện Ncafe'));
// 2. vé của app Chấm công
const bar = await go('/bangtin/api/bar', { t: ve.nv }); ok('Vé nhân viên do app Chấm công ký được chấp nhận', bar.s === 200 && bar.j.me.code === ve.ma, JSON.stringify(bar.j && bar.j.me));
ok('Vé sai bị từ chối', (await go('/bangtin/api/bar', { t: ve.nv.replace(/.$/, c => c === 'a' ? 'b' : 'a') })).s === 401);
// 3. góc trò chuyện
const ch = await go('/bangtin/api/chat', { t: ve.nv }); const L = ch.j && ch.j.scripts || [];
ok('Góc trò chuyện: 36 đoạn mặc định, mỗi đoạn 4–5 câu, 4 nhân vật', L.length === 36 && L.every(s => s.length >= 4 && s.length <= 5) && new Set(L.flat().map(m => m.w)).size === 4, L.length + ' đoạn');
ok('Nhịp đổi chủ đề mặc định 5–10 phút', JSON.stringify(ch.j.phut) === '[5,10]');
ok('Biết tên người xem để chèn {ten}', ch.j.me.name === ve.ten, ch.j.me.name);
// 4. sự kiện vào ca từ app → nhân viên đăng bài
const hk = await go('/bangtin/api/hook', { key: 'khoa-bang-tin-THU', body: { type: 'in', code: ve.ma, name: ve.ten, store: 'TD', ts: Date.now() } });
const sai = await go('/bangtin/api/hook', { key: 'sai', body: { type: 'in', code: '304' } });
const post = await go('/bangtin/api/post', { t: ve.nv, body: { text: 'Tản Đà có ai ăn trưa không?', options: ['Có', 'Không'] } });
const bar2 = await go('/bangtin/api/bar', { t: ve.nv });
ok('Báo vào ca (khoá đúng) → nhân viên đăng được câu hỏi, hiện trên thanh tin', hk.s === 200 && sai.s === 403 && post.j && post.j.ok && bar2.j.items.some(x => x.kind === 'question'), JSON.stringify(post.j));
// 5. admin sửa góc trò chuyện
const ad = await go('/bangtin/api/settings', { t: ve.admin }); const qlSet = await go('/bangtin/api/settings', { t: ve.ql });
const luu = await go('/bangtin/api/settings', { t: ve.admin, body: { chat: 'Bé Muối | Chào {ten}!\nPhin | Hello\nChị Kem | Hi\nAnh Đá | Yo\n---\nBé Muối | Đoạn 2\nPhin | ok\nChị Kem | ok\nAnh Đá | ok', chat_phut: '6-8' } });
const ch2 = await go('/bangtin/api/chat', { t: ve.nv });
ok('Admin (vé từ trang quản lý) sửa Góc trò chuyện: 2 đoạn, nhịp 6–8 phút; quản lý không vào Cài đặt được', ad.s === 200 && typeof ad.j.chat === 'string' && qlSet.s === 400 && luu.s === 200 && ch2.j.scripts.length === 2 && JSON.stringify(ch2.j.phut) === '[6,8]', JSON.stringify({ ad: ad.s, ql: qlSet.s, n: ch2.j && ch2.j.scripts.length, phut: ch2.j && ch2.j.phut }));
// 6. đồng bộ nhân viên + việc định kỳ
const st = await go('/bangtin/api/hook', { key: 'khoa-bang-tin-THU', body: { type: 'staff', list: [{ code: ve.ma, name: 'Võ Thị Đan', store: 'TD', dob: '1999-11-20', role: 'nv' }] } });
let tickLoi = ''; try { await new Promise((res, rej) => W.scheduled({}, env, { waitUntil: p => p.then(res, rej) })); } catch (e) { tickLoi = e.message; }
ok('Đồng bộ nhân viên + chạy việc định kỳ (5 phút) không lỗi', st.s === 200 && st.j.count === 1 && !tickLoi, tickLoi);
for (const k of KQ) console.log(k[0], k[1], k[2] ? '— ' + k[2] : '');
console.log('KẾT QUẢ:', KQ.filter(k => k[0] === '✔').length + '/' + KQ.length);
