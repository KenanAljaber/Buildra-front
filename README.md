# Buildra frontend

React + TypeScript + Vite, React Router, and TanStack Query. `main` holds the project foundation; `dev` is the integration branch; `feature/github-task-workflow` adds code execution and review on top of PM planning.

## Run locally

Start PostgreSQL, the API, and the PM worker using the backend README, then:

```powershell
npm ci
npm run dev -- --port 5174
```

Open http://127.0.0.1:5174/projects. The default dev port is 5173; API calls are proxied to http://127.0.0.1:5080.

## Current behavior

- Responsive projects list, create/edit/delete flows, project dashboard, and assigned PM/Developer/Reviewer team.
- Project conversation: send a request to the PM, inspect persisted replies, and respond to clarifications.
- Tasks with descriptions and acceptance criteria.
- Queued/running/completed/failed agent runs, token usage, safe error messages, and retry.
- GitHub repository verification, task implementation/retry, review and tool history, and reviewed pull request links.
- Owner-configured Docker test image/command and optional automatic implementation of future planned tasks.
- Persisted state is polled every two seconds; reload preserves conversation and tasks.

Configure an OpenAI key on the worker before sending real requests. Without a key, the worker returns a visible configuration error; the request can be retried after setup. Verify your repository before starting a Ready task. GitHub access uses Git Credential Manager on the worker machine, and the repository needs an initial commit and the configured base branch. See the backend README for worker setup and Docker test requirements. The default test setup targets dependency-free Node projects; other stacks require a suitable prebuilt image. Successful review creates a PR for your inspection and manual merge.

## Validation

```powershell
npm run build
npm run lint
npx playwright test
```

Browser tests launch a dedicated dev server on port 5188 and use installed Microsoft Edge. API responses are mocked to verify creation, mobile layout, errors, PM request status, task presentation, reload, retry, repository verification, execution state, reviews, and PR links. Real PostgreSQL/Git/Docker workflow tests live in the backend repository.

## Next

Expanded agent configuration, direct/task chat, cancellation, and SignalR realtime updates. The SignalR dependency is installed but the current interface polls the API.
