import { Modal, Form, Input, message } from 'antd';
import { useEffect } from 'react';
import projectService from '../../services/projectService';

const ProjectFormModal = ({ visible, onClose, onSuccess, project }) => {
  const [form] = Form.useForm();
  const isEdit = !!project;

  useEffect(() => {
    if (visible && project) {
      form.setFieldsValue(project);
    } else {
      form.resetFields();
    }
  }, [visible, project, form]);

  const handleSubmit = async (values) => {
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
    }
  };

  return (
    <Modal
      title={isEdit ? '编辑项目' : '创建项目'}
      open={visible}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText={isEdit ? '更新' : '创建'}
      cancelText="取消"
    >
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

        <Form.Item
          name="key"
          label="项目标识"
          rules={[
            { required: true, message: '请输入项目标识' },
            { pattern: /^[A-Z]+$/, message: '只能包含大写字母' },
            { min: 2, max: 10, message: '长度在2-10个字符之间' }
          ]}
          tooltip="用于生成 Bug 编号，例如 PROJ"
        >
          <Input 
            placeholder="例如：ECOM" 
            disabled={isEdit}
            style={{ textTransform: 'uppercase' }}
          />
        </Form.Item>

        <Form.Item
          name="description"
          label="项目描述"
        >
          <Input.TextArea rows={4} placeholder="项目简介..." />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ProjectFormModal;
