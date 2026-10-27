const { test } = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const handlers = {};
let sessionOptions;
let couponOptions;
let couponCalls = 0;
let sessionCalls = 0;
const fakeConfig = {
  paymentProvider: 'stripe', stripeSecretKey: 'sk_test_FAKE_TEST_KEY_NOT_VALID',
  checkoutBaseUrl: 'http://127.0.0.1:3000', taxRate: 0.0725,
  stripeWebhookSecret: ''
};
const cart = {
  id: 'cart-test', instanceId: 'fake-cart-instance-1', revision: 3,
  items: [{ name: 'Pizza', quantity: 2, unitPrice: 25, lineTotal: 50 }],
  subtotal: 50, taxRate: 0.0725, tax: 3.62, total: 53.62
};
const fakeCartService = {
  getCart: () => cart,
  serializeCart: () => cart,
  clearPaidCart: () => true
};
class FakeStripe {
  constructor(key) {
    assert.equal(key, fakeConfig.stripeSecretKey);
    this.coupons = { create: async options => { couponCalls++; couponOptions = options; return { id: 'co_test_pizza' }; } };
    this.checkout = { sessions: {
      create: async options => {
        sessionCalls++;
        sessionOptions = options;
        return { url: 'https://checkout.stripe.com/c/pay/sandbox-demo' };
      },
      retrieve: async () => ({
        livemode: false, client_reference_id: 'cart-test', payment_status: 'paid',
        amount_total: 4290, currency: 'usd', metadata: { promo_code: 'PIZZA20' },
        total_details: { amount_discount: 1000 }
      })
    } };
  }
}
const originalLoad = Module._load;
Module._load = function(specifier, parent, isMain) {
  if (specifier === 'express') return { Router: () => ({
    get: (path, handler) => { handlers[`GET ${path}`] = handler; },
    post: (path, handler) => { handlers[`POST ${path}`] = handler; }
  }) };
  if (specifier === 'stripe') return FakeStripe;
  if (specifier === '../config') return fakeConfig;
  if (specifier === '../services/cartService') return fakeCartService;
  return originalLoad.apply(this, arguments);
};
try { require('../src/routes/payments'); }
finally { Module._load = originalLoad; }
function res() { return { code: 200, status(n) { this.code = n; return this; }, setHeader() {}, json(body) { this.body = body; return this; } }; }
function req(body = {}) { return { body, query: { session_id: 'cs_test_demo' }, get: name => name.toLowerCase() === 'x-cart-id' ? 'cart-test' : undefined }; }

test('checkout validates PIZZA20, creates Stripe coupon, charges expected total', async () => {
  couponCalls = 0; sessionCalls = 0;
  const response = res();
  await handlers['POST /create-session'](req({ promoCode: 'PIZZA20', returnPage: '/home/' }), response);
  assert.equal(response.code, 201);
  assert.equal(response.body.data.discountCents, 1000);
  assert.equal(response.body.data.expectedTotalCents, 4290);
  assert.equal(couponCalls, 1);
  assert.equal(couponOptions.amount_off, 1000);
  assert.equal(couponOptions.currency, 'usd');
  assert.deepEqual(sessionOptions.discounts, [{ coupon: 'co_test_pizza' }]);
  const subtotalBeforeCoupon = sessionOptions.line_items.reduce((sum, line) => sum + line.price_data.unit_amount * line.quantity, 0);
  assert.equal(subtotalBeforeCoupon, 5290); // $50 pizza + $2.90 adjusted tax
  assert.equal(subtotalBeforeCoupon - couponOptions.amount_off, 4290);
  assert.equal(sessionOptions.metadata.promo_code, 'PIZZA20');
  assert.equal(sessionOptions.metadata.cart_instance, cart.instanceId);
  assert.equal(sessionOptions.metadata.cart_revision, String(cart.revision));
});

test('SAVE5 is a $5 discount, independently validated by backend', async () => {
  const response = res();
  await handlers['POST /create-session'](req({ promoCode: 'save5' }), response);
  assert.equal(response.code, 201);
  assert.equal(couponOptions.amount_off, 500);
  assert.equal(response.body.data.expectedTotalCents, 4826);
  assert.equal(sessionOptions.metadata.promo_code, 'SAVE5');
});

test('invalid promo fails closed rather than charging full price', async () => {
  const before = sessionCalls;
  const response = res();
  await handlers['POST /create-session'](req({ promoCode: 'NEVER_VALID' }), response);
  assert.equal(response.code, 400);
  assert.equal(sessionCalls, before);
});

test('without a promo, no coupon is created and cart total remains unchanged', async () => {
  const beforeCoupons = couponCalls;
  const response = res();
  await handlers['POST /create-session'](req({}), response);
  assert.equal(response.code, 201);
  assert.equal(couponCalls, beforeCoupons);
  assert.equal(sessionOptions.discounts, undefined);
  assert.equal(response.body.data.expectedTotalCents, 5362);
});

test('return lookup reports matching applied promo', async () => {
  const response = res();
  await handlers['GET /session'](req(), response);
  assert.equal(response.code, 200);
  assert.equal(response.body.data.paid, true);
  assert.equal(response.body.data.promoCode, 'PIZZA20');
  assert.equal(response.body.data.discountCents, 1000);
});
