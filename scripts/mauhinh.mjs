// Vẽ 4 hình mẫu (Facebook, Instagram, Website, LinkedIn) bằng đúng khung máy dùng – để chị xem trước khi bật lại máy.
import fs from 'node:fs';
import { khungFB, mauA, khungLI } from './khung.mjs';
const lay = async u => Buffer.from(await (await fetch(u)).arrayBuffer());
const P = 'https://onioffice.vn/wp-content/uploads/2026/10/';
const f = 'demo/mau/'; fs.mkdirSync(f, { recursive: true });
fs.writeFileSync(f + 'mau-facebook.png', await khungFB({ theme: 'navy', pill: 'ĐỊA CHỈ TRỤ SỞ', eyebrow: 'Mở công ty ở Gò Vấp?', t1: 'ĐỊA CHỈ TRỤ SỞ', t2: 'ĐÚNG QUY ĐỊNH', boxTop: 'HỒ SƠ ĐĂNG KÝ', boxTitle: 'Chuẩn bị gì trước khi nộp',
  cards: [{ icon: 'doc', t: 'Hợp đồng thuê', s: 'Ký với Oni, đủ thông tin' }, { icon: 'building', t: 'Địa chỉ rõ ràng', s: 'Số nhà, đường, phường' }, { icon: 'key', t: 'Biển tên công ty', s: 'Gắn tại cơ sở Oni' }, { icon: 'check', t: 'Nhận thư hộ', s: 'Báo ngay khi có thư' }] }));
fs.writeFileSync(f + 'mau-instagram.png', await khungFB({ theme: 'kem', pill: 'PHÒNG HỌP · TÂN ĐỊNH', eyebrow: 'Cần chỗ gặp đối tác?', t1: 'PHÒNG HỌP', t2: 'THEO GIỜ', boxTop: 'CS1 TÂN ĐỊNH', boxTitle: 'Đặt trước, đến là họp',
  cards: [{ icon: 'people', t: '6–10 khách', s: 'Bàn họp rộng, ghế êm' }, { icon: 'chart', t: 'Màn hình lớn', s: 'Trình chiếu dễ dàng' }, { icon: 'clock', t: 'Thuê theo giờ', s: 'Linh hoạt theo lịch' }, { icon: 'check', t: 'Lễ tân đón khách', s: 'Chuyên nghiệp từ cửa' }] }));
fs.writeFileSync(f + 'mau-website.jpg', await mauA({ tag: 'Văn phòng riêng · Gò Vấp', lines: ['Thuê văn phòng', 'Gò Vấp: 7 câu', 'nên hỏi trước'], sub: ['Kinh nghiệm từ khách thuê tại Oni', 'CS2 – KDC CityLand Park Hills'] }, await lay(P + 'oni-td-hop-a-ngang.webp')));
fs.writeFileSync(f + 'mau-linkedin.png', await khungLI({ tag: 'How we work', t1: 'Your first office', t2: 'in Ho Chi Minh City', sub: 'Trụ sở đầu tiên cho nhà đầu tư mới – rõ ràng ngay từ hồ sơ' }, await lay(P + 'oni-td-letan-a.webp')));
console.log('Đã vẽ 4 hình mẫu');
