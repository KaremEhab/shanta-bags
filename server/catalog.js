const {HttpError, REPO, github} = require('./security');
function text(value, label, max=2000, required=false) {
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) throw new HttpError(400, `Invalid ${label}.`);
  return value.trim();
}
function image(value) {
  value = text(value, 'image URL', 2000, true);
  if (/^assets\/images\/[a-zA-Z0-9._-]+\.(jpg|jpeg|png|webp)$/i.test(value)) return value;
  try { const u = new URL(value); if(u.protocol === 'https:' && !u.username && !u.password) return value; } catch {}
  throw new HttpError(400,'Images must use HTTPS or an existing store image path.');
}
function validate(product) {
  if (!product || typeof product !== 'object' || !Number.isSafeInteger(product.id) || product.id < 1) throw new HttpError(400,'Invalid product ID.');
  const rawPurposes = product.purposes ?? [product.category];
  if (!Array.isArray(rawPurposes) || !rawPurposes.length || rawPurposes.length > 6) throw new HttpError(400,'Add between 1 and 6 purposes.');
  const purposes = [...new Set(rawPurposes.map(value => text(value,'purpose',60,true)))];
  if (typeof product.price !== 'number' || !Number.isFinite(product.price) || product.price < 0 || product.price > 1000000) throw new HttpError(400,'Invalid price.');
  if (!/^#[a-f0-9]{6}$/i.test(product.colorHex)) throw new HttpError(400,'Choose a valid color.');
  const p = {id:product.id, code:text(product.code,'product name',120,true), codeBadge:text(product.codeBadge,'code',30,true), category:purposes[0], purposes, color:text(product.color,'color',120,true), colorHex:product.colorHex, price:Math.round(product.price*100)/100};
  p.priceFormatted = `${new Intl.NumberFormat('ar-EG',{maximumFractionDigits:2}).format(p.price)} ج.م`;
  p.image = image(product.image); p.fallbackImage = p.image;
  const gallery = product.images ?? [p.image];
  if (!Array.isArray(gallery) || gallery.length > 12) throw new HttpError(400,'Use up to 12 gallery photos.');
  p.images = [...new Set([p.image, ...gallery.map(image)])];
  if (p.images.length > 12) throw new HttpError(400,'Use up to 12 gallery photos including the cover.');
  p.shortDescription = text(product.shortDescription,'description',2000);
  p.specs = {};
  for(const field of ['dimensions','yarnType','hardware','lining','craftingHours']) p.specs[field] = text(product.specs?.[field] ?? '',field,1000);
  if (!Array.isArray(product.highlights) || product.highlights.length > 12) throw new HttpError(400,'Use up to 12 highlights.');
  p.highlights = product.highlights.map(x=>text(x,'highlight',150,true));
  return p;
}
async function readCatalog(token) {
  const file = await github(token, `/repos/${REPO}/contents/products.json?ref=main`);
  return {sha:file.sha, products:JSON.parse(Buffer.from(file.content,'base64').toString('utf8'))};
}
async function writeCatalog(token, products, sha, message) {
  return github(token, `/repos/${REPO}/contents/products.json`, {method:'PUT',body:JSON.stringify({message,branch:'main',sha,content:Buffer.from(JSON.stringify(products,null,2)+'\n').toString('base64')})});
}
module.exports = {validate, image, readCatalog, writeCatalog};
