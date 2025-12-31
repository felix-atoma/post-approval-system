import React from 'react'
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { postService } from '../../services/post.service';
import PostForm from '../../components/posts/PostForm';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import toast from 'react-hot-toast';

export default function EditPost() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [post, setPost] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      const response = await postService.getPost(id);
      setPost(response.data.post);
    } catch (error) {
      toast.error('Failed to load post');
      navigate('/dashboard');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSubmit = async (formData) => {
    setLoading(true);
    
    try {
      await postService.updatePost(id, formData);
      toast.success('Post updated successfully!');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Failed to update post');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <Loading fullScreen />;
  }

  if (!post || post.status !== 'PENDING') {
    return (
      <div className="max-w-3xl mx-auto text-center py-12">
        <p className="text-gray-500">This post cannot be edited.</p>
        <Button
          onClick={() => navigate('/dashboard')}
          className="mt-4"
        >
          Back to Dashboard
        </Button>
      </div>
    );
  }

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
        
        <h1 className="text-2xl font-bold text-gray-900">Edit Post</h1>
        <p className="text-gray-600 mt-2">
          Edit your post. Only pending posts can be edited.
        </p>
      </div>

      <div className="card p-6">
        <PostForm
          initialData={{
            title: post.title,
            content: post.content
          }}
          onSubmit={handleSubmit}
          loading={loading}
          submitText="Update Post"
        />
      </div>
    </div>
  );
}