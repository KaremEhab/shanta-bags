const crypto = require('node:crypto');
const {requireOwner,sameOrigin,privateHeaders,fail,HttpError,github,REPO} = require('../server/security');
module.exports = async (req,res) => {
  privateHeaders(res);
  try {
    sameOrigin(req);
    const token = await requireOwner(req);
    if(req.method !== 'POST') throw new HttpError(405,'Method not allowed.');
    const {data} = req.body || {};
    if(typeof data !== 'string' || data.length > 2800000 || !/^[A-Za-z0-9+/]+={0,2}$/.test(data)) throw new HttpError(400,'Select an image under 2 MB.');
    const bytes = Buffer.from(data,'base64');
    let ext;
    if(bytes.subarray(0,3).equals(Buffer.from([255,216,255]))) ext='jpg';
    else if(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) ext='png';
    else if(bytes.toString('ascii',0,4)==='RIFF' && bytes.toString('ascii',8,12)==='WEBP') ext='webp';
    else throw new HttpError(400,'Use a JPG, PNG or WebP image.');
    const path=`assets/images/owner-${crypto.randomUUID()}.${ext}`;
    await github(token,`/repos/${REPO}/contents/${path}`,{method:'PUT',body:JSON.stringify({message:'Owner: upload product image',branch:'main',content:data})});
    return res.status(200).json({path});
  } catch(e) { return fail(res,e); }
};
