import { useState, useEffect } from 'react';
import { Tag, Button, Select, message, Modal, Popconfirm, TreeSelect, Timeline, Empty } from 'antd';
import { DeleteOutlined, CopyOutlined, FolderOutlined, UserOutlined, CalendarOutlined, ClockCircleOutlined, HistoryOutlined } from '@ant-design/icons';
import MarkdownRenderer from '../MarkdownRenderer';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DetailDrawer from '../DetailDrawer';
import RichTextEditor from '../MarkdownEditor';
import testCaseService from '../../services/testCaseService';
import './index.css';

// HTML 内容渲染组件
const HtmlContent = ({ content }) => {
  if (!content) return null;
  return <div className="html-content" dangerouslySetInnerHTML={{ __html: content }} />;
};

const { confirm } = Modal;

const typeOptions = [
  { value: 'functional', label: '功能测试', color: 'blue' },
  { value: 'performance', label: '性能测试', color: 'purple' },
  { value: 'security', label: '安全测试', color: 'red' },
  { value: 'compatibility', label: '兼容性测试', color: 'cyan' },
  { value: 'smoke', label: '冒烟测试', color: 'green' },
  { value: 'regression', label: '回归测试', color: 'orange' },
];

const statusOptions = [
  { value: 'passed', label: '通过', color: 'green' },
  { value: 'failed', label: '不通过', color: 'red' },
  { value: 'not_executed', label: '未执行', color: 'default' },
];

const priorityOptions = [
  { value: 'high', label: '高', color: 'red' },
  { value: 'medium', label: '中', color: 'orange' },
  { value: 'low', label: '低', color: 'default' },
];

