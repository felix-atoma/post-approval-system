import React from 'react';
import { formatDate } from '../../utils/helpers';
import Badge from '../common/Badge';

export default function PostCard({ post, onReview, showActions = false }) {
  const getStatusVariant = (status) => {
    switch (status) {
      case 'APPROVED':
        return 'success';
      case 'REJECTED':
        return 'danger';
      default:
        return 'warning';
    }
  };

  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-lg font-medium text-gray-900">{post.title}</h3>
              <Badge variant={getStatusVariant(post.status)}>
                {post.status}
              </Badge>
            </div>
            
            <p className="text-gray-600 mb-4">{post.content}</p>
            
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div>
                <span className="font-medium">Author:</span>
                <span className="ml-2">{post.user?.name}</span>
              </div>
              <div>
                <span className="font-medium">Created:</span>
                <span className="ml-2">{formatDate(post.createdAt)}</span>
              </div>
            </div>
            
            {post.rejectionReason && (
              <div className="mt-4 p-3 bg-danger-50 rounded-lg">
                <p className="text-sm font-medium text-danger-800">Rejection Reason:</p>
                <p className="text-sm text-danger-700 mt-1">{post.rejectionReason}</p>
              </div>
            )}
          </div>
          
          {showActions && post.status === 'PENDING' && (
            <button
              onClick={() => onReview(post)}
              className="ml-4 btn-primary"
            >
              Review
            </button>
          )}
        </div>
      </div>
    </div>
  );
}