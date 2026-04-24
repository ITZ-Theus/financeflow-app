export interface PaginationParams {
  page: number
  limit: number
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  totalPages: number
}

export function getPaginationParams(query: any): PaginationParams {
  const page  = Math.max(1, parseInt(query.page)  || 1)
  const limit = Math.min(100, parseInt(query.limit) || 10)
  return { page, limit }
}
