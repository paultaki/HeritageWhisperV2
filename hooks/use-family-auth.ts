import { useState, useEffect } from 'react';

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

  useEffect(() => {
    loadSession();
  }, []);

  function loadSession() {
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
