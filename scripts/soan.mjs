// SOẠN BÀI – chạy 7:45 sáng (giờ VN) mỗi ngày trên GitHub Actions.
// Tìm tin → Claude viết bài cho ngày kia → vẽ hình đúng khung Oni → kiểm lỗi (máy + Claude xem hình)
// → tải hình lên website → đưa vào kho bài: "Tự đăng" (tin tức, không giá) hoặc "Chờ duyệt" (có giá/ưu đãi).
import fs from 'node:fs';
import { homNay, thuTrongTuan, layBai, themBai, ghiLoi, claude, layJSON, kiemChu, wpTaiAnh, wpTimAnh } from './lib.mjs';
import { khungFB, mauA, chuanBi, coLogo } from './khung.mjs';

const THU = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const GIO = { Facebook: '11:30', Instagram: '12:00', Website: '09:00' };
const ngay = process.env.NGAY_DANG || homNay(2);          // soạn trước 2 ngày, để chị kịp duyệt
const kenhs = ['Facebook', 'Instagram'].concat([2, 5].includes(thuTrongTuan(ngay)) ? ['Website'] : []); // website T3, T6
const QUY_TAC = fs.readFileSync(new URL('../prompts/quy-tac.md', import.meta.url), 'utf8');

async function kiemHinh(png, kenh, mime = 'image/png', lan = 1) {
  const t = await claude({
    max_tokens: 1200,
    system: 'Bạn là người kiểm lỗi hình bài đăng của Oni Office. Rất khắt khe. Chỉ trả lời DUY NHẤT một đối tượng JSON, không viết gì khác.',
    messages: [{ role: 'user', content: [
      { type: 'image', source: { type: 'base64', media_type: mime, data: png.toString('base64') } },
      { type: 'text', text: `Hình cho kênh ${kenh}. Kiểm từng điểm, nhìn kỹ từng chữ:
1) Chính tả tiếng Việt và dấu trong mọi chữ trên hình.
2) Chữ không dính, không chồng lên nhau, không tràn ra ngoài khung hay thẻ; giãn dòng đủ.
3) ${kenh === 'Website' ? 'Chân ảnh có ONI OFFICE, Hotline/Zalo 0932 668 642, www.onioffice.vn, sales@onioffice.vn.' : 'Góc trên trái có logo tòa nhà vàng ĐỦ 4 KHỐI (thấp – cao nhất – cao vừa – thanh mảnh bên phải) cạnh chữ ONI OFFICE; chân ảnh có 0932 668 642, www.onioffice.vn, sales@onioffice.vn.'}
4) Không có từ tuyệt đối (nhất, số 1, 100%, hàng đầu) và không có "tư vấn pháp lý/thuế/kế toán".
5) Nếu có giá thì phải ghi cả "chưa VAT" và "gồm VAT".
6) Cân đối, dễ đọc trên điện thoại.
Trả lời đúng dạng: \`\`\`json\n{"dat": true|false, "loi": ["…"]}\n\`\`\`` }
    ] }]
  });
  try { return layJSON(t); } catch (e) {
    if (lan < 3) return kiemHinh(png, kenh, mime, lan + 1);   // Claude trả lời trống → hỏi lại
    return { dat: false, loi: ['Không đọc được kết quả kiểm hình: ' + e.message.slice(0, 200)] };
  }
}

