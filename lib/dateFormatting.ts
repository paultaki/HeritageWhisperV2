/**
 * Date formatting utilities for stories
 * Handles displaying full dates (with month/day) or just years
 */

/**
 * Format a story date for display
 * @param storyDate - ISO date string (e.g., "1985-06-15T00:00:00.000Z")
 * @param storyYear - Fallback year number if no full date
 * @param format - Display format: "full" (June 15, 1985), "short" (Jun 15, 1985), "badge" (Jun '85), "year-only" (1985)
 * @returns Formatted date string
 */
export function formatStoryDate(
  storyDate: string | null | undefined,
  storyYear: number | null | undefined,
  format: "full" | "short" | "badge" | "year-only" = "full"
): string {
  // If we have a full date, use it
  if (storyDate) {
    try {
      const date = new Date(storyDate);

      // Validate that it's a real date
      if (isNaN(date.getTime())) {
        // Fall back to year only
        return storyYear ? storyYear.toString() : "Unknown";
      }

      switch (format) {
        case "full":
          // "June 15, 1985"
          return date.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          });

        case "short":
          // "Jun 15, 1985"
          return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          });

        case "badge":
          // "Jun '85" - compact for badges
          return date.toLocaleDateString("en-US", {
            month: "short",
            year: "2-digit",
          }).replace(" ", " '");

        case "year-only":
          // "1985" - just extract year from date
          return date.getFullYear().toString();

        default:
          return date.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          });
      }
    } catch (error) {
      console.error("Error formatting story date:", error);
      // Fall through to year-only fallback
    }
  }

  // Fallback to just year if no full date
  if (storyYear !== null && storyYear !== undefined) {
    return storyYear.toString();
  }

  return "Unknown";
}

/**
 * Check if a story has a full date (month and day) or just a year
 * @param storyDate - ISO date string
 * @returns true if story has month/day information
 */
export function hasFullDate(storyDate: string | null | undefined): boolean {
  if (!storyDate) return false;

  try {
    const date = new Date(storyDate);
    // Check if it's a valid date and not just January 1st (which might be a year-only placeholder)
    return !isNaN(date.getTime());
  } catch {
    return false;
  }
}

/**
 * Format a story date for metadata display (compact format with month abbreviation)
 * Examples: "Jun 1985", "1985"
 * @param storyDate - ISO date string
 * @param storyYear - Fallback year number
 * @returns Formatted date string for metadata
 */
export function formatStoryDateForMetadata(
  storyDate: string | null | undefined,
  storyYear: number | null | undefined
): string {
  if (storyDate && hasFullDate(storyDate)) {
    try {
      const date = new Date(storyDate);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      // Fall through to year-only
    }
  }

  return storyYear ? storyYear.toString() : "Unknown";
}

/**
 * Extract season from a date
 * @param date - Date object or ISO string
 * @returns Season name (Spring, Summer, Fall, Winter) or null
 */
export function getSeason(date: Date | string | null | undefined): string | null {
  if (!date) return null;

  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return null;

    const month = d.getMonth(); // 0-11

    // Spring: March(2), April(3), May(4)
    if (month >= 2 && month <= 4) return "Spring";
    // Summer: June(5), July(6), August(7)
    if (month >= 5 && month <= 7) return "Summer";
    // Fall: September(8), October(9), November(10)
    if (month >= 8 && month <= 10) return "Fall";
    // Winter: December(11), January(0), February(1)
    return "Winter";
  } catch {
    return null;
  }
}

/**
 * Format date for V2 Timeline: "Age X • Season Year"
 * Examples: "Age 7 • Summer 1962", "Age 25 • 1980" (if no season data)
 * @param storyDate - ISO date string
 * @param storyYear - Year number
 * @param birthYear - User's birth year for age calculation
 * @returns Formatted string for V2 timeline
 */
export function formatV2TimelineDate(
  storyDate: string | null | undefined,
  storyYear: number | null | undefined,
  birthYear: number | null | undefined
): string {
  // Calculate age
  let age: number | null = null;
  if (storyYear && birthYear) {
    age = storyYear - birthYear;
  }

  // Get season (if full date available)
  const season = storyDate ? getSeason(storyDate) : null;

  // Build format: "Age X • Season Year" or "Age X • Year"
  const agePart = age !== null && age !== undefined
    ? age > 0
      ? `Age ${age}`
      : age === 0
        ? "Birth"
        : "Before birth"
    : "";

  const yearPart = season && storyYear
    ? `${season} ${storyYear}`
    : storyYear
      ? storyYear.toString()
      : "Unknown";

  return agePart ? `${agePart} • ${yearPart}` : yearPart;
}
