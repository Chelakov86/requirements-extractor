import ExportMenu from './ExportMenu'

export type SessionTab = 'user-stories' | 'nfrs' | 'open-questions'

export interface SessionHeaderProps {
  readonly projectName: string
  readonly sessionName: string
  readonly sessionId: string
  readonly counts: { userStories: number; nfrs: number; openQuestions: number }
  readonly activeTab: SessionTab
  readonly onTabChange: (tab: SessionTab) => void
  readonly onSave?: () => void
  readonly onExport?: (format: 'json' | 'markdown') => void
}

export default function SessionHeader({
  projectName,
  sessionName,
  sessionId,
  counts,
  activeTab,
  onTabChange,
  onSave,
  onExport,
}: SessionHeaderProps) {
  return (
    <header className="bg-white border-b border-border py-5 px-6 md:px-10 lg:px-20 sticky top-0 z-10">
      <div className="max-w-[1100px] mx-auto flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <a
            href="#"
            className="text-muted hover:text-primary text-sm font-semibold flex items-center gap-1 transition-colors w-fit"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            {projectName}
          </a>
          <h2 className="text-slate text-2xl font-bold">{sessionName}</h2>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <ExportMenu sessionId={sessionId} onExport={onExport} />
          <button
            className="btn-primary flex items-center gap-2 h-10 px-5"
            onClick={onSave}
          >
            <span className="material-symbols-outlined text-[18px]">save</span>
            <span>Speichern</span>
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="mt-6 max-w-[1100px] mx-auto tab-bar">
        <button
          className={`tab ${activeTab === 'user-stories' ? 'tab-active' : ''}`}
          onClick={() => onTabChange('user-stories')}
        >
          User Stories ({counts.userStories})
        </button>
        <button
          className={`tab ${activeTab === 'nfrs' ? 'tab-active' : ''}`}
          onClick={() => onTabChange('nfrs')}
        >
          NFRs ({counts.nfrs})
        </button>
        <button
          className={`tab ${activeTab === 'open-questions' ? 'tab-active' : ''}`}
          onClick={() => onTabChange('open-questions')}
        >
          Offene Fragen ({counts.openQuestions})
        </button>
      </div>
    </header>
  )
}
