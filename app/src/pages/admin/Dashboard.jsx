// src/pages/admin/Dashboard.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import postService from '../../services/post.service';
import userService from '../../services/user.service';
import PostCard from '../../components/posts/PostCard';
import PostFilters from '../../components/posts/PostFilters';
import ApprovalModal from '../../components/posts/ApprovalModal';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Loading from '../../components/common/Loading';
import Alert from '../../components/common/Alert';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Eye, AlertTriangle, Users, FileText } from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
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
  const [postToApprove, setPostToApprove] = useState(null);
  const [postToReject, setPostToReject] = useState(null);
  
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

  const fetchPosts = useCallback(async () => {
    if (fetchingPosts.current) return;

    try {
      fetchingPosts.current = true;
      setPostsLoading(true);
      setPostsError(null);
      
      const response = await postService.getAllPosts({
        page: postFilters.page,
        limit: postFilters.limit,
        status: postFilters.status || '',
        search: postFilters.search || ''
      });
      
      if (response && response.success === true) {
        setPosts(response.posts || []);
        setPostsPagination(response.pagination || {});
      } else {
        const errorMsg = response?.error?.message || 'Failed to fetch posts';
        setPostsError(new Error(errorMsg));
        toast.error(errorMsg);
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
      let errorMessage = 'Failed to load posts';
      if (err.response?.status === 403) {
        errorMessage = 'Access denied. Admin/Editor privileges required.';
      } else if (err.response?.data?.error?.message) {
        errorMessage = err.response.data.error.message;
      }
      setPostsError(new Error(errorMessage));
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
      
      const response = await userService.getAllUsers(
        userFilters.page,
        userFilters.limit,
        userFilters.search || '',
        userFilters.role || ''
      );
      
      if (response && response.success === true) {
        setUsers(response.users || []);
        setUsersPagination(response.pagination || {});
      } else {
        const errorMsg = response?.error?.message || 'Failed to fetch users';
        setUsersError(new Error(errorMsg));
        toast.error(errorMsg);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      const errorMessage = err.response?.data?.error?.message || 'Failed to load users';
      setUsersError(new Error(errorMessage));
      toast.error(errorMessage);
    } finally {
      setUsersLoading(false);
      fetchingUsers.current = false;
    }
  }, [userFilters.page, userFilters.limit, userFilters.search, userFilters.role]);

  useEffect(() => {
    if (activeTab === 'posts') {
      fetchPosts();
    } else if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab, fetchPosts, fetchUsers]);

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

  const handlePostPageChange = (newPage) => {
    handlePostFilterChange("page", newPage);
  };

  const handleUserPageChange = (newPage) => {
    handleUserFilterChange("page", newPage);
  };

  const handleApprovePost = async (postId) => {
    try {
      const response = await postService.reviewPost(postId, { 
        status: 'APPROVED' 
      });
      
      if (response && response.success === true) {
        toast.success('Post approved successfully!');
        // Update local state
        setPosts(prevPosts => 
          prevPosts.map(post => 
            post.id === postId 
              ? { 
                  ...post, 
                  status: 'APPROVED', 
                  rejectionReason: null,
                  reviewedBy: response.post?.reviewedBy || { name: user?.name },
                  updatedAt: new Date().toISOString() 
                }
              : post
          )
        );
        setPostToApprove(null);
      } else {
        toast.error(response?.error?.message || 'Failed to approve post');
      }
    } catch (error) {
      console.error('Approve post error:', error);
      const errorMessage = error.response?.data?.error?.message || 'Failed to approve post';
      toast.error(errorMessage);
    }
  };

  const handleRejectPost = async (postId, rejectionReason) => {
    if (!rejectionReason || rejectionReason.trim() === '') {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      const response = await postService.reviewPost(postId, { 
        status: 'REJECTED',
        rejectionReason: rejectionReason.trim()
      });
      
      if (response && response.success === true) {
        toast.success('Post rejected successfully');
        // Update local state
        setPosts(prevPosts => 
          prevPosts.map(post => 
            post.id === postId 
              ? { 
                  ...post, 
                  status: 'REJECTED', 
                  rejectionReason: rejectionReason.trim(),
                  reviewedBy: response.post?.reviewedBy || { name: user?.name },
                  updatedAt: new Date().toISOString() 
                }
              : post
          )
        );
        setPostToReject(null);
      } else {
        toast.error(response?.error?.message || 'Failed to reject post');
      }
    } catch (error) {
      console.error('Reject post error:', error);
      const errorMessage = error.response?.data?.error?.message || 'Failed to reject post';
      toast.error(errorMessage);
    }
  };

  const openApproveModal = (post) => {
    setPostToApprove(post);
  };

  const openRejectModal = (post) => {
    setPostToReject(post);
  };

  const onApproveSubmit = async () => {
    if (postToApprove) {
      await handleApprovePost(postToApprove.id);
    }
  };

  const onRejectSubmit = async (rejectionReason) => {
    if (postToReject) {
      await handleRejectPost(postToReject.id, rejectionReason);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    if (!newUser.email || !newUser.name) {
      toast.error('Email and name are required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUser.email)) {
      toast.error('Invalid email address');
      return;
    }

    setCreatingUser(true);
    
    try {
      const response = await userService.createUser(
        newUser.email, 
        newUser.name, 
        newUser.role
      );
      
      if (response && response.success === true) {
        toast.success('User created successfully!');
        setShowCreateUser(false);
        setNewUser({ email: '', name: '', role: 'USER' });
        fetchUsers();
      } else {
        toast.error(response?.error?.message || 'Failed to create user');
      }
    } catch (error) {
      console.error('Create user error:', error);
      toast.error(error.response?.data?.error?.message || 'Failed to create user');
    } finally {
      setCreatingUser(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      const response = await userService.deleteUser(userId);
      
      if (response && response.success === true) {
        toast.success('User deleted successfully');
        fetchUsers();
      } else {
        toast.error(response?.error?.message || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Delete user error:', error);
      toast.error('Failed to delete user');
    }
  };

  const postFiltersProps = {
    filters: {
      search: postFilters.search || '',
      status: postFilters.status || '',
      limit: postFilters.limit || 10
    },
    onFilterChange: handlePostFilterChange,
    showSearch: true,
    showStatusFilter: true,
    showUserFilter: false,
    defaultStatus: 'PENDING'
  };

  // Check admin/editor access
  if (!user || (user.role !== 'ADMIN' && user.role !== 'EDITOR')) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto text-center">
          <Alert 
            type="error" 
            message="Admin or Editor access required"
            className="mb-6"
          />
          <Button onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const renderPostsTab = () => {
    if (postsLoading && !posts.length) {
      return (
        <div className="flex justify-center py-12">
          <Loading />
        </div>
      );
    }

    if (postsError && !posts.length) {
      return (
        <div className="text-center py-12">
          <Alert type="error" message={postsError.message} />
          <Button onClick={fetchPosts} className="mt-4">
            Retry
          </Button>
        </div>
      );
    }

    const pendingCount = posts.filter(p => p.status === 'PENDING').length;
    const approvedCount = posts.filter(p => p.status === 'APPROVED').length;
    const rejectedCount = posts.filter(p => p.status === 'REJECTED').length;

    return (
      <>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold">{pendingCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold">{approvedCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rejected</p>
                <p className="text-2xl font-bold">{rejectedCount}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-bold">Post Approval Management</h2>
          <p className="text-gray-600">
            Review and approve/reject user submissions. Rejections require a reason.
          </p>
          <div className="mt-2 text-sm text-gray-500">
            Role: <span className="font-semibold">{user.role}</span>
          </div>
        </div>

        <PostFilters {...postFiltersProps} />

        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No posts found with the current filters</p>
            {postFilters.status === 'PENDING' && (
              <Button
                onClick={() => handlePostFilterChange('status', '')}
                variant="outline"
                className="mt-4"
              >
                View All Posts
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                onApprove={() => openApproveModal(post)}
                onReject={() => openRejectModal(post)}
                onView={() => navigate(`/posts/${post.id}`)}
                showApproveButton={post.status === 'PENDING' && (user.role === 'ADMIN' || user.role === 'EDITOR')}
                showRejectButton={post.status === 'PENDING' && (user.role === 'ADMIN' || user.role === 'EDITOR')}
                showViewButton={true}
                showAuthorInfo={true}
              />
            ))}
          </div>
        )}

        {postsPagination.totalPages > 1 && (
          <div className="flex justify-between items-center mt-6">
            <Button
              onClick={() => handlePostPageChange(postFilters.page - 1)}
              disabled={postFilters.page === 1}
            >
              Previous
            </Button>
            <span>Page {postFilters.page} of {postsPagination.totalPages}</span>
            <Button
              onClick={() => handlePostPageChange(postFilters.page + 1)}
              disabled={postFilters.page === postsPagination.totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </>
    );
  };

  // Only show user management for admins
  const renderUsersTab = () => {
    if (user.role !== 'ADMIN') {
      return (
        <div className="text-center py-12">
          <Alert 
            type="error" 
            message="Admin access required for user management"
            className="mb-6"
          />
          <p className="text-gray-600 mb-4">
            You need to be an administrator to manage users.
          </p>
        </div>
      );
    }

    if (usersLoading && !users.length) {
      return (
        <div className="flex justify-center py-12">
          <Loading />
          <div className="ml-4">
            <p className="text-gray-500">Loading users...</p>
          </div>
        </div>
      );
    }

    if (usersError && !users.length) {
      return (
        <div className="text-center py-12">
          <Alert type="error" message={usersError.message || 'Failed to load users'} />
          <Button onClick={fetchUsers} className="mt-4">
            Retry Loading Users
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">User Management</h2>
            <p className="text-gray-600">Create and manage user accounts (Admin only)</p>
          </div>
          
          <Button 
            onClick={() => setShowCreateUser(!showCreateUser)}
            variant={showCreateUser ? "outline" : "primary"}
          >
            {showCreateUser ? "Cancel" : "Create New User"}
          </Button>
        </div>

        {/* Create User Form */}
        {showCreateUser && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Create New User</h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={creatingUser}
                >
                  <option value="USER">User (Can create posts)</option>
                  <option value="ADMIN">Admin (Can approve/reject posts & manage users)</option>
                  <option value="EDITOR">Editor (Can approve/reject posts)</option>
                  <option value="PENDING">Pending (Requires activation)</option>
                </select>
              </div>
              <div className="pt-2">
                <Button 
                  type="submit" 
                  disabled={creatingUser}
                  className="w-full md:w-auto"
                >
                  {creatingUser ? "Creating User..." : "Create User Account"}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Users Search & Filter */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                type="search"
                placeholder="Search users by email or name..."
                value={userFilters.search || ''}
                onChange={(e) => handleUserFilterChange('search', e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={userFilters.role || ''}
                onChange={(e) => handleUserFilterChange('role', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Roles</option>
                <option value="USER">Users Only</option>
                <option value="ADMIN">Admins Only</option>
                <option value="EDITOR">Editors Only</option>
                <option value="PENDING">Pending Only</option>
              </select>
              {(userFilters.search || userFilters.role) && (
                <Button
                  variant="outline"
                  onClick={() => setUserFilters(prev => ({ ...prev, search: '', role: '' }))}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Users Table */}
        {users.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <p className="text-gray-500">
              {userFilters.search || userFilters.role 
                ? "No users match your filters." 
                : "No users found."}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
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
                    <tr key={userItem.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{userItem.name}</div>
                          <div className="text-sm text-gray-500">{userItem.email}</div>
                          {userItem.id === user?.id && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                              You
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          userItem.role === 'ADMIN' 
                            ? 'bg-purple-100 text-purple-800' 
                            : userItem.role === 'EDITOR'
                            ? 'bg-blue-100 text-blue-800'
                            : userItem.role === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {userItem.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          userItem.passwordReset 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {userItem.passwordReset ? 'Setup Required' : 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(userItem.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {userItem.postsCount || userItem._count?.posts || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {userItem.id !== user?.id && userItem.role !== 'ADMIN' ? (
                          <Button
                            onClick={() => handleDeleteUser(userItem.id)}
                            variant="danger"
                            size="sm"
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
            {usersPagination && usersPagination.totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between border-t border-gray-200 px-6 py-4 gap-4">
                <div className="text-sm text-gray-700">
                  <p>
                    Showing <span className="font-medium">{(userFilters.page - 1) * userFilters.limit + 1}</span> to{" "}
                    <span className="font-medium">
                      {Math.min(userFilters.page * userFilters.limit, usersPagination.total)}
                    </span>{" "}
                    of <span className="font-medium">{usersPagination.total}</span> users
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => handleUserPageChange(userFilters.page - 1)}
                    disabled={userFilters.page === 1}
                    size="sm"
                  >
                    Previous
                  </Button>
                  <div className="flex items-center">
                    <span className="px-3 text-sm text-gray-700">
                      Page {userFilters.page} of {usersPagination.totalPages}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => handleUserPageChange(userFilters.page + 1)}
                    disabled={userFilters.page === usersPagination.totalPages}
                    size="sm"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-600">Welcome, {user?.name}! ({user?.role})</p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('posts')}
              className={`py-4 px-1 border-b-2 font-medium flex items-center gap-2 ${
                activeTab === 'posts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileText className="h-5 w-5" />
              Post Approvals
              {postFilters.status === 'PENDING' && posts.length > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                  {posts.filter(p => p.status === 'PENDING').length}
                </span>
              )}
            </button>
            {user.role === 'ADMIN' && (
              <button
                onClick={() => setActiveTab('users')}
                className={`py-4 px-1 border-b-2 font-medium flex items-center gap-2 ${
                  activeTab === 'users'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Users className="h-5 w-5" />
                User Management
              </button>
            )}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'posts' ? renderPostsTab() : renderUsersTab()}

        {/* Approval Modal */}
        {postToApprove && (
          <ApprovalModal
            post={postToApprove}
            action="approve"
            onClose={() => setPostToApprove(null)}
            onSubmit={onApproveSubmit}
          />
        )}

        {/* Rejection Modal */}
        {postToReject && (
          <ApprovalModal
            post={postToReject}
            action="reject"
            onClose={() => setPostToReject(null)}
            onSubmit={onRejectSubmit}
          />
        )}
      </div>
    </div>
  );
}