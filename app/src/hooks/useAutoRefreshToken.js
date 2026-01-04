import { useCallback, useRef, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

/**
 * Custom hook for automatic token refresh with retry logic and error handling
 */
export function useAutoRefreshToken(options = {}) {
  const { 
    refreshToken: authRefreshToken, 
    user, 
    logout 
  } = useAuth();
  
  const {
    refreshThreshold = 60,
    maxRetries = 3,
    retryDelay = 5000,
    showNotifications = true,
    refreshOnMount = true,
    refreshOnFocus = true,
    storageKeys = {},
  } = options;

  const tokenExpiryKey = storageKeys.tokenExpiry || 'tokenExpiry';
  const refreshAttemptsKey = storageKeys.refreshAttempts || 'refreshAttempts';
  const lastRefreshKey = storageKeys.lastRefresh || 'lastRefresh';
  
  const isRefreshingRef = useRef(false);
  const retryCountRef = useRef(0);
  const refreshTimeoutRef = useRef(null);
  const retryTimeoutRef = useRef(null);

  // Calculate token expiry
  const calculateTimeToExpiry = useCallback(() => {
    if (typeof window === 'undefined') return Infinity;
    
    try {
      const tokenExpiry = localStorage.getItem(tokenExpiryKey);
      if (tokenExpiry) {
        const now = Math.floor(Date.now() / 1000);
        const expiryTime = parseInt(tokenExpiry, 10);
        
        if (!isNaN(expiryTime)) {
          return Math.max(0, expiryTime - now);
        }
      }
    } catch (error) {
      console.error('Error calculating token expiry:', error);
    }
    
    return Infinity;
  }, [tokenExpiryKey]);

  // Get refresh attempts from storage
  const getRefreshAttempts = useCallback(() => {
    if (typeof window === 'undefined') return 0;
    
    try {
      const attempts = localStorage.getItem(refreshAttemptsKey);
      return attempts ? parseInt(attempts, 10) : 0;
    } catch {
      return 0;
    }
  }, [refreshAttemptsKey]);

  // Save refresh attempts to storage
  const saveRefreshAttempts = useCallback((attempts) => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(refreshAttemptsKey, attempts.toString());
    } catch (error) {
      console.error('Error saving refresh attempts:', error);
    }
  }, [refreshAttemptsKey]);

  // Save last refresh time
  const saveLastRefresh = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(lastRefreshKey, Date.now().toString());
    } catch (error) {
      console.error('Error saving last refresh time:', error);
    }
  }, [lastRefreshKey]);

  // Get last refresh time
  const getLastRefresh = useCallback(() => {
    if (typeof window === 'undefined') return null;
    
    try {
      const timestamp = localStorage.getItem(lastRefreshKey);
      return timestamp ? new Date(parseInt(timestamp, 10)) : null;
    } catch {
      return null;
    }
  }, [lastRefreshKey]);

  // Clear refresh data
  const clearRefreshData = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(refreshAttemptsKey);
      localStorage.removeItem(lastRefreshKey);
    } catch (error) {
      console.error('Error clearing refresh data:', error);
    }
  }, [refreshAttemptsKey, lastRefreshKey]);

  // Core refresh function
  const refreshToken = useCallback(async () => {
    if (!authRefreshToken || typeof authRefreshToken !== 'function') {
      console.warn('No refresh token function available');
      return false;
    }

    if (isRefreshingRef.current) {
      console.log('Refresh already in progress');
      return false;
    }

    isRefreshingRef.current = true;

    try {
      await authRefreshToken();
      
      // Reset retry count on success
      retryCountRef.current = 0;
      saveRefreshAttempts(0);
      saveLastRefresh();
      
      if (showNotifications) {
        toast.success('Session refreshed');
      }
      
      return true;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      
      // Increment retry count
      retryCountRef.current++;
      saveRefreshAttempts(retryCountRef.current);
      
      // Check if max retries exceeded
      if (retryCountRef.current >= maxRetries) {
        if (showNotifications) {
          toast.error('Maximum refresh attempts exceeded. Please log in again.', {
            duration: 5000,
            icon: '🔒',
          });
        }
        
        clearRefreshData();
        
        // Force logout
        if (logout && typeof logout === 'function') {
          setTimeout(() => logout(), 1000);
        }
      } else {
        // Schedule retry
        if (showNotifications) {
          toast.error(`Session refresh failed. Retrying in ${retryDelay / 1000} seconds...`, {
            duration: 3000,
            icon: '🔄',
          });
        }
        
        retryTimeoutRef.current = setTimeout(() => {
          refreshToken();
        }, retryDelay);
      }
      
      return false;
    } finally {
      isRefreshingRef.current = false;
    }
  }, [
    authRefreshToken,
    logout,
    maxRetries,
    retryDelay,
    showNotifications,
    saveRefreshAttempts,
    saveLastRefresh,
    clearRefreshData,
  ]);

  // Safe refresh wrapper with additional checks
  const refreshTokenSafely = useCallback(async () => {
    if (!user) {
      console.log('No user logged in, skipping token refresh');
      return false;
    }

    const timeToExpiry = calculateTimeToExpiry();
    
    // Don't refresh if token is still valid for a while
    if (timeToExpiry > refreshThreshold * 2) {
      return false;
    }

    // Check if we've attempted too many times recently
    const attempts = getRefreshAttempts();
    if (attempts >= maxRetries) {
      console.warn('Maximum refresh attempts reached');
      return false;
    }

    // Check last refresh time to avoid too frequent refreshes
    const lastRefresh = getLastRefresh();
    if (lastRefresh) {
      const timeSinceLastRefresh = Date.now() - lastRefresh.getTime();
      if (timeSinceLastRefresh < 30000) { // 30 seconds cooldown
        console.log('Too soon since last refresh');
        return false;
      }
    }

    return refreshToken();
  }, [
    user,
    refreshToken,
    calculateTimeToExpiry,
    refreshThreshold,
    getRefreshAttempts,
    maxRetries,
    getLastRefresh,
  ]);

  // Schedule automatic refresh
  const scheduleAutoRefresh = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    const timeToExpiry = calculateTimeToExpiry();
    
    // Only schedule if token is expiring within threshold
    if (timeToExpiry > refreshThreshold) {
      const timeUntilRefresh = (timeToExpiry - refreshThreshold) * 1000;
      
      if (timeUntilRefresh > 0) {
        refreshTimeoutRef.current = setTimeout(() => {
          refreshTokenSafely();
        }, timeUntilRefresh);
      }
    }
  }, [calculateTimeToExpiry, refreshThreshold, refreshTokenSafely]);

  // Get token status
  const getTokenStatus = useCallback(() => {
    const timeToExpiry = calculateTimeToExpiry();
    
    return {
      isExpired: timeToExpiry <= 0,
      isExpiringSoon: timeToExpiry > 0 && timeToExpiry <= refreshThreshold,
      expiresIn: timeToExpiry,
      lastRefreshed: getLastRefresh(),
    };
  }, [calculateTimeToExpiry, refreshThreshold, getLastRefresh]);

  // Cancel any pending refresh operations
  const cancelRefresh = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
    
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  // Effects
  useEffect(() => {
    // Initial setup
    retryCountRef.current = getRefreshAttempts();
    
    // Schedule auto-refresh on mount
    if (refreshOnMount && user) {
      refreshTokenSafely();
    }
    
    // Setup auto-refresh scheduling
    scheduleAutoRefresh();
    
    // Setup interval to re-schedule auto-refresh
    const interval = setInterval(scheduleAutoRefresh, 60000); // Check every minute
    
    return () => {
      cancelRefresh();
      clearInterval(interval);
    };
  }, [user, refreshOnMount, refreshTokenSafely, scheduleAutoRefresh, cancelRefresh, getRefreshAttempts]);

  // Refresh on window focus
  useEffect(() => {
    if (!refreshOnFocus || !user) return;

    const handleFocus = () => {
      refreshTokenSafely();
    };

    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [refreshOnFocus, user, refreshTokenSafely]);

  // Refresh on visibility change
  useEffect(() => {
    if (!user) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshTokenSafely();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, refreshTokenSafely]);

  return {
    refreshToken,
    refreshTokenSafely,
    getTokenStatus,
    cancelRefresh,
  };
}

/**
 * Hook for token refresh with exponential backoff
 */
export function useExponentialBackoffRefresh(options = {}) {
  const [backoffDelay, setBackoffDelay] = useState(options.retryDelay || 5000);
  const attemptsRef = useRef(0);

  const { refreshTokenSafely } = useAutoRefreshToken(options);

  const refreshWithBackoff = useCallback(async () => {
    const result = await refreshTokenSafely();
    
    if (!result) {
      attemptsRef.current++;
      // Exponential backoff: 5s, 10s, 20s, 40s...
      const nextDelay = Math.min(
        (options.retryDelay || 5000) * Math.pow(2, attemptsRef.current),
        60000 // Max 1 minute
      );
      setBackoffDelay(nextDelay);
    } else {
      attemptsRef.current = 0;
      setBackoffDelay(options.retryDelay || 5000);
    }
    
    return result;
  }, [refreshTokenSafely, options.retryDelay]);

  return {
    refreshWithBackoff,
    currentBackoffDelay: backoffDelay,
    attempts: attemptsRef.current,
  };
}