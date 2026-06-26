import { api } from './client'
import type { Video } from './playlists'

export const getVideos = (playlistId: number) =>
  api.get<Video[]>('/api/videos', { params: { playlist_id: playlistId } }).then(r => r.data)
