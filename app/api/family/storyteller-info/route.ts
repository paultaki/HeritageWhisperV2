import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// GET /api/family/storyteller-info?userId=...
// Public endpoint to get basic storyteller info for join page
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get basic user info (only public-safe fields)
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, name')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      storyteller: {
        name: user.name || 'A HeritageWhisper User',
      },
    });
  } catch (error: any) {
    console.error('Error fetching storyteller info:', error);
    return NextResponse.json(
      { error: 'Failed to load storyteller info' },
      { status: 500 }
    );
  }
}
