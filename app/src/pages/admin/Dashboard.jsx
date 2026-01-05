// src/pages/admin/Dashboard.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  XCircle, 
  Eye, 
  AlertTriangle, 
  Users, 
  FileText,
  Clock,
  Search,
  Filter,
  Plus,
  Trash2,
  User,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import postService from '../../services/post.service';
import userService from '../../services/user.service';
import PostCard from '../../components/posts/PostCard';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Alert from '../../components/common/Alert';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import SearchBar from '../../components/common/SearchBar';
import FilterDropdown from '../../components/common/FilterDropdown';
import StatusBadge from '../../components/common/StatusBadge';
import Pagination from '../../components/common/Pagination';
import { toast } from 'react-hot-toast';

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

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const fetchingPosts = useRef(false);
  const fetchingUsers = useRef(false);
  
  const [activeTab, setActiveTab] = useState('posts');
  
  const [postFilters, setPostFilters] = useState({
    page: 1,
    limit: 10,
    status: 'PENDING',
    search: ''
  });
  
  const [userFilters, setUserFilters] = useState({
    page: 1,
    limit: 10,
    role: '',
    search: ''
  });
  
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState(null);
  const [postsPagination, setPostsPagination] = useState({});
  
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState(null);
  const [usersPagination, setUsersPagination] = useState({});
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    name: '',
    role: 'USER'
  });
  const [creatingUser, setCreatingUser] = useState(false);

  // Redirect non-admin/non-editor users
  useEffect(() => {
    if (user && !['ADMIN', 'EDITOR'].includes(user.role)) {
      toast.error('Admin or Editor access required');
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  // Check for refresh flag
  useEffect(() => {
    if (location.state?.refreshPosts) {
      fetchPosts();
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state]);

  const fetchPosts = useCallback(async () => {
    if (fetchingPosts.current) return;

    try {
      fetchingPosts.current = true;
      setPostsLoading(true);
      setPostsError(null);
      
      const result = await postService.getAllPosts({
        page: postFilters.page,
        limit: postFilters.limit,
        status: postFilters.status || '',
        search: postFilters.search || ''
      });
      
      if (result && result.success === true) {
        setPosts(result.posts || []);
        setPostsPagination(result.pagination || {});
        
        if (result.posts?.length > 0) {
          toast.success(`${result.posts.length} posts loaded`, { 
            icon: '📝',
            duration: 2000 
          });
        }
      } else {
        const errorMsg = result?.error?.message || result?.message || 'Failed to fetch posts';
        setPostsError(new Error(errorMsg));
        toast.error(errorMsg, { icon: '⚠️' });
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
      let errorMessage = 'Failed to load posts';
      if (err.response?.status === 403) {
        errorMessage = 'Access denied. Admin/Editor privileges required.';
      } else if (err.response?.data?.error?.message) {
        errorMessage = err.response.data.error.message;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      setPostsError(new Error(errorMessage));
      toast.error(errorMessage, { icon: '❌' });
    } finally {
      setPostsLoading(false);
      fetchingPosts.current = false;
    }
  }, [postFilters.page, postFilters.limit, postFilters.status, postFilters.search]);

  const fetchUsers = useCallback(async () => {
    if (fetchingUsers.current) return;

    try {
      fetchingUsers.current = true;
      setUsersLoading(true);
      setUsersError(null);
      
      const result = await userService.getAllUsers(
        userFilters.page,
        userFilters.limit,
        userFilters.search || '',
        userFilters.role || ''
      );
      
      if (result && result.success === true) {
        setUsers(result.users || []);
        setUsersPagination(result.pagination || {});
        
        if (result.users?.length > 0) {
          toast.success(`${result.users.length} users loaded`, { 
            icon: '👥',
            duration: 2000 
          });
        }
      } else {
        const errorMsg = result?.error?.message || result?.message || 'Failed to fetch users';
        setUsersError(new Error(errorMsg));
        toast.error(errorMsg, { icon: '⚠️' });
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      const errorMessage = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to load users';
      setUsersError(new Error(errorMessage));
      toast.error(errorMessage, { icon: '❌' });
    } finally {
      setUsersLoading(false);
      fetchingUsers.current = false;
    }
  }, [userFilters.page, userFilters.limit, userFilters.search, userFilters.role]);

  useEffect(() => {
    if (activeTab === 'posts') {
      fetchPosts();
    } else if (activeTab === 'users' && user?.role === 'ADMIN') {
      fetchUsers();
    }
  }, [activeTab, fetchPosts, fetchUsers, user?.role]);

  const handlePostFilterChange = (key, value) => {
    setPostFilters(prev => ({
      ...prev,
      [key]: value,
      page: key === "page" ? value : 1
    }));
  };

  const handleUserFilterChange = (key, value) => {
    setUserFilters(prev => ({
      ...prev,
      [key]: value,
      page: key === "page" ? value : 1
    }));
  };

  const handleApprovePost = async (postId) => {
    try {
      const result = await postService.reviewPost(postId, { 
        status: 'APPROVED' 
      });
      
      if (result && result.success === true) {
        toast.success('Post approved successfully!', { icon: '✅' });
        setPosts(prevPosts => 
          prevPosts.map(post => 
            post.id === postId 
              ? { 
                  ...post, 
                  status: 'APPROVED', 
                  rejectionReason: null,
                  reviewedBy: result.post?.reviewedBy || { name: user?.name },
                  updatedAt: new Date().toISOString() 
                }
              : post
          )
        );
      } else {
        toast.error(result?.error?.message || result?.message || 'Failed to approve post', { icon: '⚠️' });
      }
    } catch (error) {
      console.error('Approve post error:', error);
      const errorMessage = error.response?.data?.error?.message || error.response?.data?.message || 'Failed to approve post';
      toast.error(errorMessage, { icon: '❌' });
    }
  };

  const handleRejectPost = async (postId, rejectionReason) => {
    if (!rejectionReason || rejectionReason.trim() === '') {
      toast.error('Please provide a rejection reason', { icon: '📝' });
      return;
    }

    try {
      const result = await postService.reviewPost(postId, { 
        status: 'REJECTED',
        rejectionReason: rejectionReason.trim()
      });
      
      if (result && result.success === true) {
        toast.success('Post rejected successfully', { icon: '✅' });
        setPosts(prevPosts => 
          prevPosts.map(post => 
            post.id === postId 
              ? { 
                  ...post, 
                  status: 'REJECTED', 
                  rejectionReason: rejectionReason.trim(),
                  reviewedBy: result.post?.reviewedBy || { name: user?.name },
                  updatedAt: new Date().toISOString() 
                }
              : post
          )
        );
      } else {
        toast.error(result?.error?.message || result?.message || 'Failed to reject post', { icon: '⚠️' });
      }
    } catch (error) {
      console.error('Reject post error:', error);
      const errorMessage = error.response?.data?.error?.message || error.response?.data?.message || 'Failed to reject post';
      toast.error(errorMessage, { icon: '❌' });
    }
  };

  const handleCreateUser = async (e) => {
  e.preventDefault();
  
  if (!newUser.email || !newUser.name) {
    toast.error('Email and name are required', { icon: '📝' });
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(newUser.email)) {
    toast.error('Invalid email address', { icon: '📧' });
    return;
  }

  setCreatingUser(true);
  
  // Show immediate feedback - backend is working but slow
  toast.loading('Creating user... (This may take 30+ seconds due to email sending)', {
    id: 'create-user',
    duration: 10000 // Show for 10 seconds
  });
  
  try {
    const result = await userService.createUser(
      newUser.email, 
      newUser.name, 
      newUser.role
    );
    
    // Dismiss the loading toast
    toast.dismiss('create-user');
    
    if (result && result.success === true) {
      const instructions = `
📧 User Created: ${newUser.name}

Login Instructions (share with user):
1. Go to: ${window.location.origin}/login
2. Email: ${newUser.email}
3. Password: Any temporary password (e.g., "temp123")
4. They'll be prompted to create their permanent password
      `.trim();
      
      if (navigator.clipboard) {
        navigator.clipboard.writeText(instructions);
        toast.success('User created! Instructions copied to clipboard.', { 
          icon: '📋',
          duration: 5000 
        });
      } else {
        toast.success('User created successfully!', { 
          icon: '✅',
          duration: 5000 
        });
      }
      
      setShowCreateUser(false);
      setNewUser({ email: '', name: '', role: 'USER' });
      
      // Wait a bit before refreshing users list (backend needs time)
      setTimeout(() => {
        fetchUsers();
      }, 5000);
      
    } else {
      toast.error(result?.error?.message || result?.message || 'Failed to create user', { 
        icon: '⚠️',
        duration: 5000 
      });
    }
  } catch (error) {
    console.error('Create user error:', error);
    
    // Dismiss the loading toast
    toast.dismiss('create-user');
    
    // Check if it's just a timeout (backend might still be processing)
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      // Show optimistic success - backend is probably still working
      const instructions = `
📧 User Creation Initiated: ${newUser.name}

Login Instructions (share with user):
1. Go to: ${window.location.origin}/login
2. Email: ${newUser.email}
3. Password: Any temporary password (e.g., "temp123")
4. They'll be prompted to create their permanent password

Note: Email sending may be delayed. User account is being created.
      `.trim();
      
      if (navigator.clipboard) {
        navigator.clipboard.writeText(instructions);
        toast.success('User creation initiated! Email may be delayed. Instructions copied.', { 
          icon: '⏳',
          duration: 5000 
        });
      } else {
        toast.success('User creation initiated! Email sending may take a minute.', { 
          icon: '⏳',
          duration: 5000 
        });
      }
      
      setShowCreateUser(false);
      setNewUser({ email: '', name: '', role: 'USER' });
      
      // Wait longer before refreshing since backend is still processing
      setTimeout(() => {
        fetchUsers();
      }, 15000);
      
    } else {
      // Real error
      const errorMessage = 
        error.response?.data?.error?.message || 
        error.response?.data?.message || 
        error.message || 
        'Failed to create user';
      toast.error(errorMessage, { 
        icon: '❌',
        duration: 5000 
      });
    }
  } finally {
    setCreatingUser(false);
  }
};

  const handleDeleteUser = async (userId, userName) => {
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
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete User</h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete user <strong>{userName}</strong>? This action cannot be undone.
              </p>
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
                  Delete User
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      ));
    });

    if (!confirmed) return;

    try {
      const result = await userService.deleteUser(userId);
      
      if (result && result.success === true) {
        toast.success('User deleted successfully', { icon: '✅' });
        fetchUsers();
      } else {
        toast.error(result?.error?.message || result?.message || 'Failed to delete user', { icon: '⚠️' });
      }
    } catch (error) {
      console.error('Delete user error:', error);
      const errorMessage = error.response?.data?.error?.message || error.response?.data?.message || 'Failed to delete user';
      toast.error(errorMessage, { icon: '❌' });
    }
  };

  const handleRefresh = useCallback(() => {
    if (activeTab === 'posts') {
      fetchPosts();
    } else if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab, fetchPosts, fetchUsers]);

  // Check admin/editor access
  if (!user || !['ADMIN', 'EDITOR'].includes(user.role)) {
    return (
      <ErrorState
        title="Access Denied"
        message="Admin or Editor privileges required"
        onHome={() => navigate('/dashboard')}
      />
    );
  }

  const pendingCount = posts.filter(p => p.status === 'PENDING').length;
  const approvedCount = posts.filter(p => p.status === 'APPROVED').length;
  const rejectedCount = posts.filter(p => p.status === 'REJECTED').length;

  const userCount = users.length;
  const adminCount = users.filter(u => u.role === 'ADMIN').length;
  const editorCount = users.filter(u => u.role === 'EDITOR').length;

  // Status filter options for posts
  const postStatusOptions = [
    { value: '', label: 'All Posts', icon: FileText, color: 'gray' },
    { value: 'PENDING', label: 'Pending Review', icon: Clock, color: 'yellow' },
    { value: 'APPROVED', label: 'Approved', icon: CheckCircle, color: 'green' },
    { value: 'REJECTED', label: 'Rejected', icon: XCircle, color: 'red' }
  ];

  // Role filter options for users
  const userRoleOptions = [
    { value: '', label: 'All Roles', icon: Users, color: 'gray' },
    { value: 'USER', label: 'Users', icon: User, color: 'blue' },
    { value: 'ADMIN', label: 'Admins', icon: User, color: 'purple' },
    { value: 'EDITOR', label: 'Editors', icon: User, color: 'green' },
    { value: 'PENDING', label: 'Pending', icon: Clock, color: 'yellow' }
  ];

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
            className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 rounded-3xl p-6 md:p-8 shadow-xl overflow-hidden"
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
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                        className="relative"
                      >
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                          {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                        </div>
                        <motion.div
                          className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-400 border-2 border-white flex items-center justify-center"
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </motion.div>
                      </motion.div>
                      <div>
                        <motion.h1 
                          className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 }}
                        >
                          Admin Dashboard
                        </motion.h1>
                        <motion.p 
                          className="text-blue-100 text-sm md:text-base"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          Welcome back, {user?.name?.split(' ')[0] || 'Admin'}! ({user?.role})
                        </motion.p>
                      </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                      {[
                        { 
                          label: 'Pending Review', 
                          value: pendingCount, 
                          icon: Clock, 
                          color: 'yellow',
                          gradient: 'from-amber-500 to-orange-500'
                        },
                        { 
                          label: 'Approved Posts', 
                          value: approvedCount, 
                          icon: CheckCircle, 
                          color: 'green',
                          gradient: 'from-emerald-500 to-green-500'
                        },
                        { 
                          label: 'Total Users', 
                          value: userCount, 
                          icon: Users, 
                          color: 'blue',
                          gradient: 'from-blue-500 to-cyan-500'
                        },
                        { 
                          label: 'Admin Users', 
                          value: adminCount, 
                          icon: User, 
                          color: 'purple',
                          gradient: 'from-purple-500 to-pink-600'
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
                      onClick={handleRefresh}
                      variant="white"
                      className="w-full lg:w-64"
                      icon={<RefreshCw className="w-4 h-4" />}
                      animateHover
                    >
                      Refresh Data
                    </Button>
                    
                    {user.role === 'ADMIN' && (
                      <Button
                        onClick={() => setShowCreateUser(!showCreateUser)}
                        variant="outline-white"
                        className="w-full lg:w-64"
                        icon={<Plus className="w-5 h-5" />}
                        animateHover
                      >
                        {showCreateUser ? 'Cancel' : 'Create User'}
                      </Button>
                    )}
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Tab Navigation */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="border-b border-gray-200">
              <nav className="flex">
                <button
                  onClick={() => setActiveTab('posts')}
                  className={`flex-1 py-4 px-6 text-center font-medium flex items-center justify-center gap-2 transition-colors ${
                    activeTab === 'posts'
                      ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <FileText className="w-5 h-5" />
                  Post Approvals
                  {pendingCount > 0 && (
                    <span className="ml-1 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                      {pendingCount}
                    </span>
                  )}
                </button>
                
                {user.role === 'ADMIN' && (
                  <button
                    onClick={() => setActiveTab('users')}
                    className={`flex-1 py-4 px-6 text-center font-medium flex items-center justify-center gap-2 transition-colors ${
                      activeTab === 'users'
                        ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Users className="w-5 h-5" />
                    User Management
                    {users.length > 0 && (
                      <span className="ml-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                        {users.length}
                      </span>
                    )}
                  </button>
                )}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              <AnimatePresence mode="wait">
                {activeTab === 'posts' ? (
                  <motion.div
                    key="posts"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    {/* Post Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <SearchBar
                        value={postFilters.search}
                        onChange={(value) => handlePostFilterChange('search', value)}
                        placeholder="Search posts..."
                        className="md:col-span-2"
                      />
                      
                      <FilterDropdown
                        value={postFilters.status}
                        onChange={(value) => handlePostFilterChange('status', value)}
                        options={postStatusOptions}
                        placeholder="Filter by status"
                      />
                    </div>

                    {/* Posts List */}
                    {postsLoading && !posts.length ? (
                      <div className="flex justify-center py-12">
                        <LoadingSpinner size="lg" />
                      </div>
                    ) : postsError && !posts.length ? (
                      <ErrorState
                        title="Error Loading Posts"
                        message={postsError.message}
                        onRetry={fetchPosts}
                      />
                    ) : posts.length === 0 ? (
                      <EmptyState
                        title="No posts found"
                        description="No posts match your current filters."
                        icon={<FileText className="w-12 h-12" />}
                        action={
                          postFilters.status || postFilters.search ? (
                            <Button
                              onClick={() => {
                                setPostFilters({
                                  page: 1,
                                  limit: 10,
                                  status: '',
                                  search: ''
                                });
                              }}
                              variant="outline"
                            >
                              Clear Filters
                            </Button>
                          ) : null
                        }
                      />
                    ) : (
                      <div className="space-y-4">
                        {posts.map(post => (
                          <PostCard
                            key={post.id}
                            post={post}
                            onApprove={() => handleApprovePost(post.id)}
                            onReject={(reason) => handleRejectPost(post.id, reason)}
                            showApproveButton={post.status === 'PENDING'}
                            showRejectButton={post.status === 'PENDING'}
                            showAuthorInfo={true}
                            showStatusBadge={true}
                            className="shadow-md hover:shadow-lg transition-shadow"
                          />
                        ))}
                      </div>
                    )}

                    {/* Pagination */}
                    {postsPagination.totalPages > 1 && (
                      <div className="pt-6 border-t border-gray-100">
                        <Pagination
                          currentPage={postFilters.page}
                          totalPages={postsPagination.totalPages}
                          totalItems={postsPagination.total}
                          itemsPerPage={postFilters.limit}
                          onPageChange={(page) => handlePostFilterChange('page', page)}
                          showInfo={true}
                        />
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="users"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    {/* Create User Form */}
                    {showCreateUser && (
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                        <h3 className="text-xl font-bold text-blue-800 mb-4 flex items-center gap-2">
                          <Plus className="w-5 h-5" />
                          Create New User
                        </h3>
                        <form onSubmit={handleCreateUser} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                              label="Email Address"
                              type="email"
                              value={newUser.email}
                              onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                              placeholder="user@example.com"
                              required
                              disabled={creatingUser}
                            />
                            <Input
                              label="Full Name"
                              value={newUser.name}
                              onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="John Doe"
                              required
                              disabled={creatingUser}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Role
                            </label>
                            <select
                              value={newUser.role}
                              onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              disabled={creatingUser}
                            >
                              <option value="USER">User (Can create posts)</option>
                              <option value="ADMIN">Admin (Full system access)</option>
                              <option value="EDITOR">Editor (Can approve/reject posts)</option>
                              <option value="PENDING">Pending (Requires activation)</option>
                            </select>
                          </div>
                          <div className="flex gap-3 pt-2">
                            <Button 
                              type="submit" 
                              disabled={creatingUser}
                              className="flex-1"
                              animateHover
                            >
                              {creatingUser ? (
                                <>
                                  <LoadingSpinner size="sm" className="mr-2" />
                                  Creating User...
                                </>
                              ) : (
                                'Create User Account'
                              )}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setShowCreateUser(false)}
                              disabled={creatingUser}
                            >
                              Cancel
                            </Button>
                          </div>
                        </form>
                      </div>
                    )}

                    {/* User Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <SearchBar
                        value={userFilters.search}
                        onChange={(value) => handleUserFilterChange('search', value)}
                        placeholder="Search users..."
                        className="md:col-span-2"
                      />
                      
                      <FilterDropdown
                        value={userFilters.role}
                        onChange={(value) => handleUserFilterChange('role', value)}
                        options={userRoleOptions}
                        placeholder="Filter by role"
                      />
                    </div>

                    {/* Users List */}
                    {usersLoading && !users.length ? (
                      <div className="flex justify-center py-12">
                        <LoadingSpinner size="lg" />
                      </div>
                    ) : usersError && !users.length ? (
                      <ErrorState
                        title="Error Loading Users"
                        message={usersError.message}
                        onRetry={fetchUsers}
                      />
                    ) : users.length === 0 ? (
                      <EmptyState
                        title="No users found"
                        description={userFilters.search || userFilters.role 
                          ? "No users match your current filters." 
                          : "No users in the system yet."}
                        icon={<Users className="w-12 h-12" />}
                        action={
                          !showCreateUser ? (
                            <Button
                              onClick={() => setShowCreateUser(true)}
                              icon={<Plus className="w-5 h-5" />}
                              animateHover
                            >
                              Create First User
                            </Button>
                          ) : null
                        }
                      />
                    ) : (
                      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  User Details
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Role
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Created
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Posts
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {users.map((userItem) => (
                                <tr key={userItem.id} className="hover:bg-gray-50 transition-colors">
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                                        {userItem.name?.charAt(0)?.toUpperCase() || 'U'}
                                      </div>
                                      <div>
                                        <div className="text-sm font-medium text-gray-900">{userItem.name}</div>
                                        <div className="text-sm text-gray-500">{userItem.email}</div>
                                        {userItem.id === user?.id && (
                                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                                            You
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <StatusBadge 
                                      status={userItem.role?.toLowerCase()} 
                                      size="sm"
                                      showText={false}
                                    />
                                    <span className="ml-2 text-sm text-gray-900">{userItem.role}</span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <StatusBadge 
                                      status={userItem.passwordReset ? 'pending' : 'approved'} 
                                      size="sm"
                                    />
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(userItem.createdAt).toLocaleDateString()}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                    {userItem.postsCount || userItem._count?.posts || 0}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    {userItem.id !== user?.id && userItem.role !== 'ADMIN' ? (
                                      <Button
                                        onClick={() => handleDeleteUser(userItem.id, userItem.name)}
                                        variant="danger"
                                        size="sm"
                                        icon={<Trash2 className="w-4 h-4" />}
                                        animateHover
                                      >
                                        Delete
                                      </Button>
                                    ) : (
                                      <span className="text-gray-400 text-sm">
                                        {userItem.id === user?.id ? 'Current User' : 'Protected'}
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Pagination */}
                        {usersPagination.totalPages > 1 && (
                          <div className="border-t border-gray-200 px-6 py-4">
                            <Pagination
                              currentPage={userFilters.page}
                              totalPages={usersPagination.totalPages}
                              totalItems={usersPagination.total}
                              itemsPerPage={userFilters.limit}
                              onPageChange={(page) => handleUserFilterChange('page', page)}
                              showInfo={true}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}