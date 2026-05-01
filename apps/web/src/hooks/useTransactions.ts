import { useQuery, useMutation, useQueryClient } from 'react-query'
import { api } from '../services/api'
import { toast } from '../store/toastStore'
import { getApiErrorMessage } from '../utils/apiError'
import type { PaginatedResult, Summary, Transaction, TransactionType } from '../types'

export interface TransactionFilters {
  page?: number
  limit?: number
  month?: number
  year?: number
  type?: TransactionType
  categoryId?: string
}

export interface CreateTransactionPayload {
  title: string
  amount: number
  type: TransactionType
  date: string
  description?: string
  categoryId?: string | null
}

export interface UpdateTransactionPayload extends Partial<CreateTransactionPayload> {
  id: string
}

export function useTransactions(params?: TransactionFilters) {
  return useQuery<PaginatedResult<Transaction>>(['transactions', params], async () => {
    const { data } = await api.get('/transactions', { params })
    return data
  })
}

export function useSummary(params?: Pick<TransactionFilters, 'month' | 'year'>) {
  return useQuery<Summary>(['summary', params], async () => {
    const { data } = await api.get('/transactions/summary', { params })
    return data
  })
}

function getFilename(disposition?: string): string {
  const match = disposition?.match(/filename="?([^"]+)"?/)
  return match?.[1] || 'financeflow-transactions.csv'
}

export async function exportTransactionsCsv(params?: TransactionFilters) {
  const response = await api.get('/transactions/export', {
    params,
    responseType: 'blob',
  })

  const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = getFilename(response.headers['content-disposition'])
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function useCreateTransaction() {
  const qc = useQueryClient()
  return useMutation(
    async (body: CreateTransactionPayload) => {
      const { data } = await api.post<Transaction>('/transactions', body)
      return data
    },
    {
      onSuccess: () => {
        qc.invalidateQueries('transactions')
        qc.invalidateQueries('summary')
        qc.invalidateQueries('budgets')
        toast.success('Transação criada', 'Seu fluxo financeiro foi atualizado.')
      },
      onError: (error) => {
        toast.error('Erro ao criar transação', getApiErrorMessage(error))
      },
    }
  )
}

export function useUpdateTransaction() {
  const qc = useQueryClient()
  return useMutation(
    async ({ id, ...body }: UpdateTransactionPayload) => {
      const { data } = await api.put<Transaction>(`/transactions/${id}`, body)
      return data
    },
    {
      onSuccess: () => {
        qc.invalidateQueries('transactions')
        qc.invalidateQueries('summary')
        qc.invalidateQueries('budgets')
        toast.success('Transacao atualizada', 'Seu fluxo financeiro foi recalculado.')
      },
      onError: (error) => {
        toast.error('Erro ao atualizar transacao', getApiErrorMessage(error))
      },
    }
  )
}

export function useDeleteTransaction() {
  const qc = useQueryClient()
  return useMutation(
    async (id: string) => { await api.delete(`/transactions/${id}`) },
    {
      onSuccess: () => {
        qc.invalidateQueries('transactions')
        qc.invalidateQueries('summary')
        qc.invalidateQueries('budgets')
        toast.success('Transação removida', 'O saldo foi recalculado automaticamente.')
      },
      onError: (error) => {
        toast.error('Erro ao remover transação', getApiErrorMessage(error))
      },
    }
  )
}
