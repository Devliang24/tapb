import { useState } from 'react';
import { Table, Button, Tag, Select, Input, message, Modal, Dropdown } from 'antd';
import { SearchOutlined, EllipsisOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import bugService from '../../services/bugService';
import projectService from '../../services/projectService';
import sprintService from '../../services/sprintService';
import './index.css';

const { confirm } = Modal;

const statusColors = {
  new: 'blue',
  confirmed: 'orange',
  in_progress: 'purple',
  resolved: 'green',
  closed: 'default',
  reopened: 'red',
};

const statusLabels = {
  new: '新建',
  confirmed: '已确认',
  in_progress: '处理中',
  resolved: '已解决',
  closed: '已关闭',
  reopened: '重新打开',
};

const priorityColors = {
  critical: 'red',
  high: 'orange',
  medium: 'blue',
  low: 'default',
};

const priorityLabels = {
  critical: '紧急',
  high: '高',
  medium: '中',
  low: '低',
};

const severityColors = {
  blocker: 'red',
  critical: 'volcano',
  major: 'orange',
  minor: 'blue',
  trivial: 'default',
};

const severityLabels = {
  blocker: '阻塞',
  critical: '严重',
  major: '主要',
  minor: '次要',
  trivial: '轻微',
};

const environmentLabels = {
  development: '开发环境',
  testing: '测试环境',
  staging: '预发环境',
  production: '生产环境',
};

const defectCauseLabels = {
  code_error: '代码错误',
  design_defect: '设计缺陷',
  requirement_issue: '需求问题',
  config_error: '配置错误',
  environment: '环境问题',
  third_party: '第三方问题',
  other: '其他',
};

const BugList = ({ projectId, onCreateClick, onBugClick }) => {
  const [filters, setFilters] = useState({});
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const queryClient = useQueryClient();

  const { data: bugData, isLoading } = useQuery({
    queryKey: ['bugs', projectId, filters, search, page],
    queryFn: () => bugService.getBugs({ project_id: projectId, ...filters, search, page }),
  });

  const { data: members } = useQuery({
    queryKey: ['projectMembers', projectId],
    queryFn: () => projectService.getProjectMembers(projectId),
    enabled: !!projectId,
  });

  const { data: sprints } = useQuery({
    queryKey: ['sprints', projectId],
    queryFn: () => sprintService.getSprints(projectId),
    enabled: !!projectId,
  });

  const updateMutation = useMutation({
    mutationFn: ({ bugId, data }) => bugService.updateBug(bugId, data),
    onSuccess: () => {
      message.success('更新成功');
      queryClient.invalidateQueries(['bugs', projectId]);
    },
    onError: (error) => {
      message.error(error.response?.data?.detail || '更新失败');
    },
  });

  // 复制 Bug
  const copyMutation = useMutation({
    mutationFn: (bug) => bugService.createBug({
      project_id: bug.project_id,
      title: `${bug.title} (复制)`,
      description: bug.description || '# 复制的描述\n',
      priority: bug.priority,
      severity: bug.severity,
      assignee_id: bug.assignee_id || undefined,
      sprint_id: bug.sprint_id || undefined,
      requirement_id: bug.requirement_id || undefined,
      environment: bug.environment || undefined,
      defect_cause: bug.defect_cause || undefined,
    }),
    onSuccess: () => {
      message.success('已复制');
      queryClient.invalidateQueries(['bugs', projectId]);
    },
    onError: (error) => {
      message.error(error.response?.data?.detail || '复制失败');
    },
  });

  const handleFieldChange = (bugId, field, value) => {
    updateMutation.mutate({ bugId, data: { [field]: value } });
  };

  const deleteMutation = useMutation({
    mutationFn: bugService.deleteBug,
    onSuccess: () => {
      message.success('删除成功！');
      queryClient.invalidateQueries(['bugs', projectId]);
    },
  });

  const batchDeleteMutation = useMutation({
    mutationFn: bugService.batchDelete,
    onSuccess: () => {
      message.success('批量删除成功！');
      setSelectedRowKeys([]);
      queryClient.invalidateQueries(['bugs', projectId]);
    },
  });

  const handleDelete = (bug) => {
    confirm({
      title: '确认删除',
      content: `确定删除 Bug "${bug.bug_number}" 吗？`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => deleteMutation.mutate(bug.id),
    });
  };

  const handleBatchDelete = () => {
    confirm({
      title: '批量删除',
      content: `确定删除选中的 ${selectedRowKeys.length} 个 Bug 吗？`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => batchDeleteMutation.mutate(selectedRowKeys),
    });
  };

  const columns = [
    {
      title: '',
      key: 'actions',
      width: 24,
      className: 'action-col',
      render: (_, record) => {
        const items = [
          { key: 'copy', label: '复制', onClick: () => copyMutation.mutate(record) },
          { key: 'delete', label: '删除', danger: true, onClick: () => handleDelete(record) },
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
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      className: 'title-col',
      ellipsis: true,
      render: (text, record) => (
        <div className="bug-title-cell">
          <Tag color="red" className="type-tag">BUG</Tag>
          <a className="bug-title-link" onClick={() => onBugClick?.(record.id)}>{text}</a>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status, record) => (
        <Select
          size="small"
          variant="borderless"
          suffixIcon={null}
          value={status}
          style={{ width: 85 }}
          onChange={(value) => handleFieldChange(record.id, 'status', value)}
          onClick={(e) => e.stopPropagation()}
        >
          {Object.entries(statusLabels).map(([key, label]) => (
            <Select.Option key={key} value={key}>
              <Tag color={statusColors[key]} style={{ margin: 0 }}>{label}</Tag>
            </Select.Option>
          ))}
        </Select>
      ),
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 90,
      render: (priority, record) => (
        <Select
          size="small"
          variant="borderless"
          suffixIcon={null}
          value={priority}
          style={{ width: 85 }}
          onChange={(value) => handleFieldChange(record.id, 'priority', value)}
          onClick={(e) => e.stopPropagation()}
        >
          {Object.entries(priorityLabels).map(([key, label]) => (
            <Select.Option key={key} value={key}>
              <Tag color={priorityColors[key]} style={{ margin: 0 }}>{label}</Tag>
            </Select.Option>
          ))}
        </Select>
      ),
    },
    {
      title: '严重程度',
      dataIndex: 'severity',
      key: 'severity',
      width: 100,
      render: (severity, record) => (
        <Select
          size="small"
          variant="borderless"
          suffixIcon={null}
          value={severity}
          style={{ width: 95 }}
          onChange={(value) => handleFieldChange(record.id, 'severity', value)}
          onClick={(e) => e.stopPropagation()}
        >
          {Object.entries(severityLabels).map(([key, label]) => (
            <Select.Option key={key} value={key}>
              <Tag color={severityColors[key]} style={{ margin: 0 }}>{label}</Tag>
            </Select.Option>
          ))}
        </Select>
      ),
    },
    {
      title: '发现环境',
      dataIndex: 'environment',
      key: 'environment',
      width: 110,
      render: (environment, record) => (
        <Select
          size="small"
          variant="borderless"
          suffixIcon={null}
          value={environment}
          style={{ width: 100 }}
          placeholder="未设置"
          allowClear
          onChange={(value) => handleFieldChange(record.id, 'environment', value)}
          onClick={(e) => e.stopPropagation()}
        >
          {Object.entries(environmentLabels).map(([key, label]) => (
            <Select.Option key={key} value={key}>
              {label}
            </Select.Option>
          ))}
        </Select>
      ),
    },
    {
      title: '缺陷原因',
      dataIndex: 'defect_cause',
      key: 'defect_cause',
      width: 110,
      render: (defect_cause, record) => (
        <Select
          size="small"
          variant="borderless"
          suffixIcon={null}
          value={defect_cause}
          style={{ width: 100 }}
          placeholder="未设置"
          allowClear
          onChange={(value) => handleFieldChange(record.id, 'defect_cause', value)}
          onClick={(e) => e.stopPropagation()}
        >
          {Object.entries(defectCauseLabels).map(([key, label]) => (
            <Select.Option key={key} value={key}>
              {label}
            </Select.Option>
          ))}
        </Select>
      ),
    },
    {
      title: '迭代',
      dataIndex: 'sprint',
      key: 'sprint',
      width: 120,
      render: (sprint, record) => (
        <Select
          size="small"
          variant="borderless"
          suffixIcon={null}
          value={record.sprint_id}
          style={{ width: 110 }}
          placeholder="未设置"
          allowClear
          onChange={(value) => handleFieldChange(record.id, 'sprint_id', value)}
          onClick={(e) => e.stopPropagation()}
        >
          {sprints?.items?.map((s) => (
            <Select.Option key={s.id} value={s.id}>
              {s.name}
            </Select.Option>
          ))}
        </Select>
      ),
    },
    {
      title: '创建人',
      dataIndex: 'creator',
      key: 'creator',
      width: 80,
      render: (creator) => <span style={{ whiteSpace: 'nowrap' }}>{creator?.username || '-'}</span>,
    },
    {
      title: '处理人',
      dataIndex: 'assignee',
      key: 'assignee',
      width: 100,
      render: (assignee, record) => (
        <Select
          size="small"
          variant="borderless"
          suffixIcon={null}
          value={record.assignee_id}
          style={{ width: 95 }}
          placeholder="未分配"
          allowClear
          onChange={(value) => handleFieldChange(record.id, 'assignee_id', value)}
          onClick={(e) => e.stopPropagation()}
        >
          {members?.map((member) => (
            <Select.Option key={member.user_id} value={member.user_id}>
              {member.user?.username}
            </Select.Option>
          ))}
        </Select>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (date) => <span style={{ whiteSpace: 'nowrap' }}>{new Date(date).toLocaleString('zh-CN')}</span>,
    },
  ];

  return (
    <div className="bug-list-wrapper">
      <div className="toolbar">
        <div className="toolbar-left">
          <Input.Search
            placeholder="搜索 Bug..."
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
            <Select.Option value="new">新建</Select.Option>
            <Select.Option value="confirmed">已确认</Select.Option>
            <Select.Option value="in_progress">处理中</Select.Option>
            <Select.Option value="resolved">已解决</Select.Option>
            <Select.Option value="closed">已关闭</Select.Option>
            <Select.Option value="reopened">重新打开</Select.Option>
          </Select>

          <Select
            placeholder="优先级"
            style={{ width: 90 }}
            allowClear
            value={filters.priority}
            onChange={(value) => setFilters({ ...filters, priority: value })}
          >
            <Select.Option value="critical">紧急</Select.Option>
            <Select.Option value="high">高</Select.Option>
            <Select.Option value="medium">中</Select.Option>
            <Select.Option value="low">低</Select.Option>
          </Select>

          <Select
            placeholder="严重程度"
            style={{ width: 100 }}
            allowClear
            value={filters.severity}
            onChange={(value) => setFilters({ ...filters, severity: value })}
          >
            <Select.Option value="blocker">阻塞</Select.Option>
            <Select.Option value="critical">严重</Select.Option>
            <Select.Option value="major">主要</Select.Option>
            <Select.Option value="minor">次要</Select.Option>
            <Select.Option value="trivial">轻微</Select.Option>
          </Select>

          <Select
            placeholder="迭代"
            style={{ width: 120 }}
            allowClear
            value={filters.sprint_id}
            onChange={(value) => setFilters({ ...filters, sprint_id: value })}
          >
            {sprints?.items?.map(s => (
              <Select.Option key={s.id} value={s.id}>{s.name}</Select.Option>
            ))}
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

          <Select
            placeholder="创建人"
            style={{ width: 100 }}
            allowClear
            value={filters.creator_id}
            onChange={(value) => setFilters({ ...filters, creator_id: value })}
          >
            {members?.map(m => (
              <Select.Option key={m.user_id} value={m.user_id}>{m.user?.username}</Select.Option>
            ))}
          </Select>
        </div>

        <div className="toolbar-actions">
          {selectedRowKeys.length > 0 && (
            <Button danger onClick={handleBatchDelete}>
              批量删除 ({selectedRowKeys.length})
            </Button>
          )}
          <Button type="primary" onClick={onCreateClick}>
            新建 Bug
          </Button>
        </div>
      </div>

      <Table
        className="bug-table"
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
          columnWidth: 32,
        }}
        columns={columns}
        dataSource={bugData?.items || []}
        loading={isLoading}
        rowKey="id"
        scroll={{ x: 1200 }}
        sticky={{ offsetHeader: 49 }}
        pagination={{
          current: page,
          pageSize: bugData?.page_size || 20,
          total: bugData?.total || 0,
          onChange: setPage,
          showSizeChanger: false,
          showTotal: (total) => `共 ${total} 条`,
        }}
      />
    </div>
  );
};

export default BugList;
