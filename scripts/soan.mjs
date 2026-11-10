// SOẠN BÀI – hàm soanBai() dùng chung cho: lịch 7:45 sáng (khi chị bật công tắc) và việc chị giao (lenh.mjs).
// Tìm tin → Claude viết bài cho ngày kia → vẽ hình đúng khung Oni → kiểm lỗi (máy + Claude xem hình)
// → tải hình lên website → đưa vào kho bài: "Tự đăng" (tin tức, không giá) hoặc "Chờ duyệt" (có giá/ưu đãi).
import fs from 'node:fs';
import { homNay, thuTrongTuan, layMK, opMK, ghiLoi, claude, MODEL_KIEM, layJSON, kiemChu, wpTaiAnh, wpTimAnh, layCaiDat, ghiNhatKy, CHU_KY_FB } from './lib.mjs';
import { khungFB, mauA, chuanBi, coLogo, infoWeb, khungLI } from './khung.mjs';

const THU = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const GIO = { Facebook: '11:30', Instagram: '12:00', Website: '09:00', Threads: '14:00', LinkedIn: '12:00', Zalo: '13:00', X: '16:00' };
// Instagram tạm ngưng tới khi có mẫu carousel nền trắng riêng (quy tắc chị chốt 07/11)
export const KENH_DANG_LAM = ['Facebook', 'Website', 'Threads', 'LinkedIn', 'Zalo', 'X', 'Instagram'];
export const kenhMacDinh = ngay => ['Facebook'].concat([2, 5].includes(thuTrongTuan(ngay)) ? ['Website'] : []); // website T3, T6
const QUY_TAC = fs.readFileSync(new URL('../prompts/quy-tac.md', import.meta.url), 'utf8');

