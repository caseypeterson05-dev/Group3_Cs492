/** Presentation-only preview; backend independently validates promos at checkout. */
export function createPromoPreview(cart, promo) {
  if (!cart || !promo?.pricing) return null;
  const discount = Number(promo.pricing.discountAmount);
  if (!Number.isFinite(discount) || discount < 0 ||
      Math.abs(Number(promo.pricing.originalSubtotal) - cart.subtotal) > 0.01) return null;
  const safeDiscount = Math.min(discount, cart.subtotal);
  // Mirror the flat-rate prototype's server-side tax-on-discounted-subtotal.
  // Only the server/Stripe control the actual charge.
  const discountedSubtotal = Number((cart.subtotal - safeDiscount).toFixed(2));
  const estimatedTax = Number((discountedSubtotal * cart.taxRate).toFixed(2));
  return {
    discount: safeDiscount,
    estimatedTax,
    estimatedTotal: Number((discountedSubtotal + estimatedTax).toFixed(2))
  };
}
