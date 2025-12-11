import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

import { getPasskeySession } from "@/lib/iron-session";

// SECURITY: Use centralized admin client (enforces server-only via import)
import { supabaseAdmin } from "@/lib/supabaseAdmin";

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

    // 4. Create ephemeral client secret with session configuration
    // Docs: https://platform.openai.com/docs/api-reference/realtime-sessions/create-realtime-client-secret
    // The session config is embedded in the client_secret - client can override via session.update
    const sessionConfig = {
      session: {
        type: 'realtime',
        model: 'gpt-realtime',  // GA model name (not preview)
        modalities: ['text', 'audio'],
        instructions: 'You are a helpful assistant.',  // Default, overridden by client
        audio: {
          input: {
            transcription: {
              model: 'gpt-4o-mini-transcribe',  // For user speech transcription
            },
            turn_detection: {
              type: 'server_vad',
              threshold: 0.7,
              prefix_padding_ms: 300,
              silence_duration_ms: 2000,  // Senior-friendly: 2 seconds silence tolerance
              create_response: true,  // CRITICAL: Auto-generate response when user stops speaking
            },
          },
          output: {
            voice: 'shimmer',  // Pearl's voice
          },
        },
      },
    };

    console.log('[RealtimeSession] Creating client_secret with config:', JSON.stringify(sessionConfig, null, 2));

    const response = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sessionConfig),
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
