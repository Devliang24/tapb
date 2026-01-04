import api from './api';

export const sprintService = {
  // 获取项目迭代列表
  getSprints: async (projectId, params = {}) => {
    const response = await api.get(`/api/projects/${projectId}/sprints`, { params });
    return response.data;
  },

  // 创建迭代
  createSprint: async (projectId, sprintData) => {
    const response = await api.post(`/api/projects/${projectId}/sprints`, sprintData);
    return response.data;
  },

  // 获取迭代详情
  getSprint: async (sprintId) => {
    const response = await api.get(`/api/sprints/${sprintId}`);
    return response.data;
  },

  // 更新迭代
  updateSprint: async (sprintId, sprintData) => {
    const response = await api.put(`/api/sprints/${sprintId}`, sprintData);
    return response.data;
  },

  // 删除迭代
  deleteSprint: async (sprintId) => {
    await api.delete(`/api/sprints/${sprintId}`);
  },

  // 获取迭代统计数据
  getSprintStats: async (sprintId) => {
    const response = await api.get(`/api/sprints/${sprintId}/stats`);
    return response.data;
  },
};

export default sprintService;
