const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const load = (p) => fs.readFileSync(path.join(root, p), 'utf8');
test('homepage includes visible checkout notification region', () => {
  assert.match(load('public/home/index.html'), /id="checkout-notice"[^>]*role="status"/);
  assert.match(load('public/home/home.css'), /checkout-notice\[data-state="success"\]/);
});
test('payment return verifies and clears before reloading cart', () => {
  const js = load('public/cart-demo/js/main.js');
  assert.match(js, /await reportCheckoutReturn\(\);/);
  assert.match(js, /showCheckoutNotice\(`Payment confirmed/);
  assert.match(js, /api\.completeCheckout\(sessionId\)/);
  assert.match(js, /status\.cartCleared/);
});
