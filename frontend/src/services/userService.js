import api from './api';

export const userService = {
  // 获取所有用户
  getUsers: async () => {
    const response = await api.get('/api/users');
    return response.data;
  },

  // 创建用户
  createUser: async (userData) => {
    const response = await api.post('/api/users', userData);
    return response.data;
  },

  // 删除用户
  deleteUser: async (userId) => {
    await api.delete(`/api/users/${userId}`);
  },
};

export default userService;
