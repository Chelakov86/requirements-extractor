import { test, expect } from '../fixtures'

test.describe('Extraction error flows', () => {
  test('shows error for oversized file', async ({ authenticatedPage: page, testProject }) => {
    await page.goto(`/projects/${testProject.id}/sessions/new`)

    // Switch to the files tab
    await page.click('button:has-text("Dateien hochladen")')

    // Upload a 31 MB fake PDF (exceeds the 30 MB per-file limit)
    const bigFile = {
      name: 'big.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.alloc(31 * 1024 * 1024),
    }
    await page.setInputFiles('[data-testid="file-input"]', bigFile)

    // The file chip should show the "überschreitet das Maximum" error text
    await expect(page.locator('text=überschreitet das Maximum')).toBeVisible()

    // The submit button must be disabled when there are oversized files
    await expect(page.locator('button:has-text("Extraktion starten")')).toBeDisabled()
  })

  test('delete item and undo within 5 seconds', async ({ authenticatedPage: page, testProject }) => {
    await page.goto(`/sessions/${testProject.completedSessionId}`)

    // Wait for at least one user story card to appear
    await expect(page.locator('[data-testid="user-story-card"]').first()).toBeVisible({
      timeout: 15000,
    })

    // Count cards before delete
    const countBefore = await page.locator('[data-testid="user-story-card"]').count()

    // Click delete on the first story
    await page.locator('[data-testid="delete-story-btn"]').first().click()

    // Item should be removed from the list immediately (optimistic)
    await expect(page.locator('[data-testid="user-story-card"]')).toHaveCount(countBefore - 1)

    // Undo toast should appear
    await expect(page.locator('[data-testid="undo-toast"]')).toBeVisible()

    // Click undo to restore the item
    await page.click('text=Rückgängig')

    // Item should be restored — count back to original
    await expect(page.locator('[data-testid="user-story-card"]')).toHaveCount(countBefore)
  })

  test('manually add a user story', async ({ authenticatedPage: page, testProject }) => {
    await page.goto(`/sessions/${testProject.completedSessionId}`)

    // Wait for the session results to load
    await expect(page.locator('[data-testid="user-story-card"]').first()).toBeVisible({
      timeout: 15000,
    })

    // Open the add-story form
    await page.click('button:has-text("User Story hinzufügen")')

    // Fill in the new story fields
    await page.fill('[data-testid="new-story-title"]', 'Manuell erstellte Story')
    await page.fill('[data-testid="new-story-as-who"]', 'Admin')
    await page.fill('[data-testid="new-story-i-want"]', 'Nutzer verwalten können')
    await page.fill('[data-testid="new-story-so-that"]', 'Zugriffe gesteuert werden können')

    // Submit the form
    await page.click('button:has-text("Hinzufügen")')

    // The new story's title should appear in the list
    await expect(page.locator('text=Manuell erstellte Story')).toBeVisible()
  })
})

test.describe('Extraction flow', () => {
  test('full extraction flow with text input', async ({ authenticatedPage: page, testProject }) => {
    // Part 1: test the submission UI flow using the pre-created project
    await page.goto(`/projects/${testProject.id}/sessions/new`)

    // Text tab is active by default — click it to be explicit
    await page.click('[data-testid="tab-text"]')

    const sampleText =
      'Als Kunde möchte ich meine Bestellungen online verfolgen können, ' +
      'damit ich jederzeit den aktuellen Status meiner Lieferung sehe. ' +
      'Das System muss dabei eine Antwortzeit von unter 2 Sekunden garantieren.'
    await page.fill('[data-testid="text-input"]', sampleText)

    // Output language defaults to Deutsch (de) — no change needed

    // Submit the extraction
    await page.click('[data-testid="submit-btn"]')

    // Should navigate to session detail page and immediately show the progress screen
    await expect(page).toHaveURL(/\/sessions\//)
    await expect(page.locator('text=Dokument wird analysiert')).toBeVisible({ timeout: 10000 })

    // Part 2: verify results UI using the fixture's pre-completed session
    // (avoids waiting for a second Gemini API call, which would exceed timeout budgets)
    await page.goto(`/sessions/${testProject.completedSessionId}`)

    // Tab bar appears once the completed session data is loaded
    await expect(page.getByRole('button', { name: /User Stories/ })).toBeVisible({
      timeout: 15000,
    })

    // Verify at least 1 user story was extracted (count in parentheses is not "(0)")
    const userStoriesTab = page.getByRole('button', { name: /User Stories/ })
    await expect(userStoriesTab).not.toContainText('(0)')
  })

  test('edit a user story and save', async ({ authenticatedPage: page, testProject }) => {
    // Navigate to a completed session (pre-created in fixture)
    await page.goto(`/sessions/${testProject.completedSessionId}`)

    // Wait for the results to load (tab bar appears once session data is ready)
    await expect(page.getByRole('button', { name: /User Stories/ })).toBeVisible({
      timeout: 15000,
    })

    // Click edit on the first user story (aria-label="Bearbeiten")
    const editBtn = page.getByRole('button', { name: 'Bearbeiten' }).first()
    await editBtn.click()

    // Edit mode card should be visible
    await expect(page.locator('[data-testid="user-story-card-edit"]')).toBeVisible()

    // Clear and update the title field (first text input inside the edit card)
    const titleInput = page
      .locator('[data-testid="user-story-card-edit"]')
      .locator('input[type="text"]')
      .first()
    await titleInput.fill('Bearbeiteter Titel')

    // Confirm the inline edit (marks item as dirty)
    await page.locator('[data-testid="user-story-card-edit"]').getByRole('button', { name: 'Fertig' }).click()

    // Click the global save button (now enabled since isDirty=true)
    await page.click('[data-testid="save-button"]')

    // Verify saved state — button shows "Gespeichert ✓"
    await expect(page.locator('[data-testid="save-button"]')).toContainText('Gespeichert')
    await expect(page.locator('text=Bearbeiteter Titel')).toBeVisible()
  })
})
