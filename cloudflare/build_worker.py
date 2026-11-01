import json, os
_HERE=os.path.dirname(os.path.abspath(__file__))
_CC=os.path.normpath(os.path.join(_HERE,'..','cham-cong'))
QR=open(os.path.join(_CC,'QR.html'),encoding='utf-8').read()
GC=open(os.path.join(_CC,'GioCong.html'),encoding='utf-8').read()
KS=open(os.path.join(_CC,'KhaoSat.html'),encoding='utf-8').read()
LT=open(os.path.join(_CC,'LichCuaToi.html'),encoding='utf-8').read()
QL=open(os.path.join(_CC,'QuanLy.html'),encoding='utf-8').read()
import re as _re
_cg=open(os.path.join(_CC,'dist','Code.gs'),encoding='utf-8').read()
_m=_re.search(r"function apiHamQL\(\)\{ return \{([\s\S]*?)\}; \}", _cg)
ALLOW_QL=sorted(set(_re.findall(r"(?:^|[,{]\s*)(\w+):", _m.group(1))))   # một nguồn duy nhất: apiHamQL() trong Code.gs
assert len(ALLOW_QL)>=90, len(ALLOW_QL)
SHIM=r'''<script>/* chạy trên Cloudflare: thay google.script.run bằng gọi /cham-cong/api (Worker chuyển tiếp về app Chấm công trên Google) */
(function(){ function goi(fn,args){ return fetch('/cham-cong/api',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({fn:fn,args:args})}).then(function(r){ if(!r.ok) throw new Error('Mạng lỗi ('+r.status+')'); return r.json(); }); }
 function mk(s,f){ return new Proxy({},{get:function(t,k){ if(k==='withSuccessHandler') return function(x){ return mk(x,f); }; if(k==='withFailureHandler') return function(x){ return mk(s,x); }; if(k==='withUserObject') return function(){ return mk(s,f); };
   return function(){ var a=Array.prototype.slice.call(arguments); goi(k,a).then(function(r){ s&&s(r); }).catch(function(e){ if(f) f(e); else alert('Lỗi: '+e.message); }); }; }}); }
 window.google={script:{run:mk(null,null)}}; })();</script>'''
def chuyen(html):
    h=html.replace('<base target="_top">','')
    h=h.replace("<head>","<head>"+SHIM,1)
    h=h.replace("var CS='<?= cs ?>', TK='<?= tk ?>';","var _q=new URLSearchParams(location.search), CS=_q.get('cs')||'', TK=_q.get('t')||'';")
    assert '<?' not in h
    return h
