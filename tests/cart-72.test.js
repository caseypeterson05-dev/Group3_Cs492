const test = require("node:test");
const assert = require("node:assert/strict");
const cart = require("../src/services/cartService");

test.beforeEach(() => cart.resetAllCarts());

test("cart totals and serialized snapshots do not expose mutable state", () => {
    const a = cart.addItem("a", { itemId: "garlic-knots", quantity: 2 });
    assert.equal(a.valid, true);
    const snapshot = cart.serializeCart(cart.getCart("a"));
    assert.equal(snapshot.items.length, 1);
    assert.equal(snapshot.subtotal, Number((snapshot.items[0].unitPrice * 2).toFixed(2)));
    snapshot.items[0].quantity = 80;
    snapshot.items[0].customization.toppingIds.push("test");
    assert.equal(cart.serializeCart(cart.getCart("a")).items[0].quantity, 2);
    assert.deepEqual(cart.serializeCart(cart.getCart("a")).items[0].customization.toppingIds, []);
});

test("rejects malformed item requests and nonnumeric JSON quantity", () => {
    for (const payload of [null, [], {}, {itemId:"garlic-knots", quantity:"2"}, {itemId:"garlic-knots", customization:{toppingIds:"mushrooms"}}]) {
        assert.equal(cart.addItem("a", payload).valid, false);
    }
    const added = cart.addItem("a", {itemId:"garlic-knots"});
    assert.equal(added.valid, true);
    assert.equal(cart.updateItem("a", added.line.lineId, "3").valid, false);
});

test("cart operations do not alter a different cart", () => {
    const item = cart.addItem("first", {itemId:"garlic-knots"});
    assert.equal(cart.serializeCart(cart.getCart("second")).items.length, 0);
    assert.equal(cart.removeItem("second", item.line.lineId).notFound, true);
    assert.equal(cart.serializeCart(cart.getCart("first")).items.length, 1);
    cart.clearCart("first");
    assert.equal(cart.serializeCart(cart.getCart("first")).items.length, 0);
});
