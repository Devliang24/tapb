# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

TAPB Frontend - React-based bug/project management UI built with Vite, Ant Design, React Query, and Zustand.

## Commands

```bash
# Development server (port 5173, proxies /api to localhost:8000)
npm run dev

# Production build
npm run build

# Linting
npm run lint

# Preview production build
npm run preview
```

## Architecture

### State Management
- **Zustand** (`src/stores/`) - Global auth state in `authStore.js`
- **React Query** - Server state management for all API data; queries use `['entity', params]` key patterns

### API Layer
- `src/services/api.js` - Axios instance with JWT auth interceptor and 401 redirect
- `src/services/*Service.js` - Domain-specific API functions (projects, sprints, requirements, bugs, tasks, users)

### Component Organization
- `src/components/` - Reusable components, each in own folder with `index.jsx` and optional CSS
- `src/pages/` - Route-level page components
- Components follow pattern: List components handle filtering/display, Form components handle create/edit drawers, Detail components show item details in drawers

### Routing Structure
- `/` - Home (project list)
- `/projects/:projectId` or `/projects/:projectId/iterations` - Sprint iterations view
- `/projects/:projectId?tab=requirements` - Requirements list
- `/projects/:projectId?tab=bugs` - Bugs list
- `/settings` - Settings page

### Key Patterns
- UI components use Ant Design (configured with Chinese locale `zhCN`)
- Forms use `Form.useForm()` hook with validation
- Mutations use `useMutation` + `queryClient.invalidateQueries` for cache updates
- Auth token stored in `localStorage` under key `token`

### Backend Integration
Backend runs on port 8000. API endpoints are prefixed with `/api`. Start backend first:
```bash
cd ../backend && ./start.sh
# Or use Docker: docker-compose up -d (from parent directory)
```
