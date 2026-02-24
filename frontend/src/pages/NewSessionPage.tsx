import { useRef } from 'react'
import LanguageSelect from '../components/LanguageSelect'
import { useNewSession } from '../hooks/useNewSession'
import { NEW_SESSION_CONTENT } from '../data/mockData'

const MOCK_PROJECT_ID = 'proj-001'
const MOCK_PROJECT_NAME = 'ERP-Migration 2025'

export default function NewSessionPage() {
  const content = NEW_SESSION_CONTENT
  const fileInputRef = useRef<HTMLInputElement>(null)
  const {
    activeTab,
    text,
    files,
    analysisName,
    language,
    isSubmitting,
    setActiveTab,
    setText,
    setAnalysisName,
    setLanguage,
    addFiles,
    removeFile,
    handleSubmit,
    handleCancel,
  } = useNewSession(MOCK_PROJECT_ID)

  const charCount = text.length

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files)
  }

  return (
    <div className="flex flex-col flex-1">
      {/* Page header */}
      <header className="bg-white border-b border-border py-5 px-6 shrink-0">
        <div className="max-w-[1200px] mx-auto w-full flex flex-col gap-1">
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); handleCancel() }}
            className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            {MOCK_PROJECT_NAME}
          </a>
          <h2 className="text-2xl font-bold text-slate tracking-tight">
            {content.pageTitle}
          </h2>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 bg-canvas flex justify-center py-10 px-4 sm:px-6">
        <div className="w-full max-w-[760px] bg-white rounded border border-border shadow flex flex-col h-fit">

          {/* Tab bar */}
          <div className="flex border-b border-border px-8 pt-6">
            <button
              onClick={() => setActiveTab('text')}
              className={`flex items-center gap-2 pb-3 px-1 border-b-2 text-sm font-bold tracking-wide transition-colors ${
                activeTab === 'text'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted hover:text-slate'
              }`}
            >
              <span className="material-symbols-outlined text-lg">edit_note</span>
              {content.tabs.text}
            </button>
            <button
              onClick={() => setActiveTab('files')}
              className={`flex items-center gap-2 pb-3 px-1 ml-8 border-b-2 text-sm font-bold tracking-wide transition-colors ${
                activeTab === 'files'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted hover:text-slate'
              }`}
            >
              <span className="material-symbols-outlined text-lg">upload_file</span>
              {content.tabs.files}
            </button>
          </div>

          {/* Card content */}
          <div className="p-8 flex flex-col gap-6">

            {activeTab === 'text' ? (
              /* ── Text tab ── */
              <div className="flex flex-col gap-2">
                <label
                  className="text-sm font-bold text-slate"
                  htmlFor="requirements"
                >
                  {content.textInput.label}
                </label>
                <textarea
                  id="requirements"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={14}
                  className="w-full p-4 text-sm leading-relaxed bg-smoke border border-border rounded text-slate placeholder:text-stone focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-y font-[inherit]"
                />
                <div className="flex justify-end">
                  <span className="text-xs font-medium text-stone">
                    {charCount.toLocaleString('de-DE')} /{' '}
                    {content.textInput.maxChars.toLocaleString('de-DE')}
                  </span>
                </div>
              </div>
            ) : (
              /* ── Files tab ── */
              <div className="flex flex-col gap-4">
                {/* Dropzone */}
                <div
                  className="dropzone p-10 gap-3 text-sm"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                >
                  <span className="material-symbols-outlined text-interactive text-[40px]">
                    upload_file
                  </span>
                  <p>
                    {content.fileUpload.dropzoneLabel}{' '}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-primary font-semibold hover:underline"
                    >
                      {content.fileUpload.browseLabel}
                    </button>
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
                  <ul className="flex flex-col gap-2">
                    {files.map((f) => (
                      <li
                        key={f.name}
                        className="flex items-center justify-between px-3 py-2 bg-smoke rounded border border-border text-sm"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="material-symbols-outlined text-primary text-[18px] shrink-0">
                            description
                          </span>
                          <span className="truncate text-slate font-medium">
                            {f.name}
                          </span>
                          <span className="text-stone shrink-0">
                            {(f.size / 1024 / 1024).toFixed(1)} MB
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(f.name)}
                          className="text-stone hover:text-priority-critical transition-colors ml-2 shrink-0"
                          aria-label={`${f.name} entfernen`}
                        >
                          <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Config row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label
                  className="text-sm font-bold text-slate"
                  htmlFor="analysisName"
                >
                  {content.analysisName.label}
                </label>
                <input
                  id="analysisName"
                  type="text"
                  value={analysisName}
                  onChange={(e) => setAnalysisName(e.target.value)}
                  placeholder={content.analysisName.placeholder}
                  className="w-full h-11 px-3 rounded border border-border bg-white text-slate text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-slate">
                  {content.language.label}
                </label>
                <LanguageSelect value={language} onChange={setLanguage} />
              </div>
            </div>

            {/* Action bar */}
            <div className="flex items-center justify-end gap-4 pt-6 mt-2 border-t border-border">
              <button
                type="button"
                onClick={handleCancel}
                className="px-5 h-11 rounded text-muted hover:bg-smoke font-bold text-sm transition-colors"
              >
                {content.actions.cancel}
              </button>
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={isSubmitting || (activeTab === 'text' && text.trim().length < 50)}
                className="btn-primary px-6 h-11 gap-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="material-symbols-outlined animate-spin text-[18px]">
                    progress_activity
                  </span>
                ) : (
                  <>
                    <span>{content.actions.submit}</span>
                    <span className="material-symbols-outlined text-base">
                      arrow_forward
                    </span>
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
