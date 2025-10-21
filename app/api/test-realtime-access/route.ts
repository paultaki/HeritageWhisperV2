import { NextResponse } from 'next/server';

/**
 * Test OpenAI Realtime API Access
 *
 * This endpoint tests if your OpenAI API key has access to the Realtime API.
 */
export async function GET() {
  try {
    console.log('[Test] Testing Realtime API access...');

    // Try to create a client secret
    const response = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    const data = await response.json();

    console.log('[Test] Response:', {
      status: response.status,
      statusText: response.statusText,
      hasValue: !!data.value,
      hasError: !!data.error,
    });

    if (!response.ok) {
      return NextResponse.json({
        hasAccess: false,
        status: response.status,
        error: data.error || data,
        message: 'Your OpenAI API key does not have access to the Realtime API. This feature may be in limited beta.',
      }, { status: 200 }); // Return 200 so we can see the response
    }

    return NextResponse.json({
      hasAccess: true,
      expiresAt: data.expires_at,
      message: 'Your OpenAI API key has access to the Realtime API!',
    });

  } catch (error) {
    console.error('[Test] Error:', error);
    return NextResponse.json({
      hasAccess: false,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
