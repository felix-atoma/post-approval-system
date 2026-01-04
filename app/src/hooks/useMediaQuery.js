import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for responsive design based on media queries
 * @param {string} query - CSS media query string
 * @param {boolean} defaultState - Default state (defaults to false for SSR compatibility)
 * @returns {boolean} Boolean indicating if the media query matches
 */
export function useMediaQuery(query, defaultState = false) {
  const [matches, setMatches] = useState(defaultState);
  const [mediaQueryList, setMediaQueryList] = useState(null);

  // Create media query list object
  useEffect(() => {
    if (typeof window !== 'undefined' && 'matchMedia' in window) {
      const mql = window.matchMedia(query);
      setMediaQueryList(mql);
      setMatches(mql.matches);
    } else {
      // Fallback for SSR/SSG or non-browser environments
      setMatches(defaultState);
    }
  }, [query, defaultState]);

  // Event listener for media query changes
  useEffect(() => {
    if (!mediaQueryList) return;

    const handleChange = (event) => {
      setMatches(event.matches);
    };

    try {
      // Modern browsers support addEventListener
      if (mediaQueryList.addEventListener) {
        mediaQueryList.addEventListener('change', handleChange);
        return () => {
          mediaQueryList.removeEventListener('change', handleChange);
        };
      } 
      // Fallback for older browsers
      else if (mediaQueryList.addListener) {
        mediaQueryList.addListener(handleChange);
        return () => {
          mediaQueryList.removeListener(handleChange);
        };
      }
    } catch (error) {
      console.error('Error setting up media query listener:', error);
    }

    return undefined;
  }, [mediaQueryList]);

  return matches;
}

/**
 * Predefined media query hooks for common breakpoints
 */
export const useBreakpoints = {
  xs: () => useMediaQuery('(max-width: 639px)'),
  sm: () => useMediaQuery('(min-width: 640px) and (max-width: 767px)'),
  md: () => useMediaQuery('(min-width: 768px) and (max-width: 1023px)'),
  lg: () => useMediaQuery('(min-width: 1024px) and (max-width: 1279px)'),
  xl: () => useMediaQuery('(min-width: 1280px) and (max-width: 1535px)'),
  xxl: () => useMediaQuery('(min-width: 1536px)'),
  
  // Common device detection
  mobile: () => useMediaQuery('(max-width: 767px)'),
  tablet: () => useMediaQuery('(min-width: 768px) and (max-width: 1023px)'),
  desktop: () => useMediaQuery('(min-width: 1024px)'),
  
  // Device orientation
  portrait: () => useMediaQuery('(orientation: portrait)'),
  landscape: () => useMediaQuery('(orientation: landscape)'),
  
  // Reduced motion preference
  prefersReducedMotion: () => useMediaQuery('(prefers-reduced-motion: reduce)'),
  
  // Dark mode detection
  prefersDarkMode: () => useMediaQuery('(prefers-color-scheme: dark)'),
  
  // High contrast mode
  prefersHighContrast: () => useMediaQuery('(prefers-contrast: high)'),
};

/**
 * Hook for responsive values based on breakpoints
 * @param {Object} values - Object mapping breakpoints to values
 * @param {any} defaultValue - Default value when no breakpoint matches
 */
export function useResponsiveValue(values, defaultValue) {
  const isMobile = useBreakpoints.mobile();
  const isTablet = useBreakpoints.tablet();
  const isDesktop = useBreakpoints.desktop();
  
  const [value, setValue] = useState(values.default || defaultValue);

  useEffect(() => {
    if (isMobile && values.mobile !== undefined) {
      setValue(values.mobile);
    } else if (isTablet && values.tablet !== undefined) {
      setValue(values.tablet);
    } else if (isDesktop && values.desktop !== undefined) {
      setValue(values.desktop);
    } else if (values.default !== undefined) {
      setValue(values.default);
    } else if (defaultValue !== undefined) {
      setValue(defaultValue);
    }
  }, [isMobile, isTablet, isDesktop, values, defaultValue]);

  return value;
}