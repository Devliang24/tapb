import { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from 'antd';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import projectService from '../services/projectService';
import SprintList from '../components/SprintList';
import SprintForm from '../components/SprintForm';
import RequirementList from '../components/RequirementList';
import RequirementForm from '../components/RequirementForm';
import RequirementDetail from '../components/RequirementDetail';
import BugList from '../components/BugList';
import BugForm from '../components/BugForm';
import BugDetail from '../components/BugDetail';

const ProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  
  const activeTab = searchParams.get('tab') || 'sprints';

  const [sprintFormVisible, setSprintFormVisible] = useState(false);
  const [editingSprint, setEditingSprint] = useState(null);

  const [reqFormVisible, setReqFormVisible] = useState(false);
  const [editingReq, setEditingReq] = useState(null);
  const [detailReqId, setDetailReqId] = useState(null);

  const [bugFormVisible, setBugFormVisible] = useState(false);
  const [detailBugId, setDetailBugId] = useState(null);

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectService.getProject(projectId),
  });

  const handleSprintClick = (sprint) => {
    setEditingSprint(sprint);
    setSprintFormVisible(true);
  };

  const handleReqClick = (req) => {
    setDetailReqId(req.id);
  };

  const handleReqEdit = (req) => {
    setDetailReqId(null);
    setEditingReq(req);
    setReqFormVisible(true);
  };

  const handleBugUpdate = () => {
    queryClient.invalidateQueries(['bugs', parseInt(projectId)]);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'sprints':
        return (
          <SprintList
            projectId={parseInt(projectId)}
            onCreateClick={() => {
              setEditingSprint(null);
              setSprintFormVisible(true);
            }}
            onSprintClick={handleSprintClick}
          />
        );
      case 'requirements':
        return (
          <RequirementList
            projectId={parseInt(projectId)}
            onCreateClick={() => {
              setEditingReq(null);
              setReqFormVisible(true);
            }}
            onRequirementClick={handleReqClick}
            onBugClick={(bugId) => setDetailBugId(bugId)}
          />
        );
      case 'bugs':
        return (
          <BugList
            projectId={parseInt(projectId)}
            onCreateClick={() => setBugFormVisible(true)}
            onBugClick={(bugId) => setDetailBugId(bugId)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <Card bodyStyle={{ padding: 0 }}>
        {renderContent()}
      </Card>

      <SprintForm
        visible={sprintFormVisible}
        onClose={() => {
          setSprintFormVisible(false);
          setEditingSprint(null);
        }}
        projectId={parseInt(projectId)}
        sprint={editingSprint}
      />

      <RequirementForm
        visible={reqFormVisible}
        onClose={() => {
          setReqFormVisible(false);
          setEditingReq(null);
        }}
        projectId={parseInt(projectId)}
        requirement={editingReq}
      />

      <RequirementDetail
        requirementId={detailReqId}
        visible={!!detailReqId}
        onClose={() => {
          setDetailReqId(null);
          setEditingReq(null);
        }}
        onEdit={handleReqEdit}
        requirement={typeof detailReqId === 'string' ? editingReq : null}
      />

      <BugForm
        visible={bugFormVisible}
        onClose={() => setBugFormVisible(false)}
        onSuccess={handleBugUpdate}
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

export default ProjectDetail;
