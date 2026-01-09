"""
修复数据库中多个 active 迭代的问题
确保每个项目只有一个 active 迭代
"""
import sys
sys.path.insert(0, '.')

from app.database import SessionLocal
from app.models.sprint import Sprint, SprintStatus
from sqlalchemy import func

def fix_active_sprints():
    db = SessionLocal()
    try:
        # 查找每个项目中所有 active 的迭代
        active_sprints = db.query(Sprint).filter(
            Sprint.status == SprintStatus.ACTIVE
        ).order_by(Sprint.project_id, Sprint.updated_at.desc()).all()
        
        # 按项目分组
        project_sprints = {}
        for sprint in active_sprints:
            if sprint.project_id not in project_sprints:
                project_sprints[sprint.project_id] = []
            project_sprints[sprint.project_id].append(sprint)
        
        fixed_count = 0
        for project_id, sprints in project_sprints.items():
            if len(sprints) > 1:
                print(f"项目 {project_id} 有 {len(sprints)} 个 active 迭代")
                # 保留最新更新的一个为 active，其他改为 completed
                for sprint in sprints[1:]:
                    print(f"  - 将 '{sprint.name}' (ID: {sprint.id}) 改为 completed")
                    sprint.status = SprintStatus.COMPLETED
                    fixed_count += 1
        
        if fixed_count > 0:
            db.commit()
            print(f"\n已修复 {fixed_count} 个迭代")
        else:
            print("没有需要修复的数据")
            
    finally:
        db.close()

if __name__ == "__main__":
    fix_active_sprints()
