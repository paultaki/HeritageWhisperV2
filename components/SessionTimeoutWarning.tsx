/**
 * Session Timeout Warning Component
 * 
 * Displays a modal warning when the user's session is about to expire
 * due to inactivity. Gives the user the option to continue their session
 * or logout.
 */

'use client';

import { useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Clock } from 'lucide-react';

interface SessionTimeoutWarningProps {
  /** Whether the warning modal is open */
  isOpen: boolean;
  
  /** Seconds remaining until automatic logout */
  secondsRemaining: number;
  
  /** Callback when user clicks "Continue Session" */
  onContinue: () => void;
  
  /** Callback when user clicks "Logout" or timeout expires */
  onLogout: () => void;
}

export function SessionTimeoutWarning({
  isOpen,
  secondsRemaining,
  onContinue,
  onLogout,
}: SessionTimeoutWarningProps) {
  
  // Format seconds into MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Auto-logout when time runs out
  // Note: onLogout should be memoized by parent to prevent re-renders
  useEffect(() => {
    if (isOpen && secondsRemaining === 0) {
      onLogout();
    }
  }, [isOpen, secondsRemaining, onLogout]);

  // Play a subtle notification sound when warning appears
  useEffect(() => {
    if (isOpen) {
      // Optional: Add a subtle notification sound
      // const audio = new Audio('/notification.mp3');
      // audio.volume = 0.3;
      // audio.play().catch(() => {});
    }
  }, [isOpen]);

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/20">
              <Clock className="h-6 w-6 text-amber-600 dark:text-amber-500" />
            </div>
            <AlertDialogTitle className="text-xl">
              Session Expiring Soon
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base space-y-3 pt-2">
            <p>
              Your session will expire in <span className="font-bold text-amber-600 dark:text-amber-500 text-lg">{formatTime(secondsRemaining)}</span> due to inactivity.
            </p>
            <p className="text-sm text-muted-foreground">
              Click "Continue Session" to stay logged in, or you'll be automatically logged out for security.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2 mt-4">
          <AlertDialogCancel 
            onClick={onLogout}
            className="sm:flex-1"
          >
            Logout Now
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onContinue}
            className="sm:flex-1 bg-primary hover:bg-primary/90"
          >
            Continue Session
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * Hook for managing session timeout state
 * 
 * Usage:
 * ```tsx
 * const timeout = useSessionTimeout({
 *   enabled: !rememberMe,
 *   onTimeout: handleLogout,
 * });
 * 
 * return <SessionTimeoutWarning {...timeout} />;
 * ```
 */
export interface UseSessionTimeoutOptions {
  /** Whether timeout tracking is enabled */
  enabled: boolean;
  
  /** Callback when session times out */
  onTimeout: () => void;
  
  /** Timeout duration in milliseconds (default: 30 minutes) */
  timeoutDuration?: number;
  
  /** Warning duration before timeout in milliseconds (default: 5 minutes) */
  warningDuration?: number;
}

export interface UseSessionTimeoutReturn {
  isOpen: boolean;
  secondsRemaining: number;
  onContinue: () => void;
  onLogout: () => void;
}

