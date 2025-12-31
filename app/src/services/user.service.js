import api from './api';

export const userService = {
  getUsers: (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return api.get(`/users?${queryParams}`);
  },
  
  createUser: (data) => api.post('/users', data),
  
  deleteUser: (id) => api.delete(`/users/${id}`),
  
  getUserStats: () => api.get('/users/stats')
};