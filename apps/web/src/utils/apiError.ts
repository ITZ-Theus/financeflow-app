import axios from 'axios'

export function getApiErrorMessage(error: unknown, fallback = 'Tente novamente em instantes.'): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message
    if (typeof message === 'string') return message
  }

  if (error instanceof Error && error.message) return error.message

  return fallback
}
