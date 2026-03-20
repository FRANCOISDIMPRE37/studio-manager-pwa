CREATE TABLE `sms_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`apiKey` text NOT NULL,
	`senderName` varchar(11) NOT NULL DEFAULT 'Studio',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sms_config_id` PRIMARY KEY(`id`),
	CONSTRAINT `sms_config_userId_unique` UNIQUE(`userId`)
);
