import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Send, MessageSquare, ListChecks } from 'lucide-react'
import { api } from '../api'

export function PlanningPanel({ projectId }: { projectId: string }) {
  const [content, setContent] = useState('')
  const cache = useQueryClient()
  const key = ['planning', projectId]
  const query = useQuery({ queryKey: key, queryFn: () => api.planning(projectId), refetchInterval: 2000 })
  const submit = useMutation({ mutationFn: () => api.submitRequest(projectId, content), onSuccess: () => { setContent(''); void cache.invalidateQueries({ queryKey: key }) } })
  const retry = useMutation({ mutationFn: (runId: string) => api.retryRun(projectId, runId), onSuccess: () => void cache.invalidateQueries({ queryKey: key }) })
  const active = query.data?.runs.filter(run => run.status === 'Queued' || run.status === 'Running') ?? []
  return <div className="planning-grid">
    <section className="panel planning-chat"><div className="section-title"><h2><MessageSquare size={17}/>Talk to your PM</h2><span className="tag">Sarah · Product Manager</span></div>
      <p className="planning-note">Describe a change. Sarah will turn it into a task with acceptance criteria. Repository inspection and development come next.</p>
      {query.isPending && <p role="status">Loading conversation…</p>}
      {query.error && <p role="alert" className="error">{query.error.message}</p>}
      <div className="messages" aria-live="polite" aria-label="Project conversation">
        {query.data?.messages.length === 0 && <div className="conversation-empty">What would you like your team to build?</div>}
        {query.data?.messages.map(message => <article className={`message message-${message.senderType.toLowerCase()}`} key={message.id}><div className="message-heading"><strong>{message.senderType === 'User' ? 'You' : message.senderType === 'Agent' ? 'Sarah' : 'Buildra'}</strong><time>{new Date(message.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</time></div><p>{message.content}</p>{message.messageType === 'ActionRequired' && <span className="tag">Action required</span>}</article>)}
      </div>
      {active.length > 0 && <p role="status" className="planning-note">{active.some(r => r.status === 'Running') ? 'Sarah is planning your request…' : 'Request queued. Waiting for the PM worker…'}</p>}
      <form className="request-form" onSubmit={event => { event.preventDefault(); if (content.trim()) submit.mutate() }}><label htmlFor="pm-request">Your request</label><textarea id="pm-request" rows={3} maxLength={8000} required value={content} onChange={event => setContent(event.target.value)} placeholder="For example: Add a search field to the project list."/><div className="form-actions"><button disabled={submit.isPending || !content.trim() || query.isError}><Send size={14}/>{submit.isPending ? 'Sending…' : 'Send request'}</button></div></form>
      {submit.error && <p className="error" role="alert">{submit.error.message}</p>}
    </section>
    <section className="panel"><div className="section-title"><h2><ListChecks size={17}/>Tasks & runs</h2><span className="muted">{query.data?.tasks.length ?? 0} tasks</span></div>
      {query.data?.tasks.length === 0 && <p className="planning-note">Tasks will appear here when Sarah finishes planning. No code changes run automatically yet.</p>}
      {query.data?.tasks.map(task => <article className="planned-task" key={task.id}><div className="section-title"><h3>{task.title}</h3><span className="tag">{task.status}</span></div><p>{task.description}</p><strong>Acceptance criteria</strong><p className="criteria">{task.acceptanceCriteria}</p></article>)}
      {query.data?.runs.length ? <h3 className="runs-title">Agent runs</h3> : null}
      {query.data?.runs.map(run => <article className="run-item" key={run.id}><div><strong>PM planning</strong><span className={`run-status status-${run.status.toLowerCase()}`}>{run.status}</span></div>{run.model && <p className="planning-note">{run.model} · {run.inputTokens.toLocaleString()} input / {run.outputTokens.toLocaleString()} output tokens</p>}{run.error && <p className="error">{run.error}</p>}{run.status === 'Failed' && <button className="secondary" disabled={retry.isPending} onClick={() => retry.mutate(run.id)}>Retry request</button>}</article>)}
      {retry.error && <p className="error" role="alert">{retry.error.message}</p>}
    </section>
  </div>
}
