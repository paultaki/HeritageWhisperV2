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

export async function POST(req: NextRequest) {
  try {
    const { text, category } = await req.json();

    if (!text || !category) {
      return NextResponse.json(
        { error: 'Missing text or category' },
        { status: 400 }
      );
    }

    // Get the Authorization header
    const authHeader = req.headers.get('authorization');
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
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    // Count ready prompts
    const { count, error: countError } = await supabaseAdmin
      .from('user_prompts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'ready');

    if (countError) {
      console.error('Error counting ready prompts:', countError);
      return NextResponse.json(
        { error: 'Failed to count prompts' },
        { status: 500 }
      );
    }

    // Determine status: ready if less than 3, otherwise saved
    const status = (count ?? 0) < 3 ? 'ready' : 'saved';

    // Upsert the prompt
    const { error: upsertError } = await supabaseAdmin
      .from('user_prompts')
      .upsert(
        {
          user_id: user.id,
          text,
          category,
          status,
          source: 'catalog',
        },
        { onConflict: 'user_id,text,status' }
      );

    if (upsertError) {
      console.error('Error upserting prompt:', upsertError);
      return NextResponse.json(
        { error: 'Failed to save prompt' },
        { status: 500 }
      );
    }

    return NextResponse.json({ promoted: status === 'ready' });
  } catch (error) {
    console.error('Error in queue-next:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
