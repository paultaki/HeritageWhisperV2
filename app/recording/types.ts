/**
 * Recording Flow V3 Types
 * Based on heritage-whisper-recorder reference implementation
 * Adapted for HeritageWhisperV2 with backend integration
 */

// Recording modes available to user
export type RecordingMode = "audio" | "text" | "photo_audio";

// Flow steps in state machine
export type FlowStep = "start" | "photoTitle" | "audio" | "text";

// Audio recording internal states
export type RecordingState = "idle" | "recording" | "paused" | "processing";

// Story draft accumulated through the flow
export interface StoryDraft {
  // Required fields
  title: string;

  // Photo fields (single photo MVP)
  photoUrl?: string;  // blob URL for preview
  photoFile?: File;   // actual file for upload
  photoTransform?: { zoom: number; position: { x: number; y: number } }; // zoom/pan transform
  photoWidth?: number;  // original image width for portrait detection
  photoHeight?: number; // original image height for portrait detection

  // Audio fields
  audioBlob?: Blob;
  durationSeconds?: number;

  // Text fields
  textBody?: string;

  // AI-generated fields (added during/after recording)
  transcription?: string;
  lessonOptions?: {
    practical: string;
    emotional: string;
    character: string;
  };

  // Metadata
  recordingMode: RecordingMode;
  storyYear?: string;
  sourcePromptId?: string;
}

// Props for flow orchestrator callbacks
export interface RecordFlowCallbacks {
  onCancel: () => void;
  onComplete: (draft: StoryDraft) => void;
}

// Props for individual screen components
export interface StartStoryScreenProps {
  onSelectMode: (mode: RecordingMode) => void;
  onCancel: () => void;
  promptText?: string | null; // Prompt question from prompts page
  familyFrom?: string | null; // Name of family member who submitted the question
  familyRelationship?: string | null; // Relationship of family member (e.g., "Daughter")
}

export interface PhotoTitleScreenProps {
  draft: Partial<StoryDraft>;
  onChange: (draft: Partial<StoryDraft>) => void;
  onBack: () => void;
  onContinue: () => void;
  onCancel: () => void;
}

export interface AudioRecordingScreenProps {
  draft: Partial<StoryDraft>;
  onChange: (draft: Partial<StoryDraft>) => void;
  onBack: () => void;
  onFinishAndReview: (draft: StoryDraft) => void;
  onSaveForLater?: (draft: Partial<StoryDraft>) => void;
  onSwitchToText: () => void;
  onCancel: () => void;
  /** When true, hides navigation elements for use in modal overlay */
  isOverlayMode?: boolean;
  /** Prompt question text from prompts page */
  promptText?: string | null;
  /** Name of family member who submitted the question */
  familyFrom?: string | null;
  /** Relationship of family member (e.g., "Daughter") */
  familyRelationship?: string | null;
}

export interface TextEntryScreenProps {
  draft: Partial<StoryDraft>;
  onChange: (draft: Partial<StoryDraft>) => void;
  onBack: () => void;
  onSaveStory: (draft: StoryDraft) => void;
  onBackToAudio?: () => void;
}

// NavCache payload for cross-route data transfer
export interface RecordingNavCache {
  audioBlob?: Blob;
  textBody?: string;
  title: string;
  photoUrl?: string;
  photoFile?: File;
  photoTransform?: { zoom: number; position: { x: number; y: number } }; // zoom/pan transform
  photoWidth?: number;  // original image width for portrait detection
  photoHeight?: number; // original image height for portrait detection
  duration?: number;
  transcription?: string;
  lessonOptions?: {
    practical?: string;
    emotional?: string;
    character?: string;
  };
  recordingMode: RecordingMode;
  storyYear?: string;
  sourcePromptId?: string;
  sourcePromptText?: string; // Prompt question text from prompts page
}

// URL params for state persistence
export interface RecordingURLParams {
  step?: FlowStep;
  nav?: string;  // NavCache ID
  prompt?: string;  // Source prompt ID
}
