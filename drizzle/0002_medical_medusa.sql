CREATE TABLE `dataCleaningResults` (
	`id` int AUTO_INCREMENT NOT NULL,
	`datasetId` int NOT NULL,
	`originalCsv` text NOT NULL,
	`cleanedCsv` text NOT NULL,
	`cleaningReport` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dataCleaningResults_id` PRIMARY KEY(`id`)
);