P={'/quan-ly':chuyen(QL), '/cham-cong':chuyen(QR), '/gio-cong':chuyen(LT), '/khao-sat':chuyen(KS), '/lich-cua-toi':chuyen(LT)}
ALLOW=['qrInfo','qrMo','qrNhanVien','qrVao','qrRa','gioCongCuaToi','ksDanhSach','ksXacMinh','ksGui','lichCuaToi','luuDangKyBanNV','themRanhThem','xoaRanhThem','nhanCa','huyNhanCa','xinPhep','baoQuenCham','phanHoi','baoHong','dsBaoHongNV','bangTinVao','datBietDanh','demCaChoDuyetT10','kiemWifiTu2510','batWifiBatBuoc','tgCallback','saoLuuSheetNgay','exportBangLuongT10','exportChamCongThang','exportCaiDatAll','exportNhanVienAll','exportLichSuLuong']
worker='''/**
 * Ncafe – trang nhân viên chạy trên Cloudflare (quét QR chấm công, lịch của tôi, giờ công, khảo sát).
 * Trang tải ngay từ Cloudflare (nhanh, định vị và camera chạy chắc chắn); dữ liệu vẫn lưu ở app Chấm công trên Google.
 * Biến môi trường cần đặt (Settings → Variables): APPS_SCRIPT_URL = link /exec của app Chấm công; API_KEY = khoá API trong tab Cài đặt.
 * Trang quản lý: /quan-ly (30/10 – thay link Apps Script; dữ liệu vẫn ở Google).
 * Đợt A (31/10): route /cham-cong-d1/* ghi thẳng D1 (nếu env.DB + env.ANH đã bind), KHÔNG phá route cũ.
 * Routes: caphemuoihue.com/cham-cong, caphemuoihue.com/cham-cong/*, caphemuoihue.com/lich-cua-toi, caphemuoihue.com/gio-cong, caphemuoihue.com/khao-sat
 */
import { handleChamCongD1 } from './chamcong-a/handler.js';
const PAGES = '''+json.dumps(P,ensure_ascii=False)+''';
const ALLOW = '''+json.dumps(ALLOW)+''';
const ALLOW_QL = '''+json.dumps(ALLOW_QL)+''';   // trang quản lý /quan-ly – hàm nào cũng tự kiểm mã PIN
function json(o, status){ return new Response(JSON.stringify(o), {status: status||200, headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}}); }
export default {
  async fetch(request, env, ctx){
    const url=new URL(request.url); const path=url.pathname.replace(/\\/+$/,'') || '/';
    // Đợt A: thử delegate sang handler D1 trước (nếu khớp /cham-cong-d1/* path). Null = tiếp tục route cũ.
    const d1Resp = await handleChamCongD1(request, env, ctx);
    if (d1Resp) return d1Resp;
    if(path==='/tg/webhook'){
      if(request.method!=='POST') return new Response('ok',{status:200});
      const sec=request.headers.get('x-telegram-bot-api-secret-token')||'';
      if(env.TG_WEBHOOK_SECRET && sec!==env.TG_WEBHOOK_SECRET) return new Response('forbidden',{status:403});
      let update; try{ update=await request.json(); }catch(e){ return new Response('bad',{status:400}); }
      try{ await fetch(env.APPS_SCRIPT_URL,{method:'POST',headers:{'content-type':'text/plain;charset=utf-8'},body:JSON.stringify({fn:'tgCallback',args:[update],key:env.API_KEY}),redirect:'follow'}); }catch(e){}
      return new Response('ok',{status:200});
    }
    if(path==='/cham-cong/api'){
      if(request.method!=='POST') return json({ok:false,msg:'Chỉ nhận POST'},405);
      let body; try{ body=await request.json(); }catch(e){ return json({ok:false,msg:'Dữ liệu gửi lên không hợp lệ'},400); }
      if(!ALLOW.includes(body.fn) && !ALLOW_QL.includes(body.fn)) return json({ok:false,msg:'Không cho phép'},403);
      if(!env.APPS_SCRIPT_URL || !env.API_KEY) return json({ok:false,msg:'Worker chưa cài APPS_SCRIPT_URL / API_KEY'},500);
      try{
        const r=await fetch(env.APPS_SCRIPT_URL,{method:'POST',headers:{'content-type':'text/plain;charset=utf-8'},body:JSON.stringify({fn:body.fn,args:Array.isArray(body.args)?body.args:[],key:env.API_KEY,ip:request.headers.get('CF-Connecting-IP')||'',asOrg:(request.cf&&request.cf.asOrganization)||''}),redirect:'follow'});
        const ct=r.headers.get('content-type')||'';
        if(!r.ok || ct.indexOf('json')<0){ try{ await r.body.cancel(); }catch(e){} return json({ok:false,msg:'App Chấm công trả về lỗi. Kiểm tra link APPS_SCRIPT_URL và quyền "Bất kỳ ai".'},502); }
        return new Response(r.body,{headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});   // chuyển thẳng, không đọc vào bộ nhớ: nhẹ CPU khi bảng lương lớn
      }catch(e){ return json({ok:false,msg:'Không kết nối được app Chấm công: '+e.message},502); }
    }
    const page=PAGES[path];
    if(page) return new Response(page,{headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-cache','permissions-policy':'geolocation=(self), camera=(self)'}});
    return new Response('Không tìm thấy trang',{status:404,headers:{'content-type':'text/plain; charset=utf-8'}});
  }
};
'''
open(os.path.join(_HERE,'worker.js'),'w',encoding='utf-8').write(worker)
print(len(worker))
