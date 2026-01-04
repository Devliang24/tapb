import { Drawer, Descriptions, Tag, Button, Space } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import requirementService from '../../services/requirementService';

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

const RequirementDetail = ({ requirementId, visible, onClose, onEdit }) => {
  const { data: requirement, isLoading } = useQuery({
    queryKey: ['requirement', requirementId],
    queryFn: () => requirementService.getRequirement(requirementId),
    enabled: !!requirementId && visible,
  });

  return (
    <Drawer
      title={requirement?.requirement_number || '需求详情'}
      open={visible}
      onClose={onClose}
      width={600}
      loading={isLoading}
      extra={
        <Space>
          <Button onClick={() => onEdit?.(requirement)}>
            编辑
          </Button>
        </Space>
      }
    >
      {requirement && (
        <>
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="需求编号">
              {requirement.requirement_number}
            </Descriptions.Item>
            <Descriptions.Item label="标题">{requirement.title}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={statusColors[requirement.status]}>
                {statusLabels[requirement.status]}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="优先级">
              <Tag color={priorityColors[requirement.priority]}>
                {priorityLabels[requirement.priority]}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="创建人">
              {requirement.creator?.username || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="负责人">
              {requirement.assignee?.username || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {new Date(requirement.created_at).toLocaleString('zh-CN')}
            </Descriptions.Item>
            <Descriptions.Item label="更新时间">
              {new Date(requirement.updated_at).toLocaleString('zh-CN')}
            </Descriptions.Item>
          </Descriptions>

          <div style={{ marginTop: 24 }}>
            <h4>需求描述</h4>
            <div
              style={{
                padding: 16,
                background: '#fafafa',
                borderRadius: 4,
                whiteSpace: 'pre-wrap',
              }}
            >
              {requirement.description}
            </div>
          </div>
        </>
      )}
    </Drawer>
  );
};

export default RequirementDetail;
