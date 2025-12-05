/**
 * Environment Variable Validation
 *
 * This file validates all required environment variables at application startup.
 * Uses Zod for type-safe validation with clear error messages.
 *
 * SECURITY:
 * - Uses 'server-only' to prevent accidental client-side imports
 * - Fails fast in production if required variables are missing or too weak
 * - All security-critical secrets require minimum 32 characters
 *
 * @module lib/env
 */

import "server-only";

import { z } from 'zod';

// =============================================================================
// Schema Definition
// =============================================================================

const envSchema = z.object({
  // ---------------------------------------------------------------------------
  // Node Environment
  // ---------------------------------------------------------------------------
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // ---------------------------------------------------------------------------
  // Supabase - Required
  // ---------------------------------------------------------------------------
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL connection string'),

  // ---------------------------------------------------------------------------
  // Security-Critical Secrets (required in production, min 32 chars)
  // ---------------------------------------------------------------------------

  /**
   * Iron Session Password - used to encrypt httpOnly cookies for passkey sessions
   * MUST be at least 32 characters for security
   */
  IRON_SESSION_PASSWORD: z.string()
    .min(32, 'IRON_SESSION_PASSWORD must be at least 32 characters')
    .optional()
    .transform((val) => val ?? ''),

  /**
   * Session Secret - used for HMAC signing of unsubscribe tokens and other crypto
   * MUST be at least 32 characters for security
   */
  SESSION_SECRET: z.string()
    .min(32, 'SESSION_SECRET must be at least 32 characters'),

  /**
   * Supabase JWT Secret - used for minting/verifying RLS JWTs for passkey auth
   * Get from: Supabase Dashboard > Project Settings > API
   * MUST be at least 32 characters
   */
  SUPABASE_JWT_SECRET: z.string()
    .min(32, 'SUPABASE_JWT_SECRET must be at least 32 characters')
    .optional()
    .transform((val) => val ?? ''),

  /**
   * Stripe Webhook Secret - used to verify Stripe webhook signatures
   * Get from: Stripe Dashboard > Developers > Webhooks > Signing secret
   */
  STRIPE_WEBHOOK_SECRET: z.string()
    .min(1, 'STRIPE_WEBHOOK_SECRET is required for Stripe webhook verification')
    .optional()
    .transform((val) => val ?? ''),

  // ---------------------------------------------------------------------------
  // Rate Limiting (Upstash Redis) - Required in production
  // ---------------------------------------------------------------------------

  /**
   * Upstash Redis REST URL - required for rate limiting
   * Get from: Upstash Console > Your Database > REST API
   */
  UPSTASH_REDIS_REST_URL: z.string()
    .url('UPSTASH_REDIS_REST_URL must be a valid URL')
    .optional()
    .transform((val) => val ?? ''),

  /**
   * Upstash Redis REST Token - required for rate limiting
   * Get from: Upstash Console > Your Database > REST API
   */
  UPSTASH_REDIS_REST_TOKEN: z.string()
    .min(1, 'UPSTASH_REDIS_REST_TOKEN is required for rate limiting')
    .optional()
    .transform((val) => val ?? ''),

  // ---------------------------------------------------------------------------
  // AI Services - Required
  // ---------------------------------------------------------------------------
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required'),
  ASSEMBLYAI_API_KEY: z.string().min(1, 'ASSEMBLYAI_API_KEY is required'),

  // AI Services - Optional
  AI_GATEWAY_API_KEY: z.string().optional(),
  VERCEL_AI_GATEWAY_BASE_URL: z.string().url().optional(),

  // ---------------------------------------------------------------------------
  // Email Service - Required
  // ---------------------------------------------------------------------------
  RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY is required'),

  // ---------------------------------------------------------------------------
  // Payment (Stripe) - Optional in development
  // ---------------------------------------------------------------------------
  NEXT_PUBLIC_STRIPE_PUBLIC_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PREMIUM_PRICE_ID: z.string().optional(),
  STRIPE_GIFT_PRICE_ID: z.string().optional(),

  // ---------------------------------------------------------------------------
  // App Configuration - Required
  // ---------------------------------------------------------------------------
  NEXT_PUBLIC_APP_URL: z.string().url('NEXT_PUBLIC_APP_URL must be a valid URL'),
  NEXT_PUBLIC_API_URL: z.string().url('NEXT_PUBLIC_API_URL must be a valid URL'),

  // ---------------------------------------------------------------------------
  // Optional Configuration
  // ---------------------------------------------------------------------------
  COOKIE_NAME: z.string().optional(),
  NEXT_PUBLIC_DEBUG: z.string().optional(),
});

