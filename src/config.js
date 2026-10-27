const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env"), quiet: true });

function numberFromEnv(name, fallback) {
    const value = Number(process.env[name]);
    return Number.isFinite(value) ? value : fallback;
}

module.exports = {
    port: numberFromEnv("PORT", 3000),
    host: process.env.HOST || "127.0.0.1",
    taxRate: numberFromEnv("TAX_RATE", 0.0725),
    delivery: {
        radiusMiles: numberFromEnv("DELIVERY_RADIUS_MILES", 5),
        restaurantLatitude: numberFromEnv("RESTAURANT_LATITUDE", 39.7392),
        restaurantLongitude: numberFromEnv("RESTAURANT_LONGITUDE", -104.9903)
    },
    https: {
        enabled: String(process.env.HTTPS || "").toLowerCase() === "true",
        keyFile: process.env.SSL_KEY_FILE || "",
        certFile: process.env.SSL_CERT_FILE || ""
    },
    corsOrigin: process.env.FRONTEND_ORIGIN || "",
    trustProxy: String(process.env.TRUST_PROXY || "") === "1",
    paymentProvider: process.env.PAYMENT_PROVIDER || "",
    stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
    checkoutBaseUrl: process.env.CHECKOUT_BASE_URL || "http://127.0.0.1:3000"
};
