// NHẬN VIỆC CHỊ GIAO – chạy mỗi giờ (7:00–22:00 giờ VN) trên GitHub Actions.
// Việc chị giao nằm ngay trong trang Marketing (Bảng việc → "🤖 Giao việc cho AI Marketing").
// Máy nhận việc "Chờ AI" → soạn bài + hình theo đúng yêu cầu → kiểm lỗi → bài vào "Chờ duyệt" trong app.
import { homNay, layMK, opMK, ghiLoi, ghiNhatKy, layCaiDat } from './lib.mjs';
import { soanBai, KENH_DANG_LAM } from './soan.mjs';

const ngayTrong = (cu, kenhs) => {               // ngày gần nhất (từ mai) các kênh được chọn còn trống
  for (let i = 1; i <= 30; i++) { const d = homNay(i); if (!cu.some(x => x.at === d && kenhs.includes(x.kenh) && !['Hủy', 'Cần sửa'].includes(x.tt))) return d; }
  return homNay(1);
};

async function main() {
  if ((await layCaiDat()).nhan === false) { console.log('Chị đang tắt máy "Nhận việc chị giao".'); return; }
  const M = await layMK();
  const viec = ((M.ai || {}).lenh || []).filter(l => l.tt === 'Chờ AI').reverse();   // việc cũ trước
  if (!viec.length) { console.log('Không có việc mới.'); return; }
  await opMK({ op: 'batDau' });
  for (const l of viec.slice(0, 3)) {                                   // mỗi lần tối đa 3 việc
    const muon = !l.kenh || /mọi kênh/i.test(l.kenh) ? KENH_DANG_LAM : [l.kenh];
    const kenhs = muon.filter(k => KENH_DANG_LAM.includes(k));
    if (!kenhs.length) { await opMK({ op: 'xongViec', id: l.id, kq: `Kênh ${l.kenh} máy chưa tự làm được (hiện làm Facebook, Website). Em làm tay giúp chị.` }); continue; }
    await opMK({ op: 'nhanViec', id: l.id });
    try {
      const cu = ((await layMK()).posts || []);
      const ngay = /^\d{4}-\d{2}-\d{2}$/.test(l.han || '') && l.han >= homNay() ? l.han : ngayTrong(cu, kenhs);
      const r = await soanBai({ ngay, kenhs, yeuCau: l.nd, lenh: l.id });
      if (!r.ma.length) throw new Error('Không soạn ra được bài nào (xem Sổ lỗi)');
      const kq = `Đã soạn ${r.ma.join(', ')} cho ngày ${ngay.split('-').reverse().join('/')}: ` + r.ra.map(x => `${x.kenh} ${x.tt === 'Chờ duyệt' ? 'chờ chị duyệt' : 'máy bắt lỗi, cần sửa'}`).join(' · ');
      await opMK({ op: 'xongViec', id: l.id, kq });
      await ghiNhatKy('Việc chị giao', kq);
    } catch (e) {
      await opMK({ op: 'xongViec', id: l.id, loi: true, kq: 'Lỗi, máy sẽ thử lại lần sau: ' + e.message.slice(0, 200) });
      await ghiLoi('Việc chị giao ' + l.id, '1. Chạy hỏng', e.message, 'Chưa', l.id);
    }
  }
}
main().catch(async e => { await ghiLoi('Nhận việc', '1. Chạy hỏng', e.message); process.exit(1); });
