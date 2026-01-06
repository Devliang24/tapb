from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel

from app.models.bug import BugStatus, BugPriority, BugSeverity, BugEnvironment, BugCause


class BugBase(BaseModel):
    title: str
    description: str  # Markdown format
    priority: BugPriority = BugPriority.MEDIUM
    severity: BugSeverity = BugSeverity.MAJOR


class BugCreate(BugBase):
    project_id: int
    assignee_id: Optional[int] = None
    sprint_id: Optional[int] = None
    requirement_id: Optional[int] = None
    testcase_id: Optional[int] = None
    environment: Optional[BugEnvironment] = None
    defect_cause: Optional[BugCause] = None


class BugUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[BugStatus] = None
    priority: Optional[BugPriority] = None
    severity: Optional[BugSeverity] = None
    assignee_id: Optional[int] = None
    sprint_id: Optional[int] = None
    requirement_id: Optional[int] = None
    testcase_id: Optional[int] = None
    environment: Optional[BugEnvironment] = None
    defect_cause: Optional[BugCause] = None


class UserBrief(BaseModel):
    id: int
    username: str

    class Config:
        from_attributes = True


class SprintBrief(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


class BugResponse(BugBase):
    id: int
    project_id: int
    sprint_id: Optional[int] = None
    requirement_id: Optional[int] = None
    testcase_id: Optional[int] = None
    bug_number: str
    status: BugStatus
    creator_id: int
    assignee_id: Optional[int] = None
    environment: Optional[BugEnvironment] = None
    defect_cause: Optional[BugCause] = None
    created_at: datetime
    updated_at: datetime
    creator: Optional[UserBrief] = None
    assignee: Optional[UserBrief] = None
    sprint: Optional[SprintBrief] = None

    class Config:
        from_attributes = True


class BugListResponse(BaseModel):
    items: List[BugResponse]
    total: int
    page: int
    page_size: int


class BugStatusUpdate(BaseModel):
    status: BugStatus


class BugAssignUpdate(BaseModel):
    assignee_id: int


class BugBatchRequest(BaseModel):
    bug_ids: List[int]


class BugBatchStatusUpdate(BugBatchRequest):
    status: BugStatus


class BugBatchAssignUpdate(BugBatchRequest):
    assignee_id: int


class RequirementBrief(BaseModel):
    id: int
    requirement_number: str
    title: str

    class Config:
        from_attributes = True


class TestCaseBrief(BaseModel):
    id: int
    case_number: str
    name: str

    class Config:
        from_attributes = True


class BugDetailResponse(BugBase):
    id: int
    project_id: int
    sprint_id: Optional[int] = None
    requirement_id: Optional[int] = None
    testcase_id: Optional[int] = None
    bug_number: str
    status: BugStatus
    creator_id: int
    assignee_id: Optional[int] = None
    environment: Optional[BugEnvironment] = None
    defect_cause: Optional[BugCause] = None
    created_at: datetime
    updated_at: datetime
    creator: Optional[UserBrief] = None
    assignee: Optional[UserBrief] = None
    requirement: Optional[RequirementBrief] = None
    testcase: Optional[TestCaseBrief] = None
    sprint: Optional[SprintBrief] = None

    class Config:
        from_attributes = True


class CommentCreate(BaseModel):
    content: str


class CommentResponse(BaseModel):
    id: int
    bug_id: int
    user_id: int
    content: str
    created_at: datetime
    user: Optional[UserBrief] = None

    class Config:
        from_attributes = True
