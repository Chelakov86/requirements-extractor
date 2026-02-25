import { useNavigate, useParams } from 'react-router-dom'
import { useProject, useProjectSessions, type SessionSummary } from '../hooks/useProjects'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  completed:  { label: 'Abgeschlossen', className: 'badge-completed' },
  processing: { label: 'Verarbeitung',  className: 'badge-processing' },
  pending:    { label: 'Ausstehend',    className: 'badge-pending' },
  failed:     { label: 'Fehlgeschlagen', className: 'badge-failed' },
} as const

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// ─── Session row ─────────────────────────────────────────────────────────────

function SessionRow({ session }: { session: SessionSummary }) {
  const navigate = useNavigate()
  const title = session.title || `Session vom ${formatDate(session.created_at)}`
  const status = STATUS_CONFIG[session.status] ?? STATUS_CONFIG.pending

  const storiesLabel =
    session.user_story_count === 1 ? '1 User Story' : `${session.user_story_count} User Stories`
  const questionsLabel =
    session.open_question_count === 1 ? '1 Frage' : `${session.open_question_count} Fragen`

  return (
    <div
      className="flex items-center gap-4 px-5 py-4 bg-white rounded border border-border hover:border-interactive transition-colors cursor-pointer group"
      onClick={() => navigate(`/sessions/${session.id}`)}
      data-testid="session-row"
    >
      {/* Left: title + counts */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate group-hover:text-primary transition-colors truncate">
          {title}
        </p>
        <p className="text-xs text-stone mt-0.5">
          {storiesLabel} · {session.nfr_count} NFRs · {questionsLabel}
        </p>
      </div>

      {/* Right: status badge + date + chevron */}
      <div className="flex items-center gap-3 shrink-0">
        <span className={`badge ${status.className}`}>{status.label}</span>
        <span className="text-xs text-stone hidden sm:inline">{formatDate(session.created_at)}</span>
        <span className="material-symbols-outlined text-stone group-hover:text-primary transition-colors text-[18px]">
          chevron_right
        </span>
      </div>
    </div>
  )
}

// ─── Skeletons ───────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-5 py-4 bg-white rounded border border-border animate-pulse">
      <div className="flex-1">
        <div className="h-4 bg-stone/20 rounded w-2/3" />
        <div className="h-3 bg-stone/10 rounded w-1/2 mt-2" />
      </div>
      <div className="h-5 bg-stone/15 rounded-full w-24" />
    </div>
  )
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyState({ onNewClick }: { onNewClick: () => void }) {
  return (
    <div className="flex flex-col items-center py-16 gap-3 bg-white rounded border border-border">
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
        <span className="material-symbols-outlined text-primary text-[24px]">science</span>
      </div>
      <p className="text-sm font-semibold text-slate">Noch keine Anforderungserfassungen</p>
      <p className="text-xs text-muted text-center max-w-[280px] leading-relaxed">
        Starte eine neue Anforderungserfassung, um Anforderungen aus Dokumenten zu gewinnen.
      </p>
      <button onClick={onNewClick} className="btn-ghost h-8 px-4 text-sm mt-1">
        Jetzt starten
      </button>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()

  const { data: project, isLoading: projectLoading } = useProject(projectId!)
  const { data: sessions = [], isLoading: sessionsLoading } = useProjectSessions(projectId!)

  const isLoading = projectLoading || sessionsLoading

  return (
    <div className="flex flex-col flex-1" data-testid="project-detail-page">
      {/* Page header */}
      <header className="bg-white border-b border-border px-6 py-5 shrink-0">
        <div className="max-w-[1200px] mx-auto w-full flex flex-col gap-2">
          {/* Back link */}
          <button
            onClick={() => navigate('/projects')}
            className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-primary transition-colors w-fit"
            data-testid="back-to-projects"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Alle Projekte
          </button>

          {/* Project name */}
          {projectLoading ? (
            <div className="h-7 w-56 bg-stone/20 rounded animate-pulse" />
          ) : (
            <h2
              className="text-[26px] font-bold text-slate"
              style={{ letterSpacing: '-0.01em' }}
            >
              {project?.name}
            </h2>
          )}

          {/* Description */}
          {!projectLoading && project?.description && (
            <p className="text-sm text-muted">{project.description}</p>
          )}
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 px-6 py-8" style={{ backgroundColor: 'var(--color-canvas)' }}>
        <div className="max-w-[1200px] mx-auto w-full">
          {/* Section header */}
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-semibold text-slate">Anforderungserfassungen</h3>
            <button
              onClick={() => navigate(`/projects/${projectId}/sessions/new`)}
              className="btn-primary h-9 px-4 gap-2 text-sm"
              data-testid="new-session-btn"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Neue Anforderungserfassung
            </button>
          </div>

          {/* Sessions list */}
          <div className="flex flex-col gap-2" data-testid="sessions-list">
            {isLoading ? (
              <>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </>
            ) : sessions.length === 0 ? (
              <EmptyState onNewClick={() => navigate(`/projects/${projectId}/sessions/new`)} />
            ) : (
              sessions.map((session) => (
                <SessionRow key={session.id} session={session} />
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
