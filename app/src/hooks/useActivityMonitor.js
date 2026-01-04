import { useEffect, useRef, useCallback } from 'react';
import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';

/**
 * Custom hook for monitoring user activity with debouncing and throttling
 */
export function useActivityMonitor({
  enabled = true,
  debounceTime = 30000,
  throttleTime = 1000,
  onActivity,
  events = ['click', 'keydown', 'mousemove', 'scroll', 'touchstart', 'focus', 'input'],
  target = typeof window !== 'undefined' ? window : undefined,
  passive = true,
  capture = false,
} = {}) {
  const metricsRef = useRef({
    lastActivity: new Date(),
    totalActivities: 0,
    activityCount: 0,
    lastEventType: '',
  });
  
  const isProcessingRef = useRef(false);
  const cleanupRef = useRef(null);

  // Create debounced activity handler
  const debouncedHandler = useCallback(
    debounce(async (eventType) => {
      if (isProcessingRef.current) return;
      
      isProcessingRef.current = true;
      metricsRef.current.activityCount++;
      metricsRef.current.lastActivity = new Date();
      metricsRef.current.lastEventType = eventType;

      try {
        await onActivity();
      } catch (error) {
        console.error('Error in activity handler:', error);
      } finally {
        isProcessingRef.current = false;
      }
    }, debounceTime, {
      leading: true,
      trailing: false,
      maxWait: debounceTime * 2,
    }),
    [onActivity, debounceTime]
  );

  // Create throttled activity handler for high-frequency events
  const throttledHandler = useCallback(
    throttle((eventType) => {
      metricsRef.current.totalActivities++;
      debouncedHandler(eventType);
    }, throttleTime, {
      leading: true,
      trailing: true,
    }),
    [debouncedHandler, throttleTime]
  );

  // Combined handler
  const activityHandler = useCallback(
    (event) => {
      if (!enabled) return;
      
      const eventType = event.type;
      throttledHandler(eventType);
    },
    [enabled, throttledHandler]
  );

  // Setup event listeners
  useEffect(() => {
    if (!enabled || !target) return;

    // Clear any existing listeners
    if (cleanupRef.current) {
      cleanupRef.current();
    }

    // Add event listeners
    const eventListenerOptions = { passive, capture };
    
    events.forEach(eventName => {
      target.addEventListener(eventName, activityHandler, eventListenerOptions);
    });

    // Store cleanup function
    cleanupRef.current = () => {
      events.forEach(eventName => {
        target.removeEventListener(eventName, activityHandler, eventListenerOptions);
      });
      debouncedHandler.cancel();
      throttledHandler.cancel();
    };

    // Initial activity detection for page load
    const handleInitialActivity = () => {
      if (document.visibilityState === 'visible') {
        debouncedHandler('visibilitychange');
      }
    };

    document.addEventListener('visibilitychange', handleInitialActivity);
    
    // Also check on page load
    if (document.visibilityState === 'visible') {
      setTimeout(() => debouncedHandler('page_load'), 1000);
    }

    // Return cleanup function
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      document.removeEventListener('visibilitychange', handleInitialActivity);
    };
  }, [enabled, target, events, activityHandler, passive, capture, debouncedHandler, throttledHandler]);

  // Reset metrics
  const resetMetrics = useCallback(() => {
    metricsRef.current = {
      lastActivity: new Date(),
      totalActivities: 0,
      activityCount: 0,
      lastEventType: '',
    };
  }, []);

  // Get current metrics
  const getMetrics = useCallback(() => ({
    ...metricsRef.current,
  }), []);

  // Get idle time in milliseconds
  const getIdleTime = useCallback(() => {
    return Date.now() - metricsRef.current.lastActivity.getTime();
  }, []);

  // Check if user is idle
  const isIdle = useCallback((thresholdMs = 30000) => {
    return getIdleTime() > thresholdMs;
  }, [getIdleTime]);

  // Manually trigger activity
  const triggerActivity = useCallback((eventType = 'manual') => {
    if (enabled) {
      debouncedHandler(eventType);
    }
  }, [enabled, debouncedHandler]);

  return {
    getMetrics,
    resetMetrics,
    getIdleTime,
    isIdle,
    triggerActivity,
  };
}