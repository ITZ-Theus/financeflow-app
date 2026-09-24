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

export interface PaginationQuery {
  page?: string | number
  limit?: string | number
}

export function getPaginationParams(query: PaginationQuery): PaginationParams {
  const page  = Math.max(1, parseInt(String(query.page))  || 1)
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit)) || 10))
  return { page, limit }
}
