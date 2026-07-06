interface MetricBarListProps {
  title: string
  items: Record<string, number>
}

export function MetricBarList({ title, items }: MetricBarListProps) {
  const entries = Object.entries(items)
  const max = Math.max(...entries.map(([, value]) => value), 1)

  return (
    <div className="cits-metric-bars">
      <h3 className="h6 mb-3 text-white">{title}</h3>
      <div className="metric-bars d-flex flex-column gap-3">
        {entries.length === 0 ? (
          <p className="text-body-secondary mb-0">No data available.</p>
        ) : (
          entries.map(([label, value]) => (
            <div key={label} className="cits-metric-bars__row">
              <div className="d-flex justify-content-between small mb-1 cits-metric-bars__meta">
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
              <div className="metric-bar-track">
                <div className="metric-bar-fill" style={{ width: `${(value / max) * 100}%` }} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}