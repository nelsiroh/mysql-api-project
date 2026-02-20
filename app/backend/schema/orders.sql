CREATE TABLE IF NOT EXISTS orders (
  id            BIGINT NOT NULL AUTO_INCREMENT,
  order_number  CHAR(26) NOT NULL,
  customer_id   INT NOT NULL,

  subtotal      DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  tax           DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  grand_total   DECIMAL(10,2) NOT NULL DEFAULT 0.00,

  status ENUM(
      'PENDING',
      'PAID',
      'FULFILLED',
      'CANCELLED',
      'REFUNDED'
  ) NOT NULL DEFAULT 'PENDING',

  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                  ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_order_number (order_number),
  KEY idx_orders_customer (customer_id),

  CONSTRAINT fk_orders_customer
    FOREIGN KEY (customer_id)
    REFERENCES customer_table(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;