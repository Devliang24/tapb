import { useState, useRef, useEffect } from 'react';
import { Input, Spin, Empty, Tag } from 'antd';
import { SearchOutlined, FileTextOutlined, CheckSquareOutlined, BugOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import projectService from '../../services/projectService';
import './index.css';

const GlobalSearch = ({ projectId, onRequirementClick, onTaskClick, onBugClick }) => {
  const [searchText, setSearchText] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['globalSearch', projectId, searchText],
    queryFn: () => projectService.globalSearch(projectId, searchText, 8),
    enabled: !!projectId && searchText.length >= 1,
    staleTime: 30000,
  });

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (value) => {
    setSearchText(value);
    setShowDropdown(value.length >= 1);
  };

  const handleItemClick = (item) => {
    setShowDropdown(false);
    setSearchText('');
    if (item.type === 'requirement') {
      onRequirementClick?.(item);
    } else if (item.type === 'task') {
      onTaskClick?.(item);
    } else if (item.type === 'bug') {
      onBugClick?.(item.id);
    }
  };

  const getStatusColor = (status, type) => {
    if (type === 'requirement') {
      const colors = { draft: 'default', approved: 'blue', in_progress: 'purple', completed: 'green', cancelled: 'red' };
      return colors[status] || 'default';
    }
    if (type === 'task') {
      const colors = { todo: 'default', in_progress: 'blue', done: 'green' };
      return colors[status] || 'default';
    }
    if (type === 'bug') {
      const colors = { new: 'blue', confirmed: 'orange', in_progress: 'purple', resolved: 'green', closed: 'default', reopened: 'red' };
      return colors[status] || 'default';
    }
    return 'default';
  };

  const getStatusLabel = (status, type) => {
    if (type === 'requirement') {
      const labels = { draft: '草稿', approved: '已批准', in_progress: '进行中', completed: '已完成', cancelled: '已取消' };
      return labels[status] || status;
    }
    if (type === 'task') {
      const labels = { todo: '待处理', in_progress: '进行中', done: '已完成' };
      return labels[status] || status;
    }
    if (type === 'bug') {
      const labels = { new: '新建', confirmed: '已确认', in_progress: '处理中', resolved: '已解决', closed: '已关闭', reopened: '重开' };
      return labels[status] || status;
    }
    return status;
  };

  const hasResults = searchResults && (
    searchResults.requirements?.length > 0 ||
    searchResults.tasks?.length > 0 ||
    searchResults.bugs?.length > 0
  );

  const renderSection = (title, icon, items, type) => {
    if (!items || items.length === 0) return null;
    return (
      <div className="search-section">
        <div className="search-section-title">
          {icon}
          <span>{title}</span>
          <span className="search-section-count">{items.length}</span>
        </div>
        <div className="search-section-items">
          {items.map((item) => (
            <div
              key={`${type}-${item.id}`}
              className="search-result-item"
              onClick={() => handleItemClick(item)}
            >
              <span className="search-item-number">{item.number}</span>
              <span className="search-item-title">{item.title}</span>
              <Tag color={getStatusColor(item.status, type)} size="small">
                {getStatusLabel(item.status, type)}
              </Tag>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="global-search-container" ref={containerRef}>
      <Input
        ref={inputRef}
        placeholder="搜索需求、任务、缺陷..."
        prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
        value={searchText}
        onChange={(e) => handleSearch(e.target.value)}
        onFocus={() => searchText.length >= 1 && setShowDropdown(true)}
        className="global-search-input"
        allowClear
      />
      
      {showDropdown && (
        <div className="global-search-dropdown">
          {isLoading ? (
            <div className="search-loading">
              <Spin size="small" />
              <span>搜索中...</span>
            </div>
          ) : hasResults ? (
            <div className="search-results">
              {renderSection('需求', <FileTextOutlined />, searchResults.requirements, 'requirement')}
              {renderSection('任务', <CheckSquareOutlined />, searchResults.tasks, 'task')}
              {renderSection('缺陷', <BugOutlined />, searchResults.bugs, 'bug')}
            </div>
          ) : searchText.length >= 1 ? (
            <Empty 
              image={Empty.PRESENTED_IMAGE_SIMPLE} 
              description="未找到匹配结果"
              className="search-empty"
            />
          ) : null}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
