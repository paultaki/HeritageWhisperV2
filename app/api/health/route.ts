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
