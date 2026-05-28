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
  isRecurring?: boolean
  recurrenceInterval?: 'monthly' | null
  recurrenceEndDate?: string | null
  parentTransactionId?: string | null
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

export interface BudgetAlert {
  id: string
  budgetId: string
  categoryId: string
  categoryName: string
  categoryColor: string
  severity: 'warning' | 'critical'
  title: string
  message: string
  spent: number
  limit: number
  remaining: number
  percentage: number
  month: number
  year: number
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

export interface MonthlyTrendItem {
  month: number
  year: number
  income: number
  expense: number
  balance: number
}

export interface ReportMonthlyItem extends MonthlyTrendItem {}

export interface ReportCategoryItem {
  categoryId: string | null
  name: string
  color: string
  type: TransactionType
  total: number
  count: number
  percentage: number
}

export interface ReportTransactionItem {
  id: string
  title: string
  amount: number
  type: TransactionType
  date: string
  categoryName: string
  categoryColor: string
}

export interface FinancialReport {
  period: {
    startDate: string
    endDate: string
  }
  totals: {
    income: number
    expense: number
    balance: number
    transactionCount: number
    averageTransaction: number
    savingsRate: number
  }
  monthly: ReportMonthlyItem[]
  categories: ReportCategoryItem[]
  topTransactions: ReportTransactionItem[]
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
