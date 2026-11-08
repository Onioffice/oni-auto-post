// BÁO CÁO TUẦN – sáng thứ Hai 8:05 (giờ VN) trên GitHub Actions.
// Tổng hợp từ dữ liệu Marketing của app: bài đã đăng 7 ngày qua theo kênh, kênh thiếu bài, việc tồn, lỗi máy.
// Không dùng AI (con số lấy thẳng từ dữ liệu, không bịa). Kết quả hiện ở Bảng điều khiển.
import { homNay, layMK, layCaiDat, ghiNhatKy, ghiLoi } from './lib.mjs';

const U = () => process.env.ONI_API_URL.replace(/\/$/, '');
const H = () => ({ 'content-type': 'application/json', authorization: 'Bearer ' + process.env.ONI_API_KEY });
const lay = async d => (await fetch(U() + d, { headers: H() })).json();

async function main() {
  if (process.env.SU_KIEN === 'schedule' && (await layCaiDat()).baocao === false) { console.log('Chị đang tắt máy Báo cáo tuần.'); return; }
  const M = await layMK(), P = (M.posts || []).filter(p => !p.del && p.tt !== 'Hủy');
  const tu = homNay(-7), den = homNay(-1), hn = homNay();
  const keys = (await lay('/api/app/keys')).keys || {};
  let mks = {}; try { mks = JSON.parse(keys.oni_mks || '{}'); } catch (e) {}
  const nk = (await lay('/api/nhatky')).nhatky || [], sl = (await lay('/api/soloi')).soloi || [];

  const daDang = P.filter(p => p.tt === 'Đã đăng' && (p.dang || p.at || '').slice(0, 10) >= tu && (p.dang || p.at || '').slice(0, 10) <= den);
  const theoKenh = {}; daDang.forEach(p => theoKenh[p.kenh] = (theoKenh[p.kenh] || 0) + 1);
  const L = [];
  L.push(`BÁO CÁO MARKETING TUẦN ${tu.slice(8, 10)}/${tu.slice(5, 7)} – ${den.slice(8, 10)}/${den.slice(5, 7)}`, '');
  L.push(`1. Bài đã đăng: ${daDang.length} bài`);
  Object.entries(theoKenh).sort((a, b) => b[1] - a[1]).forEach(([k, n]) => L.push(`   • ${k}: ${n} bài`));
  if (!daDang.length) L.push('   • Tuần qua chưa có bài nào được đánh dấu Đã đăng.');

  L.push('', '2. Kênh so với mục tiêu (30 ngày gần nhất):');
  (mks.ch || []).filter(c => !c.gb && +c.muc).forEach(c => {
    const l = (c.snaps || []).slice(-1)[0] || {};
    const p30 = l.p30 != null ? +l.p30 : null;
    L.push(`   • ${c.ten}: ${p30 == null ? 'chưa có số' : p30 + '/' + c.muc + ' bài'}${p30 != null && p30 < +c.muc ? ` – THIẾU ${+c.muc - p30} bài` : ''}${l.fol != null ? `, ${l.fol} người theo dõi` : ''}`);
  });
  (mks.ch || []).filter(c => c.gb).forEach(c => { const l = (c.snaps || []).slice(-1)[0] || {}; L.push(`   • ${c.ten}: ${l.nrev ?? '?'} đánh giá${+l.unrep ? `, ${l.unrep} chưa trả lời` : ''}`); });

  const cho = P.filter(p => p.tt === 'Chờ duyệt').length, sua = P.filter(p => p.tt === 'Cần sửa').length;
  const sap = P.filter(p => ['Đã duyệt', 'Chờ duyệt'].includes(p.tt) && p.at >= hn && p.at <= homNay(7));
  const viec = ((M.ai || {}).lenh || []).filter(l => ['Chờ AI', 'AI đang làm'].includes(l.tt)).length;
  L.push('', '3. Việc chờ chị:', `   • ${cho} bài chờ duyệt, ${sua} bài cần sửa, ${viec} việc AI đang làm`);
  L.push(`   • Lịch 7 ngày tới: ${sap.length} bài (${[...new Set(sap.map(p => p.kenh))].join(', ') || 'chưa có'})`);
  const ngayTrong = []; for (let i = 0; i < 7; i++) { const d = homNay(i); if (!sap.some(p => p.at === d && p.kenh === 'Facebook')) ngayTrong.push(d.slice(8, 10) + '/' + d.slice(5, 7)); }
  if (ngayTrong.length) L.push(`   • Facebook còn trống ngày: ${ngayTrong.join(', ')}`);

  const nkTuan = nk.filter(x => x.luc.slice(0, 10) >= tu);
  const loiTuan = sl.filter(x => x.luc.slice(0, 10) >= tu);
  L.push('', '4. Máy tự động:', `   • ${nkTuan.length} lần chạy, ${loiTuan.length} lỗi ghi vào Sổ lỗi`);
  [...new Set(loiTuan.map(x => x.viec + ': ' + x.loai))].slice(0, 5).forEach(x => L.push('   • ' + x));

  const de = [];
  (mks.ch || []).forEach(c => { const l = (c.snaps || []).slice(-1)[0] || {}; if (!c.gb && +c.muc && l.p30 != null && +l.p30 < +c.muc) de.push(`Bù bài cho ${c.ten}`); if (c.gb && +l.unrep) de.push(`Trả lời ${l.unrep} đánh giá ${c.ten}`); });
  if (cho) de.push(`Duyệt ${cho} bài đang chờ để máy đăng đúng lịch`);
  if (ngayTrong.length > 2) de.push('Giao việc cho AI soạn thêm bài Facebook cho các ngày trống');
  L.push('', '5. Đề xuất tuần này:'); (de.length ? de : ['Giữ nhịp đăng như tuần trước']).forEach((x, i) => L.push(`   ${i + 1}) ${x}`));

  const nd = L.join('\n'); console.log(nd);
  const r = await fetch(U() + '/api/baocao', { method: 'POST', headers: H(), body: JSON.stringify({ nd }) });
  if (!r.ok) throw new Error('Không lưu được báo cáo: ' + r.status);
  await ghiNhatKy('Báo cáo tuần', `${daDang.length} bài đã đăng, ${de.length} đề xuất`);
}
main().catch(async e => { await ghiLoi('Báo cáo tuần', '1. Chạy hỏng', e.message); await ghiNhatKy('Báo cáo tuần', 'Lỗi: ' + e.message); process.exit(1); });
