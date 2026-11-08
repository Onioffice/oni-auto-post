/* ===== BẢNG ĐIỀU KHIỂN MARKETING (trang đầu menu) =====
   - Các máy tự động: lịch chạy, lần chạy gần nhất, kết quả, bật/tắt riêng từng máy
   - Việc chờ chị
   - Từng kênh: tình trạng, vướng mắc, cần chỉnh gì, cách tìm khách tiềm năng
   Dữ liệu: oni_mkt (bài), oni_mks (số kênh), /api/caidat, /api/nhatky, /api/soloi, /api/baocao */
(function(){try{
const d=document,Es=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const homNay=()=>new Date(Date.now()+7*3600e3).toISOString().slice(0,10);
const soNgay=(a,b)=>Math.round((new Date(b)-new Date(a))/864e5);
const fD=s=>{const m=String(s||'').match(/^(\d{4})-(\d{2})-(\d{2})/);return m?m[3]+'/'+m[2]:'—'};
const LS=k=>{try{return JSON.parse(localStorage.getItem(k)||'null')}catch(e){return null}};
const css=`#dk{display:flex;flex-direction:column;gap:16px}#dk .k{background:#fff;border:1px solid #EEE5D6;border-radius:14px;padding:16px}
#dk h3{margin:0 0 4px;font-size:17px;color:#6F4F31}#dk .g{font-size:13px;color:#896441;margin-bottom:10px}
#dk .may{display:grid;grid-template-columns:1.6fr 1.1fr 1.3fr 2fr auto;gap:10px;align-items:center;padding:10px 0;border-top:1px solid #F3EBDD}
#dk .may:first-of-type{border:0}#dk .may b{display:block}#dk .may small{color:#896441}
#dk .ch{display:inline-block;font-size:12px;font-weight:700;padding:3px 9px;border-radius:999px;margin:0 4px 4px 0}
#dk .ok{background:#E3F1E1;color:#2F6B2A}#dk .vang{background:#FFF3C9;color:#7A5A12}#dk .do{background:#FDE2DD;color:#B5523B}#dk .xam{background:#F1ECE4;color:#6F4F31}
#dk .sw{position:relative;width:48px;height:28px;display:inline-block}#dk .sw input{opacity:0;width:0;height:0}#dk .sw span{position:absolute;inset:0;background:#ccc;border-radius:28px;cursor:pointer;transition:.2s}
#dk .sw span:before{content:"";position:absolute;width:22px;height:22px;left:3px;top:3px;background:#fff;border-radius:50%;transition:.2s}#dk .sw input:checked+span{background:#E9B83A}#dk .sw input:checked+span:before{transform:translateX(20px)}
#dk .viec{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px}#dk .o{background:#F7F3EC;border-radius:12px;padding:12px;cursor:pointer}
#dk .o .so{font-size:26px;font-weight:800;color:#6F4F31}#dk .o.can .so{color:#B5523B}
#dk .kenh{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(320px,100%),1fr));gap:12px}
#dk .th{border:1px solid #EEE5D6;border-radius:14px;padding:14px;background:#FBF8F3;display:flex;flex-direction:column;gap:8px;min-width:0}
#dk .th .dau{display:flex;justify-content:space-between;align-items:flex-start;gap:8px}#dk .th .ab{width:34px;height:34px;border-radius:10px;background:#FFF3C9;color:#6F4F31;font-weight:800;font-size:12px;display:inline-flex;align-items:center;justify-content:center;flex:none}
#dk .th h4{margin:0;font-size:15.5px}#dk .th .so4{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}#dk .th .so4 div{background:#fff;border-radius:10px;padding:6px;text-align:center}#dk .th .so4 b{display:block;font-size:16px}#dk .th .so4 small{font-size:11px;color:#896441}
#dk .th ul{margin:0;padding-left:18px;font-size:13.5px;line-height:1.5}#dk .th .t{font-size:12.5px;font-weight:800;color:#6F4F31;text-transform:uppercase;letter-spacing:.3px;margin-top:2px}
#dk .bc{white-space:pre-wrap;font-size:14px;line-height:1.55;background:#F7F3EC;border-radius:12px;padding:12px;max-height:340px;overflow:auto}
@media(max-width:760px){#dk .may{grid-template-columns:1fr auto;}#dk .may .an{display:none}#dk .th .so4{grid-template-columns:repeat(2,1fr)}}`;
const st=d.createElement('style');st.textContent=css+'\n#dk .hero{background:linear-gradient(135deg,#1B1410,#2E2117);color:#F3E7D3;border-radius:18px;padding:18px;display:flex;flex-direction:column;gap:14px;box-shadow:0 8px 24px rgba(30,20,10,.25)}\n#dk .hh{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:center}#dk .ht{font-weight:800;letter-spacing:.6px;font-size:19px;color:#FFE38A}#dk .hs{font-size:12.5px;color:#C9B79A}\n#dk .hb{display:flex;gap:10px;align-items:center;flex-wrap:wrap}#dk .st{font-size:12.5px;font-weight:800;padding:7px 12px;border-radius:999px;display:inline-flex;gap:7px;align-items:center}\n#dk .st i{width:9px;height:9px;border-radius:50%;display:inline-block}#dk .st.on{background:#123A1C;color:#7EE08F}#dk .st.on i{background:#3BD35A;box-shadow:0 0 8px #3BD35A;animation:nh 1.4s infinite}#dk .st.off{background:#3A1712;color:#FF9C88}#dk .st.off i{background:#E2553B}\n@keyframes nh{50%{opacity:.35}}\n#dk .stop{border:0;border-radius:12px;padding:10px 14px;font:inherit;font-weight:800;cursor:pointer;background:#C2452D;color:#fff}#dk .stop.go{background:#2F8A3B}\n#dk .hc{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}#dk .hc .c{background:rgba(255,255,255,.06);border:1px solid rgba(255,227,138,.18);border-radius:14px;padding:12px}#dk .hc small{color:#C9B79A;font-size:12px}#dk .hc b{display:block;font-size:24px;color:#FFE38A;margin-top:2px}\n#dk .hg{display:grid;grid-template-columns:1.5fr 1fr;gap:12px}@media(max-width:900px){#dk .hg{grid-template-columns:1fr}}\n#dk .hl,#dk .ha{background:rgba(0,0,0,.25);border:1px solid rgba(255,227,138,.15);border-radius:14px;padding:12px;min-width:0}\n#dk .hlh{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:8px}#dk #hDem{font-family:ui-monospace,monospace;color:#7EE08F;font-weight:700}\n#dk .log{font-family:ui-monospace,Menlo,monospace;font-size:12.5px;line-height:1.55;max-height:260px;overflow:auto;display:flex;flex-direction:column;gap:3px}#dk .log .tm{color:#E9B83A}#dk .log b{color:#fff}#dk .log div{overflow-wrap:anywhere}\n#dk .ha{display:flex;flex-direction:column;gap:8px}#dk .ha small{color:#C9B79A;font-size:12.5px}#dk .ap{display:flex;gap:10px;align-items:center}#dk .ap img,#dk .noimg{width:84px;height:84px;object-fit:cover;border-radius:10px;background:#3A2F25;flex:none;display:flex;align-items:center;justify-content:center;font-size:11px;color:#C9B79A}\n#dk .ap b{font-size:13.5px;color:#fff}#dk .ap small{display:block}#dk .ap a{color:#FFE38A}#dk .ha label{font-size:12.5px;color:#C9B79A;display:flex;flex-direction:column;gap:4px}\n#dk .ha input{padding:10px;border-radius:10px;border:1px solid #6F4F31;background:#1B1410;color:#fff;font:inherit;font-size:16px}#dk .qcGo{background:linear-gradient(90deg,#FFE38A,#E9B83A);color:#2E2117;font-weight:800;border:0;padding:11px}#dk .qcL{font-size:12px;color:#C9B79A}\n'+'\n#dk .boss textarea{width:100%;box-sizing:border-box;border:1px solid #E5DCC8;border-radius:12px;padding:10px;font:inherit;font-size:15px}\n#dk .bsR{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}#dk .bsR select,#dk .bsR input{padding:8px;border:1px solid #E5DCC8;border-radius:10px;font:inherit}#dk .bsR .btn{background:#896441;color:#fff}\n#dk .bsL{margin-top:10px;display:flex;flex-direction:column;gap:6px;font-size:13.5px}#dk .bsL small{color:#896441}\n#dk .vong{display:flex;flex-wrap:wrap;gap:6px;align-items:center}#dk .tr{flex:1 1 120px;max-width:160px;border:2px solid #EEE5D6;border-radius:14px;padding:10px;text-align:center;background:#fff}\n#dk .tr .ic{font-size:24px}#dk .tr b{display:block;font-size:13px;margin-top:2px}#dk .tr small{display:block;font-size:12px;color:#896441;margin-top:3px}\n#dk .tr.ok{border-color:#9CCB95;background:#F4FAF3}#dk .tr.do{border-color:#E39A88;background:#FFF5F2}#dk .tr.vang{border-color:#EED48A;background:#FFFBEA;cursor:pointer}#dk .tr.xam{opacity:.6}\n#dk .tr .btn{margin-top:6px;background:#2F8A3B;color:#fff;font-size:12px;padding:5px 8px}\n#dk .mt{color:#C9A35A;font-size:18px;font-weight:800}#dk .mt.ve{flex-basis:100%;text-align:center;font-size:14px}\n#dk .lich{display:grid;grid-template-columns:repeat(auto-fill,minmax(104px,1fr));gap:8px}#dk .o2{border-radius:12px;padding:8px;border:2px solid #EEE5D6;background:#fff;font-size:13px}#dk .o2 b{font-size:16px;display:block}#dk .o2 small{display:block;color:#896441;font-size:11.5px}\n#dk .o2.ok{border-color:#9CCB95}#dk .o2.vang{border-color:#EED48A;background:#FFFBEA;cursor:pointer}#dk .o2.do{border-color:#E39A88;background:#FFF5F2;cursor:pointer}#dk .o2.trong{border-style:dashed;opacity:.75}\n#dk .doi{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(300px,100%),1fr));gap:10px}#dk .bot{border:1px solid #EEE5D6;border-radius:14px;padding:12px;background:#FBF8F3}\n#dk .bd{display:grid;grid-template-columns:36px 1fr auto;gap:10px;align-items:center}#dk .bi{font-size:26px}#dk .bd small{display:block;font-size:12.5px;color:#896441}\n#dk .bj{display:flex;flex-wrap:wrap;gap:6px 12px;margin-top:8px;font-size:12.5px}#dk .bj i{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:4px}\n@media(max-width:760px){#dk .tr{max-width:none;flex-basis:calc(50% - 30px)}#dk .mt{display:none}#dk .mt.ve{display:block}}\n'+"\n#dk .luong table{width:100%;border-collapse:collapse;font-size:13.5px}#dk .luong th,#dk .luong td{padding:8px 6px;border-top:1px solid #F3EBDD;text-align:left;vertical-align:top}\n#dk .luong thead th{font-size:12.5px;color:#896441;border:0}#dk .luong tbody th{font-weight:800;white-space:nowrap}#dk .luong tbody th small{display:block;font-weight:500;color:#896441}\n#dk .lo{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:6px;vertical-align:0;background:#ccc}#dk .lo.ok{background:#2F8A3B}#dk .lo.vang{background:#E9B83A}#dk .lo.do{background:#C2452D}\n@media(max-width:760px){#dk .luong thead{display:none}#dk .luong tr{display:block;border-top:1px solid #EEE5D6;padding:8px 0}#dk .luong tbody th,#dk .luong td{display:block;border:0;padding:3px 0}#dk .luong td:nth-of-type(1):before{content:'① '}#dk .luong td:nth-of-type(2):before{content:'② '}#dk .luong td:nth-of-type(3):before{content:'③ '}#dk .luong td:nth-of-type(4):before{content:'④ '}#dk .luong td:nth-of-type(5):before{content:'⑤ '}}\n"+'\n#dk .tong{border-radius:16px;padding:16px 18px;font-size:17px;font-weight:800;display:flex;gap:10px;align-items:center}\n#dk .tong.ok{background:#E3F1E1;color:#2F6B2A}#dk .tong.do{background:#FDE2DD;color:#B5523B}#dk .tong.vang{background:#FFF3C9;color:#7A5A12}\n#dk .tong small{display:block;font-weight:500;font-size:13.5px;margin-top:2px}\n#dk .sd{display:flex;flex-direction:column;gap:0}\n#dk .cn{display:grid;grid-template-columns:44px 1fr auto;gap:12px;align-items:center;background:#fff;border:2px solid #EEE5D6;border-radius:14px;padding:12px 14px}\n#dk .cn.ok{border-color:#9CCB95}#dk .cn.do{border-color:#E39A88;background:#FFF7F5}#dk .cn.vang{border-color:#EED48A}#dk .cn.xam{opacity:.6}\n#dk .cn .so{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:16px;background:#F1ECE4;color:#6F4F31}\n#dk .cn.ok .so{background:#2F8A3B;color:#fff}#dk .cn.do .so{background:#C2452D;color:#fff}#dk .cn.vang .so{background:#E9B83A;color:#fff}\n#dk .cn b{font-size:15.5px}#dk .cn .mo{font-size:13px;color:#896441}#dk .cn .kq{font-size:13.5px;margin-top:3px}\n#dk .cn.do .kq{color:#B5523B;font-weight:700}\n#dk .mui{text-align:center;color:#C9B79A;font-size:20px;line-height:22px;height:22px}\n#dk details{background:#fff;border:1px solid #EEE5D6;border-radius:14px;padding:12px 16px}#dk summary{cursor:pointer;font-weight:800;color:#6F4F31;font-size:15.5px}\n#dk .chu{display:flex;gap:14px;flex-wrap:wrap;font-size:12.5px;color:#896441}#dk .chu i{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:4px;vertical-align:-1px}\n';d.head.appendChild(st);

const MAY=[
 {k:'nhan',ten:'Nhận việc chị giao',lich:'Mỗi giờ, 7:00–22:00',viec:/^Việc chị giao/,mo:'Đọc việc ở "Giao việc cho AI Marketing" (Bảng việc), soạn bài + hình, kiểm lỗi, đưa vào Chờ duyệt'},
 {k:'soan',ten:'Soạn bài buổi sáng',lich:'7:45 mỗi ngày',viec:/^Tự soạn/,mo:'Soạn bài Facebook (+ Website thứ Ba, thứ Sáu) cho ngày kia theo trụ cột tuần'},
 {k:'dang',ten:'Đăng bài',lich:'10:55 mỗi ngày',viec:/^Tự đăng/,mo:'Đăng bài "Đã duyệt" đến ngày lên Facebook, Website (Facebook cần mã đăng bài)'},
 {k:'thuso',ten:'Thu số các kênh',lich:'6:45 mỗi ngày (máy chủ Apps Script)',viec:/^Thu số/,mo:'Lấy số Google, Fanpage, Instagram, Threads, Zalo, Google Business đưa lên trang web'},
 {k:'baocao',ten:'Báo cáo tuần',lich:'Thứ Hai 8:05',viec:/^Báo cáo tuần/,mo:'Tổng hợp số bài, kênh thiếu bài, việc tồn, đề xuất tuần mới'},
];
const KENH={
 fb:{ten:'Facebook – Fanpage Oni Office',kenh:'Facebook',tim:['Đăng đều 1 bài/ngày, có câu hỏi cuối bài để khách bình luận','Trả lời inbox trong 15 phút giờ hành chính, mời để lại SĐT/Zalo','Tham gia nhóm "thành lập công ty", "khởi nghiệp TP.HCM", chia sẻ bài kiến thức (không spam giá)','Chạy quảng cáo tin nhắn nhắm Tân Định, Gò Vấp, bán kính 5 km']},
 ig:{ten:'Instagram – @onioffice',kenh:'Instagram',tim:['Carousel ảnh thật văn phòng + mẹo thủ tục, 6–8 hashtag địa phương','Story hằng ngày: lễ tân, phòng họp, khách đến làm việc','Gắn vị trí CS1/CS2 trong bài để hiện ở tìm kiếm địa điểm']},
 th:{ten:'Threads – @onioffice.vn',kenh:'Threads',tim:['Hỏi đáp ngắn về thủ tục, trả lời bình luận nhanh','Tham gia chủ đề khởi nghiệp, freelancer; không quảng cáo lộ']},
 zl:{ten:'Zalo OA – Oni Office',kenh:'Zalo',tim:['Gắn nút "Nhắn Oni" ở website, bài Facebook, chữ ký email','Gửi bài tóm tắt 5 ý mỗi tuần cho người quan tâm (không gửi broadcast khi chưa duyệt)','Mời khách đang thuê quan tâm OA để nhận thông báo']},
 tt:{ten:'TikTok – @onioffice',kenh:'TikTok',tim:['Video 15–30 giây quay thật: tour văn phòng, 1 mẹo thủ tục/video','Đăng 3 video/tuần cùng khung giờ 19–21h']},
 li:{ten:'LinkedIn – trang cá nhân của chị',kenh:'LinkedIn',tim:['Bài song ngữ về môi trường kinh doanh, kinh nghiệm hỗ trợ nhà đầu tư nước ngoài','Kết nối giám đốc công ty FDI, công ty luật, kế toán ở TP.HCM']},
 vb:{ten:'Viber – Oni Office',kenh:'',tim:['Dùng cho khách quen nước ngoài (Hàn, Nga…); gửi lời chào kèm link đặt phòng họp']},
 gtd:{ten:'Google Business – CS1 Tân Định',kenh:'',gb:1,tim:['Xin đánh giá sau mỗi lần ký hợp đồng/đặt phòng họp','Đăng bài cập nhật mỗi tuần, thêm ảnh thật mới mỗi tháng','Trả lời mọi đánh giá trong 24 giờ']},
 ggv:{ten:'Google Business – CS2 Gò Vấp',kenh:'',gb:1,tim:['Còn ít đánh giá: xin khách CS2 đánh giá','Thêm ảnh phòng làm việc, phòng họp CS2','Đăng bài cập nhật giá trị (khuyến mãi phòng họp, sự kiện)']},
};
const WEB={ten:'Website – onioffice.vn',kenh:'Website',tim:['Bài kiến thức 2 bài/tuần theo từ khóa khách đang tìm (Search Console)','Mỗi bài có lời mời đặt phòng họp / xem văn phòng và nút Zalo','Thêm liên kết nội bộ giữa bài kiến thức và trang dịch vụ']};

let CD={},NK=[],SL=[],BC=[],TS={};
async function napServer(){try{const [a,b,c,e]=await Promise.all(['/api/caidat','/api/nhatky','/api/soloi','/api/baocao'].map(u=>fetch(u).then(r=>r.ok?r.json():{}).catch(()=>({}))));CD=a.caidat||{};NK=b.nhatky||[];SL=c.soloi||[];BC=e.baocao||[];QC=(await fetch('/api/qc').then(r=>r.ok?r.json():{}).catch(()=>({}))).qc||[];TS=await fetch('/api/thuso/cho').then(r=>r.ok?r.json():{}).catch(()=>({}))}catch(e){}}
const bat=k=>['nhan','thuso','baocao','vonglap'].includes(k)?CD[k]!==false:!!CD[k];

function trangMay(){const M=LS('oni_mkt')||{},mks=LS('oni_mks')||{};
 return MAY.map(m=>{let lan=[...NK].reverse().find(x=>m.viec.test(x.viec||''));
  if(m.k==='thuso'){const at=(mks.web||{}).gscAt||'';lan=lan||(at?{luc:at+'T06:30:00',kq:'Số Google/kênh cập nhật ngày '+fD(at)}:null)}
  if(m.k==='nhan'&&!lan&&M.ai&&M.ai.lastRun)lan={luc:String(M.ai.lastRun).replace(' ','T')+':00',kq:'AI chạy lần cuối'};
  const tre=lan?Math.round((Date.now()-new Date(lan.luc))/36e5):null;
  const tt=!bat(m.k)?['Đang tắt','xam']:!lan?['Chưa chạy lần nào','vang']:(m.k==='nhan'&&tre>26)||(m.k!=='nhan'&&m.k!=='baocao'&&tre>30)?['Quá hạn chưa chạy','do']:/^Lỗi/i.test(lan.kq||'')?['Có lỗi','do']:['Đang chạy tốt','ok'];
  return `<div class="may"><div><b>${Es(m.ten)}</b><small>${Es(m.mo)}</small></div><div class="an"><small>${Es(m.lich)}</small></div><div><span class="ch ${tt[1]}">${tt[0]}</span>${lan?'<br><small>'+Es(new Date(lan.luc).toLocaleString('vi-VN'))+'</small>':''}</div><div class="an"><small>${Es((lan&&lan.kq)||'—')}</small>${m.k==='thuso'?'<div id="tsCho"></div>':''}</div><label class="sw" title="Bật/tắt"><input type="checkbox" data-may="${m.k}" ${bat(m.k)?'checked':''}><span></span></label></div>`}).join('')}

function viecCho(){const M=LS('oni_mkt')||{},mks=LS('oni_mks')||{},P=(M.posts||[]).filter(p=>!p.del),hn=homNay();
 const cho=P.filter(p=>p.tt==='Chờ duyệt').length,sua=P.filter(p=>p.tt==='Cần sửa').length,lenh=((M.ai||{}).lenh||[]).filter(l=>l.tt==='Chờ AI'||l.tt==='AI đang làm').length;
 const chuaHen=P.filter(p=>p.tt==='Đã duyệt'&&!p.hen&&!p.link&&p.at>=hn).length;
 const gb=(mks.ch||[]).filter(c=>c.gb).reduce((a,c)=>{const l=(c.snaps||[]).slice(-1)[0]||{};return a+(+l.unrep||0)},0);
 const loi=SL.filter(x=>x.luc>=new Date(Date.now()-7*864e5).toISOString()&&(!x.sua||/^Chưa/i.test(x.sua))).length;
 const o=(so,t,go,can)=>`<div class="o ${can&&so?'can':''}" data-go="${go}"><div class="so">${so}</div><div>${t}</div></div>`;
 return o(cho,'bài chờ chị duyệt','mkd',1)+o(sua,'bài cần sửa','mkd',1)+o(chuaHen,'bài đã duyệt chưa hẹn giờ / chưa đăng','mkw',1)+o(lenh,'việc AI đang chờ làm','mkv',0)+o(gb,'đánh giá Google chưa trả lời','mkc',1)+o(loi,'lỗi máy 7 ngày chưa tự sửa được','loi',1)}

function theKenh(){const M=LS('oni_mkt')||{},mks=LS('oni_mks')||{},P=(M.posts||[]).filter(p=>!p.del&&p.tt!=='Hủy'),hn=homNay(),web=mks.web||{};
 const lich=k=>P.filter(p=>p.kenh===k&&p.at>=hn&&['Đã duyệt','Chờ duyệt'].includes(p.tt)).length;
 const out=[];
 // Website
 {const cr=web.cr||{},g=web.g28||{},n30=(web.wk||[]).length;const v=[],can=[];
  if(cr.broken&&String(cr.broken).length>2)v.push('Có liên kết hỏng trên trang (xem Sức khỏe website)');
  if(cr.noaltN>0)v.push(cr.noaltN+' ảnh thiếu mô tả (alt)');
  if(g.pos)can.push('Vị trí trung bình trên Google: '+g.pos+' – nhắm từ khóa có lượt hiển thị cao ở Sức khỏe website');
  can.push('Máy viết 2 bài/tuần (thứ Ba, thứ Sáu); bật công tắc "Soạn bài buổi sáng"');
  out.push(the('WEB',WEB.ten,[['Hiển thị 28 ngày',g.imp||'—'],['Lượt bấm',g.clk||'—'],['Vị trí TB',g.pos||'—'],['Bài sắp đăng',lich('Website')]],v.length?['vang','Cần chỉnh']:['ok','Ổn'],v,can,WEB.tim))}
 (mks.ch||[]).forEach(c=>{const K=KENH[c.id]||{ten:c.ten,tim:[]};const l=(c.snaps||[]).slice(-1)[0]||{};const v=[],can=[];let tt=['ok','Ổn'];
  if(c.gb){if(+l.unrep)v.push(l.unrep+' đánh giá chưa trả lời');if((+l.nrev||0)<5)v.push('Mới có '+(l.nrev||0)+' đánh giá – cần thêm để lên top Maps');
   out.push(the('GB',K.ten,[['Tìm kiếm',l.search??'—'],['Maps',l.maps??'—'],['Chỉ đường',l.dir??'—'],['Sao',l.star?l.star+'★ ('+(l.nrev||0)+')':'—']],v.length?['vang','Cần chỉnh']:tt,v,can,K.tim));return}
  const muc=+c.muc||0,p30=l.p30,last=l.lastp,cach=last?soNgay(last,hn):null;
  if(muc&&p30!=null&&p30<muc){v.push('Thiếu '+(muc-p30)+' bài so với mục tiêu '+muc+'/30 ngày');tt=p30<muc/2?['do','Thiếu bài']:['vang','Thiếu bài']}
  if(cach!=null&&cach>7){v.push(cach+' ngày chưa đăng bài');tt=['do','Lâu chưa đăng']}
  if(!l.at){v.push('Chưa có số liệu – cần nhập tay ở Kênh mạng xã hội');tt=['vang','Thiếu số']}
  if(c.id==='fb'){v.push('Máy chưa tự đăng được: chưa có mã đăng bài Facebook (FB_PAGE_ACCESS_TOKEN)');can.push('Chị tạo mã đăng bài trong Meta Business → em hướng dẫn từng bước')}
  if(c.id==='ig'){v.push('Máy chưa tự đăng: chờ mẫu carousel nền trắng + mã Instagram');can.push('Em làm mẫu carousel nền trắng, chị duyệt mẫu')}
  if(c.id==='th'||c.id==='zl'||c.id==='li')can.push('Hiện đăng theo lịch trên máy Mac; em đang chuyển sang máy GitHub');
  if(c.id==='zl')can.push('Gói OA Tiêu chuẩn tối đa 15 bài/kỳ – số bài nhập tay mỗi thứ Hai');
  if(c.id==='tt')can.push('Chờ TikTok duyệt quyền đọc số; cần video quay thật');
  if(c.id==='vb')can.push('Viber không có trang quản lý web – chị chụp màn hình gửi em nhập số');
  out.push(the(c.ab||'?',K.ten||c.ten,[['Theo dõi',l.fol??'—'],['Bài 30 ngày',p30!=null?p30+(muc?'/'+muc:''):'—'],['Tiếp cận',l.reach??'—'],['Sắp đăng',K.kenh?lich(K.kenh):'—']],tt,v,can,K.tim||[]))});
 return out.join('')}
function the(ab,ten,so,tt,v,can,tim){return `<div class="th"><div class="dau"><div style="display:flex;gap:8px;align-items:center;min-width:0"><span class="ab">${Es(ab)}</span><h4>${Es(ten)}</h4></div><span class="ch ${tt[0]}">${Es(tt[1])}</span></div>
 <div class="so4">${so.map(([t,n])=>`<div><b>${Es(typeof n==='number'?n.toLocaleString('vi-VN'):n)}</b><small>${Es(t)}</small></div>`).join('')}</div>
 ${v.length?`<div class="t">⚠ Vướng mắc</div><ul>${v.map(x=>'<li>'+Es(x)+'</li>').join('')}</ul>`:''}
 ${can.length?`<div class="t">🔧 Cần chỉnh</div><ul>${can.map(x=>'<li>'+Es(x)+'</li>').join('')}</ul>`:''}
 ${tim.length?`<div class="t">🎯 Cách tìm khách tiềm năng</div><ul>${tim.map(x=>'<li>'+Es(x)+'</li>').join('')}</ul>`:''}</div>`}


const gioVN=s=>{if(!s)return'';const t=new Date(s);const hn=new Date().toDateString()===t.toDateString();return (hn?'hôm nay ':t.toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit'})+' ')+t.toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'})};
function soDo(){const M=LS('oni_mkt')||{},mks=LS('oni_mks')||{},P=(M.posts||[]).filter(p=>!p.del),hn=homNay(),moc=new Date(Date.now()-36*36e5).toISOString();
 const nk=re=>[...NK].reverse().find(x=>re.test(x.viec||''));
 const loi=(re,sau)=>SL.filter(x=>x.luc>=moc&&(!sau||x.luc>sau)&&re.test(x.viec||'')&&/^1/.test(x.loai||'')&&(!x.sua||/^Chưa/i.test(x.sua)));
 const bat_=k=>bat(k);
 const cho=P.filter(p=>p.tt==='Chờ duyệt').length,sua=P.filter(p=>p.tt==='Cần sửa').length,daDuyet=P.filter(p=>p.tt==='Đã duyệt'&&!p.link&&p.at>=hn).length;
 const batLoi=SL.filter(x=>x.luc>=moc&&/^2/.test(x.loai||''));
 const B=[];
 // 1 Thu số
 {const l=[...NK].reverse().find(x=>/^Thu số/.test(x.viec||'')&&!/cho phép/i.test(x.kq||'')),e=[];const tre=l?(Date.now()-new Date(l.luc))/36e5:999;
  let tt=!bat_('thuso')?'xam':(TS.cho||!l)?'vang':tre>30?'do':'ok',kq=TS.cho?'Máy chủ đang xin kết nối – chị bấm Cho phép':!l?'Chưa gửi số lần nào':tre>30?'Quá hạn: số mới nhất từ '+gioVN(l.luc):'Đã cập nhật số '+gioVN(l.luc);
  B.push({k:'thuso',ten:'Thu số các kênh',mo:'6:45 sáng · lấy số Google, Facebook, Zalo, Threads, Google Business',tt,kq,nut:TS.cho?'<button class="btn" id="tsOK" style="background:#896441;color:#fff;margin-top:6px">✓ Cho phép (mã '+Es(TS.cho.ma)+')</button>':''})}
 // 2 Nhận việc
 {const l=nk(/^Việc chị giao/),e=loi(/Việc chị giao|Nhận việc/,l&&!/^Lỗi/.test(l.kq)?l.luc:''),dang=((M.ai||{}).lenh||[]).filter(x=>['Chờ AI','AI đang làm'].includes(x.tt)).length;
  B.push({k:'nhan',ten:'Nhận việc chị giao',mo:'Mỗi giờ 7h–22h · đọc việc chị giao ở Bảng việc',tt:!bat_('nhan')?'xam':e.length?'do':dang?'vang':'ok',kq:e.length?'Lỗi: '+e[e.length-1].loi:dang?dang+' việc đang chờ máy làm (giờ tới máy nhận)':l?'Xong việc gần nhất '+gioVN(l.luc):'Chưa có việc chị giao'})}
 // 3 Vòng lặp
 {const l=nk(/^Vòng lặp/),lt=nk(/^Tự soạn|^Việc chị giao/),okL=[l,lt].filter(x=>x&&!/^Lỗi/.test(x.kq)).map(x=>x.luc).sort().pop()||'',e=loi(/^Soạn|Vòng lặp/,okL);
  B.push({k:'vonglap',ten:'Vòng lặp soạn bài',mo:'Mỗi giờ · giữ đủ 12 bài cho 24 giờ tới: tìm tin → ý tưởng → viết → kiểm → hình → kiểm → xếp lịch',tt:!bat_('vonglap')?'xam':e.length?'do':'ok',kq:e.length?'Lỗi: '+e[e.length-1].loi:l?(/^Lỗi/.test(l.kq)?l.kq:'Lần cuối '+gioVN(l.luc)+' – '+l.kq):'Chưa chạy lần nào'})}
 // 6 Đăng
 {const l=nk(/^Tự đăng/),e=loi(/^Đăng|Tự đăng/,l&&!/^Lỗi/.test(l.kq)?l.luc:'');
  B.push({k:'dang',ten:'Đăng bài',mo:'Mỗi giờ · tới giờ hẹn thì đăng bài đã duyệt (Website; Facebook khi có mã)',tt:!bat_('dang')?'xam':e.length?'do':'ok',kq:!bat_('dang')?'Đang tắt – chờ mã Facebook. '+daDuyet+' bài đã duyệt chờ đăng':e.length?'Lỗi: '+e[e.length-1].loi:l?'Lần cuối '+gioVN(l.luc)+' – '+l.kq:'Chưa chạy'})}
 // 7 Báo cáo
 {const l=nk(/^Báo cáo tuần/),e=loi(/Báo cáo/);
  B.push({k:'baocao',ten:'Báo cáo tuần',mo:'Thứ Hai 8:05 · tổng kết tuần, đề xuất tuần mới',tt:!bat_('baocao')?'xam':e.length?'do':'ok',kq:e.length?'Lỗi: '+e[e.length-1].loi:l?'Báo cáo gần nhất '+gioVN(l.luc)+' (xem bên dưới)':'Chưa chạy'})}
 return B}

const LUONG=[['Facebook','Facebook','fb',1],['Website','Website','',1],['Instagram','Instagram','ig',0],['Threads','Threads','th',0],['Zalo OA','Zalo','zl',0],['LinkedIn','LinkedIn','li',0],['TikTok','TikTok','tt',0],['Google Business','','gtd',0]];
function veLuong(){const M=LS('oni_mkt')||{},mks=LS('oni_mks')||{},P=(M.posts||[]).filter(p=>!p.del&&p.tt!=='Hủy'),hn=homNay();
 const o=(tt,t)=>`<td><span class="lo ${tt}"></span>${Es(t)}</td>`;
 const rows=LUONG.map(([ten,kenh,id,may])=>{const ps=kenh?P.filter(p=>p.kenh===kenh):[];const ch=(mks.ch||[]).find(c=>c.id===id)||{};const sn=id?((ch.snaps||[]).slice(-1)[0]||{}):{at:(mks.web||{}).gscAt};
  const bot=ps.filter(p=>p.botAt).sort((a,b)=>String(b.botAt).localeCompare(String(a.botAt)))[0];
  const sua=ps.filter(p=>p.tt==='Cần sửa').length,cho=ps.filter(p=>p.tt==='Chờ duyệt').length,sap=ps.filter(p=>['Đã duyệt','Chờ duyệt'].includes(p.tt)&&p.at>=hn).length;
  const dd=ps.filter(p=>p.tt==='Đã đăng').map(p=>p.at).sort().pop();
  const c1=!kenh?o('xam','Không đăng bài'):may?o(bot?'ok':'vang',bot?'Máy soạn '+fD(bot.at):'Chưa soạn bài nào'):o('xam','Làm tay / máy Mac');
  const c2=!kenh?o('xam','—'):o(sua?'do':'ok',sua?sua+' bài lỗi':'Không lỗi');
  const c3=!kenh?o('xam','—'):o(cho?'vang':'ok',cho?cho+' chờ duyệt':'Không chờ');
  const c4=!kenh?o('xam','—'):kenh==='Facebook'?o(bat('dang')?'ok':'xam',bat('dang')?'Tự đăng 10:55':'Chờ mã Facebook'):kenh==='Website'?o(bat('dang')?'ok':'xam',bat('dang')?'Tự đăng 10:55':'Đang tắt'):o('xam',dd?'Đăng tay, gần nhất '+fD(dd):'Đăng tay');
  const c5=o(sn.at?((Date.now()-new Date(sn.at))/864e5>2?'vang':'ok'):'vang',sn.at?'Số ngày '+fD(sn.at):'Chưa có số');
  return `<tr><th>${Es(ten)}<small>${sap?sap+' bài sắp đăng':''}</small></th>${c1}${c2}${c3}${c4}${c5}</tr>`}).join('');
 return `<div class="luong"><table><thead><tr><th>Kênh</th><th>① Soạn bài</th><th>② Kiểm lỗi</th><th>③ Chị duyệt</th><th>④ Đăng bài</th><th>⑤ Thu số</th></tr></thead><tbody>${rows}</tbody></table></div>`}
function veSoDo(B){return B.map((c,i)=>(i?'<div class="mui">↓</div>':'')+`<div class="cn ${c.tt}" ${c.go?`data-go="${c.go}" style="cursor:pointer"`:''}><div class="so">${c.tt==='ok'?'✓':c.tt==='do'?'!':i+1}</div><div><b>${i+1}. ${c.nguoi?'👩 ':'🤖 '}${Es(c.ten)}</b><div class="mo">${Es(c.mo)}</div><div class="kq">${Es(c.kq)}</div>${c.nut||''}</div><div>${c.k?`<label class="sw" title="Bật/tắt"><input type="checkbox" data-may="${c.k}" ${bat(c.k)?'checked':''}><span></span></label>`:''}</div></div>`).join('')}
const DOI=[
 {id:'web',ten:'Bot Website',kenh:'Website',icon:'🌐',viec:'3 bài SEO/ngày (7:00, 9:00, 20:00) theo từ khóa khách tìm trên Google, tự đăng WordPress, thu số Search Console'},
 {id:'fb',ten:'Bot Fanpage Facebook',kenh:'Facebook',icon:'📘',viec:'2 bài/ngày (10:00, 15:00) có hình navy, tự đăng khi có mã Facebook, thu số Fanpage',ch:'fb'},
 {id:'ig',ten:'Bot Instagram',kenh:'Instagram',icon:'📸',viec:'2 bài/ngày (14:00, 17:00) hình nền kem, thu số Instagram',ch:'ig'},
 {id:'li',ten:'Bot LinkedIn',kenh:'LinkedIn',icon:'💼',viec:'1 bài/ngày (12:00) song ngữ + ảnh văn phòng thật',ch:'li'},
 {id:'th',ten:'Bot Threads',kenh:'Threads',icon:'🧵',viec:'4–5 bài/ngày chỉ chữ, câu hỏi trao đổi, thu số Threads',ch:'th'},
 {id:'zl',ten:'Bot Zalo OA',kenh:'Zalo',icon:'💬',viec:'1 bài ngày lẻ (13:00) – giữ trong giới hạn bài của gói OA, thu số Zalo',ch:'zl'},
 {id:'tt',ten:'Bot TikTok',kenh:'TikTok',icon:'🎵',viec:'Chờ video quay thật + TikTok duyệt quyền – hiện chỉ thu số',ch:'tt'},
 {id:'gb',ten:'Bot Google Business',kenh:'',icon:'📍',viec:'Thu số CS1, CS2; báo đánh giá chưa trả lời',ch:'gtd'},
 {id:'ga',ten:'Bot Google Ads',kenh:'',icon:'🔎',viec:'Theo dõi chiến dịch, chi phí, lượt bấm (trang Quảng cáo)'},
 {id:'fa',ten:'Bot Facebook Ads',kenh:'',icon:'📣',viec:'Theo dõi quảng cáo tin nhắn, chi phí (trang Quảng cáo)'},
 {id:'em',ten:'Bot Email bản tin',kenh:'Email',icon:'✉️',viec:'Soạn bản tin tuần thứ Năm 9:00 → chị duyệt → gửi ở trang Bản tin email'},
];
const TRAM=[['tim','🔍','Tìm tin & xu hướng'],['yt','💡','Lên ý tưởng'],['kb','✍️','Viết kịch bản'],['kc','🧐','Kiểm lỗi chữ'],['tk','🎨','Thiết kế hình'],['kh','🖼','Kiểm lỗi hình'],['ll','🗓','Xếp lịch mỗi giờ'],['duyet','👩‍💼','Boss duyệt'],['dang','🚀','Đăng bài'],['so','📊','Thu số']];
function duLieu(){const M=LS('oni_mkt')||{},P=(M.posts||[]).filter(p=>!p.del&&p.tt!=='Hủy');return{M,P}}
function veBoss(){const {M}=duLieu();const L=((M.ai||{}).lenh||[]).slice(0,4);
 return `<div class="k boss"><h3>👩‍💼 Boss giao nhiệm vụ</h3><div class="g">Chị gõ việc cần làm, chọn kênh. Bot kênh đó nhận lệnh trong vòng 1 giờ, làm xong đưa vào Chờ duyệt.</div>
 <textarea id="bsNd" rows="3" placeholder="VD: Viết 3 bài giới thiệu phòng họp CS2 Gò Vấp cho tuần sau, nhấn mạnh khách FDI"></textarea>
 <div class="bsR"><select id="bsK"><option>Mọi kênh</option>${DOI.filter(b=>b.kenh).map(b=>`<option value="${b.kenh}">${b.ten.replace('Bot ','')}</option>`).join('')}</select><input type="date" id="bsH" title="Ngày đăng mong muốn (để trống = máy tự xếp)"><button class="btn" id="bsGo">📤 Giao việc</button></div>
 ${L.length?`<div class="bsL">${L.map(l=>`<div><span class="ch ${l.tt==='Xong'?'ok':l.tt==='Hủy'?'xam':'vang'}">${Es(l.tt)}</span> ${Es(String(l.nd).slice(0,90))} <small>· ${Es(l.kenh||'')}${l.kq?' · '+Es(String(l.kq).slice(0,80)):''}</small></div>`).join('')}</div>`:''}</div>`}
function veVong(){const {P}=duLieu(),moc=new Date(Date.now()-24*36e5).toISOString();const moi=P.filter(p=>p.vong&&String(p.botAt||'')>=moc);
 const dem=k=>{const ok=moi.filter(p=>p.vong[k]==='ok').length,l=moi.filter(p=>p.vong[k]==='loi').length;return[ok,l]};
 const cho=P.filter(p=>p.tt==='Chờ duyệt'),hn=homNay(),dd=P.filter(p=>p.tt==='Đã đăng'&&(p.dang||p.at||'')>=homNay(-1)).length;
 const o=TRAM.map(([k,ic,t],i)=>{let n,l=0,tt,ghi;
  if(k==='duyet'){n=cho.length;tt=n?'vang':'ok';ghi=n?n+' bài chờ chị':'Không chờ'}
  else if(k==='dang'){n=dd;tt=bat('dang')?'ok':'xam';ghi=bat('dang')?n+' bài 24h qua':'Đang tắt'}
  else if(k==='so'){const l2=[...NK].reverse().find(x=>/^Thu số/.test(x.viec||'')&&!/cho phép/i.test(x.kq||''));tt=l2&&(Date.now()-new Date(l2.luc))<30*36e5?'ok':'vang';ghi=l2?gioVN(l2.luc):'Chưa có'}
  else{[n,l]=dem(k);tt=l?'do':n?'ok':'xam';ghi=l?`${n} đạt · ${l} lỗi`:n?n+' bài đạt':'Chưa có bài'}
  return `<div class="tr ${tt}" ${k==='duyet'?'data-go="mkd"':''}><div class="ic">${ic}</div><b>${i+1}. ${t}</b><small>${ghi}</small>${k==='duyet'&&cho.length?'<button class="btn duyetHet">✓ Duyệt tất cả '+cho.length+' bài</button>':''}</div>`}).join('<div class="mt">➜</div>');
 return `<div class="k"><h3>🔄 Vòng lặp tự động (chạy mỗi giờ)</h3><div class="g">Bài đi qua 10 trạm, xong trạm 10 thì quay lại trạm 1. Số trong mỗi trạm là bài 24 giờ qua. Trạm đỏ là có lỗi.</div><div class="vong">${o}<div class="mt ve">↺ quay lại trạm 1</div></div></div>`}
function veLich(){const {P}=duLieu(),now=new Date(Date.now()+7*36e5),ra=[];
 for(let d=0;d<=1;d++){const ngay=homNay(d);LICH_W.forEach(([g,k])=>{const t=new Date(ngay+'T'+g+':00Z');if(t<new Date(now-36e5)||ra.length>=15)return;const kenh=k==='Zalo'&&Number(ngay.slice(8))%2===0?'Threads':k;
  const ds=P.filter(p=>p.at===ngay&&p.kenh===kenh);const p=ds.find(x=>x.gio===g)||ds[ra.filter(r=>r.ngay===ngay&&r.kenh===kenh).length];ra.push({ngay,g,kenh,p})})}
 return `<div class="k"><h3>🕐 Lịch 24 giờ tới – mạng xã hội mỗi giờ 1 bài (8:00 → 19:00) + 3 bài Website SEO</h3><div class="g">Ô trống: bot sẽ tự soạn trong giờ tới. Bấm ô có bài để xem.</div><div class="lich">${ra.map(r=>{const p=r.p,tt=!p?'trong':p.tt==='Đã đăng'?'ok':p.tt==='Đã duyệt'?'ok':p.tt==='Cần sửa'?'do':'vang';
  return `<div class="o2 ${tt}" ${p?'data-go="mkd"':''}><b>${r.g}</b><small>${r.ngay===homNay()?'Hôm nay':'Ngày mai'}</small><div>${Es(r.kenh)}</div><small>${p?Es(p.tt):'Chưa có bài'}</small></div>`}).join('')}</div></div>`}
function veDoi(){const {P}=duLieu(),mks=LS('oni_mks')||{},hn=homNay();
 return `<div class="k"><h3>🤖 Đội bot từng kênh</h3><div class="g">Mỗi kênh một bot phụ trách: soạn bài, đăng, lấy số. Gạt công tắc để cho bot kênh đó nghỉ.</div><div class="doi">${DOI.map(b=>{
  const ps=b.kenh?P.filter(p=>p.kenh===b.kenh):[],ch=(mks.ch||[]).find(c=>c.id===b.ch)||{},sn=b.id==='web'?{at:(mks.web||{}).gscAt}:((ch.snaps||[]).slice(-1)[0]||{});
  const sap=ps.filter(p=>['Đã duyệt','Chờ duyệt'].includes(p.tt)&&p.at>=hn).length,sua=ps.filter(p=>p.tt==='Cần sửa').length,cho=ps.filter(p=>p.tt==='Chờ duyệt').length;
  const dot=(tt,t)=>`<span><i class="lo ${tt}"></i>${t}</span>`;
  const soan=!b.kenh?dot('xam','Không soạn'):b.id==='tt'?dot('xam','Chờ video'):dot(sap?'ok':'vang',sap+' bài sắp đăng');
  const kiem=b.kenh?dot(sua?'do':'ok',sua?sua+' bài lỗi':'Không lỗi'):'';
  const du=b.kenh?dot(cho?'vang':'ok',cho?cho+' chờ duyệt':'Không chờ'):'';
  const dg=['web','fb'].includes(b.id)?dot(bat('dang')?'ok':'xam',bat('dang')?'Tự đăng':b.id==='fb'?'Chờ mã FB':'Tắt'):b.kenh&&b.id!=='em'?dot('xam','Đăng tay'):b.id==='em'?dot('vang','Gửi ở Bản tin email'):'';
  const so=['ga','fa'].includes(b.id)?dot('vang','Xem trang Quảng cáo'):dot(sn.at?'ok':'vang',sn.at?'Số '+fD(sn.at):'Chưa có số');
  return `<div class="bot"><div class="bd"><span class="bi">${b.icon}</span><div><b>${b.ten}</b><small>${Es(b.viec)}</small></div><label class="sw"><input type="checkbox" data-may="bot_${b.id}" ${CD['bot_'+b.id]!==false?'checked':''}><span></span></label></div><div class="bj">${[soan,kiem,du,dg,so].filter(Boolean).join('')}</div></div>`}).join('')}</div></div>`}
const LICH_W=[['07:00','Website'],['08:00','Threads'],['09:00','Website'],['10:00','Facebook'],['11:00','Threads'],['12:00','LinkedIn'],['13:00','Zalo'],['14:00','Instagram'],['15:00','Facebook'],['16:00','Threads'],['17:00','Instagram'],['18:00','Threads'],['19:00','Threads'],['20:00','Website']];
let QC=[],demT=null;
const MAY_TAT=['vonglap','nhan','dang','soan','bantin'];
function dangChay(){return bat('vonglap')||bat('nhan')}
function veHero(){const {M,P}=duLieu();const hn=homNay();
 const web=P.filter(p=>p.kenh==='Website'&&p.tt==='Đã đăng').length,mxh=P.filter(p=>p.kenh!=='Website'&&p.kenh!=='Email'&&p.tt==='Đã đăng').length;
 const qcOn=QC.filter(q=>q.tt!=='Hủy'),ns=qcOn.reduce((a,q)=>a+(+q.nganSach||0),0);
 const log=[...NK.map(x=>({t:x.luc,v:x.viec,c:x.kq})),...(((M.ai||{}).log)||[]).slice(0,40).map(x=>({t:String(x.at||'').replace(' ','T')+(String(x.at||'').length<=16?':00+07:00':''),v:x.viec,c:x.ct}))].filter(x=>x.t&&!isNaN(new Date(x.t))).sort((a,b)=>new Date(b.t)-new Date(a.t)).slice(0,30);
 const ic=v=>/Thu số/.test(v)?'📊':/Ý tưởng|Vòng lặp/.test(v)?'🔄':/Soạn|soạn/.test(v)?'🤖':/Đăng|đăng/.test(v)?'🌐':/hình|Hình/.test(v)?'🎨':/Báo cáo/.test(v)?'🗒':/Quảng cáo/.test(v)?'📣':/giao việc|Nhận việc|Việc chị/.test(v)?'👩‍💼':/Lỗi|lỗi/.test(v)?'⚠️':'•';
 const moi=P.filter(p=>p.tt==='Đã đăng'&&p.link).sort((a,b)=>String(b.dang||b.at).localeCompare(String(a.dang||a.at)))[0];
 const run=dangChay();
 return `<div class="hero">
 <div class="hh"><div><div class="ht">AI MARKETING AUTOMATION DASHBOARD</div><div class="hs">Oni Office · bot chạy 24/7 trên GitHub + Cloudflare</div></div>
  <div class="hb"><span class="st ${run?'on':'off'}"><i></i>VÒNG LẶP NỘI DUNG: ${run?'ĐANG CHẠY':'ĐÃ DỪNG'}</span>
  <button class="stop ${run?'':'go'}" id="hStop">${run?'⏹ DỪNG TỰ ĐỘNG':'▶ CHẠY LẠI TỰ ĐỘNG'}</button></div></div>
 <div class="hc">
  <div class="c"><small>Bài Website đã đăng</small><b>${web}</b></div>
  <div class="c"><small>Bài mạng xã hội đã đăng</small><b>${mxh}</b></div>
  <div class="c"><small>Chiến dịch QC đã duyệt</small><b>${qcOn.length}</b></div>
  <div class="c"><small>Ngân sách QC/ngày</small><b>${ns.toLocaleString('vi-VN')} đ</b></div></div>
 <div class="hg">
  <div class="hl"><div class="hlh"><b>🔄 Vòng lặp – bot đang làm gì</b><span id="hDem">${run?'Vòng tới sau: --:--':'Đã dừng'}</span></div>
   <div class="log">${log.map(x=>`<div><span class="tm">[${new Date(x.t).toLocaleString('vi-VN',{hour:'2-digit',minute:'2-digit',day:'2-digit',month:'2-digit'})}]</span> ${ic(x.v+' '+x.c)} <b>${Es(x.v)}</b> ${Es(String(x.c||'').slice(0,140))}</div>`).join('')||'<div>Chưa có hoạt động.</div>'}</div></div>
  <div class="ha"><b>📣 Duyệt chạy quảng cáo</b><small>Bài đăng gần nhất – chị nhập ngân sách, bấm duyệt.</small>
   ${moi?`<div class="ap">${moi.anh?`<img src="${Es(String(moi.anh).split(/[\s,]+/)[0])}" alt="">`:'<div class="noimg">Không hình</div>'}<div><b>${Es(moi.tieude||'')}</b><small>${Es(moi.kenh)} · đăng ${fD(moi.dang||moi.at)} · <a href="${Es(moi.link)}" target="_blank">xem bài ↗</a></small></div></div>
   <label>Ngân sách (VND/ngày)<input id="qcNs" inputmode="numeric" placeholder="VD 100.000"></label>
   <button class="btn qcGo" id="qcGo" data-ma="${Es(moi.ma)}">🚀 DUYỆT & CHẠY QUẢNG CÁO</button>`:'<div class="noimg">Chưa có bài đã đăng có link.</div>'}
   ${QC.slice(0,3).map(q=>`<div class="qcL">${Es(q.ma)} · ${(+q.nganSach).toLocaleString('vi-VN')} đ/ngày · <i>${Es(q.tt)}</i></div>`).join('')}</div></div></div>`}
function demNguoc(){clearInterval(demT);demT=setInterval(()=>{const e=d.getElementById('hDem');if(!e){clearInterval(demT);return}if(!dangChay()){e.textContent='Đã dừng';return}
 const n=new Date(),t=new Date(n);t.setMinutes(25,0,0);if(t<=n)t.setHours(t.getHours()+1);const s=Math.round((t-n)/1000);e.textContent='Vòng tới sau: '+String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')},1000)}
function ganHero(){const st=d.getElementById('hStop');if(st)st.onclick=async()=>{const run=dangChay();if(run&&!confirm('Dừng toàn bộ bot tự động (soạn, nhận việc, đăng, bản tin)?'))return;
  const body={};MAY_TAT.forEach(k=>body[k]=!run);if(!run){body.dang=CD.dangTruoc??false;body.soan=false}else body.dangTruoc=!!CD.dang;
  const r=await fetch('/api/caidat',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify(body)});if(r.ok){Object.assign(CD,(await r.json()).caidat||body);try{pqToast(run?'Đã dừng tất cả bot':'Đã chạy lại')}catch(e){}ve()}};
 const g=d.getElementById('qcGo');if(g)g.onclick=async()=>{const ns=Number((d.getElementById('qcNs').value||'').replace(/\D/g,''));if(!ns){d.getElementById('qcNs').focus();return}
  const {P}=duLieu(),p=P.find(x=>x.ma===g.dataset.ma)||{};if(!confirm('Duyệt chạy quảng cáo cho bài '+(p.tieude||'')+' với '+ns.toLocaleString('vi-VN')+' đ/ngày?'))return;
  const r=await fetch('/api/qc',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({ma:p.ma,tieude:p.tieude,link:p.link,nganSach:ns})});const j=await r.json().catch(()=>({}));
  if(r.ok){try{pqToast('Đã duyệt '+ns.toLocaleString('vi-VN')+' đ/ngày – chờ kết nối Facebook Ads để máy tự tạo chiến dịch')}catch(e){}await napServer();ve()}else try{pqToast(j.loi||'Chưa lưu được')}catch(e){}}}

function ve(){const R=d.getElementById('dk');if(!R)return;const b=BC[BC.length-1];const B=soDo();
 const nDo=B.filter(c=>c.tt==='do');const cho=duLieu().P.filter(p=>p.tt==='Chờ duyệt').length;
 const tong=nDo.length?`<div class="tong do">⚠️<div>Có ${nDo.length} công nhân đang lỗi: ${nDo.map(c=>Es(c.ten)).join(', ')}<small>Xem ô viền đỏ bên dưới. Chi tiết ở Sổ lỗi máy.</small></div></div>`:cho?`<div class="tong vang">👀<div>Các bot đang chạy bình thường – ${cho} bài chờ chị duyệt<small>Bấm "Duyệt tất cả" ở trạm Boss duyệt nếu chị thấy ổn.</small></div></div>`:`<div class="tong ok">✅<div>Mọi việc đang ổn<small>Các bot chạy đúng lịch, không có lỗi.</small></div></div>`;
 R.innerHTML=veHero()+tong+veBoss()+veVong()+veLich()+veDoi()+`<div class="k"><h3>⚙️ Công nhân hệ thống</h3><div class="g">Gạt công tắc để bật/tắt. Ô đỏ ghi rõ lỗi.</div><div class="sd">${veSoDo(B)}</div></div>
 <details><summary>📣 Chi tiết số liệu từng kênh, vướng mắc, cách tìm khách</summary><div class="kenh" style="margin-top:12px">${theKenh()}</div></details>
 <details><summary>🗒 Báo cáo tuần gần nhất</summary>${b?`<div class="g" style="margin-top:8px">${Es(new Date(b.luc).toLocaleString('vi-VN'))}</div><div class="bc">${Es(b.nd)}</div>`:'<div class="g">Chưa có – máy báo cáo chạy sáng thứ Hai.</div>'}</details>
 <div class="g">Sổ lỗi chi tiết: <a href="/duyet" target="_blank">mở Sổ lỗi máy ↗</a></div>`;
 R.querySelectorAll('[data-may]').forEach(i=>{i.onclick=e=>e.stopPropagation();i.onchange=async()=>{const r=await fetch('/api/caidat',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify({[i.dataset.may]:i.checked})});if(r.ok){CD[i.dataset.may]=i.checked;try{pqToast(i.checked?'Đã bật':'Đã cho nghỉ')}catch(e){}ve()}else{i.checked=!i.checked;try{pqToast('Chưa lưu được, chị thử lại')}catch(e){}}}});
 const ok=d.getElementById('tsOK');if(ok)ok.onclick=async e=>{e.stopPropagation();const r=await fetch('/api/thuso/duyet',{method:'POST'});try{pqToast(r.ok?'Đã cho phép':'Chưa được, chị bấm lại')}catch(e){}await napServer();ve()};
 R.querySelectorAll('.duyetHet').forEach(bt=>bt.onclick=e=>{e.stopPropagation();const ds=duLieu().P.filter(p=>p.tt==='Chờ duyệt');if(!confirm('Duyệt tất cả '+ds.length+' bài đang chờ? Bài đã duyệt sẽ được đăng đúng giờ.'))return;let n=0;ds.forEach(p=>{try{window.mkDuyet(p.id);n++}catch(er){}});try{pqToast('Đã duyệt '+n+' bài')}catch(er){}setTimeout(ve,300)});
 const g=d.getElementById('bsGo');if(g)g.onclick=async()=>{const nd=d.getElementById('bsNd').value.trim();if(!nd){d.getElementById('bsNd').focus();return}g.disabled=true;
  const r=await fetch('/api/mk/op',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({op:'giaoViec',nd,kenh:d.getElementById('bsK').value,han:d.getElementById('bsH').value})});g.disabled=false;
  if(r.ok){try{pqToast('Đã giao việc – bot nhận trong vòng 1 giờ')}catch(e){}d.getElementById('bsNd').value='';try{const k=await (await fetch('/api/app/keys')).json();if(k.keys&&k.keys.oni_mkt)localStorage.setItem('oni_mkt',k.keys.oni_mkt)}catch(e){}ve()}else try{pqToast('Chưa giao được, chị thử lại')}catch(e){}};
 R.querySelectorAll('[data-go]').forEach(o=>o.onclick=()=>go(o.dataset.go));ganHero();demNguoc()}

window.pages=window.pages||{};
pages.mdk=function(){setTimeout(async()=>{ve();await napServer();ve()},0);return '<div id="dk"><div class="k">Đang tải bảng điều khiển…</div></div>'};
/* thêm mục menu "Bảng điều khiển" (trước khi khung giao diện dựng menu) */
const as=d.querySelector('aside');if(as&&!as.querySelector('a[data-p=mdk]')){const a=d.createElement('a');a.dataset.p='mdk';a.textContent='Bảng điều khiển';a.onclick=()=>go('mdk');as.appendChild(a)}
}catch(e){console.warn('dashboard',e)}})();
