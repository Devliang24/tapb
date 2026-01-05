import { Drawer, Form, Input, Button, Space, message, Descriptions, Tag } from 'antd';
import { useEffect, useState } from 'react';
import projectService from '../../services/projectService';

const ProjectFormDrawer = ({ visible, onClose, onSuccess, project }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const isEdit = !!project;

  useEffect(() => {
    if (visible && project) {
      form.setFieldsValue({
        name: project.name,
        key: project.key,
        description: project.description,
      });
    } else {
      form.resetFields();
    }
  }, [visible, project, form]);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      if (isEdit) {
        await projectService.updateProject(project.id, values);
        message.success('项目更新成功！');
      } else {
        await projectService.createProject(values);
        message.success('项目创建成功！');
      }
      form.resetFields();
      onSuccess();
      onClose();
    } catch (error) {
      message.error(error.response?.data?.detail || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      title={isEdit ? '编辑项目' : '新建项目'}
      open={visible}
      onClose={onClose}
      closable={false}
      width={500}
      extra={
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" onClick={() => form.submit()} loading={loading}>
            {isEdit ? '更新' : '新建'}
          </Button>
        </Space>
      }
    >
      {isEdit && project && (
        <Descriptions column={1} style={{ marginBottom: 24 }} size="small">
          <Descriptions.Item label="项目标识">
            <Tag color="blue">{project.key}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Bug 数量">{project.bug_seq}</Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {new Date(project.created_at).toLocaleString('zh-CN')}
          </Descriptions.Item>
        </Descriptions>
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Form.Item
          name="name"
          label="项目名称"
          rules={[{ required: true, message: '请输入项目名称' }]}
        >
          <Input placeholder="例如：电商系统" />
        </Form.Item>

        {!isEdit && (
          <Form.Item
            name="key"
            label="项目标识"
            rules={[
              { required: true, message: '请输入项目标识' },
              { pattern: /^[A-Z]+$/, message: '只能包含大写字母' },
              { min: 2, max: 10, message: '长度在2-10个字符之间' }
            ]}
            tooltip="用于生成 Bug 编号，例如 PROJ，创建后不可修改"
          >
            <Input 
              placeholder="例如：ECOM" 
              style={{ textTransform: 'uppercase' }}
            />
          </Form.Item>
        )}

        <Form.Item
          name="description"
          label="项目描述"
        >
          <Input.TextArea rows={4} placeholder="项目简介..." />
        </Form.Item>
      </Form>
    </Drawer>
  );
};

export default ProjectFormDrawer;
