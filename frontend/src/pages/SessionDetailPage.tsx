import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import SessionHeader, { type SaveState, type SessionTab } from '../components/SessionHeader'
import UserStoryCard from '../components/UserStoryCard'
import NFRCard from '../components/NFRCard'
import OpenQuestionCard from '../components/OpenQuestionCard'
import ExtractionProgress from '../components/ExtractionProgress'
import ExtractionError from '../components/ExtractionError'
import UndoToast from '../components/UndoToast'
import { useSessionStatus } from '../hooks/useSessionStatus'
import { useSession } from '../hooks/useSession'
import { useProject } from '../hooks/useProjects'
import { useUpdateItem } from '../hooks/useUpdateItem'
import type { UserStory, NFR, OpenQuestion } from '../data/mockData'

const PAGE_SIZE = 10

interface LocalItems {
  userStories: UserStory[]
  nfrs: NFR[]
  openQuestions: OpenQuestion[]
}

interface PendingDelete {
  id: string
  type: 'user-stories' | 'nfrs' | 'questions'
  item: UserStory | NFR | OpenQuestion
  timerId: ReturnType<typeof setTimeout>
}

// Compute which fields changed between server snapshot and local version
function pickChanged<T extends object>(
  server: T,
  local: T,
  fields: (keyof T)[],
): Partial<T> {
  const changes: Partial<T> = {}
  for (const field of fields) {
    if (JSON.stringify(server[field]) !== JSON.stringify(local[field])) {
      changes[field] = local[field]
    }
  }
  return changes
}

// ── Add-item form components ──────────────────────────────────────────────

function AddUserStoryForm({
  onSubmit,
  onCancel,
  submitting,
}: {
  onSubmit: (data: {
    title: string
    as_who: string
    i_want: string
    so_that: string
    priority: UserStory['priority']
  }) => void
  onCancel: () => void
  submitting: boolean
}) {
  const [title, setTitle] = useState('')
  const [asWho, setAsWho] = useState('')
  const [iWant, setIWant] = useState('')
  const [soThat, setSoThat] = useState('')
  const [priority, setPriority] = useState<UserStory['priority']>('medium')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !asWho.trim() || !iWant.trim()) return
    onSubmit({ title: title.trim(), as_who: asWho.trim(), i_want: iWant.trim(), so_that: soThat.trim(), priority })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="item-card p-4 flex flex-col gap-4 border-l-4"
      style={{ borderLeftColor: '#0f756d' }}
      data-testid="add-user-story-form"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-primary uppercase tracking-wider">
          Neue User Story
        </span>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-muted">Priorität</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as UserStory['priority'])}
            className="text-xs px-2 py-1 rounded border border-border"
          >
            <option value="low">Niedrig</option>
            <option value="medium">Mittel</option>
            <option value="high">Hoch</option>
            <option value="critical">Kritisch</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-muted">Titel *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-sm px-3 py-2 rounded border border-border"
          placeholder="Titel der User Story"
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-muted">Als (Rolle) *</label>
          <input
            type="text"
            value={asWho}
            onChange={(e) => setAsWho(e.target.value)}
            className="text-sm px-3 py-2 rounded border border-border"
            placeholder="Rolle"
            required
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-muted">möchte ich, dass … *</label>
          <input
            type="text"
            value={iWant}
            onChange={(e) => setIWant(e.target.value)}
            className="text-sm px-3 py-2 rounded border border-border"
            placeholder="Ziel"
            required
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-muted">damit …</label>
          <input
            type="text"
            value={soThat}
            onChange={(e) => setSoThat(e.target.value)}
            className="text-sm px-3 py-2 rounded border border-border"
            placeholder="Nutzen"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onCancel} className="btn-ghost px-3 py-1 text-xs h-8">
          Abbrechen
        </button>
        <button
          type="submit"
          disabled={submitting || !title.trim() || !asWho.trim() || !iWant.trim()}
          className="btn-primary px-3 py-1 text-xs h-8 disabled:opacity-60"
        >
          {submitting ? 'Erstelle…' : 'Hinzufügen'}
        </button>
      </div>
    </form>
  )
}

