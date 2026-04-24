import { useQuery, useMutation, useQueryClient } from 'react-query'
import { api } from '../services/api'
import type { Category, TransactionType } from '../types'

export interface CreateCategoryPayload {
  name: string
  color?: string
  icon?: string
  type: TransactionType
}

export function useCategories() {
  return useQuery<Category[]>('categories', async () => {
    const { data } = await api.get('/categories')
    return data
  })
}

export function useCreateCategory() {
  const qc = useQueryClient()
  return useMutation(
    async (body: CreateCategoryPayload) => {
      const { data } = await api.post<Category>('/categories', body)
      return data
    },
    { onSuccess: () => qc.invalidateQueries('categories') }
  )
}
