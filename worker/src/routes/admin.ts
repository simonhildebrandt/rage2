import { Hono } from 'hono'
import type { Env } from '../types'
import { authMiddleware } from '../middleware/auth'
import { runScrape } from '../cron/scraper'
import { searchYoutube } from '../cron/youtubeScraper'
import { getDb } from '../db/client'
import { playlists, videos } from '../db/schema'
import { count, eq } from 'drizzle-orm'

export const adminRoutes = new Hono<{ Bindings: Env }>()

adminRoutes.use('*', authMiddleware)

adminRoutes.post('/scrape', async (c) => {
  await runScrape(c.env)
  return c.json({ ok: true })
})

const VALID_STATUSES = ['verified', 'review', 'rejected', 'novideo']

adminRoutes.patch('/videos/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const db = getDb(c.env)
  const { match_status } = await c.req.json<{ match_status: string }>()
  if (!VALID_STATUSES.includes(match_status)) return c.json({ error: 'Invalid status' }, 400)
  await db.update(videos).set({ match_status }).where(eq(videos.id, id))
  return c.json({ ok: true })
})

adminRoutes.get('/search-youtube', async (c) => {
  const q = c.req.query('q') ?? ''
  if (!q.trim()) return c.json([])
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(q)}&type=video&maxResults=5&key=${c.env.YOUTUBE_API_KEY}`
  const res = await fetch(url)
  if (!res.ok) return c.json({ error: 'YouTube search failed' }, 502)
  const data = await res.json() as any
  return c.json((data.items ?? []).map((item: any) => ({
    youtube_id: item.id.videoId,
    title: item.snippet.title,
    channel: item.snippet.channelTitle,
    thumbnail: item.snippet.thumbnails.medium?.url ?? item.snippet.thumbnails.default.url,
  })))
})

adminRoutes.patch('/videos/:id/match', async (c) => {
  const id = Number(c.req.param('id'))
  const db = getDb(c.env)
  const { youtube_id, thumbnail } = await c.req.json<{ youtube_id: string; thumbnail: string }>()
  await db.update(videos).set({ youtube_id, thumbnail, match_status: 'verified' }).where(eq(videos.id, id))
  return c.json({ ok: true })
})

adminRoutes.get('/status', async (c) => {
  const db = getDb(c.env)
  const [{ playlistCount }] = await db.select({ playlistCount: count() }).from(playlists)
  const [{ videoCount }]    = await db.select({ videoCount: count() }).from(videos)
  return c.json({ playlistCount, videoCount })
})
