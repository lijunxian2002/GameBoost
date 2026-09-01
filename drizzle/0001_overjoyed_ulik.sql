CREATE TABLE `request_limits` (
	`bucket_key` text PRIMARY KEY NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	`expires_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `request_limits_expires_idx` ON `request_limits` (`expires_at`);--> statement-breakpoint
ALTER TABLE `releases` ADD `binary_format` text DEFAULT 'unknown' NOT NULL;