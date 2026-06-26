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
  // Structure per entry: <strong>ARTIST</strong> <em>Title</em> (Label)
  $('ul[data-component="List"] li[data-component="ListItem"]').each((_i, elem) => {
    const artist = $(elem).find('strong').text().trim()
    if (!artist) return

    // Strip artist and any optional em message to isolate "Title (Label)"
    const emText = $(elem).find('em').text().trim()
    const remainder = $(elem).text().trim()
      .replace(artist, '')
      .replace(emText, '')
      .trim()

    // remainder: "Title (Label)" or just "Title" if no label
    // Greedy title group ensures the last (...) is captured as label,
    // so titles like "iloveitiloveitiloveit (live)" are preserved intact.
    const labelMatch = remainder.match(/^(.*)\s+\((.+)\)\s*$/)
    const title = labelMatch ? labelMatch[1].trim() : remainder
    const label = labelMatch ? labelMatch[2] : undefined

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
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    await db.insert(videos).values(rows.slice(i, i + BATCH_SIZE))
  }

  await db
    .update(playlists)
    .set({ scraped_at: now, updated_at: now })
    .where(eq(playlists.id, playlist_id))
}
