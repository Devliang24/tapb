"""
Seed example sprint and requirement data for demonstration
Run this script after creating a project to populate it with example data
"""
import sys
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models import Sprint, Requirement, SprintStatus, RequirementStatus, RequirementPriority
from datetime import datetime, date

def seed_examples(project_id: int):
    """Seed example sprints and requirements for a project"""
    db = SessionLocal()
    
    try:
        # Check if project exists
        from app.models import Project
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            print(f"❌ Project with ID {project_id} not found")
            return
        
        print(f"📦 Seeding example data for project: {project.name} ({project.key})")
        
        # Create example sprints
        sprints = [
            Sprint(
                project_id=project_id,
                name="Sprint 1 - 基础功能开发",
                goal="完成用户登录、注册等基础功能",
                status=SprintStatus.COMPLETED,
                start_date=date(2026, 1, 1),
                end_date=date(2026, 1, 14),
            ),
            Sprint(
                project_id=project_id,
                name="Sprint 2 - 核心业务实现",
                goal="实现项目管理、Bug追踪核心流程",
                status=SprintStatus.ACTIVE,
                start_date=date(2026, 1, 15),
                end_date=date(2026, 1, 28),
            ),
            Sprint(
                project_id=project_id,
                name="Sprint 3 - 优化与测试",
                goal="性能优化、单元测试、集成测试",
                status=SprintStatus.PLANNING,
                start_date=date(2026, 1, 29),
                end_date=date(2026, 2, 11),
            ),
        ]
        
        for sprint in sprints:
            db.add(sprint)
        
        db.flush()
        print(f"✅ Created {len(sprints)} example sprints")
        
        # Get first user as creator
        from app.models import User
        first_user = db.query(User).first()
        if not first_user:
            print("❌ No user found, please create a user first")
            return
        
        # Update project requirement_seq
        project.requirement_seq = 3
        
        # Create example requirements
        requirements = [
            Requirement(
                project_id=project_id,
                requirement_number=f"{project.key}-REQ-001",
                title="用户登录功能",
                description="支持用户名/密码登录，记住密码功能",
                status=RequirementStatus.COMPLETED,
                priority=RequirementPriority.HIGH,
                creator_id=first_user.id,
                sprint_id=sprints[0].id,
            ),
            Requirement(
                project_id=project_id,
                requirement_number=f"{project.key}-REQ-002",
                title="Bug 列表筛选与搜索",
                description="支持按状态、优先级、关键词筛选 Bug",
                status=RequirementStatus.IN_PROGRESS,
                priority=RequirementPriority.HIGH,
                creator_id=first_user.id,
                sprint_id=sprints[1].id,
            ),
            Requirement(
                project_id=project_id,
                requirement_number=f"{project.key}-REQ-003",
                title="数据导出功能",
                description="导出 Bug 列表为 Excel/CSV 格式",
                status=RequirementStatus.DRAFT,
                priority=RequirementPriority.MEDIUM,
                creator_id=first_user.id,
            ),
        ]
        
        for req in requirements:
            db.add(req)
        
        db.commit()
        print(f"✅ Created {len(requirements)} example requirements")
        print(f"✨ Example data seeding completed successfully!")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding data: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python seed_examples.py <project_id>")
        print("\nExample: python seed_examples.py 1")
        sys.exit(1)
    
    try:
        project_id = int(sys.argv[1])
        seed_examples(project_id)
    except ValueError:
        print("❌ Error: project_id must be an integer")
        sys.exit(1)
