export type Project = {
  id: string; name: string; description: string; repositoryUrl: string;
  defaultBranch: string; instructions: string; createdAt: string;
  repositoryVerifiedAt?: string | null; testImage?: string; testCommand?: string; autoStartTasks?: boolean;
}
export type ProjectInput = Omit<Project, 'id' | 'createdAt' | 'repositoryVerifiedAt'>
export type Agent = { id: string; name: string; role: 'ProductManager' | 'Developer' | 'Reviewer'; modelProfile: string }
export type ProjectDetails = { project: Project; team: Agent[] }
export type Message = { id: string; senderId?: string; senderType: 'User' | 'Agent' | 'System'; content: string; messageType: string; createdAt: string }
export type AgentRun = { id: string; agentDefinitionId?: string; status: 'Queued' | 'Running' | 'Completed' | 'Failed' | 'Cancelled' | 'WaitingForTool'; model: string; inputTokens: number; outputTokens: number; error: string | null; taskId: string | null }
export type DevelopmentTask = { id: string; title: string; description: string; acceptanceCriteria: string; status: string; createdAt: string; branch?: string | null; commit?: string | null; pullRequestUrl?: string | null }
export type ExecutionJob = { id: string; taskId: string; status: string; error?: string | null }
export type Review = { id: string; status: string; summary: string }
export type ToolExecution = { id: string; tool: string; summary: string; succeeded: boolean }
export type TaskExecutionDetails = { task: DevelopmentTask; reviews: Review[]; runs: AgentRun[]; tools: ToolExecution[]; job: ExecutionJob | null }
export type PlanningWorkspace = { messages: Message[]; tasks: DevelopmentTask[]; runs: AgentRun[]; executionJobs?: ExecutionJob[] }

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...options?.headers } })
  if (!response.ok) {
    const problem = await response.json().catch(() => null)
    throw new Error(problem?.detail || 'Unable to reach Buildra. Check that the API and database are running.')
  }
  const body = await response.text()
  return body.trim() ? JSON.parse(body) as T : undefined as T
}
export const api = {
  projects: () => request<Project[]>('/projects'),
  project: (id: string) => request<ProjectDetails>(`/projects/${id}`),
  create: (input: ProjectInput) => request<Project>('/projects', { method: 'POST', body: JSON.stringify(input) }),
  update: (id: string, input: ProjectInput) => request<Project>(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(input) }),
  remove: (id: string) => request<void>(`/projects/${id}`, { method: 'DELETE' }),
  planning: (id: string) => request<PlanningWorkspace>(`/projects/${id}/planning/`),
  submitRequest: (id: string, content: string) => request<AgentRun>(`/projects/${id}/planning/requests`, { method: 'POST', body: JSON.stringify({ content }) }),
  retryRun: (id: string, runId: string) => request<void>(`/projects/${id}/planning/runs/${runId}/retry`, { method: 'POST' }),
  verifyRepository: (id: string) => request<{ id: number; fullName: string; defaultBranch: string }>(`/projects/${id}/repository/verify`, { method: 'POST' }),
  executeTask: (id: string, taskId: string) => request<void>(`/projects/${id}/tasks/${taskId}/execute`, { method: 'POST' }),
  taskDetails: (id: string, taskId: string) => request<TaskExecutionDetails>(`/projects/${id}/tasks/${taskId}`),
}
