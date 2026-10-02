export type Project = {
  id: string; name: string; description: string; repositoryUrl: string;
  defaultBranch: string; instructions: string; createdAt: string;
}
export type ProjectInput = Omit<Project, 'id' | 'createdAt'>
export type Agent = { id: string; name: string; role: 'ProductManager' | 'Developer' | 'Reviewer'; modelProfile: string }
export type ProjectDetails = { project: Project; team: Agent[] }

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
}
