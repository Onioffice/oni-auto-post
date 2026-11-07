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
          tt: TT.includes(x.tt) ? x.tt : 'Chờ duyệt', coGia: !!x.coGia, lenh: String(x.lenh || ''), note: String(x.note || ''), link: '', lichSu: [] };
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

    // ---- Giao việc (lệnh của chị) ----
    if (p === '/api/lenh' && req.method === 'GET') return json({ lenh: JSON.parse((await env.DB.get('lenh')) || '[]') });
    if (p === '/api/lenh' && req.method === 'POST') {
      if (ai !== 'chi') return json({ loi: 'Chỉ chị được giao việc' }, 403);
      const b = await req.json(), a = JSON.parse((await env.DB.get('lenh')) || '[]');
      const KENH = ['Facebook', 'Instagram', 'Website'];
      const o = { id: 'L' + Date.now().toString(36).toUpperCase(), tao: new Date().toISOString(), noiDung: String(b.noiDung || '').slice(0, 3000),
        kenh: (Array.isArray(b.kenh) ? b.kenh : []).filter(k => KENH.includes(k)), ngay: /^\d{4}-\d{2}-\d{2}$/.test(b.ngay || '') ? b.ngay : '',
        tt: 'Chờ làm', ketQua: '', maBai: [] };
      if (!o.noiDung.trim() || !o.kenh.length) return json({ loi: 'Thiếu nội dung hoặc kênh' }, 400);
      a.push(o); await env.DB.put('lenh', JSON.stringify(a.slice(-300))); return json({ ok: true, lenh: o });
    }
    const ml = p.match(/^\/api\/lenh\/([A-Z0-9]+)$/);
    if (ml && req.method === 'PUT') {
      const b = await req.json(), a = JSON.parse((await env.DB.get('lenh')) || '[]'), o = a.find(x => x.id === ml[1]);
      if (!o) return json({ loi: 'Không thấy việc' }, 404);
      if (ai === 'chi') { if (b.tt === 'Hủy' && o.tt === 'Chờ làm') o.tt = 'Hủy'; else if (b.tt === 'Chờ làm' && ['Lỗi', 'Hủy'].includes(o.tt)) { o.tt = 'Chờ làm'; o.ketQua = ''; } }
      else { for (const k of ['tt', 'ketQua', 'maBai', 'ngayDang']) if (k in b) o[k] = b[k]; o.capNhat = new Date().toISOString(); }
      await env.DB.put('lenh', JSON.stringify(a)); return json({ ok: true, lenh: o });
    }
    // ---- Công tắc tự động ----
    if (p === '/api/caidat' && req.method === 'GET') return json({ caidat: JSON.parse((await env.DB.get('caidat')) || '{"soan":false,"dang":false}') });
    if (p === '/api/caidat' && req.method === 'PUT') {
      if (ai !== 'chi') return json({ loi: 'Chỉ chị được bật/tắt' }, 403);
      const b = await req.json(), c = JSON.parse((await env.DB.get('caidat')) || '{"soan":false,"dang":false}');
      for (const k of ['soan', 'dang']) if (k in b) c[k] = !!b[k];
      c.luc = new Date().toISOString(); await env.DB.put('caidat', JSON.stringify(c)); return json({ ok: true, caidat: c });
    }
    // ---- Nhật ký máy chạy ----
    if (p === '/api/nhatky' && req.method === 'GET') return json({ nhatky: JSON.parse((await env.DB.get('nhatky')) || '[]') });
    if (p === '/api/nhatky' && req.method === 'POST' && ai === 'bot') {
      const b = await req.json(), a = JSON.parse((await env.DB.get('nhatky')) || '[]');
      a.push({ luc: new Date().toISOString(), viec: String(b.viec || ''), kq: String(b.kq || '').slice(0, 500) });
      await env.DB.put('nhatky', JSON.stringify(a.slice(-200))); return json({ ok: true });
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
.dk{padding:0 14px 40px;display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(300px,1fr))}.khoi{background:#fff;border-radius:14px;padding:14px;box-shadow:0 2px 10px rgba(0,0,0,.06);min-width:0}
.khoi h2{margin:0 0 10px;font-size:17px;color:#6F4F31}.khoi textarea,.khoi input[type=date]{width:100%;padding:10px;border:1px solid #d8c8b0;border-radius:10px;font:inherit}.khoi textarea{min-height:110px}
.hang{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:8px 0}.chk{display:flex;gap:6px;align-items:center;background:#F7F3EC;border-radius:999px;padding:6px 12px;font-weight:600}
.cong{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #f0e6d6}.cong:last-child{border:0}
.sw{position:relative;width:52px;height:30px;flex:none}.sw input{opacity:0;width:0;height:0}.sw span{position:absolute;inset:0;background:#ccc;border-radius:30px;transition:.2s}.sw span:before{content:'';position:absolute;width:24px;height:24px;left:3px;top:3px;background:#fff;border-radius:50%;transition:.2s}.sw input:checked+span{background:#E9B83A}.sw input:checked+span:before{transform:translateX(22px)}
.viec{border-top:1px solid #f0e6d6;padding:10px 0;display:flex;flex-direction:column;gap:4px}.viec:first-of-type{border:0}.ok{background:#E3F1E1;color:#2F6B2A}.loi{background:#FDE2DD;color:#B5523B}.cho{background:#FFF3C9;color:#7A5A12}
.gui{width:100%;border:0;border-radius:10px;padding:12px;font:inherit;font-weight:700;background:linear-gradient(90deg,#FFE38A,#E9B83A);color:#4A3220;cursor:pointer}
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
const TAB=[['dk','Bảng điều khiển'],['cho','Chờ duyệt'],['lich','Lịch đăng'],['da','Đã đăng'],['sua','Cần sửa / Hủy'],['loi','Sổ lỗi']];
let P=[],L=[],LE=[],CD={},NK=[],tab='dk';const E=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const homNay=()=>new Date(Date.now()+7*3600e3).toISOString().slice(0,10);const dmy=s=>s?s.split('-').reverse().join('/'):'';
async function tai(){const r=await fetch('/api/posts');if(r.status===401){location.reload();return}P=(await r.json()).posts||[];try{L=(await (await fetch('/api/soloi')).json()).soloi||[]}catch(e){}try{LE=(await (await fetch('/api/lenh')).json()).lenh||[];CD=(await (await fetch('/api/caidat')).json()).caidat||{};NK=(await (await fetch('/api/nhatky')).json()).nhatky||[]}catch(e){}if(!(tab==='dk'&&document.activeElement&&/TEXTAREA|INPUT/.test(document.activeElement.tagName)))ve()}
function loc(){const q=document.getElementById('tim').value.trim().toLowerCase();let a=P.slice();
 if(tab==='cho')a=a.filter(x=>x.tt==='Chờ duyệt');else if(tab==='lich')a=a.filter(x=>(x.tt==='Đã duyệt'||x.tt==='Tự đăng')&&!x.link);else if(tab==='da')a=a.filter(x=>x.tt==='Đã đăng'||x.link);else if(tab==='sua')a=a.filter(x=>x.tt==='Cần sửa'||x.tt==='Hủy'||x.tt==='Lỗi');
 if(q)a=a.filter(x=>[x.ma,x.kenh,x.tieude,x.nd,x.at,dmy(x.at)].join(' ').toLowerCase().includes(q));
 return a.sort((x,y)=>(tab==='da'?-1:1)*((x.at+x.gio)<(y.at+y.gio)?-1:1))}
function ve(){document.getElementById('tabs').innerHTML=TAB.map(([k,t])=>{const n=k==='cho'?P.filter(x=>x.tt==='Chờ duyệt').length:'';return '<button class="'+(tab===k?'on':'')+'" onclick="tab=\\''+k+'\\';ve()">'+t+(n?' ('+n+')':'')+'</button>'}).join('');
 const ds=document.getElementById('ds');ds.className='ds';
 if(tab==='dk'){veDK();return}
 if(tab==='loi'){ds.innerHTML=L.length?L.slice().reverse().slice(0,100).map(x=>'<div class="the"><div class="nd"><div><span class="nhan">'+E(x.loai)+'</span><span class="mo">'+E(new Date(x.luc).toLocaleString('vi-VN'))+'</span></div><b>'+E(x.viec)+'</b><div>'+E(x.loi)+'</div><div class="mo">'+E(x.sua)+' '+E(x.ma)+'</div></div></div>').join(''):'<div class="rong">Chưa có lỗi nào.</div>';return}
 const a=loc();ds.innerHTML=a.length?a.map(x=>'<div class="the">'+(x.anh?'<img loading="lazy" src="'+E(x.anh)+'" onclick="phong(this.src)">':'')+'<div class="nd"><div><span class="nhan">'+E(x.kenh)+'</span><span class="nhan">'+E(dmy(x.at))+' '+E(x.gio)+'</span>'+(x.coGia?'<span class="nhan gia">Có giá/ưu đãi</span>':'')+'<span class="nhan">'+E(x.tt)+'</span></div><h3>'+E(x.tieude)+'</h3><pre>'+E(x.nd)+'</pre>'+(x.note?'<div class="mo">Ghi chú: '+E(x.note)+'</div>':'')+(x.link?'<a class="mo" target="_blank" href="'+E(x.link)+'">Xem bài đã đăng ↗</a>':'')+'<div class="mo">Mã '+E(x.ma)+'</div>'+
 (x.tt==='Chờ duyệt'||x.tt==='Tự đăng'?'<div class="nut"><button class="d" onclick="dat(\\''+x.ma+'\\',\\'Đã duyệt\\')">✔ Duyệt</button><button class="s" onclick="sua(\\''+x.ma+'\\')">✎ Cần sửa</button><button class="h" onclick="dat(\\''+x.ma+'\\',\\'Hủy\\')">✕ Hủy</button></div>':'')+
 (x.tt==='Cần sửa'||x.tt==='Hủy'?'<div class="nut"><button class="s" onclick="dat(\\''+x.ma+'\\',\\'Chờ duyệt\\')">↺ Đưa lại Chờ duyệt</button></div>':'')+'</div></div>').join(''):'<div class="rong">Không có bài nào ở mục này.</div>'}
function nhanTT(t){return '<span class="nhan '+(t==='Xong'?'ok':t==='Lỗi'?'loi':t==='Hủy'?'h':'cho')+'">'+E(t)+'</span>'}
function veDK(){const q=document.getElementById('tim').value.trim().toLowerCase();
 const lan=NK.length?NK[NK.length-1]:null;
 const ds=LE.slice().reverse().filter(x=>!q||[x.id,x.noiDung,x.kenh.join(' '),x.ngay,x.tt].join(' ').toLowerCase().includes(q)).slice(0,60);
 document.getElementById('ds').className='dk';
 document.getElementById('ds').innerHTML=
 '<div class="khoi"><h2>📝 Giao việc soạn bài</h2><div class="mo">Chị ghi chủ đề hoặc yêu cầu (VD: "Bài giới thiệu phòng họp Gò Vấp cho nhóm 10 người, nhấn mạnh có máy chiếu"). Máy soạn bài + hình, kiểm lỗi rồi đưa vào <b>Chờ duyệt</b> cho chị.</div>'+
 '<textarea id="lnd" placeholder="Chủ đề / nội dung chị muốn đăng…"></textarea>'+
 '<div class="hang">'+['Facebook','Website'].map(k=>'<label class="chk"><input type="checkbox" class="lk" value="'+k+'"'+(k==='Facebook'?' checked':'')+'> '+k+'</label>').join('')+'<span class="mo">Instagram: đang làm mẫu mới</span>'+'</div>'+
 '<div class="hang" style="flex-wrap:nowrap"><span style="white-space:nowrap">Ngày đăng</span><input type="date" id="lng" min="'+homNay()+'"></div><div class="mo">Để trống = ngày gần nhất còn trống.</div>'+
 '<div class="hang"><button class="gui" onclick="giao()">Giao việc</button></div><div class="mo">Máy nhận việc mỗi giờ từ 7:00 đến 22:00, soạn xong khoảng 5 phút.</div></div>'+
 '<div class="khoi"><h2>⚙️ Công tắc tự động</h2>'+
 '<div class="cong"><div><b>Tự soạn bài mỗi sáng</b><div class="mo">7:45 – soạn bài cho ngày kia theo trụ cột tuần</div></div><label class="sw"><input type="checkbox" '+(CD.soan?'checked':'')+' onchange="bat(\\'soan\\',this.checked)"><span></span></label></div>'+
 '<div class="cong"><div><b>Tự đăng bài</b><div class="mo">10:55 – đăng bài chị đã Duyệt và bài tin tức "Tự đăng"</div></div><label class="sw"><input type="checkbox" '+(CD.dang?'checked':'')+' onchange="bat(\\'dang\\',this.checked)"><span></span></label></div>'+
 '<div class="mo" style="margin-top:8px">Máy chạy lần cuối: '+(lan?E(new Date(lan.luc).toLocaleString('vi-VN'))+' – '+E(lan.viec)+': '+E(lan.kq):'chưa có')+'</div>'+
 '<div class="hang"><span class="nhan cho">Chờ duyệt: '+P.filter(x=>x.tt==='Chờ duyệt').length+'</span><span class="nhan">Chờ đăng: '+P.filter(x=>(x.tt==='Đã duyệt'||x.tt==='Tự đăng')&&!x.link).length+'</span><span class="nhan loi">Cần sửa: '+P.filter(x=>x.tt==='Cần sửa'||x.tt==='Lỗi').length+'</span></div></div>'+
 '<div class="khoi" style="grid-column:1/-1"><h2>📋 Việc đã giao</h2>'+(ds.length?ds.map(x=>'<div class="viec"><div>'+nhanTT(x.tt)+'<span class="nhan">'+E(x.kenh.join(', '))+'</span><span class="nhan">'+(x.ngayDang||x.ngay?E(dmy(x.ngayDang||x.ngay)):'Ngày gần nhất')+'</span><span class="mo">'+E(new Date(x.tao).toLocaleString('vi-VN'))+'</span></div><div>'+E(x.noiDung)+'</div>'+(x.ketQua?'<div class="mo">'+E(x.ketQua)+'</div>':'')+
 (x.tt==='Chờ làm'?'<div class="nut"><button class="h" onclick="lenh(\\''+x.id+'\\',\\'Hủy\\')">✕ Hủy việc</button></div>':'')+((x.tt==='Lỗi'||x.tt==='Hủy')?'<div class="nut"><button class="s" onclick="lenh(\\''+x.id+'\\',\\'Chờ làm\\')">↺ Giao lại</button></div>':'')+((x.maBai||[]).length?'<div class="nut"><button class="d" onclick="tab=\\'cho\\';document.getElementById(\\'tim\\').value=\\'\\';ve()">Xem bài trong Chờ duyệt</button></div>':'')+'</div>').join(''):'<div class="rong">Chưa giao việc nào.</div>')+'</div>'}
async function giao(){const nd=document.getElementById('lnd').value.trim(),kenh=[...document.querySelectorAll('.lk:checked')].map(x=>x.value),ngay=document.getElementById('lng').value;
 if(!nd){alert('Chị ghi nội dung cần soạn nha.');return}if(!kenh.length){alert('Chị chọn ít nhất 1 kênh.');return}
 const r=await fetch('/api/lenh',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({noiDung:nd,kenh,ngay})});if(!r.ok){alert('Lưu không được, chị thử lại.');return}
 document.getElementById('lnd').value='';tai()}
async function lenh(id,tt){if(tt==='Hủy'&&!confirm('Hủy việc này?'))return;await fetch('/api/lenh/'+id,{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify({tt})});tai()}
async function bat(k,v){const r=await fetch('/api/caidat',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify({[k]:v})});if(!r.ok)alert('Lưu không được, chị thử lại.');tai()}
function phong(s){document.getElementById('toi').src=s;document.getElementById('to').style.display='flex'}
async function dat(ma,tt,note){if(tt==='Hủy'&&!confirm('Hủy bài '+ma+'?'))return;const r=await fetch('/api/posts/'+ma,{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify(note!=null?{tt,note}:{tt})});if(!r.ok){alert('Lưu không được, chị thử lại.');return}tai()}
function sua(ma){const n=prompt('Chị muốn sửa gì ở bài '+ma+'?');if(n)dat(ma,'Cần sửa',n)}
document.getElementById('tim').oninput=ve;tai();setInterval(tai,60000);
</script></body></html>`;
