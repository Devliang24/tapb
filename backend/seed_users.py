"""Seed script to create 10 users with realistic Chinese names"""
import sys
sys.path.insert(0, "/Users/liang/ai-work/tapb/backend")

from app.database import SessionLocal
from app.models.user import User, UserRole
from app.utils.security import get_password_hash


USERS_DATA = [
    {"username": "张伟", "email": "zhangwei@tapb.dev", "role": UserRole.DEVELOPER},
    {"username": "李娜", "email": "lina@tapb.dev", "role": UserRole.TESTER},
    {"username": "王强", "email": "wangqiang@tapb.dev", "role": UserRole.DEVELOPER},
    {"username": "刘芳", "email": "liufang@tapb.dev", "role": UserRole.TESTER},
    {"username": "陈明", "email": "chenming@tapb.dev", "role": UserRole.DEVELOPER},
    {"username": "杨丽", "email": "yangli@tapb.dev", "role": UserRole.TESTER},
    {"username": "赵磊", "email": "zhaolei@tapb.dev", "role": UserRole.DEVELOPER},
    {"username": "黄敏", "email": "huangmin@tapb.dev", "role": UserRole.TESTER},
    {"username": "周涛", "email": "zhoutao@tapb.dev", "role": UserRole.DEVELOPER},
    {"username": "吴静", "email": "wujing@tapb.dev", "role": UserRole.PROJECT_MANAGER},
]


def seed_users():
    """Create 10 users with realistic names"""
    db = SessionLocal()
    
    try:
        created_count = 0
        skipped_count = 0
        
        for user_data in USERS_DATA:
            # Check if user already exists
            existing = db.query(User).filter(
                (User.username == user_data["username"]) | 
                (User.email == user_data["email"])
            ).first()
            
            if existing:
                print(f"⏭️  用户 {user_data['username']} 已存在，跳过...")
                skipped_count += 1
                continue
            
            # Create user with default password "123456"
            user = User(
                username=user_data["username"],
                email=user_data["email"],
                password_hash=get_password_hash("123456"),
                role=user_data["role"]
            )
            db.add(user)
            created_count += 1
            print(f"✅ 创建用户: {user_data['username']} ({user_data['role'].value})")
        
        db.commit()
        print(f"\n✨ 完成! 创建了 {created_count} 个用户，跳过了 {skipped_count} 个已存在用户")
        print("📝 默认密码: 123456")
        
    except Exception as e:
        db.rollback()
        print(f"❌ 创建用户出错: {e}")
        raise
    finally:
        db.close()


def list_users():
    """List all users"""
    db = SessionLocal()
    try:
        users = db.query(User).all()
        print(f"\n📋 当前用户列表 (共 {len(users)} 人):")
        print("-" * 60)
        for u in users:
            print(f"  {u.id:3d} | {u.username:10s} | {u.email:25s} | {u.role.value}")
    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--list":
        list_users()
    else:
        print("🌱 创建测试用户...")
        seed_users()
        list_users()
