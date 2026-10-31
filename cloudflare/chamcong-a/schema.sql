-- Ncafe Đợt A – schema D1 ban đầu cho worker ncafe-chamcong (lưu lượt chấm gốc).
-- Chạy 1 lần: wrangler d1 execute ncafe-chamcong-d1 --file=cloudflare/chamcong-a/schema.sql --remote
-- Áp dụng luật B: không có cột khớp lịch, không có Cach='theo lịch'.

CREATE TABLE IF NOT EXISTS NhanVien (
  MaNV TEXT PRIMARY KEY,
  Ten TEXT,
  ViTri TEXT,
  ChucVu TEXT,
  Loai TEXT,           -- FT / PT
  CoSoChinh TEXT,
  CoDinh TEXT,
  TangCaDuoc TEXT,
  SDT TEXT,
  TrangThai TEXT DEFAULT 'Đang làm',
  LuongGio REAL,
  LuongCoBan REAL,
  KieuLuong TEXT,
  NgayVao TEXT,
  NgaySinh TEXT,
  ViTriKiem TEXT,
  SinhVien TEXT,
  BietDanh TEXT,
  GhiChu TEXT,
  Updated TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_nv_trangthai ON NhanVien(TrangThai);

CREATE TABLE IF NOT EXISTS CoSo (
  MaCS TEXT PRIMARY KEY,
  TenCS TEXT,
  GioMo TEXT,
  GioDong TEXT,
  ViDo REAL,
  KinhDo REAL,
  BanKinh INTEGER DEFAULT 100,
  QRVer TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS Ca (
  MaCa TEXT PRIMARY KEY,
  TenCa TEXT,
  GioBD TEXT,
  GioKT TEXT,
  SoGio REAL,
  CoSo TEXT DEFAULT 'ALL'
);

CREATE TABLE IF NOT EXISTS ChamCong (
  ID TEXT PRIMARY KEY,
  Ngay TEXT NOT NULL,          -- yyyy-mm-dd
  MaNV TEXT NOT NULL,
  Ten TEXT,
  MaCS TEXT NOT NULL,
  MaCa TEXT,
  CaBD TEXT,
  CaKT TEXT,
  ViTri TEXT,
  Vao TEXT,                     -- HH:mm
  Ra TEXT,
  TreMin INTEGER DEFAULT 0,
  GioThuc REAL,
  KhaiLoai TEXT,                -- du / tang / giam
  KhaiGio REAL,
  KhaiTu TEXT,
  KhaiDen TEXT,
  KhaiGhiChu TEXT,
  CoMat TEXT,
  LyDo TEXT,
  TrangThai TEXT NOT NULL DEFAULT 'Đang làm',
  GioTinh REAL,
  XacNhanBoi TEXT,
  XacNhanLuc TEXT,
  Cach TEXT,
  GhiChu TEXT,
  CanhBao TEXT,
  AnhVao TEXT,                  -- R2 object key
  AnhRa TEXT,
  ViDo REAL,
  KinhDo REAL,
  KhoangCach REAL,
  ThietBi TEXT,
  IP TEXT,
  AsOrg TEXT,
  NguonNhap TEXT DEFAULT 'QR',  -- QR / Bu_QL / Bu_Admin
  Created TEXT DEFAULT CURRENT_TIMESTAMP,
  Updated TEXT DEFAULT CURRENT_TIMESTAMP,
  SyncedSheet INTEGER DEFAULT 0,-- 0=chưa gửi Sheet, 1=đã gửi, 2=lỗi gửi
  SyncedLuc TEXT
);
CREATE INDEX IF NOT EXISTS idx_cc_ngay ON ChamCong(Ngay);
CREATE INDEX IF NOT EXISTS idx_cc_manv ON ChamCong(MaNV);
CREATE INDEX IF NOT EXISTS idx_cc_macs ON ChamCong(MaCS);
CREATE INDEX IF NOT EXISTS idx_cc_sync ON ChamCong(SyncedSheet);

CREATE TABLE IF NOT EXISTS WifiQuan (
  IP TEXT,
  MaCS TEXT,
  GhiChu TEXT,
  Ngay TEXT,
  Boi TEXT,
  TrangThai TEXT DEFAULT 'Dùng',
  PRIMARY KEY (IP, MaCS)
);

CREATE TABLE IF NOT EXISTS WifiCho (
  ID TEXT PRIMARY KEY,
  Luc TEXT,
  MaCS TEXT,
  MaNV TEXT,
  Ten TEXT,
  IP TEXT,
  AsOrg TEXT,
  CCID TEXT,
  Loai TEXT,
  TrangThai TEXT DEFAULT 'Cho',
  XuLyBoi TEXT,
  LucXong TEXT,
  Anh TEXT,
  MsgID TEXT,
  ChatID TEXT
);
CREATE INDEX IF NOT EXISTS idx_wificho_cs_ip ON WifiCho(MaCS, IP, TrangThai);
CREATE INDEX IF NOT EXISTS idx_wificho_ccid ON WifiCho(CCID);

CREATE TABLE IF NOT EXISTS CaiDat (
  Key TEXT PRIMARY KEY,
  Value TEXT,
  Updated TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS NhatKySua (
  ID INTEGER PRIMARY KEY AUTOINCREMENT,
  Luc TEXT DEFAULT CURRENT_TIMESTAMP,
  Boi TEXT,
  Bang TEXT,
  Khoa TEXT,
  Cot TEXT,
  Cu TEXT,
  Moi TEXT,
  LyDo TEXT
);
CREATE INDEX IF NOT EXISTS idx_nk_bang_luc ON NhatKySua(Bang, Luc);

-- Secret không lưu bảng (dùng wrangler secret). QR_SECRET, API_KEY, TG_TOKEN, FEED_SECRET.
-- Khi tạo DB mới, giá trị QR_SECRET + QRVer được port từ Apps Script CaiDat qua `wrangler secret put` (em làm, không in giá trị).
