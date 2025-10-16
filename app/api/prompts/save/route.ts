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

    // Check if prompt already exists for this user in queued or dismissed status
    const { data: existingPrompt } = await supabaseAdmin
      .from('user_prompts')
      .select('id')
      .eq('user_id', user.id)
      .eq('text', text)
      .in('status', ['queued', 'dismissed'])
      .single();

    // If it already exists, return success (idempotent)
    if (existingPrompt) {
      return NextResponse.json({ saved: true, alreadyExists: true });
    }

    // Insert the new prompt with status 'dismissed' (archived)
    const { error: insertError } = await supabaseAdmin
      .from('user_prompts')
      .insert({
        user_id: user.id,
        text,
        category,
        status: 'dismissed',
        dismissed_at: new Date().toISOString(),
        source: 'catalog',
      });

    if (insertError) {
      console.error('Error saving prompt:', insertError);
      return NextResponse.json(
        { error: 'Failed to save prompt', details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ saved: true });
  } catch (error) {
    console.error('Error in save prompt:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
