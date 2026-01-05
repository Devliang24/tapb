from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models.user import User
from app.models.bug import Bug, BugStatus, BugPriority, BugHistory
from app.models.project import ProjectMember
from app.schemas.bug import (
    BugCreate, BugUpdate, BugResponse, BugListResponse, BugDetailResponse,
    BugStatusUpdate, BugAssignUpdate, 
    BugBatchStatusUpdate, BugBatchAssignUpdate, BugBatchRequest
)
from app.schemas.comment import CommentCreate, CommentUpdate, CommentResponse
from app.models.comment import BugComment
from app.services.bug_service import create_bug, update_bug, create_history
from app.utils.dependencies import get_current_user
from app.utils.comment_utils import extract_mentions

router = APIRouter(prefix="/api/bugs", tags=["bugs"])


@router.get("/", response_model=BugListResponse)
def get_bugs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    project_id: Optional[int] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    severity: Optional[str] = None,
    sprint_id: Optional[int] = None,
    requirement_id: Optional[int] = None,
    assignee_id: Optional[int] = None,
    creator_id: Optional[int] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get bugs with filters and pagination"""
    query = db.query(Bug)
    
    # Filter by project access
    accessible_projects = db.query(ProjectMember.project_id).filter(
        ProjectMember.user_id == current_user.id
    ).all()
    accessible_project_ids = [p[0] for p in accessible_projects]
    
    if accessible_project_ids:
        query = query.filter(Bug.project_id.in_(accessible_project_ids))
    
    # Apply filters
    if project_id:
        query = query.filter(Bug.project_id == project_id)
    if status:
        query = query.filter(Bug.status == status)
    if priority:
        query = query.filter(Bug.priority == priority)
    if severity:
        query = query.filter(Bug.severity == severity)
    if sprint_id:
        query = query.filter(Bug.sprint_id == sprint_id)
    if requirement_id:
        query = query.filter(Bug.requirement_id == requirement_id)
    if assignee_id:
        query = query.filter(Bug.assignee_id == assignee_id)
    if creator_id:
        query = query.filter(Bug.creator_id == creator_id)
    if search:
        query = query.filter(or_(
            Bug.title.contains(search),
            Bug.bug_number.contains(search),
            Bug.description.contains(search)
        ))
    
    # Get total count
    total = query.count()
    
    # Pagination
    skip = (page - 1) * page_size
    bugs = query.order_by(Bug.created_at.desc()).offset(skip).limit(page_size).all()
    
    return {
        "items": bugs,
        "total": total,
        "page": page,
        "page_size": page_size
    }


@router.post("/", response_model=BugResponse, status_code=status.HTTP_201_CREATED)
def create_new_bug(
    bug_data: BugCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new bug"""
    bug = create_bug(db, bug_data, current_user)
    return bug


