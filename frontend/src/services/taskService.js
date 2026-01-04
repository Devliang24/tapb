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
};

export default taskService;
