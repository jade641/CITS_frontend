import type { ApiMessage, PaginatedResponse, User, UserStatus } from '../interfaces'
import { apiClient, buildQuery } from './http'

export interface UserFilters {
  page?: number
  search?: string
  status?: UserStatus | ''
}

export interface UserPayload {
  name: string
  email: string
  phone: string
  department: string
  job_title: string
  status: UserStatus
  password?: string
  password_confirmation?: string
  role_ids: number[]
}

export async function listUsers(filters: UserFilters = {}): Promise<PaginatedResponse<User>> {
  const searchParams = buildQuery(filters)
  const { data } = await apiClient.get<PaginatedResponse<User>>(`/users?${searchParams.toString()}`)
  return data
}

export async function getUser(id: number): Promise<{ user: User }> {
  const { data } = await apiClient.get<{ user: User }>(`/users/${id}`)
  return data
}

export async function createUser(payload: UserPayload): Promise<{ message: string; user: User }> {
  const { data } = await apiClient.post<{ message: string; user: User }>('/users', payload)
  return data
}

export async function updateUser(id: number, payload: UserPayload): Promise<{ message: string; user: User }> {
  const { data } = await apiClient.put<{ message: string; user: User }>(`/users/${id}`, payload)
  return data
}

export async function deleteUser(id: number): Promise<ApiMessage> {
  const { data } = await apiClient.delete<ApiMessage>(`/users/${id}`)
  return data
}