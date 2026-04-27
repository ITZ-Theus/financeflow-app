import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'info'

export interface Toast {
  id: string
  title: string
  description?: string
  type: ToastType
}

interface ToastState {
  toasts: Toast[]
  notify: (toast: Omit<Toast, 'id'>) => void
  remove: (id: string) => void
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  notify: (toast) => {
    const id = crypto.randomUUID()

    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }))

    window.setTimeout(() => {
      get().remove(id)
    }, 4200)
  },

  remove: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }))
  },
}))

export const toast = {
  success(title: string, description?: string) {
    useToastStore.getState().notify({ type: 'success', title, description })
  },

  error(title: string, description?: string) {
    useToastStore.getState().notify({ type: 'error', title, description })
  },

  info(title: string, description?: string) {
    useToastStore.getState().notify({ type: 'info', title, description })
  },
}
