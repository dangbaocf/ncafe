/**
 * Test local cho module `d1.js` (đợt A). Chạy: `node cloudflare/chamcong-a/d1.test.js`.
 * Dùng mock env.DB (map-backed) + env.ANH (R2 mock). Không cần wrangler/miniflare.
 */

import {
  qrToken, qrInfo, qrMo, qrVao, qrRa,
  wifiChan, wifiKiem, wifiLaMobile, wifiQueueCho,
  cfgTat, hhmm, toMin, chuDau, tenNgan, ipKhop, fmtDT
} from './d1.js';

/* --------- Mock env.DB (minimal D1 interface) --------- */
function mkDB() {
  const tables = {
    NhanVien: [], CoSo: [], Ca: [], ChamCong: [], WifiQuan: [], WifiCho: [],
    CaiDat: [], NhatKySua: [], ThietBi: []
  };
  // Prepare parser rất đơn giản: hỗ trợ chỉ các câu SQL mà d1.js dùng.
  function prepare(sql) {
    return {
      _sql: sql.trim(),
      _args: [],
      bind(...args) { this._args = args; return this; },
      async all() { return { results: run(this._sql, this._args, 'all') }; },
      async first() { const rs = run(this._sql, this._args, 'all'); return rs[0] || null; },
      async run() { return run(this._sql, this._args, 'exec'); }
    };
  }
  function run(sql, args, mode) {
    const s = sql.replace(/\s+/g, ' ').trim();
    // SELECT COUNT|DISTINCT
    let m;
    if ((m = s.match(/^SELECT \* FROM NhanVien WHERE MaNV = \?1$/i)))
      return tables.NhanVien.filter(r => r.MaNV === args[0]);
    if ((m = s.match(/^SELECT \* FROM CoSo WHERE MaCS = \?1$/i)))
      return tables.CoSo.filter(r => r.MaCS === args[0]);
    if ((m = s.match(/^SELECT \* FROM Ca WHERE MaCa = \?1$/i)))
      return tables.Ca.filter(r => r.MaCa === args[0]);
    if (s === "SELECT IP, MaCS FROM WifiQuan WHERE TrangThai <> 'Bỏ'")
      return tables.WifiQuan.filter(r => r.TrangThai !== 'Bỏ').map(r => ({ IP: r.IP, MaCS: r.MaCS }));
    if (s === 'SELECT Key, Value FROM CaiDat')
      return tables.CaiDat.map(r => ({ Key: r.Key, Value: r.Value }));
    if ((m = s.match(/^SELECT \* FROM ChamCong WHERE MaNV = \?1 AND Ngay >= \?2 AND TrangThai = 'Đang làm' ORDER BY Vao DESC LIMIT 1$/)))
      return tables.ChamCong.filter(r => r.MaNV === args[0] && r.Ngay >= args[1] && r.TrangThai === 'Đang làm')
        .sort((a, b) => (a.Vao < b.Vao ? 1 : -1)).slice(0, 1);
    if ((m = s.match(/^SELECT DISTINCT MaNV FROM WifiCho WHERE MaCS = \?1 AND IP = \?2 AND TrangThai = 'Cho' AND Luc >= \?3 AND MaNV <> \?4$/)))
      return [...new Set(tables.WifiCho.filter(r => r.MaCS === args[0] && r.IP === args[1] && r.TrangThai === 'Cho' && r.Luc >= args[2] && r.MaNV !== args[3]).map(r => r.MaNV))].map(x => ({ MaNV: x }));
    if ((m = s.match(/^SELECT 1 FROM ThietBi WHERE MaNV = \?1 AND Dev = \?2 LIMIT 1$/)))
      return tables.ThietBi.filter(r => r.MaNV === args[0] && r.Dev === args[1]).slice(0, 1);
    if ((m = s.match(/^SELECT ID, CCID FROM WifiCho WHERE MaCS = \?1 AND IP = \?2 AND TrangThai = 'Cho'$/)))
      return tables.WifiCho.filter(r => r.MaCS === args[0] && r.IP === args[1] && r.TrangThai === 'Cho').map(r => ({ ID: r.ID, CCID: r.CCID }));
    if ((m = s.match(/^SELECT CanhBao FROM ChamCong WHERE ID = \?1$/)))
      return tables.ChamCong.filter(r => r.ID === args[0]).map(r => ({ CanhBao: r.CanhBao }));

    // INSERT / UPDATE helpers – rất đơn giản
    if (s.startsWith('INSERT INTO ChamCong')) {
      const row = {
        ID: args[0], Ngay: args[1], MaNV: args[2], Ten: args[3], MaCS: args[4],
        MaCa: args[5], CaBD: args[6], CaKT: args[7], ViTri: args[8], Vao: args[9],
        TreMin: args[10], TrangThai: 'Đang làm', CanhBao: args[11] || '', AnhVao: args[12],
        ViDo: args[13], KinhDo: args[14], KhoangCach: args[15], ThietBi: args[16],
        IP: args[17], AsOrg: args[18], NguonNhap: 'QR', Created: args[19], Updated: args[19]
      };
      tables.ChamCong.push(row); return { success: true };
    }
    if (s.startsWith('UPDATE ChamCong SET')) {
      // Simplest: UPDATE qrRa dùng (ra, thuc, loai, khaiGio, tu, den, ghi, coMat, lyDo, tt, gioTinh, anhRa, cbFinal, now, mo.ID)
      const id = args[14], r = tables.ChamCong.find(x => x.ID === id);
      if (r) {
        r.Ra = args[0]; r.GioThuc = args[1]; r.KhaiLoai = args[2]; r.KhaiGio = args[3];
        r.KhaiTu = args[4]; r.KhaiDen = args[5]; r.KhaiGhiChu = args[6]; r.CoMat = args[7];
        r.LyDo = args[8]; r.TrangThai = args[9]; r.GioTinh = args[10]; r.Cach = '';
        r.AnhRa = args[11]; r.CanhBao = args[12]; r.Updated = args[13];
      }
      return { success: true };
    }
    if (s.match(/^UPDATE ChamCong SET CanhBao = \?1, Updated = \?2 WHERE ID = \?3$/)) {
      const r = tables.ChamCong.find(x => x.ID === args[2]);
      if (r) { r.CanhBao = args[0]; r.Updated = args[1]; }
      return { success: true };
    }
    if (s.startsWith('INSERT INTO WifiCho')) {
      tables.WifiCho.push({
        ID: args[0], Luc: args[1], MaCS: args[2], MaNV: args[3], Ten: args[4],
        IP: args[5], AsOrg: args[6], CCID: args[7], Loai: args[8], TrangThai: 'Cho',
        Anh: args[9]
      });
      return { success: true };
    }
    if (s.startsWith('UPDATE WifiCho SET')) {
      const r = tables.WifiCho.find(x => x.ID === args[2]);
      if (r) { r.TrangThai = 'Da'; r.XuLyBoi = args[0]; r.LucXong = args[1]; }
      return { success: true };
    }
    if (s.startsWith('INSERT OR IGNORE INTO WifiQuan')) {
      if (!tables.WifiQuan.some(r => r.IP === args[0] && r.MaCS === args[1])) {
        tables.WifiQuan.push({
          IP: args[0], MaCS: args[1], GhiChu: args[2], Ngay: args[3], Boi: 'Hệ thống', TrangThai: 'Dùng'
        });
      }
      return { success: true };
    }
    if (s.startsWith('INSERT OR IGNORE INTO ThietBi')) {
      if (!tables.ThietBi.some(r => r.MaNV === args[0] && r.Dev === args[1])) {
        tables.ThietBi.push({ MaNV: args[0], Dev: args[1], Luc: args[2] });
      }
      return { success: true };
    }
    if (s.startsWith('INSERT INTO NhatKySua')) { tables.NhatKySua.push({ args }); return { success: true }; }
    throw new Error('MOCK không hiểu SQL: ' + s.slice(0, 160));
  }

  return {
    _tables: tables,
    prepare
  };
}

