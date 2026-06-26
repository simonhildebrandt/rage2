export interface Env {
  DB: D1Database
  PLAYLIST_QUEUE: Queue<PlaylistQueueMessage>
  YOUTUBE_QUEUE: Queue<YoutubeQueueMessage>
  LOGIN_WITH_LINK_SECRET: string
  YOUTUBE_API_KEY: string
  VAPID_PRIVATE_KEY: string
  ENVIRONMENT: string
}

export interface PlaylistQueueMessage {
  playlist_id: number
  source_url: string
}

export interface YoutubeQueueMessage {
  video_id: number
  title: string
  artist: string
}
