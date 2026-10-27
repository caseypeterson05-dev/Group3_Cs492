const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
function read(p){return fs.readFileSync(path.join(root,p),'utf8')}
test('homepage exposes Stripe checkout controls without replacing restaurant design',()=>{
  const html=read('public/home/index.html');
  assert.match(html,/id="restaurant-name"/);
  assert.match(html,/id="checkout-stripe"/);
  assert.match(html,/id="checkout-result"/);
});
test('both pages share Stripe checkout module and retain original cart interactions',()=>{
  assert.match(read('public/team-demo.html'),/id="checkout-stripe"/);
  assert.match(read('public/cart-demo/js/main.js'),/api\.startCheckout\(promoPreview\?\.code/);
  assert.match(read('public/cart-demo/js/main.js'),/window\.location\.pathname/);
});
test('server limits Checkout return URLs to local demo pages',()=>{
  const code=read('src/routes/payments.js');
  assert.match(code,/req\.body\?\.returnPage === "\/team-demo\.html"/);
  assert.match(code,/"\/home\/"/);
  assert.match(code,/payment_status/);
});
