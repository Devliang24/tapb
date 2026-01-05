import { Button, Empty } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import useAuthStore from '../stores/authStore';
import projectService from '../services/projectService';

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: projectService.getProjects,
    enabled: isAuthenticated,
  });

  // 如果已登录且有项目，自动跳转到第一个项目
  if (isAuthenticated && projects?.length > 0 && !isLoading) {
    const lastProjectId = localStorage.getItem('lastProjectId');
    const targetProject = projects.find(p => String(p.id) === lastProjectId) || projects[0];
    navigate(`/projects/${targetProject.id}/iterations`, { replace: true });
    return null;
  }

  // 未登录或没有项目时显示空状态
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: 'calc(100vh - 100px)' 
    }}>
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          isAuthenticated 
            ? "暂无空间，创建一个开始吧"
            : "请先登录以使用系统"
        }
      >
        {isAuthenticated && (
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            size="large"
            onClick={() => {
              // 触发 Layout 中的创建空间抽屉
              window.dispatchEvent(new CustomEvent('openCreateSpace'));
            }}
          >
            新建空间
          </Button>
        )}
      </Empty>
    </div>
  );
};

export default Home;