async function main() {
  await chuanBi();
  if (!coLogo()) throw new Error('Không tải được logo Oni từ website – dừng, không làm hình thiếu logo');
  const cu = await layBai();
  if (cu.some(x => x.at === ngay && kenhs.includes(x.kenh) && x.tt !== 'Hủy')) { console.log('Ngày', ngay, 'đã có bài – bỏ qua.'); return; }
  const ganDay = cu.slice(-40).map(x => `- ${x.at} ${x.kenh}: ${x.tieude}`).join('\n');

  // 1) Viết bài (có tìm tin trên mạng)
  const t = await claude({
    max_tokens: 16000,
    system: QUY_TAC,
    tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 6 }],
    messages: [{ role: 'user', content: `Hôm nay ${homNay()}. Soạn bài đăng ngày ${ngay} (${THU[thuTrongTuan(ngay)]}) cho các kênh: ${kenhs.join(', ')}.
Trước tiên tìm tin trên mạng trong 48 giờ qua (nguồn chính thống: chinhphu.vn, baochinhphu.vn, thuvienphapluat.vn, dangkykinhdoanh.gov.vn, gdt.gov.vn, VnExpress, Tuổi Trẻ, Thanh Niên…) về: đăng ký doanh nghiệp, thuế/hóa đơn cho doanh nghiệp nhỏ, FDI, thị trường văn phòng ảo / coworking TP.HCM. Chọn 1 chủ đề hợp trụ cột của ${THU[thuTrongTuan(ngay)]} và có ích cho khách Oni; nếu không có tin mới phù hợp thì viết bài kiến thức/mẹo theo trụ cột.
Mỗi kênh một bài riêng, viết khác nhau, cùng chủ đề.
Các bài gần đây (không được trùng chủ đề/góc nhìn):
${ganDay || '(chưa có)'}

Trả lời DUY NHẤT một khối:
\`\`\`json
{"chuDe":"…","nguon":[{"tieuDe":"…","link":"https://…"}],
 "bai":[
  {"kenh":"Facebook","tieude":"…","nd":"caption đầy đủ","tag":"#OniOffice …","coGia":false,
   "hinh":{"pill":"…","eyebrow":"…","t1":"…","t2":"…","boxTop":"…","boxTitle":"…","cards":[{"icon":"doc","t":"…","s":"…"},{"icon":"…","t":"…","s":"…"},{"icon":"…","t":"…","s":"…"},{"icon":"…","t":"…","s":"…"}],"loc":"…","cta":"…"}},
  {"kenh":"Instagram", … cùng dạng Facebook …},
  {"kenh":"Website","tieude":"…","nd":"<p>…bài HTML đầy đủ…</p>","coGia":false,"hinhWeb":{"tag":"…","lines":["…","…","…"],"sub":["…","…"],"anhThat":"oni-td-hop"}}
 ]}
\`\`\`` }]
  });
  const kq = layJSON(t);
  const ra = [];
  for (const b of (kq.bai || []).filter(b => kenhs.includes(b.kenh))) {
    try {
      // 2) Kiểm lỗi chữ bằng máy
      let loi = kiemChu(b);
      // 3) Vẽ hình
      let buf, mime = 'image/png', ten;
      if (b.kenh === 'Website') {
        const anh = (await wpTimAnh(b.hinhWeb?.anhThat || 'oni-td-hop'))[0] || (await wpTimAnh('oni-building-hero'))[0];
        if (!anh) throw new Error('Không tìm được ảnh thật của Oni trong thư viện website');
        const photo = Buffer.from(await (await fetch(anh)).arrayBuffer());
        buf = await mauA(b.hinhWeb, photo); mime = 'image/jpeg'; ten = `web_${ngay}_oni_1200x628@2x.jpg`;
      } else {
        buf = await khungFB({ ...b.hinh, theme: b.kenh === 'Instagram' ? 'kem' : 'navy' }); ten = `${b.kenh === 'Instagram' ? 'ig' : 'fb'}_${ngay}_oni.png`;
      }
      // 4) Claude xem hình kiểm lỗi
      const kh = await kiemHinh(buf, b.kenh, mime);
      if (!kh.dat) loi = loi.concat(kh.loi || ['Hình chưa đạt']);
      // 5) Tải hình lên website để có link công khai
      const up = await wpTaiAnh(buf, ten, `${b.tieude} – Oni Office`, mime);
      const datHet = loi.length === 0;
      if (!datHet) await ghiLoi('Soạn bài ' + b.kenh, '2. Bot tự bắt được', loi.join('; '), 'Chưa – chờ chị xem', ngay);
      ra.push({ kenh: b.kenh, at: ngay, gio: GIO[b.kenh], tieude: b.tieude, nd: b.kenh === 'Website' ? b.nd : (b.nd + (b.tag && !b.nd.includes(b.tag) ? '\n\n' + b.tag : '')),
        tag: b.tag || '', anh: up.url, anhId: up.id, coGia: !!b.coGia,
        tt: !datHet ? 'Cần sửa' : (b.coGia ? 'Chờ duyệt' : 'Tự đăng'),
        note: (datHet ? `Đã kiểm lỗi: Đạt – ${new Date().toISOString()}` : 'Lỗi kiểm: ' + loi.join('; ')) + (kq.nguon?.length ? ' | Nguồn: ' + kq.nguon.map(n => n.link).join(' ') : '') });
    } catch (e) { await ghiLoi('Soạn bài ' + b.kenh, '1. Chạy hỏng', e.message, 'Chưa', ngay); }
  }
  if (ra.length) { const r = await themBai(ra); console.log('Đã đưa vào kho:', r.ma.join(', ')); }
  console.log(ra.map(x => `${x.kenh}: ${x.tt} – ${x.tieude}`).join('\n') || 'Không có bài nào.');
}
main().catch(async e => { await ghiLoi('Soạn bài', '1. Chạy hỏng', e.message); process.exit(1); });
