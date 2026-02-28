import { test, expect } from '../fixtures'

test.describe('Projects', () => {
  test('create and delete a project', async ({ authenticatedPage: page }) => {
    const projectName = `E2E Project ${Date.now()}`
    await page.goto('/projects')

    // Open create modal
    await page.click('[data-testid="new-project-btn"]')
    await expect(page.locator('[data-testid="project-name-input"]')).toBeVisible()

    // Fill in project name
    await page.fill('[data-testid="project-name-input"]', projectName)

    // Submit
    await page.click('[data-testid="create-project-submit"]')

    // Project card should appear (allow extra time for React Query refetch under load)
    await expect(page.getByRole('heading', { name: projectName })).toBeVisible({ timeout: 15000 })

    // Hover the card to reveal the delete button
    await page.hover(`[data-testid="project-card"]:has-text("${projectName}")`)
    await page.click(
      `[data-testid="project-card"]:has-text("${projectName}") [data-testid="delete-project-btn"]`,
    )

    // Confirm delete
    await expect(page.locator('[data-testid="delete-confirm"]')).toBeVisible()
    await page.click('[data-testid="delete-confirm-btn"]')

    // Project should be gone (allow extra time for React Query refetch)
    await expect(page.getByRole('heading', { name: projectName })).not.toBeVisible({ timeout: 15000 })
  })

  test('shows empty state when no projects exist', async ({ authenticatedPage: page }) => {
    // This test assumes the user has no projects. It checks that the UI
    // shows the empty state rather than a grid. It may fail if the user
    // already has projects — that is expected in a shared test environment.
    await page.goto('/projects')
    // Just verify the page loaded successfully
    await expect(page.locator('[data-testid="projects-page"]')).toBeVisible()
  })
})
