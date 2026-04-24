import { useQuery, useMutation, useQueryClient } from 'react-query'
import { api } from '../services/api'
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
  categoryId?: string
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

export function useCreateTransaction() {
  const qc = useQueryClient()
  return useMutation(
    async (body: CreateTransactionPayload) => {
      const { data } = await api.post<Transaction>('/transactions', body)
      return data
    },
    { onSuccess: () => { qc.invalidateQueries('transactions'); qc.invalidateQueries('summary') } }
  )
}

export function useDeleteTransaction() {
  const qc = useQueryClient()
  return useMutation(
    async (id: string) => { await api.delete(`/transactions/${id}`) },
    { onSuccess: () => { qc.invalidateQueries('transactions'); qc.invalidateQueries('summary') } }
  )
}
