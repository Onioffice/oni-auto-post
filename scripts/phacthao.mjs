// AGENT THIẾT KẾ Ý TƯỞNG – PHÁC THẢO KHUNG HÌNH VIDEO (chị tuyển 28/11/2026).
// Mỗi ngày 9:37 (sau Agent Editor 9:07): lấy video Giám đốc đã duyệt kịch bản ("da_duyet") hoặc bị trả "vẽ lại",
// 1) lên ý tưởng thiết kế từng cảnh (bố cục, góc máy, ánh sáng, màu, chỗ đặt chữ, chuyển động),
// 2) vẽ phác thảo 9:16 từng cảnh (khung dây bằng máy vẽ của Oni – không tốn phí; có khóa GEMINI_API_KEY thì vẽ ảnh AI thật),
// 3) tự kiểm (đủ cảnh, có hook, không giá, không từ cấm, cảnh cuối có Hotline) rồi chuyển "Phác thảo xong – chờ Giám đốc duyệt".
// Agent KHÔNG tự duyệt, KHÔNG dựng, KHÔNG đăng. Ảnh phác thảo lưu ở kho ảnh nội bộ CRM (bucket mkt-phac-thao, không có dữ liệu khách).
import fs from 'node:fs';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { crm, claude, layJSON, ghiLoi, ghiNhatKy, homNay } from './lib.mjs';
import { chuanBi } from './khung.mjs';
const QUY_TAC = fs.readFileSync(new URL('../prompts/quy-tac.md', import.meta.url), 'utf8');
const MOI_LAN = Number(process.env.PHAC_MOI_LAN || 3);
const GEMINI = process.env.GEMINI_API_KEY || '';
const ghiVideo = p => crm('/api/video', { method: 'POST', body: JSON.stringify(p) });
const taiAnh = (ten, buf) => crm('/api/anh', { method: 'POST', body: JSON.stringify({ ten, b64: buf.toString('base64') }) });

const CAM = [/tư vấn\s+(pháp lý|luật|thuế|kế toán)/i, /\bsố\s*1\b/i, /100\s*%/, /rẻ nhất/i, /tốt nhất/i, /hàng đầu/i, /Quận\s*\d(?!\s*cũ)/i, /\d+\s*(Nguyễn Văn Nguyễn|Đường số)/i];
const GIA = /\d[\d.,]*\s*(đồng|đ(?![\p{L}])|vnđ|vnd|k(?![\p{L}])|nghìn|ngàn|triệu|usd|\$)/iu;

const LUAT_THIET_KE = `LUẬT THIẾT KẾ PHÁC THẢO ONI OFFICE:
- Khung dọc 9:16 (1080x1920). Màu Oni Studio: navy #0C1830, kem #F6EDDC, vàng đồng #C9A878, đồng ấm #7A5A1E; phông Be Vietnam Pro đậm. Bố cục chuẩn Studio: logo slogan trên tấm navy góc trên trái, nhãn vàng dưới logo, tiêu đề phần trên (không che mặt nhân vật), phụ đề giữa–dưới, dải liên hệ bo tròn sát chân. Không ghi số nhà, tên đường; chỉ tên cơ sở Oni Office Tân Định / Oni Office Gò Vấp.
- Văn phòng sáng, hiện đại, gọn; nhân vật AI mặc đồ công sở Việt Nam; KHÔNG đóng vai khách thật, không mặt/tên/logo người hay công ty có thật.
- Chữ trên hình tối đa 2 dòng, 3–7 chữ/dòng, đặt ở vùng an toàn (không sát mép, tránh 1/5 dưới cùng vì nút TikTok che).
- Cảnh hook: chữ to, tương phản mạnh, chuyển động nhanh. Cảnh cuối: logo Oni + Hotline/Zalo 0932 668 642 + onioffice.vn.
- Không ghi giá, ưu đãi; không từ tuyệt đối; không nói "tư vấn pháp lý", chỉ "hỗ trợ thủ tục".
- "prompt_anh" viết tiếng Anh cho công cụ vẽ ảnh AI: không chữ, không logo trong ảnh, vertical 9:16.`;

