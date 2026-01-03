import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import  postService  from '../../services/post.service';
import useAuth from '../../hooks/useAuth';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import Alert from '../../components/common/Alert';
import toast from 'react-hot-toast';

export default function PostReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reviewData, setReviewData] = useState({
    status: 'APPROVED',
    rejectionReason: ''
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await postService.getPost(id);
      
      if (response.data.success) {
        setPost(response.data.post);
        
        // If post is not pending, redirect
        if (response.data.post.status !== 'PENDING') {
          toast.error('This post has already been reviewed');
          navigate('/admin/dashboard');
        }
      } else {
        setError(response.data.error?.message || 'Failed to load post');
      }
    } catch (err) {
      console.error('Error fetching post:', err);
      setError(err.response?.data?.error?.message || 'Failed to load post');
      toast.error('Failed to load post');
      
      if (err.response?.status === 404) {
        setTimeout(() => navigate('/admin/dashboard'), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (e) => {
    const { value } = e.target;
    setReviewData(prev => ({
      ...prev,
      status: value,
      rejectionReason: value === 'APPROVED' ? '' : prev.rejectionReason
    }));
  };

  const handleRejectionReasonChange = (e) => {
    setReviewData(prev => ({
      ...prev,
      rejectionReason: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (reviewData.status === 'REJECTED' && !reviewData.rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await postService.reviewPost(id, reviewData);
      
      if (response.data.success) {
        toast.success(`Post ${reviewData.status.toLowerCase()} successfully`);
        
        // Redirect back to admin dashboard
        setTimeout(() => {
          navigate('/admin/dashboard');
        }, 1500);
      } else {
        setError(response.data.error?.message || 'Failed to review post');
        toast.error('Failed to review post');
      }
    } catch (err) {
      console.error('Error reviewing post:', err);
      const errorMessage = err.response?.data?.error?.message || 
                          err.response?.data?.error?.details?.[0]?.message ||
                          'Failed to review post';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (error && !post) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <Alert type="error" message={error} />
          <div className="mt-6 flex space-x-4">
            <Button onClick={() => navigate('/admin/dashboard')}>
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

  // Check if user is admin
  if (user?.role !== 'ADMIN') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto text-center">
          <Alert 
            type="error" 
            message="You don't have permission to review posts. Admin access required."
          />
          <div className="mt-6">
            <Button onClick={() => navigate('/dashboard')}>
              Go to User Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Button
            variant="secondary"
            onClick={handleCancel}
            className="mb-4"
            disabled={submitting}
          >
            ← Back to Admin Dashboard
          </Button>
          
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Review Post</h1>
          <p className="text-gray-600 mt-2">
            Review and approve or reject this post submission.
          </p>
        </div>

        {error && (
          <Alert 
            type="error" 
            message={error}
            className="mb-6"
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Post Preview */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Post Preview</h2>
              
              {post && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Title</h3>
                    <p className="mt-1 text-gray-700">{post.title}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Content</h3>
                    <div className="mt-1 p-4 bg-gray-50 rounded-lg">
                      <p className="text-gray-700 whitespace-pre-line">{post.content}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Author</h3>
                      <p className="mt-1 text-gray-700">{post.user?.name || post.user?.email}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Submitted</h3>
                      <p className="mt-1 text-gray-700">
                        {new Date(post.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Review Form */}
          <div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Review Actions</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Decision
                  </label>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="approve"
                        name="status"
                        value="APPROVED"
                        checked={reviewData.status === 'APPROVED'}
                        onChange={handleStatusChange}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                        disabled={submitting}
                      />
                      <label htmlFor="approve" className="ml-3 block text-sm font-medium text-gray-700">
                        <span className="text-green-600 font-semibold">Approve</span>
                        <span className="text-gray-500 text-xs block mt-1">Publish this post</span>
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="reject"
                        name="status"
                        value="REJECTED"
                        checked={reviewData.status === 'REJECTED'}
                        onChange={handleStatusChange}
                        className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                        disabled={submitting}
                      />
                      <label htmlFor="reject" className="ml-3 block text-sm font-medium text-gray-700">
                        <span className="text-red-600 font-semibold">Reject</span>
                        <span className="text-gray-500 text-xs block mt-1">Return to author with feedback</span>
                      </label>
                    </div>
                  </div>
                </div>

                {reviewData.status === 'REJECTED' && (
                  <div>
                    <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-700 mb-2">
                      Rejection Reason *
                    </label>
                    <textarea
                      id="rejectionReason"
                      value={reviewData.rejectionReason}
                      onChange={handleRejectionReasonChange}
                      rows={4}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder="Provide constructive feedback to the author..."
                      required
                      disabled={submitting}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      This will be shown to the author to help them improve.
                    </p>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex space-x-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancel}
                      className="flex-1"
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant={reviewData.status === 'APPROVED' ? 'primary' : 'danger'}
                      className="flex-1"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                          Processing...
                        </>
                      ) : (
                        `${reviewData.status === 'APPROVED' ? 'Approve' : 'Reject'} Post`
                      )}
                    </Button>
                  </div>
                  
                  {reviewData.status === 'REJECTED' && !reviewData.rejectionReason.trim() && (
                    <p className="mt-3 text-sm text-red-600">
                      Please provide a rejection reason
                    </p>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}