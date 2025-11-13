# HeritageWhisper Domain Migration Audit
## dev.heritagewhisper.com → heritagewhisper.com

**Audit Date:** January 12, 2025
**Audited By:** Claude Code
**Scope:** Complete codebase analysis for production domain migration

---

## 1. HIGH-LEVEL SUMMARY

### Key Risk Areas (7 Critical Domains)

1. **PDF Export (PDFShift)** - Hard-coded fallback URLs in 2 files
2. **Email Services (Resend)** - Hard-coded fallbacks in 5 locations + domain verification required
3. **Family Invites** - 2 API routes with domain dependencies
4. **Stripe Payments** - 3 redirect URLs + webhook configuration
5. **WebAuthn/Passkeys** - ORIGIN environment variable critical for Touch ID/Face ID
6. **CORS Configuration** - Hard-coded fallback in next.config.ts affects API access
7. **Supabase Auth** - Redirect URLs in dashboard + code fallback

### Scope of Work

- **14 files** require code changes
- **6 environment variables** must be updated in Vercel
- **4 external service dashboards** need configuration updates
- **~20 hard-coded fallback values** to replace
- **Estimated migration time:** 2-3 hours (code changes + testing)

### Risk Level: MEDIUM-HIGH

- Most code gracefully falls back to env vars (good!)
- Hard-coded fallbacks are safety nets but wrong domain
- External service configs (Stripe webhooks, Resend DNS) have 5-60 min propagation delays
- WebAuthn passkeys are domain-locked - CRITICAL for auth flow

---

## 2. FINDINGS BY SERVICE

### 2.1 PDF EXPORT (PDFShift) 🔴 CRITICAL

#### Issue #1: Export 2up Route Fallback
**File:** `app/api/export/2up/route.ts`
**Line:** 59
**Current Code:**
```typescript
const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : process.env.NEXT_PUBLIC_SITE_URL || 'https://dev.heritagewhisper.com';
```

**Why it matters:**
- PDFShift generates PDFs by fetching your app's print view
- Wrong domain = broken PDF generation in production
- PDFShift cannot access localhost (already has warning)

**Action Required:**
```typescript
// Change line 59 from:
  : process.env.NEXT_PUBLIC_SITE_URL || 'https://dev.heritagewhisper.com';
// To:
  : process.env.NEXT_PUBLIC_SITE_URL || 'https://heritagewhisper.com';
```

---

#### Issue #2: Export Trim Route Fallback
**File:** `app/api/export/trim/route.ts`
**Line:** 57
**Current Code:**
```typescript
const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : process.env.NEXT_PUBLIC_SITE_URL || 'https://dev.heritagewhisper.com';
```

**Action Required:**
```typescript
// Change line 57 from:
  : process.env.NEXT_PUBLIC_SITE_URL || 'https://dev.heritagewhisper.com';
// To:
  : process.env.NEXT_PUBLIC_SITE_URL || 'https://heritagewhisper.com';
```

---

### 2.2 EMAIL SERVICES (Resend) 🔴 CRITICAL

#### Issue #3: Verification Email URL Validation
**File:** `lib/resend.ts`
**Line:** 55
**Current Code:**
```typescript
if (!confirmationUrl.startsWith(process.env.NEXT_PUBLIC_APP_URL || 'https://dev.heritagewhisper.com')) {
  throw new Error('Invalid confirmation URL');
}
```

**Why it matters:**
- Security check to prevent email injection attacks
- Rejects confirmation emails if URL doesn't match expected domain

**Action Required:**
```typescript
// Change line 55:
if (!confirmationUrl.startsWith(process.env.NEXT_PUBLIC_APP_URL || 'https://heritagewhisper.com')) {
```

---

#### Issue #4: Welcome Email Timeline Link
**File:** `lib/resend.ts`
**Line:** 171
**Current Code:**
```typescript
<a href="${process.env.NEXT_PUBLIC_APP_URL || "https://dev.heritagewhisper.com"}/timeline"
```

**Action Required:**
```typescript
// Change line 171:
<a href="${process.env.NEXT_PUBLIC_APP_URL || "https://heritagewhisper.com"}/timeline"
```

---

#### Issue #5: Welcome Email Help Link
**File:** `lib/resend.ts`
**Line:** 180
**Current Code:**
```typescript
<a href="${process.env.NEXT_PUBLIC_APP_URL || "https://dev.heritagewhisper.com"}/help"
```

**Action Required:**
```typescript
// Change line 180:
<a href="${process.env.NEXT_PUBLIC_APP_URL || "https://heritagewhisper.com"}/help"
```

---

#### Issue #6: Question Received Notification
**File:** `lib/notifications/send-question-received.ts`
**Line:** 72
**Current Code:**
```typescript
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002';
```

