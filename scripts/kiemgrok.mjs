// CÔNG NHÂN KIỂM BÀI GROK BOT – chạy mỗi giờ trong vòng lặp (chị chốt 09/11/2026).
// Lấy bài Grok Bot nộp qua cổng → gắn chữ ký → kiểm chữ → vẽ hình đúng khung Oni → kiểm hình (Haiku) → tải hình → "Chờ duyệt".
// `node scripts/kiemgrok.mjs --dem` chỉ đếm số bài đang chờ (không cần cài gói).
import { layHangGrok, xongGrok, ghiLoi, ghiNhatKy, opMK } from './lib.mjs';

const MOI_LAN = Number(process.env.GROK_MOI_LAN || 20);   // mỗi giờ kiểm tối đa 20 bài (giữ trong 30 phút chạy)

async function main() {
  if (process.argv.includes('--dem')) { console.log((await layHangGrok().catch(() => [])).length); return; }
  const hang = await layHangGrok();
  if (!hang.length) { console.log('Không có bài Grok Bot chờ kiểm.'); return; }
  const lam = hang.sort((a, b) => (a.ngay + a.gio).localeCompare(b.ngay + b.gio)).slice(0, MOI_LAN);   // giờ đăng sớm làm trước
  const { xuLyBai } = await import('./soan.mjs');
  const xong = [], ket = [];
  for (const g of lam) {
    const b = { kenh: g.kenh, tieude: g.tieude, nd: g.nd, tag: g.tag, coGia: false, hinh: g.hinh, hinhWeb: g.hinhWeb, anhTrongBai: g.anhTrongBai, anhThat: g.anhThat };
    try {
      const r = await xuLyBai({ kq: { bai: [b], nguon: g.nguon || [], chuDe: g.chuDe }, ngay: g.ngay, kenhs: [g.kenh], gio: g.gio, tuNgoai: 'Grok Bot' });
      ket.push(`${g.ngay.slice(8)}/${g.ngay.slice(5, 7)} ${g.gio} ${g.kenh}: ${r.ra[0]?.tt || 'không ra bài'}`);
    } catch (e) { await ghiLoi('Kiểm bài Grok ' + g.kenh, '1. Chạy hỏng', e.message, 'Chưa', g.ngay); ket.push(`${g.gio} ${g.kenh}: lỗi`); }
    xong.push(g.id);   // lỗi cũng bỏ khỏi hàng để không kẹt; giờ đó vòng lặp Claude sẽ viết bù
  }
  await xongGrok(xong);
  const kq = `Kiểm ${lam.length}/${hang.length} bài Grok Bot – ` + ket.join('; ');
  await ghiNhatKy('Kiểm bài Grok', kq); await opMK({ op: 'nhatKy', viec: 'Kiểm bài Grok Bot', ct: kq });
  console.log(kq);
}
main().catch(e => { console.error(e); process.exit(1); });
