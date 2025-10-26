# Production Launch Checklist

**Target Domain:** heritagewhisper.com
**Current Dev URL:** dev.heritagewhisper.com
**Status:** Pre-Launch

---

## 🔐 Authentication & Security

### ✅ Supabase Configuration

- [ ] **Update Site URL**
  - Location: Supabase Dashboard → Project Settings → API
  - Change from: `https://dev.heritagewhisper.com`
  - Change to: `https://heritagewhisper.com`

- [ ] **Update Redirect URLs**
  - Location: Supabase Dashboard → Authentication → URL Configuration
  - Remove dev URLs:
    - `https://dev.heritagewhisper.com/auth/callback`
    - `https://dev.heritagewhisper.com/auth/reset-password`
  - Add production URLs:
    - `https://heritagewhisper.com/auth/callback`
    - `https://heritagewhisper.com/auth/reset-password`
    - `https://www.heritagewhisper.com/auth/callback`
    - `https://www.heritagewhisper.com/auth/reset-password`

- [ ] **Review RLS Policies**
  - Verify all 20+ tables have Row Level Security enabled
  - Test with production user accounts
  - Check multi-tenant access controls work

### ✅ Google OAuth Setup

- [ ] **Create Production OAuth Client**
  - Go to: [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
  - Create new OAuth 2.0 Client ID (Web application)
  - **Authorized JavaScript origins:**
    - `https://heritagewhisper.com`
    - `https://www.heritagewhisper.com`
  - **Authorized redirect URIs:**
    - `https://heritagewhisper.com/auth/callback`
    - `https://www.heritagewhisper.com/auth/callback`
    - `https://tjycibrhoammxohemyhq.supabase.co/auth/v1/callback`
  - Copy Client ID and Client Secret

- [ ] **Configure OAuth in Supabase**
  - Location: Supabase Dashboard → Authentication → Providers → Google
  - Enable Google provider
  - Add production Client ID
  - Add production Client Secret
  - Save changes

- [ ] **OAuth Consent Screen**
  - Set app name: "Heritage Whisper"
  - Set support email
  - Add logo (520x520px)
  - Add privacy policy URL: `https://heritagewhisper.com/privacy`
  - Add terms of service URL: `https://heritagewhisper.com/terms`
  - **Request publishing** (can take 1-6 weeks for Google review)
  - Until published, limit to test users only

### ✅ Email Authentication (Fix "Dangerous" Warning)

**Issue:** Gmail shows "This message might be dangerous" because domain isn't authenticated.

**Solution:** Add DNS records to verify domain ownership and authenticate emails.

#### Step 1: Add Domain in Resend

- [ ] Log in to [Resend Dashboard](https://resend.com/domains)
- [ ] Click "Add Domain"
- [ ] Enter: `heritagewhisper.com`
- [ ] Copy the DNS records provided

#### Step 2: Add DNS Records to Domain Provider

Add these records to your DNS provider (GoDaddy, Namecheap, Cloudflare, etc.):

**SPF Record (TXT):**
```
Name: @
Type: TXT
Value: v=spf1 include:resend.com ~all
```

**DKIM Record (TXT):**
```
Name: resend._domainkey
Type: TXT
Value: [provided by Resend - unique to your domain]
```

**DMARC Record (TXT):**
```
Name: _dmarc
Type: TXT
Value: v=DMARC1; p=none; rua=mailto:postmaster@heritagewhisper.com
```

- [ ] Add SPF record
- [ ] Add DKIM record (copy from Resend)
- [ ] Add DMARC record
- [ ] Wait 24-48 hours for DNS propagation
- [ ] Verify in Resend dashboard (should show green checkmarks)

#### Step 3: Update Email Sender

- [ ] Update `lib/resend.ts`:
  ```typescript
  // Change from:
  from: "Heritage Whisper <noreply@heritagewhisper.com>"

  // To (use custom domain):
  from: "Heritage Whisper <noreply@heritagewhisper.com>"
  ```
- [ ] Update Supabase SMTP sender (Authentication → Email Templates)
  - Change to: `noreply@heritagewhisper.com`

**Result:** Emails will no longer show "dangerous" warning after DNS verification.

---

## 🌐 Domain & Infrastructure

### ✅ Domain Configuration

- [ ] **Purchase Production Domain**
  - Domain: `heritagewhisper.com`
  - Provider: [e.g., GoDaddy, Namecheap, Google Domains]
  - Renewal: Auto-renew enabled

- [ ] **Configure DNS Records**
  - Add Vercel A/CNAME records for main domain
  - Add www subdomain
  - Verify SSL certificate auto-provisioning

- [ ] **SSL/TLS Certificate**
  - Vercel auto-provisions Let's Encrypt certificates
  - Verify HTTPS redirect enabled
  - Test: https://www.ssllabs.com/ssltest/

### ✅ Vercel Configuration

- [ ] **Update Environment Variables**

  **Production-specific variables:**
  ```bash
  # Site URL
  NEXT_PUBLIC_SITE_URL=https://heritagewhisper.com

  # Supabase (same as dev, but verify)
  NEXT_PUBLIC_SUPABASE_URL=https://tjycibrhoammxohemyhq.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
  SUPABASE_SERVICE_ROLE_KEY=eyJ...

  # Database
  DATABASE_URL=postgresql://...

  # OpenAI
  OPENAI_API_KEY=sk-proj-...
  NEXT_PUBLIC_OPENAI_API_KEY=sk-...  # For WebRTC

  # AssemblyAI
  ASSEMBLYAI_API_KEY=...

  # Vercel AI Gateway
  AI_GATEWAY_API_KEY=vck_...

  # Upstash Redis
  UPSTASH_REDIS_REST_URL=https://...
  UPSTASH_REDIS_REST_TOKEN=...

  # PDFShift
  PDFSHIFT_API_KEY=sk_...

  # Resend (verify production key)
  RESEND_API_KEY=re_...

  # Session Secret (GENERATE NEW FOR PRODUCTION)
  SESSION_SECRET=[generate new 32+ character random string]

  # Feature Flags
  NEXT_PUBLIC_ENABLE_REALTIME=true
  ```

- [ ] **Generate New SESSION_SECRET**
  ```bash
  # Run this to generate secure random string:
  openssl rand -base64 32
  ```

- [ ] **Custom Domain Setup**
  - Location: Vercel Dashboard → Project → Settings → Domains
  - Add: `heritagewhisper.com`
  - Add: `www.heritagewhisper.com`
  - Set primary domain (redirect www → non-www or vice versa)

- [ ] **Remove Development Domain**
  - Consider keeping `dev.heritagewhisper.com` for staging
  - Or remove after launch

---

## 💳 Payment Processing

### ✅ Stripe Configuration

- [ ] **Switch to Live Keys**
  - Location: [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
  - Toggle "View test data" OFF
  - Copy production keys:
    - `NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_live_...`
    - `STRIPE_SECRET_KEY=sk_live_...`
  - Update in Vercel environment variables

- [ ] **Webhook Configuration**
  - Create production webhook endpoint
  - URL: `https://heritagewhisper.com/api/webhooks/stripe`
  - Events to listen to:
    - `checkout.session.completed`
    - `customer.subscription.updated`
    - `customer.subscription.deleted`
  - Copy webhook secret → Update `STRIPE_WEBHOOK_SECRET` in Vercel

- [ ] **Test Payment Flow**
  - Create test transaction in production
  - Verify webhook triggers
  - Check database updates

---

## 📊 Monitoring & Analytics

### ✅ Error Monitoring

- [ ] **Set up Sentry (Recommended)**
  - Sign up: https://sentry.io
  - Create project for Next.js
  - Add to `package.json`:
    ```bash
    npm install @sentry/nextjs
    npx @sentry/wizard@latest -i nextjs
    ```
  - Add `SENTRY_DSN` to Vercel

- [ ] **Vercel Error Tracking**
  - Enabled by default
  - Review Runtime Logs regularly
  - Set up email alerts for errors

### ✅ Analytics

- [ ] **Google Analytics 4**
  - Create GA4 property
  - Add tracking ID to environment variables
  - Verify tracking works

- [ ] **Vercel Analytics** (Included)
  - Enable in Vercel Dashboard
  - No setup required
  - Monitor Web Vitals

---

## 🔒 Security Review

### ✅ Security Headers

- [ ] Verify CSP, HSTS, X-Frame-Options in `next.config.js`
- [ ] Test: https://securityheaders.com

### ✅ Rate Limiting

- [ ] Verify Upstash Redis is configured
- [ ] Test rate limits on production domain:
  - Auth endpoints: 5 requests/10 seconds
  - Upload endpoints: 10 requests/minute
  - API endpoints: 30 requests/minute

### ✅ API Keys Security

- [ ] Remove any API keys from client-side code
- [ ] Verify `.env.local` is in `.gitignore`
- [ ] Rotate any keys that were accidentally committed

### ✅ CORS Configuration

- [ ] Review allowed origins in API routes
- [ ] Ensure only production domain is allowed

---

## 📄 Legal & Compliance

### ✅ Required Pages

- [ ] **Privacy Policy**
  - URL: `/privacy`
  - Last updated date
  - GDPR compliant
  - Data collection disclosure
  - Cookie policy

- [ ] **Terms of Service**
  - URL: `/terms`
  - Last updated date
  - User responsibilities
  - Service limitations
  - Refund policy

- [ ] **Cookie Consent Banner**
  - Implement if using analytics
  - Allow opt-out

### ✅ GDPR Compliance

- [ ] Data export functionality (already implemented: `/api/user/export`)
- [ ] Account deletion (already implemented: `/api/user/delete`)
- [ ] Privacy policy linked in footer
- [ ] Email unsubscribe links

---

## 🧪 Testing

### ✅ Production Testing Checklist

- [ ] **Authentication Flow**
  - Sign up with email
  - Email verification works
  - Password reset works
  - Google OAuth works
  - Logout works

- [ ] **Core Features**
  - Record audio story
  - Upload photos
  - Edit story
  - Delete story
  - Timeline view loads
  - Book view loads
  - Memory Box loads

- [ ] **AI Features**
  - Transcription works (AssemblyAI)
  - Lesson extraction works
  - Prompt generation works
  - Pearl interviewer works (if enabled)

- [ ] **PDF Export**
  - 2-up format downloads
  - Trim format downloads
  - Images render correctly
  - No watermarks

- [ ] **Family Sharing**
  - Invite family member
  - Verification email works
  - Account switching works
  - Permissions enforced

- [ ] **Mobile Responsive**
  - Test on iPhone
  - Test on Android
  - Test on tablet

- [ ] **Cross-Browser**
  - Chrome
  - Safari
  - Firefox
  - Edge

### ✅ Performance Testing

- [ ] **Lighthouse Audit**
  - Run on production URL
  - Target scores:
    - Performance: 90+
    - Accessibility: 95+
    - Best Practices: 95+
    - SEO: 95+

- [ ] **Load Testing**
  - Test with 50+ stories
  - Test with 100+ photos
  - Verify database queries are optimized

---

## 📦 Database

### ✅ Backup Strategy

- [ ] **Supabase Automatic Backups**
  - Verify daily backups enabled
  - Location: Supabase Dashboard → Database → Backups
  - Test restore procedure

- [ ] **Migration Tracking**
  - Ensure all migrations are committed to repo
  - Document any manual database changes

### ✅ Database Performance

- [ ] Review slow query logs
- [ ] Verify all 50+ indexes are in place
- [ ] Check connection pooling settings

---

## 🚀 Launch Day

### ✅ Pre-Launch (24 hours before)

- [ ] **Final Code Freeze**
  - Merge all pending PRs
  - Run full test suite
  - Create release tag: `v1.0.0`

- [ ] **Database Backup**
  - Manual backup before launch
  - Store backup file securely

- [ ] **Vercel Deployment**
  - Deploy to production
  - Verify build succeeds
  - Test deployment on staging URL first

### ✅ Launch (Go Live)

- [ ] **DNS Cutover**
  - Update DNS records to point to production
  - Wait for propagation (15-60 minutes)
  - Test new domain immediately

- [ ] **SSL Verification**
  - Verify HTTPS works
  - Check SSL certificate
  - Test www redirect

- [ ] **Smoke Tests**
  - Run through critical user flows
  - Monitor error logs in real-time
  - Check API rate limits working

### ✅ Post-Launch (First 24 hours)

- [ ] **Monitor Closely**
  - Check Vercel Runtime Logs every hour
  - Monitor Sentry for errors
  - Watch Stripe dashboard for payments

- [ ] **User Communication**
  - Send launch announcement email
  - Post on social media
  - Monitor support channels

- [ ] **Performance Check**
  - Monitor response times
  - Check database load
  - Verify CDN caching working

---

## 📞 Emergency Contacts

### Services

- **Vercel Support**: via dashboard
- **Supabase Support**: support@supabase.io
- **Resend Support**: support@resend.com
- **Stripe Support**: https://support.stripe.com
- **PDFShift Support**: support@pdfshift.io

### Rollback Plan

If critical issues arise:

1. **Immediate**: Revert to previous Vercel deployment
   - Vercel Dashboard → Deployments → [Previous] → "Promote to Production"

2. **DNS**: Point domain back to dev server temporarily
   - Keep dev.heritagewhisper.com running as backup

3. **Database**: Restore from backup if needed
   - Supabase Dashboard → Database → Backups → Restore

---

## ✅ Success Criteria

Launch is successful when:

- ✅ Domain resolves to production site (HTTPS)
- ✅ All authentication methods work
- ✅ Users can create and view stories
- ✅ AI features working (transcription, lessons, prompts)
- ✅ PDF export working
- ✅ Family sharing working
- ✅ Payment processing working (if applicable)
- ✅ Emails arrive without "dangerous" warning
- ✅ No critical errors in logs
- ✅ Lighthouse scores meet targets
- ✅ Mobile experience is smooth
- ✅ SSL certificate valid

---

## 📝 Notes

### Estimated Timeline

- **DNS Changes**: 15-60 minutes
- **SSL Certificate Provisioning**: 5-15 minutes
- **Email DNS Verification**: 24-48 hours
- **Google OAuth Review**: 1-6 weeks (can launch with test users while pending)

### Maintenance Windows

- **Best time to launch**: Tuesday-Thursday, 10am-2pm PST
- **Avoid**: Friday evenings, weekends, holidays

### Cost Estimates (Monthly)

- Vercel: $20/month (Pro plan)
- Supabase: $25/month (Pro plan)
- OpenAI API: ~$50-200 (usage-based)
- AssemblyAI: ~$30-100 (usage-based)
- PDFShift: $15/month (500 exports)
- Resend: $20/month (50k emails)
- Upstash Redis: $10/month
- **Total**: ~$170-400/month

---

**Created**: January 25, 2025
**Last Updated**: January 25, 2025
**Owner**: Paul
**Status**: 🚧 Pre-Launch

---

## Quick Reference

**Current State:**
- ✅ Password reset working (Supabase redirect URLs added)
- ⚠️ Emails showing "dangerous" warning (needs DNS records)
- ⚠️ Using dev.heritagewhisper.com
- ⚠️ Google OAuth in test mode

**Next Actions:**
1. Add email DNS records (SPF, DKIM, DMARC)
2. Set up production Google OAuth
3. Update Supabase URLs
4. Deploy to production domain