**Why it matters:**
- Localhost fallback useless in production
- Generates broken links in family question notification emails

**Action Required:**
```typescript
// Change line 72:
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://heritagewhisper.com';
```

---

#### Issue #7: New Story Notification
**File:** `lib/notifications/send-new-story-notifications.ts`
**Line:** 125
**Current Code:**
```typescript
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002';
```

**Action Required:**
```typescript
// Change line 125:
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://heritagewhisper.com';
```

---

#### Issue #8: Resend Domain Configuration (External)

**Current State:**
- `.env.local` has: `RESEND_FROM_EMAIL=noreply@dev.heritagewhisper.com`
- Code uses: `noreply@heritagewhisper.com` (production email already ✅)

**Action Required in Resend Dashboard:**
1. **Add domain:** `heritagewhisper.com`
2. **Configure DNS records:**
   - SPF: `v=spf1 include:_spf.resend.com ~all`
   - DKIM: `resend._domainkey` (get value from dashboard)
   - DMARC: `_dmarc` → `v=DMARC1; p=none; rua=mailto:postmaster@heritagewhisper.com`
3. **Verify sender:** `noreply@heritagewhisper.com`
4. **Optional:** Add `support@heritagewhisper.com` (used in family invite template)

**Environment Variable:**
```bash
RESEND_FROM_EMAIL="HeritageWhisper <noreply@heritagewhisper.com>"
```

---

### 2.3 FAMILY INVITES 🔴 CRITICAL

#### Issue #9: Create Family Invite URL
**File:** `app/api/family/invite/route.ts`
**Line:** 150
**Current Code:**
```typescript
const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/family/access?token=${inviteToken}`;
```

**Action Required:**
```typescript
// Change line 150:
const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://heritagewhisper.com'}/family/access?token=${inviteToken}`;
```

---

#### Issue #10: Resend Family Invite URL
**File:** `app/api/family/[memberId]/resend/route.ts`
**Line:** 115
**Current Code:**
```typescript
const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/family/access?token=${inviteToken}`;
```

**Action Required:**
```typescript
// Change line 115:
const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://heritagewhisper.com'}/family/access?token=${inviteToken}`;
```

---

### 2.4 STRIPE PAYMENTS 💳 CRITICAL

#### Issue #11: Checkout Success/Cancel URLs
**File:** `app/api/stripe/create-checkout/route.ts`
**Lines:** 104-105
**Current Code:**
```typescript
success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/profile?upgraded=true`,
cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/upgrade?canceled=true`,
```

**Why it matters:**
- Users redirected to wrong domain after payment
- Breaks payment confirmation flow

**Action Required:**
```typescript
// Change lines 104-105:
success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://heritagewhisper.com'}/profile?upgraded=true`,
cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://heritagewhisper.com'}/upgrade?canceled=true`,
```

---

#### Issue #12: Customer Portal Return URL
**File:** `app/api/stripe/customer-portal/route.ts`
**Line:** 106
**Current Code:**
```typescript
return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/profile`,
```

**Action Required:**
```typescript
// Change line 106:
return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://heritagewhisper.com'}/profile`,
```

---

#### Issue #13: Stripe Webhook Configuration (External)

**Current State:**
- Webhook route exists: `app/api/stripe/webhook/route.ts` ✅
- No domain-specific code ✅
- Uses `STRIPE_WEBHOOK_SECRET` environment variable ✅

**Action Required in Stripe Dashboard:**
1. **Go to:** Developers → Webhooks
2. **Create endpoint:** `https://heritagewhisper.com/api/stripe/webhook`
3. **Select events:**
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. **Copy signing secret** → Add to Vercel as `STRIPE_WEBHOOK_SECRET`
5. **Optional:** Keep dev webhook active for `dev.heritagewhisper.com` testing

**Also Update:**
- Business Settings → Customer emails
  - Privacy Policy: `https://heritagewhisper.com/privacy`
  - Terms of Service: `https://heritagewhisper.com/terms`

---

### 2.5 WEBAUTHN / PASSKEYS 🔐 CRITICAL

#### Issue #14: WebAuthn Origin Configuration
**File:** `lib/webauthn-config.ts`
**Lines:** 14, 16
**Current Code:**
```typescript
export const RP_ID = process.env.RP_ID || "heritagewhisper.com";
export const ORIGIN = process.env.ORIGIN || "http://localhost:3002";
```

**Why it matters:**
- **CRITICAL FOR PASSKEY AUTH:** Touch ID, Face ID, Windows Hello
- RP_ID must match production domain or passkeys won't work
- ORIGIN determines which domain can register/use passkeys
- Mismatch = "The RP ID 'heritagewhisper.com' is invalid for this domain" error

