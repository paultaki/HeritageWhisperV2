/**
 * ============================================
 * INTEGRATION SNIPPET FOR post-recording-flow.html
 * ============================================
 *
 * This file contains the integration code to connect the recording flow
 * (index.html → quick-story.html) with the existing post-recording-flow.html
 *
 * INSTALLATION INSTRUCTIONS:
 *
 * 1. Open post-recording-flow.html
 * 2. Find the opening <script> tag (should be near line 400+)
 * 3. Paste SECTION A immediately after the opening <script> tag
 * 4. Find the existing state initialization (const state = {...})
 * 5. Replace it with SECTION B
 * 6. Find the "Save Story" button click handler or create one
 * 7. Replace/add the save function with SECTION C
 *
 * ============================================
 */


// ============================================
// SECTION A: Load Recording Data from localStorage
// ============================================
// Add this at the VERY TOP of your <script> section in post-recording-flow.html

(function initializeFromRecording() {
  const recordingDataJson = localStorage.getItem('hw_recording_data');

  if (!recordingDataJson) {
    console.warn('⚠️ No recording data found in localStorage');

    const shouldRedirect = confirm(
      'No recording found. Would you like to record a story first?'
    );

    if (shouldRedirect) {
      window.location.href = 'index.html';
      return;
    } else {
      // Allow testing with mock data
      console.log('Using mock data for testing');
      window.hwRecordingData = {
        mode: 'quick',
        audioBlob: null,
        audioUrl: null,
        duration: 0,
        timestamp: new Date().toISOString(),
        prompt: "Sample prompt",
        rawTranscript: 'Sample transcript for testing: I met your grandmother at the county fair in 1985. She was wearing a blue dress and had the most wonderful smile. We danced to the band playing under the stars, and I knew right then that she was the one. It was the best night of my life.',
        qaPairs: null
      };
    }
    return;
  }

  try {
    const recordingData = JSON.parse(recordingDataJson);
    console.log('✓ Recording data loaded:', recordingData.mode, `(${recordingData.duration}s)`);

    // Convert base64 audioBlob back to Blob if present
    let audioBlob = null;
    let audioUrl = null;

    if (recordingData.audioBlob && typeof recordingData.audioBlob === 'string') {
      try {
        // Extract base64 data and MIME type
        const matches = recordingData.audioBlob.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          const mimeType = matches[1];
          const base64Data = matches[2];

          // Convert base64 to byte array
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);

          // Create Blob
          audioBlob = new Blob([byteArray], { type: mimeType });
          audioUrl = URL.createObjectURL(audioBlob);

          console.log('✓ Audio blob reconstructed:', (audioBlob.size / 1024).toFixed(2), 'KB');
        }
      } catch (error) {
        console.error('Failed to convert base64 to blob:', error);
      }
    }

    // Store in global variable for access by state initialization
    window.hwRecordingData = {
      mode: recordingData.mode,
      audioBlob: audioBlob,
      audioUrl: audioUrl,
      duration: recordingData.duration,
      timestamp: recordingData.timestamp,
      prompt: recordingData.prompt || null,
      rawTranscript: recordingData.rawTranscript || null,
      qaPairs: recordingData.qaPairs || null
    };

  } catch (error) {
    console.error('Failed to parse recording data:', error);
    alert('Error loading recording. Please try recording again.');
    window.location.href = 'index.html';
  }
})();


// ============================================
// SECTION B: Modified State Initialization
// ============================================
// REPLACE your existing "const state = {...}" with this:

const state = {
  // Form data
  title: '',
  year: null,
  photos: [],

  // Transcription data (loaded from recording or generated sample)
  transcription: {
    original: '', // Will be populated from hwRecordingData or simulated
    enhanced: '',  // Will be AI-enhanced
    useEnhanced: true
  },

  lessonLearned: '',

  // Processing status
  processing: {
    transcription: 'pending',  // 'pending' | 'complete' | 'error'
    enhancement: 'pending',
    lesson: 'complete'
  },

  // Current screen (1-4)
  currentScreen: 1,

  // Recording metadata
  recording: window.hwRecordingData || null
};

// If we have loaded recording data, use it
if (window.hwRecordingData) {
  // If rawTranscript exists (typed story), use it immediately
  if (window.hwRecordingData.rawTranscript) {
    state.transcription.original = window.hwRecordingData.rawTranscript;
    state.processing.transcription = 'complete';
    console.log('✓ Using pre-existing transcript');
  }
  // Otherwise, we'll need to simulate transcription API call
}

// Helper function to generate sample transcript if none exists
function generateSampleTranscript() {
  return 'So, um, you know, I met your grandmother at, uh, the county fair when I was like 18. She was wearing this beautiful blue dress, and um, she had the most, uh, wonderful smile I had ever seen. We, uh, we danced to the band playing under the stars, and I just, like, I knew right then that she was, you know, the one for me. It was honestly the best night of my entire life, like, I\'ll never forget it.';
}


// ============================================
// SECTION C: Save Story Function
// ============================================
// Add this function to handle final save (call when "Save Story" is clicked)

/**
 * Save completed story to localStorage and navigate to viewer
 */
