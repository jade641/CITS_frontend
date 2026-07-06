import type { ReactNode } from 'react'

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle: string
  actions?: ReactNode
}) {
  return (
    <div className="cits-header d-flex flex-column flex-lg-row align-items-lg-end justify-content-between gap-3 mb-4">
      <div className="cits-header__copy">
        <p className="cits-kicker mb-2">Cyber Incident Ticketing System</p>
        <h1 className="display-6 fw-semibold mb-2 text-white">{title}</h1>
        <p className="text-body-secondary mb-0">{subtitle}</p>
      </div>
      {actions ? <div className="cits-header__actions d-flex gap-2 flex-wrap">{actions}</div> : null}
    </div>
  )
}