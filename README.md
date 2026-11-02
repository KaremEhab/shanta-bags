# شنطة (Shanta) — Luxury Handmade Bag Boutique

تطبيق ويب معياري متكامل لبوتيك الحقائب اليدوية الفاخرة **"شنطة" (Shanta)**، مصمم وفق فلسفة **Apple Design System** بدعم أصيل للغة العربية (`RTL`) وتكامل مباشر للطلب الفوري عبر واتساب.

---

## 1. هيكل المشروع (Project Structure)

```text
shanta-store/
├── index.html              # الواجهة الرئيسية وبنية النافذة المنبثقة للتفاصيل
├── README.md               # توثيق المشروع وخطوات النشر
├── .gitignore              # استثناءات نظام التحكم بالإصدارات Git
├── css/
│   └── style.css           # نظام التصميم المستوحى من Apple (الألوان، الشبكة، الضبابية)
├── js/
│   ├── data.js             # بيانات الموديلات العشرة، المواصفات الفنية، وإعدادات المتجر
│   └── app.js              # منطق العرض الديناميكي، التصفية، المودال، وروابط واتساب
└── assets/
    ├── images/             # صور الحقائب عالية الدقة من bag-01.jpg إلى bag-10.jpg
    └── icons/              # الأيقونات المتجهة (SVG) والشعار المصغر
```

---

## 2. المواصفات التجارية والتقنية

- **العلامة التجارية**: شنطة (`Shanta`)
- **التسعير الموحد**: `٦٥٠ ج.م` (`650 EGP`) لجميع الموديلات العشرة.
- **نظام التكويد**: تعريف الموديلات حصرياً بالأكواد من `"شنطة كود #01"` إلى `"شنطة كود #10"`.
- **التصنيفات**:
  - `الكل`
  - `كلاسيك وسهرة`
  - `ألوان ناعمة`
  - `موديلات طولية`
- **تكامل واتساب المباشر**:
  - الرقم الدولي المعتمد: `201505765917` (`+201505765917`)
  - صيغة الرابط المشفر تلقائياً (`URI-Encoded`):
    ```text
    https://wa.me/201505765917?text=مرحباً شنطة، أود طلب: [كود الشنطة] | اللون: [اللون] | السعر: 650 ج.م
    ```

---

## 3. التشغيل المحلي والنشر السريع (Deployment)

### التشغيل محلياً
لا يتطلب المشروع أي أدوات بناء (Zero-Build). يمكنك فتح ملف `index.html` مباشرة في المتصفح أو تشغيل خادم محلي بسيط:

```bash
npx serve .
```

### النشر على GitHub Pages
1. ارفع الملفات إلى مستودع GitHub جديد.
2. انتقل إلى **Settings > Pages**.
3. اختر الفرع `main` والمجلد `/ (root)` ثم اضغط **Save**.

### النشر على Vercel
1. اربط المستودع بحسابك على Vercel.
2. اختر الإعداد الافتراضي (`Other / Static`) واضغط **Deploy**.

## Owner product manager

Production: https://shanta-bags.vercel.app/owner

The storefront reads `products.json`. The owner can create, edit and delete products,
change individual prices and upload JPG/PNG/WebP photos (up to 2 MB each). Updates
commit to `main`, and the existing Vercel Git integration publishes them. Previous
catalog versions remain in Git history. Removing a product does not delete its image
files from history or the repository.

Only the immutable GitHub user ID `130329660` (KaremEhab) is authorized, checked
against GitHub on every management request. Sign in with a fine-grained GitHub
personal access token restricted to this repository with Contents: read and write.
There is no public signup and no management link on the storefront. Unauthorized
visitors receive a sign-in screen, never product management data or controls.

Vercel requires `OWNER_SESSION_KEY`: a server-only random 32-byte hex encryption key.
Never commit it or use a public/client environment variable for it. Owner tokens are
encrypted in an authenticated AES-GCM session cookie, with Secure, HttpOnly,
SameSite=Strict, an 8-hour expiration, and no client-side token storage. Revoking the
GitHub token blocks subsequent requests. Rotating the key invalidates all sessions.
Mutations require the exact production Origin, and catalog writes use SHA concurrency
checks to avoid overwriting another tab's changes. Owner responses are never cached,
are marked noindex, and cannot be embedded in another site.

The repository is public: source code and published catalog data are public. This does
not confer owner permissions. The production owner route is not indexed or advertised;
its URL alone is not a credential. Direct API calls enforce the same owner checks.

`npm test` runs the security and persistence regression suite. A static-only host
(such as GitHub Pages) can serve the catalog but cannot run the owner API.

The original project overview above describes the initial 10-product catalog. Product
count, names and prices are now editable and are no longer constrained to that initial
catalog. GitHub Contents API and Git integration are the durable storage/publication
path; no additional database subscription is needed.

New products start at **500 EGP**, editable per product. Products may have up to 12
photos in `images`, including their `image` cover. The owner editor accepts one gallery
URL/path per line and appends uploaded photos. The storefront detail sheet supports
thumbnails, previous/next controls and touch swipes; older single-photo products
continue to work. Rimal (رِمال) is the first new named product with six supplied photos.

Owner photo management now supports selecting multiple files at once, previewing all
photos, picking a cover, changing their order and removing photos from the product.
Uploads run individually to stay below function request limits; failed batches retain
successful photos in the form. Save and publish commits the chosen gallery. The
original catalog entries #01–#10 have been removed; رِمال and newer products remain.
Storefront cards show the name, price and color; descriptions remain in the details.

Products now support 1–6 custom `purposes` tags (up to 60 characters each). The owner
can choose suggestions, add new tags, or remove selected tags. Existing saved tags
become suggestions for other products. `category` mirrors the first purpose for older
clients; it is no longer restricted to a fixed list. Cards use a full-cover photograph
with overlay copy/actions and show up to two purposes, with the rest in product details.
