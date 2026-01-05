from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class CommentBase(BaseModel):
    content: str  # Markdown format


class CommentCreate(CommentBase):
    pass


class CommentUpdate(BaseModel):
    content: Optional[str] = None


class UserInfo(BaseModel):
    id: int
    username: str
    email: str

    class Config:
        from_attributes = True


class CommentResponse(CommentBase):
    id: int
    bug_id: int
    user_id: int
    mentioned_user_ids: List[int]
    created_at: datetime
    updated_at: datetime
    user: Optional[UserInfo] = None

    class Config:
        from_attributes = True


class RequirementCommentResponse(CommentBase):
    id: int
    requirement_id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    user: Optional[UserInfo] = None

    class Config:
        from_attributes = True


class TaskCommentResponse(CommentBase):
    id: int
    task_id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    user: Optional[UserInfo] = None

    class Config:
        from_attributes = True


class CommentListResponse(BaseModel):
    items: List[CommentResponse]
    total: int
