import type { ApiMessage, PaginatedResponse, Report, AnalyticsPayload } from '../interfaces'
import { apiClient, buildQuery, getDownloadFilename, triggerBrowserDownload } from './http'

export interface ReportFilters {
  date_from?: string
  date_to?: string
  status_ids?: number[]
  category_ids?: number[]
  severities?: string[]
  reporter_id?: number | ''
  assigned_to?: number | ''
}

export interface ReportSummary {
  totalIncidents: number
  severityAnalytics: Record<string, number>
  statusAnalytics: Record<string, number>
  userActivityAnalytics: AnalyticsPayload['userActivityAnalytics']
  incidentAnalytics: AnalyticsPayload['incidentAnalytics']
}

export async function listReports(): Promise<PaginatedResponse<Report>> {
  const { data } = await apiClient.get<PaginatedResponse<Report>>('/reports')
  return data
}

export async function getReportSummary(filters: ReportFilters): Promise<ReportSummary> {
  const searchParams = buildQuery({
    date_from: filters.date_from,
    date_to: filters.date_to,
    reporter_id: filters.reporter_id,
    assigned_to: filters.assigned_to,
  })

  filters.status_ids?.forEach((statusId) => searchParams.append('status_ids[]', String(statusId)))
  filters.category_ids?.forEach((categoryId) => searchParams.append('category_ids[]', String(categoryId)))
  filters.severities?.forEach((severity) => searchParams.append('severities[]', severity))

  const { data } = await apiClient.get<ReportSummary>(`/reports/summary?${searchParams.toString()}`)
  return data
}

async function exportReport(format: 'csv' | 'pdf', filters: ReportFilters): Promise<ApiMessage> {
  const { data, headers } = await apiClient.post(
    `/reports/export/${format}`,
    filters,
    {
      responseType: 'blob',
    },
  )

  const filename = getDownloadFilename(headers['content-disposition'], `incident-report.${format}`)
  triggerBrowserDownload(data, filename)

  return { message: `${format.toUpperCase()} report downloaded.` }
}

export async function exportCsvReport(filters: ReportFilters): Promise<ApiMessage> {
  return exportReport('csv', filters)
}

export async function exportPdfReport(filters: ReportFilters): Promise<ApiMessage> {
  return exportReport('pdf', filters)
}