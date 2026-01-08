import { useState, useEffect } from 'react';
import { Drawer, Form, Input, Select, TreeSelect, Button, Space, Row, Col, message } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import testCaseService from '../../services/testCaseService';
import requirementService from '../../services/requirementService';
import sprintService from '../../services/sprintService';
import MarkdownEditor from '../MarkdownEditor';
import './index.css';

const typeOptions = [
  { value: 'functional', label: '功能测试' },
  { value: 'performance', label: '性能测试' },
  { value: 'security', label: '安全测试' },
  { value: 'compatibility', label: '兼容性测试' },
  { value: 'smoke', label: '冒烟测试' },
  { value: 'regression', label: '回归测试' },
];

const statusOptions = [
  { value: 'passed', label: '通过' },
  { value: 'failed', label: '不通过' },
  { value: 'not_executed', label: '未执行' },
];

const priorityOptions = [
  { value: 'high', label: '高' },
  { value: 'medium', label: '中' },
  { value: 'low', label: '低' },
];

const defaultPrecondition = `<p>输入前置条件...</p>`;
const defaultSteps = `<h4>步骤 1</h4><p></p><h4>步骤 2</h4><p></p>`;
const defaultExpectedResult = `<p>输入预期结果...</p>`;
const defaultTestData = ``;
const defaultActualResult = ``;

