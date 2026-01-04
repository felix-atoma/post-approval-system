import React, { forwardRef, useState } from 'react';

/**
 * Professional Button Component with CSS animations and enhanced features
 * 
 * @prop {React.ReactNode} children - Button content
 * @prop {string} type - Button type (button, submit, reset)
 * @prop {string} variant - Style variant (primary, secondary, success, danger, outline, ghost, gradient)
 * @prop {string} size - Size (xs, sm, md, lg, xl)
 * @prop {boolean} loading - Loading state
 * @prop {boolean} disabled - Disabled state
 * @prop {string} className - Additional CSS classes
 * @prop {React.ReactNode} leftIcon - Icon on the left
 * @prop {React.ReactNode} rightIcon - Icon on the right
 * @prop {boolean} fullWidth - Full width button
 * @prop {boolean} rounded - Fully rounded button
 * @prop {boolean} animateHover - Enable hover animations
 * @prop {boolean} animatePress - Enable press animations
 * @prop {string} loadingText - Custom loading text
 * @prop {string} tooltip - Tooltip text
 * @prop {object} iconAnimation - Icon animation settings
 * @prop {function} onClick - Click handler
 */

const Button = forwardRef(({ 
  children, 
  type = 'button', 
  variant = 'primary', 
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  leftIcon,
  rightIcon,
  fullWidth = false,
  rounded = false,
  animateHover = true,
  animatePress = true,
  loadingText = 'Loading...',
  tooltip = '',
  iconAnimation = { left: false, right: false },
  onClick,
  ...props 
}, ref) => {
  const [isPressed, setIsPressed] = useState(false);
  
  // Base classes
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed select-none';
  
  // Variants
  const variants = {
    primary: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 focus:ring-blue-500 shadow-md hover:shadow-lg active:scale-[0.98]',
    secondary: 'bg-gradient-to-r from-gray-700 to-gray-800 text-white hover:from-gray-800 hover:to-gray-900 focus:ring-gray-500 shadow-sm hover:shadow active:scale-[0.98]',
    success: 'bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700 focus:ring-emerald-500 shadow-md hover:shadow-lg active:scale-[0.98]',
    danger: 'bg-gradient-to-r from-rose-600 to-pink-600 text-white hover:from-rose-700 hover:to-pink-700 focus:ring-rose-500 shadow-md hover:shadow-lg active:scale-[0.98]',
    warning: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 focus:ring-amber-500 shadow-md hover:shadow-lg active:scale-[0.98]',
    info: 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600 focus:ring-cyan-500 shadow-md hover:shadow-lg active:scale-[0.98]',
    outline: 'bg-transparent text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-blue-500 active:bg-gray-100 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-800',
    'outline-primary': 'bg-transparent text-blue-600 border border-blue-300 hover:bg-blue-50 focus:ring-blue-500 active:bg-blue-100 dark:text-blue-400 dark:border-blue-500 dark:hover:bg-blue-900/20',
    'outline-success': 'bg-transparent text-emerald-600 border border-emerald-300 hover:bg-emerald-50 focus:ring-emerald-500 active:bg-emerald-100 dark:text-emerald-400 dark:border-emerald-500 dark:hover:bg-emerald-900/20',
    'outline-danger': 'bg-transparent text-rose-600 border border-rose-300 hover:bg-rose-50 focus:ring-rose-500 active:bg-rose-100 dark:text-rose-400 dark:border-rose-500 dark:hover:bg-rose-900/20',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500 active:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-800',
    'ghost-primary': 'bg-transparent text-blue-600 hover:bg-blue-50 focus:ring-blue-500 active:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/20',
    link: 'bg-transparent text-blue-600 hover:text-blue-800 hover:underline focus:ring-blue-500 p-0 active:text-blue-900',
    gradient: 'bg-gradient-to-r from-purple-600 via-pink-500 to-rose-500 text-white hover:shadow-lg focus:ring-purple-500 shadow-md hover:shadow-xl active:scale-[0.98]',
  };
  
  // Sizes
  const sizes = {
    xs: 'px-2.5 py-1.5 text-xs',
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-5 py-3 text-base',
    xl: 'px-6 py-3.5 text-lg',
  };
  
  // Border radius
  const borderRadius = rounded ? 'rounded-full' : 'rounded-xl';
  
  // Width
  const widthClass = fullWidth ? 'w-full' : '';
  
  // Animation classes
  const animationClasses = animateHover ? 'transform transition-transform hover:scale-[1.03]' : '';
  const pressAnimationClasses = animatePress ? 'active:scale-[0.97]' : '';
  
  // Icon sizes
  const iconSizes = {
    xs: 'h-3.5 w-3.5',
    sm: 'h-4 w-4',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
    xl: 'h-6 w-6',
  };
  
  // Icon spacing
  const iconSpacing = {
    xs: 'space-x-1.5',
    sm: 'space-x-2',
    md: 'space-x-2',
    lg: 'space-x-2.5',
    xl: 'space-x-3',
  };
  
  // Build final classes
  const classes = `${baseClasses} ${variants[variant] || variants.primary} ${sizes[size]} ${borderRadius} ${widthClass} ${animationClasses} ${pressAnimationClasses} ${isPressed ? 'scale-[0.97]' : ''} ${className}`;
  
  // Loading spinner component
  const LoadingSpinner = () => (
    <svg
      className={`${iconSizes[size]} text-current animate-spin`}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
  
  // Animated icon wrapper
  const AnimatedIcon = ({ icon, direction = 'left', animate = false }) => {
    if (!icon) return null;
    
    const iconElement = React.cloneElement(icon, {
      className: `${iconSizes[size]} ${icon.props?.className || ''} ${animate ? 'animate-pulse' : ''}`
    });
    
    return iconElement;
  };
  
  // Handle click with press animation
  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
    }
  };
  
  // Button content
  const renderContent = () => {
    if (loading) {
      return (
        <span className={`flex items-center ${iconSpacing[size]}`}>
          <LoadingSpinner />
          <span>{loadingText}</span>
        </span>
      );
    }
    
    return (
      <span className={`flex items-center ${iconSpacing[size]}`}>
        <AnimatedIcon 
          icon={leftIcon} 
          direction="left" 
          animate={iconAnimation.left}
        />
        <span>{children}</span>
        <AnimatedIcon 
          icon={rightIcon} 
          direction="right" 
          animate={iconAnimation.right}
        />
      </span>
    );
  };
  
  // Handle mouse events for press animation
  const handleMouseDown = () => {
    if (animatePress && !disabled && !loading) {
      setIsPressed(true);
    }
  };
  
  const handleMouseUp = () => {
    setIsPressed(false);
  };
  
  const handleMouseLeave = () => {
    setIsPressed(false);
  };
  
  // Button element
  const buttonElement = (
    <button
      ref={ref}
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      aria-label={props['aria-label'] || (typeof children === 'string' ? children : undefined)}
      {...props}
    >
      {renderContent()}
    </button>
  );
  
  // Wrap with tooltip if provided
  if (tooltip && !disabled && !loading) {
    return (
      <div className="relative group inline-block">
        {buttonElement}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
          {tooltip}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-2 h-2 bg-gray-900 rotate-45"></div>
          </div>
        </div>
      </div>
    );
  }
  
  return buttonElement;
});

