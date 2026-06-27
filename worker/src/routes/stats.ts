import { Hono } from 'hono'
import type { Env } from '../types'
import { getDb } from '../db/client'
import { playlists, videos } from '../db/schema'
import { count, min, sql } from 'drizzle-orm'

export const statsRoutes = new Hono<{ Bindings: Env }>()

statsRoutes.get('/', async (c) => {
  const db = getDb(c.env)

  const [{ playlistCount }] = await db.select({ playlistCount: count() }).from(playlists)
  const [{ videoCount }] = await db.select({ videoCount: count() }).from(videos)
  const [{ oldestDate }] = await db.select({ oldestDate: min(playlists.aired_date) }).from(playlists)
  const yearRows = await db
    .selectDistinct({ year: sql<string>`substr(${playlists.aired_date}, 1, 4)` })
    .from(playlists)
    .orderBy(sql`1`)

  return c.json({
    playlists: playlistCount,
    videos: videoCount,
    oldest_aired_date: oldestDate ?? null,
    years: yearRows.map(r => r.year),
  })
})
