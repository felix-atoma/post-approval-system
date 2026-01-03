// app/src/pages/user/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import postService from "../../services/post.service"; // Add this import
import PostCard from "../../components/posts/PostCard";
import PostFilters from "../../components/posts/PostFilters";
import Button from "../../components/common/Button";
import Loading from "../../components/common/Loading";
import Alert from "../../components/common/Alert";
import toast from "react-hot-toast";

export default function UserDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    status: "",
    search: ""
  });
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});

  // Redirect admins to admin dashboard
  useEffect(() => {
    if (user?.role === 'ADMIN') {
      navigate('/admin/dashboard');
      return;
    }
  }, [user, navigate]);

  // Fetch user's posts
  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await postService.getMyPosts({
        page: filters.page,
        limit: filters.limit,
        status: filters.status || '',
        search: filters.search || ''
      });
      
      if (response && response.success === true) {
        setPosts(response.posts || []);
        setPagination(response.pagination || {});
      } else {
        const errorMsg = response?.error?.message || 'Failed to fetch posts';
        setError(new Error(errorMsg));
        toast.error(errorMsg);
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
      const errorMessage = err.response?.data?.error?.message || 'Failed to load posts';
      setError(new Error(errorMessage));
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      fetchPosts();
    }
  }, [filters, user?.role]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key === "page" ? value : 1
    }));
  };

  const handlePageChange = (newPage) => {
    handleFilterChange("page", newPage);
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    
    try {
      const response = await postService.deletePost(postId);
      
      if (response && response.success === true) {
        toast.success('Post deleted successfully');
        // Remove from local state
        setPosts(prev => prev.filter(post => post.id !== postId));
        // Update pagination total
        if (pagination.total > 0) {
          setPagination(prev => ({
            ...prev,
            total: prev.total - 1
          }));
        }
      } else {
        toast.error(response?.error?.message || 'Failed to delete post');
      }
    } catch (err) {
      console.error('Error deleting post:', err);
      toast.error('Failed to delete post');
    }
  };

  const postFiltersProps = {
    filters: {
      search: filters.search || '',
      status: filters.status || '',
      limit: filters.limit || 10
    },
    onFilterChange: handleFilterChange,
    showSearch: true,
    showStatusFilter: true,
    showUserFilter: false
  };

  // If user is admin (should have been redirected), show loading
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

  if (loading && !posts.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
        <div className="ml-4">
          <p className="text-gray-500">Loading your posts...</p>
        </div>
      </div>
    );
  }

  if (error && !posts.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center py-12">
          <Alert type="error" message={error.message} />
          <Button
            onClick={fetchPosts}
            className="mt-4"
          >
            Retry Loading Posts
          </Button>
        </div>
      </div>
    );
  }

  const pendingCount = posts.filter(p => p.status === 'PENDING').length;
  const approvedCount = posts.filter(p => p.status === 'APPROVED').length;
  const rejectedCount = posts.filter(p => p.status === 'REJECTED').length;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Dashboard header content - ONLY for regular users */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Welcome, {user?.name || user?.email}!</h1>
            <p className="text-gray-600 mt-2">Create and manage your posts</p>
            
            {/* Post Stats */}
            <div className="flex flex-wrap gap-3 mt-3">
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                <span className="text-sm text-gray-600">
                  <span className="font-semibold">{pendingCount}</span> Pending
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-green-400"></span>
                <span className="text-sm text-gray-600">
                  <span className="font-semibold">{approvedCount}</span> Approved
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-red-400"></span>
                <span className="text-sm text-gray-600">
                  <span className="font-semibold">{rejectedCount}</span> Rejected
                </span>
              </div>
            </div>
          </div>
          
          {/* ONLY show Create New Post button for regular users */}
          <Button 
            onClick={() => navigate("/posts/create")}
            className="w-full md:w-auto"
            size="lg"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New Post
          </Button>
        </div>

        {/* Quick Stats */}
        {posts.length > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700">You have {posts.length} post{posts.length !== 1 ? 's' : ''}</p>
                {pendingCount > 0 && (
                  <p className="text-xs text-yellow-600 mt-1">
                    {pendingCount} waiting for admin review
                  </p>
                )}
              </div>
              <Button
                onClick={fetchPosts}
                variant="outline"
                size="sm"
                className="border-blue-200 text-blue-600 hover:bg-blue-50"
              >
                Refresh
              </Button>
            </div>
          </div>
        )}

        <PostFilters {...postFiltersProps} />

        {posts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="max-w-md mx-auto">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500 text-lg mb-4">
                {filters.search || filters.status 
                  ? "No posts match your filters." 
                  : "You haven't created any posts yet."}
              </p>
              <Button
                onClick={() => navigate("/posts/create")}
                className="mt-2"
                size="lg"
              >
                Create Your First Post
              </Button>
              {(filters.search || filters.status) && (
                <Button
                  onClick={() => {
                    setFilters(prev => ({ ...prev, search: '', status: '' }));
                  }}
                  variant="outline"
                  className="mt-4"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6">
              {posts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  onEdit={(post) => navigate(`/posts/${post.id}/edit`)}
                  onDelete={() => handleDeletePost(post.id)}
                  showEditButton={post.status === 'PENDING'} // Only allow editing pending posts
                  showDeleteButton={true}
                  showStatusBadge={true}
                  showRejectionReason={post.status === 'REJECTED'}
                />
              ))}
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between border-t border-gray-200 pt-6 mt-6 gap-4">
                <div className="text-sm text-gray-700">
                  <p>
                    Showing <span className="font-medium">{(filters.page - 1) * filters.limit + 1}</span> to{" "}
                    <span className="font-medium">
                      {Math.min(filters.page * filters.limit, pagination.total)}
                    </span>{" "}
                    of <span className="font-medium">{pagination.total}</span> posts
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(filters.page - 1)}
                    disabled={filters.page === 1}
                    size="sm"
                  >
                    Previous
                  </Button>
                  <div className="flex items-center">
                    <span className="px-3 text-sm text-gray-700">
                      Page {filters.page} of {pagination.totalPages}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(filters.page + 1)}
                    disabled={filters.page === pagination.totalPages}
                    size="sm"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}