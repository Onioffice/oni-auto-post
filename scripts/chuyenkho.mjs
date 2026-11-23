// CHÉP KHO BÀI Cloudflare → kho CRM (Supabase) – chạy tay (workflow "Chép kho bài sang CRM"), Boss duyệt 24/11/2026.
// Chạy lại an toàn: bài đã có trong CRM (cùng mã) giữ nguyên, chỉ thêm bài chưa có.
const env = k => { const v = process.env[k]; if (!v) throw new Error('Thiếu ' + k); return v; };
import { crm } from './lib.mjs';

const r = await fetch(env('ONI_API_URL').replace(/\/$/, '') + '/api/mk', { headers: { authorization: 'Bearer ' + env('ONI_API_KEY') } });
if (!r.ok) throw new Error('Không đọc được kho Cloudflare: ' + r.status);
const mk = (await r.json()).mk || {};
const posts = mk.posts || [];
const dem = {}; posts.forEach(p => { dem[p.tt || '?'] = (dem[p.tt || '?'] || 0) + 1; });
console.log(`Kho Cloudflare: ${posts.length} bài`, JSON.stringify(dem), `· việc chị giao: ${(mk.ai?.lenh || []).length} · nhật ký: ${(mk.ai?.log || []).length}`);
const kq = await crm('/api/mk/import', { method: 'POST', body: JSON.stringify({ mk }) });
console.log('Kho CRM nhận:', JSON.stringify(kq));
const sau = (await crm('/api/mk')).mk || {};
console.log(`Kho CRM hiện có: ${(sau.posts || []).length} bài`);
