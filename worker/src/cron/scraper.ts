import type { Env } from '../types'
import { parseCollectionResponse } from './parser'
import { getDb } from '../db/client'
import { playlists } from '../db/schema'
import { eq } from 'drizzle-orm'

const COLLECTION_URL = 'https://www.abc.net.au/core-next/api/collection/core-next/api/collection/rage/playlist'
const COLLECTION_PARAMS = 'rootMetaCollectionId=104200304&collectionId=13642802&ratio=16x9&subaggregation=false'
const PAGE_SIZE = 16
const MAX_PAGES = Infinity

export async function runScrape(env: Env): Promise<void> {
  const db = getDb(env)
  const now = new Date().toISOString()

  let offset = 0
  let pages = 0

  while (pages < MAX_PAGES) {
    const url = `${COLLECTION_URL}?${COLLECTION_PARAMS}&offset=${offset}&size=${PAGE_SIZE}`
    const response = await fetch(url)
    if (!response.ok) throw new Error(`Collection fetch failed: ${response.status}`)

    const json = await response.json() as { collection: { items: unknown[] }}
    const parsed = parseCollectionResponse(json.collection as Parameters<typeof parseCollectionResponse>[0])

    for (const playlist of parsed) {
      const [existing] = await db
        .select({ id: playlists.id })
        .from(playlists)
        .where(eq(playlists.title, playlist.title))

      if (existing) {
        await db
          .update(playlists)
          .set({ title: playlist.title, source_url: playlist.source_url, updated_at: now })
          .where(eq(playlists.id, existing.id))
      } else {
        const [inserted] = await db
          .insert(playlists)
          .values({ ...playlist, created_at: now, updated_at: now })
          .returning({ id: playlists.id })
        await env.PLAYLIST_QUEUE.send({ playlist_id: inserted.id, source_url: playlist.source_url })
      }
    }

    offset += PAGE_SIZE
    pages++
    if (parsed.length < PAGE_SIZE) break
  }
}
