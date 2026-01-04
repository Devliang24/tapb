import { useEffect } from 'react';
import { Drawer, Form, Input, Select, Button, Space, DatePicker, message } from 'antd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import sprintService from '../../services/sprintService';

const { TextArea } = Input;

const SprintForm = ({ visible, onClose, projectId, sprint = null }) => {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const isEdit = !!sprint;

  useEffect(() => {
    if (visible) {
      if (sprint) {
        form.setFieldsValue({
          name: sprint.name,
          goal: sprint.goal,
          status: sprint.status,
          dates: sprint.start_date && sprint.end_date
            ? [dayjs(sprint.start_date), dayjs(sprint.end_date)]
            : null,
        });
      } else {
        form.resetFields();
      }
    }
  }, [visible, sprint, form]);

  const createMutation = useMutation({
    mutationFn: (data) => sprintService.createSprint(projectId, data),
    onSuccess: () => {
      message.success('迭代创建成功！');
      queryClient.invalidateQueries(['sprints', projectId]);
      onClose();
    },
    onError: (error) => {
      message.error(error.response?.data?.detail || '创建失败');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => sprintService.updateSprint(sprint.id, data),
    onSuccess: () => {
      message.success('迭代更新成功！');
      queryClient.invalidateQueries(['sprints', projectId]);
      onClose();
    },
    onError: (error) => {
      message.error(error.response?.data?.detail || '更新失败');
    },
  });

  const handleSubmit = async (values) => {
    const data = {
      name: values.name,
      goal: values.goal,
      start_date: values.dates?.[0]?.format('YYYY-MM-DD'),
      end_date: values.dates?.[1]?.format('YYYY-MM-DD'),
    };

    if (isEdit) {
      data.status = values.status;
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Drawer
      title={isEdit ? '编辑迭代' : '创建迭代'}
      open={visible}
      onClose={onClose}
      width={500}
      extra={
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button
            type="primary"
            onClick={() => form.submit()}
            loading={createMutation.isPending || updateMutation.isPending}
          >
            {isEdit ? '保存' : '创建'}
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="name"
          label="迭代名称"
          rules={[{ required: true, message: '请输入迭代名称' }]}
        >
          <Input placeholder="例如：Sprint 1" />
        </Form.Item>

        <Form.Item name="dates" label="迭代周期">
          <DatePicker.RangePicker style={{ width: '100%' }} />
        </Form.Item>

        {isEdit && (
          <Form.Item name="status" label="状态">
            <Select>
              <Select.Option value="planning">规划中</Select.Option>
              <Select.Option value="active">进行中</Select.Option>
              <Select.Option value="completed">已完成</Select.Option>
            </Select>
          </Form.Item>
        )}

        <Form.Item name="goal" label="迭代目标">
          <TextArea rows={4} placeholder="描述本迭代要达成的目标" />
        </Form.Item>
      </Form>
    </Drawer>
  );
};

export default SprintForm;
