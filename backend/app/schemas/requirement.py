from datetime import datetime, date
from typing import Optional, List

from pydantic import BaseModel

from app.models.requirement import RequirementStatus, RequirementPriority
from app.schemas.bug import BugResponse
from app.schemas.task import TaskResponse


class RequirementBase(BaseModel):
    title: str
    description: str
    priority: RequirementPriority = RequirementPriority.MEDIUM


class RequirementCreate(RequirementBase):
    sprint_id: Optional[int] = None
    category_id: Optional[int] = None
    assignee_id: Optional[int] = None
    developer_id: Optional[int] = None
    tester_id: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class RequirementUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[RequirementStatus] = None
    priority: Optional[RequirementPriority] = None
    sprint_id: Optional[int] = None
    category_id: Optional[int] = None
    assignee_id: Optional[int] = None
    developer_id: Optional[int] = None
    tester_id: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class UserBrief(BaseModel):
    id: int
    username: str

    class Config:
        from_attributes = True


class RequirementResponse(RequirementBase):
    id: int
    project_id: int
    sprint_id: Optional[int] = None
    category_id: Optional[int] = None
    requirement_number: str
    status: RequirementStatus
    creator_id: int
    assignee_id: Optional[int] = None
    developer_id: Optional[int] = None
    tester_id: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    created_at: datetime
    updated_at: datetime
    assignee: Optional[UserBrief] = None
    developer: Optional[UserBrief] = None
    tester: Optional[UserBrief] = None
    tasks: List[TaskResponse] = []  # 关联的 Task 列表
    bugs: List[BugResponse] = []  # 关联的 Bug 列表

    class Config:
        from_attributes = True


class RequirementDetailResponse(RequirementBase):
    id: int
    project_id: int
    sprint_id: Optional[int] = None
    requirement_number: str
    status: RequirementStatus
    creator_id: int
    assignee_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    creator: Optional[UserBrief] = None
    assignee: Optional[UserBrief] = None
    tasks: List[TaskResponse] = []  # 关联的 Task 列表

    class Config:
        from_attributes = True


class RequirementListResponse(BaseModel):
    items: List[RequirementResponse]
    total: int
    page: int
    page_size: int


class BulkDeleteRequest(BaseModel):
    requirement_ids: List[int]


class BulkStatusUpdateRequest(BaseModel):
    requirement_ids: List[int]
    status: RequirementStatus


class BulkSprintUpdateRequest(BaseModel):
    requirement_ids: List[int]
    sprint_id: Optional[int] = None  # None 表示取消关联


# ========== Category Schemas ==========

class CategoryCreate(BaseModel):
    name: str
    project_id: int
    parent_id: Optional[int] = None


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    parent_id: Optional[int] = None
    order: Optional[int] = None


class CategoryResponse(BaseModel):
    id: int
    project_id: int
    parent_id: Optional[int] = None
    name: str
    order: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
