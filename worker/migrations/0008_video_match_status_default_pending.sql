-- Change videos.match_status default from 'novideo' to 'pending'
-- Existing rows with no youtube_id are reset to 'pending' so they get retried once;
-- rows explicitly confirmed as unavailable (novideo with a youtube_id set, or other statuses) are left unchanged.
CREATE TABLE `videos_new` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `playlist_id` integer NOT NULL REFERENCES `playlists`(`id`) ON DELETE CASCADE,
  `position` integer NOT NULL,
  `title` text NOT NULL,
  `artist` text NOT NULL,
  `label` text,
  `youtube_id` text,
  `thumbnail` text,
  `match_status` text NOT NULL DEFAULT 'pending'
);
INSERT INTO `videos_new` SELECT `id`, `playlist_id`, `position`, `title`, `artist`, `label`, `youtube_id`, `thumbnail`,
  CASE WHEN `youtube_id` IS NULL AND `match_status` = 'novideo' THEN 'pending' ELSE `match_status` END
FROM `videos`;
DROP TABLE `videos`;
ALTER TABLE `videos_new` RENAME TO `videos`;
