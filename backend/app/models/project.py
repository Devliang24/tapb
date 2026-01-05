from datetime import datetime

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship

from app.database import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    key = Column(String(10), unique=True, nullable=False, index=True)  # Project key like "PROJ"
    description = Column(Text)
    is_public = Column(Boolean, default=False, nullable=False)  # Public example space visible to all users
    bug_seq = Column(Integer, default=0, nullable=False)  # Bug sequence counter
    requirement_seq = Column(Integer, default=0, nullable=False)  # Requirement sequence counter
    task_seq = Column(Integer, default=0, nullable=False)  # Task sequence counter
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    creator = relationship("User", back_populates="created_projects", foreign_keys=[creator_id])
    bugs = relationship("Bug", back_populates="project", cascade="all, delete-orphan")
    sprints = relationship("Sprint", back_populates="project", cascade="all, delete-orphan")
    requirements = relationship("Requirement", back_populates="project", cascade="all, delete-orphan")
    members = relationship("ProjectMember", back_populates="project", cascade="all, delete-orphan")


class ProjectMember(Base):
    __tablename__ = "project_members"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(String(50), nullable=False)  # Role in project

    # Relationships
    project = relationship("Project", back_populates="members")
    user = relationship("User")
