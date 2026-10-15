ARCHIVED BACKEND DOCUMENTATION FROM THE ORIGINAL v2.1.3 ZIP
=================================================================
This file records the project as first shared with the team.
It is NOT the current startup guide, and some test totals, file trees,
commands, and version references describe the older release.
For the current demo, open README.txt in the main project folder.
For an exact unedited original, open the matching .md file here.

ORIGINAL DOCUMENT FOLLOWS
-------------------------

==========================
Pizza Pie Parlor Backend
==========================

This is the backend I put together for our CS492 Pizza Pie Parlor project.

My main assigned pieces are:

- Task 1.2: Restaurant information backend API
- Task 6.2: Promotions backend
- Task 9.2: Promotion-code validation

While I was working on those, I also added some extra backend support that I could build and test on my own without taking over someone else's frontend work. The main goal was to make the project easier for the group to plug into later.

I also wanted to keep this completely separate from my personal homelab. Nobody needs my server, domain, Proxmox setup, Cloudflare, Tailscale, or anything else I run at home. Whoever starts the project locally becomes the host for that copy.

======================
What works right now
======================

The backend currently has:

- Restaurant information API
- Menu and customization data
- Server-side pizza price calculations
- Gallery metadata API
- Promotions API
- Promotion-code validation
- Cart add, update, remove, and clear
- Automatic merging of identical cart items
- Cart subtotal, tax, and total calculations
- Delivery-radius validation
- Payment gateway safety boundary
- Security headers and basic request protection
- Request IDs for debugging
- SQL schema and seed files for later database integration
- Automated API tests
- Live smoke test
- OpenAPI file for frontend/backend integration

The extra APIs are there to give the team something stable to build against. I am not treating those extra pieces as completed assignments for other people.

---

=========================
Why I built it this way
=========================

I wanted the backend to be portable.

By default it runs on:

http://127.0.0.1:3000

If I run it on my computer, my computer hosts it.

If another teammate copies the project and runs it on their computer, their computer hosts it.

The frontend should use relative API paths like:

fetch("/api/restaurant");

instead of hard-coding:

fetch("http://127.0.0.1:3000/api/restaurant");

That way the same frontend code can move between machines without needing to be rewritten.

---

=============
Quick Start
=============

==============
Requirements
==============

Install Node.js 20 or newer.

Check it with:

node --version
npm --version

======================
Install dependencies
======================

From the project folder:

npm install

On Windows PowerShell, if npm.ps1 is blocked:

npm.cmd install

===================
Start the backend
===================

Normal command:

npm start

On Windows:

npm.cmd start

There are also Windows helper files included:

run-server.cmd
run-tests.cmd
run-smoke.cmd

If Node is installed under the normal Windows path, these helpers will find the full node.exe path automatically.

You can also start it directly with:

& "C:\Program Files\nodejs\node.exe" .\server.js

Once it is running:

Main page:
http://127.0.0.1:3000

API index:
http://127.0.0.1:3000/api

Health:
http://127.0.0.1:3000/api/health

OpenAPI:
http://127.0.0.1:3000/api/openapi.yaml

---

============
API Routes
============

GET    /api
GET    /api/health
GET    /api/openapi.yaml

GET    /api/restaurant

GET    /api/menu
GET    /api/menu/:itemId
POST   /api/menu/price-preview

GET    /api/gallery

GET    /api/promotions
POST   /api/promotions/validate

GET    /api/cart
POST   /api/cart/items
PATCH  /api/cart/items/:lineId
DELETE /api/cart/items/:lineId
DELETE /api/cart

GET    /api/delivery/config
POST   /api/delivery/validate

GET    /api/payments/status
POST   /api/payments/create-session

---

==================================
Task 1.2: Restaurant Information
==================================

Frontend request:

const response = await fetch("/api/restaurant");
const result = await response.json();

console.log(result.data.name);
console.log(result.data.description);
console.log(result.data.address);
console.log(result.data.phone);
console.log(result.data.hours);

The endpoint returns the restaurant name, description, address, phone number, and hours.

---

==============================
Menu and Pizza Customization
==============================

Get the menu:

GET /api/menu

This includes:

categories
menu items
sizes
crusts
toppings

A frontend can load the menu once and use that data to build the menu and customization screen.

