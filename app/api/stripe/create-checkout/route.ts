import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { stripe, PREMIUM_PRICE_ID, getOrCreateCustomer } from '@/lib/stripe';
import { trackCheckoutStarted } from '@/lib/analytics/paywall';

import { getPasskeySession } from "@/lib/iron-session";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * POST /api/stripe/create-checkout
 *
 * Creates a Stripe Checkout session for Premium subscription
 *
 * Body: {
 *   triggerLocation: string (where the upgrade was initiated)
 * }
 *
 * Returns: {
 *   url: string (Stripe Checkout URL to redirect to)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Validate authentication
    const authHeader = request.headers.get('authorization');
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    // 2. Get user profile for email and name
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('email, name')
      .eq('id', userId)
      .single();

    if (!profile?.email) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // 3. Parse request body
    const body = await request.json();
    const triggerLocation = body.triggerLocation || 'direct_link';

    // 4. Get or create Stripe customer
    const customerId = await getOrCreateCustomer(
      userId,
      profile.email,
      profile.name || undefined
    );

    // 5. Check if user already has an active subscription
    const existingSubscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    });

    if (existingSubscriptions.data.length > 0) {
      return NextResponse.json(
        { error: 'You already have an active subscription' },
        { status: 400 }
      );
    }

    // 6. Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: PREMIUM_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/profile?upgraded=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/upgrade?canceled=true`,
      metadata: {
        supabase_user_id: userId,
        trigger_location: triggerLocation,
      },
      subscription_data: {
        metadata: {
          supabase_user_id: userId,
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
    });

    // 7. Track checkout started event
    await trackCheckoutStarted(triggerLocation as any, {
      session_id: session.id,
      customer_id: customerId,
    });

    // 8. Return checkout URL
    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      {
        error: 'Failed to create checkout session',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
