import { api } from './client'

export interface Stats {
  playlists: number
  videos: number
  oldest_aired_date: string | null
  years: string[]
}

export const getStats = () =>
  api.get<Stats>('/api/stats').then(r => r.data)
