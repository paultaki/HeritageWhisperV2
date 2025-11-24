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

// PATCH - Update family member permissions
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const { memberId } = await params;
    const { permissionLevel } = await req.json();

    if (!memberId) {
      return NextResponse.json(
        { error: 'Member ID is required' },
        { status: 400 }
      );
    }

    if (!permissionLevel || !['viewer', 'contributor'].includes(permissionLevel)) {
      return NextResponse.json(
        { error: 'Valid permission level required (viewer or contributor)' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const authHeader = req.headers.get('authorization');
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

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
    const userId = user.id;

    // Verify this family member belongs to the user
    const { data: member, error: memberError } = await supabaseAdmin
      .from('family_members')
      .select('id, user_id, email, name, permission_level')
      .eq('id', memberId)
      .eq('user_id', userId)
      .single();

    if (memberError || !member) {
      return NextResponse.json(
        { error: 'Family member not found' },
        { status: 404 }
      );
    }

    // Update permission level
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('family_members')
      .update({ permission_level: permissionLevel })
      .eq('id', memberId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating permissions:', updateError);
      return NextResponse.json(
        { error: 'Failed to update permissions' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      member: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        permissionLevel: updated.permission_level,
      },
    });
  } catch (error) {
    console.error('Error in update permissions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
