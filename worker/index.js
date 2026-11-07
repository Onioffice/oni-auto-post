// Oni Office – Kho bài + trang duyệt bài Marketing (Cloudflare Worker + KV)
// Biến môi trường (Cloudflare → Worker → Settings → Variables and Secrets):
//   ADMIN_PASSWORD (Secret) – mật khẩu chị Tuý dùng để vào trang duyệt
//   API_KEY        (Secret) – mã để GitHub gọi vào kho bài (cùng giá trị với GitHub secret ONI_API_KEY)
//   DB             (KV namespace binding) – nơi lưu bài
// Không có mật khẩu hay mã nào được ghi trong mã nguồn này.

const TT = ['Chờ duyệt', 'Tự đăng', 'Đã duyệt', 'Cần sửa', 'Hủy', 'Đã đăng', 'Lỗi'];

async function sha(s) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
}
function eqTime(a, b) { // so sánh không lộ thời gian
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0;
}
const json = (o, st = 200) => new Response(JSON.stringify(o), { status: st, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const cookie = (req, k) => { const m = (req.headers.get('cookie') || '').match(new RegExp('(?:^|; )' + k + '=([^;]+)')); return m ? m[1] : ''; };

async function quyen(req, env) {
  const auth = req.headers.get('authorization') || '';
  if (env.API_KEY && auth.startsWith('Bearer ') && eqTime(auth.slice(7), env.API_KEY)) return 'bot';
  if (env.ADMIN_PASSWORD && eqTime(cookie(req, 'oni_mk'), await sha('oni-mkt|' + env.ADMIN_PASSWORD))) return 'chi';
  return '';
}
async function docBai(env) { return JSON.parse((await env.DB.get('posts')) || '[]'); }
async function ghiBai(env, a) { await env.DB.put('posts', JSON.stringify(a.slice(-1500))); }
const maBai = () => 'B' + new Date(Date.now() + 7 * 3600e3).toISOString().slice(2, 10).replace(/-/g, '') + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();

export default {
  async fetch(req, env) {
    const u = new URL(req.url), p = u.pathname;
    if (p === '/dang-nhap' && req.method === 'POST') {
      const f = await req.formData();
      await new Promise(r => setTimeout(r, 400));
      if (env.ADMIN_PASSWORD && eqTime(String(f.get('mk') || ''), env.ADMIN_PASSWORD)) {
        const v = await sha('oni-mkt|' + env.ADMIN_PASSWORD);
        return new Response('', { status: 303, headers: { location: '/', 'set-cookie': `oni_mk=${v}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${30 * 86400}` } });
      }
      return new Response(trangDangNhap('Sai mật khẩu.'), { status: 401, headers: { 'content-type': 'text/html; charset=utf-8' } });
    }
    if (p === '/dang-xuat') return new Response('', { status: 303, headers: { location: '/', 'set-cookie': 'oni_mk=; Path=/; Max-Age=0' } });

    const ai = await quyen(req, env);
    if (p === '/' || p === '/index.html') {
      if (ai !== 'chi') return new Response(trangDangNhap(''), { headers: { 'content-type': 'text/html; charset=utf-8' } });
      return new Response(TRANG, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
    }
    if (!p.startsWith('/api/')) return new Response('Không có trang này', { status: 404 });
    if (!ai) return json({ loi: 'Chưa đăng nhập' }, 401);

    if (p === '/api/posts' && req.method === 'GET') return json({ posts: await docBai(env) });

    if (p === '/api/posts' && req.method === 'POST') {            // GitHub thêm bài mới
      if (ai !== 'bot') return json({ loi: 'Chỉ bot được thêm bài' }, 403);
      const b = await req.json(), a = await docBai(env), them = [];
      for (const x of (Array.isArray(b.posts) ? b.posts : [])) {
        const o = { ma: maBai(), tao: new Date().toISOString(), kenh: String(x.kenh || ''), at: String(x.at || ''), gio: String(x.gio || ''),
          tieude: String(x.tieude || ''), nd: String(x.nd || ''), tag: String(x.tag || ''), anh: String(x.anh || ''), anhId: x.anhId || null,
          tt: TT.includes(x.tt) ? x.tt : 'Chờ duyệt', coGia: !!x.coGia, note: String(x.note || ''), link: '', lichSu: [] };
        a.push(o); them.push(o.ma);
      }
      await ghiBai(env, a); return json({ ok: true, ma: them });
    }

    const m = p.match(/^\/api\/posts\/([A-Za-z0-9-]+)$/);
    if (m && req.method === 'PUT') {
      const b = await req.json(), a = await docBai(env), o = a.find(x => x.ma === m[1]);
      if (!o) return json({ loi: 'Không thấy bài' }, 404);
      const choSua = ai === 'chi' ? ['tt', 'note', 'nd', 'tieude', 'at', 'gio', 'tag'] : ['tt', 'note', 'link', 'nd', 'anh', 'anhId', 'dangLuc', 'loi'];
      for (const k of choSua) if (k in b) {
        if (k === 'tt' && !TT.includes(b.tt)) continue;
        if (ai === 'chi' && k === 'tt' && ['Đã đăng', 'Tự đăng', 'Lỗi'].includes(b.tt)) continue; // chị chỉ Duyệt / Cần sửa / Hủy / Chờ duyệt
        o[k] = b[k];
      }
      o.lichSu = (o.lichSu || []).concat([{ luc: new Date().toISOString(), ai, tt: o.tt, note: b.note || '' }]).slice(-20);
      await ghiBai(env, a); return json({ ok: true, post: o });
    }

    if (p === '/api/soloi' && req.method === 'POST' && ai === 'bot') {
      const b = await req.json(), a = JSON.parse((await env.DB.get('soloi')) || '[]');
      a.push({ luc: new Date().toISOString(), viec: String(b.viec || ''), loai: String(b.loai || ''), loi: String(b.loi || ''), sua: String(b.sua || ''), ma: String(b.ma || '') });
      await env.DB.put('soloi', JSON.stringify(a.slice(-500))); return json({ ok: true });
    }
    if (p === '/api/soloi' && req.method === 'GET') return json({ soloi: JSON.parse((await env.DB.get('soloi')) || '[]') });
    return json({ loi: 'Không hỗ trợ' }, 404);
  }
};

const CSS = `*{box-sizing:border-box}body{margin:0;font-family:'Be Vietnam Pro',system-ui,sans-serif;background:#F7F3EC;color:#2b2118}
.top{position:sticky;top:0;z-index:5;background:#6F4F31;color:#fff;padding:10px 14px;display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.top b{font-family:'Playfair Display',serif;font-size:18px;letter-spacing:1px;color:#FFE38A}.top a{color:#FFE38A;margin-left:auto;font-size:13px}
.tim{width:100%;padding:10px 12px;border-radius:10px;border:0;font:inherit}
.tabs{display:flex;gap:6px;padding:10px 14px;overflow-x:auto}.tabs button{border:1px solid #896441;background:#fff;color:#6F4F31;border-radius:999px;padding:7px 14px;font:inherit;font-weight:600;white-space:nowrap}
.tabs button.on{background:linear-gradient(90deg,#FFE38A,#E9B83A);border-color:#E9B83A;color:#4A3220}
.ds{padding:0 14px 40px;display:grid;gap:14px;grid-template-columns:repeat(auto-fill,minmax(300px,1fr))}
.the{background:#fff;border-radius:14px;box-shadow:0 2px 10px rgba(0,0,0,.06);overflow:hidden;display:flex;flex-direction:column;min-width:0}
.the img{width:100%;display:block;background:#eee;cursor:zoom-in}.the .nd{padding:12px;display:flex;flex-direction:column;gap:6px;min-width:0}
.nhan{display:inline-block;font-size:12px;padding:2px 8px;border-radius:999px;background:#F3E7D3;color:#6F4F31;font-weight:600;margin-right:4px}
.gia{background:#FDE2DD;color:#B5523B}.the h3{margin:2px 0;font-size:16px}.the pre{white-space:pre-wrap;word-break:break-word;font:inherit;font-size:14px;margin:0;max-height:220px;overflow:auto;background:#FBF8F3;padding:8px;border-radius:8px}
.nut{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}.nut button{flex:1;min-width:90px;border:0;border-radius:10px;padding:10px;font:inherit;font-weight:700;cursor:pointer}
.d{background:linear-gradient(90deg,#FFE38A,#E9B83A);color:#4A3220}.s{background:#F3E7D3;color:#6F4F31}.h{background:#eee;color:#555}
.mo{color:#896441;font-size:13px}.rong{padding:30px;text-align:center;color:#896441}
#to{position:fixed;inset:0;background:rgba(0,0,0,.85);display:none;align-items:center;justify-content:center;z-index:9;padding:10px}#to img{max-width:100%;max-height:100%}`;

function trangDangNhap(loi) {
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Oni Office – Duyệt bài</title>
<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;600;700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet"><style>${CSS}
.dn{max-width:360px;margin:12vh auto;background:#fff;border-radius:16px;padding:24px;box-shadow:0 4px 20px rgba(0,0,0,.08)}.dn h1{font-family:'Playfair Display',serif;color:#6F4F31;margin:0 0 4px}.dn input{width:100%;padding:12px;border:1px solid #d8c8b0;border-radius:10px;font:inherit;margin:14px 0}.dn button{width:100%;padding:12px;border:0;border-radius:10px;background:linear-gradient(90deg,#FFE38A,#E9B83A);font:inherit;font-weight:700;color:#4A3220}.l{color:#B5523B}</style></head>
<body><form class="dn" method="post" action="/dang-nhap"><h1>ONI OFFICE</h1><div class="mo">Trang duyệt bài Marketing</div><input type="password" name="mk" placeholder="Mật khẩu" autocomplete="current-password" required><button>Vào trang duyệt</button><div class="l">${loi}</div></form></body></html>`;
}

const TRANG = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Oni Office – Duyệt bài</title>
<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;600;700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet"><style>${CSS}</style></head><body>
<div class="top"><b>ONI OFFICE</b><span>Duyệt bài Marketing</span><a href="/dang-xuat">Đăng xuất</a><input class="tim" id="tim" placeholder="Tìm nhanh: tiêu đề, kênh, mã bài, ngày…"></div>
<div class="tabs" id="tabs"></div><div class="ds" id="ds"></div><div id="to" onclick="this.style.display='none'"><img id="toi"></div>
<script>
const TAB=[['cho','Chờ duyệt'],['lich','Lịch đăng'],['da','Đã đăng'],['sua','Cần sửa / Hủy'],['loi','Sổ lỗi']];
let P=[],L=[],tab='cho';const E=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const homNay=()=>new Date(Date.now()+7*3600e3).toISOString().slice(0,10);const dmy=s=>s?s.split('-').reverse().join('/'):'';
async function tai(){const r=await fetch('/api/posts');if(r.status===401){location.reload();return}P=(await r.json()).posts||[];try{L=(await (await fetch('/api/soloi')).json()).soloi||[]}catch(e){}ve()}
function loc(){const q=document.getElementById('tim').value.trim().toLowerCase();let a=P.slice();
 if(tab==='cho')a=a.filter(x=>x.tt==='Chờ duyệt');else if(tab==='lich')a=a.filter(x=>(x.tt==='Đã duyệt'||x.tt==='Tự đăng')&&!x.link);else if(tab==='da')a=a.filter(x=>x.tt==='Đã đăng'||x.link);else if(tab==='sua')a=a.filter(x=>x.tt==='Cần sửa'||x.tt==='Hủy'||x.tt==='Lỗi');
 if(q)a=a.filter(x=>[x.ma,x.kenh,x.tieude,x.nd,x.at,dmy(x.at)].join(' ').toLowerCase().includes(q));
 return a.sort((x,y)=>(tab==='da'?-1:1)*((x.at+x.gio)<(y.at+y.gio)?-1:1))}
function ve(){document.getElementById('tabs').innerHTML=TAB.map(([k,t])=>{const n=k==='cho'?P.filter(x=>x.tt==='Chờ duyệt').length:'';return '<button class="'+(tab===k?'on':'')+'" onclick="tab=\\''+k+'\\';ve()">'+t+(n?' ('+n+')':'')+'</button>'}).join('');
 const ds=document.getElementById('ds');
 if(tab==='loi'){ds.innerHTML=L.length?L.slice().reverse().slice(0,100).map(x=>'<div class="the"><div class="nd"><div><span class="nhan">'+E(x.loai)+'</span><span class="mo">'+E(new Date(x.luc).toLocaleString('vi-VN'))+'</span></div><b>'+E(x.viec)+'</b><div>'+E(x.loi)+'</div><div class="mo">'+E(x.sua)+' '+E(x.ma)+'</div></div></div>').join(''):'<div class="rong">Chưa có lỗi nào.</div>';return}
 const a=loc();ds.innerHTML=a.length?a.map(x=>'<div class="the">'+(x.anh?'<img loading="lazy" src="'+E(x.anh)+'" onclick="phong(this.src)">':'')+'<div class="nd"><div><span class="nhan">'+E(x.kenh)+'</span><span class="nhan">'+E(dmy(x.at))+' '+E(x.gio)+'</span>'+(x.coGia?'<span class="nhan gia">Có giá/ưu đãi</span>':'')+'<span class="nhan">'+E(x.tt)+'</span></div><h3>'+E(x.tieude)+'</h3><pre>'+E(x.nd)+'</pre>'+(x.note?'<div class="mo">Ghi chú: '+E(x.note)+'</div>':'')+(x.link?'<a class="mo" target="_blank" href="'+E(x.link)+'">Xem bài đã đăng ↗</a>':'')+'<div class="mo">Mã '+E(x.ma)+'</div>'+
 (x.tt==='Chờ duyệt'||x.tt==='Tự đăng'?'<div class="nut"><button class="d" onclick="dat(\\''+x.ma+'\\',\\'Đã duyệt\\')">✔ Duyệt</button><button class="s" onclick="sua(\\''+x.ma+'\\')">✎ Cần sửa</button><button class="h" onclick="dat(\\''+x.ma+'\\',\\'Hủy\\')">✕ Hủy</button></div>':'')+
 (x.tt==='Cần sửa'||x.tt==='Hủy'?'<div class="nut"><button class="s" onclick="dat(\\''+x.ma+'\\',\\'Chờ duyệt\\')">↺ Đưa lại Chờ duyệt</button></div>':'')+'</div></div>').join(''):'<div class="rong">Không có bài nào ở mục này.</div>'}
function phong(s){document.getElementById('toi').src=s;document.getElementById('to').style.display='flex'}
async function dat(ma,tt,note){if(tt==='Hủy'&&!confirm('Hủy bài '+ma+'?'))return;const r=await fetch('/api/posts/'+ma,{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify(note!=null?{tt,note}:{tt})});if(!r.ok){alert('Lưu không được, chị thử lại.');return}tai()}
function sua(ma){const n=prompt('Chị muốn sửa gì ở bài '+ma+'?');if(n)dat(ma,'Cần sửa',n)}
document.getElementById('tim').oninput=ve;tai();setInterval(tai,60000);
</script></body></html>`;
