from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.user import User
from app.models.project import Project, ProjectMember
from app.models.bug import Bug, BugStatus, BugPriority, BugSeverity
from app.schemas.user import UserCreate
from app.utils.security import get_password_hash, verify_password, create_access_token


def _generate_unique_project_key(db: Session, base_key: str) -> str:
    """Generate a unique project key"""
    key = base_key.upper()[:6]
    existing = db.query(Project).filter(Project.key == key).first()
    if not existing:
        return key
    # Add number suffix if key exists
    counter = 1
    while True:
        new_key = f"{key[:4]}{counter}"
        existing = db.query(Project).filter(Project.key == new_key).first()
        if not existing:
            return new_key
        counter += 1


def _create_default_project_and_bugs(db: Session, user: User) -> None:
    """Create a default project with sample bugs for new user"""
    # Generate unique project key based on username
    project_key = _generate_unique_project_key(db, user.username[:4] + "PJ")
    
    # Create default project
    project = Project(
        name=f"{user.username}的示例空间",
        key=project_key,
        description="这是系统为您自动创建的示例空间，包含一些示例Bug供您了解系统功能。您可以随时删除或修改这些内容。",
        creator_id=user.id,
        bug_seq=0
    )
    db.add(project)
    db.flush()  # Get project.id
    
    # Add user as project member
    member = ProjectMember(
        project_id=project.id,
        user_id=user.id,
        role="owner"
    )
    db.add(member)
    
    # Sample bugs data
    sample_bugs = [
        {
            "title": "登录页面在移动端显示异常",
            "description": "## 问题描述\n在iPhone 12上访问登录页面时，输入框和按钮超出屏幕边界。\n\n## 复现步骤\n1. 使用iPhone 12访问网站\n2. 点击登录按钮\n3. 观察登录弹窗\n\n## 预期结果\n登录弹窗应自适应屏幕宽度\n\n## 实际结果\n输入框右侧被截断",
            "status": BugStatus.NEW,
            "priority": BugPriority.HIGH,
            "severity": BugSeverity.MAJOR
        },
        {
            "title": "用户列表分页功能失效",
            "description": "## 问题描述\n在用户管理页面，点击分页按钮无响应。\n\n## 复现步骤\n1. 进入用户管理页面\n2. 点击第2页\n\n## 预期结果\n显示第2页的用户数据\n\n## 实际结果\n页面无变化，控制台报错",
            "status": BugStatus.CONFIRMED,
            "priority": BugPriority.MEDIUM,
            "severity": BugSeverity.MAJOR
        },
        {
            "title": "导出Excel文件名乱码",
            "description": "## 问题描述\n导出的Excel文件名包含中文时出现乱码。\n\n## 环境\n- 浏览器：Chrome 120\n- 操作系统：Windows 11\n\n## 预期结果\n文件名正常显示中文\n\n## 实际结果\n文件名显示为乱码字符",
            "status": BugStatus.IN_PROGRESS,
            "priority": BugPriority.LOW,
            "severity": BugSeverity.MINOR
        },
        {
            "title": "搜索结果高亮显示不正确",
            "description": "## 问题描述\n搜索关键词后，结果列表中的关键词未正确高亮显示。\n\n## 复现步骤\n1. 在搜索框输入关键词\n2. 查看搜索结果\n\n## 备注\n此问题为UI优化项，优先级较低",
            "status": BugStatus.RESOLVED,
            "priority": BugPriority.LOW,
            "severity": BugSeverity.TRIVIAL
        },
        {
            "title": "系统在高并发下响应缓慢",
            "description": "## 问题描述\n当同时在线用户超过100人时，系统响应时间明显增加。\n\n## 测试数据\n- 50用户并发：响应时间 < 200ms\n- 100用户并发：响应时间 > 2s\n\n## 建议\n考虑增加缓存或优化数据库查询",
            "status": BugStatus.NEW,
            "priority": BugPriority.CRITICAL,
            "severity": BugSeverity.CRITICAL
        }
    ]
    
    # Create sample bugs
    for i, bug_data in enumerate(sample_bugs, 1):
        project.bug_seq = i
        bug_number = f"{project.key}-{str(i).zfill(3)}"
        
        bug = Bug(
            project_id=project.id,
            bug_number=bug_number,
            title=bug_data["title"],
            description=bug_data["description"],
            status=bug_data["status"],
            priority=bug_data["priority"],
            severity=bug_data["severity"],
            creator_id=user.id,
            assignee_id=user.id  # Assign to self
        )
        db.add(bug)
    
    db.commit()


def create_user(db: Session, user_data: UserCreate) -> User:
    """Create a new user"""
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check if username already exists
    existing_user = db.query(User).filter(User.username == user_data.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=hashed_password,
        role=user_data.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Create default project and sample bugs
    _create_default_project_and_bugs(db, db_user)
    
    return db_user


def authenticate_user(db: Session, email: str, password: str) -> User:
    """Authenticate user with email and password"""
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    if not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    return user


def generate_token(user: User) -> str:
    """Generate JWT token for user"""
    return create_access_token(data={"sub": str(user.id)})
