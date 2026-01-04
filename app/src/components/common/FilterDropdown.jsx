import React, { useState, useRef, useEffect } from 'react';
import { Filter, ChevronDown, Check } from 'lucide-react';

/**
 * Filter Dropdown Component
 * @param {Object} props
 * @param {string|number|Array} props.value - Current value(s)
 * @param {function} props.onChange - Change handler
 * @param {Array} props.options - Options array
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.className - Additional CSS classes
 * @param {'sm'|'md'|'lg'} props.size - Size variant
 * @param {boolean} props.disabled - Disabled state
 * @param {boolean} props.multiple - Allow multiple selection
 * @param {boolean} props.clearable - Allow clearing selection
 */
const FilterDropdown = ({
  value,
  onChange,
  options = [],
  placeholder = 'Filter by...',
  className = '',
  size = 'md',
  disabled = false,
  multiple = false,
  clearable = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValues, setSelectedValues] = useState(multiple ? (Array.isArray(value) ? value : []) : []);
  const dropdownRef = useRef(null);

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5',
    lg: 'px-5 py-3 text-lg'
  };

  // Initialize selected values
  useEffect(() => {
    if (multiple) {
      setSelectedValues(Array.isArray(value) ? value : []);
    } else {
      setSelectedValues(value ? [value] : []);
    }
  }, [value, multiple]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleSelect = (optionValue) => {
    if (multiple) {
      const newValues = selectedValues.includes(optionValue)
        ? selectedValues.filter(v => v !== optionValue)
        : [...selectedValues, optionValue];
      
      setSelectedValues(newValues);
      onChange(newValues);
    } else {
      setSelectedValues([optionValue]);
      onChange(optionValue);
      setIsOpen(false);
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    if (multiple) {
      setSelectedValues([]);
      onChange([]);
    } else {
      setSelectedValues([]);
      onChange('');
    }
  };

  const getDisplayText = () => {
    if (selectedValues.length === 0) {
      return placeholder;
    }

    if (multiple) {
      if (selectedValues.length === 1) {
        const option = options.find(opt => opt.value === selectedValues[0]);
        return option ? option.label : selectedValues[0];
      }
      return `${selectedValues.length} selected`;
    } else {
      const option = options.find(opt => opt.value === selectedValues[0]);
      return option ? option.label : selectedValues[0];
    }
  };

  const getSelectedOptions = () => {
    return options.filter(opt => selectedValues.includes(opt.value));
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`flex items-center justify-between w-full bg-white dark:bg-gray-800 border ${
          isOpen 
            ? 'border-blue-500 dark:border-blue-400 ring-2 ring-blue-500/20 dark:ring-blue-400/20' 
            : 'border-gray-300 dark:border-gray-600'
        } rounded-xl transition-all duration-200 ${sizes[size]} ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400 dark:hover:border-gray-500'
        }`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center flex-1 overflow-hidden">
          <Filter className={`w-4 h-4 mr-2 flex-shrink-0 ${
            selectedValues.length > 0 ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
          }`} />
          
          <span className={`truncate ${
            selectedValues.length > 0 
              ? 'text-gray-900 dark:text-white' 
              : 'text-gray-500 dark:text-gray-400'
          }`}>
            {getDisplayText()}
          </span>
          
          {selectedValues.length > 0 && clearable && (
            <button
              type="button"
              onClick={handleClear}
              className="ml-2 p-0.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Clear filter"
            >
              <span className="text-xs text-gray-400 dark:text-gray-500">×</span>
            </button>
          )}
        </div>
        
        <ChevronDown className={`w-4 h-4 ml-2 transition-transform duration-200 ${
          isOpen ? 'transform rotate-180' : ''
        } ${selectedValues.length > 0 ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}`} />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg py-2 z-50 max-h-64 overflow-y-auto">
          {options.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
              No options available
            </div>
          ) : (
            options.map((option) => {
              const isSelected = selectedValues.includes(option.value);
              const Icon = option.icon;
              
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`flex items-center w-full px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                    isSelected ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'
                  }`}
                  role="option"
                  aria-selected={isSelected}
                >
                  {Icon && (
                    <Icon className={`w-4 h-4 mr-3 flex-shrink-0 ${
                      isSelected ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
                    }`} />
                  )}
                  
                  <span className="flex-1 truncate">{option.label}</span>
                  
                  {isSelected && (
                    <Check className="w-4 h-4 ml-2 text-blue-500 dark:text-blue-400 flex-shrink-0" />
                  )}
                  
                  {option.count !== undefined && (
                    <span className={`ml-2 px-1.5 py-0.5 text-xs rounded-full ${
                      isSelected 
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}>
                      {option.count}
                    </span>
                  )}
                </button>
              );
            })
          )}
          
          {multiple && selectedValues.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2 px-4">
              <button
                type="button"
                onClick={() => {
                  setSelectedValues([]);
                  onChange([]);
                }}
                className="w-full text-sm text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 py-2"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterDropdown;