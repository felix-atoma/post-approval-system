import React from 'react'
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { postService } from '../../services/post.service';
import PostForm from '../../components/posts/PostForm';
import Button from '../../components/common/Button';
import toast from 'react-hot-toast';

export default function CreatePost() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (formData) => {
    setLoading(true);
    
    try {
      await postService.createPost(formData);
      toast.success('Post created successfully!');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Button
          variant="secondary"
          onClick={() => navigate('/dashboard')}
          className="mb-4"
        >
          ← Back to Dashboard
        </Button>
        
        <h1 className="text-2xl font-bold text-gray-900">Create New Post</h1>
        <p className="text-gray-600 mt-2">
          Create a new post. All posts will be reviewed by administrators before approval.
        </p>
      </div>

      <div className="card p-6">
        <PostForm
          onSubmit={handleSubmit}
          loading={loading}
          submitText="Create Post"
        />
      </div>
    </div>
  );
}