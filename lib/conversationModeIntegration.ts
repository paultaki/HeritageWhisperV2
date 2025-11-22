/**
 * Conversation Mode Integration
 *
 * Handles saving conversation data from interview-chat
 * to NavCache for the wizard flow.
 */

import { navCache } from "./navCache";

export interface QAPair {
  question: string;
  answer: string;
  timestamp?: string;
  duration?: number;
}

export interface ConversationData {
  qaPairs: QAPair[];
  audioBlob?: Blob | null; // Mixed audio (user + Pearl) - optional, for debugging
  userOnlyAudioBlob?: Blob | null; // User-only audio (for final story) - preferred
  fullTranscript: string;
  totalDuration: number;
}

/**
 * Convert Blob to base64 string (no longer needed for NavCache, kept for compatibility)
 * @deprecated Use NavCache which stores blobs directly
 */
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Combine multiple audio blobs into a single blob
 */
export async function combineAudioBlobs(blobs: Blob[]): Promise<Blob> {
  if (blobs.length === 0) {
    throw new Error('No audio blobs to combine');
  }

  if (blobs.length === 1) {
    return blobs[0];
  }

  // Simple concatenation for same-format blobs
  return new Blob(blobs, { type: blobs[0].type });
}

/**
 * Extract lesson learned from transcript using AI
 */
async function extractLessonFromTranscript(transcript: string): Promise<string> {
  try {
    const response = await fetch('/api/extract-lesson', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript }),
    });

    if (!response.ok) {
      console.error('[Conversation] Lesson extraction failed:', response.statusText);
      return ''; // Return empty string on failure
    }

    const data = await response.json();
    return data.lesson || '';
  } catch (error) {
    console.error('[Conversation] Lesson extraction error:', error);
    return ''; // Return empty string on error
  }
}

/**
 * Save conversation data to NavCache and redirect to wizard
 * Supports saving multiple stories in a chain
 */
export async function completeConversationAndRedirect(
  conversationData: ConversationData,
  splitStories?: Array<{
    title: string;
    bridged_text: string;
    audioBlob: Blob;
    duration: number;
  }>
): Promise<void> {
  try {
    const { qaPairs, audioBlob, userOnlyAudioBlob, fullTranscript, totalDuration } = conversationData;

    // If we have split stories, we need to create a chain of NavCache entries
    if (splitStories && splitStories.length > 0) {
      const navIds: string[] = [];

      // 1. Generate all IDs first so we can link them
      for (let i = 0; i < splitStories.length; i++) {
        navIds.push(navCache.generateId());
      }

      // 2. Save each story, pointing to the next one
      for (let i = 0; i < splitStories.length; i++) {
        const story = splitStories[i];
        const nextNavId = i < splitStories.length - 1 ? navIds[i + 1] : undefined;

        const recordingData = {
          mode: 'conversation' as const,
          audioBlob: story.audioBlob,
          duration: story.duration,
          timestamp: new Date().toISOString(),
          rawTranscript: fullTranscript, // Keep full context
          transcription: story.bridged_text, // Use bridged text as the main content
          title: story.title,
          qaPairs: qaPairs || [],
          lessonLearned: '', // Can be extracted later per story
          nextNavId, // Link to next story
          storyIndex: i + 1,
          totalStories: splitStories.length
        };

        await navCache.set(navIds[i], recordingData);
      }

      // 3. Redirect to the first story
      window.location.href = `/review/book-style?nav=${navIds[0]}&mode=wizard`;
      return;
    }

    // Default single story flow
    // Prefer user-only audio (no Pearl voice) for final story
    const finalAudioBlob = userOnlyAudioBlob || audioBlob;

    // Extract lesson learned from transcript (async, non-blocking)
    const lessonLearned = await extractLessonFromTranscript(fullTranscript || '');

    // Create recording session data for wizard
    const recordingData = {
      mode: 'conversation' as const,
      audioBlob: finalAudioBlob || undefined, // Use user-only audio if available, fallback to mixed
      duration: totalDuration || 0,
      timestamp: new Date().toISOString(),
      rawTranscript: fullTranscript || '',
      qaPairs: qaPairs || [],
      lessonLearned: lessonLearned || '', // Add extracted lesson
    };

    // Generate unique ID and save to NavCache
    const navId = navCache.generateId();
    await navCache.set(navId, recordingData);

    // Redirect to wizard
    window.location.href = `/review/book-style?nav=${navId}&mode=wizard`;

  } catch (error) {
    console.error('❌ Failed to complete conversation:', error);
    throw error;
  }
}

/**
 * Extract Q&A pairs from messages array
 */
export function extractQAPairs(messages: Array<{
  type: string;
  content: string;
  sender: string;
}>): QAPair[] {
  const qaPairs: QAPair[] = [];
  let currentQuestion: string | null = null;

  for (const message of messages) {
    // Questions from HW
    if (message.sender === 'hw' && message.type === 'question') {
      currentQuestion = message.content;
    }
    // Answers from user
    else if (message.sender === 'user' && currentQuestion && message.content) {
      qaPairs.push({
        question: currentQuestion,
        answer: message.content
      });
      currentQuestion = null; // Reset for next Q&A pair
    }
  }

  return qaPairs;
}
