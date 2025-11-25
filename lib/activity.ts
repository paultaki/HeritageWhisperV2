/**
 * Activity Event Tracking Helpers
 *
 * Provides server-side helpers for logging user and family activity events
 * that appear in the Recent Activity feed on the Family Circle page.
 */

import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";

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

    // Build insert data with snake_case column names for Supabase
    const insertData = {
      user_id: payload.userId,
      actor_id: payload.actorId || null,
      family_member_id: payload.familyMemberId || null,
      story_id: payload.storyId || null,
      event_type: payload.eventType,
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
    // Note: We need to fetch events first, then manually join related data
    // because actor_id references auth.users which PostgREST can't join directly
    const { data: events, error } = await supabaseAdmin
      .from("activity_events")
      .select("*")
      .eq("user_id", userId)
      .gte("occurred_at", dateThreshold.toISOString())
      .order("occurred_at", { ascending: false })
      .limit(limit);

    if (error) {
      logger.error("[Activity] Failed to fetch events:", error);
      return { success: false, error: error.message };
    }

    if (!events || events.length === 0) {
      return { success: true, events: [] };
    }

    // Collect unique IDs for batch fetching
    const actorIds = new Set<string>();
    const storyIds = new Set<string>();
    const familyMemberIds = new Set<string>();

    events.forEach((event: any) => {
      if (event.actor_id) actorIds.add(event.actor_id);
      if (event.story_id) storyIds.add(event.story_id);
      if (event.family_member_id) familyMemberIds.add(event.family_member_id);
    });

    // Fetch related data in parallel
    const [actorsData, storiesData, familyMembersData] = await Promise.all([
      // Fetch actors (users) with their profiles
      actorIds.size > 0
        ? supabaseAdmin
            .from("users")
            .select("id, email, name")
            .in("id", Array.from(actorIds))
            .then((res) => res.data || [])
        : Promise.resolve([]),

      // Fetch stories
      storyIds.size > 0
        ? supabaseAdmin
            .from("stories")
            .select("id, title")
            .in("id", Array.from(storyIds))
            .then((res) => res.data || [])
        : Promise.resolve([]),

      // Fetch family members
      familyMemberIds.size > 0
        ? supabaseAdmin
            .from("family_members")
            .select("id, email, name")
            .in("id", Array.from(familyMemberIds))
            .then((res) => res.data || [])
        : Promise.resolve([]),
    ]);

    // Create lookup maps
    const actorMap = new Map(actorsData.map((a: any) => [a.id, a]));
    const storyMap = new Map(storiesData.map((s: any) => [s.id, s]));
    const familyMemberMap = new Map(familyMembersData.map((f: any) => [f.id, f]));

    // Transform to DTO format with denormalized names
    const transformedEvents = events.map((event: any) => {
      const actor = event.actor_id ? actorMap.get(event.actor_id) : null;
      const story = event.story_id ? storyMap.get(event.story_id) : null;
      const familyMember = event.family_member_id
        ? familyMemberMap.get(event.family_member_id)
        : null;

      return {
        id: event.id,
        eventType: event.event_type,
        occurredAt: event.occurred_at,
        actorName: actor?.name || actor?.email || undefined,
        storyTitle: story?.title || undefined,
        familyMemberName: familyMember?.name || familyMember?.email || undefined,
        metadata: event.metadata || {},
      };
    });

    return { success: true, events: transformedEvents };
  } catch (error) {
    logger.error("[Activity] Exception fetching events:", error);
    return { success: false, error: "Internal error fetching activity" };
  }
}
