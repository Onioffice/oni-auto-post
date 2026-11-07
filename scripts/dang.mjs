// ĐĂNG BÀI – chạy 10:55 sáng (giờ VN) mỗi ngày trên GitHub Actions.
// Chỉ đăng bài có ngày đăng là hôm nay (hoặc trễ tối đa 2 ngày) và trạng thái "Đã duyệt" hoặc "Tự đăng".
// Bài "Chờ duyệt", "Cần sửa", "Hủy" KHÔNG bao giờ được đăng. Mỗi kênh tối đa 1 bài/ngày.
import { homNay, layBai, suaBai, ghiLoi, kiemChu, fbDangAnh, igDangAnh, wpDangBai } from './lib.mjs';

const THU_NGHIEM = process.env.THU_NGHIEM === '1';   // chạy thử: chỉ in ra, không đăng
const nay = homNay(), som = homNay(-2);

async function main() {
  const tat = await layBai();
  const daDangHomNay = new Set(tat.filter(x => x.tt === 'Đã đăng' && (x.dangLuc || '').startsWith(nay)).map(x => x.kenh));
  const can = tat.filter(x => ['Đã duyệt', 'Tự đăng'].includes(x.tt) && !x.link && x.at >= som && x.at <= nay)
    .sort((a, b) => (a.at + a.gio < b.at + b.gio ? -1 : 1));
  if (!can.length) { console.log('Hôm nay không có bài cần đăng.'); return; }
  for (const b of can) {
    if (daDangHomNay.has(b.kenh)) { console.log(`Bỏ ${b.ma}: kênh ${b.kenh} đã có bài hôm nay`); continue; }
    // Kiểm lỗi lần 2 ngay trước khi đăng
    const loi = kiemChu(b);
    if (b.tt === 'Tự đăng' && b.coGia) loi.push('Bài có giá/ưu đãi phải chờ chị duyệt');
    if (!b.anh) loi.push('Thiếu hình');
    if (loi.length) { await suaBai(b.ma, { tt: 'Cần sửa', note: (b.note || '') + ' | Kiểm lần 2: ' + loi.join('; ') }); await ghiLoi('Đăng bài ' + b.kenh, '2. Bot tự bắt được', loi.join('; '), 'Chưa – chờ chị xem', b.ma); continue; }
    if (THU_NGHIEM) { console.log('[Thử] Sẽ đăng', b.ma, b.kenh, b.tieude); continue; }
    try {
      let link;
      if (b.kenh === 'Facebook') link = await fbDangAnh(b.anh, b.nd);
      else if (b.kenh === 'Instagram') link = await igDangAnh(b.anh, b.nd);
      else if (b.kenh === 'Website') link = await wpDangBai({ tieude: b.tieude, html: b.nd, anhId: b.anhId });
      else { console.log('Kênh chưa hỗ trợ:', b.kenh); continue; }
      await suaBai(b.ma, { tt: 'Đã đăng', link, dangLuc: new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 16).replace('T', ' ') });
      daDangHomNay.add(b.kenh);
      console.log(`Đã đăng ${b.ma} ${b.kenh}: ${link}`);
    } catch (e) {
      await suaBai(b.ma, { tt: 'Lỗi', loi: e.message });
      await ghiLoi('Đăng bài ' + b.kenh, '1. Chạy hỏng', e.message, 'Chưa', b.ma);
    }
  }
}
main().catch(async e => { await ghiLoi('Đăng bài', '1. Chạy hỏng', e.message); process.exit(1); });
