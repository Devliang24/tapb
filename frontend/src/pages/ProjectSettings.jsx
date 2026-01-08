import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Table, Button, Select, Popconfirm, Form, message, Tabs, Input, Modal } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import projectService from '../services/projectService';
import userService from '../services/userService';
import './ProjectSettings.css';

const ProjectSettings = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const pid = parseInt(projectId);
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [projectForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState('members');

  const { data: project } = useQuery({
    queryKey: ['project', pid],
    queryFn: () => projectService.getProject(pid),
  });

  const { data: members, isLoading } = useQuery({
    queryKey: ['projectMembers', pid],
    queryFn: () => projectService.getProjectMembers(pid),
  });

  const [selectedKeys, setSelectedKeys] = useState([]);

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: userService.getUsers,
  });

  const addMutation = useMutation({
    mutationFn: async ({ user_ids, role }) => {
      const results = await Promise.allSettled(
        (user_ids || []).map((uid) => projectService.addProjectMember(pid, { user_id: uid, role }))
      );
      const success = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.length - success;
      return { success, failed };
    },
    onSuccess: ({ success, failed }) => {
      if (success > 0) message.success(`已添加 ${success} 人${failed ? `，失败 ${failed} 人` : ''}`);
      if (failed > 0) message.warning('部分用户添加失败，可能已在空间中');
      form.resetFields();
      queryClient.invalidateQueries(['projectMembers', pid]);
    },
    onError: (error) => message.error(error.response?.data?.detail || '添加失败'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ memberId, role }) => projectService.updateProjectMember(pid, memberId, { user_id: 0, role }),
    onSuccess: () => {
      message.success('角色已更新');
      queryClient.invalidateQueries(['projectMembers', pid]);
    },
    onError: (error) => message.error(error.response?.data?.detail || '更新失败'),
  });

  const removeMutation = useMutation({
    mutationFn: (memberId) => projectService.removeProjectMember(pid, memberId),
    onSuccess: () => {
      message.success('已移除');
      queryClient.invalidateQueries(['projectMembers', pid]);
    },
    onError: (error) => message.error(error.response?.data?.detail || '移除失败'),
  });

  const bulkRemoveMutation = useMutation({
    mutationFn: async (ids) => {
      const results = await Promise.allSettled(ids.map(id => projectService.removeProjectMember(pid, id)));
      const success = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.length - success;
      return { success, failed };
    },
    onSuccess: ({ success, failed }) => {
      if (success > 0) message.success(`批量移除成功 ${success} 人${failed ? `，失败 ${failed} 人` : ''}`);
      if (failed > 0) message.warning('部分成员未能移除（可能为所有者或已被移除）');
      setSelectedKeys([]);
      queryClient.invalidateQueries(['projectMembers', pid]);
    },
    onError: () => message.error('批量移除失败'),
  });

  const updateProjectMutation = useMutation({
    mutationFn: (data) => projectService.updateProject(pid, data),
    onSuccess: () => {
      message.success('空间信息已更新');
      queryClient.invalidateQueries(['project', pid]);
      queryClient.invalidateQueries(['projects']);
    },
    onError: (error) => message.error(error.response?.data?.detail || '更新失败'),
  });

  const deleteProjectMutation = useMutation({
    mutationFn: () => projectService.deleteProject(pid),
    onSuccess: () => {
      message.success('空间已删除');
      queryClient.invalidateQueries(['projects']);
      navigate('/');
    },
    onError: (error) => message.error(error.response?.data?.detail || '删除失败'),
  });

  const existingUserIds = new Set((members || []).map(m => m.user_id));
  const userOptions = (users || [])
    .filter(u => !existingUserIds.has(u.id))
    .map(u => ({ label: `${u.username} (${u.email})`, value: u.id }));

  const columns = [
    { title: '用户名', dataIndex: ['user','username'], key: 'username' },
    { title: '邮箱', dataIndex: ['user','email'], key: 'email' },
    { 
      title: '角色', dataIndex: 'role', key: 'role', width: 140,
      render: (role, record) => (
        <Select 
          size="small" 
          value={role}
          style={{ width: 120 }}
          options={[
            { value: 'owner', label: '所有者' },
            { value: 'member', label: '成员' },
          ]}
          onChange={(value) => updateMutation.mutate({ memberId: record.id, role: value })}
        />
      )
    },
    {
      title: '操作', key: 'action', width: 100,
      render: (_, record) => (
        <Popconfirm title="确定移除该成员？" onConfirm={() => removeMutation.mutate(record.id)}>
          <Button type="text" danger>移除</Button>
        </Popconfirm>
      )
    }
  ];

  const handleAdd = (values) => {
    addMutation.mutate(values);
  };

  const handleProjectUpdate = (values) => {
    updateProjectMutation.mutate(values);
  };

  const handleDeleteProject = () => {
    Modal.confirm({
      title: '删除空间',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>确定要删除空间 <strong>{project?.name}</strong> 吗？</p>
          <p style={{ color: '#ff4d4f' }}>此操作不可恢复，空间下的所有需求、任务、Bug、迭代等数据都将被删除。</p>
        </div>
      ),
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => deleteProjectMutation.mutate(),
    });
  };

  // 成员管理 Tab
  const renderMembersTab = () => (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Form form={form} layout="inline" className="project-settings-form" onFinish={handleAdd}>
          <Form.Item name="user_ids" className="member-select-item" rules={[{ required: true, message: '请选择用户' }]}>
            <Select 
              className="member-select"
              mode="multiple"
              showSearch 
              placeholder="选择用户（可多选）"
              maxTagCount="responsive"
              maxTagPlaceholder="..."
              options={userOptions}
              filterOption={(input, option) => (option?.label ?? '').includes(input)}
            />
          </Form.Item>
          <Form.Item name="role" initialValue="member" rules={[{ required: true }] }>
            <Select style={{ width: 100 }} options={[{value:'member', label:'成员'},{value:'owner', label:'所有者'}]} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={addMutation.isPending}>添加成员</Button>
          </Form.Item>
          {selectedKeys.length > 0 && (
            <>
              <span style={{ color: '#1677ff' }}>已选 {selectedKeys.length} 项</span>
              <Form.Item>
                <Popconfirm
                  title={`确定批量移除选中的 ${selectedKeys.length} 位成员？`}
                  onConfirm={() => bulkRemoveMutation.mutate(selectedKeys)}
                >
                  <Button danger loading={bulkRemoveMutation.isPending}>批量移除</Button>
                </Popconfirm>
              </Form.Item>
            </>
          )}
          <span style={{ color: '#999', marginLeft: 'auto' }}>只有加入成员才能访问该空间资源</span>
        </Form>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={members}
        loading={isLoading}
        pagination={false}
        rowSelection={{
          selectedRowKeys: selectedKeys,
          onChange: setSelectedKeys,
          getCheckboxProps: (record) => ({ disabled: record.role === 'owner' })
        }}
      />
    </div>
  );

  // 空间设置 Tab
  const renderProjectTab = () => (
    <div>
      <Form
        form={projectForm}
        layout="vertical"
        onFinish={handleProjectUpdate}
        initialValues={{
          name: project?.name,
          description: project?.description,
        }}
        key={project?.id}
        style={{ maxWidth: 500 }}
      >
        <Form.Item
          name="name"
          label="空间名称"
          rules={[{ required: true, message: '请输入空间名称' }]}
        >
          <Input placeholder="输入空间名称" />
        </Form.Item>
        <Form.Item name="description" label="空间描述">
          <Input.TextArea rows={4} placeholder="输入空间描述" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={updateProjectMutation.isPending}>
            保存修改
          </Button>
        </Form.Item>
      </Form>

      <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid #f0f0f0', maxWidth: 500 }}>
        <h4 style={{ color: '#ff4d4f', marginBottom: 16 }}>危险操作</h4>
        <Button danger onClick={handleDeleteProject} loading={deleteProjectMutation.isPending}>
          删除空间
        </Button>
        <p style={{ color: '#999', marginTop: 8, fontSize: 12 }}>
          删除后无法恢复，请谨慎操作
        </p>
      </div>
    </div>
  );

  const tabItems = [
    { key: 'members', label: '成员', children: renderMembersTab() },
    { key: 'project', label: '空间', children: renderProjectTab() },
  ];

  return (
    <div className="project-settings-page">
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
    </div>
  );
};

export default ProjectSettings;