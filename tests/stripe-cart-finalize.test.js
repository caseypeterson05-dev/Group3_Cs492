const { test } = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');

const handlers = {};
const sessions = new Map();
let counter = 0;
const config = {
  paymentProvider: 'stripe', stripeSecretKey: 'sk_test_NOT_A_REAL_KEY',
  checkoutBaseUrl: 'http://127.0.0.1:3000', taxRate: 0.0725,
  stripeWebhookSecret: ''
};
const fakeMenu = {
  calculateUnitPrice: () => ({
    valid: true,
    item: { id: 'pizza', name: 'Pizza' },
    unitPrice: 25,
    selected: { size: null, crust: null, toppings: [] }
  })
};
class FakeStripe {
  constructor(key) {
    assert.equal(key, config.stripeSecretKey);
    this.checkout = { sessions: {
      create: async options => {
        const id = `cs_test_local_${++counter}`;
        sessions.set(id, {
          livemode: false,
          client_reference_id: options.client_reference_id,
          payment_status: 'paid',
          amount_total: options.line_items.reduce((acc, item) => acc + item.price_data.unit_amount * item.quantity, 0),
          currency: 'usd',
          metadata: options.metadata,
          total_details: { amount_discount: 0 }
        });
        return { id, url: `https://checkout.stripe.com/c/pay/${id}` };
      },
      retrieve: async id => {
        if (!sessions.has(id)) throw new Error('No such session');
        return sessions.get(id);
      }
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
  if (specifier === '../config') return config;
  if (specifier === './menuService') return fakeMenu;
  return originalLoad.apply(this, arguments);
};
let cartService;
try {
  cartService = require('../src/services/cartService');
  require('../src/routes/payments');
} finally { Module._load = originalLoad; }

function req(cartId, body = {}) {
  return { body, query: {}, get: name => name.toLowerCase() === 'x-cart-id' ? cartId : undefined };
}
function res() {
  return {
    statusCode: 200, setHeader() {},
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
}
async function start(cartId) {
  const r = res();
  await handlers['POST /create-session'](req(cartId), r);
  assert.equal(r.statusCode, 201, JSON.stringify(r.body));
  return `cs_test_local_${counter}`;
}
async function complete(cartId, sessionId) {
  const r = res();
  await handlers['POST /complete-session'](req(cartId, { sessionId }), r);
  return r;
}
function add(cartId) {
  const result = cartService.addItem(cartId, { itemId: 'pizza', quantity: 1 });
  assert.equal(result.valid, true);
}

test('paid sandbox checkout clears the matching cart and replay cannot clear a new cart', async () => {
  const id = 'cart-clear-normal';
  add(id); add(id);
  const sessionId = await start(id);
  const paid = await complete(id, sessionId);
  assert.equal(paid.statusCode, 200);
  assert.equal(paid.body.data.paid, true);
  assert.equal(paid.body.data.cartCleared, true);
  assert.equal(cartService.getCart(id).items.length, 0);
  add(id);
  const replay = await complete(id, sessionId);
  assert.equal(replay.body.data.paid, true);
  assert.equal(replay.body.data.cartCleared, false);
  assert.equal(cartService.getCart(id).items.length, 1);
});

test('unpaid and canceled Checkout do not clear the cart', async () => {
  const id = 'cart-unpaid';
  add(id);
  const sessionId = await start(id);
  sessions.get(sessionId).payment_status = 'unpaid';
  const r = await complete(id, sessionId);
  assert.equal(r.body.data.paid, false);
  assert.equal(r.body.data.cartCleared, false);
  assert.equal(cartService.getCart(id).items.length, 1);
});

test('changes while customer is paying preserve the newer cart', async () => {
  const id = 'cart-changed';
  add(id);
  const sessionId = await start(id);
  add(id);
  const r = await complete(id, sessionId);
  assert.equal(r.body.data.paid, true);
  assert.equal(r.body.data.cartCleared, false);
  assert.equal(cartService.getCart(id).items[0].quantity, 2);
});

test('another cart ID cannot use the paid Checkout Session', async () => {
  const firstId = 'cart-A', secondId = 'cart-B';
  add(firstId); add(secondId);
  const sessionId = await start(firstId);
  const r = await complete(secondId, sessionId);
  assert.equal(r.statusCode, 403);
  assert.equal(cartService.getCart(firstId).items.length, 1);
  assert.equal(cartService.getCart(secondId).items.length, 1);
});

test('bad/missing session ID is rejected without touching a cart', async () => {
  const id = 'cart-malformed';
  add(id);
  const r = await complete(id, 'not-a-stripe-session');
  assert.equal(r.statusCode, 400);
  assert.equal(cartService.getCart(id).items.length, 1);
});

test('after a server in-memory cart reset, an old paid session cannot clear a new cart', async () => {
  const id = 'cart-after-restart';
  add(id);
  const sessionId = await start(id);
  cartService.resetAllCarts();
  add(id);
  const r = await complete(id, sessionId);
  assert.equal(r.body.data.paid, true);
  assert.equal(r.body.data.cartCleared, false);
  assert.equal(cartService.getCart(id).items.length, 1);
});
