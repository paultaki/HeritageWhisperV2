# Stripe Payment Integration - HeritageWhisper

**Status:** ✅ Production Ready
**Last Updated:** November 23, 2025
**Plan:** Founding Family Plan - $79/year annual subscription

---

## Table of Contents

1. [Overview](#overview)
2. [Environment Variables](#environment-variables)
3. [Database Schema](#database-schema)
4. [Payment Flow](#payment-flow)
5. [API Routes](#api-routes)
6. [Frontend Components](#frontend-components)
7. [Testing Locally](#testing-locally)
8. [Webhook Setup](#webhook-setup)
9. [Deployment Checklist](#deployment-checklist)
10. [Troubleshooting](#troubleshooting)

---

## Overview

HeritageWhisper uses Stripe for subscription management with a single annual plan:

**Founding Family Plan:**
- **Price:** $79/year (annual billing)
- **Features:**
  - Unlimited stories and family members
  - Family sharing and collaboration
  - Beautiful timeline and book views
  - Safe cloud backup
  - PDF export
  - Priority support

**Architecture:**
- Stripe Checkout for payment collection
- Stripe Customer Portal for subscription management
- Webhooks for subscription lifecycle events
- Separate `stripe_customers` table for Stripe data

---

## Environment Variables

### Required Variables

```bash
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_...              # Server-side Stripe key
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_...  # Client-side Stripe key (for future features)

# Stripe Configuration
STRIPE_PREMIUM_PRICE_ID=price_...          # Annual subscription Price ID
STRIPE_WEBHOOK_SECRET=whsec_...            # Webhook signing secret (different per environment)

# Application URLs
NEXT_PUBLIC_APP_URL=https://dev.heritagewhisper.com  # Base URL for redirect

URLs

# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=https://pwuzksomxnbdndeeivzf.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

### Getting Stripe Keys

1. **API Keys:** https://dashboard.stripe.com/test/apikeys
   - Copy "Secret key" → `STRIPE_SECRET_KEY`
   - Copy "Publishable key" → `NEXT_PUBLIC_STRIPE_PUBLIC_KEY`

2. **Price ID:**
   - Go to Products → Founding Family Plan
   - Copy the Price ID (starts with `price_`)

3. **Webhook Secret:**
   - Created during webhook setup (see [Webhook Setup](#webhook-setup))

### Environment Files

```bash
# Development
.env.local              # Local development (git-ignored)

# Production
# Set via Vercel dashboard: Settings → Environment Variables
```

---

## Database Schema

### Migration: `20251123000000_create_stripe_customers_table.sql`

```sql
CREATE TABLE stripe_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL UNIQUE,
  stripe_subscription_id TEXT,
  status TEXT DEFAULT 'active',
  plan_type TEXT DEFAULT 'founding_family',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### User Fields (in `users` table)

```sql
is_paid BOOLEAN DEFAULT FALSE
subscription_status TEXT DEFAULT 'none'  -- 'none' | 'active' | 'canceled' | 'past_due' | 'trialing'
```

### Running Migration

```bash
# Push migration to Supabase
npm run db:push

# Generate TypeScript types
npx supabase gen types typescript --project-id pwuzksomxnbdndeeivzf > shared/schema.ts
```

---

## Payment Flow

### 1. User Initiates Upgrade

**Trigger Locations:**
- `/upgrade` page - Direct upgrade page
- Family page - "Invite Family Member" button (free users)
- Profile page - Upgrade banner
- Timeline/Book - Premium feature prompts

**Flow:**
```
User clicks "Upgrade"
  → POST /api/stripe/create-checkout
  → Stripe Checkout page
  → User enters payment
  → Success: /upgrade/success?session_id=...
  → Cancel: /upgrade?canceled=true
```

### 2. Checkout Session Creation

**API Route:** `POST /api/stripe/create-checkout`

**Request:**
```json
{
  "triggerLocation": "family_invite"  // Analytics tracking
}
```

**Response:**
```json
{
  "url": "https://checkout.stripe.com/c/pay/cs_...",
  "sessionId": "cs_test_..."
}
```

**What Happens:**
1. Validates user authentication
2. Checks if user already has active subscription
3. Creates or retrieves Stripe customer
4. Creates Checkout Session with metadata
5. Returns Checkout URL for redirect

### 3. Subscription Activation (via Webhook)

**Event:** `checkout.session.completed`

**Webhook Handler:** `POST /api/stripe/webhook`

**Actions:**
1. Validates webhook signature
2. Updates `users.is_paid = true`
3. Updates `users.subscription_status = 'active'`
4. Creates `stripe_customers` record with subscription details
5. Tracks analytics event

### 4. Subscription Management

**Customer Portal:** `POST /api/stripe/customer-portal`

**Allows Users To:**
- Update payment method
- View billing history
- Download invoices
- Cancel subscription

---

## API Routes

### 1. Create Checkout Session

**File:** `/app/api/stripe/create-checkout/route.ts`

```typescript
POST /api/stripe/create-checkout
Authorization: Bearer <JWT_TOKEN>

Body: {
  triggerLocation: string  // 'family_invite' | 'profile_page' | 'direct_link'
}

Response: {
  url: string,        // Stripe Checkout URL
  sessionId: string   // Session ID for tracking
}

Errors:
- 401: Authentication required
- 404: User profile not found
- 400: Already has active subscription
- 500: Server error
```

**Key Features:**
- Validates authentication
- Prevents duplicate subscriptions
- Tracks checkout trigger for analytics
- Sets success/cancel URLs

### 2. Customer Portal

**File:** `/app/api/stripe/customer-portal/route.ts`

```typescript
POST /api/stripe/customer-portal
Authorization: Bearer <JWT_TOKEN>

Response: {
  url: string  // Stripe Customer Portal URL
}

Errors:
- 401: Authentication required
- 403: Premium subscription required
- 404: Stripe customer not found
- 500: Server error
```

### 3. Webhook Handler

**File:** `/app/api/stripe/webhook/route.ts`

```typescript
POST /api/stripe/webhook
Stripe-Signature: <SIGNATURE>

Events Handled:
- checkout.session.completed   → Activate subscription
- customer.subscription.updated → Update status
- customer.subscription.deleted → Cancel subscription
- invoice.payment_failed        → Mark as past_due
```

**Security:**
- Validates Stripe signature
- Uses service role key for database updates
- Logs all events

### 4. Subscription Status

**File:** `/app/api/user/subscription-status/route.ts`

```typescript
GET /api/user/subscription-status
Authorization: Bearer <JWT_TOKEN>

Response: {
  isPaid: boolean,
  subscriptionStatus: string,
  planType: string | null,
  currentPeriodEnd: string | null,  // ISO date
  cancelAtPeriodEnd: boolean,
  stripeStatus: string | null
}
```

---

## Frontend Components

### Pages

**1. Upgrade Page** - `/app/upgrade/page.tsx`
- Pricing display ($79/year)
- Feature comparison
- Trust signals
- Cancel state handling

**2. Success Page** - `/app/upgrade/success/page.tsx`
- Confirmation message
- Subscription details
- Next steps (Timeline, Book, Family)
- Premium features list

### Components

**1. FamilyUpgradeCallout** - `/components/family/FamilyUpgradeCallout.tsx`
- Prominent banner on Family page
- Shown to free users only
- Lists family sharing benefits
- CTA to upgrade page

**2. UpgradeModal** - `/components/upgrade/UpgradeModal.tsx` (existing)
- Modal for upgrade prompts
- Used in multiple trigger locations
- Analytics tracking

### Hooks

**useSubscription()** - `/hooks/use-subscription.tsx`
```typescript
const {
  isPaid,              // boolean
  canInviteFamily,     // boolean
  subscriptionStatus   // string
} = useSubscription();
```

---

## Testing Locally

### 1. Stripe Test Mode

Use test mode keys from https://dashboard.stripe.com/test/apikeys

**Test Cards:**
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
3D Secure: 4000 0027 6000 3184

Expiry: Any future date (e.g., 12/34)
CVC: Any 3 digits (e.g., 123)
ZIP: Any 5 digits (e.g., 12345)
```

### 2. Local Webhook Testing

**Install Stripe CLI:**
```bash
brew install stripe/stripe-cli/stripe
stripe login
```

**Forward Webhooks to Local Server:**
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

**Copy the webhook signing secret** from CLI output:
```bash
> Ready! Your webhook signing secret is whsec_... (^C to quit)
```

Add to `.env.local`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Trigger Test Events:**
```bash
# Successful checkout
stripe trigger checkout.session.completed

# Subscription updated
stripe trigger customer.subscription.updated

# Payment failed
stripe trigger invoice.payment_failed
```

### 3. Full Test Flow

**Step 1:** Start dev server
```bash
npm run dev
```

**Step 2:** Start Stripe CLI (separate terminal)
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

**Step 3:** Test checkout
1. Go to http://localhost:3000/upgrade
2. Click "Upgrade for $79/year"
3. Use test card `4242 4242 4242 4242`
4. Complete checkout
5. Verify redirect to `/upgrade/success`

**Step 4:** Verify database
```sql
-- Check user status
SELECT id, email, is_paid, subscription_status
FROM users
WHERE email = 'your@email.com';

-- Check Stripe customer record
SELECT * FROM stripe_customers
WHERE user_id = 'YOUR_USER_ID';
```

**Step 5:** Test Customer Portal
1. Go to http://localhost:3000/profile
2. Click "Manage Billing"
3. Verify Stripe portal opens

---

## Webhook Setup

### Development (Local)

Use Stripe CLI (see [Testing Locally](#testing-locally))

### Production (Vercel)

**1. Get Webhook Endpoint:**
```
https://dev.heritagewhisper.com/api/stripe/webhook
```

**2. Create Webhook in Stripe Dashboard:**
1. Go to: https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Enter URL: `https://dev.heritagewhisper.com/api/stripe/webhook`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Click "Add endpoint"

**3. Copy Webhook Secret:**
- Click on the webhook
- Click "Reveal" next to "Signing secret"
- Copy the `whsec_...` value

**4. Add to Vercel Environment Variables:**
```bash
STRIPE_WEBHOOK_SECRET=whsec_...
```

**5. Redeploy:**
```bash
git push origin main  # Triggers Vercel deployment
```

**6. Test Webhook:**
1. Go to Stripe Dashboard → Webhooks → Your webhook
2. Click "Send test webhook"
3. Select `checkout.session.completed`
4. Check Vercel logs for webhook receipt

---

## Deployment Checklist

### Pre-Deployment

- [ ] All environment variables set in Vercel
- [ ] Stripe webhook endpoint created
- [ ] Database migration run on production
- [ ] Test mode keys removed from `.env.local`

### Production Setup

**1. Switch to Live Mode in Stripe:**
- [ ] Toggle "View test data" OFF in Stripe Dashboard
- [ ] Copy **live** API keys
- [ ] Create **live** webhook endpoint
- [ ] Update Vercel env vars with live keys

**2. Verify Vercel Environment Variables:**
```bash
STRIPE_SECRET_KEY=sk_live_...              # LIVE key
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_live_...  # LIVE key
STRIPE_PREMIUM_PRICE_ID=price_...          # LIVE Price ID
STRIPE_WEBHOOK_SECRET=whsec_...            # LIVE webhook secret
NEXT_PUBLIC_APP_URL=https://heritagewhisper.com
```

**3. Test Production Flow:**
- [ ] Complete test purchase with real card
- [ ] Verify webhook received in Vercel logs
- [ ] Check database updated correctly
- [ ] Test Customer Portal
- [ ] Test cancellation flow
- [ ] Refund test purchase in Stripe Dashboard

**4. Monitor:**
- [ ] Check Stripe Dashboard for successful payments
- [ ] Monitor Vercel logs for webhook errors
- [ ] Set up Stripe email notifications

---

## Troubleshooting

### Checkout Session Creation Fails

**Error:** `User profile not found`
- **Cause:** User not authenticated or userId bug
- **Fix:** Ensure user is logged in, check auth token

**Error:** `Already has active subscription`
- **Cause:** User already subscribed
- **Fix:** Redirect to Customer Portal instead

**Error:** `Failed to create checkout session`
- **Cause:** Invalid Stripe Price ID or network error
- **Fix:** Verify `STRIPE_PREMIUM_PRICE_ID` is correct

### Webhook Not Received

**Symptoms:**
- Checkout completes but user not marked as paid
- `stripe_customers` record not created

**Debug Steps:**
1. Check Vercel logs: https://vercel.com/your-project/logs
2. Check Stripe Dashboard → Webhooks → your endpoint
3. Look for failed deliveries
4. Verify webhook secret matches

**Common Fixes:**
- Wrong `STRIPE_WEBHOOK_SECRET` → Update in Vercel
- Webhook endpoint wrong URL → Update in Stripe Dashboard
- Signature validation failing → Redeploy with correct secret

### Subscription Status Not Updating

**Check:**
1. Database values:
   ```sql
   SELECT is_paid, subscription_status FROM users WHERE id = '...';
   ```
2. Stripe subscription status:
   - Go to Stripe Dashboard → Customers
   - Find customer by email
   - Check subscription status

**Common Issues:**
- Webhook not processed → Check logs
- Database RLS policy blocking update → Check webhook uses service role key
- Wrong user_id in metadata → Verify checkout session metadata

### Customer Portal Not Working

**Error:** `Stripe customer not found`
- **Cause:** No `stripe_customers` record
- **Fix:** User needs to complete checkout first, or manually sync customer

**Error:** `Premium subscription required`
- **Cause:** `users.is_paid = false`
- **Fix:** Check subscription status, verify webhook processed

### TypeScript Errors

**Error:** `Property 'stripeCustomers' does not exist`
- **Cause:** Types not regenerated after migration
- **Fix:** Run type generation:
  ```bash
  npx supabase gen types typescript --project-id pwuzksomxnbdndeeivzf
  ```

---

## Monitoring & Analytics

### Key Metrics to Track

1. **Conversion Rate:**
   - Upgrade page visits → Checkout initiated
   - Checkout initiated → Checkout completed

2. **Revenue:**
   - Monthly Recurring Revenue (MRR)
   - Annual recurring revenue
   - Churn rate

3. **Errors:**
   - Failed checkouts
   - Webhook failures
   - Payment failures

### Stripe Dashboard

Monitor at: https://dashboard.stripe.com

**Important Sections:**
- **Payments** - All transactions
- **Subscriptions** - Active/canceled subscriptions
- **Customers** - Customer list and details
- **Webhooks** - Webhook delivery status
- **Logs** - API request logs

### Vercel Logs

```bash
# View recent logs
vercel logs

# Filter for webhook errors
vercel logs --filter="stripe/webhook"
```

---

## Support & Resources

**Stripe Documentation:**
- Checkout: https://stripe.com/docs/payments/checkout
- Subscriptions: https://stripe.com/docs/billing/subscriptions/overview
- Webhooks: https://stripe.com/docs/webhooks
- Customer Portal: https://stripe.com/docs/billing/subscriptions/integrating-customer-portal

**Internal Documentation:**
- Database Schema: `/docs/architecture/DATA_MODEL.md`
- API Patterns: `/app/api/CLAUDE.md`
- Family Sharing: `/FAMILY_SHARING_README.md`

**Contact:**
- Stripe Support: https://support.stripe.com
- Stripe Status: https://status.stripe.com

---

**Last Updated:** November 23, 2025
**Version:** 1.0
**Maintained By:** HeritageWhisper Engineering Team
