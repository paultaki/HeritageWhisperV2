/**
 * Ghost prompts for new users with no stories yet.
 * These appear on the timeline to guide users through their first recordings.
 */

export interface NewUserGhostPrompt {
  key: string;
  title: string;
  prompt: string;
  offsetYears: number;
}

export const NEW_USER_GHOST_PROMPTS: NewUserGhostPrompt[] = [
  {
    key: "born_year",
    title: "The Year I Was Born",
    prompt: "What's one thing your family always said about your arrival?",
    offsetYears: 0,
  },
  {
    key: "first_place",
    title: "The First Place I Remember",
    prompt: "What room or spot pops into your mind first, and why?",
    offsetYears: 5,
  },
  {
    key: "teacher_changed_me",
    title: "A Teacher Who Changed Me",
    prompt: "What did they say or do that stuck?",
    offsetYears: 14,
  },
  {
    key: "first_job",
    title: "First Job, First Paycheck",
    prompt: "What did you do and what's the first thing you bought?",
    offsetYears: 16,
  },
  {
    key: "risk_i_took",
    title: "A Risk I Took",
    prompt: "What made you say yes when no felt safer?",
    offsetYears: 24,
  },
];

/**
 * Generate ghost prompts for a user based on their birth year
 */
export function generateNewUserGhostPrompts(birthYear: number) {
  return NEW_USER_GHOST_PROMPTS.map((ghost) => ({
    ...ghost,
    year: birthYear + ghost.offsetYears,
    isGhost: true,
    id: `ghost-${ghost.key}`,
  }));
}

/**
 * Determine if ghost prompts should be shown to the user
 * Hide when: user has ANY story OR user has 3+ stories (safety threshold)
 */
export function shouldShowNewUserGhosts(storyCount: number): boolean {
  return storyCount === 0;
}
