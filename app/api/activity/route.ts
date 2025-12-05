/**
 * Activity Events API
 *
 * GET  /api/activity - Fetch recent activity events for the authenticated user
 * POST /api/activity - Log a new activity event (client-side events like story listening)
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { logger } from "@/lib/logger";
import { getRecentActivity, logActivityEvent, type ActivityEventPayload } from "@/lib/activity";

// SECURITY: Use centralized admin client (enforces server-only via import)
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Cookie name for HttpOnly family session
const FAMILY_SESSION_COOKIE = 'family_session';

/**
 * GET /api/activity
 *
 * Fetch recent activity events for the authenticated storyteller.
 * Supports family sharing via storyteller_id parameter.
 *
 * Query Parameters:
 * - storyteller_id: (optional) UUID of the storyteller to fetch activity for
 * - limit: (optional) Number of events to return (default: 8, max: 20)
 * - days: (optional) Number of days to look back (default: 30)
 *
 * Returns:
 * {
 *   data: Array<{
 *     id: string;
 *     eventType: string;
 *     occurredAt: string;
 *     actorName?: string;
 *     storyTitle?: string;
 *     familyMemberName?: string;
 *   }>
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Validate session
    const authHeader = request.headers.get("authorization");
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Invalid authentication" },
        { status: 401 }
      );
    }

    // 2. Get query parameters
    const { searchParams } = new URL(request.url);
    const storytellerId = searchParams.get("storyteller_id") || user.id;
    const limit = parseInt(searchParams.get("limit") || "8", 10);
    const days = parseInt(searchParams.get("days") || "30", 10);

    // 3. Verify family sharing access if different user
    if (storytellerId !== user.id) {
      const { data: hasAccess } = await supabaseAdmin.rpc(
        "has_collaboration_access",
        {
          p_user_id: user.id,
          p_storyteller_id: storytellerId,
        }
      );

      if (!hasAccess) {
        return NextResponse.json(
          { error: "Access denied" },
          { status: 403 }
        );
      }
    }

    // 4. Fetch activity events
    const { success, events, error } = await getRecentActivity(storytellerId, {
      limit,
      days,
    });

    if (!success || error) {
      logger.error("[Activity API] Failed to fetch events:", error);
      return NextResponse.json(
        { error: "Failed to fetch activity" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: events });
  } catch (error) {
    logger.error("[Activity API] Exception in GET /api/activity:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/activity
 *
 * Log a new activity event. Used by client-side code to track events
 * like story listening.
 *
 * Request Body:
 * {
 *   eventType: "story_listened" | "story_recorded" | "family_member_joined" | "invite_sent" | "invite_resent";
 *   storytellerId?: string; // Optional, defaults to authenticated user
 *   storyId?: string;
 *   familyMemberId?: string;
 *   metadata?: Record<string, any>;
 * }
 *
 * Returns:
 * {
 *   success: true,
 *   eventId: string
 * }
 */
