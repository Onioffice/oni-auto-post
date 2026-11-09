// Khung hình Oni Office – bản chạy trên máy chủ (GitHub Actions), chép theo đúng mẫu chị đã duyệt
// (tài liệu Project "claude/ai-marketing-khung-hinh.md", bản sửa logo 07/11/2026).
import { createCanvas, GlobalFonts, loadImage } from '@napi-rs/canvas';
import fs from 'node:fs';
import path from 'node:path';

const FONT_DIR = path.resolve('fonts');
const FONTS = ['Regular', 'Medium', 'SemiBold', 'Bold', 'ExtraBold', 'MediumItalic'];
const LOGO_URL = 'https://onioffice.vn/wp-content/uploads/2026/01/LogoOnihub.png';
let sanSang = false, logoImg = null;

export async function chuanBi() {
  if (sanSang) return;
  fs.mkdirSync(FONT_DIR, { recursive: true });
  for (const w of FONTS) {
    const f = path.join(FONT_DIR, `BeVietnamPro-${w}.ttf`);
    if (!fs.existsSync(f)) {
      const r = await fetch(`https://raw.githubusercontent.com/google/fonts/main/ofl/bevietnampro/BeVietnamPro-${w}.ttf`);
      if (!r.ok) throw new Error('Không tải được font ' + w);
      fs.writeFileSync(f, Buffer.from(await r.arrayBuffer()));
    }
    GlobalFonts.registerFromPath(f, 'Be Vietnam Pro');
  }
  try {
    const r = await fetch(LOGO_URL);
    if (r.ok) logoImg = await loadImage(Buffer.from(await r.arrayBuffer()));
  } catch (e) { logoImg = null; }
  sanSang = true;
}
export const coLogo = () => !!logoImg;

const rrect = (x, X, Y, w, h, r) => { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); };

