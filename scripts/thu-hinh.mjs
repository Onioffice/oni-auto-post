// Vẽ thử hình mẫu (không đăng gì) – chạy: npm run thu-hinh
import fs from 'node:fs';
import { khungFB, mauA, coLogo } from './khung.mjs';
fs.mkdirSync('out', { recursive: true });
const o = { pill: 'THỦ TỤC · DỜI TRỤ SỞ', eyebrow: 'Sắp dời trụ sở công ty?', t1: 'Hỏi Nhanh –', t2: 'Đáp Gọn', boxTop: '4 CÂU ONI THƯỜNG ĐƯỢC HỎI', boxTitle: 'Dời Trụ Sở Sang Địa Chỉ Mới',
  cards: [{ icon: 'doc', t: 'Giấy chứng nhận ĐKDN', s: 'Có, nộp hồ sơ thay đổi' }, { icon: 'shield', t: 'Con dấu', s: 'Thường không phải khắc lại' }, { icon: 'building', t: 'Địa chỉ mới', s: 'Hợp đồng thuê/mượn hợp lệ' }, { icon: 'check', t: 'Cập nhật sau đó', s: 'Hóa đơn, ngân hàng, chữ ký số' }],
  loc: 'Địa chỉ trụ sở tại CS1 Tân Định & CS2 Gò Vấp', cta: 'Inbox hoặc Zalo để Oni đồng hành thủ tục' };
fs.writeFileSync('out/thu_fb.png', await khungFB({ ...o, theme: 'navy' }));
fs.writeFileSync('out/thu_ig.png', await khungFB({ ...o, theme: 'kem' }));
fs.writeFileSync('out/thu_web.jpg', await mauA({ tag: 'THỦ TỤC · TP.HCM', lines: ['Dời trụ sở công ty', 'cần chuẩn bị gì', '4 bước gọn'], sub: ['Hồ sơ, con dấu, hóa đơn', 'Oni đồng hành tại 2 cơ sở'] }, null));
console.log('Xong. Logo:', coLogo() ? 'có' : 'KHÔNG tải được (máy này chặn onioffice.vn)');
