  var tabs = {
    NhanVien: [['MaNV','Ten','ViTri','ChucVu','ViTriKiem','Loai','CoSoChinh','TangCaDuoc','SDT','TrangThai','GhiChu']],
    // DoanhThuTB = doanh thu trung bình/ngày (triệu), dùng để so giờ công với doanh thu
    CoSo:     [['MaCS','TenCS','Key','GioMo','GioDong','DoanhThuTB'],
               ['TP','Trần Phú','tp2026','06:30','22:30',24],['DD','Đống Đa','dd2026','06:30','22:30',16.5],
               ['TD','Tản Đà','td2026','06:30','18:30',7],['TNV','Trưng Nữ Vương','tnv2026','06:30','18:30',5.5],
               ['LDD','Lê Đình Dương','ldd2026','06:30','22:30',12]],
    // CoSo: ALL = mọi cơ sở, hoặc liệt kê mã cách nhau bằng dấu phẩy
    Ca:       [['MaCa','TenCa','GioBD','GioKT','SoGio','LoaiNV','CoSo'],
               ['FT1','Full sáng','06:30','14:30',8,'FT','ALL'],
               ['FT2','Full chiều','14:30','22:30',8,'FT','TP,DD,LDD'],
               ['FT3','Full 8h-17h','08:00','17:00',8,'FT','ALL'],
               ['FT4','Full 10h30-18h30','10:30','18:30',8,'FT','TD,TNV'],
               ['FT10','Dài 10,5','06:30','17:00',10.5,'FT','ALL'],
               ['FT11','Dài 11,5','06:30','18:00',11.5,'FT','ALL'],
               ['PT1','Part sáng','06:30','12:00',5.5,'PT','ALL'],
               ['PT2','Part trưa','12:00','17:00',5,'PT','ALL'],
               ['PT4','Part chiều TD/TNV','12:00','18:30',6.5,'PT','TD,TNV'],
               ['PT3','Part tối','17:00','22:30',5.5,'PT','TP,DD,LDD']],
    // Định mức người mỗi ca: ToiThieu = tháng 10/2026, Chuan = tháng 6–8/2026 (thấp điểm), CaoDiem = tháng 1–3/2026
    DinhMuc:  [['MaCS','Ca','ViTri','ToiThieu','Chuan','CaoDiem'],
               ['TP','Sáng','Phục vụ',3,4,5],['TP','Sáng','Pha chế',3,3,4],['TP','Trưa','Phục vụ',1,2,2],['TP','Trưa','Pha chế',1,2,1],['TP','Tối','Phục vụ',3,4,4],['TP','Tối','Pha chế',2,2,3],
               ['DD','Sáng','Phục vụ',2,3,4],['DD','Sáng','Pha chế',3,4,4],['DD','Trưa','Pha chế',1,1,1],['DD','Tối','Phục vụ',1,2,1],['DD','Tối','Pha chế',2,3,2],['DD','Sáng','Rửa ly',1,1,1],['DD','Tối','Rửa ly',1,1,1],
               ['TD','Sáng','Phục vụ',1,2,2],['TD','Sáng','Pha chế',2,2,2],['TD','Trưa','Phục vụ',1,1,1],['TD','Trưa','Pha chế',1,1,1],
               ['TNV','Sáng','Phục vụ',1,2,2],['TNV','Sáng','Pha chế',2,2,3],['TNV','Trưa','Pha chế',1,1,1],
               ['LDD','Sáng','Thu ngân',1,1,1],['LDD','Sáng','Pha chế',1,2,2],['LDD','Sáng','Phục vụ',2,3,3],['LDD','Trưa','Phục vụ',1,1,1],['LDD','Tối','Thu ngân',1,1,1],['LDD','Tối','Pha chế',1,2,2],['LDD','Tối','Phục vụ',2,2,2]],
    LichLam:  [['Ngay','MaCS','MaNV','MaCa','ViTri','GhiChu']],
    ChamCong: [['ID','ThoiGian','Ngay','MaNV','Ten','MaCS','Loai','MaCa','TreMin','SomMin','AnhURL','GhiChu','TangCaGio','LyDoTC','DuyetTC']],
    CaiDat:   [['Key','Value'],['GRACE_TRE',10],['GRACE_SOM',10],['ADMIN_PIN','1234'],
               ['QL_PIN','5678'],['DRIVE_FOLDER_ID',''],['GHEP_CA_PHUT',90],['TANG_CA_PHUT',30],['DON_DEP_PHUT',30],['THANG_CAO_DIEM','10,11,12,1,2']]
  };