import type { User } from './user'

export interface AuditLog {
  id: number
  user_id: number | null
  action: string
  entity_type: string | null
  entity_id: number | null
  ip_address: string | null
  user_agent: string | null
  metadata: Record<string, string | number | boolean | null | string[] | number[]> | null
  user?: User | null
  created_at: string
}