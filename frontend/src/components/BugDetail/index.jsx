import { useState, useEffect } from 'react';
import { Drawer, Button, Space, Tag, Descriptions, Divider, List, Avatar, Input, message, Select, Popconfirm } from 'antd';
import { EditOutlined, SaveOutlined, CloseOutlined, UserOutlined, SendOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import RichTextEditor from '../MarkdownEditor';
import bugService from '../../services/bugService';
import requirementService from '../../services/requirementService';
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
  { value: 'blocker', label: '阻塞' },
  { value: 'critical', label: '严重' },
  { value: 'major', label: '重要' },
  { value: 'minor', label: '次要' },
  { value: 'trivial', label: '轻微' },
];

const BugDetail = ({ bugId, visible, onClose, onUpdate, projectId }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [editedStatus, setEditedStatus] = useState('');
  const [editedPriority, setEditedPriority] = useState('');
  const [editedSeverity, setEditedSeverity] = useState('');
  const [editedRequirementId, setEditedRequirementId] = useState(null);
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

  // 获取项目需求列表用于关联选择
  const effectiveProjectId = projectId || bug?.project_id;
  const { data: requirements } = useQuery({
    queryKey: ['requirements', effectiveProjectId],
    queryFn: () => requirementService.getRequirements(effectiveProjectId, { page: 1, page_size: 100 }),
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
    }
  }, [bug]);

  useEffect(() => {
    if (!visible) {
      setIsEditing(false);
      setNewComment('');
    }
  }, [visible]);

  const updateMutation = useMutation({
    mutationFn: (data) => bugService.updateBug(bugId, data),
    onSuccess: () => {
      message.success('更新成功！');
      queryClient.invalidateQueries(['bug', bugId]);
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

  return (
    <Drawer
      title={
        isEditing ? (
          <Input 
            value={editedTitle} 
            onChange={(e) => setEditedTitle(e.target.value)}
            style={{ width: '100%' }}
          />
        ) : (
          <span>{bug?.bug_number} - {bug?.title}</span>
        )
      }
      open={visible}
      onClose={onClose}
      width={700}
      loading={isLoading}
      extra={
        <div style={{ marginRight: -8 }}>
          {isEditing ? (
            <>
              <Button type="text" onClick={handleCancelEdit} style={{ padding: '4px 8px' }}>取消</Button>
              <Button type="link" onClick={handleSave} loading={updateMutation.isPending} style={{ padding: '4px 8px' }}>保存</Button>
            </>
          ) : (
            <Button type="link" onClick={() => setIsEditing(true)} style={{ padding: '4px 8px' }}>编辑</Button>
          )}
        </div>
      }
    >
      {bug && (
        <>
          <Descriptions column={2} style={{ marginBottom: 16 }}>
            <Descriptions.Item label="状态">
              {isEditing ? (
                <Select 
                  value={editedStatus} 
                  onChange={setEditedStatus}
                  style={{ width: 120 }}
                  variant="borderless"
                  options={statusOptions}
                />
              ) : (
                getStatusTag(bug.status)
              )}
            </Descriptions.Item>
            <Descriptions.Item label="优先级">
              {isEditing ? (
                <Select 
                  value={editedPriority} 
                  onChange={setEditedPriority}
                  style={{ width: 120 }}
                  variant="borderless"
                  options={priorityOptions}
                />
              ) : (
                getPriorityTag(bug.priority)
              )}
            </Descriptions.Item>
            <Descriptions.Item label="严重程度">
              {isEditing ? (
                <Select 
                  value={editedSeverity} 
                  onChange={setEditedSeverity}
                  style={{ width: 120 }}
                  variant="borderless"
                  options={severityOptions}
                />
              ) : (
                severityOptions.find(o => o.value === bug.severity)?.label || bug.severity
              )}
            </Descriptions.Item>
            <Descriptions.Item label="创建者">{bug.creator?.username || '-'}</Descriptions.Item>
            <Descriptions.Item label="处理人">{bug.assignee?.username || '未分配'}</Descriptions.Item>
            <Descriptions.Item label="关联需求">
              {isEditing ? (
                <Select 
                  value={editedRequirementId} 
                  onChange={setEditedRequirementId}
                  style={{ width: 200 }}
                  variant="borderless"
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
                bug.requirement ? (
                  <span>{bug.requirement.requirement_number} - {bug.requirement.title}</span>
                ) : '未关联'
              )}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">{new Date(bug.created_at).toLocaleString('zh-CN')}</Descriptions.Item>
          </Descriptions>

          <Divider />

          <div style={{ marginBottom: 16 }}>
            <h4 style={{ marginBottom: 12, color: '#1f2937' }}>详情描述</h4>
            {isEditing ? (
              <RichTextEditor
                value={editedDescription}
                onChange={(val) => setEditedDescription(val || '')}
                height={300}
              />
            ) : (
              <div 
                style={{ 
                  padding: 16, 
                  background: '#fafafa', 
                  borderRadius: 8, 
                  minHeight: 200,
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word'
                }}
                dangerouslySetInnerHTML={{ 
                  __html: bug?.description 
                    ? `<style>
                        .bug-desc-content img { max-width: 100%; height: auto; }
                        .bug-desc-content pre { overflow-x: auto; max-width: 100%; }
                        .bug-desc-content code { overflow-x: auto; max-width: 100%; }
                        .bug-desc-content table { max-width: 100%; overflow-x: auto; }
                        .bug-desc-content ol, .bug-desc-content ul { padding-left: 24px; margin: 8px 0; }
                        .bug-desc-content li { margin: 4px 0; }
                      </style><div class="bug-desc-content">${bug.description}</div>` 
                    : '' 
                }}
              />
            )}
          </div>

          <Divider />

          <div>
            <h4 style={{ marginBottom: 12, color: '#1f2937' }}>评论 ({comments?.length || 0})</h4>
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
                        <Button 
                          size="small" 
                          onClick={handleCancelEditComment}
                        >
                          取消
                        </Button>
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
                        <Button 
                          size="small" 
                          onClick={() => handleEditComment(comment)}
                        >
                          编辑
                        </Button>
                        <Popconfirm
                          title="删除评论"
                          description="确定要删除这条评论吗？"
                          onConfirm={() => handleDeleteComment(comment.id)}
                          okText="确定"
                          cancelText="取消"
                        >
                          <Button 
                            size="small" 
                            danger
                            loading={deleteCommentMutation.isPending}
                          >
                            删除
                          </Button>
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
                          style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                          dangerouslySetInnerHTML={{ 
                            __html: comment.content 
                              ? `<style>
                                  .comment-content img { max-width: 100%; height: auto; }
                                  .comment-content pre { overflow-x: auto; max-width: 100%; }
                                  .comment-content code { overflow-x: auto; max-width: 100%; }
                                  .comment-content table { max-width: 100%; overflow-x: auto; }
                                  .comment-content ol, .comment-content ul { padding-left: 24px; margin: 8px 0; }
                                  .comment-content li { margin: 4px 0; }
                                </style><div class="comment-content">${comment.content}</div>` 
                              : '' 
                          }}
                        />
                      )
                    }
                  />
                </List.Item>
              )}
            />
          </div>
        </>
      )}
    </Drawer>
  );
};

export default BugDetail;