**Current State:**
- RP_ID defaults to `heritagewhisper.com` ✅ (already correct!)
- ORIGIN defaults to localhost ❌ (must change)

**Action Required:**
```bash
# Set in Vercel production environment:
ORIGIN=https://heritagewhisper.com
RP_ID=heritagewhisper.com  # (optional, already correct default)
```

**For Testing:**
- Dev environment: `RP_ID=localhost` `ORIGIN=http://localhost:3002`
- Staging: `RP_ID=heritagewhisper.com` `ORIGIN=https://dev.heritagewhisper.com`
- Production: `RP_ID=heritagewhisper.com` `ORIGIN=https://heritagewhisper.com`

---

### 2.6 SUPABASE AUTH 🔒 CRITICAL

#### Issue #15: Auth Callback Fallback
**File:** `lib/supabase.ts`
**Line:** 31
**Current Code:**
```typescript
: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3002"}/auth/callback`;
```

**Action Required:**
```typescript
// Change line 31:
: `${process.env.NEXT_PUBLIC_SITE_URL || "https://heritagewhisper.com"}/auth/callback`;
```

---

#### Issue #16: Registration Confirmation URL
**File:** `app/api/auth/register/route.ts`
**Line:** 215
**Current Code:**
```typescript
const confirmationUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"}/auth/verified?email=${encodeURIComponent(email)}`;
```

**Why it matters:**
- Note the port mismatch: 3001 vs 3002 elsewhere (likely a typo)
- Generates email verification links

**Action Required:**
```typescript
// Change line 215:
const confirmationUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://heritagewhisper.com"}/auth/verified?email=${encodeURIComponent(email)}`;
```

---

#### Issue #17: Supabase Dashboard Configuration (External)

**Action Required in Supabase Dashboard:**
1. **Go to:** Authentication → URL Configuration
2. **Add Redirect URLs:**
   - `https://heritagewhisper.com/auth/callback`
   - `https://heritagewhisper.com/auth/reset-password`
   - `https://heritagewhisper.com/*` (wildcard, optional)
   - If using www subdomain: `https://www.heritagewhisper.com/auth/callback`
3. **Set Site URL:** `https://heritagewhisper.com`
4. **Optional:** Keep `https://dev.heritagewhisper.com/*` for staging testing

**Email Templates (optional review):**
- Confirm signup → Uses redirect URL above
- Reset password → Uses redirect URL above
- Magic link → Uses redirect URL above

---

### 2.7 CORS CONFIGURATION 🔒 HIGH PRIORITY

#### Issue #18: Next.js CORS Headers
**File:** `next.config.ts`
**Lines:** 56-58, 100-101
**Current Code:**
```typescript
// Line 56-58:
const devOrigin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002';
const prodOrigin = process.env.NEXT_PUBLIC_APP_URL || 'https://dev.heritagewhisper.com';
const allowOrigin = isProd ? prodOrigin : devOrigin;

// Line 100-101 (in headers array):
{
  key: 'Access-Control-Allow-Origin',
  value: allowOrigin,
}
```

**Why it matters:**
- **CRITICAL:** Controls which domains can make API requests
- Wrong origin = 403 CORS errors for all API calls
- Affects client-side fetch requests to `/api/*` routes

**Action Required:**
```typescript
// Change line 57:
const prodOrigin = process.env.NEXT_PUBLIC_APP_URL || 'https://heritagewhisper.com';
```

---

### 2.8 METADATA & SEO 🌐 RECOMMENDED

#### Issue #19: Root Layout Metadata
**File:** `app/layout.tsx`
**Lines:** 14-36
**Current Code:**
```typescript
export const metadata: Metadata = {
  title: "HeritageWhisper - Preserve Your Life Stories",
  description: "An AI-powered storytelling platform...",
  robots: {
    index: false,  // Currently blocking search engines
    follow: false,
  },
};
```

**Why it matters:**
- Missing canonical URLs and OpenGraph tags
- robots.txt blocking search engines (intentional for dev?)

**Action Required (Production Only):**
```typescript
export const metadata: Metadata = {
  metadataBase: new URL('https://heritagewhisper.com'),
  title: "HeritageWhisper - Preserve Your Life Stories",
  description: "An AI-powered storytelling platform for seniors...",
  robots: {
    index: true,   // Allow Google indexing
    follow: true,
  },
  openGraph: {
    url: 'https://heritagewhisper.com',
    siteName: 'HeritageWhisper',
    type: 'website',
  },
};
```

---

### 2.9 SERVICES WITH NO DOMAIN DEPENDENCIES ✅

The following services use **API keys only** with no domain-specific configuration:

#### AssemblyAI
- **File:** Uses environment variable `ASSEMBLYAI_API_KEY`
- **Domain dependency:** None
- **Action:** Ensure production API key is set (not dev key)

