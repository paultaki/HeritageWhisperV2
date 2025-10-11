import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Lazy-load Redis client to avoid build-time errors
let redis: Redis | null = null;

function getRedis() {
  if (!redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
      console.warn(
        "[Rate Limit] Redis credentials not configured - rate limiting disabled",
      );
      // Return a mock Redis client that always allows requests
      return null;
    }

    redis = new Redis({ url, token });
  }
  return redis;
}

// Lazy-initialize rate limiters
let _authRatelimit: Ratelimit | null = null;
let _uploadRatelimit: Ratelimit | null = null;
let _apiRatelimit: Ratelimit | null = null;

function getRateLimiter(type: "auth" | "upload" | "api"): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;

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

  return type === "auth"
    ? _authRatelimit
    : type === "upload"
      ? _uploadRatelimit
      : _apiRatelimit;
}

// Export getters instead of direct instances
export const authRatelimit = {
  limit: async (identifier: string) => {
    const limiter = getRateLimiter("auth");
    if (!limiter) {
      // If rate limiting is disabled, always allow
      return {
        success: true,
        limit: 999,
        reset: Date.now() + 10000,
        remaining: 999,
      };
    }
    return limiter.limit(identifier);
  },
};

export const uploadRatelimit = {
  limit: async (identifier: string) => {
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
  },
};

export const apiRatelimit = {
  limit: async (identifier: string) => {
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
