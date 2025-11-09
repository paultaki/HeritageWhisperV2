import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { promptSubmitRatelimit } from '@/lib/ratelimit';
import { sendQuestionReceivedNotification } from '@/lib/notifications/send-question-received';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// POST - Submit a new prompt from family member
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { storytellerUserId, promptText, context } = body;

    // Get family session token from header
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json(
        { error: 'No session token provided' },
        { status: 401 }
      );
    }

    // Verify family session
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('family_sessions')
      .select(`
        id,
        family_member_id,
        expires_at,
        family_members (
          id,
          user_id,
          permission_level,
          name,
          email
        )
      `)
      .eq('token', token)
      .single();

    if (sessionError || !session) {
      console.error('Family session not found:', sessionError);
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    // Check if session expired
    if (new Date(session.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Session expired' },
        { status: 401 }
      );
    }

    const familyMember = (session as any).family_members;

    if (!familyMember) {
      return NextResponse.json(
        { error: 'Family member not found' },
        { status: 404 }
      );
    }

    // Verify user ID matches the storyteller
    if (familyMember.user_id !== storytellerUserId) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 403 }
      );
    }

    // Rate limiting: 5 prompt submissions per minute per family member
    const { success, limit, reset, remaining } = await promptSubmitRatelimit.limit(familyMember.id);
    if (!success) {
      console.warn('[FamilyPrompts] Rate limit exceeded for family member:', familyMember.id);
      return NextResponse.json(
        {
          error: 'Too many questions submitted',
          details: 'Please wait before submitting another question',
          retryAfter: Math.ceil((reset - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
            'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    // All family members (viewer or contributor) can submit question suggestions
    // This allows view-only family to engage without giving them write access to stories

    // Validate prompt text
    if (!promptText || promptText.trim().length < 10) {
      return NextResponse.json(
        { error: 'Prompt must be at least 10 characters' },
        { status: 400 }
      );
    }

    if (promptText.length > 500) {
      return NextResponse.json(
        { error: 'Prompt must be less than 500 characters' },
        { status: 400 }
      );
    }

    // Create the prompt
    const { data: prompt, error: promptError } = await supabaseAdmin
      .from('family_prompts')
      .insert({
        storyteller_user_id: storytellerUserId,
        submitted_by_family_member_id: familyMember.id,
        prompt_text: promptText.trim(),
        context: context?.trim() || null,
        status: 'pending',
      })
      .select()
      .single();

    if (promptError) {
      console.error('Error creating prompt:', promptError);
      return NextResponse.json(
        { error: 'Failed to submit prompt' },
        { status: 500 }
      );
    }

    // Send email notification to storyteller (async, non-blocking)
    sendQuestionReceivedNotification({
      storytellerUserId: storytellerUserId,
      submitterFamilyMemberId: familyMember.id,
      promptText: promptText.trim(),
      context: context?.trim(),
    }).catch((error) => {
      // Log error but don't fail the request
      console.error('[FamilyPrompts] Failed to send notification email:', error);
    });

    return NextResponse.json({
      success: true,
      prompt: {
        id: prompt.id,
        promptText: prompt.prompt_text,
        context: prompt.context,
        status: prompt.status,
        createdAt: prompt.created_at,
        submittedBy: {
          name: familyMember.name || familyMember.email,
          relationship: familyMember.relationship,
        },
      },
    });
  } catch (error) {
    console.error('Error in family prompts API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
