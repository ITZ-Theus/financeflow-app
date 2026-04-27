import { useQuery, useMutation, useQueryClient } from 'react-query'
import { api } from '../services/api'
import { toast } from '../store/toastStore'
import { getApiErrorMessage } from '../utils/apiError'
import type { Category, TransactionType } from '../types'

export interface CreateCategoryPayload {
  name: string
  color?: string
  icon?: string
  type: TransactionType
}

export interface UpdateCategoryPayload extends CreateCategoryPayload {
  id: string
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
    {
      onSuccess: () => {
        qc.invalidateQueries('categories')
        toast.success('Categoria criada', 'A categoria já está disponível para suas transações.')
      },
      onError: (error) => {
        toast.error('Erro ao criar categoria', getApiErrorMessage(error))
      },
    }
  )
}

export function useUpdateCategory() {
  const qc = useQueryClient()
  return useMutation(
    async ({ id, ...body }: UpdateCategoryPayload) => {
      const { data } = await api.put<Category>(`/categories/${id}`, body)
      return data
    },
    {
      onSuccess: () => {
        qc.invalidateQueries('categories')
        qc.invalidateQueries('summary')
        toast.success('Categoria atualizada', 'As mudanças já estão refletidas no sistema.')
      },
      onError: (error) => {
        toast.error('Erro ao atualizar categoria', getApiErrorMessage(error))
      },
    }
  )
}
