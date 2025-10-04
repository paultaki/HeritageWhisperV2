# Terms of Service & Privacy Policy Acceptance Tracking

## Overview
This document describes the implementation of Terms of Service and Privacy Policy acceptance tracking for HeritageWhisper V2.

## Database Schema

### Table: `user_agreements`
Tracks detailed history of all legal document acceptances.

```sql
CREATE TABLE user_agreements (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  agreement_type TEXT CHECK (agreement_type IN ('terms', 'privacy')),
  version TEXT NOT NULL,
  accepted_at TIMESTAMP NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  method TEXT CHECK (method IN ('signup', 'reacceptance', 'oauth'))
);
```

### Table: `users` (Updated)
Added quick-lookup fields for latest accepted versions:
- `latest_terms_version TEXT` - Most recent Terms version accepted
- `latest_privacy_version TEXT` - Most recent Privacy version accepted

## API Endpoints

### POST `/api/agreements/accept`
Records user acceptance of a legal document.

**Headers:**
- `Authorization: Bearer <token>` (required)

**Body:**
```json
{
  "agreementType": "terms" | "privacy",
  "version": "1.0",
  "method": "signup" | "reacceptance" | "oauth"
}
```

**Response:**
```json
{
  "success": true,
  "agreement": {
    "id": "uuid",
    "userId": "uuid",
    "agreementType": "terms",
    "version": "1.0",
    "acceptedAt": "2025-01-04T...",
    "method": "signup"
  }
}
```

### GET `/api/agreements/status`
Checks if user has accepted current versions.

**Headers:**
- `Authorization: Bearer <token>` (required)

**Response:**
```json
{
  "currentVersions": {
    "terms": "1.0",
    "privacy": "1.0"
  },
  "userVersions": {
    "terms": "1.0",
    "privacy": "1.0"
  },
  "needsAcceptance": {
    "terms": false,
    "privacy": false,
    "any": false
  },
  "isCompliant": true
}
```

## Frontend Components

### `AgreementGuard` Component
Wraps the entire app in `app/layout.tsx` to check compliance on every page load.

**Features:**
- Automatically checks agreement status when user logs in
- Shows modal if user needs to accept updated versions
- Exempts auth and legal pages from blocking
- Blocks access to app until agreements are accepted

**Exempt Paths:**
- `/`, `/auth/*`, `/terms`, `/privacy`

### `AgreementModal` Component
Modal dialog shown when user needs to accept updated legal documents.

**Features:**
- Shows which documents need acceptance
- Links to view Terms and Privacy Policy
- Requires explicit checkbox acceptance
- Calls API to record acceptance
- Reloads page after successful acceptance

### `useAgreementCheck` Hook
Custom React hook for checking agreement status.

**Returns:**
```typescript
{
  needsTerms: boolean;
  needsPrivacy: boolean;
  needsAny: boolean;
  termsVersion: string;
  privacyVersion: string;
  isCompliant: boolean;
  loading: boolean;
}
```

## Registration Flow

When a user registers:

1. User fills out registration form
2. User checks "I agree to Terms and Privacy Policy" checkbox
3. Registration button is disabled until checkbox is checked
4. On submit:
   - Supabase creates auth user
   - Two agreement records are created (terms + privacy)
   - User record is updated with latest versions
   - IP address and user agent are recorded
   - Method is set to "signup"

## Re-acceptance Flow

When documents are updated:

1. Update `CURRENT_TERMS_VERSION` or `CURRENT_PRIVACY_VERSION` in:
   - `/app/api/agreements/accept/route.ts`
   - `/app/api/agreements/status/route.ts`

2. On next login/page load:
   - `AgreementGuard` checks user's status
   - If versions don't match, `AgreementModal` appears
   - User must review and accept before continuing
   - New agreement records are created with method="reacceptance"
   - User record is updated with new versions

## Version Management

**Current Versions:**
- Terms of Service: `1.0`
- Privacy Policy: `1.0`

**To Update Versions:**

1. Update the document in `/app/terms/page.tsx` or `/app/privacy/page.tsx`
2. Update the "Last Updated" date
3. Change version constant in both API files:
   ```typescript
   // In /app/api/agreements/accept/route.ts
   // In /app/api/agreements/status/route.ts
   export const CURRENT_TERMS_VERSION = "1.1"; // or "2.0" for major changes
   export const CURRENT_PRIVACY_VERSION = "1.1";
   ```

## Migration Instructions

### 1. Run Database Migration