// Facebook (theme 'navy') / Instagram, Zalo (theme 'kem') – 1080x1350
export async function khungFB(o) {
  await chuanBi();
  const kem = o.theme === 'kem';
  const W = 1080, H = 1350, c = createCanvas(W, H), x = c.getContext('2d');
  const F = (w, s) => `${w} ${s}px "Be Vietnam Pro"`;
  const GOLD = 'rgb(217,178,106)', GOLD_T = kem ? 'rgb(150,112,52)' : 'rgb(226,196,128)', GOLD_L = kem ? 'rgb(137,100,65)' : 'rgb(236,214,160)';
  const TXT = kem ? 'rgb(24,32,58)' : '#FFFFFF', INK = 'rgb(24,32,58)', GREY = 'rgb(92,98,112)', BEIGE = 'rgb(244,233,214)', BROWN = 'rgb(154,120,72)';
  const rr = (...a) => rrect(x, ...a);
  const g = x.createLinearGradient(0, 0, 0, H);
  if (kem) { g.addColorStop(0, '#FBF6EC'); g.addColorStop(1, '#F1E6D2'); } else { g.addColorStop(0, 'rgb(20,38,78)'); g.addColorStop(1, 'rgb(9,20,44)'); }
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  const gl = x.createRadialGradient(920, 130, 20, 920, 130, 520); gl.addColorStop(0, kem ? 'rgba(233,184,58,0.18)' : 'rgba(90,120,190,0.30)'); gl.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gl; x.fillRect(0, 0, W, H);
  x.fillStyle = kem ? 'rgba(137,100,65,0.25)' : 'rgba(200,210,235,0.27)';
  for (let gy = 70; gy < 200; gy += 22) for (let gx = 860; gx < 1060; gx += 22) { x.beginPath(); x.arc(gx, gy, 2, 0, 7); x.fill(); }
  const L = 54;
  // logo: vùng biểu tượng tòa nhà đã đo trên file 426x150: (10,8,109x132) – đủ 4 khối
  let lx = L;
  if (logoImg) { const k = logoImg.width / 426, sw = 109 * k, sh = 132 * k, lh = 66, lw = sw * lh / sh; x.drawImage(logoImg, 10 * k, 8 * k, sw, sh, L, 56, lw, lh); lx = L + lw + 14; }
  x.textBaseline = 'top'; x.font = F(700, 36); x.fillStyle = GOLD_T; x.fillText('ONI OFFICE', lx, 74);
  x.font = F(600, 21); const pw = x.measureText(o.pill).width + 44;
  rr(W - L - pw, 76, pw, 44, 22); x.fillStyle = kem ? '#FFFFFF' : 'rgb(12,24,52)'; x.fill(); x.strokeStyle = GOLD; x.lineWidth = 2; x.stroke();
  x.fillStyle = GOLD_L; x.fillText(o.pill, W - L - pw + 22, 86);
  x.font = 'italic ' + F(500, 31); x.fillStyle = GOLD_T; x.fillText(o.eyebrow || '', L, 206);
  let ts = 72; x.font = F(800, ts); while (Math.max(x.measureText(o.t1).width, x.measureText(o.t2).width) > W - 2 * L && ts > 50) { ts -= 2; x.font = F(800, ts); }
  x.fillStyle = TXT; x.fillText(o.t1, L, 266); x.fillStyle = kem ? 'rgb(137,100,65)' : GOLD; x.fillText(o.t2, L, 266 + Math.round(ts * 1.42));   // giãn dòng 1,42: dấu chữ in hoa (Ể, Ọ…) không sát dòng trên – chị bắt lỗi 09/11
  const by = 475; rr(L, by, W - 2 * L, 150, 22); x.fillStyle = kem ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.055)'; x.fill(); x.strokeStyle = GOLD; x.lineWidth = 2; x.stroke();
  x.textAlign = 'center'; x.font = F(600, 23); x.letterSpacing = '2px'; x.fillStyle = GOLD_T; x.fillText(o.boxTop, W / 2, by + 26); x.letterSpacing = '0px';
  let bs = 48; x.font = F(800, bs); while (x.measureText(o.boxTitle).width > W - 2 * L - 40 && bs > 34) { bs -= 2; x.font = F(800, bs); } x.fillStyle = TXT; x.fillText(o.boxTitle, W / 2, by + 66 + (48 - bs) / 2); x.textAlign = 'left';
  const ic = {
    building: (cx, cy) => { x.strokeStyle = BROWN; x.lineWidth = 3; x.strokeRect(cx - 14, cy - 16, 28, 33); x.fillStyle = BROWN; for (const ox of [-7, 3]) for (const oy of [-9, -1, 7]) x.fillRect(cx + ox, cy + oy, 4, 4); },
    doc: (cx, cy) => { x.strokeStyle = BROWN; x.lineWidth = 3; rr(cx - 13, cy - 17, 26, 34, 4); x.stroke(); for (const oy of [-7, 0, 7]) { x.beginPath(); x.moveTo(cx - 7, cy + oy); x.lineTo(cx + 7, cy + oy); x.stroke(); } },
    chart: (cx, cy) => { x.fillStyle = BROWN; [10, 18, 26].forEach((h, i) => x.fillRect(cx - 15 + i * 11, cy + 15 - h, 7, h)); x.strokeStyle = BROWN; x.lineWidth = 3; x.beginPath(); x.moveTo(cx - 16, cy - 6); x.lineTo(cx - 2, cy - 16); x.lineTo(cx + 6, cy - 10); x.lineTo(cx + 16, cy - 20); x.stroke(); },
    shield: (cx, cy) => { x.strokeStyle = BROWN; x.lineWidth = 3; x.beginPath(); [[0, -18], [15, -11], [13, 6], [0, 18], [-13, 6], [-15, -11]].forEach(([a, b], i) => i ? x.lineTo(cx + a, cy + b) : x.moveTo(cx + a, cy + b)); x.closePath(); x.stroke(); x.beginPath(); x.moveTo(cx - 7, cy); x.lineTo(cx - 2, cy + 6); x.lineTo(cx + 8, cy - 6); x.stroke(); },
    people: (cx, cy) => { x.strokeStyle = BROWN; x.lineWidth = 3; x.beginPath(); x.arc(cx - 6, cy - 8, 6, 0, 7); x.stroke(); x.beginPath(); x.arc(cx + 9, cy - 6, 5, 0, 7); x.stroke(); x.beginPath(); x.arc(cx - 6, cy + 16, 12, Math.PI, 0); x.stroke(); x.beginPath(); x.arc(cx + 10, cy + 14, 9, Math.PI, 0); x.stroke(); },
    key: (cx, cy) => { x.strokeStyle = BROWN; x.lineWidth = 3; x.beginPath(); x.arc(cx - 8, cy, 8, 0, 7); x.stroke(); x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + 17, cy); x.moveTo(cx + 11, cy); x.lineTo(cx + 11, cy + 7); x.moveTo(cx + 16, cy); x.lineTo(cx + 16, cy + 6); x.stroke(); },
    clock: (cx, cy) => { x.strokeStyle = BROWN; x.lineWidth = 3; x.beginPath(); x.arc(cx, cy, 16, 0, 7); x.stroke(); x.beginPath(); x.moveTo(cx, cy - 9); x.lineTo(cx, cy); x.lineTo(cx + 8, cy + 5); x.stroke(); },
    check: (cx, cy) => { x.strokeStyle = BROWN; x.lineWidth = 3; rr(cx - 15, cy - 15, 30, 30, 6); x.stroke(); x.beginPath(); x.moveTo(cx - 8, cy); x.lineTo(cx - 2, cy + 7); x.lineTo(cx + 9, cy - 7); x.stroke(); }
  };
  const gap = 22, cw = (W - 2 * L - gap) / 2, ch = 186, cy0 = 640;
  o.cards.slice(0, 4).forEach((k, i) => {
    const X = L + (i % 2) * (cw + gap), Y = cy0 + Math.floor(i / 2) * (ch + gap);
    x.save(); x.shadowColor = 'rgba(0,0,0,0.30)'; x.shadowBlur = 18; x.shadowOffsetY = 8; rr(X, Y, cw, ch, 20); x.fillStyle = '#FFFFFF'; x.fill(); x.restore();
    if (kem) { rr(X, Y, cw, ch, 20); x.strokeStyle = 'rgba(137,100,65,0.25)'; x.lineWidth = 1.5; x.stroke(); }
    const cx = X + 66, cy = Y + 62; x.fillStyle = BEIGE; x.beginPath(); x.arc(cx, cy, 36, 0, 7); x.fill(); (ic[k.icon] || ic.check)(cx, cy);
    let s1 = 31; x.font = F(700, s1); while (x.measureText(k.t).width > cw - 50 && s1 > 24) { s1--; x.font = F(700, s1); } x.fillStyle = INK; x.fillText(k.t, X + 30, Y + 106);
    let s2 = 22; x.font = F(400, s2); while (x.measureText(k.s).width > cw - 50 && s2 > 17) { s2--; x.font = F(400, s2); } x.fillStyle = GREY; x.fillText(k.s, X + 30, Y + 146);
  });
  const ly = cy0 + 2 * ch + gap + 26;
  x.strokeStyle = GOLD; x.lineWidth = 3; x.beginPath(); x.arc(L + 14, ly + 14, 12, 0, 7); x.stroke(); x.fillStyle = GOLD; x.beginPath(); x.arc(L + 14, ly + 14, 4, 0, 7); x.fill();
  x.font = F(600, 26); x.fillStyle = TXT; x.fillText(o.loc || 'Văn phòng chia sẻ · phòng riêng · phòng họp tại 2 cơ sở', L + 40, ly - 2);
  x.textAlign = 'center'; x.font = F(700, 33); x.fillStyle = GOLD_L; x.fillText(o.cta || 'Liên hệ để được hỗ trợ & nhận báo giá', W / 2, ly + 50); x.textAlign = 'left';
  const fy0 = 1200, fy1 = 1300; rr(L - 8, fy0, W - 2 * L + 16, 100, 26); x.fillStyle = kem ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.047)'; x.fill(); x.strokeStyle = 'rgba(217,178,106,0.7)'; x.lineWidth = 2; x.stroke();
  const cols = [['phone', '0932 668 642', 'Hotline'], ['globe', 'www.onioffice.vn', 'Website'], ['mail', 'sales@onioffice.vn', 'Email']], colw = (W - 2 * L + 16) / 3;
  cols.forEach(([gph, v, lab], i) => {
    const X = L - 8 + i * colw, cx = X + 42, cy = (fy0 + fy1) / 2;
    x.fillStyle = GOLD; x.beginPath(); x.arc(cx, cy, 28, 0, 7); x.fill(); x.strokeStyle = INK; x.fillStyle = INK; x.lineWidth = 3;
    if (gph === 'globe') { x.beginPath(); x.arc(cx, cy, 14, 0, 7); x.stroke(); x.lineWidth = 2; x.beginPath(); x.ellipse(cx, cy, 6, 14, 0, 0, 7); x.stroke(); x.beginPath(); x.moveTo(cx - 14, cy); x.lineTo(cx + 14, cy); x.stroke(); }
    else if (gph === 'mail') { rr(cx - 14, cy - 10, 28, 20, 3); x.stroke(); x.beginPath(); x.moveTo(cx - 13, cy - 8); x.lineTo(cx, cy + 2); x.lineTo(cx + 13, cy - 8); x.stroke(); }
    else { rr(cx - 9, cy - 15, 18, 30, 4); x.stroke(); x.beginPath(); x.arc(cx, cy + 9, 1.8, 0, 7); x.fill(); }
    x.font = F(700, i ? 22 : 25); x.fillStyle = TXT; x.fillText(v, X + 80, cy - 27);
    x.font = F(400, 19); x.fillStyle = kem ? GREY : 'rgb(200,207,223)'; x.fillText(lab, X + 80, cy + 5);
    if (i) { x.strokeStyle = 'rgba(217,178,106,0.47)'; x.lineWidth = 2; x.beginPath(); x.moveTo(X + 4, fy0 + 24); x.lineTo(X + 4, fy1 - 24); x.stroke(); }
  });
  return c.toBuffer('image/png');
}

