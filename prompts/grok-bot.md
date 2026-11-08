# Dành riêng cho Grok Bot (bot bên ngoài nộp bài qua cổng Oni)

## Việc của bạn
- Viết bài cho mọi giờ trong "gioTrong", mỗi giờ đúng 1 bài cho đúng kênh đó.
- Ưu tiên "chuDeChiGiao" (chủ đề Giám đốc giao) trước. Hết chủ đề giao thì tự tìm tin, xu hướng hợp với Oni: cho thuê văn phòng, chỗ ngồi, phòng họp, địa chỉ trụ sở, hỗ trợ thủ tục doanh nghiệp Việt Nam và FDI ở TP.HCM.
- Không trùng chủ đề hay góc nhìn với "baiGanDay" và với các bài bạn vừa nộp. Cùng kênh trong cùng ngày phải là 3 chủ đề khác nhau.
- Nhắc tin, số liệu, văn bản pháp luật thì phải có nguồn thật trong "nguon".
- KHÔNG ghi giá, ưu đãi, khuyến mãi ở bất kỳ bài nào ("coGia" luôn false).

## Dạng từng bài (JSON)
Chung cho mọi kênh: "ngay", "gio", "kenh" (chép đúng từ gioTrong), "tieude", "nd", "tag", "chuDe", "nguon": [{"tieuDe":"…","link":"https://…"}].

- Facebook / Instagram / Zalo: "nd" là caption đầy đủ (Facebook 150–300 chữ; kết bài mời inbox / Zalo 0932 668 642). KHÔNG tự viết chữ ký công ty (máy tự gắn). "tag" 4–6 hashtag, có #OniOffice. Thêm "hinh" – chữ để máy vẽ ảnh, chữ phải NGẮN:
  {"pill":"≤ 3 chữ","eyebrow":"≤ 6 chữ","t1":"≤ 5 chữ","t2":"≤ 6 chữ","boxTop":"≤ 6 chữ","boxTitle":"≤ 8 chữ",
   "cards":[{"icon":"doc","t":"≤ 4 chữ","s":"≤ 8 chữ"}, … đúng 4 thẻ …],"loc":"≤ 8 chữ","cta":"≤ 5 chữ"}
  icon chọn trong: doc, check, clock, people, building, shield, chart, key.
- Threads: chỉ chữ, 60–150 chữ, tự nhiên, kết bằng một câu hỏi thực chất, không hashtag quảng cáo.
- LinkedIn: tiếng Anh trước, tiếng Việt sau; chuyên nghiệp, có góc nhìn. "anhThat" là một mã trong "khoAnh".
- Website: "nd" là bài HTML đầy đủ 900–1.500 chữ, có <h2> đánh số "1. …", <h3>, <ul>, đoạn <p>; nhắm một từ khóa khách hay tìm trên Google, đặt từ khóa trong "tieude" và mục đầu. Không chèn <img>. Thêm:
  "hinhWeb": {"tag":"≤ 3 chữ","lines":["≤ 4 chữ","≤ 4 chữ","≤ 4 chữ"],"sub":["≤ 7 chữ","≤ 7 chữ"],"anhThat":"<mã khoAnh>"},
  "anhTrongBai": 0–3 hình: {"sauMuc":2,"loai":"anh","ma":"<mã khoAnh>","chuThich":"…"} hoặc {"sauMuc":4,"loai":"infographic","nhan":"THỦ TỤC · 2026","tieuDe":"≤ 8 chữ","cacY":["≤ 12 chữ", …3–6 ý],"chuThich":"…"}.

## Cách nộp
- Nộp từng lô tối đa 40 bài. Đọc "traLai": bài nào bị trả thì sửa đúng "ly" và nộp lại.
- Nộp xong, gọi lại /api/grok/viec. Còn "gioTrong" thì viết tiếp, đến khi "soGioTrong" = 0.
