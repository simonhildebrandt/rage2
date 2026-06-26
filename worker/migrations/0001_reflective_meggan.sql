PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_playlists` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`aired_date` text NOT NULL,
	`title` text NOT NULL,
	`created_at` text NOT NULL,
	`scraped_at` text,
	`source_url` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_playlists`("id", "aired_date", "title", "created_at", "scraped_at", "source_url") SELECT "id", "aired_date", "title", "created_at", "scraped_at", "source_url" FROM `playlists`;--> statement-breakpoint
DROP TABLE `playlists`;--> statement-breakpoint
ALTER TABLE `__new_playlists` RENAME TO `playlists`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `playlists_aired_date_unique` ON `playlists` (`aired_date`);