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
    // Tier 3: Expensive GPT-4o analysis - limit to 1 per 5 minutes per user
    _tier3Ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(1, "300 s"), // 1 request per 5 minutes
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

// Export getters instead of direct instances
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
