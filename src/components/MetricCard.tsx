export function MetricCard({
  label,
  value,
  icon,
  accent = 'warning',
}: {
  label: string
  value: number | string
  icon: string
  accent?: 'warning' | 'danger' | 'success' | 'info'
}) {
  return (
    <div className="col-sm-6 col-xl-3">
      <div className="cits-surface h-100 p-4">
        <div className="d-flex align-items-start justify-content-between gap-3">
          <div>
            <p className="text-secondary text-uppercase small fw-semibold mb-2">{label}</p>
            <p className="display-6 fw-bold mb-0">{value}</p>
          </div>
          <div className={`cits-icon-badge text-bg-${accent}`}>
            <i className={`bi ${icon}`} />
          </div>
        </div>
      </div>
    </div>
  )
}