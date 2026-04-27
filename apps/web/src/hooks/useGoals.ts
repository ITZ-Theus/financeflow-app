import { useQuery, useMutation, useQueryClient } from 'react-query'
import { api } from '../services/api'
import { toast } from '../store/toastStore'
import { getApiErrorMessage } from '../utils/apiError'
import type { Goal, GoalStatus } from '../types'

export interface CreateGoalPayload {
  title: string
  targetAmount: number
  deadline: string
}

export interface UpdateGoalPayload {
  id: string
  title?: string
  targetAmount?: number
  currentAmount?: number
  deadline?: string
  status?: GoalStatus
}

export function useGoals() {
  return useQuery<Goal[]>('goals', async () => {
    const { data } = await api.get('/goals')
    return data
  })
}

export function useCreateGoal() {
  const qc = useQueryClient()
  return useMutation(
    async (body: CreateGoalPayload) => {
      const { data } = await api.post<Goal>('/goals', body)
      return data
    },
    {
      onSuccess: () => {
        qc.invalidateQueries('goals')
        toast.success('Meta criada', 'Você já pode acompanhar o progresso.')
      },
      onError: (error) => {
        toast.error('Erro ao criar meta', getApiErrorMessage(error))
      },
    }
  )
}

export function useUpdateGoal() {
  const qc = useQueryClient()
  return useMutation(
    async ({ id, ...body }: UpdateGoalPayload) => {
      const { data } = await api.put<Goal>(`/goals/${id}`, body)
      return data
    },
    {
      onSuccess: () => {
        qc.invalidateQueries('goals')
        toast.success('Meta atualizada', 'O progresso foi salvo com sucesso.')
      },
      onError: (error) => {
        toast.error('Erro ao atualizar meta', getApiErrorMessage(error))
      },
    }
  )
}

export function useDeleteGoal() {
  const qc = useQueryClient()
  return useMutation(
    async (id: string) => { await api.delete(`/goals/${id}`) },
    {
      onSuccess: () => {
        qc.invalidateQueries('goals')
        toast.success('Meta removida', 'A lista de objetivos foi atualizada.')
      },
      onError: (error) => {
        toast.error('Erro ao remover meta', getApiErrorMessage(error))
      },
    }
  )
}
