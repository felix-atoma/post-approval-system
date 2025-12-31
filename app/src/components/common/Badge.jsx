import React from 'react';

export default function Badge({ 
  children, 
  variant = 'primary',
  size = 'medium' 
}) {
  const variants = {
    primary: 'bg-primary-100 text-primary-800',
    success: 'bg-success-100 text-success-800',
    warning: 'bg-warning-100 text-warning-800',
    danger: 'bg-danger-100 text-danger-800',
    gray: 'bg-gray-100 text-gray-800'
  };
  
  const sizes = {
    small: 'px-2 py-0.5 text-xs',
    medium: 'px-2.5 py-0.5 text-sm'
  };
  
  const classes = `inline-flex items-center rounded-full font-medium ${variants[variant]} ${sizes[size]}`;
  
  return (
    <span className={classes}>
      {children}
    </span>
  );
}