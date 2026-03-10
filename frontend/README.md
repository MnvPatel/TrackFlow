# Task Managing Portal – Frontend

Simple, Jira-inspired UI for the Task Managing Portal backend. Supports **light and dark theme**, and role-based views for **Admin**, **Employee**, and **Client**.

## Setup

```bash
cd frontend
npm install
```

## Run (development)

1. Start the **backend** first (from project root: `cd backend && npm run dev`).
2. Start the frontend:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The Vite dev server proxies `/api` to `http://localhost:5000`, so no CORS or env var is needed in dev.

## Build

```bash
npm run build
```

For production, set `VITE_API_URL` to your backend URL if the app is not served from the same origin.

## Features

- **Auth:** Login (admin/employee/client from backend seed). Logout and theme toggle in header.
- **Admin:** Dashboard (analytics), Projects (CRUD), Tasks (CRUD), Create employee, Submissions (approve/reject), Notifications.
- **Employee:** Dashboard, Projects, My tasks, Submit work, Submissions, Notifications.
- **Client:** Dashboard, My projects, Issues (create/view), Notifications.
- **Theme:** Light/dark toggle; preference stored in `localStorage`.

## Tech

- React 18, TypeScript, Vite, React Router.
- No UI library; CSS variables for theming (see `src/index.css`).
- **Backend calls:** Axios instance in `src/lib/axios.ts` (base URL, auth header, 401 refresh). Pages use `api.get()`, `api.post()`, etc. and manage the response with React state.
