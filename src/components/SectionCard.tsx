import type { ReactNode } from 'react'

interface SectionCardProps {
  title: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}

export function SectionCard({ title, subtitle, action, children, className = '' }: SectionCardProps) {
  return (
    <section className={`surface-card cits-panel ${className}`.trim()}>
      <div className="section-card__header d-flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
        <div className="cits-panel__heading">
          <span className="cits-kicker cits-kicker--soft">Security Workspace</span>
          <h2 className="h4 mb-1 text-white">{title}</h2>
          {subtitle ? <p className="text-body-secondary mb-0">{subtitle}</p> : null}
        </div>
        {action ? <div className="cits-panel__action">{action}</div> : null}
      </div>
      {children}
    </section>
  )
}