function page(authorized) {
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>SHANTA — إدارة المتجر</title><link rel="stylesheet" href="/css/owner.css"><script src="/js/owner-gallery.js" defer></script><script src="/js/owner.js" defer></script></head><body><header><a href="/" class="brand">SHANTA <span>شنطة</span></a><span>مساحة المالك الخاصة</span></header><main><p class="eyebrow">OWNER ACCESS</p>${authorized ? `
    <div class="heading"><div><h1>منتجاتك، بطريقتك.</h1><p>أضف وعدّل واحذف منتجات متجرك من مكان واحد.</p></div><button id="logout" class="secondary">تسجيل الخروج</button></div>
    <div class="toolbar"><button id="add">+ إضافة منتج</button><button id="reload" class="secondary">تحديث القائمة</button><a href="/" target="_blank" rel="noopener">عرض المتجر ↗</a></div>
    <p id="status" role="status" aria-live="polite">جارٍ تحميل المنتجات…</p><section id="list" class="grid" aria-label="المنتجات"></section>
    <dialog id="editor"><form id="productForm"><div class="heading"><h2 id="editorTitle">تعديل المنتج</h2><button type="button" id="close" class="secondary">إغلاق</button></div><p id="formStatus" role="status" aria-live="polite"></p><div class="fields">
      <label>اسم المنتج<input name="code" required maxlength="120"></label><label>كود المنتج<input name="codeBadge" required maxlength="30"></label>
      <label>السعر بالجنيه<input name="price" type="number" min="0" max="1000000" step="0.01" required></label>
      <label>التصنيف<select name="category"><option>كلاسيك وسهرة</option><option>ألوان ناعمة</option><option>موديلات طولية</option></select></label>
      <label>اسم اللون<input name="color" required maxlength="120"></label><label>درجة اللون<input name="colorHex" type="color" value="#1c1c1e"></label>
      <label class="wide">الوصف<textarea name="shortDescription" maxlength="2000" rows="3"></textarea></label>
      <section class="wide" aria-label="إدارة صور المنتج"><h3>صور المنتج <span id="photoCount"></span></h3>
        <label>إضافة صور (يمكن اختيار أكثر من صورة معاً)<input id="upload" type="file" multiple accept="image/jpeg,image/png,image/webp"></label>
        <p class="note">حتى 12 صورة لكل منتج، بحد أقصى 2 MB للصورة. اختر الغلاف ورتّب الصور أو أزلها، ثم اضغط حفظ ونشر.</p>
        <div id="ownerGallery" class="owner-gallery"></div>
        <details><summary>إضافة الصور بروابط مباشرة</summary><label>رابط صورة الغلاف أو مسارها<input name="image" required maxlength="2000" dir="ltr" placeholder="https://…"></label><label>صور المعرض (رابط أو مسار لكل سطر)<textarea name="images" rows="4" dir="ltr"></textarea></label></details>
      </section>
      <label>الأبعاد<input name="dimensions" maxlength="1000"></label><label>نوع الخيط<input name="yarnType" maxlength="1000"></label>
      <label>الإكسسوارات<input name="hardware" maxlength="1000"></label><label>البطانة<input name="lining" maxlength="1000"></label>
      <label>وقت الصناعة<input name="craftingHours" maxlength="1000"></label><label class="wide">المميزات (ميزة في كل سطر، حتى 12)<textarea name="highlights" rows="3"></textarea></label>
    </div><div class="toolbar"><button id="save" type="submit">حفظ ونشر</button><button type="button" id="cancel" class="secondary">إلغاء</button></div><p class="note">الحفظ يُحدّث الكتالوج. يظهر التغيير في المتجر بعد اكتمال نشر Vercel، عادة خلال دقيقة.</p></form></dialog>
    <dialog id="deleteDialog"><h2>حذف المنتج؟</h2><p id="deleteName"></p><p>سيختفي من المتجر بعد النشر. تبقى النسخة السابقة في سجل GitHub.</p><p id="deleteStatus" role="status"></p><div class="toolbar"><button id="confirmDelete" class="danger">حذف المنتج</button><button id="cancelDelete" class="secondary">إلغاء</button></div></dialog>
    ` : `
    <section class="login"><h1>متجرك. تحت سيطرتك.</h1><p>تسجيل الدخول متاح فقط لحساب GitHub الخاص بمالك المتجر: <b dir="ltr">KaremEhab</b>.</p><form id="loginForm"><label>رمز GitHub الشخصي<input id="token" type="password" autocomplete="off" required placeholder="github_pat_…" dir="ltr" maxlength="500"></label><button id="loginButton" type="submit">دخول إدارة المنتجات</button><p id="status" role="status" aria-live="polite"></p></form><details><summary>إعداد الدخول لأول مرة</summary><ol><li>افتح <a href="https://github.com/settings/personal-access-tokens/new?name=SHANTA%20Owner&description=Manage%20SHANTA%20products" target="_blank" rel="noopener noreferrer">إنشاء رمز GitHub محدود الصلاحيات</a> بحساب KaremEhab.</li><li>اختر Resource owner: KaremEhab وحدد تاريخ انتهاء مناسب.</li><li>اختر Only select repositories، ثم shanta-bags.</li><li>من Repository permissions، امنح Contents صلاحية Read and write. تبقى Metadata على Read-only.</li><li>أنشئ الرمز وأدخله هنا. احتفظ به في مدير كلمات المرور. لا ترسله في أي محادثة.</li></ol><p>الجلسة مشفرة وتنتهي بعد 8 ساعات. يمكنك إلغاء الرمز من GitHub في أي وقت. لا توجد حسابات إدارة أخرى أو تسجيل حساب جديد.</p></details></section>`}</main></body></html>`;
}
module.exports = {page};
