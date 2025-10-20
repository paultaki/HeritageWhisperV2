/**
 * ============================================
 * CONVERSATION MODE INTEGRATION
 * ============================================
 *
 * Add this code to your production app at:
 * dev.heritagewhisper.com/interview-chat
 *
 * This handles saving conversation data and redirecting
 * to the post-recording flow prototype.
 *
 * USAGE:
 * 1. Import this file in your interview-chat page
 * 2. Call completeConversation() when the interview ends
 * 3. User will be redirected to post-recording-flow.html
 *
 * ============================================
 */

// ============================================
// MAIN COMPLETION HANDLER
// ============================================

/**
 * Call this function when the guided interview is complete
 *
 * @param {Object} conversationData - All data from the conversation
 * @param {Array} conversationData.qaPairs - Array of question/answer objects
 * @param {Blob} conversationData.audioBlob - Combined audio (optional)
 * @param {string} conversationData.fullTranscript - Complete transcript
 * @param {number} conversationData.totalDuration - Total duration in seconds
 */
async function completeConversation(conversationData) {
  try {
    console.log('📝 Completing conversation...');

    // Extract data
    const { qaPairs, audioBlob, fullTranscript, totalDuration } = conversationData;

    // Convert audio blob to base64 (if audio exists)
    let audioBase64 = null;
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

    // Choose redirect strategy based on your setup
    await redirectToPrototype();

  } catch (error) {
    console.error('❌ Failed to complete conversation:', error);
    alert('Failed to save conversation. Please try again.');
  }
}

// ============================================
// REDIRECT STRATEGIES
// ============================================

/**
 * Option A: Same Domain Redirect (Recommended)
 * Use this if prototype is hosted on same domain as production
 */
function redirectToPrototype_SameDomain() {
  // Navigate directly to post-recording flow
  window.location.href = '/post-recording-flow.html';
}

/**
 * Option B: Cross-Domain with Window Close
 * Use this if prototype is on different domain
 * User manually returns to prototype window
 */
function redirectToPrototype_CrossDomain() {
  // Show success message
  alert('Conversation complete! Please return to the HeritageWhisper window to review your story.');

  // Close interview window (user returns to prototype)
  window.close();
}

/**
 * Option C: postMessage Communication (Advanced)
 * Use this for real-time communication between windows
 */
function redirectToPrototype_PostMessage(recordingData) {
  if (window.opener) {
    // Send data to opener window
    window.opener.postMessage({
      type: 'conversation_complete',
      data: recordingData
    }, '*'); // In production, specify exact origin for security

    console.log('✓ Data sent to parent window via postMessage');

    // Close after short delay
    setTimeout(() => {
      window.close();
    }, 500);
  } else {
    console.warn('⚠️ No opener window found, using localStorage fallback');
    window.location.href = '/post-recording-flow.html';
  }
}

/**
 * Choose your redirect strategy
 * Change this based on your deployment setup
 */
async function redirectToPrototype() {
  // OPTION A: Same domain (easiest)
  redirectToPrototype_SameDomain();

  // OPTION B: Cross-domain
  // redirectToPrototype_CrossDomain();

  // OPTION C: postMessage (advanced)
  // redirectToPrototype_PostMessage(recordingData);
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Convert Blob to base64 string for localStorage
 * @param {Blob} blob - Audio blob to convert
 * @returns {Promise<string>} Base64 encoded data URL
 */
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Combine multiple audio segments into single blob
 * @param {Array<Blob>} segments - Array of audio blobs
 * @returns {Promise<Blob>} Combined audio blob
 */
async function combineAudioSegments(segments) {
  // If only one segment, return it
  if (segments.length === 1) {
    return segments[0];
  }

  // Simple concatenation (works for same format blobs)
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const buffers = [];

  // Decode all segments
  for (const segment of segments) {
    const arrayBuffer = await segment.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    buffers.push(audioBuffer);
  }

  // Calculate total length
  const totalLength = buffers.reduce((sum, buffer) => sum + buffer.length, 0);
  const numberOfChannels = buffers[0].numberOfChannels;
  const sampleRate = buffers[0].sampleRate;

  // Create combined buffer
  const combinedBuffer = audioContext.createBuffer(
    numberOfChannels,
    totalLength,
    sampleRate
  );

  // Copy data
  let offset = 0;
  for (const buffer of buffers) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      combinedBuffer.getChannelData(channel).set(
        buffer.getChannelData(channel),
        offset
      );
    }
    offset += buffer.length;
  }

  // Convert back to blob
  const offlineContext = new OfflineAudioContext(
    numberOfChannels,
    totalLength,
    sampleRate
  );
  const source = offlineContext.createBufferSource();
  source.buffer = combinedBuffer;
  source.connect(offlineContext.destination);
  source.start();

  const renderedBuffer = await offlineContext.startRendering();

  // Export as WAV (simple format)
  const wavBlob = audioBufferToWav(renderedBuffer);
  return wavBlob;
}

/**
 * Convert AudioBuffer to WAV Blob
 * @param {AudioBuffer} buffer - Audio buffer to convert
 * @returns {Blob} WAV format blob
 */