===============
Price preview
===============

Instead of trusting the browser to decide the final pizza price, the backend can calculate it.

POST /api/menu/price-preview

Example:

{
  "itemId": "classic-cheese",
  "customization": {
    "sizeId": "large",
    "crustId": "stuffed",
    "toppingIds": [
      "pepperoni",
      "mushrooms"
    ]
  }
}

For the current seed data that comes out to:

Classic Cheese Pizza   $10.99
Large                    +5.00
Stuffed Crust            +2.50
Pepperoni                +1.50
Mushrooms                +1.00
------------------------------
Unit Price               $20.99

Duplicate topping IDs are ignored so the same topping does not accidentally get charged twice.

---

======================
Task 6.2: Promotions
======================

Get the active promotions:

GET /api/promotions

Each promotion can include things like:

code
title
description
terms
type
value
minimumSubtotal
active

Frontend example:

const response = await fetch("/api/promotions");
const result = await response.json();

for (const promotion of result.data) {
    console.log(promotion.title);
    console.log(promotion.code);
}

---

================================
Task 9.2: Promotion Validation
================================

Validate a promo code:

POST /api/promotions/validate

Example:

{
  "code": "PIZZA20",
  "subtotal": 50
}

The backend checks:

- whether the code exists
- whether it is active
- whether the subtotal is valid
- whether the minimum subtotal was reached
- how much the discount should be
- what the new subtotal should be

Promo codes are trimmed and compared without caring about capitalization.

These all work the same:

PIZZA20
pizza20
  pizza20

A $50 subtotal with PIZZA20 currently becomes:

Original subtotal: $50.00
Discount:          $10.00
New subtotal:      $40.00

---

======
Cart
======

The cart supports:

add item
view cart
change quantity
remove item
clear cart
subtotal
tax
total

=============
Add an item
=============

POST /api/cart/items

Example:

{
  "itemId": "classic-cheese",
  "quantity": 2,
  "customization": {
    "sizeId": "large",
    "crustId": "stuffed",
    "toppingIds": [
      "pepperoni",
      "mushrooms"
    ]
  }
}

The backend recalculates the price itself. It does not trust a price sent from the frontend.

=======================
Identical items merge
=======================

If the same cart already has the same:

item
size
crust
toppings

the quantity is increased instead of creating another identical line.

Example:

Existing pizza: quantity 2
Add same pizza: quantity 2
Result:         quantity 4

Topping order does not matter.

These count as the same pizza:

Pepperoni + Mushrooms
Mushrooms + Pepperoni

Different sizes, crusts, toppings, or menu items stay separate.

================
Separate carts
================

The optional header:

X-Cart-Id

can be used to keep test carts separate.

If no cart ID is sent, the prototype uses:

demo

The cart is currently stored in memory, so it resets when the backend restarts.

---

=================
Delivery Radius
=================

Get the current delivery setup:

GET /api/delivery/config

Validate a location:

POST /api/delivery/validate

Example:

{
  "latitude": 39.7395,
  "longitude": -104.9900
}

The backend calculates the distance and returns whether the location is inside the current delivery radius.

Street-address geocoding is not built in yet. Turning a typed address into coordinates would mean choosing an outside geocoding service or maintaining a local dataset. I left that separate so the radius logic can work without another dependency.

Later, a geocoder can turn the address into coordinates and pass them into the same delivery endpoint.

---

==================
Payment Handling
==================

The payment route is only an integration boundary right now.

It does not pretend to be a payment processor and it does not store raw card information.

Fields like these are rejected:

cardNumber
cvv
cvc
securityCode
expiration
expiry

The final checkout should use whatever PCI-compliant payment provider the team decides on.

The idea is that the provider handles card entry and tokenization, then the backend works with the provider's token or session instead of raw card details.

---

================
Database Files
================

The project includes:

database/schema.sql
database/seed.sql
database/README.md

The schema has starter tables for:

categories
menu items
sizes
crusts
toppings
promotions

The menu API is still using JSON seed data for now.

I did that on purpose so frontend work does not have to wait for the final database layer. The data source can be replaced later while keeping the API routes the same.

---

==========
Security
==========

The backend currently includes:

