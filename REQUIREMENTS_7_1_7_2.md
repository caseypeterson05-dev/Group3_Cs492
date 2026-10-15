# Sprint 2 requirement mapping (source: Group3_CS492_Sprint_Planning(3).xlsx)

| Task | Exact sprint description | Code evidence | Review status |
|---|---|---|---|
| 7.1 | Develop the shopping cart UI component | `public/team-demo.html`, `public/cart-demo/js/main.js`, `view.js`, `cart.js`, `api.js`; interactive cart drawer, controls, customization and totals | Implemented in demo; browser UAT and team acceptance pending |
| 7.2 | Implement backend API for cart operations (add, update, view) | `src/routes/cart.js`, `src/services/cartService.js`, `tests/api.test.js`, `tests/cart-72.test.js`, `docs/TASK_7_2_CART_API.md` | Implemented; full automated suite must be run on teammates' installed Node environment |
| 9.1 (separate task) | Add a "Promo Code" input field to the checkout page UI | Demo popup and validated *preview* in `main.js` and `promo-preview.js` | Extra proof of concept, NOT finished checkout page |

## What can be claimed

The uploaded project implements the **functional scope** of Tasks 7.1 and 7.2. The user previously demonstrated menu loading, cart quantity changes and a promo estimate in the browser; that demonstration was not a formal acceptance test for this precise ZIP. No final styling approval, pull request merge, persistent data layer or checkout implementation is implied.

The server owns cart subtotal, tax, and total. The promotional validation API returns an estimated discount; the browser displays an estimated discounted total using the original server tax. This is not payment-ready pricing.
