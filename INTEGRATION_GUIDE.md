# Integration Guide: Recording Flow → Post-Recording Flow

This guide shows how to integrate the new recording flow (index.html → quick-story.html) with the existing post-recording-flow.html.

## Architecture Overview

```
┌─────────────┐
│  index.html │  Home screen (mode selection)
└─────┬───────┘
      │
      ├──> Conversation Mode (opens dev.heritagewhisper.com/interview-chat)
      │
      └──> Quick Story Mode
           │
           ▼
      ┌────────────────┐
      │ quick-story.html│  Recording interface (4 states)
      └────────┬───────┘  Ready → Countdown (3-2-1) → Recording → Paused
               │ Saves to: localStorage['hw_recording_data']
               ▼
      ┌──────────────────────────┐
      │ post-recording-flow.html │  4-screen review flow
      └────────┬─────────────────┘
               │ Saves to: localStorage['hw_completed_stories']
               ▼
      ┌─────────────────┐
      │ view-stories.html│  Story list viewer
      └─────────────────┘
```

## localStorage Data Schema

### hw_recording_data (Temporary)

Single object storing one active recording:

```json
{
  "mode": "quick",
  "audioBlob": "data:audio/webm;base64,...",
  "duration": 123,
  "timestamp": "2025-01-19T10:30:00.000Z",
  "prompt": "Let's start with something meaningful...",
  "rawTranscript": "I met your grandmother at..."
}
```

**Lifecycle:** Created by quick-story.html → Read by post-recording-flow.html → Deleted on save

### hw_completed_stories (Permanent)

Array of all finished stories:

```json
[
  {
    "storyId": "uuid-v4",
    "mode": "quick",
    "title": "The Day I Met Your Grandmother",
    "year": 1985,
    "photos": ["data:image/jpeg;base64,..."],
    "originalTranscript": "So um like I met...",
    "enhancedTranscript": "I met your grandmother...",
    "useEnhanced": true,
    "lessonLearned": "Sometimes the best things...",
    "audioUrl": null,
    "duration": 123,
    "createdAt": "2025-01-19T10:35:00.000Z",
    "recordedAt": "2025-01-19T10:30:00.000Z"
  }
]
```

**Lifecycle:** Created on story save → Read by view-stories.html → Deleted individually

## Integration Steps

### Step 1: Update post-recording-flow.html

Open `/Users/paul/Development/HeritageWhisperV2/post-recording-flow.html` and make these changes:

#### A. Add Integration Code at Top of Script Section

Find line 460 (`<script>`) and add this immediately after:

```javascript
// ============================================
// INTEGRATION: Load Recording Data
// ============================================
(function initializeFromRecording() {
  const recordingDataJson = localStorage.getItem('hw_recording_data');

  if (!recordingDataJson) {
    console.warn('⚠️ No recording data found');
    const shouldRedirect = confirm('No recording found. Would you like to record a story first?');
    if (shouldRedirect) {
      window.location.href = 'index.html';
      return;
    } else {
      // Allow testing with mock data
      window.hwRecordingData = {
        mode: 'quick',
        audioBlob: null,
        audioUrl: null,
        duration: 0,
        timestamp: new Date().toISOString(),
        rawTranscript: 'Sample transcript for testing...',
        prompt: null
      };
    }
    return;
  }

  try {
    const recordingData = JSON.parse(recordingDataJson);

    // Convert base64 audioBlob back to Blob
    let audioBlob = null;
    let audioUrl = null;

    if (recordingData.audioBlob && typeof recordingData.audioBlob === 'string') {
      const matches = recordingData.audioBlob.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        const mimeType = matches[1];
        const base64Data = matches[2];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        audioBlob = new Blob([byteArray], { type: mimeType });
        audioUrl = URL.createObjectURL(audioBlob);
      }
    }

    window.hwRecordingData = {
      mode: recordingData.mode,
      audioBlob: audioBlob,
      audioUrl: audioUrl,
      duration: recordingData.duration,
      timestamp: recordingData.timestamp,
      prompt: recordingData.prompt || null,
      rawTranscript: recordingData.rawTranscript || null
    };

    console.log('✓ Recording data loaded:', window.hwRecordingData.mode);

  } catch (error) {
    console.error('Failed to parse recording data:', error);
    alert('Error loading recording. Please try again.');
    window.location.href = 'index.html';
  }
})();
```

