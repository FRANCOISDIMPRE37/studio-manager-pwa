CREATE TABLE `invitations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(64) NOT NULL,
	`email` varchar(320),
	`planType` enum('trial','solo','studio','multi') NOT NULL DEFAULT 'trial',
	`trialDays` int NOT NULL DEFAULT 30,
	`usedByUserId` int,
	`usedAt` timestamp,
	`expiresAt` timestamp,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `invitations_id` PRIMARY KEY(`id`),
	CONSTRAINT `invitations_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `studios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`nom` varchar(200) NOT NULL DEFAULT 'Mon Studio',
	`slug` varchar(100) NOT NULL,
	`raisonSociale` varchar(200),
	`siret` varchar(20),
	`adresse` text,
	`codePostal` varchar(10),
	`ville` varchar(100),
	`telephone` varchar(20),
	`email` varchar(320),
	`logoUrl` text,
	`planType` enum('trial','solo','studio','multi') NOT NULL DEFAULT 'trial',
	`trialEndsAt` timestamp,
	`actif` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `studios_id` PRIMARY KEY(`id`),
	CONSTRAINT `studios_userId_unique` UNIQUE(`userId`),
	CONSTRAINT `studios_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`studioId` int NOT NULL,
	`stripeCustomerId` varchar(100),
	`stripeSubscriptionId` varchar(100),
	`stripePriceId` varchar(100),
	`planType` enum('solo','studio','multi') NOT NULL,
	`status` enum('active','past_due','canceled','trialing','unpaid') NOT NULL DEFAULT 'trialing',
	`currentPeriodStart` timestamp,
	`currentPeriodEnd` timestamp,
	`cancelAtPeriodEnd` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`)
);