#### OpenAI / Vercel AI Gateway
- **File:** `lib/ai/gatewayClient.ts`
- **Domain dependency:** None
- **Uses:**
  - `OPENAI_API_KEY` or `AI_GATEWAY_API_KEY`
  - `VERCEL_AI_GATEWAY_BASE_URL` (default: `https://ai-gateway.vercel.sh/v1`)
- **Action:** Verify production keys, no code changes needed

#### Upstash (Redis Rate Limiting)
- **File:** `lib/ratelimit.ts`
- **Domain dependency:** None
- **Uses:**
  - `UPSTASH_REDIS_REST_URL`
  - `UPSTASH_REDIS_REST_TOKEN`
- **Action:** Ensure production Redis instance configured

#### PDFShift API
- **File:** `lib/pdfshift.ts`
- **Domain dependency:** None (all URLs passed dynamically from export routes)
- **Uses:** `PDFSHIFT_API_KEY`
- **Action:** Verify production API key quota

---

## 3. GLOBAL DOMAIN/ENV FINDINGS

### 3.1 All Hard-Coded Domain References

**Files with `dev.heritagewhisper.com`:**
1. `app/api/export/2up/route.ts:59` ❌
2. `app/api/export/trim/route.ts:57` ❌
3. `lib/resend.ts:55` ❌
4. `lib/resend.ts:171` ❌
5. `lib/resend.ts:180` ❌
6. `next.config.ts:57` ❌

**Files with `localhost` fallbacks (should be production domain):**
1. `lib/notifications/send-question-received.ts:72` ❌
2. `lib/notifications/send-new-story-notifications.ts:125` ❌
3. `app/api/family/invite/route.ts:150` ❌
4. `app/api/family/[memberId]/resend/route.ts:115` ❌
5. `lib/supabase.ts:31` ❌
6. `app/api/auth/register/route.ts:215` ❌
7. `app/api/stripe/create-checkout/route.ts:104-105` ❌
8. `app/api/stripe/customer-portal/route.ts:106` ❌

**Files using dynamic `window.location.origin` (✅ no changes needed):**
- `lib/supabase.ts:30` ✅
- `app/family/page.tsx:388` ✅
- `app/auth/forgot-password/page.tsx:34` ✅

---

### 3.2 Environment Variables Required for Production

| Variable | Purpose | Current Dev Value | Production Value | Priority |
|----------|---------|-------------------|------------------|----------|
| `NEXT_PUBLIC_APP_URL` | Primary app URL for links | `http://localhost:3002` | `https://heritagewhisper.com` | 🔴 CRITICAL |
| `NEXT_PUBLIC_SITE_URL` | Used for redirects/PDFs | `https://dev.heritagewhisper.com` | `https://heritagewhisper.com` | 🔴 CRITICAL |
| `ORIGIN` | WebAuthn passkey domain | `http://localhost:3002` | `https://heritagewhisper.com` | 🔴 CRITICAL |
| `RP_ID` | WebAuthn relying party | `heritagewhisper.com` | `heritagewhisper.com` | ✅ Already correct |
| `RESEND_FROM_EMAIL` | Email sender address | `noreply@dev.heritagewhisper.com` | `HeritageWhisper <noreply@heritagewhisper.com>` | 🟡 Recommended |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook verification | `whsec_...dev...` | `whsec_...prod...` | 🔴 CRITICAL |
| `STRIPE_SECRET_KEY` | Stripe API key | `sk_test_...` | `sk_live_...` | 🔴 CRITICAL |
| `OPENAI_API_KEY` | OpenAI API access | (shared) | (same or different) | 🟡 Optional |
| `PDFSHIFT_API_KEY` | PDF generation | (shared) | (verify quota) | 🟡 Optional |

**Additional Variables (no changes needed):**
- `SUPABASE_*` - No domain dependency
- `ASSEMBLYAI_API_KEY` - No domain dependency
- `UPSTASH_REDIS_*` - No domain dependency (but verify production instance)
- `AI_GATEWAY_API_KEY` - No domain dependency

---

## 4. FINAL MIGRATION CHECKLIST

### Phase 1: PREPARE CODE (30-45 minutes)

