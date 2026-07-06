import type { IncidentCategory, IncidentStatus, SeverityLevel } from './incident'
import type { Permission } from './permission'
import type { Role } from './role'

export interface LookupPayload {
  incidentCategories: IncidentCategory[]
  incidentStatuses: IncidentStatus[]
  roles: Role[]
  permissions: Permission[]
  severityLevels: SeverityLevel[]
}