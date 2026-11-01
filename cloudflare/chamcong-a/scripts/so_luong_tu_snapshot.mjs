/**
 * So lương D1 vs Apps Script DÙNG SNAPSHOT CỐ ĐỊNH (/tmp/snapshot_t10.json).
 * Chạy nhiều lần → kết quả không đổi (không bị data race).
 *
 * Chạy: node cloudflare/chamcong-a/scripts/so_luong_tu_snapshot.mjs
 */
import { tinhNhanh } from '../luong.js';
import { cfgTat } from '../d1.js';
import fs from 'node:fs';

const snap = JSON.parse(fs.readFileSync('/tmp/snapshot_t10.json', 'utf-8'));
console.log('Snapshot lúc: ' + snap.taoLuc + ' · ' + snap.cc.length + ' lượt · ' + snap.bl.length + ' NV AS · ' + snap.nv.length + ' NV master');

const nvMap = {}; snap.nv.forEach(n => nvMap[String(n.MaNV).toUpperCase()] = n);
const ccByNV = {}; snap.cc.forEach(r => { const m = r.MaNV.toUpperCase(); (ccByNV[m] = ccByNV[m] || []).push(r); });

const env = { DB: {
  prepare(sql) {
    const t = Object.entries(snap.cfg).map(([k, v]) => ({ Key: k, Value: String(v) }));
    return {
      _sql: sql.trim(), _args: [], bind(...a) { this._args = a; return this; },
      async all() { if (this._sql.replace(/\s+/g, ' ') === 'SELECT Key, Value FROM CaiDat') return { results: t }; throw new Error('mock: ' + this._sql); },
      async first() { const r = await this.all(); return r.results[0] || null; },
      async run() { return {}; }
    };
  }
}};
cfgTat(env);

const soKhop = { gio: 0, com: 0, tienLuong: 0, tn: 0, thuc: 0, gioTC: 0, gioThieu: 0, lcb: 0 };
const lech = [];
for (const asRow of snap.bl) {
  const ma = String(asRow.MaNV).toUpperCase();
  const nv = nvMap[ma];
  if (!nv) { lech.push({ ma, loi: 'không thấy NV master' }); continue; }
  const cc = ccByNV[ma] || [];
  const d1 = await tinhNhanh(env, nv, cc, '2026-10', snap.nhap, snap.ung, snap.muc);

  const diffs = {
    gio: Math.abs((d1.gio || 0) - (asRow.gio || 0)),
    com: Math.abs((d1.tienCom || 0) - (asRow.com || 0)),
    tienLuong: Math.abs((d1.tienLuong || 0) - (asRow.tienLuong || 0)),
    tn: Math.abs((d1.tn || 0) - (asRow.tn || 0)),
    thuc: Math.abs((d1.thuc || 0) - (asRow.thuc || 0)),
    gioTC: Math.abs((d1.gioTC || 0) - (asRow.gioTC || 0)),
    gioThieu: Math.abs((d1.gioThieu || 0) - (asRow.gioThieu || 0)),
    lcb: Math.abs((d1.lcb || 0) - (asRow.lcb || 0))
  };
  if (diffs.gio <= 0.02) soKhop.gio++;
  if (diffs.com <= 0.02) soKhop.com++;
  if (diffs.tienLuong <= 0.5) soKhop.tienLuong++;
  if (diffs.tn <= 1) soKhop.tn++;
  if (diffs.thuc <= 1) soKhop.thuc++;
  if (diffs.gioTC <= 0.02) soKhop.gioTC++;
  if (diffs.gioThieu <= 0.02) soKhop.gioThieu++;
  if (diffs.lcb <= 0.5) soKhop.lcb++;

  if (diffs.gio > 0.02 || diffs.com > 0.5 || diffs.thuc > 5 || diffs.gioTC > 0.02 || diffs.gioThieu > 0.02) {
    lech.push({
      ma, ten: asRow.Ten, codinh: d1.codinh,
      gioAS: asRow.gio, gioD1: d1.gio, dGio: diffs.gio,
      gioTCAS: asRow.gioTC, gioTCD1: d1.gioTC, dGioTC: diffs.gioTC,
      gioThieuAS: asRow.gioThieu, gioThieuD1: d1.gioThieu, dGioThieu: diffs.gioThieu,
      comAS: asRow.com, comD1: d1.tienCom, dCom: diffs.com,
      tienAS: asRow.tienLuong, tienD1: d1.tienLuong, dTien: diffs.tienLuong,
      lcbAS: asRow.lcb, lcbD1: d1.lcb,
      luongAS: asRow.luong, luongD1: d1.luongGio,
      thucAS: asRow.thuc, thucD1: d1.thuc, dThuc: diffs.thuc
    });
  }
}

const N = snap.bl.length;
console.log(`\n=== KẾT QUẢ (${N} NV, snapshot cố định) ===`);
console.log(`  Giờ:          ${soKhop.gio}/${N}`);
console.log(`  Giờ tăng ca:  ${soKhop.gioTC}/${N}`);
console.log(`  Giờ thiếu:    ${soKhop.gioThieu}/${N}`);
console.log(`  Cơm:          ${soKhop.com}/${N}`);
console.log(`  LCB (lương CB): ${soKhop.lcb}/${N}`);
console.log(`  Tiền lương:   ${soKhop.tienLuong}/${N}`);
console.log(`  Tổng nhận:    ${soKhop.tn}/${N}`);
console.log(`  Thực nhận:    ${soKhop.thuc}/${N}`);
console.log(`  Lệch đáng kể: ${lech.length}`);

if (lech.length) {
  console.log('\n--- Chi tiết LỆCH ---');
  lech.slice(0, 15).forEach(l => {
    const codinh = l.codinh ? '[FT]' : '';
    console.log(`  ${l.ma} ${l.ten} ${codinh}:`);
    console.log(`     gio AS=${l.gioAS} D1=${l.gioD1} (d=${l.dGio.toFixed(2)})`);
    if (l.dGioTC > 0.02) console.log(`     gioTC AS=${l.gioTCAS} D1=${l.gioTCD1}`);
    if (l.dGioThieu > 0.02) console.log(`     gioThieu AS=${l.gioThieuAS} D1=${l.gioThieuD1}`);
    if (l.dCom > 0.5) console.log(`     com AS=${l.comAS} D1=${l.comD1}`);
    if (l.dTien > 5) console.log(`     tienLuong AS=${l.tienAS} D1=${l.tienD1}`);
    console.log(`     thuc AS=${l.thucAS} D1=${l.thucD1} (d=${l.dThuc.toFixed(1)})  luongGio AS=${l.luongAS} D1=${l.luongD1}  lcb AS=${l.lcbAS} D1=${l.lcbD1}`);
  });
  if (lech.length > 15) console.log(`  … (còn ${lech.length - 15} NV)`);
}

fs.writeFileSync('/tmp/so_luong_snapshot_result.json', JSON.stringify({ soKhop, lech, N, snapTaoLuc: snap.taoLuc }, null, 2));
console.log('\nKết quả chi tiết: /tmp/so_luong_snapshot_result.json');
