import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { performTier3Analysis } from "@/lib/tier3Analysis";

export async function POST(request: NextRequest) {
  try {
    // Get auth token
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
    }

    // Get milestone from request body
    const { milestone } = await request.json();

    if (!milestone || ![1, 2, 3, 4, 7, 10, 15, 20, 30, 50, 100].includes(milestone)) {
      return NextResponse.json({
        error: 'Invalid milestone. Must be one of: 1, 2, 3, 4, 7, 10, 15, 20, 30, 50, 100'
      }, { status: 400 });
    }

    console.log(`[Admin Tier 3 Trigger] Running milestone ${milestone} analysis for user ${user.id}`);

    // Fetch all user stories
    const { data: stories, error: storiesError } = await supabaseAdmin
      .from('stories')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (storiesError) {
      console.error('[Admin Tier 3 Trigger] Error fetching stories:', storiesError);
      return NextResponse.json({ error: 'Failed to fetch stories' }, { status: 500 });
    }

    if (!stories || stories.length === 0) {
      return NextResponse.json({ error: 'No stories found for this user' }, { status: 400 });
    }

    console.log(`[Admin Tier 3 Trigger] Found ${stories.length} stories`);

    // Run Tier 3 analysis
    const result = await performTier3Analysis(user.id, stories, milestone);

    if (!result.success) {
      return NextResponse.json({
        error: result.error || 'Tier 3 analysis failed',
        details: result
      }, { status: 500 });
    }

    console.log(`[Admin Tier 3 Trigger] ✅ Analysis complete. Generated ${result.promptsGenerated} prompts`);

    return NextResponse.json({
      success: true,
      milestone,
      promptsGenerated: result.promptsGenerated,
      storiesAnalyzed: stories.length,
      message: `Successfully generated ${result.promptsGenerated} prompts for milestone ${milestone}`
    });

  } catch (err) {
    console.error('[Admin Tier 3 Trigger] Unexpected error:', err);
    return NextResponse.json({
      error: 'Internal server error',
      details: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 });
  }
}
