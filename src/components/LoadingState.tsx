interface LoadingStateProps {
  message?: string
  label?: string
}

export function LoadingState({ message, label }: LoadingStateProps) {
  const text = message ?? (label ? `${label}...` : 'Loading data...')

  return (
    <div className="surface-card cits-loading-state d-flex min-vh-25 align-items-center justify-content-center text-center">
      <div>
        <div className="cits-loading-state__orb mb-3 mx-auto" role="status" aria-label="Loading" />
        <p className="mb-0 text-body-secondary">{text}</p>
      </div>
    </div>
  )
}
