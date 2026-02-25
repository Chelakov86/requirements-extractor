interface UndoToastProps {
  readonly message: string
  readonly onUndo: () => void
  readonly onDismiss: () => void
}

export default function UndoToast({ message, onUndo, onDismiss }: UndoToastProps) {
  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 min-w-[340px] rounded-lg overflow-hidden"
      style={{ backgroundColor: '#1a2332', boxShadow: '0 4px 20px rgba(0,0,0,0.28)' }}
      data-testid="undo-toast"
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <span
          className="material-symbols-outlined text-[18px] shrink-0"
          style={{ color: '#9ca3af' }}
        >
          delete_sweep
        </span>
        <span className="text-white text-sm flex-1 font-medium">{message}</span>
        <button
          onClick={onUndo}
          className="text-sm font-bold shrink-0 hover:underline transition-opacity"
          style={{ color: '#52b7ae' }}
          data-testid="undo-button"
        >
          Rückgängig
        </button>
        <button
          onClick={onDismiss}
          className="transition-colors ml-1 shrink-0 hover:text-white"
          aria-label="Schließen"
          style={{ color: '#9ca3af' }}
        >
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>
      </div>
      {/* 5-second countdown bar */}
      <div style={{ height: '3px', backgroundColor: 'rgba(255,255,255,0.08)' }}>
        <div
          className="h-full toast-countdown-bar"
          style={{ backgroundColor: '#52b7ae' }}
        />
      </div>
    </div>
  )
}
