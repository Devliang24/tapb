import { useState, useRef } from 'react';
import { Table, Button, Tag, Select, Input, message, Modal, Dropdown, TreeSelect, Upload, Space } from 'antd';
import { SearchOutlined, EllipsisOutlined, FolderOutlined, UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import testCaseService from '../../services/testCaseService';
import projectService from '../../services/projectService';
import sprintService from '../../services/sprintService';
import './index.css';

const { confirm } = Modal;

const typeColors = {
  functional: 'blue',
  performance: 'purple',
  security: 'red',
  compatibility: 'cyan',
  smoke: 'green',
  regression: 'orange',
};

const typeLabels = {
  functional: '功能测试',
  performance: '性能测试',
  security: '安全测试',
  compatibility: '兼容性测试',
  smoke: '冒烟测试',
  regression: '回归测试',
};

const statusColors = {
  passed: 'green',
  failed: 'red',
  not_executed: 'default',
};

const statusLabels = {
  passed: '通过',
  failed: '不通过',
  not_executed: '未执行',
};

const priorityColors = {
  high: 'red',
  medium: 'orange',
  low: 'default',
};

const priorityLabels = {
  high: '高',
  medium: '中',
  low: '低',
};

const TestCaseList = ({ projectId, categoryId, onCreateClick, onTestCaseClick, stickyMode = false }) => {
  const [filters, setFilters] = useState({});
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [moveModalVisible, setMoveModalVisible] = useState(false);
  const [targetCategoryId, setTargetCategoryId] = useState(null);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [importing, setImporting] = useState(false);
  const queryClient = useQueryClient();

  const { data: testCaseData, isLoading } = useQuery({
    queryKey: ['testcases', projectId, categoryId, filters, search, page],
    queryFn: () => testCaseService.getTestCases({
      project_id: projectId,
      category_id: categoryId,
      ...filters,
      search,
      page,
    }),
    enabled: !!projectId,
  });

  const { data: members } = useQuery({
    queryKey: ['projectMembers', projectId],
    queryFn: () => projectService.getProjectMembers(projectId),
    enabled: !!projectId,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['testCaseCategories', projectId],
    queryFn: () => testCaseService.getCategories(projectId),
    enabled: !!projectId,
  });

  const { data: sprints } = useQuery({
    queryKey: ['sprints', projectId],
    queryFn: () => sprintService.getSprints(projectId),
    enabled: !!projectId,
  });

  // 构建目录树数据
  const buildCategoryTree = (items, parentId = null) => {
    return items
      .filter(item => item.parent_id === parentId)
      .map(item => ({
        value: item.id,
        title: item.name,
        icon: <FolderOutlined />,
        children: buildCategoryTree(items, item.id),
      }));
  };

  const categoryTreeData = [
    { value: 0, title: '未分类', icon: <FolderOutlined /> },
    ...buildCategoryTree(categories),
  ];

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => testCaseService.updateTestCase(id, data),
    onSuccess: () => {
      message.success('更新成功');
      queryClient.invalidateQueries(['testcases', projectId]);
    },
    onError: (error) => {
      message.error(error.response?.data?.detail || '更新失败');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: testCaseService.deleteTestCase,
    onSuccess: () => {
      message.success('删除成功');
      queryClient.invalidateQueries(['testcases', projectId]);
    },
    onError: (error) => {
      message.error(error.response?.data?.detail || '删除失败');
    },
  });

  const batchDeleteMutation = useMutation({
    mutationFn: testCaseService.batchDelete,
    onSuccess: () => {
      message.success('批量删除成功');
      setSelectedRowKeys([]);
      queryClient.invalidateQueries(['testcases', projectId]);
    },
    onError: (error) => {
      message.error(error.response?.data?.detail || '批量删除失败');
    },
  });

  const copyMutation = useMutation({
    mutationFn: (testCase) => testCaseService.createTestCase({
      project_id: testCase.project_id,
      name: `${testCase.name} (复制)`,
      type: testCase.type,
      status: 'not_executed',
      priority: testCase.priority,
      category_id: testCase.category_id,
      precondition: testCase.precondition,
      steps: testCase.steps,
      expected_result: testCase.expected_result,
    }),
    onSuccess: () => {
      message.success('复制成功');
      queryClient.invalidateQueries(['testcases', projectId]);
    },
    onError: (error) => {
      message.error(error.response?.data?.detail || '复制失败');
    },
  });

  const handleFieldChange = (id, field, value) => {
    updateMutation.mutate({ id, data: { [field]: value } });
  };

  const handleDelete = (testCase) => {
    confirm({
      title: '确认删除',
      content: `确定删除测试用例 "${testCase.case_number}" 吗？`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => deleteMutation.mutate(testCase.id),
    });
  };

  const handleBatchDelete = () => {
    confirm({
      title: '批量删除',
      content: `确定删除选中的 ${selectedRowKeys.length} 个测试用例吗？`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => batchDeleteMutation.mutate(selectedRowKeys),
    });
  };

  const handleMove = (testCaseId, newCategoryId) => {
    updateMutation.mutate({ id: testCaseId, data: { category_id: newCategoryId === 0 ? null : newCategoryId } });
  };

  // 导入导出处理
  const handleDownloadTemplate = async () => {
    try {
      const response = await testCaseService.downloadTemplate();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'testcase_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      message.error('下载模板失败');
    }
  };

  const handleExport = async () => {
    try {
      const response = await testCaseService.exportTestCases({
        project_id: projectId,
        category_id: categoryId,
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `testcases_${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      message.success('导出成功');
    } catch (error) {
      message.error('导出失败');
    }
  };

  const handleImport = async (file) => {
    setImporting(true);
    try {
      const result = await testCaseService.importTestCases(file, projectId);
      setImportResult(result);
      if (result.success_count > 0) {
        queryClient.invalidateQueries(['testcases', projectId]);
        queryClient.invalidateQueries(['testCaseCategories', projectId]);
      }
    } catch (error) {
      setImportResult({
        success: false,
        message: error.response?.data?.detail || '导入失败',
        success_count: 0,
        error_count: 0,
        errors: [],
      });
    } finally {
      setImporting(false);
    }
    return false; // 阻止默认上传行为
  };

  const handleBatchMove = () => {
    if (targetCategoryId === undefined) {
      message.warning('请选择目标目录');
      return;
    }
    Promise.all(
      selectedRowKeys.map(id => 
        testCaseService.updateTestCase(id, { category_id: targetCategoryId === 0 ? null : targetCategoryId })
      )
    ).then(() => {
      message.success('批量移动成功');
      setSelectedRowKeys([]);
      setMoveModalVisible(false);
      setTargetCategoryId(null);
      queryClient.invalidateQueries(['testcases', projectId]);
    }).catch((error) => {
      message.error(error.response?.data?.detail || '批量移动失败');
    });
  };

  const columns = [
    {
      title: '',
      key: 'actions',
      width: 24,
      className: 'action-col',
      fixed: 'left',
      render: (_, record) => {
        const moveMenuItems = categoryTreeData.map(cat => ({
          key: `move-${cat.value}`,
          label: cat.title,
          icon: <FolderOutlined />,
          disabled: cat.value === record.category_id,
          onClick: () => handleMove(record.id, cat.value),
          children: cat.children?.map(child => ({
            key: `move-${child.value}`,
            label: child.title,
            icon: <FolderOutlined />,
            disabled: child.value === record.category_id,
            onClick: () => handleMove(record.id, child.value),
          })),
        }));

        const items = [
          { 
            key: 'move', 
            label: '移动到',
            icon: <FolderOutlined />,
            children: moveMenuItems,
          },
          { key: 'copy', label: '复制', onClick: () => copyMutation.mutate(record) },
          { type: 'divider' },
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
      title: '用例名称',
      dataIndex: 'name',
      key: 'name',
      className: 'name-col',
      ellipsis: true,
      render: (text, record) => (
        <div className="testcase-name-cell">
          <Tag color="cyan" className="type-tag">CASE</Tag>
          <a className="testcase-name-link" onClick={() => onTestCaseClick?.(record.id)}>{text}</a>
        </div>
      ),
    },
    {
      title: '用例类型',
      dataIndex: 'type',
      key: 'type',
      width: 110,
      render: (type, record) => (
        <Select
          size="small"
          variant="borderless"
          suffixIcon={null}
          value={type}
          style={{ width: 100 }}
          onChange={(value) => handleFieldChange(record.id, 'type', value)}
          onClick={(e) => e.stopPropagation()}
        >
          {Object.entries(typeLabels).map(([key, label]) => (
            <Select.Option key={key} value={key}>
              <Tag color={typeColors[key]} style={{ margin: 0 }}>{label}</Tag>
            </Select.Option>
          ))}
        </Select>
      ),
    },
    {
      title: '用例状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status, record) => (
        <Select
          size="small"
          variant="borderless"
          suffixIcon={null}
          value={status}
          style={{ width: 80 }}
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
      title: '用例等级',
      dataIndex: 'priority',
      key: 'priority',
      width: 90,
      render: (priority, record) => (
        <Select
          size="small"
          variant="borderless"
          suffixIcon={null}
          value={priority}
          style={{ width: 80 }}
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
      title: '所属目录',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (category) => category?.name || '未分类',
    },
    {
      title: '迭代',
      dataIndex: 'sprint',
      key: 'sprint',
      width: 180,
      render: (sprint, record) => (
        <Select
          size="small"
          variant="borderless"
          suffixIcon={null}
          value={record.sprint_id}
          style={{ width: 170 }}
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
      title: '关联需求',
      dataIndex: 'requirement',
      key: 'requirement',
      width: 100,
      render: (requirement) => requirement ? (
        <Tag color="blue" style={{ margin: 0 }}>{requirement.requirement_number}</Tag>
      ) : '-',
    },
    {
      title: '创建人',
      dataIndex: 'creator',
      key: 'creator',
      width: 80,
      render: (creator) => <span style={{ whiteSpace: 'nowrap' }}>{creator?.username || '-'}</span>,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (date) => <span style={{ whiteSpace: 'nowrap' }}>{new Date(date).toLocaleString('zh-CN')}</span>,
    },
  ];

  const toolbarContent = (
    <div className="toolbar">
      <div className="toolbar-left">
          <Input.Search
            placeholder="搜索用例..."
            style={{ width: 180 }}
            allowClear
            onSearch={setSearch}
            enterButton={<SearchOutlined />}
          />

          <Select
            placeholder="用例类型"
            style={{ width: 110 }}
            allowClear
            value={filters.type}
            onChange={(value) => setFilters({ ...filters, type: value })}
          >
            {Object.entries(typeLabels).map(([key, label]) => (
              <Select.Option key={key} value={key}>{label}</Select.Option>
            ))}
          </Select>

          <Select
            placeholder="状态"
            style={{ width: 90 }}
            allowClear
            value={filters.status}
            onChange={(value) => setFilters({ ...filters, status: value })}
          >
            {Object.entries(statusLabels).map(([key, label]) => (
              <Select.Option key={key} value={key}>{label}</Select.Option>
            ))}
          </Select>

          <Select
            placeholder="等级"
            style={{ width: 80 }}
            allowClear
            value={filters.priority}
            onChange={(value) => setFilters({ ...filters, priority: value })}
          >
            {Object.entries(priorityLabels).map(([key, label]) => (
              <Select.Option key={key} value={key}>{label}</Select.Option>
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
          <span className="result-count">共 {testCaseData?.total || 0} 条</span>
          {selectedRowKeys.length > 0 && (
            <>
              <Button onClick={() => setMoveModalVisible(true)}>
                批量移动 ({selectedRowKeys.length})
              </Button>
              <Button danger onClick={handleBatchDelete}>
                批量删除 ({selectedRowKeys.length})
              </Button>
            </>
          )}
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            导出
          </Button>
          <Button icon={<UploadOutlined />} onClick={() => setImportModalVisible(true)}>
            导入
          </Button>
          <Button type="primary" onClick={onCreateClick}>
            创建用例
          </Button>
        </div>
      </div>
  );

  const tableContent = (
      <Table
        className="testcase-table"
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
          columnWidth: 32,
        }}
        columns={columns}
        dataSource={testCaseData?.items || []}
        loading={isLoading}
        rowKey="id"
        scroll={{ x: 900 }}
        sticky
        pagination={{
          current: page,
          pageSize: testCaseData?.page_size || 20,
          total: testCaseData?.total || 0,
          onChange: setPage,
          showSizeChanger: false,
          showTotal: (total) => `共 ${total} 条`,
        }}
      />
  );

  return (
    <div className={`testcase-list${stickyMode ? ' sticky-mode' : ''}`}>
      {stickyMode ? (
        <>
          <div className="sticky-header">
            {toolbarContent}
          </div>
          <div className="table-scroll-container">
            {tableContent}
          </div>
        </>
      ) : (
        <>
          {toolbarContent}
          {tableContent}
        </>
      )}

      <Modal
        title="批量移动用例"
        open={moveModalVisible}
        onOk={handleBatchMove}
        onCancel={() => {
          setMoveModalVisible(false);
          setTargetCategoryId(null);
        }}
        okText="移动"
        cancelText="取消"
      >
        <div style={{ marginBottom: 16 }}>
          将选中的 {selectedRowKeys.length} 个用例移动到：
        </div>
        <TreeSelect
          style={{ width: '100%' }}
          placeholder="选择目标目录"
          treeData={categoryTreeData}
          value={targetCategoryId}
          onChange={setTargetCategoryId}
          treeIcon
          treeLine
          allowClear
        />
      </Modal>

      <Modal
        title="导入测试用例"
        open={importModalVisible}
        onCancel={() => {
          setImportModalVisible(false);
          setImportResult(null);
        }}
        footer={importResult ? [
          <Button key="close" onClick={() => {
            setImportModalVisible(false);
            setImportResult(null);
          }}>关闭</Button>
        ] : null}
        width={500}
      >
        {!importResult ? (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Button type="link" onClick={handleDownloadTemplate} style={{ padding: 0 }}>
                <DownloadOutlined /> 下载导入模板
              </Button>
            </div>
            <Upload.Dragger
              accept=".xlsx,.xls"
              beforeUpload={handleImport}
              showUploadList={false}
              disabled={importing}
            >
              <p className="ant-upload-drag-icon">
                <UploadOutlined style={{ fontSize: 48, color: '#1890ff' }} />
              </p>
              <p className="ant-upload-text">点击或拖拽 Excel 文件到此区域</p>
              <p className="ant-upload-hint">支持 .xlsx 或 .xls 格式</p>
            </Upload.Dragger>
            {importing && <div style={{ textAlign: 'center', marginTop: 16 }}>导入中...</div>}
          </div>
        ) : (
          <div>
            <div style={{ 
              padding: 16, 
              background: importResult.success_count > 0 ? '#f6ffed' : '#fff2f0',
              borderRadius: 4,
              marginBottom: 16
            }}>
              <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>
                {importResult.message}
              </div>
              <div>成功: {importResult.success_count} 条，失败: {importResult.error_count} 条</div>
            </div>
            {importResult.errors?.length > 0 && (
              <div>
                <div style={{ fontWeight: 500, marginBottom: 8 }}>错误详情：</div>
                <ul style={{ paddingLeft: 20, margin: 0, maxHeight: 200, overflow: 'auto' }}>
                  {importResult.errors.map((err, idx) => (
                    <li key={idx} style={{ color: '#ff4d4f' }}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TestCaseList;
