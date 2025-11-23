import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

import { getPasskeySession } from "@/lib/iron-session";
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

    // Get next queue position using the helper function
    const { data: positionData, error: positionError } = await supabaseAdmin
      .rpc('get_next_queue_position', { p_user_id: userId });

    if (positionError) {
      console.error('Error getting next queue position:', positionError);
      return NextResponse.json(
        { error: 'Failed to get queue position' },
        { status: 500 }
      );
    }

    const queuePosition = positionData || 1;

    // Check if prompt already exists for this user in queued or dismissed status
    const { data: existingPrompt } = await supabaseAdmin
      .from('user_prompts')
      .select('id, status')
      .eq('user_id', userId)
      .eq('text', text)
      .in('status', ['queued', 'dismissed'])
      .single();

    // If it already exists and is queued, return success (idempotent)
    if (existingPrompt) {
      if (existingPrompt.status === 'queued') {
        return NextResponse.json({
          promoted: true,
          alreadyExists: true
        });
      } else {
        // If dismissed, update to queued
        const { error: updateError } = await supabaseAdmin
          .from('user_prompts')
          .update({
            status: 'queued',
            queue_position: queuePosition,
            queued_at: new Date().toISOString(),
          })
          .eq('id', existingPrompt.id);

        if (updateError) {
          console.error('Error updating prompt to queued:', updateError);
          return NextResponse.json(
            { error: 'Failed to queue prompt' },
            { status: 500 }
          );
        }

        return NextResponse.json({ promoted: true });
      }
    }

    // Insert the new prompt as queued
    const { error: insertError } = await supabaseAdmin
      .from('user_prompts')
      .insert({
        user_id: userId,
        text,
        category,
        status: 'queued',
        queue_position: queuePosition,
        queued_at: new Date().toISOString(),
        source: 'catalog',
      });

    if (insertError) {
      console.error('Error inserting prompt:', insertError);
      return NextResponse.json(
        { error: 'Failed to save prompt', details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ promoted: true });
  } catch (error) {
    console.error('Error in queue-next:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
