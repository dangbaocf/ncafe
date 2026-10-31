/**
 * So lương toàn bộ NV T10/2026: Apps Script bangLuong (nguồn thật) vs tinhNhanh skeleton D1.
 *
 * Mục đích: chứng minh "lương chạy ngầm" trên Cloudflare. Vì tinhNhanh là SKELETON,
 * lệch là chắc chắn (tăng ca, nghỉ có lương, phụ cấp, FT fix, mục cộng/trừ chưa port).
 * Script này RA BÁO CÁO: khớp N / lệch M + nguyên nhân.
 *
 * Chạy: node cloudflare/chamcong-a/scripts/so_luong_t10.mjs
 */

import { tinhNhanh, luongGioNV, tinhComNgay, trangThaiRow } from '../luong.js';
import { cfgTat } from '../d1.js';
import https from 'node:https';

const WORKER = 'https://ncafe-chamcong.dangbao-mt.workers.dev';

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const url = new URL(path, WORKER);
    const req = https.request({
      method: 'POST', hostname: url.hostname, path: url.pathname,
      headers: { 'content-type': 'application/json', 'user-agent': 'ncafe-so-luong/1.0', 'content-length': Buffer.byteLength(data) },
      rejectUnauthorized: false
    }, (res) => {
      let b = '';
      res.on('data', (c) => (b += c));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(b) }); }
        catch (e) { resolve({ status: res.statusCode, body: b.slice(0, 300) }); }
      });
    });
    req.on('error', reject);
    req.write(data); req.end();
  });
}

/** Mock env.DB với CaiDat từ Apps Script – để luongGioNV/tinhComNgay đọc đúng cfg. */
function mkEnv(cfg) {
  const t = { CaiDat: Object.entries(cfg).map(([k, v]) => ({ Key: k, Value: String(v) })) };
  const env = {
    DB: {
      prepare(sql) {
        return {
          _sql: sql.trim(), _args: [], bind(...a) { this._args = a; return this; },
          async all() { if (this._sql.replace(/\s+/g, ' ') === 'SELECT Key, Value FROM CaiDat') return { results: t.CaiDat }; throw new Error('mock: ' + this._sql.slice(0,60)); },
          async first() { const rs = await this.all(); return rs.results[0] || null; },
          async run() { return { success: true }; }
        };
      }
    }
  };
  cfgTat(env);
  return env;
}

