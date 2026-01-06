import { Drawer, Form, Input, Select, Button, Space, Row, Col, message } from 'antd';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import RichTextEditor from '../MarkdownEditor';
import bugService from '../../services/bugService';
import requirementService from '../../services/requirementService';
import sprintService from '../../services/sprintService';
import projectService from '../../services/projectService';

const defaultDescription = `
<h3>问题描述</h3>
<p></p>
<h3>重现步骤</h3>
<ol><li></li><li></li></ol>
<h3>预期结果</h3>
<p></p>
<h3>实际结果</h3>
<p></p>
`;

const BugForm = ({ visible, onClose, onSuccess, projectId }) => {
  const [form] = Form.useForm();
  const [description, setDescription] = useState(defaultDescription);
  const [continueCreate, setContinueCreate] = useState(false);
  const [loading, setLoading] = useState(false);

  const { data: requirements } = useQuery({
    queryKey: ['requirements', projectId],
    queryFn: () => requirementService.getRequirements(projectId, { page: 1, page_size: 100 }),
    enabled: !!projectId,
  });

  const { data: sprints } = useQuery({
    queryKey: ['sprints', projectId],
    queryFn: () => sprintService.getSprints(projectId),
    enabled: !!projectId,
  });

  const { data: members } = useQuery({
    queryKey: ['projectMembers', projectId],
    queryFn: () => projectService.getProjectMembers(projectId),
    enabled: !!projectId,
  });

  useEffect(() => {
    if (!visible) {
      form.resetFields();
      setDescription(defaultDescription);
    }
  }, [visible, form]);

  const handleSubmit = async (values, shouldContinue = false) => {
    try {
      setLoading(true);
      setContinueCreate(shouldContinue);
      const submitData = { ...values, description, project_id: projectId };
      console.log('提交的 Bug 数据:', submitData);
      await bugService.createBug(submitData);
      message.success('Bug 创建成功！');
      form.resetFields();
      setDescription(defaultDescription);
      onSuccess();
      if (!shouldContinue) {
        onClose();
      }
    } catch (error) {
      message.error(error.response?.data?.detail || '创建失败');
    } finally {
      setLoading(false);
      setContinueCreate(false);
    }
  };

  const handleCreateAndContinue = () => {
    form.validateFields().then((values) => {
      handleSubmit(values, true);
    });
  };

  return (
    <Drawer
      title="新建 Bug"
      open={visible}
      onClose={onClose}
      closable={false}
      maskClosable={false}
      width="55%"
      extra={
        <Space>
          <Button type="primary" onClick={() => form.submit()} loading={loading}>新建</Button>
          <Button onClick={handleCreateAndContinue} loading={loading}>新建并继续</Button>
          <Button onClick={onClose}>取消</Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Form.Item
          name="title"
          label="Bug 标题"
          rules={[{ required: true, message: '请输入标题' }]}
        >
          <Input placeholder="简洁描述问题" />
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
                <Select.Option value="critical">紧急</Select.Option>
                <Select.Option value="high">高</Select.Option>
                <Select.Option value="medium">中</Select.Option>
                <Select.Option value="low">低</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              name="severity"
              label="严重程度"
              initialValue="major"
              rules={[{ required: true, message: '请选择严重程度' }]}
            >
              <Select>
                <Select.Option value="blocker">阻塞</Select.Option>
                <Select.Option value="critical">严重</Select.Option>
                <Select.Option value="major">重要</Select.Option>
                <Select.Option value="minor">次要</Select.Option>
                <Select.Option value="trivial">轻微</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              name="environment"
              label="发现环境"
            >
              <Select placeholder="选择发现环境" allowClear>
                <Select.Option value="development">开发环境</Select.Option>
                <Select.Option value="testing">测试环境</Select.Option>
                <Select.Option value="staging">预发环境</Select.Option>
                <Select.Option value="production">生产环境</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              name="defect_cause"
              label="缺陷原因"
            >
              <Select placeholder="选择缺陷原因" allowClear>
                <Select.Option value="code_error">代码错误</Select.Option>
                <Select.Option value="design_defect">设计缺陷</Select.Option>
                <Select.Option value="requirement_issue">需求问题</Select.Option>
                <Select.Option value="config_error">配置错误</Select.Option>
                <Select.Option value="environment">环境问题</Select.Option>
                <Select.Option value="third_party">第三方问题</Select.Option>
                <Select.Option value="other">其他</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={6}>
            <Form.Item
              name="sprint_id"
              label="迭代"
            >
              <Select placeholder="选择迭代" allowClear>
                {sprints?.items?.map(sprint => (
                  <Select.Option key={sprint.id} value={sprint.id}>
                    {sprint.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              name="requirement_id"
              label="关联需求"
            >
              <Select
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
            </Form.Item>
          </Col>
          <Col span={6}>
<Form.Item
              name="assignee_id"
              label="处理人"
            >
              <Select placeholder="选择处理人" allowClear>
                {members?.map((m) => (
                  <Select.Option key={m.user_id} value={m.user_id}>
                    {m.user?.username}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="详细描述" required>
          <RichTextEditor
            value={description}
            onChange={(val) => setDescription(val || '')}
            height={350}
          />
        </Form.Item>
      </Form>
    </Drawer>
  );
};

export default BugForm;
