/**
 * Test local cho module `d1.js` (đợt A). Chạy: `node cloudflare/chamcong-a/d1.test.js`.
 * Dùng mock env.DB (map-backed) + env.ANH (R2 mock). Không cần wrangler/miniflare.
 */

import {
  qrToken, qrInfo, qrMo, qrVao, qrRa,
  wifiChan, wifiKiem, wifiLaMobile, wifiQueueCho,
  cfgTat, hhmm, toMin, chuDau, tenNgan, ipKhop, fmtDT
} from './d1.js';
import {
  caiDatDoc, caiDatGhi,
  wifiQuanDs, wifiQuanLuu, wifiQuanBo,
  wifiChoDs, wifiChoXuLy,
  nhatKyDs, DEFAULTS
} from './caidat.js';

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

    /* Pattern specific cho CanhBao update (caidat.js wifiChoXuLy + d1.js wifiXoaCB)
     * phải đứng TRƯỚC pattern startsWith('UPDATE ChamCong SET') kẻo generic nuốt mất. */
    if (s.match(/^UPDATE ChamCong SET CanhBao = \?1, Updated = \?2 WHERE ID = \?3$/)) {
      const r = tables.ChamCong.find(x => x.ID === args[2]);
      if (r) { r.CanhBao = args[0]; r.Updated = args[1]; }
      return { success: true };
    }
    /* Pattern specific cho WifiCho 4-arg (caidat.js wifiChoXuLy) phải đứng TRƯỚC generic 3-arg. */
    if (s.match(/^UPDATE WifiCho SET TrangThai = \?1, XuLyBoi = \?2, LucXong = \?3 WHERE ID = \?4$/)) {
      const r = tables.WifiCho.find(x => x.ID === args[3]);
      if (r) { r.TrangThai = args[0]; r.XuLyBoi = args[1]; r.LucXong = args[2]; }
      return { success: true };
    }

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
    if (s.startsWith('INSERT INTO NhatKySua')) {
      // Hai dạng: (1) 8 args từ ghiNhatKy caidat.js (Luc, Boi, Bang, Khoa, Cot, Cu, Moi, LyDo)
      //           (2) legacy wifiThemTuNhan trong d1.js (chuỗi dài kiểu NULL + concat)
      tables.NhatKySua.push({
        ID: tables.NhatKySua.length + 1,
        Luc: args[0], Boi: args[1], Bang: args[2], Khoa: args[3],
        Cot: args[4], Cu: args[5], Moi: args[6], LyDo: args[7]
      });
      return { success: true };
    }

    /* ---- caidat.js: CaiDat ---- */
    if (s === 'SELECT Key, Value, Updated, UpdatedBy FROM CaiDat')
      return tables.CaiDat.map(r => ({ Key: r.Key, Value: r.Value, Updated: r.Updated || '', UpdatedBy: r.UpdatedBy || '' }));
    if ((m = s.match(/^SELECT Value FROM CaiDat WHERE Key = \?1$/)))
      return tables.CaiDat.filter(r => r.Key === args[0]).map(r => ({ Value: r.Value }));
    if (s.startsWith('INSERT INTO CaiDat(Key, Value, Updated, UpdatedBy)')) {
      const r = tables.CaiDat.find(x => x.Key === args[0]);
      if (r) { r.Value = args[1]; r.Updated = args[2]; r.UpdatedBy = args[3]; }
      else tables.CaiDat.push({ Key: args[0], Value: args[1], Updated: args[2], UpdatedBy: args[3] });
      return { success: true };
    }

    /* ---- caidat.js: WifiQuan ---- */
    if (s === 'SELECT IP, MaCS, GhiChu, Ngay, Boi, TrangThai FROM WifiQuan ORDER BY MaCS, IP')
      return tables.WifiQuan.slice().sort((a, b) => (a.MaCS + a.IP).localeCompare(b.MaCS + b.IP))
        .map(r => ({ IP: r.IP, MaCS: r.MaCS, GhiChu: r.GhiChu || '', Ngay: r.Ngay || '', Boi: r.Boi || '', TrangThai: r.TrangThai || 'Dùng' }));
    if ((m = s.match(/^SELECT TrangThai, GhiChu FROM WifiQuan WHERE IP = \?1 AND MaCS = \?2$/)))
      return tables.WifiQuan.filter(r => r.IP === args[0] && r.MaCS === args[1])
        .map(r => ({ TrangThai: r.TrangThai, GhiChu: r.GhiChu || '' }));
    if ((m = s.match(/^SELECT 1 FROM WifiQuan WHERE IP = \?1 AND MaCS = \?2$/)))
      return tables.WifiQuan.filter(r => r.IP === args[0] && r.MaCS === args[1]).slice(0, 1).map(() => ({ '1': 1 }));
    if (s.startsWith('UPDATE WifiQuan SET TrangThai = ?1, GhiChu = ?2 WHERE IP = ?3 AND MaCS = ?4')) {
      const r = tables.WifiQuan.find(x => x.IP === args[2] && x.MaCS === args[3]);
      if (r) { r.TrangThai = args[0]; r.GhiChu = args[1]; }
      return { success: true };
    }
    if (s.startsWith("INSERT INTO WifiQuan(IP, MaCS, GhiChu, Ngay, Boi, TrangThai) VALUES(?1,?2,?3,?4,?5,'Dùng')")) {
      tables.WifiQuan.push({ IP: args[0], MaCS: args[1], GhiChu: args[2], Ngay: args[3], Boi: args[4], TrangThai: 'Dùng' });
      return { success: true };
    }
    if (s.startsWith('INSERT INTO WifiQuan(IP, MaCS, GhiChu, Ngay, Boi, TrangThai) VALUES(?1,?2,?3,?4,?5,?6)')) {
      tables.WifiQuan.push({ IP: args[0], MaCS: args[1], GhiChu: args[2], Ngay: args[3], Boi: args[4], TrangThai: args[5] });
      return { success: true };
    }
    if (s.match(/^UPDATE WifiQuan SET TrangThai = 'Bỏ' WHERE IP = \?1 AND MaCS = \?2$/)) {
      const r = tables.WifiQuan.find(x => x.IP === args[0] && x.MaCS === args[1]);
      if (r) r.TrangThai = 'Bỏ';
      return { success: true };
    }

    /* ---- caidat.js: WifiCho queue ---- */
    if (s.startsWith('SELECT ID, Luc, MaCS, MaNV, Ten, IP, AsOrg, CCID, Loai, TrangThai, XuLyBoi, LucXong FROM WifiCho')
        && s.includes("TrangThai='Cho'"))
      return tables.WifiCho.filter(r => r.TrangThai === 'Cho')
        .sort((a, b) => (a.Luc < b.Luc ? 1 : -1))
        .map(r => ({ ID: r.ID, Luc: r.Luc, MaCS: r.MaCS, MaNV: r.MaNV, Ten: r.Ten, IP: r.IP, AsOrg: r.AsOrg || '', CCID: r.CCID || '', Loai: r.Loai || '', TrangThai: r.TrangThai, XuLyBoi: r.XuLyBoi || '', LucXong: r.LucXong || '' }));
    if ((m = s.match(/^SELECT MaCS, IP, CCID FROM WifiCho WHERE ID = \?1$/)))
      return tables.WifiCho.filter(r => r.ID === args[0]).map(r => ({ MaCS: r.MaCS, IP: r.IP, CCID: r.CCID }));
    // UPDATE WifiCho 4-arg + UPDATE ChamCong CanhBao đã được xử lý sớm ở trên

    /* ---- caidat.js: NhatKySua query ---- */
    if (s.startsWith('SELECT ID, Luc, Boi, Bang, Khoa, Cot, Cu, Moi, LyDo FROM NhatKySua')) {
      let rs = tables.NhatKySua.slice();
      if (s.includes('WHERE Bang = ?1')) rs = rs.filter(r => r.Bang === args[0]);
      rs.sort((a, b) => b.ID - a.ID);
      const lim = args[args.length - 1];
      return rs.slice(0, lim);
    }

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
  const env = { DB: mkDB(), ANH: mkANH(), QR_SECRET: 'test-secret', ADMIN_PIN: '1234', QL_PIN: '5678' };
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

  /* ============ CAI DAT (D1 CRUD) ============ */

  await T('caiDatDoc PIN sai → ok:false', async () => {
    const env = mkEnv();
    const r = await caiDatDoc(env, { pin: '0000' });
    return (r.ok === false && /sai/i.test(r.msg)) || 'r=' + JSON.stringify(r);
  });

  await T('caiDatDoc admin PIN → trả nhóm + keys đầy đủ (merge defaults với DB)', async () => {
    const env = mkEnv();
    const r = await caiDatDoc(env, { pin: '1234' });
    if (!r.ok) return 'r=' + JSON.stringify(r);
    if (!Array.isArray(r.nhom) || r.nhom.length !== 10) return 'nhom length=' + r.nhom.length;
    // WIFI_CHE_DO ở DB là 'Bắt buộc' (seed) → daSua=true, Value='Bắt buộc'
    const wifi = r.keys.wifi.find(x => x.Key === 'WIFI_CHE_DO');
    if (!wifi || wifi.Value !== 'Bắt buộc' || !wifi.daSua) return 'WIFI_CHE_DO sai: ' + JSON.stringify(wifi);
    // TRE_PHUT chưa seed → dùng macDinh='10', daSua=false
    const tre = r.keys.nguong.find(x => x.Key === 'TRE_PHUT');
    if (!tre || tre.Value !== '10' || tre.daSua) return 'TRE_PHUT sai: ' + JSON.stringify(tre);
    // Secret: QR_SECRET không set env → daCai=false, Value=''
    const qr = r.keys.bimat.find(x => x.Key === 'QR_SECRET');
    if (!qr || qr.Value !== '••••••' && qr.Value !== '') return 'QR_SECRET sai: ' + JSON.stringify(qr);
    return true;
  });

  await T('caiDatGhi upsert + log NhatKy; đổi WIFI_CHE_DO Bắt buộc → Cảnh báo', async () => {
    const env = mkEnv();
    const r = await caiDatGhi(env, { pin: '1234', kv: { WIFI_CHE_DO: 'Cảnh báo', TRE_PHUT: '15' }, lyDo: 'thử' });
    if (!r.ok || r.doi !== 2) return 'r=' + JSON.stringify(r);
    const cd = env.DB._tables.CaiDat.find(x => x.Key === 'WIFI_CHE_DO');
    if (!cd || cd.Value !== 'Cảnh báo' || !cd.UpdatedBy) return 'cd=' + JSON.stringify(cd);
    const nk = env.DB._tables.NhatKySua;
    if (nk.length !== 2) return 'NhatKy count=' + nk.length;
    if (nk[0].Bang !== 'CaiDat' || nk[0].Cu !== 'Bắt buộc' || nk[0].Moi !== 'Cảnh báo') return 'NhatKy sai: ' + JSON.stringify(nk[0]);
    return true;
  });

  await T('caiDatGhi reject khoá bí mật + khoá chỉ đọc + validate kiểu', async () => {
    const env = mkEnv();
    const r = await caiDatGhi(env, { pin: '1234', kv: {
      QR_SECRET: 'abc',          // secret → reject
      DOC_LICH: 'Có',            // ro → reject
      TRE_PHUT: 'abc',           // int sai định dạng → reject
      GIO_DEM_TU: '25:70',       // time sai → reject
      TG_MUC: 'khac'             // enum ngoài ds → reject
    } });
    if (r.doi !== 0) return 'không được ghi, doi=' + r.doi;
    if (!r.loi || r.loi.length !== 5) return 'phải có 5 lỗi, có ' + (r.loi||[]).length;
    return true;
  });

  await T('caiDatGhi QL PIN (không phải admin) → từ chối', async () => {
    const env = mkEnv();
    const r = await caiDatGhi(env, { pin: '5678', kv: { TRE_PHUT: '12' } });
    return (r.ok === false) || 'QL không được ghi cài đặt, r=' + JSON.stringify(r);
  });

  await T('wifiQuanDs + wifiQuanLuu + wifiQuanBo', async () => {
    const env = mkEnv();
    const r1 = await wifiQuanDs(env, { pin: '1234' });
    if (!r1.ok || !Array.isArray(r1.ds)) return 'r1=' + JSON.stringify(r1);
    const start = r1.ds.length;
    const r2 = await wifiQuanLuu(env, { pin: '1234', ip: '192.168.1.1', maCS: 'DD', ghiChu: 'Modem Viettel' });
    if (!r2.ok) return 'r2=' + JSON.stringify(r2);
    const r3 = await wifiQuanDs(env, { pin: '1234' });
    if (r3.ds.length !== start + 1) return 'không thêm; count=' + r3.ds.length;
    const r4 = await wifiQuanBo(env, { pin: '1234', ip: '192.168.1.1', maCS: 'DD' });
    if (!r4.ok) return 'r4=' + JSON.stringify(r4);
    const row = env.DB._tables.WifiQuan.find(x => x.IP === '192.168.1.1' && x.MaCS === 'DD');
    if (!row || row.TrangThai !== 'Bỏ') return 'row sau Bỏ: ' + JSON.stringify(row);
    return true;
  });

  await T('wifiChoDs + wifiChoXuLy "da" → thêm vào WifiQuan + xoá CB "IP chờ xác nhận"', async () => {
    const env = mkEnv();
    // Tạo 1 row ChamCong có CB IP chờ, 1 row WifiCho tương ứng
    env.DB._tables.ChamCong.push({ ID: 'cc1', MaNV: '201', MaCS: 'TP', TrangThai: 'Đang làm', CanhBao: 'Cách quán 200m; IP chờ xác nhận (10.0.0.5)', Vao: '06:35', Ngay: '2026-10-31' });
    env.DB._tables.WifiCho.push({ ID: 'wc1', Luc: fmtDT(new Date()), MaCS: 'TP', MaNV: '201', Ten: 'Thanh', IP: '10.0.0.5', AsOrg: 'FPT', CCID: 'cc1', Loai: 'VAO', TrangThai: 'Cho' });
    const r1 = await wifiChoDs(env, { pin: '1234' });
    if (!r1.ok || r1.ds.length !== 1) return 'r1=' + JSON.stringify(r1);
    const r2 = await wifiChoXuLy(env, { pin: '1234', id: 'wc1', hanh: 'da' });
    if (!r2.ok) return 'r2=' + JSON.stringify(r2);
    const wq = env.DB._tables.WifiQuan.find(x => x.IP === '10.0.0.5' && x.MaCS === 'TP');
    if (!wq) return 'phải thêm WifiQuan';
    const cc = env.DB._tables.ChamCong.find(x => x.ID === 'cc1');
    if (/IP chờ xác nhận/i.test(cc.CanhBao || '')) return 'phải xoá CB IP chờ, còn: ' + cc.CanhBao;
    if (!/Cách quán 200m/.test(cc.CanhBao)) return 'phải giữ CB khác: ' + cc.CanhBao;
    return true;
  });

  await T('wifiChoXuLy "tuchoi" → đánh dấu TuChoi, KHÔNG thêm WifiQuan', async () => {
    const env = mkEnv();
    env.DB._tables.WifiCho.push({ ID: 'wc2', Luc: fmtDT(new Date()), MaCS: 'TP', MaNV: '201', Ten: 'Thanh', IP: '10.9.9.9', CCID: '', Loai: 'VAO', TrangThai: 'Cho' });
    const startWq = env.DB._tables.WifiQuan.length;
    const r = await wifiChoXuLy(env, { pin: '1234', id: 'wc2', hanh: 'tuchoi' });
    if (!r.ok) return 'r=' + JSON.stringify(r);
    const wc = env.DB._tables.WifiCho.find(x => x.ID === 'wc2');
    if (wc.TrangThai !== 'TuChoi') return 'phải TuChoi, có ' + wc.TrangThai;
    if (env.DB._tables.WifiQuan.length !== startWq) return 'không được thêm WifiQuan khi từ chối';
    return true;
  });

  await T('nhatKyDs trả record mới nhất; lọc theo bảng', async () => {
    const env = mkEnv();
    // 2 lần ghi caiDat → 2 nhật ký
    await caiDatGhi(env, { pin: '1234', kv: { TRE_PHUT: '12' } });
    await caiDatGhi(env, { pin: '1234', kv: { TRE_PHUT: '13' } });
    await wifiQuanLuu(env, { pin: '1234', ip: '10.1.1.1', maCS: 'TP' });   // thêm 1 nhật ký bảng WifiQuan
    const r1 = await nhatKyDs(env, { pin: '1234', gioiHan: 10 });
    if (!r1.ok || r1.ds.length !== 3) return 'r1 count=' + r1.ds.length;
    // Sắp xếp DESC: wifi là mới nhất
    if (r1.ds[0].Bang !== 'WifiQuan') return 'thứ tự sai, [0]=' + r1.ds[0].Bang;
    const r2 = await nhatKyDs(env, { pin: '1234', bang: 'CaiDat' });
    if (r2.ds.length !== 2) return 'lọc CaiDat count=' + r2.ds.length;
    return r2.ds.every(x => x.Bang === 'CaiDat') ? true : 'lọc không chuẩn';
  });

  await T('DEFAULTS có đủ ≥ 70 khoá, mỗi khoá có nhom thuộc NHOM', async () => {
    const keys = Object.keys(DEFAULTS);
    if (keys.length < 70) return 'chỉ có ' + keys.length + ' khoá, cần ≥ 70';
    const nhomMa = ['bimat','wifi','nguong','com','luong','tg','bt','luutru','xeplich','khac'];
    const sai = keys.filter(k => !nhomMa.includes(DEFAULTS[k].nhom));
    if (sai.length) return 'nhóm sai: ' + sai.join(',');
    return true;
  });

  console.log('\nKẾT QUẢ: ' + pass + ' đạt, ' + fail + ' lỗi');
  if (fail > 0) process.exit(1);
}

main();
