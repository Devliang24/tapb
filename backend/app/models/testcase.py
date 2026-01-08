from datetime import datetime
import enum

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship

from app.database import Base


class TestCaseType(str, enum.Enum):
    FUNCTIONAL = "functional"      # 功能测试
    PERFORMANCE = "performance"    # 性能测试
    SECURITY = "security"          # 安全测试
    COMPATIBILITY = "compatibility"  # 兼容性测试
    SMOKE = "smoke"                # 冒烟测试
    REGRESSION = "regression"      # 回归测试


class TestCaseStatus(str, enum.Enum):
    PASSED = "passed"              # 通过
    FAILED = "failed"              # 不通过
    NOT_EXECUTED = "not_executed"  # 未执行


class TestCasePriority(str, enum.Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class TestCaseCategory(Base):
    """测试用例目录"""
    __tablename__ = "testcase_categories"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    parent_id = Column(Integer, ForeignKey("testcase_categories.id"), nullable=True)
    name = Column(String(100), nullable=False)
    order = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    project = relationship("Project", back_populates="testcase_categories")
    parent = relationship("TestCaseCategory", remote_side=[id], backref="children")
    testcases = relationship("TestCase", back_populates="category")


class TestCase(Base):
    """测试用例"""
    __tablename__ = "testcases"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("testcase_categories.id"), nullable=True, index=True)
    requirement_id = Column(Integer, ForeignKey("requirements.id"), nullable=True, index=True)
    sprint_id = Column(Integer, ForeignKey("sprints.id"), nullable=True, index=True)
    case_number = Column(String(50), unique=True, nullable=False, index=True)  # e.g., "TC-001"
    name = Column(String(200), nullable=False)
    type = Column(Enum(TestCaseType), default=TestCaseType.FUNCTIONAL, nullable=False)
    status = Column(Enum(TestCaseStatus), default=TestCaseStatus.NOT_EXECUTED, nullable=False)
    priority = Column(Enum(TestCasePriority), default=TestCasePriority.MEDIUM, nullable=False)
    module = Column(String(200), nullable=True)       # 模块
    feature = Column(String(200), nullable=True)      # 功能
    precondition = Column(Text, nullable=True)        # 前置条件
    steps = Column(Text, nullable=True)               # 测试步骤 (Markdown)
    test_data = Column(Text, nullable=True)           # 测试数据
    expected_result = Column(Text, nullable=True)     # 预期结果 (Markdown)
    actual_result = Column(Text, nullable=True)       # 实际结果
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    project = relationship("Project", back_populates="testcases")
    category = relationship("TestCaseCategory", back_populates="testcases")
    requirement = relationship("Requirement")
    sprint = relationship("Sprint")
    creator = relationship("User", back_populates="created_testcases", foreign_keys=[creator_id])
    history = relationship("TestCaseHistory", back_populates="testcase", cascade="all, delete-orphan")
    bugs = relationship("Bug", back_populates="testcase")


class TestCaseHistory(Base):
    """测试用例操作历史"""
    __tablename__ = "testcase_history"

    id = Column(Integer, primary_key=True, index=True)
    testcase_id = Column(Integer, ForeignKey("testcases.id"), nullable=False)
    field = Column(String(50), nullable=False)
    old_value = Column(String(255))
    new_value = Column(String(255))
    changed_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    changed_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    testcase = relationship("TestCase", back_populates="history")
    user = relationship("User")
