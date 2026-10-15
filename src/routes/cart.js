const express = require("express");
const cartService = require("../services/cartService");

const router = express.Router();

function cartId(req) {
    return req.get("X-Cart-Id") || "demo";
}

router.get("/", (req, res) => {
    res.setHeader("Cache-Control", "no-store");

    const cart = cartService.getCart(cartId(req));

    res.status(200).json({
        success: true,
        data: cartService.serializeCart(cart)
    });
});

router.post("/items", (req, res) => {
    res.setHeader("Cache-Control", "no-store");

    const result = cartService.addItem(
        cartId(req),
        req.body || {}
    );

    if (!result.valid) {
        return res.status(400).json({
            success: false,
            message: result.message
        });
    }

    res.status(result.merged ? 200 : 201).json({
        success: true,
        merged: result.merged,
        message: result.merged
            ? "Identical cart item quantity updated."
            : "Item added to cart.",
        data: result.cart,
        line: result.line
    });
});

router.patch("/items/:lineId", (req, res) => {
    res.setHeader("Cache-Control", "no-store");

    const result = cartService.updateItem(
        cartId(req),
        req.params.lineId,
        req.body?.quantity
    );

    if (!result.valid) {
        return res
            .status(result.notFound ? 404 : 400)
            .json({
                success: false,
                message: result.message
            });
    }

    res.status(200).json({
        success: true,
        message: "Cart item updated.",
        data: result.cart,
        line: result.line
    });
});

router.delete("/items/:lineId", (req, res) => {
    res.setHeader("Cache-Control", "no-store");

    const result = cartService.removeItem(
        cartId(req),
        req.params.lineId
    );

    if (!result.valid) {
        return res.status(404).json({
            success: false,
            message: result.message
        });
    }

    res.status(200).json({
        success: true,
        message: "Cart item removed.",
        data: result.cart
    });
});

router.delete("/", (req, res) => {
    res.setHeader("Cache-Control", "no-store");

    res.status(200).json({
        success: true,
        message: "Cart cleared.",
        data: cartService.clearCart(cartId(req))
    });
});

module.exports = router;
