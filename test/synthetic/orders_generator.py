import os
import random
from decimal import Decimal, ROUND_HALF_UP
from datetime import datetime, timezone

import mysql.connector


# -----------------------------
# CONFIG
# -----------------------------
DB_CONFIG = {
    "host": os.getenv("DB_HOST", "127.0.0.1"),
    "user": os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASSWORD", "rootpasswd"),
    "database": os.getenv("DB_NAME", "coffeedb"),
    "port": int(os.getenv("DB_PORT","3306")),
}

NUM_ORDERS = int(os.getenv("NUM_ORDERS", "50"))
TAX_RATE = Decimal(os.getenv("TAX_RATE", "0.0825"))  # 8.25% default

# STATUSES = ["PENDING", "PAID", "FULFILLED", "CANCELLED", "REFUNDED"]


# -----------------------------
# HELPERS
# -----------------------------
def money(x: Decimal) -> Decimal:
    return x.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def gen_order_number_26() -> str:
    """
    Generates a 26-char human-safe order number.
    Not a strict ULID, but stable, URL-safe, and unique enough for seeding.
    """
    alphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"  # Crockford-ish, no I/L/O/U
    # 10 chars time + 16 chars random = 26
    t = int(datetime.now(timezone.utc).timestamp() * 1000)
    time_part = ""
    for _ in range(10):
        t, r = divmod(t, len(alphabet))
        time_part = alphabet[r] + time_part
    rand_part = "".join(random.choice(alphabet) for _ in range(16))
    return time_part + rand_part


def fetch_ids(cursor, query, key="id"):
    cursor.execute(query)
    rows = cursor.fetchall()
    return [row[key] for row in rows]


def fetch_coffee_map(cursor):
    cursor.execute("SELECT id, unit_price FROM coffee_table")
    return {row["id"]: Decimal(str(row["unit_price"])) for row in cursor.fetchall()}


# -----------------------------
# MAIN
# -----------------------------
def main():
    conn = mysql.connector.connect(**DB_CONFIG)
    conn.autocommit = True
    cursor = conn.cursor(dictionary=True)

    customer_ids = fetch_ids(cursor, "SELECT id FROM customer_table")
    if not customer_ids:
        raise RuntimeError("No customers found in customer_table.")

    coffee_price = fetch_coffee_map(cursor)
    coffee_ids = list(coffee_price.keys())
    if not coffee_ids:
        raise RuntimeError("No coffees found in coffee_table.")

    created_orders = 0

    for _ in range(NUM_ORDERS):
        customer_id = random.choice(customer_ids)
        order_number = gen_order_number_26()
        status = random.choice(["PENDING", "PAID", "FULFILLED", "CANCELLED"])
        if status in ["PAID", "FULFILLED"] and random.random() < 0.10:
            status = "REFUNDED"

        # 1 to 4 distinct products in the same order
        num_items = random.randint(1, 4)
        chosen_coffees = random.sample(coffee_ids, k=min(num_items, len(coffee_ids)))

        try:
            conn.start_transaction()

            # Insert order header (totals filled after items)
            cursor.execute(
                """
                INSERT INTO orders (order_number, customer_id, subtotal, tax, grand_total, status)
                VALUES (%s, %s, 0.00, 0.00, 0.00, %s)
                """,
                (order_number, customer_id, status),
            )
            order_id = cursor.lastrowid

            subtotal = Decimal("0.00")

            # Insert line items
            for coffee_id in chosen_coffees:
                qty = random.randint(1, 5)
                unit_price = coffee_price[coffee_id]  # historical snapshot
                line_total = money(unit_price * Decimal(qty))
                subtotal += line_total

                cursor.execute(
                    """
                    INSERT INTO order_items (order_id, coffee_id, quantity, unit_price, line_total)
                    VALUES (%s, %s, %s, %s, %s)
                    """,
                    (order_id, coffee_id, qty, str(unit_price), str(line_total)),
                )

            subtotal = money(subtotal)
            tax = money(subtotal * TAX_RATE)
            grand_total = money(subtotal + tax)

            # Update totals on order header
            cursor.execute(
                """
                UPDATE orders
                SET subtotal = %s, tax = %s, grand_total = %s
                WHERE id = %s
                """,
                (str(subtotal), str(tax), str(grand_total), order_id),
            )

            conn.commit()
            created_orders += 1

        except Exception as e:
            conn.rollback()
            raise RuntimeError(f"Failed creating order {order_number}: {e}") from e

    cursor.close()
    conn.close()
    print(f"Created {created_orders} orders with items.")


if __name__ == "__main__":
    main()
