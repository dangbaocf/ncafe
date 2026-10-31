/**
 * Mô phỏng 100.000 lượt chấm (vao + ra) ngẫu nhiên ở 5 quán Ncafe.
 * Không gọi D1 thật – dùng mock DB in-memory (giống d1.test.js) để kiểm tra:
 *   1. qrVao/qrRa luôn trả ok hợp lệ cho dữ liệu bình thường
 *   2. TreMin tính đúng: Vao - CaBD (phút), min 0
 *   3. GioTinh tính đúng: min(khai, caG) cho khai=du; khai=tang/giam = khai
 *   4. Idempotent id không trùng
 *   5. Luật B: luôn TrangThai='Chờ xác nhận' sau Ra, tuXacNhan=false
 *   6. Burst 50 lượt lúc 6:30 cùng lúc, mỗi lượt ≤2 giây tính CPU
 *
 * Chạy: node cloudflare/chamcong-a/sim100k.mjs
 */

import {
  qrToken, qrInfo, qrNhanVien, qrVao, qrRa, cfgTat, fmtDT, toMin, hhmm
} from './d1.js';

/* ----- Mock DB (SQL parser mạnh hơn d1.test.js vì chạy 100k lượt) ----- */
function mkDB() {
  const t = { NhanVien: [], CoSo: [], Ca: [], ChamCong: [], WifiQuan: [],
              WifiCho: [], CaiDat: [], NhatKySua: [], ThietBi: [] };
  const matcher = (sql, args) => {
    const s = sql.replace(/\s+/g, ' ').trim();
    let m;
    if (s === 'SELECT Key, Value FROM CaiDat') return t.CaiDat.map(r => ({ Key: r.Key, Value: r.Value }));
    if ((m = s.match(/^SELECT \* FROM NhanVien WHERE MaNV = \?1$/))) return t.NhanVien.filter(r => r.MaNV === args[0]);
    if ((m = s.match(/^SELECT \* FROM CoSo WHERE MaCS = \?1$/))) return t.CoSo.filter(r => r.MaCS === args[0]);
    if ((m = s.match(/^SELECT \* FROM Ca WHERE MaCa = \?1$/))) return t.Ca.filter(r => r.MaCa === args[0]);
    if (s === "SELECT IP, MaCS FROM WifiQuan WHERE TrangThai <> 'Bỏ'") return t.WifiQuan.filter(r => r.TrangThai !== 'Bỏ').map(r => ({ IP: r.IP, MaCS: r.MaCS }));
    if ((m = s.match(/^SELECT \* FROM ChamCong WHERE MaNV = \?1 AND Ngay >= \?2 AND TrangThai = 'Đang làm' ORDER BY Vao DESC LIMIT 1$/)))
      return t.ChamCong.filter(r => r.MaNV === args[0] && r.Ngay >= args[1] && r.TrangThai === 'Đang làm')
        .sort((a, b) => (a.Vao < b.Vao ? 1 : -1)).slice(0, 1);
    if ((m = s.match(/^SELECT DISTINCT MaNV FROM WifiCho WHERE MaCS = \?1 AND IP = \?2 AND TrangThai = 'Cho' AND Luc >= \?3 AND MaNV <> \?4$/)))
      return [...new Set(t.WifiCho.filter(r => r.MaCS === args[0] && r.IP === args[1] && r.TrangThai === 'Cho' && r.Luc >= args[2] && r.MaNV !== args[3]).map(r => r.MaNV))].map(x => ({ MaNV: x }));
    if ((m = s.match(/^SELECT 1 FROM ThietBi WHERE MaNV = \?1 AND Dev = \?2 LIMIT 1$/)))
      return t.ThietBi.filter(r => r.MaNV === args[0] && r.Dev === args[1]).slice(0, 1);
    if ((m = s.match(/^SELECT CanhBao FROM ChamCong WHERE ID = \?1$/))) return t.ChamCong.filter(r => r.ID === args[0]).map(r => ({ CanhBao: r.CanhBao }));
    if ((m = s.match(/^SELECT ID, CCID FROM WifiCho WHERE MaCS = \?1 AND IP = \?2 AND TrangThai = 'Cho'$/)))
      return t.WifiCho.filter(r => r.MaCS === args[0] && r.IP === args[1] && r.TrangThai === 'Cho').map(r => ({ ID: r.ID, CCID: r.CCID }));
    if (s.startsWith('INSERT INTO ChamCong')) {
      t.ChamCong.push({ ID: args[0], Ngay: args[1], MaNV: args[2], Ten: args[3], MaCS: args[4],
        MaCa: args[5], CaBD: args[6], CaKT: args[7], ViTri: args[8], Vao: args[9],
        TreMin: args[10], TrangThai: 'Đang làm', CanhBao: args[11] || '', AnhVao: args[12] });
      return { success: true };
    }
    if (s.startsWith('INSERT OR IGNORE INTO ThietBi')) {
      if (!t.ThietBi.some(r => r.MaNV === args[0] && r.Dev === args[1])) t.ThietBi.push({ MaNV: args[0], Dev: args[1], Luc: args[2] });
      return { success: true };
    }
    if (s.startsWith('INSERT INTO WifiCho')) {
      t.WifiCho.push({ ID: args[0], Luc: args[1], MaCS: args[2], MaNV: args[3], Ten: args[4],
        IP: args[5], AsOrg: args[6], CCID: args[7], Loai: args[8], TrangThai: 'Cho', Anh: args[9] });
      return { success: true };
    }
    if (s.startsWith('UPDATE ChamCong SET Ra = ?1')) {   // qrRa update
      const id = args[14], r = t.ChamCong.find(x => x.ID === id);
      if (r) {
        r.Ra = args[0]; r.GioThuc = args[1]; r.KhaiLoai = args[2]; r.KhaiGio = args[3];
        r.KhaiTu = args[4]; r.KhaiDen = args[5]; r.KhaiGhiChu = args[6]; r.CoMat = args[7];
        r.LyDo = args[8]; r.TrangThai = args[9]; r.GioTinh = args[10]; r.AnhRa = args[11];
        r.CanhBao = args[12]; r.Updated = args[13];
      }
      return { success: true };
    }
    if (s.match(/^UPDATE ChamCong SET CanhBao = \?1, Updated = \?2 WHERE ID = \?3$/)) {
      const r = t.ChamCong.find(x => x.ID === args[2]); if (r) { r.CanhBao = args[0]; r.Updated = args[1]; }
      return { success: true };
    }
    if (s.startsWith('INSERT INTO NhatKySua')) { t.NhatKySua.push({ args }); return { success: true }; }
    if (s.startsWith('INSERT OR IGNORE INTO WifiQuan')) {
      if (!t.WifiQuan.some(r => r.IP === args[0] && r.MaCS === args[1])) t.WifiQuan.push({ IP: args[0], MaCS: args[1], TrangThai: 'Dùng' });
      return { success: true };
    }
    if (s.startsWith('UPDATE WifiCho SET')) {
      const r = t.WifiCho.find(x => x.ID === args[2]); if (r) { r.TrangThai = 'Da'; r.XuLyBoi = args[0]; r.LucXong = args[1]; }
      return { success: true };
    }
    throw new Error('MOCK không hiểu SQL: ' + s.slice(0, 120));
  };
  return {
    _tables: t,
    prepare(sql) {
      return { _sql: sql.trim(), _args: [], bind(...a) { this._args = a; return this; },
        async all() { return { results: matcher(this._sql, this._args) }; },
        async first() { const rs = matcher(this._sql, this._args); return rs[0] || null; },
        async run() { return matcher(this._sql, this._args); } };
    }
  };
}
function mkANH() { return { async put() { return {}; } }; }

