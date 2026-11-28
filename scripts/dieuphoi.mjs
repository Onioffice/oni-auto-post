// MÁY ĐIỀU PHỐI – nối trang "Luồng tự động Marketing" trong CRM với các máy trên GitHub (chị chọn 28/11/2026, thay n8n).
// Mỗi 15 phút: 1) nhận lệnh "Chạy ngay" Giám đốc bấm trên CRM → gửi lệnh chạy đúng máy; 2) chụp trạng thái lần chạy gần nhất của từng máy
// (giờ chạy, đạt/lỗi, link) gửi về CRM để trang luồng hiển thị. Không cần khóa bí mật: GitHub tự cấp quyền cho đúng repo này.
import { crm } from './lib.mjs';
const REPO = process.env.GITHUB_REPOSITORY || 'Onioffice/oni-auto-post';
const gh = async (duong, opt = {}) => {
  const r = await fetch('https://api.github.com/repos/' + REPO + duong, { ...opt, headers: { authorization: 'Bearer ' + process.env.GITHUB_TOKEN, accept: 'application/vnd.github+json', 'x-github-api-version': '2022-11-28', ...(opt.headers || {}) } });
  if (r.status === 204) return {};
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`GitHub ${r.status}: ${j.message || ''}`);
  return j;
};
export const MAY = {
  thutin: 'thutin.yml', vonglap: 'vonglap.yml', suabai: 'vonglap.yml', soan: 'soan.yml', nhan: 'lenh.yml', video: 'video.yml',
  phacthao: 'phacthao.yml', dungvideo: 'dungvideo.yml', dang: 'dang.yml', giamsat: 'giamsat.yml', truongphong: 'truongphong.yml',
  baocao: 'baocao.yml', bantin: 'bantin.yml',
};
async function main() {
  const dau = await crm('/api/luong', { method: 'POST', body: '{}' });
  const xong = [];
  for (const l of dau.cho || []) {
    const f = MAY[l.may];
    if (!f) { xong.push({ id: l.id, tt: 'loi', ket: 'Không có máy tên ' + l.may }); continue; }
    try { await gh(`/actions/workflows/${f}/dispatches`, { method: 'POST', body: JSON.stringify({ ref: 'main' }) }); xong.push({ id: l.id, tt: 'da_gui', ket: 'Đã gửi lệnh chạy ' + f }); }
    catch (e) { xong.push({ id: l.id, tt: 'loi', ket: e.message.slice(0, 200) }); }
  }
  const may = { luc: new Date().toISOString(), ds: {} };
  for (const f of [...new Set(Object.values(MAY))]) {
    try {
      const runs = (await gh(`/actions/workflows/${f}/runs?per_page=5`)).workflow_runs || [];
      may.ds[f] = { ten: runs[0]?.name || f, gan: runs.map(r => ({ luc: r.run_started_at || r.created_at, tt: r.status, ket: r.conclusion, kieu: r.event, lan: r.run_attempt, url: r.html_url })) };
    } catch (e) { may.ds[f] = { loi: e.message.slice(0, 120) }; }
  }
  await crm('/api/luong', { method: 'POST', body: JSON.stringify({ may, xong }) });
  console.log(`Điều phối: gửi ${xong.length} lệnh; chụp ${Object.keys(may.ds).length} máy`);
}
main().catch(e => { console.error(e); process.exit(1); });
