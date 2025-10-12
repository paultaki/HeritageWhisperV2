/**
 * Prompt Rotation System
 * 
 * Ensures users never see the same prompt in multiple locations.
 * Respects dismissals for 24 hours.
 * Location-aware prompt selection.
 */

interface PromptShown {
  id: string;
  location: 'timeline' | 'book' | 'library';
  timestamp: number;
}

const DISMISSAL_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const RECENTLY_SHOWN_WINDOW = 60 * 60 * 1000; // 1 hour

/**
 * Get recently shown prompts across all locations
 */
export function getRecentlyShown(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  
  const shown = new Set<string>();
  const now = Date.now();
  
  // Check all locations
  ['timeline', 'book', 'library'].forEach(location => {
    const key = `prompt_shown_${location}`;
    const stored = localStorage.getItem(key);
    
    if (stored) {
      try {
        const data: PromptShown = JSON.parse(stored);
        // Only consider prompts shown in the last hour
        if (now - data.timestamp < RECENTLY_SHOWN_WINDOW) {
          shown.add(data.id);
        }
      } catch (e) {
        // Invalid data, remove it
        localStorage.removeItem(key);
      }
    }
  });
  
  return shown;
}

/**
 * Get dismissed prompts (within 24 hours)
 */
export function getDismissedPrompts(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  
  const dismissed = new Set<string>();
  const now = Date.now();
  const stored = localStorage.getItem('prompts_dismissed');
  
  if (stored) {
    try {
      const data: Array<{ id: string; timestamp: number }> = JSON.parse(stored);
      // Filter out expired dismissals and return active ones
      const active = data.filter(d => now - d.timestamp < DISMISSAL_DURATION);
      
      // Update storage with only active dismissals
      localStorage.setItem('prompts_dismissed', JSON.stringify(active));
      
      active.forEach(d => dismissed.add(d.id));
    } catch (e) {
      localStorage.removeItem('prompts_dismissed');
    }
  }
  
  return dismissed;
}

/**
 * Mark a prompt as shown in a specific location
 */
export function markPromptShown(promptId: string, location: 'timeline' | 'book' | 'library'): void {
  if (typeof window === 'undefined') return;
  
  const data: PromptShown = {
    id: promptId,
    location,
    timestamp: Date.now(),
  };
  
  localStorage.setItem(`prompt_shown_${location}`, JSON.stringify(data));
}

/**
 * Dismiss a prompt for 24 hours (across all locations)
 */
export function dismissPrompt(promptId: string): void {
  if (typeof window === 'undefined') return;
  
  const stored = localStorage.getItem('prompts_dismissed');
  let dismissed: Array<{ id: string; timestamp: number }> = [];
  
  if (stored) {
    try {
      dismissed = JSON.parse(stored);
    } catch (e) {
      // Start fresh if data is corrupted
    }
  }
  
  // Add new dismissal
  dismissed.push({
    id: promptId,
    timestamp: Date.now(),
  });
  
  localStorage.setItem('prompts_dismissed', JSON.stringify(dismissed));
}

/**
 * Restore a dismissed prompt
 */
export function restorePrompt(promptId: string): void {
  if (typeof window === 'undefined') return;
  
  const stored = localStorage.getItem('prompts_dismissed');
  if (!stored) return;
  
  try {
    const dismissed: Array<{ id: string; timestamp: number }> = JSON.parse(stored);
    const filtered = dismissed.filter(d => d.id !== promptId);
    localStorage.setItem('prompts_dismissed', JSON.stringify(filtered));
  } catch (e) {
    localStorage.removeItem('prompts_dismissed');
  }
}

/**
 * Get next prompt for a specific location
 * Filters out recently shown and dismissed prompts
 */
export function getNextPromptForLocation<T extends { id: string }>(
  allPrompts: T[],
  location: 'timeline' | 'book' | 'library'
): T | null {
  if (allPrompts.length === 0) return null;
  
  const recentlyShown = getRecentlyShown();
  const dismissed = getDismissedPrompts();
  
  // Filter out shown and dismissed prompts
  const available = allPrompts.filter(
    p => !recentlyShown.has(p.id) && !dismissed.has(p.id)
  );
  
  if (available.length === 0) {
    // If no prompts available, don't show anything
    // Better to show nothing than repeat
    return null;
  }
  
  // Select prompt based on location index
  // This ensures different locations get different prompts
  const locationIndex = { timeline: 0, book: 1, library: 2 }[location];
  const selected = available[locationIndex % available.length];
  
  // Mark as shown
  markPromptShown(selected.id, location);
  
  return selected;
}

/**
 * Check if a prompt has been dismissed
 */
export function isPromptDismissed(promptId: string): boolean {
  const dismissed = getDismissedPrompts();
  return dismissed.has(promptId);
}

/**
 * Clear all rotation state (for testing/debugging)
 */
export function clearPromptRotation(): void {
  if (typeof window === 'undefined') return;
  
  ['timeline', 'book', 'library'].forEach(location => {
    localStorage.removeItem(`prompt_shown_${location}`);
  });
  localStorage.removeItem('prompts_dismissed');
}
