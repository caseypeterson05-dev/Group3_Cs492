const express = require("express");
const menuService = require("../services/menuService");

const router = express.Router();

router.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        data: menuService.getMenu(),
        source: "seed-data",
        note:
            "Frontend-ready prototype endpoint. Replace the seed-data service with the team database layer without changing this API contract."
    });
});

router.get("/:itemId", (req, res) => {
    const item = menuService.getItem(req.params.itemId);

    if (!item) {
        return res.status(404).json({
            success: false,
            message: "Menu item not found."
        });
    }

    res.status(200).json({
        success: true,
        data: item
    });
});

router.post("/price-preview", (req, res) => {
    const result = menuService.calculateUnitPrice(
        req.body?.itemId,
        req.body?.customization || {}
    );

    if (!result.valid) {
        return res.status(400).json({
            success: false,
            message: result.message
        });
    }

    res.status(200).json({
        success: true,
        data: {
            itemId: result.item.id,
            name: result.item.name,
            selected: result.selected,
            unitPrice: result.unitPrice
        }
    });
});

module.exports = router;
