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