function audioBufferToWav(buffer) {
  const numberOfChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numberOfChannels * bytesPerSample;

  const data = [];
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sample = buffer.getChannelData(channel)[i];
      const value = Math.max(-1, Math.min(1, sample));
      data.push(value < 0 ? value * 0x8000 : value * 0x7FFF);
    }
  }

  const dataLength = data.length * bytesPerSample;
  const headerLength = 44;
  const totalLength = headerLength + dataLength;

  const arrayBuffer = new ArrayBuffer(totalLength);
  const view = new DataView(arrayBuffer);

  // WAV header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, totalLength - 8, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);

  // PCM data
  let offset = 44;
  for (let i = 0; i < data.length; i++) {
    view.setInt16(offset, data[i], true);
    offset += 2;
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

// ============================================
// EXAMPLE USAGE PATTERNS
// ============================================

/**
 * EXAMPLE 1: Basic Usage (No Audio)
 * For text-only conversations
 */
async function example_TextOnlyConversation() {
  const conversationData = {
    qaPairs: [
      {
        question: "Tell me about a meaningful moment in your life.",
        answer: "I met your grandmother at the county fair when I was 18..."
      },
      {
        question: "What happened next?",
        answer: "She was working at the cotton candy stand..."
      },
      {
        question: "What did you learn from that experience?",
        answer: "Sometimes the best things start with a small risk..."
      }
    ],
    audioBlob: null, // No audio
    fullTranscript: "I met your grandmother at the county fair when I was 18. She was working at the cotton candy stand. Sometimes the best things start with a small risk.",
    totalDuration: 0 // No audio, so 0 duration
  };

  await completeConversation(conversationData);
}

/**
 * EXAMPLE 2: With Audio (Single Recording)
 * For conversations with one continuous recording
 */
async function example_SingleAudioRecording(audioBlob) {
  const conversationData = {
    qaPairs: [
      {
        question: "Tell me about your childhood home.",
        answer: "We lived in a small house on Oak Street..."
      },
      {
        question: "What was your favorite room?",
        answer: "The kitchen, where my mother would bake..."
      }
    ],
    audioBlob: audioBlob, // Single blob for entire conversation
    fullTranscript: "We lived in a small house on Oak Street. The kitchen was my favorite room, where my mother would bake...",
    totalDuration: 180 // 3 minutes
  };

  await completeConversation(conversationData);
}

/**
 * EXAMPLE 3: With Multiple Audio Segments
 * For conversations where each Q&A was recorded separately
 */
async function example_MultipleAudioSegments(audioSegments) {
  // Combine all audio segments
  const combinedAudio = await combineAudioSegments(audioSegments);

  const conversationData = {
    qaPairs: [
      {
        question: "Question 1",
        answer: "Answer 1",
        duration: 60 // Individual segment duration
      },
      {
        question: "Question 2",
        answer: "Answer 2",
        duration: 45
      },
      {
        question: "Question 3",
        answer: "Answer 3",
        duration: 75
      }
    ],
    audioBlob: combinedAudio,
    fullTranscript: "Answer 1. Answer 2. Answer 3.",
    totalDuration: 180 // Sum of all durations
  };

  await completeConversation(conversationData);
}

/**
 * EXAMPLE 4: Integration with Existing Interview Chat
 * Assuming you have a conversation state object
 */
async function example_IntegrationWithExistingApp() {
  // Your existing conversation state
  const conversationState = {
    messages: [
      { role: 'assistant', content: 'Tell me about...' },
      { role: 'user', content: 'I remember when...', audioBlob: blob1 },
      { role: 'assistant', content: 'What happened next?' },
      { role: 'user', content: 'Then we...', audioBlob: blob2 }
    ],
    recordedAudio: [blob1, blob2]
  };

  // Transform to prototype format
  const qaPairs = [];
  const audioSegments = [];
  let currentQuestion = null;

  for (const message of conversationState.messages) {
    if (message.role === 'assistant') {
      currentQuestion = message.content;
    } else if (message.role === 'user' && currentQuestion) {
      qaPairs.push({
        question: currentQuestion,
        answer: message.content
      });
      if (message.audioBlob) {
        audioSegments.push(message.audioBlob);
      }
      currentQuestion = null;
    }
  }

  // Combine audio
  const combinedAudio = audioSegments.length > 0
    ? await combineAudioSegments(audioSegments)
    : null;

  // Generate full transcript
  const fullTranscript = qaPairs
    .map(pair => pair.answer)
    .join(' ');

  const conversationData = {
    qaPairs,
    audioBlob: combinedAudio,
    fullTranscript,
    totalDuration: audioSegments.length * 60 // Estimate
  };

  await completeConversation(conversationData);
}

// ============================================
// PRODUCTION INTEGRATION CHECKLIST
// ============================================

/*
  ✅ INTEGRATION STEPS:

  1. Add this file to your interview-chat page:
     <script src="/conversation-mode-integration.js"></script>

  2. When conversation ends, collect all data:
     - All Q&A pairs (questions + answers)
     - Combined audio blob (if recording)
     - Full transcript text
     - Total duration

  3. Call completeConversation():
     await completeConversation({
       qaPairs: [...],
       audioBlob: combinedBlob,
       fullTranscript: "...",
       totalDuration: 180
     });

  4. User is automatically redirected to post-recording flow

  5. Test the flow:
     - Start from index.html
     - Click "Let's Talk"
     - Complete conversation at dev.heritagewhisper.com
     - Should auto-redirect to post-recording-flow.html
     - All 4 screens should work with conversation data

  ✅ OPTIONAL ENHANCEMENTS:

  - Add error recovery (retry on failure)
  - Show progress indicator during save
  - Add data validation before save
  - Implement auto-save during conversation
  - Add conversation resume functionality

  ✅ TESTING:

  - Test with no audio (text only)
  - Test with single audio blob
  - Test with multiple audio segments
  - Test localStorage quota limits
  - Test cross-browser compatibility
  - Test mobile Safari/Chrome
*/

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    completeConversation,
    blobToBase64,
    combineAudioSegments
  };
}
