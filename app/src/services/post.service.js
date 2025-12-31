import api from './api';

export const postService = {
  createPost: (data) => api.post('/posts', data),
  
  getMyPosts: (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return api.get(`/posts/my-posts?${queryParams}`);
  },
  
  getAllPosts: (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return api.get(`/posts/admin/all?${queryParams}`);
  },
  
  getPost: (id) => api.get(`/posts/${id}`),
  
  updatePost: (id, data) => api.put(`/posts/${id}`, data),
  
  deletePost: (id) => api.delete(`/posts/${id}`),
  
  reviewPost: (id, data) => api.patch(`/posts/admin/${id}/review`, data)
};