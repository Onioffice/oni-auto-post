# Ghép trang Marketing (app.html + web_extra.js) vào Worker → dist.js để dán lên Cloudflare.
# app.html dựng từ mã Marketing của app Oni Hub (KHÔNG có dữ liệu khách). Kiểm bảo mật trước khi ghép.
import json, re, os, sys
D = os.path.dirname(os.path.abspath(__file__))
html = open(os.path.join(D, 'app.html'), encoding='utf-8').read()
extra = open(os.path.join(D, 'web_extra.js'), encoding='utf-8').read().replace('</script', '<\\/script')
html = re.sub(r'(<script type="text/plain" id="extracode">)[\s\S]*?(</script>)', lambda m: m.group(1) + extra + m.group(2), html, count=1)
bad = re.findall(r'ONI0\d\d|C[ôo]ng [Tt]y (?:TNHH|C[ổo] [Pp]hần) (?!ONI HUB|một|hai|Oni)|(?<![\d.])(?!0319364530)0\d{9}(?!\d)', html)
if bad: sys.exit('DỪNG – nghi có dữ liệu khách: ' + str(set(bad))[:300])
open(os.path.join(D, 'app.html'), 'w', encoding='utf-8').write(html)
w = open(os.path.join(D, 'index.js'), encoding='utf-8').read()
open(os.path.join(D, 'dist.js'), 'w', encoding='utf-8').write(w + '\nconst APP_HTML = ' + json.dumps(html, ensure_ascii=False) + ';\n')
print('dist.js', os.path.getsize(os.path.join(D, 'dist.js')))