#### Step 1.1: Update Hard-Coded Fallbacks
- [ ] `app/api/export/2up/route.ts:59` → change to `'https://heritagewhisper.com'`
- [ ] `app/api/export/trim/route.ts:57` → change to `'https://heritagewhisper.com'`
- [ ] `lib/resend.ts:55` → change to `'https://heritagewhisper.com'`
- [ ] `lib/resend.ts:171` → change to `'https://heritagewhisper.com'`
- [ ] `lib/resend.ts:180` → change to `'https://heritagewhisper.com'`
- [ ] `next.config.ts:57` → change to `'https://heritagewhisper.com'`
- [ ] `lib/notifications/send-question-received.ts:72` → change to `'https://heritagewhisper.com'`
- [ ] `lib/notifications/send-new-story-notifications.ts:125` → change to `'https://heritagewhisper.com'`
- [ ] `app/api/family/invite/route.ts:150` → change to `'https://heritagewhisper.com'`
- [ ] `app/api/family/[memberId]/resend/route.ts:115` → change to `'https://heritagewhisper.com'`
- [ ] `lib/supabase.ts:31` → change to `'https://heritagewhisper.com'`
- [ ] `app/api/auth/register/route.ts:215` → change to `'https://heritagewhisper.com'`
- [ ] `app/api/stripe/create-checkout/route.ts:104-105` → change to `'https://heritagewhisper.com'`
- [ ] `app/api/stripe/customer-portal/route.ts:106` → change to `'https://heritagewhisper.com'`

#### Step 1.2: Optional SEO Improvements
- [ ] `app/layout.tsx` → Add `metadataBase` and OpenGraph URLs
- [ ] `app/layout.tsx` → Set `robots.index: true` (if ready for SEO)

#### Step 1.3: Commit Changes
```bash
git add .
git commit -m "chore: update hard-coded domain fallbacks for production

- Replace dev.heritagewhisper.com with heritagewhisper.com in fallbacks
- Replace localhost fallbacks with production domain
- Update email links, PDF export URLs, and Stripe redirects
- Prepare for heritagewhisper.com deployment"
```

---

### Phase 2: CONFIGURE VERCEL (10-15 minutes)

#### Step 2.1: Add Production Domain
- [ ] Go to Vercel Dashboard → Project Settings → Domains
- [ ] Add domain: `heritagewhisper.com`
- [ ] Add domain: `www.heritagewhisper.com` (optional, redirect to apex)
- [ ] Configure DNS:
  - **A record:** `@` → Vercel IP (provided by Vercel)
  - **CNAME:** `www` → `cname.vercel-dns.com` (if using www)

#### Step 2.2: Update Environment Variables
- [ ] Go to Vercel Dashboard → Project Settings → Environment Variables
- [ ] Set **Production** environment:
  - `NEXT_PUBLIC_APP_URL=https://heritagewhisper.com`
  - `NEXT_PUBLIC_SITE_URL=https://heritagewhisper.com`
  - `ORIGIN=https://heritagewhisper.com`
  - `RP_ID=heritagewhisper.com` (optional, already default)
  - `RESEND_FROM_EMAIL=HeritageWhisper <noreply@heritagewhisper.com>`
- [ ] Keep **Preview** environment with dev values (optional):
  - `NEXT_PUBLIC_APP_URL=https://dev.heritagewhisper.com`
  - `NEXT_PUBLIC_SITE_URL=https://dev.heritagewhisper.com`
  - `ORIGIN=https://dev.heritagewhisper.com`

#### Step 2.3: Deploy
- [ ] Push changes to main branch
- [ ] Wait for Vercel deployment to complete
- [ ] Verify deployment at `https://heritagewhisper.com`

---

### Phase 3: CONFIGURE THIRD-PARTY SERVICES (20-30 minutes)

#### Step 3.1: Supabase Dashboard
- [ ] Go to: https://supabase.com/dashboard/project/tjycibrhoammxohemyhq/auth/url-configuration
- [ ] **Add Redirect URLs:**
  - `https://heritagewhisper.com/auth/callback`
  - `https://heritagewhisper.com/auth/reset-password`
  - `https://heritagewhisper.com/*` (wildcard, optional)
- [ ] **Set Site URL:** `https://heritagewhisper.com`
- [ ] **Optional:** Keep dev URLs for testing:
  - `https://dev.heritagewhisper.com/*`

#### Step 3.2: Stripe Dashboard
- [ ] Go to: https://dashboard.stripe.com/webhooks
- [ ] **Create Webhook Endpoint:**
  - URL: `https://heritagewhisper.com/api/stripe/webhook`
  - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
  - Copy signing secret
- [ ] **Add to Vercel:**
  - Variable: `STRIPE_WEBHOOK_SECRET`
  - Value: `whsec_...` (from webhook creation)
  - Environment: Production
- [ ] **Update Business Settings:**
  - Privacy Policy: `https://heritagewhisper.com/privacy`
  - Terms of Service: `https://heritagewhisper.com/terms`
- [ ] **Optional:** Keep dev webhook for `https://dev.heritagewhisper.com/api/stripe/webhook`

