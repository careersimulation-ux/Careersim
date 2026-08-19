CREATE TABLE `certificates` (
	`id` varchar(36) NOT NULL,
	`resultId` varchar(36) NOT NULL,
	`userId` int NOT NULL,
	`simulationId` varchar(80) NOT NULL,
	`verificationCode` varchar(40) NOT NULL,
	`issuedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `certificates_id` PRIMARY KEY(`id`),
	CONSTRAINT `certificates_result_unique` UNIQUE(`resultId`),
	CONSTRAINT `certificates_code_unique` UNIQUE(`verificationCode`)
);
--> statement-breakpoint
CREATE TABLE `portfolioItems` (
	`id` varchar(36) NOT NULL,
	`userId` int NOT NULL,
	`resultId` varchar(36) NOT NULL,
	`simulationId` varchar(80) NOT NULL,
	`summary` text NOT NULL,
	`isPublic` enum('yes','no') NOT NULL DEFAULT 'yes',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `portfolioItems_id` PRIMARY KEY(`id`),
	CONSTRAINT `portfolioItems_result_unique` UNIQUE(`resultId`)
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` varchar(36) NOT NULL,
	`userId` int NOT NULL,
	`country` varchar(80),
	`university` varchar(160),
	`major` varchar(160),
	`graduationYear` int,
	`careerInterests` json NOT NULL,
	`preferredLanguage` enum('en','ar') NOT NULL DEFAULT 'en',
	`publicSlug` varchar(80) NOT NULL,
	`portfolioIsPublic` enum('yes','no') NOT NULL DEFAULT 'yes',
	`onboardingComplete` enum('yes','no') NOT NULL DEFAULT 'no',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `profiles_userId_unique` UNIQUE(`userId`),
	CONSTRAINT `profiles_publicSlug_unique` UNIQUE(`publicSlug`)
);
--> statement-breakpoint
CREATE TABLE `simulationEvents` (
	`id` varchar(36) NOT NULL,
	`userId` int NOT NULL,
	`sessionId` varchar(36),
	`eventType` varchar(64) NOT NULL,
	`payload` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `simulationEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `simulationResults` (
	`id` varchar(36) NOT NULL,
	`sessionId` varchar(36) NOT NULL,
	`userId` int NOT NULL,
	`simulationId` varchar(80) NOT NULL,
	`totalScore` int NOT NULL,
	`maxScore` int NOT NULL,
	`skillScores` json NOT NULL,
	`feedback` json NOT NULL,
	`completedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `simulationResults_id` PRIMARY KEY(`id`),
	CONSTRAINT `simulationResults_session_unique` UNIQUE(`sessionId`)
);
--> statement-breakpoint
CREATE TABLE `simulationSessions` (
	`id` varchar(36) NOT NULL,
	`userId` int NOT NULL,
	`simulationId` varchar(80) NOT NULL,
	`configVersion` varchar(32) NOT NULL,
	`status` enum('active','completed','abandoned') NOT NULL DEFAULT 'active',
	`currentTaskId` varchar(80),
	`progressPercent` int NOT NULL DEFAULT 0,
	`hintUsage` json NOT NULL,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`lastActiveAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`completedAt` timestamp,
	CONSTRAINT `simulationSessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `simulations` (
	`id` varchar(80) NOT NULL,
	`slug` varchar(120) NOT NULL,
	`configVersion` varchar(32) NOT NULL,
	`status` enum('draft','published','archived') NOT NULL DEFAULT 'published',
	`title` json NOT NULL,
	`company` json NOT NULL,
	`industry` json NOT NULL,
	`category` varchar(64) NOT NULL,
	`difficulty` enum('beginner','intermediate','advanced') NOT NULL,
	`estimatedMinutes` int NOT NULL,
	`skills` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `simulations_id` PRIMARY KEY(`id`),
	CONSTRAINT `simulations_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `taskScores` (
	`id` varchar(36) NOT NULL,
	`submissionId` varchar(36) NOT NULL,
	`sessionId` varchar(36) NOT NULL,
	`taskId` varchar(80) NOT NULL,
	`score` int NOT NULL,
	`maxScore` int NOT NULL,
	`skillScores` json NOT NULL,
	`criteria` json NOT NULL,
	`feedbackContext` json NOT NULL,
	`evaluatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `taskScores_id` PRIMARY KEY(`id`),
	CONSTRAINT `taskScores_submission_unique` UNIQUE(`submissionId`),
	CONSTRAINT `taskScores_session_task_unique` UNIQUE(`sessionId`,`taskId`)
);
--> statement-breakpoint
CREATE TABLE `taskSubmissions` (
	`id` varchar(36) NOT NULL,
	`sessionId` varchar(36) NOT NULL,
	`taskId` varchar(80) NOT NULL,
	`taskType` varchar(48) NOT NULL,
	`response` json NOT NULL,
	`hintLevel` int NOT NULL DEFAULT 0,
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `taskSubmissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `taskSubmissions_session_task_unique` UNIQUE(`sessionId`,`taskId`)
);
--> statement-breakpoint
ALTER TABLE `certificates` ADD CONSTRAINT `certificates_resultId_simulationResults_id_fk` FOREIGN KEY (`resultId`) REFERENCES `simulationResults`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `certificates` ADD CONSTRAINT `certificates_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `certificates` ADD CONSTRAINT `certificates_simulationId_simulations_id_fk` FOREIGN KEY (`simulationId`) REFERENCES `simulations`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portfolioItems` ADD CONSTRAINT `portfolioItems_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portfolioItems` ADD CONSTRAINT `portfolioItems_resultId_simulationResults_id_fk` FOREIGN KEY (`resultId`) REFERENCES `simulationResults`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portfolioItems` ADD CONSTRAINT `portfolioItems_simulationId_simulations_id_fk` FOREIGN KEY (`simulationId`) REFERENCES `simulations`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `profiles` ADD CONSTRAINT `profiles_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `simulationEvents` ADD CONSTRAINT `simulationEvents_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `simulationEvents` ADD CONSTRAINT `simulationEvents_sessionId_simulationSessions_id_fk` FOREIGN KEY (`sessionId`) REFERENCES `simulationSessions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `simulationResults` ADD CONSTRAINT `simulationResults_sessionId_simulationSessions_id_fk` FOREIGN KEY (`sessionId`) REFERENCES `simulationSessions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `simulationResults` ADD CONSTRAINT `simulationResults_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `simulationResults` ADD CONSTRAINT `simulationResults_simulationId_simulations_id_fk` FOREIGN KEY (`simulationId`) REFERENCES `simulations`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `simulationSessions` ADD CONSTRAINT `simulationSessions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `simulationSessions` ADD CONSTRAINT `simulationSessions_simulationId_simulations_id_fk` FOREIGN KEY (`simulationId`) REFERENCES `simulations`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `taskScores` ADD CONSTRAINT `taskScores_submissionId_taskSubmissions_id_fk` FOREIGN KEY (`submissionId`) REFERENCES `taskSubmissions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `taskScores` ADD CONSTRAINT `taskScores_sessionId_simulationSessions_id_fk` FOREIGN KEY (`sessionId`) REFERENCES `simulationSessions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `taskSubmissions` ADD CONSTRAINT `taskSubmissions_sessionId_simulationSessions_id_fk` FOREIGN KEY (`sessionId`) REFERENCES `simulationSessions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `portfolioItems_user_public_idx` ON `portfolioItems` (`userId`,`isPublic`);--> statement-breakpoint
CREATE INDEX `simulationEvents_session_type_idx` ON `simulationEvents` (`sessionId`,`eventType`);--> statement-breakpoint
CREATE INDEX `simulationResults_user_completed_idx` ON `simulationResults` (`userId`,`completedAt`);--> statement-breakpoint
CREATE INDEX `sessions_user_status_idx` ON `simulationSessions` (`userId`,`status`);--> statement-breakpoint
CREATE INDEX `sessions_simulation_idx` ON `simulationSessions` (`simulationId`);--> statement-breakpoint
CREATE INDEX `simulations_status_idx` ON `simulations` (`status`);--> statement-breakpoint
CREATE INDEX `taskSubmissions_session_idx` ON `taskSubmissions` (`sessionId`);