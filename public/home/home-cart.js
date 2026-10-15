/*
 * Homepage wording for the shared cart code.
 *
 * The menu, customize dialog, cart, and promo code on this page are run by the
 * teammate-built /cart-demo/js/main.js (Tasks 7.1, 7.2, 9.1), used unchanged.
 * That script fills in text from /cart-demo/js/site-content.js, which is written
 * for the space-themed demo. This file swaps in homepage wording after it runs,
 * so neither of the teammate's files needs to be edited.
 *
 * Loaded as a module after main.js, so it always runs second.
 */

const copy = {
    cartTitle: "Your cart",
    promoTitle: "Promo code",
    promoDescription: "Enter a code to see how much you'll save on this order.",
    promoButton: "Have a promo code?",
    promoCheckButton: "Check code",
    emptyCart: "Your cart is empty. Pick something from the menu to get started."
};

const $ = (id) => document.getElementById(id);

$("cart-heading").textContent = copy.cartTitle;
$("promo-title").textContent = copy.promoTitle;
$("promo-description").textContent = copy.promoDescription;
$("open-promo").textContent = copy.promoButton;
$("promo-form").querySelector("[type=submit]").textContent = copy.promoCheckButton;

// The cart re-renders after every change, so watch for the empty message.
const cartItems = $("cart-items");

function fixEmptyMessage() {
    const empty = cartItems.querySelector(".empty-cart");

    if (empty && empty.textContent !== copy.emptyCart) {
        empty.textContent = copy.emptyCart;
    }

    $("clear-cart").hidden = !cartItems.querySelector(".cart-line");
}

new MutationObserver(fixEmptyMessage).observe(cartItems, { childList: true, subtree: true });
fixEmptyMessage();
