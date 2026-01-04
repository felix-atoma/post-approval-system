import React from 'react';
import PropTypes from 'prop-types';

/**
 * Stats Card Component for Dashboard
 */
const StatsCard = ({ 
  title, 
  value, 
  icon: Icon, 
  color = 'blue',
  trend = null,
  description = '',
  loading = false,
  onClick = null
}) => {
  const colorClasses = {
    blue: 'from-blue-500 to-cyan-500',
    green: 'from-emerald-500 to-green-500',
    red: 'from-rose-500 to-pink-500',
    yellow: 'from-amber-500 to-orange-500',
    purple: 'from-purple-500 to-indigo-500',
    gray: 'from-gray-600 to-gray-700'
  };

  const iconBgClasses = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    green: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    red: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
    yellow: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    gray: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
  };

  const handleClick = () => {
    if (onClick && !loading) {
      onClick();
    }
  };

  return (
    <div 
      className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 transition-all duration-200 hover:shadow-xl ${onClick ? 'cursor-pointer hover:-translate-y-1' : ''}`}
      onClick={handleClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {title}
          </p>
          {loading ? (
            <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-2"></div>
          ) : (
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
          )}
        </div>
        
        {Icon && (
          <div className={`w-12 h-12 rounded-xl ${iconBgClasses[color]} flex items-center justify-center`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
      
      {trend !== null && !loading && (
        <div className="flex items-center mt-4">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            trend > 0 
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
              : trend < 0 
              ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
          }`}>
            {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'}
            <span className="ml-1">
              {Math.abs(trend)}%
            </span>
          </span>
          {description && (
            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
              {description}
            </span>
          )}
        </div>
      )}
      
      {!trend && description && !loading && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
          {description}
        </p>
      )}
      
      {loading && !description && (
        <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-4"></div>
      )}
    </div>
  );
};

StatsCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  icon: PropTypes.elementType,
  color: PropTypes.oneOf(['blue', 'green', 'red', 'yellow', 'purple', 'gray']),
  trend: PropTypes.number,
  description: PropTypes.string,
  loading: PropTypes.bool,
  onClick: PropTypes.func
};

export default StatsCard;