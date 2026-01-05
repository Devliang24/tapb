import api from './api';

export const bugService = {
  // 获取 Bug 列表
  getBugs: async (params) => {
    const response = await api.get('/api/bugs', { params });
    return response.data;
  },

  // 创建 Bug
  createBug: async (bugData) => {
    const response = await api.post('/api/bugs', bugData);
    return response.data;
  },

  // 获取 Bug 详情
  getBug: async (id) => {
    const response = await api.get(`/api/bugs/${id}`);
    return response.data;
  },

  // 更新 Bug
  updateBug: async (id, bugData) => {
    const response = await api.put(`/api/bugs/${id}`, bugData);
    return response.data;
  },

  // 删除 Bug
  deleteBug: async (id) => {
    await api.delete(`/api/bugs/${id}`);
  },

  // 更新状态
  updateStatus: async (id, status) => {
    const response = await api.put(`/api/bugs/${id}/status`, { status });
    return response.data;
  },

  // 分配处理人
  assignBug: async (id, assignee_id) => {
    const response = await api.put(`/api/bugs/${id}/assign`, { assignee_id });
    return response.data;
  },

  // 批量更新状态
  batchUpdateStatus: async (bug_ids, status) => {
    const response = await api.post('/api/bugs/batch/status', { bug_ids, status });
    return response.data;
  },

  // 批量分配
  batchAssign: async (bug_ids, assignee_id) => {
    const response = await api.post('/api/bugs/batch/assign', { bug_ids, assignee_id });
    return response.data;
  },

  // 批量删除
  batchDelete: async (bug_ids) => {
    await api.post('/api/bugs/batch/delete', { bug_ids });
  },

  // 获取评论列表
  getComments: async (bugId) => {
    const response = await api.get(`/api/bugs/${bugId}/comments`);
    return response.data;
  },

  // 添加评论
  addComment: async (bugId, content) => {
    const response = await api.post(`/api/bugs/${bugId}/comments`, { content });
    return response.data;
  },

  // 更新评论
  updateComment: async (bugId, commentId, content) => {
    const response = await api.put(`/api/bugs/${bugId}/comments/${commentId}`, { content });
    return response.data;
  },

  // 删除评论
  deleteComment: async (bugId, commentId) => {
    await api.delete(`/api/bugs/${bugId}/comments/${commentId}`);
  },

  // 获取操作历史
  getHistory: async (bugId) => {
    const response = await api.get(`/api/bugs/${bugId}/history`);
    return response.data;
  },
};

export default bugService;
