import React, { useState } from 'react';
import { format } from 'date-fns';
import Button from '../common/Button';
import { CheckCircle, XCircle, Clock, Eye, Edit, Trash2, AlertCircle } from 'lucide-react';

export default function PostCard({
  post,
  onApprove,
  onReject,
  onView,
  onEdit,
  onDelete,
  showApproveButton = false,
  showRejectButton = false,
  showViewButton = false,
  showEditButton = false,
  showDeleteButton = false,
  showAuthorInfo = false,
  showStatusBadge = true,
  showRejectionReason = true,
  showActions = true,
  className = ''
}) {
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getStatusBadge = () => {
    const statusConfig = {
      PENDING: {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: Clock,
        text: 'Pending Review'
      },
      APPROVED: {
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircle,
        text: 'Approved'
      },
      REJECTED: {
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: XCircle,
        text: 'Rejected'
      }
    };

    const config = statusConfig[post.status] || statusConfig.PENDING;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </span>
    );
  };

  const handleRejectClick = () => {
    if (!showRejectInput) {
      // First click: show the rejection input
      setShowRejectInput(true);
    } else if (rejectionReason.trim()) {
      // Second click with reason: submit the rejection
      handleRejectSubmit();
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectionReason.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onReject(rejectionReason); // Pass the reason string to parent
      setShowRejectInput(false);
      setRejectionReason('');
    } catch (error) {
      console.error('Error rejecting post:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelReject = () => {
    setShowRejectInput(false);
    setRejectionReason('');
  };

  const handleRejectDirect = () => {
    // For compatibility with existing code that might pass event object
    if (onReject) {
      onReject(rejectionReason || '');
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
              {post.title}
            </h3>
            {showAuthorInfo && post.user && (
              <div className="flex items-center text-sm text-gray-600 mb-2">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                  <span className="text-xs font-medium text-blue-600">
                    {post.user.name?.charAt(0) || post.user.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="font-medium">{post.user.name || post.user.email}</span>
              </div>
            )}
          </div>
          {showStatusBadge && (
            <div className="ml-4">
              {getStatusBadge()}
            </div>
          )}
        </div>

        <p className="text-gray-600 line-clamp-3 mb-4">
          {post.content}
        </p>

        {/* Rejection Input (shown when Reject button is clicked) */}
        {showRejectInput && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-900 mb-2">
                  Rejection Reason *
                </p>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a reason for rejecting this post..."
                  className="w-full px-3 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                  rows="3"
                  autoFocus
                  disabled={isSubmitting}
                />
                <div className="flex gap-2 mt-3">
                  <Button
                    onClick={handleRejectSubmit}
                    variant="danger"
                    size="sm"
                    disabled={!rejectionReason.trim() || isSubmitting}
                    className="flex items-center"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 mr-1.5" />
                        Submit Rejection
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleCancelReject}
                    variant="outline"
                    size="sm"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Previous Rejection Reason (display only) */}
        {showRejectionReason && post.status === 'REJECTED' && post.rejectionReason && !showRejectInput && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-900 mb-1">
                  Rejection Reason:
                </p>
                <p className="text-sm text-red-800">
                  {post.rejectionReason}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {/* Meta Information */}
          <div className="text-sm text-gray-500 space-y-1">
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Created {format(new Date(post.createdAt), 'MMM dd, yyyy')}
            </div>
            {post.reviewedBy && (
              <div className="flex items-center text-xs">
                <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Reviewed by {post.reviewedBy.name}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {showActions && !showRejectInput && (
            <div className="flex flex-wrap gap-2">
              {/* Edit Button */}
              {showEditButton && onEdit && (
                <Button
                  onClick={onEdit}
                  variant="outline"
                  size="sm"
                  className="flex items-center"
                >
                  <Edit className="w-4 h-4 mr-1.5" />
                  Edit
                </Button>
              )}

              {/* View Button */}
              {showViewButton && onView && (
                <Button
                  onClick={onView}
                  variant="outline"
                  size="sm"
                  className="flex items-center"
                >
                  <Eye className="w-4 h-4 mr-1.5" />
                  View
                </Button>
              )}

              {/* Approve Button */}
              {showApproveButton && onApprove && (
                <Button
                  onClick={onApprove}
                  variant="success"
                  size="sm"
                  className="flex items-center bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle className="w-4 h-4 mr-1.5" />
                  Approve
                </Button>
              )}

              {/* Reject Button */}
              {showRejectButton && onReject && (
                <Button
                  onClick={handleRejectClick}
                  variant="danger"
                  size="sm"
                  className="flex items-center"
                >
                  <XCircle className="w-4 h-4 mr-1.5" />
                  Reject
                </Button>
              )}

              {/* Delete Button */}
              {showDeleteButton && onDelete && (
                <Button
                  onClick={onDelete}
                  variant="outline"
                  size="sm"
                  className="flex items-center text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                >
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  Delete
                </Button>
              )}
            </div>
          )}

          {/* Cancel button when in rejection input mode */}
          {showActions && showRejectInput && (
            <div className="flex gap-2">
              <Button
                onClick={handleCancelReject}
                variant="outline"
                size="sm"
                disabled={isSubmitting}
              >
                Cancel Rejection
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}