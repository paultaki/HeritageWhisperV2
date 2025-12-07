/**
 * Timeline Gap Detection for Memory Archaeology
 *
 * Analyzes user's stories to identify life phases with no memories recorded.
 * Used by Tier 3 analysis to generate timeline-gap prompts.
 *
 * Based on cognitive psychology: People often have stories from certain periods
 * but not others. Asking specifically about missing phases can unlock forgotten memories.
 */

import { logger } from "./logger";

interface Story {
  id: string;
  story_year?: number | null;
  transcription?: string;
  created_at: string;
}

interface TimelineGap {
  phase: string;
  ageRange: [number, number];
  estimatedYears: string;
  suggestedPrompt: string;
  priority: number; // 1-5, higher = more likely to have stories
}

interface TimelineCoverage {
  coveredPhases: string[];
  gaps: TimelineGap[];
  oldestStoryYear: number | null;
  newestStoryYear: number | null;
  estimatedBirthYear: number | null;
}

/**
 * Life phases with typical ages and suggested prompts
 */
const LIFE_PHASES = [
  {
    name: "Early Childhood",
    ageRange: [0, 6] as [number, number],
    priority: 3,
    prompts: [
      "What's your earliest memory? Where were you?",
      "What did your childhood home look like?",
      "Who was your first best friend?",
    ],
  },
  {
    name: "Childhood",
    ageRange: [7, 12] as [number, number],
    priority: 4,
    prompts: [
      "What games did you play in your neighborhood?",
      "What was your favorite thing to do after school?",
      "Who was your favorite teacher and why?",
    ],
  },
  {
    name: "Teenage Years",
    ageRange: [13, 19] as [number, number],
    priority: 5,
    prompts: [
      "What was high school like for you?",
      "What did you do on weekend nights as a teenager?",
      "What was your first job?",
    ],
  },
  {
    name: "Early 20s",
    ageRange: [20, 25] as [number, number],
    priority: 5,
    prompts: [
      "Where were you living when you turned 21?",
      "What was your first apartment like?",
      "Who were your closest friends in your early 20s?",
    ],
  },
  {
    name: "Late 20s",
    ageRange: [26, 30] as [number, number],
    priority: 4,
    prompts: [
      "What were you doing for work in your late 20s?",
      "Where were you living when you turned 30?",
      "What was a big decision you made in your late 20s?",
    ],
  },
  {
    name: "Early 30s",
    ageRange: [31, 35] as [number, number],
    priority: 4,
    prompts: [
      "What was life like when you were in your early 30s?",
      "Where were you living during your early 30s?",
      "What were your biggest responsibilities then?",
    ],
  },
  {
    name: "Late 30s",
    ageRange: [36, 40] as [number, number],
    priority: 3,
    prompts: [
      "What was happening in your life as you approached 40?",
      "What did you do for your 40th birthday?",
      "What were you proud of accomplishing by then?",
    ],
  },
  {
    name: "40s",
    ageRange: [41, 50] as [number, number],
    priority: 3,
    prompts: [
      "What was your 40s like compared to your 30s?",
      "What was a typical day like in your 40s?",
      "What changed for you during your 40s?",
    ],
  },
  {
    name: "50s",
    ageRange: [51, 60] as [number, number],
    priority: 3,
    prompts: [
      "What was life like in your 50s?",
      "What were you doing for work during your 50s?",
      "What did you do when you turned 50?",
    ],
  },
  {
    name: "60s",
    ageRange: [61, 70] as [number, number],
    priority: 2,
    prompts: [
      "What was retirement like? Or what kept you busy?",
      "What hobbies did you pick up in your 60s?",
      "What did you enjoy most about your 60s?",
    ],
  },
  {
    name: "70s and beyond",
    ageRange: [71, 100] as [number, number],
    priority: 2,
    prompts: [
      "What wisdom would you share with your younger self?",
      "What are you most grateful for looking back?",
      "What traditions have you passed down?",
    ],
  },
];

/**
 * Estimate birth year from stories
 *
 * Uses the oldest story year and makes educated guesses about age at that time.
 * Falls back to current year minus 75 if no stories have years.
 */
function estimateBirthYear(stories: Story[]): number | null {
  const storyYears = stories
    .map((s) => s.story_year)
    .filter((y): y is number => y !== null && y !== undefined)
    .sort((a, b) => a - b);

  if (storyYears.length === 0) {
    return null;
  }

  // Look at the oldest story - assume they were at least 5 years old
  const oldestYear = storyYears[0];
  const newestYear = storyYears[storyYears.length - 1];

  // If the span is large (>40 years), we can make better estimates
  const yearSpan = newestYear - oldestYear;

  if (yearSpan > 40) {
    // Assume oldest story was from childhood (age ~10)
    return oldestYear - 10;
  } else if (yearSpan > 20) {
    // Assume oldest story was from early adulthood (age ~25)
    return oldestYear - 25;
  } else {
    // Not enough data - assume oldest story was around age 30
    return oldestYear - 30;
  }
}

