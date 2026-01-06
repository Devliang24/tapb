import { useState, useEffect } from 'react';
import { Button, Space, Tag, List, Avatar, message, Popconfirm, Select, Input, Table, Empty, Timeline, Tooltip } from 'antd';
import { UserOutlined, CheckCircleOutlined, ExclamationCircleOutlined, ClockCircleOutlined, UserAddOutlined, CalendarOutlined, HistoryOutlined, SendOutlined, EditOutlined, DeleteOutlined, PlusOutlined, CloseOutlined, DisconnectOutlined, FieldTimeOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DetailDrawer from '../DetailDrawer';
import requirementService from '../../services/requirementService';
import projectService from '../../services/projectService';
import bugService from '../../services/bugService';
import testCaseService from '../../services/testCaseService';
import taskService from '../../services/taskService';
import sprintService from '../../services/sprintService';
import useAuthStore from '../../stores/authStore';
import RichTextEditor from '../MarkdownEditor';
import MarkdownRenderer from '../MarkdownRenderer';

const statusOptions = [
  { value: 'draft', label: '草稿', color: 'default' },
  { value: 'approved', label: '已批准', color: 'blue' },
  { value: 'in_progress', label: '进行中', color: 'purple' },
  { value: 'completed', label: '已完成', color: 'green' },
  { value: 'cancelled', label: '已取消', color: 'red' },
];

const priorityOptions = [
  { value: 'high', label: '高', color: 'red' },
  { value: 'medium', label: '中', color: 'orange' },
  { value: 'low', label: '低', color: 'blue' },
];

const taskStatusOptions = [
  { value: 'pending', label: '待处理', color: 'default' },
  { value: 'in_progress', label: '进行中', color: 'processing' },
  { value: 'completed', label: '已完成', color: 'success' },
  { value: 'cancelled', label: '已取消', color: 'error' },
];

const bugStatusOptions = [
  { value: 'new', label: '新建', color: 'blue' },
  { value: 'confirmed', label: '已确认', color: 'orange' },
  { value: 'in_progress', label: '处理中', color: 'purple' },
  { value: 'resolved', label: '已解决', color: 'green' },
  { value: 'closed', label: '已关闭', color: 'default' },
  { value: 'reopened', label: '重新打开', color: 'red' },
];

const RequirementDetail = ({ requirementId, visible, onClose, onUpdate, onTaskClick, onBugClick, onTestCaseClick, onAddTask, onAddTestCase, onAddBug, onPrev, onNext, hasPrev, hasNext }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('detail');
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [editedStatus, setEditedStatus] = useState('');
  const [editedPriority, setEditedPriority] = useState('');
  const [editedAssigneeId, setEditedAssigneeId] = useState(null);
  const [editedSprintId, setEditedSprintId] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentContent, setEditingCommentContent] = useState('');
  const queryClient = useQueryClient();
  const currentUser = useAuthStore(state => state.user);

  const { data: requirement, isLoading } = useQuery({
    queryKey: ['requirement', requirementId],
    queryFn: () => requirementService.getRequirement(requirementId),
    enabled: !!requirementId && visible,
  });

  const { data: comments, refetch: refetchComments } = useQuery({
    queryKey: ['requirementComments', requirementId],
    queryFn: () => requirementService.getComments(requirementId),
    enabled: !!requirementId && visible,
  });

const { data: members } = useQuery({
    queryKey: ['projectMembers', requirement?.project_id],
    queryFn: () => projectService.getProjectMembers(requirement.project_id),
    enabled: visible && !!requirement?.project_id,
  });

  // 获取项目迭代列表
  const { data: sprints } = useQuery({
    queryKey: ['sprints', requirement?.project_id],
    queryFn: () => sprintService.getSprints(requirement.project_id),
    enabled: visible && !!requirement?.project_id,
  });

  // 任务数据直接从 requirement 对象获取
  const tasks = requirement?.tasks || [];

  // 获取关联缺陷
  const { data: bugs } = useQuery({
    queryKey: ['requirementBugs', requirementId],
    queryFn: () => bugService.getBugs({ requirement_id: requirementId }),
    enabled: !!requirementId && visible,
  });

  // 获取关联测试用例
  const { data: testCases } = useQuery({
    queryKey: ['requirementTestCases', requirementId],
    queryFn: () => testCaseService.getTestCases({ requirement_id: requirementId }),
    enabled: !!requirementId && visible,
  });

  // 获取操作历史
  const { data: history } = useQuery({
    queryKey: ['requirementHistory', requirementId],
    queryFn: () => requirementService.getHistory(requirementId),
    enabled: !!requirementId && visible,
  });

  useEffect(() => {
    if (requirement) {
      setEditedTitle(requirement.title);
      setEditedDescription(requirement.description || '');
      setEditedStatus(requirement.status);
      setEditedPriority(requirement.priority);
      setEditedAssigneeId(requirement.assignee_id || null);
      setEditedSprintId(requirement.sprint_id || null);
    }
  }, [requirement]);

  useEffect(() => {
    if (!visible) {
      setIsEditing(false);
      setActiveTab('detail');
      setNewComment('');
      setEditingCommentId(null);
      setEditingCommentContent('');
    }
  }, [visible]);

  const updateMutation = useMutation({
    mutationFn: (data) => requirementService.updateRequirement(requirementId, data),
    onSuccess: () => {
      message.success('更新成功！');
      queryClient.invalidateQueries(['requirement', requirementId]);
      setIsEditing(false);
      onUpdate?.();
    },
    onError: (error) => {
      message.error(error.response?.data?.detail || '更新失败');
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: (content) => requirementService.addComment(requirementId, content),
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
    mutationFn: ({ commentId, content }) => requirementService.updateComment(requirementId, commentId, content),
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
    mutationFn: (commentId) => requirementService.deleteComment(requirementId, commentId),
    onSuccess: () => {
      message.success('评论删除成功！');
      refetchComments();
    },
    onError: (error) => {
      message.error(error.response?.data?.detail || '删除失败');
    },
  });

  // 获取项目所有任务（用于关联选择）
  const { data: allProjectTasks } = useQuery({
    queryKey: ['allProjectTasks', requirement?.project_id],
    queryFn: async () => {
      const allRequirements = await requirementService.getRequirements(requirement?.project_id, { page: 1, page_size: 100 });
      let allTasks = [];
      for (const req of (allRequirements?.items || [])) {
        if (req.tasks) {
          allTasks = allTasks.concat(req.tasks.map(t => ({ ...t, requirement_number: req.requirement_number })));
        }
      }
      return allTasks;
    },
    enabled: !!requirement?.project_id && visible,
  });

  // 获取项目所有缺陷（用于关联选择）
  const { data: allProjectBugs } = useQuery({
    queryKey: ['allProjectBugs', requirement?.project_id],
    queryFn: async () => {
      const result = await bugService.getBugs({
        project_id: requirement?.project_id,
        page_size: 100,
      });
      return result?.items || [];
    },
    enabled: !!requirement?.project_id && visible,
  });

  // 获取项目所有测试用例（用于关联选择）
  const { data: allProjectTestCases } = useQuery({
    queryKey: ['allProjectTestCases', requirement?.project_id],
    queryFn: async () => {
      const result = await testCaseService.getTestCases({
        project_id: requirement?.project_id,
        page_size: 100,
      });
      return result?.items || [];
    },
    enabled: !!requirement?.project_id && visible,
  });

  // 过滤出可关联的项（在渲染时过滤，确保使用最新数据）
  const linkedTaskIds = (tasks || []).map(t => t.id);
  const availableTasks = (allProjectTasks || []).filter(t => !linkedTaskIds.includes(t.id));

  const linkedBugIds = (bugs?.items || []).map(b => b.id);
  const availableBugs = (allProjectBugs || []).filter(b => !linkedBugIds.includes(b.id));

  const linkedCaseIds = (testCases?.items || []).map(c => c.id);
  const availableTestCases = (allProjectTestCases || []).filter(c => !linkedCaseIds.includes(c.id));

  // 关联任务 mutation
  const linkTaskMutation = useMutation({
    mutationFn: (taskId) => taskService.updateTask(taskId, { requirement_id: requirementId }),
    onSuccess: () => {
      message.success('关联任务成功！');
      queryClient.invalidateQueries(['requirement', requirementId]);
    },
    onError: (error) => {
      message.error(error.response?.data?.detail || '关联失败');
    },
  });

  // 关联缺陷 mutation
  const linkBugMutation = useMutation({
    mutationFn: (bugId) => bugService.updateBug(bugId, { requirement_id: requirementId }),
    onSuccess: () => {
      message.success('关联缺陷成功！');
      queryClient.invalidateQueries(['requirementBugs', requirementId]);
    },
    onError: (error) => {
      message.error(error.response?.data?.detail || '关联失败');
    },
  });

  // 关联测试用例 mutation
  const linkTestCaseMutation = useMutation({
    mutationFn: (testCaseId) => testCaseService.updateTestCase(testCaseId, { requirement_id: requirementId }),
    onSuccess: () => {
      message.success('关联测试用例成功！');
      queryClient.invalidateQueries(['requirementTestCases', requirementId]);
    },
    onError: (error) => {
      message.error(error.response?.data?.detail || '关联失败');
    },
  });

  // 移除任务关联
  const unlinkTaskMutation = useMutation({
    mutationFn: (taskId) => taskService.updateTask(taskId, { requirement_id: null }),
    onSuccess: () => {
      message.success('已移除关联');
      queryClient.invalidateQueries(['requirement', requirementId]);
    },
    onError: (error) => {
      message.error(error.response?.data?.detail || '移除失败');
    },
  });

  // 移除测试用例关联
  const unlinkTestCaseMutation = useMutation({
    mutationFn: (testCaseId) => testCaseService.updateTestCase(testCaseId, { requirement_id: null }),
    onSuccess: () => {
      message.success('已移除关联');
      queryClient.invalidateQueries(['requirementTestCases', requirementId]);
    },
    onError: (error) => {
      message.error(error.response?.data?.detail || '移除失败');
    },
  });

  // 移除缺陷关联
  const unlinkBugMutation = useMutation({
    mutationFn: (bugId) => bugService.updateBug(bugId, { requirement_id: null }),
    onSuccess: () => {
      message.success('已移除关联');
      queryClient.invalidateQueries(['requirementBugs', requirementId]);
    },
    onError: (error) => {
      message.error(error.response?.data?.detail || '移除失败');
    },
  });

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

  const handleSave = () => {
    updateMutation.mutate({
      title: editedTitle,
      description: editedDescription,
      status: editedStatus,
      priority: editedPriority,
      assignee_id: editedAssigneeId,
      sprint_id: editedSprintId,
    });
  };

  const handleCancelEdit = () => {
    if (requirement) {
      setEditedTitle(requirement.title);
      setEditedDescription(requirement.description || '');
      setEditedStatus(requirement.status);
      setEditedPriority(requirement.priority);
      setEditedAssigneeId(requirement.assignee_id || null);
      setEditedSprintId(requirement.sprint_id || null);
    }
    setIsEditing(false);
  };

  const getStatusTag = (status) => {
    const opt = statusOptions.find(o => o.value === status);
    return opt ? <Tag color={opt.color}>{opt.label}</Tag> : status;
  };

  const getPriorityTag = (priority) => {
    const opt = priorityOptions.find(o => o.value === priority);
    return opt ? <Tag color={opt.color}>{opt.label}</Tag> : priority;
  };

  // 构建右侧边栏信息
  const sidebarItems = requirement ? [
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
      ) : getStatusTag(requirement.status),
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
      ) : getPriorityTag(requirement.priority),
    },
    {
      label: '负责人',
      icon: <UserAddOutlined />,
      value: isEditing ? (
        <Select
          value={editedAssigneeId}
          onChange={setEditedAssigneeId}
          style={{ width: '100%' }}
          size="small"
          placeholder="选择负责人"
          allowClear
          showSearch
          optionFilterProp="children"
        >
{members?.map((m) => (
            <Select.Option key={m.user_id} value={m.user_id}>
              {m.user?.username}
            </Select.Option>
          ))}
        </Select>
      ) : (requirement.assignee?.username || '-'),
    },
    {
      label: '迭代',
      icon: <FieldTimeOutlined />,
      value: isEditing ? (
        <Select
          value={editedSprintId}
          onChange={setEditedSprintId}
          style={{ width: '100%' }}
          size="small"
          placeholder="选择迭代"
          allowClear
        >
          {sprints?.items?.map((s) => (
            <Select.Option key={s.id} value={s.id}>
              {s.name}
            </Select.Option>
          ))}
        </Select>
      ) : (requirement.sprint?.name || '-'),
    },
    {
      label: '创建人',
      icon: <UserOutlined />,
      value: requirement.creator?.username || '-',
    },
    {
      label: '创建时间',
      icon: <CalendarOutlined />,
      value: new Date(requirement.created_at).toLocaleString('zh-CN'),
    },
    {
      label: '更新时间',
      icon: <ClockCircleOutlined />,
      value: new Date(requirement.updated_at).toLocaleString('zh-CN'),
    },
  ] : [];

  // 详情内容
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
            <MarkdownRenderer content={requirement?.description} />
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

  // 任务列表内容
  const renderTasksContent = () => {
    const taskList = tasks || [];
    
    const taskColumns = [
      {
        title: '编号',
        dataIndex: 'task_number',
        key: 'task_number',
        width: 80,
      },
      {
        title: '任务名称',
        dataIndex: 'title',
        key: 'title',
        ellipsis: true,
        render: (text, record) => (
          <span 
            onClick={(e) => { e.stopPropagation(); onTaskClick?.(record.id); }} 
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
          const opt = taskStatusOptions.find(o => o.value === status);
          return opt ? <Tag color={opt.color}>{opt.label}</Tag> : status;
        },
      },
      {
        title: '负责人',
        dataIndex: ['assignee', 'username'],
        key: 'assignee',
        width: 100,
        render: (text) => text || '-',
      },
      {
        title: '操作',
        key: 'action',
        width: 60,
        render: (_, record) => (
          <Popconfirm
            title="移除关联"
            description="确定要移除此关联吗？"
            onConfirm={() => unlinkTaskMutation.mutate(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="text" size="small" danger icon={<DisconnectOutlined />} title="移除关联" />
          </Popconfirm>
        ),
      },
    ];

    return (
      <div>
        {taskList.length > 0 ? (
          <Table
            columns={taskColumns}
            dataSource={taskList}
            rowKey="id"
            size="small"
            pagination={false}
          />
        ) : (
          <Empty description="暂无关联任务" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </div>
    );
  };

  // 测试用例内容
  const renderTestCasesContent = () => {
    const caseList = testCases?.items || [];
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
        render: (_, record) => (
          <Popconfirm
            title="移除关联"
            description="确定要移除此关联吗？"
            onConfirm={() => unlinkTestCaseMutation.mutate(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="text" size="small" danger icon={<DisconnectOutlined />} title="移除关联" />
          </Popconfirm>
        ),
      },
    ];

    const testCaseOptions = (availableTestCases || []).map(c => ({
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

  // 缺陷列表内容
  const renderBugsContent = () => {
    const bugList = bugs?.items || [];
    const bugColumns = [
      {
        title: '编号',
        dataIndex: 'bug_number',
        key: 'bug_number',
        width: 80,
      },
      {
        title: '缺陷标题',
        dataIndex: 'title',
        key: 'title',
        ellipsis: true,
        render: (text, record) => (
          <span 
            onClick={(e) => { e.stopPropagation(); onBugClick?.(record.id); }} 
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
          const opt = bugStatusOptions.find(o => o.value === status);
          return opt ? <Tag color={opt.color}>{opt.label}</Tag> : status;
        },
      },
      {
        title: '处理人',
        dataIndex: ['assignee', 'username'],
        key: 'assignee',
        width: 100,
        render: (text) => text || '-',
      },
      {
        title: '操作',
        key: 'action',
        width: 60,
        render: (_, record) => (
          <Popconfirm
            title="移除关联"
            description="确定要移除此关联吗？"
            onConfirm={() => unlinkBugMutation.mutate(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="text" size="small" danger icon={<DisconnectOutlined />} title="移除关联" />
          </Popconfirm>
        ),
      },
    ];

    const bugOptions = (availableBugs || []).map(b => ({
      value: b.id,
      label: `${b.bug_number} ${b.title}`,
    }));

    return (
      <div>
        <div style={{ marginBottom: 12 }}>
          <Select
            showSearch
            placeholder="搜索并关联缺陷"
            style={{ width: '100%' }}
            value={null}
            filterOption={(input, option) =>
              option.label.toLowerCase().includes(input.toLowerCase())
            }
            onSelect={(value) => linkBugMutation.mutate(value)}
            options={bugOptions}
            loading={linkBugMutation.isPending}
            notFoundContent="暂无可关联的缺陷"
          />
        </div>
        {bugList.length > 0 ? (
          <Table
            columns={bugColumns}
            dataSource={bugList}
            rowKey="id"
            size="small"
            pagination={false}
          />
        ) : (
          <Empty description="暂无关联缺陷" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </div>
    );
  };

  // 字段名称映射
  const fieldLabels = {
    status: '状态',
    priority: '优先级',
    title: '标题',
    description: '描述',
    assignee_id: '负责人',
    sprint_id: '迭代',
  };

  // 状态值映射
  const statusLabels = {
    draft: '草稿',
    approved: '已批准',
    in_progress: '进行中',
    completed: '已完成',
    cancelled: '已取消',
  };

  const priorityLabels = {
    high: '高',
    medium: '中',
    low: '低',
  };

  // 获取可读的值
  const getReadableValue = (field, value) => {
    if (!value || value === 'None') return '无';
    if (field === 'status') return statusLabels[value] || value;
    if (field === 'priority') return priorityLabels[value] || value;
    if (field === 'assignee_id') return value === 'None' ? '未分配' : `用户ID:${value}`;
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
      key: 'tasks',
      label: '任务',
      badge: tasks.length,
      children: renderTasksContent(),
    },
    {
      key: 'testcases',
      label: '用例',
      badge: testCases?.items?.length || 0,
      children: renderTestCasesContent(),
    },
    {
      key: 'bugs',
      label: '缺陷',
      badge: bugs?.items?.length || 0,
      children: renderBugsContent(),
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
      title={requirement?.title}
      number={requirement?.requirement_number}
      status={requirement?.status}
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

export default RequirementDetail;