// Mẫu A – ảnh đại diện bài website 2400x1256 (photo = Buffer ảnh thật của Oni)
export async function mauA(o, photoBuf) {
  await chuanBi();
  const S = 2, W = 1200, H = 628, c = createCanvas(W * S, H * S), x = c.getContext('2d'); x.scale(S, S);
  const F = (w, s) => `${w} ${s}px "Be Vietnam Pro"`, GOLD = '#C5A86D', rr = (...a) => rrect(x, ...a);
  x.fillStyle = '#14203C'; x.fillRect(0, 0, W, H);
  const rg = x.createRadialGradient(600, 560, 40, 600, 560, 520); rg.addColorStop(0, 'rgba(40,58,70,0.55)'); rg.addColorStop(1, 'rgba(20,32,60,0)'); x.fillStyle = rg; x.fillRect(0, 0, W, H);
  x.strokeStyle = 'rgba(255,255,255,0.035)'; x.lineWidth = 1;
  for (let i = 0; i <= W; i += 40) { x.beginPath(); x.moveTo(i + .5, 0); x.lineTo(i + .5, H); x.stroke(); }
  for (let j = 0; j <= H; j += 40) { x.beginPath(); x.moveTo(0, j + .5); x.lineTo(W, j + .5); x.stroke(); }
  const L = 72;
  x.font = F(700, 16); x.letterSpacing = '2.5px'; const tag = o.tag.toUpperCase(), tw = x.measureText(tag).width + 30;
  rr(L, 52, tw, 37, 4); x.strokeStyle = '#BCA885'; x.lineWidth = 1.6; x.stroke();
  x.fillStyle = GOLD; x.textBaseline = 'middle'; x.fillText(tag, L + 15, 71); x.letterSpacing = '0px';
  const lines = o.lines.map(s => s.toUpperCase()); let size = 48; x.font = F(800, size);
  while (lines.some(s => x.measureText(s).width > 560) && size > 34) { size -= 2; x.font = F(800, size); }
  const lh = Math.round(size * 1.55); let y = 146;   // 09/11: tăng từ 1,4 → 1,55 vì chị thấy dấu chữ in hoa sát dòng trên   // giãn dòng đủ cho dấu tiếng Việt chữ in hoa (Ể, Ầ, Ế…)
  lines.forEach((s, i) => { x.fillStyle = i === lines.length - 1 ? GOLD : '#FFFFFF'; x.fillText(s, L, y); y += lh; });
  y += 10; x.font = F(500, 22); x.fillStyle = '#FFFFFF'; (o.sub || []).forEach(s => { x.fillText(s, L, y); y += 33; });
  const PX = 742, PY = 64, PW = 400, PH = 400;
  rr(PX + 15, PY + 15, PW, PH, 14); x.fillStyle = '#C5AD72'; x.fill();
  if (photoBuf) {
    const img = await loadImage(photoBuf);
    x.save(); rr(PX, PY, PW, PH, 14); x.clip(); const sc = Math.max(PW / img.width, PH / img.height), iw = img.width * sc, ih = img.height * sc;
    x.drawImage(img, PX + (PW - iw) / 2, PY + (PH - ih) / 2, iw, ih); x.restore();
  }
  rr(PX, PY, PW, PH, 14); x.strokeStyle = '#C5AD72'; x.lineWidth = 2; x.stroke();
  x.strokeStyle = '#555955'; x.lineWidth = 1; x.beginPath(); x.moveTo(L, 526.5); x.lineTo(W - L, 526.5); x.stroke();
  x.textBaseline = 'alphabetic'; x.font = F(800, 22); x.letterSpacing = '5px'; x.fillStyle = GOLD; x.fillText('ONI OFFICE', L, 565);
  x.letterSpacing = '0px'; x.font = F(400, 16); x.fillStyle = 'rgba(255,255,255,0.78)'; x.fillText('Văn phòng chia sẻ • Văn phòng riêng • Phòng họp', L, 590);
  x.textAlign = 'right'; x.font = F(700, 20); x.fillStyle = GOLD; const num = '0932 668 642'; x.fillText(num, W - L, 560);
  const nw = x.measureText(num).width; x.font = F(500, 20); x.fillStyle = '#FFFFFF'; x.fillText('Hotline/Zalo ', W - L - nw, 560);
  x.font = F(500, 18); x.fillStyle = '#FFFFFF'; x.fillText('www.onioffice.vn · sales@onioffice.vn', W - L, 589); x.textAlign = 'left';
  return c.toBuffer('image/jpeg', 90);
}

