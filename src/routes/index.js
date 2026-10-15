const express = require("express");
const pkg = require("../../package.json");

const health = require("./health");
const restaurant = require("./restaurant");
const promotions = require("./promotions");
const menu = require("./menu");
const gallery = require("./gallery");
const cart = require("./cart");
const delivery = require("./delivery");
const payments = require("./payments");
const openapi = require("./openapi");

const router = express.Router();

router.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        service: "Pizza Pie Parlor API",
        version: pkg.version,
        endpoints: [
            "GET /api/health",
            "GET /api/restaurant",
            "GET /api/menu",
            "GET /api/menu/:itemId",
            "POST /api/menu/price-preview",
            "GET /api/gallery",
            "GET /api/promotions",
            "POST /api/promotions/validate",
            "GET /api/cart",
            "POST /api/cart/items",
            "PATCH /api/cart/items/:lineId",
            "DELETE /api/cart/items/:lineId",
            "DELETE /api/cart",
            "GET /api/delivery/config",
            "POST /api/delivery/validate",
            "GET /api/payments/status",
            "POST /api/payments/create-session",
            "GET /api/openapi.yaml"
        ]
    });
});

router.use("/health", health);
router.use("/restaurant", restaurant);
router.use("/promotions", promotions);
router.use("/menu", menu);
router.use("/gallery", gallery);
router.use("/cart", cart);
router.use("/delivery", delivery);
router.use("/payments", payments);
router.use("/openapi.yaml", openapi);

module.exports = router;