#### B. Update State Initialization (Line 467-488)

Replace the existing `const state = {...}` with:

```javascript
const state = {
  // Form data
  title: '',
  year: null,
  photos: [],
  transcription: {
    original: window.hwRecordingData?.rawTranscript || '',
    enhanced: '',
    useEnhanced: true
  },
  lessonLearned: '',

  // Processing status
  processing: {
    transcription: window.hwRecordingData?.rawTranscript ? 'complete' : 'pending',
    enhancement: 'pending',
    lesson: 'complete'
  },

  // Current screen
  currentScreen: 1,

  // Recording metadata
  recording: window.hwRecordingData || null
};
```

#### C. Replace handleSave Function (Line 680-691)

Replace the existing `handleSave()` with:

```javascript
function handleSave() {
  console.log('Saving story with state:', state);

  // Validate required fields
  if (!state.title || state.title.trim().length === 0) {
    alert('Please add a title for your story.');
    goToScreen(1);
    return;
  }

  // Create final story object
  const finalStory = {
    storyId: generateUUID(),
    mode: state.recording?.mode || 'unknown',
    title: state.title.trim(),
    year: state.year,
    createdAt: new Date().toISOString(),
    recordedAt: state.recording?.timestamp || new Date().toISOString(),
    originalTranscript: state.transcription.original,
    enhancedTranscript: state.transcription.enhanced,
    useEnhanced: state.transcription.useEnhanced,
    lessonLearned: state.lessonLearned.trim(),
    photos: state.photos,
    audioUrl: state.recording?.audioUrl || null,
    duration: state.recording?.duration || 0,
    prompt: state.recording?.prompt || null
  };

  // Load existing stories
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

  // Save to localStorage
  try {
    localStorage.setItem('hw_completed_stories', JSON.stringify(existingStories));
    console.log('✓ Story saved:', finalStory.storyId);

    // Clear temporary recording data
    localStorage.removeItem('hw_recording_data');

    // Show success and redirect
    alert(`Story "${finalStory.title}" saved successfully!`);
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

// Helper function for UUID generation
function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
```

#### D. Update handleSkipLesson Function (Line 693-696)

Replace with:

```javascript
function handleSkipLesson() {
  state.lessonLearned = '';
  handleSave();
}
```

### Step 2: Add Audio Player to Screen 3 (Optional)

If you want to show the audio player on the Review screen, add this inside the `#enhancement-content` div (around line 297):

```html
<!-- Audio Player (if recording has audio) -->
<div id="audio-player" class="hidden mb-6 p-4 bg-gray-50 rounded-lg">
  <h3 class="text-sm font-semibold text-gray-700 mb-2">Original Recording:</h3>
  <audio id="audio-element" controls class="w-full">
    Your browser does not support audio playback.
  </audio>
  <p class="text-xs text-gray-500 mt-2">
    Duration: <span id="audio-duration">0:00</span>
  </p>
</div>
```

Then add this to the `showEnhancementContent()` function (around line 596):

```javascript
function showEnhancementContent() {
  document.getElementById('enhancement-loading').style.display = 'none';
  document.getElementById('enhancement-content').style.display = 'block';
  document.getElementById('enhanced-text').value = state.transcription.enhanced;

  // Show audio player if recording has audio
  if (state.recording?.audioUrl) {
    const audioPlayer = document.getElementById('audio-player');
    const audioElement = document.getElementById('audio-element');
    const audioDuration = document.getElementById('audio-duration');

    audioPlayer.classList.remove('hidden');
    audioElement.src = state.recording.audioUrl;

    // Format duration
    const minutes = Math.floor(state.recording.duration / 60);
    const seconds = state.recording.duration % 60;
    audioDuration.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}
```

