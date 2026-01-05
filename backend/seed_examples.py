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
        sprint_configs = [
            ("Sprint 1 - 基础功能开发", "完成用户登录、注册等基础功能", SprintStatus.COMPLETED, date(2026, 1, 1), date(2026, 1, 14)),
            ("Sprint 2 - 核心业务实现", "实现项目管理、Bug追踪核心流程", SprintStatus.ACTIVE, date(2026, 1, 15), date(2026, 1, 28)),
            ("Sprint 3 - 优化与测试", "性能优化、单元测试、集成测试", SprintStatus.PLANNING, date(2026, 1, 29), date(2026, 2, 11)),
        ]
        
        sprints = []
        for name, goal, status, start_date, end_date in sprint_configs:
            sprint = Sprint(
                project_id=project_id,
                sprint_number="TEMP",  # Will be updated after getting ID
                name=name,
                goal=goal,
                status=status,
                start_date=start_date,
                end_date=end_date,
            )
            db.add(sprint)
            db.flush()
            sprint.sprint_number = f"S{sprint.id}"
            sprints.append(sprint)
        
        print(f"✅ Created {len(sprints)} example sprints")
        
        # Get first user as creator
        from app.models import User
        first_user = db.query(User).first()
        if not first_user:
            print("❌ No user found, please create a user first")
            return
        
        # Create example requirements
        req_configs = [
            ("用户登录功能", "支持用户名/密码登录，记住密码功能", RequirementStatus.COMPLETED, RequirementPriority.HIGH, sprints[0].id),
            ("Bug 列表筛选与搜索", "支持按状态、优先级、关键词筛选 Bug", RequirementStatus.IN_PROGRESS, RequirementPriority.HIGH, sprints[1].id),
            ("数据导出功能", "导出 Bug 列表为 Excel/CSV 格式", RequirementStatus.DRAFT, RequirementPriority.MEDIUM, None),
        ]
        
        requirements = []
        for title, description, status, priority, sprint_id in req_configs:
            requirement = Requirement(
                project_id=project_id,
                requirement_number="TEMP",  # Will be updated after getting ID
                title=title,
                description=description,
                status=status,
                priority=priority,
                creator_id=first_user.id,
                sprint_id=sprint_id,
            )
            db.add(requirement)
            db.flush()
            requirement.requirement_number = f"R{requirement.id}"
            requirements.append(requirement)
        
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
