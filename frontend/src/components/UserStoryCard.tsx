import type { UserStory } from '../data/mockData'
import PriorityBadge from './PriorityBadge'

const CARD_CLASS: Record<string, string> = {
  critical: 'item-card item-card-critical',
  high: 'item-card item-card-high',
  medium: 'item-card item-card-medium',
  low: 'item-card item-card-low',
}

export interface UserStoryCardProps {
  readonly story: UserStory
  readonly onEdit?: (id: string) => void
  readonly onDelete?: (id: string) => void
}

export default function UserStoryCard({
  story,
  onEdit,
  onDelete,
}: UserStoryCardProps) {
  return (
    <div className={`${CARD_CLASS[story.priority]} p-4 flex flex-col gap-3`}>
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3 flex-wrap">
          <PriorityBadge priority={story.priority} />
          <span className="text-xs text-stone font-mono">ID: {story.id}</span>
        </div>
        <div className="flex gap-1 shrink-0">
          <button
            className="p-1 text-stone hover:text-primary rounded hover:bg-gray-50 transition-colors"
            onClick={() => onEdit?.(story.id)}
            aria-label="Bearbeiten"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
          </button>
          <button
            className="p-1 text-stone hover:text-red-600 rounded hover:bg-red-50 transition-colors"
            onClick={() => onDelete?.(story.id)}
            aria-label="Löschen"
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
          </button>
        </div>
      </div>

      {/* Body */}
      <div>
        <h3 className="text-slate text-base font-bold mb-1">{story.title}</h3>
        <p className="text-muted text-sm leading-relaxed">
          Als <strong className="text-slate font-bold">{story.as_who}</strong>{' '}
          möchte ich, dass{' '}
          <strong className="text-slate font-bold">{story.i_want}</strong>
          {story.so_that && (
            <>
              , damit{' '}
              <strong className="text-slate font-bold">{story.so_that}</strong>
            </>
          )}
          .
        </p>
      </div>

      {/* Source snippet */}
      {story.source_snippet && (
        <div className="bg-smoke rounded p-3 border border-border mt-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-stone text-[16px]">
              format_quote
            </span>
            <span className="text-xs font-bold text-muted uppercase tracking-wide">
              Quelle
            </span>
          </div>
          <p className="source-snippet border-l-2 border-border pl-2 leading-relaxed">
            {story.source_snippet}
          </p>
        </div>
      )}

      {/* Footer meta */}
      {(story.acceptance_criteria.length > 0 ||
        story.linked_nfr ||
        story.labels.length > 0) && (
        <div className="flex flex-wrap items-center gap-4 mt-1 border-t border-border pt-3">
          {story.acceptance_criteria.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-[16px]">
                check_circle
              </span>
              <span className="text-xs font-medium text-muted">
                {story.acceptance_criteria.length} Akzeptanzkriterien
              </span>
            </div>
          )}
          {story.linked_nfr && (
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-stone text-[16px]">
                link
              </span>
              <span className="text-xs font-medium text-muted">
                Verknüpft mit {story.linked_nfr}
              </span>
            </div>
          )}
          {story.labels.map((label) => (
            <span key={label} className="label-chip">
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
