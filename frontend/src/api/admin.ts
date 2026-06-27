import { api } from './client'

export const patchVideoStatus = (id: number, match_status: string) =>
  api.patch(`/api/admin/videos/${id}`, { match_status })

export interface YouTubeResult {
  youtube_id: string
  title: string
  channel: string
  thumbnail: string
}

export const searchYoutubeMatches = (q: string) =>
  api.get<YouTubeResult[]>('/api/admin/search-youtube', { params: { q } }).then(r => r.data)

export const patchVideoMatch = (id: number, youtube_id: string, thumbnail: string) =>
  api.patch(`/api/admin/videos/${id}/match`, { youtube_id, thumbnail })
