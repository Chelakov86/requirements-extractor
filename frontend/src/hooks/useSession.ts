import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import type { UserStory, NFR, OpenQuestion } from '../data/mockData'

export interface ApiSession {
  id: string
  project_id: string
  title: string | null
  status: 'pending' | 'processing' | 'completed' | 'failed'
  output_language: string
  error_message: string | null
  created_at: string
  updated_at: string | null
  user_stories: UserStory[]
  // Backend field name is non_functional_requirements (from SessionDetailResponse)
  non_functional_requirements: NFR[]
  open_questions: OpenQuestion[]
}

export function useSession(sessionId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['session', sessionId],
    queryFn: (): Promise<ApiSession> =>
      api.get(`/sessions/${sessionId}`).then((r) => r.data),
    enabled,
  })
}