/* --------- Mock env.ANH (R2) --------- */
function mkANH() {
  const store = new Map();
  return {
    _store: store,
    async put(key, data, opts) { store.set(key, { data, opts }); return { key }; }
  };
}

/* --------- Mock request --------- */
function mkRequest(ip = '14.254.129.209', asOrg = 'FPT TELECOM COMPANY LIMITED') {
  return {
    cf: { asOrganization: asOrg },
    headers: { get: (k) => (k === 'CF-Connecting-IP' ? ip : null) }
  };
}

/* --------- Test runner --------- */
let pass = 0, fail = 0;
async function T(name, fn) {
  try {
    const r = await fn();
    if (r === true) { pass++; console.log('✔ ' + name); }
    else { fail++; console.log('✘ ' + name + ' — ' + r); }
  } catch (e) {
    fail++; console.log('✘ ' + name + ' — LỖI: ' + e.message);
  }
}

function mkEnv() {
  const env = { DB: mkDB(), ANH: mkANH(), QR_SECRET: 'test-secret' };
  env.DB._tables.CoSo.push({ MaCS: 'TP', TenCS: 'Trần Phú', GioMo: '06:30', GioDong: '22:30', ViDo: 16.0702, KinhDo: 108.2167, BanKinh: 100, QRVer: '1' });
  env.DB._tables.CoSo.push({ MaCS: 'DD', TenCS: 'Đống Đa', GioMo: '06:30', GioDong: '22:30', ViDo: null, KinhDo: null, BanKinh: 100, QRVer: '1' });
  env.DB._tables.Ca.push({ MaCa: 'FT1', TenCa: 'Full sáng', GioBD: '06:30', GioKT: '14:30', SoGio: 8 });
  env.DB._tables.NhanVien.push({ MaNV: '201', Ten: 'Thanh (Bùi Thị Phương Thanh)', ViTri: 'Pha chế', Loai: 'FT', CoSoChinh: 'TP', TrangThai: 'Đang làm' });
  env.DB._tables.NhanVien.push({ MaNV: '202', Ten: 'Lài (Hồ Lài)', ViTri: 'Pha chế', Loai: 'FT', CoSoChinh: 'TD', TrangThai: 'Đang làm' });
  env.DB._tables.CaiDat.push({ Key: 'WIFI_CHE_DO', Value: 'Bắt buộc' });
  env.DB._tables.CaiDat.push({ Key: 'WIFI_CHO_XAC_NHAN', Value: 'Có' });
  env.DB._tables.WifiQuan.push({ IP: '14.254.129.209', MaCS: 'TP', TrangThai: 'Dùng' });
  cfgTat(env);
  return env;
}