Content Security Policy
X-Content-Type-Options
X-Frame-Options
Referrer Policy
Permissions Policy
Express X-Powered-By disabled
JSON request size limit
controlled malformed JSON handling
raw card data rejection
optional CORS origin
optional HTTPS startup
request IDs

More detail is in:

SECURITY.md

This is still a class project, so I am treating this as a security baseline instead of calling it production security.

---

=============
Request IDs
=============

Every response gets:

X-Request-Id

That makes it easier to track a bad request while testing with the group.

A client can also send one:

X-Request-Id: checkout-test-001

For controlled errors, the backend includes that same ID in the JSON response.

---

=========
Testing
=========

The backend has two different kinds of tests.

=====================
Automated API tests
=====================

Run:

npm test

or on Windows:

run-tests.cmd

The current suite checks things like:

- restaurant data
- menu data
- good and bad menu IDs
- good and bad toppings
- duplicate toppings
- percentage discounts
- fixed-dollar discounts
- promo minimums
- invalid subtotals
- cart add/update/remove
- identical cart merging
- different cart configurations
- bad cart quantities
- separate cart IDs
- delivery inside radius
- delivery outside radius
- invalid coordinates
- raw card-data rejection
- malformed JSON
- unknown routes
- security headers

Current verified result:

23 passed
0 failed

=================
Live smoke test
=================

Start the normal backend first.

Then run:

npm run smoke

or on Windows:

run-smoke.cmd

The live smoke test checks:

health
restaurant
menu
promotions
promo validation
cart merging
delivery radius
payment safety

Current verified result:

8 passed
0 failed

These tests only verify the backend package as it exists now. The group should still test everything again after the frontend, database, payment provider, and final deployment pieces are connected.

---

==================
Frontend Handoff
==================

The main thing the frontend needs to do is call the API instead of rebuilding backend logic in JavaScript.

For example:

fetch("/api/restaurant");
fetch("/api/menu");
fetch("/api/gallery");
fetch("/api/promotions");
fetch("/api/cart");

For POST requests:

fetch("/api/promotions/validate", {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({
        code: promoCode,
        subtotal: cartSubtotal
    })
});

The frontend should handle:

layout
HTML/CSS
menu display
customization controls
gallery display
specials display
cart buttons
delivery/pickup controls
promo input
checkout display

The backend should handle:

restaurant data
menu data
price validation
promotion data
promo math
cart state
cart totals
delivery radius math
payment safety boundary

More integration examples are in:

docs/FRONTEND_INTEGRATION.md
docs/api-examples.http
docs/openapi.yaml

---

===================
Project Structure
===================

PizzaPieParlor_Backend_Enhanced/
|
|-- server.js
|-- package.json
|-- package-lock.json
|-- README.md
|-- SECURITY.md
|-- CHANGELOG.md
|-- .env.example
|-- .gitignore
|-- run-server.cmd
|-- run-tests.cmd
|-- run-smoke.cmd
|
|-- data/
|   |-- restaurant.json
|   |-- promotions.json
|   |-- menu.json
|   `-- gallery.json
|
|-- database/
|   |-- schema.sql
|   |-- seed.sql
|   `-- README.md
|
|-- docs/
|   |-- BACKEND_HANDOFF.md
|   |-- SPRINT_BACKEND_MAP.md
|   |-- TESTING.md
|   |-- FRONTEND_INTEGRATION.md
|   |-- api-examples.http
|   `-- openapi.yaml
|
|-- public/
|   |-- index.html
|   |-- app.js
|   |-- styles.css
|   `-- images/
|
|-- scripts/
|   `-- smoke-check.js
|
|-- src/
|   |-- app.js
|   |-- config.js
|   |-- middleware/
|   |-- routes/
|   |-- services/
|   `-- utils/
|
`-- tests/
    `-- api.test.js

---

========================================
Things Still Left for Team Integration
========================================

These are not hidden or faked as finished:

- Cart storage is memory-only right now.
- Menu data is still using seed JSON.
- The final database still needs to be connected.
- Street-address geocoding still needs a provider or dataset if the group wants it.
- A real payment provider still needs to be selected and connected.
- HTTPS still needs the final certificate or hosting environment.
- Restaurant, menu, and gallery content can be replaced with whatever the group decides to use.

For now, the backend is in a place where it can be run and tested by itself while the rest of the group works on their pieces.
