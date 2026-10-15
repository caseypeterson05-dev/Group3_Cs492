/** Simple display-only promo math. No payment or checkout decisions belong here. */
export function createPromoPreview(cart, promo) {
  if (!cart || !promo?.pricing) return null;
  const discount = Number(promo.pricing.discountAmount);
  if (!Number.isFinite(discount) || discount < 0 ||
      Math.abs(Number(promo.pricing.originalSubtotal) - cart.subtotal) > 0.01) return null;
  const safeDiscount = Math.min(discount, cart.subtotal);
  // Keep the backend-provided tax unchanged rather than pretend to know
  // how checkout recalculates taxes for a discounted order.
  return {
    discount: safeDiscount,
    estimatedTotal: Number(Math.max(0, cart.total - safeDiscount).toFixed(2))
  };
}
