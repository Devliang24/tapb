# TAPB

<div align="center">

![TAPB](https://img.shields.io/badge/TAPB-Project%20Management%20System-blue?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104-009688?style=flat-square&logo=fastapi)
![Python](https://img.shields.io/badge/Python-3.11-3776ab?style=flat-square&logo=python)
![Ant Design](https://img.shields.io/badge/Ant%20Design-5.x-0170fe?style=flat-square&logo=ant-design)

**Full-Stack Project Management System - Bug Tracking / Requirements Management / Sprint Planning**

</div>

---

## ✨ Features

- **📋 Project Management** - Multi-project support, member permission control, flexible project configuration
- **🐛 Bug Tracking** - Complete bug lifecycle management with status transitions, priority settings, and batch operations
- **📝 Requirements Management** - Requirement creation, task linking, progress tracking with Markdown-formatted descriptions
- **🎯 Sprint Planning** - Sprint management, iteration planning and execution, timeline visualization
- **📊 Task Management** - Task breakdown, assignment, status tracking, and requirement association
- **💬 Comment System** - Real-time commenting with Markdown support for efficient collaboration
- **🔍 Global Search** - Cross-requirement, task, and bug search functionality
- **👥 Team Collaboration** - Role-based access control (RBAC) with multi-user collaboration support
- **🔒 Self-Hosted** - Fully local deployment with secure data control

## 🏗️ Technical Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend (React 18)                          │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌─────────────┐   │
│  │  Zustand  │  │Ant Design │  │React Query│  │  Components │   │
│  └───────────┘  └───────────┘  └───────────┘  └─────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Backend (FastAPI)                           │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌─────────────┐   │
│  │SQLAlchemy │  │  JWT Auth │  │  Alembic  │  │  API Routes │   │
│  └───────────┘  └───────────┘  └───────────┘  └─────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                      ┌──────────────┐
                      │   SQLite     │
                      │   Database   │
                      └──────────────┘
```

### Core Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend Framework | React 18 + Vite |
| State Management | Zustand |
| UI Components | Ant Design 5.x |
| Data Fetching | React Query (TanStack Query) |
| Backend Framework | FastAPI |
| Database ORM | SQLAlchemy |
| Database | SQLite |
| Database Migration | Alembic |
| Authentication | JWT (JSON Web Tokens) |
| Rich Text Editor | TipTap Editor |
| Markdown Rendering | react-markdown |

## 🚀 Quick Start

### Prerequisites

**Using Docker (Recommended):**
- Docker >= 20.10
- Docker Compose >= 2.0

**Local Development:**
- Python >= 3.11
- Node.js >= 18
- npm >= 9

### Installation

#### Method 1: Docker One-Click Start (Recommended)

1. **Clone the repository**

```bash
git clone https://github.com/Devliang24/tapb.git
cd tapb
```

2. **Start all services**

```bash
# Start backend + frontend
docker-compose up -d

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

3. **Access the application**

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

4. **Stop services**

```bash
docker-compose down
```

#### Method 2: Local Setup

1. **Clone the repository**

```bash
git clone https://github.com/Devliang24/tapb.git
cd tapb
```

2. **Start backend**

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Run database migrations and start server
./start.sh
```

Backend will start at http://localhost:8000

3. **Start frontend (new terminal)**

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will start at http://localhost:5173

### Initialize Sample Data

The system provides multiple data initialization scripts:

```bash
# Method 1: Using Docker

# 1. Reset to single demo project
docker-compose exec backend python reset_to_single_project.py

# 2. Seed demo project with rich data (sprints, requirements, tasks, bugs)
docker-compose exec backend python seed_demo_project.py

# 3. Create public example spaces (~20 projects from different industries)
docker-compose exec backend python seed_spaces.py

# 4. Create test users (10 users, default password: 123456)
docker-compose exec backend python seed_users.py

# Method 2: Local Run
cd backend
python3 reset_to_single_project.py
python3 seed_demo_project.py
python3 seed_spaces.py
python3 seed_users.py
```

### Default Accounts

On first access, you can register a new account. If you've run `seed_users.py`, you can use these test accounts:

| Username | Email | Password | Role |
|----------|-------|----------|------|
| 张伟 | zhangwei@example.com | 123456 | Developer |
| 李娜 | lina@example.com | 123456 | QA Engineer |
| 王强 | wangqiang@example.com | 123456 | Product Manager |
| 刘洋 | liuyang@example.com | 123456 | Developer |

## 📁 Project Structure

```
tapb/
├── backend/                      # FastAPI backend
│   ├── app/
│   │   ├── models/               # SQLAlchemy ORM models
│   │   │   ├── project.py       # Project model
│   │   │   ├── bug.py           # Bug model
│   │   │   ├── requirement.py   # Requirement model
│   │   │   ├── task.py          # Task model
│   │   │   ├── sprint.py        # Sprint model
│   │   │   └── user.py          # User model
│   │   ├── schemas/              # Pydantic validation
│   │   ├── api/                  # API route definitions
│   │   │   ├── auth.py          # Auth routes
│   │   │   ├── projects.py      # Project routes
│   │   │   ├── bugs.py          # Bug routes
│   │   │   ├── requirements.py  # Requirement routes
│   │   │   ├── tasks.py         # Task routes
│   │   │   └── sprints.py       # Sprint routes
│   │   ├── services/             # Business logic layer
│   │   ├── utils/                # Utility functions
│   │   │   ├── dependencies.py  # FastAPI dependencies
│   │   │   └── security.py      # Security utilities
│   │   ├── database.py           # Database configuration
│   │   └── main.py               # FastAPI app entry point
│   ├── alembic/                  # Database migrations
│   ├── seed_demo_project.py      # Demo project data
│   ├── seed_spaces.py            # Public spaces data
│   ├── seed_users.py             # Test users data
│   ├── reset_to_single_project.py # Reset project script
│   ├── Dockerfile
│   ├── requirements.txt
│   └── start.sh                  # Startup script
│
├── frontend/                     # React frontend
│   ├── src/
│   │   ├── components/           # React components
│   │   │   ├── Layout.jsx       # Layout component
│   │   │   ├── AuthModal.jsx    # Auth modal
│   │   │   ├── ProjectList.jsx  # Project list
│   │   │   ├── BugList.jsx      # Bug list
│   │   │   ├── RequirementList.jsx # Requirement list
│   │   │   ├── SprintList.jsx   # Sprint list
│   │   │   ├── GlobalSearch.jsx # Global search
│   │   │   └── MarkdownEditor.jsx # Markdown editor
│   │   ├── pages/                # Page components
│   │   │   ├── Home.jsx         # Home page
│   │   │   ├── SprintIterations.jsx # Iterations page
│   │   │   ├── Settings.jsx     # Settings page
│   │   │   └── ProjectSettings.jsx # Project settings
│   │   ├── services/             # API services
│   │   │   ├── api.js           # Axios instance
│   │   │   ├── authService.js   # Auth service
│   │   │   ├── projectService.js # Project service
│   │   │   ├── bugService.js    # Bug service
│   │   │   ├── requirementService.js # Requirement service
│   │   │   └── sprintService.js # Sprint service
│   │   ├── stores/               # Zustand state management
│   │   │   └── authStore.js     # Auth state
│   │   ├── App.jsx               # App root component
│   │   └── main.jsx              # App entry point
│   ├── package.json
│   └── vite.config.js
│
├── docker-compose.yml            # Docker orchestration
├── WARP.md                       # Development guide
└── README.md                     # Project documentation
```

## 🔧 Configuration

### Environment Variables

**Backend environment variables** (`backend/.env`):

```env
# Database configuration
DATABASE_URL=sqlite:///./tapb.db

# JWT configuration
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=43200

# CORS configuration
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174
```

**Frontend environment variables** (`frontend/.env`):

```env
# API URL
VITE_API_URL=http://localhost:8000
```

### Docker Configuration

`docker-compose.yml` configures two services:

- **backend**: FastAPI application (port 8000)
  - Auto-runs database migrations
  - Supports hot reload
- **frontend**: React application (port 5173)
  - Vite development server
  - Supports hot module replacement (HMR)

## 📖 Usage Guide

### 1. Create Project

1. Visit the home page
2. Click "Create Project" button
3. Fill in project name, key (for ID prefix), and description
4. Submit to create

### 2. Sprint Management

1. Enter project details
2. Switch to "Iterations" tab
3. Create new sprint with start/end dates and goals
4. Associate requirements and tasks to the sprint

### 3. Requirements Management

1. Create requirement in project
2. Set type (feature/enhancement/research), priority, and status
3. Use Markdown editor for detailed description
4. Link tasks and bugs
5. Add comments for discussion

### 4. Bug Tracking

1. Create bug with auto-generated ID (e.g., DEMO-BUG-001)
2. Set severity, priority, and assignee
3. Track bug lifecycle through status transitions:
   - Open → In Progress → In Review → Closed
4. Link to requirements or sprints
5. Batch operations for quick processing

### 5. Task Management

1. Create tasks from requirements
2. Tasks auto-receive IDs (e.g., DEMO-TASK-001)
3. Set task type (frontend/backend/testing/design)
4. Assign to team members and track progress

### 6. Global Search

1. Click top search bar
2. Enter keywords
3. Real-time search across requirements, tasks, and bugs in project
4. Filter results by type

## 🛠️ Development Guide

### Database Migrations

```bash
# Using Docker
# Create new migration
docker-compose exec backend python -m alembic revision --autogenerate -m "description"

# Apply migrations
docker-compose exec backend python -m alembic upgrade head

# Rollback migration
docker-compose exec backend python -m alembic downgrade -1

# Local development
cd backend
python3 -m alembic revision --autogenerate -m "description"
python3 -m alembic upgrade head
python3 -m alembic downgrade -1
```

### Adding New Features

**Backend new API:**

1. Define data model in `backend/app/models/`
2. Define Pydantic schema in `backend/app/schemas/`
3. Create routes in `backend/app/api/`
4. Implement business logic in `backend/app/services/`
5. Register routes in `backend/app/main.py`

**Frontend new feature:**

1. Create component in `frontend/src/components/`
2. Define API calls in `frontend/src/services/`
3. Create page in `frontend/src/pages/`
4. Add route in `frontend/src/App.jsx`

### Code Standards

**Backend:**
- Follow PEP 8 conventions
- Use type hints
- Use RESTful style for API endpoints

**Frontend:**
- Use ESLint for code checking
- Use functional components and Hooks
- Follow Ant Design guidelines

### Running Tests

```bash
# Frontend lint check
cd frontend
npm run lint

# Build production version
npm run build

# Preview build
npm run preview
```

## 🤝 Contributing

Issues and Pull Requests are welcome!

1. Fork this repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Create Pull Request

## 📝 API Documentation

Visit http://localhost:8000/docs for complete Swagger API documentation, including:

- User authentication API
- Project management API
- Bug management API
- Requirements management API
- Task management API
- Sprint management API
- Comment API
- Global search API

## 📄 License

This project is open source under the MIT License. See [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- [React](https://react.dev/) - UI library
- [Ant Design](https://ant.design/) - Enterprise UI components
- [Vite](https://vitejs.dev/) - Next-generation frontend tooling
- [SQLAlchemy](https://www.sqlalchemy.org/) - Python SQL toolkit
- [TanStack Query](https://tanstack.com/query) - Powerful async state management
- [Zustand](https://zustand-demo.pmnd.rs/) - Lightweight state management

## 📞 Contact

- GitHub: [@Devliang24](https://github.com/Devliang24)
- Repository: https://github.com/Devliang24/tapb

---

<div align="center">

**If this project helps you, please ⭐ Star to support!**

</div>
