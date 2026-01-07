import { useEffect, useState, useRef } from 'react';
import { Drawer, Form, Input, Select, Button, Space, message, DatePicker, Row, Col, Divider, List, Avatar, Popconfirm } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import requirementService from '../../services/requirementService';
import sprintService from '../../services/sprintService';
import projectService from '../../services/projectService';
import useAuthStore from '../../stores/authStore';
import RichTextEditor from '../MarkdownEditor';

const RequirementForm = ({ visible, onClose, projectId, requirement = null }) => {
  const [form] = Form.useForm();
  const [description, setDescription] = useState('');
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentContent, setEditingCommentContent] = useState('');
  const queryClient = useQueryClient();
  const currentUser = useAuthStore(state => state.user);
  const isEdit = !!requirement;

  // 获取项目的迭代列表用于选择
  const { data: sprintData } = useQuery({
    queryKey: ['sprints', projectId, 'all'],
    queryFn: () => sprintService.getSprints(projectId, { page_size: 100 }),
    enabled: visible,
  });

// 获取空间成员列表
  const { data: membersData } = useQuery({
    queryKey: ['projectMembers', projectId],
    queryFn: () => projectService.getProjectMembers(projectId),
    enabled: visible && !!projectId,
  });

  // 获取评论列表
  const { data: comments, refetch: refetchComments } = useQuery({
    queryKey: ['requirementComments', requirement?.id],
    queryFn: () => requirementService.getComments(requirement.id),
    enabled: !!requirement?.id && visible,
  });

  useEffect(() => {
    if (visible) {
      if (requirement) {
        form.setFieldsValue({
          title: requirement.title,
          priority: requirement.priority,
          status: requirement.status,
          sprint_id: requirement.sprint_id,
          assignee_id: requirement.assignee_id,
          developer_id: requirement.developer_id,
          tester_id: requirement.tester_id,
          start_date: requirement.start_date ? dayjs(requirement.start_date) : null,
          end_date: requirement.end_date ? dayjs(requirement.end_date) : null,
        });
        setDescription(requirement.description || '');
      } else {
        form.resetFields();
        setDescription('');
      }
    } else {
      setNewComment('');
      setEditingCommentId(null);
      setEditingCommentContent('');
    }
  }, [visible, requirement, form]);

  const [continueCreate, setContinueCreate] = useState(false);

  const createMutation = useMutation({
    mutationFn: (data) => requirementService.createRequirement(projectId, data),
    onSuccess: () => {
      message.success('需求创建成功！');
      queryClient.invalidateQueries(['requirements', projectId]);
      if (continueCreate) {
        form.resetFields();
        setDescription('');
        setContinueCreate(false);
      } else {
        onClose();
      }
    },
    onError: (error) => {
      message.error(error.response?.data?.detail || '创建失败');
      setContinueCreate(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => requirementService.updateRequirement(requirement.id, data),
    onSuccess: () => {
      message.success('需求更新成功！');
      queryClient.invalidateQueries(['requirements', projectId]);
      onClose();
    },
    onError: (error) => {
      message.error(error.response?.data?.detail || '更新失败');
    },
  });

  const handleSubmit = async (values, shouldContinue = false) => {
    const submitData = {
      ...values,
      description,
      start_date: values.start_date ? values.start_date.format('YYYY-MM-DD') : null,
      end_date: values.end_date ? values.end_date.format('YYYY-MM-DD') : null,
    };
    if (isEdit) {
      updateMutation.mutate(submitData);
    } else {
      setContinueCreate(shouldContinue);
      createMutation.mutate(submitData);
    }
  };

  const handleCreateAndContinue = () => {
    form.validateFields().then((values) => {
      handleSubmit(values, true);
    });
  };

  // 评论相关
  const addCommentMutation = useMutation({
    mutationFn: (content) => requirementService.addComment(requirement.id, content),
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
    mutationFn: ({ commentId, content }) => requirementService.updateComment(requirement.id, commentId, content),
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
    mutationFn: (commentId) => requirementService.deleteComment(requirement.id, commentId),
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

  return (
    <Drawer
      title={isEdit ? '编辑需求' : '新庺需求'}
      open={visible}
      onClose={onClose}
      closable={false}
      styles={{ mask: { backgroundColor: 'transparent' } }}
      width="55%"
      extra={
        <Space>
          <Button
            type="primary"
            onClick={() => form.submit()}
            loading={createMutation.isPending || updateMutation.isPending}
          >
            {isEdit ? '保存' : '新建'}
          </Button>
          {!isEdit && (
            <Button
              onClick={handleCreateAndContinue}
              loading={createMutation.isPending}
            >
              新建并继续
            </Button>
          )}
          <Button onClick={onClose}>取消</Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="title"
          label="需求标题"
          rules={[{ required: true, message: '请输入需求标题' }]}
        >
          <Input placeholder="简洁描述需求" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={6}>
            <Form.Item
              name="priority"
              label="优先级"
              initialValue="medium"
              rules={[{ required: true, message: '请选择优先级' }]}
            >
              <Select>
                <Select.Option value="high">高</Select.Option>
                <Select.Option value="medium">中</Select.Option>
                <Select.Option value="low">低</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          {isEdit && (
            <Col span={6}>
              <Form.Item name="status" label="状态">
                <Select>
                  <Select.Option value="draft">草稿</Select.Option>
                  <Select.Option value="approved">已批准</Select.Option>
                  <Select.Option value="in_progress">进行中</Select.Option>
                  <Select.Option value="completed">已完成</Select.Option>
                  <Select.Option value="cancelled">已取消</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          )}
          <Col span={6}>
            <Form.Item name="sprint_id" label="关联迭代">
              <Select placeholder="选择迭代" allowClear>
                {sprintData?.items
                  ?.filter((s) => s.status !== 'completed')
                  .map((sprint) => (
                    <Select.Option key={sprint.id} value={sprint.id}>
                      {sprint.name}
                    </Select.Option>
                  ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={6}>
<Form.Item name="assignee_id" label="处理人">
              <Select placeholder="选择处理人" allowClear showSearch optionFilterProp="children">
                {membersData?.map((m) => (
                  <Select.Option key={m.user_id} value={m.user_id}>
                    {m.user?.username}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={6}>
<Form.Item name="developer_id" label="开发者">
              <Select placeholder="选择开发者" allowClear showSearch optionFilterProp="children">
                {membersData?.map((m) => (
                  <Select.Option key={m.user_id} value={m.user_id}>
                    {m.user?.username}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={6}>
<Form.Item name="tester_id" label="测试人员">
              <Select placeholder="选择测试人员" allowClear showSearch optionFilterProp="children">
                {membersData?.map((m) => (
                  <Select.Option key={m.user_id} value={m.user_id}>
                    {m.user?.username}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="start_date" label="开始日期">
              <DatePicker placeholder="选择日期" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="end_date" label="结束日期">
              <DatePicker placeholder="选择日期" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item required>
          <RichTextEditor
            value={description}
            onChange={(val) => setDescription(val || '')}
            placeholder="详细描述需求内容"
            height={250}
          />
        </Form.Item>
      </Form>

      {isEdit && (
        <>
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
                        <Button size="small" onClick={() => { setEditingCommentId(null); setEditingCommentContent(''); }}>取消</Button>
                        <Button size="small" type="primary" onClick={() => updateCommentMutation.mutate({ commentId: comment.id, content: editingCommentContent })} loading={updateCommentMutation.isPending}>保存</Button>
                      </Space>
                    ) : (
                      <Space key="actions">
                        <Button size="small" onClick={() => { setEditingCommentId(comment.id); setEditingCommentContent(comment.content); }}>编辑</Button>
                        <Popconfirm title="删除评论" description="确定要删除这条评论吗？" onConfirm={() => deleteCommentMutation.mutate(comment.id)} okText="确定" cancelText="取消">
                          <Button size="small" danger>删除</Button>
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
                        </span>
                      </span>
                    }
                    description={
                      editingCommentId === comment.id ? (
                        <RichTextEditor value={editingCommentContent} onChange={(val) => setEditingCommentContent(val || '')} height={120} />
                      ) : (
                        <div dangerouslySetInnerHTML={{ __html: comment.content || '' }} />
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

export default RequirementForm;
