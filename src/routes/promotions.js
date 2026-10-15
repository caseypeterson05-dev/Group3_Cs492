const express = require("express");
const {
    activePromotions,
    validatePromotion
} = require("../services/promotionService");

const router = express.Router();

router.get("/", (req, res) => {
    const data = activePromotions();

    res.status(200).json({
        success: true,
        count: data.length,
        data
    });
});

router.post("/validate", (req, res) => {
    const result = validatePromotion(
        req.body?.code,
        req.body?.subtotal
    );

    const { httpStatus, ...body } = result;

    res.status(httpStatus).json(body);
});

module.exports = router;
