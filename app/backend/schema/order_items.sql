CREATE TABLE IF NOT EXISTS order_items (
  id          BIGINT NOT NULL AUTO_INCREMENT,
  order_id    BIGINT NOT NULL,
  coffee_id   INT NOT NULL,
  quantity    INT NOT NULL,

  unit_price  DECIMAL(10,2) NOT NULL,   -- historical price snapshot
  line_total  DECIMAL(10,2) NOT NULL,   -- quantity * unit_price

  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  KEY idx_order_items_order (order_id),
  KEY idx_order_items_coffee (coffee_id),

  CONSTRAINT fk_order_items_order
    FOREIGN KEY (order_id)
    REFERENCES orders(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_order_items_coffee
    FOREIGN KEY (coffee_id)
    REFERENCES coffee_table(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;