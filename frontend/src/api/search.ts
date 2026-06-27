import { api } from './client'

export interface SearchResult {
  playlist_id: number
  aired_date: string
  playlist_title: string
  match_type: 'date' | 'track'
  video_id: number | null
  track_artist: string | null
  track_title: string | null
  track_position: number | null
  track_match_count: number | null
}

export const searchArchive = (params: { q: string; mode: string }) =>
  api.get<SearchResult[]>('/api/search', { params }).then(r => r.data)
