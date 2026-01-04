from datetime import datetime

from sqlalchemy import Column, Integer, String, DateTime, Enum
from sqlalchemy.orm import relationship
import enum

from app.database import Base


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    PROJECT_MANAGER = "project_manager"
    DEVELOPER = "developer"
    TESTER = "tester"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.DEVELOPER, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    created_projects = relationship("Project", back_populates="creator", foreign_keys="Project.creator_id")
    created_bugs = relationship("Bug", back_populates="creator", foreign_keys="Bug.creator_id")
    assigned_bugs = relationship("Bug", back_populates="assignee", foreign_keys="Bug.assignee_id")
    created_requirements = relationship("Requirement", back_populates="creator", foreign_keys="Requirement.creator_id")
    assigned_requirements = relationship("Requirement", back_populates="assignee", foreign_keys="Requirement.assignee_id")
    comments = relationship("BugComment", back_populates="user")
