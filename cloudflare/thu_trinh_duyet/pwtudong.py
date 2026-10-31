import sys
from playwright.sync_api import sync_playwright
nhan=sys.argv[1]
with sync_playwright() as p:
    b=p.chromium.launch()
    for kieu, kv in [('nhớ mã + 4 số cuối', {'ncafe_ma':'313','ncafe_sdt4':'1234'}), ('nhớ phiên', {'ncafe_phien':'phien-thu'})]:
        pg=b.new_page(viewport={'width':400,'height':800}); errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)[:150]))
        pg.goto('http://127.0.0.1:8780/lich-cua-toi'); pg.evaluate("(function(kv){ localStorage.clear(); sessionStorage.clear(); for(var k in kv) localStorage.setItem(k,kv[k]); })("+str(kv).replace("'",'"')+")")
        open('/tmp/mock_gas.log','w').close(); pg.reload(); pg.wait_for_timeout(6000)
        n=sum(1 for x in open('/tmp/mock_gas.log') if x.strip()=='lichCuaToi')
        print(nhan, '|', kieu, '→ còn "Đang mở…":', pg.locator('#dangMo').is_visible(), '| gửi lệnh tải lịch:', n, '| trang đang:', pg.locator('h1').inner_text(), '| lỗi:', errs[:1])
        pg.close()
    b.close()
