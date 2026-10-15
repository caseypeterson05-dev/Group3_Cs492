const base = process.env.BASE_URL || "http://127.0.0.1:3000";
const cartId = `smoke-${Date.now()}`;

async function request(path, options = {}) {
    const response = await fetch(`${base}${path}`, options);
    let body;

    try {
        body = await response.json();
    } catch {
        body = null;
    }

    return { response, body };
}

function pass(name, detail = "") {
    console.log(`PASS  ${name}${detail ? ` - ${detail}` : ""}`);
}

function fail(name, message) {
    console.error(`FAIL  ${name} - ${message}`);
    process.exitCode = 1;
}

async function check(name, callback) {
    try {
        const detail = await callback();
        pass(name, detail || "");
    } catch (error) {
        fail(name, error.message);
    }
}

async function main() {
    console.log(`Pizza Pie Parlor smoke test: ${base}`);
    console.log("");

    await check("Health", async () => {
        const { response, body } = await request("/api/health");
        if (!response.ok || body?.status !== "ok") {
            throw new Error("health endpoint did not return ok");
        }
        return `v${body.version}`;
    });

    await check("Restaurant", async () => {
        const { response, body } = await request("/api/restaurant");
        if (!response.ok || !body?.data?.name) {
            throw new Error("restaurant data missing");
        }
        return body.data.name;
    });

    await check("Menu", async () => {
        const { response, body } = await request("/api/menu");
        if (!response.ok || !body?.data?.categories?.length) {
            throw new Error("menu categories missing");
        }
        return `${body.data.categories.length} categories`;
    });

    await check("Promotions", async () => {
        const { response, body } = await request("/api/promotions");
        if (!response.ok || !Array.isArray(body?.data)) {
            throw new Error("promotion list missing");
        }
        return `${body.data.length} active`;
    });

    await check("Promo validation", async () => {
        const { response, body } = await request(
            "/api/promotions/validate",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: "PIZZA20", subtotal: 50 })
            }
        );

        if (
            !response.ok ||
            body?.valid !== true ||
            body?.pricing?.discountedSubtotal !== 40
        ) {
            throw new Error("PIZZA20 did not calculate $40 subtotal");
        }
        return "$50 -> $40";
    });

    await check("Cart merge", async () => {
        const headers = {
            "Content-Type": "application/json",
            "X-Cart-Id": cartId
        };

        const payload = {
            itemId: "classic-cheese",
            quantity: 2,
            customization: {
                sizeId: "large",
                crustId: "stuffed",
                toppingIds: ["pepperoni", "mushrooms"]
            }
        };

        const first = await request("/api/cart/items", {
            method: "POST",
            headers,
            body: JSON.stringify(payload)
        });

        if (first.response.status !== 201) {
            throw new Error("first cart add did not create a line");
        }

        payload.customization.toppingIds = ["mushrooms", "pepperoni"];

        const second = await request("/api/cart/items", {
            method: "POST",
            headers,
            body: JSON.stringify(payload)
        });

        if (
            second.response.status !== 200 ||
            second.body?.merged !== true ||
            second.body?.data?.items?.length !== 1 ||
            second.body?.data?.items?.[0]?.quantity !== 4
        ) {
            throw new Error("identical cart items did not merge");
        }

        return "identical x2 + x2 -> x4";
    });

    await check("Delivery radius", async () => {
        const { response, body } = await request(
            "/api/delivery/validate",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    latitude: 39.7395,
                    longitude: -104.9900
                })
            }
        );

        if (!response.ok || body?.deliverable !== true) {
            throw new Error("nearby coordinates were not deliverable");
        }
        return `${body.distanceMiles} mi`;
    });

    await check("Payment safety boundary", async () => {
        const { response, body } = await request(
            "/api/payments/create-session",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cardNumber: "4111111111111111" })
            }
        );

        if (response.status !== 400 || body?.success !== false) {
            throw new Error("raw card data was not rejected");
        }
        return "raw card data rejected";
    });

    await request("/api/cart", {
        method: "DELETE",
        headers: { "X-Cart-Id": cartId }
    });

    console.log("");
    if (process.exitCode) {
        console.error("Smoke test completed with failures.");
    } else {
        console.log("All smoke tests passed.");
    }
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
