import { useMutation } from '@tanstack/react-query'
import api from '../lib/api'

interface CreateSessionResponse {
  id: string
  status: string
}

export function useCreateSession(projectId: string) {
  return useMutation({
    mutationFn: (formData: FormData) =>
      api
        .post<CreateSessionResponse>(`/projects/${projectId}/sessions`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        .then((r) => r.data),
  })
}
