// app/src/services/post.service.js
import api from './api';

const postService = {
  // Get all posts for user (regular user dashboard)
  getMyPosts: async (params = {}) => {
    const queryParams = {
      page: Math.max(1, parseInt(params.page) || 1),
      limit: Math.max(1, parseInt(params.limit) || 10)
    };
    
    if (params.status && params.status.trim()) {
      queryParams.status = params.status.trim();
    }
    if (params.search && params.search.trim()) {
      queryParams.search = params.search.trim();
    }
    
    try {
      const response = await api.get('/posts/my-posts', { params: queryParams });
      return response.data;
    } catch (error) {
      console.error('Error in postService.getMyPosts:', error);
      throw error;
    }
  },

  // Get all posts for admin
  getAllPosts: async (params = {}) => {
    const queryParams = {
      page: Math.max(1, parseInt(params.page) || 1),
      limit: Math.max(1, parseInt(params.limit) || 10)
    };
    
    if (params.status && params.status.trim()) {
      queryParams.status = params.status.trim();
    }
    if (params.search && params.search.trim()) {
      queryParams.search = params.search.trim();
    }
    
    try {
      const response = await api.get('/posts/admin/all', { params: queryParams });
      return response.data;
    } catch (error) {
      console.error('Error in postService.getAllPosts:', error);
      throw error;
    }
  },

  // Get single post
  getPost: async (id) => {
    try {
      const response = await api.get(`/posts/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error in postService.getPost:', error);
      throw error;
    }
  },

  // Create post
  createPost: async (data) => {
    try {
      const response = await api.post('/posts', data);
      return response.data;
    } catch (error) {
      console.error('Error in postService.createPost:', error);
      throw error;
    }
  },

  // Update post
  updatePost: async (id, data) => {
    try {
      const response = await api.put(`/posts/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error in postService.updatePost:', error);
      throw error;
    }
  },

  // Delete post
  deletePost: async (id) => {
    try {
      const response = await api.delete(`/posts/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error in postService.deletePost:', error);
      throw error;
    }
  },

  // Admin: Review post (approve/reject)
  reviewPost: async (id, reviewData) => {
    try {
      // Send both status and rejectionReason in the request body
      const data = {
        status: reviewData.status
      };
      
      if (reviewData.status === 'REJECTED' && reviewData.rejectionReason) {
        data.rejectionReason = reviewData.rejectionReason;
      }
      
      const response = await api.patch(`/posts/admin/${id}/review`, data);
      return response.data;
    } catch (error) {
      console.error('Error in postService.reviewPost:', error);
      throw error;
    }
  }
};

export default postService;