const express = require("express");
const Stripe = require("stripe");
const config = require("../config");
const cartService = require("../services/cartService");
const { checkoutPricing } = require("../services/checkoutPricing");

const router = express.Router();
const testKeyReady = () => config.paymentProvider === "stripe" &&
    /^sk_test_/.test(config.stripeSecretKey || "");

function stripeClient() {
    return new Stripe(config.stripeSecretKey);
}

function toCents(value) {
    return Math.round(Number(value) * 100);
}

function forbidsCardData(value) {
    const forbidden = /^(cardNumber|cvv|cvc|securityCode|expiration|expiry)$/i;
    if (!value || typeof value !== "object") return false;
    return Object.entries(value).some(([key, entry]) =>
        forbidden.test(key) || (typeof entry === "object" && forbidsCardData(entry))
    );
}

router.get("/status", (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({
        success: true,
        data: {
            provider: config.paymentProvider || null,
            configured: testKeyReady(),
            mode: "test-only",
            storesCardDataLocally: false,
            status: testKeyReady()
                ? "Stripe test-mode Checkout configured."
                : "Set PAYMENT_PROVIDER=stripe and STRIPE_SECRET_KEY=sk_test_... in local .env."
        }
    });
});

router.post("/create-session", async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    if (forbidsCardData(req.body)) {
        return res.status(400).json({
            success: false,
            message: "Raw card data must not be sent to this backend. Use Stripe-hosted Checkout."
        });
    }
    if (!testKeyReady()) {
        return res.status(503).json({
            success: false,
            message: "Stripe test mode isn't configured. Check your local .env and restart npm start."
        });
    }
    // This is a classroom prototype. A random cart ID is isolation, NOT user authentication.
    // Require the ID created by the frontend instead of the shared demo fallback.
    const cartId = req.get("X-Cart-Id");
    if (!cartId || !cartId.trim() || cartId.length > 100) {
        return res.status(400).json({
            success: false,
            message: "X-Cart-Id is required. Open /home/ and add an item."
        });
    }
    const liveCart = cartService.getCart(cartId);
    const cart = cartService.serializeCart(liveCart);
    if (!cart.items.length) {
        return res.status(400).json({ success: false, message: "Add an item to the cart first." });
    }

    // Only accept a CODE, never discount amounts or totals, from the browser.
    // The server validates it again against the current cart at payment time.
    const pricing = checkoutPricing(cart, req.body?.promoCode);
    if (!pricing.valid) {
        return res.status(400).json({ success: false, message: pricing.message });
    }

    // Price and tax are computed by the server. Do NOT accept totals from browser input.
    const lineItems = cart.items.map(item => ({
        price_data: {
            currency: "usd",
            product_data: { name: item.name },
            unit_amount: toCents(item.unitPrice)
        },
        quantity: item.quantity
    }));
    if (pricing.taxCents > 0) {
        lineItems.push({
            price_data: {
                currency: "usd",
                product_data: { name: "Sales tax after promo (demo estimate)" },
                unit_amount: pricing.taxCents
            },
            quantity: 1
        });
    }
    const beforeCouponCents = lineItems.reduce((sum, item) =>
        sum + item.price_data.unit_amount * item.quantity, 0);
    if (beforeCouponCents - pricing.discountCents !== pricing.totalCents) {
        return res.status(409).json({
            success: false,
            message: "Cart and promotional totals could not be reconciled; checkout was not started."
        });
    }
    // Strict allowlist: the browser cannot supply an arbitrary checkout return destination.
    const returnPage = req.body?.returnPage === "/team-demo.html"
        ? "/team-demo.html" : "/home/";
    const origin = config.checkoutBaseUrl.replace(/\/+$/, "");
    try {
        const stripe = stripeClient();
        const sessionOptions = {
            mode: "payment",
            payment_method_types: ["card"],
            line_items: lineItems,
            client_reference_id: cart.id,
            metadata: {
                cart_id: cart.id,
                // Reconcile only this paid cart snapshot, never an edited/new cart.
                cart_instance: liveCart.instanceId,
                cart_revision: String(liveCart.revision),
                promo_code: pricing.promoCode || "",
                discount_cents: String(pricing.discountCents)
            },
            success_url: `${origin}${returnPage}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}${returnPage}?checkout=cancel`
        };
        if (pricing.promoCode) {
            // A Stripe-native coupon makes the discount visible ON Stripe's checkout page.
            // This generates sandbox coupons per discounted Checkout Session.
            // Do not silently proceed at full price if creation fails.
            const coupon = await stripe.coupons.create({
                amount_off: pricing.discountCents,
                currency: "usd",
                duration: "once",
                name: `Pizza Pie Parlor ${pricing.promoCode} (TEST)`
            });
            sessionOptions.discounts = [{ coupon: coupon.id }];
        }
        const session = await stripe.checkout.sessions.create(sessionOptions);
        if (!session.url) throw new Error("Stripe did not return a Checkout URL.");
        return res.status(201).json({
            success: true,
            data: {
                url: session.url,
                promoCode: pricing.promoCode,
                discountCents: pricing.discountCents,
                expectedTotalCents: pricing.totalCents
            }
        });
    } catch (error) {
        // No secrets or raw Stripe error bodies in a shared response.
        console.error("Stripe test Checkout Session creation failed:", error.type || error.code || error.message);
        return res.status(502).json({
            success: false,
            message: "Stripe test Checkout could not start. Check the server log and sandbox API key."
        });
    }
});

