// ĐĂNG BÀI – chạy 10:55 sáng (giờ VN) mỗi ngày trên GitHub Actions, khi công tắc "Tự đăng bài" đang bật.
// Chỉ đăng bài trong app có trạng thái "Đã duyệt", ngày đăng là hôm nay (hoặc trễ tối đa 2 ngày), kênh máy làm được.
// "Chờ duyệt", "Cần sửa", "Hủy", "Nháp" KHÔNG bao giờ được đăng. Mỗi kênh tối đa 1 bài/ngày.
import { homNay, layMK, opMK, ghiLoi, kiemChu, fbDangAnh, igDangAnh, wpDangBai, layCaiDat, ghiNhatKy } from './lib.mjs';

const THU_NGHIEM = process.env.THU_NGHIEM === '1';   // chạy thử: chỉ in ra, không đăng
const nay = homNay(), som = homNay(-2);
const MAY_DANG = ['Facebook', 'Website'];             // Instagram chờ mẫu carousel; kênh khác đăng tay

async function main() {
  if (process.env.SU_KIEN === 'schedule' && !(await layCaiDat()).dang) { console.log('Công tắc "Tự đăng bài" đang tắt.'); return; }
  const M = await layMK(), tat = M.posts || [], daLam = [];
  const daDangHomNay = new Set(tat.filter(x => x.tt === 'Đã đăng' && (x.dang || '').startsWith(nay)).map(x => x.kenh));
  // chỉ đăng bài do máy GitHub soạn (có botAt) và chưa hẹn giờ tay trên trang – tránh đăng trùng bài cũ của lịch trên máy Mac
  const can = tat.filter(x => x.tt === 'Đã duyệt' && !x.link && x.botAt && !x.hen && MAY_DANG.includes(x.kenh) && x.at >= som && x.at <= nay)
    .sort((a, b) => (a.at !== b.at ? (a.at < b.at ? -1 : 1) : (a.kenh === 'Website' ? -1 : b.kenh === 'Website' ? 1 : 0) || (!!b.lenh - !!a.lenh) || ((a.gio || '') < (b.gio || '') ? -1 : 1)));
  if (!can.length) { console.log('Hôm nay không có bài cần đăng.'); if (!THU_NGHIEM) await ghiNhatKy('Tự đăng', 'Không có bài cần đăng'); return; }
  if (!THU_NGHIEM) await opMK({ op: 'batDau' });
  for (const b of can) {
    if (daDangHomNay.has(b.kenh)) { console.log(`Bỏ ${b.ma}: kênh ${b.kenh} đã có bài hôm nay`); continue; }
    const loi = kiemChu(b);                                        // kiểm lỗi lần 2 ngay trước khi đăng
    if (!b.anh) loi.push('Thiếu hình');
    if (loi.length) { if (!THU_NGHIEM) { await opMK({ op: 'canSua', ma: b.ma, ly: 'Kiểm lần 2 trước khi đăng: ' + loi.join('; ') }); await ghiLoi('Đăng bài ' + b.kenh, '2. Bot tự bắt được', loi.join('; '), 'Chưa – chờ chị xem', b.ma); } else console.log('[Thử] Lỗi', b.ma, loi); continue; }
    let nd = b.nd || '';
    if (nd.includes('{LINK_WEB}')) {                               // bài Facebook giới thiệu bài web cùng ngày
      const web = tat.find(x => x.kenh === 'Website' && x.at === b.at && x.tt !== 'Hủy');
      if (web && web.link) nd = nd.replaceAll('{LINK_WEB}', web.link);
      else if (web) { console.log(`Chờ ${b.ma}: bài website cùng ngày (${web.ma}) chưa đăng`); continue; }
      else nd = nd.split('\n').filter(d => !d.includes('{LINK_WEB}')).join('\n');
    }
    if (THU_NGHIEM) { console.log('[Thử] Sẽ đăng', b.ma, b.kenh, b.tieude); continue; }
    try {
      let link;
      if (b.kenh === 'Facebook') link = await fbDangAnh(b.anh, nd);
      else if (b.kenh === 'Instagram') link = await igDangAnh(b.anh, nd);
      else if (b.kenh === 'Website') link = await wpDangBai({ tieude: b.tieude, html: nd, anhId: b.anhId });
      b.link = link;
      await opMK({ op: 'daDang', ma: b.ma, link, dang: nay });
      daDangHomNay.add(b.kenh); daLam.push(b.kenh + ' đã đăng');
      console.log(`Đã đăng ${b.ma} ${b.kenh}: ${link}`);
    } catch (e) {
      await opMK({ op: 'canSua', ma: b.ma, ly: 'Đăng lỗi: ' + e.message.slice(0, 200) });
      await ghiLoi('Đăng bài ' + b.kenh, '1. Chạy hỏng', e.message, 'Chưa', b.ma); daLam.push(b.kenh + ' lỗi');
    }
  }
  if (!THU_NGHIEM) { const kq = daLam.join(', ') || 'Không đăng bài nào'; await ghiNhatKy('Tự đăng', kq); await opMK({ op: 'nhatKy', viec: 'Tự đăng bài', ct: kq }); }
}
main().catch(async e => { await ghiLoi('Đăng bài', '1. Chạy hỏng', e.message); process.exit(1); });