/**
 * Detect timeline gaps in user's stories
 *
 * @param stories - All stories with optional story_year
 * @param userBirthYear - Known birth year (optional, will estimate if not provided)
 * @returns Timeline coverage analysis with gaps
 */
export function detectTimelineGaps(
  stories: Story[],
  userBirthYear?: number | null
): TimelineCoverage {
  // Get all years from stories
  const storyYears = stories
    .map((s) => s.story_year)
    .filter((y): y is number => y !== null && y !== undefined)
    .sort((a, b) => a - b);

  const oldestStoryYear = storyYears.length > 0 ? storyYears[0] : null;
  const newestStoryYear =
    storyYears.length > 0 ? storyYears[storyYears.length - 1] : null;

  // Estimate birth year if not provided
  const birthYear = userBirthYear ?? estimateBirthYear(stories);

  if (!birthYear) {
    logger.debug("[Timeline] Cannot detect gaps - no birth year or story years");
    return {
      coveredPhases: [],
      gaps: [],
      oldestStoryYear,
      newestStoryYear,
      estimatedBirthYear: null,
    };
  }

  const currentYear = new Date().getFullYear();
  const currentAge = currentYear - birthYear;

  const coveredPhases: string[] = [];
  const gaps: TimelineGap[] = [];

  for (const phase of LIFE_PHASES) {
    // Skip phases that haven't happened yet
    if (phase.ageRange[0] > currentAge) {
      continue;
    }

    const phaseStart = birthYear + phase.ageRange[0];
    const phaseEnd = Math.min(birthYear + phase.ageRange[1], currentYear);

    // Check if any stories fall within this phase
    const hasStoriesInPhase = storyYears.some(
      (year) => year >= phaseStart && year <= phaseEnd
    );

    if (hasStoriesInPhase) {
      coveredPhases.push(phase.name);
    } else {
      // Pick a random prompt for this phase
      const suggestedPrompt =
        phase.prompts[Math.floor(Math.random() * phase.prompts.length)];

      gaps.push({
        phase: phase.name,
        ageRange: phase.ageRange,
        estimatedYears: `${phaseStart}-${phaseEnd}`,
        suggestedPrompt,
        priority: phase.priority,
      });
    }
  }

  // Sort gaps by priority (highest first)
  gaps.sort((a, b) => b.priority - a.priority);

  logger.debug("[Timeline] Analysis complete:", {
    coveredPhases,
    gapCount: gaps.length,
    birthYear,
    currentAge,
  });

  return {
    coveredPhases,
    gaps,
    oldestStoryYear,
    newestStoryYear,
    estimatedBirthYear: birthYear,
  };
}

/**
 * Generate a context-aware gap prompt
 *
 * Uses information from existing stories to make the gap prompt more relevant.
 *
 * @param gap - The timeline gap to prompt about
 * @param existingEntities - People, places mentioned in other stories
 * @returns A personalized prompt for this gap
 */
export function generateGapPrompt(
  gap: TimelineGap,
  existingEntities?: { people?: string[]; places?: string[] }
): string {
  // If we have context, try to make the prompt more personal
  if (existingEntities?.places && existingEntities.places.length > 0) {
    const place = existingEntities.places[0];
    switch (gap.phase) {
      case "Early Childhood":
        return `You mentioned ${place}. What's your earliest memory of being there?`;
      case "Teenage Years":
        return `Were you still near ${place} as a teenager? What was that like?`;
      default:
        break;
    }
  }

  if (existingEntities?.people && existingEntities.people.length > 0) {
    const person = existingEntities.people[0];
    switch (gap.phase) {
      case "Early Childhood":
        return `What's your earliest memory of ${person}?`;
      case "Childhood":
        return `What was ${person} like when you were a kid?`;
      case "Teenage Years":
        return `How did your relationship with ${person} change in your teenage years?`;
      default:
        break;
    }
  }

  // Fall back to generic phase prompt
  return gap.suggestedPrompt;
}

/**
 * Get the highest priority gap for prompting
 */
export function getTopGap(coverage: TimelineCoverage): TimelineGap | null {
  if (coverage.gaps.length === 0) {
    return null;
  }
  return coverage.gaps[0]; // Already sorted by priority
}

/**
 * Format gaps for GPT context
 */
export function formatGapsForContext(coverage: TimelineCoverage): string {
  if (coverage.gaps.length === 0) {
    return "No major timeline gaps detected.";
  }

  const gapList = coverage.gaps
    .slice(0, 3) // Top 3 gaps
    .map((g) => `${g.phase} (${g.estimatedYears})`)
    .join(", ");

  return `Missing stories from: ${gapList}`;
}

export type { TimelineGap, TimelineCoverage, Story as TimelineStory };
