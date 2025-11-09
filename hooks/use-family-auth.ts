import { useState, useEffect, useCallback } from 'react';

export interface FamilySession {
  sessionToken: string;
  storytellerId: string;
  storytellerName: string;
  familyMemberName: string;
  relationship: string | null;
  permissionLevel: 'viewer' | 'contributor';
  expiresAt: string;
  firstAccess: boolean;
}

export function useFamilyAuth() {
  const [session, setSession] = useState<FamilySession | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async (currentSession: FamilySession) => {
    try {
      const response = await fetch('/api/family/refresh-session', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentSession.sessionToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Failed to refresh session:', error);

        // If session requires new link, clear it
        if (error.requiresNewLink) {
          clearSession();
        }
        return false;
      }

      const data = await response.json();

      // Update session with new expiry
      const updated = { ...currentSession, expiresAt: data.expiresAt };
      localStorage.setItem('family_session', JSON.stringify(updated));
      setSession(updated);

      console.log('Session refreshed successfully. Days until expiry:', data.daysUntilExpiry);
      return true;
    } catch (err) {
      console.error('Error refreshing session:', err);
      return false;
    }
  }, []);

  useEffect(() => {
    loadSession();
  }, []);

  async function loadSession() {
    try {
      const stored = localStorage.getItem('family_session');

      if (!stored) {
        setLoading(false);
        return;
      }

      const data: FamilySession = JSON.parse(stored);

      // Check if expired
      if (new Date(data.expiresAt) < new Date()) {
        console.log('Family session expired');
        clearSession();
        setLoading(false);
        return;
      }

      setSession(data);

      // Auto-refresh if expiring within 7 days
      const expiresAt = new Date(data.expiresAt);
      const now = new Date();
      const daysUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

      if (daysUntilExpiry < 7) {
        console.log('Session expiring soon, refreshing...');
        await refreshSession(data);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error loading family session:', err);
      clearSession();
      setLoading(false);
    }
  }

  function clearSession() {
    localStorage.removeItem('family_session');
    setSession(null);
  }

  function updateFirstAccess() {
    if (session && session.firstAccess) {
      const updated = { ...session, firstAccess: false };
      localStorage.setItem('family_session', JSON.stringify(updated));
      setSession(updated);
    }
  }

  return {
    session,
    loading,
    isAuthenticated: !!session,
    clearSession,
    updateFirstAccess,
  };
}