### Step 3: Update Cancel Handler (Line 698-703)

Replace with:

```javascript
function handleCancel() {
  if (confirm('Are you sure you want to cancel? Your recording will be lost.')) {
    // Clear temporary recording data
    localStorage.removeItem('hw_recording_data');
    console.log('User cancelled');
    // Return to home
    window.location.href = 'index.html';
  }
}
```

## Testing Checklist

### Full Flow Test

1. **Open index.html**
   - [ ] See two mode options (Conversation and Quick Story)
   - [ ] "View saved stories" link shows at bottom
   - [ ] If stories exist, count shows in console

2. **Click "Start Recording"**
   - [ ] Navigate to quick-story.html
   - [ ] See prompt and START button
   - [ ] Tips section visible

3. **Record Audio**
   - [ ] Click START (or type story instead)
   - [ ] Timer counts up
   - [ ] Pause/Resume works
   - [ ] Restart shows confirmation
   - [ ] Stop creates recording data

4. **Check localStorage (Chrome DevTools → Application → Local Storage)**
   - [ ] `hw_recording_data` exists with correct structure
   - [ ] `audioBlob` is base64 string
   - [ ] `duration` and `timestamp` set

5. **Navigate to post-recording-flow.html**
   - [ ] No error alerts
   - [ ] Screen 1 loads with empty title
   - [ ] Console shows "✓ Recording data loaded: quick"

6. **Complete Flow**
   - [ ] Screen 1: Add title, click Next
   - [ ] Screen 2: Skip photos
   - [ ] Screen 3: Enhancement shows (spinner or immediate)
   - [ ] Screen 3: Edit enhanced text
   - [ ] Screen 3: Toggle version selection works
   - [ ] Screen 4: Edit lesson
   - [ ] Screen 4: Click "Save Story"

7. **Check localStorage After Save**
   - [ ] `hw_recording_data` deleted
   - [ ] `hw_completed_stories` exists with 1 item
   - [ ] Story has correct storyId (UUID)
   - [ ] All fields populated

8. **View Stories**
   - [ ] Redirect to view-stories.html
   - [ ] Story appears in list
   - [ ] View Details expands correctly
   - [ ] Audio player works (if recorded)
   - [ ] Delete shows confirmation

9. **Edge Cases**
   - [ ] Open post-recording-flow.html directly → Shows prompt or uses mock data
   - [ ] Cancel on Screen 1 → Returns to index.html
   - [ ] Browser refresh mid-flow → Data persists in localStorage
   - [ ] Record second story → Both appear in view-stories.html

### Cross-Browser Testing

Test in:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

### Mobile Responsive Testing

Use Chrome DevTools mobile view (375px width):
- [ ] All touch targets minimum 44px
- [ ] Text readable (16px+)
- [ ] Buttons don't overlap
- [ ] Recording circle large enough
- [ ] Story cards stack vertically

## Known Limitations

1. **Audio Blob Persistence**: Blob URLs (`audioUrl`) don't survive page refresh. When user reopens view-stories.html later, audio will be null. For production, you'd store audio in Supabase Storage.

2. **localStorage Size Limits**: Max ~5-10MB depending on browser. A 5-minute recording is ~2-3MB as base64, so you can store 2-3 recordings max before hitting quota.

3. **No Transcription**: The prototype doesn't actually transcribe audio. For production, you'd call `/api/transcribe-assemblyai` in quick-story.html before navigating to post-recording flow.

4. **No Photo Upload**: Photo slots show placeholders. For production, you'd integrate file picker and Supabase Storage upload.

