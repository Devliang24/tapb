import { useState } from 'react';
import { Table, Button, Tag, Space, Select, message, Modal } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import sprintService from '../../services/sprintService';

const { confirm } = Modal;

const statusColors = {
  planning: 'blue',
  active: 'green',
  completed: 'default',
};

const statusLabels = {
  planning: '规划中',
  active: '进行中',
  completed: '已完成',
};

const SprintList = ({ projectId, onCreateClick, onSprintClick }) => {
  const [statusFilter, setStatusFilter] = useState(null);
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data: sprintData, isLoading } = useQuery({
    queryKey: ['sprints', projectId, statusFilter, page],
    queryFn: () => sprintService.getSprints(projectId, { status: statusFilter, page }),
  });

  const deleteMutation = useMutation({
    mutationFn: sprintService.deleteSprint,
    onSuccess: () => {
      message.success('删除成功！');
      queryClient.invalidateQueries(['sprints', projectId]);
    },
    onError: (error) => {
      message.error(error.response?.data?.detail || '删除失败');
    },
  });

  const handleDelete = (sprint) => {
    confirm({
      title: '确认删除',
      content: `确定删除迭代 "${sprint.name}" 吗？关联的需求和Bug将取消关联。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => deleteMutation.mutate(sprint.id),
    });
  };

  const columns = [
    {
      title: '迭代名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <a onClick={() => onSprintClick?.(record)}>{text}</a>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>,
    },
    {
      title: '开始日期',
      dataIndex: 'start_date',
      key: 'start_date',
      width: 120,
      render: (date) => date || '-',
    },
    {
      title: '结束日期',
      dataIndex: 'end_date',
      key: 'end_date',
      width: 120,
      render: (date) => date || '-',
    },
    {
      title: '目标',
      dataIndex: 'goal',
      key: 'goal',
      ellipsis: true,
      render: (text) => text || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" danger onClick={() => handleDelete(record)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
        <Select
          placeholder="状态筛选"
          style={{ width: 120 }}
          allowClear
          value={statusFilter}
          onChange={setStatusFilter}
        >
          <Select.Option value="planning">规划中</Select.Option>
          <Select.Option value="active">进行中</Select.Option>
          <Select.Option value="completed">已完成</Select.Option>
        </Select>

        <div style={{ marginLeft: 'auto' }}>
          <Button type="primary" onClick={onCreateClick}>
            创建迭代
          </Button>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={sprintData?.items || []}
        loading={isLoading}
        rowKey="id"
        pagination={{
          current: page,
          pageSize: sprintData?.page_size || 20,
          total: sprintData?.total || 0,
          onChange: setPage,
          showSizeChanger: false,
          showTotal: (total) => `共 ${total} 条`,
        }}
      />
    </div>
  );
};

export default SprintList;
