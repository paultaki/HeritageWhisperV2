# Beta Code System Documentation

## Overview

The HeritageWhisper beta code system provides a private invite-only beta launch mechanism. Users must enter a valid beta code during signup to create an account. Each new user automatically receives 5 invite codes to share with others.

## Features

- ✅ Single-use invite codes
- ✅ Automatic code generation for new users (5 codes each)
- ✅ Toggle beta requirement via environment variable
- ✅ Admin dashboard for code management
- ✅ Code expiration support
- ✅ Code revocation
- ✅ User invite code listing page
- ✅ CLI seeding script for initial codes

## Configuration

### Environment Variables

Add these to your `.env.local` file:

```bash
# Enable/disable beta code requirement
NEXT_PUBLIC_REQUIRE_BETA_CODE=true

# Admin email whitelist (comma-separated)
ADMIN_EMAILS=your-email@example.com
NEXT_PUBLIC_ADMIN_EMAILS=your-email@example.com
```

### Database Migration

Run the migration to create the `beta_codes` table:

```bash
# Apply the migration in Supabase dashboard
# File: migrations/0044_add_beta_codes.sql
```

Or run via Supabase CLI:
```bash
supabase db push
```

## Usage

### 1. Initial Setup

#### Generate Initial Beta Codes

Use the CLI script to generate your first batch of codes:

```bash
# Generate 50 codes
npx tsx scripts/seed-beta-codes.ts --count=50

# Generate codes with expiry date
npx tsx scripts/seed-beta-codes.ts --count=100 --expires=2025-12-31
```

The script will output all generated codes which you can distribute to your initial beta testers.

### 2. User Signup Flow

When `NEXT_PUBLIC_REQUIRE_BETA_CODE=true`:

1. User visits `/auth/register`
2. Form includes "Beta Access Code" field
3. User enters their code (e.g., `AB4K7Z2Q`)
4. Code is validated server-side
5. If valid:
   - User account is created
   - Code is marked as used
   - User receives 5 new invite codes automatically

When `NEXT_PUBLIC_REQUIRE_BETA_CODE=false`:
- Beta code field is hidden
- Signup works normally without any code requirement

### 3. User Invite Codes

Users can view and share their invite codes:

