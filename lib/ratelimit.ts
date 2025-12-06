/**
 * Rate Limiting Module
 *
 * Behavior by environment:
 *
 * PRODUCTION:
 *   - Redis is REQUIRED and validated via lib/env.ts at startup.
 *   - Initialization failures are FATAL (fail fast at module load).
 *   - At runtime, Redis errors are logged and requests are ALLOWED by default
 *     to preserve availability (soft-fail).
 *
 * DEVELOPMENT:
 *   - Redis is optional; if not configured, a no-op limiter is used.
 *   - This allows local development without Upstash setup.
 *
 * Public API is unchanged - all exported limiters have the same signatures.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env } from "@/lib/env";

// =============================================================================
// Types
// =============================================================================

interface RateLimitResult {
  success: boolean;
  limit: number;
  reset: number;
  remaining: number;
}

// No-op result for development when Redis is not configured
const NO_OP_RESULT: RateLimitResult = {
  success: true,
  limit: 999,
  reset: Date.now() + 60000,
  remaining: 999,
};

// Soft-fail result for runtime Redis errors (preserves availability)
function softFailResult(): RateLimitResult {
  return {
    success: true,
    limit: 999,
    reset: Date.now() + 1000,
    remaining: Infinity,
  };
}

// =============================================================================
// Redis Client Initialization (Module Scope)
// =============================================================================

const isProduction = env.NODE_ENV === "production";

/**
 * Initialize Redis client at module scope.
 * - In production: Throws immediately if Redis cannot be created (fail fast).
 * - In development: Returns null if credentials are missing (no-op limiter).
 */
