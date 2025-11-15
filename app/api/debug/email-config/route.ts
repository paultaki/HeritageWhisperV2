import { NextResponse } from 'next/server';

/**
 * Debug endpoint to check email configuration
 * Only works in development/preview - returns 404 in production for security
 *
 * Usage: GET /api/debug/email-config
 */
export async function GET() {
  // Only allow in non-production environments
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({
    environment: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    config: {
      hasResendApiKey: !!process.env.RESEND_API_KEY,
      resendApiKeyPrefix: process.env.RESEND_API_KEY?.substring(0, 8) + '...',
      resendFromEmail: process.env.RESEND_FROM_EMAIL || 'NOT SET',
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'NOT SET',
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'NOT SET',
    },
  });
}
