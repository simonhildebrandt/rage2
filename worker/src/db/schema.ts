import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const playlists = sqliteTable('playlists', {
  id:         integer('id').primaryKey({ autoIncrement: true }),
  aired_date: text('aired_date').notNull(),
  title:      text('title').notNull().unique(),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
  scraped_at: text('scraped_at'),
  source_url: text('source_url').notNull(),
})

export const videos = sqliteTable('videos', {
  id:          integer('id').primaryKey({ autoIncrement: true }),
  playlist_id: integer('playlist_id')
                 .notNull()
                 .references(() => playlists.id, { onDelete: 'cascade' }),
  position:    integer('position').notNull(),
  title:       text('title').notNull(),
  artist:      text('artist').notNull(),
  label:       text('label'),
  youtube_id:   text('youtube_id'),
  thumbnail:    text('thumbnail'),
  match_status: text('match_status').notNull().default('pending'),
})
