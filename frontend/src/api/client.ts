import axios from 'axios'

export const api = axios.create({
  baseURL: (import.meta.env.API_BASE as string) ?? 'http://localhost:8787',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('rage2_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401 || err.response?.status === 403) {
      localStorage.removeItem('rage2_token')
      window.location.href = '/login?error=auth'
    }
    return Promise.reject(err)
  }
)