// Hình minh họa trong thân bài website (infographic theo nội dung mục): khung ngang 1200×675 (xuất 2400×1350),
// cùng nhận diện mẫu A: nền navy lưới mờ, nhãn viền vàng, tiêu đề trắng + vàng, các ý đánh số trong thẻ trắng.
export async function infoWeb(o) {
  await chuanBi();
  const S = 2, W = 1200, H = 675, c = createCanvas(W * S, H * S), x = c.getContext('2d'); x.scale(S, S);
  const F = (w, s) => `${w} ${s}px "Be Vietnam Pro"`, GOLD = '#C5A86D', rr = (...a) => rrect(x, ...a);
  x.fillStyle = '#14203C'; x.fillRect(0, 0, W, H);
  x.strokeStyle = 'rgba(255,255,255,0.035)'; x.lineWidth = 1;
  for (let i = 0; i <= W; i += 40) { x.beginPath(); x.moveTo(i + .5, 0); x.lineTo(i + .5, H); x.stroke(); }
  for (let j = 0; j <= H; j += 40) { x.beginPath(); x.moveTo(0, j + .5); x.lineTo(W, j + .5); x.stroke(); }
  const L = 64; x.textBaseline = 'middle';
  if (o.nhan) { x.font = F(700, 15); x.letterSpacing = '2.5px'; const tag = String(o.nhan).toUpperCase(), tw = x.measureText(tag).width + 28;
    rr(L, 40, tw, 34, 4); x.strokeStyle = '#BCA885'; x.lineWidth = 1.5; x.stroke(); x.fillStyle = GOLD; x.fillText(tag, L + 14, 57); x.letterSpacing = '0px'; }
  // tiêu đề 1–2 dòng, chữ cuối vàng
  let size = 38; x.font = F(800, size); const td = String(o.tieuDe || '').toUpperCase();
  const tach = (s, max) => { const w = s.split(/\s+/), out = []; let l = ''; for (const t of w) { const n = l ? l + ' ' + t : t; if (x.measureText(n).width > max && l) { out.push(l); l = t; } else l = n; } if (l) out.push(l); return out; };
  let dong = tach(td, W - 2 * L); while (dong.length > 2 && size > 28) { size -= 2; x.font = F(800, size); dong = tach(td, W - 2 * L); }
  let y = 116; dong.slice(0, 2).forEach((s, i, a) => { x.fillStyle = i === a.length - 1 ? GOLD : '#FFFFFF'; x.fillText(s, L, y); y += Math.round(size * 1.32); });
  // các ý: 2 cột
  const top = Math.max(y + 14, 200), items = (o.cacY || []).slice(0, 6), cot = items.length > 3 ? 2 : 1;
  const gap = 20, cw = (W - 2 * L - gap * (cot - 1)) / cot, hang = Math.ceil(items.length / cot), vung = H - 100 - top, ch = Math.min(128, (vung - gap * (hang - 1)) / hang);
  const Y = top + Math.max(0, (vung - (ch * hang + gap * (hang - 1))) / 2);   // canh giữa khối ý trong vùng trống
  items.forEach((it, i) => {
    const cX = L + (i % cot) * (cw + gap), cY = Y + Math.floor(i / cot) * (ch + gap);
    rr(cX, cY, cw, ch, 12); x.fillStyle = '#FFFFFF'; x.fill();
    x.beginPath(); x.arc(cX + 36, cY + ch / 2, 20, 0, Math.PI * 2); x.fillStyle = GOLD; x.fill();
    x.font = F(800, 20); x.fillStyle = '#14203C'; x.textAlign = 'center'; x.fillText(String(i + 1), cX + 36, cY + ch / 2 + 1); x.textAlign = 'left';
    let fs = 22; x.font = F(600, fs); let ln = tach(String(it), cw - 90);
    while (ln.length > 2 && fs > 15) { fs -= 1; x.font = F(600, fs); ln = tach(String(it), cw - 90); }
    const lh = Math.round(fs * 1.35), y0 = cY + ch / 2 - (Math.min(ln.length, 3) - 1) * lh / 2;
    x.fillStyle = '#1E2A44'; ln.slice(0, 3).forEach((s, k) => x.fillText(s, cX + 70, y0 + k * lh));
  });
  // chân ảnh
  x.strokeStyle = '#555955'; x.lineWidth = 1; x.beginPath(); x.moveTo(L, H - 70.5); x.lineTo(W - L, H - 70.5); x.stroke();
  x.textBaseline = 'alphabetic'; x.font = F(800, 20); x.letterSpacing = '5px'; x.fillStyle = GOLD; x.fillText('ONI OFFICE', L, H - 34); x.letterSpacing = '0px';
  x.textAlign = 'right'; x.font = F(700, 18); x.fillStyle = GOLD; const num = '0932 668 642'; x.fillText(num, W - L, H - 34);
  const nw = x.measureText(num).width; x.font = F(500, 18); x.fillStyle = '#FFFFFF'; x.fillText('Hotline/Zalo ', W - L - nw, H - 34); x.textAlign = 'left';
  return c.toBuffer('image/jpeg', 90);
}


