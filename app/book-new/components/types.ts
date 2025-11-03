import { Story } from "@/shared/schema";

/**
 * Book story type - extends Story with required fields for book display
 */
export interface BookStory extends Story {
  storyYear: number;
  transcription: string;
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
  isOpen: boolean;
  onClose: () => void;
  onStorySelect: (storyId: string) => void;
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