5. **Conversation Mode**: Just opens existing URL in new window. No integration with localStorage data flow yet.

## Production Integration Path

To integrate this prototype into the real HeritageWhisper Next.js app:

### Phase 1: Convert to React Components

1. **Create `<PostRecordingFlow>` component**
   - Convert 4 screens to React state machine
   - Use TanStack Query for API calls
   - Replace localStorage with NavCache

2. **Update `<RecordModal>` component**
   - Replace direct navigation with modal flow
   - Pass `audioBlob` as prop instead of localStorage
   - Call transcription API before showing post-recording flow

3. **Integrate with existing routes**
   - `/recording` → `/review` flow stays the same
   - Modal variant for timeline/book "+" button

### Phase 2: API Integration

1. **Replace simulated transcription**
   - Call real `/api/transcribe-assemblyai` endpoint
   - Show actual processing time (3-4s)
   - Handle errors gracefully

2. **Replace simulated enhancement**
   - Call GPT-4o-mini formatting endpoint
   - Generate actual lesson options
   - Show real improvements count

3. **Save to Supabase**
   - Upload audio to Supabase Storage
   - Save story record to database
   - Trigger Tier-3 analysis at milestones

### Phase 3: Photo Upload

1. **Reuse `<MultiPhotoUploader>` component**
   - File picker with cropping
   - Upload to Supabase Storage
   - Hero image selection

2. **Update Screen 2**
   - Replace placeholder slots with actual uploader
   - Show thumbnails after upload
   - Allow delete/reorder

## Troubleshooting

### "No recording found" alert on post-recording-flow.html

**Cause:** `localStorage['hw_recording_data']` doesn't exist

**Fix:**
1. Check quick-story.html reached `handleRecordingComplete()`
2. Open DevTools → Application → Local Storage → Check if key exists
3. Check for errors in console during audio blob conversion
4. Try typing story instead of recording (bypasses audio issues)

### Stories not appearing in view-stories.html

**Cause:** `localStorage['hw_completed_stories']` not saved or corrupted

**Fix:**
1. Check console for errors during save
2. Check localStorage size (DevTools → Application → Storage)
3. Delete `hw_completed_stories` and try again
4. Check JSON is valid (use JSON validator)

### Audio not playing in view-stories.html

**Cause:** Blob URL expired after page refresh

**Expected behavior:** This is by design in the prototype. Blob URLs don't persist.

**Production fix:** Store audio in Supabase Storage and use permanent URLs

### Recording stops automatically after 5 minutes

**Expected behavior:** This is intentional to prevent excessive storage usage

**To change:** Edit `MAX_RECORDING_DURATION` in quick-story.html:274

### Browser shows "Storage quota exceeded"

**Cause:** localStorage is full (~5-10MB limit)

**Fix:**
1. Delete old stories in view-stories.html
2. Clear localStorage entirely: `localStorage.clear()`
3. Record shorter stories (<2 minutes)

## Summary

This integration creates a complete prototype flow:

1. ✅ Home screen with mode selection
2. ✅ Recording interface with 3-2-1 countdown and pause/resume
3. ✅ Post-recording 4-screen review flow
4. ✅ Story persistence in localStorage
5. ✅ Story viewer with expand/delete

### Key Features

**Recording Flow:**
- **3-2-1 Countdown**: Gives users time to prepare before recording starts
- **Restart Button**: Returns to ready state without navigating away (bug fix applied)
- **State Machine**: Ready → Countdown → Recording → Paused
- **Timer Management**: Proper cleanup of all intervals (countdown + recording timer)

**State Management:**
- `isRestarting` flag prevents unwanted navigation when user restarts recording
- All intervals (countdown, timer) properly cleared on cancel/restart

Total implementation: 4 HTML files, ~2,600 lines of vanilla JS, zero dependencies.

For production use, convert to React components and integrate with Supabase backend as outlined in Phase 1-3 above.
