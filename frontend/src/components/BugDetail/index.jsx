import { useState, useEffect } from 'react';
import { Button, Space, Tag, List, Avatar, Input, message, Select, Popconfirm, Timeline, Empty, Table } from 'antd';
import { UserOutlined, CheckCircleOutlined, ExclamationCircleOutlined, ClockCircleOutlined, UserAddOutlined, CalendarOutlined, LinkOutlined, HistoryOutlined, GlobalOutlined, BugOutlined, AimOutlined, SendOutlined, EditOutlined, DeleteOutlined, DisconnectOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DetailDrawer from '../DetailDrawer';
import RichTextEditor from '../MarkdownEditor';
import MarkdownRenderer from '../MarkdownRenderer';
import bugService from '../../services/bugService';
import requirementService from '../../services/requirementService';
import sprintService from '../../services/sprintService';
import projectService from '../../services/projectService';
import testCaseService from '../../services/testCaseService';
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

const BugDetail = ({ bugId, visible, onClose, onUpdate, projectId, onPrev, onNext, hasPrev, hasNext, onRequirementClick, onTestCaseClick }) => {
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
  const [editedAssigneeId, setEditedAssigneeId] = useState(null);
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

  // 获取项目成员列表用于处理人选择
  const { data: projectMembers } = useQuery({
    queryKey: ['projectMembers', effectiveProjectId],
    queryFn: () => projectService.getProjectMembers(effectiveProjectId),
    enabled: !!effectiveProjectId && visible,
  });

  // 获取关联的测试用例（通过 bug.testcase_id）
  const { data: linkedTestCase } = useQuery({
    queryKey: ['testcase', bug?.testcase_id],
    queryFn: () => testCaseService.getTestCase(bug.testcase_id),
    enabled: !!bug?.testcase_id && visible,
  });

  // 获取可关联的测试用例
  const { data: allTestCases } = useQuery({
    queryKey: ['projectTestCases', effectiveProjectId],
    queryFn: () => testCaseService.getTestCases({ project_id: effectiveProjectId, page_size: 100 }),
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
      setEditedAssigneeId(bug.assignee_id || null);
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

  // 关联测试用例（通过更新 bug 的 testcase_id）
  const linkTestCaseMutation = useMutation({
    mutationFn: (testCaseId) => bugService.updateBug(bugId, { testcase_id: testCaseId }),
    onSuccess: () => {
      message.success('关联成功！');
      queryClient.invalidateQueries(['bug', bugId]);
    },
    onError: (error) => {
      message.error(error.response?.data?.detail || '关联失败');
    },
  });

  // 关联需求（通过更新 bug 的 requirement_id）
  const linkRequirementMutation = useMutation({
    mutationFn: (requirementId) => bugService.updateBug(bugId, { requirement_id: requirementId }),
    onSuccess: () => {
      message.success('关联成功！');
      queryClient.invalidateQueries(['bug', bugId]);
      queryClient.invalidateQueries(['bugHistory', bugId]);
      onUpdate?.();
    },
    onError: (error) => {
      message.error(error.response?.data?.detail || '关联失败');
    },
  });

  // 移除需求关联
  const unlinkRequirementMutation = useMutation({
    mutationFn: () => bugService.updateBug(bugId, { requirement_id: null }),
    onSuccess: () => {
      message.success('已移除关联');
      queryClient.invalidateQueries(['bug', bugId]);
      queryClient.invalidateQueries(['bugHistory', bugId]);
      onUpdate?.();
    },
    onError: (error) => {
      message.error(error.response?.data?.detail || '移除失败');
    },
  });

  // 移除测试用例关联
  const unlinkTestCaseMutation = useMutation({
    mutationFn: () => bugService.updateBug(bugId, { testcase_id: null }),
    onSuccess: () => {
      message.success('已移除关联');
      queryClient.invalidateQueries(['bug', bugId]);
    },
    onError: (error) => {
      message.error(error.response?.data?.detail || '移除失败');
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
      assignee_id: editedAssigneeId,
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
      setEditedAssigneeId(bug.assignee_id || null);
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

  // 单字段更新 handler
  const handleFieldUpdate = (field, value) => {
    updateMutation.mutate({ [field]: value });
  };

  // 构建右侧边栏信息
  const sidebarItems = bug ? [
    {
      label: '状态',
      icon: <CheckCircleOutlined />,
      value: (
        <Select
          value={bug.status}
          onChange={(value) => handleFieldUpdate('status', value)}
          style={{ width: '100%' }}
          size="small"
          variant="borderless"
          options={statusOptions}
        />
      ),
    },
    {
      label: '优先级',
      icon: <ExclamationCircleOutlined />,
      value: (
        <Select
          value={bug.priority}
          onChange={(value) => handleFieldUpdate('priority', value)}
          style={{ width: '100%' }}
          size="small"
          variant="borderless"
          options={priorityOptions}
        />
      ),
    },
    {
      label: '严重程度',
      icon: <ExclamationCircleOutlined />,
      value: (
        <Select
          value={bug.severity}
          onChange={(value) => handleFieldUpdate('severity', value)}
          style={{ width: '100%' }}
          size="small"
          variant="borderless"
          options={severityOptions}
        />
      ),
    },
    {
      label: '处理人',
      icon: <UserAddOutlined />,
      value: (
        <Select
          value={bug.assignee_id}
          onChange={(value) => handleFieldUpdate('assignee_id', value)}
          style={{ width: '100%' }}
          size="small"
          variant="borderless"
          placeholder="选择处理人"
          allowClear
          showSearch
          optionFilterProp="children"
        >
          {projectMembers?.map(member => (
            <Select.Option key={member.user_id} value={member.user_id}>
              {member.user?.username || `用户${member.user_id}`}
            </Select.Option>
          ))}
        </Select>
      ),
    },
    {
      label: '创建人',
      icon: <UserOutlined />,
      value: bug.creator?.username || '-',
    },
    {
      label: '关联需求',
      icon: <LinkOutlined />,
      value: (
        <Select
          value={bug.requirement_id}
          onChange={(value) => handleFieldUpdate('requirement_id', value)}
          style={{ width: '100%' }}
          size="small"
          variant="borderless"
          placeholder="选择关联需求"
          allowClear
          showSearch
          optionFilterProp="children"
          popupMatchSelectWidth={280}
        >
          {requirements?.items?.map(req => (
            <Select.Option key={req.id} value={req.id}>
              {req.requirement_number} - {req.title}
            </Select.Option>
          ))}
        </Select>
      ),
    },
    {
      label: '发现环境',
      icon: <GlobalOutlined />,
      value: (
        <Select
          value={bug.environment}
          onChange={(value) => handleFieldUpdate('environment', value)}
          style={{ width: '100%' }}
          size="small"
          variant="borderless"
          placeholder="选择发现环境"
          allowClear
          options={environmentOptions}
        />
      ),
    },
    {
      label: '缺陷原因',
      icon: <BugOutlined />,
      value: (
        <Select
          value={bug.defect_cause}
          onChange={(value) => handleFieldUpdate('defect_cause', value)}
          style={{ width: '100%' }}
          size="small"
          variant="borderless"
          placeholder="选择缺陷原因"
          allowClear
          options={defectCauseOptions}
        />
      ),
    },
    {
      label: '迭代',
      icon: <AimOutlined />,
      value: (
        <Select
          value={bug.sprint_id}
          onChange={(value) => handleFieldUpdate('sprint_id', value)}
          style={{ width: '100%' }}
          size="small"
          variant="borderless"
          placeholder="选择迭代"
          allowClear
        >
          {sprints?.items?.map(sprint => (
            <Select.Option key={sprint.id} value={sprint.id}>
              {sprint.name?.split(' (')[0] || sprint.name}
            </Select.Option>
          ))}
        </Select>
      ),
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
              placeholder="输入评论内容... (Cmd+Enter 发送)"
              onSubmit={handleAddComment}
            />
          </div>
          <Button
            type="text"
            icon={<SendOutlined />}
            onClick={handleAddComment}
            loading={addCommentMutation.isPending}
            title="发表评论"
          />
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
                    <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleEditComment(comment)} title="编辑" />
                    <Popconfirm
                      title="删除评论"
                      description="确定要删除这条评论吗？"
                      onConfirm={() => handleDeleteComment(comment.id)}
                      okText="确定"
                      cancelText="取消"
                    >
                      <Button type="text" size="small" danger icon={<DeleteOutlined />} loading={deleteCommentMutation.isPending} title="删除" />
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
                        onSubmit={() => handleSaveComment(comment.id)}
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
  const renderTestCasesContent = () => {
    // 当前关联的用例（单个）
    const caseList = linkedTestCase ? [linkedTestCase] : [];
    
    // 过滤出可关联的用例（排除已关联的）
    const availableCases = (allTestCases?.items || []).filter(
      c => c.id !== bug?.testcase_id
    );

    const caseColumns = [
      {
        title: '编号',
        dataIndex: 'case_number',
        key: 'case_number',
        width: 80,
      },
      {
        title: '用例名称',
        dataIndex: 'name',
        key: 'name',
        ellipsis: true,
        render: (text, record) => (
          <span 
            onClick={(e) => { e.stopPropagation(); onTestCaseClick?.(record.id); }} 
            style={{ cursor: 'pointer', color: '#000' }}
          >{text}</span>
        ),
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        width: 80,
        render: (status) => {
          const colors = { passed: 'green', failed: 'red', not_executed: 'default' };
          const labels = { passed: '通过', failed: '失败', not_executed: '未执行' };
          return <Tag color={colors[status]}>{labels[status] || status}</Tag>;
        },
      },
      {
        title: '优先级',
        dataIndex: 'priority',
        key: 'priority',
        width: 80,
        render: (priority) => {
          const colors = { high: 'red', medium: 'orange', low: 'blue' };
          const labels = { high: '高', medium: '中', low: '低' };
          return <Tag color={colors[priority]}>{labels[priority]}</Tag>;
        },
      },
      {
        title: '操作',
        key: 'action',
        width: 60,
        render: () => (
          <Button 
            type="text" 
            size="small" 
            danger 
            icon={<DisconnectOutlined />} 
            title="移除关联" 
            onClick={() => unlinkTestCaseMutation.mutate()}
          />
        ),
      },
    ];

    const testCaseOptions = availableCases.map(c => ({
      value: c.id,
      label: `${c.case_number} ${c.name}`,
    }));

    return (
      <div>
        <div style={{ marginBottom: 12 }}>
          <Select
            showSearch
            placeholder="搜索并关联测试用例"
            style={{ width: '100%' }}
            value={null}
            filterOption={(input, option) =>
              option.label.toLowerCase().includes(input.toLowerCase())
            }
            onSelect={(value) => linkTestCaseMutation.mutate(value)}
            options={testCaseOptions}
            loading={linkTestCaseMutation.isPending}
            notFoundContent="暂无可关联的测试用例"
          />
        </div>
        {caseList.length > 0 ? (
          <Table
            columns={caseColumns}
            dataSource={caseList}
            rowKey="id"
            size="small"
            pagination={false}
          />
        ) : (
          <Empty description="暂无关联测试用例" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </div>
    );
  };

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

  // 需求内容
  const renderRequirementContent = () => {
    // 当前关联的需求（从 requirements 列表中获取完整数据）
    const linkedReq = bug?.requirement_id 
      ? (requirements?.items || []).find(r => r.id === bug.requirement_id) || bug.requirement
      : null;
    const reqList = linkedReq ? [linkedReq] : [];
    
    // 过滤出可关联的需求（排除已关联的）
    const availableReqs = (requirements?.items || []).filter(
      r => r.id !== bug?.requirement_id
    );

    const reqColumns = [
      {
        title: '编号',
        dataIndex: 'requirement_number',
        key: 'requirement_number',
        width: 100,
      },
      {
        title: '需求名称',
        dataIndex: 'title',
        key: 'title',
        ellipsis: true,
        render: (text, record) => (
          <span 
            onClick={(e) => { e.stopPropagation(); onRequirementClick?.(record.id); }} 
            style={{ cursor: 'pointer', color: '#000' }}
          >{text}</span>
        ),
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        width: 100,
        render: (status) => {
          const colors = { draft: 'default', approved: 'blue', in_progress: 'orange', completed: 'green', cancelled: 'red' };
          const labels = { draft: '草稿', approved: '已批准', in_progress: '进行中', completed: '已完成', cancelled: '已取消' };
          return <Tag color={colors[status]}>{labels[status] || status}</Tag>;
        },
      },
      {
        title: '优先级',
        dataIndex: 'priority',
        key: 'priority',
        width: 80,
        render: (priority) => {
          const colors = { high: 'red', medium: 'orange', low: 'blue' };
          const labels = { high: '高', medium: '中', low: '低' };
          return <Tag color={colors[priority]}>{labels[priority]}</Tag>;
        },
      },
      {
        title: '操作',
        key: 'action',
        width: 60,
        render: () => (
          <Button 
            type="text" 
            size="small" 
            danger 
            icon={<DisconnectOutlined />} 
            title="移除关联" 
            onClick={() => unlinkRequirementMutation.mutate()}
          />
        ),
      },
    ];

    const reqOptions = availableReqs.map(r => ({
      value: r.id,
      label: `${r.requirement_number} ${r.title}`,
    }));

    return (
      <div>
        <div style={{ marginBottom: 12 }}>
          <Select
            showSearch
            placeholder="搜索并关联需求"
            style={{ width: '100%' }}
            value={null}
            filterOption={(input, option) =>
              option.label.toLowerCase().includes(input.toLowerCase())
            }
            onSelect={(value) => linkRequirementMutation.mutate(value)}
            options={reqOptions}
            loading={linkRequirementMutation.isPending}
            notFoundContent="暂无可关联的需求"
          />
        </div>
        {reqList.length > 0 ? (
          <Table
            columns={reqColumns}
            dataSource={reqList}
            rowKey="id"
            size="small"
            pagination={false}
          />
        ) : (
          <Empty description="暂无关联需求" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </div>
    );
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
      key: 'requirement',
      label: '需求',
      badge: bug?.requirement_id ? 1 : 0,
      children: renderRequirementContent(),
    },
    {
      key: 'testcases',
      label: '测试用例',
      badge: bug?.testcase_id ? 1 : 0,
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
      onPrev={onPrev}
      onNext={onNext}
      hasPrev={hasPrev}
      hasNext={hasNext}
    />
  );
};

export default BugDetail;