// Kho ảnh thật cơ sở Oni trên thư viện website (ảnh ngang): mã → [tên tệp trên web, mô tả]
const KHO_ANH = JSON.parse(fs.readFileSync(new URL('../prompts/kho-anh.json', import.meta.url), 'utf8'));
async function anhTheoMa(ma) {
  const k = KHO_ANH[ma]; if (!k) return '';
  const ds = await wpTimAnh(k[0]); return ds.find(u => new RegExp('/' + k[0] + '(-\\d+x\\d+)?\\.(jpe?g|png|webp)$', 'i').test(u)) || ds[0] || '';
}
// 09/11: không dùng lại một ảnh thật đã dùng trong 7 ngày (chị bắt lỗi nhiều bài cùng 1 ảnh phòng họp)
let _daDung = null;
async function chonAnh(ma, ngay) {
  if (!_daDung) { const moc = new Date(Date.parse(ngay) - 7 * 864e5).toISOString().slice(0, 10), den = new Date(Date.parse(ngay) + 7 * 864e5).toISOString().slice(0, 10);
    _daDung = new Set(((await layMK()).posts || []).filter(p => p.anhGoc && p.at >= moc && p.at <= den && p.tt !== 'Hủy').map(p => p.anhGoc)); }
  const key = KHO_ANH[ma] ? ma : (Object.keys(KHO_ANH).find(k => KHO_ANH[k][0] === ma || ma && KHO_ANH[k][0].includes(ma)) || '');
  const ma2 = key && !_daDung.has(key) ? key : (Object.keys(KHO_ANH).find(k => !_daDung.has(k)) || key || Object.keys(KHO_ANH)[0]);
  _daDung.add(ma2); return ma2;
}
// Chèn hình đã chọn vào ngay cuối mục H2 thứ n (trước H2 kế tiếp)
async function chenHinhTheoMuc(html, ds, ngay, tieude) {
  if (!Array.isArray(ds) || !ds.length) return html;
  const h2 = [...html.matchAll(/<h2[\s>]/gi)].map(m => m.index);
  const viec = [];
  for (const h of ds.slice(0, 3)) {
    const n = +h.sauMuc; if (!(n >= 1 && n < h2.length)) continue;
    let url = '', alt = String(h.chuThich || tieude).replace(/"/g, '');
    try {
      if (h.loai === 'anh') url = await anhTheoMa(h.ma);
      else if (h.loai === 'infographic' && Array.isArray(h.cacY) && h.cacY.length >= 3) {
        const loiY = h.cacY.filter(y => String(y).split(/\s+/).length > 14);
        if (loiY.length) continue;
        const buf = await infoWeb({ nhan: h.nhan, tieuDe: h.tieuDe, cacY: h.cacY });
        url = (await wpTaiAnh(buf, `web_${ngay}_hinh-trong-bai-${n}.jpg`, alt, 'image/jpeg')).url;
      }
    } catch (e) { console.error('Hình trong bài lỗi:', e.message); }
    if (url) viec.push({ at: h2[n], fig: `<figure class="wp-block-image size-large"><img src="${url}" alt="${alt}"/><figcaption class="wp-element-caption">${alt}</figcaption></figure>\n\n\n\n` });
  }
  viec.sort((a, b) => b.at - a.at).forEach(v => { html = html.slice(0, v.at) + v.fig + html.slice(v.at); });
  return html;
}

// Bài website: trình bày GIỐNG các bài đã đăng trên onioffice.vn (khối Gutenberg, không chèn ảnh trong thân bài,
// cuối bài là khối "Liên hệ ngay" nền navy #13203a đúng mẫu bài 1625)
async function themAnhTrongBai(html) {
  let out = String(html || '')
    .replace(/<figure[\s\S]*?<\/figure>/gi, '')
    .replace(/<div class="oni-lien-he"[\s\S]*?<\/div>/gi, '')
    .replace(/<p(?![^>]*class=)([^>]*)>/gi, '<p class="wp-block-paragraph"$1>')
    .replace(/<h([23])(?![^>]*class=)([^>]*)>/gi, '<h$1 class="wp-block-heading"$2>')
    .replace(/<ul(?![^>]*class=)([^>]*)>/gi, '<ul class="wp-block-list"$1>')
    .replace(/<ol(?![^>]*class=)([^>]*)>/gi, '<ol class="wp-block-list"$1>');
  // mỗi khối cách nhau 1 dòng trống như bài soạn bằng trình soạn WordPress
  out = out.replace(/>\s*(<(?:p|h2|h3|ul|ol)\b)/gi, '>\n\n\n\n$1').trim();
  if (!/Liên hệ ngay:/.test(out)) out += `\n\n\n\n<p class="has-white-color has-text-color has-background has-link-color wp-block-paragraph wp-elements-1" style="background-color: #13203a;"><strong style="color:#ffffff">Liên hệ ngay:</strong><br>Hotline: <a href="tel:0932668642" style="color:#ffffff">0932 668 642</a><br>Email: <a href="mailto:sales@onioffice.vn" style="color:#ffffff">sales@onioffice.vn</a><br>CS1: 01 Nguyễn Văn Nguyễn, P. Tân Định, TP. Hồ Chí Minh<br>CS2: 70 Đường số 8, KDC CityLand Park Hills, P. Gò Vấp, TP. Hồ Chí Minh<br>Website: <a href="https://onioffice.vn" style="color:#ffffff">onioffice.vn</a></p>`;
  return out;
}

async function kiemHinh(png, kenh, mime = 'image/png', lan = 1, model) {
  const t = await claude({
    model,
    max_tokens: 3000,
    system: 'Bạn là người kiểm lỗi hình bài đăng của Oni Office. Rất khắt khe. Chỉ trả lời DUY NHẤT một đối tượng JSON, không viết gì khác.',
    messages: [{ role: 'user', content: [
      { type: 'image', source: { type: 'base64', media_type: mime, data: png.toString('base64') } },
      { type: 'text', text: `Hình cho kênh ${kenh}. Kiểm từng điểm, nhìn kỹ từng chữ:
1) Chính tả tiếng Việt và dấu trong mọi chữ trên hình.
2) Xem như trên màn hình điện thoại: chữ đọc rõ, thoáng; giãn dòng tối thiểu 1,2; dấu tiếng Việt không chạm dòng trên/dưới; không chồng chữ, không tràn ra ngoài khung hay thẻ.
7) Không có chữ "Hình ảnh minh họa"; ảnh thật (nếu có) rõ nét, không méo, không đổi màu lạ; logo và chữ trên tường trong ảnh vẫn nhìn rõ.
3) ${kenh === 'Website' ? 'Chân ảnh có ONI OFFICE, Hotline/Zalo 0932 668 642, www.onioffice.vn, sales@onioffice.vn.' : 'Góc trên trái có logo tòa nhà vàng ĐỦ 4 KHỐI (thấp – cao nhất – cao vừa – thanh mảnh bên phải) cạnh chữ ONI OFFICE; chân ảnh có 0932 668 642, www.onioffice.vn, sales@onioffice.vn.'}
4) Không có từ tuyệt đối (nhất, số 1, 100%, hàng đầu) và không có "tư vấn pháp lý/thuế/kế toán".
5) ${kenh === 'Website' ? 'Nếu có giá thì phải ghi cả "chưa VAT" và "gồm VAT".' : 'KHÔNG được có giá tiền trên hình.'}
6) Cân đối, dễ đọc trên điện thoại.
Trả lời đúng dạng: \`\`\`json\n{"dat": true|false, "loi": ["…"]}\n\`\`\`` }
    ] }]
  });
  try { return layJSON(t); } catch (e) {
    if (lan < 3) return kiemHinh(png, kenh, mime, lan + 1, model);   // Claude trả lời trống → hỏi lại
    return { dat: false, loi: ['Không đọc được kết quả kiểm hình: ' + e.message.slice(0, 200)] };
  }
}

// yeuCau: việc chị giao (có thì viết đúng yêu cầu, bài luôn vào Chờ duyệt). lenh: mã việc.
export async function soanBai({ ngay, kenhs, yeuCau = '', lenh = '', yTuong = '', gio = '', timTin = true, thayMa = '' }) {
  await chuanBi();
  if (!coLogo()) throw new Error('Không tải được logo Oni từ website – dừng, không làm hình thiếu logo');
  const cu = ((await layMK()).posts || []).filter(x => x.tt !== 'Hủy');
  const ganDay = cu.slice().sort((a, b) => (b.at || '').localeCompare(a.at || '')).slice(0, 40).map(x => `- ${x.at} ${x.kenh}: ${x.tieude}`).join('\n');

  // 1) Viết bài (có tìm tin trên mạng)
  const t = await claude({
    max_tokens: 16000,
    system: QUY_TAC,
    ...(timTin ? { tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 6 }] } : {}),
    messages: [{ role: 'user', content: `Hôm nay ${homNay()}. Soạn bài đăng ngày ${ngay} (${THU[thuTrongTuan(ngay)]}) cho các kênh: ${kenhs.join(', ')}.
${yTuong ? `Ý TƯỞNG ĐÃ CHỌN (đã tìm tin và chọn nguồn ở bước trước – viết đúng ý tưởng này, không tìm tin thêm, giữ mọi luật bắt buộc):
«${yTuong}»
` : yeuCau ? `CHỊ GIÁM ĐỐC GIAO VIỆC – viết ĐÚNG theo yêu cầu dưới đây (ưu tiên hơn trụ cột trong tuần, vẫn giữ mọi luật bắt buộc):
«${yeuCau}»
Chỉ tìm tin trên mạng khi yêu cầu cần tin tức hoặc số liệu. Nếu yêu cầu nhắc giá hay ưu đãi thì đặt coGia true.
` : `Trước tiên tìm tin trên mạng trong 48 giờ qua (nguồn chính thống: chinhphu.vn, baochinhphu.vn, thuvienphapluat.vn, dangkykinhdoanh.gov.vn, gdt.gov.vn, VnExpress, Tuổi Trẻ, Thanh Niên…) về: đăng ký doanh nghiệp, thuế/hóa đơn cho doanh nghiệp nhỏ, FDI, thị trường văn phòng ảo / coworking TP.HCM. Chọn 1 chủ đề hợp trụ cột của ${THU[thuTrongTuan(ngay)]} và có ích cho khách Oni; nếu không có tin mới phù hợp thì viết bài kiến thức/mẹo theo trụ cột.
`}Mỗi kênh một bài riêng, viết khác nhau, cùng chủ đề.
Các bài gần đây (không được trùng chủ đề/góc nhìn):
${ganDay || '(chưa có)'}

Trả lời DUY NHẤT một khối:
HÌNH TRONG THÂN BÀI WEBSITE ("anhTrongBai", 0–3 hình) – chọn THEO NỘI DUNG từng mục, không chèn cho có:
- Mục nói về không gian/dịch vụ có thật ở Oni → "loai":"anh" và "ma" lấy ĐÚNG một mã trong kho ảnh thật dưới đây (đúng cơ sở CS1/CS2, đúng loại phòng):
${Object.entries(KHO_ANH).map(([k, v]) => '  ' + k + ': ' + v[1]).join('\n')}
- Mục là các bước, mốc thời gian, danh sách giấy tờ, so sánh → "loai":"infographic": "tieuDe" ngắn (≤ 8 chữ), "cacY" 3–6 ý, mỗi ý ≤ 12 chữ, lấy đúng ý trong mục đó; "nhan" kiểu "THỦ TỤC · 2026".
- "sauMuc": số thứ tự mục H2 mà hình đặt ngay dưới (1 = sau mục "1. …"). Không đặt 2 hình liền nhau. Mục nào không có hình phù hợp thì thôi.
- "chuThich": 1 câu ngắn mô tả đúng hình.

\`\`\`json
{"chuDe":"…","nguon":[{"tieuDe":"…","link":"https://…"}],
 "bai":[
  {"kenh":"Facebook","tieude":"…","nd":"caption đầy đủ","tag":"#OniOffice …","coGia":false,
   "hinh":{"pill":"…","eyebrow":"…","t1":"…","t2":"…","boxTop":"…","boxTitle":"…","cards":[{"icon":"doc","t":"…","s":"…"},{"icon":"…","t":"…","s":"…"},{"icon":"…","t":"…","s":"…"},{"icon":"…","t":"…","s":"…"}],"loc":"…","cta":"…"}},
  {"kenh":"Instagram", … cùng dạng Facebook …},
  {"kenh":"Zalo", … cùng dạng Facebook (caption gọn, rõ lợi ích, có Hotline/Zalo) …},
  {"kenh":"Threads","tieude":"…","nd":"chỉ chữ, ngắn, tự nhiên, kết bằng câu hỏi thực chất, không hashtag quảng cáo, không giá"},
  {"kenh":"X","tieude":"…","nd":"≤ 270 ký tự, song ngữ: tiếng Anh trước, tiếng Việt sau, không giá"},
  {"kenh":"LinkedIn","tieude":"…","nd":"tiếng Anh trước, tiếng Việt sau; có góc nhìn/trải nghiệm, chuyên nghiệp","hinhLI":{"tag":"2–4 chữ tiếng Anh, VD HOW WE WORK","t1":"2–5 chữ tiếng Anh (trắng)","t2":"2–5 chữ tiếng Anh (vàng)","sub":"1 câu tiếng Việt ≤ 12 chữ","anhThat":"<một mã trong kho ảnh thật ở trên>"}},
  {"kenh":"Website","tieude":"…","nd":"<p>…bài HTML đầy đủ…</p>","coGia":false,"hinhWeb":{"tag":"…","lines":["…","…","…"],"sub":["…","…"],"anhThat":"oni-td-hop"},
   "anhTrongBai":[{"sauMuc":2,"loai":"anh","ma":"td-hop-a","chuThich":"…"},{"sauMuc":4,"loai":"infographic","nhan":"…","tieuDe":"…","cacY":["…","…","…"],"chuThich":"…"}]}
 ]}
\`\`\`` }]
  });
  const kq = layJSON(t);
  return xuLyBai({ kq, ngay, kenhs, gio, yeuCau, lenh, yTuong, timTin, thayMa });
}

