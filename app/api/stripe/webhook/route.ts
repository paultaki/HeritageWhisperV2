import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { stripe, WEBHOOK_SECRET } from "@/lib/stripe";
import Stripe from "stripe";
import {
  trackCheckoutCompleted,
  trackCheckoutFailed,
} from "@/lib/analytics/paywall";
import { logger } from "@/lib/logger";
import { createGiftCode, markGiftCodeRefunded } from "@/lib/giftCodes";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

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
 * - checkout.session.completed: Set is_paid=true, subscription_status='active'
 * - customer.subscription.updated: Update subscription status
 * - customer.subscription.deleted: Set is_paid=false, subscription_status='canceled'
 * - invoice.payment_failed: Set subscription_status='past_due'
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verify webhook signature
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      logger.error("No stripe-signature header found");
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET);
    } catch (err: any) {
      logger.error("Webhook signature verification failed:", err.message);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    logger.info(`Received webhook event: ${event.type}`);

    // 2. Handle different event types
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        // Check if this is a gift purchase
        if (session.metadata?.purchase_type === "gift") {
          await handleGiftCheckoutCompleted(session);
        } else {
          await handleCheckoutCompleted(session);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        await handleChargeRefunded(charge);
        break;
      }

      default:
        logger.info(`Unhandled event type: ${event.type}`);
    }

    // 3. Return success
    return NextResponse.json({ received: true });
  } catch (error: any) {
    logger.error("Error processing webhook:", error);
    return NextResponse.json(
      {
        error: "Webhook handler failed",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Handle successful checkout completion
 * Sets user to paid status and creates/updates stripe_customers record
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.supabase_user_id;
  const triggerLocation = session.metadata?.trigger_location || "direct_link";

  if (!userId) {
    logger.error("No supabase_user_id in checkout session metadata");
    return;
  }

  try {
    // 1. Get subscription details from Stripe
    const subscriptionId = session.subscription as string;
    const subscription = subscriptionId
      ? await stripe.subscriptions.retrieve(subscriptionId)
      : null;

    // 2. Update user profile (snake_case field names for DB)
    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({
        is_paid: true,
        subscription_status: "active",
      })
      .eq("id", userId);

    if (updateError) {
      logger.error("Error updating user profile:", updateError);
      throw updateError;
    }

    // 3. Create or update stripe_customers record with full subscription details
    if (subscription) {
      const { error: customerError } = await supabaseAdmin
        .from("stripe_customers")
        .upsert(
          {
            user_id: userId,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: subscriptionId,
            status: subscription?.status,
            plan_type: "founding_family",
            current_period_start: (subscription as any)?.current_period_start
              ? new Date((subscription as any).current_period_start * 1000).toISOString()
              : new Date().toISOString(),
            current_period_end: (subscription as any)?.current_period_end
              ? new Date((subscription as any).current_period_end * 1000).toISOString()
              : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            cancel_at_period_end: subscription?.cancel_at_period_end ?? false,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id",
          }
        );

      if (customerError) {
        logger.error(
          "Error creating stripe_customers record:",
          customerError
        );
        // Don't throw - profile update succeeded
      }
    }

    // 4. Track successful checkout
    await trackCheckoutCompleted(triggerLocation as any, {
      session_id: session.id,
      customer_id: session.customer as string,
      subscription_id: subscriptionId,
    });

    logger.info(
      `User ${userId} upgraded to Premium successfully (subscription: ${subscriptionId})`
    );
  } catch (error) {
    logger.error("Error handling checkout completion:", error);
    throw error;
  }
}

/**
 * Handle subscription updates (renewal, plan changes, status changes)
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.supabase_user_id;

  if (!userId) {
    logger.error("No supabase_user_id in subscription metadata");
    return;
  }

  try {
    const status = subscription.status;
    const isPaid = status === "active" || status === "trialing";

    // 1. Update user profile
    await supabaseAdmin
      .from("users")
      .update({
        is_paid: isPaid,
        subscription_status: status,
      })
      .eq("id", userId);

    // 2. Update stripe_customers record with latest subscription details
    await supabaseAdmin
      .from("stripe_customers")
      .update({
        status: status,
        current_period_start: (subscription as any).current_period_start
          ? new Date((subscription as any).current_period_start * 1000).toISOString()
          : new Date().toISOString(),
        current_period_end: (subscription as any).current_period_end
          ? new Date((subscription as any).current_period_end * 1000).toISOString()
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        cancel_at_period_end: (subscription as any).cancel_at_period_end ?? false,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    logger.info(
      `User ${userId} subscription updated: ${status} (cancel_at_period_end: ${(subscription as any).cancel_at_period_end})`
    );
  } catch (error) {
    logger.error("Error handling subscription update:", error);
    throw error;
  }
}

/**
 * Handle subscription deletion (cancellation)
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.supabase_user_id;

  if (!userId) {
    logger.error("No supabase_user_id in subscription metadata");
    return;
  }

  try {
    // 1. Update user profile
    await supabaseAdmin
      .from("users")
      .update({
        is_paid: false,
        subscription_status: "canceled",
      })
      .eq("id", userId);

    // 2. Update stripe_customers record
    await supabaseAdmin
      .from("stripe_customers")
      .update({
        status: "canceled",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    logger.info(`User ${userId} subscription canceled`);
  } catch (error) {
    logger.error("Error handling subscription deletion:", error);
    throw error;
  }
}

/**
 * Handle failed payments
 */
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subscription =
    typeof (invoice as any).subscription === "string"
      ? (invoice as any).subscription
      : (invoice as any).subscription?.id;

  if (!subscription) {
    return;
  }

  try {
    const subscriptionData = await stripe.subscriptions.retrieve(
      subscription as string
    );
    const userId = subscriptionData.metadata?.supabase_user_id;

    if (!userId) {
      logger.error("No supabase_user_id in subscription metadata");
      return;
    }

    // 1. Update user profile
    await supabaseAdmin
      .from("users")
      .update({
        subscription_status: "past_due",
      })
      .eq("id", userId);

    // 2. Update stripe_customers record
    await supabaseAdmin
      .from("stripe_customers")
      .update({
        status: "past_due",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    await trackCheckoutFailed("direct_link", {
      error_message: "Payment failed",
      invoice_id: invoice.id,
    });

    logger.warn(
      `User ${userId} payment failed for invoice ${invoice.id}, status set to past_due`
    );
  } catch (error) {
    logger.error("Error handling payment failure:", error);
    throw error;
  }
}

/**
 * Handle gift checkout completion
 * Creates a gift code after successful payment
 */
async function handleGiftCheckoutCompleted(session: Stripe.Checkout.Session) {
  const purchaserEmail = session.metadata?.purchaser_email || session.customer_email;
  const purchaserName = session.metadata?.purchaser_name;

  if (!purchaserEmail) {
    logger.error("No purchaser email in gift checkout session metadata");
    return;
  }

  try {
    // Get payment intent ID for tracking
    const paymentIntentId = session.payment_intent as string | undefined;

    // Create the gift code in the database
    const giftCode = await createGiftCode({
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId: paymentIntentId,
      purchaserEmail,
      purchaserName: purchaserName || undefined,
      amountPaidCents: session.amount_total || 7900,
    });

    logger.info(
      `Gift code created: ${giftCode.code} for purchaser ${purchaserEmail} (session: ${session.id})`
    );

    // TODO: Send receipt email to purchaser with the gift code
    // This will be implemented in the email templates phase
  } catch (error) {
    logger.error("Error handling gift checkout completion:", error);
    throw error;
  }
}

/**
 * Handle charge refunded
 * Marks gift codes as refunded if applicable
 */
async function handleChargeRefunded(charge: Stripe.Charge) {
  try {
    // Get the payment intent from the charge
    const paymentIntentId = charge.payment_intent as string | undefined;

    if (!paymentIntentId) {
      return;
    }

    // Try to find the checkout session for this payment intent
    const sessions = await stripe.checkout.sessions.list({
      payment_intent: paymentIntentId,
      limit: 1,
    });

    if (sessions.data.length === 0) {
      return;
    }

    const session = sessions.data[0];

    // Check if this was a gift purchase
    if (session.metadata?.purchase_type !== "gift") {
      return;
    }

    // Mark the gift code as refunded
    await markGiftCodeRefunded(session.id);

    logger.info(`Gift code marked as refunded for session: ${session.id}`);
  } catch (error) {
    logger.error("Error handling charge refund:", error);
    // Don't throw - refund should still process even if we can't update the gift code
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
