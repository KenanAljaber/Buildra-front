import { useState } from 'react'
import type { ProjectInput } from '../api'

const empty: ProjectInput = { name: '', description: '', repositoryUrl: '', defaultBranch: 'main', instructions: '' }
export function ProjectForm({ initial = empty, pending, error, onSubmit, onCancel }: {
  initial?: ProjectInput; pending: boolean; error: Error | null;
  onSubmit: (input: ProjectInput) => void; onCancel: () => void;
}) {
  const [input, setInput] = useState(initial)
  const field = (name: keyof ProjectInput, value: string) => setInput({ ...input, [name]: value })
  return <form className="project-form" onSubmit={event => { event.preventDefault(); onSubmit(input) }}>
    <label>Project name<input required maxLength={120} autoFocus value={input.name} onChange={e => field('name', e.target.value)} placeholder="Your next great idea" /></label>
    <label>Description<textarea maxLength={2000} value={input.description} onChange={e => field('description', e.target.value)} placeholder="What are you building?" rows={2} /></label>
    <label>GitHub repository<input required type="url" value={input.repositoryUrl} onChange={e => field('repositoryUrl', e.target.value)} placeholder="https://github.com/owner/repository" /></label>
    <p className="field-note">Repository details are saved here. GitHub verification and access come in the next milestone.</p>
    <label>Default branch<input required maxLength={200} value={input.defaultBranch} onChange={e => field('defaultBranch', e.target.value)} /></label>
    <label>Project instructions <span className="muted">· optional</span><textarea maxLength={20000} value={input.instructions} onChange={e => field('instructions', e.target.value)} placeholder="Architecture, conventions, and what your team should know." rows={4} /></label>
    {error && <p role="alert" className="error">{error.message}</p>}
    <div className="form-actions"><button type="button" className="secondary" onClick={onCancel}>Cancel</button><button disabled={pending}>{pending ? 'Saving…' : 'Save project'}</button></div>
  </form>
}
