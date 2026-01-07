import { useState, useEffect } from 'react';
import { Drawer, Table, Button, Tag, Input, message, Space } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import requirementService from '../../services/requirementService';
import './index.css';

const statusColors = {
  draft: 'default',
  approved: 'blue',
  in_progress: 'purple',
  completed: 'green',
  cancelled: 'red',
};

const statusLabels = {
  draft: '草稿',
  approved: '已批准',
  in_progress: '进行中',
  completed: '已完成',
  cancelled: '已取消',
};

const priorityColors = {
  high: 'red',
  medium: 'orange',
  low: 'blue',
};

const priorityLabels = {
  high: '高',
  medium: '中',
  low: '低',
};

const LinkRequirementsDrawer = ({ visible, onClose, projectId, sprintId, sprintName }) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  // 获取非当前迭代的需求（包括未关联的和关联到其他迭代的）
  const { data: reqData, isLoading } = useQuery({
    queryKey: ['availableRequirements', projectId, sprintId, search],
    queryFn: () => requirementService.getRequirements(projectId, { 
      exclude_sprint_id: sprintId, // 排除当前迭代的需求
      search: search || undefined,
      page_size: 100
    }),
    enabled: visible && !!projectId,
  });

  const availableRequirements = reqData?.items || [];

  useEffect(() => {
    if (!visible) {
      setSelectedRowKeys([]);
      setSearch('');
    }
  }, [visible]);

  const linkMutation = useMutation({
    mutationFn: (requirementIds) => requirementService.bulkUpdateSprint(requirementIds, sprintId),
    onSuccess: () => {
      message.success(`已关联 ${selectedRowKeys.length} 个需求到迭代`);
      queryClient.invalidateQueries(['requirements', projectId]);
      queryClient.invalidateQueries(['unlinkedRequirements', projectId]);
      queryClient.invalidateQueries(['sprintStats']);
      setSelectedRowKeys([]);
      onClose();
    },
    onError: (error) => {
      message.error(error.response?.data?.detail || '关联失败');
    },
  });

  const handleLink = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要关联的需求');
      return;
    }
    linkMutation.mutate(selectedRowKeys);
  };

  const columns = [
    {
      title: '编号',
      dataIndex: 'requirement_number',
      key: 'requirement_number',
      width: 120,
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status) => (
        <Tag color={statusColors[status?.toLowerCase()]}>
          {statusLabels[status?.toLowerCase()] || status}
        </Tag>
      ),
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (priority) => (
        <Tag color={priorityColors[priority?.toLowerCase()]}>
          {priorityLabels[priority?.toLowerCase()] || priority}
        </Tag>
      ),
    },
    {
      title: '处理人',
      key: 'assignee',
      width: 100,
      render: (_, record) => record.assignee?.username || '-',
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
  };

  return (
    <Drawer
      title={`关联需求到 ${sprintName || '迭代'}`}
      open={visible}
      onClose={onClose}
      width={700}
      closable={false}
      styles={{ mask: { backgroundColor: 'transparent' } }}
      extra={
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button 
            type="primary" 
            onClick={handleLink}
            loading={linkMutation.isPending}
            disabled={selectedRowKeys.length === 0}
          >
            关联 {selectedRowKeys.length > 0 ? `(${selectedRowKeys.length})` : ''}
          </Button>
        </Space>
      }
    >
      <div className="link-drawer-toolbar">
        <Input.Search
          placeholder="搜索需求标题或编号..."
          style={{ width: 300 }}
          allowClear
          onSearch={setSearch}
          onChange={(e) => !e.target.value && setSearch('')}
          enterButton={<SearchOutlined />}
        />
        <span className="link-drawer-hint">
          显示未关联迭代的需求，共 {availableRequirements.length} 条
        </span>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={availableRequirements}
        loading={isLoading}
        rowSelection={rowSelection}
        size="small"
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          showTotal: (total) => `共 ${total} 条`,
        }}
      />
    </Drawer>
  );
};

export default LinkRequirementsDrawer;