const TestCaseDetail = ({ open, onClose, testCaseId, projectId, onPrev, onNext, hasPrev, hasNext }) => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('detail');
  const [editedName, setEditedName] = useState('');
  const [editedType, setEditedType] = useState('');
  const [editedStatus, setEditedStatus] = useState('');
  const [editedPriority, setEditedPriority] = useState('');
  const [editedPrecondition, setEditedPrecondition] = useState('');
  const [editedSteps, setEditedSteps] = useState('');
  const [editedExpectedResult, setEditedExpectedResult] = useState('');
  const [editedCategoryId, setEditedCategoryId] = useState(null);

  const { data: testCase, isLoading } = useQuery({
    queryKey: ['testcase', testCaseId],
    queryFn: () => testCaseService.getTestCase(testCaseId),
    enabled: !!testCaseId,
  });

  // 获取项目的目录列表
  const effectiveProjectId = projectId || testCase?.project_id;
  const { data: categories = [] } = useQuery({
    queryKey: ['testCaseCategories', effectiveProjectId],
    queryFn: () => testCaseService.getCategories(effectiveProjectId),
    enabled: !!effectiveProjectId && open,
  });

  // 获取操作历史
  const { data: history } = useQuery({
    queryKey: ['testcaseHistory', testCaseId],
    queryFn: () => testCaseService.getHistory(testCaseId),
    enabled: !!testCaseId && open,
  });

  // 构建目录树数据
  const buildCategoryTree = (items, parentId = null) => {
    return items
      .filter(item => item.parent_id === parentId)
      .map(item => ({
        value: item.id,
        title: item.name,
        children: buildCategoryTree(items, item.id),
      }));
  };

  const categoryTreeData = [
    { value: null, title: '未分类' },
    ...buildCategoryTree(categories),
  ];

  // 初始化编辑状态
  useEffect(() => {
    if (testCase) {
      setEditedName(testCase.name || '');
      setEditedType(testCase.type || 'functional');
      setEditedStatus(testCase.status || 'NOT_EXECUTED');
      setEditedPriority(testCase.priority || 'medium');
      setEditedPrecondition(testCase.precondition || '');
      setEditedSteps(testCase.steps || '');
      setEditedExpectedResult(testCase.expected_result || '');
      setEditedCategoryId(testCase.category_id);
    }
  }, [testCase]);

  // 关闭抽屉时重置编辑状态
  useEffect(() => {
    if (!open) {
      setIsEditing(false);
      setActiveTab('detail');
    }
  }, [open]);

  const updateMutation = useMutation({
    mutationFn: (data) => testCaseService.updateTestCase(testCaseId, data),
    onSuccess: () => {
      message.success('更新成功');
      queryClient.invalidateQueries(['testcase', testCaseId]);
      queryClient.invalidateQueries(['testcases', projectId]);
      setIsEditing(false);
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
      onClose();
    },
    onError: (error) => {
      message.error(error.response?.data?.detail || '删除失败');
    },
  });

  const copyMutation = useMutation({
    mutationFn: () => testCaseService.createTestCase({
      project_id: testCase.project_id,
      name: `${testCase.name} (复制)`,
      type: testCase.type,
      status: 'NOT_EXECUTED',
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

  const handleSave = () => {
    updateMutation.mutate({
      name: editedName,
      type: editedType,
      status: editedStatus,
      priority: editedPriority,
      precondition: editedPrecondition,
      steps: editedSteps,
      expected_result: editedExpectedResult,
      category_id: editedCategoryId,
    });
  };

  const handleCancelEdit = () => {
    if (testCase) {
      setEditedName(testCase.name || '');
      setEditedType(testCase.type || 'functional');
      setEditedStatus(testCase.status || 'NOT_EXECUTED');
      setEditedPriority(testCase.priority || 'medium');
      setEditedPrecondition(testCase.precondition || '');
      setEditedSteps(testCase.steps || '');
      setEditedExpectedResult(testCase.expected_result || '');
      setEditedCategoryId(testCase.category_id);
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    confirm({
      title: '确认删除',
      content: `确定删除测试用例 "${testCase?.case_number}" 吗？`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => deleteMutation.mutate(testCaseId),
    });
  };

  const handleStatusChange = (newStatus) => {
    updateMutation.mutate({ status: newStatus });
  };

  const getTypeTag = (type) => {
    const opt = typeOptions.find(o => o.value === type);
    return opt ? <Tag color={opt.color}>{opt.label}</Tag> : type;
  };

  const getPriorityTag = (priority) => {
    const opt = priorityOptions.find(o => o.value === priority);
    return opt ? <Tag color={opt.color}>{opt.label}</Tag> : priority;
  };

  // 构建右侧边栏信息
  const sidebarItems = testCase ? [
    {
      label: '用例类型',
      icon: <FolderOutlined />,
      value: isEditing ? (
        <Select
          value={editedType}
          onChange={setEditedType}
          style={{ width: '100%' }}
          size="small"
          options={typeOptions}
        />
      ) : getTypeTag(testCase.type),
    },
    {
      label: '用例等级',
      icon: <FolderOutlined />,
      value: isEditing ? (
        <Select
          value={editedPriority}
          onChange={setEditedPriority}
          style={{ width: '100%' }}
          size="small"
          options={priorityOptions}
        />
      ) : getPriorityTag(testCase.priority),
    },
    {
      label: '所属目录',
      icon: <FolderOutlined />,
      value: isEditing ? (
        <TreeSelect
          value={editedCategoryId}
          onChange={setEditedCategoryId}
          treeData={categoryTreeData}
          style={{ width: '100%' }}
          size="small"
          placeholder="选择目录"
          allowClear
          treeLine
        />
      ) : (testCase.category?.name || '未分类'),
    },
    {
      label: '创建人',
      icon: <UserOutlined />,
      value: testCase.creator?.username || '-',
    },
    {
      label: '创建时间',
      icon: <CalendarOutlined />,
      value: new Date(testCase.created_at).toLocaleString('zh-CN'),
    },
    {
      label: '更新时间',
      icon: <ClockCircleOutlined />,
      value: new Date(testCase.updated_at).toLocaleString('zh-CN'),
    },
  ] : [];

  // 详细信息内容
  const renderDetailContent = () => (
    <div className="testcase-detail-content">
      <div className="detail-drawer-section">
        <div className="detail-drawer-section-title">前置条件</div>
        {isEditing ? (
          <RichTextEditor
            value={editedPrecondition}
            onChange={(val) => setEditedPrecondition(val || '')}
            height={150}
            placeholder="输入前置条件..."
          />
        ) : (
          <div className="detail-drawer-description">
            {testCase?.precondition ? (
              <HtmlContent content={testCase.precondition} />
            ) : (
              <span className="empty-text">暂无前置条件</span>
            )}
          </div>
        )}
      </div>

      <div className="detail-drawer-section">
        <div className="detail-drawer-section-title">测试步骤</div>
        {isEditing ? (
          <RichTextEditor
            value={editedSteps}
            onChange={(val) => setEditedSteps(val || '')}
            height={200}
            placeholder="输入测试步骤..."
          />
        ) : (
          <div className="detail-drawer-description">
            {testCase?.steps ? (
              <HtmlContent content={testCase.steps} />
            ) : (
              <span className="empty-text">暂无测试步骤</span>
            )}
          </div>
        )}
      </div>

      <div className="detail-drawer-section">
        <div className="detail-drawer-section-title">预期结果</div>
        {isEditing ? (
          <RichTextEditor
            value={editedExpectedResult}
            onChange={(val) => setEditedExpectedResult(val || '')}
            height={150}
            placeholder="输入预期结果..."
          />
        ) : (
          <div className="detail-drawer-description">
            {testCase?.expected_result ? (
              <HtmlContent content={testCase.expected_result} />
            ) : (
              <span className="empty-text">暂无预期结果</span>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // 需求内容
  const renderRequirementContent = () => (
    <div>
      {testCase?.requirement ? (
        <div className="detail-drawer-section">
          <div style={{ marginBottom: 8 }}>
            <Tag color="blue">{testCase.requirement.requirement_number}</Tag>
            <span style={{ fontWeight: 500, marginLeft: 8 }}>{testCase.requirement.title}</span>
          </div>
        </div>
      ) : (
        <Empty description="未关联需求" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}
    </div>
  );

  // 字段名称映射
  const fieldLabels = {
    status: '状态',
    priority: '等级',
    type: '类型',
    name: '名称',
    precondition: '前置条件',
    steps: '测试步骤',
    expected_result: '预期结果',
    category_id: '所属目录',
    requirement_id: '关联需求',
  };

  const statusLabels = {
    'PASSED': '通过',
    'FAILED': '不通过',
    'NOT_EXECUTED': '未执行',
    'passed': '通过',
    'failed': '不通过',
    'not_executed': '未执行',
  };

  const priorityLabels = {
    high: '高',
    medium: '中',
    low: '低',
  };

  const typeLabels = {
    functional: '功能测试',
    performance: '性能测试',
    security: '安全测试',
    compatibility: '兼容性测试',
    smoke: '冒烟测试',
    regression: '回归测试',
  };

  const getReadableValue = (field, value) => {
    if (!value || value === 'None') return '无';
    if (field === 'status') return statusLabels[value] || value;
    if (field === 'priority') return priorityLabels[value] || value;
    if (field === 'type') return typeLabels[value] || value;
    return value;
  };

  // 操作历史内容
  const renderHistoryContent = () => (
    <div>
      {history && history.length > 0 ? (
        <Timeline
          items={history.map((item) => ({
            key: item.id,
            dot: <HistoryOutlined style={{ fontSize: 16, color: '#1890ff' }} />,
            children: (
              <div>
                <div style={{ color: '#666', fontSize: 12, marginBottom: 4 }}>
                  {new Date(item.changed_at).toLocaleString('zh-CN')}
                </div>
                <div>
                  <span style={{ fontWeight: 500, color: '#1890ff' }}>
                    {item.user?.username || '系统'}
                  </span>
                  <span style={{ marginLeft: 8 }}>
                    修改了 <strong>{fieldLabels[item.field] || item.field}</strong>
                  </span>
                </div>
                <div style={{ marginTop: 4, fontSize: 13, color: '#666' }}>
                  <span style={{ textDecoration: 'line-through', color: '#999' }}>
                    {getReadableValue(item.field, item.old_value)}
                  </span>
                  <span style={{ margin: '0 8px' }}>→</span>
                  <span style={{ color: '#52c41a', fontWeight: 500 }}>
                    {getReadableValue(item.field, item.new_value)}
                  </span>
                </div>
              </div>
            ),
          }))}
        />
      ) : (
        <Empty description="暂无操作历史" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}
    </div>
  );

  // 标签页配置
  const tabs = [
    {
      key: 'detail',
      label: '详细信息',
      children: renderDetailContent(),
    },
    {
      key: 'requirement',
      label: '需求',
      children: renderRequirementContent(),
    },
    {
      key: 'history',
      label: '操作历史',
      children: renderHistoryContent(),
    },
  ];

  // 额外操作按钮
  const extraActions = (
    <>
      <Button
        type="text"
        size="small"
        icon={<CopyOutlined />}
        onClick={() => copyMutation.mutate()}
        loading={copyMutation.isPending}
        title="复制"
      />
      <Popconfirm
        title="确认删除"
        description={`确定删除测试用例 "${testCase?.case_number}" 吗？`}
        onConfirm={() => deleteMutation.mutate(testCaseId)}
        okText="删除"
        okType="danger"
        cancelText="取消"
      >
        <Button
          type="text"
          size="small"
          danger
          icon={<DeleteOutlined />}
          loading={deleteMutation.isPending}
          title="删除"
        />
      </Popconfirm>
    </>
  );

  return (
    <DetailDrawer
      visible={open}
      onClose={onClose}
      title={testCase?.name}
      number={testCase?.case_number}
      status={testCase?.status}
      statusOptions={statusOptions}
      onStatusChange={handleStatusChange}
      loading={isLoading}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      sidebarItems={sidebarItems}
      editable={true}
      isEditing={isEditing}
      onEdit={() => setIsEditing(true)}
      onSave={handleSave}
      onCancelEdit={handleCancelEdit}
      saving={updateMutation.isPending}
      editedTitle={editedName}
      onTitleChange={setEditedName}
      extraActions={extraActions}
      onPrev={onPrev}
      onNext={onNext}
      hasPrev={hasPrev}
      hasNext={hasNext}
    />
  );
};

export default TestCaseDetail;
