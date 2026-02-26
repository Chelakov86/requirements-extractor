import { useEffect, useState } from 'react'
import type { OpenQuestion, QuestionStatus } from '../data/mockData'
import { copyToClipboard } from '../lib/clipboard'

const STATUS_CLASS: Record<QuestionStatus, string> = {
  open: 'bg-amber-50 text-amber-700 border-amber-200',
  answered: 'bg-green-50 text-green-700 border-green-200',
  deferred: 'bg-gray-50 text-gray-500 border-gray-200',
}

const STATUS_LABEL: Record<QuestionStatus, string> = {
  open: 'Offen',
  answered: 'Beantwortet',
  deferred: 'Verschoben',
}

const STATUS_OPTIONS: QuestionStatus[] = ['open', 'answered', 'deferred']

export interface OpenQuestionCardProps {
  readonly question: OpenQuestion
  readonly onUpdate?: (id: string, changes: Partial<OpenQuestion>) => void
  readonly onDelete?: (id: string) => void
  /** @deprecated use onUpdate / onDelete */
  readonly onEdit?: (id: string) => void
}

export default function OpenQuestionCard({ question, onUpdate, onDelete }: OpenQuestionCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState<OpenQuestion>({ ...question })
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    copyToClipboard(`❓ ${question.question_text}`).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleEditStart() {
    setDraft({ ...question })
    setIsEditing(true)
  }

  function handleEditDone() {
    onUpdate?.(question.id, draft)
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

  const statusKey = (question.status as QuestionStatus) in STATUS_CLASS
    ? (question.status as QuestionStatus)
    : 'open'

  // ── Edit Mode ────────────────────────────────────────────────────────────
  if (isEditing) {
    return (
      <div
        className="item-card p-4 flex flex-col gap-4"
        style={{ outline: '2px solid rgba(15,117,109,0.2)', outlineOffset: '-1px' }}
        data-testid="open-question-card-edit"
      >
        {/* Edit header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-muted">Status</label>
            <select
              value={draft.status}
              onChange={(e) =>
                setDraft((d) => ({ ...d, status: e.target.value as QuestionStatus }))
              }
              className="text-xs px-2 py-1 rounded border border-border focus:outline-none"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
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

        {/* Question text */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-muted">Frage</label>
          <textarea
            value={draft.question_text}
            onChange={(e) => setDraft((d) => ({ ...d, question_text: e.target.value }))}
            rows={3}
            className="text-sm px-3 py-2 rounded border border-border resize-none"
            placeholder="Offene Frage"
          />
        </div>

        {/* Owner */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-muted">Verantwortlich (optional)</label>
          <input
            type="text"
            value={draft.owner ?? ''}
            onChange={(e) => setDraft((d) => ({ ...d, owner: e.target.value || null }))}
            className="text-sm px-3 py-2 rounded border border-border"
            placeholder="z.B. Max Müller"
          />
        </div>
      </div>
    )
  }

  // ── View Mode ────────────────────────────────────────────────────────────
  return (
    <div
      className="group item-card p-4 flex flex-col gap-3"
      data-testid="open-question-card"
    >
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3 flex-wrap">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${STATUS_CLASS[statusKey]}`}
          >
            {STATUS_LABEL[statusKey]}
          </span>
          <span className="text-xs text-stone font-mono">ID: {question.id.slice(0, 8)}</span>
        </div>
        <div className="flex gap-1 shrink-0">
          <div className="relative">
            <button
              className="p-1 text-stone hover:text-primary rounded hover:bg-gray-50 transition-colors opacity-0 group-hover:opacity-100"
              onClick={handleCopy}
              aria-label="Kopieren"
              data-testid="question-copy"
            >
              <span className="material-symbols-outlined text-[18px]">
                {copied ? 'check' : 'content_copy'}
              </span>
            </button>
            {copied && (
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-slate text-white text-xs px-2 py-0.5 rounded whitespace-nowrap pointer-events-none">
                ✓ Kopiert!
              </span>
            )}
          </div>
          <button
            className="p-1 text-stone hover:text-primary rounded hover:bg-gray-50 transition-colors"
            onClick={handleEditStart}
            aria-label="Bearbeiten"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
          </button>
          <button
            className="p-1 text-stone hover:text-red-600 rounded hover:bg-red-50 transition-colors"
            onClick={() => onDelete?.(question.id)}
            aria-label="Löschen"
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
          </button>
        </div>
      </div>

      {/* Question */}
      <p className="text-slate text-sm font-semibold leading-relaxed">
        {question.question_text}
      </p>

      {/* Owner */}
      {question.owner && (
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-stone text-[16px]">person</span>
          <span className="text-xs text-muted">Verantwortlich: {question.owner}</span>
        </div>
      )}

      {/* Source snippet */}
      {question.source_snippet && (
        <div className="bg-smoke rounded p-3 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-stone text-[16px]">format_quote</span>
            <span className="text-xs font-bold text-muted uppercase tracking-wide">Quelle</span>
          </div>
          <p className="source-snippet border-l-2 border-border pl-2 leading-relaxed">
            {question.source_snippet}
          </p>
        </div>
      )}
    </div>
  )
}
