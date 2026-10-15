Database Handoff

schema.sql covers the Sprint 1 menu/category/topping schema requirement and
also defines promotions. seed.sql contains sample data that matches the
prototype API.

The current /api/menu route uses data/menu.json so frontend development can
continue immediately without waiting on the database implementation. The final
database teammate can replace src/services/menuService.js with a database-
backed implementation while keeping the API contract unchanged.

Parameterized query rule

Never concatenate user input into SQL.

Bad:
const sql = "SELECT * FROM menu_items WHERE id = '" + id + "'";

Good patterns use a parameter placeholder:
db.prepare(
    "SELECT * FROM menu_items WHERE id = ?"
).get(id);

or the equivalent parameter API for the selected database driver.

The same rule applies to inserts, updates, cart persistence, orders, and
promotion lookups.
