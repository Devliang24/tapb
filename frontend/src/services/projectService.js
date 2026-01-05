import api from './api';

export const projectService = {
  // 获取所有项目
  getProjects: async () => {
    const response = await api.get('/api/projects');
    return response.data;
  },

  // 创建项目
  createProject: async (projectData) => {
    const response = await api.post('/api/projects', projectData);
    return response.data;
  },

  // 获取项目详情
  getProject: async (id) => {
    const response = await api.get(`/api/projects/${id}`);
    return response.data;
  },

  // 更新项目
  updateProject: async (id, projectData) => {
    const response = await api.put(`/api/projects/${id}`, projectData);
    return response.data;
  },

  // 删除项目
  deleteProject: async (id) => {
    await api.delete(`/api/projects/${id}`);
  },

  // 获取项目成员
  getProjectMembers: async (id) => {
    const response = await api.get(`/api/projects/${id}/members`);
    return response.data;
  },

  // 添加项目成员
  addProjectMember: async (id, memberData) => {
    const response = await api.post(`/api/projects/${id}/members`, memberData);
    return response.data;
  },

  // 更新项目成员
  updateProjectMember: async (projectId, memberId, memberData) => {
    const response = await api.put(`/api/projects/${projectId}/members/${memberId}`, memberData);
    return response.data;
  },

  // 删除项目成员
  removeProjectMember: async (projectId, memberId) => {
    await api.delete(`/api/projects/${projectId}/members/${memberId}`);
  },

  // 全局搜索：同时搜索需求、任务、缺陷
  globalSearch: async (projectId, query, limit = 10) => {
    const response = await api.get(`/api/projects/${projectId}/search`, {
      params: { q: query, limit }
    });
    return response.data;
  },
};

export default projectService;
