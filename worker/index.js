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
  if (auth.startsWith('Bearer oni_gb_')) { const k = await env.DB.get('khoa_grok'); if (k && eqTime(auth.slice(7), k)) return 'grok'; }
  if (auth.startsWith('Bearer oni_ts_')) { const k = await env.DB.get('khoa_thuso'); if (k && eqTime(auth.slice(7), k)) return 'thuso'; }
  if (env.ADMIN_PASSWORD && eqTime(cookie(req, 'oni_mk'), await sha('oni-mkt|' + env.ADMIN_PASSWORD))) return 'chi';
  return '';
}
async function ghiNK(env, viec, kq) { const a = JSON.parse((await env.DB.get('nhatky')) || '[]'); a.push({ luc: new Date().toISOString(), viec, kq: String(kq || '').slice(0, 500) }); await env.DB.put('nhatky', JSON.stringify(a.slice(-200))); }
async function docBai(env) { return JSON.parse((await env.DB.get('posts')) || '[]'); }
async function ghiBai(env, a) { await env.DB.put('posts', JSON.stringify(a.slice(-1500))); }
const maBai = () => 'B' + new Date(Date.now() + 7 * 3600e3).toISOString().slice(2, 10).replace(/-/g, '') + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();

// ---------- Dữ liệu Marketing của app (oni_mkt) – máy (GitHub) làm việc trực tiếp trên đây ----------
const gioVN = () => { const t = new Date(Date.now() + 7 * 3600e3).toISOString(); return t.slice(0, 10) + ' ' + t.slice(11, 16); };
async function docMK(env) { try { return JSON.parse((await env.DB.get('app:oni_mkt')) || 'null') || { posts: [], ideas: [], ai: {} }; } catch (e) { return { posts: [], ideas: [], ai: {} }; } }
async function ghiMK(env, M) { await env.DB.put('app:oni_mkt', JSON.stringify(M)); }
const khoaLog = x => (x.at || '') + '|' + (x.viec || '');
// Gộp bản app gửi lên với bản trên kho: không làm mất việc máy vừa làm sau lúc app tải dữ liệu (base)
function gopMK(den, kho, base) {
  if (!kho || typeof kho !== 'object') return den;
  const moiHon = x => x && x.botAt && x.botAt > base;
  const gop = (A = [], B = [], key = x => x.id) => {
    const out = A.map(a => { const b = B.find(y => key(y) === key(a)); return b && moiHon(b) && (b.botAt > (a.botAt || '')) ? b : a; });
    const co = new Set(A.map(key));
    const them = B.filter(b => !co.has(key(b)) && moiHon(b));
    return them.concat(out);
  };
  den.posts = gop(den.posts, kho.posts);
  den.ai = den.ai || {}; const ka = kho.ai || {};
  den.ai.lenh = gop(den.ai.lenh, ka.lenh);
  den.ai.log = gop(den.ai.log, ka.log, khoaLog).slice(0, 300);
  if ((ka.lastRun || '') > (den.ai.lastRun || '')) den.ai.lastRun = ka.lastRun;
  return den;
}
const maMoi = (M, at) => { const ym = String(at || gioVN()).slice(0, 7).replace('-', ''); const n = Math.max(0, ...(M.posts || []).map(p => p.ma || '').filter(m => m.startsWith('MKT-' + ym + '-')).map(m => +m.split('-')[2] || 0)); return 'MKT-' + ym + '-' + String(n + 1).padStart(3, '0'); };
function lamOp(M, o) {
  M.posts = M.posts || []; M.ai = M.ai || {}; M.ai.lenh = M.ai.lenh || []; M.ai.log = M.ai.log || [];
  const now = gioVN(), botAt = new Date().toISOString(), AI = 'AI Marketing';
  const LOG = (viec, ct) => M.ai.log.unshift({ at: now, viec: String(viec || ''), ct: String(ct || '').slice(0, 500), botAt });
  const timBai = ma => M.posts.find(x => x.ma === ma);
  switch (o.op) {
    case 'batDau': M.ai.lastRun = now; return { ok: true };
    case 'nhatKy': LOG(o.viec, o.ct); return { ok: true };
    case 'giaoViec': {   // chị (Boss) giao việc từ Bảng điều khiển
      const nd = String(o.nd || '').trim().slice(0, 2000); if (!nd) return { ok: false, err: 'chưa có nội dung' };
      M.ai = M.ai || {}; M.ai.lenh = M.ai.lenh || [];
      const l = { id: 'l' + Date.now().toString(36), at: gioVN(), by: 'Giám đốc', nd, kenh: String(o.kenh || 'Mọi kênh'), han: String(o.han || ''), tt: 'Chờ AI' };
      M.ai.lenh.unshift(l); M.ai.lenh = M.ai.lenh.slice(0, 200); LOG('Chị giao việc', nd); return { ok: true, id: l.id };
    }
    case 'nhanViec': { const l = M.ai.lenh.find(x => x.id === o.id); if (!l || ['Hủy', 'Xong'].includes(l.tt)) return { ok: false }; l.tt = 'AI đang làm'; l.nhan = now; l.botAt = botAt; LOG('Nhận việc', l.nd); return { ok: true }; }
    case 'xongViec': { const l = M.ai.lenh.find(x => x.id === o.id); if (!l || l.tt === 'Hủy') return { ok: false }; l.tt = o.loi ? 'Chờ AI' : 'Xong'; l.xong = now; l.kq = String(o.kq || ''); l.botAt = botAt; LOG((o.loi ? 'Lỗi việc: ' : 'Xong việc: ') + l.nd, o.kq); return { ok: true }; }
    case 'taoBai': {
      const b = o.bai || {}; if (!b.kenh || !b.tieude) return { ok: false, err: 'thiếu kênh/tiêu đề' };
      const tt = ['Chờ duyệt', 'Cần sửa', 'Đã duyệt'].includes(b.tt) ? b.tt : 'Chờ duyệt';
      const p = { id: 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), ma: maMoi(M, b.at), at: b.at || '', gio: b.gio || '', kenh: b.kenh, tieude: b.tieude, nd: b.nd || '', tag: b.tag || '', anh: b.anh || '', anhId: b.anhId || null, loai: b.loai || '', cd: b.cd || '', mt: b.mt || '', note: b.note || '', ph: AI, by: AI, ai: 1, tt, coGia: !!b.coGia, lenh: b.lenh || '', lienKetWeb: !!b.lienKetWeb, vong: b.vong || null,
        hist: [{ at: now, by: AI, t: tt === 'Đã duyệt' ? '🤖 AI soạn – tin tức không giá, tự đăng theo quy định chị chốt 07/11' : tt === 'Cần sửa' ? '🤖 AI soạn – máy kiểm lỗi chưa đạt: ' + (b.note || '') : '🤖 AI soạn & gửi duyệt' + (b.lenh ? ' (việc ' + b.lenh + ')' : '') }], botAt };
      M.posts.unshift(p); LOG('Soạn bài ' + p.ma + ' – ' + p.kenh, p.tieude); return { ok: true, ma: p.ma };
    }
    case 'daDang': { const p = timBai(o.ma); if (!p) return { ok: false }; p.tt = 'Đã đăng'; p.dang = o.dang || now.slice(0, 10); p.link = o.link || ''; p.hen = p.hen || { by: AI, at: now }; (p.hist = p.hist || []).push({ at: now, by: AI, t: '🤖 Đã đăng lên ' + p.kenh }); p.botAt = botAt; LOG('Đăng bài ' + p.ma + ' – ' + p.kenh, o.link || ''); return { ok: true }; }
    case 'canSua': { const p = timBai(o.ma); if (!p) return { ok: false }; p.tt = 'Cần sửa'; p.note = ((p.note || '') + ' | ' + (o.ly || '')).slice(0, 1000); (p.hist = p.hist || []).push({ at: now, by: AI, t: '🤖 ' + (o.ly || 'Cần sửa') }); p.botAt = botAt; LOG('Chuyển Cần sửa ' + p.ma, o.ly); return { ok: true }; }
    case 'suaBai': { const p = timBai(o.ma); if (!p || !p.ai) return { ok: false }; ['tieude', 'nd', 'tag', 'anh', 'anhId', 'note'].forEach(k => { if (o.bai && o.bai[k] != null) p[k] = o.bai[k]; }); p.tt = 'Chờ duyệt'; (p.hist = p.hist || []).push({ at: now, by: AI, t: '🤖 Sửa theo yêu cầu & gửi duyệt lại' }); p.botAt = botAt; LOG('Sửa bài ' + p.ma, ''); return { ok: true }; }
  }
  return { ok: false, err: 'không có lệnh ' + o.op };
}


