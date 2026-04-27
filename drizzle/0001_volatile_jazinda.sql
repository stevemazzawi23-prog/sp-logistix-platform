CREATE TABLE `clients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(32) NOT NULL,
	`name` varchar(255) NOT NULL,
	`address` text,
	`city` varchar(128),
	`province` varchar(64),
	`postalCode` varchar(16),
	`classe` varchar(64),
	`sousClasse` varchar(64),
	`siteStatus` varchar(32) DEFAULT 'Active',
	`managementType` varchar(64),
	`btuName` varchar(64),
	`siteType` varchar(64) DEFAULT 'Delivery Location',
	`userId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clients_id` PRIMARY KEY(`id`),
	CONSTRAINT `clients_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `contacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`role` varchar(128),
	`phone` varchar(32),
	`extension` varchar(16),
	`email` varchar(320),
	`isPrimary` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `contacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `delivery_tickets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`ticketNumber` varchar(32) NOT NULL,
	`locationCode` varchar(32),
	`volumeTotalDef` decimal(10,2) DEFAULT '0',
	`volumeTotal` decimal(10,2) NOT NULL,
	`pieces` int DEFAULT 1,
	`duration` varchar(16),
	`deliveryDate` timestamp NOT NULL,
	`emailSubject` varchar(512),
	`emailReceivedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `delivery_tickets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `monthly_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`month` int NOT NULL,
	`year` int NOT NULL,
	`totalVolume` decimal(12,2) DEFAULT '0',
	`totalUnits` int DEFAULT 0,
	`totalDeliveries` int DEFAULT 0,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `monthly_reports_id` PRIMARY KEY(`id`)
);
