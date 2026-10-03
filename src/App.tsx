import { useState } from 'react'
import { BrowserRouter, Link, NavLink, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { QueryClient, QueryClientProvider, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ArrowUpRight, Boxes, ChevronRight, FolderGit2, GitBranch, Plus, Settings2, Sparkles, Users, X } from 'lucide-react'
import { api } from './api'
import type { ProjectInput } from './api'
import { ProjectForm } from './components/ProjectForm'
import { PlanningPanel } from './components/PlanningPanel'
import { LiveTeam } from './components/LiveTeam'

const client = new QueryClient({ defaultOptions: { queries: { retry: 1 } } })

function Shell() {
  return <div className="app"><aside className="sidebar">
    <Link to="/projects" className="brand"><span className="brand-icon"><Boxes size={23}/></span>buildra<span className="brand-dot">.</span></Link>
    <div className="company"><span className="company-avatar">M</span><div>My company<small>Personal workspace</small></div></div>
    <p className="nav-label">WORKSPACE</p><NavLink to="/projects" className="nav-item"><FolderGit2 size={18}/>Projects<ChevronRight size={14}/></NavLink>
    <div className="sidebar-note"><Sparkles size={18}/><strong>Your ideas. Your AI team.</strong><p>A dedicated team for every project you build.</p><span className="tag">Plan · Develop · Review</span></div>
    <div className="owner"><span className="owner-avatar">K</span><div>Local owner<small>Workspace administrator</small></div><span className="online-dot"/></div>
  </aside><div className="main"><header className="topbar"><span>Workspace <ChevronRight size={14}/> Projects</span><span className="local-badge"><span className="online-dot"/>Local workspace</span></header>
    <Routes><Route path="/projects" element={<Projects/>}/><Route path="/projects/:id" element={<Dashboard/>}/><Route path="*" element={<Navigate to="/projects" replace/>}/></Routes>
  </div></div>
}
function Projects() {
  const [creating, setCreating] = useState(false)
  const query = useQuery({ queryKey: ['projects'], queryFn: api.projects })
  const cache = useQueryClient()
  const navigate = useNavigate()
  const create = useMutation({ mutationFn: api.create, onSuccess: project => { void cache.invalidateQueries({ queryKey: ['projects'] }); navigate(`/projects/${project.id}`) } })
  return <main className="content"><div className="page-heading"><div><p className="eyebrow">YOUR SOFTWARE COMPANY</p><h1>Projects</h1><p className="subtitle">A home for your code, your ideas, and the team that builds them.</p></div><button onClick={() => { create.reset(); setCreating(true) }}><Plus size={17}/>New project</button></div>
    <div className="overview"><div><span className="stat-icon"><FolderGit2 size={20}/></span><div><strong>{query.data?.length ?? '—'}</strong><span>Total projects</span></div></div><div><span className="stat-icon lilac"><Users size={20}/></span><div><strong>{query.data ? query.data.length * 3 : '—'}</strong><span>Assigned agents</span></div></div><div className="workflow-overview"><span className="stat-icon peach"><GitBranch size={20}/></span><div><strong>One clear workflow</strong><span>Plan → Develop → Review</span></div></div></div>
    <div className="section-title"><h2>All projects</h2><span className="muted">{query.data?.length ?? 0} projects</span></div>
    {query.isPending && <div className="empty" role="status">Loading your projects…</div>}
    {query.isError && <div className="empty"><h2>Couldn’t load your projects</h2><p className="error" role="alert">{query.error.message}</p><button className="secondary" onClick={() => void query.refetch()}>Try again</button></div>}
    {query.data?.length === 0 && <div className="empty"><span className="empty-icon"><FolderGit2 size={34}/></span><h2>Every great product starts here.</h2><p>Create your first project and give your AI team a place to work.</p><button onClick={() => setCreating(true)}><Plus size={17}/>Create your first project</button></div>}
    <div className="project-grid">{query.data?.map(project => <Link className="project-card" key={project.id} to={`/projects/${project.id}`}><div className="card-top"><span className="project-avatar">{project.name.slice(0, 1).toUpperCase()}</span><ArrowUpRight size={19}/></div><h2>{project.name}</h2><p>{project.description || 'Your next project, ready to take shape.'}</p><div className="repo"><FolderGit2 size={14}/>{new URL(project.repositoryUrl).pathname.slice(1)}</div><div className="card-footer"><div className="avatar-stack"><span>S</span><span>A</span><span>D</span></div><span>3 agents</span><span className="branch"><GitBranch size={13}/>{project.defaultBranch}</span></div></Link>)}</div>
    {creating && <div className="modal-backdrop"><section className="modal" role="dialog" aria-modal="true" aria-labelledby="create-title"><div className="modal-heading"><div><h2 id="create-title">Create a project</h2><p>Your PM, Developer, and Reviewer will be assigned automatically.</p></div><button className="icon-button" aria-label="Close" onClick={() => setCreating(false)}><X size={20}/></button></div><ProjectForm pending={create.isPending} error={create.error} onSubmit={input => create.mutate(input)} onCancel={() => setCreating(false)}/></section></div>}
  </main>
}
function Dashboard() {
  const { id = '' } = useParams()
  const query = useQuery({ queryKey: ['project', id], queryFn: () => api.project(id) })
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const cache = useQueryClient()
  const navigate = useNavigate()
  const update = useMutation({ mutationFn: (input: ProjectInput) => api.update(id, input), onSuccess: () => { setEditing(false); void cache.invalidateQueries({ queryKey: ['project', id] }); void cache.invalidateQueries({ queryKey: ['projects'] }) } })
  const remove = useMutation({ mutationFn: () => api.remove(id), onSuccess: () => { void cache.invalidateQueries({ queryKey: ['projects'] }); navigate('/projects') } })
  const verify = useMutation({ mutationFn: () => api.verifyRepository(id), onSuccess: () => void cache.invalidateQueries({ queryKey: ['project', id] }) })
  if (query.isPending) return <main className="content" role="status">Loading project…</main>
  if (query.isError) return <main className="content"><Link to="/projects">Back to projects</Link><p role="alert" className="error">{query.error.message}</p></main>
  const { project, team } = query.data
  return <main className="content"><Link to="/projects" className="back-link"><ArrowLeft size={15}/>All projects</Link><div className="page-heading"><div><p className="eyebrow">PROJECT OVERVIEW</p><h1>{project.name}</h1><p className="subtitle">{project.description || 'A new home for your next idea.'}</p></div><button className="secondary" onClick={() => { update.reset(); setEditing(true) }}><Settings2 size={16}/>Edit project</button></div>
    <div className="repository-panel"><div><span className="stat-icon"><FolderGit2 size={21}/></span><div><small>REPOSITORY</small><a href={project.repositoryUrl} target="_blank" rel="noreferrer">{new URL(project.repositoryUrl).pathname.slice(1)}<ArrowUpRight size={15}/></a></div></div><span className="branch"><GitBranch size={15}/>{project.defaultBranch}</span><span className="tag">{project.repositoryVerifiedAt ? 'Access verified' : 'Access not verified'}</span><button className="secondary" disabled={verify.isPending} onClick={() => verify.mutate()}>{verify.isPending ? 'Verifying…' : 'Verify repository'}</button></div>
    {verify.error && <p className="error" role="alert">{verify.error.message}</p>}
    <LiveTeam projectId={id} team={team}/>
    <PlanningPanel projectId={id} team={team} repositoryVerified={!!project.repositoryVerifiedAt}/>
    <section className="panel"><h2>Project context</h2><p className="instructions">{project.instructions || 'No project instructions yet. Add architecture notes and conventions to help your team understand the project.'}</p><div className="activity-item"><span className="online-dot"/><div>Project created<small>{new Date(project.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</small></div></div></section>
    <button className="text-danger" onClick={() => setDeleting(true)}>Delete project</button>
    {editing && <div className="modal-backdrop"><section className="modal" role="dialog" aria-modal="true" aria-labelledby="edit-title"><div className="modal-heading"><h2 id="edit-title">Edit project</h2></div><ProjectForm initial={project} pending={update.isPending} error={update.error} onSubmit={input => update.mutate(input)} onCancel={() => setEditing(false)}/></section></div>}
    {deleting && <div className="modal-backdrop"><section className="modal" role="dialog" aria-modal="true" aria-labelledby="delete-title"><h2 id="delete-title">Delete {project.name}?</h2><p>This removes this project's Buildra records. Your GitHub repository will remain available.</p>{remove.error && <p role="alert" className="error">{remove.error.message}</p>}<div className="form-actions"><button className="secondary" onClick={() => setDeleting(false)}>Cancel</button><button className="danger" disabled={remove.isPending} onClick={() => remove.mutate()}>{remove.isPending ? 'Deleting…' : 'Delete project'}</button></div></section></div>}
  </main>
}
export default function App() { return <QueryClientProvider client={client}><BrowserRouter><Shell/></BrowserRouter></QueryClientProvider> }
