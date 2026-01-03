// src/components/posts/PostCard.jsx - UPDATED VERSION
import React from 'react';
import Button from '../common/Button';
import { CheckCircle, XCircle, Eye, Calendar, User, AlertCircle } from 'lucide-react';

const PostCard = ({ 
  post, 
  onApprove, 
  onReject, 
  onView,
  showApproveButton = true,
  showRejectButton = true,
  showViewButton = true,
  showAuthorInfo = true 
}) => {
  const statusColors = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800'
  };

  const statusIcons = {
    PENDING: AlertCircle,
    APPROVED: CheckCircle,
    REJECTED: XCircle
  };

  const StatusIcon = statusIcons[post.status] || AlertCircle;

  // Handle button clicks
  const handleApproveClick = (e) => {
    e.stopPropagation();
    if (onApprove) onApprove(post);
  };

  const handleRejectClick = (e) => {
    e.stopPropagation();
    if (onReject) onReject(post);
  };

  const handleViewClick = (e) => {
    e.stopPropagation();
    if (onView) onView(post);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{post.title}</h3>
            
            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600">
              {showAuthorInfo && post.author && (
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {post.author.name}
                </span>
              )}
              
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(post.createdAt).toLocaleDateString()}
              </span>
              
              <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusColors[post.status]}`}>
                <StatusIcon className="h-3 w-3" />
                {post.status}
              </span>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2 ml-4">
            {showViewButton && (
              <Button
                onClick={handleViewClick}
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
              >
                <Eye className="h-4 w-4" />
                View
              </Button>
            )}
            
            {showApproveButton && post.status === 'PENDING' && (
              <Button
                onClick={handleApproveClick}
                variant="success"
                size="sm"
                className="flex items-center gap-1"
              >
                <CheckCircle className="h-4 w-4" />
                Approve
              </Button>
            )}
            
            {showRejectButton && post.status === 'PENDING' && (
              <Button
                onClick={handleRejectClick}
                variant="danger"
                size="sm"
                className="flex items-center gap-1"
              >
                <XCircle className="h-4 w-4" />
                Reject
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="prose max-w-none">
          <p className="text-gray-700 line-clamp-3">{post.content}</p>
        </div>
        
        {/* Tags if available */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {post.tags.map((tag, index) => (
              <span 
                key={index}
                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        
        {/* Rejection reason if rejected */}
        {post.status === 'REJECTED' && post.rejectionReason && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-sm font-medium text-red-800">Rejection Reason:</p>
            <p className="text-sm text-red-600">{post.rejectionReason}</p>
          </div>
        )}
        
        {/* Review info if reviewed */}
        {post.reviewedBy && post.updatedAt !== post.createdAt && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Reviewed by {post.reviewedBy.name} on {new Date(post.updatedAt).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostCard;