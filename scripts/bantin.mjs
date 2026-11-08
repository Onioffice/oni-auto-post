// CÔNG NHÂN BẢN TIN EMAIL – thứ Sáu 9:00 (giờ VN), để chị duyệt trong ngày, gửi 08:00 thứ Bảy (quy tắc chị chốt 09/11/2026). Soạn bản tin tuần gửi khách từ các bài hay trong tuần + tin mới cho doanh nghiệp / FDI.
// Chỉ SOẠN và đưa vào "Chờ duyệt" (kênh Email). Gửi cho khách là việc ra ngoài: chị duyệt rồi gửi ở trang "Bản tin email" của app Oni Hub
// (danh sách email khách nằm trên máy chủ Apps Script, không đưa lên web).
import fs from 'node:fs';
import { homNay, layMK, opMK, ghiLoi, claude, layJSON, kiemChu, layCaiDat, ghiNhatKy } from './lib.mjs';
import { NGUON } from './ytuong.mjs';
const QUY_TAC = fs.readFileSync(new URL('../prompts/quy-tac.md', import.meta.url), 'utf8');

async function main() {
  if (process.env.SU_KIEN === 'schedule' && (await layCaiDat()).bantin === false) { console.log('Chị đang tắt công nhân Bản tin.'); return; }
  const M = await layMK(), P = (M.posts || []).filter(p => !p.del && p.tt !== 'Hủy');
  const ngay = homNay(1);   // chạy thứ Sáu → gửi thứ Bảy
  if (P.some(p => p.kenh === 'Email' && p.at >= homNay(-3))) { console.log('Tuần này đã có bản tin.'); return; }
  const tuan = P.filter(p => ['Website', 'Facebook', 'LinkedIn'].includes(p.kenh) && p.at >= homNay(-7) && p.at <= homNay(1))
    .map(p => `- ${p.at} ${p.kenh}: ${p.tieude}${p.link ? ' (' + p.link + ')' : ''}`).join('\n');
  const t = await claude({
    max_tokens: 8000, system: QUY_TAC,
    tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 3 }],
    messages: [{ role: 'user', content: `Soạn BẢN TIN EMAIL TUẦN của Oni Office gửi khách (doanh nghiệp Việt và FDI đang thuê, khách cũ, khách chờ ký). Gửi 08:00 thứ Bảy ${ngay}.
${NGUON}
QUY TẮC BẢN TIN (Giám đốc chốt 09/11/2026):
- Chỉ tiếng Việt. Ký "Oni Office", không ghi tên Giám đốc.
- Nội dung: lời chào ngắn; 1–4 bài mới trên website onioffice.vn (tiêu đề + 1–2 câu tóm tắt + link bài); MỘT ô "Nhắc lịch" gom các hạn quan trọng sắp tới của doanh nghiệp: nộp tờ khai/báo cáo thuế (GTGT, TNCN theo tháng/quý), nộp thuế, đóng BHXH, kinh phí công đoàn, lệ phí môn bài, các việc cuối năm (quyết toán, báo cáo tài chính…) – mỗi mốc ghi rõ ngày và nguồn chính thống; nếu có ưu đãi thì là một ô riêng nhưng không bịa giá/ưu đãi.
- Viết "đồng hành, hỗ trợ thủ tục doanh nghiệp"; KHÔNG viết "tư vấn pháp lý/thuế/kế toán"; không dùng "nhất", "số 1", "100%"; không hứa kết quả thay cơ quan nhà nước; không nêu tên khách.
- Không tự viết tiêu đề [QC], chân thư, nút Ngừng nhận – app Bản tin email tự thêm theo Nghị định 91/2020.
- Lời mời liên hệ: Hotline/Zalo 0932 668 642.
Bài trong tuần:
${tuan || '(chưa có)'}
Trả lời DUY NHẤT:
\`\`\`json
{"tieude":"Tiêu đề email ≤ 70 ký tự, KHÔNG có [QC]","nd":"<p>…HTML email đơn giản: h2, p, ul, a…</p>","nhacLich":[{"ngay":"dd/mm/yyyy","viec":"…","nguon":"https://…"}],"nguon":["https://…"]}
\`\`\`` }]
  });
  const b = { kenh: 'Email', ...layJSON(t) };
  const loi = kiemChu(b);
  if (/tư vấn (pháp lý|thuế|kế toán)/i.test(b.nd || '')) loi.push('Có chữ "tư vấn pháp lý/thuế/kế toán"');
  if (/^\s*\[QC\]/i.test(b.tieude || '')) b.tieude = b.tieude.replace(/^\s*\[QC\]\s*/i, '');   // app tự thêm [QC]
  if (!(b.nhacLich || []).length) loi.push('Thiếu ô Nhắc lịch (thuế, BHXH, công đoàn…)');
  if (!/0932\s?668\s?642/.test(b.nd || '')) loi.push('Bản tin thiếu Hotline/Zalo');
  const r = await opMK({ op: 'taoBai', bai: { kenh: 'Email', at: ngay, gio: '08:00', tieude: b.tieude, nd: b.nd, loai: 'Bản tin email',
    tt: loi.length ? 'Cần sửa' : 'Chờ duyệt', vong: { tim: 'ok', yt: 'ok', kb: 'ok', kc: loi.length ? 'loi' : 'ok', tk: '—', kh: '—', ll: 'ok' },
    note: (loi.length ? 'Lỗi kiểm: ' + loi.join('; ') : 'Đã kiểm lỗi: Đạt') + ' | Nhắc lịch: ' + (b.nhacLich || []).map(x => x.ngay + ' ' + x.viec).join('; ') + ' | Gửi khách: Giám đốc duyệt rồi hẹn 08:00 thứ Bảy ở trang Bản tin email (app Oni Hub). Nguồn: ' + (b.nguon || []).join(' ') } });
  if (loi.length) await ghiLoi('Bản tin email', '2. Bot tự bắt được', loi.join('; '), 'Chưa – chờ chị xem', ngay);
  await ghiNhatKy('Bản tin', `Soạn bản tin ${ngay}: ${r[0]?.ma || ''} ${loi.length ? 'Cần sửa' : 'Chờ duyệt'}`);
}
main().catch(async e => { await ghiLoi('Bản tin email', '1. Chạy hỏng', e.message); await ghiNhatKy('Bản tin', 'Lỗi: ' + e.message); process.exit(1); });
