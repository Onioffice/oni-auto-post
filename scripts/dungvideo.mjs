// AGENT DỰNG VIDEO – BƯỚC CHUẨN BỊ GÓI DỰNG (chị tuyển 28/11/2026).
// Mỗi ngày 10:07: video Giám đốc đã duyệt phác thảo ("dung") mà chưa có gói dựng →
// 1) viết kịch bản dựng theo chuẩn Oni Studio (khung bìa, cảnh, phụ đề, nhạc) – file src/data/video-script.json của xưởng dựng,
// 2) viết prompt Veo cho từng cảnh (clip người chuyển động, dọc 9:16) và lời đọc cho giọng Cleo (đọc "Ô-ni"),
// 3) Agent Rà soát gói dựng kiểm theo quy tắc khóa cứng; sai thì tự trả về làm lại (tối đa 3 lần).
// Bước làm clip Veo + giọng đọc + xuất MP4 + QC từng khung hình làm trong phiên có máy chị (chị chốt 28/11: ~3 clip/ngày hoặc /tuần,
// ưu tiên chất lượng). Agent KHÔNG duyệt, KHÔNG đăng. Không ghi nhãn AI trên video (chị chốt 22/11 và 28/11).
import fs from 'node:fs';
import { crm, claude, layJSON, ghiLoi, ghiNhatKy, homNay } from './lib.mjs';
import { PHONG_CACH } from './video.mjs';
import { layCaiDat } from './lib.mjs';
const QUY_TAC = fs.readFileSync(new URL('../prompts/quy-tac.md', import.meta.url), 'utf8');
const MOI_LAN = Number(process.env.DUNG_MOI_LAN || 2);

const LUAT_STUDIO = `QUY TẮC KHÓA CỨNG ONI STUDIO (Giám đốc chốt 22/11/2026, Notion "Bộ phận Editor Video – Sổ tay"):
- Dọc 9:16 1080x1920, 24 khung/giây, tổng 25–40 giây, chuyển cảnh mờ 0,5 giây, KHÔNG slow-motion.
- Khung bìa 1,5 giây: nhãn vàng (kicker, CHỮ IN HOA) + tiêu đề 2 dòng + dòng nhấn vàng (chỉ ghi giá/ưu đãi khi Giám đốc đã đưa số; giá chưa VAT phải ghi "chưa gồm VAT"; không có số thì để trống).
- Mỗi cảnh 1 clip Veo có NGƯỜI CHUYỂN ĐỘNG tự nhiên; kicker in hoa; tiêu đề ≤50 ký tự; dòng phụ ≤90 ký tự; cảnh cuối là thẻ liên hệ (isCta).
- Tên cơ sở chỉ ghi: "Oni Office Tân Định – Trung tâm Quận 1 cũ" và "Oni Office Gò Vấp – KDC CityLand Park Hills" ("Quận 1 cũ" cùng 1 dòng). KHÔNG số nhà, tên đường.
- Dải liên hệ cố định: onioffice.vn ◆ sales@onioffice.vn ◆ Hotline 0932 668 642.
- KHÔNG ghi nhãn AI trên hình, phụ đề, lời đọc ("Nội dung do AI tạo", "ảnh minh họa"…). Không viết "ảnh thật", "quay trực tiếp tại…"; không tả tiện ích Oni không có.
- Từ cấm: cam kết 100%, rẻ nhất, duy nhất, kiếm tiền, làm giàu, tốt nhất Việt Nam, lừa đảo, đối thủ, tên đối thủ, số 1, hàng đầu, "tư vấn pháp lý/luật/thuế" (chỉ nói "hỗ trợ thủ tục").
- Nên dùng: Tối ưu chi phí vận hành, Nâng tầm hình ảnh doanh nghiệp, Không gian truyền cảm hứng tại trung tâm, Linh hoạt mở rộng quy mô, chi phí minh bạch, thủ tục pháp lý rõ ràng.
- Lời đọc (giọng nữ Cleo, trẻ miền Nam, trong trẻo, vui tươi, lịch sự): viết "Ô-ni Office", "Ô-ni Hub", "Ô-ni Office chấm vi en"; số viết bằng chữ ("không chín ba hai sáu sáu tám sáu bốn hai").
- Phụ đề khớp từng câu lời đọc, nằm trong tổng thời lượng, cân dòng (không để 1 chữ lẻ dòng 2).
- Prompt Veo (tiếng Anh): vertical 9:16, young Vietnamese professionals in elegant smart-casual, bright modern office, warm cream walls #F6EDDC, brass/wood #C9A878, navy #0C1830 accents, natural daylight, natural human motion, real-time speed (no slow motion), cinematic but realistic, no text, no logo, no watermark.
- Nhạc nền: chọn 1 trong 3 bài đã duyệt (bgmTrack 1|2|3), tự nhỏ còn 18% khi có giọng.`;

