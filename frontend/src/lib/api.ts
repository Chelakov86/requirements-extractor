import axios from 'axios'

export interface ApiError {
  error: string
  message: string
}

export function getApiErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as ApiError | { detail?: string } | undefined
    if (data && 'message' in data && typeof data.message === 'string') return data.message
    if (data && 'detail' in data && typeof data.detail === 'string') return data.detail
    return err.message
  }
  return 'Ein unbekannter Fehler ist aufgetreten.'
}

const api = axios.create({ baseURL: '/api/v1' })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('access_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  },
)

export default api
