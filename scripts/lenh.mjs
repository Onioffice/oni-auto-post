// NHẬN VIỆC CHỊ GIAO – chạy mỗi giờ (7:00–22:00 giờ VN) trên GitHub Actions.
// Đọc việc "Chờ làm" ở Bảng điều khiển → soạn bài + hình theo đúng yêu cầu → kiểm lỗi → đưa vào Chờ duyệt.
import { homNay, layBai, layLenh, suaLenh, ghiLoi, ghiNhatKy } from './lib.mjs';
import { soanBai } from './soan.mjs';

// Ngày gần nhất (từ ngày mai) mà các kênh được chọn đều còn trống
function ngayTrong(cu, kenhs) {
  for (let i = 1; i <= 30; i++) {
    const d = homNay(i);
    if (!cu.some(x => x.at === d && kenhs.includes(x.kenh) && !['Hủy', 'Cần sửa'].includes(x.tt))) return d;
  }
  return homNay(1);
}

async function main() {
  const viec = (await layLenh()).filter(x => x.tt === 'Chờ làm');
  if (!viec.length) { console.log('Không có việc mới.'); return; }
  for (const v of viec.slice(0, 3)) {                        // mỗi lần tối đa 3 việc
    const cu = await layBai();
    const ngay = v.ngay && v.ngay >= homNay() ? v.ngay : ngayTrong(cu, v.kenh);
    await suaLenh(v.id, { tt: 'Đang làm', ngayDang: ngay, ketQua: 'Máy đang soạn…' });
    try {
      const r = await soanBai({ ngay, kenhs: v.kenh, yeuCau: v.noiDung, lenh: v.id });
      if (!r.ma.length) throw new Error('Không soạn ra được bài nào (xem Sổ lỗi)');
      const trung = v.kenh.filter(k => cu.some(x => x.at === ngay && x.kenh === k && !['Hủy', 'Cần sửa'].includes(x.tt)));
      const kq = r.ra.map(x => `${x.kenh}: ${x.tt === 'Chờ duyệt' ? 'chờ chị duyệt' : 'máy bắt lỗi, cần sửa'}`).join(' · ')
        + (trung.length ? ` · Lưu ý: ngày này ${trung.join(', ')} đã có bài khác, máy sẽ đăng bài chị giao trước.` : '');
      await suaLenh(v.id, { tt: 'Xong', maBai: r.ma, ketQua: kq });
      await ghiNhatKy('Việc chị giao', `${v.id}: ${kq}`);
    } catch (e) {
      await suaLenh(v.id, { tt: 'Lỗi', ketQua: e.message.slice(0, 300) });
      await ghiLoi('Việc chị giao ' + v.id, '1. Chạy hỏng', e.message, 'Chưa', v.id);
      await ghiNhatKy('Việc chị giao', `${v.id}: lỗi – ${e.message.slice(0, 200)}`);
    }
  }
}
main().catch(async e => { await ghiLoi('Nhận việc', '1. Chạy hỏng', e.message); process.exit(1); });
