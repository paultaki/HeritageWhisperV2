import { NextRequest, NextResponse } from 'next/server';

// SECURITY: Use centralized admin client (enforces server-only via import)
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'user_id required' }, { status: 400 });
    }

    console.log('[CheckUser] Looking up user:', userId);

    // Get user from users table
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    console.log('[CheckUser] User data:', user);

    return NextResponse.json({
      userId,
      user: user || null,
      error: userError,
    });
  } catch (error) {
    console.error('[CheckUser] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