// Add display name for better dev tools
Button.displayName = 'Button';

// Pre-styled button variants for common use cases
export const PrimaryButton = forwardRef((props, ref) => (
  <Button ref={ref} variant="primary" {...props} />
));

export const SecondaryButton = forwardRef((props, ref) => (
  <Button ref={ref} variant="secondary" {...props} />
));

export const SuccessButton = forwardRef((props, ref) => (
  <Button ref={ref} variant="success" {...props} />
));

export const DangerButton = forwardRef((props, ref) => (
  <Button ref={ref} variant="danger" {...props} />
));

export const WarningButton = forwardRef((props, ref) => (
  <Button ref={ref} variant="warning" {...props} />
));

export const InfoButton = forwardRef((props, ref) => (
  <Button ref={ref} variant="info" {...props} />
));

export const OutlineButton = forwardRef((props, ref) => (
  <Button ref={ref} variant="outline" {...props} />
));

export const GhostButton = forwardRef((props, ref) => (
  <Button ref={ref} variant="ghost" {...props} />
));

export const LinkButton = forwardRef((props, ref) => (
  <Button ref={ref} variant="link" {...props} />
));

export const GradientButton = forwardRef((props, ref) => (
  <Button ref={ref} variant="gradient" {...props} />
));

// Icon button variant (square, icon only)
export const IconButton = forwardRef(({ 
  icon, 
  size = 'md',
  variant = 'ghost',
  ...props 
}, ref) => {
  const iconButtonSizes = {
    xs: 'p-1.5',
    sm: 'p-2',
    md: 'p-2.5',
    lg: 'p-3',
    xl: 'p-3.5',
  };
  
  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      className={`${iconButtonSizes[size]} aspect-square !p-0`}
      {...props}
    >
      {React.cloneElement(icon, {
        className: `${iconSizes[size]} ${icon.props?.className || ''}`
      })}
    </Button>
  );
});

IconButton.displayName = 'IconButton';

// Button group component
export const ButtonGroup = ({ 
  children, 
  orientation = 'horizontal',
  className = '',
  spacing = 'md',
  fullWidth = false
}) => {
  const orientations = {
    horizontal: 'flex-row',
    vertical: 'flex-col'
  };
  
  const spacings = {
    xs: 'gap-0.5',
    sm: 'gap-1',
    md: 'gap-2',
    lg: 'gap-3',
    xl: 'gap-4'
  };
  
  const widthClass = fullWidth ? 'w-full' : '';
  
  return (
    <div className={`flex ${orientations[orientation]} ${spacings[spacing]} ${widthClass} ${className}`}>
      {React.Children.map(children, (child, index) => {
        if (!child || !React.isValidElement(child)) return null;
        
        // Add specific classes to buttons in group
        let roundedClass = '';
        if (orientation === 'horizontal') {
          if (React.Children.count(children) === 1) {
            roundedClass = 'rounded-xl';
          } else if (index === 0) {
            roundedClass = 'rounded-l-xl rounded-r-none';
          } else if (index === React.Children.count(children) - 1) {
            roundedClass = 'rounded-r-xl rounded-l-none';
          } else {
            roundedClass = 'rounded-none';
          }
        } else {
          if (React.Children.count(children) === 1) {
            roundedClass = 'rounded-xl';
          } else if (index === 0) {
            roundedClass = 'rounded-t-xl rounded-b-none';
          } else if (index === React.Children.count(children) - 1) {
            roundedClass = 'rounded-b-xl rounded-t-none';
          } else {
            roundedClass = 'rounded-none';
          }
        }
        
        return React.cloneElement(child, {
          className: `${child.props.className || ''} ${roundedClass} ${fullWidth ? 'flex-1' : ''}`
        });
      })}
    </div>
  );
};

// Export as default and named exports
export default Button;