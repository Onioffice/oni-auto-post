// VÒNG LẶP SẢN XUẤT BÀI – chạy mỗi giờ trên GitHub Actions (chị chốt 09/11/2026).
// Mỗi ngày 12 khung mạng xã hội (08:00 → 19:00, cách nhau 1 tiếng) + 3 bài Website SEO. Máy luôn giữ đủ bài cho 24 giờ tới.
// Mỗi lần chạy: tìm khung trống → 1) tìm tin & xu hướng → 2) lên ý tưởng → 3) viết kịch bản → 4) kiểm lỗi chữ
// → 5) thiết kế hình → 6) kiểm lỗi hình → 7) xếp lịch → bài vào "Chờ duyệt" để chị duyệt (có nút duyệt hàng loạt).
// `node scripts/vonglap.mjs --kiem` chỉ đếm khung trống (không cần cài gói) để GitHub quyết định có chạy tiếp không.
import { homNay, layMK, opMK, ghiLoi, layCaiDat, ghiNhatKy } from './lib.mjs';

const MXH = [['08:00', 'Threads'], ['10:00', 'Facebook'], ['11:00', 'Threads'], ['12:00', 'LinkedIn'], ['13:00', 'Zalo'],
  ['14:00', 'Instagram'], ['15:00', 'Facebook'], ['16:00', 'Threads'], ['17:00', 'Instagram'], ['18:00', 'Threads'], ['19:00', 'Threads'], ['09:00', 'Threads'], ['20:00', 'Facebook']];
// Fanpage Facebook 3 bài/ngày (10:00, 15:00, 20:00), 3 chủ đề khác nhau (chị chốt 09/11/2026)
// Website: mỗi giờ 1 bài từ 07:00 đến 22:00 (16 bài/ngày) theo từ khóa khách tìm trên Google (chị chốt 09/11/2026 03:00)
const WEB = Array.from({ length: 16 }, (_, i) => [String(7 + i).padStart(2, '0') + ':00', 'Website']);
export const LICH = [...WEB, ...MXH].sort((x, y) => x[0].localeCompare(y[0]) || (x[1] === 'Website' ? -1 : 1));
const MOI_LAN = Number(process.env.MOI_LAN || 3);          // mỗi lần chạy làm tối đa 3 bài (giữ chi phí và thời gian)
const gioVN = () => new Date(Date.now() + 7 * 3600e3);

// Zalo OA gói tiêu chuẩn giới hạn số bài/kỳ → Zalo chỉ ngày lẻ, ngày chẵn khung 13:00 là Threads
const kenhKhung = (ngay, gio, kenh) => (kenh === 'Zalo' && Number(ngay.slice(8, 10)) % 2 === 0 ? 'Threads' : kenh);

export function khungTrong(posts) {
  const now = gioVN(), tu = new Date(now.getTime() + 2 * 3600e3), den = new Date(now.getTime() + 30 * 3600e3), ra = [];
  const song = posts.filter(p => !p.del && p.tt !== 'Hủy');
  for (let d = 0; d <= 2; d++) {
    const ngay = homNay(d), dem = {};
    for (const [gio, k] of LICH) {
      const kenh = kenhKhung(ngay, gio, k);
      const thu = dem[kenh] = (dem[kenh] || 0) + 1;            // khung thứ mấy của kênh này trong ngày
      const co = song.filter(p => p.at === ngay && p.kenh === kenh).length;   // bài đã có (kể cả lịch cũ) chiếm khung trước
      const t = new Date(ngay + 'T' + gio + ':00Z');           // giờ VN biểu diễn như UTC để so với now (đã +7)
      if (t < tu || t > den || co >= thu) continue;
      ra.push({ ngay, gio, kenh });
    }
  }
  return ra;
}

async function main() {
  const M = await layMK(), trong = khungTrong(M.posts || []);
  if (process.argv.includes('--kiem')) { console.log(trong.length); return; }
  const cd = await layCaiDat();
  if (cd.vonglap === false) { console.log('Chị đang tắt vòng lặp.'); return; }
  if (!trong.length) { console.log('24 giờ tới đã đủ bài.'); return; }
  const ID = { Website: 'web', Facebook: 'fb', Instagram: 'ig', LinkedIn: 'li', Threads: 'th', Zalo: 'zl', TikTok: 'tt', Email: 'em' };
  const lam = trong.filter(k => cd['bot_' + ID[k.kenh]] !== false).slice(0, MOI_LAN);   // bot kênh nào chị tắt thì bỏ khung đó
  if (!lam.length) { console.log('Các khung trống thuộc bot đang tắt.'); return; }
  await opMK({ op: 'batDau' });
  const { soanBai } = await import('./soan.mjs');
  const { yTuongCho } = await import('./ytuong.mjs');
  // 1) + 2) Tìm tin & lên ý tưởng cho cả lô (một lần, có tìm trên mạng)
  let ys = [];
  try { ys = await yTuongCho(lam, M.posts || []); }
  catch (e) { await ghiLoi('Vòng lặp – Ý tưởng', '1. Chạy hỏng', e.message, 'Chưa'); await ghiNhatKy('Vòng lặp', 'Lỗi: lên ý tưởng – ' + e.message); throw e; }
  const xong = [];
  for (const k of lam) {
    const y = ys.find(x => x.ngay === k.ngay && x.gio === k.gio) || ys.find(x => x.kenh === k.kenh) || {};
    const brief = [y.yTuong, y.goc && 'Góc viết: ' + y.goc, y.nguon?.length && 'Nguồn: ' + y.nguon.join(' ')].filter(Boolean).join('\n') || `Bài ${k.kenh} hữu ích cho doanh nghiệp đang tìm văn phòng / cần hỗ trợ thủ tục.`;
    try {
      const r = await soanBai({ ngay: k.ngay, kenhs: [k.kenh], yTuong: brief, gio: k.gio, timTin: false });
      xong.push(`${k.ngay.slice(8)}/${k.ngay.slice(5, 7)} ${k.gio} ${k.kenh}: ${r.ra[0]?.tt || 'không ra bài'}`);
    } catch (e) { await ghiLoi('Soạn bài ' + k.kenh, '1. Chạy hỏng', e.message, 'Chưa', k.ngay); xong.push(`${k.gio} ${k.kenh}: lỗi`); }
  }
  const kq = `Làm ${lam.length}/${trong.length} khung trống – ` + xong.join('; ');
  await ghiNhatKy('Vòng lặp', kq); await opMK({ op: 'nhatKy', viec: 'Vòng lặp soạn bài', ct: kq });
  console.log(kq);
}
if (import.meta.url === `file://${process.argv[1]}`) main().catch(async e => { console.error(e); process.exit(1); });
