from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, projects, bugs, sprints, requirements, tasks, users, upload, testcases

app = FastAPI(title="TAPB - Bug Management System")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"message": "Welcome to TAPB API"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


# Register routers
app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(bugs.router)
app.include_router(sprints.router)
app.include_router(requirements.router)
app.include_router(tasks.router)
app.include_router(users.router)
app.include_router(upload.router)
app.include_router(testcases.router)
