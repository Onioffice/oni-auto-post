// AGENT THU THẬP TIN – thay Grok Bot (chị chốt 25/11/2026).
// Mỗi ngày 2 lần (5:37 và 12:37 giờ VN): đi tìm tin chính sách – thủ tục, FDI, kinh doanh, thị trường văn phòng,
// xu hướng mạng xã hội và từ khóa SEO khách đang tìm → ghi vào KHO TIN trong CRM (trang Điều khiển bot Marketing → tab Kho tin).
// Bước "Ý tưởng" của vòng lặp lấy tin trong kho để lên ý tưởng, rồi bot soạn bài viết. Agent này KHÔNG viết bài, KHÔNG đăng.
import { homNay, claude, layJSON, layMK, layCaiDat, laySoKenh, layTin, ghiTin, ghiLoi, ghiNhatKy } from './lib.mjs';
import { NGUON } from './ytuong.mjs';

const LOAI = ['chinh_sach', 'fdi', 'kinh_doanh', 'van_phong', 'xu_huong', 'seo'];
const KENH = ['Website', 'Facebook', 'Instagram', 'Threads', 'LinkedIn', 'Zalo', 'TikTok', 'Email'];

async function main() {
  const cd = await layCaiDat();
  if (cd.thutin === false) { console.log('Chị đang tắt Agent Thu thập tin.'); return; }
  const [M, so, cu] = await Promise.all([layMK().catch(() => ({ posts: [] })), laySoKenh().catch(() => ({})), layTin(100).catch(() => [])]);
  const gsc = so.gsc || {};
  const kw = JSON.stringify(gsc.q || gsc.queries || gsc.kw || gsc.rows || gsc).slice(0, 4000);
  const baiGan = (M.posts || []).filter(p => !p.del && p.tt !== 'Hủy').sort((a, b) => (b.at || '').localeCompare(a.at || '')).slice(0, 50)
    .map(p => `- ${p.at} ${p.kenh}: ${p.tieude}`).join('\n');
  const tinCu = cu.map(t => `- [${t.loai}] ${t.tieuDe}`).join('\n');

  const t = await claude({
    max_tokens: 16000,
    tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 12 }],
    system: `Em là "Agent Thu thập tin" của Oni Office (cho thuê văn phòng trọn gói, văn phòng ảo, chỗ ngồi cố định, văn phòng chia sẻ, phòng họp tại TP.HCM – CS1 01 Nguyễn Văn Nguyễn, P. Tân Định; CS2 70 Đường số 8, KDC CityLand Park Hills, P. Gò Vấp; hỗ trợ thủ tục thành lập doanh nghiệp, FDI, giấy phép cho khách).
Việc của em: TÌM và TÓM TẮT tin thật để các agent khác lên ý tưởng và soạn bài. Em không viết bài.
Luật bắt buộc:
- Chỉ ghi tin em đã thật sự mở/đọc được qua công cụ tìm kiếm, có link nguồn. Không bịa số liệu, số hiệu văn bản, ngày hiệu lực.
- Tin chính sách, thủ tục: ưu tiên nguồn Nhà nước (chinhphu.vn, baochinhphu.vn, vanban.chinhphu.vn, congbao.chinhphu.vn, mof.gov.vn, gdt.gov.vn, dangkykinhdoanh.gov.vn, cổng Bộ/Sở .gov.vn). Ghi đúng số hiệu như nguồn ghi. Từ 01/7/2025 TP.HCM không còn cấp quận – không viết "Quận 1".
- Tin trong 7 ngày gần nhất (trừ nhóm "seo"). Không chính trị, tai nạn, tin đồn, giật gân, meme không hợp hình ảnh công ty.
- Không nhắc tên khách hàng, đối thủ cụ thể theo cách chê bai.`,
    messages: [{ role: 'user', content: `Hôm nay ${homNay()}. Tìm 12–15 tin/chủ đề MỚI cho kho tin, chia đều các nhóm:
- chinh_sach: chính sách, thủ tục doanh nghiệp, thuế, hóa đơn điện tử, hộ kinh doanh lên công ty, đăng ký kinh doanh.
- fdi: nhà đầu tư nước ngoài vào Việt Nam/TP.HCM, thủ tục IRC, xu hướng FDI.
- kinh_doanh: khởi nghiệp, doanh nghiệp nhỏ, làm việc linh hoạt, chi phí vận hành.
- van_phong: thị trường văn phòng, coworking, văn phòng ảo TP.HCM (báo cáo CBRE, Savills, JLL, Cushman…).
- xu_huong: chủ đề/định dạng đang được doanh nhân, người làm tự do bàn trên mạng xã hội hợp phong cách Oni.
- seo: 3–5 từ khóa khách thật đang tìm (theo số Search Console dưới đây: ưu tiên từ khóa có lượt hiển thị nhưng vị trí thấp, hoặc từ khóa dài chưa có bài website). Nhóm này "nguon" có thể để trống, ghi từ khóa vào "tuKhoa".
${NGUON}

Số Search Console của onioffice.vn: ${kw || '(chưa có số)'}

Bài đã đăng gần đây (đừng đưa lại chủ đề này):
${baiGan || '(chưa có)'}

Tin đã có trong kho, chưa dùng (không lặp lại):
${tinCu || '(kho trống)'}

Mỗi tin: tomTat 2–3 câu nêu ý chính + số liệu (nếu có, ghi đúng như nguồn); yTuong = 1 câu gợi ý bài cho Oni (ai đọc, giúp gì); kenh = các kênh hợp trong ${KENH.join(', ')}; diem 0–10 = mức hữu ích cho khách tiềm năng của Oni.
Trong chữ không dùng dấu ngoặc kép " (dùng « » nếu cần trích). Trả lời DUY NHẤT khối:
\`\`\`json
{"tin":[{"loai":"chinh_sach","tieuDe":"…","tomTat":"…","yTuong":"…","kenh":["Website","LinkedIn"],"tuKhoa":"","nguon":"https://…","ngay":"YYYY-MM-DD","diem":8}]}
\`\`\`` }]
  });
  let J;
  try { J = layJSON(t); }
  catch (e) {   // JSON hỏng (thiếu dấu, bị cắt): nhờ Claude sửa lại cho đúng dạng, không thêm tin mới
    console.error('JSON hỏng, sửa lại:', e.message.slice(0, 120));
    J = layJSON(await claude({ max_tokens: 16000, messages: [{ role: 'user', content: 'Sửa đoạn sau thành JSON hợp lệ đúng dạng {"tin":[…]} – giữ nguyên nội dung, bỏ tin cuối nếu bị cắt dở, không thêm gì. Trong chữ thay dấu " bằng « ». Chỉ trả khối ```json.\n\n' + t.slice(t.indexOf('{')) }] }));
  }
  const ds = (J.tin || [])
    .filter(x => x && x.tieuDe && LOAI.includes(x.loai) && (x.loai === 'seo' || /^https?:\/\//.test(x.nguon || '')))
    .map(x => ({ ...x, kenh: (x.kenh || []).filter(k => KENH.includes(k)), diem: Math.max(0, Math.min(10, Math.round(+x.diem || 5))) }));
  if (!ds.length) throw new Error('Không thu được tin nào hợp lệ (thiếu nguồn hoặc sai nhóm)');
  const dem = LOAI.map(l => [l, ds.filter(x => x.loai === l).length]).filter(x => x[1]).map(x => x.join(' ')).join(', ');
  const r = await ghiTin(ds, `Thu ${ds.length} tin (${dem})`);
  console.log(`Ghi kho: ${r.n} tin mới, bỏ ${r.bo} tin trùng – ${dem}`);
}

main().catch(async e => {
  console.error(e);
  await ghiLoi('Agent Thu thập tin', '1. Chạy hỏng', e.message, 'Chưa');
  await ghiNhatKy('Thu thập tin', 'Lỗi: ' + e.message.slice(0, 300));
  process.exit(1);
});
