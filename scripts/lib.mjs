// Hàm dùng chung: gọi kho bài (Worker), Claude API, WordPress, Facebook/Instagram.
// Mọi mã bí mật lấy từ biến môi trường (GitHub Secrets) – KHÔNG ghi trong mã.
const env = (k, batBuoc = true) => { const v = process.env[k]; if (batBuoc && !v) throw new Error(`Thiếu mã bí mật ${k} (GitHub → Settings → Secrets and variables → Actions)`); return v || ''; };

export const homNay = (them = 0) => new Date(Date.now() + 7 * 3600e3 + them * 86400e3).toISOString().slice(0, 10);
export const thuTrongTuan = ymd => new Date(ymd + 'T00:00:00Z').getUTCDay(); // 0 = CN

// ---------- Kho bài (Cloudflare Worker) ----------
async function kho(duong, opt = {}) {
  const r = await fetch(env('ONI_API_URL').replace(/\/$/, '') + duong, { ...opt, headers: { 'content-type': 'application/json', authorization: 'Bearer ' + env('ONI_API_KEY'), ...(opt.headers || {}) } });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Kho bài lỗi ${r.status}: ${j.loi || ''}`);
  return j;
}
export const layBai = async () => (await kho('/api/posts')).posts || [];
export const themBai = posts => kho('/api/posts', { method: 'POST', body: JSON.stringify({ posts }) });
export const suaBai = (ma, o) => kho('/api/posts/' + ma, { method: 'PUT', body: JSON.stringify(o) });
export const layLenh = async () => (await kho('/api/lenh')).lenh || [];
export const suaLenh = (id, o) => kho('/api/lenh/' + id, { method: 'PUT', body: JSON.stringify(o) });
export const layCaiDat = async () => (await kho('/api/caidat')).caidat || {};
export async function ghiNhatKy(viec, kq) { try { await kho('/api/nhatky', { method: 'POST', body: JSON.stringify({ viec, kq }) }); } catch (e) { console.error('Không ghi được nhật ký:', e.message); } }
export async function ghiLoi(viec, loai, loi, sua = 'Chưa', ma = '') {
  console.error(`[Sổ lỗi] ${viec} | ${loai} | ${loi}`);
  try { await kho('/api/soloi', { method: 'POST', body: JSON.stringify({ viec, loai, loi, sua, ma }) }); } catch (e) { console.error('Không ghi được Sổ lỗi:', e.message); }
}

// ---------- Claude API ----------
export const MODEL = process.env.ONI_MODEL || 'claude-sonnet-5-5';
export async function claude({ system, messages, max_tokens = 8000, tools }) {
  for (let lan = 1; lan <= 3; lan++) {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': env('ANTHROPIC_API_KEY'), 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: MODEL, max_tokens, system, messages, ...(tools ? { tools } : {}) })
    });
    const j = await r.json();
    if (r.ok) return (j.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n');
    if (lan === 3 || ![429, 500, 529].includes(r.status)) throw new Error(`Claude API lỗi ${r.status}: ${j.error?.message || ''}`);
    await new Promise(s => setTimeout(s, 15000 * lan));
  }
}
export function layJSON(text) {
  const thu = [];
  const f = text.match(/```(?:json)?\s*([\s\S]*?)```/); if (f) thu.push(f[1]);
  const i = text.indexOf('{'), j = text.lastIndexOf('}'); if (i >= 0 && j > i) thu.push(text.slice(i, j + 1));
  for (const t of thu) { try { return JSON.parse(t); } catch (e) {} }
  throw new Error('Claude không trả về JSON: ' + text.replace(/\s+/g, ' ').slice(0, 300));
}

// ---------- WordPress (onioffice.vn) ----------
const wpAuth = () => 'Basic ' + Buffer.from(env('WP_USERNAME') + ':' + env('WP_APP_PASSWORD').replace(/\s+/g, '')).toString('base64');
const wpUrl = d => env('WP_URL').replace(/\/$/, '') + '/wp-json/wp/v2' + d;
export async function wpTaiAnh(buf, tenFile, alt, loai = 'image/png') {
  const r = await fetch(wpUrl('/media'), { method: 'POST', headers: { authorization: wpAuth(), 'content-type': loai, 'content-disposition': `attachment; filename="${tenFile}"` }, body: buf });
  const j = await r.json();
  if (!r.ok || !j.id) throw new Error('Tải ảnh lên website lỗi: ' + (j.message || r.status));
  if (alt) await fetch(wpUrl('/media/' + j.id), { method: 'POST', headers: { authorization: wpAuth(), 'content-type': 'application/json' }, body: JSON.stringify({ alt_text: alt }) });
  return { id: j.id, url: j.source_url };
}
export async function wpTimAnh(tu) { // ảnh thật của Oni trong thư viện website
  const r = await fetch(wpUrl('/media?per_page=20&search=' + encodeURIComponent(tu)), { headers: { authorization: wpAuth() } });
  const a = await r.json(); return Array.isArray(a) ? a.filter(x => /^image\//.test(x.mime_type)).map(x => x.source_url) : [];
}
export async function wpDangBai({ tieude, html, anhId, ngay }) {
  const r = await fetch(wpUrl('/posts'), { method: 'POST', headers: { authorization: wpAuth(), 'content-type': 'application/json' },
    body: JSON.stringify({ title: tieude, content: html, status: 'publish', featured_media: anhId || undefined, ...(ngay ? { date: ngay } : {}) }) });
  const j = await r.json(); if (!r.ok || !j.id) throw new Error('Đăng bài website lỗi: ' + (j.message || r.status));
  return j.link;
}

// ---------- Facebook / Instagram (Graph API) ----------
const G = 'https://graph.facebook.com/v21.0';
async function graph(duong, params, method = 'POST') {
  const body = new URLSearchParams({ ...params, access_token: env('FB_PAGE_ACCESS_TOKEN') });
  const r = method === 'GET' ? await fetch(`${G}${duong}?${body}`) : await fetch(G + duong, { method, body });
  const j = await r.json(); if (!r.ok || j.error) throw new Error('Facebook lỗi: ' + (j.error?.message || r.status));
  return j;
}
export async function fbDangAnh(anhUrl, caption) {
  const j = await graph(`/${env('FB_PAGE_ID')}/photos`, { url: anhUrl, caption, published: 'true' });
  return 'https://www.facebook.com/' + (j.post_id || j.id);
}
export async function igDangAnh(anhUrl, caption) {
  const ig = env('IG_USER_ID');
  const c = await graph(`/${ig}/media`, { image_url: anhUrl, caption });
  for (let i = 0; i < 20; i++) { // chờ Instagram xử lý ảnh
    const s = await graph(`/${c.id}`, { fields: 'status_code' }, 'GET');
    if (s.status_code === 'FINISHED') break;
    if (s.status_code === 'ERROR') throw new Error('Instagram không nhận ảnh');
    await new Promise(r => setTimeout(r, 5000));
  }
  const p = await graph(`/${ig}/media_publish`, { creation_id: c.id });
  const l = await graph(`/${p.id}`, { fields: 'permalink' }, 'GET');
  return l.permalink || 'https://www.instagram.com/onioffice/';
}

// ---------- Kiểm lỗi chữ (phần máy kiểm được) ----------
const CAM = [/tư vấn\s+(pháp lý|luật|thuế|kế toán)/i, /dịch vụ tư vấn thành lập/i, /\bsố\s*1\b/i, /100\s*%/, /đắc địa/i, /\bxịn\b/i, /rẻ nhất/i, /tốt nhất/i, /hàng đầu/i, /uy tín nhất/i, /cam kết tuyệt đối/i, /tư vấn\s+pháp luật/i, /dịch vụ pháp lý/i, /hình ảnh minh họa/i, /(?<!(ít|thống|duy|hợp|đồng|thứ|chuyên)\s)\bnhất\b(?!\s*(là|định|quán|thiết|trí))/i, /đảm bảo\s+(được\s+)?(cấp|duyệt|thành công)/i];
const NOI_BO = [/NHÁP/, /chờ chị duyệt/i, /====/, /File nguồn/i, /\bBot\b/];
export function kiemChu(bai) {
  const loi = [], all = [bai.tieude, bai.nd, JSON.stringify(bai.hinh || {})].join('\n');
  for (const r of CAM) if (r.test(all)) loi.push('Có từ cấm: ' + r.source);
  for (const r of NOI_BO) if (r.test(bai.nd || '')) loi.push('Còn chữ nội bộ: ' + r.source);
  if (/\d[\d.,]*\s*(đồng|đ(?![\p{L}])|vnđ|vnd|k(?![\p{L}])|nghìn|ngàn|triệu|usd|\$)/iu.test(bai.nd || '')) loi.push('Caption có ghi giá (giá chỉ được để trên hình)');
  if (/Oni\s*\n\s*Office/.test(bai.nd || '')) loi.push('"Oni Office" bị tách dòng');
  const GIA = /\d[\d.,]*\s*(đồng|đ(?![\p{L}])|vnđ|vnd|k(?![\p{L}])|nghìn|ngàn|triệu|usd|\$)|chưa VAT|gồm VAT/iu;
  if (['Facebook', 'Instagram'].includes(bai.kenh) && GIA.test(JSON.stringify(bai.hinh || {}) + JSON.stringify(bai.trang || []))) loi.push('Ảnh Facebook/Instagram không được ghi giá');
  const soTag = ((bai.nd || '') + ' ' + (bai.tag || '')).match(/#[\p{L}\p{N}_]+/gu)?.filter((v, i, a) => a.indexOf(v) === i).length || 0;
  if (bai.kenh === 'Facebook' && (soTag < 3 || soTag > 5)) loi.push(`Facebook cần 3–5 hashtag (đang ${soTag})`);
  if (bai.kenh === 'Instagram' && (soTag < 6 || soTag > 8)) loi.push(`Instagram cần 6–8 hashtag (đang ${soTag})`);
  if (bai.kenh === 'Facebook' && !/Oni Office/.test((bai.nd || '').split('\n').slice(-6).join('\n'))) loi.push('Facebook thiếu chữ ký công ty cuối bài');
  if (/[\u{1D400}-\u{1D7FF}]/u.test(all)) loi.push('Có chữ đậm/nghiêng kiểu Unicode (gây mất dấu, lệch phông) – dùng chữ thường');
  const h = bai.hinh;
  if (h && h.cards) {
    if (h.cards.length !== 4) loi.push('Hình phải đúng 4 thẻ');
    h.cards.forEach((c, i) => { if ((c.t || '').length > 22) loi.push(`Thẻ ${i + 1}: tiêu đề quá 22 ký tự`); if ((c.s || '').length > 34) loi.push(`Thẻ ${i + 1}: dòng phụ quá 34 ký tự`); });
  }
  if (/0932\s?668\s?642/.test(all) === false && bai.kenh !== 'Instagram') loi.push('Thiếu Hotline/Zalo 0932 668 642 trong bài');
  return loi;
}