// ---------- CỔNG GROK BOT (bot bên ngoài viết bài, chị chốt 09/11/2026) ----------
// Grok Bot chỉ được: xem việc (chủ đề chị giao + giờ trống 7 ngày tới) và nộp bài. Không duyệt / đăng / xóa được.
// Bài nộp vào hàng "grok_cho" → máy GitHub kiểm lỗi, làm hình đúng khung Oni → "Chờ duyệt".
// LICH giống scripts/vonglap.mjs (sửa lịch thì sửa cả 2 chỗ)
const LICH_G = [...Array.from({ length: 16 }, (_, i) => [String(7 + i).padStart(2, '0') + ':00', 'Website']),
  ['08:00', 'Threads'], ['13:00', 'Threads'], ['18:00', 'Threads'], ['09:00', 'LinkedIn'], ['12:00', 'LinkedIn'], ['17:00', 'LinkedIn'],
  ['10:00', 'Facebook'], ['15:00', 'Facebook'], ['20:00', 'Facebook'], ['11:00', 'Instagram'], ['14:00', 'Instagram'], ['19:00', 'Instagram'],
  ['08:00', 'Zalo'], ['16:00', 'Zalo'], ['21:00', 'Zalo']].sort((x, y) => x[0].localeCompare(y[0]));
