import { useQuery } from '@tanstack/react-query'
import { api } from '../api'
export function TaskDetails({ projectId, taskId }: { projectId: string; taskId: string }) {
  const query = useQuery({ queryKey: ['task', projectId, taskId], queryFn: () => api.taskDetails(projectId, taskId), refetchInterval: 2000 })
  if (query.isPending) return <p role="status">Loading implementation history…</p>
  if (query.error) return <p role="alert" className="error">{query.error.message}</p>
  const { task, job, reviews, tools } = query.data
  return <div className="task-details">
    {job && <p>Implementation: <strong>{job.status}</strong></p>}
    {job?.error && <p className="error">{job.error}</p>}
    {task.branch && <p>Branch: <code>{task.branch}</code></p>}
    {task.commit && <p>Commit: <code>{task.commit.slice(0, 12)}</code></p>}
    {reviews.map(review => <article className="review-feedback" key={review.id}><strong>Review · {review.status}</strong><p>{review.summary}</p></article>)}
    {tools.length > 0 && <details><summary>Tool activity ({tools.length})</summary>{tools.map(tool => <p key={tool.id}><strong>{tool.tool}</strong> · {tool.succeeded ? 'Passed' : 'Failed'}<br/>{tool.summary}</p>)}</details>}
  </div>
}
