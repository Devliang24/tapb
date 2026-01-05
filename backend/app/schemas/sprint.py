from datetime import datetime, date
from typing import Optional, List

from pydantic import BaseModel, model_validator

from app.models.sprint import SprintStatus


class SprintBase(BaseModel):
    name: str
    goal: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class SprintCreate(SprintBase):
    @model_validator(mode="after")
    def validate_dates(self):
        if self.start_date and self.end_date and self.start_date > self.end_date:
            raise ValueError("start_date must be <= end_date")
        return self


class SprintUpdate(BaseModel):
    name: Optional[str] = None
    goal: Optional[str] = None
    status: Optional[SprintStatus] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None

    @model_validator(mode="after")
    def validate_dates(self):
        if self.start_date and self.end_date and self.start_date > self.end_date:
            raise ValueError("start_date must be <= end_date")
        return self


class SprintResponse(SprintBase):
    id: int
    project_id: int
    sprint_number: Optional[str] = None
    status: SprintStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SprintListResponse(BaseModel):
    items: List[SprintResponse]
    total: int
    page: int
    page_size: int
