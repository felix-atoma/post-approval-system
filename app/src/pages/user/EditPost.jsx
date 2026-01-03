import React from 'react'
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import postService from '../../services/post.service';
import useAuth from '../../hooks/useAuth';
import PostForm from '../../components/posts/PostForm';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import Alert from '../../components/common/Alert';
import toast from 'react-hot-toast';

export default function EditPost() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [post, setPost] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Prevent admins from editing posts via user interface
  useEffect(() => {
    if (user?.role === 'ADMIN') {
      toast.error('Admins cannot edit posts via this interface. Please use the admin dashboard.');
      navigate('/admin/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      fetchPost();
    }
  }, [id, user]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await postService.getPost(id);
      
      if (response && response.success === true) {
        setPost(response.post || response.data);
      } else {
        const errorMsg = response?.error?.message || 'Failed to load post';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err) {
      console.error('Error fetching post:', err);
      const errorMessage = err.response?.data?.error?.message || 
                          err.response?.data?.message || 
                          'Failed to load post';
      setError(errorMessage);
      toast.error(errorMessage);
      
      if (err.response?.status === 404) {
        setTimeout(() => navigate('/dashboard'), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData) => {
    try {
      setSubmitting(true);
      setError(null);
      setSuccess(false);

      const response = await postService.updatePost(id, formData);
      
      if (response && response.success === true) {
        setSuccess(true);
        setPost(response.post || response.data);
        
        toast.success('Post updated successfully!');
        
        // Redirect after success
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        const errorMsg = response?.error?.message || 'Failed to update post';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err) {
      console.error('Error updating post:', err);
      const errorMessage = err.response?.data?.error?.message || 
                          err.response?.data?.message ||
                          'Failed to update post';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/dashboard');
  };

  // Show loading while checking or redirecting
  if (user?.role === 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
        <div className="ml-4">
          <p className="text-gray-500">Redirecting to Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (error && !post) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="text-center">
          <Alert type="error" message={error} />
          <div className="mt-6 flex justify-center space-x-4">
            <Button onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
            <Button variant="outline" onClick={fetchPost}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Check if user can edit this post
  // Regular users can only edit their own pending posts
  const canEdit = user && post && (
    user.id === post.userId && post.status === 'PENDING'
  );

  if (!canEdit) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="text-center">
          <Alert 
            type="error" 
            message={
              post?.status !== 'PENDING' 
                ? "This post has already been reviewed and cannot be edited."
                : "You can only edit your own pending posts."
            }
          />
          <div className="mt-6">
            <Button onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Button
          variant="secondary"
          onClick={handleCancel}
          className="mb-4"
          disabled={submitting}
        >
          ← Back to Dashboard
        </Button>
        
        <h1 className="text-2xl font-bold text-gray-900">Edit Post</h1>
        <p className="text-gray-600 mt-2">
          Edit your post. Only pending posts can be edited.
        </p>
        {post && (
          <div className="mt-4 text-sm text-gray-500">
            <p>Current Status: <span className="font-semibold">{post.status}</span></p>
            <p>Created: {new Date(post.createdAt).toLocaleDateString()}</p>
          </div>
        )}
      </div>

      {success && (
        <Alert 
          type="success" 
          message="Post updated successfully! Redirecting to dashboard..."
          className="mb-6"
        />
      )}

      {error && (
        <Alert 
          type="error" 
          message={error}
          className="mb-6"
        />
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {post && (
          <PostForm
            initialData={{
              title: post.title,
              content: post.content
            }}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={submitting}
            submitText="Update Post"
            cancelText="Cancel"
            showStatus={false} // Regular users don't see status
            showAuthor={false} // Regular users don't see author info
          />
        )}
      </div>
    </div>
  );
}