import api from '../lib/api'
import type { UserStory, NFR, OpenQuestion } from '../data/mockData'

export interface UserStoryCreatePayload {
  title: string
  as_who: string
  i_want: string
  so_that: string
  acceptance_criteria?: string[]
  priority?: UserStory['priority']
  labels?: string[]
}

export interface NFRCreatePayload {
  title: string
  category: string
  description?: string | null
  metric?: string | null
  priority?: NFR['priority']
}

export interface QuestionCreatePayload {
  question_text: string
  owner?: string | null
}

export function useUpdateItem(sessionId: string) {
  const patchUserStory = (id: string, changes: Partial<UserStory>) =>
    api
      .patch(`/sessions/${sessionId}/user-stories/${id}`, changes)
      .then((r) => r.data as UserStory)

  const patchNFR = (id: string, changes: Partial<NFR>) =>
    api.patch(`/sessions/${sessionId}/nfrs/${id}`, changes).then((r) => r.data as NFR)

  const patchQuestion = (id: string, changes: Partial<OpenQuestion>) =>
    api
      .patch(`/sessions/${sessionId}/questions/${id}`, changes)
      .then((r) => r.data as OpenQuestion)

  const deleteUserStory = (id: string) =>
    api.delete(`/sessions/${sessionId}/user-stories/${id}`)

  const deleteNFR = (id: string) => api.delete(`/sessions/${sessionId}/nfrs/${id}`)

  const deleteQuestion = (id: string) => api.delete(`/sessions/${sessionId}/questions/${id}`)

  const createUserStory = (body: UserStoryCreatePayload) =>
    api
      .post(`/sessions/${sessionId}/user-stories`, body)
      .then((r) => r.data as UserStory)

  const createNFR = (body: NFRCreatePayload) =>
    api.post(`/sessions/${sessionId}/nfrs`, body).then((r) => r.data as NFR)

  const createQuestion = (body: QuestionCreatePayload) =>
    api
      .post(`/sessions/${sessionId}/questions`, body)
      .then((r) => r.data as OpenQuestion)

  return {
    patchUserStory,
    patchNFR,
    patchQuestion,
    deleteUserStory,
    deleteNFR,
    deleteQuestion,
    createUserStory,
    createNFR,
    createQuestion,
  }
}
