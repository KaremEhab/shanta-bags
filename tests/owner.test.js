const {test,beforeEach,afterEach}=require('node:test');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const security=require('../server/security');
const products=require('../api/products');
const owner=require('../api/owner');
const upload=require('../api/upload');
const {validate}=require('../server/catalog');
const initial=require('../products.json');
const originalFetch=global.fetch;
function res(){return {headers:{},setHeader(k,v){this.headers[k]=v;},status(n){this.code=n;return this;},json(body){this.body=body;return this;},send(body){this.body=body;return this;}};}
function req(method,body,token){return {method,body,headers:{origin:'https://shanta-bags.vercel.app',cookie:token?`__Host-shanta-owner=${security.seal(token)}`:''}};}
beforeEach(()=>{process.env.OWNER_SESSION_KEY='a'.repeat(64);});
afterEach(()=>{global.fetch=originalFetch;});
test('sessions encrypt token, reject tampering, wrong key and expiration',()=>{
  const value=security.seal('secret-token');assert(!value.includes('secret-token'));assert.equal(security.unseal(value),'secret-token');
  const b=Buffer.from(value,'base64url');b[20]^=1;assert.equal(security.unseal(b.toString('base64url')),null);
  process.env.OWNER_SESSION_KEY='b'.repeat(64);assert.equal(security.unseal(value),null);
  process.env.OWNER_SESSION_KEY='a'.repeat(64);const now=Date.now;Date.now=()=>now()+9*3600*1000;try{assert.equal(security.unseal(value),null);}finally{Date.now=now;}
});
test('anonymous visitors receive login only and no dashboard',async()=>{const r=res();await owner(req('GET'),r);assert.equal(r.code,200);assert(r.body.includes('id="loginForm"'));assert(!r.body.includes('id="productForm"'));assert.match(r.headers['Cache-Control'],/no-store/);});
test('every product mutation and read requires authentication',async()=>{for(const method of ['GET','POST','PUT','DELETE']){const r=res();await products(req(method,{}),r);assert.equal(r.code,401);}});
test('a valid GitHub token belonging to someone else is denied',async()=>{global.fetch=async()=>({ok:true,json:async()=>({id:123})});const r=res();await owner(req('POST',{token:'other-user'}),r);assert.equal(r.code,403);assert(!r.headers['Set-Cookie']);});
test('CSRF and missing origins are rejected before any write',async()=>{for(const origin of ['https://evil.example',undefined]){const r=res(),q=req('POST',{});q.headers.origin=origin;await products(q,r);assert.equal(r.code,403);}});
test('only immutable owner ID gets a secure session',async()=>{global.fetch=async(url)=>({ok:true,json:async()=>url.endsWith('/user')?{id:130329660}:{content:'e30='}});const r=res();await owner(req('POST',{token:'owner-token'}),r);assert.equal(r.code,200);assert.match(r.headers['Set-Cookie'],/HttpOnly; Secure; SameSite=Strict/);});
test('catalog validator keeps existing products, custom prices and rejects malicious URLs',()=>{for(const p of initial)assert.equal(validate(p).id,p.id);assert.match(validate({...initial[0],price:799}).priceFormatted,/٧٩٩/);for(const image of ['javascript:alert(1)','data:image/svg+xml,<svg/>','//evil.com/x','assets/images/../../api/owner'])assert.throws(()=>validate({...initial[0],image}));assert.throws(()=>validate({...initial[0],price:NaN}));});
test('owner add edit delete persist full catalog and stale writes are rejected',async()=>{
  let stored=structuredClone(initial),sha='one',writes=0;
  global.fetch=async(url,options)=>{
    if(url.endsWith('/user'))return {ok:true,json:async()=>({id:130329660})};
    if(options.method==='PUT') {const body=JSON.parse(options.body);assert.equal(body.branch,'main');assert.equal(body.sha,sha);stored=JSON.parse(Buffer.from(body.content,'base64'));sha=String(++writes);return {ok:true,json:async()=>({content:{sha},commit:{sha:'commit'}})};}
    return {ok:true,json:async()=>({sha,content:Buffer.from(JSON.stringify(stored)).toString('base64')})};
  };
  let r=res();await products(req('POST',{sha,product:{...initial[0],code:'New bag',price:720}},'owner'),r);assert.equal(r.code,200);assert.equal(stored.length,11);assert.equal(stored[10].id,11);
  r=res();await products(req('PUT',{sha,id:11,product:{...stored[10],price:900}},'owner'),r);assert.equal(r.code,200);assert.equal(stored[10].price,900);
  r=res();await products(req('DELETE',{sha:'stale',id:11},'owner'),r);assert.equal(r.code,409);assert.equal(stored.length,11);
  r=res();await products(req('DELETE',{sha,id:11},'owner'),r);assert.equal(r.code,200);assert.equal(stored.length,10);assert.equal(writes,3);
});
test('unauthorized uploads and SVG uploads are rejected',async()=>{let r=res();await upload(req('POST',{data:'abcd'}),r);assert.equal(r.code,401);global.fetch=async()=>({ok:true,json:async()=>({id:130329660})});r=res();await upload(req('POST',{data:Buffer.from('<svg></svg>').toString('base64')},'owner'),r);assert.equal(r.code,400);});
