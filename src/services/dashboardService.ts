import type { DashboardPayload } from '../interfaces'
import { apiClient } from './http'

export async function getDashboard(): Promise<DashboardPayload> {
  const { data } = await apiClient.get<DashboardPayload>('/dashboard')
  return data
}