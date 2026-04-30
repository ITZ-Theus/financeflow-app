export type TransactionType = 'income' | 'expense'
export type GoalStatus = 'active' | 'completed' | 'cancelled'

export interface User {
  id: string
  name: string
  email: string
}

export interface Category {
  id: string
  name: string
  color: string
  icon: string
  type: TransactionType
  userId: string
  createdAt?: string
}

export interface Transaction {
  id: string
  title: string
  amount: number | string
  type: TransactionType
  date: string
  description?: string | null
  categoryId?: string | null
  category?: Category | null
  userId: string
  createdAt?: string
}

export interface Goal {
  id: string
  title: string
  targetAmount: number | string
  currentAmount: number | string
  deadline: string
  status: GoalStatus
  userId: string
  createdAt?: string
}

export type BudgetStatus = 'safe' | 'warning' | 'exceeded'

export interface Budget {
  id: string
  amount: number | string
  spent: number
  remaining: number
  percentage: number
  status: BudgetStatus
  month: number
  year: number
  categoryId: string
  category: Category
  userId: string
  createdAt?: string
  updatedAt?: string
}

export interface Summary {
  income: number
  expense: number
  balance: number
  expensesByCategory: Array<{
    categoryId: string | null
    name: string
    color: string
    value: number
  }>
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  totalPages: number
}

export interface AuthResponse {
  user: User
  token: string
}
