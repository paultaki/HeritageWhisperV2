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
