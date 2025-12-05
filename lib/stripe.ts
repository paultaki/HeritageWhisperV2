/**
 * Stripe Client Configuration
 *
 * Initializes Stripe with secret key for server-side operations.
 * Used for creating checkout sessions, managing subscriptions, and webhooks.
 *
 * SECURITY: Uses validated env vars from lib/env.ts
 */

import Stripe from 'stripe';
import { env } from '@/lib/env';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
}

/**
 * Stripe client instance
 * Configured for API version 2025-09-30 (latest stable)
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-09-30.clover',
  typescript: true,
  appInfo: {
    name: 'HeritageWhisper',
    version: '2.0.0',
    url: 'https://heritagewhisper.com',
  },
});

/**
 * Price ID for Premium annual subscription ($79/year)
 * This should be created in the Stripe Dashboard
 * Format: price_xxxxxxxxxxxxxxxxxxxxx
 */
export const PREMIUM_PRICE_ID = env.STRIPE_PREMIUM_PRICE_ID || '';

if (!PREMIUM_PRICE_ID && env.NODE_ENV !== 'test') {
  console.warn('Warning: STRIPE_PREMIUM_PRICE_ID is not defined. Stripe integration will not work.');
}

/**
 * Price ID for Gift subscription (one-time payment, $79)
 * This should be created in the Stripe Dashboard as a one-time payment product
 * Format: price_xxxxxxxxxxxxxxxxxxxxx
 */
export const GIFT_PRICE_ID = env.STRIPE_GIFT_PRICE_ID || '';

if (!GIFT_PRICE_ID && env.NODE_ENV !== 'test') {
  console.warn('Warning: STRIPE_GIFT_PRICE_ID is not defined. Gift purchase will not work.');
}

/**
 * Webhook secret for verifying webhook signatures
 * SECURITY: Required in production, validated by lib/env.ts
 */
export const WEBHOOK_SECRET = env.STRIPE_WEBHOOK_SECRET;

if (!WEBHOOK_SECRET && env.NODE_ENV === 'production') {
  throw new Error('STRIPE_WEBHOOK_SECRET is required in production for webhook verification');
}

/**
 * Helper function to format amount for display
 * Stripe stores amounts in cents, so we divide by 100
 *
 * @param amount - Amount in cents
 * @param currency - Currency code (default: 'usd')
 * @returns Formatted price string (e.g., "$79.00")
 */
export function formatAmount(amount: number, currency: string = 'usd'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

/**
 * Helper function to get or create a Stripe customer
 *
 * @param userId - Supabase user ID
 * @param email - User email address
 * @param name - User name (optional)
 * @returns Stripe customer ID
 */
export async function getOrCreateCustomer(
  userId: string,
  email: string,
  name?: string
): Promise<string> {
  // Search for existing customer by metadata
  const existingCustomers = await stripe.customers.list({
    email,
    limit: 1,
  });

  if (existingCustomers.data.length > 0) {
    return existingCustomers.data[0].id;
  }

  // Create new customer if not found
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      supabase_user_id: userId,
    },
  });

  return customer.id;
}

/**
 * Helper function to check if a customer has an active subscription
 *
 * @param customerId - Stripe customer ID
 * @returns Boolean indicating if customer has active subscription
 */
export async function hasActiveSubscription(customerId: string): Promise<boolean> {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'active',
    limit: 1,
  });

  return subscriptions.data.length > 0;
}
