from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models.user import User
from app.models.project import Project, ProjectMember
from app.models.requirement import Requirement
from app.models.task import Task
from app.models.bug import Bug
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse, ProjectMemberCreate, ProjectMemberResponse
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/api/projects", tags=["projects"])


@router.get("/", response_model=List[ProjectResponse])
def get_projects(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all projects accessible by current user (including public example spaces)"""
    # Get projects created by user, where user is a member, or public example spaces
    projects = db.query(Project).filter(
        (Project.creator_id == current_user.id) |
        (Project.id.in_(
            db.query(ProjectMember.project_id).filter(ProjectMember.user_id == current_user.id)
        )) |
        (Project.is_public == True)
    ).offset(skip).limit(limit).all()
    return projects


@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    project_data: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new project"""
    # Check if key already exists
    existing = db.query(Project).filter(Project.key == project_data.key.upper()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Project key already exists"
        )
    
    # Create project
    project = Project(
        name=project_data.name,
        key=project_data.key.upper(),
        description=project_data.description,
        creator_id=current_user.id
    )
    db.add(project)
    db.flush()  # Get project.id
    
    # Add creator as owner
    owner_member = ProjectMember(
        project_id=project.id,
        user_id=current_user.id,
        role="owner"
    )
    db.add(owner_member)
    
    # Add additional members if provided
    if project_data.member_ids:
        for user_id in project_data.member_ids:
            if user_id != current_user.id:  # Skip if already added as owner
                # Check if user exists
                user = db.query(User).filter(User.id == user_id).first()
                if user:
                    member = ProjectMember(
                        project_id=project.id,
                        user_id=user_id,
                        role="member"
                    )
                    db.add(member)
    
    db.commit()
    db.refresh(project)
    return project


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get project by ID"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Check access (allow public projects)
    if project.is_public:
        return project
    
    is_creator = project.creator_id == current_user.id
    is_member = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == current_user.id
    ).first()
    
    if not (is_creator or is_member):
        raise HTTPException(status_code=403, detail="Access denied")
    
    return project


@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: int,
    project_data: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update project"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Only creator can update
    if project.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only project creator can update")
    
    # Update fields
    if project_data.name is not None:
        project.name = project_data.name
    if project_data.description is not None:
        project.description = project_data.description
    
    db.commit()
    db.refresh(project)
    return project


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete project"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Prevent deletion of demo project
    if project.key == "DEMO":
        raise HTTPException(status_code=403, detail="示例空间不能删除")
    
    # Only creator can delete
    if project.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only project creator can delete")
    
    db.delete(project)
    db.commit()
    return None


@router.get("/{project_id}/members", response_model=List[ProjectMemberResponse])
def get_project_members(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get project members with user info"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    members = db.query(ProjectMember).filter(ProjectMember.project_id == project_id).all()
    
    # Add user info to each member
    result = []
    for member in members:
        user = db.query(User).filter(User.id == member.user_id).first()
        member_dict = {
            "id": member.id,
            "project_id": member.project_id,
            "user_id": member.user_id,
            "role": member.role,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email
            } if user else None
        }
        result.append(member_dict)
    return result


@router.post("/{project_id}/members", response_model=ProjectMemberResponse, status_code=status.HTTP_201_CREATED)
def add_project_member(
    project_id: int,
    member_data: ProjectMemberCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add member to project"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Only creator can add members
    if project.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only project creator can add members")
    
    # Check if user exists
    user = db.query(User).filter(User.id == member_data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if already member
    existing = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == member_data.user_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="User is already a member")
    
    # Add member
    member = ProjectMember(
        project_id=project_id,
        user_id=member_data.user_id,
        role=member_data.role
    )
    db.add(member)
    db.commit()
    db.refresh(member)
    return member


@router.put("/{project_id}/members/{member_id}", response_model=ProjectMemberResponse)
def update_project_member(
    project_id: int,
    member_id: int,
    member_data: ProjectMemberCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update member role"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Only creator can update members
    if project.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only project creator can update members")
    
    member = db.query(ProjectMember).filter(
        ProjectMember.id == member_id,
        ProjectMember.project_id == project_id
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    member.role = member_data.role
    db.commit()
    db.refresh(member)
    return member


@router.delete("/{project_id}/members/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_project_member(
    project_id: int,
    member_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove member from project"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Only creator can remove members
    if project.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only project creator can remove members")
    
    member = db.query(ProjectMember).filter(
        ProjectMember.id == member_id,
        ProjectMember.project_id == project_id
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    # Cannot remove owner
    if member.role == "owner":
        raise HTTPException(status_code=400, detail="Cannot remove project owner")
    
    db.delete(member)
    db.commit()
    return None


@router.get("/{project_id}/search")
def global_search(
    project_id: int,
    q: str = Query(..., min_length=1, description="搜索关键词"),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """全局搜索：同时搜索需求、任务、缺陷"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    search_pattern = f"%{q}%"
    
    # 搜索需求
    requirements = db.query(Requirement).filter(
        Requirement.project_id == project_id,
        or_(
            Requirement.title.ilike(search_pattern),
            Requirement.requirement_number.ilike(search_pattern),
            Requirement.description.ilike(search_pattern)
        )
    ).limit(limit).all()
    
    # 搜索任务（通过需求关联项目）
    req_ids = [r.id for r in db.query(Requirement.id).filter(Requirement.project_id == project_id).all()]
    tasks = []
    if req_ids:
        tasks = db.query(Task).filter(
            Task.requirement_id.in_(req_ids),
            or_(
                Task.title.ilike(search_pattern),
                Task.task_number.ilike(search_pattern),
                Task.description.ilike(search_pattern)
            )
        ).limit(limit).all()
    
    # 搜索缺陷
    bugs = db.query(Bug).filter(
        Bug.project_id == project_id,
        or_(
            Bug.title.ilike(search_pattern),
            Bug.bug_number.ilike(search_pattern),
            Bug.description.ilike(search_pattern)
        )
    ).limit(limit).all()
    
    return {
        "requirements": [
            {
                "id": r.id,
                "number": r.requirement_number,
                "title": r.title,
                "status": r.status.value if r.status else None,
                "type": "requirement"
            } for r in requirements
        ],
        "tasks": [
            {
                "id": t.id,
                "number": t.task_number,
                "title": t.title,
                "status": t.status.value if t.status else None,
                "requirement_id": t.requirement_id,
                "type": "task"
            } for t in tasks
        ],
        "bugs": [
            {
                "id": b.id,
                "number": b.bug_number,
                "title": b.title,
                "status": b.status.value if b.status else None,
                "type": "bug"
            } for b in bugs
        ]
    }
