// app/src/pages/posts/CreatePost.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import postService from '../../services/post.service';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Loading from '../../components/common/Loading';
import Alert from '../../components/common/Alert';
import toast from 'react-hot-toast';

export default function CreatePost() {
  const navigate = useNavigate();
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
        navigate('/dashboard');
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
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-blue-600 hover:text-blue-800 flex items-center"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold mt-4">Create New Post</h1>
          <p className="text-gray-600 mt-2">Share your thoughts with the community</p>
        </div>

        {error && (
          <Alert type="error" message={error.message} className="mb-6" />
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <Input
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter post title"
                required
                disabled={loading}
                maxLength={200}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.title.length}/200 characters
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content
              </label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleChange}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                placeholder="Write your post content here..."
                required
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Be descriptive and clear in your post
              </p>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard')}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
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

        <div className="mt-8 bg-blue-50 rounded-lg p-6 border border-blue-100">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Post Guidelines</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Posts will be reviewed by administrators before being published</li>
            <li>• Keep titles clear and descriptive</li>
            <li>• Ensure content is appropriate and follows community guidelines</li>
            <li>• You can edit posts while they are in "Pending" status</li>
            <li>• You'll receive notification when your post is approved or rejected</li>
          </ul>
        </div>
      </div>
    </div>
  );
}