async function main() {
  console.log('=== So lương T10/2026 (Apps Script bangLuong vs tinhNhanh D1) ===\n');

  console.log('[1/4] Pull CaiDat từ Apps Script…');
  const rCfg = await post('/cham-cong/api', { fn: 'exportCaiDatAll', args: [] });
  if (!rCfg.body || !rCfg.body.ok) { console.error('Lỗi cfg:', rCfg); process.exit(1); }
  console.log('  ' + rCfg.body.soKhoa + ' khoá CaiDat');

  console.log('[2/4] Pull NhanVien từ Apps Script…');
  const rNV = await post('/cham-cong/api', { fn: 'exportNhanVienAll', args: [] });
  if (!rNV.body || !rNV.body.ok) { console.error('Lỗi NV:', rNV); process.exit(1); }
  const nvMap = {}; rNV.body.list.forEach(n => nvMap[String(n.MaNV).toUpperCase()] = n);
  console.log('  ' + rNV.body.so + ' NhanVien');

  console.log('[3/4] Pull ChamCong T10 từ Apps Script…');
  const rCC = await post('/cham-cong/api', { fn: 'exportChamCongThang', args: [{ thang: '2026-10' }] });
  if (!rCC.body || !rCC.body.ok) { console.error('Lỗi CC:', rCC); process.exit(1); }
  const ccByNV = {}; rCC.body.cc.forEach(r => { const m = r.MaNV.toUpperCase(); (ccByNV[m] = ccByNV[m] || []).push(r); });
  console.log('  ' + rCC.body.soCa + ' lượt chấm, ' + Object.keys(ccByNV).length + ' NV có chấm');

  console.log('[4/4] Pull bảng lương Apps Script (nguồn thật) + tính D1 song song…');
  const rBL = await post('/cham-cong/api', { fn: 'exportBangLuongT10', args: [{ thang: '2026-10' }] });
  if (!rBL.body || !rBL.body.ok) { console.error('Lỗi BL:', rBL); process.exit(1); }
  const blAS = rBL.body.list;
  const nhap = rBL.body.nhap || {};
  const ung  = rBL.body.ung  || {};
  const muc  = rBL.body.muc  || { an: {}, them: [] };
  console.log('  Apps Script tính ' + blAS.length + ' NV, nhap=' + Object.keys(nhap).length + ' NV, ung=' + Object.keys(ung).length);

  const env = mkEnv(rCfg.body.cfg);

  const soKhop = { gio: 0, com: 0, tienLuong: 0, tn: 0, thuc: 0 };
  const lech = [];
  for (const asRow of blAS) {
    const ma = String(asRow.MaNV).toUpperCase();
    const nv = nvMap[ma];
    if (!nv) { lech.push({ ma, loi: 'không thấy NV' }); continue; }
    const cc = ccByNV[ma] || [];
    const d1 = await tinhNhanh(env, nv, cc, '2026-10', nhap, ung, muc);
    const dGio = Math.abs((d1.gio || 0) - (asRow.gio || 0));
    const dCom = Math.abs((d1.tienCom || 0) - (asRow.com || 0));
    const dLuong = Math.abs((d1.tienLuong || 0) - (asRow.tienLuong || 0));
    const dTn = Math.abs((d1.tn || 0) - (asRow.tn || 0));
    const dThuc = Math.abs((d1.thuc || 0) - (asRow.thuc || 0));

    if (dGio <= 0.02) soKhop.gio++;
    if (dCom <= 0.02) soKhop.com++;
    if (dLuong <= 0.5) soKhop.tienLuong++;
    if (dTn <= 1) soKhop.tn++;
    if (dThuc <= 1) soKhop.thuc++;

    if (dGio > 0.02 || dCom > 0.5 || dThuc > 5) {
      lech.push({
        ma, ten: asRow.Ten,
        gioAS: asRow.gio, gioD1: d1.gio,
        comAS: asRow.com, comD1: d1.tienCom,
        tienAS: asRow.tienLuong, tienD1: d1.tienLuong,
        tnAS: asRow.tn, tnD1: d1.tn,
        thucAS: asRow.thuc, thucD1: d1.thuc,
        codinh: d1.codinh, lcbAS: asRow.lcb, lcbD1: d1.lcb,
        gioTCAS: asRow.gioTC, gioTCD1: d1.gioTC,
        gioThieuAS: asRow.gioThieu, gioThieuD1: d1.gioThieu
      });
    }
  }

  console.log('\n=== KẾT QUẢ SO KHỚP T10 (' + blAS.length + ' NV) ===');
  console.log('  Giờ (sai số ≤ 0.02h):      ' + soKhop.gio + '/' + blAS.length);
  console.log('  Cơm (sai số ≤ 0.02):        ' + soKhop.com + '/' + blAS.length);
  console.log('  Tiền lương (sai số ≤ 0.5): ' + soKhop.tienLuong + '/' + blAS.length);
  console.log('  Tổng nhận TN (sai số ≤ 1): ' + soKhop.tn + '/' + blAS.length);
  console.log('  Thực nhận (sai số ≤ 1):    ' + soKhop.thuc + '/' + blAS.length);
  console.log('  Lệch đáng kể: ' + lech.length + ' NV\n');

  if (lech.length) {
    console.log('--- Chi tiết LỆCH ---');
    lech.slice(0, 20).forEach(l => {
      console.log(`  ${l.ma} ${l.ten}: gio ${l.gioAS}≠${l.gioD1}, com ${l.comAS}≠${l.comD1}, tien ${l.tienAS}≠${l.tienD1} (lương/h AS=${l.luongGioAS} D1=${l.luongGioD1})`);
    });
    if (lech.length > 20) console.log(`  … (còn ${lech.length - 20} NV lệch khác)`);
  }

  // Ghi JSON kết quả
  const path = '/tmp/so_luong_t10_' + new Date().toISOString().slice(0, 10) + '.json';
  const fs = await import('node:fs');
  fs.writeFileSync(path, JSON.stringify({
    thang: '2026-10', soNV: blAS.length, khop: soKhop, lech,
    luuY: 'tinhNhanh D1 là SKELETON: chỉ tính gio × luongGio + com. Chưa có: tăng ca duyệt, nghỉ có lương, FT cố định trừ trễ, mục cộng/trừ, tạm ứng, phụ cấp, ngày lễ. Lệch tienLuong là KỲ VỌNG, không phải bug.'
  }, null, 2));
  console.log('\nJSON chi tiết: ' + path);
}

main().catch(e => { console.error('❌ FAIL:', e.message, e.stack); process.exit(1); });
