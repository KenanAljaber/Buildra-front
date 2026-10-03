import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Send, MessageSquare, ListChecks } from 'lucide-react'
import { api } from '../api'
import type { Agent } from '../api'
import { TaskDetails } from './TaskDetails'

export function PlanningPanel({ projectId, team = [], repositoryVerified = false }: { projectId: string; team?: Agent[]; repositoryVerified?: boolean }) {
  const [content, setContent] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const cache = useQueryClient()
  const key = ['planning', projectId]
  const query = useQuery({ queryKey: key, queryFn: () => api.planning(projectId), refetchInterval: 2000 })
  const submit = useMutation({ mutationFn: () => api.submitRequest(projectId, content), onSuccess: () => { setContent(''); void cache.invalidateQueries({ queryKey: key }) } })
  const retry = useMutation({ mutationFn: (runId: string) => api.retryRun(projectId, runId), onSuccess: () => void cache.invalidateQueries({ queryKey: key }) })
  const execute = useMutation({ mutationFn: (taskId: string) => api.executeTask(projectId, taskId), onSettled: () => { void cache.invalidateQueries({ queryKey: key }); void cache.invalidateQueries({ queryKey: ['task', projectId] }) } })
  const active = query.data?.runs.filter(run => run.status === 'Queued' || run.status === 'Running') ?? []
  const runs = query.data?.runs ?? []
  const latestRuns = runs.filter((run, index) => !runs.slice(0, index).some(previous => previous.agentDefinitionId === run.agentDefinitionId))
  const previousRuns = runs.filter(run => !latestRuns.includes(run))
  return <div className="planning-grid">
    <section className="panel planning-chat"><div className="section-title"><h2><MessageSquare size={17}/>Talk to your PM</h2><span className="tag">Sarah · Product Manager</span></div>
      <p className="planning-note">Describe a change. Your PM plans a task; the Developer implements it and the Reviewer validates it before a GitHub pull request.</p>
      {query.isPending && <p role="status">Loading conversation…</p>}
      {query.error && <p role="alert" className="error">{query.error.message}</p>}
      <div className="messages" aria-live="polite" aria-label="Project conversation">
        {query.data?.messages.length === 0 && <div className="conversation-empty">What would you like your team to build?</div>}
        {query.data?.messages.map(message => <article className={`message message-${message.senderType.toLowerCase()}`} key={message.id}><div className="message-heading"><strong>{message.senderType === 'User' ? 'You' : message.senderType === 'Agent' ? team.find(agent => agent.id === message.senderId)?.name ?? 'Sarah' : 'Buildra'}</strong><time>{new Date(message.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</time></div><p>{message.content}</p>{message.messageType === 'ActionRequired' && <span className="tag">Action required</span>}</article>)}
      </div>
      {active.length > 0 && <p role="status" className="planning-note">{active.some(r => r.status === 'Running') ? 'Your team is working on this project…' : 'Request queued. Waiting for the worker…'}</p>}
      <form className="request-form" onSubmit={event => { event.preventDefault(); if (content.trim()) submit.mutate() }}><label htmlFor="pm-request">Your request</label><textarea id="pm-request" rows={3} maxLength={8000} required value={content} onChange={event => setContent(event.target.value)} placeholder="For example: Add a search field to the project list."/><div className="form-actions"><button disabled={submit.isPending || !content.trim() || query.isError}><Send size={14}/>{submit.isPending ? 'Sending…' : 'Send request'}</button></div></form>
      {submit.error && <p className="error" role="alert">{submit.error.message}</p>}
    </section>
    <section className="panel"><div className="section-title"><h2><ListChecks size={17}/>Tasks & runs</h2><span className="muted">{query.data?.tasks.length ?? 0} tasks</span></div>
      {query.data?.tasks.length === 0 && <p className="planning-note">Tasks will appear when planning finishes. Verify your repository before starting implementation.</p>}
      {query.data?.tasks.map(task => {
        const job = query.data?.executionJobs?.find(job => job.taskId === task.id)
        const busy = job?.status === 'Queued' || job?.status === 'Running'
        return <article className="planned-task" key={task.id}><div className="section-title"><h3>{task.title}</h3><span className="tag">{busy ? job.status : task.status}</span></div><p>{task.description}</p><strong>Acceptance criteria</strong><p className="criteria">{task.acceptanceCriteria}</p>
          {(['Ready', 'Failed', 'ChangesRequested'].includes(task.status) && !busy) && <button className="secondary" disabled={!repositoryVerified || execute.isPending} title={!repositoryVerified ? 'Verify repository access first' : undefined} onClick={() => execute.mutate(task.id)}>{task.status === 'Failed' ? 'Retry implementation' : 'Start implementation'}</button>}
          {task.pullRequestUrl && <a className="pr-link" href={task.pullRequestUrl} target="_blank" rel="noreferrer">Open reviewed pull request ↗</a>}
          <button className="detail-button" onClick={() => setExpanded(expanded === task.id ? null : task.id)}>{expanded === task.id ? 'Hide history' : 'View implementation history'}</button>
          {(expanded === task.id || busy) && <TaskDetails projectId={projectId} taskId={task.id} compact={expanded !== task.id}/>}
        </article>
      })}
      {execute.error && <p className="error" role="alert">{execute.error.message}</p>}
      {query.data?.runs.length ? <h3 className="runs-title">Agent runs</h3> : null}
      {latestRuns.map(run => <article className="run-item" key={run.id}><div><strong>{team.find(agent => agent.id === run.agentDefinitionId)?.name ?? 'PM planning'}</strong><span className={`run-status status-${run.status.toLowerCase()}`}>{run.status}</span></div>{run.activity && run.status === 'Running' && <p>{run.activity}</p>}{run.model && <p className="planning-note">{run.model} · {run.inputTokens.toLocaleString()} input / {run.outputTokens.toLocaleString()} output tokens</p>}{run.error && <p className="error">{run.error}</p>}{run.status === 'Failed' && !run.taskId && <button className="secondary" disabled={retry.isPending} onClick={() => retry.mutate(run.id)}>Retry request</button>}</article>)}
      {previousRuns.length > 0 && <details className="previous-runs"><summary>Earlier agent runs ({previousRuns.length})</summary>{previousRuns.map(run => <article className="run-item" key={run.id}><div><strong>{team.find(agent => agent.id === run.agentDefinitionId)?.name ?? 'Agent'}</strong><span>{run.status} · previous attempt</span></div>{run.error && <p>{run.error}</p>}{run.model && <p className="planning-note">{run.inputTokens.toLocaleString()} input / {run.outputTokens.toLocaleString()} output tokens</p>}</article>)}</details>}
      {retry.error && <p className="error" role="alert">{retry.error.message}</p>}
    </section>
  </div>
}
