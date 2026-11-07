/* ===== Phần riêng của bản web: chỉ giữ khu Marketing + công tắc máy tự động ===== */
(function(){try{
const GIU=['zmk','mkh','mkd','mkw','mkv','mcd','mkt','mks','mkc','mqc','mkr','btin','mkb'];
const st=document.createElement('style');st.textContent='aside a[data-p]'+GIU.map(p=>':not([data-p="'+p+'"])').join('')+'{display:none!important}'+
 '.oniCT{background:#fff;border:1px solid #EEE5D6;border-radius:14px;padding:12px 14px;margin:0 0 14px}.oniCT h4{margin:0 0 6px;font-size:15px;color:#6F4F31}.oniCT .r{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:8px 0;border-top:1px solid #F3EBDD}.oniCT .r:first-of-type{border:0}.oniCT small{color:#896441}'+
 '.oniSw{position:relative;width:48px;height:28px;flex:none}.oniSw input{opacity:0;width:0;height:0}.oniSw span{position:absolute;inset:0;background:#ccc;border-radius:28px;transition:.2s;cursor:pointer}.oniSw span:before{content:"";position:absolute;width:22px;height:22px;left:3px;top:3px;background:#fff;border-radius:50%;transition:.2s}.oniSw input:checked+span{background:#E9B83A}.oniSw input:checked+span:before{transform:translateX(20px)}';
document.head.appendChild(st);
function don(){document.querySelectorAll('aside a[data-p]').forEach(a=>{if(!GIU.includes(a.dataset.p))a.remove()})}
don();new MutationObserver(()=>don()).observe(document.querySelector('aside')||document.body,{childList:true,subtree:true});
const g0=window.go;window.go=function(p,k){if(p&&!GIU.includes(p))p='mkh';const r=g0.call(this,p,k);setTimeout(()=>congTac(p),400);return r};
let CD=null;
let dangVe=false;
async function congTac(p){if(!['mkh','mkv'].includes(p)||dangVe)return;const R=document.getElementById('m5Root');if(!R||!R.parentNode||R.parentNode.querySelector(':scope>.oniCT'))return;dangVe=true;
 try{CD=(await (await fetch('/api/caidat')).json()).caidat||{}}catch(e){CD={}}
 let nk=[];try{nk=(await (await fetch('/api/nhatky')).json()).nhatky||[]}catch(e){}
 const lan=nk.length?nk[nk.length-1]:null;
 const box=document.createElement('div');box.className='oniCT';
 box.innerHTML='<h4>⚙️ Máy tự động (chạy trên GitHub, máy Mac tắt vẫn chạy)</h4>'+
 '<div class="r"><div><b>Tự soạn bài mỗi sáng</b><br><small>7:45 – soạn bài Facebook (+ Website thứ Ba, thứ Sáu) cho ngày kia, kiểm lỗi rồi vào Chờ duyệt / Đã lên lịch</small></div><label class="oniSw"><input type="checkbox" data-k="soan" '+(CD.soan?'checked':'')+'><span></span></label></div>'+
 '<div class="r"><div><b>Tự đăng bài</b><br><small>10:55 – đăng bài "Đã duyệt" đến ngày lên Facebook, Website</small></div><label class="oniSw"><input type="checkbox" data-k="dang" '+(CD.dang?'checked':'')+'><span></span></label></div>'+
 '<div class="r"><small>Việc chị giao ở "🤖 Giao việc cho AI Marketing": máy nhận mỗi giờ từ 7:00 đến 22:00.'+(lan?' Máy chạy lần cuối: '+new Date(lan.luc).toLocaleString('vi-VN')+' – '+String(lan.viec).replace(/</g,'&lt;')+'.':'')+' <a href="/duyet" target="_blank">Sổ lỗi máy ↗</a></small></div>';
 box.querySelectorAll('input[data-k]').forEach(i=>i.onchange=async()=>{const r=await fetch('/api/caidat',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify({[i.dataset.k]:i.checked})});try{pqToast(r.ok?(i.checked?'Đã bật':'Đã tắt'):'Chưa lưu được, chị thử lại')}catch(e){}});
 if(!R.parentNode.querySelector(':scope>.oniCT'))R.parentNode.insertBefore(box,R);dangVe=false}
setInterval(()=>{const a=document.querySelector('aside a.on');if(a)congTac(a.dataset.p)},1500);
}catch(e){console.warn('web_extra',e)}})();
/* ===== Soạn & đăng bài: xem rõ từng bài chờ duyệt / chờ đăng, hình lớn, bấm để phóng to ===== */
(function(){try{
const d=document,Es=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const css=`.oniGal{background:#fff;border:1px solid #EEE5D6;border-radius:14px;padding:14px;margin:0 0 14px}
.oniGal h3{margin:0 0 4px;font-size:17px;color:#6F4F31}.oniGal .ghi{font-size:13px;color:#896441;margin-bottom:10px}
.oniGal .tab{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px}.oniGal .tab button{border:1px solid #896441;background:#fff;color:#6F4F31;border-radius:999px;padding:6px 12px;font:inherit;font-weight:600;cursor:pointer}
.oniGal .tab button.on{background:linear-gradient(90deg,#FFE38A,#E9B83A);border-color:#E9B83A;color:#4A3220}
.oniGal .ds{display:grid;gap:16px;grid-template-columns:repeat(auto-fill,minmax(340px,1fr))}
.oniGal .the{border:1px solid #EEE5D6;border-radius:14px;overflow:hidden;display:flex;flex-direction:column;background:#FBF8F3;min-width:0}
.oniGal .hinh{background:#1e2a44;display:flex;align-items:center;justify-content:center;cursor:zoom-in;position:relative}
.oniGal .hinh img{width:100%;height:auto;display:block}
.oniGal .hinh .kinh{position:absolute;right:8px;bottom:8px;background:rgba(0,0,0,.6);color:#fff;font-size:12px;padding:4px 8px;border-radius:999px}
.oniGal .khong{padding:30px 10px;color:#C9BBA6;text-align:center;font-size:13px;cursor:default;background:#F3EBDD}
.oniGal .nd{padding:12px;display:flex;flex-direction:column;gap:6px;min-width:0}
.oniGal .nhan{display:inline-block;font-size:12px;padding:2px 8px;border-radius:999px;background:#F3E7D3;color:#6F4F31;font-weight:600;margin:0 4px 4px 0}
.oniGal .nhan.cho{background:#FFF3C9;color:#7A5A12}.oniGal .nhan.ok{background:#E3F1E1;color:#2F6B2A}.oniGal .nhan.sua{background:#FDE2DD;color:#B5523B}
.oniGal h4{margin:0;font-size:15.5px;line-height:1.35}.oniGal pre{white-space:pre-wrap;word-break:break-word;font:inherit;font-size:14px;line-height:1.5;margin:0;max-height:260px;overflow:auto;background:#fff;padding:10px;border-radius:10px;border:1px solid #F0E6D6}
.oniGal .xem{font-size:13px;color:#896441;cursor:pointer;text-decoration:underline;align-self:flex-start}
.oniGal .nut{display:flex;gap:6px;flex-wrap:wrap}.oniGal .nut button{flex:1;min-width:90px;border:0;border-radius:10px;padding:10px;font:inherit;font-weight:700;cursor:pointer}
.oniGal .d{background:linear-gradient(90deg,#FFE38A,#E9B83A);color:#4A3220}.oniGal .s{background:#F3E7D3;color:#6F4F31}.oniGal .h{background:#eee;color:#555}
.oniGal .ghichu{font-size:12.5px;color:#896441;word-break:break-word}
#oniTo{position:fixed;inset:0;background:rgba(0,0,0,.9);z-index:100000;display:none;overflow:auto;-webkit-overflow-scrolling:touch}
#oniTo .bar{position:sticky;top:0;display:flex;justify-content:space-between;align-items:center;padding:10px 14px;color:#fff;background:rgba(0,0,0,.6);gap:10px}
#oniTo .bar button{background:#E9B83A;border:0;border-radius:999px;padding:8px 14px;font:inherit;font-weight:700;cursor:pointer}
#oniTo .khung{display:flex;justify-content:center;align-items:flex-start;padding:10px}
#oniTo img{max-width:100%;height:auto;cursor:zoom-in;display:block}#oniTo.lon img{max-width:none;width:200%;cursor:zoom-out}
@media(max-width:760px){.oniGal .ds{grid-template-columns:1fr}#oniTo.lon img{width:250%}}`;
const st=d.createElement('style');st.textContent=css;d.head.appendChild(st);
let loc='cho';
const MK=()=>{try{return window.__MK.MK}catch(e){return null}};
const src=p=>{const u=p&&p.anh;if(!u)return '';try{const s=window.__AIMG?window.__AIMG(u):'';if(s)return s}catch(e){}return /^https?:\/\//.test(u)?u:''};
const lon=u=>String(u||'').replace('drive.google.com/thumbnail?id=','drive.google.com/thumbnail?sz=w2000&id=').replace(/&sz=w\d+/,'&sz=w2000');
const fD=s=>{const m=String(s||'').match(/^(\d{4})-(\d{2})-(\d{2})/);return m?m[3]+'/'+m[2]+'/'+m[1]:(s||'chưa hẹn ngày')};
function phong(u,t){let o=d.getElementById('oniTo');if(!o){o=d.createElement('div');o.id='oniTo';o.innerHTML='<div class="bar"><span id="oniToT"></span><span><button id="oniToZ">🔍 Phóng to / thu nhỏ</button> <button id="oniToX">✕ Đóng</button></span></div><div class="khung"><img id="oniToI" alt=""></div>';d.body.appendChild(o);
 o.querySelector('#oniToX').onclick=()=>{o.style.display='none';o.classList.remove('lon')};o.querySelector('#oniToZ').onclick=()=>o.classList.toggle('lon');o.querySelector('#oniToI').onclick=()=>o.classList.toggle('lon');
 d.addEventListener('keydown',e=>{if(e.key==='Escape'){o.style.display='none';o.classList.remove('lon')}})}
 o.querySelector('#oniToI').src=lon(u);o.querySelector('#oniToT').textContent=t||'';o.classList.remove('lon');o.style.display='block';o.scrollTop=0}
window.__oniPhong=phong;
function loai(p){if(p.tt==='Chờ duyệt')return 'cho';if(p.tt==='Đã duyệt'&&!p.link)return 'lich';if(p.tt==='Cần sửa')return 'sua';return ''}
function ve(){const M=MK();const R=d.getElementById('m5Root');if(!M||!R||!R.parentNode)return;let g=R.parentNode.querySelector(':scope>.oniGal');
 const tuNay=new Date(Date.now()-86400e3*3).toISOString().slice(0,10);
 const P=(M.posts||[]).filter(p=>!p.del&&loai(p)&&(loai(p)!=='lich'||!p.at||p.at>=tuNay));const dem={cho:0,lich:0,sua:0};P.forEach(p=>dem[loai(p)]++);
 const ds=P.filter(p=>loai(p)===loc).sort((a,b)=>((a.at||'9')+(a.gio||'')).localeCompare((b.at||'9')+(b.gio||'')));
 const tag={cho:['Chờ duyệt','cho'],lich:['Đã duyệt – chờ đăng','ok'],sua:['Cần sửa','sua']};
 const h='<h3>🖼 Xem bài trước khi đăng</h3><div class="ghi">Mỗi bài hiện hình lớn và đủ nội dung. Bấm vào hình để phóng to toàn màn hình.</div>'+
 '<div class="tab">'+[['cho','Chờ duyệt'],['lich','Đã duyệt – chờ đăng'],['sua','Cần sửa']].map(([k,t])=>'<button data-loc="'+k+'" class="'+(loc===k?'on':'')+'">'+t+' ('+dem[k]+')</button>').join('')+'</div>'+
 (ds.length?'<div class="ds">'+ds.map(p=>{const s=src(p);return '<div class="the">'+
  (s?'<div class="hinh" data-to="'+Es(s)+'" data-t="'+Es(p.ma+' – '+(p.tieude||''))+'"><img loading="lazy" src="'+Es(s)+'" alt="'+Es(p.tieude||'')+'"><span class="kinh">🔍 Bấm để phóng to</span></div>':'<div class="hinh khong">Chưa có hình'+(p.anh?' (tệp: '+Es(String(p.anh).slice(0,60))+')':'')+'</div>')+
  '<div class="nd"><div><span class="nhan">'+Es(p.kenh||'')+'</span><span class="nhan">'+Es(fD(p.at))+' '+Es(p.gio||'')+'</span><span class="nhan '+tag[loai(p)][1]+'">'+tag[loai(p)][0]+'</span>'+(p.ai?'<span class="nhan">🤖 AI soạn</span>':'')+(p.coGia?'<span class="nhan sua">Có giá/ưu đãi</span>':'')+'</div>'+
  '<h4>'+Es(p.tieude||'(chưa có tiêu đề)')+'</h4><pre>'+Es(p.nd||'')+'</pre>'+
  ((p.gc||p.note)?'<div class="ghichu">Ghi chú: '+Es(String(p.gc||p.note).replace(/https?:\/\/\S+/g,'[link]').slice(0,300))+'</div>':'')+
  '<div class="ghichu">Mã '+Es(p.ma||p.id)+(p.ph?' · 👤 '+Es(p.ph):'')+'</div>'+
  '<div class="nut">'+(p.tt==='Chờ duyệt'?'<button class="d" data-ac="duyet" data-id="'+Es(p.id)+'">✔ Duyệt</button><button class="s" data-ac="sua" data-id="'+Es(p.id)+'">✎ Cần sửa</button><button class="h" data-ac="huy" data-id="'+Es(p.id)+'">✕ Hủy</button>':
   p.tt==='Đã duyệt'?'<button class="s" data-ac="sua" data-id="'+Es(p.id)+'">✎ Cần sửa</button><button class="h" data-ac="huy" data-id="'+Es(p.id)+'">✕ Hủy</button>':'<button class="h" data-ac="huy" data-id="'+Es(p.id)+'">✕ Hủy</button>')+'</div></div></div>'}).join('')+'</div>'
  :'<div class="ghi" style="padding:20px;text-align:center">Không có bài nào ở mục này.</div>');
 if(!g){g=d.createElement('div');g.className='oniGal';R.parentNode.insertBefore(g,R)}
 if(g.__h===h)return;g.__h=h;g.innerHTML=h;
 g.querySelectorAll('[data-loc]').forEach(b=>b.onclick=()=>{loc=b.dataset.loc;ve()});
 g.querySelectorAll('[data-to]').forEach(b=>b.onclick=()=>phong(b.dataset.to,b.dataset.t));
 g.querySelectorAll('[data-ac]').forEach(b=>b.onclick=()=>{const id=b.dataset.id,a=b.dataset.ac;try{if(a==='duyet')window.mkDuyet(id);else if(a==='sua')window.mkSua(id);else window.mkHuy(id)}catch(e){console.warn(e)}setTimeout(()=>{g.__h='';ve();try{const r=d.getElementById('m5Root');if(r&&window.go)go(r.dataset.p)}catch(e){}},300)})}
setInterval(()=>{const a=d.querySelector('aside a.on');if(a&&a.dataset.p==='mkd')ve();else{const g=d.querySelector('.oniGal');if(g&&!(d.getElementById('m5Root')||{}).dataset)g.remove()}},1200);
/* các ảnh nhỏ khác trong trang Marketing: bấm cũng phóng to */
d.addEventListener('click',e=>{const im=e.target.closest&&e.target.closest('.m5-th,.m5-kim');if(im&&im.src){e.stopPropagation();e.preventDefault();phong(im.src,im.alt||'')}},true);
}catch(e){console.warn('oniGal',e)}})();
