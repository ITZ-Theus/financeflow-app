import axios from 'axios'
import { useAuthStore } from '../store/authStore'
import { toast } from '../store/toastStore'

const LOCAL_API_URL = 'http://localhost:3333/api'
const PRODUCTION_API_URL = 'https://financeflow-api-q5ax.onrender.com/api'

function normalizeUrl(url: string): string {
  return url.trim().replace(/\/+$/, '')
}

export function resolveApiBaseUrl(
  configuredUrl = import.meta.env.VITE_API_URL,
  browserHost = typeof window !== 'undefined' ? window.location.hostname : ''
): string {
  const apiUrl = configuredUrl ? normalizeUrl(configuredUrl) : LOCAL_API_URL

  if (!apiUrl.includes('host.docker.internal')) {
    return apiUrl
  }

  if (browserHost === 'localhost' || browserHost === '127.0.0.1') {
    return LOCAL_API_URL
  }

  return PRODUCTION_API_URL
}

export const api = axios.create({
  baseURL: resolveApiBaseUrl(),
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const hadToken = Boolean(useAuthStore.getState().token)
      useAuthStore.getState().logout()

      if (hadToken) {
        toast.info('Sessao expirada', 'Faca login novamente para continuar.')
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)
