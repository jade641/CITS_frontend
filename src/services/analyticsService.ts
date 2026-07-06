import type { AnalyticsPayload } from '../interfaces'
import { apiClient } from './http'

export async function getAnalytics(): Promise<AnalyticsPayload> {
  const { data } = await apiClient.get<AnalyticsPayload>('/analytics')
  return data
}