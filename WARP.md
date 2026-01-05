# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

- TAPB is a full-stack bug / requirement / project management system.
- Backend (`backend/`): FastAPI + SQLAlchemy + Alembic, using SQLite and JWT-based authentication.
- Frontend (`frontend/`): React 18 app built with Vite, Ant Design, React Query, and Zustand, primarily targeting zh-CN users.

## Common Commands

### Full-stack via Docker Compose (recommended)

From the repo root (`tapb/`):

- Start both backend and frontend in Docker:
  - `docker-compose up`
  - Use `docker-compose up -d` to run in the background.
- This starts:
  - **Backend** on `http://localhost:8000` using the `backend/Dockerfile`, running:
    - `python -m alembic upgrade head`
    - `python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`
  - **Frontend** on `http://localhost:5173`, mounting `frontend/` and running:
    - `npm install && npm run dev -- --host 0.0.0.0`
    - With `VITE_API_URL=http://localhost:8000` so the React app points at the backend container.

### Backend (FastAPI API)

- Install dependencies (once):
  - `cd backend && pip install -r requirements.txt`
- Run the API locally without Docker (includes migrations + auto-reload):
  - `cd backend && ./start.sh`
  - This runs `python3 -m alembic upgrade head` then `python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`.
- Manually run database migrations:
  - `cd backend && python3 -m alembic upgrade head`

#### Seed and utility scripts (backend)

Run these from `backend/` after the database is available and migrations have run:

- Reset to a single demo project `示例项目` with key `DEMO`:
  - `python3 reset_to_single_project.py`
- Seed a large demo project with many sprints, requirements, tasks, and bugs:
  - `python3 seed_demo_project.py`
- Seed ~20 example public spaces (different industries/domains):
  - `python3 seed_spaces.py`
  - Clear all public spaces: `python3 seed_spaces.py --clear`
- Seed 10 realistic users with default password `123456` and list them:
  - `python3 seed_users.py`
  - List users only: `python3 seed_users.py --list`

### Frontend (Vite React app)

All commands below are run from `frontend/`:

- Install dependencies:
  - `npm install`
- Start development server (port 5173):
  - `npm run dev`
  - The app expects the API at `http://localhost:8000` (hard-coded in `src/services/api.js`; Docker uses `VITE_API_URL`).
- Build production bundle:
  - `npm run build`
- Preview the built bundle locally:
  - `npm run preview`
- Lint the frontend:
  - `npm run lint`

### Tests

- There is currently no automated test suite configured:
  - No test scripts are defined in `frontend/package.json`.
  - There is no `tests/` directory or pytest/coverage config under `backend/`.
- As a result, there is no standard command yet for running the full test suite or a single test.

## High-level Architecture

### Backend

- **Entry point**
  - `backend/app/main.py` creates the `FastAPI` app, configures CORS for `http://localhost:5173`–`http://localhost:5176`, and registers routers from `app.api`:
    - `auth`, `projects`, `bugs`, `sprints`, `requirements`, `tasks`, `users`, `upload`.
  - Health endpoints:
    - `/` returns a simple welcome message.
    - `/health` returns a basic health check JSON.

- **API layer (`backend/app/api/`)**
  - Each module defines an `APIRouter` with a fixed prefix (e.g., `projects.py` uses `/api/projects`) and tags.
  - Endpoints depend on:
    - `get_db` from `app.database` for DB sessions.
    - `get_current_user` from `app.utils.dependencies` for authentication, which enforces a valid JWT `Authorization: Bearer` token and loads the current `User` from the DB.
  - The `projects` router illustrates typical patterns:
    - Project CRUD with creator-only update/delete.
    - `ProjectMember` management (add/update/remove members with role checks).
    - A global search endpoint (`/{project_id}/search`) that aggregates requirements, tasks, and bugs for a project using SQL `OR` filters and returns a flat, typed result set. The frontend `GlobalSearch` component is built on top of this.

