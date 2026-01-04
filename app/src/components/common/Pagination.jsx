import React from 'react';
import PropTypes from 'prop-types';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

/**
 * Pagination Component
 */
const Pagination = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  className = '',
  showInfo = true,
  showFirstLast = true,
  showPrevNext = true,
  maxVisiblePages = 5,
  size = 'md'
}) => {
  if (totalPages <= 1) return null;

  const sizes = {
    sm: 'px-2.5 py-1.5 text-sm',
    md: 'px-3 py-2',
    lg: 'px-4 py-2.5'
  };

  const getPageNumbers = () => {
    const pages = [];
    const half = Math.floor(maxVisiblePages / 2);
    let start = Math.max(currentPage - half, 1);
    let end = Math.min(start + maxVisiblePages - 1, totalPages);

    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(end - maxVisiblePages + 1, 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  const pageNumbers = getPageNumbers();
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}>
      {showInfo && totalItems > 0 && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing <span className="font-semibold text-gray-900 dark:text-white">{startItem}</span> to{' '}
          <span className="font-semibold text-gray-900 dark:text-white">{endItem}</span> of{' '}
          <span className="font-semibold text-gray-900 dark:text-white">{totalItems.toLocaleString()}</span> items
        </div>
      )}
      
      <div className="flex items-center space-x-1">
        {/* First page button */}
        {showFirstLast && (
          <button
            type="button"
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            className={`${sizes[size]} rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
            aria-label="Go to first page"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
        )}
        
        {/* Previous page button */}
        {showPrevNext && (
          <button
            type="button"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`${sizes[size]} rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
            aria-label="Go to previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
        
        {/* Page numbers */}
        {pageNumbers[0] > 1 && (
          <>
            <button
              type="button"
              onClick={() => handlePageChange(1)}
              className={`${sizes[size]} min-w-[2.5rem] rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors`}
            >
              1
            </button>
            {pageNumbers[0] > 2 && (
              <span className="px-2 text-gray-500 dark:text-gray-400">...</span>
            )}
          </>
        )}
        
        {pageNumbers.map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => handlePageChange(page)}
            className={`${sizes[size]} min-w-[2.5rem] rounded-lg border transition-colors ${
              currentPage === page
                ? 'border-blue-500 dark:border-blue-400 bg-blue-500 dark:bg-blue-600 text-white'
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
            aria-current={currentPage === page ? 'page' : undefined}
          >
            {page}
          </button>
        ))}
        
        {pageNumbers[pageNumbers.length - 1] < totalPages && (
          <>
            {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
              <span className="px-2 text-gray-500 dark:text-gray-400">...</span>
            )}
            <button
              type="button"
              onClick={() => handlePageChange(totalPages)}
              className={`${sizes[size]} min-w-[2.5rem] rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors`}
            >
              {totalPages}
            </button>
          </>
        )}
        
        {/* Next page button */}
        {showPrevNext && (
          <button
            type="button"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`${sizes[size]} rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
            aria-label="Go to next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
        
        {/* Last page button */}
        {showFirstLast && (
          <button
            type="button"
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
            className={`${sizes[size]} rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
            aria-label="Go to last page"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        )}
      </div>
      
      {/* Page size selector (optional) */}
      {itemsPerPage && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <span className="font-medium">{itemsPerPage}</span> per page
        </div>
      )}
    </div>
  );
};

Pagination.propTypes = {
  currentPage: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  totalItems: PropTypes.number,
  itemsPerPage: PropTypes.number,
  onPageChange: PropTypes.func.isRequired,
  className: PropTypes.string,
  showInfo: PropTypes.bool,
  showFirstLast: PropTypes.bool,
  showPrevNext: PropTypes.bool,
  maxVisiblePages: PropTypes.number,
  size: PropTypes.oneOf(['sm', 'md', 'lg'])
};

export default Pagination;