import { Link } from 'react-router-dom'

interface EmptyStateProps {
  title: string
  description?: string
  message?: string
  icon?: string
  actionLabel?: string
  actionTo?: string
}

export function EmptyState({
  title,
  description,
  message,
  icon = 'bi-shield-lock',
  actionLabel,
  actionTo,
}: EmptyStateProps) {
  const body = description ?? message ?? 'No data available.'

  return (
    <div className="surface-card cits-empty-state text-center py-5">
      <div className="empty-illustration cits-empty-state__icon mx-auto mb-3">
        <i className={`bi ${icon} fs-2`} />
      </div>
      <h3 className="h4 text-white mb-2">{title}</h3>
      <p className="text-body-secondary mb-4 mx-auto cits-empty-state__body">{body}</p>
      {actionLabel && actionTo ? (
        <Link className="cits-button cits-button--primary" to={actionTo}>
          {actionLabel}
        </Link>
      ) : null}
    </div>
  )
}
