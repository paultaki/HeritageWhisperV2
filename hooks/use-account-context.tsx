import { useState, useEffect, useCallback } from 'react';
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

export function useAccountContext() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const queryClient = useQueryClient();
  const [activeContext, setActiveContext] = useState<AccountContext | null>(null);
  const [availableStorytellers, setAvailableStorytellers] = useState<AvailableStoryteller[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load active context from localStorage or check for initial family member context
  useEffect(() => {
    if (!user) {
      setActiveContext(null);
      setIsLoading(false);
      return;
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
  }, [user]);

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
      // Silently handle if endpoint doesn't exist yet (V3 migration in progress)
      if (err.message?.includes('Failed to fetch') || err.message?.includes('500')) {
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
    isLoading: isLoading || isAuthLoading,
    error,
    switchToStoryteller,
    resetToOwnAccount,
    refreshStorytellers: fetchAvailableStorytellers,
    isOwnAccount,
    canInvite,
  };
}
