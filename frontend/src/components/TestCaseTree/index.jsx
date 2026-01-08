import { useState } from 'react';
import { Tree, Dropdown, Modal, Input, message } from 'antd';
import { FolderOutlined, FolderOpenOutlined, PlusOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import testCaseService from '../../services/testCaseService';
import './index.css';

const { confirm } = Modal;

const TestCaseTree = ({ projectId, selectedCategoryId, onSelectCategory }) => {
  const [expandedKeys, setExpandedKeys] = useState(['all']);
  const [editingKey, setEditingKey] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [addingParentId, setAddingParentId] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const queryClient = useQueryClient();

  const { data: categories = [] } = useQuery({
    queryKey: ['testCaseCategories', projectId],
    queryFn: () => testCaseService.getCategories(projectId),
    enabled: !!projectId,
  });

  const createMutation = useMutation({
    mutationFn: testCaseService.createCategory,
    onSuccess: () => {
      message.success('目录创建成功');
      queryClient.invalidateQueries({ queryKey: ['testCaseCategories', projectId] });
      setAddingParentId(null);
      setNewCategoryName('');
    },
    onError: (error) => {
      message.error(error.response?.data?.detail || '创建失败');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => testCaseService.updateCategory(id, data),
    onSuccess: () => {
      message.success('目录更新成功');
      queryClient.invalidateQueries({ queryKey: ['testCaseCategories', projectId] });
      setEditingKey(null);
      setEditingName('');
    },
    onError: (error) => {
      message.error(error.response?.data?.detail || '更新失败');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: testCaseService.deleteCategory,
    onSuccess: () => {
      message.success('目录删除成功');
      queryClient.invalidateQueries({ queryKey: ['testCaseCategories', projectId] });
      if (selectedCategoryId) {
        onSelectCategory(null);
      }
    },
    onError: (error) => {
      message.error(error.response?.data?.detail || '删除失败');
    },
  });

  // 构建树形数据
  const buildTreeData = (items, parentId = null) => {
    return items
      .filter(item => item.parent_id === parentId)
      .map(item => ({
        key: item.id,
        title: editingKey === item.id ? (
          <Input
            size="small"
            value={editingName}
            onChange={(e) => setEditingName(e.target.value)}
            onPressEnter={() => handleRename(item.id)}
            onBlur={() => handleRename(item.id)}
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          item.name
        ),
        icon: ({ expanded }) => expanded ? <FolderOpenOutlined /> : <FolderOutlined />,
        children: buildTreeData(items, item.id),
        isLeaf: !items.some(i => i.parent_id === item.id),
      }));
  };

  const treeData = [
    {
      key: 'all',
      title: '所有用例',
      icon: <FolderOutlined />,
      children: buildTreeData(categories),
    },
  ];

  const handleSelect = (selectedKeys) => {
    if (selectedKeys.length > 0) {
      const key = selectedKeys[0];
      onSelectCategory(key === 'all' ? null : key);
    }
  };

  const handleRename = (id) => {
    if (editingName.trim()) {
      updateMutation.mutate({ id, data: { name: editingName.trim() } });
    } else {
      setEditingKey(null);
      setEditingName('');
    }
  };

  const handleAddCategory = (parentId) => {
    if (newCategoryName.trim()) {
      createMutation.mutate({
        name: newCategoryName.trim(),
        parent_id: parentId === 'all' ? null : parentId,
        project_id: projectId,
      });
    }
  };

  const handleDelete = (id, name) => {
    confirm({
      title: '确认删除',
      content: `确定删除目录 "${name}" 吗？该目录下的用例将移至未分类。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => deleteMutation.mutate(id),
    });
  };

  const getContextMenuItems = (node) => {
    const items = [
      {
        key: 'add',
        label: '新建子目录',
        onClick: () => {
          setAddingParentId(node.key);
          setExpandedKeys(prev => [...new Set([...prev, node.key])]);
        },
      },
    ];

    if (node.key !== 'all') {
      items.push(
        {
          key: 'rename',
          label: '重命名',
          onClick: () => {
            const category = categories.find(c => c.id === node.key);
            setEditingKey(node.key);
            setEditingName(category?.name || '');
          },
        },
        {
          key: 'delete',
          label: '删除',
          danger: true,
          onClick: () => {
            const category = categories.find(c => c.id === node.key);
            handleDelete(node.key, category?.name);
          },
        }
      );
    }

    return items;
  };

  const renderTreeNodes = (data) => {
    return data.map(node => {
      const children = node.children ? renderTreeNodes(node.children) : [];
      
      // 如果正在添加子目录
      if (addingParentId === node.key) {
        children.push({
          key: 'new-category',
          title: (
            <Input
              size="small"
              placeholder="输入目录名称"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onPressEnter={() => handleAddCategory(node.key)}
              onBlur={() => {
                if (newCategoryName.trim()) {
                  handleAddCategory(node.key);
                } else {
                  setAddingParentId(null);
                }
              }}
              autoFocus
              style={{ width: 120 }}
            />
          ),
          icon: <FolderOutlined />,
          isLeaf: true,
          selectable: false,
        });
      }

      return {
        ...node,
        children: children.length > 0 ? children : undefined,
        isLeaf: children.length === 0 && node.key !== 'all',
      };
    });
  };

  return (
    <div className="testcase-tree">
      <div className="tree-header">
        <span className="tree-title">用例目录</span>
        <PlusOutlined
          className="add-root-btn"
          onClick={() => {
            setAddingParentId('all');
            setExpandedKeys(prev => [...new Set([...prev, 'all'])]);
          }}
        />
      </div>
      <Tree
        showIcon
        blockNode
        expandedKeys={expandedKeys}
        onExpand={setExpandedKeys}
        selectedKeys={[selectedCategoryId || 'all']}
        onSelect={handleSelect}
        treeData={renderTreeNodes(treeData)}
        titleRender={(nodeData) => (
          <Dropdown
            menu={{ items: getContextMenuItems(nodeData) }}
            trigger={['contextMenu']}
          >
            <span className="tree-node-title">{nodeData.title}</span>
          </Dropdown>
        )}
      />
    </div>
  );
};

export default TestCaseTree;
