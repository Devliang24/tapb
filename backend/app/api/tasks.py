from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models.user import User
from app.models.project import Project, ProjectMember
from app.models.requirement import Requirement
from app.models.task import Task, TaskStatus, TaskHistory
from app.schemas.task import (
    TaskCreate,
    TaskUpdate,
    TaskResponse,
    TaskDetailResponse,
    TaskListResponse,
)
from app.schemas.comment import CommentCreate, CommentUpdate, TaskCommentResponse
from app.models.comment import TaskComment
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


def generate_task_number(task_id: int) -> str:
    """Generate unique task number using database ID (e.g., T1, T2, ...)"""
    return f"T{task_id}"


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

    task = Task(
        requirement_id=requirement_id,
        task_number="TEMP",  # Will be updated after getting ID
        title=task_data.title,
        description=task_data.description,
        status=task_data.status,
        priority=task_data.priority,
        creator_id=current_user.id,
        assignee_id=task_data.assignee_id,
    )
    db.add(task)
    db.flush()  # Get the ID
    
    # Update task number using the database ID
    task.task_number = generate_task_number(task.id)
    
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

    # Apply updates and record history
    update_data = task_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        old_value = getattr(task, field)
        if old_value != value:
            old_str = old_value.value if hasattr(old_value, 'value') else str(old_value) if old_value is not None else None
            new_str = value.value if hasattr(value, 'value') else str(value) if value is not None else None
            history_entry = TaskHistory(
                task_id=task_id,
                field=field,
                old_value=old_str,
                new_value=new_str,
                changed_by=current_user.id,
            )
            db.add(history_entry)
        setattr(task, field, value)

    db.commit()
    db.refresh(task)
    return task


@router.get("/api/tasks/{task_id}/history")
def get_task_history(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get task history"""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    requirement = db.query(Requirement).filter(Requirement.id == task.requirement_id).first()
    check_project_access(db, requirement.project_id, current_user)

    history = db.query(TaskHistory).filter(
        TaskHistory.task_id == task_id
    ).order_by(desc(TaskHistory.changed_at)).all()
    
    return [
        {
            "id": h.id,
            "field": h.field,
            "old_value": h.old_value,
            "new_value": h.new_value,
            "changed_at": h.changed_at,
            "user": {"id": h.user.id, "username": h.user.username} if h.user else None
        }
        for h in history
    ]


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


# Comment APIs
@router.get("/api/tasks/{task_id}/comments", response_model=list[TaskCommentResponse])
def get_task_comments(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get comments for a task"""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    requirement = db.query(Requirement).filter(Requirement.id == task.requirement_id).first()
    check_project_access(db, requirement.project_id, current_user)
    
    comments = db.query(TaskComment).filter(
        TaskComment.task_id == task_id
    ).order_by(TaskComment.created_at.desc()).all()
    return comments


@router.post("/api/tasks/{task_id}/comments", response_model=TaskCommentResponse, status_code=status.HTTP_201_CREATED)
def create_task_comment(
    task_id: int,
    comment_data: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add a comment to a task"""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    requirement = db.query(Requirement).filter(Requirement.id == task.requirement_id).first()
    check_project_access(db, requirement.project_id, current_user)
    
    comment = TaskComment(
        task_id=task_id,
        user_id=current_user.id,
        content=comment_data.content,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment


@router.put("/api/tasks/{task_id}/comments/{comment_id}", response_model=TaskCommentResponse)
def update_task_comment(
    task_id: int,
    comment_id: int,
    comment_data: CommentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a task comment"""
    comment = db.query(TaskComment).filter(
        TaskComment.id == comment_id,
        TaskComment.task_id == task_id
    ).first()
    
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    if comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only comment author can edit")
    
    if comment_data.content is not None:
        comment.content = comment_data.content
    
    db.commit()
    db.refresh(comment)
    return comment


@router.delete("/api/tasks/{task_id}/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task_comment(
    task_id: int,
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a task comment"""
    comment = db.query(TaskComment).filter(
        TaskComment.id == comment_id,
        TaskComment.task_id == task_id
    ).first()
    
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    if comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only comment author can delete")
    
    db.delete(comment)
    db.commit()
    return None
