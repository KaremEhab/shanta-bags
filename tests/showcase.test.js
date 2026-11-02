const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { modelSlides } = require('../js/showcase');
const products = require('../products.json');

test('every current bag has an existing model photo in the campaign, never its product cover', () => {
  const slides = modelSlides(products);
  assert.equal(slides.length, products.length);
  assert.deepEqual(slides.map(slide => slide.id), products.map(product => product.id));
  for (const slide of slides) {
    assert.notEqual(slide.image, products.find(product => product.id === slide.id).image);
    assert.ok(fs.existsSync(path.join(__dirname, '..', slide.image)));
    const bytes = fs.readFileSync(path.join(__dirname, '..', slide.image));
    assert.equal(bytes.subarray(0, 4).toString(), 'RIFF');
    assert.equal(bytes.subarray(8, 12).toString(), 'WEBP');
  }
});

test('product-only galleries are excluded rather than accidentally used as model advertising', () => {
  assert.deepEqual(modelSlides([{ id: 1, image: 'cover.webp', images: ['detail.webp'] }, { id: 2 }]), []);
});
