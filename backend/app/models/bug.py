from datetime import datetime
import enum

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship

from app.database import Base


class BugStatus(str, enum.Enum):
    NEW = "new"
    CONFIRMED = "confirmed"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"
    REOPENED = "reopened"


class BugPriority(str, enum.Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class BugSeverity(str, enum.Enum):
    BLOCKER = "blocker"
    CRITICAL = "critical"
    MAJOR = "major"
    MINOR = "minor"
    TRIVIAL = "trivial"


class BugEnvironment(str, enum.Enum):
    """发现环境"""
    DEVELOPMENT = "development"  # 开发环境
    TESTING = "testing"          # 测试环境
    STAGING = "staging"          # 预发环境
    PRODUCTION = "production"    # 生产环境


class BugCause(str, enum.Enum):
    """缺陷原因"""
    CODE_ERROR = "code_error"           # 代码错误
    DESIGN_DEFECT = "design_defect"     # 设计缺陷
    REQUIREMENT_ISSUE = "requirement_issue"  # 需求问题
    CONFIG_ERROR = "config_error"       # 配置错误
    ENVIRONMENT = "environment"         # 环境问题
    THIRD_PARTY = "third_party"         # 第三方问题
    OTHER = "other"                     # 其他


class Bug(Base):
    __tablename__ = "bugs"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    sprint_id = Column(Integer, ForeignKey("sprints.id"), nullable=True, index=True)
    requirement_id = Column(Integer, ForeignKey("requirements.id"), nullable=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=True, index=True)
    bug_number = Column(String(50), unique=True, nullable=False, index=True)  # e.g., "PROJ-001"
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)  # Markdown format
    status = Column(Enum(BugStatus), default=BugStatus.NEW, nullable=False)
    priority = Column(Enum(BugPriority), default=BugPriority.MEDIUM, nullable=False)
    severity = Column(Enum(BugSeverity), default=BugSeverity.MAJOR, nullable=False)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assignee_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    environment = Column(Enum(BugEnvironment), nullable=True)  # 发现环境
    defect_cause = Column(Enum(BugCause), nullable=True)       # 缺陷原因
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    project = relationship("Project", back_populates="bugs")
    sprint = relationship("Sprint", back_populates="bugs")
    requirement = relationship("Requirement", back_populates="bugs")
    task = relationship("Task", back_populates="bugs")
    creator = relationship("User", back_populates="created_bugs", foreign_keys=[creator_id])
    assignee = relationship("User", back_populates="assigned_bugs", foreign_keys=[assignee_id])
    comments = relationship("BugComment", back_populates="bug", cascade="all, delete-orphan")
    history = relationship("BugHistory", back_populates="bug", cascade="all, delete-orphan")


class BugHistory(Base):
    __tablename__ = "bug_history"

    id = Column(Integer, primary_key=True, index=True)
    bug_id = Column(Integer, ForeignKey("bugs.id"), nullable=False)
    field = Column(String(50), nullable=False)  # Field that changed
    old_value = Column(String(255))
    new_value = Column(String(255))
    changed_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    changed_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    bug = relationship("Bug", back_populates="history")
    user = relationship("User")
