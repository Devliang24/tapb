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


class RequirementCategory(Base):
    """需求目录"""
    __tablename__ = "requirement_categories"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    parent_id = Column(Integer, ForeignKey("requirement_categories.id"), nullable=True)
    name = Column(String(100), nullable=False)
    order = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    project = relationship("Project", back_populates="requirement_categories")
    parent = relationship("RequirementCategory", remote_side=[id], backref="children")
    requirements = relationship("Requirement", back_populates="category")


class Requirement(Base):
    __tablename__ = "requirements"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    sprint_id = Column(Integer, ForeignKey("sprints.id"), nullable=True, index=True)
    category_id = Column(Integer, ForeignKey("requirement_categories.id"), nullable=True, index=True)
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
    category = relationship("RequirementCategory", back_populates="requirements")
    creator = relationship("User", back_populates="created_requirements", foreign_keys=[creator_id])
    assignee = relationship("User", back_populates="assigned_requirements", foreign_keys=[assignee_id])
    developer = relationship("User", foreign_keys=[developer_id])
    tester = relationship("User", foreign_keys=[tester_id])
    bugs = relationship("Bug", back_populates="requirement", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="requirement", cascade="all, delete-orphan")
    test_cases = relationship("TestCase", back_populates="requirement")
    comments = relationship("RequirementComment", back_populates="requirement", cascade="all, delete-orphan")
    history = relationship("RequirementHistory", back_populates="requirement", cascade="all, delete-orphan")


class RequirementHistory(Base):
    """需求操作历史"""
    __tablename__ = "requirement_history"

    id = Column(Integer, primary_key=True, index=True)
    requirement_id = Column(Integer, ForeignKey("requirements.id"), nullable=False)
    field = Column(String(50), nullable=False)  # 变更的字段
    old_value = Column(String(255))
    new_value = Column(String(255))
    changed_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    changed_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    requirement = relationship("Requirement", back_populates="history")
    user = relationship("User")
