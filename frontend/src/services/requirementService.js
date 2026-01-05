import api from './api';

export const requirementService = {
  // 获取项目需求列表
  getRequirements: async (projectId, params = {}) => {
    const response = await api.get(`/api/projects/${projectId}/requirements`, { params });
    return response.data;
  },

  // 创建需求
  createRequirement: async (projectId, reqData) => {
    const response = await api.post(`/api/projects/${projectId}/requirements`, reqData);
    return response.data;
  },

  // 获取需求详情
  getRequirement: async (requirementId) => {
    const response = await api.get(`/api/requirements/${requirementId}`);
    return response.data;
  },

  // 更新需求
  updateRequirement: async (requirementId, reqData) => {
    const response = await api.put(`/api/requirements/${requirementId}`, reqData);
    return response.data;
  },

  // 删除需求
  deleteRequirement: async (requirementId) => {
    await api.delete(`/api/requirements/${requirementId}`);
  },

  // 批量删除需求
  bulkDeleteRequirements: async (requirementIds) => {
    const response = await api.post('/api/requirements/bulk-delete', { requirement_ids: requirementIds });
    return response.data;
  },

  // 批量更新需求状态
  bulkUpdateStatus: async (requirementIds, status) => {
    const response = await api.put('/api/requirements/bulk-status', { requirement_ids: requirementIds, status });
    return response.data;
  },

  // 批量更新需求所属迭代
  bulkUpdateSprint: async (requirementIds, sprintId) => {
    const response = await api.put('/api/requirements/bulk-sprint', { 
      requirement_ids: requirementIds, 
      sprint_id: sprintId 
    });
    return response.data;
  },

  // 获取评论列表
  getComments: async (requirementId) => {
    const response = await api.get(`/api/requirements/${requirementId}/comments`);
    return response.data;
  },

  // 添加评论
  addComment: async (requirementId, content) => {
    const response = await api.post(`/api/requirements/${requirementId}/comments`, { content });
    return response.data;
  },

  // 更新评论
  updateComment: async (requirementId, commentId, content) => {
    const response = await api.put(`/api/requirements/${requirementId}/comments/${commentId}`, { content });
    return response.data;
  },

  // 删除评论
  deleteComment: async (requirementId, commentId) => {
    await api.delete(`/api/requirements/${requirementId}/comments/${commentId}`);
  },
};

export default requirementService;
