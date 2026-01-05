import api from './api';

export const taskService = {
  // 获取任务列表
  getTasks: async (requirementId, params = {}) => {
    const response = await api.get(`/api/requirements/${requirementId}/tasks`, { params });
    return response.data;
  },

  // 创建任务
  createTask: async (requirementId, taskData) => {
    const response = await api.post(`/api/requirements/${requirementId}/tasks`, taskData);
    return response.data;
  },

  // 获取任务详情
  getTask: async (taskId) => {
    const response = await api.get(`/api/tasks/${taskId}`);
    return response.data;
  },

  // 更新任务
  updateTask: async (taskId, taskData) => {
    const response = await api.put(`/api/tasks/${taskId}`, taskData);
    return response.data;
  },

  // 删除任务
  deleteTask: async (taskId) => {
    await api.delete(`/api/tasks/${taskId}`);
  },

  // 获取评论列表
  getComments: async (taskId) => {
    const response = await api.get(`/api/tasks/${taskId}/comments`);
    return response.data;
  },

  // 添加评论
  addComment: async (taskId, content) => {
    const response = await api.post(`/api/tasks/${taskId}/comments`, { content });
    return response.data;
  },

  // 更新评论
  updateComment: async (taskId, commentId, content) => {
    const response = await api.put(`/api/tasks/${taskId}/comments/${commentId}`, { content });
    return response.data;
  },

  // 删除评论
  deleteComment: async (taskId, commentId) => {
    await api.delete(`/api/tasks/${taskId}/comments/${commentId}`);
  },
};

export default taskService;
