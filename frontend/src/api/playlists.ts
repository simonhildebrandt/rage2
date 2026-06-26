import { api } from './client'

export interface Playlist {
  id: number
  aired_date: string
  title: string
  scraped_at: string
  source_url: string
}

export interface PlaylistWithVideos extends Playlist {
  videos: Video[]
}

export interface Video {
  id: number
  playlist_id: number
  position: number
  title: string
  artist: string
  youtube_id: string | null
  thumbnail: string | null
}

export const getPlaylists = (page = 1) =>
  api.get<Playlist[]>('/api/playlists', { params: { page } }).then(r => r.data)

export const getPlaylist = (id: number) =>
  api.get<PlaylistWithVideos>(`/api/playlists/${id}`).then(r => r.data)
