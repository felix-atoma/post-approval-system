// app/src/services/user.service.js
import api from './api';

class UserService {
  // Get all users (admin only)
  async getAllUsers(page = 1, limit = 10, search = '', role = '') {
    const params = {
      page: Math.max(1, parseInt(page) || 1),
      limit: Math.max(1, parseInt(limit) || 10)
    };
    
    if (search && search.trim()) {
      params.search = search.trim();
    }
    if (role && role.trim()) {
      params.role = role.trim();
    }
    
    console.log('🔍 UserService: Calling /users with params:', params);
    
    try {
      const response = await api.get('/users', { params });
      console.log('✅ UserService: Backend response:', response.data);
      
      // Backend returns: { success: true, message: '...', users: [], pagination: {} }
      const responseData = response.data;
      
      // Return in format expected by frontend
      return {
        success: responseData.success,
        users: responseData.users || [],
        pagination: responseData.pagination || {},
        message: responseData.message // Keep message for debugging
      };
      
    } catch (error) {
      console.error('❌ Error in userService.getAllUsers:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      // Create a structured error object
      const errorObj = new Error(error.response?.data?.error?.message || 'Failed to fetch users');
      errorObj.response = error.response;
      throw errorObj;
    }
  }

  // Create user (admin only)
  async createUser(email, name, role = 'USER') {
    try {
      console.log('🔍 UserService: Creating user:', { email, name, role });
      
      const response = await api.post('/users', {
        email,
        name,
        role
      });
      
      console.log('✅ UserService: Create user response:', response.data);
      
      // Backend returns: { success: true, message: '...', user: {...}, emailSent: true }
      const responseData = response.data;
      
      // Return in format expected by frontend
      return {
        success: responseData.success,
        data: responseData.user || responseData,
        emailSent: responseData.emailSent || false,
        message: responseData.message
      };
      
    } catch (error) {
      console.error('❌ Error in userService.createUser:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  }

  // Delete user (admin only)
  async deleteUser(userId) {
    try {
      console.log('🔍 UserService: Deleting user:', userId);
      
      const response = await api.delete(`/users/${userId}`);
      
      console.log('✅ UserService: Delete user response:', response.data);
      
      // Backend returns: { success: true, message: '...' }
      const responseData = response.data;
      
      return {
        success: responseData.success,
        message: responseData.message
      };
      
    } catch (error) {
      console.error('❌ Error in userService.deleteUser:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  }

  // Update user role (admin only)
  async updateUserRole(userId, role) {
    try {
      console.log('🔍 UserService: Updating user role:', { userId, role });
      
      const response = await api.patch(`/users/${userId}/role`, { role });
      
      console.log('✅ UserService: Update role response:', response.data);
      
      // Backend returns: { success: true, message: '...', user: {...} }
      const responseData = response.data;
      
      return {
        success: responseData.success,
        data: responseData.user || responseData,
        message: responseData.message
      };
      
    } catch (error) {
      console.error('❌ Error in userService.updateUserRole:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  }
}

export default new UserService();