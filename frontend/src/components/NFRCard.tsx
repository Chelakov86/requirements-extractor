import type { NFR, NFRCategory } from '../data/mockData'
import PriorityBadge from './PriorityBadge'

const CARD_CLASS: Record<string, string> = {
  critical: 'item-card item-card-critical',
  high: 'item-card item-card-high',
  medium: 'item-card item-card-medium',
  low: 'item-card item-card-low',
}

const CATEGORY_CLASS: Record<NFRCategory, string> = {
  Performance: 'bg-blue-50 text-blue-700 border-blue-200',
  Security: 'bg-red-50 text-red-700 border-red-200',
  Usability: 'bg-purple-50 text-purple-700 border-purple-200',
  Reliability: 'bg-green-50 text-green-700 border-green-200',
  Maintainability: 'bg-gray-50 text-gray-600 border-gray-200',
  Compliance: 'bg-yellow-50 text-yellow-700 border-yellow-200',
}

export interface NFRCardProps {
  readonly nfr: NFR
  readonly onEdit?: (id: string) => void
  readonly onDelete?: (id: string) => void
}

export default function NFRCard({ nfr, onEdit, onDelete }: NFRCardProps) {
  return (
    <div className={`${CARD_CLASS[nfr.priority]} p-4 flex flex-col gap-3`}>
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3 flex-wrap">
          <PriorityBadge priority={nfr.priority} />
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${CATEGORY_CLASS[nfr.category]}`}
          >
            {nfr.category}
          </span>
          <span className="text-xs text-stone font-mono">ID: {nfr.id}</span>
        </div>
        <div className="flex gap-1 shrink-0">
          <button
            className="p-1 text-stone hover:text-primary rounded hover:bg-gray-50 transition-colors"
            onClick={() => onEdit?.(nfr.id)}
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
            <span className="material-symbols-outlined text-primary text-[14px]">
              speed
            </span>
            <span className="text-xs font-mono text-muted">{nfr.metric}</span>
          </div>
        )}
      </div>

      {/* Source snippet */}
      {nfr.source_snippet && (
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
            {nfr.source_snippet}
          </p>
        </div>
      )}
    </div>
  )
}
