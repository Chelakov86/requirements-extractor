import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'

export interface SessionStatusResponse {
  status: 'pending' | 'processing' | 'completed' | 'failed'
  error_message: string | null
}

export function useSessionStatus(sessionId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['session-status', sessionId],
    queryFn: (): Promise<SessionStatusResponse> =>
      api.get(`/sessions/${sessionId}/status`).then((r) => r.data),
    refetchInterval: (query) => {
      const data = query.state.data as SessionStatusResponse | undefined
      if (!data || ['pending', 'processing'].includes(data.status)) return 2000
      return false
    },
    enabled,
  })
}
