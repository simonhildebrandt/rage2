import { Hono } from 'hono'
import type { Env } from '../types'
import { authMiddleware } from '../middleware/auth'
import { runScrape } from '../cron/scraper'
import { searchYoutube } from '../cron/youtubeScraper'
import { getDb } from '../db/client'
import { playlists, videos } from '../db/schema'
import { count } from 'drizzle-orm'

export const adminRoutes = new Hono<{ Bindings: Env }>()

adminRoutes.use('*', authMiddleware)

adminRoutes.post('/scrape', async (c) => {
  await runScrape(c.env)
  return c.json({ ok: true })
})

adminRoutes.get('/status', async (c) => {
  const db = getDb(c.env)
  const [{ playlistCount }] = await db.select({ playlistCount: count() }).from(playlists)
  const [{ videoCount }]    = await db.select({ videoCount: count() }).from(videos)
  return c.json({ playlistCount, videoCount })
})
