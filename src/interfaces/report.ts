import type { User } from './user'

export interface Report {
  id: number
  generated_by: number | null
  name: string
  type: string
  format: 'csv' | 'pdf'
  status: string
  filters: Record<string, unknown> | null
  summary: Record<string, unknown> | null
  file_path: string | null
  generated_at: string
  generator?: User | null
  created_at?: string | null
  updated_at?: string | null
}