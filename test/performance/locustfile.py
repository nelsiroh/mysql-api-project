import random
import time
from locust import HttpUser, task, between

class CoffeeUser(HttpUser):
    wait_time = between(0.2, 1.5)

    def on_start(self):
        r = self.client.get("/coffees")
        self.coffee_ids = [c["id"] for c in r.json()]

        r = self.client.get("/users")
        self.customer_ids = [u["id"] for u in r.json()]

    @task(5)
    def create_order(self):
        payload = {
            "customer_id": random.choice(self.customer_ids),
            "coffee_id": random.choice(self.coffee_ids),
            "quantity": random.randint(1, 5),
        }

        with self.client.post("/order", json=payload, catch_response=True) as r:
            if r.status_code != 201:
                r.failure(f"{r.status_code} {r.text}")
                return
            order_id = r.json()["id"]

        roll = random.random()

        if roll < 0.05:
            # Immediate cancellation
            time.sleep(random.uniform(0.05, 0.3))
            self.update_status(order_id, "CANCELLED")

        else:
            # Payment step
            time.sleep(random.uniform(0.05, 0.3))
            self.update_status(order_id, "PAID")

            # Fulfillment step
            if random.random() < 0.60:
                time.sleep(random.uniform(0.05, 0.3))
                self.update_status(order_id, "FULFILLED")

                # Rare refund after fulfillment
                if random.random() < 0.02:
                    time.sleep(random.uniform(0.05, 0.3))
                    self.update_status(order_id, "REFUNDED")

    def update_status(self, order_id, status):
        self.client.patch(
            f"/order/{order_id}/status",
            json={"status": status},
            name="/order/:id/status"
        )