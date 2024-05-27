-- MySQLShell dump 2.0.1  Distrib Ver 8.1.1-g2 for Win64 on x86_64 - for MySQL 8.1.0 (MySQL Community Server (GPL)), for Win64 (x86_64)
--
-- Host: localhost    Database: valorant_data    Table: valorant_weapon_spec
-- ------------------------------------------------------
-- Server version	8.0.32

--
-- Table structure for table `valorant_weapon_spec`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `valorant_weapon_spec` (
  `weapon` text,
  `Price` int DEFAULT NULL,
  `Fire_Rate` double DEFAULT NULL,
  `Damage_Head` int DEFAULT NULL,
  `Damage_Body` int DEFAULT NULL,
  `Damage_Leg` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
