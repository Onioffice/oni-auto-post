# oni-auto-post – Marketing tự động của Oni Office

Hệ thống chạy trên GitHub, **máy tính tắt vẫn chạy**. Mỗi ngày:

| Giờ (VN) | Việc | File |
|---|---|---|
| 7:45 | Tìm tin → Claude viết bài cho **ngày kia** → vẽ hình đúng khung Oni → kiểm lỗi (máy + Claude xem hình) → đưa vào trang duyệt | `scripts/soan.mjs` |
| 10:55 | Đăng các bài **hôm nay** đã "Đã duyệt" hoặc "Tự đăng" lên Facebook, Instagram, website | `scripts/dang.mjs` |

- Bài tin tức / kiến thức **không giá, không ưu đãi** → trạng thái **Tự đăng** (chị vẫn có thể bấm Hủy trên trang duyệt trước 10:55 ngày đăng).
- Bài **có giá / ưu đãi** → **Chờ duyệt**, chỉ đăng khi chị bấm **Duyệt**.
- Bài kiểm lỗi chưa đạt → **Cần sửa**, không bao giờ tự đăng.
- Kênh: Facebook + Instagram mỗi ngày, website thứ Ba và thứ Sáu. Threads, Zalo chưa có quyền đăng qua mã.

## Trang duyệt bài
Cloudflare Worker trong `worker/index.js` (kho bài lưu ở Cloudflare KV). Chị đăng nhập bằng mật khẩu riêng → 5 mục: Chờ duyệt · Lịch đăng · Đã đăng · Cần sửa / Hủy · Sổ lỗi.

## Mã bí mật (chị tự dán – không ai khác được thấy)
GitHub → kho **oni-auto-post** → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:

| Tên | Lấy ở đâu |
|---|---|
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys → Create Key |
| `ONI_API_URL` | Địa chỉ trang duyệt, ví dụ `https://oni-marketing.<tên>.workers.dev` |
| `ONI_API_KEY` | Chuỗi ngẫu nhiên dài – dán **giống hệt** vào Worker (biến `API_KEY`) |
| `WP_URL` | `https://onioffice.vn` |
| `WP_USERNAME` | Tên đăng nhập admin website |
| `WP_APP_PASSWORD` | WordPress → Người dùng → Hồ sơ → Mật khẩu ứng dụng → tạo mới tên "oni-auto-post" |
| `FB_PAGE_ACCESS_TOKEN` | Token dài hạn của Fanpage (quyền pages_manage_posts, instagram_content_publish) |
| `FB_PAGE_ID` | ID Fanpage Oni Office |
| `IG_USER_ID` | ID tài khoản Instagram doanh nghiệp @onioffice |

Biến (tab **Variables**): `BAT_TU_DONG` = `true` để bật lịch tự chạy. Khi chưa bật, chỉ chạy tay ở tab **Actions** (nút *Run workflow*; phần đăng mặc định là chạy thử, không đăng thật).

## Chạy thử vẽ hình trên máy
```
npm ci && npm run thu-hinh   # tạo out/thu_fb.png, out/thu_ig.png, out/thu_web.jpg
```

## Quy tắc nội dung
`prompts/quy-tac.md` – theo hồ sơ Marketing và danh sách kiểm lỗi chị đã chốt (07/11/2026). Không có mật khẩu hay mã bí mật nào trong mã nguồn.