function AddNFRForm({
  onSubmit,
  onCancel,
  submitting,
}: {
  onSubmit: (data: { title: string; category: string; description: string; metric: string; priority: NFR['priority'] }) => void
  onCancel: () => void
  submitting: boolean
}) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('performance')
  const [description, setDescription] = useState('')
  const [metric, setMetric] = useState('')
  const [priority, setPriority] = useState<NFR['priority']>('medium')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    onSubmit({ title: title.trim(), category, description: description.trim(), metric: metric.trim(), priority })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="item-card p-4 flex flex-col gap-4 border-l-4"
      style={{ borderLeftColor: '#0f756d' }}
      data-testid="add-nfr-form"
    >
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="text-xs font-bold text-primary uppercase tracking-wider">Neue NFR</span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-muted">Kategorie</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="text-xs px-2 py-1 rounded border border-border"
            >
              {['performance','security','usability','reliability','maintainability','compliance'].map((c) => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-muted">Priorität</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as NFR['priority'])}
              className="text-xs px-2 py-1 rounded border border-border"
            >
              <option value="low">Niedrig</option>
              <option value="medium">Mittel</option>
              <option value="high">Hoch</option>
              <option value="critical">Kritisch</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-muted">Titel *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-sm px-3 py-2 rounded border border-border"
          placeholder="NFR-Titel"
          required
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-muted">Beschreibung</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="text-sm px-3 py-2 rounded border border-border resize-none"
          placeholder="Beschreibung der Anforderung"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-muted">Messgröße</label>
        <input
          type="text"
          value={metric}
          onChange={(e) => setMetric(e.target.value)}
          className="text-sm px-3 py-2 rounded border border-border font-mono"
          placeholder="z.B. P95 < 200ms"
        />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onCancel} className="btn-ghost px-3 py-1 text-xs h-8">
          Abbrechen
        </button>
        <button
          type="submit"
          disabled={submitting || !title.trim()}
          className="btn-primary px-3 py-1 text-xs h-8 disabled:opacity-60"
        >
          {submitting ? 'Erstelle…' : 'Hinzufügen'}
        </button>
      </div>
    </form>
  )
}

function AddQuestionForm({
  onSubmit,
  onCancel,
  submitting,
}: {
  onSubmit: (data: { question_text: string; owner: string }) => void
  onCancel: () => void
  submitting: boolean
}) {
  const [questionText, setQuestionText] = useState('')
  const [owner, setOwner] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!questionText.trim()) return
    onSubmit({ question_text: questionText.trim(), owner: owner.trim() })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="item-card p-4 flex flex-col gap-4 border-l-4"
      style={{ borderLeftColor: '#0f756d' }}
      data-testid="add-question-form"
    >
      <span className="text-xs font-bold text-primary uppercase tracking-wider">Neue Offene Frage</span>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-muted">Frage *</label>
        <textarea
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          rows={3}
          className="text-sm px-3 py-2 rounded border border-border resize-none"
          placeholder="Was ist noch offen oder unklar?"
          required
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-muted">Verantwortlich (optional)</label>
        <input
          type="text"
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
          className="text-sm px-3 py-2 rounded border border-border"
          placeholder="z.B. Max Müller"
        />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onCancel} className="btn-ghost px-3 py-1 text-xs h-8">
          Abbrechen
        </button>
        <button
          type="submit"
          disabled={submitting || !questionText.trim()}
          className="btn-primary px-3 py-1 text-xs h-8 disabled:opacity-60"
        >
          {submitting ? 'Erstelle…' : 'Hinzufügen'}
        </button>
      </div>
    </form>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────

