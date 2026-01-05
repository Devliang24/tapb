from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.bug import Bug, BugStatus, BugHistory, BugEnvironment, BugCause
from app.models.project import Project
from app.models.user import User
from app.schemas.bug import BugCreate, BugUpdate


def generate_bug_number(bug_id: int) -> str:
    """Generate bug number using database ID (e.g., B1, B2, ...)"""
    return f"B{bug_id}"


def create_bug(db: Session, bug_data: BugCreate, creator: User) -> Bug:
    """Create a new bug"""
    # Create bug with placeholder number first
    bug = Bug(
        project_id=bug_data.project_id,
        bug_number="TEMP",  # Will be updated after getting ID
        title=bug_data.title,
        description=bug_data.description,
        priority=bug_data.priority,
        severity=bug_data.severity,
        creator_id=creator.id,
        assignee_id=bug_data.assignee_id,
        sprint_id=bug_data.sprint_id,
        requirement_id=bug_data.requirement_id,
        environment=bug_data.environment,
        defect_cause=bug_data.defect_cause,
        status=BugStatus.NEW
    )
    db.add(bug)
    db.flush()  # Get the ID
    
    # Update bug number using the database ID
    bug.bug_number = generate_bug_number(bug.id)
    
    db.commit()
    db.refresh(bug)
    
    # Create history record
    create_history(db, bug.id, "status", None, BugStatus.NEW.value, creator.id)
    
    return bug


def update_bug(db: Session, bug_id: int, bug_data: BugUpdate, user: User) -> Bug:
    """Update bug"""
    bug = db.query(Bug).filter(Bug.id == bug_id).first()
    if not bug:
        raise HTTPException(status_code=404, detail="Bug not found")
    
    # Track changes for history
    changes = []
    
    if bug_data.title is not None and bug_data.title != bug.title:
        changes.append(("title", bug.title, bug_data.title))
        bug.title = bug_data.title
    
    if bug_data.description is not None and bug_data.description != bug.description:
        changes.append(("description", bug.description[:50], bug_data.description[:50]))
        bug.description = bug_data.description
    
    if bug_data.status is not None and bug_data.status != bug.status:
        changes.append(("status", bug.status.value, bug_data.status.value))
        bug.status = bug_data.status
    
    if bug_data.priority is not None and bug_data.priority != bug.priority:
        changes.append(("priority", bug.priority.value, bug_data.priority.value))
        bug.priority = bug_data.priority
    
    if bug_data.severity is not None and bug_data.severity != bug.severity:
        changes.append(("severity", bug.severity.value, bug_data.severity.value))
        bug.severity = bug_data.severity
    
    if bug_data.assignee_id is not None and bug_data.assignee_id != bug.assignee_id:
        old_assignee = str(bug.assignee_id) if bug.assignee_id else "未分配"
        new_assignee = str(bug_data.assignee_id)
        changes.append(("assignee", old_assignee, new_assignee))
        bug.assignee_id = bug_data.assignee_id
    
    if bug_data.requirement_id is not None and bug_data.requirement_id != bug.requirement_id:
        old_req = str(bug.requirement_id) if bug.requirement_id else "未关联"
        new_req = str(bug_data.requirement_id)
        changes.append(("requirement", old_req, new_req))
        bug.requirement_id = bug_data.requirement_id
    
    if bug_data.sprint_id is not None and bug_data.sprint_id != bug.sprint_id:
        old_sprint = str(bug.sprint_id) if bug.sprint_id else "未关联"
        new_sprint = str(bug_data.sprint_id)
        changes.append(("sprint", old_sprint, new_sprint))
        bug.sprint_id = bug_data.sprint_id
    
    if bug_data.environment is not None and bug_data.environment != bug.environment:
        old_env = bug.environment.value if bug.environment else "未设置"
        changes.append(("environment", old_env, bug_data.environment.value))
        bug.environment = bug_data.environment
    
    if bug_data.defect_cause is not None and bug_data.defect_cause != bug.defect_cause:
        old_cause = bug.defect_cause.value if bug.defect_cause else "未设置"
        changes.append(("defect_cause", old_cause, bug_data.defect_cause.value))
        bug.defect_cause = bug_data.defect_cause
    
    db.commit()
    db.refresh(bug)
    
    # Create history records
    for field, old_val, new_val in changes:
        create_history(db, bug.id, field, old_val, new_val, user.id)
    
    return bug


def create_history(db: Session, bug_id: int, field: str, old_value: str, new_value: str, user_id: int):
    """Create bug history record"""
    history = BugHistory(
        bug_id=bug_id,
        field=field,
        old_value=old_value,
        new_value=new_value,
        changed_by=user_id
    )
    db.add(history)
    db.commit()
