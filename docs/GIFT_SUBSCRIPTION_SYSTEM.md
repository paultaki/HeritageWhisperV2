# Gift Subscription System

> Allow adult children to purchase HeritageWhisper subscriptions as gifts for their parents.

## Overview

The gift subscription system enables one-time $79 purchases that generate unique gift codes. Recipients redeem these codes to activate a 1-year Premium subscription. If the recipient already has an active subscription, the gift extends it by one year.

## User Flows

### Flow 1: Gift Purchase

```
1. Purchaser visits /gift
2. Enters their email (for receipt) and name (optional)
3. Clicks "Give This Gift" → Stripe Checkout (guest, one-time payment)
4. Completes $79 payment
5. Webhook creates gift_codes record, generates GIFT-XXXX-XXXX-XXXX code
6. Redirect to /gift/success with:
   - Gift code displayed prominently
   - "Copy Code" button
   - Printable gift card option
7. Purchaser shares code however they prefer (wrap it, text it, put in card)
```

### Flow 2: Gift Redemption

```
1. Recipient visits /gift/redeem (or clicks link with ?code=GIFT-XXXX-XXXX-XXXX)
2. Enters gift code
3. System validates code (exists, not redeemed, not expired)
4. If not logged in: prompted to sign in or create account
5. If logged in: shown "Activate My Gift" button
6. On activation:
   - New users: is_paid = true, stripe_customers record created
   - Existing subscribers: current_period_end extended by 1 year
   - Gift code marked as 'redeemed'
7. Redirect to /timeline with success message
```

### Flow 3: Already Subscribed Recipient

```
1. Recipient redeems code while having active subscription
2. System adds 1 year to their current_period_end date
3. Shows confirmation: "Your subscription now extends to [new date]!"
```

## Database Schema

### Table: `gift_codes`

```sql
CREATE TABLE gift_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Gift code (format: GIFT-XXXX-XXXX-XXXX)
  code TEXT NOT NULL UNIQUE,

  -- Purchase info
  stripe_checkout_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  amount_paid_cents INTEGER NOT NULL DEFAULT 7900,

  -- Purchaser info
  purchaser_email TEXT NOT NULL,
  purchaser_name TEXT,
  purchaser_user_id UUID REFERENCES auth.users(id),

  -- Recipient info (filled on redemption)
  recipient_email TEXT,
  recipient_name TEXT,
  redeemed_by_user_id UUID REFERENCES auth.users(id),
  redeemed_at TIMESTAMPTZ,

  -- Lifecycle
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('pending', 'active', 'redeemed', 'expired', 'refunded')),
  expires_at TIMESTAMPTZ NOT NULL,  -- 1 year from purchase

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Status Values:**
- `pending` - Payment not yet completed
- `active` - Ready for redemption
- `redeemed` - Code has been used
- `expired` - Past expiration date
- `refunded` - Payment was refunded

## API Routes

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/api/gift/create-checkout` | POST | No | Create Stripe checkout session |
| `/api/gift/validate` | POST | No | Validate code, return gift details |
| `/api/gift/redeem` | POST | Yes | Redeem code, activate subscription |
| `/api/gift/session/[sessionId]` | GET | No | Get code by checkout session ID |

### POST /api/gift/create-checkout

**Request:**
```json
{
  "purchaserEmail": "buyer@example.com",
  "purchaserName": "John Smith"
}
```

**Response:**
```json
{
  "url": "https://checkout.stripe.com/...",
  "sessionId": "cs_..."
}
```

### POST /api/gift/validate

**Request:**
```json
{
  "code": "GIFT-ABCD-EFGH-IJKL"
}
```

**Response (valid):**
```json
{
  "valid": true,
  "giftDetails": {
    "purchaserName": "John Smith",
    "expiresAt": "2025-11-28T00:00:00Z"
  }
}
```

**Response (invalid):**
```json
{
  "valid": false,
  "error": "This gift code has already been redeemed"
}
```

### POST /api/gift/redeem

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "code": "GIFT-ABCD-EFGH-IJKL"
}
```

**Response:**
```json
{
  "success": true,
  "isExtension": false,
  "newExpirationDate": "2026-11-28T00:00:00Z",
  "message": "Welcome to HeritageWhisper Premium! Your subscription is active until November 28, 2026."
}
```

## Frontend Pages

| Path | Purpose |
|------|---------|
| `/gift` | Purchase page - email input, $79 checkout |
| `/gift/success` | Shows gift code after purchase, copy/print options |
| `/gift/redeem` | Senior-friendly redemption with large inputs |

## Stripe Configuration

### 1. Create Product in Stripe Dashboard

Go to **Products** → **Add product**

| Field | Value |
|-------|-------|
| **Name** | HeritageWhisper Gift - 1 Year |
| **Description** | Gift a full year of HeritageWhisper Premium. Recipient receives unlimited story recordings, family sharing, and all premium features. |

### 2. Create Price

| Field | Value |
|-------|-------|
| **Pricing model** | Standard pricing |
| **Price** | $79.00 |
| **Billing period** | One time |
| **Currency** | USD |

### 3. Copy Price ID

After saving, copy the Price ID (e.g., `price_1ABC123...`)

### 4. Configure Webhook

Ensure your webhook endpoint receives:
- `checkout.session.completed` - Creates gift code after payment
- `charge.refunded` - Marks gift code as refunded

## Environment Variables

```bash
# Required for gift purchases
STRIPE_GIFT_PRICE_ID=price_xxxxxxxxxxxxx
```

Add to your `.env.local` and production environment.

## File Locations

```
lib/
├── giftCodes.ts              # Core gift code utilities
├── stripe.ts                 # GIFT_PRICE_ID constant

app/
├── gift/
│   ├── page.tsx              # Purchase page
│   ├── success/page.tsx      # Success page with code
│   └── redeem/page.tsx       # Redemption page
├── api/gift/
│   ├── create-checkout/route.ts
│   ├── validate/route.ts
│   ├── redeem/route.ts
│   └── session/[sessionId]/route.ts

migrations/
└── 20251128000000_create_gift_codes_table.sql

shared/
└── schema.ts                 # giftCodes table definition
```

## Edge Cases

| Scenario | Handling |
|----------|----------|
| Recipient already subscribed | Extend subscription by 1 year |
| Gift code expired | Clear error message, suggest contacting support |
| Purchaser wants refund (unredeemed) | Check status, process refund, mark 'refunded' |
| Code entered with/without dashes | Both formats accepted, normalized internally |
| Purchaser redeems own gift | Allowed (valid use case) |

## Security Considerations

- Gift codes use cryptographically random generation
- Session ID acts as proof of purchase for success page
- Redemption requires authentication
- RLS policies restrict access to own purchases/redemptions
- Service role used for webhook operations

## Future Enhancements

- [ ] Email templates (receipt to purchaser, notification on redemption)
- [ ] Gift management dashboard for purchasers
- [ ] Expiration reminder emails (30 days before)
- [ ] Bulk gift code generation for corporate gifts

---

*Last updated: November 28, 2025*
