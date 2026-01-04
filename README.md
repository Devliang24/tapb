# TAPB - Bug Management System

一个基于 FastAPI + React + Ant Design 的 Bug 管理系统

## 技术栈

### 后端
- FastAPI
- SQLAlchemy
- SQLite
- JWT 认证
- Alembic (数据库迁移)

### 前端
- React 18
- Ant Design
- Zustand (状态管理)
- React Query
- Vite

## 快速开始

### Docker 一键启动（推荐）

```bash
# 启动所有服务（后端 + 前端）
docker-compose up -d

# 查看日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f frontend

# 停止所有服务
docker-compose down
```

**访问地址：**
- 前端: http://localhost:5173
- 后端 API: http://localhost:8000
- API 文档: http://localhost:8000/docs

### 初始化示例数据

为项目添加示例迭代和需求数据：

```bash
# 使用 Docker
docker-compose exec backend python seed_examples.py <project_id>

# 示例：为 ID 为 1 的项目添加示例数据
docker-compose exec backend python seed_examples.py 1
```

这将为指定项目创建：
- 3 个示例迭代（已完成/进行中/规划中）
- 3 个示例需求（不同状态和优先级）

### 本地启动（不使用 Docker）

**后端：**
```bash
cd backend
./start.sh
```

**前端：**
```bash
cd frontend
npm install
npm run dev
```

## 项目结构

```
tapb/
├── backend/                # 后端代码
│   ├── app/
│   │   ├── models/        # 数据库模型
│   │   ├── schemas/       # Pydantic schemas
│   │   ├── api/           # API 路由
│   │   ├── services/      # 业务逻辑
│   │   └── utils/         # 工具函数
│   ├── alembic/           # 数据库迁移
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/              # 前端代码
│   ├── src/
│   │   ├── components/    # React 组件
│   │   ├── pages/         # 页面
│   │   ├── services/      # API 服务
│   │   └── hooks/         # 自定义 hooks
│   └── package.json
└── docker-compose.yml     # Docker 编排
```

## 开发说明

### 数据库迁移

```bash
# 创建新迁移
docker-compose exec backend alembic revision --autogenerate -m "description"

# 应用迁移
docker-compose exec backend alembic upgrade head

# 回滚迁移
docker-compose exec backend alembic downgrade -1
```

### API 测试

访问 http://localhost:8000/docs 查看 Swagger 文档并测试 API

## 功能模块

- ✅ 用户认证与权限管理
- ✅ 项目管理
- ✅ Bug 管理 (创建、编辑、删除、状态流转)
- ✅ 批量操作 (批量修改状态、批量分配)
- ✅ 评论系统 (支持 Markdown)
- ✅ 搜索与筛选
- ✅ Bug 历史记录

## Bug 编号规则

Bug 编号采用项目前缀 + 序号的格式，例如:
- PROJ-001
- PROJ-002
- TEST-001
