from datetime import datetime, date
from typing import Optional, List, TYPE_CHECKING

from pydantic import BaseModel

from app.models.task import TaskStatus, TaskPriority

if TYPE_CHECKING:
    from app.schemas.bug import BugResponse


class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    priority: TaskPriority = TaskPriority.MEDIUM


class TaskCreate(TaskBase):
    status: TaskStatus = TaskStatus.TODO
    assignee_id: Optional[int] = None
    developer_id: Optional[int] = None
    tester_id: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
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


class BugBrief(BaseModel):
    id: int
    bug_number: str
    title: str
    status: str
    priority: str

    class Config:
        from_attributes = True


class TaskResponse(TaskBase):
    id: int
    requirement_id: int
    task_number: str
    status: TaskStatus
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
    bugs: List[BugBrief] = []

    class Config:
        from_attributes = True


class TaskDetailResponse(TaskBase):
    id: int
    requirement_id: int
    task_number: str
    status: TaskStatus
    creator_id: int
    assignee_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    creator: Optional[UserBrief] = None
    assignee: Optional[UserBrief] = None

    class Config:
        from_attributes = True


class TaskListResponse(BaseModel):
    items: List[TaskResponse]
    total: int
    page: int
    page_size: int
