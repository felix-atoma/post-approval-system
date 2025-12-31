import React from 'react';

export default function Logo({ className = "h-8 w-auto" }) {
  return (
    <div className={`flex items-center ${className}`}>
      <div className="flex items-center">
        <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-lg">P</span>
        </div>
        <div className="ml-2">
          <span className="text-xl font-bold text-gray-900">PostApproval</span>
          <span className="text-xs font-medium text-blue-600 block">System</span>
        </div>
      </div>
    </div>
  );
}