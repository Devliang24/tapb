from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models.user import User
from app.models.project import Project, ProjectMember
from app.models.sprint import Sprint, SprintStatus
from app.models.bug import Bug
from app.models.requirement import Requirement
from app.schemas.sprint import SprintCreate, SprintUpdate, SprintResponse, SprintListResponse
from app.utils.dependencies import get_current_user

router = APIRouter(tags=["sprints"])


def check_project_access(db: Session, project_id: int, user: User) -> Project:
    """Check if user has access to project and return project"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    is_creator = project.creator_id == user.id
    is_member = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == user.id
    ).first()

    if not (is_creator or is_member):
        raise HTTPException(status_code=403, detail="Access denied")

    return project


def check_sprint_permission(db: Session, sprint: Sprint, user: User, project: Project, action: str):
    """Check if user can modify/delete sprint"""
    if action in ("update", "delete"):
        # Only project creator can update/delete sprint
        if project.creator_id != user.id:
            raise HTTPException(
                status_code=403,
                detail="Only project creator can modify sprints"
            )


def generate_sprint_number(sprint_id: int) -> str:
    """Generate unique sprint number using database ID (e.g., S1, S2, ...)"""
    return f"S{sprint_id}"


@router.get("/api/projects/{project_id}/sprints", response_model=SprintListResponse)
def get_project_sprints(
    project_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[SprintStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all sprints for a project with pagination and filtering"""
    check_project_access(db, project_id, current_user)

    query = db.query(Sprint).filter(Sprint.project_id == project_id)

    if status:
        query = query.filter(Sprint.status == status)

    total = query.count()
    items = query.order_by(desc(Sprint.updated_at)).offset((page - 1) * page_size).limit(page_size).all()

    return SprintListResponse(items=items, total=total, page=page, page_size=page_size)


@router.post("/api/projects/{project_id}/sprints", response_model=SprintResponse, status_code=status.HTTP_201_CREATED)
def create_sprint(
    project_id: int,
    sprint_data: SprintCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new sprint in a project"""
    project = check_project_access(db, project_id, current_user)

    sprint = Sprint(
        project_id=project_id,
        sprint_number="TEMP",  # Will be updated after getting ID
        name=sprint_data.name,
        goal=sprint_data.goal,
        start_date=sprint_data.start_date,
        end_date=sprint_data.end_date,
    )
    db.add(sprint)
    db.flush()  # Get the ID
    
    # Update sprint number using the database ID
    sprint.sprint_number = generate_sprint_number(sprint.id)
    
    db.commit()
    db.refresh(sprint)
    return sprint


@router.get("/api/sprints/{sprint_id}", response_model=SprintResponse)
def get_sprint(
    sprint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get sprint by ID"""
    sprint = db.query(Sprint).filter(Sprint.id == sprint_id).first()
    if not sprint:
        raise HTTPException(status_code=404, detail="Sprint not found")

    check_project_access(db, sprint.project_id, current_user)
    return sprint


@router.put("/api/sprints/{sprint_id}", response_model=SprintResponse)
def update_sprint(
    sprint_id: int,
    sprint_data: SprintUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update sprint"""
    sprint = db.query(Sprint).filter(Sprint.id == sprint_id).first()
    if not sprint:
        raise HTTPException(status_code=404, detail="Sprint not found")

    project = check_project_access(db, sprint.project_id, current_user)
    check_sprint_permission(db, sprint, current_user, project, "update")

    # Status flow validation: planning -> active -> completed
    if sprint_data.status:
        valid_transitions = {
            SprintStatus.PLANNING: [SprintStatus.ACTIVE],
            SprintStatus.ACTIVE: [SprintStatus.COMPLETED],
            SprintStatus.COMPLETED: [],
        }
        if sprint_data.status != sprint.status:
            if sprint_data.status not in valid_transitions.get(sprint.status, []):
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid status transition from {sprint.status.value} to {sprint_data.status.value}"
                )

    # Completed sprint cannot modify dates
    if sprint.status == SprintStatus.COMPLETED:
        if sprint_data.start_date is not None or sprint_data.end_date is not None:
            raise HTTPException(
                status_code=400,
                detail="Cannot modify dates of completed sprint"
            )

    # Apply updates
    update_data = sprint_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(sprint, field, value)

    db.commit()
    db.refresh(sprint)
    return sprint


@router.delete("/api/sprints/{sprint_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_sprint(
    sprint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete sprint - sets related bugs/requirements sprint_id to null"""
    sprint = db.query(Sprint).filter(Sprint.id == sprint_id).first()
    if not sprint:
        raise HTTPException(status_code=404, detail="Sprint not found")

    project = check_project_access(db, sprint.project_id, current_user)
    check_sprint_permission(db, sprint, current_user, project, "delete")

    # Clear sprint_id references in bugs and requirements
    db.query(Bug).filter(Bug.sprint_id == sprint_id).update({Bug.sprint_id: None})
    db.query(Requirement).filter(Requirement.sprint_id == sprint_id).update({Requirement.sprint_id: None})

    db.delete(sprint)
    db.commit()
    return None


@router.get("/api/sprints/{sprint_id}/stats")
def get_sprint_stats(
    sprint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取迭代统计数据"""
    sprint = db.query(Sprint).filter(Sprint.id == sprint_id).first()
    if not sprint:
        raise HTTPException(status_code=404, detail="Sprint not found")

    check_project_access(db, sprint.project_id, current_user)

    # 统计需求数量
    total_requirements = db.query(Requirement).filter(
        Requirement.sprint_id == sprint_id
    ).count()

    # 统计已完成需求数量
    from app.models.requirement import RequirementStatus
    completed_requirements = db.query(Requirement).filter(
        Requirement.sprint_id == sprint_id,
        Requirement.status == RequirementStatus.COMPLETED
    ).count()

    return {
        "total_requirements": total_requirements,
        "completed_requirements": completed_requirements,
    }
