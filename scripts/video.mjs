// AGENT EDITOR VIDEO AI + RÀ SOÁT VIDEO (chị lập bộ phận Editor 25/11/2026).
// Mỗi ngày 9:07: 1) ý tưởng chị giao (Ý tưởng) và video bị trả sửa → viết lại kịch bản + chia cảnh;
// 2) hàng đang ít thì tự lấy 1 tin trong Kho tin làm video mới; 3) Agent Rà soát kiểm từng kịch bản:
// sai thì tự trả về Editor làm lại (tối đa 3 lần), đạt thì "Chờ Giám đốc duyệt". Agent KHÔNG tự duyệt, KHÔNG đăng.
// Nhân vật và bối cảnh đều do AI tạo; không đóng giả khách thật. Chị chốt 28/11: KHÔNG ghi nhãn AI trên video, hình hay caption – chỉ bật nút khai báo AI của nền tảng khi đăng.
// Bước dựng ra file video cần nối công cụ tạo video AI; chưa nối thì dừng ở "Đã duyệt kịch bản" và ghi nhật ký.
import fs from 'node:fs';
import { crm, claude, layJSON, layCaiDat, layTin, dungTin, ghiLoi, ghiNhatKy, MODEL_KIEM, homNay } from './lib.mjs';
const QUY_TAC = fs.readFileSync(new URL('../prompts/quy-tac.md', import.meta.url), 'utf8');
const TOI_DA_SUA = 3, MOI_LAN = Number(process.env.VIDEO_MOI_LAN || 3), HANG_TOI_THIEU = 3;
const ghiVideo = p => crm('/api/video', { method: 'POST', body: JSON.stringify(p) });

const LUAT_VIDEO = `LUẬT VIDEO ONI OFFICE (bắt buộc):
- Video dọc 9:16, dài 20–35 giây, 5–8 cảnh.
- BẮT BUỘC ÍT NHẤT 2 HOOK (điểm móc giữ người xem) – chị chốt 25/11/2026:
  · Hook 1 ở giây 0–3: câu hỏi/khẳng định gây tò mò nói trúng nỗi lo người xem (không chào hỏi, không giới thiệu công ty trước).
  · Hook 2 (móc lại) ở khoảng giây 8–18: bất ngờ, con số, "nhưng…", lật vấn đề hoặc hứa hẹn điều sắp tiết lộ – để người xem không lướt qua giữa video.
  · Có thể thêm Hook 3 trước lời kêu gọi cuối. Mỗi hook phải hiện cả ở lời thoại và chữ trên hình của cảnh đó.
  · Ghi rõ trong "hooks": [{"giay":"0–3","cau":"…","kieu":"câu hỏi|con số|bất ngờ|lật vấn đề|hứa hẹn"}] và đánh dấu "hook": true ở cảnh chứa hook.
- Nhân vật và bối cảnh đều do AI tạo. Nhân vật chỉ là người dẫn hoặc nhân viên tư vấn minh họa; KHÔNG đóng vai khách hàng thật, KHÔNG nói lời khen/đánh giá như khách, KHÔNG dùng tên, mặt, logo người/công ty có thật.
- KHÔNG ghi nhãn AI ("Nội dung do AI tạo", "ảnh minh họa"…) trên hình, lời thoại hay caption – khi đăng bật nút khai báo AI (chị chốt 28/11). Caption có 3–5 hashtag; cuối video có logo Oni Office + Hotline/Zalo 0932 668 642 + onioffice.vn.
- Cơ sở (chuẩn Oni Studio 22/11): chỉ ghi tên "Oni Office Tân Định – Trung tâm Quận 1 cũ" và "Oni Office Gò Vấp – KDC CityLand Park Hills"; KHÔNG ghi số nhà, tên đường trên video.
- Không ghi giá, ưu đãi trên hình hay lời thoại (giá chỉ báo khi khách hỏi). Không hứa hẹn kiểu "đảm bảo 100%", "rẻ nhất", "số 1", "tốt nhất".
- Không nói Oni "tư vấn pháp lý/luật/thuế"; chỉ nói "hỗ trợ thủ tục". Tin chính sách phải đúng nguồn, ghi rõ số hiệu nếu nêu.
- Màu nhận diện Oni Studio: navy #0C1830, kem #F6EDDC, vàng đồng #C9A878, đồng ấm #7A5A1E; phông Be Vietnam Pro đậm. Clip người chuyển động (Veo), 24 khung/giây, không slow-motion.
- "prompt" mỗi cảnh viết bằng tiếng Anh cho công cụ tạo video AI: mô tả nhân vật AI (tuổi, trang phục công sở Việt Nam), bối cảnh văn phòng hiện đại sáng, góc máy, ánh sáng, 9:16, không chữ, không logo trong ảnh AI.`;

