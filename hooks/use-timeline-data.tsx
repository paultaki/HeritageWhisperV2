/**
 * useTimelineData Hook
 *
 * Manages all data fetching, processing, and transformation for the timeline view.
 *
 * Responsibilities:
 * - Fetching stories via TanStack Query
 * - Ghost prompt generation for new users
 * - Story filtering (includeInTimeline)
 * - Decade grouping and calculations
 * - Birth year and pre-birth story filtering
 * - Timeline item generation for rendering
 *
 * Created: January 25, 2025
 * Extracted from: TimelineMobile.tsx lines 912-1363
 */

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useMemo, useEffect } from "react";
import { groupStoriesByDecade, type Story } from "@/lib/supabase";
import {
  generateGhostPrompts,
  mergeGhostPromptsWithStories,
  type GhostPrompt,
} from "@/lib/ghostPrompts";
import {
  generateNewUserGhostPrompts,
  shouldShowNewUserGhosts,
} from "@/lib/newUserGhostPrompts";
import { normalizeYear, formatYear } from "@/lib/utils";
import type {
  UseTimelineDataReturn,
  DecadeEntry,
  TimelineItem,
} from "@/types/timeline";

export interface UseTimelineDataOptions {
  user: any;
  session: any;
}

/**
 * useTimelineData
 *
 * Hook for managing timeline data fetching and processing
 */