// Bước 2–7 dùng chung: gắn chữ ký → kiểm chữ → vẽ hình → kiểm hình → tải hình → đưa vào app.
// tuNgoai = 'Grok Bot' khi bài do bot bên ngoài viết và nộp qua cổng (luôn vào Chờ duyệt).
export async function xuLyBai({ kq, ngay, kenhs, gio = '', yeuCau = '', lenh = '', yTuong = '', timTin = false, tuNgoai = '', thayMa = '', gom = null }) {
  await chuanBi();
  if (!coLogo()) throw new Error('Không tải được logo Oni từ website – dừng, không làm hình thiếu logo');
  const ra = [];
  for (const b of (kq.bai || []).filter(b => kenhs.includes(b.kenh))) {
    try {
      // Gắn hashtag + chữ ký công ty (Facebook) theo đúng mẫu chị chốt
      if (b.kenh !== 'Website') {
        let nd = (b.nd || '').replace(/\n*—{3,}[\s\S]*$/, '').trimEnd();
        if (b.tag && !nd.includes(b.tag)) nd += '\n\n' + b.tag;
        if (b.kenh === 'Facebook') nd += '\n\n' + CHU_KY_FB;
        b.nd = nd;
      }
      // 2) Kiểm lỗi chữ bằng máy
      let loi = kiemChu(b);
      // 3) Vẽ hình
      let buf, mime = 'image/png', ten;
      if (b.kenh === 'Website') {
        const ma = await chonAnh(b.hinhWeb?.anhThat, ngay); b._anhGoc = ma;
        const anh = (KHO_ANH[ma] && await anhTheoMa(ma)) || (await wpTimAnh(b.hinhWeb?.anhThat || 'oni-td-hop'))[0] || (await wpTimAnh('oni-building-hero'))[0];
        if (!anh) throw new Error('Không tìm được ảnh thật của Oni trong thư viện website');
        const photo = Buffer.from(await (await fetch(anh)).arrayBuffer());
        buf = await mauA(b.hinhWeb, photo); mime = 'image/jpeg'; ten = `web_${ngay}_oni_1200x628@2x.jpg`;
        b.nd = await themAnhTrongBai(b.nd);   // trình bày đúng mẫu bài website đã đăng
        b.nd = await chenHinhTheoMuc(b.nd, b.anhTrongBai, ngay, b.tieude);   // hình trong bài theo nội dung từng mục
      } else if (b.kenh === 'LinkedIn') {   // 09/11: LinkedIn có khung nâu – kem – chữ vàng, ảnh thật trong khung nâu
        const ma = await chonAnh(b.hinhLI?.anhThat || b.anhThat, ngay), url = await anhTheoMa(ma) || await anhTheoMa('td-letan');
        if (!url) throw new Error('Không tìm được ảnh thật cho LinkedIn');
        const h = b.hinhLI || {}; b._anhGoc = ma;
        buf = await khungLI({ tag: h.tag || 'ONI OFFICE', t1: h.t1 || '', t2: h.t2 || '', sub: h.sub || '' }, Buffer.from(await (await fetch(url)).arrayBuffer())); ten = `li_${ngay}_oni.png`;
        if (!h.t1 || !h.t2) loi.push('LinkedIn thiếu chữ trên hình (hinhLI.t1, t2)');
      } else if (['Facebook', 'Instagram', 'Zalo'].includes(b.kenh)) {
        buf = await khungFB({ ...b.hinh, theme: b.kenh === 'Instagram' ? 'kem' : 'navy' }); ten = `${({ Instagram: 'ig', Zalo: 'zl' })[b.kenh] || 'fb'}_${ngay}_oni.png`;
      }
      const vong = { tim: timTin || yTuong || tuNgoai ? 'ok' : '—', yt: 'ok', kb: 'ok', kc: loi.length ? 'loi' : 'ok', tk: '—', kh: '—', ll: 'ok' };
      let up = { url: '', id: null };
      if (buf) {
        vong.tk = 'ok';
        // 4) Claude xem hình kiểm lỗi
        const kh = await kiemHinh(buf, b.kenh, mime);   // 09/11: luôn kiểm hình bằng máy tốt (Haiku bắt lỗi kém – chị phát hiện)
        vong.kh = kh.dat ? 'ok' : 'loi';
        if (!kh.dat) loi = loi.concat(kh.loi || ['Hình chưa đạt']);
        // 5) Tải hình lên website để có link công khai
        up = await wpTaiAnh(buf, ten, `${b.tieude} – Oni Office`, mime);
      }
      const datHet = loi.length === 0;
      if (!datHet) await ghiLoi('Soạn bài ' + b.kenh, '2. Bot tự bắt được', loi.join('; '), 'Chưa – chờ chị xem', ngay);
      ra.push({ lenh, kenh: b.kenh, at: ngay, gio: gio || GIO[b.kenh], tieude: b.tieude, nd: b.nd, vong,
        tag: b.tag || '', anh: up.url, anhId: up.id, anhGoc: b._anhGoc || '', coGia: !!b.coGia,
        tt: !datHet ? 'Cần sửa' : (b.coGia || yeuCau || yTuong || tuNgoai ? 'Chờ duyệt' : 'Đã duyệt'),   // bài vòng lặp: luôn chờ chị duyệt (duyệt hàng loạt) – chị chốt 09/11
        lienKetWeb: b.kenh === 'Facebook' && kenhs.includes('Website'), loai: tuNgoai || (yTuong ? 'Vòng lặp' : 'AI soạn'),
        note: (tuNgoai ? tuNgoai + ' viết. ' : '') + (yeuCau ? 'Việc chị giao. ' : '') + (datHet ? `Đã kiểm lỗi: Đạt – ${new Date().toISOString()}` : 'Lỗi kiểm: ' + loi.join('; ')) + (kq.nguon?.length ? ' | Nguồn: ' + kq.nguon.map(n => n.link).join(' ') : '') });
    } catch (e) { await ghiLoi('Soạn bài ' + b.kenh, '1. Chạy hỏng', e.message, 'Chưa', ngay); }
  }
  let ma = [];
  if (ra.length && thayMa) {   // bài chị trả "Cần sửa" → làm lại, ghi đè đúng bài cũ (giữ mã, giờ đăng)
    const r = await opMK({ op: 'suaBai', ma: thayMa, bai: { ...ra[0], loai: 'Bot sửa theo chị' } }); ma = r[0]?.ok ? [thayMa] : []; console.log('Đã làm lại:', thayMa, r[0]?.ok ? 'xong' : 'lỗi');
  } else if (ra.length && gom) { gom.push(...ra.map(bai => ({ op: 'taoBai', bai })));   // 10/11: gom lại, người gọi ghi 1 lần cho cả lô (tiết kiệm lượt ghi Cloudflare)
  } else if (ra.length) { ma = (await opMK(...ra.map(bai => ({ op: 'taoBai', bai })))).map(k => k.ma).filter(Boolean); console.log('Đã đưa vào app:', ma.join(', ')); }
  console.log(ra.map(x => `${x.kenh}: ${x.tt} – ${x.tieude}`).join('\n') || 'Không có bài nào.');
  return { ma, ra, chuDe: kq.chuDe || '' };
}

