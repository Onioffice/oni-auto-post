// CHÉP BẢNG ĐIỀU KHIỂN Cloudflare → CRM (Supabase) – chạy tay (workflow "Chép bảng điều khiển sang CRM"), Boss duyệt 25/11/2026.
// Chép: công tắc, nhật ký máy, Sổ lỗi, báo cáo tuần, yêu cầu quảng cáo. Chạy lại an toàn: dòng đã có thì bỏ qua.
const env = k => { const v = process.env[k]; if (!v) throw new Error('Thiếu ' + k); return v; };
import { crm } from './lib.mjs';

const lay = async d => { const r = await fetch(env('ONI_API_URL').replace(/\/$/, '') + d, { headers: { authorization: 'Bearer ' + env('ONI_API_KEY') } }); if (!r.ok) throw new Error('Không đọc được ' + d + ': ' + r.status); return r.json(); };
const [cd, nk, sl, bc, qc] = await Promise.all(['/api/caidat', '/api/nhatky', '/api/soloi', '/api/baocao', '/api/qc'].map(lay));
const goi = { caidat: cd.caidat || {}, nhatky: nk.nhatky || [], soloi: sl.soloi || [], baocao: bc.baocao || [], qc: qc.qc || [] };
console.log(`Trang cũ: công tắc ${Object.keys(goi.caidat).length} mục · nhật ký ${goi.nhatky.length} · Sổ lỗi ${goi.soloi.length} · báo cáo ${goi.baocao.length} · quảng cáo ${goi.qc.length}`);
console.log('Công tắc trang cũ:', JSON.stringify(goi.caidat));
const kq = await crm('/api/dk/chep', { method: 'POST', body: JSON.stringify(goi) });
console.log('CRM nhận thêm:', JSON.stringify(kq));
const sau = await crm('/api/caidat');
console.log('Công tắc trong CRM:', JSON.stringify(sau.caidat));
const nk2 = await crm('/api/nhatky'), sl2 = await crm('/api/soloi');
console.log(`CRM hiện có: nhật ký ${(nk2.nhatky || []).length} (200 dòng gần nhất) · Sổ lỗi ${(sl2.soloi || []).length} (300 dòng gần nhất)`);
