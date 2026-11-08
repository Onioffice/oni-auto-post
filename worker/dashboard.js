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
const st=d.createElement('style');st.textContent=css+'\n#dk .tong{border-radius:16px;padding:16px 18px;font-size:17px;font-weight:800;display:flex;gap:10px;align-items:center}\n#dk .tong.ok{background:#E3F1E1;color:#2F6B2A}#dk .tong.do{background:#FDE2DD;color:#B5523B}#dk .tong.vang{background:#FFF3C9;color:#7A5A12}\n#dk .tong small{display:block;font-weight:500;font-size:13.5px;margin-top:2px}\n#dk .sd{display:flex;flex-direction:column;gap:0}\n#dk .cn{display:grid;grid-template-columns:44px 1fr auto;gap:12px;align-items:center;background:#fff;border:2px solid #EEE5D6;border-radius:14px;padding:12px 14px}\n#dk .cn.ok{border-color:#9CCB95}#dk .cn.do{border-color:#E39A88;background:#FFF7F5}#dk .cn.vang{border-color:#EED48A}#dk .cn.xam{opacity:.6}\n#dk .cn .so{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:16px;background:#F1ECE4;color:#6F4F31}\n#dk .cn.ok .so{background:#2F8A3B;color:#fff}#dk .cn.do .so{background:#C2452D;color:#fff}#dk .cn.vang .so{background:#E9B83A;color:#fff}\n#dk .cn b{font-size:15.5px}#dk .cn .mo{font-size:13px;color:#896441}#dk .cn .kq{font-size:13.5px;margin-top:3px}\n#dk .cn.do .kq{color:#B5523B;font-weight:700}\n#dk .mui{text-align:center;color:#C9B79A;font-size:20px;line-height:22px;height:22px}\n#dk details{background:#fff;border:1px solid #EEE5D6;border-radius:14px;padding:12px 16px}#dk summary{cursor:pointer;font-weight:800;color:#6F4F31;font-size:15.5px}\n#dk .chu{display:flex;gap:14px;flex-wrap:wrap;font-size:12.5px;color:#896441}#dk .chu i{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:4px;vertical-align:-1px}\n';d.head.appendChild(st);

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
async function napServer(){try{const [a,b,c,e]=await Promise.all(['/api/caidat','/api/nhatky','/api/soloi','/api/baocao'].map(u=>fetch(u).then(r=>r.ok?r.json():{}).catch(()=>({}))));CD=a.caidat||{};NK=b.nhatky||[];SL=c.soloi||[];BC=e.baocao||[];TS=await fetch('/api/thuso/cho').then(r=>r.ok?r.json():{}).catch(()=>({}))}catch(e){}}
const bat=k=>['nhan','thuso','baocao'].includes(k)?CD[k]!==false:!!CD[k];

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
 const loi=re=>SL.filter(x=>x.luc>=moc&&re.test(x.viec||'')&&/^1/.test(x.loai||'')&&(!x.sua||/^Chưa/i.test(x.sua)));
 const bat_=k=>bat(k);
 const cho=P.filter(p=>p.tt==='Chờ duyệt').length,sua=P.filter(p=>p.tt==='Cần sửa').length,daDuyet=P.filter(p=>p.tt==='Đã duyệt'&&!p.link&&p.at>=hn).length;
 const batLoi=SL.filter(x=>x.luc>=moc&&/^2/.test(x.loai||''));
 const B=[];
 // 1 Thu số
 {const l=nk(/^Thu số/),e=[];const tre=l?(Date.now()-new Date(l.luc))/36e5:999;
  let tt=!bat_('thuso')?'xam':(TS.cho||!l)?'vang':tre>30?'do':'ok',kq=TS.cho?'Máy chủ đang xin kết nối – chị bấm Cho phép':!l?'Chưa gửi số lần nào':tre>30?'Quá hạn: số mới nhất từ '+gioVN(l.luc):'Đã cập nhật số '+gioVN(l.luc);
  B.push({k:'thuso',ten:'Thu số các kênh',mo:'6:45 sáng · lấy số Google, Facebook, Zalo, Threads, Google Business',tt,kq,nut:TS.cho?'<button class="btn" id="tsOK" style="background:#896441;color:#fff;margin-top:6px">✓ Cho phép (mã '+Es(TS.cho.ma)+')</button>':''})}
 // 2 Nhận việc
 {const l=nk(/^Việc chị giao/),e=loi(/Việc chị giao|Nhận việc/),dang=((M.ai||{}).lenh||[]).filter(x=>['Chờ AI','AI đang làm'].includes(x.tt)).length;
  B.push({k:'nhan',ten:'Nhận việc chị giao',mo:'Mỗi giờ 7h–22h · đọc việc chị giao ở Bảng việc',tt:!bat_('nhan')?'xam':e.length?'do':dang?'vang':'ok',kq:e.length?'Lỗi: '+e[e.length-1].loi:dang?dang+' việc đang chờ máy làm (giờ tới máy nhận)':l?'Xong việc gần nhất '+gioVN(l.luc):'Chưa có việc chị giao'})}
 // 3 Soạn
 {const l=nk(/^Tự soạn/),e=loi(/^Soạn/);
  B.push({k:'soan',ten:'Soạn bài + làm hình',mo:'7:45 sáng · viết bài Facebook (Website thứ Ba, thứ Sáu)',tt:!bat_('soan')?'xam':e.length?'do':'ok',kq:e.length?'Lỗi: '+e[e.length-1].loi:l?(/^Lỗi/.test(l.kq)?'Lỗi: '+l.kq:'Xong '+gioVN(l.luc)+' – '+l.kq):'Chưa chạy'})}
 // 4 Kiểm lỗi
 B.push({k:'',ten:'Tự kiểm lỗi bài',mo:'Ngay sau khi soạn · kiểm chữ, giá, hashtag, chữ ký, hình',tt:sua?'vang':'ok',kq:sua?sua+' bài máy bắt lỗi, chưa sửa xong (Cần sửa)':batLoi.length?'Đã tự bắt '+batLoi.length+' lỗi trong 36 giờ, bài lỗi không được đăng':'Không có bài lỗi',go:sua?'mkd':''});
 // 5 Chị duyệt
 B.push({k:'',ten:'Chị duyệt bài',mo:'Bài có giá / việc chị giao cần chị bấm Duyệt',tt:cho?'vang':'ok',kq:cho?cho+' bài đang chờ chị duyệt – bấm để xem':'Không có bài chờ duyệt',go:'mkd',nguoi:1});
 // 6 Đăng
 {const l=nk(/^Tự đăng/),e=loi(/^Đăng|Tự đăng/);
  B.push({k:'dang',ten:'Đăng bài',mo:'10:55 sáng · đăng bài đã duyệt lên Website, Facebook',tt:!bat_('dang')?'xam':e.length?'do':'ok',kq:!bat_('dang')?'Đang tắt – chờ mã Facebook. '+daDuyet+' bài đã duyệt chờ đăng':e.length?'Lỗi: '+e[e.length-1].loi:l?'Lần cuối '+gioVN(l.luc)+' – '+l.kq:'Chưa chạy'})}
 // 7 Báo cáo
 {const l=nk(/^Báo cáo tuần/),e=loi(/Báo cáo/);
  B.push({k:'baocao',ten:'Báo cáo tuần',mo:'Thứ Hai 8:05 · tổng kết tuần, đề xuất tuần mới',tt:!bat_('baocao')?'xam':e.length?'do':'ok',kq:e.length?'Lỗi: '+e[e.length-1].loi:l?'Báo cáo gần nhất '+gioVN(l.luc)+' (xem bên dưới)':'Chưa chạy'})}
 return B}
