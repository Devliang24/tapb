from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models.user import User
from app.models.project import Project, ProjectMember
from app.models.sprint import Sprint, SprintStatus
from app.models.requirement import Requirement, RequirementStatus, RequirementPriority
from app.models.task import Task
from app.models.bug import Bug
from app.schemas.requirement import (
    RequirementCreate,
    RequirementUpdate,
    RequirementResponse,
    RequirementDetailResponse,
    RequirementListResponse,
    BulkDeleteRequest,
    BulkStatusUpdateRequest,
)
from app.schemas.bug import BugResponse
from app.utils.dependencies import get_current_user

router = APIRouter(tags=["requirements"])


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


def check_requirement_permission(
    requirement: Requirement, user: User, project: Project, action: str
):
    """Check if user can modify/delete requirement"""
    if action in ("update", "delete"):
        # Creator of requirement or project creator can modify/delete
        if requirement.creator_id != user.id and project.creator_id != user.id:
            raise HTTPException(
                status_code=403,
                detail="Only requirement creator or project creator can modify",
            )


def generate_requirement_number(db: Session, project: Project) -> str:
    """Generate unique requirement number like PROJ-REQ-001"""
    project.requirement_seq += 1
    db.flush()
    return f"{project.key}-REQ-{project.requirement_seq:03d}"


