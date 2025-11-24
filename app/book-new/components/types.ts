import { Story } from "@/shared/schema";

/**
 * Book story type - extends Story with required fields for book display
 */
export interface BookStory extends Story {
  storyYear: number;
  transcription: string;
  lifeAge?: number;
  photoTransform?: {
    zoom: number;
    position: { x: number; y: number };
  };
  // Ensure these are present as they are returned by API
}

/**
 * Decade group for table of contents organization
 */
export interface DecadeGroup {
  decade: string; // e.g., "1940s", "1950s"
  stories: BookStory[];
}

/**
 * Audio player state
 */
export interface AudioPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isDragging: boolean;
}

/**
 * Page navigation state
 */
export interface PageNavigationState {
  currentIndex: number;
  totalPages: number;
  canGoPrevious: boolean;
  canGoNext: boolean;
}

/**
 * Props for MobileBookViewV2 component
 */
export interface MobileBookViewV2Props {
  initialStoryId?: string; // Optional story ID to jump to on load
  caveatFont?: string; // Handwritten font class name
}

/**
 * Props for BookPageCard component
 */
export interface BookPageCardProps {
  story: BookStory;
  isActive: boolean;
  caveatFont?: string; // Handwritten font class name
}

/**
 * Props for BookAudioPlayer component
 */
export interface BookAudioPlayerProps {
  audioUrl: string;
  onPlayStateChange?: (isPlaying: boolean) => void;
}

/**
 * Props for BookTableOfContents component
 */
export interface BookTableOfContentsProps {
  stories: BookStory[];
  chapters?: Array<{ id: string; title: string; orderIndex: number }>;
  isOpen: boolean;
  onClose: () => void;
  onStorySelect: (storyId: string) => void;
  viewMode?: 'chronological' | 'chapters';
  onViewModeChange?: (mode: 'chronological' | 'chapters') => void;
}

/**
 * Props for BookTopBar component
 */
export interface BookTopBarProps {
  bookTitle: string;
  userInitials: string;
  onTimelineClick: () => void;
  onEditClick: () => void;
  onTocClick: () => void;
  viewMode?: 'chronological' | 'chapters';
  onViewModeChange?: (mode: 'chronological' | 'chapters') => void;
}

/**
 * Props for NavigationArrows component
 */
export interface NavigationArrowsProps {
  canGoPrevious: boolean;
  canGoNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

/**
 * Mobile book page types - union of all possible page types in the book
 */
export type MobileBookPage =
  | { type: "cover"; userName: string; storyCount: number }
  | { type: "intro" }
  | { type: "toc"; stories: BookStory[] }
  | { type: "decade"; decade: string; title: string; count: number; isChapter?: boolean }
  | { type: "story"; story: BookStory };

/**
 * Props for BookPageRenderer component
 */
export interface BookPageRendererProps {
  page: MobileBookPage;
  isActive: boolean;
  caveatFont?: string;
}
