import type { LookupPayload } from '../interfaces'
import { apiClient } from './http'

export async function getLookups(): Promise<LookupPayload> {
  const { data } = await apiClient.get<LookupPayload>('/lookups')
  return data
}