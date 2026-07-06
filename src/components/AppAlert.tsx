export interface AppAlert {
  message: string
  type: 'success' | 'danger' | 'warning' | 'info'
}

export function AppAlertBanner({
  alert,
  onClose,
}: {
  alert: AppAlert | null
  onClose: () => void
}) {
  if (!alert) {
    return null
  }

  return (
    <div className={`cits-alert cits-alert--${alert.type} alert-dismissible fade show mb-4`} role="alert">
      <div className="cits-alert__dot" aria-hidden="true" />
      <div className="cits-alert__message">{alert.message}</div>
      <button type="button" className="btn-close btn-close-white" aria-label="Close" onClick={onClose} />
    </div>
  )
}