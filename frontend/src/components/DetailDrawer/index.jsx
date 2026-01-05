import { useState } from 'react';
import { Drawer, Tabs, Button, Spin, Select, Input } from 'antd';
import { EditOutlined, ExpandOutlined, CompressOutlined } from '@ant-design/icons';
import './index.css';

/**
 * 通用详情抽屉布局组件
 * 
 * @param {Object} props
 * @param {boolean} props.visible - 是否显示抽屉
 * @param {Function} props.onClose - 关闭抽屉回调
 * @param {string} props.title - 标题（如：BUG-001 - 登录页面显示异常）
 * @param {string} props.number - 编号（如：BUG-001）
 * @param {React.ReactNode} props.statusTag - 状态标签
 * @param {boolean} props.loading - 加载状态
 * @param {number} props.width - 抽屉宽度，默认 1000
 * @param {Array} props.tabs - 标签页配置 [{ key, label, children, badge }]
 * @param {string} props.activeTab - 当前激活的标签页
 * @param {Function} props.onTabChange - 标签页切换回调
 * @param {React.ReactNode} props.mainContent - 主内容区（左侧）
 * @param {Array} props.sidebarItems - 右侧边栏项 [{ label, value, icon }]
 * @param {React.ReactNode} props.sidebarExtra - 右侧边栏额外内容
 * @param {boolean} props.editable - 是否显示编辑按钮
 * @param {boolean} props.isEditing - 是否处于编辑状态
 * @param {Function} props.onEdit - 编辑按钮回调
 * @param {Function} props.onSave - 保存按钮回调
 * @param {Function} props.onCancelEdit - 取消编辑回调
 * @param {boolean} props.saving - 保存中状态
 * @param {React.ReactNode} props.extraActions - 额外的操作按钮
 * @param {boolean} props.showSidebar - 是否显示右侧边栏，默认 true
 * @param {string} props.editedTitle - 编辑中的标题
 * @param {Function} props.onTitleChange - 标题改变回调
 */
/**
 * @param {Object} props
 * @param {string} props.status - 当前状态值
 * @param {Array} props.statusOptions - 状态选项 [{ value, label, color }]
 * @param {Function} props.onStatusChange - 状态改变回调
 */
const DetailDrawer = ({
  visible,
  onClose,
  title,
  number,
  status,
  statusOptions = [],
  onStatusChange,
  loading = false,
  width = 1000,
  tabs,
  activeTab,
  onTabChange,
  mainContent,
  sidebarItems = [],
  sidebarExtra,
  editable = true,
  isEditing = false,
  onEdit,
  onSave,
  onCancelEdit,
  saving = false,
  extraActions,
  showSidebar = true,
  editedTitle,
  onTitleChange,
}) => {
  const [expanded, setExpanded] = useState(false);

  const currentStatusOption = statusOptions.find(opt => opt.value === status);
  const statusColor = currentStatusOption?.color || 'default';

  const renderHeader = () => (
    <div className="detail-drawer-header">
      <div className="detail-drawer-header-left">
        {statusOptions.length > 0 && (
          <Select
            value={status}
            onChange={onStatusChange}
            className={`detail-drawer-status-select status-${statusColor}`}
            popupClassName="detail-drawer-status-dropdown"
            variant="borderless"
            dropdownStyle={{ minWidth: 120 }}
            options={statusOptions.map(opt => ({
              value: opt.value,
              label: opt.label,
            }))}
          />
        )}
        {number && <span className="detail-drawer-number">ID: {number}</span>}
      </div>
      <div className="detail-drawer-header-center">
        {isEditing && onTitleChange ? (
          <Input
            value={editedTitle}
            onChange={(e) => onTitleChange(e.target.value)}
            className="detail-drawer-title-input"
            placeholder="输入标题"
          />
        ) : (
          <span className="detail-drawer-title">{title}</span>
        )}
      </div>
      <div className="detail-drawer-header-right">
        {editable && (
          isEditing ? (
            <>
              <Button size="small" onClick={onCancelEdit}>取消</Button>
              <Button size="small" type="primary" onClick={onSave} loading={saving}>保存</Button>
            </>
          ) : (
            <Button 
              size="small" 
              icon={<EditOutlined />} 
              onClick={onEdit}
            >
              编辑
            </Button>
          )
        )}
        <Button
          size="small"
          icon={expanded ? <CompressOutlined /> : <ExpandOutlined />}
          onClick={() => setExpanded(!expanded)}
        />
        {extraActions}
      </div>
    </div>
  );

  const renderSidebar = () => (
    <div className="detail-drawer-sidebar">
      <div className="detail-drawer-sidebar-title">基础信息</div>
      <div className="detail-drawer-sidebar-content">
        {sidebarItems.map((item, index) => (
          <div key={index} className="detail-drawer-sidebar-item">
            <div className="detail-drawer-sidebar-label">
              {item.icon && <span className="detail-drawer-sidebar-icon">{item.icon}</span>}
              {item.label}
            </div>
            <div className="detail-drawer-sidebar-value">
              {item.value ?? '-'}
            </div>
          </div>
        ))}
        {sidebarExtra}
      </div>
    </div>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <div className="detail-drawer-loading">
          <Spin size="large" />
        </div>
      );
    }

    return (
      <div className="detail-drawer-body">
        {/* 标签页 */}
        {tabs && tabs.length > 0 && (
          <div className="detail-drawer-tabs-wrapper">
            <Tabs
              activeKey={activeTab}
              onChange={onTabChange}
              className="detail-drawer-tabs"
              items={tabs.map(tab => ({
                key: tab.key,
                label: (
                  <span>
                    {tab.label}
                    {tab.badge !== undefined && tab.badge > 0 && (
                      <span className="detail-drawer-tab-badge">({tab.badge})</span>
                    )}
                  </span>
                ),
              }))}
            />
          </div>
        )}

        {/* 主内容区域 */}
        <div className={`detail-drawer-content ${showSidebar ? 'with-sidebar' : ''}`}>
          <div className="detail-drawer-main">
            {tabs && tabs.length > 0 
              ? tabs.find(t => t.key === activeTab)?.children || mainContent
              : mainContent
            }
          </div>
          {showSidebar && renderSidebar()}
        </div>
      </div>
    );
  };

  return (
    <Drawer
      open={visible}
      onClose={onClose}
      width={expanded ? '90%' : width}
      title={renderHeader()}
      className="detail-drawer"
      closable={false}
      destroyOnClose
      styles={{ mask: { backgroundColor: 'transparent' } }}
    >
      {renderContent()}
    </Drawer>
  );
};

export default DetailDrawer;
