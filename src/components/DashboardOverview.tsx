import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import type { DashboardPayload } from '../interfaces'
import { getDashboard } from '../services/dashboardService'
import { formatDateTime, formatSlug } from '../services/formatters'
import { getApiErrorMessage } from '../services/http'
import { LoadingState } from './LoadingState'
import { MetricBarList } from './MetricBarList'
import { SectionCard } from './SectionCard'
import { StatCard } from './StatCard'

interface QuickLink {
  to: string
  label: string
  description: string
}

interface DashboardOverviewProps {
  title: string
  subtitle: string
  heroLabel?: string
  quickLinks: QuickLink[]
}

export function DashboardOverview({
  title,
  subtitle,
  heroLabel = 'Security Overview',
  quickLinks,
}: DashboardOverviewProps) {
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadDashboard() {
      try {
        setIsLoading(true)
        setError(null)
        const response = await getDashboard()
        setDashboard(response)
      } catch (loadError) {
        setError(getApiErrorMessage(loadError))
      } finally {
        setIsLoading(false)
      }
    }

    void loadDashboard()
  }, [])

  if (isLoading) {
    return <LoadingState message="Loading dashboard intelligence..." />
  }

  if (!dashboard) {
    return (
      <SectionCard title="Dashboard Unavailable" subtitle={error ?? 'Unable to load dashboard data.'}>
        <p className="mb-0 text-body-secondary">Please refresh the page or verify the backend API is running.</p>
      </SectionCard>
    )
  }

  return (
    <div className="d-flex flex-column gap-4">
      <section className="hero-panel">
        <div>
          <span className="eyebrow">{heroLabel}</span>
          <h1 className="display-6 fw-semibold mb-2">{title}</h1>
          <p className="mb-0 text-body-secondary hero-copy">{subtitle}</p>
        </div>
        <div className="hero-panel__actions">
          {quickLinks.map((quickLink) => (
            <Link key={quickLink.to} className="quick-link" to={quickLink.to}>
              <strong>{quickLink.label}</strong>
              <span>{quickLink.description}</span>
            </Link>
          ))}
        </div>
      </section>

      <div className="row g-3">
        <div className="col-md-6 col-xl-3">
          <StatCard title="Total Incidents" value={dashboard.widgets.totalIncidents} icon="bi-collection" />
        </div>
        <div className="col-md-6 col-xl-3">
          <StatCard title="Open Incidents" value={dashboard.widgets.openIncidents} icon="bi-exclamation-triangle" accent="danger" />
        </div>
        <div className="col-md-6 col-xl-3">
          <StatCard title="Resolved Incidents" value={dashboard.widgets.resolvedIncidents} icon="bi-check2-circle" accent="success" />
        </div>
        <div className="col-md-6 col-xl-3">
          <StatCard title="Critical Incidents" value={dashboard.widgets.criticalIncidents} icon="bi-shield-fill-exclamation" accent="warning" />
        </div>
      </div>

      <div className="row g-4">
        <div className="col-xl-7">
          <SectionCard title="Recent Activities" subtitle="Audit events captured by the platform.">
            <div className="activity-feed d-flex flex-column gap-3">
              {dashboard.recentActivities.map((activity) => (
                <article key={activity.id} className="activity-item">
                  <div className="activity-item__icon">
                    <i className="bi bi-radar" />
                  </div>
                  <div>
                    <p className="mb-1 fw-semibold">{formatSlug(activity.action)}</p>
                    <p className="mb-1 text-body-secondary small">
                      {activity.user?.email ?? 'System'} · {formatDateTime(activity.created_at)}
                    </p>
                    <p className="mb-0 small text-body-secondary">
                      {activity.entity_type ?? 'Platform event'}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </SectionCard>
        </div>
        <div className="col-xl-5 d-flex flex-column gap-4">
          <SectionCard title="Severity Metrics" subtitle="Current incident distribution by severity.">
            <MetricBarList title="Severity Overview" items={dashboard.securityMetrics.severityBreakdown} />
          </SectionCard>
          <SectionCard title="Status Metrics" subtitle="Workflow distribution across incident states.">
            <MetricBarList title="Status Overview" items={dashboard.securityMetrics.statusBreakdown} />
          </SectionCard>
        </div>
      </div>
    </div>
  )
}
