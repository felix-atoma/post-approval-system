import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import toast from 'react-hot-toast';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [tokenExpiry, setTokenExpiry] = useState(null);
  const navigate = useNavigate();

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      if (token && userData) {
        try {
          const decoded = jwtDecode(token);
          
          // Check if token is expired
          if (decoded.exp * 1000 < Date.now()) {
            // Token expired, try to refresh
            await handleTokenRefresh();
          } else {
            setUser(JSON.parse(userData));
            setTokenExpiry(decoded.exp);
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
          logout();
        }
      }
      
      setLoading(false);
    };

    initAuth();
  }, []);

  // Token refresh function
  const handleTokenRefresh = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      logout();
      return false;
    }
    
    try {
      const response = await api.post('/auth/refresh-token', { refreshToken });
      
      if (response.data.success) {
        localStorage.setItem('token', response.data.accessToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        
        const decoded = jwtDecode(response.data.accessToken);
        setTokenExpiry(decoded.exp);
        
        // Get user data from existing storage or fetch fresh
        const userData = localStorage.getItem('user');
        if (userData) {
          setUser(JSON.parse(userData));
        }
        return true;
      } else {
        logout();
        return false;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      return false;
    }
  };

  // Public refreshToken function for components to use
  const refreshToken = useCallback(async () => {
    const refreshTokenValue = localStorage.getItem('refreshToken');
    
    if (!refreshTokenValue) {
      return false;
    }
    
    try {
      const response = await api.post('/auth/refresh-token', { 
        refreshToken: refreshTokenValue 
      });
      
      if (response.data.success) {
        localStorage.setItem('token', response.data.accessToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        
        const decoded = jwtDecode(response.data.accessToken);
        setTokenExpiry(decoded.exp);
        
        // Update token expiry in localStorage for Header component
        localStorage.setItem('tokenExpiry', decoded.exp.toString());
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Refresh token error:', error);
      return false;
    }
  }, []);

  const login = async (email, password) => {
    try {
      setAuthError(null);
      
      const response = await api.post('/auth/login', { 
        email: email.trim().toLowerCase(), 
        password 
      });
      
      console.log('Login response:', response.data);
      
      // Check for password reset required
      if (response.data.passwordReset || response.data.code === 'PASSWORD_RESET_REQUIRED') {
        localStorage.setItem('pendingUserId', response.data.userId);
        navigate('/create-password');
        toast.info('Please set your password to continue');
        return;
      }
      
      // Validate response structure
      if (!response.data.success) {
        throw new Error('Invalid response from server');
      }
      
      if (!response.data.accessToken || !response.data.user) {
        throw new Error('Missing required data in response');
      }
      
      // Store auth data
      localStorage.setItem('token', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      const decoded = jwtDecode(response.data.accessToken);
      localStorage.setItem('tokenExpiry', decoded.exp.toString());
      
      // Update state
      setUser(response.data.user);
      setTokenExpiry(decoded.exp);
      toast.success(response.data.message || 'Login successful!');
      
      // Redirect based on role
      if (response.data.user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
      
      return response.data;
      
    } catch (error) {
      console.error('Login error:', error);
      
      // Set auth error for display
      if (error.response?.data?.error?.message) {
        setAuthError(error.response.data.error.message);
      } else if (error.message) {
        setAuthError(error.message);
      } else {
        setAuthError('Login failed. Please try again.');
      }
      
      throw error;
    }
  };

  const createPassword = async (password) => {
    try {
      const userId = localStorage.getItem('pendingUserId');
      
      if (!userId) {
        throw new Error('No pending password reset found');
      }
      
      const response = await api.post('/auth/create-password', { 
        userId, 
        password 
      });
      
      if (response.data.success) {
        localStorage.removeItem('pendingUserId');
        toast.success(response.data.message || 'Password created successfully!');
        navigate('/login');
      } else {
        throw new Error(response.data.error?.message || 'Failed to create password');
      }
      
    } catch (error) {
      console.error('Create password error:', error);
      
      if (error.response?.data?.error?.message) {
        toast.error(error.response.data.error.message);
      } else {
        toast.error(error.message || 'Failed to create password');
      }
      
      throw error;
    }
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear all storage
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('pendingUserId');
      localStorage.removeItem('tokenExpiry');
      
      // Update state
      setUser(null);
      setAuthError(null);
      setTokenExpiry(null);
      
      // Redirect to login
      navigate('/login');
      toast.success('Logged out successfully');
    }
  };

  const clearAuthError = () => {
    setAuthError(null);
  };

  const value = {
    user,
    loading,
    authError,
    tokenExpiry,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    login,
    createPassword,
    logout,
    clearAuthError,
    refreshToken, // Add this function
    handleTokenRefresh // Keep this for internal use
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};