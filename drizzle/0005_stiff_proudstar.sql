CREATE TABLE `delivery_sites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`address` text,
	`city` varchar(128),
	`province` varchar(64),
	`postalCode` varchar(16),
	`notes` text,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `delivery_sites_id` PRIMARY KEY(`id`)
);