- **Domain model (`backend/app/models/`)**
  - Contains SQLAlchemy ORM models for each domain:
    - `Project`, `ProjectMember`, `Bug`, `Requirement`, `Sprint`, `Task`, `Comment` types, and `User`.
  - `Project` holds per-project sequence counters:
    - `bug_seq`, `requirement_seq`, `task_seq` are used to generate human-readable numbers like `KEY-REQ-001`, `KEY-TASK-001`, etc.
  - Relationships link entities (e.g., `Project.bugs`, `Project.requirements`, `Project.members`), and cascades are configured so that deleting a project removes related entities.

- **Schemas (`backend/app/schemas/`)**
  - Pydantic models mirror each domain with clear separation of concerns:
    - `*Create` for request bodies when creating entities.
    - `*Update` for partial updates.
    - `*Response` for API responses, with `Config.from_attributes = True` so FastAPI can serialize SQLAlchemy models directly.

- **Utilities and services**
  - `backend/app/utils/dependencies.py`:
    - Defines `get_current_user`, which parses and validates JWTs, then loads the `User` from the DB using `SessionLocal`. This is the central authentication dependency used across routers.
  - `backend/app/utils/security.py` (not exhaustively described here) handles password hashing and token encoding/decoding.
  - `backend/app/utils/comment_utils.py` and related utilities encapsulate common comment/history logic shared by multiple domains.
  - `backend/app/services/` contains service functions such as `bug_service.create_bug`, which are used both by API endpoints and by seeding scripts to avoid duplicating business rules.

- **Database and migrations**
  - `backend/app/database.py` exposes `Base`, `engine`, and `SessionLocal` for ORM configuration and session management.
  - Alembic is configured via `backend/alembic.ini` and the `backend/alembic/` directory.
  - Both `backend/start.sh` and the `backend` Docker container run `alembic upgrade head` before starting the UVicorn server, so schema changes should be reflected automatically on startup.

- **Seed and maintenance scripts**
  - `backend/reset_to_single_project.py`:
    - Ensures there is exactly one core project `示例项目` (key `DEMO`), owned by an admin or the first user, and deletes all others with proper cleanup of related bugs, requirements, tasks, sprints, and members.
  - `backend/seed_demo_project.py`:
    - Populates the `DEMO` project with many sprints, richly-described requirements, tasks (front-end/back-end/test subtasks), and bugs spanning realistic scenarios, using enums such as `SprintStatus`, `RequirementStatus`, `TaskStatus`, `BugStatus`, etc.
  - `backend/seed_spaces.py`:
    - Creates ~20 public example spaces across different industries (`ECOM`, `SOCIAL`, `FINTECH`, etc.) with their own sprints, requirements, and bugs, owned by a `system` user. Supports `--clear` to remove them.
  - `backend/seed_users.py`:
    - Seeds 10 named users with realistic Chinese names and roles (developer/tester/PM), with console output summarizing created vs. skipped users and a helper `--list` mode.

### Frontend

- **Entry and providers**
  - `frontend/src/main.jsx` renders the application root and imports global styles from `src/index.css`.
  - `frontend/src/App.jsx` is the main composition root:
    - Wraps the app in a `QueryClientProvider` (React Query) with a shared `QueryClient` instance.
    - Wraps UI in Ant Design `ConfigProvider` using Chinese locale `zhCN`.
    - Configures routing using `react-router-dom` (`BrowserRouter` + `Routes` + `Route`).

- **Routing and layout**
  - Routes are defined in `App.jsx` and all children are rendered inside `components/Layout`:
    - `/` → `pages/Home` (project list / landing view).
    - `/projects` → redirect to `/`.
    - `/projects/:projectId` and `/projects/:projectId/iterations` → `pages/SprintIterations` (sprint/iteration view for a project).
    - `/settings` → `pages/Settings` (global settings).
    - `/projects/:projectId/settings` → `pages/ProjectSettings` (per-project settings).
  - The layout component manages the top-level navigation, side menus, and content container used across all pages.

