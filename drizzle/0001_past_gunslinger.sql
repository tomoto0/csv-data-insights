CREATE TABLE `chartConfigs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`datasetId` int NOT NULL,
	`chartType` varchar(50) NOT NULL,
	`labelColumn` int NOT NULL,
	`datasets` json NOT NULL,
	`datasetColors` json NOT NULL,
	`palette` varchar(50) NOT NULL DEFAULT 'vibrant',
	`baseColor` varchar(7) NOT NULL DEFAULT '#6b76ff',
	`canvasBg` varchar(7) NOT NULL DEFAULT '#0b0f20',
	`textColor` varchar(7) NOT NULL DEFAULT '#f1f3ff',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chartConfigs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `csvDatasets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`rawCsv` text NOT NULL,
	`headers` json NOT NULL,
	`rowCount` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `csvDatasets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dataInsights` (
	`id` int AUTO_INCREMENT NOT NULL,
	`datasetId` int NOT NULL,
	`insightType` varchar(100) NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`confidence` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dataInsights_id` PRIMARY KEY(`id`)
);
