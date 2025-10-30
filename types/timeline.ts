/**
 * Timeline Types
 *
 * TypeScript interfaces for the HeritageWhisper timeline system.
 * Supports timeline view, story cards, decade navigation, and related features.
 *
 * Created: January 25, 2025
 * Part of: TimelineMobile refactoring
 */

import { type Story } from "@/lib/supabase";
import { type GhostPrompt } from "@/lib/ghostPrompts";

/** Color scheme options for timeline theming */
export type ColorScheme =
  | "original"
  | "white"
  | "inverted"
  | "soft"
  | "cool"
  | "dark"
  | "retro";

/** Color scheme configuration */
export interface ColorSchemeConfig {
  name: string;
  page: string;
  card: string;
  header: string;
  text: string;
  timelineLine: string;
}

/** Timeline item (decade section with stories) */
export interface TimelineItem {
  id: string;
  type: string;
  year: number;
  title: string;
  subtitle: string;
  stories: Array<Story | GhostPrompt>;
  storyCount?: number;
}

/** Decade group with display metadata */
export interface DecadeGroup {
  decade: string;
  displayName: string;
  ageRange: string;
  stories: Story[];
}

/** Decade navigation entry */
export interface DecadeEntry {
  id: string;
  label: string;
  count: number;
}

// ============================================================
// Hook Return Types
// ============================================================

/** Return type for useTimelineData hook */
export interface UseTimelineDataReturn {
  // Raw data
  stories: Story[];
  allStories: Story[];
  isLoading: boolean;
  refetchStories: () => void;

  // Processed data
  ghostPrompts: GhostPrompt[];
  storiesWithGhostPrompts: Array<Story | GhostPrompt>;
  decadeGroups: DecadeGroup[];

  // Filtered data
  birthYearStories: Story[];
  prebirthStories: Story[];

  // Timeline items
  allTimelineItems: TimelineItem[];
  decadeEntries: DecadeEntry[];
}

/** Return type for useTimelineNavigation hook */
export interface UseTimelineNavigationReturn {
  // State
  activeDecade: string | null;
  highlightedStoryId: string | null;
  returnHighlightId: string | null;

  // Refs
  decadeRefs: React.MutableRefObject<Record<string, HTMLElement | null>>;

  // Actions
  handleDecadeClick: (decadeId: string) => void;
  registerDecadeRef: (decadeId: string, el: HTMLElement | null) => void;
}

/** Return type for useTimelineUI hook */
export interface UseTimelineUIReturn {
  // Color & Theme
  currentColorScheme: ColorScheme;
  isDark: boolean;
  setCurrentColorScheme: (scheme: ColorScheme) => void;

  // Modals & Overlays
  showPaywall: boolean;
  setShowPaywall: (show: boolean) => void;
  overlayOpen: boolean;
  setOverlayOpen: (open: boolean) => void;
  selectedStory: Story | null;
  setSelectedStory: (story: Story | null) => void;
}

// ============================================================
// Component Props
// ============================================================

/** Props for MemoryCard component */
export interface MemoryCardProps {
  story: Story;
  isHighlighted?: boolean;
  isReturnHighlight?: boolean;
  colorScheme?: ColorScheme;
  isDarkTheme?: boolean;
  birthYear: number;
  onOpenOverlay?: (story: Story) => void;
  useV2Features?: boolean; // Enable V2 senior-friendly UX improvements
}

/** Props for TimelineDecadeSection component */
export interface TimelineDecadeSectionProps {
  decadeId: string;
  title: string;
  subtitle: string;
  stories: Array<Story | GhostPrompt>;
  isActive: boolean;
  isDarkTheme: boolean;
  colorScheme: ColorScheme;
  birthYear: number;
  onRegisterRef: (decadeId: string, el: HTMLElement | null) => void;
  onGhostPromptClick: (prompt: GhostPrompt) => void;
  onOpenOverlay: (story: Story) => void;
  highlightedStoryId: string | null;
  returnHighlightId: string | null;
  useV2Features?: boolean; // Enable V2 senior-friendly UX improvements
}

/** Props for TimelineHeader component */
export interface TimelineHeaderProps {
  isDark: boolean;
  currentColorScheme: ColorScheme;
}

/** Props for PaywallModal component */
export interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscribe: () => void;
}
