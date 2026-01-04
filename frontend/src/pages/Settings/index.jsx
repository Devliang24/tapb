import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Tabs, Table, Tag, Button, Modal, Form, Input, Select, message, Popconfirm } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import userService from '../../services/userService';
import useAuthStore from '../../stores/authStore';
import './index.css';

const Settings = () => {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [form] = Form.useForm();

  // 获取所有用户
  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: userService.getUsers,
  });

  // 创建用户
  const createUserMutation = useMutation({
    mutationFn: userService.createUser,
    onSuccess: () => {
      message.success('用户创建成功');
      queryClient.invalidateQueries(['users']);
      setCreateModalVisible(false);
      form.resetFields();
    },
    onError: (error) => {
      message.error(error.response?.data?.detail || '创建失败');
    }
  });

  // 删除用户
  const deleteUserMutation = useMutation({
    mutationFn: userService.deleteUser,
    onSuccess: () => {
      message.success('用户已删除');
      queryClient.invalidateQueries(['users']);
    },
    onError: (error) => {
      message.error(error.response?.data?.detail || '删除失败');
    }
  });

  const handleCreateUser = (values) => {
    createUserMutation.mutate(values);
  };

  const columns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role) => {
        const roleMap = {
          admin: { color: 'red', label: '管理员' },
          project_manager: { color: 'blue', label: '项目经理' },
          developer: { color: 'green', label: '开发者' },
          tester: { color: 'orange', label: '测试人员' },
        };
        const config = roleMap[role] || { color: 'default', label: role };
        return <Tag color={config.color}>{config.label}</Tag>;
      }
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text) => new Date(text).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => {
        if (record.id === currentUser?.id) {
          return <span style={{ color: '#999' }}>当前用户</span>;
        }
        return (
          <Popconfirm
            title="确定要删除该用户吗？"
            onConfirm={() => deleteUserMutation.mutate(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="text" danger>删除</Button>
          </Popconfirm>
        );
      }
    },
  ];

  const tabItems = [
    {
      key: 'members',
      label: '成员',
      children: (
        <div className="members-tab">
          <div className="members-header">
            <span className="members-count">共 {users?.length || 0} 位成员</span>
            <Button 
              type="primary" 
              onClick={() => setCreateModalVisible(true)}
            >
              新建用户
            </Button>
          </div>
          <Table
            columns={columns}
            dataSource={users}
            rowKey="id"
            loading={isLoading}
            pagination={{ pageSize: 10 }}
          />
        </div>
      )
    },
  ];

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h2>系统设置</h2>
      </div>
      <Card>
        <Tabs items={tabItems} />
      </Card>

      <Modal
        title="新建用户"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={createUserMutation.isPending}
        okText="创建"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateUser}
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item
            name="password"
            label="密码"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6位' }
            ]}
          >
            <Input.Password placeholder="请输入密码" />
          </Form.Item>
          <Form.Item
            name="role"
            label="角色"
            initialValue="developer"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select
              options={[
                { value: 'admin', label: '管理员' },
                { value: 'project_manager', label: '项目经理' },
                { value: 'developer', label: '开发者' },
                { value: 'tester', label: '测试人员' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Settings;
