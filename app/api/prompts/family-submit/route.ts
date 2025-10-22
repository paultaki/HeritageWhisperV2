import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * POST /api/prompts/family-submit
 * Submit a question from a family contributor to a storyteller
 *
 * Request body:
 * {
 *   storyteller_id: string,
 *   prompt_text: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Get the user from the auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'No authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      console.error('[FamilySubmit] Auth error:', authError);
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { storyteller_id, prompt_text, context } = body;

    if (!storyteller_id || !prompt_text) {
      return NextResponse.json(
        { error: 'storyteller_id and prompt_text are required' },
        { status: 400 }
      );
    }

    if (prompt_text.length < 10 || prompt_text.length > 500) {
      return NextResponse.json(
        { error: 'Question must be between 10 and 500 characters' },
        { status: 400 }
      );
    }

    console.log('[FamilySubmit] User', user.id, 'submitting question to', storyteller_id);

    // Verify the user has contributor access to this storyteller
    const { data: hasAccess, error: accessError } = await supabaseAdmin.rpc(
      'has_collaboration_access',
      {
        p_user_id: user.id,
        p_storyteller_id: storyteller_id,
      }
    );

    if (accessError || !hasAccess) {
      console.warn('[FamilySubmit] Access denied for user', user.id, 'to storyteller', storyteller_id);
      return NextResponse.json(
        { error: "You don't have permission to submit questions to this storyteller" },
        { status: 403 }
      );
    }

    // Get the family_member_id for the submitting user
    const { data: familyMember, error: memberError } = await supabaseAdmin
      .from('family_members')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (memberError || !familyMember) {
      console.error('[FamilySubmit] No family_member record found for user', user.id);
      return NextResponse.json(
        { error: 'Family member record not found' },
        { status: 404 }
      );
    }

    // Insert the family prompt
    // Note: Omitting context field for now - column may not exist in current schema
    const { data: prompt, error: insertError } = await supabaseAdmin
      .from('family_prompts')
      .insert({
        storyteller_user_id: storyteller_id,
        submitted_by_family_member_id: familyMember.id,
        prompt_text: prompt_text.trim(),
        status: 'pending',
      })
      .select('*')
      .single();

    if (insertError) {
      console.error('[FamilySubmit] Insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to submit question', details: insertError },
        { status: 500 }
      );
    }

    console.log('[FamilySubmit] ✅ Question submitted successfully:', prompt.id);

    return NextResponse.json({
      success: true,
      prompt,
    });
  } catch (error) {
    console.error('[FamilySubmit] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
