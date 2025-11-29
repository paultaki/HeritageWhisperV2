/**
 * Activity Tracker Hook
 * 
 * Monitors user activity and triggers inactivity timeout warnings.
 * Used for automatic logout after periods of inactivity.
 * 
 * Features:
 * - Tracks mouse, keyboard, touch, and scroll events
 * - Configurable timeout duration
 * - Warning before automatic logout
 * - Respects "Remember Me" preference
 */

import { useEffect, useState, useCallback, useRef } from 'react';

export interface ActivityTrackerOptions {
  /** Timeout duration in milliseconds (default: 30 minutes) */
  timeoutDuration?: number;
  
  /** Warning duration before timeout in milliseconds (default: 5 minutes) */
  warningDuration?: number;
  
  /** Whether activity tracking is enabled (default: true) */
  enabled?: boolean;
  
  /** Callback when warning period starts */
  onWarning?: () => void;
  
  /** Callback when timeout occurs */
  onTimeout?: () => void;
  
  /** Callback when activity is detected */
  onActivity?: () => void;
}

export interface ActivityTrackerState {
  /** Whether the user is currently active */
  isActive: boolean;
  
  /** Whether in warning period (about to timeout) */
  isWarning: boolean;
  
  /** Seconds remaining until timeout (only during warning) */
  secondsRemaining: number;
  
  /** Timestamp of last activity */
  lastActivity: Date | null;
  
  /** Reset the activity timer */
  resetTimer: () => void;
  
  /** Manually trigger the timeout */
  triggerTimeout: () => void;
}

const THIRTY_MINUTES = 30 * 60 * 1000; // 30 minutes in milliseconds
const FIVE_MINUTES = 5 * 60 * 1000; // 5 minutes in milliseconds

export function useActivityTracker(options: ActivityTrackerOptions = {}): ActivityTrackerState {
  const {
    timeoutDuration = THIRTY_MINUTES,
    warningDuration = FIVE_MINUTES,
    enabled = true,
    onWarning,
    onTimeout,
    onActivity,
  } = options;

  const [lastActivity, setLastActivity] = useState<Date>(new Date());
  const [isWarning, setIsWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const warningTriggeredRef = useRef(false);
  const isInitializedRef = useRef(false);

  // Calculate when warning should trigger
  const warningTime = timeoutDuration - warningDuration;

  const clearAllTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  const triggerTimeout = useCallback(() => {
    clearAllTimers();
    setIsWarning(false);
    setSecondsRemaining(0);
    
    if (onTimeout) {
      onTimeout();
    }
  }, [clearAllTimers, onTimeout]);

  const startWarning = useCallback(() => {
    if (warningTriggeredRef.current) return;
    
    warningTriggeredRef.current = true;
    setIsWarning(true);
    setSecondsRemaining(Math.floor(warningDuration / 1000));
    
    if (onWarning) {
      onWarning();
    }

    // Start countdown
    countdownRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          triggerTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [warningDuration, onWarning, triggerTimeout]);

  const resetTimer = useCallback(() => {
    if (!enabled) return;

    const now = new Date();
    setLastActivity(now);
    setIsWarning(false);
    setSecondsRemaining(0);
    warningTriggeredRef.current = false;
    
    clearAllTimers();

    // Store last activity in sessionStorage for persistence across page reloads
    try {
      sessionStorage.setItem('lastActivity', now.toISOString());
    } catch (error) {
      console.error('[ActivityTracker] Failed to store last activity:', error);
    }

    // Set warning timer
    warningTimeoutRef.current = setTimeout(() => {
      startWarning();
    }, warningTime);

    // Set final timeout timer
    timeoutRef.current = setTimeout(() => {
      triggerTimeout();
    }, timeoutDuration);

    if (onActivity) {
      onActivity();
    }
  }, [enabled, clearAllTimers, warningTime, timeoutDuration, startWarning, triggerTimeout, onActivity]);

  // Handle user activity events
  const handleActivity = useCallback(() => {
    if (!enabled) return;
    
    // Only reset timer if not in warning state (to prevent accidental cancellation)
    // During warning, user must explicitly click "Continue Session"
    if (!isWarning) {
      resetTimer();
    }
  }, [enabled, isWarning, resetTimer]);

  // Initialize on mount - use ref to prevent infinite loop
  useEffect(() => {
    if (!enabled) {
      clearAllTimers();
      isInitializedRef.current = false;
      return;
    }

    // Prevent re-initialization on every render
    if (isInitializedRef.current) {
      return;
    }
    isInitializedRef.current = true;

    // Check if there's a stored last activity time
    try {
      const stored = sessionStorage.getItem('lastActivity');
      if (stored) {
        const storedDate = new Date(stored);
        const timeSinceActivity = Date.now() - storedDate.getTime();

        // If more than timeout duration has passed, trigger timeout immediately
        if (timeSinceActivity >= timeoutDuration) {
          triggerTimeout();
          return;
        }

        // If in warning period, show warning
        if (timeSinceActivity >= warningTime) {
          startWarning();
          return;
        }

        setLastActivity(storedDate);
      }
    } catch (error) {
      console.error('[ActivityTracker] Failed to retrieve last activity:', error);
    }

    // Start tracking
    resetTimer();

    // Cleanup on unmount
    return () => {
      clearAllTimers();
      isInitializedRef.current = false;
    };
  }, [enabled, timeoutDuration, warningTime, resetTimer, startWarning, triggerTimeout, clearAllTimers]);

  // Set up event listeners
  useEffect(() => {
    if (!enabled) return;

    const events = [
      'mousedown',
      'mousemove',
      'keydown',
      'scroll',
      'touchstart',
      'click',
    ];

    // Throttle activity handler to avoid excessive updates
    let throttleTimeout: NodeJS.Timeout | null = null;
    const throttledHandler = () => {
      if (throttleTimeout) return;
      
      throttleTimeout = setTimeout(() => {
        handleActivity();
        throttleTimeout = null;
      }, 1000); // Throttle to once per second
    };

    events.forEach((event) => {
      window.addEventListener(event, throttledHandler, { passive: true });
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, throttledHandler);
      });
      if (throttleTimeout) {
        clearTimeout(throttleTimeout);
      }
    };
  }, [enabled, handleActivity]);

  return {
    isActive: !isWarning,
    isWarning,
    secondsRemaining,
    lastActivity,
    resetTimer,
    triggerTimeout,
  };
}

