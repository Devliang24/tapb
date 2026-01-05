"""
Utility script: keep only one project named '示例空间', remove all others.
- If the project doesn't exist, it will be created with key 'DEMO'.
- Ensures creator (admin or first user) is set as owner member.
Run: python reset_to_single_project.py
"""
from app.database import SessionLocal
from app.models.project import Project, ProjectMember
from app.models.user import User


def get_creator(db):
    # Prefer admin user; otherwise first user
    admin = db.query(User).filter(User.username == 'admin').first()
    if admin:
        return admin
    user = db.query(User).order_by(User.id.asc()).first()
    if not user:
        raise RuntimeError('No users found in DB to own the project')
    return user


essential_key = 'DEMO'
essential_name = '示例空间'

def main():
    db = SessionLocal()
    try:
        # Find existing project to keep
        keep = db.query(Project).filter(Project.name == essential_name).first()
        if not keep:
            keep = db.query(Project).filter(Project.key == essential_key).first()
        
        if not keep:
            creator = get_creator(db)
            keep = Project(
                name=essential_name,
                key=essential_key,
                description='示例空间',
                creator_id=creator.id,
                is_public=False,
                bug_seq=0,
                requirement_seq=0,
                task_seq=0,
                sprint_seq=0,
            )
            db.add(keep)
            db.flush()
            # Add owner membership
            owner = ProjectMember(project_id=keep.id, user_id=creator.id, role='owner')
            db.add(owner)
            print(f'✅ Created project {essential_name} (key={essential_key}) owned by {creator.username}')
        else:
            # Normalize name and key
            changed = False
            if keep.name != essential_name:
                keep.name = essential_name
                changed = True
            if keep.key != essential_key:
                keep.key = essential_key
                changed = True
            if changed:
                print('✏️  Updated existing project name/key to 示例空间/DEMO')
        
        # Delete all other projects (with manual dependency cleanup)
        from app.models.bug import Bug
        from app.models.comment import BugComment
        from app.models.bug import BugHistory
        from app.models.requirement import Requirement
        from app.models.task import Task
        from app.models.sprint import Sprint

        others = db.query(Project).filter(Project.id != keep.id).all()
        removed = 0
        for p in others:
            # Bugs and related
            bug_ids = [b.id for b in db.query(Bug.id).filter(Bug.project_id == p.id).all()]
            if bug_ids:
                db.query(BugComment).filter(BugComment.bug_id.in_(bug_ids)).delete(synchronize_session=False)
                db.query(BugHistory).filter(BugHistory.bug_id.in_(bug_ids)).delete(synchronize_session=False)
                db.query(Bug).filter(Bug.id.in_(bug_ids)).delete(synchronize_session=False)
            
            # Requirements and tasks
            req_ids = [r.id for r in db.query(Requirement.id).filter(Requirement.project_id == p.id).all()]
            if req_ids:
                task_ids = [t.id for t in db.query(Task.id).filter(Task.requirement_id.in_(req_ids)).all()]
                if task_ids:
                    db.query(Task).filter(Task.id.in_(task_ids)).delete(synchronize_session=False)
                db.query(Requirement).filter(Requirement.id.in_(req_ids)).delete(synchronize_session=False)
            
            # Sprints
            db.query(Sprint).filter(Sprint.project_id == p.id).delete(synchronize_session=False)
            
            # Members
            db.query(ProjectMember).filter(ProjectMember.project_id == p.id).delete(synchronize_session=False)
            
            # Finally project
            db.delete(p)
            removed += 1
        
        db.commit()
        print(f'🧹 Removed {removed} other projects; kept project id={keep.id}, name={keep.name}')
    except Exception as e:
        db.rollback()
        print('❌ Error:', e)
        raise
    finally:
        db.close()


if __name__ == '__main__':
    main()
