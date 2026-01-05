"""
Seed data for the single project '示例空间' (key=DEMO):
- 8 sprints
- Each sprint 10 requirements
- Each requirement has two tasks: 前端子任务 / 后端子任务
- Each sprint 10 bugs
- Add regular members (all users except owner) to the project as 'member'
Run: python3 seed_demo_project.py
"""
from datetime import date, datetime, timedelta
import random
import itertools

from app.database import SessionLocal
from app.models.user import User
from app.models.project import Project, ProjectMember
from app.models.sprint import Sprint, SprintStatus
from app.models.requirement import (
    Requirement, RequirementStatus, RequirementPriority,
)
from app.models.task import Task, TaskStatus, TaskPriority
from app.models.bug import BugStatus, BugPriority, BugSeverity
from app.services.bug_service import create_bug
from app.schemas.bug import BugCreate


PROJECT_KEY = 'DEMO'
PROJECT_NAME = '示例空间'

# 全局配置（可按需调整）
CONFIG = {
    'SPRINT_COUNT': 14,                # 迭代数量（14个覆盖到2026年1月）
    'REQUIREMENTS_PER_SPRINT': 30,     # 每个迭代的需求数量
    'TASKS_PER_REQUIREMENT': (2, 5),   # 每个需求的子任务数量范围
    'SPRINT_LENGTH_DAYS': 14,          # 迭代长度（天）
    'START_DATE': '2025-07-01',        # 第一个迭代开始日期
    'MIXED_LANG': True,                # 标题与内容中是否使用中英混排
}

# 领域词库（更真实的命名与内容，含模块/页面层次）
FEATURE_POOL = [
    {
'title': '用户登录与注册 (Auth)',
        'module': '认证/Auth',
        'pages': ['登录页/Login', '注册页/SignUp', '找回密码/Reset Password'],
        'desc': '支持手机号/邮箱登录注册，包含短信验证码、密码强度校验与找回密码流程。',
        'fe': '登录/注册页面、表单校验与交互、错误提示、记住我与自动登录逻辑。',
        'be': 'OAuth2 授权、JWT 发放与刷新、密码加密、短信验证码服务对接、风控。'
    },
    {
'title': '个人资料与头像上传 (Profile)',
        'module': '用户中心/Profile',
        'pages': ['资料编辑/Edit Profile', '头像上传/Avatar Upload', '安全设置/Security'],
        'desc': '用户可编辑昵称、头像、签名与偏好设置，支持裁剪与压缩。',
        'fe': '资料表单、头像裁剪（圆形预览）、本地压缩、拖拽上传与进度条。',
        'be': '对象存储直传/回调、元信息校验、图片安全检测与回滚策略。'
    },
    {
'title': '项目与空间管理 (Spaces)',
        'module': '空间管理/Spaces',
        'pages': ['空间列表/Space List', '成员管理/Members', '角色权限/RBAC'],
        'desc': '创建空间、邀请成员、角色与权限控制、操作日志。',
        'fe': '空间列表、成员邀请弹窗、角色选择与提示、权限受限态。',
        'be': '成员增删改查、角色校验、审计日志、邮件通知与模板。'
    },
    {
'title': '需求管理看板 (Stories)',
        'module': '需求/Stories',
        'pages': ['需求列表/Story List', '看板/Board', '导出/Export'],
        'desc': '按优先级、状态管理需求，支持筛选、批量操作与导出。',
        'fe': '看板拖拽、批量勾选、浮层编辑、导出进度反馈。',
        'be': '分页与搜索、批量接口、导出任务异步与轮询进度。'
    },
    {
'title': '缺陷跟踪与通知 (Bugs)',
        'module': '缺陷/Bugs',
        'pages': ['缺陷列表/Bug List', '缺陷详情/Bug Detail', '通知中心/Notifications'],
        'desc': '缺陷全链路跟踪：创建、分配、验证、关闭，支持@提醒与订阅。',
        'fe': '缺陷表单、@用户与高亮、评论富文本、状态流转组件。',
        'be': '历史流水、提及解析、订阅通知（邮件/站内）、权限校验。'
    },
    {
'title': '文件上传与预览 (Files)',
        'module': '文件/Files',
        'pages': ['上传/Upload', '预览/Preview', '批注/Annotation'],
        'desc': '多格式文件上传，图片/Markdown/Office 预览与批注。',
        'fe': '拖拽/粘贴上传、断点续传、进度条、预览与批注交互。',
        'be': '分片合并、回调签名、病毒扫描、预览转换与缓存策略。'
    },
    {
'title': '搜索与筛选优化 (Search)',
        'module': '搜索/Search',
        'pages': ['搜索框/Search Box', '历史记录/History', '筛选器/Filters'],
        'desc': '针对需求与缺陷的搜索联想、历史记录、快捷过滤。',
        'fe': '搜索框联想、Tab 条件缓存、快捷键、空状态。',
        'be': 'ES/全文检索、倒排索引、拼写纠错与热词统计。'
    },
    {
'title': '仪表盘与统计报表 (Dashboards)',
        'module': '报表/Dashboards',
        'pages': ['概览/Overview', '趋势/Trends', '导出/Export'],
        'desc': '展示迭代燃尽、缺陷趋势、需求完成率等核心指标。',
        'fe': '图表适配与切换、时间范围选择、导出图片/CSV。',
        'be': '聚合查询、预计算缓存、权限隔离与导出服务。'
    },
]

