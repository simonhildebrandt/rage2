export class QuotaError extends Error {}

import type { Env } from '../types'
import { pickYouTubeKey } from '../types'
import { getDb } from '../db/client'
import { videos } from '../db/schema'
import { and, eq, isNotNull, ne } from 'drizzle-orm'

interface YoutubeSearchResponse {
  items: Array<{
    id: { videoId: string }
    snippet: { thumbnails: { default: { url: string } } }
  }>
}

export async function searchYoutube(
  env: Env,
  video_id: number,
  title: string,
  artist: string
): Promise<void> {
  const db = getDb(env)

  const [existing] = await db
    .select({ youtube_id: videos.youtube_id, thumbnail: videos.thumbnail })
    .from(videos)
    .where(and(
      eq(videos.title, title),
      eq(videos.artist, artist),
      isNotNull(videos.youtube_id),
      ne(videos.id, video_id),
    ))
    .limit(1)

  if (existing?.youtube_id) {
    console.log(`Found existing YouTube match for "${artist} - ${title}": ${existing.youtube_id}`)
    await db.update(videos)
      .set({ youtube_id: existing.youtube_id, thumbnail: existing.thumbnail, match_status: 'verified' })
      .where(eq(videos.id, video_id))
    return
  }

  const query = encodeURIComponent(`${artist} ${title}`)
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&maxResults=1&key=${pickYouTubeKey(env)}`

  const response = await fetch(url)
  if (response.status === 429) throw new QuotaError('YouTube API quota exceeded')
  if (!response.ok) throw new Error(`YouTube search failed: ${response.status}`)

  const data = await response.json() as YoutubeSearchResponse
  const item = data.items?.[0]
  if (!item) return

  const youtube_id = item.id.videoId
  const thumbnail = item.snippet.thumbnails.default.url

  await db.update(videos)
    .set({ youtube_id, thumbnail })
    .where(eq(videos.id, video_id))
}
