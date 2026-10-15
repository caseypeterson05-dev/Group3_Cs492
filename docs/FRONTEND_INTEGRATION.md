# Frontend Integration Notes

## Rule 1: Use relative API paths

Use:

```javascript
fetch("/api/menu")
```

Do not hard-code teammate-specific hosts, IP addresses, domains, or ports.

## Rule 2: Let the backend validate prices

The frontend can display an immediate estimated price, but the cart should use backend-calculated pricing returned by the menu/cart services.

Do not send a browser-supplied price and assume it is trusted.

## Rule 3: Use the cart response as the source of truth

After adding/updating/removing an item, use the returned cart object to refresh:

```text
items
subtotal
tax
total
```

## Rule 4: Identical cart lines merge automatically

The frontend does not need to search for duplicates before adding a pizza.

The backend returns:

```text
merged: true
```

when an existing identical line was incremented.

## Rule 5: Display backend validation messages

Promo and delivery endpoints return human-readable `message` values that can be shown in the UI.

## Rule 6: Do not handle raw card data in this backend

A real payment provider should collect/tokenize payment details through its supported client SDK.

## Useful routes

```text
GET    /api/restaurant
GET    /api/menu
POST   /api/menu/price-preview
GET    /api/gallery
GET    /api/promotions
POST   /api/promotions/validate
GET    /api/cart
POST   /api/cart/items
PATCH  /api/cart/items/:lineId
DELETE /api/cart/items/:lineId
POST   /api/delivery/validate
```

Machine-readable contract:

```text
GET /api/openapi.yaml
```
