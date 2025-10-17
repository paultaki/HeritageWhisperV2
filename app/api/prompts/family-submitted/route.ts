import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

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

    // Fetch pending family-submitted prompts with submitter information
    const { data: familyPrompts, error: promptsError } = await supabaseAdmin
      .from('family_prompts')
      .select(`
        id,
        prompt_text,
        context,
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
      .eq('storyteller_user_id', user.id)
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
        context_note: prompt.context,
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

