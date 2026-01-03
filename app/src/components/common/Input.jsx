import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

// Helper function to filter out non-DOM props
const filterInputProps = (props) => {
  const {
    label,
    type = 'text',
    error,
    helperText,
    className = '',
    leftIcon,
    rightIcon,
    showPasswordToggle = false,
    onTogglePassword,
    containerClassName = '',
    labelClassName = '',
    inputClassName = '',
    errorClassName = '',
    helperTextClassName = '',
    // Extract all other props to pass to input
    ...inputProps
  } = props;

  return {
    filteredProps: {
      label,
      type,
      error,
      helperText,
      className,
      leftIcon,
      rightIcon,
      showPasswordToggle,
      onTogglePassword,
      containerClassName,
      labelClassName,
      inputClassName,
      errorClassName,
      helperTextClassName,
    },
    inputProps // These will go directly to the <input> element
  };
};

const Input = forwardRef((props, ref) => {
  const { filteredProps, inputProps } = filterInputProps(props);
  
  const {
    label,
    type = 'text',
    error,
    helperText,
    className = '',
    leftIcon,
    rightIcon,
    showPasswordToggle = false,
    onTogglePassword,
    containerClassName = '',
    labelClassName = '',
    inputClassName = '',
    errorClassName = '',
    helperTextClassName = '',
  } = filteredProps;

  const [showPassword, setShowPassword] = useState(false);

  // Determine the actual input type
  const getInputType = () => {
    if (showPasswordToggle && type === 'password') {
      return showPassword ? 'text' : 'password';
    }
    return type;
  };

  const handleTogglePassword = () => {
    const newShowPassword = !showPassword;
    setShowPassword(newShowPassword);
    if (onTogglePassword) {
      onTogglePassword(newShowPassword);
    }
  };

  // Base input classes
  const baseInputClasses = "w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed";
  
  // Error state classes
  const errorClasses = error 
    ? "border-danger-500 focus:ring-danger-500 focus:border-danger-500" 
    : "border-gray-300 focus:ring-blue-500";
  
  // Padding adjustments for icons
  const paddingClasses = `
    ${leftIcon ? 'pl-10' : ''}
    ${rightIcon || showPasswordToggle ? 'pr-10' : ''}
  `;

  return (
    <div className={`space-y-2 ${containerClassName}`}>
      {label && (
        <label className={`block text-sm font-medium text-gray-700 ${labelClassName}`}>
          {label}
          {inputProps.required && <span className="text-danger-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {/* Left Icon */}
        {leftIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
            {React.isValidElement(leftIcon) 
              ? React.cloneElement(leftIcon, { size: 20 })
              : leftIcon
            }
          </div>
        )}
        
        {/* Input Element */}
        <input
          ref={ref}
          type={getInputType()}
          className={`
            ${baseInputClasses}
            ${errorClasses}
            ${paddingClasses}
            ${inputClassName}
            ${className}
          `.trim()}
          {...inputProps} // Spread only valid input props
        />
        
        {/* Right Icon or Password Toggle */}
        {showPasswordToggle && type === 'password' ? (
          <button
            type="button"
            onClick={handleTogglePassword}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff size={20} />
            ) : (
              <Eye size={20} />
            )}
          </button>
        ) : rightIcon ? (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
            {React.isValidElement(rightIcon) 
              ? React.cloneElement(rightIcon, { size: 20 })
              : rightIcon
            }
          </div>
        ) : null}
      </div>
      
      {/* Error Message */}
      {error && (
        <p className={`text-sm text-danger-600 ${errorClassName}`}>
          {error}
        </p>
      )}
      
      {/* Helper Text */}
      {helperText && !error && (
        <p className={`text-sm text-gray-500 ${helperTextClassName}`}>
          {helperText}
        </p>
      )}
    </div>
  );
});

// Add display name for better debugging
Input.displayName = 'Input';

export default Input;