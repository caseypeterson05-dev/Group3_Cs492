const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("http");

const { createApp } = require("../src/app");
const cartService = require("../src/services/cartService");

async function withServer(callback) {
    cartService.resetAllCarts();

    const app = createApp();
    const server = http.createServer(app);

    await new Promise(resolve => {
        server.listen(0, "127.0.0.1", resolve);
    });

    const address = server.address();
    const base = `http://127.0.0.1:${address.port}`;

    try {
        await callback(base);
    } finally {
        await new Promise(resolve => server.close(resolve));
    }
}

async function json(response) {
    return response.json();
}

test("health endpoint responds with version and request id", async () => {
    await withServer(async base => {
        const response = await fetch(`${base}/api/health`, {
            headers: { "X-Request-Id": "health-test" }
        });
        assert.equal(response.status, 200);
        assert.equal(response.headers.get("x-request-id"), "health-test");

        const body = await json(response);
        assert.equal(body.success, true);
        assert.equal(body.status, "ok");
        assert.equal(body.requestId, "health-test");
        assert.match(body.version, /^2\./);
    });
});

test("restaurant endpoint returns required fields", async () => {
    await withServer(async base => {
        const response = await fetch(`${base}/api/restaurant`);
        const body = await json(response);

        assert.equal(body.success, true);
        assert.ok(body.data.name);
        assert.ok(body.data.address);
        assert.ok(body.data.phone);
        assert.ok(body.data.hours);
        assert.ok(body.data.description);
    });
});

test("promotion validation calculates PIZZA20 correctly", async () => {
    await withServer(async base => {
        const response = await fetch(
            `${base}/api/promotions/validate`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    code: "PIZZA20",
                    subtotal: 50
                })
            }
        );

        const body = await json(response);

        assert.equal(body.valid, true);
        assert.equal(body.pricing.discountAmount, 10);
        assert.equal(body.pricing.discountedSubtotal, 40);
    });
});

test("promotion codes are trimmed and case-insensitive", async () => {
    await withServer(async base => {
        const response = await fetch(
            `${base}/api/promotions/validate`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    code: "  pizza20  ",
                    subtotal: 50
                })
            }
        );

        const body = await json(response);
        assert.equal(body.valid, true);
        assert.equal(body.promotion.code, "PIZZA20");
    });
});

test("fixed promotion calculates SAVE5 correctly", async () => {
    await withServer(async base => {
        const response = await fetch(
            `${base}/api/promotions/validate`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: "SAVE5", subtotal: 40 })
            }
        );

        const body = await json(response);
        assert.equal(body.valid, true);
        assert.equal(body.pricing.discountAmount, 5);
        assert.equal(body.pricing.discountedSubtotal, 35);
    });
});

test("promotion minimum subtotal failure is returned cleanly", async () => {
    await withServer(async base => {
        const response = await fetch(
            `${base}/api/promotions/validate`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: "PIZZA20", subtotal: 10 })
            }
        );

        const body = await json(response);
        assert.equal(response.status, 200);
        assert.equal(body.valid, false);
        assert.match(body.message, /minimum subtotal/i);
    });
});

test("invalid promotion subtotal is rejected", async () => {
    await withServer(async base => {
        const response = await fetch(
            `${base}/api/promotions/validate`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: "PIZZA20", subtotal: -1 })
            }
        );

        const body = await json(response);
        assert.equal(response.status, 400);
        assert.equal(body.valid, false);
    });
});

test("menu endpoint exposes categories and options", async () => {
    await withServer(async base => {
        const response = await fetch(`${base}/api/menu`);
        const body = await json(response);

        assert.equal(body.success, true);
        assert.ok(body.data.categories.length >= 3);
        assert.ok(body.data.options.toppings.length >= 1);
    });
});

test("invalid menu item is rejected", async () => {
    await withServer(async base => {
        const response = await fetch(
            `${base}/api/menu/price-preview`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ itemId: "not-a-real-item" })
            }
        );

        const body = await json(response);
        assert.equal(response.status, 400);
        assert.match(body.message, /not found/i);
    });
});

test("invalid topping is rejected", async () => {
    await withServer(async base => {
        const response = await fetch(
            `${base}/api/menu/price-preview`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    itemId: "classic-cheese",
                    customization: {
                        toppingIds: ["not-a-topping"]
                    }
                })
            }
        );

        const body = await json(response);
        assert.equal(response.status, 400);
        assert.match(body.message, /invalid topping/i);
    });
});

test("duplicate toppings are only charged once", async () => {
    await withServer(async base => {
        const response = await fetch(
            `${base}/api/menu/price-preview`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    itemId: "classic-cheese",
                    customization: {
                        toppingIds: ["pepperoni", "pepperoni"]
                    }
                })
            }
        );

        const body = await json(response);
        assert.equal(body.success, true);
        assert.equal(body.data.unitPrice, 12.49);
        assert.equal(body.data.selected.toppings.length, 1);
    });
});

test("cart supports add, view, update, and delete", async () => {
    await withServer(async base => {
        const headers = {
            "Content-Type": "application/json",
            "X-Cart-Id": "test-cart-lifecycle"
        };

        const addResponse = await fetch(`${base}/api/cart/items`, {
            method: "POST",
            headers,
            body: JSON.stringify({
                itemId: "pepperoni",
                quantity: 2,
                customization: {
                    sizeId: "medium",
                    crustId: "hand-tossed",
                    toppingIds: ["mushrooms"]
                }
            })
        });

        assert.equal(addResponse.status, 201);
        const added = await json(addResponse);
        assert.equal(added.data.items.length, 1);
        assert.equal(added.merged, false);

        const lineId = added.line.lineId;

        const updateResponse = await fetch(
            `${base}/api/cart/items/${lineId}`,
            {
                method: "PATCH",
                headers,
                body: JSON.stringify({ quantity: 3 })
            }
        );

        const updated = await json(updateResponse);
        assert.equal(updated.line.quantity, 3);

        const viewResponse = await fetch(`${base}/api/cart`, { headers });
        const viewed = await json(viewResponse);
        assert.equal(viewed.data.items[0].quantity, 3);

        const deleteResponse = await fetch(
            `${base}/api/cart/items/${lineId}`,
            { method: "DELETE", headers }
        );
        const deleted = await json(deleteResponse);
        assert.equal(deleted.data.items.length, 0);
    });
});