function veSoDo(B){return B.map((c,i)=>(i?'<div class="mui">↓</div>':'')+`<div class="cn ${c.tt}" ${c.go?`data-go="${c.go}" style="cursor:pointer"`:''}><div class="so">${c.tt==='ok'?'✓':c.tt==='do'?'!':i+1}</div><div><b>${i+1}. ${c.nguoi?'👩 ':'🤖 '}${Es(c.ten)}</b><div class="mo">${Es(c.mo)}</div><div class="kq">${Es(c.kq)}</div>${c.nut||''}</div><div>${c.k?`<label class="sw" title="Bật/tắt"><input type="checkbox" data-may="${c.k}" ${bat(c.k)?'checked':''}><span></span></label>`:''}</div></div>`).join('')}
function ve(){const R=d.getElementById('dk');if(!R)return;const b=BC[BC.length-1];const B=soDo();
 const nDo=B.filter(c=>c.tt==='do'),nVang=B.filter(c=>c.tt==='vang');
 const tong=nDo.length?`<div class="tong do">⚠️<div>Có ${nDo.length} công nhân đang lỗi: ${nDo.map(c=>Es(c.ten)).join(', ')}<small>Bước lỗi có viền đỏ bên dưới, ghi rõ lỗi gì. Chi tiết ở Sổ lỗi máy.</small></div></div>`:nVang.length?`<div class="tong vang">👀<div>Mọi máy chạy bình thường – có ${nVang.length} việc cần chị xem<small>${nVang.map(c=>Es(c.kq)).join(' · ')}</small></div></div>`:`<div class="tong ok">✅<div>Mọi việc đang ổn<small>Các công nhân chạy đúng lịch, không có lỗi.</small></div></div>`;
 R.innerHTML=tong+`<div class="k"><h3>Quy trình tự động – từ công nhân đầu đến cuối</h3><div class="chu" style="margin:6px 0 12px"><span><i style="background:#2F8A3B"></i>Xong, ổn</span><span><i style="background:#E9B83A"></i>Đang chờ / cần chị xem</span><span><i style="background:#C2452D"></i>Lỗi</span><span><i style="background:#ccc"></i>Đang tắt</span><span>Gạt công tắc bên phải để bật/tắt từng công nhân</span></div><div class="sd">${veSoDo(B)}</div></div>
 <details><summary>📣 Chi tiết từng kênh (số liệu, vướng mắc, cách tìm khách)</summary><div class="kenh" style="margin-top:12px">${theKenh()}</div></details>
 <details><summary>🗒 Báo cáo tuần gần nhất</summary>${b?`<div class="g" style="margin-top:8px">${Es(new Date(b.luc).toLocaleString('vi-VN'))}</div><div class="bc">${Es(b.nd)}</div>`:'<div class="g">Chưa có – máy báo cáo chạy sáng thứ Hai.</div>'}</details>
 <div class="g">Sổ lỗi chi tiết: <a href="/duyet" target="_blank">mở Sổ lỗi máy ↗</a></div>`;
 R.querySelectorAll('[data-may]').forEach(i=>{i.onclick=e=>e.stopPropagation();i.onchange=async()=>{const r=await fetch('/api/caidat',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify({[i.dataset.may]:i.checked})});if(r.ok){CD[i.dataset.may]=i.checked;try{pqToast(i.checked?'Đã bật':'Đã tắt')}catch(e){}ve()}else{i.checked=!i.checked;try{pqToast('Chưa lưu được, chị thử lại')}catch(e){}}}});
 const ok=d.getElementById('tsOK');if(ok)ok.onclick=async e=>{e.stopPropagation();const r=await fetch('/api/thuso/duyet',{method:'POST'});try{pqToast(r.ok?'Đã cho phép – sáng mai 6:45 máy chủ tự gửi số':'Chưa được, chị bấm lại')}catch(e){}await napServer();ve()};
 R.querySelectorAll('[data-go]').forEach(o=>o.onclick=()=>go(o.dataset.go))}
window.pages=window.pages||{};
pages.mdk=function(){setTimeout(async()=>{ve();await napServer();ve()},0);return '<div id="dk"><div class="k">Đang tải bảng điều khiển…</div></div>'};
/* thêm mục menu "Bảng điều khiển" (trước khi khung giao diện dựng menu) */
const as=d.querySelector('aside');if(as&&!as.querySelector('a[data-p=mdk]')){const a=d.createElement('a');a.dataset.p='mdk';a.textContent='Bảng điều khiển';a.onclick=()=>go('mdk');as.appendChild(a)}
}catch(e){console.warn('dashboard',e)}})();
