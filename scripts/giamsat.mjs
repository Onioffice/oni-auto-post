// AGENT KỸ THUẬT – GIÁM SÁT & SỬA LỖI HỆ THỐNG (chị tuyển 28/11/2026).
// Chạy 11:47 và 20:47 mỗi ngày: 1) xem tất cả máy chạy tự động trên GitHub trong 24 giờ qua – máy nào lỗi lần đầu thì tự chạy lại 1 lần;
// lỗi lần 2 thì báo Giám đốc; 2) đọc Sổ lỗi CRM 24 giờ qua, gom theo việc; 3) tìm việc bị kẹt (video quá 3 lần sửa, phác thảo/gói dựng lỗi);
// 4) ghi nhật ký "Kỹ thuật" – dòng bắt đầu "CẦN GIÁM ĐỐC" là việc chị phải xem. Agent không sửa dữ liệu khách, không đăng, không duyệt.
import { crm, ghiNhatKy } from './lib.mjs';
const REPO = process.env.GITHUB_REPOSITORY || 'Onioffice/oni-auto-post';
const TOKEN = process.env.GITHUB_TOKEN || '';
const gh = async (duong, opt = {}) => {
  const r = await fetch('https://api.github.com/repos/' + REPO + duong, { ...opt, headers: { authorization: 'Bearer ' + TOKEN, accept: 'application/vnd.github+json', 'x-github-api-version': '2022-11-28', ...(opt.headers || {}) } });
  if (r.status === 201 || r.status === 204) return {};
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`GitHub ${r.status}: ${j.message || ''}`);
  return j;
};

async function mayChay() {
  const tu = new Date(Date.now() - 26 * 3600e3).toISOString().slice(0, 19);
  const runs = (await gh(`/actions/runs?per_page=100&created=>=${tu}`)).workflow_runs || [];
  const moiNhat = new Map();
  for (const r of runs) { if (/giamsat/.test(r.path || '')) continue; if (!moiNhat.has(r.workflow_id)) moiNhat.set(r.workflow_id, r); }
  const chayLai = [], baoChi = [];
  for (const r of moiNhat.values()) {
    if (r.status !== 'completed' || !['failure', 'timed_out', 'startup_failure'].includes(r.conclusion)) continue;
    if ((r.run_attempt || 1) < 2) {
      try { await gh(`/actions/runs/${r.id}/rerun-failed-jobs`, { method: 'POST' }); chayLai.push(r.name); }
      catch (e) { baoChi.push(`${r.name} (không chạy lại được: ${e.message.slice(0, 80)})`); }
    } else baoChi.push(`${r.name} lỗi ${r.run_attempt} lần – ${r.html_url}`);
  }
  return { tong: moiNhat.size, chayLai, baoChi };
}

async function soLoi() {
  const ds = (await crm('/api/soloi')).soloi || [];
  const moc = Date.now() - 24 * 3600e3;
  const moi = ds.filter(x => Date.parse(x.luc || 0) >= moc && !/^Đã/i.test(x.sua || ''));
  const nhom = {};
  for (const x of moi) { const k = x.viec || 'Khác'; (nhom[k] = nhom[k] || []).push(x.loi || ''); }
  return Object.entries(nhom).map(([k, l]) => `${k}: ${l.length} lỗi (gần nhất: ${String(l[l.length - 1]).slice(0, 90)})`);
}

async function viecKet() {
  const ds = (await crm('/api/video')).video || [];
  const ket = [];
  for (const v of ds) {
    if (v.trang_thai === 'can_sua' && (v.lan_sua || 0) >= 3) ket.push(`Video #${v.id} "${String(v.tieu_de).slice(0, 50)}" đã tự sửa 3 lần – chị Trả lại kèm ghi chú hoặc Hủy`);
    if (v.trang_thai === 'phac_xong' && Date.now() - Date.parse(v.cap_nhat || 0) > 3 * 86400e3) ket.push(`Video #${v.id} chờ chị duyệt phác thảo hơn 3 ngày`);
    if (v.trang_thai === 'dung' && v.goi_dung?.buoc === 'cho_lam_clip' && Date.now() - Date.parse(v.goi_dung.luc || 0) > 7 * 86400e3) ket.push(`Video #${v.id} có gói dựng hơn 7 ngày chưa làm clip – cần phiên làm clip với máy chị`);
  }
  return ket;
}

async function main() {
  const out = [];
  let may = { tong: 0, chayLai: [], baoChi: [] };
  try { may = await mayChay(); } catch (e) { out.push('Không đọc được GitHub: ' + e.message.slice(0, 120)); }
  const loi = await soLoi().catch(e => ['Không đọc được Sổ lỗi: ' + e.message.slice(0, 100)]);
  const ket = await viecKet().catch(() => []);
  out.push(`${may.tong} máy chạy 24 giờ qua` + (may.chayLai.length ? `; tự chạy lại: ${may.chayLai.join(', ')}` : '; không máy nào lỗi cần chạy lại'));
  if (loi.length) out.push('Sổ lỗi: ' + loi.join(' | '));
  const canGD = [...may.baoChi, ...ket];
  const tom = `Kỹ thuật – ${out.join(' · ')}${canGD.length ? ' · CẦN GIÁM ĐỐC: ' + canGD.join(' | ') : ' · Không có việc cần Giám đốc'}`;
  await ghiNhatKy('Kỹ thuật', tom.slice(0, 495)); console.log(tom);
}
main().catch(async e => { console.error(e); await ghiNhatKy('Kỹ thuật', 'Lỗi: ' + e.message.slice(0, 300)); process.exit(1); });