@router.get("/{bug_id}", response_model=BugDetailResponse)
def get_bug(
    bug_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get bug by ID with creator and assignee info"""
    bug = db.query(Bug).filter(Bug.id == bug_id).first()
    if not bug:
        raise HTTPException(status_code=404, detail="Bug not found")
    return bug


@router.put("/{bug_id}", response_model=BugResponse)
def update_bug_info(
    bug_id: int,
    bug_data: BugUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update bug"""
    bug = update_bug(db, bug_id, bug_data, current_user)
    return bug


@router.delete("/{bug_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_bug(
    bug_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete bug"""
    bug = db.query(Bug).filter(Bug.id == bug_id).first()
    if not bug:
        raise HTTPException(status_code=404, detail="Bug not found")
    
    # Only creator can delete
    if bug.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only bug creator can delete")
    
    db.delete(bug)
    db.commit()
    return None


@router.put("/{bug_id}/status", response_model=BugResponse)
def update_bug_status(
    bug_id: int,
    status_data: BugStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update bug status"""
    bug = db.query(Bug).filter(Bug.id == bug_id).first()
    if not bug:
        raise HTTPException(status_code=404, detail="Bug not found")
    
    old_status = bug.status.value
    bug.status = status_data.status
    db.commit()
    db.refresh(bug)
    
    # Create history
    create_history(db, bug.id, "status", old_status, status_data.status.value, current_user.id)
    
    return bug


@router.put("/{bug_id}/assign", response_model=BugResponse)
def assign_bug(
    bug_id: int,
    assign_data: BugAssignUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Assign bug to user"""
    bug = db.query(Bug).filter(Bug.id == bug_id).first()
    if not bug:
        raise HTTPException(status_code=404, detail="Bug not found")
    
    old_assignee = str(bug.assignee_id) if bug.assignee_id else "未分配"
    bug.assignee_id = assign_data.assignee_id
    db.commit()
    db.refresh(bug)
    
    # Create history
    create_history(db, bug.id, "assignee", old_assignee, str(assign_data.assignee_id), current_user.id)
    
    return bug


@router.post("/batch/status")
def batch_update_status(
    data: BugBatchStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Batch update bug status"""
    bugs = db.query(Bug).filter(Bug.id.in_(data.bug_ids)).all()
    
    for bug in bugs:
        old_status = bug.status.value
        bug.status = data.status
        create_history(db, bug.id, "status", old_status, data.status.value, current_user.id)
    
    db.commit()
    return {"message": f"Updated {len(bugs)} bugs"}


@router.post("/batch/assign")
def batch_assign(
    data: BugBatchAssignUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Batch assign bugs"""
    bugs = db.query(Bug).filter(Bug.id.in_(data.bug_ids)).all()
    
    for bug in bugs:
        old_assignee = str(bug.assignee_id) if bug.assignee_id else "未分配"
        bug.assignee_id = data.assignee_id
        create_history(db, bug.id, "assignee", old_assignee, str(data.assignee_id), current_user.id)
    
    db.commit()
    return {"message": f"Assigned {len(bugs)} bugs"}


@router.post("/batch/delete", status_code=status.HTTP_204_NO_CONTENT)
def batch_delete(
    data: BugBatchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Batch delete bugs"""
    bugs = db.query(Bug).filter(Bug.id.in_(data.bug_ids)).all()
    
    # Check permissions - only creators can delete
    for bug in bugs:
        if bug.creator_id != current_user.id:
            raise HTTPException(
                status_code=403, 
                detail=f"Cannot delete bug {bug.bug_number}: Only creator can delete"
            )
    
    for bug in bugs:
        db.delete(bug)
    
    db.commit()
    return None


# Comment APIs
@router.get("/{bug_id}/comments", response_model=list[CommentResponse])
def get_comments(
    bug_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get comments for a bug with user information"""
    bug = db.query(Bug).filter(Bug.id == bug_id).first()
    if not bug:
        raise HTTPException(status_code=404, detail="Bug not found")
    
    comments = db.query(BugComment).filter(BugComment.bug_id == bug_id).order_by(BugComment.created_at.desc()).all()
    return comments


@router.post("/{bug_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
def create_comment(
    bug_id: int,
    comment_data: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add a comment to a bug"""
    bug = db.query(Bug).filter(Bug.id == bug_id).first()
    if not bug:
        raise HTTPException(status_code=404, detail="Bug not found")
    
    # Extract mentions from content
    mentioned_user_ids = extract_mentions(comment_data.content, db, bug.project_id)
    
    comment = BugComment(
        bug_id=bug_id,
        user_id=current_user.id,
        content=comment_data.content,
        mentioned_user_ids=mentioned_user_ids
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment


@router.put("/{bug_id}/comments/{comment_id}", response_model=CommentResponse)
def update_comment(
    bug_id: int,
    comment_id: int,
    comment_data: CommentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Edit a comment"""
    comment = db.query(BugComment).filter(
        BugComment.id == comment_id,
        BugComment.bug_id == bug_id
    ).first()
    
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    # Only comment author can edit
    if comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only comment author can edit")
    
    # Update content and mentions if provided
    if comment_data.content is not None:
        comment.content = comment_data.content
        
        # Extract new mentions
        bug = db.query(Bug).filter(Bug.id == bug_id).first()
        mentioned_user_ids = extract_mentions(comment_data.content, db, bug.project_id)
        comment.mentioned_user_ids = mentioned_user_ids
    
    db.commit()
    db.refresh(comment)
    return comment


@router.delete("/{bug_id}/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    bug_id: int,
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a comment"""
    comment = db.query(BugComment).filter(
        BugComment.id == comment_id,
        BugComment.bug_id == bug_id
    ).first()
    
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    # Only comment author can delete
    if comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only comment author can delete")
    
    db.delete(comment)
    db.commit()
    return None


# History API
@router.get("/{bug_id}/history")
def get_bug_history(
    bug_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get bug change history"""
    bug = db.query(Bug).filter(Bug.id == bug_id).first()
    if not bug:
        raise HTTPException(status_code=404, detail="Bug not found")
    
    history = db.query(BugHistory).filter(
        BugHistory.bug_id == bug_id
    ).order_by(BugHistory.changed_at.desc()).all()
    
    # Build response with user info
    result = []
    for h in history:
        user = db.query(User).filter(User.id == h.changed_by).first()
        result.append({
            "id": h.id,
            "field": h.field,
            "old_value": h.old_value,
            "new_value": h.new_value,
            "changed_by": h.changed_by,
            "changed_at": h.changed_at.isoformat(),
            "user": {
                "id": user.id,
                "username": user.username
            } if user else None
        })
    
    return result
