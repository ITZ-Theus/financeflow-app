import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '../services/api'
import type { AuthResponse, User } from '../types'

interface AuthState {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const { data } = await api.post<AuthResponse>('/auth/login', { email, password })
        set({ token: data.token, user: data.user, isAuthenticated: true })
      },

      register: async (name, email, password) => {
        const { data } = await api.post<AuthResponse>('/auth/register', { name, email, password })
        set({ token: data.token, user: data.user, isAuthenticated: true })
      },

      logout: () => set({ token: null, user: null, isAuthenticated: false }),
    }),
    { name: '@financeflow:auth' }
  )
)
