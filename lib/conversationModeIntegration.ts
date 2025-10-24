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
 * Save conversation data to NavCache and redirect to wizard
 */
export async function completeConversationAndRedirect(
  conversationData: ConversationData
): Promise<void> {
  try {
    console.log('📝 Completing conversation...', {
      hasUserOnlyAudio: !!conversationData.userOnlyAudioBlob,
      hasMixedAudio: !!conversationData.audioBlob,
      transcriptLength: conversationData.fullTranscript?.length,
      qaPairsCount: conversationData.qaPairs?.length,
      duration: conversationData.totalDuration
    });

    const { qaPairs, audioBlob, userOnlyAudioBlob, fullTranscript, totalDuration } = conversationData;

    // Prefer user-only audio (no Pearl voice) for final story
    const finalAudioBlob = userOnlyAudioBlob || audioBlob;

    if (finalAudioBlob) {
      const sizeInMB = finalAudioBlob.size / (1024 * 1024);
      const audioType = userOnlyAudioBlob ? 'User-only' : 'Mixed';
      console.log(`🎵 ${audioType} audio size: ${sizeInMB.toFixed(2)} MB`);
    }

    // Create recording session data for wizard
    const recordingData = {
      mode: 'conversation' as const,
      audioBlob: finalAudioBlob || undefined, // Use user-only audio if available, fallback to mixed
      duration: totalDuration || 0,
      timestamp: new Date().toISOString(),
      rawTranscript: fullTranscript || '',
      qaPairs: qaPairs || [],
    };

    // Generate unique ID and save to NavCache
    const navId = navCache.generateId();
    await navCache.set(navId, recordingData);

    console.log('✓ Conversation data saved to NavCache with ID:', navId);
    console.log('📊 Data:', {
      mode: recordingData.mode,
      qaPairs: recordingData.qaPairs.length,
      duration: recordingData.duration,
      hasAudio: !!recordingData.audioBlob,
      transcriptLength: recordingData.rawTranscript.length
    });

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
