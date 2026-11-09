# Ghép trang Marketing (app.html + web_extra.js) vào Worker → dist.js để dán lên Cloudflare.
import subprocess, sys as _s; subprocess.run([_s.executable, __import__("os").path.join(__import__("os").path.dirname(__import__("os").path.abspath(__file__)), "build_bdk.py")], check=True)
# app.html dựng từ mã Marketing của app Oni Hub (KHÔNG có dữ liệu khách). Kiểm bảo mật trước khi ghép.
import json, re, os, sys
D = os.path.dirname(os.path.abspath(__file__))
html = open(os.path.join(D, 'app.html'), encoding='utf-8').read()
extra = (open(os.path.join(D, 'dashboard.js'), encoding='utf-8').read() + '\n' + open(os.path.join(D, 'web_extra.js'), encoding='utf-8').read()).replace('</script', '<\\/script')
hubA = open(os.path.join(D, 'hub_a.css'), encoding='utf-8').read()
hubB = open(os.path.join(D, 'hub_b.css'), encoding='utf-8').read()
# CSS lấy từ app thật (hub) để giao diện giống y: phần A đặt ngay sau CSS gốc, phần B nạp sau mã Marketing
html = re.sub(r'<style id="hubA">[\s\S]*?</style>', '', html)
i = html.find('</style>') + len('</style>')
html = html[:i] + '<style id="hubA">' + hubA + '\n' + hubB + '</style>' + html[i:]
extra = "(function(){var s=document.createElement('style');s.id='hubB';s.textContent=" + json.dumps(hubB) + ";document.head.appendChild(s)})();\n" + extra
html = re.sub(r'(<script type="text/plain" id="extracode">)[\s\S]*?(</script>)', lambda m: m.group(1) + extra + m.group(2), html, count=1)
bad = re.findall(r'ONI0\d\d|C[ôo]ng [Tt]y (?:TNHH|C[ổo] [Pp]hần) (?!ONI HUB|một|hai|Oni)|(?<![\d.])(?!0319364530)0\d{9}(?!\d)', html)
if bad: sys.exit('DỪNG – nghi có dữ liệu khách: ' + str(set(bad))[:300])
open(os.path.join(D, 'app.html'), 'w', encoding='utf-8').write(html)
w = open(os.path.join(D, 'index.js'), encoding='utf-8').read()
R = os.path.join(D, '..', 'prompts')
qt = open(os.path.join(R, 'quy-tac.md'), encoding='utf-8').read() + '\n\n' + open(os.path.join(R, 'grok-bot.md'), encoding='utf-8').read()
ka = json.load(open(os.path.join(R, 'kho-anh.json'), encoding='utf-8'))
w += '\nconst QUY_TAC_G = ' + json.dumps(qt, ensure_ascii=False) + ';\nconst KHO_ANH_G = ' + json.dumps({k: v[1] for k, v in ka.items()}, ensure_ascii=False) + ';\n'
bdk = open(os.path.join(D, 'bdk.html'), encoding='utf-8').read()
if re.findall(r'ONI0\d\d|(?<![\d.])(?!0319364530|0932668642)0\d{9}(?!\d)', bdk): sys.exit('DỪNG – bdk.html nghi có dữ liệu khách')
w += '\nconst BDK_HTML = ' + json.dumps(bdk, ensure_ascii=False) + ';\n'
open(os.path.join(D, 'dist.js'), 'w', encoding='utf-8').write(w + '\nconst APP_HTML = ' + json.dumps(html, ensure_ascii=False) + ';\n')
print('dist.js', os.path.getsize(os.path.join(D, 'dist.js')))
