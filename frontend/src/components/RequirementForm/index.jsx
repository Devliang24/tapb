import { useEffect, useState } from 'react';
import { Drawer, Form, Input, Select, Button, Space, message, DatePicker, Row, Col } from 'antd';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import requirementService from '../../services/requirementService';
import sprintService from '../../services/sprintService';
import userService from '../../services/userService';
import RichTextEditor from '../MarkdownEditor';

const RequirementForm = ({ visible, onClose, projectId, requirement = null }) => {
  const [form] = Form.useForm();
  const [description, setDescription] = useState('');
  const queryClient = useQueryClient();
  const isEdit = !!requirement;

  // 获取项目的迭代列表用于选择
  const { data: sprintData } = useQuery({
    queryKey: ['sprints', projectId, 'all'],
    queryFn: () => sprintService.getSprints(projectId, { page_size: 100 }),
    enabled: visible,
  });

  // 获取用户列表
  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getUsers(),
    enabled: visible,
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
    }
  }, [visible, requirement, form]);

  const createMutation = useMutation({
    mutationFn: (data) => requirementService.createRequirement(projectId, data),
    onSuccess: () => {
      message.success('需求创建成功！');
      queryClient.invalidateQueries(['requirements', projectId]);
      onClose();
    },
    onError: (error) => {
      message.error(error.response?.data?.detail || '创建失败');
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

  const handleSubmit = async (values) => {
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
  };

  return (
    <Drawer
      title={isEdit ? '编辑需求' : '创建需求'}
      open={visible}
      onClose={onClose}
      width={600}
      extra={
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button
            type="primary"
            onClick={() => form.submit()}
            loading={createMutation.isPending || updateMutation.isPending}
          >
            {isEdit ? '保存' : '创建'}
          </Button>
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

        {isEdit && (
          <Form.Item name="status" label="状态">
            <Select>
              <Select.Option value="draft">草稿</Select.Option>
              <Select.Option value="approved">已批准</Select.Option>
              <Select.Option value="in_progress">进行中</Select.Option>
              <Select.Option value="completed">已完成</Select.Option>
              <Select.Option value="cancelled">已取消</Select.Option>
            </Select>
          </Form.Item>
        )}

        <Form.Item name="sprint_id" label="关联迭代">
          <Select placeholder="选择迭代（可选）" allowClear>
            {sprintData?.items
              ?.filter((s) => s.status !== 'completed')
              .map((sprint) => (
                <Select.Option key={sprint.id} value={sprint.id}>
                  {sprint.name}
                </Select.Option>
              ))}
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

        <Form.Item label="需求描述" required>
          <RichTextEditor
            value={description}
            onChange={(val) => setDescription(val || '')}
            placeholder="详细描述需求内容"
            height={250}
          />
        </Form.Item>
      </Form>
    </Drawer>
  );
};

export default RequirementForm;