export function useTimelineData({
  user,
  session,
}: UseTimelineDataOptions): UseTimelineDataReturn {
  // ==================================================================================
  // Data Fetching (TanStack Query)
  // ==================================================================================

  const {
    data: storiesData,
    refetch: refetchStories,
    isLoading: isLoadingStories,
  } = useQuery({
    queryKey: ["/api/stories"],
    enabled: !!user && !!session,
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    gcTime: 1000 * 60 * 10, // Keep in cache for 10 minutes even when unmounted
    refetchOnWindowFocus: true, // Refetch when window regains focus
    placeholderData: keepPreviousData, // Keep showing old data while refetching
  });

  // Refetch stories when user and session are available (e.g., after login)
  useEffect(() => {
    if (user && session) {
      refetchStories();
    }
  }, [user, session, refetchStories]);

  // ==================================================================================
  // Data Processing (useMemo hooks for performance)
  // ==================================================================================

  // Extract all stories from API response
  const allStories = useMemo(() => {
    return (storiesData as any)?.stories || [];
  }, [storiesData]);

  // Filter to only show stories marked for timeline
  const stories = useMemo(() => {
    return allStories.filter((s: any) => s.includeInTimeline === true);
  }, [allStories]);

  // Generate ghost prompts based on user's TOTAL story count (not just timeline)
  const ghostPrompts = useMemo(() => {
    if (!user) return [];
    if (shouldShowNewUserGhosts(allStories.length)) {
      // New user with 0 stories: show onboarding ghost prompts
      return generateNewUserGhostPrompts(user.birthYear);
    } else if (allStories.length < 3) {
      // Existing user with 1-2 stories: show contextual ghost prompts
      return generateGhostPrompts(user.birthYear);
    }
    return [];
  }, [allStories.length, user]);

  // Merge ghost prompts with stories
  const storiesWithGhostPrompts = useMemo(() => {
    return mergeGhostPromptsWithStories(stories, ghostPrompts as GhostPrompt[]);
  }, [stories, ghostPrompts]);

  // Group all items (stories + ghost prompts) by decade
  const decadeGroups = useMemo(() => {
    if (!user) return [];
    return groupStoriesByDecade(storiesWithGhostPrompts, user.birthYear);
  }, [storiesWithGhostPrompts, user]);

  // Calculate birth year values
  const cleanBirthYear = useMemo(
    () => (user ? formatYear(user.birthYear) : ""),
    [user],
  );
  const normalizedBirthYear = useMemo(
    () => (user ? normalizeYear(user.birthYear) : 0),
    [user],
  );

  // Filter birth year stories
  const birthYearStories = useMemo(() => {
    return stories.filter((s: any) => {
      const normalizedStoryYear = normalizeYear(s.storyYear);
      return (
        normalizedStoryYear !== null &&
        normalizedBirthYear !== null &&
        normalizedStoryYear === normalizedBirthYear
      );
    });
  }, [stories, normalizedBirthYear]);

  // Filter pre-birth stories for "TOP" marker
  const prebirthStories = useMemo(() => {
    return stories.filter((s: any) => {
      const normalizedStoryYear = normalizeYear(s.storyYear);
      return (
        normalizedStoryYear !== null &&
        normalizedBirthYear !== null &&
        normalizedStoryYear < normalizedBirthYear
      );
    });
  }, [stories, normalizedBirthYear]);

  // Generate timeline items and decade entries
  const { allTimelineItems, decadeEntries } = useMemo(() => {
    if (!user) return { allTimelineItems: [], decadeEntries: [] };

    const items: TimelineItem[] = [];
    const currentYear = new Date().getFullYear();
    const currentDecade = Math.floor(currentYear / 10) * 10;

    // Pre-birth stories section - "Before I Was Born"
    if (prebirthStories.length > 0) {
      const earliestPrebirthYear = Math.min(
        ...prebirthStories.map((s: any) => normalizeYear(s.storyYear)),
      );
      items.push({
        type: "decade",
        id: "before-birth",
        year: earliestPrebirthYear,
        title: "Before I Was Born",
        subtitle: "Family History • Stories of those who came before",
        stories: prebirthStories.sort((a: any, b: any) => {
          return (
            (normalizeYear(a.storyYear) ?? 0) - (normalizeYear(b.storyYear) ?? 0)
          );
        }),
      });
    }

    // Birth year section (always show)
    items.push({
      type: "decade",
      id: "birth-year",
      year: normalizedBirthYear || user.birthYear,
      title: "The Year I was Born",
      subtitle: `${normalizedBirthYear || user.birthYear} • The Beginning`,
      stories: birthYearStories,
    });

    // Add decade groups in chronological order (filtering out pre-birth stories)
    decadeGroups.forEach((group) => {
      // Filter out pre-birth stories from this decade - they're in "Before I Was Born"
      const storiesAfterOrDuringBirth = group.stories.filter((s: any) => {
        const storyYear = normalizeYear(s.storyYear);
        return (
          storyYear !== null &&
          normalizedBirthYear !== null &&
          storyYear >= normalizedBirthYear
        );
      });

      // Only show this decade if it has stories after/during birth
      if (storiesAfterOrDuringBirth.length > 0) {
        const groupDecadeNum = parseInt(group.decade.replace("s", ""));
        const isCurrentDecade = groupDecadeNum === currentDecade;

        // If this decade contains the birth year, sort it AFTER the birth year section
        const birthDecade =
          Math.floor((normalizedBirthYear || user.birthYear) / 10) * 10;
        let sortYear = groupDecadeNum; // Default to decade start

        if (groupDecadeNum === birthDecade) {
          // This decade contains the birth year, filter to only stories AFTER birth year
          const storiesAfterBirth = storiesAfterOrDuringBirth.filter(
            (s: any) => {
              const storyYear = normalizeYear(s.storyYear);
              return (
                storyYear !== null &&
                normalizedBirthYear !== null &&
                storyYear > normalizedBirthYear
              );
            },
          );

          if (storiesAfterBirth.length > 0) {
            // Use the earliest story AFTER birth year for sorting
            const earliestAfterBirth = Math.min(
              ...storiesAfterBirth.map(
                (s: any) => normalizeYear(s.storyYear) ?? 0,
              ),
            );
            sortYear = earliestAfterBirth;
          } else {
            // No stories after birth in this decade - sort right after birth year
            sortYear = (normalizedBirthYear ?? 0) + 1;
          }
        }

        items.push({
          type: "decade",
          id: group.decade,
          year: sortYear,
          title: group.displayName,
          subtitle: `${group.ageRange} • Life Chapter${isCurrentDecade ? " • Current" : ""}`,
          stories: storiesAfterOrDuringBirth,
          storyCount: storiesAfterOrDuringBirth.length,
        });
      }
    });

    // Sort by year
    items.sort((a, b) => a.year - b.year);

    // Build decade entries for navigation
    const entries: DecadeEntry[] = items.map((item) => ({
      id: item.id,
      label:
        item.id === "before-birth"
          ? "TOP"
          : item.id === "birth-year"
            ? formatYear(user.birthYear)
            : item.id.replace("decade-", "").replace("s", ""),
      count: item.stories?.length || 0,
    }));

    return { allTimelineItems: items, decadeEntries: entries };
  }, [
    stories,
    decadeGroups,
    prebirthStories,
    birthYearStories,
    normalizedBirthYear,
    user,
  ]);

  // ==================================================================================
  // Return hook interface
  // ==================================================================================

  return {
    // Raw data
    stories,
    allStories,
    isLoading: isLoadingStories,
    refetchStories,

    // Processed data
    ghostPrompts: ghostPrompts as GhostPrompt[],
    storiesWithGhostPrompts,
    decadeGroups,

    // Filtered data
    birthYearStories,
    prebirthStories,

    // Timeline items
    allTimelineItems,
    decadeEntries,
  };
}
