import { Link } from 'react-router-dom'

import type { Incident } from '../interfaces'
import { formatDateTime, truncateText } from '../services/formatters'
import { EmptyState } from './EmptyState'
import { SeverityBadge } from './SeverityBadge'
import { StatusBadge } from './StatusBadge'

interface IncidentTableProps {
  incidents: Incident[]
  emptyMessage: string
  showReporter?: boolean
  showAssignee?: boolean
}

export function IncidentTable({
  incidents,
  emptyMessage,
  showReporter = true,
  showAssignee = true,
}: IncidentTableProps) {
  if (incidents.length === 0) {
    return (
      <EmptyState
        title="No incidents found"
        description={emptyMessage}
        icon="bi-shield-exclamation"
      />
    )
  }

  return (
    <div className="table-responsive cits-table-wrap">
      <table className="table table-hover align-middle ticket-table mb-0">
        <thead>
          <tr>
            <th>Ticket</th>
            <th>Title</th>
            <th>Severity</th>
            <th>Status</th>
            <th>Category</th>
            {showReporter ? <th>Reporter</th> : null}
            {showAssignee ? <th>Assignee</th> : null}
            <th>Reported</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {incidents.map((incident) => (
            <tr key={incident.id}>
              <td>
                <strong>{incident.ticket_number}</strong>
              </td>
              <td>
                <div>{incident.title}</div>
                <div className="small text-body-secondary">{truncateText(incident.description, 72)}</div>
              </td>
              <td>
                <SeverityBadge severity={incident.severity} />
              </td>
              <td>
                <StatusBadge status={incident.status?.slug ?? 'open'} />
              </td>
              <td>{incident.category?.name ?? 'N/A'}</td>
              {showReporter ? <td>{incident.reporter?.email ?? 'N/A'}</td> : null}
              {showAssignee ? <td>{incident.current_assignee?.email ?? 'Unassigned'}</td> : null}
              <td>{formatDateTime(incident.reported_at)}</td>
              <td className="text-end">
                <Link className="cits-button cits-button--table" to={`/tickets/${incident.id}`}>
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