#### Step 3.3: Resend Dashboard
- [ ] Go to: https://resend.com/domains
- [ ] **Add Domain:** `heritagewhisper.com`
- [ ] **Configure DNS Records:**
  - **SPF:** `v=spf1 include:_spf.resend.com ~all`
  - **DKIM:** `resend._domainkey` → (value from Resend dashboard)
  - **DMARC:** `_dmarc` → `v=DMARC1; p=none; rua=mailto:postmaster@heritagewhisper.com`
- [ ] **Verify Domain** (wait 5-15 minutes for DNS propagation)
- [ ] **Add Verified Sender:** `noreply@heritagewhisper.com`
- [ ] **Test Email:** Send test from Resend dashboard

#### Step 3.4: PDFShift (Optional)
- [ ] No configuration changes needed
- [ ] Verify API key has sufficient quota
- [ ] Consider separate prod API key for usage tracking

---

### Phase 4: END-TO-END TESTING (30-45 minutes)

#### Step 4.1: Authentication Flow
- [ ] **New User Registration:**
  - Register new account
  - Verify email received with correct heritagewhisper.com link
  - Click verification link → confirm redirect to heritagewhisper.com
  - Test login with email/password
- [ ] **Passkey Registration (WebAuthn):**
  - Register new passkey (Touch ID/Face ID)
  - Log out
  - Sign in with passkey → verify it works
  - **CRITICAL:** If this fails, check `ORIGIN` and `RP_ID` env vars
- [ ] **Password Reset:**
  - Request password reset
  - Verify email received with correct link
  - Complete password reset flow
- [ ] **OAuth (if enabled):**
  - Test Google Sign-In
  - Verify redirect back to heritagewhisper.com

#### Step 4.2: Email Notifications
- [ ] **Family Invite:**
  - Send family invite
  - Verify email contains heritagewhisper.com invite link
  - Click link → confirm redirect works
- [ ] **Question Received:**
  - Submit family question
  - Verify notification email has correct link
- [ ] **New Story Notification:**
  - Create story
  - Verify family member receives email with correct link

#### Step 4.3: Payment Flow
- [ ] **Stripe Checkout:**
  - Start subscription upgrade
  - Complete test payment (use test card: 4242 4242 4242 4242)
  - Verify redirect to `heritagewhisper.com/profile?upgraded=true`
  - Confirm webhook received in Stripe dashboard
- [ ] **Customer Portal:**
  - Access billing portal
  - Verify redirect to `heritagewhisper.com/profile` after exit
  - Test subscription cancellation (optional)

#### Step 4.4: PDF Export
- [ ] **2up Export:**
  - Navigate to Book view
  - Export 2up PDF
  - Verify PDF generates successfully
  - **If it fails:** Check `NEXT_PUBLIC_SITE_URL` in Vercel
- [ ] **Trim Export:**
  - Export trim PDF
  - Verify PDF generates successfully

#### Step 4.5: API & CORS
- [ ] Open browser DevTools → Network tab
- [ ] Navigate through app
- [ ] Verify no CORS errors in console
- [ ] Test API endpoints:
  - Story creation
  - Photo upload
  - Prompt fetching
  - Family data access

#### Step 4.6: Security & Meta
- [ ] Check `robots.txt`: `https://heritagewhisper.com/robots.txt`
- [ ] Check `security.txt`: `https://heritagewhisper.com/.well-known/security.txt`
- [ ] View page source → verify meta tags have correct URLs
- [ ] Test CSP headers (should not block any resources)

---

### Phase 5: MONITORING (Ongoing)

#### Step 5.1: Immediate Post-Launch (First Hour)
- [ ] Monitor Vercel deployment logs for errors
- [ ] Check Sentry/error tracking for exceptions
- [ ] Monitor Stripe webhook delivery (should show "Succeeded")
- [ ] Test 2-3 user journeys manually

#### Step 5.2: First 24 Hours
- [ ] Check Resend dashboard for email delivery rate
- [ ] Monitor PDF export success rate
- [ ] Verify passkey auth working for existing users
- [ ] Check for any CORS errors in browser console
- [ ] Review Upstash Redis logs (rate limiting)

#### Step 5.3: First Week
- [ ] Monitor DNS propagation (may take 24-48 hours globally)
- [ ] Check for any hard-coded dev.heritagewhisper.com references you missed
- [ ] Review user feedback for broken links
- [ ] Test from different devices/browsers

---

### Phase 6: ROLLBACK PLAN (If Needed)

If critical issues occur:

#### Option A: Quick Env Var Rollback (2 minutes)
1. Go to Vercel → Environment Variables
2. Change back to:
   - `NEXT_PUBLIC_APP_URL=https://dev.heritagewhisper.com`
   - `NEXT_PUBLIC_SITE_URL=https://dev.heritagewhisper.com`
   - `ORIGIN=https://dev.heritagewhisper.com`
3. Redeploy (triggers automatic rebuild)

