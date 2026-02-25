import { useEffect, useRef, useState } from 'react'
import type { UserStory } from '../data/mockData'
import PriorityBadge from './PriorityBadge'

const CARD_BORDER: Record<string, string> = {
  critical: 'item-card item-card-critical',
  high: 'item-card item-card-high',
  medium: 'item-card item-card-medium',
  low: 'item-card item-card-low',
}

const PRIORITY_OPTIONS: UserStory['priority'][] = ['low', 'medium', 'high', 'critical']
const PRIORITY_LABEL: Record<UserStory['priority'], string> = {
  low: 'Niedrig',
  medium: 'Mittel',
  high: 'Hoch',
  critical: 'Kritisch',
}

export interface UserStoryCardProps {
  readonly story: UserStory
  readonly onUpdate?: (id: string, changes: Partial<UserStory>) => void
  readonly onDelete?: (id: string) => void
  /** @deprecated use onUpdate / onDelete */
  readonly onEdit?: (id: string) => void
}

export default function UserStoryCard({ story, onUpdate, onDelete }: UserStoryCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState<UserStory>({ ...story })
  const [labelInput, setLabelInput] = useState('')
  const cardRef = useRef<HTMLDivElement>(null)

  // Reset draft when entering edit mode
  function handleEditStart() {
    setDraft({ ...story })
    setLabelInput('')
    setIsEditing(true)
  }

  function handleEditDone() {
    // Strip empty criteria
    const cleaned = {
      ...draft,
      acceptance_criteria: draft.acceptance_criteria.filter((c) => c.trim() !== ''),
    }
    onUpdate?.(story.id, cleaned)
    setIsEditing(false)
  }

  function handleEditCancel() {
    setIsEditing(false)
  }

  // Escape to cancel
  useEffect(() => {
    if (!isEditing) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleEditCancel()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isEditing])

  const borderClass = CARD_BORDER[draft.priority] ?? 'item-card'

  // ── Edit Mode ────────────────────────────────────────────────────────────
  if (isEditing) {
    return (
      <div
        ref={cardRef}
        className={`${borderClass} p-4 flex flex-col gap-4`}
        style={{ outline: '2px solid rgba(15,117,109,0.2)', outlineOffset: '-1px' }}
        data-testid="user-story-card-edit"
      >
        {/* Edit header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-muted">Priorität</label>
            <select
              value={draft.priority}
              onChange={(e) =>
                setDraft((d) => ({ ...d, priority: e.target.value as UserStory['priority'] }))
              }
              className="text-xs px-2 py-1 rounded border border-border focus:outline-none"
            >
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABEL[p]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={handleEditCancel}
              className="btn-ghost px-3 py-1 text-xs h-8"
            >
              Abbrechen
            </button>
            <button
              type="button"
              onClick={handleEditDone}
              className="btn-primary px-3 py-1 text-xs h-8 flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">check</span>
              Fertig
            </button>
          </div>
        </div>

        {/* Title */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-muted">Titel</label>
          <input
            type="text"
            value={draft.title}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            className="text-sm px-3 py-2 rounded border border-border"
            placeholder="Titel der User Story"
          />
        </div>

        {/* Als / möchte ich / damit */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-muted">Als (Rolle)</label>
            <input
              type="text"
              value={draft.as_who}
              onChange={(e) => setDraft((d) => ({ ...d, as_who: e.target.value }))}
              className="text-sm px-3 py-2 rounded border border-border"
              placeholder="z.B. Logistikmanager"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-muted">möchte ich, dass …</label>
            <textarea
              value={draft.i_want}
              onChange={(e) => setDraft((d) => ({ ...d, i_want: e.target.value }))}
              rows={2}
              className="text-sm px-3 py-2 rounded border border-border resize-none"
              placeholder="z.B. Rechnungen automatisch generiert werden"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-muted">damit …</label>
            <textarea
              value={draft.so_that}
              onChange={(e) => setDraft((d) => ({ ...d, so_that: e.target.value }))}
              rows={2}
              className="text-sm px-3 py-2 rounded border border-border resize-none"
              placeholder="z.B. der Cashflow optimiert wird"
            />
          </div>
        </div>

        {/* Labels */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-muted">Labels</label>
          <div className="flex flex-wrap gap-1.5 items-center">
            {draft.labels.map((label) => (
              <span
                key={label}
                className="label-chip flex items-center gap-1 pl-2 pr-1"
              >
                {label}
                <button
                  type="button"
                  onClick={() =>
                    setDraft((d) => ({ ...d, labels: d.labels.filter((l) => l !== label) }))
                  }
                  className="hover:text-red-500 transition-colors"
                  aria-label={`Label ${label} entfernen`}
                >
                  <span className="material-symbols-outlined text-[12px]">close</span>
                </button>
              </span>
            ))}
            <input
              type="text"
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && labelInput.trim()) {
                  e.preventDefault()
                  if (!draft.labels.includes(labelInput.trim())) {
                    setDraft((d) => ({ ...d, labels: [...d.labels, labelInput.trim()] }))
                  }
                  setLabelInput('')
                }
              }}
              placeholder="Label + Enter"
              className="text-xs px-2 py-0.5 border border-dashed border-border rounded-full w-28 focus:outline-none focus:border-primary"
              style={{ height: '22px' }}
            />
          </div>
        </div>

        {/* Acceptance criteria */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-muted">Akzeptanzkriterien</label>
          {draft.acceptance_criteria.map((criterion, i) => (
            <div key={i} className="flex items-start gap-2">
              <textarea
                value={criterion}
                onChange={(e) => {
                  const updated = [...draft.acceptance_criteria]
                  updated[i] = e.target.value
                  setDraft((d) => ({ ...d, acceptance_criteria: updated }))
                }}
                rows={2}
                className="flex-1 text-sm px-3 py-2 rounded border border-border resize-none"
                placeholder={`Kriterium ${i + 1}`}
              />
              <button
                type="button"
                onClick={() =>
                  setDraft((d) => ({
                    ...d,
                    acceptance_criteria: d.acceptance_criteria.filter((_, j) => j !== i),
                  }))
                }
                className="mt-1 p-1 text-stone hover:text-red-500 transition-colors"
                aria-label="Kriterium entfernen"
              >
                <span className="material-symbols-outlined text-[18px]">remove_circle_outline</span>
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setDraft((d) => ({ ...d, acceptance_criteria: [...d.acceptance_criteria, ''] }))
            }
            className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline w-fit"
          >
            <span className="material-symbols-outlined text-[14px]">add</span>
            Kriterium hinzufügen
          </button>
        </div>
      </div>
    )
  }

  // ── View Mode ────────────────────────────────────────────────────────────
  return (
    <div
      className={`${CARD_BORDER[story.priority]} p-4 flex flex-col gap-3`}
      data-testid="user-story-card"
    >
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3 flex-wrap">
          <PriorityBadge priority={story.priority} />
          <span className="text-xs text-stone font-mono">ID: {story.id.slice(0, 8)}</span>
        </div>
        <div className="flex gap-1 shrink-0">
          <button
            className="p-1 text-stone hover:text-primary rounded hover:bg-gray-50 transition-colors"
            onClick={handleEditStart}
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
            <span className="material-symbols-outlined text-stone text-[16px]">format_quote</span>
            <span className="text-xs font-bold text-muted uppercase tracking-wide">Quelle</span>
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
              <span className="material-symbols-outlined text-stone text-[16px]">link</span>
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
