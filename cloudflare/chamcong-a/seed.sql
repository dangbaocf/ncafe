-- Seed ban đầu cho D1 ncafe-chamcong-d1 (31/10 đợt A).
-- Chạy: wrangler d1 execute ncafe-chamcong-d1 --file=cloudflare/chamcong-a/seed.sql --remote
-- Idempotent: INSERT OR IGNORE (chỉ chèn khi khoá chưa có).

-- 5 cơ sở (toạ độ chi tiết + bán kính anh Bảo nhập ở tab QR; tạm để NULL)
INSERT OR IGNORE INTO CoSo(MaCS, TenCS, GioMo, GioDong, BanKinh, QRVer) VALUES
  ('TP',  'Trần Phú',        '06:30', '22:30', 100, '1'),
  ('DD',  'Đống Đa',         '06:30', '22:30', 100, '1'),
  ('TD',  'Tản Đà',          '06:30', '22:30', 100, '1'),
  ('TNV', 'Trưng Nữ Vương',  '06:30', '22:30', 100, '1'),
  ('LDD', 'Lê Đình Dương',   '06:30', '22:30', 100, '1');

-- 5 ca mẫu
INSERT OR IGNORE INTO Ca(MaCa, TenCa, GioBD, GioKT, SoGio, CoSo) VALUES
  ('FT1', 'Full sáng (6:30-14:30)',    '06:30', '14:30', 8.0, 'ALL'),
  ('FT2', 'Full chiều (14:30-22:30)',  '14:30', '22:30', 8.0, 'ALL'),
  ('PT1', 'Part sáng (6:30-12:00)',    '06:30', '12:00', 5.5, 'ALL'),
  ('PT2', 'Part trưa (12:00-17:00)',   '12:00', '17:00', 5.0, 'ALL'),
  ('PT3', 'Part tối (17:00-22:30)',    '17:00', '22:30', 5.5, 'ALL');

-- CaiDat: chép DEFAULTS không-bí-mật từ caidat.js (các giá trị cùng với mặc định; UI đọc merge với defaults nên dòng này chỉ đánh dấu "đã khởi tạo lần đầu")
-- (Em để UI ghi khi admin đổi giá trị. Không seed cứng vì sẽ phải sync 2 nơi.)
