import { useQuery } from '@tanstack/react-query'
import { Activity, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { api } from '../api'
import type { Agent } from '../api'

export function LiveTeam({ projectId, team }: { projectId: string; team: Agent[] }) {
  const workspace = useQuery({ queryKey: ['planning', projectId], queryFn: () => api.planning(projectId), refetchInterval: 2000 })
  const connection = useQuery({ queryKey: ['worker-status'], queryFn: api.status, refetchInterval: 5000, retry: false })
  const online = connection.data?.workerOnline && !workspace.isError
  const roles = { ProductManager: 'Product Manager', Developer: 'Developer', Reviewer: 'Reviewer' }
  return <section className="live-team" aria-label="Live agent status">
    <div className="section-title"><h2><Activity size={17}/> Your team · live activity</h2><div className="live-controls"><span className={`connection ${online ? 'connected' : ''}`}>{online ? <Wifi size={14}/> : <WifiOff size={14}/>}{connection.isPending ? 'Connecting…' : connection.error || workspace.isError ? 'API disconnected' : online ? 'Worker connected' : 'Worker offline'}</span><button className="secondary" aria-label="Refresh agent status" onClick={() => { void workspace.refetch(); void connection.refetch() }}><RefreshCw size={14}/></button></div></div>
    {!online && !connection.isPending && <p className="worker-notice" role="status">{connection.error || workspace.isError ? 'Updates are unavailable. Reconnecting automatically…' : 'The worker is not reporting a heartbeat. Queued tasks will wait until it reconnects.'}</p>}
    <div className="team-grid">{[...team].sort((a, b) => Object.keys(roles).indexOf(a.role) - Object.keys(roles).indexOf(b.role)).map(agent => {
      const runs = workspace.data?.runs.filter(r => r.agentDefinitionId === agent.id) ?? []
      const active = runs.find(r => ['Running', 'Queued', 'WaitingForTool'].includes(r.status))
      const last = active ?? runs[0]
      const working = active?.status === 'Running' || active?.status === 'WaitingForTool'
      return <article className={`team-card live-agent ${working && online ? 'agent-working' : ''}`} key={agent.id}>
        <div className="agent-card-heading"><span className={`agent-avatar ${agent.role}`}>{agent.name[0]}</span><span className={`agent-state ${working ? 'working' : last?.status === 'Failed' ? 'attention' : ''}`}>{active ? online ? working ? 'Working' : 'Queued' : 'Disconnected' : last?.status === 'Failed' ? 'Needs attention' : last?.status === 'Completed' ? 'Finished' : 'Idle'}</span></div>
        <h3>{agent.name}</h3><span>{roles[agent.role]}</span>
        <p className="agent-activity">{active ? last?.activity || (working ? 'Preparing the next action…' : 'Waiting for the worker…') : last?.status === 'Failed' ? last.error : last?.status === 'Completed' ? 'Last run finished successfully.' : agent.role === 'ProductManager' ? 'Waiting for your next request.' : 'Waiting for a task.'}</p>
        <div className="agent-metrics">{last?.step ? <span>Step {last.step}/24</span> : <span>{last ? 'Latest run' : 'Ready'}</span>}{last?.recoveries ? <span>{last.recoveries} automatic recoveries</span> : null}{active?.startedAt && <span>Started {new Date(active.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}</div>
      </article>
    })}</div>
  </section>
}
