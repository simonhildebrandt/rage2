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

export const triggerScrape = () => api.post('/api/admin/scrape')

export const rescrapePlaylist = (id: number) =>
  api.post(`/api/admin/playlists/${id}/scrape`)

export interface IssueNeighbour { id: number; aired_date: string; title: string }
export interface IssueNeighbours { prev: IssueNeighbour | null; next: IssueNeighbour | null }

export const getIssueNeighbours = (id: number) =>
  api.get<IssueNeighbours>(`/api/admin/playlists/${id}/issue-neighbours`).then(r => r.data)

export const getPlaylistNeighbours = (id: number) =>
  api.get<IssueNeighbours>(`/api/admin/playlists/${id}/neighbours`).then(r => r.data)

export interface AdminStatus { playlistCount: number; videoCount: number; unverifiedCount: number }
export const getAdminStatus = () =>
  api.get<AdminStatus>('/api/admin/status').then(r => r.data)
