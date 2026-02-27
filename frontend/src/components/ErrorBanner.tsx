interface ErrorBannerProps {
  message: string
  onRetry?: () => void
  onDismiss?: () => void
}

export default function ErrorBanner({ message, onRetry, onDismiss }: ErrorBannerProps) {
  return (
    <div
      role="alert"
      data-testid="error-banner"
      className="flex items-start gap-3 px-4 py-3 rounded text-sm"
      style={{
        background: 'rgba(220,38,38,0.07)',
        border: '1px solid rgba(220,38,38,0.22)',
        color: 'var(--color-priority-critical)',
      }}
    >
      <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">error</span>
      <span className="flex-1">{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="shrink-0 text-xs font-semibold underline hover:no-underline transition-all"
        >
          Erneut versuchen
        </button>
      )}
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="shrink-0 hover:opacity-70 transition-opacity"
          aria-label="Schließen"
        >
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>
      )}
    </div>
  )
}