async function lenYTuong(v, veLai) {
  const t = await claude({
    max_tokens: 9000, system: QUY_TAC + '\n\n' + LUAT_THIET_KE,
    messages: [{ role: 'user', content: `Hôm nay ${homNay()}. Em là Agent Thiết kế ý tưởng của Oni Office. Kịch bản dưới đây Giám đốc ĐÃ DUYỆT – giữ nguyên lời thoại và chữ trên hình, chỉ thiết kế hình ảnh cho từng cảnh.
Tiêu đề: ${v.tieu_de}
Mục tiêu: ${v.muc_tieu || ''}
Diễn biến: ${String(v.kich_ban || '').slice(0, 3000)}
Các cảnh:
${(v.phan_canh || []).map((c, i) => `${i + 1}. [${c.giay}s${c.hook ? ' · HOOK' : ''}] ${c.canh} | nhân vật: ${c.nhan_vat_ai || ''} | bối cảnh: ${c.boi_canh_ai || ''} | chữ: ${c.chu_tren_hinh || ''} | thoại: ${c.loi_thoai || ''}`).join('\n')}
${veLai ? `\nGIÁM ĐỐC TRẢ VẼ LẠI vì: ${veLai}\n→ Sửa đúng ý này.\n` : ''}
Trả lời DUY NHẤT khối:
\`\`\`json
{"y_tuong_chung":"1–2 câu: tông màu, cảm xúc, nhịp dựng của cả video","canh":[{"bo_cuc":"can_canh|trung_canh|toan_canh|hai_nguoi|vat_the","goc_may":"…","anh_sang":"am|mat|tu_nhien","vi_tri_chu":"tren|giua|duoi","chuyen_dong":"…","mau_chu_dao":"…","ghi_chu_thiet_ke":"1 câu cho Editor","prompt_anh":"English prompt…"}]}
\`\`\`
Số phần tử "canh" phải bằng đúng ${(v.phan_canh || []).length}.` }]
  });
  const j = layJSON(t);
  if (!Array.isArray(j.canh) || j.canh.length !== (v.phan_canh || []).length) throw new Error('Ý tưởng thiết kế không khớp số cảnh');
  return j;
}

async function anhGemini(prompt) {
  if (!GEMINI) return null;
  try {
    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict', {
      method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': GEMINI },
      body: JSON.stringify({ instances: [{ prompt: prompt + ', vertical 9:16, no text, no logo, bright modern Vietnamese office, photorealistic' }], parameters: { sampleCount: 1, aspectRatio: '9:16' } })
    });
    const j = await r.json();
    const b = j?.predictions?.[0]?.bytesBase64Encoded;
    if (!r.ok || !b) { console.error('Gemini không vẽ được:', r.status, JSON.stringify(j).slice(0, 200)); return null; }
    return await loadImage(Buffer.from(b, 'base64'));
  } catch (e) { console.error('Gemini lỗi:', e.message); return null; }
}

function xuongDong(x, chu, rong) {
  const tu = String(chu || '').split(/\s+/).filter(Boolean), dong = []; let d = '';
  for (const w of tu) { const th = d ? d + ' ' + w : w; if (x.measureText(th).width > rong && d) { dong.push(d); d = w; } else d = th; }
  if (d) dong.push(d); return dong;
}

