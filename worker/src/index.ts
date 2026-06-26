import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Env, PlaylistQueueMessage } from './types'
import { playlistRoutes } from './routes/playlists'
import { videoRoutes } from './routes/videos'
import { adminRoutes } from './routes/admin'
import { runScrape } from './cron/scraper'
import { scrapePlaylist } from './cron/playlistScraper'

const app = new Hono<{ Bindings: Env }>()

app.use('*', cors({ origin: '*' }))

app.route('/api/playlists', playlistRoutes)
app.route('/api/videos', videoRoutes)
app.route('/api/admin', adminRoutes)

export default {
  fetch: app.fetch,

  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(runScrape(env))
  },

  async queue(batch: MessageBatch<PlaylistQueueMessage>, env: Env): Promise<void> {
    for (const message of batch.messages) {
      const { playlist_id, source_url } = message.body
      try {
        await scrapePlaylist(env, playlist_id, source_url)
        message.ack()
      } catch (err) {
        console.error(`Failed to scrape playlist ${playlist_id}:`, err)
        message.retry()
      }
    }
  },
}
