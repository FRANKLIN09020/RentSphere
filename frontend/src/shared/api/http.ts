import axios from 'axios'
import { tokenStorage } from '../auth/tokenStorage'

function resolveApiBaseUrl() {
  const configuredUrl = import.meta.env.VITE_API_BASE_URL?.trim()
  if (!configuredUrl) {
    return window.location.protocol === 'https:' ? '/api' : 'http://localhost:8080'
  }

  if (window.location.protocol === 'https:' && configuredUrl.startsWith('http://')) {
    const target = new URL(configuredUrl)
    if (['localhost', '127.0.0.1'].includes(target.hostname)) return '/api'
    target.protocol = 'https:'
    return target.toString().replace(/\/$/, '')
  }

  return configuredUrl.replace(/\/$/, '')
}

export const API_BASE_URL = resolveApiBaseUrl()

export const UNAUTHORIZED_EVENT = 'rentsphere:unauthorized'

export const http = axios.create({
  baseURL: API_BASE_URL,
})

http.interceptors.request.use((config) => {
  const token = tokenStorage.getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401 && tokenStorage.getToken()) {
      tokenStorage.removeToken()
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
    }
    return Promise.reject(error)
  },
)

export function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string; error?: string } | undefined
    if (!error.response) {
      return `Cannot reach the RentSphere API at ${API_BASE_URL}. Make sure the backend is running.`
    }
    if (error.response.status === 401) {
      if (error.config?.url === '/auth/login') {
        return data?.message ?? data?.error ?? 'Invalid email or password'
      }
      return 'Your session has expired. Please sign in again.'
    }
    if (error.response.status === 403) return 'Your role does not have permission to perform this action.'
    return data?.message ?? data?.error ?? `Request failed (${error.response.status})`
  }
  return error instanceof Error ? error.message : 'Unexpected error'
}
