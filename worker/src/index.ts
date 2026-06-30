import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Env, PlaylistQueueMessage, YoutubeQueueMessage } from './types'
import { playlistRoutes } from './routes/playlists'
import { videoRoutes } from './routes/videos'
import { adminRoutes } from './routes/admin'
import { statsRoutes } from './routes/stats'
import { searchRoutes } from './routes/search'
import { runScrape } from './cron/scraper'
import { scrapePlaylist } from './cron/playlistScraper'
import { searchYoutube, QuotaError } from './cron/youtubeScraper'
import { requeueUnmatchedVideos } from './cron/youtubeRetry'

const app = new Hono<{ Bindings: Env }>()

app.use('*', cors({ origin: '*' }))

app.route('/api/playlists', playlistRoutes)
app.route('/api/videos', videoRoutes)
app.route('/api/admin', adminRoutes)
app.route('/api/stats', statsRoutes)
app.route('/api/search', searchRoutes)

export default {
  fetch: app.fetch,

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    switch (event.cron) {
      case '0 20 * * *': return ctx.waitUntil(runScrape(env))           // Saturday scrape
      case '27 7 * * *': return ctx.waitUntil(requeueUnmatchedVideos(env)) // Daily YouTube retry
    }
  },

  async queue(batch: MessageBatch<PlaylistQueueMessage | YoutubeQueueMessage>, env: Env): Promise<void> {
    for (const message of batch.messages) {
      try {
        if (batch.queue === 'rage2-playlist-scrape') {
          const { playlist_id, source_url } = message.body as PlaylistQueueMessage
          await scrapePlaylist(env, playlist_id, source_url)
        } else if (batch.queue === 'rage2-youtube-search') {
          const { video_id, title, artist } = message.body as YoutubeQueueMessage
          await searchYoutube(env, video_id, title, artist)
        }
        message.ack()
      } catch (err) {
        if (err instanceof QuotaError) {
          console.error(`YouTube quota exceeded, dropping message:`, err)
          message.ack()
        } else {
          console.error(`Failed to process message on ${batch.queue}:`, err)
          message.retry()
        }
      }
    }
  },
}
