// app/src/services/api.js
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'https://post-approval-system-1.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 60000
});

// Store refresh state - SINGLETON PATTERN
let refreshPromise = null;
let isRefreshing = false;
let refreshSubscribers = [];

// Subscribe to token refresh
const subscribeTokenRefresh = (callback) => {
  refreshSubscribers.push(callback);
};

// Notify all subscribers when token is refreshed
const onRefreshed = (token) => {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
};

// Clear all refresh state
const clearRefreshState = () => {
  isRefreshing = false;
  refreshPromise = null;
  refreshSubscribers = [];
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - FIXED: Don't reject backend errors, let components handle them
api.interceptors.response.use(
  (response) => {
    // Check if response follows success/error format
    if (response.data && typeof response.data === 'object') {
      // Backend returns { success: true, message: '...', data: {...} }
      // or { success: false, error: { message: '...', code: '...' } }
      
      // DON'T reject here - let the calling code handle success: false responses
      // This allows Dashboard to check response.success and show appropriate errors
    }
    
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 429 Too Many Requests
    if (error.response?.status === 429) {
      console.warn('Rate limit exceeded, backing off...');
      
      // Don't show toast for rate limits during token refresh
      if (!originalRequest.url.includes('/auth/refresh-token')) {
        toast.error('Too many requests. Please wait a moment.');
      }
      
      // Implement exponential backoff for retries
      if (!originalRequest._retryCount) {
        originalRequest._retryCount = 0;
      }
      
      originalRequest._retryCount++;
      
      if (originalRequest._retryCount <= 3) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, originalRequest._retryCount - 1) * 1000;
        console.log(`Retrying request in ${delay}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return api(originalRequest);
      }
      
      return Promise.reject(error);
    }
    
    // Handle 401 Unauthorized - Token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      const errorData = error.response.data;
      
      // Check both formats: error.error?.code and error.code
      const errorCode = errorData.error?.code || errorData.code;
      
      // Only handle TOKEN_EXPIRED errors
      if (errorCode === 'TOKEN_EXPIRED') {
        
        // If we're already refreshing, queue this request
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            subscribeTokenRefresh((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            });
          });
        }
        
        originalRequest._retry = true;
        isRefreshing = true;
        
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          console.error('No refresh token available');
          clearRefreshState();
          toast.error('Session expired. Please login again.');
          localStorage.clear();
          window.location.href = '/login';
          return Promise.reject(error);
        }
        
        try {
          if (!refreshPromise) {
            refreshPromise = axios.post(
              `${API_URL}/auth/refresh-token`, 
              { refreshToken }
            ).then(response => {
              if (response.data.success && response.data.accessToken) {
                localStorage.setItem('token', response.data.accessToken);
                if (response.data.refreshToken) {
                  localStorage.setItem('refreshToken', response.data.refreshToken);
                }
                
                // Notify all queued requests
                onRefreshed(response.data.accessToken);
                return response.data.accessToken;
              }
              throw new Error(response.data.error?.message || 'No access token in response');
            }).catch(refreshError => {
              console.error('Token refresh failed:', refreshError);
              
              // Clear tokens on refresh failure
              localStorage.removeItem('token');
              localStorage.removeItem('refreshToken');
              
              // Don't show toast for rate limit errors during refresh
              if (refreshError.response?.status !== 429) {
                toast.error('Session expired. Please login again.');
                window.location.href = '/login';
              }
              
              throw refreshError;
            }).finally(() => {
              clearRefreshState();
            });
          }
          
          // Wait for the refresh to complete
          const newToken = await refreshPromise;
          
          // Update the original request with new token
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          
          // Retry the original request
          return api(originalRequest);
        } catch (refreshError) {
          // If refresh failed, reject all queued requests
          clearRefreshState();
          return Promise.reject(refreshError);
        }
      }
      
      // Other 401 errors - logout immediately
      if (errorCode === 'INVALID_TOKEN' || 
          errorCode === 'ACCESS_TOKEN_REQUIRED' ||
          errorCode === 'USER_NOT_FOUND') {
        localStorage.clear();
        toast.error('Please login again');
        window.location.href = '/login';
      }
    }
    
    // Handle 403 Forbidden (refresh token errors)
    if (error.response?.status === 403) {
      const errorData = error.response.data;
      const errorCode = errorData.error?.code || errorData.code;
      const errorMessage = errorData.error?.message || errorData.message;
      
      if (errorCode?.includes('REFRESH_TOKEN') || 
          errorCode?.includes('TOKEN') ||
          errorMessage?.includes('expired') ||
          errorMessage?.includes('invalid')) {
        
        localStorage.clear();
        toast.error('Session expired. Please login again.');
        window.location.href = '/login';
        return Promise.reject(error);
      }
      
      toast.error(errorMessage || 'Access forbidden');
    }
    
    // Handle 400 Bad Request - FIXED: Only show toast for validation errors
    if (error.response?.status === 400) {
      const errorData = error.response.data;
      
      // Handle different response formats
      if (errorData.error?.details) {
        // Validation errors: { error: { details: [{ message: '...' }] } }
        const messages = errorData.error.details.map(detail => detail.message);
        toast.error(messages[0] || 'Validation error');
      } else if (errorData.error?.message) {
        // Standard error format: { error: { message: '...' } }
        toast.error(errorData.error.message);
      } else if (errorData.message) {
        // Simple error format: { message: '...' }
        toast.error(errorData.message);
      } else {
        toast.error('Bad request');
      }
    }
    
    // Handle 404 Not Found
    if (error.response?.status === 404) {
      const errorData = error.response.data;
      const errorMessage = errorData.error?.message || errorData.message || 'Resource not found';
      toast.error(errorMessage);
    }
    
    // Handle 409 Conflict
    if (error.response?.status === 409) {
      const errorData = error.response.data;
      const errorMessage = errorData.error?.message || errorData.message || 'Conflict occurred';
      toast.error(errorMessage);
    }
    
    // Handle 500 errors
    if (error.response?.status === 500) {
      toast.error('Server error. Please try again.');
    }
    
    // Handle network errors
    if (!error.response) {
      toast.error('Network error. Check your connection.');
    }
    
    // Re-throw the error so the calling code can handle it
    return Promise.reject(error);
  }
);

// Helper function to extract error message
export const getErrorMessage = (error) => {
  if (error.response?.data?.error?.message) {
    return error.response.data.error.message;
  }
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unknown error occurred';
};

// Helper function to extract validation errors
export const getValidationErrors = (error) => {
  if (error.response?.data?.error?.details) {
    return error.response.data.error.details;
  }
  return [];
};

export default api;