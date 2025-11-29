-- MySQL dump 10.13  Distrib 9.5.0, for macos15.7 (arm64)
--
-- Host: 127.0.0.1    Database: coffeedb
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `customer_table`
--

DROP TABLE IF EXISTS `customer_table`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_table` (
  `id` int NOT NULL AUTO_INCREMENT,
  `first_name` varchar(255) DEFAULT NULL,
  `last_name` varchar(255) DEFAULT NULL,
  `origin` varchar(255) DEFAULT NULL,
  `age` int DEFAULT NULL,
  `alias` varchar(255) DEFAULT NULL,
  `beard` tinyint(1) DEFAULT NULL,
  `favorite` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer_table`
--

LOCK TABLES `customer_table` WRITE;
/*!40000 ALTER TABLE `customer_table` DISABLE KEYS */;
INSERT INTO `customer_table` VALUES (1,'Thor','Odinson','Asgard',1500,'Strongest Avenger',1,5),(2,'Clint','Barton','Earth',35,'Hawkeye',0,3),(3,'Tony','Stark','Earth',52,'Iron Man',1,4),(4,'Peter','Parker','Earth',17,'Spiderman',0,1),(5,'Groot',NULL,'Planet X',18,'Tree',0,6);
/*!40000 ALTER TABLE `customer_table` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `coffee_table`
--

DROP TABLE IF EXISTS `coffee_table`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `coffee_table` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `region` varchar(255) DEFAULT NULL,
  `roast` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `coffee_table`
--

LOCK TABLES `coffee_table` WRITE;
/*!40000 ALTER TABLE `coffee_table` DISABLE KEYS */;
INSERT INTO `coffee_table` VALUES (1,'default route','ethiopia','light'),(2,'docker run','mexico','medium'),(3,'help desk','honduras','medium'),(4,'on-call','peru','dark'),(5,'ifconfig','tanzania','blonde'),(6,'traceroute','bali','med-dark');
/*!40000 ALTER TABLE `coffee_table` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_table`
--

DROP TABLE IF EXISTS `order_table`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_table` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_number` char(36) NOT NULL,
  `customer_id` int NOT NULL,
  `coffee_id` int NOT NULL,
  `quantity` int unsigned NOT NULL DEFAULT '1',
  `unit_price` decimal(10,2) NOT NULL,
  `total_price` decimal(10,2) GENERATED ALWAYS AS ((`quantity` * `unit_price`)) STORED,
  `status` enum('pending','paid','shipped','cancelled') NOT NULL DEFAULT 'pending',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_number` (`order_number`),
  KEY `customer_id` (`customer_id`),
  KEY `coffee_id` (`coffee_id`),
  CONSTRAINT `order_table_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customer_table` (`id`),
  CONSTRAINT `order_table_ibfk_2` FOREIGN KEY (`coffee_id`) REFERENCES `coffee_table` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=47 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_table`
--

LOCK TABLES `order_table` WRITE;
/*!40000 ALTER TABLE `order_table` DISABLE KEYS */;
INSERT INTO `order_table` (`id`, `order_number`, `customer_id`, `coffee_id`, `quantity`, `unit_price`, `status`, `created_at`, `updated_at`) VALUES (1,'bae740dc-dc79-494b-9599-0b0d61e9a975',1,5,2,5.55,'pending','2025-09-18 17:24:58','2025-09-18 17:24:58'),(2,'402f016e-505b-4303-83a4-0d089c977463',1,3,2,5.97,'pending','2025-11-22 17:24:58','2025-11-22 17:24:58'),(3,'ccbe04f7-5ba9-4501-96c9-f997d4ff8bfc',1,5,4,6.06,'pending','2025-08-19 17:24:58','2025-08-19 17:24:58'),(4,'926c1239-442e-4e06-bad5-82f449d67115',1,5,4,7.03,'shipped','2025-08-07 17:24:58','2025-08-07 17:24:58'),(5,'cbb7c32a-dd22-4038-9ff5-2c45ce811832',1,2,1,4.90,'pending','2025-09-08 17:24:58','2025-09-08 17:24:58'),(6,'4914a6f7-f391-4ce7-b49e-0fce3cdadd61',1,2,4,4.55,'shipped','2025-09-15 17:24:58','2025-09-15 17:24:58'),(7,'3568e4fc-d96f-4be8-93fa-dc34815c5ee4',1,2,2,3.92,'paid','2025-09-07 17:24:58','2025-09-07 17:24:58'),(8,'721ba443-b7b6-4f32-9d39-487515874926',1,5,1,6.75,'paid','2025-10-17 17:24:58','2025-10-17 17:24:58'),(9,'d94da52e-0cf2-45e7-b7e1-fea1acc69dc0',1,5,3,7.35,'pending','2025-10-06 17:24:58','2025-10-06 17:24:58'),(10,'d1ea2572-9c34-49c2-afa4-820aab555e6d',1,2,3,7.91,'pending','2025-11-24 17:24:58','2025-11-24 17:24:58'),(11,'9dee72ef-fa7f-4ae9-8f92-ba1278f24935',2,3,4,2.61,'pending','2025-08-28 17:24:58','2025-08-28 17:24:58'),(12,'019bf852-6727-4951-9a16-c2739e79b7bb',2,3,3,4.31,'paid','2025-08-22 17:24:58','2025-08-22 17:24:58'),(13,'4a692094-df46-4e81-b037-d45526a4f8f6',2,3,4,5.86,'shipped','2025-09-16 17:24:58','2025-09-16 17:24:58'),(14,'37291712-fd24-4654-9c17-4fc61ef5fddc',2,3,1,2.60,'shipped','2025-10-28 17:24:58','2025-10-28 17:24:58'),(15,'3368cb83-2176-4caf-8409-fd81298fd3e3',2,3,4,7.74,'pending','2025-10-19 17:24:58','2025-10-19 17:24:58'),(16,'dc098d3d-a634-4496-8386-ce53d254030a',2,3,4,3.13,'paid','2025-09-24 17:24:58','2025-09-24 17:24:58'),(17,'4a3b1687-ec54-48d3-81dd-20525f3ef111',2,3,2,6.58,'shipped','2025-09-23 17:24:58','2025-09-23 17:24:58'),(18,'50bde003-f394-4567-9678-43dacf45630d',2,3,4,6.20,'shipped','2025-10-10 17:24:58','2025-10-10 17:24:58'),(19,'cbd2737e-ee28-4cc8-96c8-f652b6aee720',2,3,1,3.48,'shipped','2025-09-28 17:24:58','2025-09-28 17:24:58'),(20,'a8cbef67-50f7-4a29-8227-20bc86aba2d3',2,3,1,6.46,'paid','2025-09-09 17:24:58','2025-09-09 17:24:58'),(21,'53a42a48-470e-4485-8817-d7e8ea2d39b7',2,1,4,7.72,'pending','2025-11-05 17:24:58','2025-11-05 17:24:58'),(22,'99bf7f9a-4960-4427-ace0-4190fbc3e03f',2,3,1,7.79,'pending','2025-09-07 17:24:58','2025-09-07 17:24:58'),(23,'482a2c27-a4a4-4f48-9c4d-8a5c55e7aa35',3,4,2,4.55,'paid','2025-11-19 17:24:58','2025-11-19 17:24:58'),(24,'16bfa770-b619-498f-a726-0ae37f9dc4c6',3,4,3,2.55,'paid','2025-08-24 17:24:58','2025-08-24 17:24:58'),(25,'81a15d18-6ea1-4b8d-8e05-5c8912bca227',3,4,2,6.84,'pending','2025-08-09 17:24:58','2025-08-09 17:24:58'),(26,'873e1bc7-70e5-44a4-b5b7-24d1a1ffe7e4',3,4,1,5.03,'shipped','2025-08-26 17:24:58','2025-08-26 17:24:58'),(27,'e84f4ad7-c7da-419b-a54d-1b8fea1f3592',3,5,2,6.33,'pending','2025-08-23 17:24:58','2025-08-23 17:24:58'),(28,'38fcee5c-81ee-408b-b817-2221f8e78caa',3,4,4,5.78,'paid','2025-10-11 17:24:58','2025-10-11 17:24:58'),(29,'f7fc4ded-0318-4c1e-b5c2-cf7aa1f9a3b1',4,1,3,7.77,'pending','2025-11-03 17:24:58','2025-11-03 17:24:58'),(30,'e9bd614d-76ef-4541-bb4d-e7872952f19a',4,1,3,7.62,'pending','2025-11-23 17:24:58','2025-11-23 17:24:58'),(31,'b62d1520-4ee4-467d-87fa-2f4e2ebafeaf',4,1,1,6.68,'shipped','2025-10-08 17:24:58','2025-10-08 17:24:58'),(32,'a7f74240-db1f-4323-9f65-6096c5d6bc3e',4,1,3,3.33,'paid','2025-08-13 17:24:58','2025-08-13 17:24:58'),(33,'315a0923-be97-4488-a1c4-576a05bd07ea',4,6,1,4.22,'paid','2025-08-24 17:24:58','2025-08-24 17:24:58'),(34,'a6e14bcb-9259-466b-8e3a-0efcfa9f2bb0',4,1,3,3.78,'pending','2025-08-30 17:24:58','2025-08-30 17:24:58'),(35,'b74a9bb5-97dd-43ec-827c-d1b0c20bd39f',4,1,4,5.84,'shipped','2025-08-10 17:24:58','2025-08-10 17:24:58'),(36,'bbedfe64-e11c-4bfe-b412-58a57473c1b9',4,3,2,4.12,'pending','2025-08-10 17:24:58','2025-08-10 17:24:58'),(37,'33cc42b5-1a22-467f-9f4a-a49e4f65eae5',4,1,2,4.34,'shipped','2025-11-22 17:24:58','2025-11-22 17:24:58'),(38,'b68eee3c-5836-4809-ac7d-efa978553553',4,1,4,2.94,'pending','2025-10-30 17:24:58','2025-10-30 17:24:58'),(39,'90c60e0a-7d7b-4db5-be4e-9fceae16f003',4,2,2,6.08,'paid','2025-11-20 17:24:58','2025-11-20 17:24:58'),(40,'c5991f9a-2fcf-433d-8bc5-25bcdab17cfb',5,4,3,2.83,'pending','2025-09-25 17:24:58','2025-09-25 17:24:58'),(41,'d3188e07-2bfc-406c-959e-a12c61512b2f',5,3,1,2.96,'shipped','2025-08-29 17:24:58','2025-08-29 17:24:58'),(42,'66f06150-4e7e-4f45-a7dd-9b7ebcb7175e',5,6,3,4.54,'paid','2025-08-27 17:24:58','2025-08-27 17:24:58'),(43,'6f29321d-ea5d-4182-99eb-aae5c540630e',5,5,1,3.35,'shipped','2025-09-12 17:24:58','2025-09-12 17:24:58'),(44,'91fdb138-43e3-4cc4-8fc0-ba026dff2047',5,6,1,3.86,'paid','2025-09-01 17:24:58','2025-09-01 17:24:58'),(45,'732797f5-4798-4ac2-8e57-99363cc479ae',5,6,4,2.60,'shipped','2025-10-30 17:24:58','2025-10-30 17:24:58'),(46,'82f248c6-03f3-4be3-8553-0eb540859c34',5,6,1,3.86,'shipped','2025-11-26 17:24:58','2025-11-26 17:24:58');
/*!40000 ALTER TABLE `order_table` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-28 17:34:05