// Khung LinkedIn – dựng lại 09/11/2026 THEO ĐÚNG CÁC BÀI CHỊ ĐÃ ĐĂNG trên LinkedIn (Yoki Nguyễn):
// 1080×1350 (4:5) · nền = chính ảnh thật làm mờ + phủ nâu ấm · ảnh thật sắc nét ở trên · thẻ nâu bo góc ở dưới:
// logo + ONI OFFICE nhỏ, gạch vàng, dòng nhỏ in hoa (eyebrow), tiêu đề tiếng Anh trắng + dòng 2 vàng, gạch, dòng phụ tiếng Việt nghiêng,
// chân "TÂN ĐỊNH · GÒ VẤP · onioffice.vn".  o = { tag, t1, t2, sub }
export async function khungLI(o, photoBuf) {
  await chuanBi();
  const W = 1080, H = 1350, c = createCanvas(W, H), x = c.getContext('2d'), rr = (...a) => rrect(x, ...a);
  const F = (w, s, it) => `${it ? 'italic ' : ''}${w} ${s}px "Be Vietnam Pro"`;
  const KEM = '#F3E9DA', VANG = '#F0C66E';
  const img = photoBuf ? await loadImage(photoBuf) : null;
  // nền: ảnh mờ (thu nhỏ rồi phóng to) + phủ nâu ấm
  x.fillStyle = '#8C6A48'; x.fillRect(0, 0, W, H);
  if (img) { const sc = Math.max(W / img.width, H / img.height) * 1.12, iw = img.width * sc, ih = img.height * sc;
    x.save(); x.filter = 'blur(38px)'; x.drawImage(img, (W - iw) / 2, (H - ih) / 2, iw, ih); x.restore(); }
  x.fillStyle = 'rgba(150,112,74,0.55)'; x.fillRect(0, 0, W, H);
  x.strokeStyle = 'rgba(255,240,220,0.22)'; x.lineWidth = 2; x.strokeRect(26, 26, W - 52, H - 52);
  // ảnh thật sắc nét
  let s = 50; x.font = F(800, s); while (Math.max(x.measureText(o.t1 || '').width, x.measureText(o.t2 || '').width) > W - 156 - 90 && s > 34) { s -= 2; x.font = F(800, s); }
  const CHc = Math.round(345 + 2.85 * s - (o.tag ? 0 : 36) - (o.sub ? 0 : 38)), PH = 620, PW = W - 156, PX = 78, PY = Math.round((H - (PH + 30 + CHc)) / 2);
  x.save(); x.shadowColor = 'rgba(40,25,10,0.35)'; x.shadowBlur = 30; x.shadowOffsetY = 10; rr(PX, PY, PW, PH, 8); x.fillStyle = '#ddd'; x.fill(); x.restore();
  if (img) { x.save(); rr(PX, PY, PW, PH, 8); x.clip(); const sc = Math.max(PW / img.width, PH / img.height), iw = img.width * sc, ih = img.height * sc; x.drawImage(img, PX + (PW - iw) / 2, PY + (PH - ih) / 2, iw, ih); x.restore(); }
  // thẻ nâu
  const CX = PX, CY = PY + PH + 30, CW = PW, CH = CHc;
  x.save(); x.shadowColor = 'rgba(40,25,10,0.35)'; x.shadowBlur = 30; x.shadowOffsetY = 10; rr(CX, CY, CW, CH, 18); x.fillStyle = 'rgba(118,88,58,0.94)'; x.fill(); x.restore();
  x.textAlign = 'center'; x.textBaseline = 'middle'; const mx = W / 2; let y = CY + 62;
  // logo + chữ ONI OFFICE
  x.font = F(700, 22); const lt = 'ONI OFFICE', ltw = x.measureText(lt).width; let lw = 0;
  if (logoImg) { const k = logoImg.width / 426, sw = 109 * k, sh = 132 * k, lh = 34; lw = sw * lh / sh; x.drawImage(logoImg, 10 * k, 8 * k, sw, sh, mx - (lw + 10 + ltw) / 2, y - 18, lw, lh); }
  x.fillStyle = KEM; x.textAlign = 'left'; x.fillText(lt, mx - (lw + 10 + ltw) / 2 + lw + 10, y); x.textAlign = 'center';
  y += 38; x.fillStyle = VANG; x.fillRect(mx - 36, y, 72, 2);
  if (o.tag) { y += 36; x.font = F(600, 18); x.letterSpacing = '4px'; x.fillStyle = 'rgba(243,233,218,0.85)'; x.fillText(String(o.tag).toUpperCase(), mx, y); x.letterSpacing = '0px'; }
  // tiêu đề 2 dòng
  x.font = F(800, s);
  y += 30 + s * 0.7; x.fillStyle = '#FFFFFF'; x.fillText(o.t1 || '', mx, y);
  y += Math.round(s * 1.3); x.fillStyle = VANG; x.fillText(o.t2 || '', mx, y);
  y += Math.round(s * 0.85) + 12; x.fillStyle = 'rgba(240,198,110,0.7)'; x.fillRect(mx - 36, y, 72, 2);
  if (o.sub) { y += 38; let ss = 24; x.font = F(500, ss, true); while (x.measureText(o.sub).width > CW - 90 && ss > 18) { ss--; x.font = F(500, ss, true); } x.fillStyle = KEM; x.fillText(o.sub, mx, y); }
  x.font = F(600, 17); x.letterSpacing = '3px'; x.fillStyle = 'rgba(243,233,218,0.9)'; x.fillText('TÂN ĐỊNH  ·  GÒ VẤP  ·  onioffice.vn', mx, CY + CH - 46); x.letterSpacing = '0px';
  x.textAlign = 'left';
  return c.toBuffer('image/png');
}
