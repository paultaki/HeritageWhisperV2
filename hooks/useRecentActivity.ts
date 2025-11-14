/**
 * useRecentActivity Hook
 *
 * Fetches recent activity events for the authenticated storyteller.
 * Used by the Recent Activity card on the Family Circle page.
 */

import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export type ActivityEvent = {
  id: string;
  eventType: "story_listened" | "story_recorded" | "family_member_joined" | "invite_sent" | "invite_resent";
  occurredAt: string;
  actorName?: string;
  storyTitle?: string;
  familyMemberName?: string;
  metadata?: Record<string, any>;
};

export type RecentActivityOptions = {
  storytellerId?: string;
  limit?: number;
  days?: number;
  enabled?: boolean;
};

/**
 * Hook to fetch recent activity events
 *
 * @param options - Query options (storytellerId, limit, days, enabled)
 * @returns TanStack Query result with activity events
 *
 * @example
 * ```typescript
 * const { data: events, isLoading, error } = useRecentActivity({
 *   limit: 8,
 *   days: 30
 * });
 * ```
 */
export function useRecentActivity(options: RecentActivityOptions = {}) {
  const { storytellerId, limit = 8, days = 30, enabled = true } = options;

  return useQuery<ActivityEvent[]>({
    queryKey: ["/api/activity", storytellerId, limit, days],
    queryFn: async () => {
      // Build query parameters
      const params = new URLSearchParams();
      if (storytellerId) params.append("storyteller_id", storytellerId);
      if (limit) params.append("limit", limit.toString());
      if (days) params.append("days", days.toString());

      const url = `/api/activity${params.toString() ? `?${params.toString()}` : ""}`;

      const response = await apiRequest("GET", url);

      if (!response.ok) {
        throw new Error("Failed to fetch recent activity");
      }

      const json = await response.json();
      return json.data || [];
    },
    staleTime: 60_000, // 1 minute
    enabled,
  });
}

/**
 * Format a relative time string from an ISO date
 *
 * @param isoDate - ISO date string
 * @returns Human-friendly relative time (e.g., "today", "yesterday", "3 days ago")
 */
export function getRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      if (diffMinutes < 5) return "just now";
      if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    }
    if (diffHours === 1) return "1 hour ago";
    if (diffHours < 24) return `${diffHours} hours ago`;
    return "today";
  }

  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return "1 week ago";
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 60) return "1 month ago";

  return `${Math.floor(diffDays / 30)} months ago`;
}

/**
 * Format an activity event into a human-readable sentence
 *
 * @param event - The activity event
 * @returns A friendly sentence describing the event
 */
export function formatActivityEvent(event: ActivityEvent): string {
  const timeAgo = getRelativeTime(event.occurredAt);

  switch (event.eventType) {
    case "story_listened":
      if (event.actorName && event.storyTitle) {
        return `${event.actorName} listened to "${event.storyTitle}" ${timeAgo}`;
      }
      if (event.storyTitle) {
        return `Someone listened to "${event.storyTitle}" ${timeAgo}`;
      }
      return `A story was listened to ${timeAgo}`;

    case "story_recorded":
      if (event.storyTitle) {
        return `You recorded a new story: "${event.storyTitle}" ${timeAgo}`;
      }
      return `You recorded a new story ${timeAgo}`;

    case "family_member_joined":
      if (event.familyMemberName) {
        return `${event.familyMemberName} joined your Family Circle ${timeAgo}`;
      }
      if (event.actorName) {
        return `${event.actorName} joined your Family Circle ${timeAgo}`;
      }
      return `A family member joined ${timeAgo}`;

    case "invite_sent":
      if (event.familyMemberName) {
        return `You sent an invitation to ${event.familyMemberName} ${timeAgo}`;
      }
      return `You sent an invitation ${timeAgo}`;

    case "invite_resent":
      if (event.familyMemberName) {
        return `You resent an invitation to ${event.familyMemberName} ${timeAgo}`;
      }
      return `You resent an invitation ${timeAgo}`;

    default:
      return `Activity occurred ${timeAgo}`;
  }
}

/**
 * Calculate summary statistics from activity events
 *
 * @param events - Array of activity events
 * @returns Summary with counts
 */
export function getActivitySummary(events: ActivityEvent[]): {
  uniqueListeners: number;
  storiesListened: number;
  storiesRecorded: number;
  familyMembersJoined: number;
} {
  const uniqueActors = new Set<string>();
  let storiesListened = 0;
  let storiesRecorded = 0;
  let familyMembersJoined = 0;

  events.forEach((event) => {
    if (event.eventType === "story_listened") {
      if (event.actorName) uniqueActors.add(event.actorName);
      storiesListened++;
    } else if (event.eventType === "story_recorded") {
      storiesRecorded++;
    } else if (event.eventType === "family_member_joined") {
      familyMembersJoined++;
    }
  });

  return {
    uniqueListeners: uniqueActors.size,
    storiesListened,
    storiesRecorded,
    familyMembersJoined,
  };
}
