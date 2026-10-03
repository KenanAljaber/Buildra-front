import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => { await page.route('**/api/status', route => route.fulfill({ json: { workerOnline: true, lastHeartbeat: new Date().toISOString() } })) })

test('repository verification enables execution and exposes reviewed PR history', async ({ page }) => {
  const project = { id: 'project-1', name: 'Snake', description: '', repositoryUrl: 'https://github.com/owner/repo', defaultBranch: 'main', instructions: '', createdAt: '2026-10-02T10:00:00Z', repositoryVerifiedAt: null as string | null }
  const task = { id: 'task-1', title: 'Add snake movement', description: 'Implement movement.', acceptanceCriteria: 'Movement tests pass.', status: 'Ready', createdAt: project.createdAt, branch: 'buildra/task-1', commit: 'abcdef1234567890', pullRequestUrl: '' }
  let started = false
  let completed = false
  await page.route('**/api/projects/project-1', route => route.fulfill({ json: { project, team: [] } }))
  await page.route('**/api/projects/project-1/repository/verify', async route => {
    project.repositoryVerifiedAt = project.createdAt
    await route.fulfill({ json: { id: 1, fullName: 'owner/repo', defaultBranch: 'main' } })
  })
  await page.route('**/api/projects/project-1/planning/', route => route.fulfill({ json: { messages: [], tasks: [task], runs: [], executionJobs: started ? [{ id: 'job-1', taskId: task.id, status: completed ? 'Completed' : 'Queued', error: null }] : [] } }))
  await page.route('**/api/projects/project-1/tasks/task-1/execute', async route => {
    started = true
    await route.fulfill({ status: 202 })
  })
  await page.route('**/api/projects/project-1/tasks/task-1', route => route.fulfill({ json: { task, job: { status: 'Completed' }, runs: [], reviews: [{ id: 'review-1', status: 'Approved', summary: 'Movement and independent tests pass.' }], tools: [{ id: 'tool-1', tool: 'runTests', summary: 'Tests passed.', succeeded: true }] } }))
  await page.goto('/projects/project-1')
  await expect(page.getByRole('button', { name: 'Start implementation' })).toBeDisabled()
  await page.getByRole('button', { name: 'Verify repository' }).click()
  await expect(page.getByText('Access verified', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Start implementation' }).click()
  await expect(page.getByText('Queued', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Start implementation' })).toHaveCount(0)
  completed = true
  task.status = 'Completed'
  task.pullRequestUrl = 'https://github.com/owner/repo/pull/1'
  await expect(page.getByRole('link', { name: 'Open reviewed pull request' })).toHaveAttribute('href', task.pullRequestUrl)
  await page.getByRole('button', { name: 'View implementation history' }).click()
  await page.getByRole('tab', { name: 'Reviews', exact: true }).click()
  await expect(page.getByText('Movement and independent tests pass.')).toBeVisible()
  await page.getByRole('tab', { name: 'Activity', exact: true }).click()
  await expect(page.locator('.activity-event')).toContainText('Tests passed.')
  await expect(page.getByText('runTests', { exact: true })).toBeVisible()
})
