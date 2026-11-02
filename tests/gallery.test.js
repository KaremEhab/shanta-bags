const {test}=require('node:test');
const assert=require('node:assert/strict');
const {photos,uploadBatch}=require('../js/owner-gallery');
const {page}=require('../server/view');
const file=(name,size=100,type='image/jpeg')=>({name,size,type});
test('gallery keeps the chosen cover first and deduplicates existing photos',()=>{
  assert.deepEqual(photos(' cover.jpg ',['side.jpg','cover.jpg','','model.jpg']),['cover.jpg','side.jpg','model.jpg']);
});
test('multiple photos upload in order, append to existing gallery and report progress',async()=>{
  let active=0;const progress=[],gallery=['existing.jpg'];
  const result=await uploadBatch([file('a'),file('b'),file('c')],gallery,async f=>{assert.equal(active++,0);await Promise.resolve();active--;return f.name+'.jpg';},path=>gallery.push(path),(i,n)=>progress.push([i,n]));
  assert.deepEqual(gallery,['existing.jpg','a.jpg','b.jpg','c.jpg']);assert.deepEqual(progress,[[1,3],[2,3],[3,3]]);assert.equal(result.failed,null);
});
test('too many photos, oversized files and unsupported formats fail before upload',async()=>{
  let calls=0;const send=()=>{calls++;};
  for(const [files,current]of [[[file('a'),file('b')],Array(11).fill('p')],[[file('big',3*1024*1024)],[]],[[file('bad',100,'image/svg+xml')],[]]]){
    await assert.rejects(uploadBatch(files,current,send,()=>{},()=>{}));
  }
  assert.equal(calls,0);
});
test('partial upload failure retains successful photos and reports remaining files',async()=>{
  const gallery=['cover.jpg'];
  const result=await uploadBatch([file('a'),file('b'),file('c')],gallery,async f=>{if(f.name==='b')throw new Error('Connection lost');return 'a.jpg';},path=>gallery.push(path),()=>{});
  assert.deepEqual(gallery,['cover.jpg','a.jpg']);assert.deepEqual(result.uploaded,['a.jpg']);assert.equal(result.failed,'b');assert.equal(result.remaining,2);
});
test('owner receives multi-photo controls while anonymous visitors only receive sign-in',()=>{
  assert.match(page(true),/id="upload"[^>]+multiple/);assert.match(page(true),/id="ownerGallery"/);
  assert(!page(false).includes('id="ownerGallery"'));assert(!page(false).includes('id="upload"'));
});
