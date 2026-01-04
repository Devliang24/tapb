# 评论功能实现总结 / Comment Features Implementation Summary

## 实现的功能 / Implemented Features

### 1. 编辑评论 / Edit Comments
- **API端点**: `PUT /api/bugs/{bug_id}/comments/{comment_id}`
- **权限**: 只有评论作者可以编辑自己的评论
- **功能**: 
  - 更新评论内容
  - 自动更新 `updated_at` 时间戳
  - 重新解析 @提及 并更新 `mentioned_user_ids`

### 2. 删除评论 / Delete Comments
- **API端点**: `DELETE /api/bugs/{bug_id}/comments/{comment_id}`
- **权限**: 只有评论作者可以删除自己的评论
- **状态**: 已存在，经过验证

### 3. @提及项目成员 / Mention Project Members
- **支持格式**:
  - `@[username]` - 带方括号的用户名
  - `@username` - 不带方括号的用户名（仅限字母数字字符）
- **功能**:
  - 自动从评论内容中提取 @提及
  - 验证被提及用户是项目成员
  - 将有效的用户ID存储在 `mentioned_user_ids` 字段中
  - 创建和编辑评论时都会解析提及

## 数据库变更 / Database Changes

### bug_comments 表新增字段:
1. **mentioned_user_ids** (JSON)
   - 存储被提及用户的ID列表
   - 默认值: `[]`
   - NOT NULL

2. **updated_at** (DATETIME)
   - 记录评论最后更新时间
   - 创建时等于 created_at
   - 编辑时自动更新

## 代码变更 / Code Changes

### 1. 模型层 (app/models/comment.py)
- 添加 `mentioned_user_ids` JSON字段
- 添加 `updated_at` DateTime字段，带自动更新

### 2. Schema层 (app/schemas/comment.py)
- 新增 `CommentUpdate` schema 用于编辑
- 新增 `UserInfo` schema 用于返回用户信息
- 更新 `CommentResponse` 包含新字段和用户信息

### 3. API层 (app/api/bugs.py)
- **新增** `PUT /api/bugs/{bug_id}/comments/{comment_id}` - 编辑评论
- **更新** `POST /api/bugs/{bug_id}/comments` - 创建时提取提及
- **更新** `GET /api/bugs/{bug_id}/comments` - 返回用户信息

### 4. 工具层 (app/utils/comment_utils.py)
- 新增 `extract_mentions()` 函数
  - 使用正则表达式提取 @提及
  - 验证用户是否为项目成员
  - 返回有效的用户ID列表

## API 使用示例 / API Usage Examples

### 创建评论 (带提及)
```bash
POST /api/bugs/1/comments
{
  "content": "Hi @john, please check this @[jane doe]"
}
```

### 编辑评论
```bash
PUT /api/bugs/1/comments/5
{
  "content": "Updated content with @alice mention"
}
```

### 删除评论
```bash
DELETE /api/bugs/1/comments/5
```

### 获取评论列表
```bash
GET /api/bugs/1/comments
```

响应包含:
- 评论内容
- 作者信息 (id, username, email)
- 被提及用户ID列表
- 创建和更新时间

## 权限控制 / Permission Control
- ✅ 只有评论作者可以编辑自己的评论
- ✅ 只有评论作者可以删除自己的评论
- ✅ 只有项目成员可以被提及
- ✅ 所有项目成员可以查看评论

## 迁移 / Migration
- 迁移ID: `cfab7e244d6d`
- 状态: ✅ 已应用
- 方法: 使用 SQLite 批量操作添加新列
