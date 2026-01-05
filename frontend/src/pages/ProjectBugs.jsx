import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Button, Breadcrumb } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import BugList from '../components/BugList';
import BugForm from '../components/BugForm';
import BugDetail from '../components/BugDetail';
import projectService from '../services/projectService';

const { Title } = Typography;

const ProjectBugs = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [formVisible, setFormVisible] = useState(false);
  const [detailBugId, setDetailBugId] = useState(null);
  const queryClient = useQueryClient();

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectService.getProject(projectId),
  });

  const handleFormSuccess = () => {
    queryClient.invalidateQueries(['bugs', parseInt(projectId)]);
  };

  const handleBugUpdate = () => {
    queryClient.invalidateQueries(['bugs', parseInt(projectId)]);
  };

  return (
    <div>
      <Breadcrumb style={{ marginBottom: 6 }}>
        <Breadcrumb.Item>
          <a onClick={() => navigate('/projects')}>项目列表</a>
        </Breadcrumb.Item>
        <Breadcrumb.Item>{project?.name || '加载中...'}</Breadcrumb.Item>
        <Breadcrumb.Item>Bug 列表</Breadcrumb.Item>
      </Breadcrumb>

      <div style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 16 }}>
        <Button onClick={() => navigate('/projects')}>
          返回项目
        </Button>
        <Title level={2} style={{ margin: 0 }}>
          {project?.name} - Bug 管理
        </Title>
      </div>
      
      <BugList 
        projectId={parseInt(projectId)} 
        onCreateClick={() => setFormVisible(true)}
        onBugClick={(bugId) => setDetailBugId(bugId)}
      />
      
      <BugForm
        visible={formVisible}
        onClose={() => setFormVisible(false)}
        onSuccess={handleFormSuccess}
        projectId={parseInt(projectId)}
      />

      <BugDetail
        bugId={detailBugId}
        visible={!!detailBugId}
        onClose={() => setDetailBugId(null)}
        onUpdate={handleBugUpdate}
      />
    </div>
  );
};

export default ProjectBugs;