async function vePhacThao(c, tk, i, n, logo) {
  const W = 1080, H = 1920, cv = createCanvas(W, H), x = cv.getContext('2d');
  const F = (w, s) => `${w} ${s}px "Be Vietnam Pro"`;
  const NAU = '#7A5A1E', NAVY = '#0C1830', VANG = '#C9A878';
  x.fillStyle = '#F6EDDC'; x.fillRect(0, 0, W, H);
  x.textBaseline = 'top';
  x.font = F(700, 34); x.fillStyle = NAU; x.fillText(`PHÁC THẢO · CẢNH ${i + 1}/${n} · ${c.giay || ''}s`, 60, 46);
  if (c.hook) { x.font = F(800, 30); const w = x.measureText('HOOK').width + 40; x.fillStyle = VANG; x.fillRect(W - 60 - w, 40, w, 50); x.fillStyle = NAVY; x.fillText('HOOK', W - 60 - w + 20, 48); }
  // Khung hình
  const FX = 90, FY = 120, FW = 900, FH = 1600 * 0.75;   // 900x1200 (tỉ lệ xem trước 3:4 của khung 9:16 đã cắt phần ghi chú)
  const anh = await anhGemini(tk.prompt_anh || c.prompt || '');
  if (anh) {
    const k = Math.max(FW / anh.width, FH / anh.height); x.save(); x.beginPath(); x.rect(FX, FY, FW, FH); x.clip();
    x.drawImage(anh, FX + (FW - anh.width * k) / 2, FY + (FH - anh.height * k) / 2, anh.width * k, anh.height * k); x.restore();
  } else {
    x.save(); x.beginPath(); x.rect(FX, FY, FW, FH); x.clip();
    const g = x.createLinearGradient(0, FY, 0, FY + FH);
    const tone = { am: ['#FBEBD0', '#E8CFA6'], mat: ['#E6ECF5', '#C9D4E6'] }[tk.anh_sang] || ['#F4F1EA', '#DDD5C6'];
    g.addColorStop(0, tone[0]); g.addColorStop(1, tone[1]); x.fillStyle = g; x.fillRect(FX, FY, FW, FH);
    x.strokeStyle = 'rgba(24,32,58,0.10)'; x.lineWidth = 2;
    for (let k = 1; k < 3; k++) { x.beginPath(); x.moveTo(FX + FW * k / 3, FY); x.lineTo(FX + FW * k / 3, FY + FH); x.stroke(); x.beginPath(); x.moveTo(FX, FY + FH * k / 3); x.lineTo(FX + FW, FY + FH * k / 3); x.stroke(); }
    // cửa sổ + bàn làm việc
    x.fillStyle = 'rgba(255,255,255,0.55)'; x.fillRect(FX + 60, FY + 70, 300, 360); x.strokeStyle = 'rgba(137,100,65,0.35)'; x.lineWidth = 4; x.strokeRect(FX + 60, FY + 70, 300, 360);
    x.beginPath(); x.moveTo(FX + 210, FY + 70); x.lineTo(FX + 210, FY + 430); x.stroke();
    x.fillStyle = 'rgba(137,100,65,0.55)'; x.fillRect(FX, FY + FH * 0.78, FW, 26);
    const nguoi = (cx, base, s) => { x.fillStyle = 'rgba(24,32,58,0.78)'; x.beginPath(); x.arc(cx, base - 330 * s, 70 * s, 0, 7); x.fill(); x.beginPath(); x.ellipse(cx, base, 160 * s, 230 * s, 0, Math.PI, 0); x.fill(); };
    const day = FY + FH * 0.80;
    if (tk.bo_cuc === 'can_canh') nguoi(FX + FW / 2, FY + FH + 60, 1.7);
    else if (tk.bo_cuc === 'hai_nguoi') { nguoi(FX + FW * 0.32, day, 1); nguoi(FX + FW * 0.70, day, 0.95); }
    else if (tk.bo_cuc === 'toan_canh') { nguoi(FX + FW * 0.30, day, 0.55); nguoi(FX + FW * 0.62, day, 0.5); x.fillStyle = 'rgba(137,100,65,0.4)'; x.fillRect(FX + 520, FY + 140, 300, 220); }
    else if (tk.bo_cuc === 'vat_the') { x.fillStyle = 'rgba(24,32,58,0.75)'; x.fillRect(FX + 250, FY + 520, 400, 300); x.fillStyle = '#fff'; x.fillRect(FX + 280, FY + 550, 340, 200); }
    else nguoi(FX + FW * 0.62, day, 1.05);
    if (i < n - 1) { x.font = F(500, 22); x.fillStyle = 'rgba(24,32,58,0.55)'; x.fillText('Khung dây – vị trí nhân vật, bố cục, chỗ đặt chữ', FX + 20, FY + FH - 40); }
    x.restore();
  }
  x.strokeStyle = NAU; x.lineWidth = 6; x.strokeRect(FX, FY, FW, FH);
  // Chữ trên hình
  const chu = c.chu_tren_hinh || '';
  if (chu) {
    let s = c.hook ? 66 : 54; x.font = F(800, s); let dong = xuongDong(x, chu, FW - 140);
    while (dong.length > 3 && s > 38) { s -= 4; x.font = F(800, s); dong = xuongDong(x, chu, FW - 140); }
    const hb = dong.length * s * 1.42 + 50, vy = { tren: FY + 90, giua: FY + (FH - hb) / 2, duoi: FY + FH * 0.56 }[tk.vi_tri_chu] ?? FY + 90;
    x.fillStyle = c.hook ? 'rgba(24,32,58,0.88)' : 'rgba(255,255,255,0.88)'; x.fillRect(FX + 50, vy, FW - 100, hb);
    x.textAlign = 'center'; x.fillStyle = c.hook ? '#FFE38A' : NAVY;
    dong.forEach((d, k) => x.fillText(d, W / 2, vy + 25 + k * s * 1.42)); x.textAlign = 'left';
  }
  if (i === n - 1) {
    x.fillStyle = 'rgba(24,32,58,0.92)'; x.fillRect(FX, FY + FH - 190, FW, 190);
    if (logo) { const h = 90, w = logo.width * h / logo.height; x.drawImage(logo, FX + 40, FY + FH - 150, w, h); }
    x.font = F(800, 42); x.fillStyle = '#FFE38A'; x.textAlign = 'right'; x.fillText('0932 668 642', FX + FW - 40, FY + FH - 160); x.font = F(500, 30); x.fillStyle = '#fff'; x.fillText('Zalo · onioffice.vn', FX + FW - 40, FY + FH - 100); x.textAlign = 'left';
  }
  // Ghi chú thiết kế
  let y = FY + FH + 40; const ghi = [
    ['Bố cục', { can_canh: 'Cận cảnh', trung_canh: 'Trung cảnh', toan_canh: 'Toàn cảnh', hai_nguoi: 'Hai nhân vật', vat_the: 'Cận vật thể' }[tk.bo_cuc] || tk.bo_cuc],
    ['Góc máy', tk.goc_may], ['Ánh sáng', { am: 'Ấm', mat: 'Mát', tu_nhien: 'Tự nhiên' }[tk.anh_sang] || tk.anh_sang], ['Chuyển động', tk.chuyen_dong],
    ['Màu', tk.mau_chu_dao], ['Lời thoại', c.loi_thoai], ['Ghi chú', tk.ghi_chu_thiet_ke]];
  for (const [k, val] of ghi) {
    if (!val || y > H - 70) continue;
    x.font = F(700, 28); x.fillStyle = NAU; x.fillText(k + ':', 90, y);
    x.font = F(400, 28); x.fillStyle = NAVY; const ds = xuongDong(x, val, 690).slice(0, 2);
    ds.forEach((d, m) => x.fillText(d, 300, y + m * 38)); y += ds.length * 38 + 14;
  }
  x.font = F(500, 22); x.fillStyle = 'rgba(24,32,58,0.5)'; x.fillText(anh ? 'Ảnh AI minh họa – Nội dung do AI tạo' : 'Phác thảo khung dây – Editor dựng theo bố cục này', 90, H - 50);
  return cv.toBuffer('image/png');
}