#### Option B: Full Code Rollback (5 minutes)
```bash
git revert HEAD
git push origin main
# Vercel auto-deploys
```

#### Option C: Partial Rollback (Keep Both)
- Keep heritagewhisper.com as primary
- Restore dev.heritagewhisper.com as fallback
- Use Vercel preview deployments for testing

**What Won't Rollback Instantly:**
- DNS changes (5-60 minutes)
- Resend domain verification (manual)
- Stripe webhook endpoint (manual, but can coexist)
- Passkeys registered on new domain (need re-registration)

---

## 5. POST-MIGRATION CLEANUP

After successful migration (1-2 weeks later):

- [ ] Remove dev.heritagewhisper.com from Supabase redirect URLs (optional)
- [ ] Archive dev Stripe webhook (keep for reference)
- [ ] Update documentation (README.md, CLAUDE.md) with new URLs
- [ ] Update .env.example with production domain defaults
- [ ] Search codebase for any remaining "dev.heritagewhisper.com" references
- [ ] Consider setting up redirect: dev.heritagewhisper.com → heritagewhisper.com

---

## 6. REFERENCE: FILE MANIFEST

### Files Modified (14 total)

1. `app/api/export/2up/route.ts` - PDF export fallback
2. `app/api/export/trim/route.ts` - PDF export fallback
3. `lib/resend.ts` - Email verification + welcome email links
4. `lib/notifications/send-question-received.ts` - Notification URLs
5. `lib/notifications/send-new-story-notifications.ts` - Notification URLs
6. `app/api/family/invite/route.ts` - Family invite URLs
7. `app/api/family/[memberId]/resend/route.ts` - Resend invite URLs
8. `lib/supabase.ts` - Auth callback fallback
9. `app/api/auth/register/route.ts` - Registration confirmation
10. `app/api/stripe/create-checkout/route.ts` - Payment redirects
11. `app/api/stripe/customer-portal/route.ts` - Portal return URL
12. `next.config.ts` - CORS configuration
13. `app/layout.tsx` - Metadata (optional)
14. `.env.example` - Documentation update

### Files Reviewed (No Changes Needed)

- `lib/ai/gatewayClient.ts` - API key only ✅
- `lib/ratelimit.ts` - Redis URL only ✅
- `app/api/stripe/webhook/route.ts` - No domain references ✅
- `middleware.ts` - No domain references ✅
- All files using `window.location.origin` ✅

---

## 7. COMMON ISSUES & TROUBLESHOOTING

### Issue: "Passkeys not working after migration"
**Symptom:** "The RP ID 'heritagewhisper.com' is invalid for this domain"
**Cause:** `ORIGIN` or `RP_ID` environment variable mismatch
**Fix:**
1. Check Vercel environment variables
2. Ensure `ORIGIN=https://heritagewhisper.com` (no trailing slash)
3. Ensure `RP_ID=heritagewhisper.com` (no protocol)
4. Redeploy to apply changes
5. Clear browser cache
6. Re-register passkey

### Issue: "CORS errors on API calls"
**Symptom:** Console shows "Access-Control-Allow-Origin" errors
**Cause:** next.config.ts CORS header mismatch
**Fix:**
1. Verify `NEXT_PUBLIC_APP_URL=https://heritagewhisper.com` in Vercel
2. Check next.config.ts line 57 has correct fallback
3. Redeploy
4. Hard refresh browser (Cmd+Shift+R / Ctrl+Shift+F5)

### Issue: "PDFs not generating"
**Symptom:** PDF export fails with timeout or error
**Cause:** PDFShift can't reach print URL
**Fix:**
1. Check `NEXT_PUBLIC_SITE_URL=https://heritagewhisper.com` in Vercel
2. Verify heritagewhisper.com is deployed and accessible
3. Test print URL manually: `https://heritagewhisper.com/book/print/2up?printToken=...`
4. Check PDFShift dashboard for error logs

### Issue: "Email links go to dev domain"
**Symptom:** Emails contain dev.heritagewhisper.com links
**Cause:** Env var not set or code not redeployed
**Fix:**
1. Verify `NEXT_PUBLIC_APP_URL` in Vercel
2. Check code changes were committed and deployed
3. Wait 5 minutes for build to complete
4. Test with new email (old emails still have old links)

### Issue: "Stripe webhooks not received"
**Symptom:** Subscription not activating after payment
**Cause:** Webhook endpoint not configured or secret mismatch
**Fix:**
1. Check Stripe Dashboard → Webhooks → verify endpoint exists
2. Verify endpoint URL: `https://heritagewhisper.com/api/stripe/webhook`
3. Copy signing secret → Update `STRIPE_WEBHOOK_SECRET` in Vercel
4. Test webhook delivery in Stripe dashboard
5. Check webhook endpoint logs in Vercel

