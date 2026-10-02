import { test, expect } from '@playwright/test'

test('project creation opens the assigned team dashboard', async ({ page }) => {
  const project = { id: 'project-1', name: 'Editra', description: 'Video editing', repositoryUrl: 'https://github.com/owner/editra', defaultBranch: 'main', instructions: 'Keep changes focused.', createdAt: '2026-10-02T10:00:00Z' }
  await page.route('**/api/projects', async route => {
    if (route.request().method() === 'POST') {
      expect(route.request().postDataJSON()).toMatchObject({ name: 'Editra', repositoryUrl: project.repositoryUrl })
      await route.fulfill({ status: 201, json: project })
    } else await route.fulfill({ json: [] })
  })
  await page.route('**/api/projects/project-1', route => route.fulfill({ json: { project, team: [
    { id: 'pm', name: 'Sarah', role: 'ProductManager' }, { id: 'dev', name: 'Alex', role: 'Developer' }, { id: 'review', name: 'Daniel', role: 'Reviewer' },
  ] } }))
  await page.route('**/api/projects/project-1/planning/', route => route.fulfill({ json: { messages: [], tasks: [], runs: [] } }))
  await page.goto('/projects')
  await expect(page.getByText('Every great product starts here.')).toBeVisible()
  await page.getByRole('button', { name: 'New project', exact: true }).click()
  await page.getByLabel('Project name').fill('Editra')
  await page.getByLabel('GitHub repository').fill(project.repositoryUrl)
  await page.getByRole('button', { name: 'Save project' }).click()
  await expect(page.getByRole('heading', { name: 'Editra', exact: true })).toBeVisible()
  await expect(page.getByText('Sarah', { exact: true })).toBeVisible()
  await expect(page.getByText('Alex', { exact: true })).toBeVisible()
  await expect(page.getByText('Daniel', { exact: true })).toBeVisible()
  await page.screenshot({ path: 'test-results/dashboard.png', fullPage: true })
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.getByRole('heading', { name: 'Editra', exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.screenshot({ path: 'test-results/dashboard-mobile.png', fullPage: true })
})

test('API failures surface an actionable error', async ({ page }) => {
  await page.route('**/api/projects', route => route.fulfill({ status: 503, json: { detail: 'Database is unavailable.' } }))
  await page.goto('/projects')
  await expect(page.getByRole('alert')).toHaveText('Database is unavailable.')
  await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible()
})