test("identical cart items merge even when topping order differs", async () => {
    await withServer(async base => {
        const headers = {
            "Content-Type": "application/json",
            "X-Cart-Id": "merge-cart"
        };

        const first = await fetch(`${base}/api/cart/items`, {
            method: "POST",
            headers,
            body: JSON.stringify({
                itemId: "classic-cheese",
                quantity: 2,
                customization: {
                    sizeId: "large",
                    crustId: "stuffed",
                    toppingIds: ["pepperoni", "mushrooms"]
                }
            })
        });
        assert.equal(first.status, 201);

        const second = await fetch(`${base}/api/cart/items`, {
            method: "POST",
            headers,
            body: JSON.stringify({
                itemId: "classic-cheese",
                quantity: 2,
                customization: {
                    sizeId: "large",
                    crustId: "stuffed",
                    toppingIds: ["mushrooms", "pepperoni"]
                }
            })
        });

        assert.equal(second.status, 200);
        const body = await json(second);
        assert.equal(body.merged, true);
        assert.equal(body.data.items.length, 1);
        assert.equal(body.data.items[0].quantity, 4);
        assert.equal(body.data.items[0].lineTotal, 83.96);
    });
});

test("different cart customizations remain separate lines", async () => {
    await withServer(async base => {
        const headers = {
            "Content-Type": "application/json",
            "X-Cart-Id": "separate-lines-cart"
        };

        for (const sizeId of ["small", "large"]) {
            await fetch(`${base}/api/cart/items`, {
                method: "POST",
                headers,
                body: JSON.stringify({
                    itemId: "classic-cheese",
                    quantity: 1,
                    customization: { sizeId }
                })
            });
        }

        const response = await fetch(`${base}/api/cart`, { headers });
        const body = await json(response);
        assert.equal(body.data.items.length, 2);
    });
});

test("bad cart quantity is rejected", async () => {
    await withServer(async base => {
        const response = await fetch(`${base}/api/cart/items`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                itemId: "classic-cheese",
                quantity: 0
            })
        });

        const body = await json(response);
        assert.equal(response.status, 400);
        assert.match(body.message, /quantity/i);
    });
});

test("separate X-Cart-Id values isolate carts", async () => {
    await withServer(async base => {
        await fetch(`${base}/api/cart/items`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Cart-Id": "cart-a"
            },
            body: JSON.stringify({ itemId: "garlic-knots", quantity: 1 })
        });

        const response = await fetch(`${base}/api/cart`, {
            headers: { "X-Cart-Id": "cart-b" }
        });
        const body = await json(response);
        assert.equal(body.data.items.length, 0);
    });
});

test("delivery validation returns an inside-radius decision", async () => {
    await withServer(async base => {
        const response = await fetch(`${base}/api/delivery/validate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                latitude: 39.7392,
                longitude: -104.9903
            })
        });

        const body = await json(response);
        assert.equal(body.success, true);
        assert.equal(body.deliverable, true);
        assert.equal(body.distanceMiles, 0);
    });
});

test("delivery validation returns an outside-radius decision", async () => {
    await withServer(async base => {
        const response = await fetch(`${base}/api/delivery/validate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ latitude: 40.7608, longitude: -111.8910 })
        });

        const body = await json(response);
        assert.equal(body.success, true);
        assert.equal(body.deliverable, false);
        assert.ok(body.distanceMiles > body.radiusMiles);
    });
});

test("invalid delivery coordinates are rejected", async () => {
    await withServer(async base => {
        const response = await fetch(`${base}/api/delivery/validate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ latitude: 999, longitude: 999 })
        });

        const body = await json(response);
        assert.equal(response.status, 400);
        assert.equal(body.deliverable, false);
    });
});

test("payment scaffold rejects raw card data", async () => {
    await withServer(async base => {
        const response = await fetch(
            `${base}/api/payments/create-session`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cardNumber: "4111111111111111" })
            }
        );

        const body = await json(response);
        assert.equal(response.status, 400);
        assert.equal(body.success, false);
        assert.match(body.message, /Raw card data/i);
    });
});

test("malformed JSON returns a controlled 400", async () => {
    await withServer(async base => {
        const response = await fetch(`${base}/api/promotions/validate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: "{broken-json"
        });

        const body = await json(response);
        assert.equal(response.status, 400);
        assert.equal(body.success, false);
        assert.match(body.message, /malformed json/i);
        assert.ok(body.requestId);
    });
});

test("unknown routes return a request id", async () => {
    await withServer(async base => {
        const response = await fetch(`${base}/definitely-not-a-route`);
        const body = await json(response);

        assert.equal(response.status, 404);
        assert.equal(body.success, false);
        assert.ok(body.requestId);
        assert.ok(response.headers.get("x-request-id"));
    });
});

test("security headers are present", async () => {
    await withServer(async base => {
        const response = await fetch(`${base}/api/health`);

        assert.equal(
            response.headers.get("x-content-type-options"),
            "nosniff"
        );
        assert.equal(
            response.headers.get("x-frame-options"),
            "DENY"
        );
        assert.ok(response.headers.get("content-security-policy"));
    });
});
