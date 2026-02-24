import type { OpenQuestion, QuestionStatus } from '../data/mockData'

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

export interface OpenQuestionCardProps {
  readonly question: OpenQuestion
  readonly onEdit?: (id: string) => void
  readonly onDelete?: (id: string) => void
}

export default function OpenQuestionCard({
  question,
  onEdit,
  onDelete,
}: OpenQuestionCardProps) {
  return (
    <div className="item-card p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3 flex-wrap">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${STATUS_CLASS[question.status]}`}
          >
            {STATUS_LABEL[question.status]}
          </span>
          <span className="text-xs text-stone font-mono">ID: {question.id}</span>
        </div>
        <div className="flex gap-1 shrink-0">
          <button
            className="p-1 text-stone hover:text-primary rounded hover:bg-gray-50 transition-colors"
            onClick={() => onEdit?.(question.id)}
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
          <span className="material-symbols-outlined text-stone text-[16px]">
            person
          </span>
          <span className="text-xs text-muted">
            Verantwortlich: {question.owner}
          </span>
        </div>
      )}

      {/* Source snippet */}
      {question.source_snippet && (
        <div className="bg-smoke rounded p-3 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-stone text-[16px]">
              format_quote
            </span>
            <span className="text-xs font-bold text-muted uppercase tracking-wide">
              Quelle
            </span>
          </div>
          <p className="source-snippet border-l-2 border-border pl-2 leading-relaxed">
            {question.source_snippet}
          </p>
        </div>
      )}
    </div>
  )
}
