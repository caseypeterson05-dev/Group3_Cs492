# Pizza Pie Parlor: Stripe Sandbox Checkout — Setup and Review

This is an October 16 team project snapshot with a **test-only Stripe Checkout integration** wired to the existing `/home/` cart. It is for review and local testing, not a production payment system. The test key is **not included**. Task 2.2's separate SQLite work was not merged.

## Quick setup (Windows PowerShell)

1. Extract this ZIP to a **new** directory. Open `Group3_Cs492-main`, specifically the directory containing `package.json`. In File Explorer's address bar, type `powershell` and press Enter.
2. Check `node --version` (Node.js 20 or later). Run `npm install` to install Express, Stripe, and dotenv. This archive intentionally does not include dependencies or a package-lock.json; `npm install` creates it. Do not use `npm ci` on a new extraction.
3. Run `Copy-Item .env.example .env` and `notepad .env`. Keep the normal server settings and set:

   ```dotenv
   PAYMENT_PROVIDER=stripe
   STRIPE_SECRET_KEY=sk_test_PASTE_YOUR_OWN_SANDBOX_SECRET_HERE
   CHECKOUT_BASE_URL=http://127.0.0.1:3000
   ```

   Obtain YOUR sandbox/test secret from https://dashboard.stripe.com/apikeys. Use only `sk_test_`, never `sk_live_`. Do **not** send the key in chat, upload `.env`, or commit it. If a sandbox secret was previously shared, rotate it and use the replacement.
4. Make sure other copies of the server are stopped (Ctrl+C in their terminals). Run `npm test`, then `npm start` in this project root. Keep the terminal open.
5. Check http://127.0.0.1:3000/api/payments/status. It should report `provider: "stripe"`, `configured: true`, and `mode: "test-only"`. If it instead reports `pciGatewayRequired: true`, you're running the unpatched project's server. If `configured` is false, check `.env` and restart.
6. Open http://127.0.0.1:3000/home/ (Steel's restaurant design). Add at least $20 of pizza, open the cart, choose **Have a promo code?**, and submit **PIZZA20**. The cart shows the estimated discounted total and updated demo tax. Click **Pay with Stripe (TEST)**. On Stripe, verify the coupon and total match the cart. Without a promo, normal full-price checkout still works.
7. On Stripe-hosted Checkout use test card `4242 4242 4242 4242`, any future expiration and any three-digit CVC. After checkout, `/home/` shows a payment-status banner above the main content. It only says **Payment confirmed** after the backend retrieves the Stripe Checkout Session and confirms `paid`. If the result cannot be verified, the banner explains that you should check the sandbox Dashboard; it does not claim the payment failed. Confirm the test payment in your **sandbox** Stripe dashboard.

Optional alternate page: http://127.0.0.1:3000/team-demo.html. The return URL is selected based on the originating demo page.

## What to send the Scrum Master

Provide the ZIP **without your `.env`** and include: (a) a screenshot of the Stripe status endpoint showing `configured: true`; (b) the cart showing a server-calculated total and test checkout button; (c) Stripe-hosted test checkout; (d) the paid result and matching sandbox transaction. Preserve Task 10.1 ownership and review merges into the latest team copy separately.

## Important limitations

* This is an **October 16 snapshot**, not a guaranteed merge of the latest GitHub branch. Keep it as a separate test copy until reviewed against current work. Preserve the redesigned frontend and teammates' other work.
* The prototype cart is in memory and is not authenticated; orders are not persisted or fulfilled.
* Valid promo codes **are now applied at Stripe Checkout**. PIZZA20 (20% off $20+), SAVE5 ($5 off $25+), FAMILY10 (10% off $40+) are independently validated by the Express backend against its live cart. Checkout creates a one-time sandbox Stripe coupon and shows that discount on Stripe's hosted page. The flat-rate prototype tax is recalculated after the discount. Promo coupons created during testing remain in the Stripe sandbox; this is not production coupon management.
* Server-side cart values are used for Checkout amounts. Card details are collected on Stripe's site, never in this backend.
* Signed webhooks can be checked by running `stripe listen --forward-to http://127.0.0.1:3000/api/payments/webhook` and putting its `whsec_...` in `.env` as `STRIPE_WEBHOOK_SECRET`; webhook delivery is not durable fulfillment.
* This project is **not PCI certified or production-ready**. Do not use live keys or accept real customer payments.

## Troubleshooting

* `Cannot find module`: run `npm install` in the directory with `package.json`.
* Old payment-status output: stop the old Node process; run the updated server from this extracted folder.
* Server cannot bind to port 3000: another Node server may still be running. Stop it first.
* Stripe returns an error: verify the sandbox/test key and internet access, restart the server, inspect its log without sharing secrets.
* No checkout button: open `/home/`, not the prototype root page, and hard-refresh (`Ctrl+F5`).
* The cart is empty after restart: in-memory carts do not survive server restarts.
* `npm test` failure: copy the exact nonsecret error to the team; do not claim full validation until it passes on your machine.

## Returning from Stripe: confirmation UI

The homepage now shows a visible banner immediately below the site header. Confirmation is verified by `GET /api/payments/session` using the stored same-tab demo cart ID. If that verification fails, check the Stripe sandbox dashboard. The application does **not** persist paid orders or fulfill them.

To update an existing extracted copy without replacing its `.env`, use `Pizza_Pie_Parlor_Stripe_Promos_Only.zip` and overwrite the paths contained in the archive. The fix includes a backend checkout-pricing helper and payment-route changes, client promo/checkout wiring, documentation and tests. Restart Express and hard-refresh the browser (`Ctrl+F5`). Do not replace your `.env` or upload it. Do not re-use an already-completed test payment to verify a new code: start a new sandbox Checkout Session.
