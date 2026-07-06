import { formatSlug } from '../services/formatters'

interface StatusBadgeProps {
  status: string
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const colorClass = {
    open: 'text-bg-danger',
    assigned: 'text-bg-warning',
    'in-progress': 'text-bg-info',
    in_progress: 'text-bg-info',
    resolved: 'text-bg-success',
    closed: 'text-bg-secondary',
  }[status] ?? 'text-bg-secondary'

  return <span className={`badge cits-badge cits-badge--status cits-badge--${status} ${colorClass}`}>{formatSlug(status)}</span>
}
