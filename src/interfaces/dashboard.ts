import type { AuditLog } from './auditLog'

export interface DashboardWidgets {
  totalIncidents: number
  openIncidents: number
  resolvedIncidents: number
  criticalIncidents: number
}

export interface DashboardSecurityMetrics {
  severityBreakdown: Record<string, number>
  statusBreakdown: Record<string, number>
}

export interface DashboardPayload {
  widgets: DashboardWidgets
  recentActivities: AuditLog[]
  securityMetrics: DashboardSecurityMetrics
}