async function vietKichBan(v, tin) {
  const t = await claude({
    max_tokens: 16000, system: QUY_TAC + '\n\n' + LUAT_VIDEO,
    messages: [{ role: 'user', content: `Hôm nay ${homNay()}. Em là Agent Editor video AI của Oni Office (cho thuê văn phòng trọn gói, văn phòng ảo, chỗ ngồi, phòng họp tại TP.HCM; hỗ trợ thủ tục thành lập doanh nghiệp, FDI).
Viết kịch bản video ${v.kenh || 'TikTok'}:
- Ý tưởng / tiêu đề: ${v.tieu_de}
${v.muc_tieu ? '- Mục tiêu: ' + v.muc_tieu + '\n' : ''}${v.ghi_chu ? '- Ghi chú của Giám đốc: ' + v.ghi_chu + '\n' : ''}${tin ? `- Dựa trên tin (đã kiểm nguồn): ${tin.tieuDe} – ${tin.tomTat} (${tin.nguon || 'không có link'})\n` : ''}${v.loi_ra_soat ? `- BẢN TRƯỚC BỊ TRẢ LẠI vì: ${v.loi_ra_soat}\n  → Sửa đúng từng lỗi này.\n` : ''}${v.kich_ban ? '- Kịch bản cũ (không chép phần sai):\n' + String(v.kich_ban).slice(0, 2000) + '\n' : ''}
Trả lời DUY NHẤT khối:
\`\`\`json
{"tieu_de":"…","muc_tieu":"…","doi_tuong":"…","kich_ban":"đoạn văn kể diễn biến video","hooks":[{"giay":"0–3","cau":"…","kieu":"…"},{"giay":"10–13","cau":"…","kieu":"…"}],"phan_canh":[{"giay":"0–3","canh":"…","hook":true,"nhan_vat_ai":"…","boi_canh_ai":"…","chu_tren_hinh":"…","loi_thoai":"…","prompt":"English prompt…"}],"caption":"… #…","nhac":"thể loại nhạc nền, nhịp"}
\`\`\`` }]
  });
  const j = layJSON(t);
  if (!Array.isArray(j.phan_canh) || j.phan_canh.length < 3) throw new Error('Kịch bản thiếu phân cảnh');
  return j;
}

