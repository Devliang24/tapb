import { useState, useEffect } from 'react';
import { Button, Space, Tag, List, Avatar, Input, message, Select, Popconfirm, Timeline, Empty } from 'antd';
import { UserOutlined, CheckCircleOutlined, ExclamationCircleOutlined, ClockCircleOutlined, UserAddOutlined, CalendarOutlined, LinkOutlined, HistoryOutlined, GlobalOutlined, BugOutlined, AimOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DetailDrawer from '../DetailDrawer';
import RichTextEditor from '../MarkdownEditor';
import MarkdownRenderer from '../MarkdownRenderer';
import bugService from '../../services/bugService';
import requirementService from '../../services/requirementService';
import sprintService from '../../services/sprintService';
import useAuthStore from '../../stores/authStore';

const statusOptions = [
  { value: 'new', label: '新建', color: 'blue' },
  { value: 'confirmed', label: '已确认', color: 'orange' },
  { value: 'in_progress', label: '处理中', color: 'purple' },
  { value: 'resolved', label: '已解决', color: 'green' },
  { value: 'closed', label: '已关闭', color: 'default' },
  { value: 'reopened', label: '重新打开', color: 'red' },
];

const priorityOptions = [
  { value: 'critical', label: '紧急', color: 'red' },
  { value: 'high', label: '高', color: 'orange' },
  { value: 'medium', label: '中', color: 'blue' },
  { value: 'low', label: '低', color: 'default' },
];

const severityOptions = [
  { value: 'blocker', label: '阻塞', color: 'red' },
  { value: 'critical', label: '严重', color: 'orange' },
  { value: 'major', label: '重要', color: 'gold' },
  { value: 'minor', label: '次要', color: 'blue' },
  { value: 'trivial', label: '轻微', color: 'default' },
];

const environmentOptions = [
  { value: 'development', label: '开发环境' },
  { value: 'testing', label: '测试环境' },
  { value: 'staging', label: '预发环境' },
  { value: 'production', label: '生产环境' },
];

const defectCauseOptions = [
  { value: 'code_error', label: '代码错误' },
  { value: 'design_defect', label: '设计缺陷' },
  { value: 'requirement_issue', label: '需求问题' },
  { value: 'config_error', label: '配置错误' },
  { value: 'environment', label: '环境问题' },
  { value: 'third_party', label: '第三方问题' },
  { value: 'other', label: '其他' },
];

const BugDetail = ({ bugId, visible, onClose, onUpdate, projectId }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('detail');
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [editedStatus, setEditedStatus] = useState('');
  const [editedPriority, setEditedPriority] = useState('');
  const [editedSeverity, setEditedSeverity] = useState('');
  const [editedRequirementId, setEditedRequirementId] = useState(null);
  const [editedEnvironment, setEditedEnvironment] = useState(null);
  const [editedDefectCause, setEditedDefectCause] = useState(null);
  const [editedSprintId, setEditedSprintId] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentContent, setEditingCommentContent] = useState('');
  const queryClient = useQueryClient();
  const currentUser = useAuthStore(state => state.user);

  const { data: bug, isLoading } = useQuery({
    queryKey: ['bug', bugId],
    queryFn: () => bugService.getBug(bugId),
    enabled: !!bugId && visible,
  });

  const { data: comments, refetch: refetchComments } = useQuery({
    queryKey: ['bugComments', bugId],
    queryFn: () => bugService.getComments(bugId),
    enabled: !!bugId && visible,
  });

  const { data: history } = useQuery({
    queryKey: ['bugHistory', bugId],
    queryFn: () => bugService.getHistory(bugId),
    enabled: !!bugId && visible,
  });

  // 获取项目需求列表用于关联选择
  const effectiveProjectId = projectId || bug?.project_id;
  const { data: requirements } = useQuery({
    queryKey: ['requirements', effectiveProjectId],
    queryFn: () => requirementService.getRequirements(effectiveProjectId, { page: 1, page_size: 100 }),
    enabled: !!effectiveProjectId && visible,
  });

  // 获取项目迭代列表
  const { data: sprints } = useQuery({
    queryKey: ['sprints', effectiveProjectId],
    queryFn: () => sprintService.getSprints(effectiveProjectId),
    enabled: !!effectiveProjectId && visible,
  });

  useEffect(() => {
    if (bug) {
      setEditedTitle(bug.title);
      setEditedDescription(bug.description);
      setEditedStatus(bug.status);
      setEditedPriority(bug.priority);
      setEditedSeverity(bug.severity);
      setEditedRequirementId(bug.requirement_id || null);
      setEditedEnvironment(bug.environment || null);
      setEditedDefectCause(bug.defect_cause || null);
      setEditedSprintId(bug.sprint_id || null);
    }
  }, [bug]);

  useEffect(() => {
    if (!visible) {
      setIsEditing(false);
      setActiveTab('detail');
      setNewComment('');
    }
  }, [visible]);

  const updateMutation = useMutation({
    mutationFn: (data) => bugService.updateBug(bugId, data),
    onSuccess: () => {
      message.success('更新成功！');
      queryClient.invalidateQueries(['bug', bugId]);
      queryClient.invalidateQueries(['bugHistory', bugId]);
      setIsEditing(false);
      onUpdate?.();
    },
    onError: (error) => {
      message.error(error.response?.data?.detail || '更新失败');
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: (content) => bugService.addComment(bugId, content),
    onSuccess: () => {
      message.success('评论添加成功！');
      setNewComment('');
      refetchComments();
    },
    onError: (error) => {
      message.error(error.response?.data?.detail || '评论失败');
    },
  });

  const updateCommentMutation = useMutation({
    mutationFn: ({ commentId, content }) => bugService.updateComment(bugId, commentId, content),
    onSuccess: () => {
      message.success('评论更新成功！');
      setEditingCommentId(null);
      setEditingCommentContent('');
      refetchComments();
    },
    onError: (error) => {
      message.error(error.response?.data?.detail || '更新失败');
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId) => bugService.deleteComment(bugId, commentId),
    onSuccess: () => {
      message.success('评论删除成功！');
      refetchComments();
    },
    onError: (error) => {
      message.error(error.response?.data?.detail || '删除失败');
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      title: editedTitle,
      description: editedDescription,
      status: editedStatus,
      priority: editedPriority,
      severity: editedSeverity,
      requirement_id: editedRequirementId,
      environment: editedEnvironment,
      defect_cause: editedDefectCause,
      sprint_id: editedSprintId,
    });
  };

  const handleCancelEdit = () => {
    if (bug) {
      setEditedTitle(bug.title);
      setEditedDescription(bug.description);
      setEditedStatus(bug.status);
      setEditedPriority(bug.priority);
      setEditedSeverity(bug.severity);
      setEditedRequirementId(bug.requirement_id || null);
      setEditedEnvironment(bug.environment || null);
      setEditedDefectCause(bug.defect_cause || null);
      setEditedSprintId(bug.sprint_id || null);
    }
    setIsEditing(false);
  };

  const handleAddComment = () => {
    if (!newComment.trim()) {
      message.warning('请输入评论内容');
      return;
    }
    addCommentMutation.mutate(newComment);
  };

  const handleEditComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditingCommentContent(comment.content);
  };

  const handleSaveComment = (commentId) => {
    if (!editingCommentContent.trim()) {
      message.warning('评论内容不能为空');
      return;
    }
    updateCommentMutation.mutate({ commentId, content: editingCommentContent });
  };

  const handleCancelEditComment = () => {
    setEditingCommentId(null);
    setEditingCommentContent('');
  };

  const handleDeleteComment = (commentId) => {
    deleteCommentMutation.mutate(commentId);
  };

  const getStatusTag = (status) => {
    const opt = statusOptions.find(o => o.value === status);
    return opt ? <Tag color={opt.color}>{opt.label}</Tag> : status;
  };

  const getPriorityTag = (priority) => {
    const opt = priorityOptions.find(o => o.value === priority);
    return opt ? <Tag color={opt.color}>{opt.label}</Tag> : priority;
  };

  const getSeverityTag = (severity) => {
    const opt = severityOptions.find(o => o.value === severity);
    return opt ? <Tag color={opt.color}>{opt.label}</Tag> : severity;
  };

  // 构建右侧边栏信息
  const sidebarItems = bug ? [
    {
      label: '状态',
      icon: <CheckCircleOutlined />,
      value: isEditing ? (
        <Select
          value={editedStatus}
          onChange={setEditedStatus}
          style={{ width: '100%' }}
          size="small"
          options={statusOptions}
        />
      ) : getStatusTag(bug.status),
    },
    {
      label: '优先级',
      icon: <ExclamationCircleOutlined />,
      value: isEditing ? (
        <Select
          value={editedPriority}
          onChange={setEditedPriority}
          style={{ width: '100%' }}
          size="small"
          options={priorityOptions}
        />
      ) : getPriorityTag(bug.priority),
    },
    {
      label: '严重程度',
      icon: <ExclamationCircleOutlined />,
      value: isEditing ? (
        <Select
          value={editedSeverity}
          onChange={setEditedSeverity}
          style={{ width: '100%' }}
          size="small"
          options={severityOptions}
        />
      ) : getSeverityTag(bug.severity),
    },
    {
      label: '处理人',
      icon: <UserAddOutlined />,
      value: bug.assignee?.username || '未分配',
    },
    {
      label: '创建人',
      icon: <UserOutlined />,
      value: bug.creator?.username || '-',
    },
    {
      label: '关联需求',
      icon: <LinkOutlined />,
      value: isEditing ? (
        <Select
          value={editedRequirementId}
          onChange={setEditedRequirementId}
          style={{ width: '100%' }}
          size="small"
          placeholder="选择关联需求"
          allowClear
          showSearch
          optionFilterProp="children"
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
        >
          {requirements?.items?.map(req => (
            <Select.Option
              key={req.id}
              value={req.id}
              label={`${req.requirement_number} - ${req.title}`}
            >
              {req.requirement_number} - {req.title}
            </Select.Option>
          ))}
        </Select>
      ) : (
        bug.requirement ? `${bug.requirement.requirement_number}` : '未关联'
      ),
    },
    {
      label: '发现环境',
      icon: <GlobalOutlined />,
      value: isEditing ? (
        <Select
          value={editedEnvironment}
          onChange={setEditedEnvironment}
          style={{ width: '100%' }}
          size="small"
          placeholder="选择发现环境"
          allowClear
          options={environmentOptions}
        />
      ) : (
        environmentOptions.find(o => o.value === bug.environment)?.label || '未设置'
      ),
    },
    {
      label: '缺陷原因',
      icon: <BugOutlined />,
      value: isEditing ? (
        <Select
          value={editedDefectCause}
          onChange={setEditedDefectCause}
          style={{ width: '100%' }}
          size="small"
          placeholder="选择缺陷原因"
          allowClear
          options={defectCauseOptions}
        />
      ) : (
        defectCauseOptions.find(o => o.value === bug.defect_cause)?.label || '未设置'
      ),
    },
    {
      label: '迭代',
      icon: <AimOutlined />,
      value: isEditing ? (
        <Select
          value={editedSprintId}
          onChange={setEditedSprintId}
          style={{ width: '100%' }}
          size="small"
          placeholder="选择迭代"
          allowClear
        >
          {sprints?.items?.map(sprint => (
            <Select.Option key={sprint.id} value={sprint.id}>
              {sprint.name}
            </Select.Option>
          ))}
        </Select>
      ) : (bug.sprint?.name || '未设置'),
    },
    {
      label: '创建时间',
      icon: <CalendarOutlined />,
      value: new Date(bug.created_at).toLocaleString('zh-CN'),
    },
    {
      label: '更新时间',
      icon: <ClockCircleOutlined />,
      value: new Date(bug.updated_at).toLocaleString('zh-CN'),
    },
  ] : [];

  // 详细信息内容
  const renderDetailContent = () => (
    <div>
      {/* 详情描述 */}
      <div className="detail-drawer-section">
        {isEditing ? (
          <RichTextEditor
            value={editedDescription}
            onChange={(val) => setEditedDescription(val || '')}
            height={300}
          />
        ) : (
          <div className="detail-drawer-description">
            <MarkdownRenderer content={bug?.description} />
          </div>
        )}
      </div>

      {/* 评论区 */}
      <div className="detail-drawer-section">
        <div className="detail-drawer-section-title">评论 ({comments?.length || 0})</div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8 }}>
            <RichTextEditor
              value={newComment}
              onChange={(val) => setNewComment(val || '')}
              height={120}
              placeholder="输入评论内容..."
            />
          </div>
          <Button
            type="primary"
            onClick={handleAddComment}
            loading={addCommentMutation.isPending}
          >
            发表评论
          </Button>
        </div>
        <List
          itemLayout="horizontal"
          dataSource={comments || []}
          locale={{ emptyText: '暂无评论' }}
          renderItem={(comment) => (
            <List.Item
              actions={currentUser && comment.user_id === currentUser.id ? [
                editingCommentId === comment.id ? (
                  <Space key="edit-actions">
                    <Button size="small" onClick={handleCancelEditComment}>取消</Button>
                    <Button
                      size="small"
                      type="primary"
                      onClick={() => handleSaveComment(comment.id)}
                      loading={updateCommentMutation.isPending}
                    >
                      保存
                    </Button>
                  </Space>
                ) : (
                  <Space key="actions">
                    <Button size="small" onClick={() => handleEditComment(comment)}>编辑</Button>
                    <Popconfirm
                      title="删除评论"
                      description="确定要删除这条评论吗？"
                      onConfirm={() => handleDeleteComment(comment.id)}
                      okText="确定"
                      cancelText="取消"
                    >
                      <Button size="small" danger loading={deleteCommentMutation.isPending}>删除</Button>
                    </Popconfirm>
                  </Space>
                )
              ] : []}
            >
              <List.Item.Meta
                avatar={<Avatar icon={<UserOutlined />} />}
                title={
                  <span>
                    {comment.user?.username || '用户'}
                    <span style={{ color: '#999', fontSize: 12, marginLeft: 8 }}>
                      {new Date(comment.created_at).toLocaleString('zh-CN')}
                      {comment.updated_at && comment.updated_at !== comment.created_at && (
                        <span style={{ marginLeft: 4 }}>(已编辑)</span>
                      )}
                    </span>
                  </span>
                }
                description={
                  editingCommentId === comment.id ? (
                    <div style={{ marginTop: 8 }}>
                      <RichTextEditor
                        value={editingCommentContent}
                        onChange={(val) => setEditingCommentContent(val || '')}
                        height={120}
                      />
                    </div>
                  ) : (
                    <div
                      className="detail-drawer-description"
                      style={{ padding: 12, minHeight: 'auto', marginTop: 8, background: '#fff' }}
                      dangerouslySetInnerHTML={{ __html: comment.content || '' }}
                    />
                  )
                }
              />
            </List.Item>
          )}
        />
      </div>
    </div>
  );

  // 测试用例内容
  const renderTestCasesContent = () => (
    <div>
      <Empty
        description="暂无关联测试用例"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    </div>
  );

  // 字段名称映射
  const fieldLabels = {
    status: '状态',
    priority: '优先级',
    severity: '严重程度',
    title: '标题',
    description: '描述',
    assignee: '处理人',
    requirement: '关联需求',
    sprint: '迭代',
    environment: '发现环境',
    defect_cause: '缺陷原因',
  };

  // 状态值映射
  const statusLabels = {
    new: '新建',
    confirmed: '已确认',
    in_progress: '处理中',
    resolved: '已解决',
    closed: '已关闭',
    reopened: '重新打开',
  };

  const priorityLabels = {
    critical: '紧急',
    high: '高',
    medium: '中',
    low: '低',
  };

  const severityLabels = {
    blocker: '阻塞',
    critical: '严重',
    major: '重要',
    minor: '次要',
    trivial: '轻微',
  };

  const environmentLabels = {
    development: '开发环境',
    testing: '测试环境',
    staging: '预发环境',
    production: '生产环境',
  };

  const defectCauseLabels = {
    code_error: '代码错误',
    design_defect: '设计缺陷',
    requirement_issue: '需求问题',
    config_error: '配置错误',
    environment: '环境问题',
    third_party: '第三方问题',
    other: '其他',
  };

  // 获取可读的值
  const getReadableValue = (field, value) => {
    if (!value || value === 'None') return '无';
    if (field === 'status') return statusLabels[value] || value;
    if (field === 'priority') return priorityLabels[value] || value;
    if (field === 'severity') return severityLabels[value] || value;
    if (field === 'environment') return environmentLabels[value] || value;
    if (field === 'defect_cause') return defectCauseLabels[value] || value;
    if (field === 'assignee') return value === '未分配' ? '未分配' : `用户ID:${value}`;
    return value;
  };

  // 操作历史内容
  const renderHistoryContent = () => {
    return (
      <div>
        {history && history.length > 0 ? (
          <Timeline
            items={history.map((item) => ({
              key: item.id,
              dot: <HistoryOutlined style={{ fontSize: 16, color: '#1890ff' }} />,
              children: (
                <div>
                  <div style={{ color: '#666', fontSize: 12, marginBottom: 4 }}>
                    {new Date(item.changed_at).toLocaleString('zh-CN')}
                  </div>
                  <div>
                    <span style={{ fontWeight: 500, color: '#1890ff' }}>
                      {item.user?.username || '系统'}
                    </span>
                    <span style={{ marginLeft: 8 }}>
                      修改了 <strong>{fieldLabels[item.field] || item.field}</strong>
                    </span>
                  </div>
                  <div style={{ marginTop: 4, fontSize: 13, color: '#666' }}>
                    <span style={{ textDecoration: 'line-through', color: '#999' }}>
                      {getReadableValue(item.field, item.old_value)}
                    </span>
                    <span style={{ margin: '0 8px' }}>→</span>
                    <span style={{ color: '#52c41a', fontWeight: 500 }}>
                      {getReadableValue(item.field, item.new_value)}
                    </span>
                  </div>
                </div>
              ),
            }))}
          />
        ) : (
          <Empty
            description="暂无操作历史"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </div>
    );
  };

  // 标签页配置
  const tabs = [
    {
      key: 'detail',
      label: '详细信息',
      children: renderDetailContent(),
    },
    {
      key: 'testcases',
      label: '测试用例',
      badge: 0,
      children: renderTestCasesContent(),
    },
    {
      key: 'history',
      label: '操作历史',
      children: renderHistoryContent(),
    },
  ];

  // 状态快捷改变
  const handleStatusChange = (newStatus) => {
    updateMutation.mutate({
      status: newStatus,
    });
  };

  return (
    <DetailDrawer
      visible={visible}
      onClose={onClose}
      title={bug?.title}
      number={bug?.bug_number}
      status={bug?.status}
      statusOptions={statusOptions}
      onStatusChange={handleStatusChange}
      loading={isLoading}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      sidebarItems={sidebarItems}
      editable={true}
      isEditing={isEditing}
      onEdit={() => setIsEditing(true)}
      onSave={handleSave}
      onCancelEdit={handleCancelEdit}
      saving={updateMutation.isPending}
      editedTitle={editedTitle}
      onTitleChange={setEditedTitle}
    />
  );
};

export default BugDetail;
