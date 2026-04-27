import axios from 'axios'
import { useAuthStore } from '../store/authStore'
import { toast } from '../store/toastStore'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3333/api',
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
        toast.info('Sessão expirada', 'Faça login novamente para continuar.')
      }
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