router.get("/session", async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    if (!testKeyReady()) {
        return res.status(503).json({ success: false, message: "Stripe test mode is not configured." });
    }
    const id = req.query.session_id;
    const cartId = req.get("X-Cart-Id");
    if (typeof id !== "string" || !/^cs_test_[A-Za-z0-9_]+$/.test(id) ||
        !cartId || cartId.length > 100) {
        return res.status(400).json({ success: false, message: "Invalid session or cart ID." });
    }
    try {
        const session = await stripeClient().checkout.sessions.retrieve(id);
        if (session.livemode || session.client_reference_id !== cartId) {
            return res.status(403).json({ success: false, message: "Session doesn't match this demo cart." });
        }
        return res.status(200).json({
            success: true,
            data: {
                paid: session.payment_status === "paid",
                paymentStatus: session.payment_status,
                amountTotal: session.amount_total,
                currency: session.currency,
                promoCode: session.metadata?.promo_code || null,
                discountCents: session.total_details?.amount_discount ?? null
            }
        });
    } catch (error) {
        console.error("Stripe test payment lookup failed:", error.type || error.code || error.message);
        return res.status(502).json({ success: false, message: "Could not verify the test payment." });
    }
});

// Called only after Stripe redirects the browser back. Verification and cart
// clearing happen on the backend, not through a browser-supplied `paid: true`.
// Intentionally separate from GET /session: read-only status checks must not
// mutate cart state. A replay cannot clear the next cart (instance + revision).
router.post("/complete-session", async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    if (!testKeyReady()) {
        return res.status(503).json({ success: false, message: "Stripe test mode is not configured." });
    }
    const id = req.body?.sessionId;
    const cartId = req.get("X-Cart-Id");
    if (typeof id !== "string" || !/^cs_test_[A-Za-z0-9_]+$/.test(id) ||
        typeof cartId !== "string" || !cartId.trim() || cartId.length > 100) {
        return res.status(400).json({ success: false, message: "Invalid session or cart ID." });
    }
    try {
        const session = await stripeClient().checkout.sessions.retrieve(id);
        if (session.livemode || session.client_reference_id !== cartId) {
            return res.status(403).json({ success: false, message: "Session doesn't match this demo cart." });
        }
        const paid = session.payment_status === "paid";
        const revisionText = session.metadata?.cart_revision;
        const revision = typeof revisionText === "string" && /^\d+$/.test(revisionText)
            ? Number(revisionText) : NaN;
        const cartCleared = paid && cartService.clearPaidCart(
            cartId, session.metadata?.cart_instance, revision
        );
        return res.status(200).json({
            success: true,
            data: {
                paid,
                cartCleared: Boolean(cartCleared),
                paymentStatus: session.payment_status,
                amountTotal: session.amount_total,
                currency: session.currency,
                promoCode: session.metadata?.promo_code || null,
                discountCents: session.total_details?.amount_discount ?? null
            }
        });
    } catch (error) {
        console.error("Stripe test payment completion lookup failed:", error.type || error.code || error.message);
        return res.status(502).json({ success: false, message: "Could not verify the test payment." });
    }
});

// Must be mounted before express.json() to preserve Stripe's signature verification bytes.
function handleWebhook(req, res) {
    if (!testKeyReady() || !config.stripeWebhookSecret) {
        return res.status(503).send("Stripe test webhook isn't configured.");
    }
    let event;
    try {
        event = stripeClient().webhooks.constructEvent(
            req.body, req.get("stripe-signature"), config.stripeWebhookSecret
        );
    } catch (_) {
        return res.status(400).send("Invalid webhook signature.");
    }
    if (event.type === "checkout.session.completed" &&
        !event.data.object.livemode && event.data.object.payment_status === "paid") {
        // Classroom demo only: verify and acknowledge. No durable order fulfillment here.
        console.log("Verified Stripe TEST checkout.session.completed event received.");
    }
    res.status(200).json({ received: true });
}

module.exports = router;
module.exports.handleWebhook = handleWebhook;
