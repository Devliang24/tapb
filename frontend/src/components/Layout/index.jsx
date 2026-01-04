import { useState, useEffect } from 'react';
import { Layout as AntLayout, Dropdown, Avatar, Tabs, Tooltip, Drawer, Form, Input, Button, Select, message } from 'antd';
import { 
  LogoutOutlined, 
  LoginOutlined,
  AppstoreOutlined,
  StarFilled,
  SettingOutlined,
  DownOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useAuthStore from '../../stores/authStore';
import AuthModal from '../AuthModal';
import authService from '../../services/authService';
import projectService from '../../services/projectService';
import userService from '../../services/userService';
import './index.css';

const { Header, Sider, Content } = AntLayout;

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { isAuthenticated, user, logout, setAuth } = useAuthStore();
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [createSpaceVisible, setCreateSpaceVisible] = useState(false);
  const [spaceFilter, setSpaceFilter] = useState('recent');
  const [createForm] = Form.useForm();
  
  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: projectService.getProjects,
    enabled: isAuthenticated,
  });

  // 获取用户列表用于成员选择
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: userService.getUsers,
    enabled: isAuthenticated && createSpaceVisible,
  });

  // 创建空间
  const createSpaceMutation = useMutation({
    mutationFn: projectService.createProject,
    onSuccess: (newProject) => {
      message.success('空间创建成功');
      queryClient.invalidateQueries(['projects']);
      setCreateSpaceVisible(false);
      createForm.resetFields();
      navigate(`/projects/${newProject.id}/iterations`);
    },
    onError: (error) => {
      message.error(error.response?.data?.detail || '创建失败');
    }
  });

  const handleCreateSpace = async (values) => {
    createSpaceMutation.mutate(values);
  };

  const filteredProjects = projects?.filter(project => {
    if (spaceFilter === 'participated') {
      return !project.is_public;
    }
    return true;
  });

  const isProjectDetail = location.pathname.match(/^\/projects\/\d+$/);
  const isIterationsPage = location.pathname.match(/^\/projects\/\d+\/iterations$/);
  const isProjectPage = isProjectDetail || isIterationsPage;
  
  const searchParams = new URLSearchParams(location.search);
  const activeTab = isIterationsPage ? 'iterations' : (searchParams.get('tab') || 'iterations');

  const currentProjectId = location.pathname.match(/\/projects\/(\d+)/)?.[1];
  const currentProject = projects?.find(p => String(p.id) === currentProjectId);

  // 保存当前选择的空间到 localStorage
  useEffect(() => {
    if (currentProjectId) {
      localStorage.setItem('lastProjectId', currentProjectId);
    }
  }, [currentProjectId]);

  const handleSpaceMenuClick = () => {
    const lastProjectId = localStorage.getItem('lastProjectId');
    if (lastProjectId && projects?.some(p => String(p.id) === lastProjectId)) {
      navigate(`/projects/${lastProjectId}/iterations`);
    }
  };

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: logout,
    },
  ];


  const handleTabChange = (key) => {
    const projectId = location.pathname.match(/\/projects\/(\d+)/)?.[1];
    if (!projectId) return;
    
    if (key === 'iterations') {
      navigate(`/projects/${projectId}`);
    } else {
      navigate(`/projects/${projectId}?tab=${key}`);
    }
  };

  const tabItems = [
    { key: 'iterations', label: '迭代' },
    { key: 'requirements', label: '需求' },
    { key: 'bugs', label: '缺陷' },
  ];

  useEffect(() => {
    const initializeUser = async () => {
      const token = localStorage.getItem('token');
      if (token && !user) {
        try {
          const userInfo = await authService.getCurrentUser();
          setAuth(userInfo, token);
        } catch (error) {
          logout();
        }
      }
    };
    initializeUser();
  }, [user, setAuth, logout]);

  const spaceContent = (
    <div className="space-popover">
      <div className="space-popover-header">
        <span 
          className={`space-header-title ${spaceFilter === 'recent' ? 'active' : ''}`}
          onClick={() => setSpaceFilter('recent')}
        >
          最近访问空间
        </span>
        <span 
          className="space-header-action create-btn"
          onClick={() => setCreateSpaceVisible(true)}
        >
          + 创建
        </span>
        <span 
          className={`space-header-action ${spaceFilter === 'participated' ? 'active' : ''}`}
          onClick={() => setSpaceFilter('participated')}
        >
          我参与的
        </span>
      </div>
      <div className="space-list-full">
        {filteredProjects?.map((project, index) => (
          <div 
            key={project.id}
            className={`space-item ${currentProjectId === String(project.id) ? 'active' : ''}`}
            onClick={() => navigate(`/projects/${project.id}/iterations`)}
          >
            <span className="space-color-square" style={{ background: ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6'][index % 5] }} />
            <span className="space-name">{project.name}</span>
            {currentProjectId === String(project.id) && <StarFilled className="space-star active" />}
          </div>
        ))}
        {filteredProjects?.length === 0 && (
          <div className="space-empty">暂无空间</div>
        )}
      </div>
    </div>
  );

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <div className="light-sider">
        {/* Logo */}
        <div className="sider-logo" onClick={() => navigate('/')}>
          <span className="logo-text">T</span>
        </div>

        {/* Main Menu */}
        <div className="sider-menu">
          {isAuthenticated && (
            <div 
              className={`sider-menu-item ${currentProjectId ? 'active' : ''}`}
              onClick={handleSpaceMenuClick}
            >
              <AppstoreOutlined />
              <span className="menu-label">空间</span>
            </div>
          )}

          {isAuthenticated && (
            <Tooltip title="设置" placement="right">
              <div 
                className={`sider-menu-item ${location.pathname === '/settings' ? 'active' : ''}`}
                onClick={() => navigate('/settings')}
              >
                <SettingOutlined />
                <span className="menu-label">设置</span>
              </div>
            </Tooltip>
          )}
        </div>

        {/* User Section */}
        <div className="sider-footer">
          {isAuthenticated ? (
            <Dropdown menu={{ items: userMenuItems }} placement="topRight" trigger={['click']}>
              <div className="sider-user">
                <Avatar className="sider-avatar">
                  {user?.username?.charAt(0).toUpperCase()}
                </Avatar>
              </div>
            </Dropdown>
          ) : (
            <Tooltip title="登录" placement="right">
              <div className="sider-login-btn" onClick={() => setAuthModalVisible(true)}>
                <LoginOutlined />
              </div>
            </Tooltip>
          )}
        </div>
      </div>

      <AntLayout className="main-layout">
        {isProjectPage && (
          <Header className="project-header">
            <Dropdown
              menu={{
                items: projects?.map((project, index) => ({
                  key: project.id,
                  label: (
                    <div className="dropdown-space-item">
                      <span className="dropdown-space-color" style={{ background: ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6'][index % 5] }} />
                      <span>{project.name}</span>
                      {currentProjectId === String(project.id) && <StarFilled style={{ color: '#faad14', marginLeft: 'auto' }} />}
                    </div>
                  ),
                  onClick: () => navigate(`/projects/${project.id}/iterations`),
                })) || []
              }}
              trigger={['click']}
            >
              <div className="header-left space-dropdown-trigger">
                <span className="space-title">{currentProject?.name || '空间'}</span>
                <DownOutlined className="space-dropdown-icon" />
              </div>
            </Dropdown>
            <Tabs
              activeKey={activeTab}
              items={tabItems}
              onChange={handleTabChange}
              className="project-tabs"
            />
          </Header>
        )}

        <Content className="modern-content">
          <div className="content-container">
            {children}
          </div>
        </Content>
      </AntLayout>

      <AuthModal
        visible={authModalVisible}
        onClose={() => setAuthModalVisible(false)}
      />

      {/* 创建空间抽屉 */}
      <Drawer
        title="创建空间"
        placement="right"
        open={createSpaceVisible}
        onClose={() => {
          setCreateSpaceVisible(false);
          createForm.resetFields();
        }}
        width={400}
        styles={{ body: { paddingTop: 24 } }}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => {
              setCreateSpaceVisible(false);
              createForm.resetFields();
            }}>取消</Button>
            <Button 
              type="primary" 
              onClick={() => createForm.submit()}
              loading={createSpaceMutation.isPending}
            >
              创建
            </Button>
          </div>
        }
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreateSpace}
        >
          <Form.Item
            name="name"
            label="空间名称"
            rules={[{ required: true, message: '请输入空间名称' }]}
          >
            <Input placeholder="例如：我的项目" />
          </Form.Item>
          <Form.Item
            name="key"
            label="空间标识"
            rules={[
              { required: true, message: '请输入空间标识' },
              { pattern: /^[A-Za-z0-9]+$/, message: '只能包含字母和数字' },
              { max: 10, message: '最多10个字符' }
            ]}
          >
            <Input placeholder="例如：MYPROJ" style={{ textTransform: 'uppercase' }} />
          </Form.Item>
          <Form.Item
            name="description"
            label="描述"
          >
            <Input.TextArea rows={3} placeholder="空间描述（可选）" />
          </Form.Item>
          <Form.Item
            name="member_ids"
            label="空间成员"
          >
            <Select
              mode="multiple"
              placeholder="选择成员（可选）"
              optionFilterProp="label"
              options={users?.filter(u => u.id !== user?.id).map(u => ({
                value: u.id,
                label: u.username,
              }))}
            />
          </Form.Item>
        </Form>
      </Drawer>
    </AntLayout>
  );
};

export default Layout;
