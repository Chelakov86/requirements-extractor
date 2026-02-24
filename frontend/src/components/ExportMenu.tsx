import { useState, useRef, useEffect } from 'react'

export interface ExportMenuProps {
  readonly sessionId: string
  readonly onExport?: (format: 'json' | 'markdown') => void
}

export default function ExportMenu({ sessionId: _sessionId, onExport }: ExportMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleExport(format: 'json' | 'markdown') {
    setOpen(false)
    onExport?.(format)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        className="btn-ghost flex items-center gap-2 h-10 px-4"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="material-symbols-outlined text-[18px]">ios_share</span>
        <span>Exportieren</span>
        <span className="material-symbols-outlined text-[16px]">arrow_drop_down</span>
      </button>

      {open && (
        <div
          className="absolute right-0 mt-1 w-52 bg-white rounded-lg border border-border shadow-card z-50 overflow-hidden"
          role="menu"
        >
          <button
            className="w-full px-4 py-2.5 text-left text-sm font-medium text-muted hover:text-slate hover:bg-smoke transition-colors flex items-center gap-2"
            onClick={() => handleExport('json')}
            role="menuitem"
          >
            <span className="material-symbols-outlined text-[16px]">data_object</span>
            JSON herunterladen
          </button>
          <div className="border-t border-border" />
          <button
            className="w-full px-4 py-2.5 text-left text-sm font-medium text-muted hover:text-slate hover:bg-smoke transition-colors flex items-center gap-2"
            onClick={() => handleExport('markdown')}
            role="menuitem"
          >
            <span className="material-symbols-outlined text-[16px]">description</span>
            Markdown herunterladen
          </button>
        </div>
      )}
    </div>
  )
}
