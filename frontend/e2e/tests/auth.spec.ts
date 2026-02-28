import { test, expect } from '@playwright/test'

const TEST_EMAIL = process.env.TEST_USER_EMAIL ?? 'test@test.com'
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD ?? 'test123'

test.describe('Authentication', () => {
  test('login with valid credentials', async ({ page }) => {
    await page.goto('/login')
    await page.fill('#email', TEST_EMAIL)
    await page.fill('#password', TEST_PASSWORD)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/projects')
  })

  test('login with wrong password shows error', async ({ page }) => {
    await page.goto('/login')
    await page.fill('#email', 'user@example.com')
    await page.fill('#password', 'wrongpassword')
    await page.click('button[type="submit"]')
    await expect(page.locator('[data-testid="login-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="login-error"]')).toContainText('Passwort falsch')
  })

  test('protected page redirects unauthenticated user', async ({ page }) => {
    await page.goto('/projects')
    await expect(page).toHaveURL('/login')
  })
})