1. Navigate to `/app/invites` (or add a link in your app's navigation)
2. See list of all codes issued to them
3. Copy unused codes to clipboard
4. Share codes with friends and family

Code statuses:
- **Unused**: Available to share (green)
- **Used**: Already redeemed (with date)
- **Expired**: Past expiry date
- **Revoked**: Manually disabled by admin

### 4. Admin Dashboard

Access the admin beta dashboard at `/admin/beta` (requires admin email).

#### Features:

**Metrics Overview:**
- Total codes created
- Unused codes available
- Codes used
- Codes revoked
- Signups in last 7 days
- Signups in last 30 days

**Generate Generic Codes:**
- Create codes not assigned to any user
- Set optional expiry date
- Copy all codes at once for distribution

**Generate Codes for Specific User:**
- Enter user email
- Specify number of codes
- Set optional expiry date
- Useful for giving power users extra invites

**Search & Filter:**
- Search by code or email
- Filter by status: All | Unused | Used | Revoked | Expired

**Code Management:**
- View all codes with details
- Copy individual codes
- Revoke codes (prevents future use)

## API Reference

### Registration with Beta Code

**POST** `/api/auth/register`

```json
{
  "email": "user@example.com",
  "password": "secure-password",
  "name": "John Doe",
  "birthYear": 1985,
  "betaCode": "AB4K7Z2Q"
}
```

Response (success):
```json
{
  "user": { "id": "...", "email": "...", ... },
  "session": { "access_token": "...", ... }
}
```

Response (invalid code):
```json
{
  "error": "Invalid beta access code"
}
```

### Admin API Routes

All admin routes require authentication and admin email authorization.

#### Generate Generic Codes

**POST** `/api/admin/beta/generate`

```json
{
  "count": 10,
  "expiresAt": "2025-12-31"  // optional
}
```

#### Generate Codes for User

**POST** `/api/admin/beta/generate-for-user`

```json
{
  "email": "user@example.com",
  "count": 5,
  "expiresAt": "2025-12-31"  // optional
}
```

#### Revoke Code

**POST** `/api/admin/beta/revoke`

```json
{
  "codeId": "uuid-here"
}
```

## Database Schema

### `beta_codes` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `code` | text | 8-character code (unique) |
| `issued_to_user_id` | uuid | User who received the code (nullable for generic codes) |
| `used_by_user_id` | uuid | User who used the code (nullable until used) |
| `created_at` | timestamptz | When the code was created |
| `used_at` | timestamptz | When the code was used |
| `expires_at` | timestamptz | Optional expiration date |
| `revoked` | boolean | Whether admin has revoked the code |

**Indexes:**
- `code` (unique)
- `issued_to_user_id`
- `used_by_user_id`
- `used_at`

## Security

### Code Generation

- Uses cryptographically secure random generation (`crypto.getRandomValues`)
- Safe character set excludes confusing characters (0/O, I/1)
- 8 characters = ~2.8 trillion possible combinations
- Codes are normalized to uppercase

### Validation

Server-side validation checks:
1. Code exists in database
2. Code is not already used
3. Code is not revoked
4. Code is not expired (if expiry date set)

### Admin Protection

- Admin routes check email against `ADMIN_EMAILS` whitelist
- Client-side and server-side protection
- Non-admins are redirected away from admin area

## Testing

### Enable Beta Mode

```bash
# .env.local
NEXT_PUBLIC_REQUIRE_BETA_CODE=true
```

1. Generate test codes: `npx tsx scripts/seed-beta-codes.ts --count=5`
2. Copy one of the generated codes
3. Visit `/auth/register`
4. Attempt signup without code → should fail
5. Attempt signup with invalid code → should fail
6. Signup with valid code → should succeed
7. Check user's invite codes at `/app/invites` → should see 5 codes

### Disable Beta Mode

```bash
# .env.local
NEXT_PUBLIC_REQUIRE_BETA_CODE=false
```

1. Visit `/auth/register`
2. Beta code field should be hidden
3. Signup works normally

### Admin Dashboard

1. Set `ADMIN_EMAILS` to your email in `.env.local`
2. Visit `/admin/beta`
3. Test code generation, search, and revocation features

## Troubleshooting

### "Beta access code is required" error

- Check `NEXT_PUBLIC_REQUIRE_BETA_CODE` is set correctly
- Restart development server after changing env vars
- Ensure beta code field has a value

### "Invalid beta access code" error

- Code may already be used
- Code may be revoked
- Code may be expired
- Check admin dashboard for code status

### Admin area shows "Access Denied"

- Verify your email is in `ADMIN_EMAILS` and `NEXT_PUBLIC_ADMIN_EMAILS`
- Restart development server
- Check that email matches exactly (case-insensitive)

### Codes not generating

- Check Supabase connection
- Verify migration ran successfully
- Check server logs for errors
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is set

## Best Practices

### Initial Launch

1. Generate 50-100 codes initially
2. Distribute to your core beta testers
3. Monitor usage in admin dashboard
4. Generate more as needed

### Viral Growth

- Each user gets 5 codes automatically
- Encourage users to invite friends
- Monitor viral coefficient in admin metrics
- Adjust codes-per-user if needed (edit `createInviteCodesForUser` count)

### Expiry Dates

- Use expiry for time-limited beta waves
- Example: "Wave 1" expires after 30 days
- Generates urgency and exclusivity

### Revocation

- Revoke codes if leaked publicly
- Revoke codes for policy violations
- Revoked codes cannot be used

## Future Enhancements

Potential improvements:

- [ ] Email notifications when someone uses your code
- [ ] Analytics: viral coefficient, referral chains
- [ ] Tiered codes (standard vs VIP)
- [ ] Customizable codes-per-user count
- [ ] Bulk code operations
- [ ] CSV export of codes
- [ ] Webhook integration

## Support

For questions or issues:
1. Check this documentation
2. Review server logs
3. Check Supabase dashboard
4. Contact development team

---

**Version:** 1.0  
**Last Updated:** 2025-01-15
