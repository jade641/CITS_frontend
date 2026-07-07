import type {
  ApiMessage,
  Assignment,
  Attachment,
  Comment,
  Incident,
  SeverityLevel,
  PaginatedResponse,
  IncidentTimelineEntry,
  IncidentIocEntry,
  IncidentAffectedSystemEntry,
  IncidentActionTakenEntry,
  IncidentRemediationActionEntry,
} from '../interfaces'
import { apiClient, buildQuery } from './http'

export interface IncidentFilters {
  page?: number
  per_page?: number
  search?: string
  severity?: SeverityLevel | ''
  status_id?: number | ''
  category_id?: number | ''
  mine?: boolean
  assigned_to_me?: boolean
}

export interface IncidentPayload {
  title: string
  description: string
  severity: SeverityLevel
  category_id: number
  affected_asset?: string
  source_ip?: string
  location?: string
  impact_summary?: string
  occurred_at: string
}

export interface UpdateIncidentPayload extends Partial<IncidentPayload> {
  resolution_notes?: string
}

export async function listIncidents(filters: IncidentFilters = {}): Promise<PaginatedResponse<Incident>> {
  const searchParams = buildQuery(filters)
  const { data } = await apiClient.get<PaginatedResponse<Incident>>(
    `/incidents?${searchParams.toString()}`,
  )
  return data
}

export async function getIncident(id: number): Promise<{ incident: Incident }> {
  const { data } = await apiClient.get<{ incident: Incident }>(`/incidents/${id}`)
  return data
}

export async function createIncident(payload: IncidentPayload): Promise<{ message: string; incident: Incident }> {
  const { data } = await apiClient.post<{ message: string; incident: Incident }>('/incidents', payload)
  return data
}

export async function updateIncident(
  id: number,
  payload: UpdateIncidentPayload,
): Promise<{ message: string; incident: Incident }> {
  const { data } = await apiClient.put<{ message: string; incident: Incident }>(`/incidents/${id}`, payload)
  return data
}

export async function deleteIncident(id: number): Promise<ApiMessage> {
  const { data } = await apiClient.delete<ApiMessage>(`/incidents/${id}`)
  return data
}

export async function assignIncident(
  incidentId: number,
  assignedTo: number,
  note: string,
): Promise<{ message: string; assignment: Assignment; incident: Incident }> {
  const { data } = await apiClient.post<{ message: string; assignment: Assignment; incident: Incident }>(
    `/incidents/${incidentId}/assignments`,
    { assigned_to: assignedTo, note },
  )
  return data
}

export async function changeIncidentStatus(
  incidentId: number,
  statusId: number,
  resolutionNotes: string,
): Promise<{ message: string; incident: Incident }> {
  const { data } = await apiClient.post<{ message: string; incident: Incident }>(
    `/incidents/${incidentId}/status`,
    { status_id: statusId, resolution_notes: resolutionNotes },
  )
  return data
}

export async function addComment(
  incidentId: number,
  body: string,
  isInternal: boolean,
): Promise<{ message: string; comment: Comment }> {
  const { data } = await apiClient.post<{ message: string; comment: Comment }>(
    `/incidents/${incidentId}/comments`,
    { body, is_internal: isInternal },
  )
  return data
}

export async function addAttachment(
  incidentId: number,
  file: File,
): Promise<{ message: string; attachment: Attachment }> {
  const formData = new FormData()
  formData.append('file', file)

  const { data } = await apiClient.post<{ message: string; attachment: Attachment }>(
    `/incidents/${incidentId}/attachments`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  )

  return data
}

export async function updateIncidentStatus(
  id: number,
  status: string,
): Promise<{ message: string; incident: Incident }> {
  const { data } = await apiClient.patch<{ message: string; incident: Incident }>(
    `/incidents/${id}/status`,
    { status },
  )
  return data
}

export async function saveIncidentTimeline(
  id: number,
  entries: IncidentTimelineEntry[],
): Promise<{ message: string; incident: Incident }> {
  const { data } = await apiClient.post<{ message: string; incident: Incident }>(
    `/incidents/${id}/timeline`,
    { entries },
  )
  return data
}

export async function saveIncidentIocs(
  id: number,
  entries: IncidentIocEntry[],
): Promise<{ message: string; incident: Incident }> {
  const { data } = await apiClient.post<{ message: string; incident: Incident }>(
    `/incidents/${id}/iocs`,
    { entries },
  )
  return data
}

export async function saveIncidentAffectedSystems(
  id: number,
  entries: IncidentAffectedSystemEntry[],
): Promise<{ message: string; incident: Incident }> {
  const { data } = await apiClient.post<{ message: string; incident: Incident }>(
    `/incidents/${id}/affected-systems`,
    { entries },
  )
  return data
}

export async function saveIncidentActionsTaken(
  id: number,
  entries: IncidentActionTakenEntry[],
): Promise<{ message: string; incident: Incident }> {
  const { data } = await apiClient.post<{ message: string; incident: Incident }>(
    `/incidents/${id}/actions-taken`,
    { entries },
  )
  return data
}

export async function saveIncidentSeverity(
  id: number,
  payload: {
    confidentiality_impact: string
    integrity_impact: string
    availability_impact: string
    affected_systems_count: number
    data_sensitivity: string
    severity_override: boolean
    severity?: string
    severity_override_justification?: string
  },
): Promise<{ message: string; incident: Incident }> {
  const { data } = await apiClient.post<{ message: string; incident: Incident }>(
    `/incidents/${id}/severity`,
    payload,
  )
  return data
}

export async function uploadEvidenceFile(
  id: number,
  file: File,
  description: string,
): Promise<{ message: string; attachment: Attachment; incident: Incident }> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('description', description)

  const { data } = await apiClient.post<{ message: string; attachment: Attachment; incident: Incident }>(
    `/incidents/${id}/evidence`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  )
  return data
}

export async function saveIncidentFindings(
  id: number,
  payload: {
    root_cause_category: string
    root_cause_explanation: string
    lessons_learned: string
  },
): Promise<{ message: string; incident: Incident }> {
  const { data } = await apiClient.post<{ message: string; incident: Incident }>(
    `/incidents/${id}/findings`,
    payload,
  )
  return data
}

export async function saveIncidentRemediationActions(
  id: number,
  entries: IncidentRemediationActionEntry[],
): Promise<{ message: string; incident: Incident }> {
  const { data } = await apiClient.post<{ message: string; incident: Incident }>(
    `/incidents/${id}/remediation-actions`,
    { entries },
  )
  return data
}

export async function submitIncidentResolution(
  id: number,
): Promise<{ message: string; incident: Incident }> {
  const { data } = await apiClient.post<{ message: string; incident: Incident }>(
    `/incidents/${id}/submit-resolution`,
  )
  return data
}

export async function getIncidentAuditLog(
  id: number,
): Promise<{ audit_logs: any[] }> {
  const { data } = await apiClient.get<{ audit_logs: any[] }>(
    `/incidents/${id}/audit-log`,
  )
  return data
}