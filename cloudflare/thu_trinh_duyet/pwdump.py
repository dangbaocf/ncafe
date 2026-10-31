import json
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page()
    pg.goto('file:///mnt/user-data/outputs/demo-2-app-ncafe.html'); pg.wait_for_timeout(9500)
    r=pg.evaluate("(function(){ var C=APPS.CC; C.luuCaiDatChung({pin:'1234',kv:{BANGTIN_URL:'http://127.0.0.1:8770',BANGTIN_KEY:'khoa-bang-tin-THU'}}); return JSON.stringify({lich:C.lichCuaToi({ma:'313',sdt4:''}), gio:C.gioCongCuaToi({ma:'313',sdt4:''}), hong:C.dsBaoHongNV({ma:'313',sdt4:''})}); })()")
    open('/tmp/lct_data.json','w').write(r); d=json.loads(r); print('lichCuaToi ok:', d['lich'].get('ok'), '| có vé bảng tin:', bool(d['lich'].get('bt')), '| gio ok:', d['gio'].get('ok'), '| hong ok:', d['hong'].get('ok'))
    b.close()