export default function SessionDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [activeTab, setActiveTab] = useState<SessionTab>('user-stories')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  // Poll status until terminal state
  const { data: statusData } = useSessionStatus(sessionId!, true)
  const isCompleted = statusData?.status === 'completed'
  const isFailed = statusData?.status === 'failed'

  // Fetch full session only once completed
  const { data: session } = useSession(sessionId!, isCompleted)

  // Fetch project name once we have the session's project_id
  const { data: project } = useProject(session?.project_id ?? '')

  // Local editable state
  const [localItems, setLocalItems] = useState<LocalItems | null>(null)
  const serverItemsRef = useRef<LocalItems | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [saveError, setSaveError] = useState<string | null>(null)

  // Pending delete (undo toast)
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null)

  // Add-item form visibility
  const [showAddForm, setShowAddForm] = useState<'user-story' | 'nfr' | 'question' | null>(null)
  const [addSubmitting, setAddSubmitting] = useState(false)

  // API functions
  const {
    patchUserStory,
    patchNFR,
    patchQuestion,
    deleteUserStory,
    deleteNFR,
    deleteQuestion,
    createUserStory,
    createNFR,
    createQuestion,
  } = useUpdateItem(sessionId!)

  // Initialize local state from server data (once)
  useEffect(() => {
    if (session && !localItems) {
      const initial: LocalItems = {
        userStories: session.user_stories.map((s) => ({ ...s, is_deleted: false })),
        nfrs: session.non_functional_requirements.map((n) => ({ ...n, is_deleted: false })),
        openQuestions: session.open_questions.map((q) => ({ ...q, is_deleted: false })),
      }
      setLocalItems(initial)
      serverItemsRef.current = JSON.parse(JSON.stringify(initial))
    }
  }, [session])

  // Clean up pending delete timer on unmount
  useEffect(() => {
    return () => {
      if (pendingDelete) clearTimeout(pendingDelete.timerId)
    }
  }, [pendingDelete])

  // ── Item update handlers ─────────────────────────────────────────────────

  function handleUpdateUserStory(id: string, changes: Partial<UserStory>) {
    setLocalItems((prev) =>
      prev
        ? {
            ...prev,
            userStories: prev.userStories.map((s) =>
              s.id === id ? { ...s, ...changes } : s,
            ),
          }
        : prev,
    )
    setIsDirty(true)
  }

  function handleUpdateNFR(id: string, changes: Partial<NFR>) {
    setLocalItems((prev) =>
      prev
        ? {
            ...prev,
            nfrs: prev.nfrs.map((n) => (n.id === id ? { ...n, ...changes } : n)),
          }
        : prev,
    )
    setIsDirty(true)
  }

  function handleUpdateQuestion(id: string, changes: Partial<OpenQuestion>) {
    setLocalItems((prev) =>
      prev
        ? {
            ...prev,
            openQuestions: prev.openQuestions.map((q) =>
              q.id === id ? { ...q, ...changes } : q,
            ),
          }
        : prev,
    )
    setIsDirty(true)
  }

  // ── Delete + undo ────────────────────────────────────────────────────────

  function handleDeleteItem(
    id: string,
    type: 'user-stories' | 'nfrs' | 'questions',
    item: UserStory | NFR | OpenQuestion,
  ) {
    // Commit any previously pending delete immediately
    if (pendingDelete) {
      clearTimeout(pendingDelete.timerId)
      callDeleteAPI(pendingDelete.id, pendingDelete.type)
    }

    // Optimistically remove from local state
    setLocalItems((prev) => {
      if (!prev) return prev
      if (type === 'user-stories')
        return { ...prev, userStories: prev.userStories.filter((s) => s.id !== id) }
      if (type === 'nfrs') return { ...prev, nfrs: prev.nfrs.filter((n) => n.id !== id) }
      return { ...prev, openQuestions: prev.openQuestions.filter((q) => q.id !== id) }
    })

    const timerId = setTimeout(async () => {
      await callDeleteAPI(id, type)
      setPendingDelete(null)
    }, 5000)

    setPendingDelete({ id, type, item, timerId })
  }

  async function callDeleteAPI(id: string, type: 'user-stories' | 'nfrs' | 'questions') {
    try {
      if (type === 'user-stories') await deleteUserStory(id)
      else if (type === 'nfrs') await deleteNFR(id)
      else await deleteQuestion(id)
    } catch {
      // Silently ignore — item was already visually removed
    }
  }

  function handleUndoDelete() {
    if (!pendingDelete) return
    clearTimeout(pendingDelete.timerId)
    const { type, item } = pendingDelete
    setLocalItems((prev) => {
      if (!prev) return prev
      if (type === 'user-stories')
        return { ...prev, userStories: [...prev.userStories, item as UserStory] }
      if (type === 'nfrs') return { ...prev, nfrs: [...prev.nfrs, item as NFR] }
      return { ...prev, openQuestions: [...prev.openQuestions, item as OpenQuestion] }
    })
    setPendingDelete(null)
  }

  function handleDismissToast() {
    if (!pendingDelete) return
    clearTimeout(pendingDelete.timerId)
    callDeleteAPI(pendingDelete.id, pendingDelete.type)
    setPendingDelete(null)
  }

  // ── Add item handlers ────────────────────────────────────────────────────

  async function handleAddUserStory(data: {
    title: string
    as_who: string
    i_want: string
    so_that: string
    priority: UserStory['priority']
  }) {
    setAddSubmitting(true)
    try {
      const created = await createUserStory({
        ...data,
        acceptance_criteria: [],
        labels: [],
      })
      const newItem = { ...created, is_deleted: false }
      setLocalItems((prev) =>
        prev ? { ...prev, userStories: [...prev.userStories, newItem] } : prev,
      )
      // Also update server snapshot so it doesn't appear as dirty
      if (serverItemsRef.current) {
        serverItemsRef.current.userStories.push(newItem)
      }
      setShowAddForm(null)
    } catch {
      // Error is swallowed; user can retry
    } finally {
      setAddSubmitting(false)
    }
  }

  async function handleAddNFR(data: {
    title: string
    category: string
    description: string
    metric: string
    priority: NFR['priority']
  }) {
    setAddSubmitting(true)
    try {
      const created = await createNFR({
        title: data.title,
        category: data.category,
        description: data.description || null,
        metric: data.metric || null,
        priority: data.priority,
      })
      const newItem = { ...created, is_deleted: false }
      setLocalItems((prev) =>
        prev ? { ...prev, nfrs: [...prev.nfrs, newItem] } : prev,
      )
      if (serverItemsRef.current) {
        serverItemsRef.current.nfrs.push(newItem)
      }
      setShowAddForm(null)
    } catch {
      // swallowed
    } finally {
      setAddSubmitting(false)
    }
  }

  async function handleAddQuestion(data: { question_text: string; owner: string }) {
    setAddSubmitting(true)
    try {
      const created = await createQuestion({
        question_text: data.question_text,
        owner: data.owner || null,
      })
      const newItem = { ...created, is_deleted: false }
      setLocalItems((prev) =>
        prev ? { ...prev, openQuestions: [...prev.openQuestions, newItem] } : prev,
      )
      if (serverItemsRef.current) {
        serverItemsRef.current.openQuestions.push(newItem)
      }
      setShowAddForm(null)
    } catch {
      // swallowed
    } finally {
      setAddSubmitting(false)
    }
  }

  // ── Save ─────────────────────────────────────────────────────────────────

  async function handleSave() {
    if (!localItems || !serverItemsRef.current) return
    setSaveState('saving')
    setSaveError(null)

    const server = serverItemsRef.current
    const patches: Promise<unknown>[] = []

    for (const story of localItems.userStories) {
      const sv = server.userStories.find((s) => s.id === story.id)
      if (!sv) continue
      const changes = pickChanged(sv, story, [
        'title',
        'as_who',
        'i_want',
        'so_that',
        'acceptance_criteria',
        'priority',
        'labels',
      ])
      if (Object.keys(changes).length > 0) {
        patches.push(patchUserStory(story.id, changes))
      }
    }

    for (const nfr of localItems.nfrs) {
      const sv = server.nfrs.find((n) => n.id === nfr.id)
      if (!sv) continue
      const changes = pickChanged(sv, nfr, [
        'title',
        'category',
        'description',
        'metric',
        'priority',
      ])
      if (Object.keys(changes).length > 0) {
        patches.push(patchNFR(nfr.id, changes))
      }
    }

    for (const q of localItems.openQuestions) {
      const sv = server.openQuestions.find((oq) => oq.id === q.id)
      if (!sv) continue
      const changes = pickChanged(sv, q, ['question_text', 'owner', 'status'])
      if (Object.keys(changes).length > 0) {
        patches.push(patchQuestion(q.id, changes))
      }
    }

    try {
      await Promise.all(patches)
      // Update server snapshot after successful save
      serverItemsRef.current = JSON.parse(JSON.stringify(localItems))
      setIsDirty(false)
      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 2000)
    } catch {
      setSaveError('Speichern fehlgeschlagen. Bitte versuchen Sie es erneut.')
      setSaveState('error')
    }
  }

  // ── Loading / error states ───────────────────────────────────────────────

  if (!statusData || (!isCompleted && !isFailed)) {
    return <ExtractionProgress />
  }

  if (isFailed) {
    return <ExtractionError message={statusData.error_message} />
  }

  if (!session || !localItems) {
    return <ExtractionProgress />
  }

  // ── Results ──────────────────────────────────────────────────────────────

  const activeStories = localItems.userStories.filter((s) => !s.is_deleted)
  const activeNFRs = localItems.nfrs.filter((n) => !n.is_deleted)
  const activeQuestions = localItems.openQuestions.filter((q) => !q.is_deleted)

  const counts = {
    userStories: activeStories.length,
    nfrs: activeNFRs.length,
    openQuestions: activeQuestions.length,
  }

  const sessionTitle = session.title
    ? session.title
    : `Anforderungserfassung vom ${new Date(session.created_at).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })}`

  function handleTabChange(tab: SessionTab) {
    setActiveTab(tab)
    setVisibleCount(PAGE_SIZE)
    setShowAddForm(null)
  }

  const totalForTab =
    activeTab === 'user-stories'
      ? activeStories.length
      : activeTab === 'nfrs'
        ? activeNFRs.length
        : activeQuestions.length

  const hasMore = visibleCount < totalForTab

  return (
    <div className="flex flex-col flex-1" data-testid="session-detail">
      <SessionHeader
        projectName={project?.name ?? ''}
        sessionName={sessionTitle}
        sessionId={session.id}
        counts={counts}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        saveState={saveState}
        isDirty={isDirty}
        onSave={handleSave}
        items={{ userStories: activeStories, nfrs: activeNFRs, openQuestions: activeQuestions }}
      />

      <main className="flex-1 p-6 md:p-10 lg:px-20">
        <div className="max-w-[1100px] mx-auto flex flex-col gap-3">

          {/* Save error banner */}
          {saveError && (
            <div className="flex items-center gap-3 px-4 py-3 rounded border border-red-200 bg-red-50 text-red-700 text-sm">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span className="flex-1">{saveError}</span>
              <button
                onClick={() => setSaveError(null)}
                className="text-red-500 hover:text-red-700"
                aria-label="Schließen"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          )}

          {/* Toolbar */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">
              Ergebnisse
            </span>
            <div className="flex gap-1">
              <button
                className="p-1 text-stone hover:text-primary transition-colors rounded"
                aria-label="Filtern"
              >
                <span className="material-symbols-outlined text-[20px]">filter_list</span>
              </button>
              <button
                className="p-1 text-stone hover:text-primary transition-colors rounded"
                aria-label="Ansicht wechseln"
              >
                <span className="material-symbols-outlined text-[20px]">view_agenda</span>
              </button>
            </div>
          </div>

          {/* User Story cards */}
          {activeTab === 'user-stories' && (
            <>
              {activeStories.slice(0, visibleCount).map((story) => (
                <UserStoryCard
                  key={story.id}
                  story={story}
                  onUpdate={handleUpdateUserStory}
                  onDelete={(id) => handleDeleteItem(id, 'user-stories', story)}
                />
              ))}

              {totalForTab === 0 && (
                <EmptyState icon="manage_accounts" label="User Stories" />
              )}

              {hasMore && <LoadMoreButton onClick={() => setVisibleCount((c) => c + PAGE_SIZE)} />}

              {/* Add User Story */}
              {showAddForm === 'user-story' ? (
                <AddUserStoryForm
                  onSubmit={handleAddUserStory}
                  onCancel={() => setShowAddForm(null)}
                  submitting={addSubmitting}
                />
              ) : (
                <AddItemButton
                  label="+ User Story hinzufügen"
                  onClick={() => setShowAddForm('user-story')}
                  testId="add-user-story-button"
                />
              )}
            </>
          )}

          {/* NFR cards */}
          {activeTab === 'nfrs' && (
            <>
              {activeNFRs.slice(0, visibleCount).map((nfr) => (
                <NFRCard
                  key={nfr.id}
                  nfr={nfr}
                  onUpdate={handleUpdateNFR}
                  onDelete={(id) => handleDeleteItem(id, 'nfrs', nfr)}
                />
              ))}

              {totalForTab === 0 && <EmptyState icon="speed" label="NFRs" />}

              {hasMore && <LoadMoreButton onClick={() => setVisibleCount((c) => c + PAGE_SIZE)} />}

              {showAddForm === 'nfr' ? (
                <AddNFRForm
                  onSubmit={handleAddNFR}
                  onCancel={() => setShowAddForm(null)}
                  submitting={addSubmitting}
                />
              ) : (
                <AddItemButton
                  label="+ NFR hinzufügen"
                  onClick={() => setShowAddForm('nfr')}
                  testId="add-nfr-button"
                />
              )}
            </>
          )}

          {/* Open question cards */}
          {activeTab === 'open-questions' && (
            <>
              {activeQuestions.slice(0, visibleCount).map((q) => (
                <OpenQuestionCard
                  key={q.id}
                  question={q}
                  onUpdate={handleUpdateQuestion}
                  onDelete={(id) => handleDeleteItem(id, 'questions', q)}
                />
              ))}

              {totalForTab === 0 && <EmptyState icon="help_outline" label="offenen Fragen" />}

              {hasMore && <LoadMoreButton onClick={() => setVisibleCount((c) => c + PAGE_SIZE)} />}

              {showAddForm === 'question' ? (
                <AddQuestionForm
                  onSubmit={handleAddQuestion}
                  onCancel={() => setShowAddForm(null)}
                  submitting={addSubmitting}
                />
              ) : (
                <AddItemButton
                  label="+ Offene Frage hinzufügen"
                  onClick={() => setShowAddForm('question')}
                  testId="add-question-button"
                />
              )}
            </>
          )}
        </div>
      </main>

      {/* Undo toast */}
      {pendingDelete && (
        <UndoToast
          key={pendingDelete.id}
          message="Element gelöscht."
          onUndo={handleUndoDelete}
          onDismiss={handleDismissToast}
        />
      )}
    </div>
  )
}

// ── Small helpers ─────────────────────────────────────────────────────────

function EmptyState({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
      <span className="material-symbols-outlined text-stone text-[40px]">{icon}</span>
      <p className="text-muted text-sm">Keine {label} gefunden.</p>
    </div>
  )
}

function LoadMoreButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="flex justify-center mt-6 mb-4">
      <button
        className="text-sm font-bold text-primary hover:text-primary-dark flex items-center gap-2 px-4 py-2 rounded hover:bg-green-50 transition-colors"
        onClick={onClick}
      >
        <span>Weitere laden</span>
        <span className="material-symbols-outlined text-[20px]">expand_more</span>
      </button>
    </div>
  )
}

function AddItemButton({
  label,
  onClick,
  testId,
}: {
  label: string
  onClick: () => void
  testId?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-2 flex items-center gap-2 text-sm font-semibold text-muted hover:text-primary transition-colors w-fit"
      data-testid={testId}
    >
      <span
        className="inline-flex items-center justify-center w-6 h-6 rounded border border-dashed border-border hover:border-primary transition-colors"
      >
        <span className="material-symbols-outlined text-[16px]">add</span>
      </span>
      {label}
    </button>
  )
}
