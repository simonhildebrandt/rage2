import { Hono } from 'hono'
import type { Env } from '../types'
import { authMiddleware } from '../middleware/auth'
import { runScrape } from '../cron/scraper'
import { searchYoutube } from '../cron/youtubeScraper'
import { scrapePlaylist } from '../cron/playlistScraper'
import { getDb } from '../db/client'
import { playlists, videos } from '../db/schema'
import { sql, count, eq, and, lt, gt, asc, desc } from 'drizzle-orm'
import { pickYouTubeKey } from '../types'

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
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(q)}&type=video&maxResults=5&key=${pickYouTubeKey(c.env)}`
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

adminRoutes.post('/playlists/:id/scrape', async (c) => {
  const id = Number(c.req.param('id'))
  const db = getDb(c.env)
  const [playlist] = await db.select().from(playlists).where(eq(playlists.id, id))
  if (!playlist) return c.json({ error: 'Not found' }, 404)
  await scrapePlaylist(c.env, id, playlist.source_url)
  return c.json({ ok: true })
})

adminRoutes.get('/playlists/:id/issue-neighbours', async (c) => {
  const id = Number(c.req.param('id'))
  const db = getDb(c.env)
  const [current] = await db.select({ aired_date: playlists.aired_date }).from(playlists).where(eq(playlists.id, id))
  if (!current) return c.json({ error: 'Not found' }, 404)

  const hasIssue = sql`EXISTS (SELECT 1 FROM ${videos} WHERE ${videos.playlist_id} = ${playlists.id} AND ${videos.match_status} != 'verified')`
  const cols = { id: playlists.id, aired_date: playlists.aired_date, title: playlists.title }

  const [prev, next] = await Promise.all([
    db.select(cols).from(playlists).where(and(lt(playlists.aired_date, current.aired_date), hasIssue)).orderBy(desc(playlists.aired_date)).limit(1).then(r => r[0] ?? null),
    db.select(cols).from(playlists).where(and(gt(playlists.aired_date, current.aired_date), hasIssue)).orderBy(asc(playlists.aired_date)).limit(1).then(r => r[0] ?? null),
  ])

  return c.json({ prev, next })
})

adminRoutes.get('/status', async (c) => {
  const db = getDb(c.env)
  const [{ playlistCount }] = await db.select({ playlistCount: count() }).from(playlists)
  const [{ videoCount }]    = await db.select({ videoCount: count() }).from(videos)
  return c.json({ playlistCount, videoCount })
})
