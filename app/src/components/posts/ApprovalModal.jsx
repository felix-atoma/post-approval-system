// src/components/posts/ApprovalModal.jsx
import React, { useState } from 'react';
import Button from '../common/Button';
import Input from '../common/Input';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

const ApprovalModal = ({ post, action, onClose, onSubmit }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const isReject = action === 'reject';
  const title = isReject ? 'Reject Post' : 'Approve Post';
  const icon = isReject ? XCircle : CheckCircle;
  const Icon = icon;

  const handleSubmit = async () => {
    if (isReject && (!reason || reason.trim() === '')) {
      alert('Please provide a rejection reason');
      return;
    }

    setLoading(true);
    try {
      if (isReject) {
        await onSubmit(reason);
      } else {
        await onSubmit();
      }
    } catch (error) {
      console.error('Error submitting:', error);
      // Don't close modal on error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-full ${
              isReject ? 'bg-red-100' : 'bg-green-100'
            }`}>
              <Icon className={`h-6 w-6 ${
                isReject ? 'text-red-600' : 'text-green-600'
              }`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-600">Post: {post?.title}</p>
            </div>
          </div>

          {/* Warning for reject */}
          {isReject && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    Rejection requires a reason
                  </p>
                  <p className="text-sm text-yellow-700 mt-1">
                    The author will see this reason when their post is rejected.
                    Be specific and constructive.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Post Details:</h4>
            <div className="bg-gray-50 rounded p-3 text-sm">
              <p className="font-medium">{post?.title}</p>
              <p className="text-gray-600 mt-1 line-clamp-3">{post?.content}</p>
              <div className="mt-2 text-xs text-gray-500">
                By: {post?.author?.name || 'Unknown'} • 
                Created: {new Date(post?.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Reason input for rejection */}
          {isReject && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason *
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Provide a clear reason for rejecting this post..."
                required
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                This will be visible to the post author
              </p>
            </div>
          )}

          {/* Approve confirmation */}
          {!isReject && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                Are you sure you want to approve this post? Once approved, it will be
                visible to all users.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant={isReject ? "danger" : "success"}
              onClick={handleSubmit}
              disabled={loading || (isReject && !reason.trim())}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {isReject ? 'Rejecting...' : 'Approving...'}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {isReject ? 'Reject Post' : 'Approve Post'}
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApprovalModal;