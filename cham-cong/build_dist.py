import os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
parts=[('Code.gs','PHẦN 1 – Lõi: cài đặt, chấm công QR, quản lý, Telegram'),('Luong.gs','PHẦN 2 – Lương, đợt, phiếu lương, lưu trữ'),('NhanSu.gs','PHẦN 3 – Khảo sát, nhân sự'),('LichNV.gs','PHẦN 4 – Lịch của nhân viên'),('XacNhan.gs','PHẦN 5 – Xác nhận giờ, xin phép, báo quên chấm, phản hồi')]
out=['/***** CHẤM CÔNG NCAFE – BẢN GỘP (một file Code.gs duy nhất). Dán đè toàn bộ Code.gs. *****/\n']
for f,t in parts: out.append('\n/* ================================================================\n * '+t+'\n * ================================================================ */\n'+open(f,encoding='utf-8').read())
open('dist/Code.gs','w',encoding='utf-8').write('\n'.join(out))

# dòng cuối để kiểm tra dán đủ
import re as _re
_p='dist/Code.gs'; _s=open(_p,encoding='utf-8').read(); _v=_re.search(r"var VER='([^']*)'", _s).group(1)
_s=_s.rstrip()+"\n// ===== HẾT Code.gs – bản "+_v+" (dán đủ thì dòng này nằm cuối cùng) =====\n"; open(_p,'w',encoding='utf-8').write(_s)