@router.get(
    "/api/projects/{project_id}/requirements", response_model=RequirementListResponse
)
def get_project_requirements(
    project_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[RequirementStatus] = None,
    priority: Optional[RequirementPriority] = None,
    sprint_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all requirements for a project with pagination and filtering"""
    check_project_access(db, project_id, current_user)

    query = db.query(Requirement).filter(Requirement.project_id == project_id)

    if status:
        query = query.filter(Requirement.status == status)
    if priority:
        query = query.filter(Requirement.priority == priority)
    if sprint_id is not None:
        query = query.filter(Requirement.sprint_id == sprint_id)

    total = query.count()
    items = (
        query.order_by(desc(Requirement.updated_at))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    # For each requirement, query related tasks and bugs
    for req in items:
        tasks = db.query(Task).filter(Task.requirement_id == req.id).all()
        # 为每个 task 查询关联的 bugs
        for task in tasks:
            task_bugs = db.query(Bug).filter(Bug.task_id == task.id).all()
            task.bugs = task_bugs
        req.tasks = tasks
        # 直接关联到需求的 bugs（不通过 task）
        bugs = (
            db.query(Bug)
            .filter(Bug.requirement_id == req.id, Bug.task_id == None)
            .all()
        )
        req.bugs = bugs

    return RequirementListResponse(
        items=items, total=total, page=page, page_size=page_size
    )


@router.post(
    "/api/projects/{project_id}/requirements",
    response_model=RequirementResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_requirement(
    project_id: int,
    req_data: RequirementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new requirement in a project"""
    project = check_project_access(db, project_id, current_user)

    # Validate sprint belongs to same project if provided
    if req_data.sprint_id:
        sprint = db.query(Sprint).filter(Sprint.id == req_data.sprint_id).first()
        if not sprint:
            raise HTTPException(status_code=404, detail="Sprint not found")
        if sprint.project_id != project_id:
            raise HTTPException(
                status_code=400, detail="Sprint must belong to the same project"
            )
        if sprint.status == SprintStatus.COMPLETED:
            raise HTTPException(
                status_code=400, detail="Cannot add requirement to completed sprint"
            )

    # Validate assignee if provided
    if req_data.assignee_id:
        assignee = db.query(User).filter(User.id == req_data.assignee_id).first()
        if not assignee:
            raise HTTPException(status_code=404, detail="Assignee not found")

    requirement_number = generate_requirement_number(db, project)

    requirement = Requirement(
        project_id=project_id,
        sprint_id=req_data.sprint_id,
        requirement_number=requirement_number,
        title=req_data.title,
        description=req_data.description,
        priority=req_data.priority,
        creator_id=current_user.id,
        assignee_id=req_data.assignee_id,
    )
    db.add(requirement)
    db.commit()
    db.refresh(requirement)
    return requirement


@router.get(
    "/api/requirements/{requirement_id}", response_model=RequirementDetailResponse
)
def get_requirement(
    requirement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get requirement by ID with creator/assignee details"""
    requirement = db.query(Requirement).filter(Requirement.id == requirement_id).first()
    if not requirement:
        raise HTTPException(status_code=404, detail="Requirement not found")

    check_project_access(db, requirement.project_id, current_user)
    return requirement


@router.put("/api/requirements/{requirement_id}", response_model=RequirementResponse)
def update_requirement(
    requirement_id: int,
    req_data: RequirementUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update requirement"""
    requirement = db.query(Requirement).filter(Requirement.id == requirement_id).first()
    if not requirement:
        raise HTTPException(status_code=404, detail="Requirement not found")

    project = check_project_access(db, requirement.project_id, current_user)
    check_requirement_permission(requirement, current_user, project, "update")

    # Status flow validation
    if req_data.status and req_data.status != requirement.status:
        valid_transitions = {
            RequirementStatus.DRAFT: [
                RequirementStatus.APPROVED,
                RequirementStatus.CANCELLED,
            ],
            RequirementStatus.APPROVED: [
                RequirementStatus.IN_PROGRESS,
                RequirementStatus.CANCELLED,
            ],
            RequirementStatus.IN_PROGRESS: [
                RequirementStatus.COMPLETED,
                RequirementStatus.CANCELLED,
            ],
            RequirementStatus.COMPLETED: [],
            RequirementStatus.CANCELLED: [],
        }
        if req_data.status not in valid_transitions.get(requirement.status, []):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status transition from {requirement.status.value} to {req_data.status.value}",
            )

    # Completed requirement cannot edit core fields
    if requirement.status == RequirementStatus.COMPLETED:
        if req_data.title or req_data.description or req_data.priority:
            raise HTTPException(
                status_code=400,
                detail="Cannot modify core fields of completed requirement",
            )

    # Validate sprint if changing
    if req_data.sprint_id is not None:
        if req_data.sprint_id != 0:  # 0 means clear sprint
            sprint = db.query(Sprint).filter(Sprint.id == req_data.sprint_id).first()
            if not sprint:
                raise HTTPException(status_code=404, detail="Sprint not found")
            if sprint.project_id != requirement.project_id:
                raise HTTPException(
                    status_code=400, detail="Sprint must belong to the same project"
                )
            if sprint.status == SprintStatus.COMPLETED:
                raise HTTPException(
                    status_code=400, detail="Cannot assign to completed sprint"
                )
        else:
            req_data.sprint_id = None

    # Apply updates
    update_data = req_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(requirement, field, value)

    db.commit()
    db.refresh(requirement)
    return requirement


@router.delete(
    "/api/requirements/{requirement_id}", status_code=status.HTTP_204_NO_CONTENT
)
def delete_requirement(
    requirement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete requirement - sets related bugs requirement_id to null"""
    requirement = db.query(Requirement).filter(Requirement.id == requirement_id).first()
    if not requirement:
        raise HTTPException(status_code=404, detail="Requirement not found")

    project = check_project_access(db, requirement.project_id, current_user)
    check_requirement_permission(requirement, current_user, project, "delete")

    # Clear requirement_id references in bugs
    db.query(Bug).filter(Bug.requirement_id == requirement_id).update(
        {Bug.requirement_id: None}
    )

    db.delete(requirement)
    db.commit()
    return None


@router.post("/api/requirements/bulk-delete")
def bulk_delete_requirements(
    request: BulkDeleteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Bulk delete requirements"""
    if not request.requirement_ids:
        raise HTTPException(status_code=400, detail="No requirement IDs provided")

    requirements = (
        db.query(Requirement).filter(Requirement.id.in_(request.requirement_ids)).all()
    )

    if not requirements:
        raise HTTPException(status_code=404, detail="No requirements found")

    deleted_count = 0
    for requirement in requirements:
        project = check_project_access(db, requirement.project_id, current_user)
        try:
            check_requirement_permission(requirement, current_user, project, "delete")
            db.query(Bug).filter(Bug.requirement_id == requirement.id).update(
                {Bug.requirement_id: None}
            )
            db.delete(requirement)
            deleted_count += 1
        except HTTPException:
            continue

    db.commit()
    return {"message": f"Successfully deleted {deleted_count} requirements"}


@router.put("/api/requirements/bulk-status")
def bulk_update_requirements_status(
    request: BulkStatusUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Bulk update requirements status"""
    if not request.requirement_ids:
        raise HTTPException(status_code=400, detail="No requirement IDs provided")

    requirements = (
        db.query(Requirement).filter(Requirement.id.in_(request.requirement_ids)).all()
    )

    if not requirements:
        raise HTTPException(status_code=404, detail="No requirements found")

    updated_count = 0
    for requirement in requirements:
        project = check_project_access(db, requirement.project_id, current_user)
        try:
            check_requirement_permission(requirement, current_user, project, "update")
            if requirement.status != request.status:
                requirement.status = request.status
            updated_count += 1
        except HTTPException:
            continue

    db.commit()
    return {"message": f"Successfully updated {updated_count} requirements"}
