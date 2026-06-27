import { Hono } from 'hono'
import type { Env } from '../types'
import { getDb } from '../db/client'
import { playlists, videos } from '../db/schema'
import { eq, desc, asc, like, or, and, lt, gt } from 'drizzle-orm'

export const playlistRoutes = new Hono<{ Bindings: Env }>()

playlistRoutes.get('/', async (c) => {
  const db = getDb(c.env)
  const page = Number(c.req.query('page') ?? 1)
  const year = c.req.query('year')
  const limit = 100
  const offset = (page - 1) * limit

  const rows = year
    ? await db.select().from(playlists)
        .where(like(playlists.aired_date, `${year}-%`))
        .orderBy(desc(playlists.aired_date))
        .limit(limit).offset(offset)
    : await db.select().from(playlists)
        .orderBy(desc(playlists.aired_date))
        .limit(limit).offset(offset)

  return c.json(rows)
})

playlistRoutes.get('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const db = getDb(c.env)

  const [playlist] = await db.select().from(playlists).where(eq(playlists.id, id))
  if (!playlist) return c.json({ error: 'Not found' }, 404)

  const neighbour = { id: playlists.id, aired_date: playlists.aired_date, title: playlists.title }

  const [videoRows, [prev], [next]] = await Promise.all([
    db.select().from(videos).where(eq(videos.playlist_id, id)).orderBy(videos.position),
    db.select(neighbour).from(playlists)
      .where(or(
        lt(playlists.aired_date, playlist.aired_date),
        and(eq(playlists.aired_date, playlist.aired_date), lt(playlists.title, playlist.title)),
      ))
      .orderBy(desc(playlists.aired_date), desc(playlists.title))
      .limit(1),
    db.select(neighbour).from(playlists)
      .where(or(
        gt(playlists.aired_date, playlist.aired_date),
        and(eq(playlists.aired_date, playlist.aired_date), gt(playlists.title, playlist.title)),
      ))
      .orderBy(asc(playlists.aired_date), asc(playlists.title))
      .limit(1),
  ])

  return c.json({ ...playlist, videos: videoRows, prev: prev ?? null, next: next ?? null })
})