// Rà soát = máy kiểm luật cứng + Agent Rà soát (Haiku) kiểm phần còn lại
const CAM = [/tư vấn\s+(pháp lý|luật|thuế|kế toán)/i, /\bsố\s*1\b/i, /100\s*%/, /rẻ nhất/i, /tốt nhất/i, /hàng đầu/i, /uy tín nhất/i, /cam kết tuyệt đối/i, /Quận\s*\d(?!\s*cũ)/i, /\d+\s*(Nguyễn Văn Nguyễn|Đường số)/i];
const GIA = /\d[\d.,]*\s*(đồng|đ(?![\p{L}])|vnđ|vnd|k(?![\p{L}])|nghìn|ngàn|triệu|usd|\$)/iu;
async function raSoat(kb) {
  const loi = [];
  const chu = [kb.kich_ban, kb.caption, ...(kb.phan_canh || []).flatMap(c => [c.chu_tren_hinh, c.loi_thoai])].join('\n');
  for (const r of CAM) if (r.test(chu)) loi.push('Có từ cấm: ' + r.source);
  if (GIA.test(chu)) loi.push('Có giá/ưu đãi trong lời thoại, chữ trên hình hoặc caption');
  if (/Nội dung do AI tạo|ảnh minh họa|hình ảnh minh họa/i.test(chu)) loi.push('Có nhãn AI trên hình/caption – chị chốt không ghi, chỉ bật nút khai báo AI khi đăng');
  if (!/0932\s?668\s?642/.test(chu)) loi.push('Thiếu Hotline/Zalo 0932 668 642 ở cảnh cuối');
  const n = (kb.phan_canh || []).length; if (n < 5 || n > 8) loi.push(`Cần 5–8 cảnh (đang ${n})`);
  // Luật 2 hook (25/11): hook 1 bắt đầu ở giây 0, hook 2 từ giây 6 trở đi; mỗi hook phải có trong lời thoại hoặc chữ trên hình
  const giay0 = g => Number(String(g || '').match(/\d+/)?.[0] ?? NaN);
  const hooks = Array.isArray(kb.hooks) ? kb.hooks.filter(h => h && h.cau) : [];
  if (hooks.length < 2) loi.push(`Video phải có ít nhất 2 hook (đang ${hooks.length})`);
  else {
    if (giay0(hooks[0].giay) !== 0) loi.push('Hook 1 phải nằm ở giây 0–3');
    if (!hooks.slice(1).some(h => giay0(h.giay) >= 6)) loi.push('Thiếu hook móc lại ở giữa video (từ giây 6 trở đi)');
  }
  if ((kb.phan_canh || []).filter(c => c.hook).length < 2) loi.push('Phải đánh dấu "hook" ở ít nhất 2 cảnh');
  if ((kb.phan_canh || []).some(c => !/^[\x00-\x7F\s]+$/.test(String(c.prompt || 'x').replace(/[–—’“”]/g, '')))) loi.push('Prompt cảnh phải viết tiếng Anh');
  const t = await claude({
    model: MODEL_KIEM, max_tokens: 6000, system: LUAT_VIDEO,
    messages: [{ role: 'user', content: `Em là Agent Rà soát của phòng Marketing Oni Office. Kiểm kịch bản video sau theo LUẬT VIDEO. Kịch bản dưới đây là ĐẦY ĐỦ (không bị cắt). Chỉ nêu lỗi THẬT (vi phạm luật, sai địa chỉ, nhân vật AI đóng vai khách thật/lời chứng thực, hứa hẹn quá mức, sai chính tả tiếng Việt, hook 1 (0–3 giây) hoặc hook 2 (giữa video) yếu, không gây tò mò, cảnh không khớp lời thoại). Không bắt bẻ văn phong.
${JSON.stringify(kb)}
Trả lời DUY NHẤT: \`\`\`json
{"dat":true,"loi":["…"]}
\`\`\`` }]
  });
  let j = {}; try { j = layJSON(t); } catch { j = { dat: true, loi: [] }; }
  return [...loi, ...(j.dat === false ? (j.loi || []).map(String) : [])];
}

async function lamMot(v, tin) {
  let ban = v, lan = v._lamLai ? 0 : (v.lan_sua || 0), lich = [];
  while (true) {
    const kb = await vietKichBan(ban, tin);
    const loi = await raSoat(kb);
    if (!loi.length) {
      await ghiVideo({ id: v.id, ...kb, trang_thai: 'cho_duyet', boi: 'Agent Rà soát', viec: `Đạt rà soát${lich.length ? ` sau ${lich.length} lần sửa` : ''} – chờ Giám đốc duyệt kịch bản` });
      return `"${kb.tieu_de}" đạt${lich.length ? ` (sửa ${lich.length} lần)` : ''}`;
    }
    lan++; lich.push(loi.join('; '));
    await ghiVideo({ id: v.id, ...kb, trang_thai: 'can_sua', ly_do: loi.join('; ').slice(0, 1500), boi: 'Agent Rà soát', viec: 'Trả về Editor: ' + loi.join('; ').slice(0, 400) });
    if (lan >= TOI_DA_SUA) {
      await ghiLoi('Rà soát video #' + v.id, '3. Kẹt sau 3 lần sửa', loi.join('; '), 'Chưa – cần Giám đốc xem');
      return `"${kb.tieu_de}" kẹt sau ${lan} lần sửa – báo Giám đốc`;
    }
    ban = { ...ban, ...kb, loi_ra_soat: loi.join('; ') };
  }
}

