# Buildra frontend

React + TypeScript + Vite, React Router, and TanStack Query. `main` holds the project foundation; `dev` is the integration branch; `feature/pm-request-to-task` adds PM planning.

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
- Persisted state is polled every two seconds; reload preserves conversation and tasks.

Configure an OpenAI key on the worker before sending real requests. Without a key, the worker returns a visible configuration error; the request can be retried after setup. Repository URLs are metadata only. The PM has no repository access and Developer/Reviewer execution is not implemented yet.

## Validation

```powershell
npm run build
npm run lint
npx playwright test
```

Browser tests launch a dedicated dev server on port 5188 and use installed Microsoft Edge. API responses are mocked to verify creation, mobile layout, errors, PM request status, task presentation, reload, and retry. Real PostgreSQL workflow tests live in the backend repository.

## Next

GitHub integration, code execution and reviews, PR output, expanded agent configuration, and SignalR realtime updates. The SignalR dependency is installed but the current interface polls the API.
