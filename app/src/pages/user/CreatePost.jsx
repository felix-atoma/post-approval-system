// app/src/pages/posts/CreatePost.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import postService from '../../services/post.service';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Loading from '../../components/common/Loading';
import Alert from '../../components/common/Alert';
import SearchBar from '../../components/common/SearchBar';
import FilterDropdown from '../../components/common/FilterDropdown';
import StatusBadge from '../../components/common/StatusBadge';
import Pagination from '../../components/common/Pagination';
import { toast } from 'react-hot-toast';

export default function CreatePost() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    
    if (!formData.content.trim()) {
      toast.error('Content is required');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await postService.createPost({
        title: formData.title.trim(),
        content: formData.content.trim()
      });
      
      if (response && response.success === true) {
        toast.success('Post created successfully!');
        
        // FIX: Navigate with state to trigger refresh in dashboard
        navigate('/dashboard', { 
          state: { 
            refreshPosts: true,
            message: 'Post created successfully!' 
          } 
        });
        
      } else {
        const errorMsg = response?.error?.message || 'Failed to create post';
        setError(new Error(errorMsg));
        toast.error(errorMsg);
      }
    } catch (err) {
      console.error('Create post error:', err);
      const errorMessage = err.response?.data?.error?.message || 'Failed to create post';
      setError(new Error(errorMessage));
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 rounded-2xl p-6 md:p-8 shadow-xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex-1">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="text-blue-100 hover:text-white flex items-center mb-4 transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Dashboard
                </button>
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  Create New Post
                </h1>
                <p className="text-blue-100 text-sm md:text-base">
                  Share your thoughts with the community
                </p>
              </div>
              
              {/* User Info */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{user?.name || 'User'}</p>
                    <p className="text-blue-100 text-xs">{user?.role || 'Member'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="animate-fade-in">
              <Alert 
                type="error" 
                message={error.message} 
                className="shadow-lg border-red-200"
              />
            </div>
          )}

          {/* Form Section */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Title Input */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-900">
                  Title
                </label>
                <div className="relative">
                  <Input
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Enter post title"
                    required
                    disabled={loading}
                    maxLength={200}
                    className="w-full text-lg py-3 px-4"
                  />
                  <div className="absolute right-3 top-3">
                    <StatusBadge 
                      status={formData.title.length > 0 ? 'valid' : 'empty'} 
                      size="sm"
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-500">
                    Be specific and descriptive
                  </p>
                  <p className={`text-xs ${
                    formData.title.length > 180 ? 'text-red-500' : 
                    formData.title.length > 150 ? 'text-amber-500' : 
                    'text-gray-500'
                  }`}>
                    {formData.title.length}/200 characters
                  </p>
                </div>
              </div>

              {/* Content Input */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-900">
                  Content
                </label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  rows={12}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-gray-700 placeholder-gray-400"
                  placeholder="Write your post content here..."
                  required
                  disabled={loading}
                />
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-500">
                    Use clear language and proper formatting
                  </p>
                  <p className="text-xs text-gray-500">
                    {formData.content.length} characters
                  </p>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !formData.title.trim() || !formData.content.trim()}
                  className="w-full sm:w-auto"
                  size="lg"
                  animateHover
                >
                  {loading ? (
                    <>
                      <Loading size="sm" className="mr-2" />
                      Creating Post...
                    </>
                  ) : (
                    'Publish Post'
                  )}
                </Button>
              </div>
            </form>
          </div>

          {/* Guidelines Section */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 md:p-8 border border-blue-100">
            <h3 className="text-xl font-bold text-blue-800 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Post Guidelines
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 text-xs font-bold">1</span>
                  </div>
                  <p className="text-sm text-blue-700">Posts will be reviewed by administrators before being published</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 text-xs font-bold">2</span>
                  </div>
                  <p className="text-sm text-blue-700">Keep titles clear and descriptive</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 text-xs font-bold">3</span>
                  </div>
                  <p className="text-sm text-blue-700">Ensure content follows community guidelines</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 text-xs font-bold">4</span>
                  </div>
                  <p className="text-sm text-blue-700">You can edit posts while they are in "Pending" status</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 text-xs font-bold">5</span>
                  </div>
                  <p className="text-sm text-blue-700">You'll receive notifications when posts are approved or rejected</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 text-xs font-bold">6</span>
                  </div>
                  <p className="text-sm text-blue-700">Posts typically get reviewed within 24 hours</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats Preview */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Post Status Preview</h4>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <StatusBadge status="PENDING" size="sm" />
                <span className="text-sm text-gray-600">Pending Review</span>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status="APPROVED" size="sm" />
                <span className="text-sm text-gray-600">Approved</span>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status="REJECTED" size="sm" />
                <span className="text-sm text-gray-600">Rejected</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}