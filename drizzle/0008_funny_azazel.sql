CREATE TABLE `admin_article_reads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`articleId` int NOT NULL,
	`userId` int NOT NULL,
	`readAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `admin_article_reads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `admin_articles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`titre` varchar(300) NOT NULL,
	`contenu` text NOT NULL,
	`type` enum('annonce','mise_a_jour','legal','formation','promo') NOT NULL DEFAULT 'annonce',
	`statut` enum('brouillon','publie','archive') NOT NULL DEFAULT 'brouillon',
	`ciblePlanType` varchar(100),
	`important` boolean NOT NULL DEFAULT false,
	`publieLe` timestamp,
	`expireLe` timestamp,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `admin_articles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `admin_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`titre` varchar(300) NOT NULL,
	`message` text NOT NULL,
	`type` enum('info','warning','success','error') NOT NULL DEFAULT 'info',
	`targetUserId` int,
	`targetPlanType` varchar(100),
	`lu` boolean NOT NULL DEFAULT false,
	`luAt` timestamp,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `admin_notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `licenses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`planType` enum('trial','solo','studio','multi') NOT NULL DEFAULT 'trial',
	`status` enum('active','suspended','expired','cancelled') NOT NULL DEFAULT 'active',
	`expiresAt` timestamp,
	`featureClients` boolean NOT NULL DEFAULT true,
	`featureDocuments` boolean NOT NULL DEFAULT true,
	`featureAgenda` boolean NOT NULL DEFAULT true,
	`featureSms` boolean NOT NULL DEFAULT false,
	`featureMultiUsers` boolean NOT NULL DEFAULT false,
	`featureExport` boolean NOT NULL DEFAULT true,
	`maxClients` int NOT NULL DEFAULT 100,
	`maxUsers` int NOT NULL DEFAULT 1,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `licenses_id` PRIMARY KEY(`id`),
	CONSTRAINT `licenses_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `shared_services` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nom` varchar(200) NOT NULL,
	`description` text,
	`type` enum('piercing','tatouage','dermographie') NOT NULL,
	`zone` varchar(200),
	`prixConseille` int,
	`dureeMinutes` int,
	`actif` boolean NOT NULL DEFAULT true,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shared_services_id` PRIMARY KEY(`id`)
);
