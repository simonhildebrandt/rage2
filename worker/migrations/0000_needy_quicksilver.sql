CREATE TABLE `playlists` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`aired_date` text NOT NULL,
	`title` text NOT NULL,
	`scraped_at` text NOT NULL,
	`source_url` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `playlists_aired_date_unique` ON `playlists` (`aired_date`);--> statement-breakpoint
CREATE TABLE `videos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`playlist_id` integer NOT NULL,
	`position` integer NOT NULL,
	`title` text NOT NULL,
	`artist` text NOT NULL,
	`youtube_id` text,
	`thumbnail` text,
	FOREIGN KEY (`playlist_id`) REFERENCES `playlists`(`id`) ON UPDATE no action ON DELETE cascade
);
