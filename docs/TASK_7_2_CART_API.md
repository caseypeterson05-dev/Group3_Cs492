# Sprint 2 / Task 7.2: Cart Operations API

**Acceptance:** backend API can add, view, update, and remove cart lines. The existing code also supports clearing an entire cart.

## Run

```bash
npm ci
npm test
npm start
```

Default URL: `http://localhost:3000` (check `.env.example` for configuration). No database or cloud account is required.

## Integration contract

Send `X-Cart-Id: <unique-nonsecret-random-id>` on **every** cart request. Generate and retain a cart ID in the frontend for the current session; do not use the shared `demo` fallback in a multiuser deployment. Carts are isolated by ID only, **not authenticated**: knowing another cart ID would permit access to it. Never include payment details in cart requests.

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/cart` | View cart with subtotal, tax, total |
| POST | `/api/cart/items` | Add item or merge identical customized lines |
| PATCH | `/api/cart/items/:lineId` | Update quantity |
| DELETE | `/api/cart/items/:lineId` | Remove item |
| DELETE | `/api/cart` | Clear cart |

Add example:

```http
POST /api/cart/items
Content-Type: application/json
X-Cart-Id: random-session-identifier

{"itemId":"pepperoni","quantity":2,"customization":{"sizeId":"medium","crustId":"hand-tossed","toppingIds":["mushrooms"]}}
```

Quantity changes: `PATCH` with body `{ "quantity": 3 }`. Quantities must be JSON integers from 1 to 99; use DELETE to remove a line rather than setting quantity to zero. A cart can hold up to 50 distinct lines. Menu unit prices are calculated server-side. Successful API responses expose the updated cart in `data`; `POST` and `PATCH` also expose `line`. Errors use HTTP 400 or 404 with `success: false` and `message`.

## Limitations and future production work

This is an **in-memory course prototype**; cart data disappears on server restart and is not shared between server instances. The fallback cart ID `demo` is intended only for single-user local demonstrations. Before real customers, use authenticated or signed, unguessable cart sessions, durable cart persistence, expiration and rate limiting; do not regard `X-Cart-Id` as authorization. Checkout and payments require separate review. No real card data should be sent to this backend.

## Verification

Run `npm test` and `npm run smoke`. The tests include cart lifecycle, merging, isolation, validation, and updates. See `tests/cart-72.test.js` for targeted task 7.2 tests.
