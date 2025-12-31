import React from 'react';
import { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';

export default function ReviewModal({ 
  post, 
  isOpen, 
  onClose, 
  onReview 
}) {
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    try {
      await onReview(post.id, { status: 'APPROVED' });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    
    setLoading(true);
    try {
      await onReview(post.id, { 
        status: 'REJECTED', 
        rejectionReason 
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Review Post"
      actions={
        <>
          <Button
            variant="success"
            onClick={handleApprove}
            loading={loading}
            disabled={loading}
          >
            Approve
          </Button>
          <Button
            variant="danger"
            onClick={handleReject}
            loading={loading}
            disabled={loading}
            className="ml-3"
          >
            Reject
          </Button>
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={loading}
            className="ml-3"
          >
            Cancel
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <h4 className="font-medium text-gray-900">{post.title}</h4>
          <p className="text-sm text-gray-600 mt-2">{post.content}</p>
          <p className="text-xs text-gray-500 mt-2">By {post.user?.name}</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rejection Reason (Required if rejecting)
          </label>
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows="3"
            className="input"
            placeholder="Provide a reason for rejection..."
            maxLength={500}
          />
        </div>
      </div>
    </Modal>
  );
}