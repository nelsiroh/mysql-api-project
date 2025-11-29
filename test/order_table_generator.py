import uuid
import random
import mysql.connector
from datetime import datetime, timedelta

# ---------------------------------------
# DB CONFIG — adjust as required
# ---------------------------------------
conn = mysql.connector.connect(
    host="127.0.0.1",
    user="root",
    password="rootpasswd",
    database="coffeedb"
)

cursor = conn.cursor(dictionary=True)

# ---------------------------------------
# Load customer and coffee info
# ---------------------------------------
cursor.execute("SELECT id, favorite AS favorite_coffee_id FROM customer_table")
customers = cursor.fetchall()

cursor.execute("SELECT id FROM coffee_table")
coffee_ids = [row["id"] for row in cursor.fetchall()]

if not customers or not coffee_ids:
    raise RuntimeError("Populate customer_table and coffee_table first.")

# ---------------------------------------
# Coffee selection logic with bias
# ---------------------------------------
def pick_coffee(customer):
    favorite = customer["favorite_coffee_id"]

    # 70% chance they order their favorite if it exists
    if favorite in coffee_ids and random.random() < 0.70:
        return favorite
    
    # Otherwise, pick from everything (experiment or gift)
    return random.choice(coffee_ids)

# ---------------------------------------
# Generate a single order row
# ---------------------------------------
def random_order_row(customer):
    coffee_id = pick_coffee(customer)
    quantity = random.randint(1, 4)
    unit_price = round(random.uniform(2.50, 8.00), 2)
    status = random.choice(["pending", "paid", "shipped"])

    # Spread randomly across the past 120 days
    created_at = datetime.now() - timedelta(days=random.randint(0, 120))
    updated_at = created_at

    return (
        str(uuid.uuid4()),       # order_number
        customer["id"],          # customer_id
        coffee_id,
        quantity,
        unit_price,
        status,
        created_at,
        updated_at
    )

# ---------------------------------------
# Insert synthetic data
# ---------------------------------------
ORDERS_PER_CUSTOMER = (2, 12)   # min, max per customer

SQL = """
INSERT INTO order_table
(order_number, customer_id, coffee_id, quantity, unit_price, status, created_at, updated_at)
VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
"""

rows = []

for customer in customers:
    num_orders = random.randint(*ORDERS_PER_CUSTOMER)
    for _ in range(num_orders):
        rows.append(random_order_row(customer))

for r in rows:
    cursor.execute(SQL, r)

conn.commit()
cursor.close()
conn.close()

print(f"Inserted {len(rows)} synthetic orders.")
