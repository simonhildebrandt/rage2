import axios from 'axios'

export const api = axios.create({
  baseURL: (import.meta.env.API_BASE as string) ?? 'http://localhost:8787',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('rage2_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