BUG_TITLES = [
    ('登录', '短信验证码倒计时未重置导致无法再次发送'),
    ('上传', '大文件在弱网环境下分片合并失败'),
    ('看板', '拖拽跨列后状态未同步刷新'),
    ('评论', '@提及用户后未触发订阅通知'),
    ('搜索', '关键字包含下划线时返回空结果'),
    ('报表', '导出的 CSV 编码错误导致中文乱码'),
    ('权限', '成员被移除后仍可访问历史链接'),
    ('预览', 'Office 文档在 Safari 下样式错乱'),
]


def ensure_members(db, project: Project):
    users = db.query(User).all()
    existing_user_ids = set(u.user_id for u in db.query(ProjectMember).filter(ProjectMember.project_id==project.id).all())
    for u in users:
        if u.id == project.creator_id:
            # owner by reset script
            continue
        if u.id in existing_user_ids:
            continue
        db.add(ProjectMember(project_id=project.id, user_id=u.id, role='member'))
    db.flush()


def clear_project_data(db, project: Project):
    from app.models.bug import Bug, BugHistory
    from app.models.comment import BugComment
    from app.models.task import Task
    from app.models.comment import TaskComment, RequirementComment
    from app.models.requirement import Requirement
    from app.models.sprint import Sprint

    # Bugs
    bug_ids = [bid for (bid,) in db.query(Bug.id).filter(Bug.project_id==project.id).all()]
    if bug_ids:
        db.query(BugComment).filter(BugComment.bug_id.in_(bug_ids)).delete(synchronize_session=False)
        db.query(BugHistory).filter(BugHistory.bug_id.in_(bug_ids)).delete(synchronize_session=False)
        db.query(Bug).filter(Bug.id.in_(bug_ids)).delete(synchronize_session=False)

    # Requirements & tasks & comments
    req_ids = [rid for (rid,) in db.query(Requirement.id).filter(Requirement.project_id==project.id).all()]
    if req_ids:
        task_ids = [tid for (tid,) in db.query(Task.id).filter(Task.requirement_id.in_(req_ids)).all()]
        if task_ids:
            db.query(TaskComment).filter(TaskComment.task_id.in_(task_ids)).delete(synchronize_session=False)
            db.query(Task).filter(Task.id.in_(task_ids)).delete(synchronize_session=False)
        db.query(RequirementComment).filter(RequirementComment.requirement_id.in_(req_ids)).delete(synchronize_session=False)
        db.query(Requirement).filter(Requirement.id.in_(req_ids)).delete(synchronize_session=False)

    # Sprints
    db.query(Sprint).filter(Sprint.project_id==project.id).delete(synchronize_session=False)

    # Reset counters
    project.bug_seq = 0
    project.requirement_seq = 0
    project.task_seq = 0
    project.sprint_seq = 0
    db.flush()


# Task number will use database ID after flush


def _title_mixed(cn_en: str) -> str:
    """根据配置返回中英混排或仅中文标题片段。输入格式如 '登录页/Login'。"""
    if not CONFIG['MIXED_LANG']:
        return cn_en.split('/')[0]
    return cn_en


def _pick_dates(start: date, end: date, min_days=2, max_days=8):
    """随机挑选一个开始/结束日期区间，位于迭代范围内。"""
    span = (end - start).days
    if span < min_days:
        s = start
        e = end
    else:
        s = start + timedelta(days=random.randint(0, max(0, span - min_days)))
        e = min(end, s + timedelta(days=random.randint(min_days, min(max_days, span))))
    return s, e


def _status_by_dates(s: date, e: date) -> tuple:
    today = date.today()
    if e < today:
        return 'done'
    if s <= today <= e:
        return 'in_progress'
    return 'todo'

TASK_STATUS_MAP = {
    'todo': TaskStatus.TODO,
    'in_progress': TaskStatus.IN_PROGRESS,
    'done': TaskStatus.DONE,
}


