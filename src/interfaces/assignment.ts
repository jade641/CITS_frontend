import type { User } from './user'

export interface Assignment {
  id: number
  incident_id: number
  assigned_to: number
  assigned_by: number | null
  note: string | null
  assigned_at: string
  released_at: string | null
  is_active: boolean
  assignee?: User
  assigner?: User | null
  created_at?: string | null
  updated_at?: string | null
}