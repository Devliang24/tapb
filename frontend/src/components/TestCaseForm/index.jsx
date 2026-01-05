import { useState, useEffect } from 'react';
import { Drawer, Form, Input, Select, TreeSelect, Button, Space, Row, Col, message } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import testCaseService from '../../services/testCaseService';
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
  { value: 'PASSED', label: '通过' },
  { value: 'FAILED', label: '不通过' },
  { value: 'NOT_EXECUTED', label: '未执行' },
];

const priorityOptions = [
  { value: 'high', label: '高' },
  { value: 'medium', label: '中' },
  { value: 'low', label: '低' },
];

const defaultPrecondition = `<p>输入前置条件...</p>`;
const defaultSteps = `<h4>步骤 1</h4><p></p><h4>步骤 2</h4><p></p>`;
const defaultExpectedResult = `<p>输入预期结果...</p>`;

const TestCaseForm = ({ open, onClose, projectId, testCaseId, categoryId }) => {
  const [form] = Form.useForm();
  const [precondition, setPrecondition] = useState(defaultPrecondition);
  const [steps, setSteps] = useState(defaultSteps);
  const [expectedResult, setExpectedResult] = useState(defaultExpectedResult);
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
    { value: null, title: '未分类', children: [] },
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
        });
        setPrecondition(testCase.precondition || defaultPrecondition);
        setSteps(testCase.steps || defaultSteps);
        setExpectedResult(testCase.expected_result || defaultExpectedResult);
      } else {
        form.resetFields();
        form.setFieldsValue({
          type: 'functional',
          status: 'NOT_EXECUTED',
          priority: 'medium',
          category_id: categoryId || null,
        });
        setPrecondition(defaultPrecondition);
        setSteps(defaultSteps);
        setExpectedResult(defaultExpectedResult);
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
        expected_result: expectedResult,
        project_id: projectId,
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
          status: 'NOT_EXECUTED',
          priority: 'medium',
          category_id: categoryId || null,
        });
        setPrecondition(defaultPrecondition);
        setSteps(defaultSteps);
        setExpectedResult(defaultExpectedResult);
      } else {
        onClose();
      }
    } catch (error) {
      if (error.response) {
        message.error(error.response?.data?.detail || '操作失败');
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

        <Form.Item label="预期结果">
          <MarkdownEditor
            value={expectedResult}
            onChange={(val) => setExpectedResult(val || '')}
            height={150}
          />
        </Form.Item>
      </Form>
    </Drawer>
  );
};

export default TestCaseForm;
