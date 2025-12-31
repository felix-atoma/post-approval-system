import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import usePosts from "../../hooks/usePosts";
import PostCard from "../../components/posts/PostCard";
import PostFilters from "../../components/posts/PostFilters";
import Button from "../../components/common/Button";
import Loading from "../../components/common/Loading";

export default function UserDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    status: "",
    search: ""
  });

  const { posts, loading, error, pagination, fetchPosts } = usePosts(filters);

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

  // Update PostFilters to use the new props format
  const postFiltersProps = {
    filters: {
      search: filters.search || '',
      status: filters.status || '',
      limit: filters.limit || 10
    },
    onFilterChange: handleFilterChange,
    showSearch: true,
    showStatusFilter: true
  };

  if (loading && !posts.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center py-12">
          <p className="text-red-600">Error loading posts: {error.message}</p>
          <Button
            onClick={() => fetchPosts()}
            className="mt-4"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Dashboard header content */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Welcome, {user?.name || user?.email}!</h1>
            <p className="text-gray-600 mt-2">Manage your posts and track their status</p>
          </div>
          <Button 
            onClick={() => navigate("/posts/new")}
            className="w-full md:w-auto"
          >
            Create New Post
          </Button>
        </div>

        <PostFilters {...postFiltersProps} />

        {posts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="max-w-md mx-auto">
              <p className="text-gray-500 text-lg mb-4">
                {filters.search || filters.status 
                  ? "No posts match your filters." 
                  : "You haven't created any posts yet."}
              </p>
              <Button
                onClick={() => navigate("/posts/new")}
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
                  onEdit={(post) => navigate(`/posts/edit/${post.id}`)}
                  onDelete={async (postId) => {
                    if (window.confirm("Are you sure you want to delete this post?")) {
                      // Handle delete - you'll need to implement this
                      console.log("Delete post:", postId);
                    }
                  }}
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