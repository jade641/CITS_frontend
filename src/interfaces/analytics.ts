export interface IncidentAnalytics {
  bySeverity: Record<string, number>
  byStatus: Record<string, number>
  byCategory: Record<string, number>
  monthlyTrend: Array<{
    month: string
    incidents: number
    resolved: number
    critical: number
  }>
  performanceTrend: Array<{
    month: string
    responseMinutes: number
    resolutionHours: number
  }>
  meanResolutionHours: number
  meanResponseMinutes: number
}

export interface AnalyticsOverview {
  totalIncidents: number
  openIncidents: number
  resolvedIncidents: number
  criticalIncidents: number
  resolutionRate: number
  averageResponseMinutes: number
  averageResolutionHours: number
}

export interface UserActivityAnalyticsEntry {
  totalActions: number
  topActions: Record<string, number>
}

export interface AnalyticsPayload {
  overview: AnalyticsOverview
  incidentAnalytics: IncidentAnalytics
  userActivityAnalytics: Record<string, UserActivityAnalyticsEntry>
}