import api from '../lib/api'

export function useExportSession(sessionId: string) {
  async function downloadExport(format: 'json' | 'markdown') {
    const response = await api.get(`/sessions/${sessionId}/export?format=${format}`, {
      responseType: 'blob',
    })
    const url = URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.download = format === 'json' ? `session_${sessionId}.json` : `session_${sessionId}.md`
    link.click()
    URL.revokeObjectURL(url)
  }

  return { downloadExport }
}
