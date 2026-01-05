import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Button, Empty, Spin } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import sprintService from '../services/sprintService';
import SprintCard from '../components/SprintCard';
import RequirementList from '../components/RequirementList';
import RequirementForm from '../components/RequirementForm';
import RequirementDetail from '../components/RequirementDetail';
import TaskDetail from '../components/TaskDetail';
import BugDetail from '../components/BugDetail';
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
  const [sprintFormVisible, setSprintFormVisible] = useState(false);
  const [editingSprint, setEditingSprint] = useState(null);
  const [bugFormVisible, setBugFormVisible] = useState(false);

  const { data: sprintData, isLoading } = useQuery({
    queryKey: ['sprints', projectId],
    queryFn: () => sprintService.getSprints(parseInt(projectId)),
  });

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
    setDetailReqId(req.id);
  };

  const handleReqEdit = (req) => {
    setDetailReqId(null);
    setEditingReq(req);
    setReqFormVisible(true);
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
          onBugClick={(bugId) => setDetailBugId(bugId)}
        />
      );
    }

    if (activeTab === 'bugs') {
      return (
        <BugList
          projectId={parseInt(projectId)}
          onCreateClick={() => setBugFormVisible(true)}
          onBugClick={(bugId) => setDetailBugId(bugId)}
        />
      );
    }

    // 默认显示迭代看板
    return (
      <div className="iterations-container">
        {/* 左侧：迭代列表 */}
        <div className="iterations-sidebar">
          <div className="sidebar-header">
            <Button 
              type="primary" 
              onClick={() => {
                setEditingSprint(null);
                setSprintFormVisible(true);
              }}
            >
              新建
            </Button>
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
              onBugClick={(bugId) => setDetailBugId(bugId)}
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
      />
    </div>
  );
};

export default SprintIterations;
