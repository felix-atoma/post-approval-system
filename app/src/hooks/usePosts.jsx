// app/src/hooks/usePosts.js
import { useState, useEffect } from 'react';
import postService from '../services/post.service';

export default function usePosts(filters = {}) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await postService.getMyPosts(filters);
      
      if (response.success) {
        setPosts(response.posts || []);
        setPagination(response.pagination || {});
      } else {
        setError(new Error(response.error?.message || 'Failed to fetch posts'));
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [filters.page, filters.limit, filters.status, filters.search]);

  const refetch = () => {
    fetchPosts();
  };

  return { posts, loading, error, pagination, refetch };
}