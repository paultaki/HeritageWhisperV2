import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { stripe } from '@/lib/stripe';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * POST /api/stripe/customer-portal
 *
 * Creates a Stripe Customer Portal session for subscription management
 *
 * Allows premium users to:
 * - Cancel subscription
 * - Update payment method
 * - View billing history
 * - Download invoices
 *
 * Returns: {
 *   url: string (Stripe Customer Portal URL to redirect to)
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

    // 2. Check if user is a premium member
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('isPaid, email')
      .eq('id', user.id)
      .single();

    if (!profile?.isPaid) {
      return NextResponse.json(
        { error: 'Premium subscription required' },
        { status: 403 }
      );
    }

    // 3. Get Stripe customer ID
    const { data: stripeCustomer } = await supabaseAdmin
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (!stripeCustomer?.stripe_customer_id) {
      // Fallback: search for customer by email
      const customers = await stripe.customers.list({
        email: profile.email,
        limit: 1,
      });

      if (customers.data.length === 0) {
        return NextResponse.json(
          { error: 'Stripe customer not found' },
          { status: 404 }
        );
      }

      // Update database with found customer ID
      await supabaseAdmin
        .from('stripe_customers')
        .upsert({
          user_id: user.id,
          stripe_customer_id: customers.data[0].id,
        }, {
          onConflict: 'user_id',
        });

      stripeCustomer.stripe_customer_id = customers.data[0].id;
    }

    // 4. Create Customer Portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomer.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/profile`,
    });

    // 5. Return portal URL
    return NextResponse.json({
      url: portalSession.url,
    });
  } catch (error: any) {
    console.error('Error creating customer portal session:', error);
    return NextResponse.json(
      {
        error: 'Failed to create customer portal session',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