function initializeRedis(): Redis | null {
  const url = env.UPSTASH_REDIS_REST_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN;

  // Check if credentials are configured
  if (!url || !token) {
    if (isProduction) {
      // env.ts should have caught this, but double-check for safety
      throw new Error(
        "[RateLimit] Redis is not initialized in production. " +
        "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required."
      );
    }
    // Development: no-op limiter is acceptable
    console.warn(
      "[RateLimit] Redis credentials not configured - using no-op limiter in development"
    );
    return null;
  }

  // Attempt to create Redis client
  // If this throws synchronously, it will bubble up and fail fast
  try {
    const client = new Redis({ url, token });
    console.info("[RateLimit] Redis client initialized successfully");
    return client;
  } catch (error) {
    if (isProduction) {
      // Re-throw to fail fast in production
      throw new Error(
        `[RateLimit] Failed to initialize Redis in production: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
    console.error("[RateLimit] Failed to initialize Redis:", error);
    return null;
  }
}

// Initialize Redis client at module load time
// In production, this will throw and crash the app if Redis is misconfigured
const redis: Redis | null = initializeRedis();

// =============================================================================
// Rate Limiters (Lazy Initialization)
// =============================================================================

let _authRatelimit: Ratelimit | null = null;
let _uploadRatelimit: Ratelimit | null = null;
let _apiRatelimit: Ratelimit | null = null;
let _tier3Ratelimit: Ratelimit | null = null;
let _aiIpRatelimit: Ratelimit | null = null;
let _aiGlobalRatelimit: Ratelimit | null = null;
let _promptSubmitRatelimit: Ratelimit | null = null;

type LimiterType = "auth" | "upload" | "api" | "tier3" | "ai-ip" | "ai-global" | "prompt-submit";

function getRateLimiter(type: LimiterType): Ratelimit | null {
  // No Redis client means no-op in development
  if (!redis) {
    return null;
  }

  switch (type) {
    case "auth":
      if (!_authRatelimit) {
        _authRatelimit = new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(5, "10 s"),
          analytics: true,
          prefix: "@hw/auth",
        });
      }
      return _authRatelimit;

    case "upload":
      if (!_uploadRatelimit) {
        _uploadRatelimit = new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(10, "60 s"),
          analytics: true,
          prefix: "@hw/upload",
        });
      }
      return _uploadRatelimit;

    case "api":
      if (!_apiRatelimit) {
        _apiRatelimit = new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(30, "60 s"),
          analytics: true,
          prefix: "@hw/api",
        });
      }
      return _apiRatelimit;

    case "tier3":
      // Tier 3: Expensive GPT-4o analysis - limit to 1 per 5 minutes per user
      if (!_tier3Ratelimit) {
        _tier3Ratelimit = new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(1, "300 s"),
          analytics: true,
          prefix: "@hw/tier3",
        });
      }
      return _tier3Ratelimit;

    case "ai-ip":
      // AI IP-based: Prevent abuse from single IP - 10 per hour per IP
      if (!_aiIpRatelimit) {
        _aiIpRatelimit = new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(10, "3600 s"),
          analytics: true,
          prefix: "@hw/ai-ip",
        });
      }
      return _aiIpRatelimit;

    case "ai-global":
      // AI Global: System-wide protection - 1000 per hour total
      if (!_aiGlobalRatelimit) {
        _aiGlobalRatelimit = new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(1000, "3600 s"),
          analytics: true,
          prefix: "@hw/ai-global",
        });
      }
      return _aiGlobalRatelimit;

    case "prompt-submit":
      // Prompt Submit: Prevent spam - 5 submissions per minute per user
      if (!_promptSubmitRatelimit) {
        _promptSubmitRatelimit = new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(5, "60 s"),
          analytics: true,
          prefix: "@hw/prompt-submit",
        });
      }
      return _promptSubmitRatelimit;

    default:
      return null;
  }
}

// =============================================================================
// Safe Limit Wrapper
// =============================================================================

/**
 * Wraps a rate limiter call with error handling.
 * - If limiter is null (dev no-op), returns NO_OP_RESULT.
 * - If Redis call fails at runtime, logs error and soft-allows the request.
 */
async function safeLimit(
  limiterType: LimiterType,
  identifier: string
): Promise<RateLimitResult> {
  const limiter = getRateLimiter(limiterType);

  // No limiter = development no-op
  if (!limiter) {
    return NO_OP_RESULT;
  }

  try {
    // Actual Redis call - may throw on network/Redis issues
    return await limiter.limit(identifier);
  } catch (error) {
    // Runtime Redis error: log and soft-allow to preserve availability
    console.error(
      `[RateLimit] Redis error during ${limiterType} limit check, allowing request by default:`,
      error
    );
    return softFailResult();
  }
}

// =============================================================================
// Exported Rate Limiters (Public API - Unchanged)
// =============================================================================

export const authRatelimit = {
  limit: (identifier: string) => safeLimit("auth", identifier),
};

export const uploadRatelimit = {
  limit: (identifier: string) => safeLimit("upload", identifier),
};

export const apiRatelimit = {
  limit: (identifier: string) => safeLimit("api", identifier),
};

export const tier3Ratelimit = {
  limit: (identifier: string) => safeLimit("tier3", identifier),
};

export const aiIpRatelimit = {
  limit: (identifier: string) => safeLimit("ai-ip", identifier),
};

export const aiGlobalRatelimit = {
  limit: (identifier: string) => safeLimit("ai-global", identifier),
};

export const promptSubmitRatelimit = {
  limit: (identifier: string) => safeLimit("prompt-submit", identifier),
};

// =============================================================================
// Helper Functions
// =============================================================================

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
    limit: (id: string) => Promise<RateLimitResult>;
  }
): Promise<Response | null> {
  const { success, limit, reset, remaining } = await ratelimiter.limit(identifier);

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
      }
    );
  }

  return null;
}

/**
 * Health check for rate limiting system.
 * Call this on app startup to verify Redis is working.
 */
export async function healthCheckRateLimit(): Promise<{
  healthy: boolean;
  error?: string;
}> {
  // No Redis in development is acceptable
  if (!redis) {
    return {
      healthy: !isProduction,
      error: isProduction ? "Redis not configured in production" : undefined,
    };
  }

  try {
    await redis.ping();
    return { healthy: true };
  } catch (error) {
    return {
      healthy: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
