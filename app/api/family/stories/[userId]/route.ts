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

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;

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
          email,
          name,
          relationship
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

    // Verify userId matches the storyteller
    if (familyMember.user_id !== userId) {
      console.error('User ID mismatch:', {
        familyMemberUserId: familyMember.user_id,
        requestedUserId: userId,
      });
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 403 }
      );
    }

    // Fetch stories - only public ones (includeInTimeline OR includeInBook)
    const { data: stories, error: storiesError } = await supabaseAdmin
      .from('stories')
      .select('*')
      .eq('user_id', userId)
      .or('includeInTimeline.eq.true,includeInBook.eq.true')
      .order('storyYear', { ascending: false, nullsFirst: false });

    if (storiesError) {
      console.error('Error fetching stories:', storiesError);
      return NextResponse.json(
        { error: 'Failed to fetch stories' },
        { status: 500 }
      );
    }

    // Update last_active_at for session
    await supabaseAdmin
      .from('family_sessions')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', session.id);

    // Update family member last_accessed_at and increment access_count
    await supabaseAdmin
      .from('family_members')
      .update({
        last_accessed_at: new Date().toISOString(),
        access_count: (familyMember.access_count || 0) + 1,
      })
      .eq('id', session.family_member_id);

    return NextResponse.json({
      stories: stories || [],
      total: stories?.length || 0,
    });
  } catch (error) {
    console.error('Error in family stories API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
