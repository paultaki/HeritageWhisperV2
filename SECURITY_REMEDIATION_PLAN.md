# Security Remediation Plan - HeritageWhisperV2
**Generated:** 2025-10-15
**Priority:** Critical & High Severity Issues
**Estimated Implementation Time:** 8-12 hours

---

## Table of Contents
1. [CRITICAL-001: Admin Authorization Missing](#critical-001)
2. [CRITICAL-002: Rate Limiting Disabled by Default](#critical-002)
3. [HIGH-001: Family Sharing User ID Validation](#high-001)
4. [HIGH-002: Row Level Security (RLS) Implementation](#high-002)
5. [HIGH-003: Family Session Security](#high-003)
6. [HIGH-004: Share Token Security](#high-004)
7. [HIGH-005: RPC Function Security Audit](#high-005)
8. [HIGH-006: AI Operations Rate Limiting](#high-006)
9. [Deployment Strategy](#deployment-strategy)
10. [Testing Checklist](#testing-checklist)

---

## <a id="critical-001"></a>CRITICAL-001: Admin Authorization Missing

### Severity: CRITICAL
**Risk:** Any authenticated user can access admin endpoints to delete accounts, manipulate prompts, and view sensitive data.

### Current State
```typescript
// app/api/admin/test-accounts/route.ts
const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

if (error || !user) {
  return NextResponse.json({ error: "Invalid authentication" }, { status: 401 });
}

// No role check here! Anyone authenticated can proceed.
```

### Root Cause Analysis
- No `role` field in users table
- No middleware to check admin status
- Admin routes only verify authentication, not authorization

### Solution: Role-Based Access Control (RBAC)

#### Step 1: Database Migration
**File:** `/migrations/0006_add_user_roles.sql`

```sql
-- Migration: Add Role-Based Access Control
-- Created: 2025-10-15
-- Description: Add user roles for admin authorization

-- Add role column to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'
CHECK (role IN ('user', 'admin', 'moderator'));

-- Create index for efficient role lookups
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- Add role to existing users (all default to 'user')
UPDATE public.users SET role = 'user' WHERE role IS NULL;

-- Grant admin role to specific emails (UPDATE THIS LIST)
-- IMPORTANT: Replace these with your actual admin emails before running
UPDATE public.users
SET role = 'admin'
WHERE email IN (
  'paul@heritagewhisper.com',
  'admin@heritagewhisper.com'
);

-- Create audit log table for admin actions
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_user_id
ON public.admin_audit_log(admin_user_id);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at
ON public.admin_audit_log(created_at DESC);

COMMENT ON TABLE public.admin_audit_log IS 'Audit trail for all admin actions';
```

#### Step 2: Admin Middleware
**File:** `/lib/adminAuth.ts` (NEW FILE)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getClientIp } from './ratelimit';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
}

/**
 * Verify admin authorization for protected routes
 * Returns user object if authorized, throws error response if not
 */
export async function requireAdmin(
  request: NextRequest
): Promise<{ user: AuthenticatedUser; response: null } | { user: null; response: NextResponse }> {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return {
      user: null,
      response: NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      ),
    };
  }

  // Verify authentication
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return {
      user: null,
      response: NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      ),
    };
  }

  // Get user role from database
  const { data: userData, error: userError } = await supabaseAdmin
    .from('users')
    .select('id, email, role')
    .eq('id', user.id)
    .single();

  if (userError || !userData) {
    console.error('Error fetching user role:', userError);
    return {
      user: null,
      response: NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      ),
    };
  }

  // Check admin role
  if (userData.role !== 'admin') {
    console.warn(`Unauthorized admin access attempt by user ${userData.email}`);

    // Log unauthorized attempt
    await logAdminAction({
      adminUserId: userData.id,
      action: 'unauthorized_access_attempt',
      details: { path: request.url },
      ipAddress: getClientIp(request),
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return {
      user: null,
      response: NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      ),
    };
  }

  return {
    user: userData as AuthenticatedUser,
    response: null,
  };
}

/**
 * Log admin action to audit trail
 */
export async function logAdminAction(params: {
  adminUserId: string;
  action: string;
  targetUserId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  try {
    await supabaseAdmin.from('admin_audit_log').insert({
      admin_user_id: params.adminUserId,
      action: params.action,
      target_user_id: params.targetUserId,
      details: params.details,
      ip_address: params.ipAddress,
      user_agent: params.userAgent,
    });
  } catch (error) {
    console.error('Failed to log admin action:', error);
    // Don't throw - logging failure shouldn't break the request
  }
}
```

#### Step 3: Update Admin Routes
**Example:** `/app/api/admin/test-accounts/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";
import { requireAdmin, logAdminAction } from "@/lib/adminAuth";  // NEW
import { getClientIp } from "@/lib/ratelimit";  // NEW

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export async function GET(request: NextRequest) {
  try {
    // NEW: Require admin authorization
    const { user, response } = await requireAdmin(request);
    if (response) return response;

    // Log admin action
    await logAdminAction({
      adminUserId: user!.id,
      action: 'list_test_accounts',
      ipAddress: getClientIp(request),
      userAgent: request.headers.get('user-agent') || undefined,
    });

    // Get all test accounts
    const { data: users, error: usersError } = await supabaseAdmin
      .from("users")
      .select("id, email, name")
      .or('email.like.%@heritagewhisper.com,name.ilike.%(Test)%')
      .order("created_at", { ascending: false });

    if (usersError) {
      logger.error("Error fetching test accounts:", usersError);
      return NextResponse.json({ error: "Failed to fetch test accounts" }, { status: 500 });
    }

    // Get info for each test account
    const accounts = [];
    for (const testUser of users || []) {
      const { data: info, error: infoError } = await supabaseAdmin
        .rpc("get_test_account_info", { target_user_id: testUser.id });

      if (!infoError && info && info.length > 0) {
        accounts.push({
          id: testUser.id,
          ...info[0],
        });
      }
    }

    return NextResponse.json({ success: true, accounts });

  } catch (err) {
    logger.error("Error in GET /api/admin/test-accounts:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

#### Step 4: Apply to All Admin Routes
Update these files with `requireAdmin()` and `logAdminAction()`:

1. ✅ `/app/api/admin/test-accounts/route.ts`
2. ✅ `/app/api/admin/test-accounts/delete/route.ts`
3. ✅ `/app/api/admin/test-accounts/clean/route.ts`
4. ✅ `/app/api/admin/test-accounts/clone/route.ts`
5. ✅ `/app/api/admin/test-accounts/generate-prompts/route.ts`
6. ✅ `/app/api/admin/test-accounts/milestone/route.ts`
7. ✅ `/app/api/admin/prompts/route.ts`
8. ✅ `/app/api/admin/test-prompt/route.ts`

#### Step 5: Update Schema
**File:** `/shared/schema.ts`

Add to users table definition (line 15):

```typescript
export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password"),
  name: text("name").notNull().default("User"),
  birthYear: integer("birth_year").notNull(),
  role: text("role").notNull().default("user").$type<"user" | "admin" | "moderator">(),  // NEW
  // ... rest of fields
});
```

---

## <a id="critical-002"></a>CRITICAL-002: Rate Limiting Disabled by Default

### Severity: CRITICAL
**Risk:** Production system could be running without rate limits, allowing unlimited API abuse and AI credit drain.

### Current State
```typescript
// lib/ratelimit.ts
if (!url || !token) {
  console.warn("[Rate Limit] Redis credentials not configured - rate limiting disabled");
  return null;  // Returns mock that always allows requests
}
```

### Solution: Mandatory Rate Limiting in Production

**File:** `/lib/ratelimit.ts`

```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Lazy-load Redis client to avoid build-time errors
let redis: Redis | null = null;
let redisInitialized = false;
let redisInitError: Error | null = null;

function getRedis() {
  if (redisInitialized) {
    return redis;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  const nodeEnv = process.env.NODE_ENV;

  if (!url || !token) {
    const errorMsg = "[Rate Limit] Redis credentials not configured";

    // CRITICAL CHANGE: Fail in production, warn in development
    if (nodeEnv === 'production') {
      redisInitError = new Error(
        `${errorMsg} - Rate limiting is REQUIRED in production. ` +
        `Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables.`
      );
      console.error(redisInitError.message);
      // Don't throw here - let individual rate limit calls handle it
    } else {
      console.warn(`${errorMsg} - rate limiting disabled in development`);
    }

    redisInitialized = true;
    return null;
  }

  try {
    redis = new Redis({ url, token });
    redisInitialized = true;
    console.info('[Rate Limit] Redis connection initialized successfully');
    return redis;
  } catch (error) {
    redisInitError = error as Error;
    console.error('[Rate Limit] Failed to initialize Redis:', error);
    redisInitialized = true;
    return null;
  }
}

// Lazy-initialize rate limiters
let _authRatelimit: Ratelimit | null = null;
let _uploadRatelimit: Ratelimit | null = null;
let _apiRatelimit: Ratelimit | null = null;
let _tier3Ratelimit: Ratelimit | null = null;

function getRateLimiter(type: "auth" | "upload" | "api" | "tier3"): Ratelimit | null {
  const redis = getRedis();

  // CRITICAL CHANGE: Fail in production if Redis not available
  if (!redis) {
    if (process.env.NODE_ENV === 'production' || redisInitError) {
      throw new Error(
        `Rate limiting unavailable in production. Redis initialization failed: ${redisInitError?.message || 'No credentials'}`
      );
    }
    return null;
  }

  if (type === "auth" && !_authRatelimit) {
    _authRatelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "10 s"),
      analytics: true,
      prefix: "@hw/auth",
    });
  }

  if (type === "upload" && !_uploadRatelimit) {
    _uploadRatelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "60 s"),
      analytics: true,
      prefix: "@hw/upload",
    });
  }

  if (type === "api" && !_apiRatelimit) {
    _apiRatelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, "60 s"),
      analytics: true,
      prefix: "@hw/api",
    });
  }

  if (type === "tier3" && !_tier3Ratelimit) {
    _tier3Ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(1, "300 s"),
      analytics: true,
      prefix: "@hw/tier3",
    });
  }

  return type === "auth"
    ? _authRatelimit
    : type === "upload"
      ? _uploadRatelimit
      : type === "tier3"
        ? _tier3Ratelimit
        : _apiRatelimit;
}

// Export getters with production enforcement
export const authRatelimit = {
  limit: async (identifier: string) => {
    try {
      const limiter = getRateLimiter("auth");
      if (!limiter) {
        // Development fallback only
        return {
          success: true,
          limit: 999,
          reset: Date.now() + 10000,
          remaining: 999,
        };
      }
      return limiter.limit(identifier);
    } catch (error) {
      console.error('[Rate Limit] Auth rate limit check failed:', error);
      // In production, fail closed (deny request)
      if (process.env.NODE_ENV === 'production') {
        return {
          success: false,
          limit: 0,
          reset: Date.now() + 60000,
          remaining: 0,
        };
      }
      // In development, fail open (allow request but log)
      return {
        success: true,
        limit: 999,
        reset: Date.now() + 10000,
        remaining: 999,
      };
    }
  },
};

export const uploadRatelimit = {
  limit: async (identifier: string) => {
    try {
      const limiter = getRateLimiter("upload");
      if (!limiter) {
        return {
          success: true,
          limit: 999,
          reset: Date.now() + 60000,
          remaining: 999,
        };
      }
      return limiter.limit(identifier);
    } catch (error) {
      console.error('[Rate Limit] Upload rate limit check failed:', error);
      if (process.env.NODE_ENV === 'production') {
        return {
          success: false,
          limit: 0,
          reset: Date.now() + 60000,
          remaining: 0,
        };
      }
      return {
        success: true,
        limit: 999,
        reset: Date.now() + 60000,
        remaining: 999,
      };
    }
  },
};

export const apiRatelimit = {
  limit: async (identifier: string) => {
    try {
      const limiter = getRateLimiter("api");
      if (!limiter) {
        return {
          success: true,
          limit: 999,
          reset: Date.now() + 60000,
          remaining: 999,
        };
      }
      return limiter.limit(identifier);
    } catch (error) {
      console.error('[Rate Limit] API rate limit check failed:', error);
      if (process.env.NODE_ENV === 'production') {
        return {
          success: false,
          limit: 0,
          reset: Date.now() + 60000,
          remaining: 0,
        };
      }
      return {
        success: true,
        limit: 999,
        reset: Date.now() + 60000,
        remaining: 999,
      };
    }
  },
};

export const tier3Ratelimit = {
  limit: async (identifier: string) => {
    try {
      const limiter = getRateLimiter("tier3");
      if (!limiter) {
        return {
          success: true,
          limit: 999,
          reset: Date.now() + 300000,
          remaining: 999,
        };
      }
      return limiter.limit(identifier);
    } catch (error) {
      console.error('[Rate Limit] Tier 3 rate limit check failed:', error);
      if (process.env.NODE_ENV === 'production') {
        return {
          success: false,
          limit: 0,
          reset: Date.now() + 300000,
          remaining: 0,
        };
      }
      return {
        success: true,
        limit: 999,
        reset: Date.now() + 300000,
        remaining: 999,
      };
    }
  },
};

/**
 * Helper function to get client IP from request headers
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  if (realIp) {
    return realIp.trim();
  }

  return "unknown";
}

/**
 * Rate limit check helper that returns a response if rate limited
 */
export async function checkRateLimit(
  identifier: string,
  ratelimiter: {
    limit: (
      id: string,
    ) => Promise<{
      success: boolean;
      limit: number;
      reset: number;
      remaining: number;
    }>;
  },
): Promise<Response | null> {
  const { success, limit, reset, remaining } =
    await ratelimiter.limit(identifier);

  if (!success) {
    return new Response(
      JSON.stringify({
        error: "Too many requests",
        details: "Please try again later",
        retryAfter: Math.ceil((reset - Date.now()) / 1000),
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": reset.toString(),
          "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
        },
      },
    );
  }

  return null;
}

/**
 * Health check for rate limiting system
 * Call this on app startup to verify Redis is working
 */
export async function healthCheckRateLimit(): Promise<{
  healthy: boolean;
  error?: string;
}> {
  try {
    const redis = getRedis();
    if (!redis) {
      return {
        healthy: process.env.NODE_ENV !== 'production',
        error: 'Redis not configured',
      };
    }

    // Test Redis connection with a simple ping
    await redis.ping();
    return { healthy: true };
  } catch (error) {
    return {
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
```

#### Add Startup Health Check
**File:** `/app/api/health/route.ts` (NEW FILE)

```typescript
import { NextResponse } from 'next/server';
import { healthCheckRateLimit } from '@/lib/ratelimit';

export async function GET() {
  const rateLimitHealth = await healthCheckRateLimit();

  const health = {
    status: rateLimitHealth.healthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    checks: {
      rateLimit: rateLimitHealth,
    },
  };

  const status = health.status === 'healthy' ? 200 : 503;

  return NextResponse.json(health, { status });
}
```

---

## <a id="high-001"></a>HIGH-001: Family Sharing User ID Validation

### Severity: HIGH
**Risk:** User ID enumeration possible by testing different userId values.

### Current State
```typescript
// app/api/family/stories/[userId]/route.ts (lines 75-85)
// Verify userId matches the storyteller
if (familyMember.user_id !== userId) {
  // User ID checked AFTER fetching family member
  return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });
}
```

### Solution: Filter at Query Level

**File:** `/app/api/family/stories/[userId]/route.ts`

```typescript
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    // Get family session token from header
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json(
        { error: 'No session token provided' },
        { status: 401 }
      );
    }

    // SECURITY FIX: Filter by userId at query level to prevent enumeration
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('family_sessions')
      .select(`
        id,
        family_member_id,
        expires_at,
        family_members!inner (
          id,
          user_id,
          email,
          name,
          relationship,
          access_count
        )
      `)
      .eq('token', token)
      .eq('family_members.user_id', userId)  // ADDED: Filter at DB level
      .single();

    if (sessionError || !session) {
      // Now returns same error for invalid token OR wrong userId
      // Prevents enumeration attacks
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    // Check if session expired
    if (new Date(session.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Session expired' },
        { status: 401 }
      );
    }

    const familyMember = (session as any).family_members;

    if (!familyMember) {
      return NextResponse.json(
        { error: 'Family member not found' },
        { status: 404 }
      );
    }

    // REMOVED: No longer needed - userId already validated at DB level
    // if (familyMember.user_id !== userId) { ... }

    // Fetch public stories only
    const { data: allStories, error: storiesError } = await supabaseAdmin
      .from('stories')
      .select('*')
      .eq('user_id', userId)
      .order('story_year', { ascending: false })
      .order('created_at', { ascending: false });

    // Filter for public stories
    const stories = (allStories || []).filter((story: any) => {
      const includeInTimeline = story.include_in_timeline ?? true;
      const includeInBook = story.include_in_book ?? true;
      return includeInTimeline || includeInBook;
    });

    if (storiesError) {
      console.error('Error fetching stories:', storiesError);
      return NextResponse.json(
        {
          error: 'Failed to fetch stories',
          details: process.env.NODE_ENV === 'development' ? storiesError.message : undefined
        },
        { status: 500 }
      );
    }

    // Update session activity (fire and forget - don't block response)
    Promise.all([
      supabaseAdmin
        .from('family_sessions')
        .update({ last_active_at: new Date().toISOString() })
        .eq('id', session.id),
      supabaseAdmin
        .from('family_members')
        .update({
          last_accessed_at: new Date().toISOString(),
          access_count: (familyMember.access_count || 0) + 1,
        })
        .eq('id', session.family_member_id),
    ]).catch((error) => {
      // Log but don't fail the request
      console.error('Failed to update session activity:', error);
    });

    return NextResponse.json({
      stories: stories || [],
      total: stories?.length || 0,
    });
  } catch (error) {
    console.error('Error in family stories API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## <a id="high-002"></a>HIGH-002: Row Level Security (RLS) Implementation

### Severity: HIGH
**Risk:** Application-level access control can be bypassed if bugs introduce code paths that skip checks.

### Solution: Database-Level Security with RLS Policies

**File:** `/migrations/0007_enable_row_level_security.sql`

```sql
-- Migration: Enable Row Level Security on Critical Tables
-- Created: 2025-10-15
-- Description: Add defense-in-depth with database-level access control

-- ============================================================================
-- STORIES TABLE RLS
-- ============================================================================

-- Enable RLS on stories table
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own stories
CREATE POLICY "Users can view their own stories"
ON public.stories
FOR SELECT
USING (user_id = (SELECT auth.uid()));

-- Policy: Users can only insert their own stories
CREATE POLICY "Users can insert their own stories"
ON public.stories
FOR INSERT
WITH CHECK (user_id = (SELECT auth.uid()));

-- Policy: Users can only update their own stories
CREATE POLICY "Users can update their own stories"
ON public.stories
FOR UPDATE
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

-- Policy: Users can only delete their own stories
CREATE POLICY "Users can delete their own stories"
ON public.stories
FOR DELETE
USING (user_id = (SELECT auth.uid()));

-- Policy: Service role can access all stories (for admin operations)
CREATE POLICY "Service role has full access to stories"
ON public.stories
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- ACTIVE PROMPTS TABLE RLS
-- ============================================================================

ALTER TABLE public.active_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own prompts"
ON public.active_prompts
FOR SELECT
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert their own prompts"
ON public.active_prompts
FOR INSERT
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update their own prompts"
ON public.active_prompts
FOR UPDATE
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete their own prompts"
ON public.active_prompts
FOR DELETE
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Service role has full access to active_prompts"
ON public.active_prompts
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- PROMPT HISTORY TABLE RLS
-- ============================================================================

ALTER TABLE public.prompt_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own prompt history"
ON public.prompt_history
FOR SELECT
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert their own prompt history"
ON public.prompt_history
FOR INSERT
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Service role has full access to prompt_history"
ON public.prompt_history
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- FAMILY MEMBERS TABLE RLS
-- ============================================================================

ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own family members"
ON public.family_members
FOR SELECT
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert their own family members"
ON public.family_members
FOR INSERT
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update their own family members"
ON public.family_members
FOR UPDATE
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete their own family members"
ON public.family_members
FOR DELETE
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Service role has full access to family_members"
ON public.family_members
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- FAMILY SESSIONS TABLE RLS
-- ============================================================================

ALTER TABLE public.family_sessions ENABLE ROW LEVEL SECURITY;

-- Family sessions accessed via token, not user_id
-- Only service role should access directly
CREATE POLICY "Service role has full access to family_sessions"
ON public.family_sessions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- USERS TABLE RLS
-- ============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can read their own record
CREATE POLICY "Users can view their own profile"
ON public.users
FOR SELECT
USING (id = (SELECT auth.uid()));

-- Users can update their own record (except role)
CREATE POLICY "Users can update their own profile"
ON public.users
FOR UPDATE
USING (id = (SELECT auth.uid()))
WITH CHECK (
  id = (SELECT auth.uid()) AND
  -- Prevent users from changing their own role
  role = (SELECT role FROM public.users WHERE id = (SELECT auth.uid()))
);

-- Only service role can insert new users (registration flow)
CREATE POLICY "Service role can insert users"
ON public.users
FOR INSERT
TO service_role
WITH CHECK (true);

-- Service role has full access
CREATE POLICY "Service role has full access to users"
ON public.users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- ADMIN AUDIT LOG RLS
-- ============================================================================

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit log
CREATE POLICY "Admins can view audit log"
ON public.admin_audit_log
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = (SELECT auth.uid()) AND role = 'admin'
  )
);

-- Service role can insert audit log entries
CREATE POLICY "Service role can insert audit log"
ON public.admin_audit_log
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role has full access to audit_log"
ON public.admin_audit_log
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify RLS is enabled on critical tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('stories', 'users', 'active_prompts', 'prompt_history', 'family_members', 'family_sessions', 'admin_audit_log')
ORDER BY tablename;

COMMENT ON TABLE public.stories IS 'RLS enabled - users can only access their own stories';
COMMENT ON TABLE public.users IS 'RLS enabled - users can only view/update their own profile';
COMMENT ON TABLE public.active_prompts IS 'RLS enabled - users can only access their own prompts';
```

---

## <a id="high-003"></a>HIGH-003: Family Session Security

### Severity: HIGH
**Risk:** Sessions never expire server-side, no automatic cleanup, no token rotation.

### Solution: Automatic Session Cleanup + Token Rotation

**File:** `/migrations/0008_family_session_security.sql`

```sql
-- Migration: Family Session Security Enhancements
-- Created: 2025-10-15
-- Description: Auto-expire sessions, add rotation, enforce max lifetime

-- Add absolute expiry field (max session lifetime)
ALTER TABLE public.family_sessions
ADD COLUMN IF NOT EXISTS absolute_expires_at TIMESTAMPTZ;

-- Set absolute expiry for existing sessions (30 days from now)
UPDATE public.family_sessions
SET absolute_expires_at = NOW() + INTERVAL '30 days'
WHERE absolute_expires_at IS NULL;

-- Make absolute_expires_at NOT NULL
ALTER TABLE public.family_sessions
ALTER COLUMN absolute_expires_at SET NOT NULL;

-- Create function to auto-delete expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_family_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete sessions past absolute expiry OR regular expiry
  DELETE FROM public.family_sessions
  WHERE
    expires_at < NOW() OR
    absolute_expires_at < NOW();

  RAISE NOTICE 'Cleaned up expired family sessions';
END;
$$;

-- Create function to rotate session token
CREATE OR REPLACE FUNCTION rotate_family_session_token(
  p_session_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_token TEXT;
BEGIN
  -- Generate new random token (64 characters)
  v_new_token := encode(gen_random_bytes(32), 'hex');

  -- Update session with new token and extend expiry
  UPDATE public.family_sessions
  SET
    token = v_new_token,
    expires_at = NOW() + INTERVAL '7 days',
    last_active_at = NOW()
  WHERE id = p_session_id
    AND expires_at > NOW()  -- Only rotate if not expired
    AND absolute_expires_at > NOW();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found or expired';
  END IF;

  RETURN v_new_token;
END;
$$;

-- Create pg_cron job to run cleanup daily (requires pg_cron extension)
-- Note: Uncomment if pg_cron is available in your Supabase instance
-- SELECT cron.schedule(
--   'cleanup-expired-family-sessions',
--   '0 2 * * *',  -- Run at 2 AM daily
--   $$ SELECT cleanup_expired_family_sessions(); $$
-- );

-- Alternative: Create trigger to cleanup on INSERT (less efficient but works without pg_cron)
CREATE OR REPLACE FUNCTION trigger_cleanup_expired_sessions()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only cleanup 10% of the time to avoid overhead
  IF random() < 0.1 THEN
    PERFORM cleanup_expired_family_sessions();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER cleanup_sessions_on_insert
  AFTER INSERT ON public.family_sessions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_cleanup_expired_sessions();

-- Index for efficient expiry queries
CREATE INDEX IF NOT EXISTS idx_family_sessions_expires_at
ON public.family_sessions(expires_at)
WHERE expires_at < NOW();

CREATE INDEX IF NOT EXISTS idx_family_sessions_absolute_expires_at
ON public.family_sessions(absolute_expires_at)
WHERE absolute_expires_at < NOW();

COMMENT ON COLUMN public.family_sessions.absolute_expires_at IS 'Absolute max session lifetime - cannot be extended';
COMMENT ON FUNCTION cleanup_expired_family_sessions IS 'Removes all expired family sessions';
COMMENT ON FUNCTION rotate_family_session_token IS 'Rotates session token and extends expiry (up to absolute limit)';
```

#### Update Family Access Endpoint to Use Rotation
**File:** `/app/api/family/access/route.ts` (update existing)

Add session rotation logic:

```typescript
// After successful token validation, rotate the token
const { data: rotatedToken, error: rotateError } = await supabaseAdmin
  .rpc('rotate_family_session_token', { p_session_id: session.id });

if (rotateError) {
  console.error('Failed to rotate session token:', rotateError);
  // Continue with old token - don't block user
} else {
  // Return new token to client
  return NextResponse.json({
    success: true,
    sessionToken: rotatedToken,  // Client should use this for future requests
    familyMember: familyMember,
    storyteller: storyteller,
  });
}
```

---

## <a id="high-004"></a>HIGH-004: Share Token Security

### Severity: HIGH
**Risk:** Share tokens in URLs logged in browser history, server logs, referrer headers.

### Current State
Family invite links: `/family/access?token=abc123`

### Solution: One-Time Use Tokens + Session-Based Access

**File:** `/migrations/0009_one_time_invite_tokens.sql`

```sql
-- Migration: One-Time Use Invite Tokens
-- Created: 2025-10-15
-- Description: Mark invite tokens as used after first access

-- Add used_count to track token usage
ALTER TABLE public.family_invites
ADD COLUMN IF NOT EXISTS used_count INTEGER DEFAULT 0;

-- Add last_used_at timestamp
ALTER TABLE public.family_invites
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ;

-- Create function to mark invite as used
CREATE OR REPLACE FUNCTION mark_family_invite_used(
  p_token TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invite_id UUID;
  v_family_member_id UUID;
BEGIN
  -- Get invite details
  SELECT id, family_member_id INTO v_invite_id, v_family_member_id
  FROM public.family_invites
  WHERE token = p_token
    AND expires_at > NOW()
    AND used_at IS NULL  -- Only unused invites
  FOR UPDATE;  -- Lock row

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invite token invalid, expired, or already used';
  END IF;

  -- Mark as used
  UPDATE public.family_invites
  SET
    used_at = NOW(),
    used_count = used_count + 1,
    last_used_at = NOW()
  WHERE id = v_invite_id;

  -- Update family member status to active
  UPDATE public.family_members
  SET
    status = 'active',
    first_accessed_at = COALESCE(first_accessed_at, NOW())
  WHERE id = v_family_member_id;

  RETURN v_family_member_id;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_family_invites_token_expires
ON public.family_invites(token, expires_at)
WHERE used_at IS NULL;

COMMENT ON FUNCTION mark_family_invite_used IS 'Marks invite token as used (one-time use)';
```

#### Update Family Access Flow
**File:** `/app/api/family/access/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export async function POST(req: NextRequest) {
  try {
    const { inviteToken } = await req.json();

    if (!inviteToken) {
      return NextResponse.json(
        { error: 'Invite token required' },
        { status: 400 }
      );
    }

    // SECURITY: Mark invite as used (one-time use)
    const { data: familyMemberId, error: markUsedError } = await supabaseAdmin
      .rpc('mark_family_invite_used', { p_token: inviteToken });

    if (markUsedError) {
      console.error('Invalid or expired invite token:', markUsedError);
      return NextResponse.json(
        {
          error: 'Invalid or expired invite link',
          hint: 'This link may have already been used or expired. Please request a new invite.'
        },
        { status: 401 }
      );
    }

    // Get family member and storyteller info
    const { data: familyMember, error: memberError } = await supabaseAdmin
      .from('family_members')
      .select(`
        id,
        user_id,
        email,
        name,
        relationship,
        users (
          id,
          name,
          email
        )
      `)
      .eq('id', familyMemberId)
      .single();

    if (memberError || !familyMember) {
      console.error('Family member not found:', memberError);
      return NextResponse.json(
        { error: 'Family member not found' },
        { status: 404 }
      );
    }

    // Create family session (7 days sliding, 30 days absolute max)
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const absoluteExpiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days max

    const { data: session, error: sessionError } = await supabaseAdmin
      .from('family_sessions')
      .insert({
        family_member_id: familyMember.id,
        token: sessionToken,
        user_agent: req.headers.get('user-agent') || undefined,
        ip_address: req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
                    req.headers.get('x-real-ip') ||
                    'unknown',
        expires_at: expiresAt.toISOString(),
        absolute_expires_at: absoluteExpiresAt.toISOString(),
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Failed to create family session:', sessionError);
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      sessionToken: session.token,
      expiresAt: session.expires_at,
      familyMember: {
        id: familyMember.id,
        name: familyMember.name,
        relationship: familyMember.relationship,
      },
      storyteller: {
        id: (familyMember as any).users.id,
        name: (familyMember as any).users.name,
      },
    });

  } catch (error) {
    console.error('Error in family access:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## <a id="high-005"></a>HIGH-005: RPC Function Security Audit

### Severity: HIGH
**Risk:** Custom RPC functions may not use parameterized queries, allowing SQL injection.

### Solution: Audit All RPC Functions

**Action Items:**

1. **Identify all RPC functions:**
   ```sql
   SELECT routine_name, routine_definition
   FROM information_schema.routines
   WHERE routine_schema = 'public'
     AND routine_type = 'FUNCTION';
   ```

2. **Review `get_test_account_info` function:**
   - Ensure `target_user_id` parameter is properly typed as UUID
   - Verify no string concatenation in SQL queries
   - Use `$1, $2` parameter notation

3. **Security Checklist for Each RPC Function:**
   - ✅ Parameters have explicit types (UUID, TEXT, etc.)
   - ✅ No dynamic SQL with string concatenation
   - ✅ Uses parameterized queries (`$1, $2, $3`)
   - ✅ `SECURITY DEFINER` only when necessary
   - ✅ Input validation at function start
   - ✅ Appropriate RBAC checks

**Example Secure RPC Function:**

```sql
-- SECURE: Uses typed parameters and no string concatenation
CREATE OR REPLACE FUNCTION get_test_account_info(
  target_user_id UUID  -- Explicitly typed as UUID
)
RETURNS TABLE (
  email TEXT,
  name TEXT,
  story_count INTEGER,
  prompt_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER  -- Needed to bypass RLS
AS $$
BEGIN
  -- Validate input
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'target_user_id cannot be NULL';
  END IF;

  -- SECURE: Uses parameterized query
  RETURN QUERY
  SELECT
    u.email,
    u.name,
    u.story_count,
    (SELECT COUNT(*)::INTEGER FROM active_prompts WHERE user_id = target_user_id) as prompt_count
  FROM users u
  WHERE u.id = target_user_id;  -- No string concatenation!
END;
$$;
```

**Insecure Example (DON'T DO THIS):**

```sql
-- INSECURE: Uses string concatenation
CREATE FUNCTION bad_function(user_email TEXT)
RETURNS SETOF users
LANGUAGE plpgsql
AS $$
BEGIN
  -- DANGEROUS: SQL injection possible!
  RETURN QUERY EXECUTE 'SELECT * FROM users WHERE email = ''' || user_email || '''';
END;
$$;
```

---

## <a id="high-006"></a>HIGH-006: AI Operations Rate Limiting

### Severity: HIGH
**Risk:** Attackers with multiple accounts can drain AI credits.

### Solution: Multi-Layer Rate Limiting

**File:** `/lib/ratelimit.ts` (additions)

```typescript
// Add IP-based rate limiting for AI operations
let _aiIpRatelimit: Ratelimit | null = null;
let _aiGlobalRatelimit: Ratelimit | null = null;

function getRateLimiter(type: "auth" | "upload" | "api" | "tier3" | "ai-ip" | "ai-global"): Ratelimit | null {
  const redis = getRedis();

  if (!redis) {
    if (process.env.NODE_ENV === 'production' || redisInitError) {
      throw new Error(`Rate limiting unavailable in production`);
    }
    return null;
  }

  // ... existing limiters ...

  // NEW: IP-based rate limit for AI operations (10 per hour per IP)
  if (type === "ai-ip" && !_aiIpRatelimit) {
    _aiIpRatelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "3600 s"),
      analytics: true,
      prefix: "@hw/ai-ip",
    });
  }

  // NEW: Global rate limit for AI operations (1000 per hour total)
  if (type === "ai-global" && !_aiGlobalRatelimit) {
    _aiGlobalRatelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(1000, "3600 s"),
      analytics: true,
      prefix: "@hw/ai-global",
    });
  }

  return type === "ai-ip"
    ? _aiIpRatelimit
    : type === "ai-global"
      ? _aiGlobalRatelimit
      : /* ... existing logic ... */;
}

// Export new rate limiters
export const aiIpRatelimit = {
  limit: async (identifier: string) => {
    try {
      const limiter = getRateLimiter("ai-ip");
      if (!limiter) {
        return { success: true, limit: 999, reset: Date.now() + 3600000, remaining: 999 };
      }
      return limiter.limit(identifier);
    } catch (error) {
      console.error('[Rate Limit] AI IP rate limit check failed:', error);
      if (process.env.NODE_ENV === 'production') {
        return { success: false, limit: 0, reset: Date.now() + 3600000, remaining: 0 };
      }
      return { success: true, limit: 999, reset: Date.now() + 3600000, remaining: 999 };
    }
  },
};

export const aiGlobalRatelimit = {
  limit: async (identifier: string) => {
    try {
      const limiter = getRateLimiter("ai-global");
      if (!limiter) {
        return { success: true, limit: 999, reset: Date.now() + 3600000, remaining: 999 };
      }
      return limiter.limit(identifier);
    } catch (error) {
      console.error('[Rate Limit] AI global rate limit check failed:', error);
      if (process.env.NODE_ENV === 'production') {
        return { success: false, limit: 0, reset: Date.now() + 3600000, remaining: 0 };
      }
      return { success: true, limit: 999, reset: Date.now() + 3600000, remaining: 999 };
    }
  },
};
```

**File:** `/app/api/stories/route.ts` (update Tier 3 section)

```typescript
// Around line 500 - Add IP-based and global rate limiting
import { tier3Ratelimit, aiIpRatelimit, aiGlobalRatelimit, getClientIp } from "@/lib/ratelimit";

// ... inside POST handler, before Tier 3 analysis ...

// Multi-layer rate limiting for expensive AI operations
const clientIp = getClientIp(request);

// Check user-based rate limit (1 per 5 minutes)
const userRateLimitResult = await tier3Ratelimit.limit(user.id);
if (!userRateLimitResult.success) {
  logger.warn(`[Stories API] ⏱️  Tier 3 user rate limit exceeded for ${user.id}`);
  // Continue without Tier 3 - don't block story creation
}

// Check IP-based rate limit (10 per hour per IP)
const ipRateLimitResult = await aiIpRatelimit.limit(clientIp);
if (!ipRateLimitResult.success) {
  logger.warn(`[Stories API] ⏱️  Tier 3 IP rate limit exceeded for ${clientIp}`);
  // Continue without Tier 3
}

// Check global rate limit (1000 per hour total)
const globalRateLimitResult = await aiGlobalRatelimit.limit('tier3-global');
if (!globalRateLimitResult.success) {
  logger.error(`[Stories API] 🚨 Tier 3 GLOBAL rate limit exceeded - system under load`);
  // Continue without Tier 3
}

// Only run Tier 3 if ALL rate limits pass
if (
  userRateLimitResult.success &&
  ipRateLimitResult.success &&
  globalRateLimitResult.success &&
  shouldRunTier3
) {
  // Run Tier 3 analysis
  await performTier3Analysis(/* ... */);
}
```

#### Add Cost Tracking
**File:** `/migrations/0010_ai_cost_tracking.sql`

```sql
-- Migration: AI Cost Tracking
-- Created: 2025-10-15
-- Description: Track AI usage and costs per user

CREATE TABLE IF NOT EXISTS public.ai_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  operation TEXT NOT NULL,  -- 'tier3', 'whisper', 'transcribe', 'lesson', etc.
  model TEXT NOT NULL,      -- 'gpt-4o', 'gpt-5', 'whisper-1', etc.
  tokens_used INTEGER,
  cost_usd DECIMAL(10, 6),  -- Cost in USD (6 decimal places)
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_usage_log_user_id ON public.ai_usage_log(user_id);
CREATE INDEX idx_ai_usage_log_created_at ON public.ai_usage_log(created_at DESC);
CREATE INDEX idx_ai_usage_log_operation ON public.ai_usage_log(operation);

-- Add daily cost limits to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS ai_daily_budget_usd DECIMAL(10, 2) DEFAULT 1.00,
ADD COLUMN IF NOT EXISTS ai_monthly_budget_usd DECIMAL(10, 2) DEFAULT 10.00;

-- Function to check if user is within budget
CREATE OR REPLACE FUNCTION check_ai_budget(
  p_user_id UUID,
  p_operation TEXT,
  p_estimated_cost DECIMAL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_daily_spent DECIMAL;
  v_monthly_spent DECIMAL;
  v_daily_budget DECIMAL;
  v_monthly_budget DECIMAL;
BEGIN
  -- Get user budgets
  SELECT ai_daily_budget_usd, ai_monthly_budget_usd
  INTO v_daily_budget, v_monthly_budget
  FROM public.users
  WHERE id = p_user_id;

  -- Calculate daily spend
  SELECT COALESCE(SUM(cost_usd), 0)
  INTO v_daily_spent
  FROM public.ai_usage_log
  WHERE user_id = p_user_id
    AND created_at >= NOW() - INTERVAL '24 hours';

  -- Calculate monthly spend
  SELECT COALESCE(SUM(cost_usd), 0)
  INTO v_monthly_spent
  FROM public.ai_usage_log
  WHERE user_id = p_user_id
    AND created_at >= DATE_TRUNC('month', NOW());

  -- Check if within budget
  IF (v_daily_spent + p_estimated_cost) > v_daily_budget THEN
    RAISE NOTICE 'User % exceeded daily AI budget', p_user_id;
    RETURN FALSE;
  END IF;

  IF (v_monthly_spent + p_estimated_cost) > v_monthly_budget THEN
    RAISE NOTICE 'User % exceeded monthly AI budget', p_user_id;
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$;

COMMENT ON TABLE public.ai_usage_log IS 'Tracks AI API usage and costs per user';
COMMENT ON FUNCTION check_ai_budget IS 'Checks if user is within daily/monthly AI budget';
```

---

## <a id="deployment-strategy"></a>Deployment Strategy

### Phase 1: Immediate (Deploy Today)
1. ✅ **CRITICAL-002**: Update rate limiting (fail in production)
2. ✅ **HIGH-007**: Remove `window.supabase` exposure
3. ✅ **MEDIUM-008**: Sanitize error messages

**Steps:**
```bash
# 1. Update lib/ratelimit.ts with production enforcement
# 2. Update lib/supabase.ts - remove window exposure
# 3. Test locally: npm run dev
# 4. Deploy to Vercel: git push origin main
# 5. Verify health endpoint: https://dev.heritagewhisper.com/api/health
```

### Phase 2: Database Migrations (This Week)
1. ✅ Run migration 0006 - Add user roles
2. ✅ Run migration 0007 - Enable RLS
3. ✅ Run migration 0008 - Family session security
4. ✅ Run migration 0009 - One-time invite tokens
5. ✅ Run migration 0010 - AI cost tracking

**Steps:**
```bash
# Connect to Supabase SQL editor
# Run each migration in order
# Verify with: SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
```

### Phase 3: Admin Authorization (This Week)
1. ✅ Create `/lib/adminAuth.ts`
2. ✅ Update all 8 admin routes
3. ✅ Test admin endpoints with non-admin user
4. ✅ Deploy

### Phase 4: Family Sharing Security (Next Week)
1. ✅ Update `/app/api/family/stories/[userId]/route.ts`
2. ✅ Update `/app/api/family/access/route.ts`
3. ✅ Test invite flow end-to-end
4. ✅ Deploy

### Phase 5: AI Cost Controls (Next Week)
1. ✅ Add IP-based rate limiting
2. ✅ Add AI usage logging
3. ✅ Add budget checks
4. ✅ Monitor costs for 1 week

---

## <a id="testing-checklist"></a>Testing Checklist

### CRITICAL-001: Admin Authorization
- [ ] Non-admin user gets 403 when accessing `/api/admin/test-accounts`
- [ ] Admin user can access `/api/admin/test-accounts`
- [ ] Admin actions appear in `admin_audit_log` table
- [ ] Unauthorized access attempts are logged

### CRITICAL-002: Rate Limiting
- [ ] Local dev works without Redis configured
- [ ] Production deployment fails health check if Redis not configured
- [ ] Rate limits are enforced (test with rapid requests)
- [ ] Health endpoint returns 200 when Redis working

### HIGH-001: Family Sharing
- [ ] Invalid userId returns 401 (not 403)
- [ ] Valid session with wrong userId returns 401
- [ ] Valid session with correct userId returns stories

### HIGH-002: RLS Policies
- [ ] User A cannot query User B's stories via direct Supabase client
- [ ] Service role can still access all data
- [ ] Story creation/update/delete work normally for authenticated users

### HIGH-003: Session Security
- [ ] Expired sessions return 401
- [ ] Session token rotates after first use
- [ ] Cleanup function deletes old sessions
- [ ] Absolute expiry enforced (sessions can't be extended forever)

### HIGH-004: Invite Tokens
- [ ] Invite token works on first use
- [ ] Same invite token fails on second use
- [ ] Expired invite token fails

### HIGH-006: AI Rate Limiting
- [ ] User-based rate limit enforced (1 per 5 min)
- [ ] IP-based rate limit enforced (10 per hour)
- [ ] Global rate limit enforced (1000 per hour)
- [ ] AI usage logged to `ai_usage_log` table
- [ ] Budget check prevents over-spending

---

## Risk Matrix

| Vulnerability | Likelihood | Impact | Risk Score | Remediation Cost |
|---------------|------------|--------|------------|------------------|
| CRITICAL-001  | High       | High   | **9/10**   | 4 hours          |
| CRITICAL-002  | High       | High   | **9/10**   | 2 hours          |
| HIGH-001      | Medium     | High   | **7/10**   | 1 hour           |
| HIGH-002      | Low        | High   | **6/10**   | 2 hours          |
| HIGH-003      | Medium     | Medium | **6/10**   | 3 hours          |
| HIGH-004      | Medium     | Medium | **5/10**   | 2 hours          |
| HIGH-005      | Low        | High   | **5/10**   | 4 hours (audit)  |
| HIGH-006      | Medium     | High   | **7/10**   | 3 hours          |

**Total Estimated Time:** 21 hours across 4-5 days

---

## Success Metrics

After implementation, verify:
- ✅ Zero admin endpoint access by non-admin users (check audit log)
- ✅ Rate limiting active in production (check health endpoint daily)
- ✅ No user ID enumeration attempts succeed (monitor 401s in family routes)
- ✅ RLS denies cross-user data access (test with direct client queries)
- ✅ Session rotation working (check family_sessions table for token changes)
- ✅ Invite tokens single-use (check used_at field populated)
- ✅ AI costs tracked (query ai_usage_log daily)
- ✅ No budget overruns (monitor monthly AI spend)

---

**Next Steps:**
1. Review this plan with team
2. Schedule deployment windows
3. Backup database before running migrations
4. Monitor closely for 48 hours after each phase

**Questions or Concerns:**
- Contact security team before deploying to production
- Test thoroughly in staging environment first
- Have rollback plan ready for each phase
