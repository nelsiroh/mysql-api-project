-- ==========================================
-- Table: coffee_table
-- Description: Product catalog of coffee offerings.
-- Note: unit_price is the current catalog price; historical prices are captured in order_items.unit_price.
-- ==========================================

CREATE TABLE IF NOT EXISTS coffee_table (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) DEFAULT NULL,
  region VARCHAR(255) DEFAULT NULL,
  roast VARCHAR(255) DEFAULT NULL,
  unit_price DECIMAL(10,2) DEFAULT NULL,

  PRIMARY KEY (id)
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_0900_ai_ci;

ALTER TABLE coffee_table
  MODIFY name VARCHAR(255) NOT NULL,
  MODIFY unit_price DECIMAL(10,2) NOT NULL;