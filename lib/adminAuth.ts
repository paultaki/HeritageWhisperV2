import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getClientIp } from './ratelimit';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
}

/**
 * Verify admin authorization for protected routes
 * Returns user object if authorized, throws error response if not
 */
export async function requireAdmin(
  request: NextRequest
): Promise<{ user: AuthenticatedUser; response: null } | { user: null; response: NextResponse }> {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return {
      user: null,
      response: NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      ),
    };
  }

  // Verify authentication
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return {
      user: null,
      response: NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      ),
    };
  }

  // Get user role from database
  const { data: userData, error: userError } = await supabaseAdmin
    .from('users')
    .select('id, email, role')
    .eq('id', user.id)
    .single();

  if (userError || !userData) {
    console.error('Error fetching user role:', userError);
    return {
      user: null,
      response: NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      ),
    };
  }

  // Check admin role
  if (userData.role !== 'admin') {
    console.warn(`Unauthorized admin access attempt by user ${userData.email}`);

    // Log unauthorized attempt
    await logAdminAction({
      adminUserId: userData.id,
      action: 'unauthorized_access_attempt',
      details: { path: request.url },
      ipAddress: getClientIp(request),
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return {
      user: null,
      response: NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      ),
    };
  }

  return {
    user: userData as AuthenticatedUser,
    response: null,
  };
}

/**
 * Log admin action to audit trail
 */
export async function logAdminAction(params: {
  adminUserId: string;
  action: string;
  targetUserId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  try {
    await supabaseAdmin.from('admin_audit_log').insert({
      admin_user_id: params.adminUserId,
      action: params.action,
      target_user_id: params.targetUserId,
      details: params.details,
      ip_address: params.ipAddress,
      user_agent: params.userAgent,
    });
  } catch (error) {
    console.error('Failed to log admin action:', error);
    // Don't throw - logging failure shouldn't break the request
  }
}
