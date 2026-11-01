/**
 * Pull BẢN CHỤP CỐ ĐỊNH T10 từ Apps Script → /tmp/snapshot_t10.json.
 * Mọi script so khớp sau dùng JSON này (không gọi AS lại) để không bị data race khi
 * anh Bảo đang chấm công thật.
 *
 * Chạy: node cloudflare/chamcong-a/scripts/pull_snapshot_t10.mjs
 */
import https from 'node:https';
import fs from 'node:fs';

function post(path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, 'https://ncafe-chamcong.dangbao-mt.workers.dev');
    const data = JSON.stringify(body);
    const req = https.request({
      method: 'POST', hostname: url.hostname, path: url.pathname,
      headers: {
        'content-type': 'application/json', 'user-agent': 'ncafe-snapshot/1.0',
        'content-length': Buffer.byteLength(data)
      },
      rejectUnauthorized: false
    }, (res) => {
      let b = ''; res.on('data', c => b += c);
      res.on('end', () => { try { resolve(JSON.parse(b)); } catch (e) { reject(new Error('Parse: ' + b.slice(0, 200))); } });
    });
    req.on('error', reject);
    req.write(data); req.end();
  });
}

async function main() {
  const t0 = Date.now();
  console.log('Pull snapshot T10/2026…');

  const cfg = await post('/cham-cong/api', { fn: 'exportCaiDatAll', args: [] });
  console.log('  cfg: ' + cfg.soKhoa + ' khoá');

  const nv = await post('/cham-cong/api', { fn: 'exportNhanVienAll', args: [] });
  console.log('  nv:  ' + nv.so + ' NhanVien');

  const cc = await post('/cham-cong/api', { fn: 'exportChamCongThang', args: [{ thang: '2026-10' }] });
  console.log('  cc:  ' + cc.soCa + ' lượt chấm T10');

  const bl = await post('/cham-cong/api', { fn: 'exportBangLuongT10', args: [{ thang: '2026-10' }] });
  console.log('  bl:  ' + bl.soNV + ' NV trong bảng lương AS');

  const lsl = await post('/cham-cong/api', { fn: 'exportLichSuLuong', args: [] });
  console.log('  lsLuong: ' + (lsl.lsLuong || []).length + ' dòng · LuongKhoang: ' + (lsl.luongKhoang || []).length);

  const snapshot = {
    taoLuc: new Date().toISOString(),
    thang: '2026-10',
    cfg: cfg.cfg,
    nv: nv.list,
    cc: cc.cc,
    bl: bl.list,
    nhap: bl.nhap || {},
    ung: bl.ung || {},
    muc: bl.muc || { an: {}, them: [] },
    le: bl.le || {},
    lsLuong: lsl.lsLuong || [],
    luongKhoang: lsl.luongKhoang || []
  };

  const path = '/tmp/snapshot_t10.json';
  fs.writeFileSync(path, JSON.stringify(snapshot, null, 2));
  console.log('\nSnapshot lưu: ' + path + ' (' + ((Date.now() - t0) / 1000).toFixed(1) + 's)');
  console.log('  file size: ' + (fs.statSync(path).size / 1024).toFixed(1) + ' KB');
}
main().catch(e => { console.error('FAIL:', e); process.exit(1); });
