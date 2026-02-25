export default function ExtractionProgress() {
  return (
    <div
      className="flex flex-col items-center justify-center flex-1 min-h-[calc(100vh-60px)] gap-8"
      data-testid="extraction-progress"
    >
      {/* Spinner — primary teal ring */}
      <div className="relative w-14 h-14">
        <div className="absolute inset-0 rounded-full border-[3px] border-border" />
        <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-primary animate-spin" />
      </div>

      {/* Status text */}
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-slate text-lg font-semibold animate-pulse" style={{ letterSpacing: '-0.01em' }}>
          Dokument wird analysiert…
        </p>
        <p className="text-muted text-sm max-w-xs leading-relaxed">
          Die KI extrahiert Anforderungen aus Ihren Dokumenten.
          <br />
          Dies kann bis zu einer Minute dauern.
        </p>
      </div>
    </div>
  )
}
