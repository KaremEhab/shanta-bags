'use strict';
const $ = id=>document.getElementById(id);
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
function lock(value){busy=value;document.body.classList.toggle('busy',value);document.querySelectorAll('button').forEach(b=>b.disabled=value);$('upload')?.toggleAttribute('disabled',value);}
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
  editing=p;dirty=false;$('productForm').reset();$('upload').value='';
  const next=Math.max(0,...catalog.products.map(p=>p.id))+1;
  const values=p||{code:'',codeBadge:`#${String(next).padStart(2,'0')}`,price:500,category:'كلاسيك وسهرة',color:'',colorHex:'#1c1c1e',image:'',shortDescription:'',highlights:[],specs:{}};
  for(const [key,value]of Object.entries({...values,...values.specs,images:(values.images || [values.image]).filter(Boolean).join("\n"),highlights:values.highlights.join('\n')})){
    const field=$('productForm').elements.namedItem(key);if(field)field.value=value;
  }
  $('editorTitle').textContent=p?'تعديل المنتج':'إضافة منتج';status('','formStatus');preview();$('editor').showModal();
}
function preview(){const value=$('productForm').elements.image.value;$('preview').hidden=!value;if(value)$('preview').src=value;}
function closeEditor(){if(busy)return;if(dirty&&!confirm('هل تريد إغلاق النموذج بدون حفظ التعديلات؟'))return;$('editor').close();dirty=false;}
$('productForm')?.addEventListener('input',()=>{dirty=true;});
$('productForm')?.elements.image.addEventListener('input',preview);
$('add')?.addEventListener('click',()=>openEditor(null));
$('close')?.addEventListener('click',closeEditor);$('cancel')?.addEventListener('click',closeEditor);
$('editor')?.addEventListener('cancel',e=>{e.preventDefault();closeEditor();});
$('reload')?.addEventListener('click',load);
$('logout')?.addEventListener('click',async()=>{lock(true);try{await api('/api/owner','DELETE');location.assign('/owner');}catch(e){status(e.message);lock(false);}});
$('upload')?.addEventListener('change',async()=>{
  const file=$('upload').files[0];if(!file)return;
  if(file.size>2*1024*1024){status('اختر صورة لا تتجاوز 2 MB.','formStatus');return;}
  lock(true);status('جارٍ رفع الصورة…','formStatus');
  try{
    const data=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result.split(',')[1]);r.onerror=reject;r.readAsDataURL(file);});
    const result=await api('/api/upload','POST',{data});const fields=$('productForm').elements;
    if(!fields.image.value)fields.image.value=result.path;
    fields.images.value=[fields.images.value.trim(),result.path].filter(Boolean).join('\n');dirty=true;
    $('preview').src=URL.createObjectURL(file);$('preview').hidden=false;status('تم رفع الصورة. اضغط حفظ ونشر لربطها بالمنتج.','formStatus');
  }catch(e){status(e.message,'formStatus');}finally{lock(false);}
});
$('productForm')?.addEventListener('submit',async e=>{
  e.preventDefault();lock(true);status('جارٍ حفظ المنتج…','formStatus');
  const data=Object.fromEntries(new FormData(e.target)),specs={};
  for(const key of ['dimensions','yarnType','hardware','lining','craftingHours'])specs[key]=data[key];
  const product={...data,price:Number(data.price),specs,images:data.images.split('\n').map(x=>x.trim()).filter(Boolean),highlights:data.highlights.split('\n').map(x=>x.trim()).filter(Boolean)};
  try{catalog=await api('/api/products',editing?'PUT':'POST',{sha:catalog.sha,id:editing?.id,product});dirty=false;$('editor').close();render();status('تم الحفظ في GitHub. سيظهر التغيير في المتجر بعد اكتمال نشر Vercel.');}
  catch(e){status(e.message,'formStatus');}finally{lock(false);}
});
$('cancelDelete')?.addEventListener('click',()=>$('deleteDialog').close());
$('deleteDialog')?.addEventListener('cancel',e=>{if(busy)e.preventDefault();});
$('confirmDelete')?.addEventListener('click',async()=>{
  lock(true);status('جارٍ الحذف…','deleteStatus');try{catalog=await api('/api/products','DELETE',{id:deleting.id,sha:catalog.sha});$('deleteDialog').close();render();status('تم حذف المنتج من الكتالوج. سيظهر التغيير بعد اكتمال النشر.');}catch(e){status(e.message,'deleteStatus');}finally{lock(false);}
});
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
if($('list'))load();
