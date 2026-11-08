// CÔNG NHÂN BẢN TIN EMAIL – thứ Năm 9:00 (giờ VN). Soạn bản tin tuần gửi khách từ các bài hay trong tuần + tin mới cho doanh nghiệp / FDI.
// Chỉ SOẠN và đưa vào "Chờ duyệt" (kênh Email). Gửi cho khách là việc ra ngoài: chị duyệt rồi gửi ở trang "Bản tin email" của app Oni Hub
// (danh sách email khách nằm trên máy chủ Apps Script, không đưa lên web).
import fs from 'node:fs';
import { homNay, layMK, opMK, ghiLoi, claude, layJSON, kiemChu, layCaiDat, ghiNhatKy } from './lib.mjs';
import { NGUON } from './ytuong.mjs';
const QUY_TAC = fs.readFileSync(new URL('../prompts/quy-tac.md', import.meta.url), 'utf8');

async function main() {
  if (process.env.SU_KIEN === 'schedule' && (await layCaiDat()).bantin === false) { console.log('Chị đang tắt công nhân Bản tin.'); return; }
  const M = await layMK(), P = (M.posts || []).filter(p => !p.del && p.tt !== 'Hủy');
  const ngay = homNay(1);
  if (P.some(p => p.kenh === 'Email' && p.at >= homNay(-3))) { console.log('Tuần này đã có bản tin.'); return; }
  const tuan = P.filter(p => ['Website', 'Facebook', 'LinkedIn'].includes(p.kenh) && p.at >= homNay(-7) && p.at <= homNay(1))
    .map(p => `- ${p.at} ${p.kenh}: ${p.tieude}${p.link ? ' (' + p.link + ')' : ''}`).join('\n');
  const t = await claude({
    max_tokens: 8000, system: QUY_TAC,
    tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 3 }],
    messages: [{ role: 'user', content: `Soạn BẢN TIN EMAIL TUẦN của Oni Office gửi khách (doanh nghiệp Việt và FDI đang thuê văn phòng / văn phòng ảo / phòng họp). Gửi ngày ${ngay}.
${NGUON}
Nội dung: lời chào ngắn; 2–3 tin/thay đổi chính sách đáng chú ý trong tuần cho doanh nghiệp (có nguồn chính thống); 2–3 bài hay của Oni trong tuần (dùng link nếu có); 1 mẹo vận hành văn phòng; lời mời liên hệ Hotline/Zalo 0932 668 642, sales@onioffice.vn.
Không ghi giá, không hứa kết quả thay cơ quan nhà nước, không dùng "nhất", "số 1", "100%". Không nêu tên khách.
Bài trong tuần:
${tuan || '(chưa có)'}
Trả lời DUY NHẤT:
\`\`\`json
{"tieude":"Tiêu đề email ≤ 70 ký tự","nd":"<p>…HTML email đơn giản: h2, p, ul, a…</p>","nguon":["https://…"]}
\`\`\`` }]
  });
  const b = { kenh: 'Email', ...layJSON(t) };
  const loi = kiemChu(b);
  if (!/0932\s?668\s?642/.test(b.nd || '')) loi.push('Bản tin thiếu Hotline/Zalo');
  const r = await opMK({ op: 'taoBai', bai: { kenh: 'Email', at: ngay, gio: '09:00', tieude: b.tieude, nd: b.nd, loai: 'Bản tin email',
    tt: loi.length ? 'Cần sửa' : 'Chờ duyệt', vong: { tim: 'ok', yt: 'ok', kb: 'ok', kc: loi.length ? 'loi' : 'ok', tk: '—', kh: '—', ll: 'ok' },
    note: (loi.length ? 'Lỗi kiểm: ' + loi.join('; ') : 'Đã kiểm lỗi: Đạt') + ' | Gửi khách: chị duyệt rồi gửi ở trang Bản tin email (app Oni Hub). Nguồn: ' + (b.nguon || []).join(' ') } });
  if (loi.length) await ghiLoi('Bản tin email', '2. Bot tự bắt được', loi.join('; '), 'Chưa – chờ chị xem', ngay);
  await ghiNhatKy('Bản tin', `Soạn bản tin ${ngay}: ${r[0]?.ma || ''} ${loi.length ? 'Cần sửa' : 'Chờ duyệt'}`);
}
main().catch(async e => { await ghiLoi('Bản tin email', '1. Chạy hỏng', e.message); await ghiNhatKy('Bản tin', 'Lỗi: ' + e.message); process.exit(1); });
