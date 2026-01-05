from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel

from app.models.testcase import TestCaseType, TestCaseStatus, TestCasePriority


# ========== Category Schemas ==========

class CategoryBase(BaseModel):
    name: str


class CategoryCreate(CategoryBase):
    project_id: int
    parent_id: Optional[int] = None


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    parent_id: Optional[int] = None
    order: Optional[int] = None


class CategoryResponse(CategoryBase):
    id: int
    project_id: int
    parent_id: Optional[int] = None
    order: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ========== TestCase Schemas ==========

class TestCaseBase(BaseModel):
    name: str
    type: TestCaseType = TestCaseType.FUNCTIONAL
    priority: TestCasePriority = TestCasePriority.MEDIUM


class TestCaseCreate(TestCaseBase):
    project_id: int
    category_id: Optional[int] = None
    requirement_id: Optional[int] = None
    status: TestCaseStatus = TestCaseStatus.NOT_EXECUTED
    precondition: Optional[str] = None
    steps: Optional[str] = None
    expected_result: Optional[str] = None


class TestCaseUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[TestCaseType] = None
    status: Optional[TestCaseStatus] = None
    priority: Optional[TestCasePriority] = None
    category_id: Optional[int] = None
    requirement_id: Optional[int] = None
    precondition: Optional[str] = None
    steps: Optional[str] = None
    expected_result: Optional[str] = None


class UserBrief(BaseModel):
    id: int
    username: str

    class Config:
        from_attributes = True


class CategoryBrief(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


class RequirementBrief(BaseModel):
    id: int
    requirement_number: str
    title: str

    class Config:
        from_attributes = True


class TestCaseResponse(TestCaseBase):
    id: int
    project_id: int
    category_id: Optional[int] = None
    requirement_id: Optional[int] = None
    case_number: str
    status: TestCaseStatus
    precondition: Optional[str] = None
    steps: Optional[str] = None
    expected_result: Optional[str] = None
    creator_id: int
    created_at: datetime
    updated_at: datetime
    creator: Optional[UserBrief] = None
    category: Optional[CategoryBrief] = None
    requirement: Optional[RequirementBrief] = None

    class Config:
        from_attributes = True


class TestCaseListResponse(BaseModel):
    items: List[TestCaseResponse]
    total: int
    page: int
    page_size: int


class TestCaseBatchDeleteRequest(BaseModel):
    ids: List[int]
