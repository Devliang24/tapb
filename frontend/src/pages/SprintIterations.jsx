import { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Button, Empty, Spin } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import requirementService from '../services/requirementService';
import bugService from '../services/bugService';
import sprintService from '../services/sprintService';
import testCaseService from '../services/testCaseService';
import SprintCard from '../components/SprintCard';
import RequirementList from '../components/RequirementList';
import RequirementForm from '../components/RequirementForm';
import RequirementDetail from '../components/RequirementDetail';
import TaskDetail from '../components/TaskDetail';
import BugDetail from '../components/BugDetail';
import TestCaseDetail from '../components/TestCaseDetail';
import BugList from '../components/BugList';
import BugForm from '../components/BugForm';
import SprintForm from '../components/SprintForm';
import './SprintIterations.css';

const SprintIterations = () => {
  const { projectId } = useParams();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'iterations';
  const queryClient = useQueryClient();
  const [selectedSprintId, setSelectedSprintId] = useState(null);
  const [reqFormVisible, setReqFormVisible] = useState(false);
  const [editingReq, setEditingReq] = useState(null);
  const [detailReqId, setDetailReqId] = useState(null);
  const [detailTaskId, setDetailTaskId] = useState(null);
  const [detailBugId, setDetailBugId] = useState(null);
  const [detailTestCaseId, setDetailTestCaseId] = useState(null);
  const [sprintFormVisible, setSprintFormVisible] = useState(false);
  const [editingSprint, setEditingSprint] = useState(null);
  const [bugFormVisible, setBugFormVisible] = useState(false);

  const { data: sprintData, isLoading } = useQuery({
    queryKey: ['sprints', projectId],
    queryFn: () => sprintService.getSprints(parseInt(projectId)),
  });

  // 获取需求列表用于上下切换
  const { data: reqData } = useQuery({
    queryKey: ['requirements', parseInt(projectId), selectedSprintId],
    queryFn: () => requirementService.getRequirements(parseInt(projectId), { 
      sprint_id: activeTab === 'iterations' ? selectedSprintId : undefined,
      page_size: 100 
    }),
    enabled: !!projectId,
  });

  // 获取缺陷列表用于上下切换
  const { data: bugData } = useQuery({
    queryKey: ['bugs', parseInt(projectId)],
    queryFn: () => bugService.getBugs({ project_id: parseInt(projectId), page_size: 100 }),
    enabled: !!projectId && activeTab === 'bugs',
  });

  // 需求列表 ID 数组
  const reqIds = useMemo(() => reqData?.items?.map(r => r.id) || [], [reqData]);
  const currentReqIndex = reqIds.indexOf(detailReqId);

  // 缺陷列表 ID 数组
  const bugIds = useMemo(() => bugData?.items?.map(b => b.id) || [], [bugData]);
  const currentBugIndex = bugIds.indexOf(detailBugId);

  // 获取当前需求的测试用例列表用于上下切换
  const { data: testCaseData } = useQuery({
    queryKey: ['requirementTestCases', detailReqId],
    queryFn: () => testCaseService.getTestCases({ requirement_id: detailReqId }),
    enabled: !!detailReqId,
  });

  const testCaseIds = useMemo(() => testCaseData?.items?.map(t => t.id) || [], [testCaseData]);
  const currentTestCaseIndex = testCaseIds.indexOf(detailTestCaseId);

  // 默认选择进行中的迭代
  useEffect(() => {
    if (sprintData?.items?.length > 0 && !selectedSprintId) {
      // 找到进行中的迭代
      const inProgressSprint = sprintData.items.find(s => s.status === 'in_progress');
      if (inProgressSprint) {
        setSelectedSprintId(inProgressSprint.id);
      } else {
        // 如果没有进行中的，选择第一个
        setSelectedSprintId(sprintData.items[0].id);
      }
    }
  }, [sprintData, selectedSprintId]);

  const handleSprintClick = (sprint) => {
    setSelectedSprintId(sprint.id);
  };

  const handleSprintEdit = (sprint) => {
    setEditingSprint(sprint);
    setSprintFormVisible(true);
  };

  const handleReqClick = (req) => {
    // 关闭其他类型的抽屉，切换到需求详情
    setDetailTaskId(null);
    setDetailBugId(null);
    setDetailReqId(req.id);
  };

  const handleReqEdit = (req) => {
    setDetailReqId(null);
    setEditingReq(req);
    setReqFormVisible(true);
  };

  const handleTaskClick = (task) => {
    // 关闭其他类型的抽屉，切换到任务详情
    setDetailReqId(null);
    setDetailBugId(null);
    setDetailTaskId(task.id);
  };

  const handleTaskUpdate = () => {
    queryClient.invalidateQueries(['requirements', parseInt(projectId)]);
  };

  const handleBugClick = (bugId) => {
    // 关闭其他类型的抽屉，切换到 Bug 详情
    setDetailReqId(null);
    setDetailTaskId(null);
    setDetailBugId(bugId);
  };

  const handleBugUpdate = () => {
    queryClient.invalidateQueries(['requirements', parseInt(projectId)]);
  };

  // 根据 activeTab 渲染不同的内容
  const renderContent = () => {
    if (activeTab === 'requirements') {
      return (
        <RequirementList
          projectId={parseInt(projectId)}
          onCreateClick={() => {
            setEditingReq(null);
            setReqFormVisible(true);
          }}
          onRequirementClick={handleReqClick}
          onTaskClick={handleTaskClick}
          onBugClick={handleBugClick}
        />
      );
    }

    if (activeTab === 'bugs') {
      return (
        <BugList
          projectId={parseInt(projectId)}
          onCreateClick={() => setBugFormVisible(true)}
          onBugClick={handleBugClick}
        />
      );
    }

    // 默认显示迭代看板
    return (
      <div className="iterations-container">
        {/* 左侧：迭代列表 */}
        <div className="iterations-sidebar">
          <div className="sidebar-header">
            <span className="sidebar-title">迭代列表</span>
            <PlusOutlined
              className="sidebar-add-btn"
              onClick={() => {
                setEditingSprint(null);
                setSprintFormVisible(true);
              }}
            />
          </div>
          <div className="sidebar-content">
            {isLoading ? (
              <div className="sidebar-loading">
                <Spin />
              </div>
            ) : sprintData?.items?.length > 0 ? (
              sprintData.items.map((sprint) => (
                <SprintCard
                  key={sprint.id}
                  sprint={sprint}
                  selected={selectedSprintId === sprint.id}
                  onClick={handleSprintClick}
                  onEdit={handleSprintEdit}
                />
              ))
            ) : (
              <Empty description="暂无迭代" />
            )}
          </div>
        </div>


        {/* 右侧：需求列表 */}
        <div className="iterations-main">
          {selectedSprintId ? (
            <RequirementList
              projectId={parseInt(projectId)}
              sprintId={selectedSprintId}
              sprintName={sprintData?.items?.find(s => s.id === selectedSprintId)?.name}
              onCreateClick={() => {
                setEditingReq(null);
                setReqFormVisible(true);
              }}
              onRequirementClick={handleReqClick}
              onTaskClick={handleTaskClick}
              onBugClick={handleBugClick}
            />
          ) : (
            <div className="iterations-empty">
              <Empty 
                description="请从左侧选择一个迭代查看其需求列表"
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ height: 'calc(100vh - 112px)', display: 'flex', flexDirection: 'column' }}>
      {renderContent()}

      {/* 模态框 */}
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
        onTaskClick={(taskId) => {
          setDetailReqId(null);
          setDetailBugId(null);
          setDetailTaskId(taskId);
        }}
        onBugClick={(bugId) => {
          setDetailReqId(null);
          setDetailTaskId(null);
          setDetailTestCaseId(null);
          setDetailBugId(bugId);
        }}
        onTestCaseClick={(testCaseId) => {
          setDetailReqId(null);
          setDetailTaskId(null);
          setDetailBugId(null);
          setDetailTestCaseId(testCaseId);
        }}
        onPrev={() => currentReqIndex > 0 && setDetailReqId(reqIds[currentReqIndex - 1])}
        onNext={() => currentReqIndex < reqIds.length - 1 && setDetailReqId(reqIds[currentReqIndex + 1])}
        hasPrev={currentReqIndex > 0}
        hasNext={currentReqIndex < reqIds.length - 1 && currentReqIndex >= 0}
      />

      <BugForm
        visible={bugFormVisible}
        onClose={() => setBugFormVisible(false)}
        onSuccess={handleBugUpdate}
        projectId={parseInt(projectId)}
      />

      <TaskDetail
        taskId={detailTaskId}
        visible={!!detailTaskId}
        onClose={() => setDetailTaskId(null)}
        onUpdate={handleTaskUpdate}
      />

      <BugDetail
        bugId={detailBugId}
        visible={!!detailBugId}
        onClose={() => setDetailBugId(null)}
        onUpdate={handleBugUpdate}
        projectId={parseInt(projectId)}
        onPrev={() => currentBugIndex > 0 && setDetailBugId(bugIds[currentBugIndex - 1])}
        onNext={() => currentBugIndex < bugIds.length - 1 && setDetailBugId(bugIds[currentBugIndex + 1])}
        hasPrev={currentBugIndex > 0}
        hasNext={currentBugIndex < bugIds.length - 1 && currentBugIndex >= 0}
      />

      <TestCaseDetail
        testCaseId={detailTestCaseId}
        open={!!detailTestCaseId}
        onClose={() => setDetailTestCaseId(null)}
        projectId={parseInt(projectId)}
        onPrev={() => currentTestCaseIndex > 0 && setDetailTestCaseId(testCaseIds[currentTestCaseIndex - 1])}
        onNext={() => currentTestCaseIndex < testCaseIds.length - 1 && setDetailTestCaseId(testCaseIds[currentTestCaseIndex + 1])}
        hasPrev={currentTestCaseIndex > 0}
        hasNext={currentTestCaseIndex < testCaseIds.length - 1 && currentTestCaseIndex >= 0}
      />
    </div>
  );
};

export default SprintIterations;
