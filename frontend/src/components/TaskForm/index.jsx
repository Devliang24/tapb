import { useEffect, useState } from 'react';
import { Drawer, Form, Input, Select, Button, Space, Tag, message, DatePicker, Row, Col } from 'antd';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import taskService from '../../services/taskService';
import userService from '../../services/userService';
import RichTextEditor from '../MarkdownEditor';

const TaskForm = ({ visible, onClose, requirementId, projectId, story, task }) => {
  const [form] = Form.useForm();
  const [description, setDescription] = useState('');
  const queryClient = useQueryClient();
  const isEdit = !!task;

  // 获取用户列表
  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getUsers(),
    enabled: visible,
  });

  useEffect(() => {
    if (visible && task) {
      form.setFieldsValue({
        title: task.title,
        status: task.status?.toLowerCase(),
        priority: task.priority?.toLowerCase(),
        assignee_id: task.assignee_id,
        developer_id: task.developer_id,
        tester_id: task.tester_id,
        start_date: task.start_date ? dayjs(task.start_date) : null,
        end_date: task.end_date ? dayjs(task.end_date) : null,
      });
      setDescription(task.description || '');
    } else if (visible && !task) {
      form.resetFields();
      setDescription('');
    }
  }, [visible, task, form]);

  const createMutation = useMutation({
    mutationFn: (data) => taskService.createTask(requirementId, data),
    onSuccess: () => {
      message.success('任务创建成功！');
      form.resetFields();
      queryClient.invalidateQueries(['requirements', projectId]);
      onClose();
    },
    onError: (error) => {
      message.error(error.response?.data?.detail || '创建失败');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => taskService.updateTask(task.id, data),
    onSuccess: () => {
      message.success('任务更新成功！');
      form.resetFields();
      queryClient.invalidateQueries(['requirements', projectId]);
      onClose();
    },
    onError: (error) => {
      message.error(error.response?.data?.detail || '更新失败');
    },
  });

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      const submitData = {
        ...values,
        description,
        start_date: values.start_date ? values.start_date.format('YYYY-MM-DD') : null,
        end_date: values.end_date ? values.end_date.format('YYYY-MM-DD') : null,
      };
      if (isEdit) {
        updateMutation.mutate(submitData);
      } else {
        createMutation.mutate(submitData);
      }
    });
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Drawer
      title={isEdit ? '编辑任务' : '新建任务'}
      open={visible}
      onClose={handleCancel}
      width={600}
      extra={
        <Space>
          <Button onClick={handleCancel}>取消</Button>
          <Button type="primary" onClick={handleSubmit} loading={createMutation.isPending || updateMutation.isPending}>
            {isEdit ? '保存' : '创建'}
          </Button>
        </Space>
      }
    >
      {/* 关联的 Story 信息 */}
      {story && (
        <div style={{ 
          marginBottom: 24, 
          padding: 16, 
          background: '#f0f9ff', 
          borderRadius: 8,
          border: '1px solid #bae6fd'
        }}>
          <div style={{ marginBottom: 8, color: '#6b7280', fontSize: 12 }}>关联需求</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Tag color="blue">STORY</Tag>
            <span style={{ fontWeight: 500, color: '#1f2937' }}>{story.title}</span>
          </div>
        </div>
      )}

      <Form
        form={form}
        layout="vertical"
        initialValues={{ status: 'todo', priority: 'medium' }}
      >
        <Form.Item
          name="title"
          label="任务标题"
          rules={[{ required: true, message: '请输入任务标题' }]}
        >
          <Input placeholder="请输入任务标题" />
        </Form.Item>

        <Form.Item label="任务描述">
          <RichTextEditor
            value={description}
            onChange={(val) => setDescription(val || '')}
            placeholder="请输入任务描述（可选）"
            height={200}
          />
        </Form.Item>

        <Form.Item
          name="status"
          label="状态"
          rules={[{ required: true, message: '请选择状态' }]}
        >
          <Select>
            <Select.Option value="todo">待处理</Select.Option>
            <Select.Option value="in_progress">进行中</Select.Option>
            <Select.Option value="done">已完成</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="priority"
          label="优先级"
          rules={[{ required: true, message: '请选择优先级' }]}
        >
          <Select>
            <Select.Option value="high">高</Select.Option>
            <Select.Option value="medium">中</Select.Option>
            <Select.Option value="low">低</Select.Option>
          </Select>
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="assignee_id" label="处理人">
              <Select placeholder="选择处理人" allowClear showSearch optionFilterProp="children">
                {usersData?.map((user) => (
                  <Select.Option key={user.id} value={user.id}>
                    {user.username}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="developer_id" label="开发者">
              <Select placeholder="选择开发者" allowClear showSearch optionFilterProp="children">
                {usersData?.map((user) => (
                  <Select.Option key={user.id} value={user.id}>
                    {user.username}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="tester_id" label="测试人员">
              <Select placeholder="选择测试人员" allowClear showSearch optionFilterProp="children">
                {usersData?.map((user) => (
                  <Select.Option key={user.id} value={user.id}>
                    {user.username}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="时间范围">
              <Space.Compact style={{ width: '100%' }}>
                <Form.Item name="start_date" noStyle>
                  <DatePicker placeholder="开始日期" style={{ width: '50%' }} />
                </Form.Item>
                <Form.Item name="end_date" noStyle>
                  <DatePicker placeholder="结束日期" style={{ width: '50%' }} />
                </Form.Item>
              </Space.Compact>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Drawer>
  );
};

export default TaskForm;