```bash
# Connect to your Supabase/Neon database
psql <DATABASE_URL>

# Run the migration
\i migrations/0001_add_user_agreements.sql
```

### 2. Verify Tables Created

```sql
-- Check user_agreements table exists
SELECT * FROM user_agreements LIMIT 1;

-- Check users table has new columns
SELECT latest_terms_version, latest_privacy_version FROM users LIMIT 1;
```

### 3. Test the Flow

1. **New User Registration:**
   - Register a new account
   - Verify `user_agreements` has 2 records (terms + privacy)
   - Verify `users` table has versions populated

2. **Re-acceptance Flow:**
   - Change `CURRENT_TERMS_VERSION` to "1.1"
   - Login as existing user
   - Verify modal appears
   - Accept the terms
   - Verify new agreement record created
   - Verify `users.latest_terms_version` updated to "1.1"

## Security Features

1. **IP Address Tracking**: Records IP for audit trail
2. **User Agent Tracking**: Records browser/device for forensics
3. **Timestamp Tracking**: Exact time of acceptance
4. **Version History**: Complete audit log of all acceptances
5. **Method Tracking**: Distinguishes signup vs re-acceptance
6. **Blocking Access**: Users cannot use app until compliant

## Compliance Notes

### GDPR Compliance
- ✅ Users must explicitly accept (checkbox, not pre-checked)
- ✅ Links to view full documents before accepting
- ✅ Complete audit trail of all acceptances
- ✅ Version history maintained
- ✅ Can prove acceptance at any point in time

### CCPA Compliance
- ✅ Privacy Policy clearly accessible
- ✅ Explicit consent before data processing
- ✅ Audit trail for compliance reporting

### Best Practices
- ✅ Cannot bypass agreement (blocked modal)
- ✅ Semantic versioning for document changes
- ✅ Re-acceptance required for updates
- ✅ IP and user agent for dispute resolution
- ✅ Method tracking (signup vs update)

## File Structure

```
HeritageWhisperV2/
├── app/
│   ├── api/
│   │   ├── agreements/
│   │   │   ├── accept/route.ts       # Record acceptance
│   │   │   └── status/route.ts       # Check compliance
│   │   └── auth/
│   │       └── register/route.ts     # Updated with agreement recording
│   ├── layout.tsx                    # Includes AgreementGuard
│   ├── privacy/page.tsx              # Privacy Policy page
│   └── terms/page.tsx                # Terms of Service page
├── components/
│   ├── AgreementGuard.tsx            # Compliance checker wrapper
│   └── AgreementModal.tsx            # Re-acceptance modal
├── hooks/
│   └── use-agreement-check.tsx       # Status checking hook
├── migrations/
│   └── 0001_add_user_agreements.sql  # Database migration
└── shared/
    └── schema.ts                     # Updated Drizzle schema
```

## Future Enhancements

### Email Notifications
```typescript
// When sending welcome email:
await sendEmail({
  to: user.email,
  subject: "Welcome to HeritageWhisper",
  body: `
    Thank you for accepting our Terms of Service (v${CURRENT_TERMS_VERSION})
    and Privacy Policy (v${CURRENT_PRIVACY_VERSION}).

    Accepted on: ${new Date().toLocaleDateString()}
  `
});
```

### Admin Dashboard
- View all users' compliance status
- See which users need to re-accept
- Export acceptance records for audits
- Version adoption metrics

### Cookie Consent Integration
```typescript
// Could extend to track cookie preferences
export const cookiePreferences = pgTable("cookie_preferences", {
  userId: uuid("user_id").references(() => users.id),
  analytics: boolean("analytics").default(false),
  marketing: boolean("marketing").default(false),
  acceptedAt: timestamp("accepted_at"),
});
```

## Troubleshooting

### Users Not Seeing Modal
1. Check if path is in `EXEMPT_PATHS` array
2. Verify user is logged in (`useAuth().user`)
3. Check browser console for errors
4. Verify API endpoints are returning correct status

### Agreements Not Recording
1. Check database connection
2. Verify Supabase service role key is set
3. Check API logs for errors
4. Ensure auth token is valid

### Migration Errors
1. Verify database has `gen_random_uuid()` extension
2. Check for existing table conflicts
3. Ensure user has CREATE TABLE permissions
4. Verify foreign key constraints

## Contact
For questions about this implementation, contact the development team or refer to the HeritageWhisper documentation.

---
**Implementation Date:** January 4, 2025
**Last Updated:** January 4, 2025
**Version:** 1.0
