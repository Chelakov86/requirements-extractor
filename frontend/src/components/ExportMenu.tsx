import { useEffect, useRef, useState } from 'react'
import type { UserStory, NFR, OpenQuestion } from '../data/mockData'
import { useExportSession } from '../hooks/useExport'
import { copyToClipboard } from '../lib/clipboard'

export interface ExportItems {
  userStories: UserStory[]
  nfrs: NFR[]
  openQuestions: OpenQuestion[]
}

function generateMarkdown({ userStories, nfrs, openQuestions }: ExportItems): string {
  const lines: string[] = []

  if (userStories.length > 0) {
    lines.push('## User Stories', '')
    for (const s of userStories) {
      lines.push(`### ${s.title}`, '')
      lines.push(`**Als** ${s.as_who}`)
      lines.push(`**möchte ich** ${s.i_want}`)
      if (s.so_that) lines.push(`**damit** ${s.so_that}`)
      if (s.acceptance_criteria.length > 0) {
        lines.push('', '**Akzeptanzkriterien:**')
        for (const c of s.acceptance_criteria) lines.push(`- ${c}`)
      }
      lines.push('')
    }
  }

  if (nfrs.length > 0) {
    lines.push('## Nicht-funktionale Anforderungen', '')
    for (const n of nfrs) {
      const cat = n.category
        ? n.category.charAt(0).toUpperCase() + n.category.slice(1)
        : ''
      lines.push(`### [${cat}] ${n.title}`, '')
      if (n.description) lines.push(n.description)
      if (n.metric) lines.push(`**Messgröße:** ${n.metric}`)
      lines.push('')
    }
  }

  if (openQuestions.length > 0) {
    lines.push('## Offene Fragen', '')
    for (const q of openQuestions) {
      lines.push(`❓ ${q.question_text}`)
      if (q.owner) lines.push(`*Verantwortlich: ${q.owner}*`)
      lines.push('')
    }
  }

  return lines.join('\n')
}

export interface ExportMenuProps {
  readonly sessionId: string
  readonly items?: ExportItems
}

export default function ExportMenu({ sessionId, items }: ExportMenuProps) {
  const [open, setOpen] = useState(false)
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle')
  const ref = useRef<HTMLDivElement>(null)
  const { downloadExport } = useExportSession(sessionId)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleCopyAll() {
    setOpen(false)
    if (!items) return
    await copyToClipboard(generateMarkdown(items))
    setCopyState('copied')
    setTimeout(() => setCopyState('idle'), 2000)
  }

  async function handleDownload(format: 'json' | 'markdown') {
    setOpen(false)
    await downloadExport(format)
  }

  return (
    <div className="relative" ref={ref} data-testid="export-menu">
      <button
        className="btn-ghost flex items-center gap-2 h-10 px-4"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        data-testid="export-menu-trigger"
      >
        <span className="material-symbols-outlined text-[18px]">ios_share</span>
        <span>{copyState === 'copied' ? 'Kopiert ✓' : 'Exportieren'}</span>
        <span className="material-symbols-outlined text-[16px]">arrow_drop_down</span>
      </button>

      {open && (
        <div
          className="absolute right-0 mt-1 w-56 bg-white rounded-lg border border-border z-50 overflow-hidden"
          style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
          role="menu"
        >
          <button
            className="w-full px-4 py-2.5 text-left text-sm font-semibold text-slate hover:bg-smoke transition-colors flex items-center gap-2"
            onClick={handleCopyAll}
            role="menuitem"
            data-testid="export-copy-all"
          >
            <span className="text-[15px]">📋</span>
            Alle kopieren (Markdown)
          </button>
          <div className="border-t border-border" />
          <button
            className="w-full px-4 py-2.5 text-left text-sm font-medium text-slate hover:bg-smoke transition-colors flex items-center gap-2"
            onClick={() => handleDownload('markdown')}
            role="menuitem"
            data-testid="export-download-markdown"
          >
            <span className="material-symbols-outlined text-[16px] text-muted">description</span>
            <span>⬇ Markdown herunterladen</span>
          </button>
          <button
            className="w-full px-4 py-2.5 text-left text-sm font-medium text-slate hover:bg-smoke transition-colors flex items-center gap-2"
            onClick={() => handleDownload('json')}
            role="menuitem"
            data-testid="export-download-json"
          >
            <span className="material-symbols-outlined text-[16px] text-muted">data_object</span>
            <span>⬇ JSON herunterladen</span>
          </button>
        </div>
      )}
    </div>
  )
}
