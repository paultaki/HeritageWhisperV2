import { useState, useEffect, useCallback, createContext, useContext, useRef, type ReactNode } from 'react';
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

// All query keys that need to be invalidated on account switch
const STORYTELLER_QUERY_KEYS = [
  'stories',
  '/api/stories',
  'prompts',
  '/api/prompts',
  'chapters',
  '/api/chapters',
  'treasures',
  '/api/treasures',
  'activity',
  '/api/activity',
];

// Create Context for sharing state across all components
interface AccountContextValue {
  activeContext: AccountContext | null;
  availableStorytellers: AvailableStoryteller[];
  isLoading: boolean;
  isStable: boolean; // True when context is fully resolved and won't change unexpectedly
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
  const [isStable, setIsStable] = useState(false); // New: prevents flipping
  const [error, setError] = useState<string | null>(null);

  // Track initialization to prevent race conditions
  const initializationRef = useRef<'idle' | 'initializing' | 'complete'>('idle');
  const lastUserIdRef = useRef<string | null>(null);

  // Helper function to invalidate all storyteller-related queries
  const invalidateAllStorytellerQueries = useCallback(async () => {
    console.log('[useAccountContext] Invalidating all storyteller-related queries');
    // Invalidate specific query keys - don't clear entire cache as that causes issues
    await Promise.all(
      STORYTELLER_QUERY_KEYS.map(key =>
        queryClient.invalidateQueries({ queryKey: [key] })
      )
    );
    // Also remove (not just invalidate) to ensure fresh data
    STORYTELLER_QUERY_KEYS.forEach(key => {
      queryClient.removeQueries({ queryKey: [key] });
    });
  }, [queryClient]);

  // Helper function to check family session (for unauthenticated viewers)
  const checkFamilySession = useCallback(async (): Promise<AccountContext | null> => {
    try {
      const response = await fetch('/api/family/session', {
        method: 'GET',
        credentials: 'include',
      });

      const data = await response.json();

      if (!data.authenticated || !data.session) {
        if (data.expired) {
          setError('Your viewing session has expired. Please request a new link.');
        }
        return null;
      }

      return {
        storytellerId: data.session.storytellerId,
        storytellerName: data.session.storytellerName,
        type: 'viewing' as const,
        permissionLevel: (data.session.permissionLevel || 'viewer') as 'viewer' | 'contributor' | 'owner',
        relationship: data.session.relationship || null,
      };
    } catch (e) {
      console.error('[useAccountContext] Failed to check family session:', e);
      return null;
    }
  }, []);

  // Helper function to clear family session cookie (when owner logs in)
  const clearFamilySessionIfOwner = useCallback(async (userId: string): Promise<void> => {
    try {
      // Check if there's a family session
      const response = await fetch('/api/family/session', {
        method: 'GET',
        credentials: 'include',
      });

      const data = await response.json();

      // If there's a family session for this user's own account, clear it
      // This prevents auth priority confusion
      if (data.authenticated && data.session?.storytellerId === userId) {
        console.log('[useAccountContext] Clearing stale family session for owner');
        await fetch('/api/family/session', {
          method: 'DELETE',
          credentials: 'include',
        });
      }
    } catch (e) {
      console.error('[useAccountContext] Failed to check/clear family session:', e);
    }
  }, []);

