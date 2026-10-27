// Server-authoritative pricing for the classroom Stripe sandbox prototype.
// Promotional codes are REVALIDATED against server cart subtotal at checkout.
// A discount reduces the taxable base here, using this prototype's flat tax rate.
const config = require('../config');
const { validatePromotion } = require('./promotionService');

function cents(value) {
    return Math.round(Number(value) * 100);
}

function checkoutPricing(cart, promoCode) {
    const subtotalCents = cents(cart.subtotal);
    let discountCents = 0;
    let code = null;
    if (promoCode !== undefined && promoCode !== null && promoCode !== '') {
        if (typeof promoCode !== 'string' || !promoCode.trim() || promoCode.length > 64) {
            return { valid: false, message: 'Enter a valid promotion code.' };
        }
        const validation = validatePromotion(promoCode, cart.subtotal);
        if (!validation.valid) {
            return { valid: false, message: validation.message || 'Promotion is not valid for this cart.' };
        }
        code = validation.promotion.code;
        discountCents = cents(validation.pricing.discountAmount);
        if (discountCents <= 0) {
            return { valid: false, message: 'The promotion does not discount this cart.' };
        }
    }
    const discountedSubtotalCents = subtotalCents - discountCents;
    // Unmodified cart retains the existing tax calculation exactly.
    const taxCents = code
        ? cents(Number(((discountedSubtotalCents / 100) * config.taxRate).toFixed(2)))
        : cents(cart.tax);
    return {
        valid: true,
        promoCode: code,
        subtotalCents,
        discountCents,
        discountedSubtotalCents,
        taxCents,
        totalCents: discountedSubtotalCents + taxCents
    };
}

module.exports = { checkoutPricing };
