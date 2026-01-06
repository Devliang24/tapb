import { useState, useEffect } from 'react';
import { Button, Space, Tag, List, Avatar, message, Popconfirm, Select, Input, DatePicker, Timeline, Empty, Table } from 'antd';
import { UserOutlined, CheckCircleOutlined, ExclamationCircleOutlined, ClockCircleOutlined, UserAddOutlined, CalendarOutlined, CodeOutlined, BugOutlined, HistoryOutlined, SendOutlined, EditOutlined, DeleteOutlined, DisconnectOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import DetailDrawer from '../DetailDrawer';
import taskService from '../../services/taskService';
import projectService from '../../services/projectService';
import requirementService from '../../services/requirementService';
import useAuthStore from '../../stores/authStore';
import RichTextEditor from '../MarkdownEditor';
import MarkdownRenderer from '../MarkdownRenderer';

const statusOptions = [
  { value: 'todo', label: '待处理', color: 'default' },
  { value: 'in_progress', label: '进行中', color: 'blue' },
  { value: 'done', label: '已完成', color: 'green' },
];

const priorityOptions = [
  { value: 'high', label: '高', color: 'red' },
  { value: 'medium', label: '中', color: 'orange' },
  { value: 'low', label: '低', color: 'blue' },
];

const TaskDetail = ({ taskId, visible, onClose, onUpdate, onRequirementClick }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('detail');
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [editedStatus, setEditedStatus] = useState('');
  const [editedPriority, setEditedPriority] = useState('');
  const [editedAssigneeId, setEditedAssigneeId] = useState(null);
  const [editedDeveloperId, setEditedDeveloperId] = useState(null);
  const [editedTesterId, setEditedTesterId] = useState(null);
  const [editedStartDate, setEditedStartDate] = useState(null);
  const [editedEndDate, setEditedEndDate] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentContent, setEditingCommentContent] = useState('');
  const queryClient = useQueryClient();
  const currentUser = useAuthStore(state => state.user);

  const { data: task, isLoading } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => taskService.getTask(taskId),
    enabled: !!taskId && visible,
  });

  const { data: comments, refetch: refetchComments } = useQuery({
    queryKey: ['taskComments', taskId],
    queryFn: () => taskService.getComments(taskId),
    enabled: !!taskId && visible,
  });

const { data: taskRequirement } = useQuery({
    queryKey: ['taskRequirement', task?.requirement_id],
    queryFn: () => requirementService.getRequirement(task.requirement_id),
    enabled: !!task?.requirement_id && visible,
  });

  const { data: history } = useQuery({
    queryKey: ['taskHistory', taskId],
    queryFn: () => taskService.getHistory(taskId),
    enabled: !!taskId && visible,
  });

  const projectId = taskRequirement?.project_id;

  const { data: members } = useQuery({
    queryKey: ['projectMembers', projectId],
    queryFn: () => projectService.getProjectMembers(projectId),
    enabled: !!projectId,
  });

  useEffect(() => {
    if (task) {
      setEditedTitle(task.title);
      setEditedDescription(task.description || '');
      setEditedStatus(task.status?.toLowerCase() || 'todo');
      setEditedPriority(task.priority?.toLowerCase() || 'medium');
      setEditedAssigneeId(task.assignee_id || null);
      setEditedDeveloperId(task.developer_id || null);
      setEditedTesterId(task.tester_id || null);
      setEditedStartDate(task.start_date || null);
      setEditedEndDate(task.end_date || null);
    }
  }, [task]);

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
    mutationFn: (data) => taskService.updateTask(taskId, data),
    onSuccess: () => {
      message.success('更新成功！');
      queryClient.invalidateQueries(['task', taskId]);
      setIsEditing(false);
      onUpdate?.();
    },
    onError: (error) => {
      message.error(error.response?.data?.detail || '更新失败');
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: (content) => taskService.addComment(taskId, content),
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
    mutationFn: ({ commentId, content }) => taskService.updateComment(taskId, commentId, content),
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
    mutationFn: (commentId) => taskService.deleteComment(taskId, commentId),
    onSuccess: () => {
      message.success('评论删除成功！');
      refetchComments();
    },
    onError: (error) => {
      message.error(error.response?.data?.detail || '删除失败');
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
      developer_id: editedDeveloperId,
      tester_id: editedTesterId,
      start_date: editedStartDate,
      end_date: editedEndDate,
    });
  };

  const handleCancelEdit = () => {
    if (task) {
      setEditedTitle(task.title);
      setEditedDescription(task.description || '');
      setEditedStatus(task.status?.toLowerCase() || 'todo');
      setEditedPriority(task.priority?.toLowerCase() || 'medium');
      setEditedAssigneeId(task.assignee_id || null);
      setEditedDeveloperId(task.developer_id || null);
      setEditedTesterId(task.tester_id || null);
      setEditedStartDate(task.start_date || null);
      setEditedEndDate(task.end_date || null);
    }
    setIsEditing(false);
  };

  const getStatusTag = (status) => {
    const opt = statusOptions.find(o => o.value === status?.toLowerCase());
    return opt ? <Tag color={opt.color}>{opt.label}</Tag> : status;
  };

  const getPriorityTag = (priority) => {
    const opt = priorityOptions.find(o => o.value === priority?.toLowerCase());
    return opt ? <Tag color={opt.color}>{opt.label}</Tag> : priority;
  };

