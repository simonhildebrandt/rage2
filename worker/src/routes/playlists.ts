import { Hono } from 'hono'
import type { Env } from '../types'
import { getDb } from '../db/client'
import { playlists, videos } from '../db/schema'
import { eq, desc } from 'drizzle-orm'

export const playlistRoutes = new Hono<{ Bindings: Env }>()

playlistRoutes.get('/', async (c) => {
  const db = getDb(c.env)
  const page = Number(c.req.query('page') ?? 1)
  const limit = 20
  const offset = (page - 1) * limit

  const rows = await db
    .select()
    .from(playlists)
    .orderBy(desc(playlists.aired_date))
    .limit(limit)
    .offset(offset)

  return c.json(rows)
})

playlistRoutes.get('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const db = getDb(c.env)

  const [playlist] = await db.select().from(playlists).where(eq(playlists.id, id))
  if (!playlist) return c.json({ error: 'Not found' }, 404)

  const videoRows = await db
    .select()
    .from(videos)
    .where(eq(videos.playlist_id, id))
    .orderBy(videos.position)

  return c.json({ ...playlist, videos: videoRows })
})
