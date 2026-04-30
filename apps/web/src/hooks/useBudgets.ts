import { useMutation, useQuery, useQueryClient } from 'react-query'
import { api } from '../services/api'
import { toast } from '../store/toastStore'
import { getApiErrorMessage } from '../utils/apiError'
import type { Budget } from '../types'

export interface BudgetFilters {
  month?: number
  year?: number
}

export interface CreateBudgetPayload {
  amount: number
  month: number
  year: number
  categoryId: string
}

export function useBudgets(params?: BudgetFilters) {
  return useQuery<Budget[]>(['budgets', params], async () => {
    const { data } = await api.get('/budgets', { params })
    return data
  })
}

export function useCreateBudget() {
  const qc = useQueryClient()
  return useMutation(
    async (body: CreateBudgetPayload) => {
      const { data } = await api.post<Budget>('/budgets', body)
      return data
    },
    {
      onSuccess: () => {
        qc.invalidateQueries('budgets')
        toast.success('Orcamento criado', 'O limite mensal ja esta sendo acompanhado.')
      },
      onError: (error) => {
        toast.error('Erro ao criar orcamento', getApiErrorMessage(error))
      },
    }
  )
}

export function useDeleteBudget() {
  const qc = useQueryClient()
  return useMutation(
    async (id: string) => { await api.delete(`/budgets/${id}`) },
    {
      onSuccess: () => {
        qc.invalidateQueries('budgets')
        toast.success('Orcamento removido', 'O acompanhamento desta categoria foi encerrado.')
      },
      onError: (error) => {
        toast.error('Erro ao remover orcamento', getApiErrorMessage(error))
      },
    }
  )
}
