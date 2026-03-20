CREATE TABLE `studio_users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`prenom` varchar(100) NOT NULL,
	`nom` varchar(100) NOT NULL,
	`login` varchar(100) NOT NULL,
	`passwordHash` text NOT NULL,
	`role` enum('admin','employe','stagiaire') NOT NULL DEFAULT 'employe',
	`actif` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `studio_users_id` PRIMARY KEY(`id`)
);
