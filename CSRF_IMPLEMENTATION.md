# CSRF Protection Implementation Guide

## Overview

HeritageWhisper now has comprehensive CSRF (Cross-Site Request Forgery) protection implemented at the API layer. All state-changing requests (POST, PUT, PATCH, DELETE) require a valid CSRF token.

## How It Works

1. **Token Generation**: Backend generates a cryptographically secure token (32 bytes, base64-encoded)
2. **Cookie Storage**: Token stored in httpOnly cookie (`csrf-token`, SameSite=Strict)
3. **Header Validation**: Frontend must include token in `X-CSRF-Token` header for mutations
4. **Constant-Time Validation**: Backend validates using timing-safe comparison to prevent timing attacks

## Backend Implementation (✅ Complete)

### Files Created

- `/lib/csrf.ts` - Token generation, validation, and middleware
- `/middleware.ts` - Next.js middleware applying CSRF protection to all API routes
- `/app/api/csrf/route.ts` - Endpoint to fetch CSRF tokens

### Configuration

- **Cookie Name**: `csrf-token`
- **Header Name**: `X-CSRF-Token`
- **Token Lifespan**: 7 days
- **Protected Methods**: POST, PUT, PATCH, DELETE
- **Skip Paths**: `/api/auth/callback`, `/api/webhooks/*`

### Security Features

- ✅ HttpOnly cookies (prevents XSS token theft)
- ✅ SameSite=Strict (prevents cross-site requests)
- ✅ Secure flag in production (HTTPS only)
- ✅ Constant-time comparison (prevents timing attacks)
- ✅ Cryptographically secure random tokens

## Frontend Implementation (TODO)

### Step 1: Create CSRF Hook

Create `/hooks/use-csrf.ts`:

```typescript
import { useEffect, useState } from 'react';
import { logger } from '@/lib/logger';

let cachedToken: string | null = null;

export function useCSRFToken() {
  const [token, setToken] = useState<string | null>(cachedToken);
  const [loading, setLoading] = useState(!cachedToken);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // If we already have a cached token, use it
    if (cachedToken) {
      setToken(cachedToken);
      setLoading(false);
      return;
    }

    // Fetch CSRF token from API
    const fetchToken = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/csrf');

        if (!response.ok) {
          throw new Error('Failed to fetch CSRF token');
        }

        const data = await response.json();
        cachedToken = data.token;
        setToken(data.token);
        setError(null);

        logger.debug('[CSRF] Token fetched successfully');
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        logger.error('[CSRF] Failed to fetch token:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchToken();
  }, []);

  // Function to refresh token (call when token expires or 403 received)
  const refreshToken = async () => {
    cachedToken = null;
    setLoading(true);

    try {
      const response = await fetch('/api/csrf');
      if (!response.ok) {
        throw new Error('Failed to refresh CSRF token');
      }

      const data = await response.json();
      cachedToken = data.token;
      setToken(data.token);
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      logger.error('[CSRF] Failed to refresh token:', error);
    } finally {
      setLoading(false);
    }
  };

  return { token, loading, error, refreshToken };
}
```

### Step 2: Update Supabase Client

Update `/lib/supabase.ts` to include CSRF token in headers:

```typescript
import { createBrowserClient } from '@supabase/ssr';
import { useCSRFToken } from '@/hooks/use-csrf';

// Global CSRF token storage
let globalCSRFToken: string | null = null;

export function setGlobalCSRFToken(token: string) {
  globalCSRFToken = token;
}

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: () => {
          const headers: Record<string, string> = {};

          // Add CSRF token to all state-changing requests
          if (globalCSRFToken) {
            headers['X-CSRF-Token'] = globalCSRFToken;
          }

          return headers;
        },
      },
    }
  );
}
```

### Step 3: Initialize CSRF in Root Layout

Update `/app/layout.tsx`:

```typescript
'use client';

import { useCSRFToken } from '@/hooks/use-csrf';
import { setGlobalCSRFToken } from '@/lib/supabase';
import { useEffect } from 'react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { token, error } = useCSRFToken();

  useEffect(() => {
    if (token) {
      setGlobalCSRFToken(token);
    }
  }, [token]);

  if (error) {
    console.error('Failed to initialize CSRF protection:', error);
  }

  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

### Step 4: Update API Calls

For custom fetch calls, include the CSRF token:

```typescript
import { useCSRFToken } from '@/hooks/use-csrf';

