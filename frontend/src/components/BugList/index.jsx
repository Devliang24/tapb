import { useState } from 'react';
import { Table, Button, Tag, Select, Input, message, Modal } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import bugService from '../../services/bugService';
import projectService from '../../services/projectService';

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
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text, record) => (
        <a onClick={() => onBugClick?.(record.id)}>{text}</a>
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
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_, record) => (
        <Button type="link" size="small" onClick={() => handleDelete(record)}>
          删除
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <Select
          placeholder="状态"
          style={{ width: 120 }}
          allowClear
          onChange={(value) => setFilters({ ...filters, status: value })}
        >
          <Select.Option value="new">新建</Select.Option>
          <Select.Option value="confirmed">已确认</Select.Option>
          <Select.Option value="in_progress">处理中</Select.Option>
          <Select.Option value="resolved">已解决</Select.Option>
          <Select.Option value="closed">已关闭</Select.Option>
        </Select>

        <Select
          placeholder="优先级"
          style={{ width: 120 }}
          allowClear
          onChange={(value) => setFilters({ ...filters, priority: value })}
        >
          <Select.Option value="critical">紧急</Select.Option>
          <Select.Option value="high">高</Select.Option>
          <Select.Option value="medium">中</Select.Option>
          <Select.Option value="low">低</Select.Option>
        </Select>

        <Input.Search
          placeholder="搜索 Bug..."
          style={{ width: 300 }}
          onSearch={setSearch}
          enterButton={<SearchOutlined />}
        />

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {selectedRowKeys.length > 0 && (
            <Button danger onClick={handleBatchDelete}>
              批量删除 ({selectedRowKeys.length})
            </Button>
          )}
          <Button type="primary" onClick={onCreateClick}>
            创建 Bug
          </Button>
        </div>
      </div>

      <Table
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        }}
        columns={columns}
        dataSource={bugData?.items || []}
        loading={isLoading}
        rowKey="id"
        scroll={{ x: 900 }}
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
