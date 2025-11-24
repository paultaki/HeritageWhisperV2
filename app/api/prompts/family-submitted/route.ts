import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

import { getPasskeySession } from "@/lib/iron-session";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * GET /api/prompts/family-submitted
 * Fetches prompts submitted by family members for the authenticated storyteller
 * Returns pending prompts that need to be answered
 */
export async function GET(request: NextRequest) {
  try {
    // Get the Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify the JWT token with Supabase
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    const userId = user.id;

    // V3: Support storyteller_id query parameter for family sharing
    const { searchParams } = new URL(request.url);
    const storytellerId = searchParams.get('storyteller_id') || userId;

    // If requesting another storyteller's prompts, verify access permission
    if (storytellerId !== userId) {
      const { data: hasAccess, error: accessError } = await supabaseAdmin.rpc(
        'has_collaboration_access',
        {
          p_user_id: userId,
          p_storyteller_id: storytellerId,
        }
      );

      if (accessError || !hasAccess) {
        return NextResponse.json(
          { error: "You don't have permission to view these prompts" },
          { status: 403 }
        );
      }
    }

    // Fetch pending family-submitted prompts with submitter information
    // Note: Omitted 'context' field - column may not exist in current schema
    const { data: familyPrompts, error: promptsError } = await supabaseAdmin
      .from('family_prompts')
      .select(`
        id,
        prompt_text,
        status,
        created_at,
        submitted_by_family_member_id,
        family_members (
          id,
          name,
          email,
          relationship
        )
      `)
      .eq('storyteller_user_id', storytellerId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (promptsError) {
      logger.error('Error fetching family-submitted prompts:', promptsError);
      return NextResponse.json(
        { error: 'Failed to fetch prompts' },
        { status: 500 }
      );
    }

    // Transform to include submitter info
    const transformedPrompts = (familyPrompts || []).map((prompt: any) => {
      const familyMember = prompt.family_members;
      return {
        id: prompt.id,
        prompt_text: prompt.prompt_text,
        source: 'family' as const,
        status: prompt.status,
        created_at: prompt.created_at,
        submittedBy: {
          id: familyMember?.id,
          name: familyMember?.name || familyMember?.email?.split('@')[0] || 'Family Member',
          email: familyMember?.email,
          relationship: familyMember?.relationship || 'Family',
        },
      };
    });

    return NextResponse.json({ prompts: transformedPrompts });

  } catch (err) {
    logger.error('Error in GET /api/prompts/family-submitted:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/prompts/family-submitted?id=<prompt_id>
 * Dismisses/deletes a family-submitted prompt
 */
export async function DELETE(request: NextRequest) {
  try {
    // Get the Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify the JWT token with Supabase
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    const userId = user.id;

    // Get prompt ID from query params
    const { searchParams } = new URL(request.url);
    const promptId = searchParams.get('id');

    if (!promptId) {
      return NextResponse.json(
        { error: 'Prompt ID is required' },
        { status: 400 }
      );
    }

    // Verify the prompt belongs to the user before deleting
    const { data: prompt, error: fetchError } = await supabaseAdmin
      .from('family_prompts')
      .select('storyteller_user_id')
      .eq('id', promptId)
      .single();

    if (fetchError || !prompt) {
      return NextResponse.json(
        { error: 'Prompt not found' },
        { status: 404 }
      );
    }

    // Verify user owns this prompt (is the storyteller)
    if (prompt.storyteller_user_id !== userId) {
      return NextResponse.json(
        { error: 'You can only dismiss your own prompts' },
        { status: 403 }
      );
    }

    // Update status to 'archived' instead of hard delete (preserves history)
    const { error: updateError } = await supabaseAdmin
      .from('family_prompts')
      .update({ status: 'archived' })
      .eq('id', promptId);

    if (updateError) {
      logger.error('Error dismissing family prompt:', updateError);
      return NextResponse.json(
        { error: 'Failed to dismiss prompt' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Prompt dismissed successfully'
    });

  } catch (err) {
    logger.error('Error in DELETE /api/prompts/family-submitted:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

