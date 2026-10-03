import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { LoaderCircle, CheckCircle2 } from 'lucide-react'
import { api } from '../api'
export function TaskDetails({ projectId, taskId, compact = false }: { projectId: string; taskId: string; compact?: boolean }) {
  const [tab, setTab] = useState('Activity')
  const query = useQuery({ queryKey: ['task', projectId, taskId], queryFn: () => api.taskDetails(projectId, taskId), refetchInterval: 2000 })
  if (query.isPending) return <p role="status">Loading implementation history…</p>
  if (query.error) return <p role="alert" className="error">{query.error.message}</p>
  const { task, job, reviews, tools, runs } = query.data
  const active = runs.find(r => r.status === 'Running')
  const busy = job?.status === 'Running' || job?.status === 'Queued'
  const stage = task.status === 'Completed' ? 3 : ['Approved', 'InReview'].includes(task.status) ? 2 : ['InDevelopment', 'ChangesRequested', 'Failed'].includes(task.status) ? 1 : 0
  return <div className="task-details">
    <ol className="workflow-stages" aria-label="Implementation stages">{['Plan', 'Develop & test', 'Review', 'Pull request'].map((name, index) => <li key={name} className={index < stage ? 'stage-done' : index === stage ? 'stage-current' : ''}>{index < stage ? <CheckCircle2 size={13}/> : <span>{index + 1}</span>}{name}</li>)}</ol>
    {busy && <div className="current-action" aria-live="polite"><LoaderCircle className="spin" size={16}/><div><strong>{active?.activity || (job?.status === 'Queued' ? 'Waiting for the worker' : 'Preparing repository workspace')}</strong>{active?.step ? <small>Step {active.step}/24 · {active.recoveries ?? 0} automatic recoveries</small> : null}</div></div>}
    {job && <p>Implementation: <strong>{job.status}</strong></p>}
    {job?.error && <p className="error">{job.error}</p>}
    {!compact && <div className="activity-tabs" role="tablist" aria-label="Task history">{['Activity', 'Reviews', 'Branch'].map(name => <button key={name} role="tab" aria-selected={tab === name} onClick={() => setTab(name)}>{name}</button>)}</div>}
    {!compact && tab === 'Branch' && <div>{task.branch ? <p>Branch: <code>{task.branch}</code></p> : <p>No implementation commit yet.</p>}{task.commit && <p>Commit: <code>{task.commit.slice(0, 12)}</code></p>}</div>}
    {!compact && tab === 'Reviews' && <div>{reviews.length === 0 && <p>Review starts after implementation and tests finish.</p>}{reviews.map(review => <article className="review-feedback" key={review.id}><strong>Review · {review.status}</strong><p>{review.summary}</p></article>)}</div>}
    {(compact || tab === 'Activity') && <div className="activity-timeline">{(compact ? tools.slice(-3) : tools).map(tool => <article className={`activity-event ${tool.succeeded ? '' : 'event-recovery'}`} key={tool.id}><span className="event-dot"/><div><strong>{tool.tool}</strong><span className="event-result">{tool.succeeded ? 'Succeeded' : busy ? 'Agent correcting this action' : 'Failed action'}</span>{tool.occurredAt && <time>{new Date(tool.occurredAt).toLocaleTimeString()}</time>}<details><summary>{tool.summary.split('\n')[0]}</summary><pre>{tool.summary}</pre></details></div></article>)}{tools.length === 0 && <p>Tool actions will appear here as the agent works.</p>}</div>}
  </div>
}