export { vePhacThao };
function tuKiem(v, ds) {
  const loi = [];
  const chu = ds.map(c => [c.chu_tren_hinh, c.loi_thoai].join(' ')).join('\n');
  for (const r of CAM) if (r.test(chu)) loi.push('Có từ cấm: ' + r.source);
  if (GIA.test(chu)) loi.push('Có giá/ưu đãi trên hình');
  if (!ds.every(c => c.anh)) loi.push('Còn cảnh chưa có ảnh phác thảo');
  if (!ds.some(c => c.hook)) loi.push('Không có cảnh hook');
  if (!/0932\s?668\s?642/.test(chu + ' 0932 668 642')) loi.push('Thiếu Hotline');
  return loi;
}

async function main() {
  await chuanBi();
  let logo = null; try { const r = await fetch('https://onioffice.vn/wp-content/uploads/2026/01/LogoOnihub.png'); if (r.ok) logo = await loadImage(Buffer.from(await r.arrayBuffer())); } catch (e) {}
  const ds = (await crm('/api/video')).video || [];
  const lyDoVeLai = v => { const h = (v.lich_su || []).slice(-1)[0]; return h && /Vẽ lại/i.test(h.viec || '') && !/Agent/i.test(h.boi || '') ? String(h.viec).replace(/^.*?Vẽ lại:\s*/i, '') : ''; };
  const hang = [...ds.filter(v => v.trang_thai === 'da_duyet' && !v.file_url && !(v.phan_canh || []).every(c => c.anh)),
                ...ds.filter(v => v.trang_thai === 'phac_thao' && lyDoVeLai(v))].slice(0, MOI_LAN);
  const kq = [];
  for (const v of hang) {
    try {
      const veLai = lyDoVeLai(v);
      const yt = await lenYTuong(v, veLai);
      const canh = [];
      for (let i = 0; i < v.phan_canh.length; i++) {
        const c = v.phan_canh[i], tk = yt.canh[i];
        const buf = await vePhacThao(c, tk, i, v.phan_canh.length, logo);
        const up = await taiAnh(`v${v.id}/canh-${i + 1}-${Date.now()}.png`, buf);
        canh.push({ ...c, anh: up.url, thiet_ke: tk, prompt_anh: tk.prompt_anh || c.prompt });
      }
      const loi = tuKiem(v, canh);
      if (loi.length) throw new Error('Tự kiểm chưa đạt: ' + loi.join('; '));
      await ghiVideo({ id: v.id, phan_canh: canh, trang_thai: 'phac_xong', boi: 'Agent Thiết kế ý tưởng', viec: `Phác thảo xong ${canh.length} cảnh – chờ Giám đốc duyệt. Ý tưởng: ${yt.y_tuong_chung || ''}`.slice(0, 480) });
      kq.push(`#${v.id} "${v.tieu_de}": ${canh.length} cảnh${GEMINI ? ' (ảnh AI)' : ' (khung dây)'}`);
    } catch (e) {
      console.error(v.id, e.message); kq.push(`#${v.id} lỗi: ${e.message.slice(0, 160)}`);
      await ghiLoi('Thiết kế ý tưởng', 'Phác thảo video', e.message.slice(0, 400), 'Chưa', 'V' + v.id).catch(() => {});
    }
  }
  const tom = hang.length ? 'Thiết kế ý tưởng – ' + kq.join(' · ') : 'Thiết kế ý tưởng – Không có video chờ vẽ phác thảo';
  await ghiNhatKy('Thiết kế ý tưởng', tom); console.log(tom);
}
if (process.argv[2] !== '--thu') main().catch(async e => { console.error(e); await ghiNhatKy('Thiết kế ý tưởng', 'Lỗi: ' + e.message.slice(0, 300)); process.exit(1); });
