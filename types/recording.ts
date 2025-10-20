/**
 * Recording Types
 *
 * TypeScript interfaces for the HeritageWhisper recording system.
 * Supports both conversation mode (guided interview) and quick story mode.
 */

import { type StoryPhoto } from "@/components/MultiPhotoUploader";

/** Recording mode: conversation (guided interview) or quick (2-5 min recording) */
export type RecordingMode = "conversation" | "quick";

/** Recorder state machine states */
export type RecorderState = "ready" | "countdown" | "recording" | "paused" | "processing";

/** Question-answer pair from conversation mode */
export interface QAPair {
  question: string;
  answer: string;
  timestamp?: string;
  duration?: number;
}

/** Recording session data (stored in NavCache) */
export interface RecordingSession {
  mode: RecordingMode;
  audioBlob?: Blob;
  duration: number; // in seconds
  timestamp: string; // ISO string
  rawTranscript: string;

  // Quick story mode
  prompt?: string;

  // Conversation mode
  qaPairs?: QAPair[];
}

/** Post-recording wizard data */
export interface PostRecordingData {
  // Step 1: Title & Year
  title: string;
  year?: number;

  // Step 2: Photos
  photos: StoryPhoto[];

  // Step 3: Review
  originalTranscript: string;
  enhancedTranscript: string;
  useEnhanced: boolean;

  // Step 4: Lesson
  lessonLearned: string;

  // Recording metadata
  recording: RecordingSession;

  // User info for age calculation
  userBirthYear?: number;
}

/** Wizard step number (1-4) */
export type WizardStep = 1 | 2 | 3 | 4;

/** Wizard navigation */
export interface WizardNavigation {
  currentStep: WizardStep;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: WizardStep) => void;
  canGoNext: boolean;
  canGoPrev: boolean;
}

/** Wizard state management hook return type */
export interface WizardState extends WizardNavigation {
  data: PostRecordingData;
  updateData: <K extends keyof PostRecordingData>(
    key: K,
    value: PostRecordingData[K]
  ) => void;
  submitStory: () => Promise<void>;
  isSubmitting: boolean;
  error: string | null;
}
