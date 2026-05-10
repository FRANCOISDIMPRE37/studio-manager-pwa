-- MySQL dump 10.13  Distrib 8.0.45, for Linux (x86_64)
--
-- Host: bo810531-001.eu.clouddb.ovh.net    Database: studiomanager
-- ------------------------------------------------------
-- Server version	8.4.8-8

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
-- Table structure for table `admin_article_reads`
--

DROP TABLE IF EXISTS `admin_article_reads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_article_reads` (
  `id` int NOT NULL AUTO_INCREMENT,
  `articleId` int NOT NULL,
  `userId` int NOT NULL,
  `readAt` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_article_reads`
--

LOCK TABLES `admin_article_reads` WRITE;
/*!40000 ALTER TABLE `admin_article_reads` DISABLE KEYS */;
/*!40000 ALTER TABLE `admin_article_reads` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admin_articles`
--

DROP TABLE IF EXISTS `admin_articles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_articles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `titre` varchar(300) NOT NULL,
  `contenu` text NOT NULL,
  `type` enum('annonce','mise_a_jour','legal','formation','promo') NOT NULL DEFAULT 'annonce',
  `statut` enum('brouillon','publie','archive') NOT NULL DEFAULT 'brouillon',
  `ciblePlanType` varchar(100) DEFAULT NULL,
  `important` tinyint(1) NOT NULL DEFAULT '0',
  `publieLe` timestamp NULL DEFAULT NULL,
  `expireLe` timestamp NULL DEFAULT NULL,
  `createdByUserId` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_articles`
--

LOCK TABLES `admin_articles` WRITE;
/*!40000 ALTER TABLE `admin_articles` DISABLE KEYS */;
/*!40000 ALTER TABLE `admin_articles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admin_notifications`
--

DROP TABLE IF EXISTS `admin_notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `titre` varchar(300) NOT NULL,
  `message` text NOT NULL,
  `type` enum('info','warning','success','error') NOT NULL DEFAULT 'info',
  `targetUserId` int DEFAULT NULL,
  `targetPlanType` varchar(100) DEFAULT NULL,
  `lu` tinyint(1) NOT NULL DEFAULT '0',
  `luAt` timestamp NULL DEFAULT NULL,
  `createdByUserId` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_notifications`
--

LOCK TABLES `admin_notifications` WRITE;
/*!40000 ALTER TABLE `admin_notifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `admin_notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `archives_papier`
--

DROP TABLE IF EXISTS `archives_papier`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `archives_papier` (
  `id` varchar(36) NOT NULL,
  `userId` int NOT NULL,
  `nom` varchar(100) NOT NULL,
  `prenom` varchar(100) NOT NULL,
  `ville` varchar(100) DEFAULT NULL,
  `code_postal` varchar(10) DEFAULT NULL,
  `telephone` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `photo_url` varchar(500) DEFAULT NULL,
  `createdAt` bigint NOT NULL,
  `updatedAt` bigint NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `archives_papier`
--

LOCK TABLES `archives_papier` WRITE;
/*!40000 ALTER TABLE `archives_papier` DISABLE KEYS */;
/*!40000 ALTER TABLE `archives_papier` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int DEFAULT NULL,
  `studioUserId` int DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `ip` varchar(45) DEFAULT NULL,
  `userAgent` varchar(500) DEFAULT NULL,
  `success` tinyint(1) NOT NULL DEFAULT '1',
  `details` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=272 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `clients`
--

DROP TABLE IF EXISTS `clients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clients` (
  `id` varchar(36) NOT NULL,
  `userId` int NOT NULL,
  `nom` varchar(100) NOT NULL,
  `prenom` varchar(100) NOT NULL,
  `dateNaissance` text NOT NULL,
  `adresse` text,
  `codePostal` varchar(10) DEFAULT NULL,
  `ville` varchar(100) DEFAULT NULL,
  `telephone` text NOT NULL,
  `email` text,
  `pieceIdentiteType` enum('CNI','Passeport','Permis','Autre') DEFAULT NULL,
  `pieceIdentiteNumero` text,
  `estMineur` tinyint(1) NOT NULL DEFAULT '0',
  `nomRepresentantLegal` text,
  `prenomRepresentantLegal` text,
  `telephoneRepresentantLegal` text,
  `lienRepresentantLegal` varchar(50) DEFAULT NULL,
  `estArchive` tinyint(1) NOT NULL DEFAULT '0',
  `dateArchivage` varchar(10) DEFAULT NULL,
  `dateConsentement` varchar(10) DEFAULT NULL,
  `dateSuppressionPrevue` varchar(10) NOT NULL,
  `rgpdDroitsExerces` json DEFAULT (_utf8mb4'[]'),
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  `employeeId` int DEFAULT NULL,
  `est_salarie` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `employeeId` (`employeeId`),
  CONSTRAINT `clients_ibfk_1` FOREIGN KEY (`employeeId`) REFERENCES `employees` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clients`
--

LOCK TABLES `clients` WRITE;
/*!40000 ALTER TABLE `clients` DISABLE KEYS */;
INSERT INTO `clients` VALUES ('Hu-SFV-V_3r97NkYG9QBE',397,'DUPUIS','MARIE','1978-03-19','','','','{\"iv\":\"dc7071c42c51af57e61cda1e\",\"tag\":\"50920eca9f81cbd8c19dd9f01c85c178\",\"data\":\"ab135bcc019f9a919cad86\"}',NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,1,'2026-05-08','2026-05-08','2031-05-08','[]','2026-05-08 21:20:32','2026-05-08 21:22:42',NULL,0);
/*!40000 ALTER TABLE `clients` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `documents`
--

DROP TABLE IF EXISTS `documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `documents` (
  `id` varchar(36) NOT NULL,
  `clientId` varchar(36) NOT NULL,
  `userId` int NOT NULL,
  `type` varchar(100) NOT NULL,
  `status` enum('empty','filled','signed') NOT NULL DEFAULT 'empty',
  `data` json DEFAULT (_utf8mb4'{}'),
  `signatureClient` text,
  `signatureProfessionnel` text,
  `signatureRepresentant` text,
  `dateSigned` varchar(10) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  `confidentialityAccepted` tinyint(1) NOT NULL DEFAULT '0',
  `confidentialityAcceptedAt` timestamp NULL DEFAULT NULL,
  `confidentialityIpAddress` varchar(45) DEFAULT NULL,
  `rgpdConsentGiven` tinyint(1) NOT NULL DEFAULT '0',
  `rgpdConsentTimestamp` timestamp NULL DEFAULT NULL,
  `rgpdConsentIpAddress` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `documents`
--

LOCK TABLES `documents` WRITE;
/*!40000 ALTER TABLE `documents` DISABLE KEYS */;
INSERT INTO `documents` VALUES ('doc-1778275231608-ondsae','Hu-SFV-V_3r97NkYG9QBE',397,'questionnaire_majeur','empty','\"{\\\"iv\\\":\\\"968e02163f0552f7fb286f55\\\",\\\"tag\\\":\\\"86a198cb591b6f9bd81255d4ca571f9b\\\",\\\"data\\\":\\\"4509\\\"}\"',NULL,NULL,NULL,NULL,'2026-05-08 21:20:32','2026-05-08 21:20:32',0,NULL,NULL,0,NULL,NULL),('doc-1778275231667-w4ot7c','Hu-SFV-V_3r97NkYG9QBE',397,'fiche_seance_piercing','empty','\"{\\\"iv\\\":\\\"16198870a3af7b1f41e6bce7\\\",\\\"tag\\\":\\\"c787f01639cf96025c08ffc72f5f0171\\\",\\\"data\\\":\\\"4bf0\\\"}\"',NULL,NULL,NULL,NULL,'2026-05-08 21:20:32','2026-05-08 21:20:32',0,NULL,NULL,0,NULL,NULL),('doc-1778275231720-o7sj0n','Hu-SFV-V_3r97NkYG9QBE',397,'soins_oreilles','empty','\"{\\\"iv\\\":\\\"d71e60944ee65b5d155dec23\\\",\\\"tag\\\":\\\"07cb5e7933b30972dcf5b3581102aec7\\\",\\\"data\\\":\\\"6346\\\"}\"',NULL,NULL,NULL,NULL,'2026-05-08 21:20:32','2026-05-08 21:20:32',0,NULL,NULL,0,NULL,NULL),('doc-1778333932970-2r295g','madzFnJElLW7qqUxDqsxh',397,'questionnaire_tatouage_mineur','empty','\"{\\\"iv\\\":\\\"a627ded76fd228566bf38483\\\",\\\"tag\\\":\\\"92942e9c023dc9c5d362c2e55f6d652d\\\",\\\"data\\\":\\\"0a67\\\"}\"',NULL,NULL,NULL,NULL,'2026-05-09 13:38:53','2026-05-09 13:38:53',0,NULL,NULL,0,NULL,NULL),('doc-1778333933019-pr75xg','madzFnJElLW7qqUxDqsxh',397,'fiche_seance_tatouage','empty','\"{\\\"iv\\\":\\\"08a0b2539509e422cf88d02e\\\",\\\"tag\\\":\\\"e366cb1ff9db1b40493c53161219a6f5\\\",\\\"data\\\":\\\"2f1d\\\"}\"',NULL,NULL,NULL,NULL,'2026-05-09 13:38:53','2026-05-09 13:38:53',0,NULL,NULL,0,NULL,NULL);
/*!40000 ALTER TABLE `documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `documents_salaries`
--

DROP TABLE IF EXISTS `documents_salaries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `documents_salaries` (
  `id` varchar(36) NOT NULL,
  `studioUserId` int NOT NULL,
  `ownerId` int NOT NULL,
  `type` varchar(100) NOT NULL,
  `titre` varchar(300) NOT NULL,
  `contenu` longtext,
  `status` enum('draft','signe') DEFAULT 'draft',
  `signatureSalarie` text,
  `dateSigne` varchar(10) DEFAULT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `studioUserId` (`studioUserId`),
  CONSTRAINT `documents_salaries_ibfk_1` FOREIGN KEY (`studioUserId`) REFERENCES `studio_users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `documents_salaries`
--

LOCK TABLES `documents_salaries` WRITE;
/*!40000 ALTER TABLE `documents_salaries` DISABLE KEYS */;
/*!40000 ALTER TABLE `documents_salaries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employees`
--

DROP TABLE IF EXISTS `employees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employees` (
  `id` int NOT NULL AUTO_INCREMENT,
  `prenom` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nom` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `adresse` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `codePostal` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ville` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pin` varchar(4) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `passwordHash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `typeContrat` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'CDI',
  `dateEntree` date DEFAULT NULL,
  `dateSortie` date DEFAULT NULL,
  `documentConfidentialiteSigne` tinyint(1) DEFAULT '0',
  `signatureConfidentialite` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `dateSignatureConfidentialite` datetime DEFAULT NULL,
  `ownerId` int NOT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_pin_per_studio` (`ownerId`,`pin`),
  CONSTRAINT `employees_ibfk_1` FOREIGN KEY (`ownerId`) REFERENCES `studios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employees`
--

LOCK TABLES `employees` WRITE;
/*!40000 ALTER TABLE `employees` DISABLE KEYS */;
/*!40000 ALTER TABLE `employees` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invitations`
--

DROP TABLE IF EXISTS `invitations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invitations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(64) NOT NULL,
  `email` varchar(320) DEFAULT NULL,
  `planType` enum('trial','solo','studio','multi') NOT NULL DEFAULT 'trial',
  `trialDays` int NOT NULL DEFAULT '30',
  `usedByUserId` int DEFAULT NULL,
  `usedAt` timestamp NULL DEFAULT NULL,
  `expiresAt` timestamp NULL DEFAULT NULL,
  `createdByUserId` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  UNIQUE KEY `invitations_code_unique` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invitations`
--

LOCK TABLES `invitations` WRITE;
/*!40000 ALTER TABLE `invitations` DISABLE KEYS */;
/*!40000 ALTER TABLE `invitations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `licenses`
--

DROP TABLE IF EXISTS `licenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `licenses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `planType` enum('trial','solo','studio','multi','starter','premium') NOT NULL DEFAULT 'trial',
  `status` enum('active','suspended','expired','cancelled') NOT NULL DEFAULT 'active',
  `expiresAt` timestamp NULL DEFAULT NULL,
  `featureClients` tinyint(1) NOT NULL DEFAULT '1',
  `featureDocuments` tinyint(1) NOT NULL DEFAULT '1',
  `featureAgenda` tinyint(1) NOT NULL DEFAULT '1',
  `featureSms` tinyint(1) NOT NULL DEFAULT '0',
  `featureMultiUsers` tinyint(1) NOT NULL DEFAULT '0',
  `featureExport` tinyint(1) NOT NULL DEFAULT '1',
  `maxClients` int NOT NULL DEFAULT '100',
  `maxUsers` int NOT NULL DEFAULT '1',
  `notes` text,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `licenses_userId_unique` (`userId`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `licenses`
--

LOCK TABLES `licenses` WRITE;
/*!40000 ALTER TABLE `licenses` DISABLE KEYS */;
/*!40000 ALTER TABLE `licenses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `prestations`
--

DROP TABLE IF EXISTS `prestations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `prestations` (
  `id` varchar(36) NOT NULL,
  `clientId` varchar(36) NOT NULL,
  `userId` int NOT NULL,
  `date` varchar(10) NOT NULL,
  `type` enum('piercing','tatouage','dermographie') NOT NULL,
  `zone` varchar(200) NOT NULL,
  `description` text,
  `photos` json DEFAULT (_utf8mb4'[]'),
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `prestations`
--

LOCK TABLES `prestations` WRITE;
/*!40000 ALTER TABLE `prestations` DISABLE KEYS */;
/*!40000 ALTER TABLE `prestations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rdv_rappels`
--

DROP TABLE IF EXISTS `rdv_rappels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rdv_rappels` (
  `id` varchar(36) NOT NULL,
  `userId` int NOT NULL,
  `rdvId` varchar(36) NOT NULL,
  `rdvDate` varchar(10) NOT NULL,
  `rdvHeure` varchar(5) NOT NULL,
  `clientNom` varchar(200) DEFAULT NULL,
  `clientEmail` varchar(320) DEFAULT NULL,
  `sentAt` bigint NOT NULL,
  `statut` enum('envoye','erreur','ignore') NOT NULL DEFAULT 'envoye',
  `errorMessage` text,
  `createdAt` bigint NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rdv_rappels`
--

LOCK TABLES `rdv_rappels` WRITE;
/*!40000 ALTER TABLE `rdv_rappels` DISABLE KEYS */;
/*!40000 ALTER TABLE `rdv_rappels` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rendez_vous`
--

DROP TABLE IF EXISTS `rendez_vous`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rendez_vous` (
  `id` varchar(36) NOT NULL,
  `userId` int NOT NULL,
  `clientId` varchar(36) DEFAULT NULL,
  `clientNom` varchar(200) DEFAULT NULL,
  `clientTelephone` varchar(20) DEFAULT NULL,
  `date` varchar(10) NOT NULL,
  `heureDebut` varchar(5) NOT NULL,
  `heureFin` varchar(5) NOT NULL,
  `type` enum('piercing','tatouage','dermographie','consultation','retouche','autre') NOT NULL,
  `zone` varchar(200) DEFAULT NULL,
  `notes` text,
  `statut` enum('confirme','en_attente','annule','termine') NOT NULL DEFAULT 'confirme',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rendez_vous`
--

LOCK TABLES `rendez_vous` WRITE;
/*!40000 ALTER TABLE `rendez_vous` DISABLE KEYS */;
/*!40000 ALTER TABLE `rendez_vous` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rgpd_consent_logs`
--

DROP TABLE IF EXISTS `rgpd_consent_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rgpd_consent_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `documentId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `clientId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` int NOT NULL,
  `consentType` enum('confidentiality','signature_client','signature_professionnel') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `accepted` tinyint(1) NOT NULL DEFAULT '0',
  `ipAddress` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_document` (`documentId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rgpd_consent_logs`
--

LOCK TABLES `rgpd_consent_logs` WRITE;
/*!40000 ALTER TABLE `rgpd_consent_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `rgpd_consent_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rgpd_rappels`
--

DROP TABLE IF EXISTS `rgpd_rappels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rgpd_rappels` (
  `id` varchar(36) NOT NULL,
  `userId` int NOT NULL,
  `clientId` varchar(36) NOT NULL,
  `clientEmail` varchar(320) DEFAULT NULL,
  `sentAt` bigint NOT NULL,
  `createdAt` bigint NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rgpd_rappels`
--

LOCK TABLES `rgpd_rappels` WRITE;
/*!40000 ALTER TABLE `rgpd_rappels` DISABLE KEYS */;
/*!40000 ALTER TABLE `rgpd_rappels` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `salon_settings`
--

DROP TABLE IF EXISTS `salon_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `salon_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `nom` varchar(200) NOT NULL DEFAULT 'Mon Studio',
  `raisonSociale` varchar(200) DEFAULT NULL,
  `adresse` text,
  `codePostal` varchar(10) DEFAULT NULL,
  `ville` varchar(100) DEFAULT NULL,
  `telephone` varchar(20) DEFAULT NULL,
  `email` varchar(320) DEFAULT NULL,
  `siret` varchar(20) DEFAULT NULL,
  `siren` varchar(9) DEFAULT NULL,
  `nomPierceur` varchar(200) DEFAULT NULL,
  `nomTatoueur` varchar(200) DEFAULT NULL,
  `nomDermographe` varchar(200) DEFAULT NULL,
  `pinHash` text,
  `passwordHash` text,
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  `logo` text,
  `siteWeb` varchar(500) DEFAULT NULL,
  `mentionsLegales` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `salon_settings_userId_unique` (`userId`)
) ENGINE=InnoDB AUTO_INCREMENT=48 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `salon_settings`
--

LOCK TABLES `salon_settings` WRITE;
/*!40000 ALTER TABLE `salon_settings` DISABLE KEYS */;
INSERT INTO `salon_settings` VALUES (25,397,'Studio Pierceur Tatoueur Dermographe',NULL,'1 Impasse du palais','37000','TOURS','0617074169','contact@intemporelle.eu',NULL,NULL,NULL,NULL,NULL,'$2b$10$5Z6Zb/E6Zt5xUUQHXkLBtOJ6NZNSceigAx0lQaQPuar4goox8blOG','$2b$10$gbY98wOI782Ie7kVfU6QQOFtn3sLAJDZA6BC0gbvSAzNX6A3r5kV6','2026-05-10 01:19:42',NULL,NULL,NULL);
/*!40000 ALTER TABLE `salon_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shared_services`
--

DROP TABLE IF EXISTS `shared_services`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shared_services` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nom` varchar(200) NOT NULL,
  `description` text,
  `type` enum('piercing','tatouage','dermographie') NOT NULL,
  `zone` varchar(200) DEFAULT NULL,
  `prixConseille` int DEFAULT NULL,
  `dureeMinutes` int DEFAULT NULL,
  `actif` tinyint(1) NOT NULL DEFAULT '1',
  `createdByUserId` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shared_services`
--

LOCK TABLES `shared_services` WRITE;
/*!40000 ALTER TABLE `shared_services` DISABLE KEYS */;
/*!40000 ALTER TABLE `shared_services` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sms_config`
--

DROP TABLE IF EXISTS `sms_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sms_config` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `apiKey` text NOT NULL,
  `senderName` varchar(11) NOT NULL DEFAULT 'Studio',
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sms_config_userId_unique` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sms_config`
--

LOCK TABLES `sms_config` WRITE;
/*!40000 ALTER TABLE `sms_config` DISABLE KEYS */;
/*!40000 ALTER TABLE `sms_config` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `smtp_config`
--

DROP TABLE IF EXISTS `smtp_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `smtp_config` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `host` varchar(200) NOT NULL DEFAULT 'smtp.ionos.fr',
  `port` int NOT NULL DEFAULT '587',
  `secure` tinyint(1) NOT NULL DEFAULT '0',
  `user` varchar(320) NOT NULL DEFAULT '',
  `password` text NOT NULL DEFAULT (_utf8mb4''),
  `fromName` varchar(200) DEFAULT NULL,
  `replyTo` varchar(320) DEFAULT NULL,
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `smtp_config_userId_unique` (`userId`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `smtp_config`
--

LOCK TABLES `smtp_config` WRITE;
/*!40000 ALTER TABLE `smtp_config` DISABLE KEYS */;
/*!40000 ALTER TABLE `smtp_config` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `studio_salaries`
--

DROP TABLE IF EXISTS `studio_salaries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `studio_salaries` (
  `id` int NOT NULL AUTO_INCREMENT,
  `studioId` int NOT NULL,
  `prenom` varchar(100) NOT NULL,
  `nom` varchar(100) NOT NULL,
  `pin` varchar(4) NOT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `studioId` (`studioId`),
  CONSTRAINT `studio_salaries_ibfk_1` FOREIGN KEY (`studioId`) REFERENCES `studios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `studio_salaries`
--

LOCK TABLES `studio_salaries` WRITE;
/*!40000 ALTER TABLE `studio_salaries` DISABLE KEYS */;
/*!40000 ALTER TABLE `studio_salaries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `studio_users`
--

DROP TABLE IF EXISTS `studio_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `studio_users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ownerId` int NOT NULL,
  `prenom` varchar(100) NOT NULL,
  `nom` varchar(100) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `login` varchar(100) NOT NULL,
  `passwordHash` text NOT NULL,
  `role` enum('admin','employe','stagiaire') NOT NULL DEFAULT 'employe',
  `actif` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  `pinHash` text,
  `typeContrat` varchar(100) DEFAULT NULL,
  `dateEntree` varchar(10) DEFAULT NULL,
  `dateSortie` varchar(10) DEFAULT NULL,
  `adresse` text,
  `specialite` varchar(100) DEFAULT NULL,
  `isTemporary` tinyint(1) NOT NULL DEFAULT '1',
  `firstLogin` tinyint(1) NOT NULL DEFAULT '1',
  `specialites` json DEFAULT NULL,
  `tempPin` varchar(6) DEFAULT NULL,
  `ownerEmail` varchar(320) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `studio_users`
--

LOCK TABLES `studio_users` WRITE;
/*!40000 ALTER TABLE `studio_users` DISABLE KEYS */;
INSERT INTO `studio_users` VALUES (12,397,'Studio Pierceur Tatoueur Dermographe','Admin',NULL,'admin','$2b$10$8QvTcP0MjzKYkq1RYHhX4u.6wRQfFJ39XGGi9IXDBF5mpgPslJcaa','admin',1,'2026-05-08 20:04:51','2026-05-09 01:44:41','$2b$10$5Z6Zb/E6Zt5xUUQHXkLBtOJ6NZNSceigAx0lQaQPuar4goox8blOG',NULL,NULL,NULL,NULL,'',1,1,NULL,NULL,NULL);
/*!40000 ALTER TABLE `studio_users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `studios`
--

DROP TABLE IF EXISTS `studios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `studios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `nom` varchar(200) NOT NULL DEFAULT 'Mon Studio',
  `slug` varchar(100) NOT NULL,
  `raisonSociale` varchar(200) DEFAULT NULL,
  `siret` varchar(20) DEFAULT NULL,
  `siren` varchar(9) DEFAULT NULL,
  `adresse` text,
  `codePostal` varchar(10) DEFAULT NULL,
  `ville` varchar(100) DEFAULT NULL,
  `telephone` varchar(20) DEFAULT NULL,
  `email` varchar(320) DEFAULT NULL,
  `logoUrl` text,
  `planType` enum('trial','solo','studio','multi') NOT NULL DEFAULT 'trial',
  `trialEndsAt` timestamp NULL DEFAULT NULL,
  `actif` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  `ownerEmail` varchar(320) DEFAULT NULL,
  `isTemporary` tinyint(1) DEFAULT '1',
  `firstLogin` tinyint(1) DEFAULT '1',
  `tempPin` varchar(6) DEFAULT NULL,
  `specialites` varchar(100) DEFAULT 'piercing,tatouage,dermographie',
  PRIMARY KEY (`id`),
  UNIQUE KEY `studios_userId_unique` (`userId`),
  UNIQUE KEY `studios_slug_unique` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=71 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `studios`
--

LOCK TABLES `studios` WRITE;
/*!40000 ALTER TABLE `studios` DISABLE KEYS */;
INSERT INTO `studios` VALUES (38,397,'Studio Pierceur Tatoueur Dermographe','studio-manager-pro-moqqt5nw',NULL,NULL,NULL,'1 Impasse du palais','37000','TOURS','0617074169','contact@intemporelle.eu',NULL,'studio','2027-05-04 03:12:17',1,'2026-05-04 05:12:17','2026-05-09 01:44:41','contact@intemporelle.eu',1,0,'0232','piercing,tatouage,dermographie');
/*!40000 ALTER TABLE `studios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subscriptions`
--

DROP TABLE IF EXISTS `subscriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subscriptions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `studioId` int NOT NULL,
  `stripeCustomerId` varchar(100) DEFAULT NULL,
  `stripeSubscriptionId` varchar(100) DEFAULT NULL,
  `stripePriceId` varchar(100) DEFAULT NULL,
  `planType` enum('solo','studio','multi') NOT NULL,
  `status` enum('active','past_due','canceled','trialing','unpaid') NOT NULL DEFAULT 'trialing',
  `currentPeriodStart` timestamp NULL DEFAULT NULL,
  `currentPeriodEnd` timestamp NULL DEFAULT NULL,
  `cancelAtPeriodEnd` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subscriptions`
--

LOCK TABLES `subscriptions` WRITE;
/*!40000 ALTER TABLE `subscriptions` DISABLE KEYS */;
/*!40000 ALTER TABLE `subscriptions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `openId` varchar(64) NOT NULL,
  `name` text,
  `email` varchar(320) DEFAULT NULL,
  `loginMethod` varchar(64) DEFAULT NULL,
  `role` enum('user','admin') NOT NULL DEFAULT 'user',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  `lastSignedIn` timestamp NOT NULL DEFAULT (now()),
  `passwordHash` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_openId_unique` (`openId`)
) ENGINE=InnoDB AUTO_INCREMENT=466 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (397,'admin-intemporelle','STUDIO INTEMPORELLE','contact@intemporelle.eu',NULL,'admin','2026-05-07 03:34:49','2026-05-10 03:20:33','2026-05-10 01:20:34','$2b$10$gbY98wOI782Ie7kVfU6QQOFtn3sLAJDZA6BC0gbvSAzNX6A3r5kV6');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-10  4:32:33
