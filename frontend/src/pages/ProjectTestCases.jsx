import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import TestCaseTree from '../components/TestCaseTree';
import TestCaseList from '../components/TestCaseList';
import TestCaseForm from '../components/TestCaseForm';
import TestCaseDetail from '../components/TestCaseDetail';
import testCaseService from '../services/testCaseService';
import './ProjectTestCases.css';

const ProjectTestCases = () => {
  const { projectId } = useParams();
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [viewingId, setViewingId] = useState(null);

  const handleCreateClick = () => {
    setEditingId(null);
    setFormOpen(true);
  };

  const handleTestCaseClick = (id) => {
    setViewingId(id);
    setDetailOpen(true);
  };

  // 编辑功能现在内置在 TestCaseDetail 组件中

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingId(null);
  };

  const handleDetailClose = () => {
    setDetailOpen(false);
    setViewingId(null);
  };

  // 获取测试用例列表用于上下切换
  const { data: testCaseData } = useQuery({
    queryKey: ['testcases', projectId, selectedCategoryId],
    queryFn: () => testCaseService.getTestCases({
      project_id: projectId,
      category_id: selectedCategoryId,
      page_size: 100,
    }),
    enabled: !!projectId,
  });

  const testCaseIds = useMemo(() => testCaseData?.items?.map(t => t.id) || [], [testCaseData]);
  const currentIndex = testCaseIds.indexOf(viewingId);

  return (
    <div className="testcase-page">
      <div className="testcase-sidebar">
        <TestCaseTree
          projectId={projectId}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
        />
      </div>
      <div className="testcase-main">
        <TestCaseList
          projectId={projectId}
          categoryId={selectedCategoryId}
          onCreateClick={handleCreateClick}
          onTestCaseClick={handleTestCaseClick}
        />
      </div>

      <TestCaseForm
        open={formOpen}
        onClose={handleFormClose}
        projectId={projectId}
        testCaseId={editingId}
        categoryId={selectedCategoryId}
      />

      <TestCaseDetail
        open={detailOpen}
        onClose={handleDetailClose}
        testCaseId={viewingId}
        projectId={projectId}
        onPrev={() => currentIndex > 0 && setViewingId(testCaseIds[currentIndex - 1])}
        onNext={() => currentIndex < testCaseIds.length - 1 && setViewingId(testCaseIds[currentIndex + 1])}
        hasPrev={currentIndex > 0}
        hasNext={currentIndex < testCaseIds.length - 1 && currentIndex >= 0}
      />
    </div>
  );
};

export default ProjectTestCases;
