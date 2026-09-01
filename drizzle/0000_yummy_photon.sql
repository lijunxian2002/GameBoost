CREATE TABLE `releases` (
	`id` text PRIMARY KEY NOT NULL,
	`product` text NOT NULL,
	`channel` text NOT NULL CHECK (channel IN ('stable', 'beta')),
	`platform` text NOT NULL,
	`version` text NOT NULL,
	`object_key` text NOT NULL,
	`download_url` text NOT NULL,
	`sha256` text NOT NULL,
	`signature` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`minimum_supported_version` text,
	`mandatory` integer DEFAULT 0 NOT NULL CHECK (mandatory IN (0, 1)),
	`notes_url` text,
	`published_at` text NOT NULL,
	`is_active` integer DEFAULT 1 NOT NULL CHECK (is_active IN (0, 1)),
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `releases_product_channel_platform_version_unique` ON `releases` (`product`,`channel`,`platform`,`version`);--> statement-breakpoint
CREATE INDEX `releases_latest_idx` ON `releases` (`product`,`channel`,`platform`,`is_active`,`published_at`);