export interface Env {
  DB: D1Database
  PLAYLIST_QUEUE: Queue<PlaylistQueueMessage>
  LOGIN_WITH_LINK_SECRET: string
  VAPID_PRIVATE_KEY: string
  ENVIRONMENT: string
}

export interface PlaylistQueueMessage {
  playlist_id: number
  source_url: string
}
