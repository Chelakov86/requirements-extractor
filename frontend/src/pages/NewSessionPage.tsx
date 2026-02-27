import { useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import LanguageSelect from '../components/LanguageSelect'
import { useProject } from '../hooks/useProjects'
import { useCreateSession } from '../hooks/useCreateSession'
import { formatBytes } from '../lib/format'
import { getApiErrorMessage } from '../lib/api'
import { NEW_SESSION_CONTENT, type OutputLanguage } from '../data/mockData'

const MAX_FILE_BYTES = 30 * 1024 * 1024  // 30 MB
const MAX_TOTAL_BYTES = 50 * 1024 * 1024 // 50 MB

type Tab = 'text' | 'files'

export default function NewSessionPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const content = NEW_SESSION_CONTENT
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: project } = useProject(projectId!)
  const createSession = useCreateSession(projectId!)

  // ── Form state ────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<Tab>('text')
  const [text, setText] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [analysisName, setAnalysisName] = useState('')
  const [language, setLanguage] = useState<OutputLanguage>('de')
  const [errorMessage, setErrorMessage] = useState('')

  // ── Derived ───────────────────────────────────────────────────────────────
  const charCount = text.length
  const oversizedFiles = files.filter((f) => f.size > MAX_FILE_BYTES)
  const totalBytes = files.reduce((sum, f) => sum + f.size, 0)
  const isTotalOversized = totalBytes > MAX_TOTAL_BYTES

  const isValid =
    activeTab === 'text'
      ? text.trim().length >= 50
      : files.length > 0 && oversizedFiles.length === 0

  // ── Handlers ──────────────────────────────────────────────────────────────
  function addFiles(incoming: FileList) {
    const next = Array.from(incoming)
    setFiles((prev) => {
      const names = new Set(prev.map((f) => f.name))
      return [...prev, ...next.filter((f) => !names.has(f.name))]
    })
  }

  function removeFile(name: string) {
    setFiles((prev) => prev.filter((f) => f.name !== name))
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files)
  }

  function mapApiError(err: unknown): string {
    // Try to extract error code from the response
    const data = (err as { response?: { data?: { error?: string; message?: string; detail?: string } } })
      ?.response?.data
    const code = data?.error
    if (code === 'FILE_TOO_LARGE') {
      // The backend may include the filename in the message
      return data?.message ?? `Eine Datei überschreitet die maximale Größe von 30 MB.`
    }
    if (code === 'TOTAL_SIZE_EXCEEDED') {
      return 'Die Gesamtgröße aller Dateien überschreitet 50 MB. Bitte entferne einige Dateien.'
    }
    if (code === 'INVALID_FILE_TYPE') {
      return 'Das Dateiformat wird nicht unterstützt. Erlaubt: PDF, DOCX, XLSX, PPTX, TXT, MD.'
    }
    return getApiErrorMessage(err) || 'Fehler beim Erstellen der Anforderungserfassung. Bitte versuche es erneut.'
  }

  async function handleSubmit() {
    setErrorMessage('')
    const formData = new FormData()
    formData.append('output_language', language)
    if (analysisName.trim()) formData.append('name', analysisName.trim())
    if (activeTab === 'text') {
      formData.append('text_input', text)
    } else {
      files.forEach((f) => formData.append('files', f))
    }
    try {
      const session = await createSession.mutateAsync(formData)
      navigate(`/sessions/${session.id}`)
    } catch (err: unknown) {
      setErrorMessage(mapApiError(err))
    }
  }

  return (
    <div className="flex flex-col flex-1">
      {/* Page header */}
      <header className="bg-white border-b border-border py-5 px-6 shrink-0">
        <div className="max-w-[1200px] mx-auto w-full flex flex-col gap-1">
          <button
            onClick={() => navigate(`/projects/${projectId}`)}
            className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-primary transition-colors w-fit"
            data-testid="back-to-project"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            {project?.name ?? '…'}
          </button>
          <h2 className="text-2xl font-bold text-slate" style={{ letterSpacing: '-0.01em' }}>
            {content.pageTitle}
          </h2>
        </div>
      </header>

      {/* Main */}
      <main
        className="flex-1 flex justify-center py-10 px-4 sm:px-6"
        style={{ backgroundColor: 'var(--color-canvas)' }}
      >
        <div className="w-full max-w-[760px] bg-white rounded-xl border border-border shadow-card flex flex-col h-fit">

          {/* Error banner */}
          {errorMessage && (
            <div
              className="mx-8 mt-6 flex items-start gap-3 px-4 py-3 rounded text-sm"
              style={{
                background: 'rgba(220,38,38,0.07)',
                border: '1px solid rgba(220,38,38,0.22)',
                color: 'var(--color-priority-critical)',
              }}
              role="alert"
              data-testid="error-banner"
            >
              <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">error</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Tab bar */}
          <div className="flex border-b border-border px-8 pt-6">
            <button
              onClick={() => setActiveTab('text')}
              className={`flex items-center gap-2 pb-3 px-1 border-b-2 text-sm transition-colors ${
                activeTab === 'text'
                  ? 'border-primary text-slate font-semibold'
                  : 'border-transparent text-muted font-medium hover:text-slate'
              }`}
              data-testid="tab-text"
            >
              <span className="material-symbols-outlined text-lg">edit_note</span>
              {content.tabs.text}
            </button>
            <button
              onClick={() => setActiveTab('files')}
              className={`flex items-center gap-2 pb-3 px-1 ml-8 border-b-2 text-sm transition-colors ${
                activeTab === 'files'
                  ? 'border-primary text-slate font-semibold'
                  : 'border-transparent text-muted font-medium hover:text-slate'
              }`}
              data-testid="tab-files"
            >
              <span className="material-symbols-outlined text-lg">upload_file</span>
              {content.tabs.files}
            </button>
          </div>

          {/* Card content */}
          <div className="p-8 flex flex-col gap-6">

            {activeTab === 'text' ? (
              /* ── Text tab ────────────────────────────────────────────── */
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate" htmlFor="text-input">
                  {content.textInput.label}
                </label>
                <textarea
                  id="text-input"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={14}
                  placeholder="Füge hier deinen Text ein (E-Mail, Meeting-Notizen, Briefing...)"
                  className="w-full p-4 text-sm leading-relaxed bg-smoke border border-border rounded text-slate placeholder:text-stone focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-y font-[inherit]"
                  style={{ minHeight: '200px' }}
                  data-testid="text-input"
                />
                <div className="flex items-center justify-between gap-4">
                  {text.trim().length > 0 && text.trim().length < 50 ? (
                    <p className="text-xs" style={{ color: 'var(--color-priority-critical)' }}>
                      Mindestens 50 Zeichen erforderlich
                    </p>
                  ) : (
                    <span />
                  )}
                  <span className="text-xs text-stone shrink-0">
                    {charCount.toLocaleString('de-DE')} /{' '}
                    {content.textInput.maxChars.toLocaleString('de-DE')} Zeichen
                  </span>
                </div>
              </div>
            ) : (
              /* ── Files tab ───────────────────────────────────────────── */
              <div className="flex flex-col gap-4">

                {/* Total size warning */}
                {isTotalOversized && (
                  <div
                    className="flex items-center gap-2 px-4 py-3 rounded text-sm"
                    style={{
                      background: 'rgba(234,88,12,0.08)',
                      border: '1px solid rgba(234,88,12,0.25)',
                      color: 'var(--color-priority-high)',
                    }}
                    role="alert"
                    data-testid="total-size-warning"
                  >
                    <span className="material-symbols-outlined text-[18px] shrink-0">warning</span>
                    <span>
                      Gesamtgröße ({formatBytes(totalBytes)}) überschreitet 50 MB. Bitte
                      entferne einige Dateien.
                    </span>
                  </div>
                )}

                {/* Dropzone */}
                <div
                  className="dropzone p-10 gap-3 text-sm cursor-pointer"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  data-testid="dropzone"
                >
                  <span className="material-symbols-outlined text-interactive text-[40px]">
                    upload_file
                  </span>
                  <p className="text-muted text-center">
                    {content.fileUpload.dropzoneLabel}{' '}
                    <span className="text-primary font-semibold">
                      {content.fileUpload.browseLabel}
                    </span>
                  </p>
                  <p className="text-xs text-stone">{content.fileUpload.hint}</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.docx,.xlsx,.pptx,.txt,.md"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) addFiles(e.target.files)
                      e.target.value = ''
                    }}
                  />
                </div>

                {/* File list */}
                {files.length > 0 && (
                  <ul className="flex flex-col gap-2" data-testid="file-list">
                    {files.map((f) => {
                      const isOversized = f.size > MAX_FILE_BYTES
                      return (
                        <li
                          key={f.name}
                          className={`flex items-center justify-between px-3 py-2 rounded border text-sm ${
                            isOversized
                              ? 'border-[rgba(220,38,38,0.30)] bg-[rgba(220,38,38,0.04)]'
                              : 'border-border bg-smoke'
                          }`}
                          data-testid="file-chip"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="material-symbols-outlined text-[18px] shrink-0"
                              style={{
                                color: isOversized
                                  ? 'var(--color-priority-critical)'
                                  : 'var(--color-primary)',
                              }}
                            >
                              {isOversized ? 'error' : 'description'}
                            </span>
                            <span
                              className="truncate font-medium"
                              style={{
                                color: isOversized
                                  ? 'var(--color-priority-critical)'
                                  : 'var(--color-text-primary)',
                              }}
                            >
                              {f.name}
                            </span>
                            <span
                              className="shrink-0 text-xs"
                              style={{
                                color: isOversized
                                  ? 'var(--color-priority-critical)'
                                  : 'var(--color-text-stone)',
                              }}
                            >
                              {formatBytes(f.size)}
                              {isOversized && ' — zu groß (max. 30 MB)'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeFile(f.name)
                            }}
                            className="text-stone hover:text-priority-critical transition-colors ml-2 shrink-0"
                            aria-label={`${f.name} entfernen`}
                          >
                            <span className="material-symbols-outlined text-[18px]">close</span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            )}

            {/* ── Configuration row ─────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate" htmlFor="session-title">
                  {content.analysisName.label}
                </label>
                <input
                  id="session-title"
                  type="text"
                  value={analysisName}
                  onChange={(e) => setAnalysisName(e.target.value)}
                  placeholder={content.analysisName.placeholder}
                  className="w-full h-11 px-3 rounded border border-border bg-white text-slate text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  data-testid="session-title-input"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate">
                  {content.language.label}
                </label>
                <LanguageSelect value={language} onChange={setLanguage} />
              </div>
            </div>

            {/* ── Action bar ────────────────────────────────────────────── */}
            <div className="flex items-center justify-end gap-4 pt-6 mt-2 border-t border-border">
              <button
                type="button"
                onClick={() => navigate(`/projects/${projectId}`)}
                className="px-5 h-11 rounded text-muted hover:bg-smoke font-semibold text-sm transition-colors"
                data-testid="cancel-btn"
              >
                {content.actions.cancel}
              </button>
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={createSession.isPending || !isValid}
                className="btn-primary px-6 h-11 gap-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                data-testid="submit-btn"
              >
                {createSession.isPending ? (
                  <span className="material-symbols-outlined animate-spin text-[18px]">
                    progress_activity
                  </span>
                ) : (
                  <>
                    <span>{content.actions.submit}</span>
                    <span className="material-symbols-outlined text-base">arrow_forward</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
