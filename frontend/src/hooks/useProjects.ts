import { useState } from 'react'
import { MOCK_PROJECTS, type MockProject, type AccentColor } from '../data/mockData'

const ACCENT_CYCLE: AccentColor[] = ['critical', 'high', 'medium', 'low']

export interface UseProjectsReturn {
  readonly projects: MockProject[]
  createProject: (title: string, description: string) => void
  deleteProject: (id: string) => void
}

export function useProjects(): UseProjectsReturn {
  const [projects, setProjects] = useState<MockProject[]>(MOCK_PROJECTS)

  function createProject(title: string, description: string) {
    const newProject: MockProject = {
      id: `proj-${Date.now()}`,
      title,
      description,
      sessionCount: 0,
      lastUpdated: new Date().toLocaleDateString('de-DE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      accentColor: ACCENT_CYCLE[projects.length % ACCENT_CYCLE.length],
    }
    setProjects((prev) => [newProject, ...prev])
  }

  function deleteProject(id: string) {
    setProjects((prev) => prev.filter((p) => p.id !== id))
  }

  return { projects, createProject, deleteProject }
}
