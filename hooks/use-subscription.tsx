'use client';

import { useAuth } from '@/lib/auth';

export interface SubscriptionInfo {
  isPaid: boolean;
  planType: 'free' | 'premium' | 'gift';
  subscriptionStatus: 'none' | 'active' | 'cancelled' | 'expired';
  canInviteFamily: boolean;
  canAccessFeature: (feature: 'family_sharing') => boolean;
  isLoading: boolean;
}

/**
 * Hook to access user subscription state and permissions
 *
 * @returns {SubscriptionInfo} Subscription information and permission checks
 *
 * @example
 * const { isPaid, canInviteFamily } = useSubscription();
 * if (!canInviteFamily) {
 *   // Show upgrade modal
 * }
 */
export function useSubscription(): SubscriptionInfo {
  const { user, isLoading } = useAuth();

  const isPaid = user?.isPaid || false;
  const planType = (user?.planType as 'free' | 'premium' | 'gift') || 'free';
  const subscriptionStatus = (user?.subscriptionStatus as 'none' | 'active' | 'cancelled' | 'expired') || 'none';
  const canInviteFamily = isPaid;

  const canAccessFeature = (feature: 'family_sharing') => {
    switch (feature) {
      case 'family_sharing':
        return isPaid;
      default:
        return false;
    }
  };

  return {
    isPaid,
    planType,
    subscriptionStatus,
    canInviteFamily,
    canAccessFeature,
    isLoading,
  };
}
