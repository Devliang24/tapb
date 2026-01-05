import { Progress, Avatar } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import sprintService from '../../services/sprintService';
import './index.css';

// 迭代图标颜色
const iconColors = [
  '#1890ff', '#52c41a', '#faad14', '#722ed1', 
  '#eb2f96', '#13c2c2', '#fa541c', '#2f54eb'
];

const SprintCard = ({ sprint, selected, onClick, onEdit }) => {
  const { data: stats } = useQuery({
    queryKey: ['sprintStats', sprint.id],
    queryFn: () => sprintService.getSprintStats(sprint.id),
    enabled: !!sprint.id,
    retry: false,
    staleTime: Infinity,
  });

  const percentage = stats?.total_requirements > 0 
    ? Math.round((stats.completed_requirements / stats.total_requirements) * 100)
    : 0;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return dateStr.split('T')[0]; // 直接取日期部分 YYYY-MM-DD
  };

  // 根据 sprint.id 选择一个颜色
  const iconColor = iconColors[sprint.id % iconColors.length];
  const initial = sprint.name?.charAt(0) || 'S';

  const isActive = sprint.status === 'active' || sprint.status === 'in_progress';

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit?.(sprint);
  };

  return (
    <div 
      className={`sprint-card ${selected ? 'selected' : ''}`}
      onClick={() => onClick?.(sprint)}
    >
      <div className="sprint-card-actions">
        <EditOutlined className="sprint-card-edit-icon" onClick={handleEdit} />
      </div>
      {isActive && <div className="sprint-card-badge">当前</div>}
      <div className="sprint-card-body">
        <div className="sprint-card-icon">
          <Avatar 
            size={32} 
            style={{ backgroundColor: iconColor, fontSize: 14 }}
          >
            {initial}
          </Avatar>
        </div>
        <div className="sprint-card-info">
          <div className="sprint-card-name">{sprint.name}</div>
          <div className="sprint-card-dates">
            {formatDate(sprint.start_date)} ~ {formatDate(sprint.end_date)}
          </div>
          <div className="sprint-card-stats">
            <span className="sprint-card-percentage">{percentage}%</span>
            <Progress 
              percent={percentage} 
              showInfo={false}
              strokeColor="#52c41a"
              trailColor="#f0f0f0"
              size="small"
              style={{ width: 60, margin: '0 8px' }}
            />
            <span className="sprint-card-count">
              数量{stats?.completed_requirements || 0}/{stats?.total_requirements || 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SprintCard;