def _acceptance_criteria(theme: dict, page: str) -> str:
    p = _title_mixed(page)
    return (
        f"### 验收标准\n"
        f"- Given：用户已进入 {p} 并输入合法数据\n"
        f"- When：点击保存或提交\n"
        f"- Then：返回 2xx，界面提示成功且列表/看板即时刷新\n\n"
        f"### 质量门槛\n- 单元测试覆盖率≥70%\n- i18n（zh-CN/en-US）\n- 无障碍 a11y 基本通过\n"
    )


def _menu_path(theme: dict, page: str) -> str:
    return f"{_title_mixed(theme['module'])}>{_title_mixed(page)}"


def main():
    db = SessionLocal()
    try:
        project = db.query(Project).filter(Project.key==PROJECT_KEY).first()
        if not project:
            raise RuntimeError('Project DEMO (示例空间) not found. Please run reset_to_single_project.py first.')

        # Add members (regular)
        ensure_members(db, project)

        # Clear existing data to make seeding deterministic
        clear_project_data(db, project)

        # members for assignments
        member_ids = [m.user_id for m in db.query(ProjectMember).filter(ProjectMember.project_id==project.id).all()]
        if project.creator_id not in member_ids:
            member_ids.append(project.creator_id)

        # N sprints（从配置的开始日期按迭代时长顺序生成）
        feature_cycle = itertools.cycle(FEATURE_POOL)
        base_start = datetime.strptime(CONFIG['START_DATE'], '%Y-%m-%d').date()
        for i in range(CONFIG['SPRINT_COUNT']):
            s_date = base_start + timedelta(days=i * CONFIG['SPRINT_LENGTH_DAYS'])
            e_date = s_date + timedelta(days=CONFIG['SPRINT_LENGTH_DAYS'] - 1)
            # 根据当前日期合理设置状态
            today = date.today()
            if e_date < today:
                sp_status = SprintStatus.COMPLETED
            elif s_date <= today <= e_date:
                sp_status = SprintStatus.ACTIVE
            else:
                sp_status = SprintStatus.PLANNING

            sprint = Sprint(
                project_id=project.id,
                sprint_number="TEMP",  # Will be updated after getting ID
                name=f"Sprint {i+1} ({s_date.month}月{s_date.day}日-{e_date.month}月{e_date.day}日)",
                goal=f"完成核心功能迭代 {i+1}，提升稳定性与体验",
                status=sp_status,
                start_date=s_date,
                end_date=e_date,
                created_at=datetime.combine(s_date, datetime.min.time()),
                updated_at=datetime.combine(s_date, datetime.min.time())
            )
            db.add(sprint)
            db.flush()
            sprint.sprint_number = f"S{sprint.id}"

            # M requirements per sprint（更多、更细）
            for r in range(CONFIG['REQUIREMENTS_PER_SPRINT']):
                theme = next(feature_cycle)
                page = random.choice(theme.get('pages', [theme['title']]))
                project.requirement_seq += 1
                rs, re = _pick_dates(sprint.start_date, sprint.end_date)
                req_status = random.choice([
                    RequirementStatus.DRAFT,
                    RequirementStatus.IN_PROGRESS,
                    RequirementStatus.COMPLETED,
                ])
                req = Requirement(
                    project_id=project.id,
                    sprint_id=sprint.id,
                    requirement_number="TEMP",  # Will be updated after getting ID
                    title=f"{_title_mixed(theme['module'])} - {_title_mixed(page)} - 第 {r+1} 次迭代",
description=(
                        f"### 菜单路径\n{_menu_path(theme, page)}\n\n"
                        f"### 背景\n{theme['desc']}\n\n"
                        f"### 目标\n- 上线稳定可用\n- 覆盖核心路径用例\n\n"
                        f"{_acceptance_criteria(theme, page)}"
                    ),
                    status=req_status,
                    priority=random.choice([
                        RequirementPriority.HIGH,
                        RequirementPriority.MEDIUM,
                        RequirementPriority.LOW,
                    ]),
                    creator_id=project.creator_id,
                    assignee_id=random.choice(member_ids) if member_ids else None,
                    start_date=rs,
                    end_date=re,
                    created_at=datetime.combine(rs, datetime.min.time()),
                    updated_at=datetime.combine(rs, datetime.min.time()),
                )
                db.add(req)
                db.flush()
                req.requirement_number = f"R{req.id}"

                # 生成 2-5 个子任务
                task_types = [
                    ('【前端-UI】', '页面布局与交互', theme['fe'], '表单校验、响应式适配、组件封装'),
                    ('【前端-逻辑】', '状态管理与调用', '状态管理、API调用、错误处理', '数据流转、缓存策略、异常处理'),
                    ('【后端-接口】', 'API开发与联调', theme['be'], 'RESTful规范、参数校验、鉴权'),
                    ('【后端-数据库】', '表结构与迁移', '表结构、索引优化、迁移脚本', 'SQL性能、事务处理、备份策略'),
                    ('【测试-用例编写】', '测试设计与执行', '单元测试、集成测试、E2E测试', '测试覆盖率、边界条件、回归测试'),
                    ('【测试-自动化】', '自动化脚本编写', 'Selenium/Cypress 脚本、CI集成', '稳定性、可维护性、执行效率'),
                    ('【设计-交互】', '交互原型与设计稿', '页面流程、交互细节、设计规范', '可用性、一致性、响应式'),
                ]
                min_tasks, max_tasks = CONFIG['TASKS_PER_REQUIREMENT']
                num_tasks = random.randint(min_tasks, max_tasks)
                selected_types = random.sample(task_types, num_tasks)
                
                for task_tag, task_name, task_desc, check_points in selected_types:
                    t_s, t_e = _pick_dates(rs, re)
                    t_status = _status_by_dates(t_s, t_e)
                    task = Task(
                        requirement_id=req.id,
                        task_number="TEMP",  # Will be updated after getting ID
                        title=f"{task_tag} {_title_mixed(page)} - {task_name}",
                        description=(
                            f"### 子任务说明\n{task_desc}\n\n"
                            f"### 校验点\n- {check_points}\n"
                        ),
                        status=TASK_STATUS_MAP[t_status],
                        priority=random.choice([TaskPriority.HIGH, TaskPriority.MEDIUM, TaskPriority.LOW]),
                        creator_id=project.creator_id,
                        assignee_id=random.choice(member_ids) if member_ids else None,
                        start_date=t_s,
                        end_date=t_e,
                        created_at=datetime.combine(t_s, datetime.min.time()),
                        updated_at=datetime.combine(t_s, datetime.min.time()),
                    )
                    db.add(task)
                    db.flush()
                    task.task_number = f"T{task.id}"

            db.flush()

            # 10 bugs per sprint（包含发现环境和缺陷原因，部分关联到需求）
            for b in range(10):
                module, title = random.choice(BUG_TITLES)
                env = random.choice(['development', 'testing', 'staging', 'production'])
                cause = random.choice(['code_error', 'requirement_issue', 'design_defect', 'config_error', 'environment', 'third_party', 'other'])
                maybe_req = db.query(Requirement).filter(Requirement.sprint_id==sprint.id).order_by(Requirement.id.desc()).first()
                bug_data = BugCreate(
                    project_id=project.id,
                    assignee_id=random.choice(member_ids) if member_ids else None,
                    sprint_id=sprint.id,
                    requirement_id=maybe_req.id if maybe_req and random.random() < 0.6 else None,
title=f"【{_menu_path(theme, page)}】{title}",
                    description=(
                        f"### 环境\n- 浏览器: Chrome 120 / macOS\n- 环境: {env}\n\n"
                        f"### 复现步骤\n1) 进入 {_menu_path(theme, page)}\n2) 执行特定操作\n3) 观察错误提示/日志\n\n"
                        f"### 期望\n流程无报错并正确返回\n\n### 实际\n出现异常或提示不正确"
                    ),
                    priority=random.choice([BugPriority.CRITICAL, BugPriority.HIGH, BugPriority.MEDIUM, BugPriority.LOW]),
                    severity=random.choice([BugSeverity.CRITICAL, BugSeverity.MAJOR, BugSeverity.MINOR, BugSeverity.TRIVIAL]),
                    environment=env,
                    defect_cause=cause,
                )
                bug = create_bug(db, bug_data, db.query(User).filter(User.id==project.creator_id).first())
                # 调整创建时间，使其落在迭代范围内
                bug.created_at = datetime.combine(sprint.start_date + timedelta(days=random.randint(0, (sprint.end_date - sprint.start_date).days)), datetime.min.time())

        db.commit()
        print(f"✨ Seeded 示例空间: {CONFIG['SPRINT_COUNT']} sprints × {CONFIG['REQUIREMENTS_PER_SPRINT']} requirements + tasks per sprint, each sprint 10 bugs, length {CONFIG['SPRINT_LENGTH_DAYS']}d, mixed_lang={CONFIG['MIXED_LANG']}")
    except Exception as e:
        db.rollback()
        print('❌ Error seeding demo project:', e)
        raise
    finally:
        db.close()


if __name__ == '__main__':
    main()