export async function POST(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_DEBUG === 'true') console.log('[Activity API] POST request received');

  try {
    // 1. Get tokens from HttpOnly cookie (preferred) and Authorization header
    const authHeader = request.headers.get("authorization");
    const headerToken = authHeader && authHeader.split(" ")[1];

    // Get family session token from HttpOnly cookie (security improvement Dec 2024)
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get(FAMILY_SESSION_COOKIE)?.value;

    // Use cookie token for family session, header token for Supabase JWT
    const familySessionToken = cookieToken || headerToken;
    const token = headerToken; // For Supabase JWT auth

    if (process.env.NEXT_PUBLIC_DEBUG === 'true') console.log('[Activity API] Auth token present:', !!(token || familySessionToken));

    if (!token && !familySessionToken) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    let user: any = null;
    let actorUserId: string | null = null;

    // Try Supabase JWT authentication first
    if (token) {
      const {
        data: { user: authUser },
        error: authError,
      } = await supabaseAdmin.auth.getUser(token);

      if (authUser && !authError) {
        // Authenticated as regular user
        user = authUser;
        actorUserId = user.id;
        if (process.env.NEXT_PUBLIC_DEBUG === 'true') console.log('[Activity API] Authenticated as user:', user.id);
      }
    }

    // If no JWT user, try family session token (from cookie or header)
    if (!user && familySessionToken) {
      const { data: familySession, error: sessionError } = await supabaseAdmin
        .from('family_sessions')
        .select(`
          id,
          family_member_id,
          expires_at,
          family_members!inner (
            id,
            user_id,
            email,
            name,
            auth_user_id
          )
        `)
        .eq('token', familySessionToken)
        .single();

      if (sessionError || !familySession) {
        if (process.env.NEXT_PUBLIC_DEBUG === 'true') console.log('[Activity API] Invalid authentication - neither JWT nor family session valid');
        return NextResponse.json(
          { error: "Invalid authentication" },
          { status: 401 }
        );
      }

      // Check if session expired
      if (new Date(familySession.expires_at) < new Date()) {
        if (process.env.NEXT_PUBLIC_DEBUG === 'true') console.log('[Activity API] Family session expired');
        return NextResponse.json(
          { error: "Session expired" },
          { status: 401 }
        );
      }

      // Family member viewing - create a pseudo-user object
      const familyMember = (familySession as any).family_members;
      user = {
        id: familyMember.auth_user_id || familyMember.id, // Use auth_user_id if exists, otherwise family_member.id
        email: familyMember.email,
        name: familyMember.name,
      };
      actorUserId = familyMember.auth_user_id || null; // May be null if family member hasn't created account
      if (process.env.NEXT_PUBLIC_DEBUG === 'true') console.log('[Activity API] Authenticated as family member:', familyMember.id, 'for storyteller:', familyMember.user_id);
    }

    // 2. Parse request body
    const body = await request.json();
    const {
      eventType,
      storytellerId,
      storyId,
      familyMemberId,
      metadata,
    } = body;

    // 3. Validate required fields
    if (!eventType) {
      return NextResponse.json(
        { error: "eventType is required" },
        { status: 400 }
      );
    }

    // Validate event type
    const validEventTypes = [
      "story_listened",
      "story_recorded",
      "family_member_joined",
      "invite_sent",
      "invite_resent",
    ];

    if (!validEventTypes.includes(eventType)) {
      return NextResponse.json(
        { error: `Invalid eventType. Must be one of: ${validEventTypes.join(", ")}` },
        { status: 400 }
      );
    }

    // 4. Determine userId (storyteller)
    const userId = storytellerId || user.id;

    // 5. Verify family sharing access if logging for different user
    // Note: Skip verification for family members (actorUserId is null) as they already have session validation
    if (actorUserId && userId !== actorUserId) {
      const { data: hasAccess } = await supabaseAdmin.rpc(
        "has_collaboration_access",
        {
          p_user_id: actorUserId,
          p_storyteller_id: userId,
        }
      );

      if (!hasAccess) {
        if (process.env.NEXT_PUBLIC_DEBUG === 'true') console.log('[Activity API] Access denied for user:', actorUserId, 'to storyteller:', userId);
        return NextResponse.json(
          { error: "Access denied" },
          { status: 403 }
        );
      }
    }

    // 6. Build payload
    const payload: ActivityEventPayload = {
      userId, // The storyteller (owner of the family circle)
      actorId: actorUserId || undefined, // Current authenticated user (may be null for family members without accounts)
      eventType,
      storyId: storyId || undefined,
      familyMemberId: familyMemberId || undefined,
      metadata: metadata || {},
    };

    if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
      console.log('[Activity API] Logging event:', {
        eventType,
        userId,
        actorId: actorUserId,
        storyId,
      });
    }

    // 7. Log the event
    const { success, eventId, error } = await logActivityEvent(payload);

    if (process.env.NEXT_PUBLIC_DEBUG === 'true') console.log('[Activity API] Log result:', { success, eventId, error });

    if (!success || error) {
      logger.error("[Activity API] Failed to log event:", error);
      return NextResponse.json(
        { error: "Failed to log activity event" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, eventId },
      { status: 201 }
    );
  } catch (error) {
    logger.error("[Activity API] Exception in POST /api/activity:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
