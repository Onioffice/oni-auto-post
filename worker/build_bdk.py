# Ghép worker/bdk.html = phần đầu bản mẫu (thư viện, biểu tượng) + CSS bài viết + worker/bdk_app.jsx
import os
D = os.path.dirname(os.path.abspath(__file__))
demo = open(os.path.join(D, '..', 'demo', 'dashboard-dong.html'), encoding='utf-8').read().split('\n')
i = next(n for n, l in enumerate(demo) if l.startswith('const Menu='))
head = '\n'.join(demo[:i + 1]).replace('<title>AI Marketing Automation Dashboard – Oni Office</title>', '<title>Oni Office – Bảng điều khiển Marketing</title><meta name="robots" content="noindex,nofollow">')
head = head.replace('</style>', '.bai h2{font-size:1.25rem;font-weight:800;color:#fff;margin:1.2em 0 .5em}.bai h3{font-size:1.05rem;font-weight:700;color:#F6E3A6;margin:1em 0 .4em}.bai p{margin:.6em 0}.bai ul,.bai ol{padding-left:1.4em;margin:.6em 0}.bai ul{list-style:disc}.bai ol{list-style:decimal}.bai li{margin:.25em 0}.bai img{max-width:100%;height:auto;border-radius:12px;margin:.8em 0}.bai a{color:#7dd3fc;text-decoration:underline}.bai figcaption{font-size:.8rem;color:#a1a1aa}\n</style>', 1)
app = open(os.path.join(D, 'bdk_app.jsx'), encoding='utf-8').read()
open(os.path.join(D, 'bdk.html'), 'w', encoding='utf-8').write(head + '\n' + app + '\n</script>\n</body>\n</html>\n')
