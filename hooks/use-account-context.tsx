import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';
import { useAuth } from '@/lib/auth';
import { apiRequest } from '@/lib/queryClient';
import { useQueryClient } from '@tanstack/react-query';

export interface AccountContext {
  storytellerId: string;
  storytellerName: string;
  type: 'own' | 'viewing';
  permissionLevel: 'viewer' | 'contributor' | 'owner';
  relationship: string | null;
}

export interface AvailableStoryteller {
  storytellerId: string;
  storytellerName: string;
  permissionLevel: 'viewer' | 'contributor';
  relationship: string | null;
  lastViewedAt: string | null;
}

const STORAGE_KEY = 'hw_active_storyteller_context';

// Create Context for sharing state across all components
interface AccountContextValue {
  activeContext: AccountContext | null;
  availableStorytellers: AvailableStoryteller[];
  isLoading: boolean;
  error: string | null;
  switchToStoryteller: (storytellerId: string) => Promise<void>;
  resetToOwnAccount: () => void;
  refreshStorytellers: () => Promise<void>;
  isOwnAccount: boolean;
  canInvite: boolean;
}

const AccountContextContext = createContext<AccountContextValue | null>(null);

// Internal hook that contains the actual logic
function useAccountContextInternal() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const queryClient = useQueryClient();
  const [activeContext, setActiveContext] = useState<AccountContext | null>(null);
  const [availableStorytellers, setAvailableStorytellers] = useState<AvailableStoryteller[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authCheckComplete, setAuthCheckComplete] = useState(false);

  // Fallback: If auth is taking too long, check for family session anyway
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!user && !activeContext) {
        setAuthCheckComplete(true);
      }
    }, 1000); // Wait 1 second max for auth

    return () => clearTimeout(timeout);
  }, [user, activeContext]);

  // Load active context from localStorage or check for initial family member context
  useEffect(() => {
    // Don't run if auth is still loading - wait for it to finish OR timeout
    if (isAuthLoading && !authCheckComplete) {
      return;
    }

    if (!user) {
      // Check for family_session via API (HttpOnly cookie - not accessible to JS)
      // The session info is fetched from the server, not localStorage
      checkFamilySession();
      return;
    }

    async function checkFamilySession() {
      try {
        const response = await fetch('/api/family/session', {
          method: 'GET',
          credentials: 'include', // Send HttpOnly cookie
        });

        const data = await response.json();

        if (!data.authenticated || !data.session) {
          if (data.expired) {
            setError('Your viewing session has expired. Please request a new link.');
          }
          setActiveContext(null);
          setIsLoading(false);
          return;
        }

        // Set viewer context from session data
        const viewerContext = {
          storytellerId: data.session.storytellerId,
          storytellerName: data.session.storytellerName,
          type: 'viewing' as const,
          permissionLevel: (data.session.permissionLevel || 'viewer') as 'viewer' | 'contributor' | 'owner',
          relationship: data.session.relationship || null,
        };

        setActiveContext(viewerContext);
        setIsLoading(false);
      } catch (e) {
        console.error('[useAccountContext] Failed to check family session:', e);
        setActiveContext(null);
        setIsLoading(false);
      }
    }

    // Check if there's a stored storytellerId (set during account creation for family members)
    const storedStorytellerIdOnly = localStorage.getItem(STORAGE_KEY);

    // First, check for simple storyteller ID (from account creation flow)
    if (storedStorytellerIdOnly && !storedStorytellerIdOnly.startsWith('{')) {
      // This is just a storyteller ID, not a full context object
      // We'll fetch the full context later when availableStorytellers loads
      setIsLoading(true); // Keep loading until we fetch full context
      return;
    }

    // Check for stored full context object
    if (storedStorytellerIdOnly && storedStorytellerIdOnly.startsWith('{')) {
      try {
        const storedContext = JSON.parse(storedStorytellerIdOnly) as AccountContext;
        // Accept stored context if it's either own account or viewing mode
        if (storedContext.storytellerId === user.id || storedContext.type === 'viewing') {
          setActiveContext(storedContext);
          setIsLoading(false);
          return;
        }
      } catch (e) {
        console.error('Failed to parse stored context:', e);
        localStorage.removeItem(STORAGE_KEY);
      }
    }

    // Default: Own account (for existing users without stored context)
    setActiveContext({
      storytellerId: user.id,
      storytellerName: user.name || 'Your Stories',
      type: 'own',
      permissionLevel: 'owner',
      relationship: null,
    });
    setIsLoading(false);
  }, [user, isAuthLoading, authCheckComplete]); // Run when user changes OR when auth loading completes OR timeout

  // Fetch available storytellers the user can switch to
  const fetchAvailableStorytellers = useCallback(async () => {
    if (!user) return;

    try {
      const response = await apiRequest('GET', '/api/accounts/available');
      const data = await response.json();

      if (response.ok) {
        setAvailableStorytellers(data.storytellers || []);
      } else {
        console.error('[AccountContext] Failed to fetch storytellers:', data.error);
        setError(data.error);
      }
    } catch (err: any) {
      // Silently handle expected errors:
      // - "Authentication required" = race condition where user exists but session doesn't yet
      // - "Failed to fetch" / "500" = endpoint doesn't exist yet (V3 migration in progress)
      if (err.message?.includes('Authentication required') ||
          err.message?.includes('Failed to fetch') ||
          err.message?.includes('500')) {
        setAvailableStorytellers([]);
        return;
      }
      console.error('[AccountContext] Error fetching storytellers:', err);
      setError('Failed to load available storytellers');
    }
  }, [user]);

  useEffect(() => {
    if (user && !isAuthLoading) {
      fetchAvailableStorytellers();
    }
  }, [user, isAuthLoading, fetchAvailableStorytellers]);

  // Convert simple storyteller ID to full context once available storytellers are loaded
  useEffect(() => {
    if (!user || availableStorytellers.length === 0) return;

    const storedStorytellerIdOnly = localStorage.getItem(STORAGE_KEY);

    // Check if we have a simple ID (from account creation) and no active context yet
    if (storedStorytellerIdOnly && !storedStorytellerIdOnly.startsWith('{') && !activeContext) {
      // Find the storyteller in available list
      const storyteller = availableStorytellers.find(s => s.storytellerId === storedStorytellerIdOnly);

      if (storyteller) {
        const newContext: AccountContext = {
          storytellerId: storyteller.storytellerId,
          storytellerName: storyteller.storytellerName,
          type: 'viewing',
          permissionLevel: storyteller.permissionLevel,
          relationship: storyteller.relationship,
        };

        setActiveContext(newContext);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newContext));
        setIsLoading(false);
      } else {
        // Storyteller not found in available list, default to own account
        const ownContext: AccountContext = {
          storytellerId: user.id,
          storytellerName: user.name || 'Your Stories',
          type: 'own',
          permissionLevel: 'owner',
          relationship: null,
        };
        setActiveContext(ownContext);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(ownContext));
        setIsLoading(false);
      }
    }
  }, [user, availableStorytellers, activeContext]);

  // Switch to a different storyteller
  const switchToStoryteller = useCallback(async (storytellerId: string) => {
    if (!user) return;

    // If switching to own account
    if (storytellerId === user.id) {
      const ownContext: AccountContext = {
        storytellerId: user.id,
        storytellerName: user.name || 'Your Stories',
        type: 'own',
        permissionLevel: 'owner',
        relationship: null,
      };
      setActiveContext(ownContext);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ownContext));

      // Invalidate all story-related queries to trigger refetch
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['stories'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/stories'] }),
      ]);
      return;
    }

    // Find the storyteller in available list
    const storyteller = availableStorytellers.find(s => s.storytellerId === storytellerId);

    if (!storyteller) {
      console.error('[AccountContext] Storyteller not found in available list');
      setError('Cannot switch to this account');
      return;
    }

    const newContext: AccountContext = {
      storytellerId: storyteller.storytellerId,
      storytellerName: storyteller.storytellerName,
      type: 'viewing',
      permissionLevel: storyteller.permissionLevel,
      relationship: storyteller.relationship,
    };

    setActiveContext(newContext);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newContext));

    // Invalidate all story-related queries to trigger refetch
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['stories'] }),
      queryClient.invalidateQueries({ queryKey: ['/api/stories'] }),
    ]);
  }, [user, availableStorytellers, queryClient]);

  // Reset to own account
  const resetToOwnAccount = useCallback(() => {
    if (!user) return;
    switchToStoryteller(user.id);
  }, [user, switchToStoryteller]);

  // Check if currently viewing own account
  const isOwnAccount = activeContext?.type === 'own';

  // Check if current user has contributor permission
  const canInvite = activeContext?.permissionLevel === 'contributor' || activeContext?.permissionLevel === 'owner';

  return {
    activeContext,
    availableStorytellers,
    // For family viewers (activeContext without user), ignore isAuthLoading since we're not waiting for auth
    isLoading: activeContext && !user ? isLoading : (isLoading || isAuthLoading),
    error,
    switchToStoryteller,
    resetToOwnAccount,
    refreshStorytellers: fetchAvailableStorytellers,
    isOwnAccount,
    canInvite,
  };
}

// Provider component that wraps the app
export function AccountContextProvider({ children }: { children: ReactNode }) {
  const value = useAccountContextInternal();

  return (
    <AccountContextContext.Provider value={value}>
      {children}
    </AccountContextContext.Provider>
  );
}

// Public hook that components use
export function useAccountContext() {
  const context = useContext(AccountContextContext);
  if (!context) {
    throw new Error('useAccountContext must be used within AccountContextProvider');
  }
  return context;
}
