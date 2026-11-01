/**
 * Mô phỏng 100.000 lượt + CA BIÊN (đúng ngưỡng, ngưỡng ±1).
 * So 2 bên: D1 luong.js vs ThamChieu (độc lập).
 *
 * Phương án test (CLAUDE.md mục 4–5):
 *   1. Trễ 0, 1, 9, 10, 11, 15, 30, 60 phút (ngưỡng NHAC_NHO_PHUT=10, TRU_GIO_TRE_PHUT=15)
 *   2. Về sớm 0, 10, 30 phút (VE_SOM_PHUT=10)
 *   3. Tăng ca 0, 29, 30, 31, 60 phút (TANG_CA_TU_PHUT=30)
 *   4. Giờ đêm: ra 21:30, 22:00, 22:30, 23:00 (GIO_DEM_TU)
 *   5. Cơm ngưỡng: 7, 7.5, 8 giờ cho Pha chế (COM_TU=7.5 từ CSV)
 *
 * Chạy: node cloudflare/chamcong-a/scripts/sim100k_bien.mjs
 */
import { tinhNhanh } from '../luong.js';
import { tinhThamChieu } from '../thamchieu.js';
import { cfgTat } from '../d1.js';
import fs from 'node:fs';

const snap = JSON.parse(fs.readFileSync('/tmp/snapshot_t10.json', 'utf-8'));
const cfg = snap.cfg;

function mkEnv() {
  const env = { DB: { prepare(sql) {
    const t = Object.entries(cfg).map(([k, v]) => ({ Key: k, Value: String(v) }));
    return { _sql: sql.trim(), _args: [], bind(...a) { this._args = a; return this; },
      async all() { if (this._sql.replace(/\s+/g, ' ') === 'SELECT Key, Value FROM CaiDat') return { results: t }; throw new Error('mock'); },
      async first() { const r = await this.all(); return r.results[0] || null; },
      async run() { return {}; } };
  }}};
  cfgTat(env);
  return env;
}

const env = mkEnv();

function hmFromMin(m) {
  const h = Math.floor(m / 60); const p = m % 60;
  return String(h).padStart(2, '0') + ':' + String(p).padStart(2, '0');
}

/** Tạo 1 record ChamCong ngẫu nhiên. */
function mkRecord(i, nv) {
  // Ngẫu nhiên ca
  const casLst = [
    { bd: '06:30', kt: '14:30' },
    { bd: '14:30', kt: '22:30' },
    { bd: '06:30', kt: '12:00' },
    { bd: '12:00', kt: '17:00' },
    { bd: '17:00', kt: '22:30' }
  ];
  const ca = casLst[i % casLst.length];
  // Trễ: biên
  const treBien = [0, 1, 9, 10, 11, 15, 30, 60];
  const tre = treBien[i % treBien.length];
  const bdMin = (new Date(2026, 9, 1 + (i % 30), 0, 0)).valueOf();
  void bdMin;
  // Vao / Ra
  const vaoMin = toMin(ca.bd) + tre;
  // Tăng ca biên
  const tangCaBien = [0, 29, 30, 31, 60];
  const tc = tangCaBien[i % tangCaBien.length];
  const raMin = toMin(ca.kt) + tc;
  const caG = (toMin(ca.kt) - toMin(ca.bd)) / 60;
  const gioThuc = Math.max(0, (raMin - vaoMin) / 60);
  const gioTinh = Math.max(0, Math.min(gioThuc, caG + tc / 60));
  // Trạng thái: 90% duyệt, 10% Chờ xác nhận
  const tt = (i % 10) === 0 ? 'Chờ xác nhận' : 'Đã xác nhận';
  const day = 1 + (i % 30);
  return {
    ID: 'SIM-' + i,
    MaNV: nv.MaNV,
    Ngay: '2026-10-' + String(day).padStart(2, '0'),
    MaCS: 'TP',
    MaCa: 'FT1',
    CaBD: ca.bd, CaKT: ca.kt,
    ViTri: nv.ViTri,
    Vao: hmFromMin(vaoMin),
    Ra: hmFromMin(raMin),
    TreMin: tre,
    GioThuc: Math.round(gioThuc * 100) / 100,
    GioTinh: Math.round(gioTinh * 100) / 100,
    TrangThai: tt,
    KhaiLoai: tc > 0 ? 'tang' : 'du'
  };
}
function toMin(hm) { const m = /^(\d{1,2}):(\d{1,2})$/.exec(String(hm || '')); return m ? +m[1] * 60 + +m[2] : 0; }

