import { test as base, type Page } from '@playwright/test'

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:8000/api/v1'
const TEST_EMAIL = process.env.TEST_USER_EMAIL ?? 'test@test.com'
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD ?? 'test123'

// Optional: set to a known-good completed session ID when the AI backend is
// unavailable (e.g. Docker container uses a deprecated model).
// Format: <session-id>:<project-id>  e.g. "abc123:def456"
const FALLBACK_SESSION = process.env.E2E_COMPLETED_SESSION ?? ''

const SAMPLE_TEXT =
  'Als Kunde möchte ich meine Bestellungen online verfolgen können, ' +
  'damit ich jederzeit den aktuellen Status meiner Lieferung sehe. ' +
  'Das System muss dabei eine Antwortzeit von unter 2 Sekunden garantieren. ' +
  'Der Benutzer soll sich per E-Mail und Passwort anmelden können. ' +
  'Alle Daten müssen verschlüsselt übertragen werden (TLS 1.3). ' +
  'Das System soll mindestens 1000 gleichzeitige Nutzer unterstützen.'

async function fetchAuthToken(): Promise<string> {
  const body = new URLSearchParams()
  body.set('username', TEST_EMAIL)
  body.set('password', TEST_PASSWORD)

  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })
  if (!res.ok) throw new Error(`Login failed: ${res.status}`)
  const data = (await res.json()) as { access_token: string }
  return data.access_token
}

async function loginPage(page: Page): Promise<void> {
  await page.goto('/login')
  await page.fill('#email', TEST_EMAIL)
  await page.fill('#password', TEST_PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL('/projects')
}

export type TestProject = {
  id: string
  completedSessionId: string
}

type Fixtures = {
  authenticatedPage: Page
  testProject: TestProject
}

export const test = base.extend<Fixtures>({
  authenticatedPage: async ({ page }, use) => {
    await loginPage(page)
    await use(page)
  },

  testProject: async ({}, use) => {
    // Fast path: use pre-existing session from env var (for envs where AI is unavailable)
    if (FALLBACK_SESSION) {
      const [sessionId, projectId] = FALLBACK_SESSION.split(':')
      if (!sessionId || !projectId) {
        throw new Error(
          'E2E_COMPLETED_SESSION must be in format "<session-id>:<project-id>"',
        )
      }
      await use({ id: projectId, completedSessionId: sessionId })
      return
    }

    const token = await fetchAuthToken()
    const authHeader = { Authorization: `Bearer ${token}` }

    // Create a fresh project for this test run
    const projectRes = await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: { ...authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: `E2E Test Project ${Date.now()}` }),
    })
    if (!projectRes.ok) throw new Error(`Create project failed: ${projectRes.status}`)
    const project = (await projectRes.json()) as { id: string }

    // Create a session via text input
    const formData = new FormData()
    formData.append('output_language', 'de')
    formData.append('text_input', SAMPLE_TEXT)

    const sessionRes = await fetch(`${API_BASE}/projects/${project.id}/sessions`, {
      method: 'POST',
      headers: authHeader,
      body: formData,
    })
    if (!sessionRes.ok) throw new Error(`Create session failed: ${sessionRes.status}`)
    // Backend returns { session_id, status } — NOT { id }
    const { session_id: sessionId } = (await sessionRes.json()) as { session_id: string }

    // Poll until the session reaches a terminal state (max 90s)
    let status = 'pending'
    const deadline = Date.now() + 90_000
    while (Date.now() < deadline && status !== 'completed' && status !== 'failed') {
      await new Promise((r) => setTimeout(r, 2500))
      const statusRes = await fetch(`${API_BASE}/sessions/${sessionId}/status`, {
        headers: authHeader,
      })
      if (statusRes.ok) {
        const body = (await statusRes.json()) as { status: string; error_message?: string }
        status = body.status
        if (status === 'failed') {
          throw new Error(
            `Session ${sessionId} failed. Gemini API error:\n${body.error_message ?? '(no message)'}\n\n` +
            `Tip: if the Docker backend uses a deprecated model, set E2E_COMPLETED_SESSION=<session-id>:<project-id> ` +
            `to a pre-existing completed session and re-run.`,
          )
        }
      }
    }

    if (status !== 'completed') {
      throw new Error(`Session ${sessionId} did not complete within 90s (status: ${status})`)
    }

    await use({ id: project.id, completedSessionId: sessionId })

    // Cleanup: deleting the project cascades to sessions
    await fetch(`${API_BASE}/projects/${project.id}`, {
      method: 'DELETE',
      headers: authHeader,
    }).catch(() => {/* ignore cleanup errors */})
  },
})

export { expect } from '@playwright/test'
