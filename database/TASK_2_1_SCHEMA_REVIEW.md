# Task 2.1 — Database schema review and verification

**Scope from Sprint 1 plan:** Design the database schema for menu items, categories, and toppings.

## Existing work reviewed
The team's current ZIP already includes `database/schema.sql` and `database/seed.sql`. The schema has six tables:

| Table | Purpose |
|---|---|
| `categories` | Menu category names and display order |
| `menu_items` | Item name, description, category reference, base price, and visibility/customization flags |
| `pizza_sizes` | Pizza sizes with added prices |
| `pizza_crusts` | Crust choices with added prices |
| `toppings` | Topping choices with added prices and availability |
| `promotions` | Discount codes and terms (additional schema support) |

`menu_items.category_id` references `categories.id`. This helps prevent menu items from pointing to categories that do not exist **when foreign-key enforcement is enabled in the SQLite connection**. Prices cannot be negative under the table's `CHECK` constraint. The existing sample data supplies three categories, four items, and four toppings.

## Verification performed
Run from the repository root:

```powershell
python database/verify_schema.py
```

The verifier runs the existing schema and seed SQL in a temporary SQLite database held in memory, lists the four menu items by category, checks foreign-key integrity, and confirms that invalid categories and negative prices are rejected. It creates no database file and uses only Python's standard library.

**Expected end of output:** `PASS: Schema, menu categories, prices, and foreign keys verified`.

## Handoff for Task 2.2
The current `src/services/menuService.js` reads `data/menu.json`, and the `/api/menu` response identifies itself as seed data. Connecting that menu service to SQLite is separate integration work to coordinate with the Task 2.2 owner. Preserve the existing API's `categories` and `options` JSON structure so the frontend does not break. Enable SQLite foreign keys on every real database connection (`PRAGMA foreign_keys = ON`) and use parameterized SQL queries for any user-provided values.

## Review boundaries
This validates a working **database schema**, not a completed database-backed website, persistent orders, or production payments. Confirm the team's agreed database choice and review any recent GitHub changes before merging.
