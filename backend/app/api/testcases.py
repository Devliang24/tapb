from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models.user import User
from app.models.project import Project, ProjectMember
from app.models.testcase import TestCase, TestCaseCategory, TestCaseHistory
from sqlalchemy import desc
from app.schemas.testcase import (
    TestCaseCreate, TestCaseUpdate, TestCaseResponse, TestCaseListResponse,
    CategoryCreate, CategoryUpdate, CategoryResponse,
    TestCaseBatchDeleteRequest
)
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/api/testcases", tags=["testcases"])


# ========== TestCase Endpoints ==========

@router.get("/", response_model=TestCaseListResponse)
def get_testcases(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    project_id: Optional[int] = None,
    category_id: Optional[int] = None,
    type: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    creator_id: Optional[int] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get testcases with filters and pagination"""
    query = db.query(TestCase)
    
    # Filter by project access
    accessible_projects = db.query(ProjectMember.project_id).filter(
        ProjectMember.user_id == current_user.id
    ).all()
    accessible_project_ids = [p[0] for p in accessible_projects]
    
    if accessible_project_ids:
        query = query.filter(TestCase.project_id.in_(accessible_project_ids))
    
    # Apply filters
    if project_id:
        query = query.filter(TestCase.project_id == project_id)
    if category_id:
        query = query.filter(TestCase.category_id == category_id)
    if type:
        query = query.filter(TestCase.type == type)
    if status:
        query = query.filter(TestCase.status == status)
    if priority:
        query = query.filter(TestCase.priority == priority)
    if creator_id:
        query = query.filter(TestCase.creator_id == creator_id)
    if search:
        query = query.filter(or_(
            TestCase.name.contains(search),
            TestCase.case_number.contains(search)
        ))
    
    # Get total count
    total = query.count()
    
    # Pagination
    skip = (page - 1) * page_size
    testcases = query.order_by(TestCase.created_at.desc()).offset(skip).limit(page_size).all()
    
    return {
        "items": testcases,
        "total": total,
        "page": page,
        "page_size": page_size
    }


@router.post("/", response_model=TestCaseResponse, status_code=status.HTTP_201_CREATED)
def create_testcase(
    testcase_data: TestCaseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new testcase"""
    # Verify project exists and user has access
    project = db.query(Project).filter(Project.id == testcase_data.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Check if user is a member
    member = db.query(ProjectMember).filter(
        ProjectMember.project_id == testcase_data.project_id,
        ProjectMember.user_id == current_user.id
    ).first()
    if not member and project.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Create testcase with placeholder number
    testcase = TestCase(
        project_id=testcase_data.project_id,
        category_id=testcase_data.category_id,
        requirement_id=testcase_data.requirement_id,
        case_number="TEMP",  # Will be updated after getting ID
        name=testcase_data.name,
        type=testcase_data.type,
        status=testcase_data.status,
        priority=testcase_data.priority,
        precondition=testcase_data.precondition,
        steps=testcase_data.steps,
        expected_result=testcase_data.expected_result,
        creator_id=current_user.id
    )
    
    db.add(testcase)
    db.flush()  # Get the ID
    
    # Update case number using the database ID
    testcase.case_number = f"TC{testcase.id}"
    
    db.commit()
    db.refresh(testcase)
    
    return testcase


@router.post("/batch-delete", status_code=status.HTTP_204_NO_CONTENT)
def batch_delete_testcases(
    data: TestCaseBatchDeleteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Batch delete testcases"""
    testcases = db.query(TestCase).filter(TestCase.id.in_(data.ids)).all()
    
    for testcase in testcases:
        db.delete(testcase)
    
    db.commit()
    return None


# ========== Category Endpoints ==========
# NOTE: These routes MUST be defined before /{testcase_id} routes to avoid path conflicts

@router.get("/categories", response_model=List[CategoryResponse])
def get_categories(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get testcase categories for a project"""
    categories = db.query(TestCaseCategory).filter(
        TestCaseCategory.project_id == project_id
    ).order_by(TestCaseCategory.order, TestCaseCategory.id).all()
    
    return categories


@router.post("/categories", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    category_data: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new category"""
    # Verify project exists
    project = db.query(Project).filter(Project.id == category_data.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Get max order
    max_order = db.query(TestCaseCategory).filter(
        TestCaseCategory.project_id == category_data.project_id,
        TestCaseCategory.parent_id == category_data.parent_id
    ).count()
    
    category = TestCaseCategory(
        project_id=category_data.project_id,
        parent_id=category_data.parent_id,
        name=category_data.name,
        order=max_order
    )
    
    db.add(category)
    db.commit()
    db.refresh(category)
    
    return category


@router.put("/categories/{category_id}", response_model=CategoryResponse)
def update_category(
    category_id: int,
    category_data: CategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update category"""
    category = db.query(TestCaseCategory).filter(TestCaseCategory.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    update_data = category_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(category, field, value)
    
    db.commit()
    db.refresh(category)
    
    return category


@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete category (testcases in this category will become uncategorized)"""
    category = db.query(TestCaseCategory).filter(TestCaseCategory.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Move testcases to uncategorized
    db.query(TestCase).filter(TestCase.category_id == category_id).update(
        {TestCase.category_id: None}
    )
    
    # Move child categories to parent
    db.query(TestCaseCategory).filter(TestCaseCategory.parent_id == category_id).update(
        {TestCaseCategory.parent_id: category.parent_id}
    )
    
    db.delete(category)
    db.commit()
    return None


# ========== Dynamic TestCase Endpoints ==========
# NOTE: These routes with {testcase_id} MUST come after all static routes

@router.get("/{testcase_id}", response_model=TestCaseResponse)
def get_testcase(
    testcase_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get testcase by ID"""
    testcase = db.query(TestCase).filter(TestCase.id == testcase_id).first()
    if not testcase:
        raise HTTPException(status_code=404, detail="TestCase not found")
    return testcase


@router.put("/{testcase_id}", response_model=TestCaseResponse)
def update_testcase(
    testcase_id: int,
    testcase_data: TestCaseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update testcase"""
    testcase = db.query(TestCase).filter(TestCase.id == testcase_id).first()
    if not testcase:
        raise HTTPException(status_code=404, detail="TestCase not found")
    
    # Update fields and record history
    update_data = testcase_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        old_value = getattr(testcase, field)
        if old_value != value:
            old_str = old_value.value if hasattr(old_value, 'value') else str(old_value) if old_value is not None else None
            new_str = value.value if hasattr(value, 'value') else str(value) if value is not None else None
            history_entry = TestCaseHistory(
                testcase_id=testcase_id,
                field=field,
                old_value=old_str,
                new_value=new_str,
                changed_by=current_user.id,
            )
            db.add(history_entry)
        setattr(testcase, field, value)
    
    db.commit()
    db.refresh(testcase)
    
    return testcase


@router.get("/{testcase_id}/history")
def get_testcase_history(
    testcase_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get testcase history"""
    testcase = db.query(TestCase).filter(TestCase.id == testcase_id).first()
    if not testcase:
        raise HTTPException(status_code=404, detail="TestCase not found")

    history = db.query(TestCaseHistory).filter(
        TestCaseHistory.testcase_id == testcase_id
    ).order_by(desc(TestCaseHistory.changed_at)).all()
    
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


@router.delete("/{testcase_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_testcase(
    testcase_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete testcase"""
    testcase = db.query(TestCase).filter(TestCase.id == testcase_id).first()
    if not testcase:
        raise HTTPException(status_code=404, detail="TestCase not found")
    
    db.delete(testcase)
    db.commit()
    return None
