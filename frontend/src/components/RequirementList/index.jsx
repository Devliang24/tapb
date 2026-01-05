import { useState } from 'react';
import { Table, Button, Tag, Space, Select, message, Modal, Dropdown, Input } from 'antd';
import { 
  PlusOutlined, 
  CaretDownOutlined, 
  CaretRightOutlined,
  EllipsisOutlined,
  SearchOutlined,
  LinkOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import requirementService from '../../services/requirementService';
// import bugService from '../../services/bugService'; // 待后续 Bug 删除功能启用
import taskService from '../../services/taskService';
import projectService from '../../services/projectService';
import TaskForm from '../TaskForm';
import BugForm from '../BugForm';
import LinkRequirementsDrawer from '../LinkRequirementsDrawer';
import './index.css';

const { confirm } = Modal;

const statusColors = {
  draft: 'default',
  approved: 'blue',
  in_progress: 'purple',
  completed: 'green',
  cancelled: 'red',
  DRAFT: 'default',
  APPROVED: 'blue',
  IN_PROGRESS: 'purple',
  COMPLETED: 'green',
  CANCELLED: 'red',
};

const statusLabels = {
  draft: '草稿',
  approved: '已批准',
  in_progress: '进行中',
  completed: '已完成',
  cancelled: '已取消',
  DRAFT: '草稿',
  APPROVED: '已批准',
  IN_PROGRESS: '进行中',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
};

const priorityColors = {
  high: 'green',
  medium: 'blue',
  low: 'default',
  HIGH: 'green',
  MEDIUM: 'blue',
  LOW: 'default',
};

const priorityLabels = {
  high: 'High',
  medium: 'Middle',
  low: 'Low',
  HIGH: 'High',
  MEDIUM: 'Middle',
  LOW: 'Low',
};

const bugStatusColors = {
  new: 'blue',
  confirmed: 'orange',
  in_progress: 'purple',
  resolved: 'green',
  closed: 'default',
  reopened: 'red',
  NEW: 'blue',
  CONFIRMED: 'orange',
  IN_PROGRESS: 'purple',
  RESOLVED: 'green',
  CLOSED: 'default',
  REOPENED: 'red',
};

const bugPriorityColors = {
  critical: 'red',
  high: 'orange',
  medium: 'blue',
  low: 'default',
  CRITICAL: 'red',
  HIGH: 'orange',
  MEDIUM: 'blue',
  LOW: 'default',
};

const taskStatusColors = {
  todo: 'default',
  in_progress: 'processing',
  done: 'success',
  TODO: 'default',
  IN_PROGRESS: 'processing',
  DONE: 'success',
};

const taskStatusLabels = {
  todo: '待处理',
  in_progress: '进行中',
  done: '已完成',
  TODO: '待处理',
  IN_PROGRESS: '进行中',
  DONE: '已完成',
};

const RequirementList = ({ 
  projectId, 
  sprintId, 
  sprintName, 
  categoryId,
  onCreateClick, 
  onRequirementClick, 
  onTaskClick, 
  onBugClick, 
  hideCreateButton = false,
  showQuickCreate = false,
}) => {
  const [filters, setFilters] = useState({});
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [taskFormVisible, setTaskFormVisible] = useState(false);
  const [bugFormVisible, setBugFormVisible] = useState(false);
  const [linkDrawerVisible, setLinkDrawerVisible] = useState(false);
  const [selectedStory, setSelectedStory] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [quickCreateTitle, setQuickCreateTitle] = useState('');
  const queryClient = useQueryClient();

  const statusMenuItems = [
    { key: 'approved', label: '已批准' },
    { key: 'in_progress', label: '进行中' },
    { key: 'completed', label: '已完成' },
    { key: 'cancelled', label: '已取消' },
  ];

  // 获取空间成员
  const { data: members } = useQuery({
    queryKey: ['projectMembers', projectId],
    queryFn: () => projectService.getProjectMembers(projectId),
    enabled: !!projectId,
  });

  const { data: reqData, isLoading } = useQuery({
    queryKey: ['requirements', projectId, sprintId, categoryId, filters, search, page],
    queryFn: () => requirementService.getRequirements(projectId, { 
      ...filters, 
      sprint_id: sprintId,
      category_id: categoryId,
      search: search || undefined,
      page 
    }),
  });

  const deleteMutation = useMutation({
    mutationFn: requirementService.deleteRequirement,
    onSuccess: () => {
      message.success('删除成功！');
      queryClient.invalidateQueries(['requirements', projectId]);
    },
    onError: (error) => {
      message.error(error.response?.data?.detail || '删除失败');
    },
  });

  const handleDelete = (req) => {
    confirm({
      title: '确认删除',
      content: `确定删除需求 "${req.requirement_number}" 吗？关联的Bug将取消关联。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => deleteMutation.mutate(req.id),
    });
  };

  // bugDeleteMutation 待后续支持 Bug 删除功能后启用
  // const bugDeleteMutation = useMutation({
  //   mutationFn: bugService.deleteBug,
  //   onSuccess: () => {
  //     message.success('Bug 删除成功！');
  //     queryClient.invalidateQueries(['requirements', projectId]);
  //   },
  //   onError: (error) => {
  //     message.error(error.response?.data?.detail || 'Bug 删除失败');
  //   },
  // });

  const bulkDeleteMutation = useMutation({
    mutationFn: requirementService.bulkDeleteRequirements,
    onSuccess: () => {
      message.success('批量删除成功！');
      setSelectedRowKeys([]);
      queryClient.invalidateQueries(['requirements', projectId]);
    },
    onError: (error) => {
      message.error(error.response?.data?.detail || '批量删除失败');
    },
  });

  const handleBulkDelete = () => {
    const selectedIds = selectedRowKeys
      .filter(key => key.startsWith('story-'))
      .map(key => parseInt(key.replace('story-', '')));
    
    if (selectedIds.length === 0) {
      message.warning('请先选择要删除的需求');
      return;
    }

    confirm({
      title: '确认批量删除',
      content: `确定删除选中的 ${selectedIds.length} 个需求吗？关联的 Bug 将取消关联。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => bulkDeleteMutation.mutate(selectedIds),
    });
  };

  const bulkStatusMutation = useMutation({
    mutationFn: ({ ids, status }) => requirementService.bulkUpdateStatus(ids, status),
    onSuccess: () => {
      message.success('批量更新状态成功！');
      setSelectedRowKeys([]);
      queryClient.invalidateQueries(['requirements', projectId]);
    },
    onError: (error) => {
      message.error(error.response?.data?.detail || '批量更新状态失败');
    },
  });

  const handleBulkStatusChange = (status) => {
    const selectedIds = selectedRowKeys
      .filter(key => key.startsWith('story-'))
      .map(key => parseInt(key.replace('story-', '')));
    
    if (selectedIds.length === 0) {
      message.warning('请先选择要更新状态的需求');
      return;
    }

    bulkStatusMutation.mutate({ ids: selectedIds, status });
  };

  const updateRequirementMutation = useMutation({
    mutationFn: ({ id, data }) => requirementService.updateRequirement(id, data),
    onSuccess: () => {
      message.success('状态更新成功！');
      queryClient.invalidateQueries(['requirements', projectId]);
    },
    onError: (error) => {
      message.error(error.response?.data?.detail || '状态更新失败');
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }) => taskService.updateTask(id, data),
    onSuccess: () => {
      message.success('状态更新成功！');
      queryClient.invalidateQueries(['requirements', projectId]);
    },
    onError: (error) => {
      message.error(error.response?.data?.detail || '状态更新失败');
    },
  });

  const handleStatusChange = (id, status, type) => {
    if (type === 'story') {
      updateRequirementMutation.mutate({ id, data: { status } });
    } else if (type === 'task') {
      updateTaskMutation.mutate({ id, data: { status } });
    }
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
    checkStrictly: false,
    columnWidth: 32,
  };

  const toggleExpand = (key) => {
    setExpandedRowKeys(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleBugSuccess = () => {
    queryClient.invalidateQueries(['requirements', projectId]);
  };

  // 快速创建需求
  const quickCreateMutation = useMutation({
    mutationFn: (title) => requirementService.createRequirement(projectId, { 
      title,
      priority: 'medium',
      status: 'draft',
      sprint_id: sprintId || undefined
    }),
    onSuccess: () => {
      message.success('需求创建成功！');
      setQuickCreateTitle('');
      queryClient.invalidateQueries(['requirements', projectId]);
    },
    onError: (error) => {
      message.error(error.response?.data?.detail || '创建失败');
    },
  });

  const handleQuickCreate = () => {
    if (!quickCreateTitle.trim()) return;
    quickCreateMutation.mutate(quickCreateTitle.trim());
  };

  const treeData = reqData?.items?.map(req => {
    if (!sprintId) {
      return {
        key: `story-${req.id}`,
        type: 'story',
        id: req.id,
        number: req.requirement_number,
        title: req.title,
        status: req.status,
        priority: req.priority,
        assignee: req.assignee,
        start_date: req.start_date,
        end_date: req.end_date,
        created_at: req.created_at,
        tasks_count: 0,
        bugs_count: 0,
        children_count: 0,
        children: undefined,
      };
    }

    const taskChildren = (req.tasks || []).map(task => {
      const taskBugChildren = (task.bugs || []).map(bug => ({
        key: `task-bug-${bug.id}`,
        type: 'bug',
        id: bug.id,
        number: bug.bug_number,
        title: bug.title,
        status: bug.status,
        priority: bug.priority,
        assignee: bug.assignee,
        created_at: bug.created_at,
      }));

      return {
        key: `task-${task.id}`,
        type: 'task',
        id: task.id,
        requirement_id: req.id,
        number: task.task_number,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        assignee: task.assignee,
        start_date: task.start_date,
        end_date: task.end_date,
        created_at: task.created_at,
        children_count: taskBugChildren.length,
        children: taskBugChildren.length > 0 ? taskBugChildren : undefined,
      };
    });

    const storyBugChildren = (req.bugs || []).map(bug => ({
      key: `story-bug-${bug.id}`,
      type: 'bug',
      id: bug.id,
      number: bug.bug_number,
      title: bug.title,
      status: bug.status,
      priority: bug.priority,
      assignee: bug.assignee,
      created_at: bug.created_at,
    }));

    const allChildren = [...taskChildren, ...storyBugChildren];

    return {
      key: `story-${req.id}`,
      type: 'story',
      id: req.id,
      number: req.requirement_number,
      title: req.title,
      status: req.status,
      priority: req.priority,
      assignee: req.assignee,
      start_date: req.start_date,
      end_date: req.end_date,
      created_at: req.created_at,
      tasks_count: taskChildren.length,
      bugs_count: storyBugChildren.length,
      children_count: allChildren.length,
      children: allChildren.length > 0 ? allChildren : undefined,
    };
  }) || [];

  // 展开/收起所有
  const getAllExpandableKeys = () => {
    const keys = [];
    treeData.forEach(item => {
      if (item.children && item.children.length > 0) {
        keys.push(item.key);
        item.children.forEach(child => {
          if (child.children && child.children.length > 0) {
            keys.push(child.key);
          }
        });
      }
    });
    return keys;
  };

  const toggleExpandAll = () => {
    const allKeys = getAllExpandableKeys();
    if (expandedRowKeys.length >= allKeys.length) {
      setExpandedRowKeys([]);
    } else {
      setExpandedRowKeys(allKeys);
    }
  };

  const isAllExpanded = expandedRowKeys.length > 0 && expandedRowKeys.length >= getAllExpandableKeys().length;

  const columns = [
    // 操作列（独立三点）
    {
      title: '',
      key: 'actions',
      width: sprintId ? 24 : 24,
      className: 'action-col',
      render: (_, record) => {
        if (record.type !== 'story') return null;
        const items = sprintId ? [
          {
            key: 'add-task',
            label: '添加任务',
            onClick: () => {
              setSelectedStory(record);
              setTaskFormVisible(true);
            },
          },
          {
            key: 'add-bug',
            label: '新建 Bug',
            onClick: () => {
              setSelectedStory(record);
              setBugFormVisible(true);
            },
          },
          {
            key: 'delete',
            label: '删除',
            danger: true,
            onClick: () => handleDelete(record),
          },
        ] : [
          {
            key: 'delete',
            label: '删除',
            danger: true,
            onClick: () => handleDelete(record),
          },
        ];
        return (
          <Dropdown menu={{ items }} trigger={['click']}>
            <Button
              type="text"
              size="small"
              className="action-dot"
              icon={<EllipsisOutlined rotate={90} />}
              onClick={(e) => e.stopPropagation()}
            />
          </Dropdown>
        );
      },
    },
    {
      title: sprintId ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {isAllExpanded ? (
            <CaretDownOutlined 
              style={{ cursor: 'pointer', color: '#8c8c8c' }}
              onClick={toggleExpandAll}
            />
          ) : (
            <CaretRightOutlined 
              style={{ cursor: 'pointer', color: '#8c8c8c' }}
              onClick={toggleExpandAll}
            />
          )}
          <span>标题</span>
        </div>
      ) : '标题',
      key: 'title',
      className: 'title-col',
      ellipsis: true,
      render: (_, record) => {
        if (record.type === 'story') {
          const hasChildren = record.children && record.children.length > 0;
          const isExpanded = expandedRowKeys.includes(record.key);
          return (
            <div className="title-cell">
              {sprintId ? (
                hasChildren ? (
                  isExpanded ? (
                    <CaretDownOutlined 
                      rotate={90}
                      className="expand-icon-inline"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(record.key);
                      }}
                    />
                  ) : (
                    <CaretRightOutlined 
                      rotate={90}
                      className="expand-icon-inline"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(record.key);
                      }}
                    />
                  )
                ) : (
                  <span style={{ width: 8, display: 'inline-block' }} />
                )
              ) : null}
              <Tag color="blue" className="type-tag-small">STORY</Tag>
              <a 
                className="story-title-link"
                onClick={(e) => {
                  e.stopPropagation();
                  onRequirementClick?.(record);
                }}
              >
                {record.title}
              </a>
              {record.children_count > 0 && (
                <span className="children-count">({record.children_count})</span>
              )}
            </div>
          );
        } else if (record.type === 'task') {
          const hasChildren = record.children && record.children.length > 0;
          const isExpanded = expandedRowKeys.includes(record.key);
          return (
            <div className="title-cell-indent level-1">
              {hasChildren ? (
                isExpanded ? (
                  <CaretDownOutlined 
                    rotate={90}
                    className="expand-icon-inline"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(record.key);
                    }}
                  />
                ) : (
                  <CaretRightOutlined 
                    rotate={90}
                    className="expand-icon-inline"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(record.key);
                    }}
                  />
                )
              ) : (
                <span style={{ width: 8, display: 'inline-block' }} />
              )}
              <Tag color="cyan" className="type-tag-small">TASK</Tag>
              <a 
                className="task-title-link"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onTaskClick) {
                    onTaskClick(record);
                  } else {
                    setSelectedTask(record);
                    setTaskFormVisible(true);
                  }
                }}
              >
                {record.title}
              </a>
            </div>
          );
        } else {
          const isUnderTask = record.key?.includes('task-bug-');
          return (
            <div className={`title-cell-indent ${isUnderTask ? 'level-2' : 'level-1'}`}>
              <span style={{ width: 8, display: 'inline-block' }} />
              <Tag color="orange" className="type-tag-small">BUG</Tag>
              <a 
                className="bug-title-link"
                onClick={(e) => {
                  e.stopPropagation();
                  onBugClick?.(record.id);
                }}
              >
                {record.title}
              </a>
            </div>
          );
        }
      },
    },
    {
      title: '状态',
      key: 'status',
      width: 100,
      render: (_, record) => {
        if (record.type === 'story') {
          const items = [
            { key: 'draft', label: '草稿' },
            { key: 'approved', label: '已批准' },
            { key: 'in_progress', label: '进行中' },
            { key: 'completed', label: '已完成' },
            { key: 'cancelled', label: '已取消' },
          ];
          return (
            <Dropdown 
              menu={{ 
                items, 
                onClick: ({ key }) => handleStatusChange(record.id, key, 'story')
              }} 
              trigger={['click']}
            >
              <Tag color={statusColors[record.status]} style={{ cursor: 'pointer' }}>
                {statusLabels[record.status] || record.status}
              </Tag>
            </Dropdown>
          );
        } else if (record.type === 'task') {
          const items = [
            { key: 'todo', label: '待处理' },
            { key: 'in_progress', label: '进行中' },
            { key: 'done', label: '已完成' },
          ];
          return (
            <Dropdown 
              menu={{ 
                items, 
                onClick: ({ key }) => handleStatusChange(record.id, key, 'task')
              }} 
              trigger={['click']}
            >
              <Tag color={taskStatusColors[record.status]} style={{ cursor: 'pointer' }}>
                {taskStatusLabels[record.status] || record.status}
              </Tag>
            </Dropdown>
          );
        } else {
          return <Tag color={bugStatusColors[record.status]}>{record.status}</Tag>;
        }
      },
    },
    {
      title: '优先级',
      key: 'priority',
      width: 80,
      render: (_, record) => {
        if (record.type === 'story') {
          return <Tag color={priorityColors[record.priority]}>{priorityLabels[record.priority] || record.priority}</Tag>;
        } else if (record.type === 'task') {
          return <Tag color={priorityColors[record.priority]}>{priorityLabels[record.priority] || record.priority}</Tag>;
        } else {
          return <Tag color={bugPriorityColors[record.priority]}>{record.priority}</Tag>;
        }
      },
    },
    {
      title: '处理人',
      key: 'assignee',
      width: 100,
      render: (_, record) => {
        return record.assignee?.username || '-';
      },
    },
    {
      title: '创建时间',
      key: 'created_at',
      width: 160,
      render: (_, record) => {
        if (record.type !== 'story' || !record.created_at) return '-';
        return new Date(record.created_at).toLocaleString('zh-CN');
      },
    },
  ];

  return (
    <div className="requirement-list-wrapper">
      <div className="toolbar">
        <div className="toolbar-left">
          <Input.Search
            placeholder="搜索需求..."
            style={{ width: 180 }}
            allowClear
            onSearch={setSearch}
            enterButton={<SearchOutlined />}
          />

          <Select
            placeholder="状态"
            style={{ width: 100 }}
            allowClear
            value={filters.status}
            onChange={(value) => setFilters({ ...filters, status: value })}
          >
            <Select.Option value="draft">草稿</Select.Option>
            <Select.Option value="approved">已批准</Select.Option>
            <Select.Option value="in_progress">进行中</Select.Option>
            <Select.Option value="completed">已完成</Select.Option>
            <Select.Option value="cancelled">已取消</Select.Option>
          </Select>

          <Select
            placeholder="优先级"
            style={{ width: 90 }}
            allowClear
            value={filters.priority}
            onChange={(value) => setFilters({ ...filters, priority: value })}
          >
            <Select.Option value="high">High</Select.Option>
            <Select.Option value="medium">Middle</Select.Option>
            <Select.Option value="low">Low</Select.Option>
          </Select>

          <Select
            placeholder="处理人"
            style={{ width: 100 }}
            allowClear
            value={filters.assignee_id}
            onChange={(value) => setFilters({ ...filters, assignee_id: value })}
          >
            {members?.map(m => (
              <Select.Option key={m.user_id} value={m.user_id}>{m.user?.username}</Select.Option>
            ))}
          </Select>
        </div>

        <div className="toolbar-actions">
          <span className="result-count">共 {reqData?.total || 0} 条</span>
          {selectedRowKeys.filter(k => k.startsWith('story-')).length > 0 && (
            <>
              <Dropdown menu={{ items: statusMenuItems, onClick: ({ key }) => handleBulkStatusChange(key) }} placement="bottomLeft">
                <Button>批量改状态 ({selectedRowKeys.filter(k => k.startsWith('story-')).length})</Button>
              </Dropdown>
              <Button danger onClick={handleBulkDelete}>
                批量删除 ({selectedRowKeys.filter(k => k.startsWith('story-')).length})
              </Button>
            </>
          )}
          {!hideCreateButton && (
            <Button type="primary" onClick={onCreateClick}>
              创建需求
            </Button>
          )}
          {sprintId && (
            <Button icon={<LinkOutlined />} onClick={() => setLinkDrawerVisible(true)}>
              关联需求
            </Button>
          )}
        </div>
      </div>

      {/* 快速创建 */}
      {showQuickCreate && (
        <div className="quick-create-row">
          <PlusOutlined className="quick-create-icon" />
          <Input
            className="quick-create-input"
            placeholder="快速创建"
            value={quickCreateTitle}
            onChange={(e) => setQuickCreateTitle(e.target.value)}
            onPressEnter={handleQuickCreate}
            bordered={false}
          />
        </div>
      )}
      
      <Table
        className="tree-table"
        columns={columns}
        dataSource={treeData}
        loading={isLoading}
        rowKey="key"
        rowSelection={rowSelection}
        rowClassName={(record) => {
          if (record.type === 'story') return 'story-row';
          if (record.type === 'task') return 'task-row';
          return 'bug-row';
        }}
        sticky={{ offsetHeader: 49 }}
        expandable={{
          expandedRowKeys,
          onExpand: (expanded, record) => toggleExpand(record.key),
          expandIcon: () => null,
          expandIconColumnIndex: -1,
        }}
        pagination={{
          current: page,
          pageSize: reqData?.page_size || 20,
          total: reqData?.total || 0,
          onChange: setPage,
          showSizeChanger: false,
          showTotal: (total) => `共 ${total} 条`,
        }}
      />

      <TaskForm
        visible={taskFormVisible}
        onClose={() => {
          setTaskFormVisible(false);
          setSelectedStory(null);
          setSelectedTask(null);
        }}
        requirementId={selectedStory?.id || selectedTask?.requirement_id}
        projectId={projectId}
        story={selectedStory}
        task={selectedTask}
      />

      <BugForm
        visible={bugFormVisible}
        onClose={() => {
          setBugFormVisible(false);
          setSelectedStory(null);
        }}
        onSuccess={handleBugSuccess}
        projectId={projectId}
      />

      <LinkRequirementsDrawer
        visible={linkDrawerVisible}
        onClose={() => setLinkDrawerVisible(false)}
        projectId={projectId}
        sprintId={sprintId}
        sprintName={sprintName}
      />
    </div>
  );
};

export default RequirementList;
