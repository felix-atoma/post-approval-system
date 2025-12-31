import React from 'react'
import { useState } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';

export default function PostForm({ 
  initialData = { title: '', content: '' }, 
  onSubmit, 
  loading = false,
  submitText = 'Create Post'
}) {
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label="Title"
        name="title"
        value={formData.title}
        onChange={handleChange}
        error={errors.title}
        placeholder="Enter post title"
        maxLength={200}
      />
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Content
        </label>
        <textarea
          name="content"
          value={formData.content}
          onChange={handleChange}
          rows={10}
          className="input"
          placeholder="Enter post content"
          maxLength={5000}
        />
        {errors.content && (
          <p className="mt-1 text-sm text-danger-600">{errors.content}</p>
        )}
        <div className="mt-1 text-xs text-gray-500 text-right">
          {formData.content.length}/5000 characters
        </div>
      </div>
      
      <div className="flex justify-end">
        <Button 
          type="submit" 
          loading={loading}
          disabled={loading}
        >
          {submitText}
        </Button>
      </div>
    </form>
  );
}