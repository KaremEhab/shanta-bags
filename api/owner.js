const {requireOwner, verifyOwner, github, REPO, seal, setCookie, sameOrigin, privateHeaders, fail, HttpError} = require('../server/security');
const {page} = require('../server/view');
module.exports = async (req,res) => {
  privateHeaders(res);
  try {
    if(req.method === 'GET') {
      let authorized=false;
      try { await requireOwner(req); authorized=true; } catch(e) { if(![401,403].includes(e.status)) throw e; }
      return res.status(200).send(page(authorized));
    }
    sameOrigin(req);
    if(req.method === 'POST') {
      const token = await verifyOwner(req.body?.token);
      await github(token, `/repos/${REPO}/contents/products.json?ref=main`);
      setCookie(res,seal(token));
      return res.status(200).json({ok:true});
    }
    if(req.method === 'DELETE') { setCookie(res,'',0); return res.status(200).json({ok:true}); }
    throw new HttpError(405,'Method not allowed.');
  } catch(e) { return fail(res,e); }
};
