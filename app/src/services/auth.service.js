import api from './api';

export const authService = {
  // Login - 
  login: (email, password) => api.post('/auth/login', { email, password }),
  
  // Create password - 
  createPassword: (userId, password) => 
    api.post('/auth/create-password', { userId, password }),
  
  // Refresh token - 
  refreshToken: (refreshToken) => 
    api.post('/auth/refresh-token', { refreshToken }),
  
  // Logout - 
  logout: (refreshToken) => api.post('/auth/logout', { refreshToken }),
  
  // Get profile - 
  getProfile: () => api.get('/auth/profile'),
  
  // Update profile - 
  updateProfile: (data) => api.put('/auth/profile', data),
  
  // Validate token -
  validateToken: () => api.get('/auth/validate'),
  
  // Logout all devices
  logoutAll: () => api.post('/auth/logout-all'),
  
  // DEBUG endpoints - 
  debugRefreshTokens: () => api.get('/auth/debug/refresh-tokens'),
  debugCooldownStatus: () => api.get('/auth/debug/cooldown-status'),
  debugClearCooldown: (userId) => api.post('/auth/debug/clear-cooldown', { userId })
};