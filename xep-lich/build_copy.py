import json,html,re,sys,os
_HERE=os.path.dirname(os.path.abspath(__file__))
ver=sys.argv[1]; tests=sys.argv[2]
files=[('Code','Code.gs','Dán vào file Code (thay toàn bộ)'),('Schedule','Scheduler.gs','Dán vào file Schedule (thay toàn bộ)'),('Admin','Admin.html','Dán vào file Admin'),('CheckIn','CheckIn.html','Dán vào file CheckIn (hoặc Checkin)'),('DangKy','DangKy.html','Dán vào file DangKy (hoặc Dangky)'),('ChamCongQR','ChamCongQR.html','FILE MỚI: Tệp → + → HTML, đặt tên ChamCongQR, dán vào'),('KhaoSat','KhaoSat.html','FILE MỚI: Tệp → + → HTML, đặt tên KhaoSat, dán vào')]
data={f[0]:open(os.path.join(_HERE,f[1]),encoding='utf-8').read() for f in files}
p='/mnt/user-data/outputs/copy-code-ncafe.html'; page=open(p,encoding='utf-8').read()
page=re.sub(r'var CODE=.*?;\nObject\.keys',lambda m:'var CODE='+json.dumps(data,ensure_ascii=False).replace('</','<\\/')+';\nObject.keys',page,count=1,flags=re.S)
page=re.sub(r'<p class="lead">.*?</p>','<p class="lead">Bản '+ver+' · kiểm thử '+tests+' đạt. Bấm nút Copy, sang Apps Script, xoá hết nội dung file đó rồi dán.</p>',page,count=1,flags=re.S)
for n,_,note in files:
    page=re.sub(r'(<h2>'+n+r'</h2><p>)[^<]*(</p>)',lambda m:m.group(1)+html.escape(note)+' · '+str(len(data[n].splitlines()))+' dòng'+m.group(2),page)
page=page.replace('chọn bản <b>…u76DhWa</b>','chọn bản <b>…YuHVCeB</b> (bản các trang web đang dùng)')
open(p,'w',encoding='utf-8').write(page)
p2='/mnt/user-data/outputs/cham-cong-ncafe.html'; pg=open(p2,encoding='utf-8').read()
esc=lambda x:x.replace('&','&amp;').replace('<','&lt;').replace('>','&gt;')
for cid,f in [('c1','Code.gs'),('c2','CheckIn.html'),('c3','Admin.html'),('c5','Scheduler.gs'),('c6','DangKy.html')]:
    pg=re.sub(r'<pre id="%s">[\s\S]*?</pre>'%cid,lambda m:'<pre id="%s">'%cid+esc(open(os.path.join(_HERE,f),encoding='utf-8').read())+'</pre>',pg)
pg=re.sub(r'\(\d+ bài, mã bài ở cột phải\)','('+tests.split('/')[0]+' bài, mã bài ở cột phải)',pg)
pg=re.sub(r'Lần gần nhất: <b>[\d/]+ đạt</b>','Lần gần nhất: <b>'+tests+' đạt</b>',pg)
open(p2,'w',encoding='utf-8').write(pg)
print('ok')
