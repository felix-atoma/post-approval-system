import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { postService } from "../../services/post.service";
import { userService } from "../../services/user.service";
import useAuth from "../../hooks/useAuth";

import PostCard from "../../components/posts/PostCard";
import PostFilters from "../../components/posts/PostFilters";
import ReviewModal from "../../components/posts/ReviewModal";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Loading from "../../components/common/Loading";
import toast from "react-hot-toast";

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("posts");

  // Posts state
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    status: "PENDING",
    search: "", // Added search field
  });
  const [posts, setPosts] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);

  // Users state
  const [users, setUsers] = useState([]);
  const [usersPagination, setUsersPagination] = useState({});
  const [usersLoading, setUsersLoading] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState("USER");

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const response = await postService.getAllPosts(
        filters.page,
        filters.limit,
        filters.status,
        filters.search // Pass search parameter
      );

      setPosts(response?.posts || []);
      setPagination(response?.pagination || {});
    } catch {
      toast.error("Failed to load posts");
      setPosts([]);
      setPagination({});
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const response = await userService.getAllUsers(1, 10);
      setUsers(response?.data?.users || response?.users || []);
      setUsersPagination(response?.data?.pagination || response?.pagination || {});
    } catch {
      toast.error("Failed to load users");
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "posts") {
      fetchPosts();
    } else {
      fetchUsers();
    }
  }, [activeTab, filters]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleReview = async (postId, status, rejectionReason) => {
    try {
      await postService.reviewPost(postId, status, rejectionReason);
      toast.success(`Post ${status.toLowerCase()} successfully`);
      setSelectedPost(null);
      fetchPosts();
    } catch {
      toast.error("Failed to review post");
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await userService.createUser(newUserEmail, newUserRole);
      toast.success("User created successfully");
      setShowCreateUser(false);
      setNewUserEmail("");
      setNewUserRole("USER");
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.error?.message || "Failed to create user");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await userService.deleteUser(userId);
      toast.success("User deleted successfully");
      fetchUsers();
    } catch {
      toast.error("Failed to delete user");
    }
  };

  if (loading && activeTab === "posts" && posts.length === 0) {
    return <Loading />;
  }

  const usersList = Array.isArray(users) ? users : [];

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {["posts", "users"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500"
              }`}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === "posts" && (
        <>
          <PostFilters 
            filters={{
              search: filters.search || '',
              status: filters.status || '',
              limit: filters.limit || 10
            }}
            onFilterChange={handleFilterChange}
            showSearch={true}
            showStatusFilter={true}
          />
          
          {loading && posts.length === 0 ? (
            <Loading />
          ) : posts.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              {filters.search ? 'No posts match your search criteria.' : 'No posts found.'}
            </p>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <div key={post.id} className="bg-white rounded-lg shadow overflow-hidden">
                  <PostCard post={post} isAdmin={true} />
                  {post.status === "PENDING" && (
                    <div className="px-6 pb-6">
                      <Button 
                        onClick={() => setSelectedPost(post)}
                        className="w-full md:w-auto"
                      >
                        Review Post
                      </Button>
                    </div>
                  )}
                </div>
              ))}
              
              {/* Pagination controls (optional) */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center items-center space-x-4 mt-6">
                  <Button
                    disabled={filters.page <= 1}
                    onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                    variant="outline"
                  >
                    Previous
                  </Button>
                  <span className="text-gray-600">
                    Page {filters.page} of {pagination.totalPages}
                  </span>
                  <Button
                    disabled={filters.page >= pagination.totalPages}
                    onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                    variant="outline"
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {activeTab === "users" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">User Management</h2>
            <Button 
              onClick={() => setShowCreateUser(!showCreateUser)}
              variant={showCreateUser ? "outline" : "primary"}
            >
              {showCreateUser ? "Cancel" : "Create New User"}
            </Button>
          </div>

          {showCreateUser && (
            <form onSubmit={handleCreateUser} className="bg-white p-6 rounded-lg shadow space-y-4">
              <Input
                label="Email"
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                required
                placeholder="user@example.com"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  className="input w-full"
                >
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                  <option value="EDITOR">Editor</option>
                </select>
              </div>
              <div className="pt-2">
                <Button type="submit" className="w-full md:w-auto">
                  Create User
                </Button>
              </div>
            </form>
          )}

          {usersLoading ? (
            <Loading />
          ) : usersList.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No users found.</p>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {usersList.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {user.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.name || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.role === 'ADMIN' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {selectedPost && (
        <ReviewModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onSubmit={handleReview}
        />
      )}
    </div>
  );
}