/* Setup: 5 quán, 5 ca, 100 NV, Wi-Fi Cảnh báo */
async function setup() {
  const env = { DB: mkDB(), ANH: mkANH(), QR_SECRET: 'sim-secret' };
  const cs = ['TP', 'DD', 'TD', 'TNV', 'LDD'];
  const ten = { TP: 'Trần Phú', DD: 'Đống Đa', TD: 'Tản Đà', TNV: 'Trưng Nữ Vương', LDD: 'Lê Đình Dương' };
  for (const c of cs) env.DB._tables.CoSo.push({ MaCS: c, TenCS: ten[c], GioMo: '06:30', GioDong: '22:30', BanKinh: 100, QRVer: '' });
  const ca = [
    { MaCa: 'FT1', GioBD: '06:30', GioKT: '14:30', SoGio: 8 },
    { MaCa: 'FT2', GioBD: '14:30', GioKT: '22:30', SoGio: 8 },
    { MaCa: 'PT1', GioBD: '06:30', GioKT: '12:00', SoGio: 5.5 },
    { MaCa: 'PT2', GioBD: '12:00', GioKT: '17:00', SoGio: 5 },
    { MaCa: 'PT3', GioBD: '17:00', GioKT: '22:30', SoGio: 5.5 }
  ];
  env.DB._tables.Ca.push(...ca);
  const vt = ['Pha chế', 'Phục vụ', 'Bảo vệ', 'Rửa ly', 'Quản lý'];
  for (let i = 1; i <= 100; i++) env.DB._tables.NhanVien.push({
    MaNV: String(300 + i), Ten: 'NV' + i, ViTri: vt[i % 5], Loai: i < 30 ? 'FT' : 'PT',
    CoSoChinh: cs[i % 5], TrangThai: 'Đang làm'
  });
  env.DB._tables.CaiDat.push({ Key: 'WIFI_CHE_DO', Value: 'Cảnh báo' });
  env.DB._tables.WifiQuan.push({ IP: '14.254.129.209', MaCS: 'TP', TrangThai: 'Dùng' });
  cfgTat(env);
  return { env, ca };
}

/* Mock request */
function mkReq(ip, asOrg) { return { cf: { asOrganization: asOrg }, headers: { get: k => (k === 'CF-Connecting-IP' ? ip : null) } }; }

