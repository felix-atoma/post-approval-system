import React from 'react';

export default function Loading({ size = 'medium', fullScreen = false }) {
  const sizes = {
    small: 'h-6 w-6',
    medium: 'h-12 w-12',
    large: 'h-16 w-16'
  };
  
  const spinner = (
    <div className="flex items-center justify-center">
      <div className={`animate-spin rounded-full border-4 border-gray-300 border-t-primary-600 ${sizes[size]}`}></div>
    </div>
  );
  
  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-75">
        {spinner}
      </div>
    );
  }
  
  return spinner;
}