  // MAIN INITIALIZATION EFFECT - Consolidated logic to prevent race conditions
  useEffect(() => {
    // Don't start until auth check is complete
    if (isAuthLoading) {
      return;
    }

    // Detect user change and reset state
    const currentUserId = user?.id || null;
    if (lastUserIdRef.current !== currentUserId) {
      console.log('[useAccountContext] User changed:', lastUserIdRef.current, '->', currentUserId);
      lastUserIdRef.current = currentUserId;
      initializationRef.current = 'idle';
      setIsStable(false);
    }

    // Skip if already initializing or complete for this user
    if (initializationRef.current !== 'idle') {
      return;
    }

    initializationRef.current = 'initializing';
    setIsLoading(true);
    setIsStable(false);

    async function initialize() {
      try {
        // CASE 1: Authenticated user (subscriber)
        if (user) {
          // Clear any stale family session cookie that points to the user's own account
          // This prevents auth priority confusion in the stories API
          await clearFamilySessionIfOwner(user.id);

          // Check localStorage for stored context
          const storedValue = localStorage.getItem(STORAGE_KEY);

          // Handle simple storyteller ID (from account creation flow)
          if (storedValue && !storedValue.startsWith('{')) {
            // Keep loading - will be resolved when availableStorytellers loads
            console.log('[useAccountContext] Found simple storyteller ID, waiting for available list');
            setIsLoading(true);
            initializationRef.current = 'complete';
            return;
          }

          // Handle full context object
          if (storedValue && storedValue.startsWith('{')) {
            try {
              const storedContext = JSON.parse(storedValue) as AccountContext;

              // CRITICAL: If user is viewing their own account as "viewer", reset to owner
              // This fixes the flipping bug when owner logs in with stale family session
              if (storedContext.type === 'viewing' && storedContext.storytellerId === user.id) {
                console.log('[useAccountContext] Owner has stale viewer context, resetting to own');
                localStorage.removeItem(STORAGE_KEY);
                await invalidateAllStorytellerQueries();
                // Fall through to default own account
              } else if (storedContext.storytellerId === user.id) {
                // Own account context - use it
                console.log('[useAccountContext] Using stored own account context');
                setActiveContext(storedContext);
                setIsLoading(false);
                setIsStable(true);
                initializationRef.current = 'complete';
                return;
              } else if (storedContext.type === 'viewing') {
                // Viewing another account - need to VERIFY access before using
                // Don't trust stale localStorage from a different user session!
                // We'll validate this context once availableStorytellers loads
                console.log('[useAccountContext] Found viewing context, will validate after fetching available storytellers');
                // Set a temporary context but mark as NOT stable until validated
                setActiveContext(storedContext);
                setIsLoading(true); // Keep loading until validated
                initializationRef.current = 'complete';
                return;
              }
            } catch (e) {
              console.error('[useAccountContext] Failed to parse stored context:', e);
              localStorage.removeItem(STORAGE_KEY);
            }
          }

          // Default: Set up own account
          const ownContext: AccountContext = {
            storytellerId: user.id,
            storytellerName: user.name || 'Your Stories',
            type: 'own',
            permissionLevel: 'owner',
            relationship: null,
          };
          console.log('[useAccountContext] Setting up own account context');
          setActiveContext(ownContext);
          setIsLoading(false);
          setIsStable(true);
          initializationRef.current = 'complete';
          return;
        }

        // CASE 2: Unauthenticated - check for family session cookie
        console.log('[useAccountContext] No user, checking family session');
        const familyContext = await checkFamilySession();

        if (familyContext) {
          console.log('[useAccountContext] Found valid family session');
          setActiveContext(familyContext);
        } else {
          console.log('[useAccountContext] No valid session found');
          setActiveContext(null);
        }

        setIsLoading(false);
        setIsStable(true);
        initializationRef.current = 'complete';
      } catch (e) {
        console.error('[useAccountContext] Initialization error:', e);
        setActiveContext(null);
        setIsLoading(false);
        setIsStable(true);
        initializationRef.current = 'complete';
      }
    }

    initialize();
  }, [user, isAuthLoading, checkFamilySession, clearFamilySessionIfOwner, invalidateAllStorytellerQueries]);

