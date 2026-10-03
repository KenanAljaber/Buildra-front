import { test, expect } from '@playwright/test'

test('live team shows model recovery, tool activity, and worker disconnection', async ({ page }) => {
  let online = true
  const createdAt = '2026-10-03T08:00:00Z'
  const project = { id: 'project-1', name: 'Snake', repositoryUrl: 'https://github.com/owner/repo', defaultBranch: 'main', createdAt, repositoryVerifiedAt: createdAt }
  const team = [{ id: 'pm', name: 'Sarah', role: 'ProductManager' }, { id: 'dev', name: 'Alex', role: 'Developer' }, { id: 'review', name: 'Daniel', role: 'Reviewer' }]
  const task = { id: 'task-1', title: 'Implement multiplayer lobby', description: 'Connect two players.', acceptanceCriteria: 'Two players can join.', status: 'InDevelopment', createdAt }
  const run = { id: 'run-1', taskId: task.id, agentDefinitionId: 'dev', status: 'Running', activity: 'Recovering automatically (1/2): The generated action exceeded its output limit.', step: 3, recoveries: 1, inputTokens: 100, outputTokens: 8000, model: 'test-model', startedAt: createdAt }
  await page.route('**/api/status', route => route.fulfill({ json: { workerOnline: online, lastHeartbeat: createdAt } }))
  await page.route('**/api/projects/project-1', route => route.fulfill({ json: { project, team } }))
  await page.route('**/api/projects/project-1/planning/', route => route.fulfill({ json: { messages: [], tasks: [task], runs: [run], executionJobs: [{ id: 'job-1', taskId: task.id, status: 'Running' }] } }))
  await page.route('**/api/projects/project-1/tasks/task-1', route => route.fulfill({ json: { task, job: { status: 'Running' }, runs: [run], reviews: [], tools: [{ id: 'tool-1', tool: 'writeFile', succeeded: true, summary: 'server.js saved', occurredAt: createdAt }] } }))
  await page.goto('/projects/project-1')
  await expect(page.getByText('Worker connected', { exact: true })).toBeVisible()
  const developer = page.locator('.live-agent').filter({ has: page.getByRole('heading', { name: 'Alex', exact: true }) })
  await expect(developer).toContainText('Working')
  await expect(developer).toContainText('Step 3/24')
  await expect(developer).toContainText('Recovering automatically')
  await expect(page.locator('.current-action')).toContainText('Recovering automatically')
  await expect(page.locator('.activity-event')).toContainText('server.js saved')
  await page.screenshot({ path: 'test-results/live-agents.png', fullPage: true })
  online = false
  await page.getByRole('button', { name: 'Refresh agent status' }).click()
  await expect(page.getByText('Worker offline', { exact: true })).toBeVisible()
  await expect(developer).toContainText('Disconnected')
})
