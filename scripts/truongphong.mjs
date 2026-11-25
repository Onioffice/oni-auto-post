// AGENT TRƯỞNG PHÒNG MARKETING (chị lập phòng Marketing AI 25/11/2026).
// Thứ Hai 8:17: đọc số cả phòng (khách theo nguồn, chi quảng cáo theo nền tảng, dây chuyền bài, video, kho tin, lỗi máy)
// → báo cáo tuần cho Giám đốc: kết quả, điểm nghẽn, việc giao cho từng bộ phận tuần này, đề xuất cần chị quyết.
// Ngày 1 hằng tháng (--thang): thêm đề xuất ngân sách ads tháng sau cho 4 nền tảng (Google, Facebook, Zalo OA, TikTok).
// Trưởng phòng CHỈ ĐỀ XUẤT: không tự duyệt, không đổi ngân sách tháng đã duyệt, không nạp/chi tiền, không sửa chiến lược đã duyệt.
import { crm, claude, layJSON, layCaiDat, ghiLoi, ghiNhatKy, homNay } from './lib.mjs';

const NT = ['google', 'facebook', 'zalo', 'tiktok'];
async function main() {
  const thang = process.argv.includes('--thang') || (process.env.SU_KIEN === 'schedule' && homNay().slice(8) === '01');
  const cd = await layCaiDat();
  if (cd.truongphong === false) { console.log('Chị đang tắt Agent Trưởng phòng.'); return; }
  const so = (await crm('/api/tp/so')).so || {};
  const thangSau = (() => { const d = new Date(homNay() + 'T00:00:00Z'); d.setUTCMonth(d.getUTCMonth() + 1); return d.toISOString().slice(0, 7); })();
  const daDuyet = (so.ngansach || []).filter(x => x.thang === thangSau && x.tt === 'da_duyet').length === 4;
  const t = await claude({
    max_tokens: 24000,   // mô hình suy nghĩ dài trước khi viết – 8000 không đủ (25/11)
    system: `Em là Trưởng phòng Marketing (Agent AI) của Oni Office – CÔNG TY TNHH ONI HUB, cho thuê văn phòng trọn gói, văn phòng ảo, chỗ ngồi cố định/linh hoạt, phòng họp ở TP.HCM (CS1 Tân Định, CS2 Gò Vấp) và hỗ trợ thủ tục thành lập doanh nghiệp, FDI.
Em quản lý 6 bộ phận Agent: Thu thập tin, Kịch bản & Soạn nội dung, Thiết kế hình ảnh, Editor video AI, Rà soát & Kiểm lỗi, Đăng tải. Người duyệt cuối là chị Giám đốc (gọi "chị", xưng "em").
Nguyên tắc: chỉ nói điều số liệu cho thấy, ghi rõ khi số còn thiếu; không bịa số; tiền viết kiểu Việt Nam (1,5 tr; 499.000đ). Em chỉ đề xuất – chị duyệt. Không đề xuất vượt tổng ngân sách 6 tháng đã trình (83 tr) trừ khi số chứng minh rõ và ghi lý do.
Báo cáo ngắn, đọc tốt trên điện thoại.`,
    messages: [{ role: 'user', content: `Hôm nay ${homNay()}. Số liệu CRM (không có tên khách):
${JSON.stringify(so).slice(0, 24000)}

Viết ${thang ? 'BÁO CÁO THÁNG + ĐỀ XUẤT NGÂN SÁCH tháng ' + thangSau : 'BÁO CÁO TUẦN'} cho chị Giám đốc:
1. Kết quả: khách mới theo nguồn (tuần/tháng), khách ký, chi quảng cáo theo nền tảng so kế hoạch, chi phí mỗi khách.
2. Dây chuyền nội dung: số bài, tỷ lệ bị trả sửa, kênh thiếu bài, video, kho tin, lỗi máy.
3. Điểm nghẽn lớn nhất (tối đa 3) và cách xử lý.
4. Việc giao cho từng bộ phận tuần này (mỗi bộ phận 1–2 việc).
5. Đề xuất cần chị quyết (tối đa 4, mỗi đề xuất 1 câu rõ: làm gì, tốn bao nhiêu, kỳ vọng gì).
${thang && !daDuyet ? `6. Ngân sách tháng ${thangSau} cho google, facebook, zalo, tiktok (đồng), có lý do và mục tiêu khách, chi phí mỗi khách. Nếu số thật chưa đủ thì giữ gần kế hoạch đã trình.` : ''}
Trả lời DUY NHẤT khối:
\`\`\`json
{"tieu_de":"…","nd":"nội dung báo cáo, xuống dòng bằng \\n","de_xuat":["…"]${thang && !daDuyet ? ',"ngansach":[{"thang":"' + thangSau + '","nen_tang":"google","ke_hoach":0,"ly_do":"…","muc_tieu":{"lead":0,"cpl":0}}]' : ''}}
\`\`\`` }]
  });
  const j = layJSON(t);
  const ns = (Array.isArray(j.ngansach) ? j.ngansach : []).filter(x => x.thang === thangSau && NT.includes(x.nen_tang) && Number(x.ke_hoach) >= 0)
    .map(x => ({ ...x, ke_hoach: Math.round(Number(x.ke_hoach) / 100000) * 100000 }));
  const r = await crm('/api/tp', { method: 'POST', body: JSON.stringify({ loai: thang ? 'thang' : 'tuan', tieu_de: j.tieu_de || (thang ? 'Báo cáo tháng' : 'Báo cáo tuần'), nd: j.nd || '', de_xuat: j.de_xuat || [], ...(ns.length ? { ngansach: ns } : {}) }) });
  console.log('Đã gửi báo cáo #' + r.id + (ns.length ? ` kèm đề xuất ngân sách ${thangSau}: ` + ns.map(x => `${x.nen_tang} ${x.ke_hoach}`).join(', ') : ''));
}
main().catch(async e => { console.error(e); await ghiLoi('Agent Trưởng phòng', '1. Chạy hỏng', e.message, 'Chưa'); await ghiNhatKy('Trưởng phòng Marketing', 'Lỗi: ' + e.message.slice(0, 300)); process.exit(1); });
