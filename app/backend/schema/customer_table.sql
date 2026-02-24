-- ==========================================
-- Table: customer_table
-- Description: Stores customer records.
-- ==========================================

CREATE TABLE IF NOT EXISTS customer_table (
  id INT NOT NULL AUTO_INCREMENT,
  first_name VARCHAR(255) DEFAULT NULL,
  last_name VARCHAR(255) DEFAULT NULL,
  origin VARCHAR(255) DEFAULT NULL,
  age INT DEFAULT NULL,
  alias VARCHAR(255) DEFAULT NULL,
  beard TINYINT(1) DEFAULT NULL,
  favorite INT DEFAULT NULL,

  PRIMARY KEY (id),

  KEY fk_customer_favorite (favorite),

  CONSTRAINT fk_customer_favorite
    FOREIGN KEY (favorite)
    REFERENCES coffee_table(id)
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_0900_ai_ci;