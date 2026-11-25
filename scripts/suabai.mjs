// CÔNG NHÂN SỬA BÀI (chị chốt 09/11/2026): bài chị bấm "Cần sửa" (hoặc máy kiểm chưa đạt) → bot đọc lý do,
// viết lại cả chữ lẫn hình theo đúng lý do + luật, kiểm lỗi lại, ghi đè đúng bài cũ (giữ mã, giờ đăng) → về lại "Chờ BOSS".
// Mỗi bài tối đa 3 lần tự sửa (chị chốt 25/11/2026: Rà soát trả về đến khi đạt); quá 3 lần thì báo kẹt, chờ chị xem.
// `node scripts/suabai.mjs --dem` chỉ đếm số bài cần sửa.
import { layMK, homNay, ghiNhatKy, opMK, ghiLoi, layCaiDat } from './lib.mjs';
const MOI_LAN = Number(process.env.SUA_MOI_LAN || 4);
const txt = h => String(h || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

async function main() {
  const [M, cd] = await Promise.all([layMK(), layCaiDat()]);
  const ds = (M.posts || []).filter(p => !p.del && p.tt === 'Cần sửa' && (p.lanSua || 0) < 3 && (p.at || '') >= homNay() && p.ma)
    .sort((a, b) => (a.at + a.gio).localeCompare(b.at + b.gio));
  if (process.argv.includes('--dem')) { console.log(cd.suabai === false ? 0 : ds.length); return; }
  if (cd.suabai === false) { console.log('Công tắc sửa bài đang tắt'); return; }
  if (!ds.length) { console.log('Không có bài cần sửa.'); return; }
  const { soanBai } = await import('./soan.mjs');
  const ket = [];
  for (const p of ds.slice(0, MOI_LAN)) {
    const lyChi = (String(p.note || '').match(/Chị: ([^|]+)/g) || []).map(s => s.slice(5).trim());
    // Chị dặn kiểm trùng: máy đã kiểm trùng trước khi soạn; bài tới được bước này là KHÔNG trùng → viết lại cho đạt, không bỏ trống
    const lyMay = (String(p.note || '').match(/Lỗi kiểm: ([^|]+)/) || [])[1] || '';
    const yeuCau = `LÀM LẠI bài ${p.ma} kênh ${p.kenh} đăng ${p.at} ${p.gio}. Bài cũ CHƯA ĐẠT, phải viết lại từ đầu cho đạt.
LÝ DO PHẢI SỬA (làm đúng từng ý, đây là ưu tiên số 1):
${lyChi.length ? lyChi.map(s => '- Chị Giám đốc: ' + s).join('\n') : ''}${lyMay ? '\n- Máy kiểm lỗi: ' + lyMay.slice(0, 600) : ''}
- Nếu chị dặn "kiểm trùng / trùng thì xóa": máy đã kiểm trong kho, bài này KHÔNG trùng bài nào → vẫn phải viết ra bài hoàn chỉnh (đổi góc nhìn cho khác hẳn bài cũ nếu cần).
- Bài phải bám đúng dịch vụ Oni theo LUẬT SỐ 1 (nếu bài cũ lạc đề thì đổi sang chủ đề dịch vụ Oni gần nhất).
BÀI CŨ (để biết chỗ sai, không chép lại phần sai):
Tiêu đề: ${p.tieude}
Nội dung: ${txt(p.nd).slice(0, 2500)}`;
    try {
      const r = await soanBai({ ngay: p.at, kenhs: [p.kenh], yeuCau, gio: p.gio, timTin: false, thayMa: p.ma });
      if (!r.ra?.length) {   // 25/11: không ra bài (VD Claude cho là trùng) → vẫn tính 1 lần sửa để không lặp mãi; đủ 3 lần thì báo chị
        await opMK({ op: 'canSua', ma: p.ma, tang: '1', ly: `Rà soát: lần ${(p.lanSua || 0) + 1} làm lại không ra bài (có thể trùng chủ đề) – chị xem: giữ thì sửa yêu cầu, trùng thì bấm Hủy` });
      }
      ket.push(`${p.ma} ${p.kenh}: ${r.ra[0]?.tt || 'chưa ra bài (tính 1 lần sửa)'}`);
    } catch (e) { await ghiLoi('Sửa bài ' + p.ma, '1. Chạy hỏng', e.message, 'Chưa', p.at); ket.push(`${p.ma}: lỗi`); }
  }
  const ket3 = (M.posts || []).filter(p => !p.del && p.tt === 'Cần sửa' && (p.lanSua || 0) >= 3 && (p.at || '') >= homNay());
  if (ket3.length) await ghiLoi('Rà soát bài', '3. Kẹt sau 3 lần sửa', ket3.slice(0, 8).map(p => `${p.ma} ${p.kenh} ${p.at}`).join('; '), 'Chưa – cần Giám đốc xem');
  const kq = `Làm lại ${ket.length}/${ds.length} bài cần sửa${ket3.length ? ` · ${ket3.length} bài kẹt quá 3 lần (báo Giám đốc)` : ''} – ` + ket.join('; ');
  await ghiNhatKy('Sửa bài', kq); await opMK({ op: 'nhatKy', viec: 'Bot sửa bài theo chị', ct: kq }); console.log(kq);
}
main().catch(e => { console.error(e); process.exit(1); });