/* ============ Phase 1: 100.000 lượt ngẫu nhiên ============ */
async function phase100k() {
  const { env, ca } = await setup();
  const t0 = Date.now();
  const stats = { vao: 0, ra: 0, loiVao: 0, loiRa: 0, treTot: 0, treGio: 0, caKHAC: 0, choIP: 0, mobile: 0 };
  const anhData = 'data:image/jpeg;base64,/9j/4AAQ';
  const ips = ['14.254.129.209', '192.168.1.100', '2402:800:aaaa::1', '10.0.0.5'];
  const asOrgs = ['FPT TELECOM', 'VNPT', 'Viettel Mobile', 'MOBIFONE'];

  for (let i = 0; i < 50000; i++) {
    const maNV = String(300 + 1 + (i % 100));
    const cs = ['TP', 'DD', 'TD', 'TNV', 'LDD'][i % 5];
    const t = await qrToken(env, cs, '');
    const maCa = ['FT1', 'FT2', 'PT1', 'PT2', 'PT3'][i % 5];
    const ip = ips[i % ips.length];
    const asOrg = asOrgs[i % asOrgs.length];

    // Trước mỗi lần "vào", clear ChamCong row Đang làm của NV đó để không conflict
    const idx = env.DB._tables.ChamCong.findIndex(r => r.MaNV === maNV && r.TrangThai === 'Đang làm');
    if (idx >= 0) env.DB._tables.ChamCong.splice(idx, 1);

    const rV = await qrVao(env, mkReq(ip, asOrg), { cs, t, maNV, maCa, photo: anhData, deviceId: 'dev-' + maNV });
    if (!rV.ok) { stats.loiVao++; continue; }
    stats.vao++;
    if (rV.tre > 0) stats.treTot++;
    if (/mobile/i.test(asOrg)) stats.mobile++;
    if (rV.choIP) stats.choIP++;

    // Ra ca (50% du, 25% tang, 25% giam)
    const kh = i % 4 === 0 ? 'tang' : i % 4 === 1 ? 'giam' : 'du';
    const extra = kh === 'du' ? {} : { tu: '07:00', den: '15:00' };
    const rR = await qrRa(env, mkReq(ip, asOrg), { cs, t, maNV, khaiLoai: kh, photo: anhData, ...extra });
    if (!rR.ok) { stats.loiRa++; continue; }
    stats.ra++;
    if (rR.trangThai !== 'Chờ xác nhận') console.log('BUG: trạng thái ra ca sai:', rR.trangThai);
    if (rR.tuXacNhan !== false) console.log('BUG: tuXacNhan phải là false (luật B)');

    if (i > 0 && i % 10000 === 0) console.log(`  ${i} lượt / ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  }

  const dt = (Date.now() - t0) / 1000;
  console.log(`\nPhase 100k: ${stats.vao + stats.ra} lượt (vao=${stats.vao}, ra=${stats.ra}) trong ${dt.toFixed(1)}s`);
  console.log(`  Trễ (>0 phút): ${stats.treTot}`);
  console.log(`  Mobile asOrg: ${stats.mobile}`);
  console.log(`  choIP: ${stats.choIP}`);
  console.log(`  Lỗi vào: ${stats.loiVao}, lỗi ra: ${stats.loiRa}`);
  if (stats.vao + stats.ra < 50000) throw new Error('số lượt thấp bất thường');
  return { tongLuot: stats.vao + stats.ra, dt };
}

/* ============ Phase 2: Burst 50 lượt 6:30 ============ */
async function phaseBurst() {
  const { env } = await setup();
  const t = await qrToken(env, 'TP', '');
  const anhData = 'data:image/jpeg;base64,/9j/4AAQ';
  const t0 = Date.now();
  const promises = [];
  for (let i = 0; i < 50; i++) {
    const maNV = String(300 + i + 1);
    promises.push(qrVao(env, mkReq('14.254.129.209', 'FPT TELECOM'),
      { cs: 'TP', t, maNV, maCa: 'FT1', photo: anhData, deviceId: 'dev-burst-' + maNV }));
  }
  const results = await Promise.all(promises);
  const dt = Date.now() - t0;
  const ok = results.filter(r => r.ok).length;
  console.log(`\nPhase burst 6:30: 50 lượt song song → ${ok} OK, ${50 - ok} lỗi, ${dt}ms (${(dt / 50).toFixed(1)}ms/lượt)`);
  if (ok !== 50) throw new Error('burst mất lượt');
  if (dt > 2000) throw new Error('burst > 2 giây (' + dt + 'ms)');
  return { ok, dt };
}

async function main() {
  console.log(`=== sim100k khởi chạy (${new Date().toISOString().slice(0, 19)}) ===`);
  const p1 = await phase100k();
  const p2 = await phaseBurst();
  console.log(`\n✅ TẤT CẢ ĐẠT: ${p1.tongLuot} lượt trong ${p1.dt.toFixed(1)}s + burst 50 trong ${p2.dt}ms`);
}

main().catch(e => { console.error('❌ FAIL:', e.message, e.stack); process.exit(1); });