  // Fetch available storytellers the user can switch to
  const fetchAvailableStorytellers = useCallback(async () => {
    if (!user) {
      console.log('[AccountContext] fetchAvailableStorytellers: No user, skipping');
      return;
    }

    console.log('[AccountContext] fetchAvailableStorytellers: Fetching for user', user.id);

    try {
      const response = await apiRequest('GET', '/api/accounts/available');
      const data = await response.json();

      if (response.ok) {
        console.log('[AccountContext] fetchAvailableStorytellers: Got', data.storytellers?.length || 0, 'storytellers:', data.storytellers?.map((s: any) => s.storytellerName));
        setAvailableStorytellers(data.storytellers || []);
      } else {
        console.error('[AccountContext] Failed to fetch storytellers:', data.error);
        setError(data.error);
      }
    } catch (err: any) {
      console.error('[AccountContext] fetchAvailableStorytellers error:', err.message);
      // Silently handle expected errors:
      // - "Authentication required" = race condition where user exists but session doesn't yet
      // - "Failed to fetch" / "500" = endpoint doesn't exist yet (V3 migration in progress)
      if (err.message?.includes('Authentication required') ||
          err.message?.includes('Failed to fetch') ||
          err.message?.includes('500')) {
        console.log('[AccountContext] fetchAvailableStorytellers: Expected error, setting empty list');
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

  // Validate and resolve context once available storytellers are loaded
  useEffect(() => {
    if (!user || availableStorytellers.length === 0) return;

    const storedValue = localStorage.getItem(STORAGE_KEY);

    // CASE 1: Simple storyteller ID (from account creation flow)
    if (storedValue && !storedValue.startsWith('{') && !activeContext) {
      // Find the storyteller in available list
      const storyteller = availableStorytellers.find(s => s.storytellerId === storedValue);

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
        setIsStable(true);
      } else {
        // Storyteller not found in available list, default to own account
        console.log('[useAccountContext] Storyteller ID not in available list, resetting to own account');
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
        setIsStable(true);
      }
      return;
    }

    // CASE 2: Validate "viewing" context from localStorage
    // This catches stale contexts from different user sessions
    if (activeContext?.type === 'viewing' && isLoading) {
      const hasAccess = availableStorytellers.some(
        s => s.storytellerId === activeContext.storytellerId
      );

      if (hasAccess) {
        // Context is valid - user has access to this storyteller
        console.log('[useAccountContext] Validated viewing context:', activeContext.storytellerName);
        setIsLoading(false);
        setIsStable(true);
      } else {
        // INVALID: User doesn't have access to this storyteller!
        // This happens when switching users - localStorage has stale data from previous user
        console.log('[useAccountContext] INVALID viewing context! User lacks access to:', activeContext.storytellerId);
        console.log('[useAccountContext] Available storytellers:', availableStorytellers.map(s => s.storytellerId));

        // Reset to own account
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
        setIsStable(true);
      }
    }
  }, [user, availableStorytellers, activeContext, isLoading]);

  // Switch to a different storyteller
  const switchToStoryteller = useCallback(async (storytellerId: string) => {
    if (!user) return;

    // Mark context as unstable during switch
    setIsStable(false);

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

      // Invalidate ALL storyteller-related queries to prevent stale data
      await invalidateAllStorytellerQueries();

      // Re-fetch available storytellers to ensure dropdown is populated
      await fetchAvailableStorytellers();

      setIsStable(true);
      return;
    }

    // Find the storyteller in available list
    const storyteller = availableStorytellers.find(s => s.storytellerId === storytellerId);

    if (!storyteller) {
      console.error('[AccountContext] Storyteller not found in available list');
      setError('Cannot switch to this account');
      setIsStable(true);
      return;
    }

    const newContext: AccountContext = {
      storytellerId: storyteller.storytellerId,
      storytellerName: storyteller.storytellerName,
      type: 'viewing',
      permissionLevel: storyteller.permissionLevel,
      relationship: storyteller.relationship,
    };

    console.log('[useAccountContext] Switching to storyteller:', newContext.storytellerName);
    setActiveContext(newContext);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newContext));

    // Invalidate ALL storyteller-related queries to prevent stale data
    await invalidateAllStorytellerQueries();

    // Re-fetch available storytellers to ensure dropdown is populated
    await fetchAvailableStorytellers();

    setIsStable(true);
  }, [user, availableStorytellers, invalidateAllStorytellerQueries, fetchAvailableStorytellers]);

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
    isStable, // True when context is fully resolved and won't change unexpectedly
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