function MyComponent() {
  const { token } = useCSRFToken();

  const handleSubmit = async () => {
    const response = await fetch('/api/stories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': token || '', // Include CSRF token
      },
      body: JSON.stringify({ title: 'My Story' }),
    });

    // Handle 403 CSRF error
    if (response.status === 403) {
      const data = await response.json();
      if (data.error === 'Invalid CSRF token') {
        // Token expired - refresh and retry
        const { refreshToken } = useCSRFToken();
        await refreshToken();
        // Retry the request...
      }
    }
  };

  return <button onClick={handleSubmit}>Submit</button>;
}
```

## Testing

### Manual Testing

1. **Verify Token Generation**:
   ```bash
   curl http://localhost:3002/api/csrf
   # Should return: {"token":"...","expiresIn":604800}
   ```

2. **Test Protected Endpoint Without Token**:
   ```bash
   curl -X POST http://localhost:3002/api/stories \
     -H "Content-Type: application/json" \
     -d '{"title":"Test"}'
   # Should return: 403 Forbidden
   ```

3. **Test Protected Endpoint With Token**:
   ```bash
   # First get token
   TOKEN=$(curl -c cookies.txt http://localhost:3002/api/csrf | jq -r '.token')

   # Then use it
   curl -X POST http://localhost:3002/api/stories \
     -b cookies.txt \
     -H "Content-Type: application/json" \
     -H "X-CSRF-Token: $TOKEN" \
     -H "Authorization: Bearer YOUR_JWT" \
     -d '{"title":"Test"}'
   # Should succeed (200 or 201)
   ```

### Automated Testing

Add tests in `/tests/csrf.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { POST } from '@/app/api/stories/route';

describe('CSRF Protection', () => {
  it('should reject POST requests without CSRF token', async () => {
    const request = new Request('http://localhost:3002/api/stories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title: 'Test' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(403);
  });

  it('should accept POST requests with valid CSRF token', async () => {
    // Generate token
    const tokenResponse = await fetch('http://localhost:3002/api/csrf');
    const { token } = await tokenResponse.json();

    // Use token in protected request
    const request = new Request('http://localhost:3002/api/stories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': token,
        'Authorization': 'Bearer valid_jwt',
      },
      body: JSON.stringify({ title: 'Test' }),
    });

    const response = await POST(request);
    expect(response.status).not.toBe(403);
  });
});
```

## Error Handling

### Common Errors

**403 Forbidden - Invalid CSRF Token**
- **Cause**: Token missing, expired, or mismatched
- **Solution**: Call `refreshToken()` and retry the request

**500 Internal Server Error**
- **Cause**: Token generation failed
- **Solution**: Check server logs for crypto/cookie errors

### User-Facing Error Messages

```typescript
if (response.status === 403) {
  const data = await response.json();

  if (data.error === 'Invalid CSRF token') {
    // Show friendly message
    toast.error('Your session expired. Refreshing...');
    await refreshToken();
    // Retry automatically
  }
}
```

## Security Considerations

### ✅ Implemented Protections

1. **HttpOnly Cookies**: Prevents JavaScript access to token (XSS mitigation)
2. **SameSite=Strict**: Blocks cross-site requests entirely
3. **Secure Flag**: HTTPS-only transmission in production
4. **Constant-Time Comparison**: Prevents timing attacks
5. **Strong Randomness**: 32-byte cryptographic random tokens

### 🚨 Important Notes

- **Never expose tokens in URLs** - Use headers only
- **Never log tokens** - Security/logging infrastructure redacts them
- **Refresh on 403** - Token expiry should trigger silent refresh
- **Combine with auth** - CSRF is NOT a replacement for authentication

## Migration Checklist

- [ ] Create `/hooks/use-csrf.ts` hook
- [ ] Update Supabase client configuration
- [ ] Initialize CSRF in root layout
- [ ] Update all mutation hooks (useCreateStory, useUpdateStory, etc.)
- [ ] Add CSRF token to custom fetch calls
- [ ] Add error handling for 403 CSRF errors
- [ ] Test all protected endpoints
- [ ] Add automated tests for CSRF protection
- [ ] Update deployment docs with environment variables
- [ ] Monitor 403 errors in production logs

## Rollback Plan

If issues arise, you can temporarily disable CSRF protection:

1. **Disable Middleware**:
   ```typescript
   // /middleware.ts
   export async function middleware(request: NextRequest) {
     // TEMPORARY: CSRF protection disabled
     return NextResponse.next();
   }
   ```

2. **Monitor**: Check for CSRF-related 403 errors in logs
3. **Investigate**: Review token generation, cookie settings, header inclusion
4. **Re-enable**: Once issues resolved, remove the temporary bypass

## Support

For questions or issues:
- Check server logs for detailed error messages
- Review browser DevTools Network tab for request headers
- Check cookie storage in Application tab
- Consult `/lib/csrf.ts` for implementation details

---

**Last Updated**: October 2025
**Status**: Backend Complete ✅ | Frontend Pending ⏳
