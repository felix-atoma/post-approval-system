import React from 'react';
import PropTypes from 'prop-types';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Info, 
  Circle 
} from 'lucide-react';

/**
 * Status Badge Component
 */
const StatusBadge = ({ 
  status, 
  size = 'md',
  showIcon = true,
  showText = true,
  className = '',
  pulse = false
}) => {
  const statusConfig = {
    pending: {
      text: 'Pending',
      icon: Clock, // Changed from FiClock to Clock
      colors: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      iconColors: 'text-yellow-500 dark:text-yellow-400'
    },
    approved: {
      text: 'Approved',
      icon: CheckCircle, // Changed from FiCheckCircle to CheckCircle
      colors: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      iconColors: 'text-green-500 dark:text-green-400'
    },
    rejected: {
      text: 'Rejected',
      icon: XCircle, // Changed from FiXCircle to XCircle
      colors: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      iconColors: 'text-red-500 dark:text-red-400'
    },
    draft: {
      text: 'Draft',
      icon: AlertTriangle, // Changed from FiAlertCircle to AlertTriangle
      colors: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
      iconColors: 'text-gray-500 dark:text-gray-400'
    },
    published: {
      text: 'Published',
      icon: CheckCircle, // Changed from FiCheckCircle to CheckCircle
      colors: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      iconColors: 'text-blue-500 dark:text-blue-400'
    },
    archived: {
      text: 'Archived',
      icon: Info, // Changed from FiInfo to Info
      colors: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      iconColors: 'text-purple-500 dark:text-purple-400'
    }
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4'
  };

  const config = statusConfig[status?.toLowerCase()] || statusConfig.draft;
  const Icon = config.icon;

  return (
    <span 
      className={`inline-flex items-center ${sizes[size]} rounded-full font-medium ${config.colors} ${className} ${
        pulse ? 'animate-pulse' : ''
      }`}
      title={config.text}
    >
      {showIcon && Icon && (
        <Icon className={`${iconSizes[size]} mr-1.5 ${config.iconColors}`} />
      )}
      {showText && config.text}
    </span>
  );
};

StatusBadge.propTypes = {
  status: PropTypes.string.isRequired,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  showIcon: PropTypes.bool,
  showText: PropTypes.bool,
  className: PropTypes.string,
  pulse: PropTypes.bool
};

// Convenience exports for common statuses
export const PendingBadge = (props) => <StatusBadge status="pending" {...props} />;
export const ApprovedBadge = (props) => <StatusBadge status="approved" {...props} />;
export const RejectedBadge = (props) => <StatusBadge status="rejected" {...props} />;
export const DraftBadge = (props) => <StatusBadge status="draft" {...props} />;
export const PublishedBadge = (props) => <StatusBadge status="published" {...props} />;
export const ArchivedBadge = (props) => <StatusBadge status="archived" {...props} />;

export default StatusBadge;