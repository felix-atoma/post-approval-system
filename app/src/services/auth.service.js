import api from './api';

export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  
  createPassword: (userId, password) => 
    api.post('/auth/create-password', { userId, password }),
  
  logout: (refreshToken) => api.post('/auth/logout', { refreshToken }),
  
  getProfile: () => api.get('/auth/profile'),
  
  updateProfile: (data) => api.put('/auth/profile', data)
};