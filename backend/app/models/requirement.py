from datetime import datetime, date
import enum

from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    Date,
    Enum,
    ForeignKey,
)
from sqlalchemy.orm import relationship

from app.database import Base


class RequirementStatus(str, enum.Enum):
    DRAFT = "draft"
    APPROVED = "approved"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class RequirementPriority(str, enum.Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class Requirement(Base):
    __tablename__ = "requirements"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    sprint_id = Column(Integer, ForeignKey("sprints.id"), nullable=True, index=True)
    requirement_number = Column(String(50), unique=True, nullable=False, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(Enum(RequirementStatus), default=RequirementStatus.DRAFT, nullable=False)
    priority = Column(Enum(RequirementPriority), default=RequirementPriority.MEDIUM, nullable=False)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assignee_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    developer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    tester_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    project = relationship("Project", back_populates="requirements")
    sprint = relationship("Sprint", back_populates="requirements")
    creator = relationship("User", back_populates="created_requirements", foreign_keys=[creator_id])
    assignee = relationship("User", back_populates="assigned_requirements", foreign_keys=[assignee_id])
    developer = relationship("User", foreign_keys=[developer_id])
    tester = relationship("User", foreign_keys=[tester_id])
    bugs = relationship("Bug", back_populates="requirement")
    tasks = relationship("Task", back_populates="requirement")
