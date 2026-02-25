import { useNavigate } from 'react-router-dom'

interface ExtractionErrorProps {
  readonly message: string | null
}

export default function ExtractionError({ message }: ExtractionErrorProps) {
  const navigate = useNavigate()

  return (
    <div
      className="flex flex-col items-center justify-center flex-1 min-h-[calc(100vh-60px)] gap-6 text-center"
      data-testid="extraction-error"
    >
      {/* Error icon */}
      <div className="w-12 h-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center">
        <span className="material-symbols-outlined text-[24px]" style={{ color: 'var(--color-priority-critical)' }}>
          error_outline
        </span>
      </div>

      {/* Heading + message */}
      <div className="flex flex-col items-center gap-2">
        <h2 className="text-slate text-xl font-bold" style={{ letterSpacing: '-0.01em' }}>
          Extraktion fehlgeschlagen
        </h2>
        {message && (
          <p className="text-muted text-sm max-w-sm leading-relaxed">{message}</p>
        )}
      </div>

      <button className="btn-primary px-6 py-2.5" onClick={() => navigate(-1)}>
        Erneut versuchen
      </button>
    </div>
  )
}
