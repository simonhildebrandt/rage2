import * as cheerio from 'cheerio'
import type { Env } from '../types'
import { getDb } from '../db/client'
import { playlists, videos } from '../db/schema'
import { eq } from 'drizzle-orm'

export interface ParsedVideo {
  position: number
  title: string
  artist: string
  label?: string
  youtube_id?: string
  thumbnail?: string
}

function parsePlaylistPage(html: string): ParsedVideo[] {
  const $ = cheerio.load(html)
  const result: ParsedVideo[] = []
  let position = 1

  // Each time slot is a <ul data-component="List"> containing <li data-component="ListItem"> entries.
  // Structure: <strong>ARTIST</strong> [<em>Title</em>] Title (Label)
  // Title may be wrapped in <em> or plain text; label in trailing parens is optional.
  $('ul[data-component="List"] li[data-component="ListItem"]').each((_i, elem) => {
    const artist = $(elem).find('strong').text().trim()
    if (!artist) return

    const emText = $(elem).find('em').text().trim()
    const rest = $(elem).text().trim().replace(artist, '').replace(emText, '').trim()

    let title: string
    let label: string | undefined

    if (emText) {
      // Title is wrapped in <em>; anything left in rest is the label in parens
      title = emText
      const labelMatch = rest.match(/^\((.+)\)\s*$/)
      label = labelMatch ? labelMatch[1] : undefined
    } else {
      // Title and optional label are plain text after the artist.
      // Greedy title group ensures the last (...) is captured as label,
      // so titles like "iloveitiloveitiloveit (live)" are preserved intact.
      const labelMatch = rest.match(/^(.*)\s+\((.+)\)\s*$/)
      title = labelMatch ? labelMatch[1].trim() : rest
      label = labelMatch ? labelMatch[2] : undefined
    }

    if (!title) return

    const record = { position: position++, title, artist, label }
    result.push(record)
  })

  return result
}

export async function scrapePlaylist(
  env: Env,
  playlist_id: number,
  source_url: string
): Promise<void> {
  const response = await fetch(source_url)
  if (!response.ok) throw new Error(`Failed to fetch playlist ${source_url}: ${response.status}`)

  console.log(`Scraping playlist ${playlist_id} from ${source_url}`)
  const html = await response.text()
  const parsed = parsePlaylistPage(html)

  const db = getDb(env)
  const now = new Date().toISOString()

  await db.delete(videos).where(eq(videos.playlist_id, playlist_id))

  // D1 limits bound parameters per query; batch to stay under the limit
  const BATCH_SIZE = 10
  const rows = parsed.map(v => ({ ...v, playlist_id }))
  const insertedVideos: { id: number; title: string; artist: string }[] = []

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const inserted = await db.insert(videos).values(rows.slice(i, i + BATCH_SIZE)).returning({
      id: videos.id,
      title: videos.title,
      artist: videos.artist,
    })
    insertedVideos.push(...inserted)
  }

  await Promise.all(
    insertedVideos.map(v =>
      env.YOUTUBE_QUEUE.send({ video_id: v.id, title: v.title, artist: v.artist })
    )
  )

  await db
    .update(playlists)
    .set({ scraped_at: now, updated_at: now })
    .where(eq(playlists.id, playlist_id))
}
