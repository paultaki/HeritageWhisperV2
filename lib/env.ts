/**
 * Environment Variable Validation
 *
 * This file validates all required environment variables at application startup.
 * Uses Zod for type-safe validation with clear error messages.
 *
 * SECURITY: Fails fast in production if required variables are missing.
 */

import { z } from 'zod';

const envSchema = z.object({
  // Node Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Supabase - Required
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL connection string'),

  // AI Services - Required
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required'),
  ASSEMBLYAI_API_KEY: z.string().min(1, 'ASSEMBLYAI_API_KEY is required'),

  // AI Services - Optional
  AI_GATEWAY_API_KEY: z.string().optional(),
  VERCEL_AI_GATEWAY_BASE_URL: z.string().url().optional(),

  // Rate Limiting - Required in production
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // Email Service - Required
  RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY is required'),

  // Payment - Optional
  NEXT_PUBLIC_STRIPE_PUBLIC_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),

  // App Configuration - Required
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters'),
  NEXT_PUBLIC_APP_URL: z.string().url('NEXT_PUBLIC_APP_URL must be a valid URL'),
  NEXT_PUBLIC_API_URL: z.string().url('NEXT_PUBLIC_API_URL must be a valid URL'),
});

// Custom refinement for production environment
const productionEnvSchema = envSchema.refine(
  (data) => {
    // In production, rate limiting is mandatory
    if (data.NODE_ENV === 'production') {
      return !!data.UPSTASH_REDIS_REST_URL && !!data.UPSTASH_REDIS_REST_TOKEN;
    }
    return true;
  },
  {
    message: 'UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required in production',
  }
);

/**
 * Validates environment variables at startup
 * @throws ZodError if validation fails
 */
export function validateEnv() {
  try {
    const result = productionEnvSchema.safeParse(process.env);

    if (!result.success) {
      console.error('❌ Invalid environment configuration:');
      console.error(JSON.stringify(result.error.format(), null, 2));

      // In production, fail fast
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Environment validation failed. Check logs for details.');
      }

      // In development, warn but continue
      console.warn('⚠️  Continuing with invalid environment in development mode');
      return null;
    }

    console.log('✅ Environment variables validated successfully');
    return result.data;
  } catch (error) {
    console.error('❌ Failed to validate environment:', error);

    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }

    return null;
  }
}

// Export typed environment variables
export const env = validateEnv();

// Type-safe access to environment variables
export type Env = z.infer<typeof envSchema>;
