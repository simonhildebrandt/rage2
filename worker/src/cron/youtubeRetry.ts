import type { Env } from '../types'
import { getDb } from '../db/client'
import { videos } from '../db/schema'
import { isNull } from 'drizzle-orm'

export async function requeueUnmatchedVideos(env: Env): Promise<void> {
  const unmatched = await getDb(env)
    .select({ id: videos.id, title: videos.title, artist: videos.artist })
    .from(videos)
    .where(isNull(videos.youtube_id))

  for (const video of unmatched) {
    await env.YOUTUBE_QUEUE.send({
      video_id: video.id,
      title: video.title,
      artist: video.artist,
    })
  }

  console.log(`Requeued ${unmatched.length} unmatched videos for YouTube search`)
}
