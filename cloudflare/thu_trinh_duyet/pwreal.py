from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':400,'height':800}); errs=[]; cons=[]
    pg.on('pageerror',lambda e: errs.append(str(e)[:220])); pg.on('console',lambda m: cons.append(m.type+': '+m.text[:160]))
    pg.goto('http://127.0.0.1:8780/lich-cua-toi'); pg.wait_for_timeout(1500)
    print('1 mở trang lần đầu:', pg.locator('h1').inner_text(), '| ô mã NV hiện:', pg.locator('#ma').is_visible())
    pg.fill('#ma','313'); pg.click('#vao'); pg.wait_for_timeout(6000)
    print('2 sau đăng nhập:', pg.locator('h1').inner_text(), '| tab:', pg.locator('#nav a').all_inner_texts()[:2], '| còn "Đang mở…":', pg.locator('#dangMo').is_visible())
    pg.reload(); pg.wait_for_timeout(400); print('3 tải lại – 0,4 giây:', '"Đang mở…" hiện' if pg.locator('#dangMo').is_visible() else 'không')
    pg.wait_for_timeout(6000); print('3 tải lại – 6 giây sau:', pg.locator('h1').inner_text(), '| còn "Đang mở…":', pg.locator('#dangMo').is_visible(), '| khung bảng tin:', pg.locator('#btKhung').count())
    print('LỖI CHƯƠNG TRÌNH:', errs[:4]); print('console lỗi:', [c for c in cons if c.startswith('error')][:4])
    b.close()
