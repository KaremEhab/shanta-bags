const {requireOwner, sameOrigin, privateHeaders, fail, HttpError} = require('../server/security');
const {validate, readCatalog, writeCatalog} = require('../server/catalog');
module.exports = async (req,res) => {
  privateHeaders(res);
  try {
    if(req.method !== 'GET') sameOrigin(req);
    const token = await requireOwner(req);
    if(!['GET','POST','PUT','DELETE'].includes(req.method)) throw new HttpError(405,'Method not allowed.');
    const catalog = await readCatalog(token);
    if(req.method === 'GET') return res.status(200).json(catalog);
    const body = req.body || {};
    if(body.sha !== catalog.sha) throw new HttpError(409,'The catalog changed. Reload before saving again. Your form is still here.');
    let products = catalog.products;
    if(req.method === 'POST') {
      const product = validate({...body.product, id:Math.max(0,...products.map(p=>p.id))+1});
      products.push(product);
    } else {
      const index = products.findIndex(p=>p.id === body.id);
      if(index < 0) throw new HttpError(404,'Product not found. Reload the catalog.');
      if(req.method === 'DELETE') products.splice(index,1);
      else products[index] = validate({...body.product,id:body.id});
    }
    const result = await writeCatalog(token,products,catalog.sha,`Owner: ${req.method.toLowerCase()} product`);
    return res.status(200).json({products,sha:result.content.sha,commit:result.commit.sha});
  } catch(e) { return fail(res,e); }
};