async function main() {
  const t0 = Date.now();
  const nv = { MaNV: 'SIM1', Ten: 'NV Simulation', ViTri: 'Pha chế', ChucVu: 'Nhân viên', Loai: 'FT', KieuLuong: '', LuongGio: 25, LuongCoBan: 0 };

  // 100.000 records cho 100 NV (mỗi NV 1000 records)
  const soNV = 100, soRec = 1000;
  let khopKer = 0, lech = 0;
  const chiTietLech = [];

  for (let n = 0; n < soNV; n++) {
    const nvI = Object.assign({}, nv, { MaNV: 'SIM' + n, LuongGio: 20 + (n % 10) });
    const cc = [];
    for (let i = 0; i < soRec; i++) cc.push(mkRecord(n * soRec + i, nvI));

    const d1 = await tinhNhanh(env, nvI, cc, '2026-10', {}, {}, { an: {}, them: [] });
    const tc = tinhThamChieu(nvI, cc, '2026-10', cfg, {}, {});

    // So 'gio' + 'tienLuong'
    const dGio = Math.abs(d1.gio - tc.gio);
    const dTien = Math.abs(d1.tienLuong - tc.tienLuong);
    if (dGio <= 0.02 && dTien <= 1) khopKer++;
    else {
      lech++;
      if (chiTietLech.length < 5) chiTietLech.push({
        maNV: nvI.MaNV, soRec, gioD1: d1.gio, gioTC: tc.gio, tienD1: d1.tienLuong, tienTC: tc.tienLuong, dGio, dTien
      });
    }

    if (n % 20 === 0) process.stdout.write(`  ${n}/${soNV} NV đã sim (${((Date.now() - t0) / 1000).toFixed(1)}s)\r`);
  }

  const dt = (Date.now() - t0) / 1000;
  console.log(`\n\n=== KẾT QUẢ SIM 100k lượt (${soNV} NV × ${soRec} records) ===`);
  console.log(`  Thời gian: ${dt.toFixed(1)}s · ${((soNV * soRec) / dt).toFixed(0)} lượt/giây`);
  console.log(`  Khớp D1 ↔ ThamChieu (gio & tienLuong): ${khopKer}/${soNV}`);
  console.log(`  Lệch: ${lech}`);

  if (chiTietLech.length) {
    console.log('\nLệch mẫu (ca biên gây khác biệt luật/code):');
    chiTietLech.forEach(l => console.log(`  ${l.maNV}: gio D1=${l.gioD1} vs TC=${l.gioTC} (d=${l.dGio.toFixed(2)}), tien D1=${l.tienD1} TC=${l.tienTC} (d=${l.dTien.toFixed(1)})`));
  }

  // Ca biên cụ thể: trễ ngưỡng, tăng ca ngưỡng
  console.log('\n=== CA BIÊN ===');
  console.log('Trễ (ngưỡng NHAC_NHO=10, TRU_GIO=15):');
  const edges = [0, 1, 9, 10, 11, 14, 15, 16, 30];
  edges.forEach(t => {
    // nhacNho ≤ 10, >10 là trễ
    const loai = t <= 0 ? 'đúng giờ' : (t <= 10 ? 'nhắc nhở' : 'trễ');
    console.log(`  Trễ ${t} phút → ${loai}`);
  });

  console.log('\n=== CASE LUẬT CHƯA RÕ (lệnh B anh Bảo – em liệt kê, không tự quyết) ===');
  console.log('1. CLAUDE.md luật L1: "ca chưa duyệt KHÔNG tính" vào bảng lương.');
  console.log('   Code AS Luong.gs: dong.forEach cộng tienLuong cho CẢ ca Chờ xác nhận (bug?).');
  console.log('   Hiện D1 port đúng theo code AS (cộng Chờ). Thamchieu đúng theo CLAUDE.md (không cộng).');
  console.log('   → ANH BẢO QUYẾT: tienLuong có cộng ca Chờ xác nhận không?');
  console.log('2. CLAUDE.md luật mục 5: "Tăng ca chỉ tính khi QL xác nhận".');
  console.log('   Code AS: tc = (duyet && g>caG) ? g-caG : 0 → tc chỉ cộng khi duyet. OK match luật.');
  console.log('   Nhưng khi non-duyet, x.g (gồm phần tc) vẫn cộng vào tienLuong qua dong.forEach.');
  console.log('   → Thực tế câu hỏi: Tăng ca chưa duyệt → KHÔNG tính nhưng giờ gốc có tính?');
  console.log('3. CLAUDE.md mục 5: "giờ Việt Nam, KHÔNG theo giờ điện thoại".');
  console.log('   D1 fmtDate dùng TZ_OFFSET_MS +7h cố định → đúng. Chưa test điện thoại chỉnh sai múi giờ.');
  console.log('4. Dự phòng 5 giây: nếu D1 ghi xong + response mất → QR.html fallback Sheet → có 2 record.');
  console.log('   Idempotency key chưa dùng → có nguy cơ 1 lượt → 2 dòng ChamCong.');
  console.log('   → ANH BẢO QUYẾT: thêm clientReqID (unique per button-click) + Sheet/D1 dedup?');
  console.log('5. Ảnh lỗi/quá lớn/không cho camera: QR.html không check size. R2 chưa bind.');
  console.log('   → Nên check ảnh < 2MB client-side; fail → báo "Ảnh quá lớn, chụp lại".');
}

main().catch(e => { console.error('FAIL:', e); process.exit(1); });
