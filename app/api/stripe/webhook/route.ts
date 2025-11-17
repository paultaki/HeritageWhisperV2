import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { stripe, WEBHOOK_SECRET } from '@/lib/stripe';
import Stripe from 'stripe';
import { trackCheckoutCompleted, trackCheckoutFailed } from '@/lib/analytics/paywall';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * POST /api/stripe/webhook
 *
 * Handles Stripe webhook events for subscription lifecycle management
 *
 * Events handled:
 * - checkout.session.completed: Set isPaid=true, subscriptionStatus='active'
 * - customer.subscription.updated: Update subscription status
 * - customer.subscription.deleted: Set isPaid=false, subscriptionStatus='canceled'
 * - invoice.payment_failed: Set subscriptionStatus='past_due'
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verify webhook signature
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('No stripe-signature header found');
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    if (process.env.NEXT_PUBLIC_DEBUG === 'true') console.log(`Received webhook event: ${event.type}`);

    // 2. Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        if (process.env.NEXT_PUBLIC_DEBUG === 'true') console.log(`Unhandled event type: ${event.type}`);
    }

    // 3. Return success
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      {
        error: 'Webhook handler failed',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Handle successful checkout completion
 * Sets user to paid status and creates stripe_customers record
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.supabase_user_id;
  const triggerLocation = session.metadata?.trigger_location || 'direct_link';

  if (!userId) {
    console.error('No supabase_user_id in checkout session metadata');
    return;
  }

  try {
    // 1. Update user profile
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        isPaid: true,
        subscriptionStatus: 'active',
        planType: 'premium',
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating user profile:', updateError);
      throw updateError;
    }

    // 2. Create or update stripe_customers record
    const { error: customerError } = await supabaseAdmin
      .from('stripe_customers')
      .upsert({
        user_id: userId,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: session.subscription as string,
        status: 'active',
        current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      }, {
        onConflict: 'user_id',
      });

    if (customerError) {
      console.error('Error creating stripe_customers record:', customerError);
      // Don't throw - profile update succeeded
    }

    // 3. Track successful checkout
    await trackCheckoutCompleted(triggerLocation as any, {
      session_id: session.id,
      customer_id: session.customer as string,
      subscription_id: session.subscription as string,
    });

    if (process.env.NEXT_PUBLIC_DEBUG === 'true') console.log(`User ${userId} upgraded to Premium successfully`);
  } catch (error) {
    console.error('Error handling checkout completion:', error);
    throw error;
  }
}

/**
 * Handle subscription updates (renewal, plan changes, etc.)
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.supabase_user_id;

  if (!userId) {
    console.error('No supabase_user_id in subscription metadata');
    return;
  }

  try {
    const status = subscription.status;
    const isPaid = status === 'active' || status === 'trialing';

    await supabaseAdmin
      .from('users')
      .update({
        isPaid,
        subscriptionStatus: status,
      })
      .eq('id', userId);

    if (process.env.NEXT_PUBLIC_DEBUG === 'true') console.log(`User ${userId} subscription updated to ${status}`);
  } catch (error) {
    console.error('Error handling subscription update:', error);
    throw error;
  }
}

/**
 * Handle subscription deletion (cancellation)
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.supabase_user_id;

  if (!userId) {
    console.error('No supabase_user_id in subscription metadata');
    return;
  }

  try {
    await supabaseAdmin
      .from('users')
      .update({
        isPaid: false,
        subscriptionStatus: 'canceled',
      })
      .eq('id', userId);

    if (process.env.NEXT_PUBLIC_DEBUG === 'true') console.log(`User ${userId} subscription canceled`);
  } catch (error) {
    console.error('Error handling subscription deletion:', error);
    throw error;
  }
}

/**
 * Handle failed payments
 */
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subscription = invoice.subscription;

  if (!subscription) {
    return;
  }

  try {
    const subscriptionData = await stripe.subscriptions.retrieve(subscription as string);
    const userId = subscriptionData.metadata?.supabase_user_id;

    if (!userId) {
      console.error('No supabase_user_id in subscription metadata');
      return;
    }

    await supabaseAdmin
      .from('users')
      .update({
        subscriptionStatus: 'past_due',
      })
      .eq('id', userId);

    await trackCheckoutFailed('direct_link', {
      error_message: 'Payment failed',
      invoice_id: invoice.id,
    });

    if (process.env.NEXT_PUBLIC_DEBUG === 'true') console.log(`User ${userId} payment failed, status set to past_due`);
  } catch (error) {
    console.error('Error handling payment failure:', error);
    throw error;
  }
}

/**
 * Disable body parser for raw webhook body
 * Stripe needs the raw body to verify signatures
 */
export const config = {
  api: {
    bodyParser: false,
  },
};
