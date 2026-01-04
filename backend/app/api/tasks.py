from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models.user import User
from app.models.project import Project, ProjectMember
from app.models.requirement import Requirement
from app.models.task import Task, TaskStatus
from app.schemas.task import (
    TaskCreate,
    TaskUpdate,
    TaskResponse,
    TaskDetailResponse,
    TaskListResponse,
)
from app.utils.dependencies import get_current_user

router = APIRouter(tags=["tasks"])


def check_project_access(db: Session, project_id: int, user: User) -> Project:
    """Check if user has access to project and return project"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    is_creator = project.creator_id == user.id
    is_member = (
        db.query(ProjectMember)
        .filter(
            ProjectMember.project_id == project_id, ProjectMember.user_id == user.id
        )
        .first()
    )

    if not (is_creator or is_member):
        raise HTTPException(status_code=403, detail="Access denied")

    return project


def generate_task_number(db: Session, project: Project) -> str:
    """Generate unique task number like PROJ-TASK-001"""
    # 使用 project 的 task_seq 计数器
    if not hasattr(project, 'task_seq') or project.task_seq is None:
        project.task_seq = 0
    project.task_seq += 1
    db.flush()
    return f"{project.key}-TASK-{project.task_seq:03d}"


@router.get("/api/requirements/{requirement_id}/tasks", response_model=TaskListResponse)
def get_requirement_tasks(
    requirement_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[TaskStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all tasks for a requirement with pagination"""
    requirement = db.query(Requirement).filter(Requirement.id == requirement_id).first()
    if not requirement:
        raise HTTPException(status_code=404, detail="Requirement not found")

    check_project_access(db, requirement.project_id, current_user)

    query = db.query(Task).filter(Task.requirement_id == requirement_id)

    if status:
        query = query.filter(Task.status == status)

    total = query.count()
    items = (
        query.order_by(desc(Task.created_at))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return TaskListResponse(items=items, total=total, page=page, page_size=page_size)


@router.post(
    "/api/requirements/{requirement_id}/tasks",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_task(
    requirement_id: int,
    task_data: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new task under a requirement"""
    requirement = db.query(Requirement).filter(Requirement.id == requirement_id).first()
    if not requirement:
        raise HTTPException(status_code=404, detail="Requirement not found")

    project = check_project_access(db, requirement.project_id, current_user)

    task_number = generate_task_number(db, project)

    task = Task(
        requirement_id=requirement_id,
        task_number=task_number,
        title=task_data.title,
        description=task_data.description,
        status=task_data.status,
        priority=task_data.priority,
        creator_id=current_user.id,
        assignee_id=task_data.assignee_id,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.get("/api/tasks/{task_id}", response_model=TaskDetailResponse)
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get task by ID"""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    requirement = db.query(Requirement).filter(Requirement.id == task.requirement_id).first()
    check_project_access(db, requirement.project_id, current_user)

    return task


@router.put("/api/tasks/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    task_data: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update task"""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    requirement = db.query(Requirement).filter(Requirement.id == task.requirement_id).first()
    check_project_access(db, requirement.project_id, current_user)

    # Apply updates
    update_data = task_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(task, field, value)

    db.commit()
    db.refresh(task)
    return task


@router.delete("/api/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete task"""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    requirement = db.query(Requirement).filter(Requirement.id == task.requirement_id).first()
    check_project_access(db, requirement.project_id, current_user)

    db.delete(task)
    db.commit()
    return None