async function main() {
  const anhData = 'data:image/jpeg;base64,/9j/4AAQ';   // mock 1 byte sau header

  await T('qrToken deterministic + length 10', async () => {
    const t = await qrToken({ QR_SECRET: 'secret' }, 'TP', '1');
    return (t.length === 10 && /^[A-Za-z0-9]+$/.test(t)) || 'got ' + t;
  });

  await T('wifiLaMobile phát hiện Viettel Mobile / Mobifone / 4G keyword', async () => {
    return wifiLaMobile('Viettel Mobile') === true
      && wifiLaMobile('MOBIFONE Corporation') === true
      && wifiLaMobile('FPT TELECOM') === false
      && wifiLaMobile('') === false
      ? true : 'logic sai';
  });

  await T('qrInfo trả CoSo đúng khi token khớp; sai token → lỗi', async () => {
    const env = mkEnv();
    const t = await qrToken(env, 'TP', '1');
    const r1 = await qrInfo(env, { cs: 'TP', t });
    const r2 = await qrInfo(env, { cs: 'TP', t: 'wrong-token' });
    if (!r1.ok || r1.store.MaCS !== 'TP') return 'r1=' + JSON.stringify(r1);
    if (r2.ok) return 'r2 phải lỗi';
    return true;
  });

  await T('qrVao wifi khớp → ghi D1 trạng thái "Đang làm"', async () => {
    const env = mkEnv();
    const t = await qrToken(env, 'TP', '1');
    const r = await qrVao(env, mkRequest('14.254.129.209', 'FPT TELECOM'), {
      cs: 'TP', t, maNV: '201', maCa: 'FT1', photo: anhData, deviceId: 'dev-A'
    });
    if (!r.ok || r.loai !== 'VAO') return 'r=' + JSON.stringify(r);
    if (r.choIP) return 'wifi khớp mà vẫn choIP';
    const rows = env.DB._tables.ChamCong;
    if (rows.length !== 1 || rows[0].TrangThai !== 'Đang làm') return 'row=' + JSON.stringify(rows);
    if (!rows[0].AnhVao || !env.ANH._store.has(rows[0].AnhVao)) return 'ảnh không lưu R2';
    return true;
  });

  await T('qrVao IP lạ + mobile → choIP (chờ xác nhận), ghi WifiCho, không auto-nhận', async () => {
    const env = mkEnv();
    const t = await qrToken(env, 'TP', '1');
    const r = await qrVao(env, mkRequest('2402:800:aaaa::1', 'Viettel Mobile'), {
      cs: 'TP', t, maNV: '201', maCa: 'FT1', photo: anhData, deviceId: 'dev-A'
    });
    if (!r.ok || !r.choIP) return 'phải choIP, r=' + JSON.stringify(r);
    if (r.msgIP !== 'Đã ghi nhận, đang chờ xác nhận mạng quán') return 'msg sai: ' + r.msgIP;
    const wifiCho = env.DB._tables.WifiCho;
    if (wifiCho.length !== 1 || wifiCho[0].TrangThai !== 'Cho') return 'WifiCho=' + JSON.stringify(wifiCho);
    const wq = env.DB._tables.WifiQuan;
    if (wq.length !== 1) return 'KHÔNG được thêm WifiQuan khi mobile; got ' + wq.length;
    return true;
  });

  await T('qrVao IP lạ non-mobile + 2 NV trong 2h → auto-nhận, thêm WifiQuan', async () => {
    const env = mkEnv();
    const t = await qrToken(env, 'TP', '1');
    const now = Date.now();
    // Giả lập NV201 đã chấm cùng IP 1 giờ trước (queue Cho) – dùng fmtDT để khớp giờ VN
    env.DB._tables.WifiCho.push({
      ID: 'W-prev', Luc: fmtDT(new Date(now - 3600 * 1000)),
      MaCS: 'TP', MaNV: '201', Ten: 'Thanh', IP: '192.168.9.9', AsOrg: 'FPT',
      CCID: 'cc-prev', Loai: 'VAO', TrangThai: 'Cho'
    });
    // NV202 chấm lần 2 cùng IP → auto-nhận
    const r = await qrVao(env, mkRequest('192.168.9.9', 'FPT TELECOM'), {
      cs: 'TP', t, maNV: '202', maCa: 'FT1', photo: anhData, deviceId: 'dev-B'
    });
    if (!r.ok) return 'r=' + JSON.stringify(r);
    if (r.choIP) return 'phải auto-nhận, nhưng choIP=true';
    const wq = env.DB._tables.WifiQuan.filter(w => w.IP === '192.168.9.9' && w.MaCS === 'TP');
    if (!wq.length) return 'phải thêm IP vào WifiQuan';
    const prev = env.DB._tables.WifiCho.find(x => x.ID === 'W-prev');
    if (prev.TrangThai !== 'Da') return 'queue cũ phải chuyển Da';
    return true;
  });

  await T('qrRa update row Đang làm → "Chờ xác nhận" (áp luật B, không tự khớp lịch)', async () => {
    const env = mkEnv();
    const t = await qrToken(env, 'TP', '1');
    // VAO trước
    await qrVao(env, mkRequest('14.254.129.209', 'FPT TELECOM'), {
      cs: 'TP', t, maNV: '201', maCa: 'FT1', photo: anhData, deviceId: 'dev-A'
    });
    // Giả thời gian trôi: trong real app, caDangMo chỉ lọc theo Ngay. OK.
    const r = await qrRa(env, mkRequest('14.254.129.209', 'FPT TELECOM'), {
      cs: 'TP', t, maNV: '201', khaiLoai: 'du', photo: anhData
    });
    if (!r.ok || r.loai !== 'RA') return 'r=' + JSON.stringify(r);
    if (r.trangThai !== 'Chờ xác nhận') return 'phải "Chờ xác nhận", nhận ' + r.trangThai;
    if (r.tuXacNhan !== false || r.khopLich !== false) return 'luật B: không tự xác nhận';
    const row = env.DB._tables.ChamCong[0];
    if (row.TrangThai !== 'Chờ xác nhận' || !row.AnhRa) return 'row sai: ' + JSON.stringify(row);
    return true;
  });

  console.log('\nKẾT QUẢ: ' + pass + ' đạt, ' + fail + ' lỗi');
  if (fail > 0) process.exit(1);
}

main();
