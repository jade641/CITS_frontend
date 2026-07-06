import type { AuditLog, PaginatedResponse } from '../interfaces'
import { apiClient, buildQuery } from './http'

export interface AuditLogFilters {
  page?: number
  per_page?: number
  action?: string
  user_id?: number | ''
  search?: string
}

export async function listAuditLogs(filters: AuditLogFilters = {}): Promise<PaginatedResponse<AuditLog>> {
  const searchParams = buildQuery(filters)
  const { data } = await apiClient.get<PaginatedResponse<AuditLog>>(
    `/audit-logs?${searchParams.toString()}`,
  )
  return data
}