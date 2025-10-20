/**
 * Conversation Mode Integration for Prototype
 *
 * Handles saving conversation data from production interview-chat
 * to localStorage for the post-recording flow prototype.
 */

export interface QAPair {
  question: string;
  answer: string;
  timestamp?: string;
  duration?: number;
}

export interface ConversationData {
  qaPairs: QAPair[];
  audioBlob?: Blob | null;
  fullTranscript: string;
  totalDuration: number;
}

/**
 * Convert Blob to base64 string for localStorage
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
 * Save conversation data to localStorage and redirect to prototype
 */
export async function completeConversationAndRedirect(
  conversationData: ConversationData
): Promise<void> {
  try {
    console.log('📝 Completing conversation...');

    const { qaPairs, audioBlob, fullTranscript, totalDuration } = conversationData;

    // Convert audio blob to base64 (if exists)
    let audioBase64: string | null = null;
    if (audioBlob) {
      console.log('🎵 Converting audio to base64...');
      audioBase64 = await blobToBase64(audioBlob);

      // Check size (localStorage has ~5-10MB limit)
      const sizeInMB = (audioBase64.length * 3 / 4) / (1024 * 1024);
      console.log(`Audio size: ${sizeInMB.toFixed(2)} MB`);

      if (sizeInMB > 8) {
        console.warn('⚠️ Audio too large, skipping audio storage');
        audioBase64 = null;
      }
    }

    // Create recording data object for prototype
    const recordingData = {
      mode: 'conversation',
      audioBlob: audioBase64,
      duration: totalDuration || 0,
      timestamp: new Date().toISOString(),
      prompt: null, // Conversation has no single prompt
      rawTranscript: fullTranscript || '',
      qaPairs: qaPairs || []
    };

    // Save to localStorage
    localStorage.setItem('hw_recording_data', JSON.stringify(recordingData));
    console.log('✓ Conversation data saved to localStorage');
    console.log('📊 Data:', {
      mode: recordingData.mode,
      qaPairs: recordingData.qaPairs.length,
      duration: recordingData.duration,
      hasAudio: !!recordingData.audioBlob,
      transcriptLength: recordingData.rawTranscript.length
    });

    // Redirect to post-recording flow prototype
    // Note: Prototype HTML files should be in /public folder for Next.js to serve them
    window.location.href = '/post-recording-flow.html';

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