const KENH_G = ['Website', 'Facebook', 'Instagram', 'LinkedIn', 'Threads', 'Zalo'];
const ngayVN = (d = 0) => new Date(Date.now() + 7 * 3600e3 + d * 864e5).toISOString().slice(0, 10);
const CAM_G = /tư vấn (pháp lý|luật|pháp luật|thuế|kế toán)|dịch vụ pháp lý|\b(số 1|số một|hàng đầu|tốt nhất|rẻ nhất|100%)/i;
const ID_G = { Website: 'web', Facebook: 'fb', Instagram: 'ig', LinkedIn: 'li', Threads: 'th', Zalo: 'zl' };
function gioTrongG(posts, hang, cd) {
  const song = (posts || []).filter(p => !p.del && p.tt !== 'Hủy'), now = new Date(Date.now() + 7 * 3600e3 + 3 * 3600e3), ra = [];
  for (let d = 0; d <= 7; d++) {
    const ngay = ngayVN(d), dem = {};
    for (const [gio, kenh] of LICH_G) {
      const thu = dem[kenh] = (dem[kenh] || 0) + 1;
      if (new Date(ngay + 'T' + gio + ':00Z') < now || cd['bot_' + ID_G[kenh]] === false) continue;
      const co = song.filter(p => p.at === ngay && p.kenh === kenh).length + hang.filter(h => h.ngay === ngay && h.kenh === kenh).length;
      if (co < thu && !hang.some(h => h.ngay === ngay && h.gio === gio && h.kenh === kenh)) ra.push({ ngay, gio, kenh });
    }
  }
  return ra;
}
function kiemNopG(b, kho) {
  const ly = [];
  if (!KENH_G.includes(b.kenh)) ly.push('kenh phải là một trong: ' + KENH_G.join(', '));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(b.ngay || '') || b.ngay < ngayVN(0) || b.ngay > ngayVN(7)) ly.push('ngay phải dạng YYYY-MM-DD trong 7 ngày tới');
  if (!/^\d{2}:00$/.test(b.gio || '')) ly.push('gio phải dạng HH:00 lấy đúng giờ trống');
  const td = String(b.tieude || ''), nd = String(b.nd || '');
  if (td.length < 5 || td.length > 200) ly.push('tieude 5–200 ký tự');
  if (nd.length < (b.kenh === 'Website' ? 3000 : b.kenh === 'Threads' ? 80 : 300) || nd.length > 60000) ly.push('nd quá ngắn hoặc quá dài');
  if (CAM_G.test(td + ' ' + nd)) ly.push('có từ cấm (tư vấn pháp lý/luật/thuế/kế toán, số 1, hàng đầu, tốt nhất, 100%…)');
  if (b.kenh !== 'Website' && /\d[\d.,]*\s*(đồng|vnđ|vnd|đ)(?!\p{L})|\d[\d.,]*\s*(triệu|tr|k)\s*\/\s*(tháng|giờ|ngày|năm)/iu.test(nd)) ly.push('bài mạng xã hội không được ghi giá');
  if (['Facebook', 'Instagram', 'Zalo'].includes(b.kenh)) { const h = b.hinh || {}; if (!h.t1 || !Array.isArray(h.cards) || h.cards.length < 3) ly.push('thiếu "hinh" (cần t1, t2, pill, eyebrow, boxTop, boxTitle, cards 4 thẻ, loc, cta)'); }
  if (b.kenh === 'Website') { if (!/<h2/i.test(nd)) ly.push('bài Website phải là HTML có các mục <h2>'); if (!b.hinhWeb || !Array.isArray(b.hinhWeb.lines)) ly.push('thiếu "hinhWeb" (tag, lines 3 dòng, sub 2 dòng, anhThat)'); }
  if (b.kenh === 'LinkedIn' && b.anhThat && !kho.includes(b.anhThat)) ly.push('anhThat phải là mã trong khoAnh');
  return ly;
}
async function congGrok(req, env, p) {
  const cd = JSON.parse((await env.DB.get('caidat')) || '{}');
  if (cd.grok === false) return json({ ok: false, tat: true, loi: 'Chị đang tắt cổng Grok Bot' }, 403);
  const M = await docMK(env), hang = JSON.parse((await env.DB.get('grok_cho')) || '[]');
  const kho = typeof KHO_ANH_G !== 'undefined' ? Object.keys(KHO_ANH_G) : [];
  if (p === '/api/grok/viec' && req.method === 'GET') {
    const trong = gioTrongG(M.posts, hang, cd);
    const chuDe = ((M.ai || {}).lenh || []).filter(l => ['Chờ AI', 'AI đang làm'].includes(l.tt)).map(l => ({ id: l.id, nd: l.nd, kenh: l.kenh, han: l.han }));
    const ganDay = (M.posts || []).filter(x => x.tt !== 'Hủy').sort((a, b) => (b.at || '').localeCompare(a.at || '')).slice(0, 120).map(x => x.at + ' ' + x.kenh + ': ' + x.tieude);
    await env.DB.put('grok_tinh', JSON.stringify(Object.assign(JSON.parse((await env.DB.get('grok_tinh')) || '{}'), { xem: new Date().toISOString() })));
    return json({ ok: true, homNay: ngayVN(0), gioTrong: trong, soGioTrong: trong.length, dangCho: hang.length, chuDeChiGiao: chuDe, baiGanDay: ganDay,
      khoAnh: typeof KHO_ANH_G !== 'undefined' ? KHO_ANH_G : {}, quyTac: typeof QUY_TAC_G !== 'undefined' ? QUY_TAC_G : '',
      cachNop: 'POST /api/grok/nop với {"bai":[...]} tối đa 40 bài mỗi lần. Mỗi bài: ngay, gio, kenh (lấy đúng từ gioTrong), tieude, nd, tag, chuDe, nguon[]; Facebook/Instagram/Zalo thêm "hinh"; Website thêm "hinhWeb" + "anhTrongBai"; LinkedIn thêm "anhThat".' });
  }
  if (p === '/api/grok/nop' && req.method === 'POST') {
    const b = await req.json().catch(() => ({})), ds = Array.isArray(b.bai) ? b.bai.slice(0, 40) : [];
    if (!ds.length) return json({ ok: false, loi: 'Không có bài (cần {"bai":[...]})' }, 400);
    if (hang.length >= 300) return json({ ok: false, loi: 'Hàng chờ đã đầy 300 bài, đợi máy kiểm xong rồi nộp tiếp' }, 429);
    const trong = gioTrongG(M.posts, hang, cd), nhan = [], tra = [];
    ds.forEach((x, i) => {
      const ly = kiemNopG(x, kho);
      if (!ly.length && !trong.some(t => t.ngay === x.ngay && t.gio === x.gio && t.kenh === x.kenh)) ly.push('giờ này không còn trống (đã có bài hoặc đã qua) – lấy lại gioTrong');
      if (ly.length) { tra.push({ i, kenh: x.kenh, gio: x.gio, ngay: x.ngay, ly }); return; }
      const o = { id: 'g' + Date.now().toString(36) + i + Math.random().toString(36).slice(2, 5), luc: new Date().toISOString(),
        ngay: x.ngay, gio: x.gio, kenh: x.kenh, tieude: String(x.tieude), nd: String(x.nd), tag: String(x.tag || '').slice(0, 300), chuDe: String(x.chuDe || '').slice(0, 200),
        nguon: (Array.isArray(x.nguon) ? x.nguon : []).slice(0, 5), hinh: x.hinh || null, hinhWeb: x.hinhWeb || null, anhTrongBai: Array.isArray(x.anhTrongBai) ? x.anhTrongBai.slice(0, 3) : [], anhThat: String(x.anhThat || ''), coGia: false };
      hang.push(o); nhan.push({ i, id: o.id }); trong.splice(trong.findIndex(t => t.ngay === x.ngay && t.gio === x.gio && t.kenh === x.kenh), 1);
    });
    await env.DB.put('grok_cho', JSON.stringify(hang));
    const t = JSON.parse((await env.DB.get('grok_tinh')) || '{}'); t.nop = new Date().toISOString(); t.nhan = (t.nhan || 0) + nhan.length; t.tra = (t.tra || 0) + tra.length; await env.DB.put('grok_tinh', JSON.stringify(t));
    if (nhan.length || tra.length) await ghiNK(env, 'Grok Bot', `Nộp ${ds.length} bài: nhận ${nhan.length}, trả lại ${tra.length}`);
    return json({ ok: true, nhan: nhan.length, traLai: tra, conTrong: trong.length, ghiChu: tra.length ? 'Sửa các bài bị trả lại theo "ly" rồi nộp lại' : 'Đã nhận, máy sẽ kiểm lỗi và làm hình' });
  }
  return json({ loi: 'Khóa Grok Bot chỉ dùng để xem việc và nộp bài' }, 403);
}

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
    if (p === '/' || p === '/index.html' || p === '/duyet') {
      if (ai !== 'chi') return new Response(trangDangNhap(''), { headers: { 'content-type': 'text/html; charset=utf-8' } });
      const html = (p === '/duyet' || typeof APP_HTML === 'undefined') ? TRANG : APP_HTML;   // "/" = Marketing giống app; "/duyet" = trang duyệt nhanh
      return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
    }
    if (!p.startsWith('/api/')) return new Response('Không có trang này', { status: 404 });
    // Máy chủ Apps Script xin kết nối (không cần đăng nhập): chỉ ghi "đang chờ", chị phải bấm Cho phép trên Bảng điều khiển
    if (p === '/api/thuso/xin' && req.method === 'POST') {
      const b = await req.json().catch(() => ({}));
      if (!/^oni_ts_[0-9a-f]{48}$/.test(b.khoa || '') || !/^[A-Z0-9]{4}$/.test(b.ma || '')) return json({ loi: 'Sai dạng' }, 400);
      const k = await env.DB.get('khoa_thuso'); if (k && eqTime(b.khoa, k)) return json({ ok: true, daDuyet: true });
      await env.DB.put('khoa_cho', JSON.stringify({ khoa: b.khoa, ma: b.ma, luc: new Date().toISOString() }), { expirationTtl: 86400 });
      return json({ ok: true, cho: true });
    }
    if (!ai) return json({ loi: 'Chưa đăng nhập' }, 401);
    if (ai === 'grok') return congGrok(req, env, p);
    if (ai === 'thuso') {   // máy chủ Apps Script chỉ được gửi số các kênh
      if (p === '/api/thuso' && req.method === 'POST') { const b = await req.json(), cd = JSON.parse((await env.DB.get('caidat')) || '{}'); if (cd.thuso === false) return json({ ok: false, tat: true, loi: 'Chị đang tắt máy Thu số' }); await env.DB.put('app:gsc', JSON.stringify(b.data || {})); await ghiNK(env, 'Thu số', String(b.kq || 'Đã cập nhật số các kênh')); return json({ ok: true }); }
      return json({ loi: 'Khóa này chỉ dùng để gửi số kênh' }, 403);
    }

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

    // ---- Dữ liệu Marketing của app (chuyển từ Oni Hub): chỉ các khóa Marketing, không nhận khóa khác ----
    const KHOA_APP = ['oni_mkt', 'oni_mks', 'oni_nk', 'oni_mkluu_last'];
    if (p === '/api/app/keys' && req.method === 'GET') {
      const keys = {}; for (const k of KHOA_APP) { const v = await env.DB.get('app:' + k); if (v != null) keys[k] = v; }
      return json({ ok: true, keys });
    }
    if ((p === '/api/app/keys' && req.method === 'PUT') || (p === '/api/app/keys-beacon' && req.method === 'POST')) {
      if (ai !== 'chi') return json({ loi: 'Không có quyền' }, 403);
      const b = await req.json(); let n = 0, gop = false;
      for (let [k, v] of Object.entries(b.keys || {})) if (KHOA_APP.includes(k) && typeof v === 'string' && v.length < 20e6) {
        const cu = await env.DB.get('app:' + k);
        if (k === 'oni_mkt' && cu && b.base) { try { const g = JSON.stringify(gopMK(JSON.parse(v), JSON.parse(cu), b.base)); if (g !== v) { v = g; gop = true; } } catch (e) {} }
        if (cu != null && cu !== v) await env.DB.put('app_bak:' + k, cu, { expirationTtl: 30 * 86400 }); // giữ bản trước 30 ngày
        await env.DB.put('app:' + k, v); n++;
      }
      return json({ ok: true, n, gop });
    }
    // Máy (GitHub) đọc / làm việc trên dữ liệu Marketing của app
    if (p === '/api/mk' && req.method === 'GET') { const M = await docMK(env); return json({ ok: true, mk: M }); }
    if (p === '/api/mk/op' && req.method === 'POST') {
      const b = await req.json(), M = await docMK(env), kq = [];
      if (ai !== 'bot' && !(ai === 'chi' && [].concat(b.ops || b).every(o => o.op === 'giaoViec'))) return json({ loi: 'Chỉ máy được dùng' }, 403);
      for (const o of (Array.isArray(b.ops) ? b.ops : [b])) kq.push(lamOp(M, o));
      await ghiMK(env, M); return json({ ok: true, kq });
    }
    if (p === '/api/app/drv' && req.method === 'POST') {
      const b = await req.json();
      if (b.action === 'gsc_get' || b.action === 'gsc_now') { const g = await env.DB.get('app:gsc'); return json(g ? Object.assign({ ok: true }, JSON.parse(g)) : { ok: false, err: 'Chưa có số liệu các kênh trên web (máy chủ chưa gửi sang)' }); }
      if (b.action === 'gsc_put') { await env.DB.put('app:gsc', JSON.stringify(b.data || {})); await ghiNK(env, 'Thu số', 'Cập nhật số các kênh (' + (ai === 'chi' ? 'chị bấm' : 'máy') + ')'); return json({ ok: true }); }
      if (b.action === 'mk_luutru') { const a = JSON.parse((await env.DB.get('app:luutru')) || '[]'); a.push({ luc: new Date().toISOString(), d: b }); await env.DB.put('app:luutru', JSON.stringify(a.slice(-50))); return json({ ok: true, n: (b.bai || b.posts || []).length || 0 }); }
      return json({ ok: false, err: 'Chức năng này chưa có trên bản web' });
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
      for (const k of Object.keys(b)) if (['soan', 'dang', 'nhan', 'thuso', 'baocao', 'vonglap', 'bantin', 'grok'].includes(k) || /^bot_[a-z]{2,4}$/.test(k)) c[k] = !!b[k];
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
    // ---- Yêu cầu chạy quảng cáo (chị duyệt ngân sách) ----
    if (p === '/api/qc' && req.method === 'GET') return json({ qc: JSON.parse((await env.DB.get('qc')) || '[]') });
    if (p === '/api/qc' && req.method === 'POST' && ai === 'chi') {
      const b = await req.json(), a = JSON.parse((await env.DB.get('qc')) || '[]'), ns = Math.round(Number(b.nganSach) || 0);
      if (ns < 20000 || ns > 50000000) return json({ loi: 'Ngân sách/ngày phải từ 20.000 đ đến 50.000.000 đ' }, 400);
      const o = { id: 'qc' + Date.now().toString(36), luc: new Date().toISOString(), ma: String(b.ma || ''), tieude: String(b.tieude || '').slice(0, 200), link: String(b.link || ''), kenh: String(b.kenh || 'Facebook Ads'), nganSach: ns, tt: 'Chờ kết nối Facebook Ads' };
      a.unshift(o); await env.DB.put('qc', JSON.stringify(a.slice(0, 200))); await ghiNK(env, 'Quảng cáo', 'Chị duyệt chạy QC ' + o.ma + ' – ' + ns.toLocaleString('vi-VN') + ' đ/ngày'); return json({ ok: true, qc: o });
    }
    // ---- Báo cáo tuần ----
    if (p === '/api/baocao' && req.method === 'GET') return json({ baocao: JSON.parse((await env.DB.get('baocao')) || '[]') });
    if (p === '/api/baocao' && req.method === 'POST' && ai === 'bot') {
      const b = await req.json(), a = JSON.parse((await env.DB.get('baocao')) || '[]');
      a.push({ luc: new Date().toISOString(), nd: String(b.nd || '').slice(0, 8000) });
      await env.DB.put('baocao', JSON.stringify(a.slice(-26))); return json({ ok: true });
    }
    // ---- Khóa riêng cho máy chủ Apps Script gửi số kênh (chị lấy khóa trên Bảng điều khiển) ----
    if (p === '/api/thuso/cho' && req.method === 'GET' && ai === 'chi') { const c = JSON.parse((await env.DB.get('khoa_cho')) || 'null'); return json({ ok: true, cho: c ? { ma: c.ma, luc: c.luc } : null, coKhoa: !!(await env.DB.get('khoa_thuso')) }); }
    if (p === '/api/thuso/duyet' && req.method === 'POST' && ai === 'chi') {
      const c = JSON.parse((await env.DB.get('khoa_cho')) || 'null'); if (!c) return json({ loi: 'Không có máy chủ nào đang xin' }, 404);
      await env.DB.put('khoa_thuso', c.khoa); await env.DB.delete('khoa_cho'); await ghiNK(env, 'Thu số', 'Chị cho phép máy chủ Apps Script gửi số (mã ' + c.ma + ')'); return json({ ok: true });
    }
    if (p === '/api/thuso/khoa' && req.method === 'POST' && ai === 'chi') {
      let k = await env.DB.get('khoa_thuso'); const b = await req.json().catch(() => ({}));
      if (!k || b.moi) { const r = new Uint8Array(24); crypto.getRandomValues(r); k = 'oni_ts_' + [...r].map(x => x.toString(16).padStart(2, '0')).join(''); await env.DB.put('khoa_thuso', k); }
      return json({ ok: true, khoa: k });
    }
    // ---- Cổng Grok Bot: máy lấy hàng chờ / chị tạo khóa & xem tình trạng ----
    if (p === '/api/grok/hang' && req.method === 'GET' && ai === 'bot') return json({ ok: true, hang: JSON.parse((await env.DB.get('grok_cho')) || '[]') });
    if (p === '/api/grok/xong' && req.method === 'POST' && ai === 'bot') { const b = await req.json(), ids = new Set(b.ids || []); const h = JSON.parse((await env.DB.get('grok_cho')) || '[]').filter(x => !ids.has(x.id)); await env.DB.put('grok_cho', JSON.stringify(h)); return json({ ok: true, con: h.length }); }
    if (p === '/api/grok/tinh' && req.method === 'GET' && ai === 'chi') return json({ ok: true, coKhoa: !!(await env.DB.get('khoa_grok')), cho: JSON.parse((await env.DB.get('grok_cho')) || '[]').length, tinh: JSON.parse((await env.DB.get('grok_tinh')) || '{}') });
    if (p === '/api/grok/khoa' && req.method === 'POST' && ai === 'chi') {
      const r = new Uint8Array(24); crypto.getRandomValues(r); const k = 'oni_gb_' + [...r].map(x => x.toString(16).padStart(2, '0')).join('');
      await env.DB.put('khoa_grok', k); await ghiNK(env, 'Grok Bot', 'Chị tạo khóa mới cho Grok Bot (khóa cũ hết dùng)'); return json({ ok: true, khoa: k });
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
