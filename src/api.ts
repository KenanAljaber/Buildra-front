export type Project = {
  id: string; name: string; description: string; repositoryUrl: string;
  defaultBranch: string; instructions: string; createdAt: string;
}
export type ProjectInput = Omit<Project, 'id' | 'createdAt'>
export type Agent = { id: string; name: string; role: 'ProductManager' | 'Developer' | 'Reviewer'; modelProfile: string }
export type ProjectDetails = { project: Project; team: Agent[] }
export type Message = { id: string; senderType: 'User' | 'Agent' | 'System'; content: string; messageType: string; createdAt: string }
export type AgentRun = { id: string; status: 'Queued' | 'Running' | 'Completed' | 'Failed' | 'Cancelled' | 'WaitingForTool'; model: string; inputTokens: number; outputTokens: number; error: string | null; taskId: string | null }
export type DevelopmentTask = { id: string; title: string; description: string; acceptanceCriteria: string; status: string; createdAt: string }
export type PlanningWorkspace = { messages: Message[]; tasks: DevelopmentTask[]; runs: AgentRun[] }

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...options?.headers } })
  if (!response.ok) {
    const problem = await response.json().catch(() => null)
    throw new Error(problem?.detail || 'Unable to reach Buildra. Check that the API and database are running.')
  }
  return response.status === 204 ? undefined as T : response.json()
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
}
