import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import RequirementTree from '../../components/RequirementTree';
import RequirementList from '../../components/RequirementList';
import RequirementForm from '../../components/RequirementForm';
import RequirementDetail from '../../components/RequirementDetail';
import TaskDetail from '../../components/TaskDetail';
import BugDetail from '../../components/BugDetail';
import TestCaseDetail from '../../components/TestCaseDetail';
import './index.css';

const ProjectRequirements = () => {
  const { projectId } = useParams();
  const queryClient = useQueryClient();
  
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [viewingId, setViewingId] = useState(null);
  const [detailTaskId, setDetailTaskId] = useState(null);
  const [detailBugId, setDetailBugId] = useState(null);
  const [detailTestCaseId, setDetailTestCaseId] = useState(null);

  const handleCreateClick = () => {
    setEditingId(null);
    setFormOpen(true);
  };

  const handleRequirementClick = (req) => {
    setViewingId(req.id);
    setDetailOpen(true);
  };

  const handleReqEdit = (req) => {
    setDetailOpen(false);
    setViewingId(null);
    setEditingId(req.id);
    setFormOpen(true);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingId(null);
  };

  const handleDetailClose = () => {
    setDetailOpen(false);
    setViewingId(null);
  };

  const handleTaskClick = (task) => {
    setDetailTaskId(task.id);
  };

  const handleTaskUpdate = () => {
    queryClient.invalidateQueries(['requirements', parseInt(projectId)]);
  };

  const handleBugUpdate = () => {
    queryClient.invalidateQueries(['requirements', parseInt(projectId)]);
  };

  return (
    <div className="requirement-page">
      <div className="requirement-sidebar">
        <RequirementTree
          projectId={projectId}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
        />
      </div>
      <div className="requirement-main">
        <RequirementList
          projectId={parseInt(projectId)}
          categoryId={selectedCategoryId}
          onCreateClick={handleCreateClick}
          onRequirementClick={handleRequirementClick}
          onTaskClick={handleTaskClick}
          onBugClick={(bugId) => setDetailBugId(bugId)}
        />
      </div>

      <RequirementForm
        visible={formOpen}
        onClose={handleFormClose}
        projectId={parseInt(projectId)}
        requirementId={editingId}
        categoryId={selectedCategoryId}
      />

      <RequirementDetail
        requirementId={viewingId}
        visible={detailOpen}
        onClose={handleDetailClose}
        onEdit={handleReqEdit}
        onTaskClick={(taskId) => setDetailTaskId(taskId)}
        onBugClick={(bugId) => setDetailBugId(bugId)}
        onTestCaseClick={(caseId) => setDetailTestCaseId(caseId)}
      />

      <TaskDetail
        taskId={detailTaskId}
        visible={!!detailTaskId}
        onClose={() => setDetailTaskId(null)}
        onUpdate={handleTaskUpdate}
        onRequirementClick={(reqId) => { setDetailTaskId(null); setViewingId(reqId); setDetailOpen(true); }}
      />

      <BugDetail
        bugId={detailBugId}
        visible={!!detailBugId}
        onClose={() => setDetailBugId(null)}
        onUpdate={handleBugUpdate}
        projectId={parseInt(projectId)}
        onRequirementClick={(reqId) => { setDetailBugId(null); setViewingId(reqId); setDetailOpen(true); }}
        onTestCaseClick={(caseId) => setDetailTestCaseId(caseId)}
      />

      <TestCaseDetail
        testCaseId={detailTestCaseId}
        open={!!detailTestCaseId}
        onClose={() => setDetailTestCaseId(null)}
        projectId={parseInt(projectId)}
        onRequirementClick={(reqId) => { setDetailTestCaseId(null); setViewingId(reqId); setDetailOpen(true); }}
        onBugClick={(bugId) => setDetailBugId(bugId)}
      />
    </div>
  );
};

export default ProjectRequirements;
