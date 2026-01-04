import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';

/**
 * Fixed session timer - counts from 5:00 to 0:00 completely before resetting
 */
export function useSessionTimer(options = {}) {
  const {
    warningThreshold = 60,
    onExpired,
    showNotifications = true,
  } = options;

  // UI state
  const [displayTime, setDisplayTime] = useState(300);
  
  // Refs for values that need to persist across re-renders
  const timeRemainingRef = useRef(300);
  const timerRef = useRef(null);
  const lastActivityRef = useRef(Date.now());
  const isActiveRef = useRef(true);
  const mountedRef = useRef(true);
  const hasReachedZeroRef = useRef(false);

  // Reset timer to 5 minutes
  const resetTimer = useCallback(() => {
    if (!mountedRef.current) return;
    
    timeRemainingRef.current = 300;
    lastActivityRef.current = Date.now();
    hasReachedZeroRef.current = false;
    
    // Update display
    setDisplayTime(300);
    
    // Save to localStorage
    const expiryTime = Math.floor(Date.now() / 1000) + 300;
    localStorage.setItem('tokenExpiry', expiryTime.toString());
    
    console.log('Timer reset to 5:00');
    
    // Restart timer if it was stopped
    if (!timerRef.current) {
      startTimer();
    }
  }, []);

  // Format time
  const formatTime = useCallback((seconds) => {
    const secs = seconds ?? displayTime;
    const mins = Math.floor(secs / 60);
    const secsRemaining = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${secsRemaining.toString().padStart(2, '0')}`;
  }, [displayTime]);

  // Start/stop timer
  const startTimer = useCallback(() => {
    if (timerRef.current || !mountedRef.current) return;
    
    console.log('Starting timer countdown from 5:00...');
    
    timerRef.current = setInterval(() => {
      if (!mountedRef.current || !isActiveRef.current) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        return;
      }
      
      // Decrement the ref value
      timeRemainingRef.current -= 1;
      
      // Update UI state
      setDisplayTime(timeRemainingRef.current);
      
      console.log(`Timer: ${formatTime(timeRemainingRef.current)}`);
      
      // Check for warning (only once)
      if (timeRemainingRef.current === warningThreshold && showNotifications) {
        toast.warning('Session expires in 1 minute', {
          duration: 4000,
        });
      }
      
      // Check for expiry - ONLY when we actually reach 0
      if (timeRemainingRef.current <= 0 && !hasReachedZeroRef.current) {
        console.log('Timer reached 0:00!');
        hasReachedZeroRef.current = true;
        
        // Clear the timer
        clearInterval(timerRef.current);
        timerRef.current = null;
        
        // Show expired notification
        if (showNotifications) {
          toast.error('Session expired due to inactivity', {
            duration: 5000,
          });
        }
        
        // Call expired callback
        if (onExpired) {
          console.log('Calling onExpired callback');
          onExpired();
        }
      }
    }, 1000);
  }, [warningThreshold, onExpired, showNotifications, formatTime]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    isActiveRef.current = false;
  }, []);

  // Activity tracking - MODIFIED to only reset AFTER reaching 0
  useEffect(() => {
    mountedRef.current = true;
    isActiveRef.current = true;
    hasReachedZeroRef.current = false;
    
    let activityTimeout;
    let lastResetTime = Date.now();
    
    const handleActivity = () => {
      // Debounce to prevent rapid firing (500ms)
      if (activityTimeout) clearTimeout(activityTimeout);
      
      activityTimeout = setTimeout(() => {
        if (!mountedRef.current || !isActiveRef.current) return;
        
        const now = Date.now();
        const timeSinceLastReset = now - lastResetTime;
        
        // Only reset if:
        // 1. Timer has already reached 0 (completed countdown), OR
        // 2. It's been at least 30 seconds since last reset (prevents constant resets)
        if (hasReachedZeroRef.current || timeSinceLastReset > 30000) {
          console.log('Activity detected - resetting timer');
          lastResetTime = now;
          resetTimer();
        } else {
          console.log('Activity ignored - timer still counting down');
        }
      }, 500);
    };

    // Listen for user activity - BUT with less sensitive events
    const events = ['click', 'keydown', 'scroll'];
    
    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Initialize and start timer
    resetTimer();

    // Cleanup
    return () => {
      mountedRef.current = false;
      isActiveRef.current = false;
      
      if (activityTimeout) clearTimeout(activityTimeout);
      
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [resetTimer]);

  return {
    timeRemaining: displayTime,
    formatTime: () => formatTime(),
    resetTimer,
    startTimer,
    stopTimer,
    getStatus: () => ({
      isActive: isActiveRef.current,
      timeRemaining: timeRemainingRef.current,
      isWarning: timeRemainingRef.current <= warningThreshold && timeRemainingRef.current > 0,
      hasReachedZero: hasReachedZeroRef.current,
    }),
  };
}