async function soanGoi(v, loiTruoc) {
  const canh = (v.phan_canh || []).map((c, i) => `${i + 1}. [${c.giay}s${c.hook ? ' · HOOK' : ''}] ${c.canh} | chữ: ${c.chu_tren_hinh || ''} | thoại: ${c.loi_thoai || ''} | thiết kế đã duyệt: ${JSON.stringify(c.thiet_ke || {}).slice(0, 400)}`).join('\n');
  const t = await claude({
    max_tokens: 12000, system: QUY_TAC + '\n\n' + LUAT_STUDIO,
    messages: [{ role: 'user', content: `Hôm nay ${homNay()}. Em là Agent Dựng video của Oni Office. Kịch bản và phác thảo dưới đây Giám đốc ĐÃ DUYỆT – giữ đúng ý, lời thoại, chữ trên hình; chỉ chuyển sang gói dựng Oni Studio.
Tiêu đề: ${v.tieu_de}
Mục tiêu: ${v.muc_tieu || ''}
Phong cách: ${(() => { const p = PHONG_CACH.find(x => x.id === v.phong_cach); return p ? `${p.ten} – ${p.mo}. ${p.loai === 'motion' ? 'Cảnh đồ họa chuyển động: mediaType "motion", media để trống, thêm "motion":{mô tả hình minh họa phẳng, chữ chạy, bộ đếm…} – KHÔNG cần prompt Veo cho cảnh này.' : 'Cảnh có người: mediaType "video" + prompt Veo.'}` : 'clip người AI (Veo)'; })()}
Ghi chú Giám đốc: ${v.ghi_chu || '(không có – KHÔNG ghi giá/ưu đãi)'}
Các cảnh:
${canh}
${loiTruoc ? `\nBẢN TRƯỚC BỊ RÀ SOÁT TRẢ LẠI vì: ${loiTruoc}\n→ Sửa đúng từng lỗi.\n` : ''}
Trả lời DUY NHẤT khối:
\`\`\`json
{"cover":{"kicker":"…","title":["dòng 1","dòng 2"],"highlight":""},
 "scenes":[{"id":"c1","durationSec":4,"media":"veo-v${v.id}-01.mp4","mediaType":"video","kicker":"…","title":"…","body":"…","isCta":false}],
 "locations":["tan-dinh","cityland"],
 "subtitles":[{"from":0.0,"to":2.5,"text":"…"}],
 "audio":{"useVoiceover":true,"useBgm":true,"bgmTrack":1},
 "fps":24,
 "veo":[{"scene":"c1","prompt":"English Veo prompt…","ghi_chu":"điểm cần soi khi nhận clip (tay, mặt, chữ lạ…)"}],
 "loi_doc":"toàn bộ lời đọc cho giọng Cleo, có Ô-ni, số viết bằng chữ",
 "mo_ta_giong":"mô tả giọng đọc"}
\`\`\`` }]
  });
  return layJSON(t);
}

const CAM = [/cam kết\s*100/i, /rẻ nhất/i, /duy nhất/i, /kiếm tiền/i, /làm giàu/i, /tốt nhất/i, /lừa đảo/i, /đối thủ/i, /\bsố\s*1\b/i, /hàng đầu/i,
  /tư vấn\s+(pháp lý|luật|thuế|kế toán)/i, /Quận\s*\d(?!\s*cũ)/i, /\d+\s*(Nguyễn Văn Nguyễn|Đường số)/i, /Nội dung do AI tạo/i, /ảnh minh họa/i, /ảnh thật/i, /quay trực tiếp/i];
const GIA = /\d[\d.,]*\s*(đồng|đ(?![\p{L}])|vnđ|vnd|k(?![\p{L}])|nghìn|ngàn|triệu|usd|\$)/iu;

