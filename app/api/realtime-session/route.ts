import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

// Initialize Supabase Admin client for token verification
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * OpenAI Realtime API - Session Endpoint
 *
 * Creates ephemeral client secret for WebRTC connection.
 *
 * Docs: https://platform.openai.com/docs/guides/realtime-webrtc
 *
 * IMPORTANT:
 * - Endpoint: POST /v1/realtime/client_secrets (OpenAI GA)
 * - Model: gpt-realtime or gpt-realtime-mini (GA names)
 * - Expires: ~60 seconds (do not rely on expires_at for security)
 *
 * Security:
 * - Never expose OPENAI_API_KEY to browser
 * - Rate limit: 5 sessions per user per 10 minutes (TODO: add Upstash)
 * - Client secret expires in 60 seconds
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Verify authentication
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      console.warn('[RealtimeSession] No authorization token');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      console.warn('[RealtimeSession] Invalid token');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    // 2. TODO: Rate limiting (5 sessions per 10 minutes)
    // Will add Upstash Redis rate limiting in next commit
    // const { success } = await rateLimit.sessions.limit(userId);
    // if (!success) {
    //   logger.warn('[RealtimeSession] Rate limit exceeded', { userId });
    //   return NextResponse.json(
    //     { error: 'Too many session requests. Please wait.' },
    //     { status: 429 }
    //   );
    // }

    // 3. Verify OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      logger.error('[RealtimeSession] OPENAI_API_KEY not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // 4. Create ephemeral client secret
    // Docs: https://platform.openai.com/docs/guides/realtime-webrtc
    // Endpoint: POST /v1/realtime/client_secrets (NOT /sessions - that's Azure)
    // Note: Model is specified in the WebRTC connection URL, NOT in client_secrets request
    const response = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Model NOT included here - specified in WebRTC connection URL instead
        // Modalities and voice also NOT included - configured via session.update after connection
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[RealtimeSession] OpenAI API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        url: 'https://api.openai.com/v1/realtime/client_secrets',
        model: 'gpt-realtime-mini',
      });

      // Return more detailed error for debugging
      return NextResponse.json(
        {
          error: 'Failed to create session',
          debug: {
            status: response.status,
            statusText: response.statusText,
            details: errorText.substring(0, 200), // First 200 chars
          }
        },
        { status: 500 }
      );
    }

    const data = await response.json();

    // 5. Extract client secret (NEVER log the actual secret value!)
    // OpenAI returns: { value: "ek_...", expires_at: timestamp, session: {...} }
    const clientSecret = data.value;
    const expiresAt = data.expires_at;

    if (!clientSecret) {
      console.error('[RealtimeSession] No client_secret in OpenAI response. Response keys:', Object.keys(data));
      throw new Error('No client_secret in response');
    }

    logger.info('[RealtimeSession] Session created successfully', {
      userId,
      expiresAt,
      model: 'gpt-realtime-mini',
      // DO NOT log clientSecret!
    });

    // 6. Return ONLY the ephemeral token
    // Note: expires_at may be inaccurate - treat as ~60s TTL regardless
    return NextResponse.json({
      client_secret: clientSecret,
      expires_at: expiresAt,
    });

  } catch (error) {
    console.error('[RealtimeSession] Unexpected error:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error: 'Internal server error',
        debug: {
          message: error instanceof Error ? error.message : String(error),
        }
      },
      { status: 500 }
    );
  }
}
