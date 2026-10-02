# Buildra frontend

React + TypeScript + Vite, React Router, and TanStack Query. This is the first foundation milestone of BUILDRA_SPEC.md.

## Run locally

Start the API and PostgreSQL using the backend README, then:

```powershell
npm ci
npm run dev
```

Open http://127.0.0.1:5173/projects. If port 5173 is occupied, use `npm run dev -- --port 5174`. API calls are proxied to http://127.0.0.1:5080.

## Validation

```powershell
npm run build
npm run lint
npx playwright test
```

Browser tests use the installed Microsoft Edge and mock API responses. They verify the creation flow, assigned team, mobile layout, and error presentation. They do not verify a live PostgreSQL connection.

## Implemented

- Responsive projects list, creation form, and project dashboard.
- Project update and deletion.
- PM, Developer, and Reviewer team display.
- Loading, empty, and API error states.

## Next milestones

Repository verification, agent settings, durable task workflow, task details, persisted chat, and SignalR updates. The SignalR dependency is installed but no realtime functionality is claimed yet. Repository URLs are saved as metadata; no GitHub credentials are collected by this release.
