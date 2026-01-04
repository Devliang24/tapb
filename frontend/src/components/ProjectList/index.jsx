import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Button, Typography, Tag, Empty, Modal, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, BugOutlined, UserOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import projectService from '../../services/projectService';
import ProjectFormModal from './ProjectFormModal';

const { Title, Paragraph } = Typography;
const { confirm } = Modal;

const ProjectList = () => {
  const navigate = useNavigate();
  const [formVisible, setFormVisible] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const queryClient = useQueryClient();

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: projectService.getProjects,
  });

  const deleteMutation = useMutation({
    mutationFn: projectService.deleteProject,
    onSuccess: () => {
      message.success('项目删除成功！');
      queryClient.invalidateQueries(['projects']);
    },
    onError: (error) => {
      message.error(error.response?.data?.detail || '删除失败');
    },
  });

  const handleCreate = () => {
    setEditingProject(null);
    setFormVisible(true);
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setFormVisible(true);
  };

  const handleDelete = (project) => {
    confirm({
      title: '确认删除',
      content: `确定要删除项目 "${project.name}" 吗？此操作不可恢复。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => deleteMutation.mutate(project.id),
    });
  };

  const handleFormSuccess = () => {
    queryClient.invalidateQueries(['projects']);
  };

  if (isLoading) {
    return <div>加载中...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2}>项目列表</Title>
        <Button type="primary" onClick={handleCreate}>
          创建项目
        </Button>
      </div>

      {!projects || projects.length === 0 ? (
        <Empty
          description="还没有项目，创建一个开始吧"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Button type="primary" onClick={handleCreate}>创建项目</Button>
        </Empty>
      ) : (
        <Row gutter={[16, 16]}>
          {projects.map((project) => (
            <Col xs={24} sm={12} lg={8} xl={6} key={project.id}>
              <Card
                hoverable
                onClick={() => navigate(`/projects/${project.id}`)}
                actions={[
                  <EditOutlined key="edit" onClick={(e) => { e.stopPropagation(); handleEdit(project); }} />,
                  <DeleteOutlined key="delete" onClick={(e) => { e.stopPropagation(); handleDelete(project); }} />,
                ]}
              >
                <Card.Meta
                  title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{project.name}</span>
                      <Tag color="blue">{project.key}</Tag>
                    </div>
                  }
                  description={
                    <div>
                      <Paragraph ellipsis={{ rows: 2 }} style={{ minHeight: 44 }}>
                        {project.description || '暂无描述'}
                      </Paragraph>
                      <div style={{ marginTop: 12, display: 'flex', gap: 16 }}>
                        <span>
                          <BugOutlined /> {project.bug_seq} bugs
                        </span>
                        <span>
                          <UserOutlined /> {project.creator_id}
                        </span>
                      </div>
                    </div>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <ProjectFormModal
        visible={formVisible}
        onClose={() => setFormVisible(false)}
        onSuccess={handleFormSuccess}
        project={editingProject}
      />
    </div>
  );
};

export default ProjectList;
