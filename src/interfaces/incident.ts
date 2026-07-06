import type { Assignment } from './assignment'
import type { Attachment } from './attachment'
import type { Comment } from './comment'
import type { User } from './user'

export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical'

export interface IncidentCategory {
  id: number
  name: string
  slug: string
  description: string | null
  is_active: boolean
}

export interface IncidentStatus {
  id: number
  name: string
  slug: string
  description: string | null
  sort_order: number
  is_closed: boolean
}

export interface IncidentHistoryEntry {
  id: number
  incident_id: number
  user_id: number | null
  event_type: string
  field_name: string | null
  old_value: unknown
  new_value: unknown
  description: string
  user?: User | null
  created_at: string
  updated_at: string
}

export interface Incident {
  id: number
  ticket_number: string
  title: string
  description: string
  severity: SeverityLevel
  category_id: number
  status_id: number
  reporter_id: number
  current_assignee_id: number | null
  affected_asset: string | null
  source_ip: string | null
  location: string | null
  impact_summary: string | null
  resolution_notes: string | null
  occurred_at: string
  reported_at: string
  resolved_at: string | null
  closed_at: string | null
  created_by: number | null
  updated_by: number | null
  category?: IncidentCategory
  status?: IncidentStatus
  reporter?: User
  current_assignee?: User | null
  assignments?: Assignment[]
  comments?: Comment[]
  attachments?: Attachment[]
  history?: IncidentHistoryEntry[]
  created_at?: string | null
  updated_at?: string | null
  deleted_at?: string | null
}