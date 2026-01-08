import api from './api';

const testCaseService = {
  // 获取测试用例列表
  getTestCases: async (params = {}) => {
    const response = await api.get('/api/testcases', { params });
    return response.data;
  },

  // 获取单个测试用例
  getTestCase: async (id) => {
    const response = await api.get(`/api/testcases/${id}`);
    return response.data;
  },

  // 创建测试用例
  createTestCase: async (data) => {
    const response = await api.post('/api/testcases', data);
    return response.data;
  },

  // 更新测试用例
  updateTestCase: async (id, data) => {
    const response = await api.put(`/api/testcases/${id}`, data);
    return response.data;
  },

  // 删除测试用例
  deleteTestCase: async (id) => {
    const response = await api.delete(`/api/testcases/${id}`);
    return response.data;
  },

  // 批量删除测试用例
  batchDelete: async (ids) => {
    const response = await api.post('/api/testcases/batch-delete', { ids });
    return response.data;
  },

  // 复制测试用例
  copyTestCase: async (id) => {
    const response = await api.post(`/api/testcases/${id}/copy`);
    return response.data;
  },

  // ========== 目录相关 ==========

  // 获取目录树
  getCategories: async (projectId) => {
    const response = await api.get(`/api/testcases/categories`, { params: { project_id: projectId } });
    return response.data;
  },

  // 创建目录
  createCategory: async (data) => {
    const response = await api.post('/api/testcases/categories', data);
    return response.data;
  },

  // 更新目录
  updateCategory: async (id, data) => {
    const response = await api.put(`/api/testcases/categories/${id}`, data);
    return response.data;
  },

  // 删除目录
  deleteCategory: async (id) => {
    const response = await api.delete(`/api/testcases/categories/${id}`);
    return response.data;
  },

  // 获取操作历史
  getHistory: async (id) => {
    const response = await api.get(`/api/testcases/${id}/history`);
    return response.data;
  },

  // ========== 导入导出 ==========

  // 下载导入模板
  downloadTemplate: () => {
    return api.get('/api/testcases/template', { responseType: 'blob' });
  },

  // 导出测试用例
  exportTestCases: (params) => {
    return api.get('/api/testcases/export', { params, responseType: 'blob' });
  },

  // 导入测试用例
  importTestCases: async (file, projectId) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('project_id', projectId);
    const response = await api.post('/api/testcases/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

export default testCaseService;
