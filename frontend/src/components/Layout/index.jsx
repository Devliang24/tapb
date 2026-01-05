import { useState, useEffect } from 'react';
import { Layout as AntLayout, Dropdown, Avatar, Tabs, Tooltip, Drawer, Form, Input, Button, Select, message } from 'antd';
import { 
  LogoutOutlined, 
  LoginOutlined,
  AppstoreOutlined,
  StarFilled,
  SettingOutlined,
  DownOutlined,
  PlusOutlined
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

  const isProjectDetail = location.pathname.match(/^\/projects\/\d+$/);
  const isIterationsPage = location.pathname.match(/^\/projects\/\d+\/iterations$/);
  const isRequirementsPage = location.pathname.match(/^\/projects\/\d+\/requirements$/);
  const isProjectSettings = location.pathname.match(/^\/projects\/\d+\/settings$/);
  const isTestCasesPage = location.pathname.match(/^\/projects\/\d+\/testcases$/);
  const isProjectPage = isProjectDetail || isIterationsPage || isRequirementsPage || isProjectSettings || isTestCasesPage;
  
  const searchParams = new URLSearchParams(location.search);
  const activeTab = isIterationsPage ? 'iterations' : isRequirementsPage ? 'requirements' : isTestCasesPage ? 'testcases' : (searchParams.get('tab') || 'iterations');

  const currentProjectId = location.pathname.match(/\/projects\/(\d+)/)?.[1];
  const currentProject = projects?.find(p => String(p.id) === currentProjectId);

  // 保存当前选择的空间到 localStorage
  useEffect(() => {
    if (currentProjectId) {
      localStorage.setItem('lastProjectId', currentProjectId);
    }
  }, [currentProjectId]);

  const handleSpaceMenuClick = () => {
    // 优先跳转到上次访问的空间
    const lastProjectId = localStorage.getItem('lastProjectId');
    if (lastProjectId && projects?.some(p => String(p.id) === lastProjectId)) {
      navigate(`/projects/${lastProjectId}/iterations`);
    } else if (projects?.length > 0) {
      // 没有上次访问记录，跳转到第一个空间
      navigate(`/projects/${projects[0].id}/iterations`);
    } else {
      // 没有空间，跳转到首页显示空状态
      navigate('/');
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
    } else if (key === 'requirements') {
      navigate(`/projects/${projectId}/requirements`);
    } else if (key === 'testcases') {
      navigate(`/projects/${projectId}/testcases`);
    } else {
      navigate(`/projects/${projectId}?tab=${key}`);
    }
  };

  const tabItems = [
    { key: 'iterations', label: '迭代' },
    { key: 'requirements', label: '需求' },
    { key: 'bugs', label: '缺陷' },
    { key: 'testcases', label: '测试用例' },
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

  // 监听打开创建空间抽屉的事件
  useEffect(() => {
    const handleOpenCreateSpace = () => setCreateSpaceVisible(true);
    window.addEventListener('openCreateSpace', handleOpenCreateSpace);
    return () => window.removeEventListener('openCreateSpace', handleOpenCreateSpace);
  }, []);

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
                items: [
                  ...(projects?.map((project, index) => ({
                    key: project.id,
                    label: (
                      <div className="dropdown-space-item">
                        <span className="dropdown-space-color" style={{ background: ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6'][index % 5] }} />
                        <span>{project.name}</span>
                        {currentProjectId === String(project.id) && <StarFilled style={{ color: '#faad14', marginLeft: 'auto' }} />}
                      </div>
                    ),
                    onClick: () => navigate(`/projects/${project.id}/iterations`),
                  })) || []),
                  { type: 'divider' },
                  {
                    key: 'create-space',
                    label: (
                      <div className="dropdown-space-item create-space-item">
                        <PlusOutlined />
                        <span>新建空间</span>
                      </div>
                    ),
                    onClick: () => setCreateSpaceVisible(true),
                  }
                ]
              }}
              trigger={['click']}
              placement="bottomLeft"
              overlayClassName="header-space-dropdown"
              align={{ offset: [-10, 0] }}
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
              className={`project-tabs ${isProjectSettings ? 'settings-mode' : ''}`}
              tabBarExtraContent={
                <div className="tab-extra-right">
                  <span 
                    className={`tab-extra-item ${isProjectSettings ? 'active' : ''}`}
                    onClick={() => navigate(`/projects/${currentProjectId}/settings`)}
                  >
                    设置
                  </span>
                </div>
              }
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
        title="新建空间"
        placement="right"
        open={createSpaceVisible}
        onClose={() => {
          setCreateSpaceVisible(false);
          createForm.resetFields();
        }}
        closable={false}
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
              新建
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
