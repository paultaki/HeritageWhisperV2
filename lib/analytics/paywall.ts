/**
 * Paywall Analytics Helper
 *
 * Provides functions to track user interactions with the paywall system.
 * Events are logged to the paywall_events table in the database.
 */

type EventType =
  | 'modal_shown'
  | 'upgrade_clicked'
  | 'modal_dismissed'
  | 'checkout_started'
  | 'checkout_completed'
  | 'checkout_failed';

type TriggerLocation =
  | 'family_invite'
  | 'profile_page'
  | 'banner_timeline'
  | 'banner_book'
  | 'banner_memory_box'
  | 'direct_link';

interface PaywallEventMetadata {
  plan?: string;
  price?: number;
  currency?: string;
  error_message?: string;
  session_id?: string;
  [key: string]: any;
}

/**
 * Track a paywall event
 *
 * @param eventType - Type of event (modal_shown, upgrade_clicked, etc.)
 * @param triggerLocation - Where the event occurred (family_invite, profile_page, etc.)
 * @param metadata - Additional context (optional)
 */
export async function trackPaywallEvent(
  eventType: EventType,
  triggerLocation: TriggerLocation,
  metadata: PaywallEventMetadata = {}
): Promise<void> {
  try {
    const response = await fetch('/api/analytics/paywall', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventType,
        triggerLocation,
        metadata,
      }),
    });

    if (!response.ok) {
      console.error('Failed to track paywall event:', await response.text());
    }
  } catch (error) {
    // Silent fail - don't break user experience if analytics fails
    console.error('Error tracking paywall event:', error);
  }
}

/**
 * Convenience function: Track when paywall modal is shown
 */
export function trackPaywallModalShown(
  triggerLocation: TriggerLocation,
  metadata?: PaywallEventMetadata
) {
  return trackPaywallEvent('modal_shown', triggerLocation, metadata);
}

/**
 * Convenience function: Track when user clicks upgrade button
 */
export function trackUpgradeClicked(
  triggerLocation: TriggerLocation,
  metadata?: PaywallEventMetadata
) {
  return trackPaywallEvent('upgrade_clicked', triggerLocation, metadata);
}

/**
 * Convenience function: Track when user dismisses modal
 */
export function trackPaywallDismissed(
  triggerLocation: TriggerLocation,
  metadata?: PaywallEventMetadata
) {
  return trackPaywallEvent('modal_dismissed', triggerLocation, metadata);
}

/**
 * Convenience function: Track when checkout session starts
 */
export function trackCheckoutStarted(
  triggerLocation: TriggerLocation,
  metadata?: PaywallEventMetadata
) {
  return trackPaywallEvent('checkout_started', triggerLocation, {
    ...metadata,
    plan: metadata?.plan || 'premium',
    price: metadata?.price || 79,
    currency: metadata?.currency || 'usd',
  });
}

/**
 * Convenience function: Track when checkout completes successfully
 */
export function trackCheckoutCompleted(
  triggerLocation: TriggerLocation,
  metadata?: PaywallEventMetadata
) {
  return trackPaywallEvent('checkout_completed', triggerLocation, metadata);
}

/**
 * Convenience function: Track when checkout fails
 */
export function trackCheckoutFailed(
  triggerLocation: TriggerLocation,
  metadata?: PaywallEventMetadata
) {
  return trackPaywallEvent('checkout_failed', triggerLocation, metadata);
}

/**
 * Get analytics summary (for admin dashboard)
 * This would be called from an admin page to view conversion metrics
 */
export async function getPaywallAnalytics(
  startDate?: string,
  endDate?: string
): Promise<any> {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const response = await fetch(`/api/analytics/paywall?${params.toString()}`);

    if (!response.ok) {
      throw new Error('Failed to fetch paywall analytics');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching paywall analytics:', error);
    return null;
  }
}
