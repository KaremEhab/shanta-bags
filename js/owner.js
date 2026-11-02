'use strict';
const $ = id=>document.getElementById(id);
const localPreviews = new Map();
let selectedPurposes = [];
const suggestedPurposes = ['العمل','خروجات يومية','خروجات نهارية','عشاء','سهرة','مناسبات','لقاءات','سفر','جامعة','هدية'];
let catalog={products:[],sha:''}, editing=null, deleting=null, dirty=false, busy=false;
async function api(path, method='GET', data) {
  const response=await fetch(path,{method,credentials:'same-origin',cache:'no-store',headers:data?{'Content-Type':'application/json'}:{},body:data?JSON.stringify(data):undefined});
  let value;try{value=await response.json();}catch{throw new Error('تعذر الاتصال بالخادم. حاول مرة أخرى.');}
  if(!response.ok) {
    if(response.status===401 && !$('loginForm')) throw new Error('انتهت الجلسة. احتفظ بتعديلاتك ثم أعد فتح صفحة المالك لتسجيل الدخول.');
    throw new Error(value.error || 'تعذر إتمام العملية.');
  }
  return value;
}
function status(message,id='status'){ $(id).textContent=message; }
function lock(value){busy=value;document.body.classList.toggle('busy',value);document.querySelectorAll('button').forEach(b=>b.disabled=value || b.dataset.unavailable==='true');document.querySelectorAll('#productForm input, #productForm textarea, #productForm select').forEach(field=>field.disabled=value);}
$('loginForm')?.addEventListener('submit',async e=>{
  e.preventDefault();lock(true);status('جارٍ التحقق من حساب المالك…');
  try{await api('/api/owner','POST',{token:$('token').value.trim()});$('token').value='';location.assign('/owner');}
  catch(error){status(error.message);$('token').value='';}finally{lock(false);}
});
function render(){
  $('list').replaceChildren();
  for(const p of catalog.products){
    const card=document.createElement('article');card.className='card';
    const img=document.createElement('img');img.src=p.image;img.alt=p.code;img.loading='lazy';
    const section=document.createElement('section'),title=document.createElement('h2'),detail=document.createElement('p'),actions=document.createElement('div');
    title.textContent=p.code;detail.textContent=`${p.priceFormatted} · ${p.color}`;actions.className='toolbar';
    const edit=document.createElement('button');edit.textContent='تعديل';edit.onclick=()=>openEditor(p);
    const remove=document.createElement('button');remove.className='secondary';remove.textContent='حذف';remove.onclick=()=>{deleting=p; $('deleteName').textContent=p.code;status('','deleteStatus');$('deleteDialog').showModal();};
    actions.append(edit,remove);section.append(title,detail,actions);card.append(img,section);$('list').append(card);
  }
}
async function load(){lock(true);try{catalog=await api('/api/products');render();status(catalog.products.length?`${catalog.products.length} منتجات. حساب المالك متصل.`:'لا توجد منتجات. أضف أول منتج.');}catch(e){status(e.message);}finally{lock(false);}}
function openEditor(p){
  releasePreviews();editing=p;dirty=false;$('productForm').reset();$('upload').value='';
  const next=Math.max(0,...catalog.products.map(p=>p.id))+1;
  const values=p||{code:'',codeBadge:`#${String(next).padStart(2,'0')}`,price:500,purposes:[],color:'',colorHex:'#1c1c1e',image:'',shortDescription:'',highlights:[],specs:{}};
  for(const [key,value]of Object.entries({...values,...values.specs,images:(values.images || [values.image]).filter(Boolean).join("\n"),highlights:values.highlights.join('\n')})){
    const field=$('productForm').elements.namedItem(key);if(field)field.value=value;
  }
  selectedPurposes=[...(values.purposes || (values.category ? [values.category] : []))];
  $('purposeInput').value='';status('','purposeStatus');renderPurposes();
  $('editorTitle').textContent=p?'تعديل المنتج':'إضافة منتج';status('','formStatus');renderOwnerGallery();$('editor').showModal();
}
function renderPurposes(){
  $('selectedPurposes').replaceChildren();$('purposeSuggestions').replaceChildren();
  selectedPurposes.forEach(purpose=>{
    const button=document.createElement('button');button.type='button';button.className='purpose-tag is-selected';button.textContent=purpose+' ×';button.setAttribute('aria-label',`إزالة استخدام ${purpose}`);button.disabled=busy;
    button.onclick=()=>{if(busy)return;selectedPurposes=selectedPurposes.filter(p=>p!==purpose);dirty=true;renderPurposes();};$('selectedPurposes').append(button);
  });
  const suggestions=[...new Set([...suggestedPurposes,...catalog.products.flatMap(p=>p.purposes || [p.category])])].filter(Boolean);
  suggestions.filter(p=>!selectedPurposes.includes(p)).forEach(purpose=>{
    const button=document.createElement('button');button.type='button';button.className='purpose-tag';button.textContent='+ '+purpose;button.disabled=busy;button.onclick=()=>{if(!busy)addPurpose(purpose);};$('purposeSuggestions').append(button);
  });
}
function addPurpose(value){
  const purpose=value.trim();if(!purpose)return false;
  if(purpose.length>60){status('استخدم اسماً لا يتجاوز 60 حرفاً.','purposeStatus');return false;}
  if(selectedPurposes.includes(purpose)){$('purposeInput').value='';status('','purposeStatus');return true;}
  if(selectedPurposes.length>=6){status('يمكن اختيار 6 استخدامات كحد أقصى.','purposeStatus');return false;}
  selectedPurposes.push(purpose);dirty=true;$('purposeInput').value='';status('','purposeStatus');renderPurposes();return true;
}
$('addPurpose')?.addEventListener('click',()=>addPurpose($('purposeInput').value));
$('purposeInput')?.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();addPurpose(event.target.value);}});
function releasePreviews(){for(const url of localPreviews.values())URL.revokeObjectURL(url);localPreviews.clear();}
function galleryPhotos(){const fields=$('productForm').elements;return OwnerGallery.photos(fields.image.value,fields.images.value.split('\n'));}
function setGallery(photos){const fields=$('productForm').elements;fields.image.value=photos[0] || '';fields.images.value=photos.join('\n');dirty=true;renderOwnerGallery();}
function renderOwnerGallery(){
  const photos=galleryPhotos();$('photoCount').textContent=`(${photos.length} / 12)`;$('ownerGallery').replaceChildren();
  if(!photos.length){const empty=document.createElement('p');empty.textContent='أضف صور المنتج لتظهر هنا.';$('ownerGallery').append(empty);return;}
  photos.forEach((src,index)=>{
    const card=document.createElement('article');card.className='owner-photo';
    const img=document.createElement('img');img.src=localPreviews.get(src)||src;img.alt=`صورة المنتج ${index+1}`;
    const label=document.createElement('p');label.textContent=index===0?'صورة الغلاف':`صورة ${index+1}`;
    const actions=document.createElement('div');actions.className='photo-actions';
    const action=(title,callback,unavailable=false)=>{const b=document.createElement('button');b.type='button';b.textContent=title;b.className='secondary';b.dataset.unavailable=String(unavailable);b.disabled=busy||unavailable;b.onclick=()=>{if(!busy)callback();};actions.append(b);};
    action('تعيين كغلاف',()=>setGallery([src,...photos.filter(p=>p!==src)]),index===0);
    action('تقديم',()=>{if(index>0){[photos[index-1],photos[index]]=[photos[index],photos[index-1]];setGallery(photos);}},index===0);
    action('تأخير',()=>{if(index<photos.length-1){[photos[index],photos[index+1]]=[photos[index+1],photos[index]];setGallery(photos);}},index===photos.length-1);
    action('إزالة',()=>{if(localPreviews.has(src)){URL.revokeObjectURL(localPreviews.get(src));localPreviews.delete(src);}setGallery(photos.filter(p=>p!==src));});
    card.append(img,label,actions);$('ownerGallery').append(card);
  });
}
function closeEditor(){if(busy)return;if(dirty&&!confirm('هل تريد إغلاق النموذج بدون حفظ التعديلات؟'))return;$('editor').close();dirty=false;releasePreviews();}
$('productForm')?.addEventListener('input',()=>{dirty=true;});
$('productForm')?.elements.image.addEventListener('input',renderOwnerGallery);
$('productForm')?.elements.images.addEventListener('input',renderOwnerGallery);
$('add')?.addEventListener('click',()=>openEditor(null));
$('close')?.addEventListener('click',closeEditor);$('cancel')?.addEventListener('click',closeEditor);
$('editor')?.addEventListener('cancel',e=>{e.preventDefault();closeEditor();});
$('reload')?.addEventListener('click',load);
$('logout')?.addEventListener('click',async()=>{lock(true);try{await api('/api/owner','DELETE');location.assign('/owner');}catch(e){status(e.message);lock(false);}});
$('upload')?.addEventListener('change',async()=>{
  const files=Array.from($('upload').files);if(!files.length)return;
  lock(true);
  try{
    const result=await OwnerGallery.uploadBatch(files,galleryPhotos(),async file=>{
      const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.onerror=()=>reject(new Error('تعذر قراءة الصورة.'));reader.readAsDataURL(file);});
      return (await api('/api/upload','POST',{data})).path;
    },(path,file)=>{localPreviews.set(path,URL.createObjectURL(file));setGallery([...galleryPhotos(),path]);},(index,total)=>status(`جارٍ رفع الصورة ${index} من ${total}…`,'formStatus'));
    if(result.failed)status(`تم رفع ${result.uploaded.length} صورة. تعذر رفع ${result.failed}: ${result.error}\nالصور الناجحة محفوظة في النموذج. أعد اختيار الصور المتبقية (${result.remaining}) للمحاولة مجدداً، ثم اضغط حفظ ونشر.`,'formStatus');
    else status(`تم رفع ${result.uploaded.length} صورة. اختر الغلاف ورتّب الصور، ثم اضغط حفظ ونشر.`,'formStatus');
  }catch(error){status(error.message,'formStatus');}finally{$('upload').value='';lock(false);}
});
$('productForm')?.addEventListener('submit',async e=>{
  e.preventDefault();
  const pendingPurpose=$('purposeInput').value.trim();
  if(pendingPurpose && !addPurpose(pendingPurpose))return;
  if(!selectedPurposes.length){status('أضف استخداماً واحداً على الأقل للمنتج.','purposeStatus');$('purposeInput').focus();return;}
  const data=Object.fromEntries(new FormData(e.target)),specs={};
  lock(true);status('جارٍ حفظ المنتج…','formStatus');
  for(const key of ['dimensions','yarnType','hardware','lining','craftingHours'])specs[key]=data[key];
  const product={...data,purposes:[...selectedPurposes],category:selectedPurposes[0],price:Number(data.price),specs,images:data.images.split('\n').map(x=>x.trim()).filter(Boolean),highlights:data.highlights.split('\n').map(x=>x.trim()).filter(Boolean)};
  try{catalog=await api('/api/products',editing?'PUT':'POST',{sha:catalog.sha,id:editing?.id,product});dirty=false;$('editor').close();releasePreviews();render();status('تم الحفظ في GitHub. سيظهر التغيير في المتجر بعد اكتمال نشر Vercel.');}
  catch(e){status(e.message,'formStatus');}finally{lock(false);}
});
$('cancelDelete')?.addEventListener('click',()=>$('deleteDialog').close());
$('deleteDialog')?.addEventListener('cancel',e=>{if(busy)e.preventDefault();});
$('confirmDelete')?.addEventListener('click',async()=>{
  lock(true);status('جارٍ الحذف…','deleteStatus');try{catalog=await api('/api/products','DELETE',{id:deleting.id,sha:catalog.sha});$('deleteDialog').close();render();status('تم حذف المنتج من الكتالوج. سيظهر التغيير بعد اكتمال النشر.');}catch(e){status(e.message,'deleteStatus');}finally{lock(false);}
});
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
if($('list'))load();
