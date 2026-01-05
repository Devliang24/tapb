# AGENTS.md

This file guides agentic coding assistants working on TAPB Bug Management System.

## Project Overview

TAPB is a bug/issue tracking system with:
- **Frontend**: React 18 + Vite + Ant Design + TanStack Query + Zustand
- **Backend**: FastAPI + SQLAlchemy + Pydantic + Alembic
- **Database**: SQLite (production can use PostgreSQL)
- **Auth**: JWT-based authentication

## Commands

### Frontend (in `/frontend`)
```bash
npm run dev          # Start dev server (http://localhost:5173)
npm run build        # Production build
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

### Backend (in `/backend`)
```bash
./start.sh           # Run migrations + start uvicorn (--reload)
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Database Migrations (Docker)
```bash
docker-compose exec backend alembic revision --autogenerate -m "description"
docker-compose exec backend alembic upgrade head
docker-compose exec backend alembic downgrade -1
```

### Running Single Tests
No test framework is currently configured. When adding tests, use:
- Frontend: Vitest (add to package.json)
- Backend: pytest (add to requirements.txt)

## Code Style Guidelines

### Frontend (React + JSX)

#### Imports: External libs → Services → Components → Styles
- Use functional components with hooks
- Use Ant Design Form.useForm() for forms
- Use TanStack Query for data fetching
- Prefix custom hooks with `use`
- Export default component at bottom
- Use Chinese for UI text and comments

#### API Services: Export both named and default
```javascript
export const bugService = {
  getBugs: async (params) => (await api.get('/api/bugs', { params })).data
};
export default bugService;
```

#### State: TanStack Query (server), Zustand (global), useState (local)

### Backend (Python + FastAPI)

#### File Structure: api/ | models/ | schemas/ | services/ | utils/

#### Imports: Standard lib → External packages → Internal

#### API Routes
```python
router = APIRouter(prefix="/api/bugs", tags=["bugs"])
@router.get("/", response_model=BugListResponse)
def get_bugs(page: int = Query(1, ge=1), db: Session = Depends(get_db)):
    return {"items": bugs, "total": total, "page": page, "page_size": page_size}
```

#### Pydantic Schemas: Base → Create/Update → Response
```python
class BugBase(BaseModel):
    title: str
class BugCreate(BugBase):
    project_id: int
class BugResponse(BugBase):
    id: int
    class Config:
        from_attributes = True
```

#### SQLAlchemy Models: Enum classes, relationships, timestamps
```python
class BugStatus(str, enum.Enum):
    NEW = "new"
class Bug(Base):
    __tablename__ = "bugs"
    id = Column(Integer, primary_key=True)
    status = Column(Enum(BugStatus), default=BugStatus.NEW)
    project = relationship("Project", back_populates="bugs")
```

#### Error Handling
```python
if not bug:
    raise HTTPException(status_code=404, detail="Bug not found")
if bug.creator_id != current_user.id:
    raise HTTPException(status_code=403, detail="Only creator can delete")
```

## Naming Conventions

### Frontend
- Components: PascalCase (BugList, BugForm)
- Functions/variables: camelCase (handleSubmit, bugData)
- Constants: UPPER_SNAKE_CASE (DEFAULT_PAGE_SIZE)
- Files: PascalCase (index.jsx), kebab-case (api.js)

### Backend
- Classes: PascalCase (Bug, BugCreate, BugService)
- Functions/variables: snake_case (get_bugs, bug_data)
- Constants: UPPER_SNAKE_CASE (BugStatus.NEW)
- Files: snake_case (bug.py, bug_service.py)

## Common Patterns

### Frontend: TanStack Query Data Fetching
```javascript
const { data: bugs } = useQuery({
  queryKey: ['bugs', projectId],
  queryFn: () => bugService.getBugs({ project_id: projectId }),
  enabled: !!projectId,
});

const mutation = useMutation({
  mutationFn: (data) => bugService.createBug(data),
  onSuccess: () => {
    message.success('Success');
    queryClient.invalidateQueries(['bugs', projectId]);
  },
});
```

### Backend: Pagination Response
```python
def get_bugs(page: int = 1, page_size: int = 20, db: Session = Depends(get_db)):
    total = query.count()
    skip = (page - 1) * page_size
    items = query.offset(skip).limit(page_size).all()
    return {"items": items, "total": total, "page": page, "page_size": page_size}
```

## Additional Notes

- Use Chinese for user-facing strings and comments
- API endpoints follow REST conventions (GET/POST/PUT/DELETE /api/bugs)
- Bug numbers follow format: PROJECT_KEY-SEQ (e.g., PROJ-001)
- All API routes require authentication except login/register
