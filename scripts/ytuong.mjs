// CÔNG NHÂN Ý TƯỞNG – bước 1 (tìm tin, xu hướng) và bước 2 (lên ý tưởng) của vòng lặp.
// Nguồn: tin chính thống về doanh nghiệp, thuế, FDI, thị trường văn phòng + xu hướng nội dung trên mạng xã hội,
// chỉ chọn cái hợp phong cách Oni Office: cho thuê văn phòng / văn phòng ảo / phòng họp và hỗ trợ thủ tục cho doanh nghiệp Việt và FDI.
import fs from 'node:fs';
import { homNay, claude, layJSON } from './lib.mjs';
const QUY_TAC = fs.readFileSync(new URL('../prompts/quy-tac.md', import.meta.url), 'utf8');

export const NGUON = `NGUỒN TIN ƯU TIÊN (tìm trong 72 giờ qua):
- Chính sách, thủ tục: chinhphu.vn, baochinhphu.vn, thuvienphapluat.vn, dangkykinhdoanh.gov.vn, gdt.gov.vn, mof.gov.vn, mpi.gov.vn (Bộ Tài chính sau sáp nhập).
- FDI và đầu tư: baodautu.vn, vir.com.vn (Vietnam Investment Review), vietnamnews.vn, fia.mpi.gov.vn, tin của HEPZA/TP.HCM về dự án FDI.
- Kinh doanh, khởi nghiệp: VnExpress Kinh doanh, CafeF, Tuổi Trẻ, Thanh Niên, Người Lao Động, Doanh Nhân Sài Gòn.
- Thị trường văn phòng TP.HCM: báo cáo CBRE, Savills, JLL, Cushman & Wakefield Việt Nam (coworking, văn phòng hạng B/C, văn phòng ảo).
- Xu hướng mạng xã hội: chủ đề doanh nhân/người làm tự do đang bàn (làm việc linh hoạt, khởi nghiệp nhỏ, hóa đơn điện tử, thuế hộ kinh doanh chuyển sang công ty, nhà đầu tư nước ngoài vào VN), định dạng đang hiệu quả (mẹo ngắn, checklist, câu hỏi thảo luận, hậu trường văn phòng).
KHÔNG DÙNG: tin giật gân, chính trị, tai nạn, tin đồn, chủ đề không liên quan văn phòng/doanh nghiệp, trend nhảy múa hay meme không hợp hình ảnh công ty.`;

async function tuKhoa() {               // từ khóa khách đang tìm trên Google (Search Console) – cho bài Website
  try {
    const r = await fetch(process.env.ONI_API_URL.replace(/\/$/, '') + '/api/app/drv', { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + process.env.ONI_API_KEY }, body: JSON.stringify({ action: 'gsc_get' }) });
    const g = (await r.json()).gsc || {};
    const ds = g.q || g.queries || g.kw || g.rows || [];
    return JSON.stringify(ds).slice(0, 3500);
  } catch (e) { return ''; }
}
export async function yTuongCho(khung, posts) {
  const kw = khung.some(k => k.kenh === 'Website') ? await tuKhoa() : '';
  const ganDay = posts.slice().filter(p => !p.del && p.tt !== 'Hủy').sort((a, b) => (b.at || '').localeCompare(a.at || '')).slice(0, 60)
    .map(p => `- ${p.at} ${p.kenh}: ${p.tieude}`).join('\n');
  const t = await claude({
    max_tokens: 6000, system: QUY_TAC,
    tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 5 }],
    messages: [{ role: 'user', content: `Hôm nay ${homNay()}. Em là công nhân "Ý tưởng" của Oni Office (cho thuê văn phòng, văn phòng ảo, phòng họp tại TP.HCM – CS1 Tân Định, CS2 Gò Vấp; hỗ trợ thủ tục doanh nghiệp cho doanh nghiệp Việt và nhà đầu tư FDI).
${NGUON}

Cần ý tưởng cho các khung giờ sau (mỗi khung một bài, KHÁC CHỦ ĐỀ nhau, không trùng các bài gần đây). Cùng một kênh trong cùng một ngày (VD Facebook 3 bài/ngày) phải là 3 chủ đề khác hẳn nhau, không chỉ đổi góc viết:
${khung.map(k => `- ${k.ngay} ${k.gio} – ${k.kenh}`).join('\n')}

Bài gần đây (không lặp chủ đề/góc nhìn):
${ganDay || '(chưa có)'}

BÀI WEBSITE (SEO): mỗi bài nhắm 1 từ khóa chính khác nhau mà khách thật đang tìm, ưu tiên từ khóa có lượt hiển thị nhưng vị trí còn thấp, hoặc từ khóa dài chưa có bài (VD: "thuê văn phòng ảo quận 1", "địa chỉ đăng ký kinh doanh Gò Vấp", "thủ tục thành lập công ty vốn nước ngoài", "phòng họp theo giờ Tân Định"). Ghi từ khóa chính vào "goc". Không trùng từ khóa bài website cũ.
${kw ? 'Số liệu từ khóa Search Console của onioffice.vn (để chọn từ khóa): ' + kw : ''}
Hợp giọng từng kênh: Threads = câu hỏi/trao đổi ngắn; LinkedIn = góc nhìn chuyên môn song ngữ (hợp FDI); Website = bài kiến thức đầy đủ; Facebook/Zalo/Instagram = mẹo, lợi ích, không gian Oni.
Không bịa số liệu, giá, ưu đãi. Tin có số liệu phải ghi nguồn.
Trả lời DUY NHẤT khối:
\`\`\`json
{"ytuong":[{"ngay":"YYYY-MM-DD","gio":"HH:MM","kenh":"…","yTuong":"1–2 câu nói rõ bài viết gì, cho ai","goc":"góc viết / định dạng","nguon":["https://…"]}]}
\`\`\`` }]
  });
  return layJSON(t).ytuong || [];
}
