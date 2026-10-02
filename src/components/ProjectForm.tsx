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
    <p className="field-note">Verify access from the project dashboard after saving. The repository must have an initial commit on its default branch.</p>
    <label>Default branch<input required maxLength={200} value={input.defaultBranch} onChange={e => field('defaultBranch', e.target.value)} /></label>
    <label>Project instructions <span className="muted">· optional</span><textarea maxLength={20000} value={input.instructions} onChange={e => field('instructions', e.target.value)} placeholder="Architecture, conventions, and what your team should know." rows={4} /></label>
    <label>Docker test image<input required value={input.testImage ?? 'node:24-alpine'} onChange={e => field('testImage', e.target.value)} /></label>
    <label>Test command<input required value={input.testCommand ?? 'node --test'} onChange={e => field('testCommand', e.target.value)} /></label>
    <p className="field-note">Tests run offline in Docker. Your image must contain any required dependencies. The default supports Node built-in tests.</p>
    <label className="checkbox-label"><input type="checkbox" checked={input.autoStartTasks ?? false} onChange={e => setInput({ ...input, autoStartTasks: e.target.checked })}/>Automatically implement new tasks after repository verification</label>
    {error && <p role="alert" className="error">{error.message}</p>}
    <div className="form-actions"><button type="button" className="secondary" onClick={onCancel}>Cancel</button><button disabled={pending}>{pending ? 'Saving…' : 'Save project'}</button></div>
  </form>
}
