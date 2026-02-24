import { useState } from 'react'
import { MOCK_SAMPLE_TEXT, type OutputLanguage } from '../data/mockData'

export type SessionTab = 'text' | 'files'

export interface UseNewSessionReturn {
  readonly activeTab: SessionTab
  readonly text: string
  readonly files: File[]
  readonly analysisName: string
  readonly language: OutputLanguage
  readonly isSubmitting: boolean
  setActiveTab: (tab: SessionTab) => void
  setText: (v: string) => void
  setAnalysisName: (v: string) => void
  setLanguage: (lang: OutputLanguage) => void
  addFiles: (incoming: FileList) => void
  removeFile: (name: string) => void
  handleSubmit: () => Promise<void>
  handleCancel: () => void
}

export function useNewSession(projectId: string): UseNewSessionReturn {
  const [activeTab, setActiveTab] = useState<SessionTab>('text')
  const [text, setText] = useState(MOCK_SAMPLE_TEXT)
  const [files, setFiles] = useState<File[]>([])
  const [analysisName, setAnalysisName] = useState('')
  const [language, setLanguage] = useState<OutputLanguage>('de')
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  async function handleSubmit() {
    setIsSubmitting(true)
    try {
      const token = localStorage.getItem('access_token') ?? ''
      const formData = new FormData()
      formData.append('output_language', language)
      if (analysisName.trim()) formData.append('name', analysisName.trim())
      if (activeTab === 'text') {
        formData.append('text_input', text)
      } else {
        files.forEach((f) => formData.append('files', f))
      }
      await fetch(`/api/v1/projects/${projectId}/sessions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      // TODO: navigate to session status page
    } catch (err) {
      console.error('Session creation failed', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleCancel() {
    window.history.back()
  }

  return {
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
  }
}
