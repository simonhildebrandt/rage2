import { Hono } from 'hono'
import type { Env } from '../types'
import { getDb } from '../db/client'
import { videos } from '../db/schema'
import { eq } from 'drizzle-orm'

export const videoRoutes = new Hono<{ Bindings: Env }>()

videoRoutes.get('/', async (c) => {
  const playlistId = Number(c.req.query('playlist_id'))
  if (!playlistId) return c.json({ error: 'playlist_id required' }, 400)

  const db = getDb(c.env)
  const rows = await db
    .select()
    .from(videos)
    .where(eq(videos.playlist_id, playlistId))
    .orderBy(videos.position)

  return c.json(rows)
})