// Chạy theo lịch 7:45 (hoặc bấm tay trên GitHub)
async function main() {
  const cd = await layCaiDat();
  if (process.env.SU_KIEN === 'schedule' && cd.vonglap !== false) { console.log('Vòng lặp đang chạy – không soạn theo lịch sáng nữa.'); return; }
  if (process.env.SU_KIEN === 'schedule' && !cd.soan) { console.log('Công tắc "Tự soạn bài mỗi sáng" đang tắt.'); return; }
  const ngay = process.env.NGAY_DANG || homNay(2);          // soạn trước 2 ngày, để chị kịp duyệt
  await opMK({ op: 'batDau' });
  const cu = ((await layMK()).posts || []).filter(x => !['Hủy', 'Cần sửa'].includes(x.tt));
  const kenhs = kenhMacDinh(ngay).filter(k => !cu.some(x => x.at === ngay && x.kenh === k && x.tt !== 'Hủy')); // kênh đã có bài (VD việc chị giao) thì thôi
  if (!kenhs.length) { console.log('Ngày', ngay, 'đã đủ bài.'); await ghiNhatKy('Tự soạn', `Ngày ${ngay} đã đủ bài`); return; }
  const r = await soanBai({ ngay, kenhs });
  const kq = `Ngày ${ngay}: ${r.ra.map(x => x.kenh + ' ' + x.tt).join(', ') || 'không có bài'}`;
  await ghiNhatKy('Tự soạn', kq); await opMK({ op: 'nhatKy', viec: 'Tự soạn bài buổi sáng', ct: kq });
}
if (import.meta.url === `file://${process.argv[1]}`) main().catch(async e => { await ghiLoi('Soạn bài', '1. Chạy hỏng', e.message); await ghiNhatKy('Tự soạn', 'Lỗi: ' + e.message); process.exit(1); });
