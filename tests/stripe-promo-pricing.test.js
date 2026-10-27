const { test } = require('node:test');
const assert = require('node:assert/strict');
const { checkoutPricing } = require('../src/services/checkoutPricing');
const sample = { subtotal: 50, taxRate: 0.0725, tax: 3.62, total: 53.62 };

test('no promo preserves pre-existing total and tax', () => {
  const pricing = checkoutPricing(sample, null);
  assert.equal(pricing.valid, true);
  assert.equal(pricing.discountCents, 0);
  assert.equal(pricing.taxCents, 362);
  assert.equal(pricing.totalCents, 5362);
});
test('20% promo is validated server-side and tax is recalculated', () => {
  const p = checkoutPricing(sample, ' pizza20 ');
  assert.equal(p.valid, true);
  assert.equal(p.promoCode, 'PIZZA20');
  assert.equal(p.discountCents, 1000);
  assert.equal(p.taxCents, 290);
  assert.equal(p.totalCents, 4290);
});
test('fixed-dollar promo is validated server-side', () => {
  const p = checkoutPricing(sample, 'SAVE5');
  assert.equal(p.valid, true);
  assert.equal(p.discountCents, 500);
  assert.equal(p.taxCents, 326);
  assert.equal(p.totalCents, 4826);
});
test('invalid, inactive or ineligible promo is rejected', () => {
  for (const code of ['NOTREAL','PIZZA20'.repeat(9),32]) {
    assert.equal(checkoutPricing(sample, code).valid, false);
  }
  assert.equal(checkoutPricing({ ...sample, subtotal: 9 }, 'PIZZA20').valid, false);
});
