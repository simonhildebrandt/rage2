-- Change videos.match_status default from 'verified' to 'novideo'
CREATE TABLE `videos_new` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `playlist_id` integer NOT NULL REFERENCES `playlists`(`id`) ON DELETE CASCADE,
  `position` integer NOT NULL,
  `title` text NOT NULL,
  `artist` text NOT NULL,
  `label` text,
  `youtube_id` text,
  `thumbnail` text,
  `match_status` text NOT NULL DEFAULT 'novideo'
);
INSERT INTO `videos_new` SELECT `id`, `playlist_id`, `position`, `title`, `artist`, `label`, `youtube_id`, `thumbnail`, `match_status` FROM `videos`;
DROP TABLE `videos`;
ALTER TABLE `videos_new` RENAME TO `videos`;
