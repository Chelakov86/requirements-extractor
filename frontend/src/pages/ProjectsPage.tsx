import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useProjects,
  useCreateProject,
  useDeleteProject,
  type Project,
} from '../hooks/useProjects'
import ErrorBanner from '../components/ErrorBanner'
import { getApiErrorMessage } from '../lib/api'

// ─── Skeleton card ──────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="project-card flex flex-col animate-pulse" data-testid="skeleton-card">
      <div className="p-5 flex flex-col gap-3">
        <div className="flex justify-between items-start gap-2">
          <div className="h-4 bg-stone/20 rounded w-3/4" />
          <div className="w-5 h-5 bg-stone/20 rounded" />
        </div>
        <div className="h-3 bg-stone/10 rounded w-full" />
        <div className="h-3 bg-stone/10 rounded w-2/3" />
      </div>
      <div className="px-5 pb-5">
        <div className="border-t border-border my-3" />
        <div className="flex items-center justify-between">
          <div className="h-5 bg-stone/15 rounded w-20" />
          <div className="h-4 bg-stone/10 rounded w-16" />
        </div>
      </div>
    </div>
  )
}

// ─── Project card with inline delete confirmation ───────────────────────────

function ProjectCardItem({
  project,
  onDelete,
}: {
  project: Project
  onDelete: () => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const navigate = useNavigate()

  const date = new Date(project.created_at).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  return (
    <article
      className="project-card relative overflow-hidden flex flex-col cursor-pointer group"
      onClick={() => !confirmDelete && navigate(`/projects/${project.id}`)}
      data-testid="project-card"
    >
      {/* Body */}
      <div className="p-5 flex flex-col gap-3 flex-1">
        <div className="flex justify-between items-start gap-2">
          <h4 className="text-base font-semibold text-slate group-hover:text-primary transition-colors leading-snug">
            {project.name}
          </h4>
          <button
            className="shrink-0 text-stone hover:text-priority-critical transition-colors opacity-0 group-hover:opacity-100"
            aria-label="Projekt löschen"
            onClick={(e) => {
              e.stopPropagation()
              setConfirmDelete(true)
            }}
            data-testid="delete-project-btn"
          >
            <span className="material-symbols-outlined text-[20px]">delete</span>
          </button>
        </div>
        {project.description && (
          <p className="text-sm text-muted leading-relaxed line-clamp-2">
            {project.description}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 pb-5 mt-auto">
        <div className="border-t border-border my-3" />
        <div className="flex items-center justify-between">
          <span className="bg-primary/10 text-primary text-xs font-semibold px-2 py-1 rounded flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">bar_chart</span>
            {project.session_count === 1 ? '1 Analyse' : `${project.session_count} Analysen`}
          </span>
          <span className="text-xs text-stone">{date}</span>
        </div>
      </div>

      {/* Inline delete confirmation overlay */}
      {confirmDelete && (
        <div
          className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center gap-3 p-5"
          onClick={(e) => e.stopPropagation()}
          data-testid="delete-confirm"
        >
          <p className="text-sm font-semibold text-slate text-center">Projekt löschen?</p>
          <p className="text-xs text-muted text-center leading-relaxed">
            Alle Sessions und Daten werden unwiderruflich gelöscht.
          </p>
          <div className="flex gap-2 mt-1">
            <button
              className="btn-ghost h-8 px-4 text-xs"
              onClick={() => setConfirmDelete(false)}
              data-testid="delete-cancel-btn"
            >
              Abbrechen
            </button>
            <button
              className="btn-destructive h-8 px-4 text-xs"
              onClick={onDelete}
              data-testid="delete-confirm-btn"
            >
              Bestätigen
            </button>
          </div>
        </div>
      )}
    </article>
  )
}

// ─── Create project modal ───────────────────────────────────────────────────

function CreateProjectModal({
  onClose,
  onCreate,
  isPending,
}: {
  onClose: () => void
  onCreate: (name: string, description: string) => Promise<void>
  isPending: boolean
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [nameError, setNameError] = useState('')
  const [createError, setCreateError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setNameError('Projektname ist erforderlich')
      return
    }
    setCreateError(null)
    try {
      await onCreate(name.trim(), description.trim())
    } catch (err) {
      setCreateError(getApiErrorMessage(err))
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate/40 z-40"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
        <div className="bg-white rounded-lg w-full max-w-[480px] border border-border shadow">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="text-base font-semibold text-slate">Neues Projekt</h2>
            <button
              onClick={onClose}
              className="text-stone hover:text-muted transition-colors"
              aria-label="Schließen"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={(e) => void handleSubmit(e)} className="p-6 flex flex-col gap-4">
            {createError && (
              <ErrorBanner message={createError} onDismiss={() => setCreateError(null)} />
            )}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate" htmlFor="project-name">
                Projektname <span className="text-priority-critical">*</span>
              </label>
              <input
                id="project-name"
                name="projectName"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (nameError) setNameError('')
                }}
                placeholder="z.B. ERP-Migration 2025"
                className="h-10 px-3 rounded border text-sm w-full"
                style={nameError ? { borderColor: 'var(--color-priority-critical)' } : undefined}
                autoFocus
                data-testid="project-name-input"
              />
              {nameError && (
                <p className="text-xs" style={{ color: 'var(--color-priority-critical)' }}>
                  {nameError}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate" htmlFor="project-description">
                Beschreibung{' '}
                <span className="text-stone font-normal">(optional)</span>
              </label>
              <textarea
                id="project-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Kurze Beschreibung des Projekts…"
                rows={3}
                className="px-3 py-2 rounded border text-sm resize-none w-full"
                data-testid="project-description-input"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn-ghost h-9 px-4 text-sm">
                Abbrechen
              </button>
              <button
                type="submit"
                className="btn-primary h-9 px-5 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={isPending}
                data-testid="create-project-submit"
              >
                {isPending ? (
                  <span className="material-symbols-outlined animate-spin text-[16px]">
                    progress_activity
                  </span>
                ) : (
                  'Projekt erstellen'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div
      className="flex flex-col items-center py-24 gap-4"
      data-testid="projects-empty-state"
    >
      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
        <span className="material-symbols-outlined text-primary text-[28px]">folder_open</span>
      </div>
      <div className="text-center">
        <p className="text-base font-semibold text-slate">Noch keine Projekte</p>
        <p className="text-sm text-muted mt-1">
          Erstelle dein erstes Projekt, um mit der Anforderungsanalyse zu beginnen.
        </p>
      </div>
      <button
        onClick={onCreateClick}
        className="btn-primary mt-2 h-10 px-6 text-sm gap-2"
        data-testid="create-first-project-btn"
      >
        <span className="material-symbols-outlined text-[18px]">add</span>
        Erstes Projekt erstellen
      </button>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ProjectsPage() {
  const [showModal, setShowModal] = useState(false)
  const { data: projects = [], isLoading, isError, refetch } = useProjects()
  const createProject = useCreateProject()
  const deleteProject = useDeleteProject()

  async function handleCreate(name: string, description: string) {
    await createProject.mutateAsync({ name, description: description || undefined })
    setShowModal(false)
  }

  return (
    <div className="flex flex-col flex-1" data-testid="projects-page">
      {/* Page header */}
      <header className="bg-white border-b border-border px-6 py-5 shrink-0">
        <div className="max-w-[1200px] mx-auto w-full flex items-center justify-between gap-4">
          <h2 className="text-[26px] font-bold text-slate" style={{ letterSpacing: '-0.01em' }}>
            Meine Projekte
          </h2>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary h-10 px-5 gap-2 text-sm"
            data-testid="new-project-btn"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Neues Projekt
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 px-6 py-10" style={{ backgroundColor: 'var(--color-canvas)' }}>
        <div className="max-w-[1200px] mx-auto w-full flex flex-col gap-6">
          {isError && (
            <ErrorBanner
              message="Projekte konnten nicht geladen werden."
              onRetry={() => void refetch()}
            />
          )}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : isError ? null : projects.length === 0 ? (
            <EmptyState onCreateClick={() => setShowModal(true)} />
          ) : (
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              data-testid="projects-grid"
            >
              {projects.map((project) => (
                <ProjectCardItem
                  key={project.id}
                  project={project}
                  onDelete={() => deleteProject.mutate(project.id)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create project modal */}
      {showModal && (
        <CreateProjectModal
          onClose={() => setShowModal(false)}
          onCreate={handleCreate}
          isPending={createProject.isPending}
        />
      )}
    </div>
  )
}
