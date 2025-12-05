/**
 * Family Authentication Hook
 *
 * Manages family member session state by communicating with the server.
 *
 * Security (Dec 2024):
 * - Session tokens are stored in HttpOnly cookies (not accessible to JavaScript)
 * - This hook fetches session INFO from /api/family/session (not the token itself)
 * - All session validation happens server-side
 */

import { useState, useEffect, useCallback } from 'react';

export interface FamilySession {
  storytellerId: string;
  storytellerName: string;
  familyMemberName: string;
  relationship: string | null;
  permissionLevel: 'viewer' | 'contributor';
  expiresAt: string;
  firstAccess: boolean;
}

interface SessionResponse {
  authenticated: boolean;
  session: FamilySession | null;
  expired?: boolean;
  error?: string;
}

export function useFamilyAuth() {
  const [session, setSession] = useState<FamilySession | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Refresh the session with the server.
   * The server extends the session expiry and updates the cookie.
   */
  const refreshSession = useCallback(async () => {
    try {
      const response = await fetch('/api/family/refresh-session', {
        method: 'POST',
        credentials: 'include', // Send HttpOnly cookie
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Failed to refresh session:', error);

        // If session requires new link, clear it
        if (error.requiresNewLink) {
          await clearSession();
        }
        return false;
      }

      const data = await response.json();

      // Re-fetch session info to update local state
      await loadSession();

      console.log('Session refreshed successfully. Days until expiry:', data.daysUntilExpiry);
      return true;
    } catch (err) {
      console.error('Error refreshing session:', err);
      return false;
    }
  }, []);

  /**
   * Load session info from the server.
   * This fetches session metadata (not the token - that's in HttpOnly cookie).
   */
  const loadSession = useCallback(async () => {
    try {
      const response = await fetch('/api/family/session', {
        method: 'GET',
        credentials: 'include', // Send HttpOnly cookie
      });

      const data: SessionResponse = await response.json();

      if (!data.authenticated || !data.session) {
        setSession(null);
        setLoading(false);

        if (data.expired) {
          console.log('Family session expired');
        }
        return;
      }

      setSession(data.session);

      // Auto-refresh if expiring within 7 days
      const expiresAt = new Date(data.session.expiresAt);
      const now = new Date();
      const daysUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

      if (daysUntilExpiry < 7) {
        console.log('Session expiring soon, refreshing...');
        await refreshSession();
      }

      setLoading(false);
    } catch (err) {
      console.error('Error loading family session:', err);
      setSession(null);
      setLoading(false);
    }
  }, [refreshSession]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  /**
   * Clear the session (logout).
   * This calls the server to delete the HttpOnly cookie.
   */
  const clearSession = useCallback(async () => {
    try {
      await fetch('/api/family/session', {
        method: 'DELETE',
        credentials: 'include',
      });
    } catch (err) {
      console.error('Error clearing session:', err);
    }
    setSession(null);
  }, []);

  /**
   * Update first access flag.
   * Note: With HttpOnly cookies, we can't update this client-side.
   * The firstAccess flag is now managed server-side based on the session.
   */
  const updateFirstAccess = useCallback(() => {
    if (session && session.firstAccess) {
      // Update local state only - server manages the actual flag
      setSession({ ...session, firstAccess: false });
    }
  }, [session]);

  return {
    session,
    loading,
    isAuthenticated: !!session,
    clearSession,
    updateFirstAccess,
    refreshSession,
  };
}
