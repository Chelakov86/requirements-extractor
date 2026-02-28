import { useState, useEffect, useRef } from 'react'
import type { OutputLanguage } from '../data/mockData'
import { NEW_SESSION_CONTENT } from '../data/mockData'

export interface LanguageSelectProps {
  readonly value: OutputLanguage
  onChange: (lang: OutputLanguage) => void
}

const { options } = NEW_SESSION_CONTENT.language

export default function LanguageSelect({ value, onChange }: LanguageSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selected = options.find((o) => o.value === value) ?? options[0]

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="w-full h-11 px-3 text-left bg-white border border-border rounded text-slate text-sm flex items-center justify-between focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Ausgabesprache: ${selected.label}`}
      >
        <span className="flex items-center gap-2">
          <span className="text-lg leading-none">{selected.flag}</span>
          <span>{selected.label}</span>
        </span>
        <span className="material-symbols-outlined text-stone text-[20px]">
          {isOpen ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {isOpen && (
        <div
          role="listbox"
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-card z-20 py-1 overflow-hidden"
        >
          {options.map((opt) => {
            const isSelected = opt.value === value
            return (
              <div
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(opt.value)
                  setIsOpen(false)
                }}
                className={`px-3 py-2 flex items-center justify-between cursor-pointer text-sm transition-colors ${
                  isSelected
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-slate hover:bg-smoke'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="text-lg leading-none">{opt.flag}</span>
                  <span>{opt.label}</span>
                </span>
                {isSelected && (
                  <span className="material-symbols-outlined text-[16px]">
                    check
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
