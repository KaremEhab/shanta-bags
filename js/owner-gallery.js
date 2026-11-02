(function (root) {
  'use strict';
  const MAX_PHOTOS = 12;
  function photos(cover, gallery) {
    return [...new Set([cover, ...gallery].map(value => String(value || '').trim()).filter(Boolean))];
  }
  async function uploadBatch(files, existing, send, onUploaded, onProgress) {
    if (existing.length + files.length > MAX_PHOTOS) throw new Error('يمكن إضافة 12 صورة كحد أقصى، بما فيها صورة الغلاف.');
    for (const file of files) {
      if (file.size > 2 * 1024 * 1024) throw new Error(`الصورة ${file.name} تتجاوز 2 MB. اختر صوراً أصغر.`);
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error(`الصورة ${file.name}: استخدم JPG أو PNG أو WebP.`);
    }
    const uploaded = [];
    for (let i = 0; i < files.length; i++) {
      onProgress(i + 1, files.length);
      try {
        const path = await send(files[i]);
        uploaded.push(path);
        onUploaded(path, files[i]);
      } catch (error) {
        return {uploaded, failed: files[i].name, error: error.message, remaining: files.length - i};
      }
    }
    return {uploaded, failed: null};
  }
  const api = {MAX_PHOTOS, photos, uploadBatch};
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.OwnerGallery = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