function raSoat(g, v) {
  const loi = [], sc = g.scenes || [], sub = g.subtitles || [];
  const chuHinh = [g.cover?.kicker, ...(g.cover?.title || []), g.cover?.highlight, ...sc.flatMap(s => [s.kicker, s.title, s.body]), ...sub.map(s => s.text)].filter(Boolean).join('\n');
  for (const r of CAM) if (r.test(chuHinh + '\n' + (g.loi_doc || ''))) loi.push('Từ cấm/sai quy tắc: ' + r.source);
  if (!v.ghi_chu && GIA.test(chuHinh)) loi.push('Có giá/ưu đãi nhưng Giám đốc chưa đưa số');
  if (GIA.test(chuHinh) && !/chưa gồm VAT|gồm VAT/i.test(chuHinh)) loi.push('Giá phải ghi rõ chưa gồm VAT / gồm VAT');
  const tong = sc.reduce((a, s) => a + Number(s.durationSec || 0), 0);
  if (tong < 25 || tong > 40) loi.push(`Tổng thời lượng ${tong}s – cần 25–40s`);
  if (sc.length < 4) loi.push('Quá ít cảnh');
  const pc = PHONG_CACH.find(x => x.id === v.phong_cach);
  if (pc && pc.loai === 'veo' && !sc.some(s => s.mediaType === 'video')) loi.push('Phong cách cần clip người (Veo) nhưng không có cảnh video nào');
  sc.forEach(s => {
    if ((s.title || '').length > 50) loi.push(`Cảnh ${s.id}: tiêu đề quá 50 ký tự`);
    if ((s.body || '').length > 90) loi.push(`Cảnh ${s.id}: dòng phụ quá 90 ký tự`);
    if (s.kicker && s.kicker !== s.kicker.toUpperCase()) loi.push(`Cảnh ${s.id}: nhãn vàng phải IN HOA`);
    if (s.mediaType === 'motion') { if (!s.motion) loi.push(`Cảnh ${s.id}: thiếu mô tả đồ họa chuyển động`); }
    else if (!/^[a-z0-9-]+\.(mp4|jpg|png)$/.test(s.media || '')) loi.push(`Cảnh ${s.id}: tên file tư liệu phải chữ thường không dấu`);
  });
  if (!sc.length || !sc[sc.length - 1].isCta) loi.push('Cảnh cuối phải là thẻ liên hệ (isCta)');
  sub.forEach(s => { if (Number(s.to) > tong + 0.01 || Number(s.from) >= Number(s.to)) loi.push(`Phụ đề "${String(s.text).slice(0, 20)}…" lệch thời gian`); });
  if (!/Ô-ni/.test(g.loi_doc || '')) loi.push('Lời đọc phải viết "Ô-ni"');
  if (/\d{3,}/.test(g.loi_doc || '')) loi.push('Lời đọc còn số viết bằng chữ số – phải viết bằng chữ');
  const veo = g.veo || [];
  if (veo.length !== sc.filter(s => s.mediaType === 'video').length) loi.push('Số prompt Veo không khớp số cảnh clip');
  veo.forEach(p => { const t = p.prompt || ''; if (!/9:16|vertical/i.test(t) || !/no text/i.test(t) || !/slow/i.test(t)) loi.push(`Prompt Veo ${p.scene} thiếu "vertical 9:16", "no text" hoặc "no slow motion"`); });
  if (g.fps !== 24) loi.push('fps phải là 24');
  return [...new Set(loi)];
}

async function main() {
  if (process.env.SU_KIEN === 'schedule' && (await layCaiDat()).dungvideo === false) { console.log('Chị đang tắt Agent Dựng video.'); return; }
  const ds = (await crm('/api/video')).video || [];
  const hang = ds.filter(v => v.trang_thai === 'dung' && !(v.goi_dung && v.goi_dung.kich_ban_studio)).slice(0, MOI_LAN);
  const kq = [];
  for (const v of hang) {
    try {
      let g, loi = [], lan = 0;
      do { lan++; g = await soanGoi(v, loi.join('; ')); loi = raSoat(g, v); } while (loi.length && lan < 3);
      if (loi.length) throw new Error(`Rà soát ${lan} lần vẫn chưa đạt: ` + loi.join('; '));
      const { veo, loi_doc, mo_ta_giong, ...studio } = g;
      await crm('/api/video/goi', { method: 'POST', body: JSON.stringify({ id: v.id, boi: 'Agent Dựng video',
        viec: veo.length ? `Gói dựng xong (rà soát đạt lần ${lan}) – chờ làm ${veo.length} clip Veo + giọng đọc trong phiên có máy Giám đốc` : `Gói dựng xong (rà soát đạt lần ${lan}) – video đồ họa chuyển động, không cần clip Veo; chờ giọng đọc + xuất MP4`,
        goi_dung: { kich_ban_studio: studio, veo, loi_doc, mo_ta_giong, buoc: 'cho_lam_clip', clip_xong: [], luc: new Date().toISOString() } }) });
      kq.push(`#${v.id} "${v.tieu_de}": gói dựng ${studio.scenes.length} cảnh, ${veo.length} clip cần làm`);
    } catch (e) {
      console.error(v.id, e.message); kq.push(`#${v.id} lỗi: ${e.message.slice(0, 160)}`);
      await ghiLoi('Dựng video', 'Gói dựng', e.message.slice(0, 400), 'Chưa', 'V' + v.id).catch(() => {});
    }
  }
  const tom = hang.length ? 'Dựng video – ' + kq.join(' · ') : 'Dựng video – Không có video chờ chuẩn bị gói dựng';
  await ghiNhatKy('Dựng video', tom); console.log(tom);
}
main().catch(async e => { console.error(e); await ghiNhatKy('Dựng video', 'Lỗi: ' + e.message.slice(0, 300)); process.exit(1); });
