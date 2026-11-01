/**
 * So 3 bên: AS Luong.gs vs D1 luong.js vs thamchieu.js (độc lập theo CLAUDE.md).
 * Dùng snapshot cố định /tmp/snapshot_t10.json.
 *
 * Chạy: node cloudflare/chamcong-a/scripts/so_3_ben.mjs
 */
import { tinhNhanh } from '../luong.js';
import { tinhThamChieu } from '../thamchieu.js';
import { cfgTat } from '../d1.js';
import fs from 'node:fs';

const snap = JSON.parse(fs.readFileSync('/tmp/snapshot_t10.json', 'utf-8'));
const nvMap = {}; snap.nv.forEach(n => nvMap[String(n.MaNV).toUpperCase()] = n);
const ccByNV = {}; snap.cc.forEach(r => { const m = r.MaNV.toUpperCase(); (ccByNV[m] = ccByNV[m] || []).push(r); });

const env = { DB: { prepare(sql) {
  const t = Object.entries(snap.cfg).map(([k, v]) => ({ Key: k, Value: String(v) }));
  return { _sql: sql.trim(), _args: [], bind(...a) { this._args = a; return this; },
    async all() { if (this._sql.replace(/\s+/g, ' ') === 'SELECT Key, Value FROM CaiDat') return { results: t }; throw new Error('mock'); },
    async first() { const r = await this.all(); return r.results[0] || null; },
    async run() { return {}; } };
}}};
cfgTat(env);

const stats = {
  khopAD: 0, // AS vs D1
  khopAT: 0, // AS vs ThamChieu
  khopDT: 0, // D1 vs ThamChieu
  khop3Ben: 0,
  tongNV: snap.bl.length
};
const detail = [];

for (const asRow of snap.bl) {
  const ma = String(asRow.MaNV).toUpperCase();
  const nv = nvMap[ma];
  if (!nv) continue;
  const cc = ccByNV[ma] || [];
  const d1 = await tinhNhanh(env, nv, cc, '2026-10', snap.nhap, snap.ung, snap.muc);
  const tc = tinhThamChieu(nv, cc, '2026-10', snap.cfg, snap.nhap, snap.ung);

  // So gio + com + thuc với tolerance ≤ 1
  const dAD = Math.abs(asRow.thuc - d1.thuc);
  const dAT = Math.abs(asRow.thuc - tc.thuc);
  const dDT = Math.abs(d1.thuc - tc.thuc);

  const khopAD = dAD <= 1;
  const khopAT = dAT <= 1;
  const khopDT = dDT <= 1;
  if (khopAD) stats.khopAD++;
  if (khopAT) stats.khopAT++;
  if (khopDT) stats.khopDT++;
  if (khopAD && khopAT && khopDT) stats.khop3Ben++;

  if (!(khopAD && khopAT && khopDT)) {
    detail.push({
      ma, ten: asRow.Ten, codinh: d1.codinh,
      thucAS: asRow.thuc, thucD1: d1.thuc, thucTC: tc.thuc,
      gioAS: asRow.gio, gioD1: d1.gio, gioTC: tc.gio,
      tienLuongAS: asRow.tienLuong, tienLuongD1: d1.tienLuong, tienLuongTC: tc.tienLuong,
      choXN: asRow.choXN
    });
  }
}

console.log(`\n=== SO 3 BÊN (snapshot cố định, ${snap.bl.length} NV T10/2026) ===\n`);
console.log(`  AS ↔ D1:        ${stats.khopAD}/${stats.tongNV}  (lệch ${stats.tongNV - stats.khopAD})`);
console.log(`  AS ↔ ThamChiếu: ${stats.khopAT}/${stats.tongNV}  (lệch ${stats.tongNV - stats.khopAT})`);
console.log(`  D1 ↔ ThamChiếu: ${stats.khopDT}/${stats.tongNV}  (lệch ${stats.tongNV - stats.khopDT})`);
console.log(`  3 bên khớp:     ${stats.khop3Ben}/${stats.tongNV}\n`);

if (detail.length) {
  console.log(`--- ${detail.length} NV có lệch (≠ 3 bên) ---`);
  detail.slice(0, 25).forEach(d => {
    const warn = d.choXN > 0 ? ` (Chờ xác nhận: ${d.choXN})` : '';
    console.log(`  ${d.ma} ${d.ten} [${d.codinh ? 'FT' : 'Giờ'}]${warn}: thuc AS=${d.thucAS} D1=${d.thucD1} TC=${d.thucTC}`);
    console.log(`     tienLuong AS=${d.tienLuongAS} D1=${d.tienLuongD1} TC=${d.tienLuongTC}`);
    console.log(`     gio AS=${d.gioAS} D1=${d.gioD1} TC=${d.gioTC}`);
  });
  if (detail.length > 25) console.log(`  … (còn ${detail.length - 25} NV)`);
}

// Lưu kết quả
fs.writeFileSync('/tmp/so_3_ben_result.json', JSON.stringify({ stats, detail }, null, 2));
console.log('\nKết quả chi tiết: /tmp/so_3_ben_result.json');
