/**
 * Activity Event Tracking Helpers
 *
 * Provides server-side helpers for logging user and family activity events
 * that appear in the Recent Activity feed on the Family Circle page.
 */

import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";
import { type InsertActivityEvent } from "@/shared/schema";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export type ActivityEventType =
  | "story_listened"
  | "story_recorded"
  | "family_member_joined"
  | "invite_sent"
  | "invite_resent";

export type ActivityEventPayload = {
  userId: string; // Owner of the family circle (storyteller)
  actorId?: string; // Who performed the action
  familyMemberId?: string; // Related family member
  storyId?: string; // Related story
  eventType: ActivityEventType;
  metadata?: Record<string, any>; // Additional structured data
};

/**
 * Log an activity event to the database
 *
 * @param payload - Event data to log
 * @returns The created activity event or null if failed
 *
 * @example
 * ```typescript
 * // Log a story listening event
 * await logActivityEvent({
 *   userId: storytellerUserId,
 *   actorId: currentUserId,
 *   storyId: storyId,
 *   eventType: "story_listened",
 *   metadata: { duration_seconds: 45 }
 * });
 * ```
 */
export async function logActivityEvent(
  payload: ActivityEventPayload
): Promise<{ success: boolean; eventId?: string; error?: string }> {
  try {
    // Validate required fields
    if (!payload.userId || !payload.eventType) {
      logger.error("[Activity] Missing required fields:", { payload });
      return { success: false, error: "Missing userId or eventType" };
    }

    // Build insert data
    const insertData: InsertActivityEvent = {
      userId: payload.userId,
      actorId: payload.actorId || null,
      familyMemberId: payload.familyMemberId || null,
      storyId: payload.storyId || null,
      eventType: payload.eventType,
      metadata: payload.metadata || {},
    };

    // Insert into database
    const { data, error } = await supabaseAdmin
      .from("activity_events")
      .insert(insertData)
      .select("id")
      .single();

    if (error) {
      logger.error("[Activity] Failed to log event:", { error, payload });
      return { success: false, error: error.message };
    }

    logger.debug("[Activity] Event logged successfully:", {
      eventId: data.id,
      eventType: payload.eventType,
      userId: payload.userId,
    });

    return { success: true, eventId: data.id };
  } catch (error) {
    logger.error("[Activity] Exception logging event:", error);
    return { success: false, error: "Internal error logging activity event" };
  }
}

/**
 * Get recent activity events for a user
 *
 * @param userId - The storyteller's user ID
 * @param options - Query options (limit, days)
 * @returns Array of activity events with denormalized names
 */
export async function getRecentActivity(
  userId: string,
  options: { limit?: number; days?: number } = {}
): Promise<{
  success: boolean;
  events?: Array<{
    id: string;
    eventType: string;
    occurredAt: string;
    actorName?: string;
    storyTitle?: string;
    familyMemberName?: string;
    metadata?: Record<string, any>;
  }>;
  error?: string;
}> {
  try {
    const limit = Math.min(options.limit || 8, 20); // Max 20
    const days = options.days || 30;

    // Calculate date threshold
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    // Fetch events with related data
    const { data, error } = await supabaseAdmin
      .from("activity_events")
      .select(
        `
        id,
        event_type,
        occurred_at,
        metadata,
        actor:actor_id (
          email,
          profiles (full_name)
        ),
        story:story_id (
          title
        ),
        family_member:family_member_id (
          email,
          relationship
        )
      `
      )
      .eq("user_id", userId)
      .gte("occurred_at", dateThreshold.toISOString())
      .order("occurred_at", { ascending: false })
      .limit(limit);

    if (error) {
      logger.error("[Activity] Failed to fetch events:", error);
      return { success: false, error: error.message };
    }

    // Transform to DTO format
    const events = data.map((event: any) => ({
      id: event.id,
      eventType: event.event_type,
      occurredAt: event.occurred_at,
      actorName: event.actor?.profiles?.full_name || event.actor?.email || undefined,
      storyTitle: event.story?.title || undefined,
      familyMemberName: event.family_member?.email || undefined,
      metadata: event.metadata || {},
    }));

    return { success: true, events };
  } catch (error) {
    logger.error("[Activity] Exception fetching events:", error);
    return { success: false, error: "Internal error fetching activity" };
  }
}