// =============================================================================
// Production Environment Refinements
// =============================================================================

const productionEnvSchema = envSchema.superRefine((data, ctx) => {
  // Only apply production checks in production
  if (data.NODE_ENV !== 'production') {
    return;
  }

  // IRON_SESSION_PASSWORD - Required in production
  if (!data.IRON_SESSION_PASSWORD || data.IRON_SESSION_PASSWORD.length < 32) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'IRON_SESSION_PASSWORD must be at least 32 characters in production',
      path: ['IRON_SESSION_PASSWORD'],
    });
  }

  // SUPABASE_JWT_SECRET - Required in production
  if (!data.SUPABASE_JWT_SECRET || data.SUPABASE_JWT_SECRET.length < 32) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'SUPABASE_JWT_SECRET must be at least 32 characters in production',
      path: ['SUPABASE_JWT_SECRET'],
    });
  }

  // STRIPE_WEBHOOK_SECRET - Required in production
  if (!data.STRIPE_WEBHOOK_SECRET) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'STRIPE_WEBHOOK_SECRET is required in production for webhook verification',
      path: ['STRIPE_WEBHOOK_SECRET'],
    });
  }

  // Rate Limiting (Upstash) - Required in production
  if (!data.UPSTASH_REDIS_REST_URL) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'UPSTASH_REDIS_REST_URL is required in production - rate limiting will not work without it',
      path: ['UPSTASH_REDIS_REST_URL'],
    });
  }

  if (!data.UPSTASH_REDIS_REST_TOKEN) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'UPSTASH_REDIS_REST_TOKEN is required in production - rate limiting will not work without it',
      path: ['UPSTASH_REDIS_REST_TOKEN'],
    });
  }
});

// =============================================================================
// Environment Parsing & Export
// =============================================================================

/**
 * Parse and validate environment variables at module load time.
 * This ensures the app fails fast if any required variables are missing.
 */
function parseEnv(): z.infer<typeof envSchema> {
  const result = productionEnvSchema.safeParse(process.env);

  if (!result.success) {
    console.error('');
    console.error('='.repeat(70));
    console.error('❌ ENVIRONMENT VALIDATION FAILED');
    console.error('='.repeat(70));
    console.error('');
    console.error('The following environment variables have issues:');
    console.error('');

    for (const issue of result.error.issues) {
      const path = issue.path.join('.');
      console.error(`  • ${path}: ${issue.message}`);
    }

    console.error('');
    console.error('='.repeat(70));
    console.error('');

    // In production, fail fast
    if (process.env.NODE_ENV === 'production') {
      console.error('FATAL: Cannot start in production with invalid environment.');
      process.exit(1);
    }

    // In development, warn but return partial data with defaults
    console.warn('⚠️  Continuing in development mode with potentially invalid environment.');
    console.warn('   Some features may not work correctly.');
    console.warn('');

    // Return a minimal valid object for development
    return {
      NODE_ENV: 'development',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      DATABASE_URL: process.env.DATABASE_URL || '',
      IRON_SESSION_PASSWORD: process.env.IRON_SESSION_PASSWORD || '',
      SESSION_SECRET: process.env.SESSION_SECRET || '',
      SUPABASE_JWT_SECRET: process.env.SUPABASE_JWT_SECRET || '',
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
      UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL || '',
      UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN || '',
      OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
      ASSEMBLYAI_API_KEY: process.env.ASSEMBLYAI_API_KEY || '',
      RESEND_API_KEY: process.env.RESEND_API_KEY || '',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
    } as z.infer<typeof envSchema>;
  }

  console.log('✅ Environment variables validated successfully');
  return result.data;
}

/**
 * Validated environment variables.
 * Import this instead of using process.env directly.
 *
 * @example
 * import { env } from "@/lib/env";
 * const secret = env.SESSION_SECRET; // Type-safe!
 */
export const env = parseEnv();

/**
 * Type for the validated environment
 */
export type Env = z.infer<typeof envSchema>;
