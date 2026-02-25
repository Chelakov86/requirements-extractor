import { useEffect, useState } from 'react'
import type { NFR } from '../data/mockData'
import PriorityBadge from './PriorityBadge'

const CARD_BORDER: Record<string, string> = {
  critical: 'item-card item-card-critical',
  high: 'item-card item-card-high',
  medium: 'item-card item-card-medium',
  low: 'item-card item-card-low',
}

// Keyed on lowercase — API returns lowercase categories
const CATEGORY_CLASS: Record<string, string> = {
  performance: 'bg-blue-50 text-blue-700 border-blue-200',
  security: 'bg-red-50 text-red-700 border-red-200',
  usability: 'bg-purple-50 text-purple-700 border-purple-200',
  reliability: 'bg-green-50 text-green-700 border-green-200',
  maintainability: 'bg-gray-50 text-gray-600 border-gray-200',
  compliance: 'bg-yellow-50 text-yellow-700 border-yellow-200',
}

const CATEGORY_OPTIONS = [
  'performance',
  'security',
  'usability',
  'reliability',
  'maintainability',
  'compliance',
] as const

const PRIORITY_OPTIONS: NFR['priority'][] = ['low', 'medium', 'high', 'critical']
const PRIORITY_LABEL: Record<NFR['priority'], string> = {
  low: 'Niedrig',
  medium: 'Mittel',
  high: 'Hoch',
  critical: 'Kritisch',
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export interface NFRCardProps {
  readonly nfr: NFR
  readonly onUpdate?: (id: string, changes: Partial<NFR>) => void
  readonly onDelete?: (id: string) => void
  /** @deprecated use onUpdate / onDelete */
  readonly onEdit?: (id: string) => void
}

export default function NFRCard({ nfr, onUpdate, onDelete }: NFRCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState<NFR>({ ...nfr })

  function handleEditStart() {
    setDraft({ ...nfr })
    setIsEditing(true)
  }

  function handleEditDone() {
    onUpdate?.(nfr.id, draft)
    setIsEditing(false)
  }

  function handleEditCancel() {
    setIsEditing(false)
  }

  useEffect(() => {
    if (!isEditing) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleEditCancel()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isEditing])

  const normalizedCategory = (nfr.category || '').toLowerCase()

  // ── Edit Mode ────────────────────────────────────────────────────────────
  if (isEditing) {
    return (
      <div
        className={`${CARD_BORDER[draft.priority] ?? 'item-card'} p-4 flex flex-col gap-4`}
        style={{ outline: '2px solid rgba(15,117,109,0.2)', outlineOffset: '-1px' }}
        data-testid="nfr-card-edit"
      >
        {/* Edit header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-muted">Kategorie</label>
              <select
                value={(draft.category || '').toLowerCase()}
                onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value as NFR['category'] }))}
                className="text-xs px-2 py-1 rounded border border-border focus:outline-none"
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {capitalize(c)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-muted">Priorität</label>
              <select
                value={draft.priority}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, priority: e.target.value as NFR['priority'] }))
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
          </div>
          <div className="flex gap-2 shrink-0">
            <button type="button" onClick={handleEditCancel} className="btn-ghost px-3 py-1 text-xs h-8">
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
            placeholder="NFR-Titel"
          />
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-muted">Beschreibung</label>
          <textarea
            value={draft.description ?? ''}
            onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
            rows={3}
            className="text-sm px-3 py-2 rounded border border-border resize-none"
            placeholder="Beschreibung der nicht-funktionalen Anforderung"
          />
        </div>

        {/* Metric */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-muted">Messgröße (optional)</label>
          <input
            type="text"
            value={draft.metric ?? ''}
            onChange={(e) => setDraft((d) => ({ ...d, metric: e.target.value || null }))}
            className="text-sm px-3 py-2 rounded border border-border font-mono"
            placeholder="z.B. P95 < 200ms"
          />
        </div>
      </div>
    )
  }

  // ── View Mode ────────────────────────────────────────────────────────────
  return (
    <div
      className={`${CARD_BORDER[nfr.priority]} p-4 flex flex-col gap-3`}
      data-testid="nfr-card"
    >
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3 flex-wrap">
          <PriorityBadge priority={nfr.priority} />
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${CATEGORY_CLASS[normalizedCategory] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}
          >
            {capitalize(normalizedCategory)}
          </span>
          <span className="text-xs text-stone font-mono">ID: {nfr.id.slice(0, 8)}</span>
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
            onClick={() => onDelete?.(nfr.id)}
            aria-label="Löschen"
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
          </button>
        </div>
      </div>

      {/* Body */}
      <div>
        <h3 className="text-slate text-base font-bold mb-1">{nfr.title}</h3>
        <p className="text-muted text-sm leading-relaxed">{nfr.description}</p>
        {nfr.metric && (
          <div className="mt-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[14px]">speed</span>
            <span className="text-xs font-mono text-muted">{nfr.metric}</span>
          </div>
        )}
      </div>

      {/* Source snippet */}
      {nfr.source_snippet && (
        <div className="bg-smoke rounded p-3 border border-border mt-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-stone text-[16px]">format_quote</span>
            <span className="text-xs font-bold text-muted uppercase tracking-wide">Quelle</span>
          </div>
          <p className="source-snippet border-l-2 border-border pl-2 leading-relaxed">
            {nfr.source_snippet}
          </p>
        </div>
      )}
    </div>
  )
}
