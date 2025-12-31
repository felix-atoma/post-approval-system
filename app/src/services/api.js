import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

// Request interceptor - add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Log error for debugging
    console.error('API Error:', {
      status: error.response?.status,
      data: error.response?.data,
      url: originalRequest.url
    });
    
    // Handle 400 Bad Request (Validation errors)
    if (error.response?.status === 400) {
      const errorData = error.response.data;
      
      if (errorData.error?.details) {
        // Validation errors with details
        const firstError = errorData.error.details[0];
        toast.error(firstError.message || 'Validation error');
      } else if (errorData.error?.message) {
        // General error message
        toast.error(errorData.error.message);
      } else {
        toast.error('Validation failed');
      }
      return Promise.reject(error);
    }
    
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      const errorData = error.response.data;
      
      // Password reset required
      if (errorData.code === 'PASSWORD_RESET_REQUIRED' || errorData.passwordReset) {
        localStorage.setItem('pendingUserId', errorData.userId);
        window.location.href = '/create-password';
        return Promise.reject(error);
      }
      
      // Token expired - try refresh
      if (errorData.error?.code === 'TOKEN_EXPIRED' && !originalRequest._retry) {
        originalRequest._retry = true;
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (refreshToken) {
          try {
            const refreshResponse = await api.post('/auth/refresh-token', { 
              refreshToken 
            });
            
            if (refreshResponse.data.success) {
              localStorage.setItem('token', refreshResponse.data.accessToken);
              localStorage.setItem('refreshToken', refreshResponse.data.refreshToken);
              
              originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.accessToken}`;
              return api(originalRequest);
            }
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
          }
        }
      }
      
      // Show error message
      toast.error(errorData.error?.message || 'Please login again');
      
      // Clear storage and redirect
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('pendingUserId');
      
      setTimeout(() => {
        window.location.href = '/login';
      }, 1000);
      
      return Promise.reject(error);
    }
    
    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      const errorData = error.response.data;
      toast.error(errorData.error?.message || 'Access forbidden');
      return Promise.reject(error);
    }
    
    // Handle 404 Not Found
    if (error.response?.status === 404) {
      toast.error('Resource not found');
      return Promise.reject(error);
    }
    
    // Handle 500 Internal Server Error
    if (error.response?.status === 500) {
      toast.error('Server error. Please try again later.');
      return Promise.reject(error);
    }
    
    // Handle network errors
    if (!error.response) {
      toast.error('Network error. Please check your connection.');
    }
    
    return Promise.reject(error);
  }
);

export default api;