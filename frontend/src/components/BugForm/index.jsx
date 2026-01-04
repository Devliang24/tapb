import { Drawer, Form, Input, Select, Button, Space, Row, Col, message } from 'antd';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import RichTextEditor from '../MarkdownEditor';
import bugService from '../../services/bugService';
import requirementService from '../../services/requirementService';

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

  const { data: requirements } = useQuery({
    queryKey: ['requirements', projectId],
    queryFn: () => requirementService.getRequirements(projectId, { page: 1, page_size: 100 }),
    enabled: !!projectId,
  });

  useEffect(() => {
    if (!visible) {
      form.resetFields();
      setDescription(defaultDescription);
    }
  }, [visible, form]);

  const handleSubmit = async (values) => {
    try {
      const submitData = { ...values, description, project_id: projectId };
      console.log('提交的 Bug 数据:', submitData);
      await bugService.createBug(submitData);
      message.success('Bug 创建成功！');
      form.resetFields();
      setDescription(defaultDescription);
      onSuccess();
      onClose();
    } catch (error) {
      message.error(error.response?.data?.detail || '创建失败');
    }
  };

  return (
    <Drawer
      title="创建 Bug"
      open={visible}
      onClose={onClose}
      width={640}
      extra={
        <div style={{ marginRight: -8 }}>
          <Button type="text" onClick={onClose} style={{ padding: '4px 8px' }}>取消</Button>
          <Button type="link" onClick={() => form.submit()} style={{ padding: '4px 8px' }}>创建</Button>
        </div>
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
          <Col span={8}>
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
          <Col span={8}>
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
          <Col span={8}>
            <Form.Item
              name="requirement_id"
              label="关联需求"
            >
              <Select
                placeholder="选择关联的需求（可选）"
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
          <Col span={8}>
            <Form.Item
              name="assignee_id"
              label="处理人"
            >
              <Select placeholder="选择处理人" allowClear>
                {/* 可以后续添加项目成员列表 */}
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
