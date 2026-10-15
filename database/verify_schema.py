"""Task 2.1: Test the Pizza Pie Parlor SQLite schema and menu seed data.

Run from the project's root: python database/verify_schema.py
Only the Python standard library is required. No database file is created.
"""
from pathlib import Path
import sqlite3

DATABASE_DIR = Path(__file__).resolve().parent


def main():
    connection = sqlite3.connect(":memory:")
    try:
        connection.execute("PRAGMA foreign_keys = ON")
        connection.executescript((DATABASE_DIR / "schema.sql").read_text(encoding="utf-8"))
        connection.executescript((DATABASE_DIR / "seed.sql").read_text(encoding="utf-8"))

        for table in ("categories", "menu_items", "toppings"):
            total = connection.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
            print(f"{table}: {total} records")

        menu = connection.execute("""
            SELECT c.name, i.name, i.base_price
            FROM menu_items AS i
            JOIN categories AS c ON i.category_id = c.id
            WHERE i.active = 1
            ORDER BY c.sort_order, i.name
        """).fetchall()
        for category, item, price in menu:
            print(f"{category}: {item} - ${price:.2f}")
        assert len(menu) == 4, "Expected four sample menu items"
        assert not connection.execute("PRAGMA foreign_key_check").fetchall(), "Invalid foreign key"

        for item_id, category_id, price in (
            ("bad-category", "not-a-category", 10),
            ("bad-price", "pizzas", -1),
        ):
            try:
                connection.execute("""
                    INSERT INTO menu_items
                    (id, category_id, name, description, base_price)
                    VALUES (?, ?, 'Test item', 'Validation check', ?)
                """, (item_id, category_id, price))
            except sqlite3.IntegrityError:
                pass  # Invalid menu records should be rejected.
            else:
                raise AssertionError(f"Database accepted invalid item: {item_id}")

        print("PASS: Schema, menu categories, prices, and foreign keys verified")
    finally:
        connection.close()


if __name__ == "__main__":
    main()
