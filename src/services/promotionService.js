const promotions = require("../../data/promotions.json");

function activePromotions() {
    return promotions.filter(promotion => promotion.active);
}

function validatePromotion(code, subtotal) {
    if (!code || typeof code !== "string") {
        return {
            httpStatus: 400,
            success: false,
            valid: false,
            message: "A promotion code is required."
        };
    }

    const numericSubtotal = Number(subtotal);

    if (!Number.isFinite(numericSubtotal) || numericSubtotal < 0) {
        return {
            httpStatus: 400,
            success: false,
            valid: false,
            message: "A valid subtotal is required."
        };
    }

    const promotion = promotions.find(
        promo =>
            promo.active &&
            promo.code.toLowerCase() === code.trim().toLowerCase()
    );

    if (!promotion) {
        return {
            httpStatus: 200,
            success: true,
            valid: false,
            message: "Invalid or inactive promotion code."
        };
    }

    if (numericSubtotal < promotion.minimumSubtotal) {
        return {
            httpStatus: 200,
            success: true,
            valid: false,
            message:
                `This promotion requires a minimum subtotal of $${promotion.minimumSubtotal.toFixed(2)}.`
        };
    }

    let discountAmount = 0;

    if (promotion.type === "percent") {
        discountAmount =
            numericSubtotal * (promotion.value / 100);
    } else if (promotion.type === "fixed") {
        discountAmount = promotion.value;
    }

    discountAmount = Math.min(discountAmount, numericSubtotal);

    return {
        httpStatus: 200,
        success: true,
        valid: true,
        message: "Promotion applied successfully.",
        promotion: {
            code: promotion.code,
            title: promotion.title,
            terms: promotion.terms,
            type: promotion.type,
            value: promotion.value
        },
        pricing: {
            originalSubtotal: Number(numericSubtotal.toFixed(2)),
            discountAmount: Number(discountAmount.toFixed(2)),
            discountedSubtotal:
                Number((numericSubtotal - discountAmount).toFixed(2))
        }
    };
}

module.exports = {
    activePromotions,
    validatePromotion
};
