export interface ProjectsEmptyStateProps {
  readonly heading: string
  readonly body: string
  readonly ctaLabel: string
  onCtaClick: () => void
}

export default function ProjectsEmptyState({
  heading,
  body,
  ctaLabel,
  onCtaClick,
}: ProjectsEmptyStateProps) {
  return (
    <div className="bg-white border border-dashed border-border rounded-lg p-12 flex flex-col items-center justify-center text-center gap-6">
      {/* Illustrated stacked-folders icon */}
      <div className="relative w-32 h-32 opacity-90">
        <div className="absolute inset-0 bg-primary/20 rounded-lg transform rotate-6 translate-x-2 translate-y-2" />
        <div className="absolute inset-0 bg-stone/30 rounded-lg transform -rotate-3 -translate-x-1" />
        <div className="absolute inset-0 bg-white rounded-lg border-2 border-primary/30 flex items-center justify-center">
          <span className="material-symbols-outlined text-primary text-[48px]">
            folder_off
          </span>
        </div>
      </div>

      <div className="max-w-md">
        <h3 className="text-xl font-bold text-slate mb-2">{heading}</h3>
        <p className="text-muted mb-6 leading-relaxed">{body}</p>
        <button
          onClick={onCtaClick}
          className="btn-primary px-6 py-2 gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          {ctaLabel}
        </button>
      </div>
    </div>
  )
}
