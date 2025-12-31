import React from 'react';
import Input from '../common/Input';

export default function PostFilters({ 
  filters, 
  onFilterChange,
  showSearch = true,
  showStatusFilter = true 
}) {
  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'REJECTED', label: 'Rejected' }
  ];

  // Safe access to filter values with defaults
  const searchValue = filters?.search || '';
  const statusValue = filters?.status || '';
  const limitValue = filters?.limit || 10;

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {showSearch && (
          <div>
            <Input
              label="Search"
              placeholder="Search by title or content..."
              value={searchValue}
              onChange={(e) => onFilterChange('search', e.target.value)}
              className="w-full"
            />
          </div>
        )}
        
        {showStatusFilter && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              className="input w-full"
              value={statusValue}
              onChange={(e) => onFilterChange('status', e.target.value)}
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Items per page
          </label>
          <select
            className="input w-full"
            value={limitValue}
            onChange={(e) => onFilterChange('limit', parseInt(e.target.value))}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>
      
      {/* Optional: Search feedback */}
      {searchValue && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Searching for: <span className="font-medium">"{searchValue}"</span>
          </p>
          <button
            type="button"
            onClick={() => onFilterChange('search', '')}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Clear search
          </button>
        </div>
      )}
    </div>
  );
}