const TestCaseForm = ({ open, onClose, projectId, testCaseId, categoryId }) => {
  const [form] = Form.useForm();
  const [precondition, setPrecondition] = useState(defaultPrecondition);
  const [steps, setSteps] = useState(defaultSteps);
  const [testData, setTestData] = useState(defaultTestData);
  const [expectedResult, setExpectedResult] = useState(defaultExpectedResult);
  const [actualResult, setActualResult] = useState(defaultActualResult);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const { data: testCase } = useQuery({
    queryKey: ['testcase', testCaseId],
    queryFn: () => testCaseService.getTestCase(testCaseId),
    enabled: !!testCaseId,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['testCaseCategories', projectId],
    queryFn: () => testCaseService.getCategories(projectId),
    enabled: !!projectId,
  });

  const { data: requirements } = useQuery({
    queryKey: ['requirements', projectId],
    queryFn: () => requirementService.getRequirements(projectId, { page_size: 100 }),
    enabled: !!projectId,
  });

  const { data: sprints = [] } = useQuery({
    queryKey: ['sprints', projectId],
    queryFn: () => sprintService.getSprints(projectId),
    enabled: !!projectId,
  });

  // 构建目录树数据
  const buildTreeData = (items, parentId = null) => {
    return items
      .filter(item => item.parent_id === parentId)
      .map(item => ({
        value: item.id,
        title: item.name,
        children: buildTreeData(items, item.id),
      }));
  };

  const treeData = [
    { value: 0, title: '未分类', children: [] },
    ...buildTreeData(categories),
  ];

  useEffect(() => {
    if (open) {
      if (testCase && testCaseId) {
        form.setFieldsValue({
          name: testCase.name,
          type: testCase.type,
          status: testCase.status,
          priority: testCase.priority,
          category_id: testCase.category_id,
          requirement_id: testCase.requirement_id,
          sprint_id: testCase.sprint_id,
          module: testCase.module,
          feature: testCase.feature,
        });
        setPrecondition(testCase.precondition || defaultPrecondition);
        setSteps(testCase.steps || defaultSteps);
        setTestData(testCase.test_data || defaultTestData);
        setExpectedResult(testCase.expected_result || defaultExpectedResult);
        setActualResult(testCase.actual_result || defaultActualResult);
      } else {
        form.resetFields();
        form.setFieldsValue({
          type: 'functional',
          status: 'not_executed',
          priority: 'medium',
          category_id: categoryId || 0,
        });
        setPrecondition(defaultPrecondition);
        setSteps(defaultSteps);
        setTestData(defaultTestData);
        setExpectedResult(defaultExpectedResult);
        setActualResult(defaultActualResult);
      }
    }
  }, [open, testCase, testCaseId, categoryId, form]);

  const handleSubmit = async (shouldContinue = false) => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      const data = {
        ...values,
        precondition,
        steps,
        test_data: testData,
        expected_result: expectedResult,
        actual_result: actualResult,
        project_id: projectId,
        // 将 0 转换回 null（未分类）
        category_id: values.category_id === 0 ? null : values.category_id,
        requirement_id: values.requirement_id || null,
        sprint_id: values.sprint_id || null,
      };

      if (testCaseId) {
        await testCaseService.updateTestCase(testCaseId, data);
        message.success('更新成功');
        queryClient.invalidateQueries(['testcases', projectId]);
        queryClient.invalidateQueries(['testcase', testCaseId]);
      } else {
        await testCaseService.createTestCase(data);
        message.success('创建成功');
        queryClient.invalidateQueries(['testcases', projectId]);
      }

      if (shouldContinue) {
        // 重置表单继续创建
        form.resetFields();
        form.setFieldsValue({
          type: 'functional',
          status: 'not_executed',
          priority: 'medium',
          category_id: categoryId || 0,
        });
        setPrecondition(defaultPrecondition);
        setSteps(defaultSteps);
        setTestData(defaultTestData);
        setExpectedResult(defaultExpectedResult);
        setActualResult(defaultActualResult);
      } else {
        onClose();
      }
    } catch (error) {
      if (error.response) {
        const detail = error.response?.data?.detail;
        const errorMsg = typeof detail === 'string' ? detail : (Array.isArray(detail) ? detail.map(d => d.msg).join(', ') : '操作失败');
        message.error(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAndContinue = () => {
    handleSubmit(true);
  };

  return (
    <Drawer
      title={testCaseId ? '编辑测试用例' : '新建测试用例'}
      open={open}
      onClose={onClose}
      closable={false}
      width="55%"
      extra={
        <Space>
          <Button type="primary" onClick={() => handleSubmit(false)} loading={loading}>
            {testCaseId ? '保存' : '新建'}
          </Button>
          {!testCaseId && (
            <Button onClick={handleCreateAndContinue} loading={loading}>新建并继续</Button>
          )}
          <Button onClick={onClose}>取消</Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        className="testcase-form"
      >
        <Form.Item
          name="name"
          label="用例名称"
          rules={[{ required: true, message: '请输入用例名称' }]}
        >
          <Input placeholder="请输入用例名称" maxLength={200} />
        </Form.Item>

        <Row gutter={16}>
          <Col span={6}>
            <Form.Item
              name="type"
              label="用例类型"
              rules={[{ required: true, message: '请选择用例类型' }]}
            >
              <Select options={typeOptions} placeholder="请选择" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              name="status"
              label="用例状态"
              rules={[{ required: true, message: '请选择用例状态' }]}
            >
              <Select options={statusOptions} placeholder="请选择" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              name="priority"
              label="用例等级"
              rules={[{ required: true, message: '请选择用例等级' }]}
            >
              <Select options={priorityOptions} placeholder="请选择" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              name="category_id"
              label="所属目录"
            >
              <TreeSelect
                treeData={treeData}
                placeholder="请选择"
                allowClear
                treeDefaultExpandAll
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="module"
              label="模块"
            >
              <Input placeholder="请输入模块名称" maxLength={200} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="feature"
              label="功能"
            >
              <Input placeholder="请输入功能名称" maxLength={200} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="requirement_id"
              label="关联需求"
            >
              <Select
                placeholder="请选择关联需求"
                allowClear
                showSearch
                optionFilterProp="children"
              >
                {requirements?.items?.map(req => (
                  <Select.Option key={req.id} value={req.id}>
                    {req.requirement_number} - {req.title}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="sprint_id"
              label="关联迭代"
            >
              <Select
                placeholder="请选择关联迭代"
                allowClear
                showSearch
                optionFilterProp="children"
              >
                {sprints?.items?.map(sprint => (
                  <Select.Option key={sprint.id} value={sprint.id}>
                    {sprint.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="前置条件">
          <MarkdownEditor
            value={precondition}
            onChange={(val) => setPrecondition(val || '')}
            height={120}
          />
        </Form.Item>

        <Form.Item label="测试步骤">
          <MarkdownEditor
            value={steps}
            onChange={(val) => setSteps(val || '')}
            height={200}
          />
        </Form.Item>

        <Form.Item label="测试数据">
          <MarkdownEditor
            value={testData}
            onChange={(val) => setTestData(val || '')}
            height={120}
            placeholder="输入测试数据，如输入参数、测试文件、配置信息等"
          />
        </Form.Item>

        <Form.Item label="预期结果">
          <MarkdownEditor
            value={expectedResult}
            onChange={(val) => setExpectedResult(val || '')}
            height={150}
          />
        </Form.Item>

        <Form.Item label="实际结果">
          <MarkdownEditor
            value={actualResult}
            onChange={(val) => setActualResult(val || '')}
            height={120}
            placeholder="执行测试后填写实际结果"
          />
        </Form.Item>
      </Form>
    </Drawer>
  );
};

export default TestCaseForm;
