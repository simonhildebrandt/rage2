import { api } from './client'

export interface Playlist {
  id: number
  aired_date: string
  title: string
  scraped_at: string
  source_url: string
}

export interface PlaylistNeighbour {
  id: number
  aired_date: string
  title: string
}

export interface PlaylistWithVideos extends Playlist {
  videos: Video[]
  prev: PlaylistNeighbour | null
  next: PlaylistNeighbour | null
}

export interface Video {
  id: number
  playlist_id: number
  position: number
  title: string
  artist: string
  label: string | null
  youtube_id: string | null
  thumbnail: string | null
}

export const getPlaylists = (params?: { page?: number; year?: string }) =>
  api.get<Playlist[]>('/api/playlists', { params }).then(r => r.data)

export const getPlaylist = (id: number) =>
  api.get<PlaylistWithVideos>(`/api/playlists/${id}`).then(r => r.data)