### Issue: "Resend emails not sending"
**Symptom:** No verification emails received
**Cause:** Domain not verified or sender not authorized
**Fix:**
1. Check Resend Dashboard → Domains → verify status is "Verified"
2. If not verified, check DNS records (SPF, DKIM, DMARC)
3. Wait 5-15 minutes for DNS propagation
4. Verify sender email: `noreply@heritagewhisper.com`
5. Test email from Resend dashboard

---

## 8. SUCCESS CRITERIA

Migration is successful when:

- ✅ All 14 code files updated and deployed
- ✅ 6 environment variables set in Vercel
- ✅ Supabase redirects configured
- ✅ Stripe webhook receiving events
- ✅ Resend domain verified and sending emails
- ✅ PDFs generating successfully
- ✅ Passkeys working (Touch ID/Face ID)
- ✅ No CORS errors in browser console
- ✅ All email links point to heritagewhisper.com
- ✅ Payment flow completes and redirects correctly

**Acceptance Test:** Complete full user journey from registration → story creation → family invite → PDF export → subscription upgrade without any dev.heritagewhisper.com references.

---

## 9. TIMELINE ESTIMATE

| Phase | Duration | Depends On |
|-------|----------|------------|
| Code changes | 30-45 min | Your typing speed |
| Vercel configuration | 10-15 min | DNS propagation (parallel) |
| Third-party services | 20-30 min | DNS propagation (5-60 min) |
| End-to-end testing | 30-45 min | All above complete |
| **Total (sequential)** | **2-3 hours** | DNS can delay by 1-4 hours |
| **Total (optimistic)** | **1.5 hours** | If DNS is instant |

**Recommended Schedule:**
- **Day 1, Morning:** Code changes + Vercel config + DNS setup
- **Day 1, Afternoon:** Third-party services (while DNS propagates)
- **Day 1, Evening:** Testing (after DNS fully propagated)
- **Day 2:** Monitoring + fix any edge cases

---

## 10. APPENDIX

### A. Environment Variable Reference

**Complete list for .env.local (production):**
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tjycibrhoammxohemyhq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
SUPABASE_JWT_SECRET=<your-jwt-secret>

# Domain Configuration
NEXT_PUBLIC_APP_URL=https://heritagewhisper.com
NEXT_PUBLIC_SITE_URL=https://heritagewhisper.com
ORIGIN=https://heritagewhisper.com
RP_ID=heritagewhisper.com
RP_NAME="HeritageWhisper"

# Email (Resend)
RESEND_API_KEY=<your-resend-api-key>
RESEND_FROM_EMAIL=HeritageWhisper <noreply@heritagewhisper.com>

# Stripe
STRIPE_SECRET_KEY=sk_live_<your-live-key>
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_live_<your-live-key>
STRIPE_WEBHOOK_SECRET=whsec_<your-webhook-secret>
STRIPE_PREMIUM_PRICE_ID=price_<your-price-id>

# AI Services
OPENAI_API_KEY=sk-proj-<your-key>
NEXT_PUBLIC_OPENAI_API_KEY=sk-proj-<your-key>  # For Realtime API
AI_GATEWAY_API_KEY=vck_<your-gateway-key>
ASSEMBLYAI_API_KEY=<your-assemblyai-key>

# PDF Export
PDFSHIFT_API_KEY=sk_<your-pdfshift-key>

# Rate Limiting
UPSTASH_REDIS_REST_URL=https://<your-instance>.upstash.io
UPSTASH_REDIS_REST_TOKEN=<your-token>

# Session Security
IRON_SESSION_PASSWORD=<32-byte-base64-secret>
COOKIE_NAME=hw_passkey_session

# Optional
NEXT_PUBLIC_ENABLE_REALTIME=false
NODE_ENV=production
```

### B. DNS Configuration Reference

**For domain registrar (Namecheap, GoDaddy, etc.):**

```
# Apex domain (@)
Type: A
Name: @
Value: 76.76.21.21  # Vercel IP (verify in dashboard)

# WWW subdomain (optional)
Type: CNAME
Name: www
Value: cname.vercel-dns.com

# Resend email authentication
Type: TXT
Name: @
Value: v=spf1 include:_spf.resend.com ~all

Type: TXT
Name: resend._domainkey
Value: <from-resend-dashboard>

Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:postmaster@heritagewhisper.com
```

### C. Test Credentials (Stripe)

**Test credit cards:**
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Authentication required: `4000 0027 6000 3184`

**Test mode:** Use `sk_test_` keys before switching to `sk_live_`

---

**END OF AUDIT**

This completes the comprehensive domain migration audit. All domain-dependent code, environment variables, and external service configurations have been identified with specific actions required.
