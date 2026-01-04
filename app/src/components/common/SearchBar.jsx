import React, { useState, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';

/**
 * Search Bar Component with debounce
 * @param {Object} props
 * @param {string} props.value - Current search value
 * @param {function} props.onChange - Change handler
 * @param {string} props.placeholder - Placeholder text
 * @param {number} props.delay - Debounce delay in milliseconds
 * @param {string} props.className - Additional CSS classes
 * @param {'sm'|'md'|'lg'} props.size - Size variant
 * @param {boolean} props.disabled - Disabled state
 * @param {boolean} props.autoFocus - Auto focus on mount
 */
const SearchBar = ({ 
  value = '', 
  onChange, 
  placeholder = 'Search...', 
  delay = 300,
  className = '',
  size = 'md',
  disabled = false,
  autoFocus = false
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5',
    lg: 'px-5 py-3 text-lg'
  };

  // Debounce the onChange callback
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputValue !== value) {
        onChange(inputValue);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [inputValue, delay, onChange, value]);

  // Sync with external value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleClear = useCallback(() => {
    setInputValue('');
    onChange('');
  }, [onChange]);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleClear();
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className={`relative flex items-center bg-white dark:bg-gray-800 border ${
        isFocused 
          ? 'border-blue-500 dark:border-blue-400 ring-2 ring-blue-500/20 dark:ring-blue-400/20' 
          : 'border-gray-300 dark:border-gray-600'
      } rounded-xl transition-all duration-200 ${sizes[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
        <Search className={`w-5 h-5 ${
          isFocused ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
        } transition-colors duration-200`} />
        
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          className="flex-1 ml-3 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
          aria-label={placeholder}
        />
        
        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled}
            className="ml-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Clear search"
          >
            <X className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          </button>
        )}
      </div>
      
      {/* Search hint */}
      {isFocused && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 text-xs text-gray-500 dark:text-gray-400 z-10">
          Press Enter to search, Esc to clear
        </div>
      )}
    </div>
  );
};

export default SearchBar;