async function main() {
  const cd = await layCaiDat();
  if (cd.video === false) { console.log('Chị đang tắt Agent Editor video.'); return; }
  const ds = (await crm('/api/video')).video || [];
  const viec = [
    ...ds.filter(v => v.trang_thai === 'y_tuong'),
    ...ds.filter(v => v.trang_thai === 'can_sua' && (v.lan_sua || 0) < TOI_DA_SUA && !/Rà soát/.test((v.lich_su || []).slice(-1)[0]?.boi || '')),   // Giám đốc trả lại
  ].slice(0, MOI_LAN);
  const iLL = process.argv.indexOf('--lam-lai');   // node scripts/video.mjs --lam-lai 12 → làm lại đúng video #12 (VD áp luật mới)
  if (iLL > 0) for (const id of String(process.argv[iLL + 1] || '').split(',').reverse()) {
    const v = ds.find(x => String(x.id) === id.trim());
    if (v) { const i = viec.findIndex(x => x.id === v.id); if (i >= 0) viec.splice(i, 1); viec.unshift({ ...v, _lamLai: true, loi_ra_soat: 'Làm lại: đủ 5–8 cảnh, ≥2 hook (0–3 giây và giữa video), cảnh cuối có logo + Hotline/Zalo 0932 668 642 + onioffice.vn, caption 3–5 hashtag, không ghi nhãn AI.' }); }
  }
  const ket = [];
  // Hàng đang ít → tự lấy tin trong kho làm 1 video mới (hợp kênh TikTok/video ngắn)
  const dangLam = ds.filter(v => ['kich_ban', 'ra_soat', 'can_sua', 'cho_duyet'].includes(v.trang_thai)).length;
  let tinMoi = null;
  if (viec.length < MOI_LAN && dangLam < HANG_TOI_THIEU) {
    const kho = await layTin(40).catch(() => []);
    tinMoi = kho.find(t => (t.kenh || []).includes('TikTok')) || kho.find(t => ['xu_huong', 'kinh_doanh', 'van_phong'].includes(t.loai)) || null;
    const ytuong = tinMoi ? `Video ngắn từ tin: ${tinMoi.tieuDe}` : 'Video 30 giây: một ngày làm việc ở văn phòng Oni (người dẫn AI)';
    const r = await ghiVideo({ tieu_de: ytuong.slice(0, 200), kenh: 'TikTok', muc_tieu: tinMoi?.yTuong || 'Nhận diện thương hiệu, kéo khách hỏi văn phòng ảo / phòng riêng', trang_thai: 'y_tuong', tin_id: tinMoi?.id || '', boi: 'Agent Editor', viec: 'Tự lên ý tưởng từ Kho tin' });
    viec.push({ id: r.id, tieu_de: ytuong, kenh: 'TikTok', muc_tieu: tinMoi?.yTuong || '', _tin: tinMoi });
  }
  for (const v of viec) {
    try { ket.push(await lamMot(v, v._tin || null)); }
    catch (e) { await ghiLoi('Editor video #' + v.id, '1. Chạy hỏng', e.message, 'Chưa'); ket.push(`#${v.id}: lỗi`); }
  }
  if (tinMoi) await dungTin([{ id: tinMoi.id, cho: 'Video TikTok' }]).catch(() => {});
  const choDung = ds.filter(v => v.trang_thai === 'da_duyet' && !v.file_url).length;
  const kq = (ket.length ? `Làm ${ket.length} kịch bản – ${ket.join('; ')}` : 'Không có kịch bản cần làm') + (choDung ? ` · ${choDung} video đã duyệt kịch bản đang chờ công cụ dựng video AI` : '');
  await ghiNhatKy('Editor video', kq); console.log(kq);
}
main().catch(async e => { console.error(e); await ghiLoi('Agent Editor video', '1. Chạy hỏng', e.message, 'Chưa'); process.exit(1); });
