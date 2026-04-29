CREATE TABLE `delivery_units` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticketId` int NOT NULL,
	`unitName` varchar(255) NOT NULL,
	`liters` decimal(10,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `delivery_units_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `delivery_tickets` ADD `startTime` timestamp;--> statement-breakpoint
ALTER TABLE `delivery_tickets` ADD `endTime` timestamp;--> statement-breakpoint
ALTER TABLE `delivery_tickets` ADD `driverName` varchar(255);--> statement-breakpoint
ALTER TABLE `delivery_tickets` ADD `siteName` varchar(255);--> statement-breakpoint
ALTER TABLE `delivery_tickets` ADD `source` varchar(32) DEFAULT 'manual';