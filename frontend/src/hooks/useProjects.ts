import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'

export interface Project {
  id: string
  name: string
  description: string | null
  session_count: number
  created_at: string
  updated_at: string | null
}

export interface SessionSummary {
  id: string
  project_id: string
  title: string | null
  status: 'pending' | 'processing' | 'completed' | 'failed'
  output_language: string
  user_story_count: number
  nfr_count: number
  open_question_count: number
  created_at: string
}

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: (): Promise<Project[]> => api.get('/projects').then(r => r.data),
  })
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: (): Promise<Project> => api.get(`/projects/${id}`).then(r => r.data),
    enabled: !!id,
  })
}

export function useProjectSessions(projectId: string) {
  return useQuery({
    queryKey: ['projects', projectId, 'sessions'],
    queryFn: (): Promise<SessionSummary[]> =>
      api.get(`/projects/${projectId}/sessions`).then(r => r.data),
    enabled: !!projectId,
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      api.post<Project>('/projects', data).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/projects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}
