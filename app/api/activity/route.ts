/**
 * Activity Events API
 *
 * GET  /api/activity - Fetch recent activity events for the authenticated user
 * POST /api/activity - Log a new activity event (client-side events like story listening)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";
import { getRecentActivity, logActivityEvent, type ActivityEventPayload } from "@/lib/activity";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

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
    if (userId !== user.id) {
      const { data: hasAccess } = await supabaseAdmin.rpc(
        "has_collaboration_access",
        {
          p_user_id: user.id,
          p_storyteller_id: userId,
        }
      );

      if (!hasAccess) {
        return NextResponse.json(
          { error: "Access denied" },
          { status: 403 }
        );
      }
    }

    // 6. Build payload
    const payload: ActivityEventPayload = {
      userId, // The storyteller (owner of the family circle)
      actorId: user.id, // Current authenticated user
      eventType,
      storyId: storyId || undefined,
      familyMemberId: familyMemberId || undefined,
      metadata: metadata || {},
    };

    // 7. Log the event
    const { success, eventId, error } = await logActivityEvent(payload);

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
