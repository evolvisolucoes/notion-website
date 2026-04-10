CREATE TABLE `notion_resources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`notionId` varchar(64) NOT NULL,
	`type` enum('database','page') NOT NULL,
	`title` varchar(512) NOT NULL,
	`description` text,
	`icon` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notion_resources_id` PRIMARY KEY(`id`),
	CONSTRAINT `notion_resources_notionId_unique` UNIQUE(`notionId`)
);
--> statement-breakpoint
CREATE TABLE `user_access` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`resourceId` int NOT NULL,
	`grantedAt` timestamp NOT NULL DEFAULT (now()),
	`grantedBy` int,
	CONSTRAINT `user_access_id` PRIMARY KEY(`id`)
);