function saveStory() {
  // Validate required fields
  if (!state.title || state.title.trim().length === 0) {
    alert('Please add a title for your story.');
    // Navigate back to Screen 1
    state.currentScreen = 1;
    renderScreen(1);
    return;
  }

  // Create final story object
  const finalStory = {
    storyId: generateUUID(),
    mode: state.recording?.mode || 'unknown',

    // Metadata
    title: state.title.trim(),
    year: state.year,
    createdAt: new Date().toISOString(),
    recordedAt: state.recording?.timestamp || new Date().toISOString(),

    // Content
    originalTranscript: state.transcription.original,
    enhancedTranscript: state.transcription.enhanced,
    useEnhanced: state.transcription.useEnhanced,
    lessonLearned: state.lessonLearned.trim(),

    // Media
    photos: state.photos, // Already base64 from photo upload
    audioUrl: state.recording?.audioUrl || null,
    audioDuration: state.recording?.duration || 0,

    // Original prompt (for context)
    prompt: state.recording?.prompt || null,
    qaPairs: state.recording?.qaPairs || null
  };

  // Load existing stories from localStorage
  let existingStories = [];
  try {
    const storiesJson = localStorage.getItem('hw_completed_stories');
    existingStories = storiesJson ? JSON.parse(storiesJson) : [];
  } catch (error) {
    console.error('Failed to load existing stories:', error);
    existingStories = [];
  }

  // Add new story
  existingStories.push(finalStory);

  // Save back to localStorage
  try {
    localStorage.setItem('hw_completed_stories', JSON.stringify(existingStories));
    console.log('✓ Story saved:', finalStory.storyId, `"${finalStory.title}"`);

    // Clear one-time recording data
    localStorage.removeItem('hw_recording_data');

    // Show success message
    alert(`Story "${finalStory.title}" saved successfully!`);

    // Redirect to story viewer
    window.location.href = 'view-stories.html';

  } catch (error) {
    console.error('Failed to save story:', error);

    if (error.name === 'QuotaExceededError') {
      alert('Storage quota exceeded. Please delete some old stories and try again.');
    } else {
      alert('Failed to save story. Please try again.');
    }
  }
}

/**
 * Generate UUID v4 for story IDs
 */
function generateUUID() {
  // Use crypto.randomUUID if available (modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback UUID generation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}


// ============================================
// SECTION D: Optional Enhancements
// ============================================

/**
 * Display audio player if recording has audio
 * Call this in Screen 3 (Review) to show playback option
 */
function renderAudioPlayer() {
  if (!state.recording?.audioUrl) {
    return '';
  }

  return `
    <div class="mb-6 p-4 bg-gray-50 rounded-lg">
      <h3 class="text-sm font-semibold text-gray-700 mb-2">Original Recording:</h3>
      <audio controls class="w-full" src="${state.recording.audioUrl}">
        Your browser does not support audio playback.
      </audio>
      <p class="text-xs text-gray-500 mt-2">
        Duration: ${formatDuration(state.recording.duration)}
      </p>
    </div>
  `;
}

/**
 * Format duration in seconds as MM:SS
 */
function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}


// ============================================
// USAGE NOTES
// ============================================

/*

1. INITIALIZATION:
   - The code automatically runs when post-recording-flow.html loads
   - It checks localStorage for 'hw_recording_data'
   - Converts base64 audio back to playable Blob
   - Populates window.hwRecordingData with all recording info

2. STATE INTEGRATION:
   - Your existing state object now includes a 'recording' property
   - Access recording metadata: state.recording.duration, state.recording.audioUrl, etc.
   - If rawTranscript exists, it's pre-populated (typed stories)
   - Otherwise, you'll need to call your transcription API

3. SAVING:
   - Call saveStory() when user clicks "Save Story" button
   - It validates, packages everything, and saves to hw_completed_stories array
   - Automatically clears hw_recording_data after save
   - Redirects to view-stories.html

4. TESTING:
   - Test with recording: index.html → quick-story.html → record → post-recording-flow.html
   - Test with typing: quick-story.html → "type instead" → post-recording-flow.html
   - Test without data: Open post-recording-flow.html directly (should prompt or use mock data)

5. DATA FLOW:
   localStorage Keys:
   - hw_recording_data (temporary): Single recording in progress
   - hw_completed_stories (permanent): Array of all saved stories

6. CONNECTING YOUR SAVE BUTTON:
   Find your "Save Story" button in Screen 4, update the onclick:

   <button onclick="saveStory()" class="...">
     Save Story
   </button>

7. CONNECTING YOUR "SKIP LESSON" LINK:
   Skip lesson should also call saveStory (lesson will just be empty):

   <a href="#" onclick="event.preventDefault(); state.lessonLearned = ''; saveStory();">
     Skip Lesson
   </a>

*/


// ============================================
// DEBUG HELPERS
// ============================================

// Log current state to console (helpful for debugging)
function debugState() {
  console.group('📊 Post-Recording Flow State');
  console.log('Recording:', state.recording);
  console.log('Title:', state.title);
  console.log('Year:', state.year);
  console.log('Photos:', state.photos.length);
  console.log('Original transcript length:', state.transcription.original?.length || 0);
  console.log('Enhanced transcript length:', state.transcription.enhanced?.length || 0);
  console.log('Using enhanced:', state.transcription.useEnhanced);
  console.log('Lesson learned:', state.lessonLearned?.substring(0, 50) + '...');
  console.log('Current screen:', state.currentScreen);
  console.groupEnd();
}

// Call this anytime to inspect state
// Example: Add a keyboard shortcut
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (e) => {
    // Press Ctrl+Shift+D to debug
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
      debugState();
    }
  });
}
