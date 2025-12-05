import { NextRequest, NextResponse } from 'next/server';

// SECURITY: Use centralized admin client (enforces server-only via import)
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, name } = body;

    if (!user_id || !name) {
      return NextResponse.json(
        { error: 'user_id and name are required' },
        { status: 400 }
      );
    }

    console.log('[UpdateUserName] Updating user:', user_id, 'to name:', name);

    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ name })
      .eq('id', user_id);

    if (updateError) {
      console.error('[UpdateUserName] Error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update name', details: updateError },
        { status: 500 }
      );
    }

    console.log('[UpdateUserName] ✅ Name updated successfully');

    return NextResponse.json({
      success: true,
      message: 'User name updated successfully',
    });
  } catch (error) {
    console.error('[UpdateUserName] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
