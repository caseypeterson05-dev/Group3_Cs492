# Task 10.1: Clear the cart after a confirmed Stripe sandbox payment

Stripe Checkout remains **TEST ONLY**, with no durable order management or fulfillment.

- Create Checkout Session from the backend cart; metadata stores that cart instance ID and revision.
- After the Stripe success redirect, the frontend POSTs `{ "sessionId": "cs_test_..." }` to `/api/payments/complete-session` with the existing `X-Cart-Id` header.
- The backend retrieves the session from Stripe and requires matching cart ID, test mode, and `payment_status: paid` before clearing anything.
- The purchased in-memory cart clears **only if it is still the same cart revision** used to create Checkout. Replay of an old paid Session cannot clear newly-added items.
- After finalization, the page reloads the cart so the count updates to 0 and promo state resets. Cancellations and unpaid payments preserve cart contents.
- If the cart changed while payment was in progress, or the server restarted, payment is confirmed but the cart is left intact, with an explanatory notice.
- This is not an order ledger, webhook fulfillment, or durable idempotency solution. Real deployments need authenticated customers, stored orders, and idempotent webhook-based fulfillment.

## Apply

Back up your current project, stop Express, then extract `Pizza_Pie_Parlor_Stripe_Cart_Clear_Patch.zip` **into the directory above** `Group3_Cs492-main` so the existing files are updated without replacing `.env`. Run `npm.cmd test`, then `npm.cmd start`. The browser should be refreshed with Ctrl+F5.
