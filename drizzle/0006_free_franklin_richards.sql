CREATE TABLE `client_units` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`unitName` varchar(255) NOT NULL,
	`description` text,
	`sortOrder` int DEFAULT 0,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `client_units_id` PRIMARY KEY(`id`)
);
