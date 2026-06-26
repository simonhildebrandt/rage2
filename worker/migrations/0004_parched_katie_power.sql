DROP INDEX `playlists_aired_date_unique`;--> statement-breakpoint
CREATE UNIQUE INDEX `playlists_title_unique` ON `playlists` (`title`);