- **State and data fetching**
  - Authentication state is centralized in `src/stores/authStore.js` using Zustand:
    - Persists `user` and `token` in `localStorage` under keys `user` and `token`.
    - Exposes `setAuth(user, token)` and `logout()` to update/remove auth state in both store and `localStorage`.
  - Server state is handled with React Query:
    - Queries and mutations built on top of the domain service modules under `src/services/`.
    - Components typically call `useQuery`/`useMutation` with stable keys (`['projects']`, `['bugs', projectId, filters]`, etc.) and rely on `queryClient.invalidateQueries` after mutations.

- **API layer (`frontend/src/services/`)**
  - `api.js` creates a shared axios instance configured with:
    - `baseURL = 'http://localhost:8000'`.
    - `Content-Type: application/json` headers.
    - A request interceptor that attaches `Authorization: Bearer <token>` when `localStorage.getItem('token')` is present.
    - A response interceptor that clears auth and redirects to `/` on HTTP 401.
  - Domain-specific service modules (`projectService.js`, `sprintService.js`, `requirementService.js`, `bugService.js`, `taskService.js`, `authService.js`, `uploadService.js`, `userService.js`) define functions mapping directly to backend REST endpoints. React Query hooks call these functions instead of raw axios.

- **Component organization (`frontend/src/components/` and `frontend/src/pages/`)**
  - Components are grouped by domain/feature:
    - Authentication: `AuthModal` for login and auth flows.
    - Projects: `ProjectList`, `ProjectFormModal` manage project CRUD and selection.
    - Sprints: `SprintList`, `SprintCard`, `SprintForm` power the project iteration board.
    - Requirements: `RequirementList`, `RequirementForm`, `RequirementDetail` manage requirement lifecycle and detail views.
    - Bugs: `BugList`, `BugForm`, `BugDetail` cover bug tracking UX.
    - Tasks: `TaskForm`, `TaskDetail` manage implementation tasks linked to requirements.
    - Shared UI: `Layout`, `DetailDrawer`, `GlobalSearch`, `LinkRequirementsDrawer`, `MarkdownEditor`, `MarkdownRenderer` and others.
  - Common patterns:
    - `*List` components handle filtering, sorting, and selection.
    - `*Form` components wrap Ant Design `Form` with validation rules and mutation hooks.
    - `*Detail` / `DetailDrawer` components show entity details and secondary actions in side drawers.

- **Markdown and rich text**
  - Rich descriptions for requirements, tasks, and bugs use markdown and editor components:
    - `MarkdownEditor` leverages the `@tiptap/*` ecosystem for editing.
    - `MarkdownRenderer` uses `react-markdown` with `remark-gfm` / `rehype-raw` to render markdown content, matching how backend seed scripts structure descriptions.

- **Global search and cross-entity linking**
  - `GlobalSearch` integrates with the backend `/api/projects/{project_id}/search` endpoint to search requirements, tasks, and bugs within a project.
  - `LinkRequirementsDrawer` and related components allow linking bugs and tasks to requirements, mirroring the relationships modeled in the backend.

### Existing `frontend/WARP.md` – suggested improvements

The existing `frontend/WARP.md` already captures the core frontend commands and architecture. To make it more useful in the context of the full repo:

- Clarify that it is scoped to the `frontend/` subproject and refer readers to the root `WARP.md` for backend, database, and Docker-related commands.
- Reference the actual entry files (`src/main.jsx`, `src/App.jsx`) and routing structure shown there, so route paths stay in sync as they evolve.
- Mention the axios `API_BASE_URL` constant in `src/services/api.js` and the `VITE_API_URL` environment variable used in `docker-compose.yml`, so future changes to API endpoints or ports are made in the correct place.
- Optionally call out cross-cutting components like `GlobalSearch`, `LinkRequirementsDrawer`, and the markdown editor/renderer as the main integration points with backend search and rich text features.
