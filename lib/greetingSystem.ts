/**
 * Conversational Greeting System
 * 
 * Creates time-aware, personalized greetings that make users feel welcomed
 * and acknowledged. Integrates with prompt system to provide gentle nudges.
 * 
 * Key principles:
 * - Feel like a caring friend, not a robot
 * - Reference recent activity when relevant
 * - Never repeat the same greeting twice in a row
 * - Celebrate milestones organically
 */

interface UserContext {
  name?: string;
  lastVisit?: Date;
  lastStoryTopic?: string;
  lastStoryEmotion?: string;
  storyCount: number;
  lastPromptShown?: string;
  sessionsToday: number;
  hasActivePrompts: boolean;
}

interface Greeting {
  salutation: string;
  continuation: string;
  nudge?: string;
  full: string;
}

/**
 * Get time-aware salutation based on hour of day
 */
function getTimeAwareSalutation(name?: string): string {
  const hour = new Date().getHours();
  const userName = name ? `, ${name}` : "";
  
  if (hour >= 5 && hour < 12) return `Good morning${userName}`;
  if (hour >= 12 && hour < 17) return `Good afternoon${userName}`;
  if (hour >= 17 && hour < 21) return `Good evening${userName}`;
  return `Hi${userName}`; // Night hours - softer
}

/**
 * Get continuation phrase based on user context
 */
function getContinuation(context: UserContext): string {
  const { lastVisit, storyCount, sessionsToday, lastStoryTopic } = context;
  
  // First story ever
  if (storyCount === 0) {
    return "Ready to share your first story?";
  }
  
  // Returning same day
  if (sessionsToday > 1 && lastVisit) {
    const hoursSince = (Date.now() - lastVisit.getTime()) / (1000 * 60 * 60);
    if (hoursSince < 2) {
      return "Back to share more? I'm listening.";
    }
  }
  
  // Just started (1-2 stories)
  if (storyCount >= 1 && storyCount <= 2) {
    return "You've made a great start.";
  }
  
  // After a break (3+ days)
  if (lastVisit) {
    const daysSince = (Date.now() - lastVisit.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince >= 3 && lastStoryTopic) {
      return `I've been thinking about your story about ${lastStoryTopic}.`;
    }
    if (daysSince >= 7) {
      return "Your stories about the past really stuck with me.";
    }
  }
  
  // Regular return (next day)
  return "Good to see you again.";
}

/**
 * Get gentle nudge/question based on context
 */
function getNudge(context: UserContext): string | undefined {
  const { storyCount, hasActivePrompts } = context;
  
  // Milestone celebrations
  if (storyCount === 3) {
    return "Three stories in. You're building something special here.";
  }
  if (storyCount === 10) {
    return "Ten stories! Your family will treasure these.";
  }
  if (storyCount === 25) {
    return "Twenty-five memories preserved. You're creating a real legacy.";
  }
  
  // Has active prompts - encourage them
  if (hasActivePrompts) {
    return "I have a question based on what you've shared. Ready?";
  }
  
  // General encouragement
  if (storyCount >= 5) {
    return "What story wants to be told today?";
  }
  
  return undefined;
}

/**
 * Generate full greeting with proper formatting
 */
export function generateGreeting(context: UserContext): Greeting {
  const salutation = getTimeAwareSalutation(context.name);
  const continuation = getContinuation(context);
  const nudge = getNudge(context);
  
  // Build full greeting
  let full = `${salutation}. ${continuation}`;
  if (nudge) {
    full += ` ${nudge}`;
  }
  
  return {
    salutation,
    continuation,
    nudge,
    full,
  };
}

/**
 * Track greeting history to prevent repeats
 */
const greetingHistory: Map<string, string[]> = new Map();
const MAX_HISTORY = 5;

export function recordGreeting(userId: string, greeting: string): void {
  const history = greetingHistory.get(userId) || [];
  history.push(greeting);
  
  // Keep only last 5 greetings
  if (history.length > MAX_HISTORY) {
    history.shift();
  }
  
  greetingHistory.set(userId, history);
}

export function hasSeenGreeting(userId: string, greeting: string): boolean {
  const history = greetingHistory.get(userId) || [];
  return history.includes(greeting);
}

/**
 * Get user context from database/session
 * This would be called by the API endpoint
 */
export async function getUserContext(
  supabase: any,
  userId: string,
): Promise<UserContext> {
  // Fetch user data
  const { data: user } = await supabase
    .from("users")
    .select("name, story_count")
    .eq("id", userId)
    .single();
  
  // Fetch recent story for context
  const { data: recentStory } = await supabase
    .from("stories")
    .select("title, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  
  // Check for active prompts
  const { data: activePrompts } = await supabase
    .from("active_prompts")
    .select("id")
    .eq("user_id", userId)
    .eq("is_locked", false)
    .gt("expires_at", new Date().toISOString())
    .limit(1);
  
  return {
    name: user?.name,
    storyCount: user?.story_count || 0,
    lastVisit: recentStory?.created_at ? new Date(recentStory.created_at) : undefined,
    lastStoryTopic: recentStory?.title,
    sessionsToday: 1, // TODO: Track this in session storage
    hasActivePrompts: (activePrompts?.length || 0) > 0,
  };
}
