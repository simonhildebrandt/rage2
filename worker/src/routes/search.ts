import { Hono } from 'hono'
import type { Env } from '../types'
import { getDb } from '../db/client'
import { playlists, videos } from '../db/schema'
import { or, like, eq, desc, asc, sql } from 'drizzle-orm'

export const searchRoutes = new Hono<{ Bindings: Env }>()

searchRoutes.get('/', async (c) => {
  const q = (c.req.query('q') ?? '').trim()
  const mode = c.req.query('mode') ?? 'all'

  if (!q) return c.json([])

  const db = getDb(c.env)
  const pattern = `%${q.toLowerCase()}%`

  const wantTrack = mode === 'all' || mode === 'artist'
  const wantDate  = mode === 'all' || mode === 'date'

  type TrackHit = {
    playlist_id: number
    aired_date: string
    playlist_title: string
    match_type: 'track'
    video_id: number
    track_artist: string
    track_title: string
    track_position: number
    track_match_count: number
  }

  type DateHit = {
    playlist_id: number
    aired_date: string
    playlist_title: string
    match_type: 'date'
    track_artist: null
    track_title: null
    track_position: null
    track_match_count: null
  }

  let trackResults: TrackHit[] = []
  let dateResults: DateHit[] = []

  if (wantTrack) {
    const rows = await db
      .select({
        video_id: videos.id,
        playlist_id: videos.playlist_id,
        aired_date: playlists.aired_date,
        playlist_title: playlists.title,
        artist: videos.artist,
        title: videos.title,
        position: videos.position,
      })
      .from(videos)
      .innerJoin(playlists, eq(videos.playlist_id, playlists.id))
      .where(or(
        like(sql`lower(${videos.artist})`, pattern),
        like(sql`lower(${videos.title})`, pattern),
      ))
      .orderBy(desc(playlists.aired_date), asc(videos.position))
      .limit(500)

    // One row per playlist: first matching track + running count
    const byPlaylist = new Map<number, TrackHit>()
    for (const row of rows) {
      const existing = byPlaylist.get(row.playlist_id)
      if (!existing) {
        byPlaylist.set(row.playlist_id, {
          playlist_id: row.playlist_id,
          aired_date: row.aired_date,
          playlist_title: row.playlist_title,
          match_type: 'track',
          video_id: row.video_id,
          track_artist: row.artist,
          track_title: row.title,
          track_position: row.position,
          track_match_count: 1,
        })
      } else {
        existing.track_match_count++
      }
    }
    trackResults = [...byPlaylist.values()]
  }

  if (wantDate) {
    const rows = await db
      .select({ id: playlists.id, aired_date: playlists.aired_date, title: playlists.title })
      .from(playlists)
      .where(or(
        like(sql`lower(${playlists.title})`, pattern),
        like(playlists.aired_date, pattern),
      ))
      .orderBy(desc(playlists.aired_date))
      .limit(50)

    dateResults = rows.map(r => ({
      playlist_id: r.id,
      aired_date: r.aired_date,
      playlist_title: r.title,
      match_type: 'date' as const,
      track_artist: null,
      track_title: null,
      track_position: null,
      track_match_count: null,
    }))
  }

  // Track hits take precedence: drop date hits for playlists already in track results
  const trackIds = new Set(trackResults.map(r => r.playlist_id))
  const dateOnly = dateResults.filter(r => !trackIds.has(r.playlist_id))

  const combined = [...trackResults, ...dateOnly]
    .sort((a, b) => b.aired_date.localeCompare(a.aired_date))
    .slice(0, 50)

  return c.json(combined)
})