// 用户选择器组件（使用空间成员）
  const renderUserSelect = (value, onChange, placeholder) => (
    <Select
      value={value}
      onChange={onChange}
      style={{ width: '100%' }}
      size="small"
      placeholder={placeholder}
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
  );

  // 构建右侧边栏信息
  const sidebarItems = task ? [
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
      ) : getStatusTag(task.status),
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
      ) : getPriorityTag(task.priority),
    },
    {
      label: '处理人',
      icon: <UserAddOutlined />,
      value: isEditing
        ? renderUserSelect(editedAssigneeId, setEditedAssigneeId, '选择处理人')
        : (task.assignee?.username || '-'),
    },
    {
      label: '开发者',
      icon: <CodeOutlined />,
      value: isEditing
        ? renderUserSelect(editedDeveloperId, setEditedDeveloperId, '选择开发者')
        : (task.developer?.username || '-'),
    },
    {
      label: '测试人员',
      icon: <BugOutlined />,
      value: isEditing
        ? renderUserSelect(editedTesterId, setEditedTesterId, '选择测试人员')
        : (task.tester?.username || '-'),
    },
    {
      label: '开始日期',
      icon: <CalendarOutlined />,
      value: isEditing ? (
        <DatePicker
          value={editedStartDate ? dayjs(editedStartDate) : null}
          onChange={(date) => setEditedStartDate(date ? date.format('YYYY-MM-DD') : null)}
          style={{ width: '100%' }}
          size="small"
          placeholder="选择开始日期"
        />
      ) : (task.start_date || '-'),
    },
    {
      label: '结束日期',
      icon: <CalendarOutlined />,
      value: isEditing ? (
        <DatePicker
          value={editedEndDate ? dayjs(editedEndDate) : null}
          onChange={(date) => setEditedEndDate(date ? date.format('YYYY-MM-DD') : null)}
          style={{ width: '100%' }}
          size="small"
          placeholder="选择结束日期"
        />
      ) : (task.end_date || '-'),
    },
    {
      label: '更新时间',
      icon: <ClockCircleOutlined />,
      value: new Date(task.updated_at).toLocaleString('zh-CN'),
    },
  ] : [];

  // 主内容区
  const renderMainContent = () => (
    <div>
      <div className="detail-drawer-section">
        {isEditing ? (
          <RichTextEditor
            value={editedDescription}
            onChange={(val) => setEditedDescription(val || '')}
            height={300}
          />
        ) : (
          <div className="detail-drawer-description">
            <MarkdownRenderer content={task?.description} />
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

  // 需求内容
  const renderRequirementContent = () => {
    const reqList = taskRequirement ? [taskRequirement] : [];

    const reqColumns = [
      {
        title: '编号',
        dataIndex: 'requirement_number',
        key: 'requirement_number',
        width: 80,
      },
      {
        title: '需求标题',
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
    ];

    return (
      <div>
        {reqList.length > 0 ? (
          <Table
            columns={reqColumns}
            dataSource={reqList}
            rowKey="id"
            size="small"
            pagination={false}
          />
        ) : (
          <Empty description="未关联需求" image={Empty.PRESENTED_IMAGE_SIMPLE} />
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
    assignee_id: '处理人',
    developer_id: '开发者',
    tester_id: '测试人员',
    start_date: '开始日期',
    end_date: '结束日期',
  };

  const statusLabels = {
    todo: '待处理',
    in_progress: '进行中',
    done: '已完成',
  };

  const priorityLabels = {
    high: '高',
    medium: '中',
    low: '低',
  };

  const getReadableValue = (field, value) => {
    if (!value || value === 'None') return '无';
    if (field === 'status') return statusLabels[value] || value;
    if (field === 'priority') return priorityLabels[value] || value;
    return value;
  };

  // 操作历史内容
  const renderHistoryContent = () => (
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
        <Empty description="暂无操作历史" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}
    </div>
  );

  // 标签页配置
  const tabs = [
    {
      key: 'detail',
      label: '详细信息',
      children: renderMainContent(),
    },
    {
      key: 'requirement',
      label: '需求',
      badge: taskRequirement ? 1 : 0,
      children: renderRequirementContent(),
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
      title={task?.title}
      number={task?.task_number}
      status={task?.status?.toLowerCase()}
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

export default TaskDetail;
