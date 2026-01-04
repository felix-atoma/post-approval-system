// app/src/pages/user/Dashboard.jsx
import React, { useState, useEffect, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  RefreshCw, 
  FileText, 
  CheckCircle, 
  XCircle,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  AlertTriangle, // Note: AlertCircle → AlertTriangle
  User,
  Clock // For pending status
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import postService from "../../services/post.service";
import PostCard from "../../components/posts/PostCard";
import Button from "../../components/common/Button";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";
import ErrorState from "../../components/common/ErrorState";
import StatsCard from "../../components/dashboard/StatsCard";
import SearchBar from "../../components/common/SearchBar";
import FilterDropdown from "../../components/common/FilterDropdown";
import Pagination from "../../components/common/Pagination";
import StatusBadge from "../../components/common/StatusBadge";
import { toast } from "react-hot-toast";

// Animation variants
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut"
    }
  },
  exit: { opacity: 0, y: -20 }
};

const statsVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.4,
      ease: "easeOut"
    }
  })
};

const postCardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: 0.2
    }
  }
};

// Memoized components for performance
const UserAvatar = memo(({ user }) => (
  <motion.div
    initial={{ scale: 0 }}
    animate={{ scale: 1 }}
    transition={{ type: "spring", stiffness: 200, damping: 15 }}
    className="relative"
  >
    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
      {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
    </div>
    <motion.div
      className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-400 border-2 border-white flex items-center justify-center"
      animate={{ scale: [1, 1.1, 1] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <div className="w-2 h-2 rounded-full bg-white" />
    </motion.div>
  </motion.div>
));

UserAvatar.displayName = 'UserAvatar';

const LoadingSkeleton = memo(() => (
  <div className="space-y-6 animate-pulse">
    {/* Header Skeleton */}
    <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-8">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-2xl bg-gray-300" />
        <div className="space-y-2">
          <div className="h-6 w-48 bg-gray-300 rounded" />
          <div className="h-4 w-64 bg-gray-300 rounded" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 bg-gray-200 rounded-xl" />
        ))}
      </div>
    </div>
    
    {/* Posts Grid Skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="h-64 bg-gray-100 rounded-2xl" />
      ))}
    </div>
  </div>
));

LoadingSkeleton.displayName = 'LoadingSkeleton';

export default function UserDashboard() {
  const { user, logout } = useAuth();
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
  const [refreshing, setRefreshing] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0
  });

  // Update stats when posts change
  useEffect(() => {
    const pending = posts.filter(p => p.status === 'PENDING').length;
    const approved = posts.filter(p => p.status === 'APPROVED').length;
    const rejected = posts.filter(p => p.status === 'REJECTED').length;
    
    setStats({
      pending,
      approved,
      rejected,
      total: pending + approved + rejected
    });
  }, [posts]);

  // Redirect admins
  useEffect(() => {
    if (user?.role === 'ADMIN') {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [user, navigate]);

  // Fetch user's posts with animation
  const fetchPosts = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setRefreshing(true);
      setError(null);
      
      // Token expiry check
      const tokenExpiry = localStorage.getItem('token_expiry');
      if (tokenExpiry && Date.now() > parseInt(tokenExpiry)) {
        toast.error('Session expired. Please login again.');
        logout();
        return;
      }
      
      const response = await postService.getMyPosts({
        page: filters.page,
        limit: filters.limit,
        status: filters.status || '',
        search: filters.search || ''
      });
      
      if (response?.success) {
        setPosts(response.posts || []);
        setPagination(response.pagination || {});
        
        // Success animation trigger
        if (showLoading) {
          toast.success('Posts loaded successfully!', {
            icon: '📝',
            duration: 2000
          });
        }
      } else {
        const errorMsg = response?.error?.message || 'Failed to fetch posts';
        if (response?.error?.code === 'TOKEN_EXPIRED') {
          toast.error('Session expired. Please login again.', {
            icon: '🔒'
          });
          logout();
        } else {
          setError(new Error(errorMsg));
          toast.error(errorMsg, { icon: '⚠️' });
        }
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
      
      // Handle token expiration
      if (err.response?.status === 401) {
        toast.error('Authentication failed. Please login again.', {
          icon: '🔒'
        });
        logout();
        return;
      }
      
      const errorMessage = err.response?.data?.error?.message || 'Failed to load posts';
      setError(new Error(errorMessage));
      toast.error(errorMessage, { icon: '❌' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters, logout]);

  // Initial fetch
  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      fetchPosts();
    }
  }, [filters, user?.role, fetchPosts]);

  // Handle filter changes with animation
  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key === "page" ? value : 1
    }));
  }, []);

  // Handle search with debounce
  const handleSearch = useCallback((searchTerm) => {
    handleFilterChange("search", searchTerm);
  }, [handleFilterChange]);

  // Handle status filter
  const handleStatusChange = useCallback((status) => {
    handleFilterChange("status", status);
  }, [handleFilterChange]);

  // Delete post with confirmation and animation
  const handleDeletePost = useCallback(async (postId) => {
    const confirmed = await new Promise(resolve => {
      toast.custom((t) => (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Post</h3>
              <p className="text-gray-600 mb-4">Are you sure you want to delete this post? This action cannot be undone.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    toast.dismiss(t.id);
                    resolve(false);
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    toast.dismiss(t.id);
                    resolve(true);
                  }}
                  className="flex-1 px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      ));
    });

    if (!confirmed) return;

    try {
      const response = await postService.deletePost(postId);
      
      if (response?.success) {
        // Animate removal
        const postElement = document.getElementById(`post-${postId}`);
        if (postElement) {
          postElement.style.transform = 'scale(0.95)';
          postElement.style.opacity = '0';
          setTimeout(() => {
            setPosts(prev => prev.filter(post => post.id !== postId));
            setPagination(prev => ({
              ...prev,
              total: prev.total - 1
            }));
          }, 300);
        } else {
          setPosts(prev => prev.filter(post => post.id !== postId));
        }
        
        toast.success('Post deleted successfully!', {
          icon: '🗑️',
          duration: 3000
        });
      } else {
        toast.error(response?.error?.message || 'Failed to delete post', {
          icon: '⚠️'
        });
      }
    } catch (err) {
      console.error('Error deleting post:', err);
      toast.error('Failed to delete post', { icon: '❌' });
    }
  }, []);

  // Edit post
  const handleEditPost = useCallback((post) => {
    if (post.status !== 'PENDING') {
      toast.error('Only pending posts can be edited', { icon: '📝' });
      return;
    }
    navigate(`/posts/${post.id}/edit`);
  }, [navigate]);

  // Refresh posts with animation
  const handleRefresh = useCallback(() => {
    fetchPosts(false);
  }, [fetchPosts]);

  // Status filter options
  const statusOptions = [
    { value: '', label: 'All Status', icon: FileText, color: 'gray' },
    { value: 'PENDING', label: 'Pending', icon: Clock, color: 'yellow' },
    { value: 'APPROVED', label: 'Approved', icon: CheckCircle, color: 'green' },
    { value: 'REJECTED', label: 'Rejected', icon: XCircle, color: 'red' }
  ];

  // Loading state
  if (loading && !posts.length) {
    return <LoadingSkeleton />;
  }

  // Error state
  if (error && !posts.length) {
    return (
      <ErrorState
        title="Error Loading Posts"
        message={error.message}
        onRetry={fetchPosts}
        onHome={() => navigate('/')}
      />
    );
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-screen bg-gradient-to-b from-gray-50 to-white"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 max-w-7xl">
        <div className="space-y-6 md:space-y-8">
          {/* Dashboard Header */}
          <motion.div 
            className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 rounded-3xl p-6 md:p-8 shadow-xl overflow-hidden"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="relative">
              {/* Animated background elements */}
              <motion.div
                className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 4, repeat: Infinity }}
              />
              <motion.div
                className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full"
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              
              <div className="relative">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-6">
                      <UserAvatar user={user} />
                      <div>
                        <motion.h1 
                          className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 }}
                        >
                          Welcome back, {user?.name?.split(' ')[0] || 'User'}!
                        </motion.h1>
                        <motion.p 
                          className="text-blue-100 text-sm md:text-base"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          Manage your content and track approvals in real-time
                        </motion.p>
                      </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                      {[
                        { 
                          label: 'Total Posts', 
                          value: stats.total, 
                          icon: FileText, 
                          color: 'blue',
                          gradient: 'from-blue-500 to-cyan-500'
                        },
                        { 
                          label: 'Pending', 
                          value: stats.pending, 
                          icon: Clock, 
                          color: 'yellow',
                          gradient: 'from-amber-500 to-orange-500'
                        },
                        { 
                          label: 'Approved', 
                          value: stats.approved, 
                          icon: CheckCircle, 
                          color: 'green',
                          gradient: 'from-emerald-500 to-green-500'
                        },
                        { 
                          label: 'Rejected', 
                          value: stats.rejected, 
                          icon: XCircle, 
                          color: 'red',
                          gradient: 'from-rose-500 to-pink-600'
                        }
                      ].map((stat, index) => (
                        <motion.div
                          key={stat.label}
                          custom={index}
                          variants={statsVariants}
                          initial="hidden"
                          animate="visible"
                          whileHover={{ y: -5, transition: { duration: 0.2 } }}
                          className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-blue-100">{stat.label}</p>
                              <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
                            </div>
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center`}>
                              <stat.icon className="w-6 h-6 text-white" />
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <motion.div 
                    className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full lg:w-auto"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Button
                      onClick={() => navigate("/posts/create")}
                      className="w-full lg:w-64"
                      size="lg"
                      variant="white"
                      icon={<Plus className="w-5 h-5" />}
                      animateHover
                    >
                      Create New Post
                    </Button>
                    
                    <Button
                      onClick={handleRefresh}
                      variant="outline-white"
                      className="w-full lg:w-64"
                      icon={<RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />}
                      disabled={refreshing}
                      animateHover
                    >
                      {refreshing ? 'Refreshing...' : 'Refresh Posts'}
                    </Button>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Filters Section */}
          <motion.div 
            className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Your Posts</h2>
                <p className="text-gray-500 text-sm mt-1">
                  {pagination.total > 0 
                    ? `Showing ${Math.min(filters.limit, posts.length)} of ${pagination.total} posts` 
                    : 'No posts to display'}
                </p>
              </div>
              
              {pagination.total > 0 && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="font-medium">{pagination.total}</span> total posts
                  <span className="mx-2">•</span>
                  <span className="font-medium">{pagination.totalPages || 1}</span> page{pagination.totalPages !== 1 ? 's' : ''}
                </div>
              )}
            </div>
            
            {/* Filter Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SearchBar
                value={filters.search}
                onChange={handleSearch}
                placeholder="Search posts..."
                className="md:col-span-2"
              />
              
              <FilterDropdown
                value={filters.status}
                onChange={handleStatusChange}
                options={statusOptions}
                placeholder="Filter by status"
              />
            </div>
          </motion.div>

          {/* Posts Grid */}
          <AnimatePresence mode="wait">
            {posts.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <EmptyState
                  title={filters.search || filters.status ? "No matching posts found" : "No posts yet"}
                  description={filters.search || filters.status 
                    ? "Try adjusting your filters or search terms." 
                    : "Get started by creating your first post!"}
                  icon={<FileText className="w-12 h-12" />}
                  action={
                    <Button
                      onClick={() => navigate("/posts/create")}
                      size="lg"
                      icon={<Plus className="w-5 h-5" />}
                      animateHover
                    >
                      Create Your First Post
                    </Button>
                  }
                  secondaryAction={
                    (filters.search || filters.status) && (
                      <Button
                        onClick={() => {
                          setFilters(prev => ({ 
                            ...prev, 
                            search: '', 
                            status: '',
                            page: 1 
                          }));
                        }}
                        variant="outline"
                      >
                        Clear All Filters
                      </Button>
                    )
                  }
                />
              </motion.div>
            ) : (
              <motion.div
                key="posts"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <AnimatePresence>
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {posts.map((post, index) => (
                      <motion.div
                        key={post.id}
                        id={`post-${post.id}`}
                        variants={postCardVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        custom={index}
                        whileHover={{ 
                          y: -8,
                          transition: { duration: 0.2 }
                        }}
                        className="h-full"
                      >
                        <PostCard
                          post={post}
                          onEdit={() => handleEditPost(post)}
                          onDelete={() => handleDeletePost(post.id)}
                          showEditButton={post.status === 'PENDING'}
                          showDeleteButton={post.status === 'PENDING' || post.status === 'REJECTED'}
                          showStatusBadge={true}
                          showRejectionReason={post.status === 'REJECTED'}
                          showAuthor={false}
                          showActions={true}
                          className="h-full"
                        />
                      </motion.div>
                    ))}
                  </div>
                </AnimatePresence>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <motion.div 
                    className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Pagination
                      currentPage={filters.page}
                      totalPages={pagination.totalPages}
                      totalItems={pagination.total}
                      itemsPerPage={filters.limit}
                      onPageChange={(page) => handleFilterChange("page", page)}
                      showInfo={true}
                    />
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Floating Action Button for Mobile */}
      <motion.div
        className="fixed bottom-6 right-6 lg:hidden z-50"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: "spring" }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Button
          onClick={() => navigate("/posts/create")}
          size="xl"
          className="rounded-full shadow-2xl"
          icon={<Plus className="w-6 h-6" />}
          animateHover
        >
          Create Post
        </Button>
      </motion.div>
    </motion.div>
  );
}