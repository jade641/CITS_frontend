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

export interface IncidentTimelineEntry {
  id?: number
  incident_id?: number
  occurred_at: string
  description: string
  created_at?: string
  updated_at?: string
}

export interface IncidentIocEntry {
  id?: number
  incident_id?: number
  type: string
  value: string
  description: string | null
  created_at?: string
  updated_at?: string
}

export interface IncidentAffectedSystemEntry {
  id?: number
  incident_id?: number
  asset_name: string
  asset_type: string
  impact_level: string
  created_at?: string
  updated_at?: string
}

export interface IncidentActionTakenEntry {
  id?: number
  incident_id?: number
  occurred_at: string
  action: string
  performed_by: string
  created_at?: string
  updated_at?: string
}

export interface IncidentRemediationActionEntry {
  id?: number
  incident_id?: number
  description: string
  owner_id: number
  due_date: string
  status: 'Pending' | 'In Progress' | 'Done'
  owner?: User
  created_at?: string
  updated_at?: string
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
  confidentiality_impact: string | null
  integrity_impact: string | null
  availability_impact: string | null
  affected_systems_count: number
  data_sensitivity: string | null
  severity_override: boolean
  severity_override_justification: string | null
  source_ip: string | null
  location: string | null
  impact_summary: string | null
  resolution_notes: string | null
  root_cause_category: string | null
  root_cause_explanation: string | null
  lessons_learned: string | null
  rejection_reason: string | null
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
  timelines?: IncidentTimelineEntry[]
  iocs?: IncidentIocEntry[]
  affected_systems?: IncidentAffectedSystemEntry[]
  actions_taken?: IncidentActionTakenEntry[]
  remediation_actions?: IncidentRemediationActionEntry[]
  created_at?: string | null
  updated_at?: string | null
  deleted_at?: string | null
}