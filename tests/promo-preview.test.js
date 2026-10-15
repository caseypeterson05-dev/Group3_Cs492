const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
// The UI helper is an ES module; import it using a data URL in this Node test.
const source = fs.readFileSync(path.join(__dirname, '../public/cart-demo/js/promo-preview.js'), 'utf8');
const modulePromise = import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
test('promotion changes the preview total without mutating cart totals', async () => {
 const {createPromoPreview} = await modulePromise;
 const cart={subtotal:52.47,tax:3.80,total:56.27};
 const result=createPromoPreview(cart,{code:'PIZZA20',pricing:{discountAmount:10.49,originalSubtotal:52.47}});
 assert.deepEqual(result,{discount:10.49,estimatedTotal:45.78});
 assert.equal(cart.total,56.27);
});
test('old promo estimates are invalid after subtotal changes', async () => {
 const {createPromoPreview} = await modulePromise;
 assert.equal(createPromoPreview({subtotal:30,total:32,tax:2},{pricing:{discountAmount:10,originalSubtotal:50}}),null);
});
