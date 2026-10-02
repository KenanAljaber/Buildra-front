import { test, expect } from '@playwright/test'

test('request transitions from queued to a persisted PM task', async ({ page }) => {
  const project = { id: 'project-1', name: 'Editra', description: '', repositoryUrl: 'https://github.com/owner/repo', defaultBranch: 'main', instructions: '', createdAt: '2026-10-02T10:00:00Z' }
  let submitted = false
  let completed = false
  await page.route('**/api/projects/project-1', route => route.fulfill({ json: { project, team: [] } }))
  await page.route('**/api/projects/project-1/planning/', route => route.fulfill({ json: {
    messages: submitted ? [{ id: 'user-1', senderType: 'User', content: 'Add project search', messageType: 'User', createdAt: project.createdAt }, ...(completed ? [{ id: 'pm-1', senderType: 'Agent', content: 'I created a search task.', messageType: 'Team', createdAt: project.createdAt }] : [])] : [],
    runs: submitted ? [{ id: 'run-1', status: completed ? 'Completed' : 'Queued', model: completed ? 'test-model' : '', inputTokens: 100, outputTokens: 50, error: null }] : [],
    tasks: completed ? [{ id: 'task-1', title: 'Add project search', description: 'Filter the project list by name.', acceptanceCriteria: '- Matching projects are shown\n- Clearing search restores all projects', status: 'Ready', createdAt: project.createdAt }] : [],
  } }))
  await page.route('**/api/projects/project-1/planning/requests', async route => {
    expect(route.request().postDataJSON()).toEqual({ content: 'Add project search' })
    submitted = true
    await route.fulfill({ status: 202, json: { id: 'run-1', status: 'Queued' } })
  })
  await page.goto('/projects/project-1')
  await page.getByLabel('Your request', { exact: true }).fill('Add project search')
  await page.getByRole('button', { name: 'Send request' }).click()
  await expect(page.getByRole('status')).toContainText('Request queued')
  completed = true
  await expect(page.getByText('I created a search task.')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Add project search' })).toBeVisible()
  await expect(page.getByText('Acceptance criteria', { exact: true })).toBeVisible()
  await expect(page.getByText('Completed', { exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Add project search' })).toBeVisible()
  await page.screenshot({ path: 'test-results/pm-planning.png', fullPage: true })
})

test('failed PM run offers retry and preserves request', async ({ page }) => {
  let retried = false
  await page.route('**/api/projects/project-1', route => route.fulfill({ json: { project: { id: 'project-1', name: 'Editra', repositoryUrl: 'https://github.com/owner/repo', defaultBranch: 'main', createdAt: '2026-10-02T10:00:00Z' }, team: [] } }))
  await page.route('**/api/projects/project-1/planning/', route => route.fulfill({ json: { messages: [], tasks: [], runs: [{ id: 'run-1', status: retried ? 'Queued' : 'Failed', model: '', inputTokens: 0, outputTokens: 0, error: retried ? null : 'OpenAI is not configured.' }] } }))
  await page.route('**/api/projects/project-1/planning/runs/run-1/retry', async route => { retried = true; await route.fulfill({ status: 202 }) })
  await page.goto('/projects/project-1')
  await expect(page.getByText('OpenAI is not configured.')).toBeVisible()
  await page.getByRole('button', { name: 'Retry request' }).click()
  await expect(page.getByRole('status')).toContainText('Request queued')
})
