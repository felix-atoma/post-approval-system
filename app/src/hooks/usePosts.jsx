import React from 'react';
import { useState, useEffect } from 'react';
import { postService } from '../services/post.service';

export default function usePosts(params = {}) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await postService.getMyPosts(params);
      setPosts(response.data.posts);
      setPagination(response.data.pagination);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [params.page, params.limit, params.status, params.search]);

  return {
    posts,
    loading,
    error,
    pagination,
    refetch: fetchPosts
  };
}