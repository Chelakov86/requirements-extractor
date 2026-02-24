import type { AccentColor } from '../data/mockData'
import { PROJECTS_PAGE_CONTENT } from '../data/mockData'

const ACCENT_CLASSES: Record<AccentColor, string> = {
  critical: 'bg-priority-critical',
  high: 'bg-priority-high',
  medium: 'bg-priority-medium',
  low: 'bg-priority-low',
}

export interface ProjectCardProps {
  readonly id: string
  readonly title: string
  readonly description: string
  readonly sessionCount: number
  readonly lastUpdated: string
  readonly accentColor: AccentColor
  onMenuClick: (id: string) => void
  onClick: (id: string) => void
}

export default function ProjectCard({
  id,
  title,
  description,
  sessionCount,
  lastUpdated,
  accentColor,
  onMenuClick,
  onClick,
}: ProjectCardProps) {
  return (
    <article
      className="group bg-white rounded border border-border shadow hover:shadow-card transition-shadow relative overflow-hidden flex flex-col cursor-pointer"
      onClick={() => onClick(id)}
    >
      {/* Left accent bar */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 ${ACCENT_CLASSES[accentColor]}`}
      />

      {/* Body */}
      <div className="p-5 flex flex-col gap-3 flex-1">
        <div className="flex justify-between items-start gap-2">
          <h4 className="text-base font-bold text-slate group-hover:text-primary transition-colors leading-snug">
            {title}
          </h4>
          <button
            className="shrink-0 text-stone hover:text-muted transition-colors"
            aria-label="Optionen"
            onClick={(e) => {
              e.stopPropagation()
              onMenuClick(id)
            }}
          >
            <span className="material-symbols-outlined text-[20px]">
              more_vert
            </span>
          </button>
        </div>
        <p className="text-sm text-muted leading-relaxed line-clamp-2">
          {description}
        </p>
      </div>

      {/* Footer */}
      <div className="px-5 pb-5 mt-auto">
        <div className="border-t border-border my-3" />
        <div className="flex items-center justify-between">
          <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">
              bar_chart
            </span>
            {PROJECTS_PAGE_CONTENT.sessionCountLabel(sessionCount)}
          </span>
          <span className="text-xs text-stone font-medium">{lastUpdated}</span>
        </div>
      </div>
    </article>
  )
}
