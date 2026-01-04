from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel


class ProjectBase(BaseModel):
    name: str
    key: str  # Project key like "PROJ"
    description: Optional[str] = None


class ProjectCreate(ProjectBase):
    member_ids: Optional[List[int]] = None  # Optional list of user IDs to add as members


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class ProjectResponse(ProjectBase):
    id: int
    is_public: bool = False
    bug_seq: int
    requirement_seq: int
    creator_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProjectMemberBase(BaseModel):
    user_id: int
    role: str


class ProjectMemberCreate(ProjectMemberBase):
    pass


class MemberUserInfo(BaseModel):
    id: int
    username: str
    email: str

    class Config:
        from_attributes = True


class ProjectMemberResponse(ProjectMemberBase):
    id: int
    project_id: int
    user: Optional[MemberUserInfo] = None

    class Config:
        from_attributes = True
