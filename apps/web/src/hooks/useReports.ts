import { useQuery } from 'react-query'
import { api } from '../services/api'
import type { FinancialReport, TransactionType } from '../types'

export interface ReportFilters {
  startDate?: string
  endDate?: string
  type?: TransactionType
  categoryId?: string
}

export function useFinancialReport(params: ReportFilters) {
  return useQuery<FinancialReport>(['financial-report', params], async () => {
    const { data } = await api.get('/reports/financial', { params })
    return data
  })
}
