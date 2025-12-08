/**
 * Timeline Header State Management
 *
 * Centralized logic for determining what to display in the timeline header
 * based on the viewer's relationship to the storyteller.
 *
 * Created: December 2025
 */

/**
 * Context describing who is viewing the timeline and whose timeline it is.
 * Derived once in the Timeline page and passed to the header component.
 */
export type TimelineViewerContext = {
  /** First name or display name of the storyteller (whose stories these are) */
  storytellerName: string;
  /** Logged-in viewer's first name, or null if anonymous/public share */
  viewerName: string | null;
  /** True if the viewer is the storyteller (viewing their own timeline) */
  viewerIsOwner: boolean;
  /** True for public share links / anonymous viewing */
  isPublicShare: boolean;
  /** Optional: hour 0-23 for time-of-day greeting (client-side only) */
  localHour?: number;
};

/**
 * The three possible viewing modes for the timeline header.
 */
export type TimelineHeaderMode = 'publicShare' | 'owner' | 'viewer';

/**
 * Complete state object for rendering the timeline header.
 * All display logic is resolved here - the component just renders this data.
 */
export type TimelineHeaderState = {
  /** The viewing mode determining header layout */
  mode: TimelineHeaderMode;
  /** Main H1 text (book-cover title for public/viewer, greeting for owner) */
  title: string;
  /** Subtitle shown below title (for public/viewer modes) */
  subtitle?: string;
  /** Time-of-day greeting line (owner mode only) */
  greeting?: string;
  /** Warm subtext under greeting (owner mode only) */
  greetingSubtext?: string;
  /** Context line for authenticated viewers (e.g., "Hi Paul. You're viewing John's journey.") */
  viewerContextLine?: string;
  /** Whether to show the Add Memory button */
  showAddMemoryButton: boolean;
};

/**
 * Greeting content structure returned by getOwnerGreeting.
 */
export type Greeting = {
  greeting: string;
  subtext: string;
};

/**
 * Get a time-of-day appropriate greeting for the owner.
 * Uses deterministic logic based on hour to avoid hydration issues.
 *
 * @param name - The owner's first name
 * @param localHour - Hour 0-23 from client's local time
 * @returns Greeting with main line and warm subtext
 */
export function getOwnerGreeting(name: string, localHour: number): Greeting {
  // Time buckets
  const isMorning = localHour >= 5 && localHour < 12;
  const isAfternoon = localHour >= 12 && localHour < 18;
  const isEvening = localHour >= 18 && localHour < 22;
  // Late night: 22-4

  if (isMorning) {
    return {
      greeting: `Good morning, ${name}.`,
      subtext: 'A quiet morning is a good time to remember.',
    };
  }

  if (isAfternoon) {
    return {
      greeting: `Good afternoon, ${name}.`,
      subtext: "Let's capture one more story while it's fresh.",
    };
  }

  if (isEvening) {
    return {
      greeting: `Good evening, ${name}.`,
      subtext: 'A calm evening is perfect for looking back.',
    };
  }

  // Late night (22-4)
  return {
    greeting: `Still up, ${name}?`,
    subtext: 'Your memories are here whenever you are ready.',
  };
}

/**
 * Get the first name from a full name string.
 * Returns the original string if no space is found.
 */
function getFirstName(fullName: string): string {
  const trimmed = fullName.trim();
  const spaceIndex = trimmed.indexOf(' ');
  return spaceIndex > 0 ? trimmed.substring(0, spaceIndex) : trimmed;
}

/**
 * Derive the complete header state from viewer context.
 * This function centralizes all conditional logic for the header.
 *
 * @param ctx - The viewer context describing who is viewing whose timeline
 * @returns Complete header state for rendering
 */
export function getTimelineHeaderState(ctx: TimelineViewerContext): TimelineHeaderState {
  // Determine mode with simple, readable logic
  let mode: TimelineHeaderMode;
  if (ctx.isPublicShare) {
    mode = 'publicShare';
  } else if (ctx.viewerIsOwner) {
    mode = 'owner';
  } else {
    mode = 'viewer';
  }

  const storytellerFirstName = getFirstName(ctx.storytellerName);
  const viewerFirstName = ctx.viewerName ? getFirstName(ctx.viewerName) : null;

  // Build book-cover title used for public and viewer modes
  const bookCoverTitle = `${storytellerFirstName}'s Journey`;
  const bookCoverSubtitle = `A timeline of memories, moments, and milestones.`;

  // Base state
  const baseState: TimelineHeaderState = {
    mode,
    title: bookCoverTitle,
    subtitle: bookCoverSubtitle,
    showAddMemoryButton: false,
  };

  switch (mode) {
    case 'publicShare':
      // Public share: book-cover header, no greeting, no add button
      return baseState;

    case 'owner': {
      // Owner: hero greeting with time-of-day, add memory button visible
      const hour = ctx.localHour ?? new Date().getHours();
      const { greeting, subtext } = getOwnerGreeting(storytellerFirstName, hour);

      return {
        mode: 'owner',
        title: greeting, // Use greeting as the main title
        greeting,
        greetingSubtext: subtext,
        showAddMemoryButton: true,
      };
    }

    case 'viewer': {
      // Authenticated viewer: context line + book-cover header
      const contextLine = viewerFirstName
        ? `Hi ${viewerFirstName}. You're viewing ${storytellerFirstName}'s journey.`
        : undefined;

      return {
        ...baseState,
        viewerContextLine: contextLine,
        showAddMemoryButton: false, // Viewers can't add memories unless they have contributor permissions
      };
    }

    default:
      return baseState;
  }
}
