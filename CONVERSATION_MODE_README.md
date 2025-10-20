# Conversation Mode Integration Guide

This guide shows how to integrate your production guided interview (`dev.heritagewhisper.com/interview-chat`) with the post-recording flow prototype.

## Quick Start

### 1. Add the Integration Script

In your `/interview-chat` page HTML:

```html
<script src="/conversation-mode-integration.js"></script>
```

### 2. Call on Conversation Complete

When the interview ends:

```javascript
await completeConversation({
  qaPairs: [
    {
      question: "Tell me about a meaningful moment.",
      answer: "I met your grandmother at the county fair..."
    },
    {
      question: "What happened next?",
      answer: "She was working at the cotton candy stand..."
    }
  ],
  audioBlob: combinedAudioBlob, // Optional
  fullTranscript: "I met your grandmother...",
  totalDuration: 180 // seconds
});
```

### 3. User Auto-Redirects

The user is automatically sent to `post-recording-flow.html` where they:
- Add title and year
- Upload photos
- Review AI-enhanced story
- Add lesson learned
- Save to localStorage

## Data Structure

The prototype expects this format in `localStorage['hw_recording_data']`:

```javascript
{
  mode: 'conversation',
  audioBlob: 'data:audio/webm;base64,...', // Base64 encoded (optional)
  duration: 180, // Total seconds
  timestamp: '2025-01-19T10:30:00.000Z',
  prompt: null, // Conversation has no single prompt
  rawTranscript: 'Full combined transcript text...',
  qaPairs: [
    {
      question: 'Tell me about...',
      answer: 'I remember when...'
    },
    // ... more Q&A pairs
  ]
}
```

## Integration Options

### Option A: Same Domain (Recommended)

If prototype and production share the same domain:

```javascript
// conversation-mode-integration.js automatically redirects:
window.location.href = '/post-recording-flow.html';
```

**No additional setup needed!**

### Option B: Different Domains

If prototype is on different domain:

**Production app** (auto-implemented):
```javascript
localStorage.setItem('hw_recording_data', JSON.stringify(recordingData));
window.close();
```

**Prototype** (already polling):
- index.html polls for `hw_recording_data` every 2 seconds
- Auto-redirects when data found

### Option C: postMessage API (Advanced)

For real-time cross-window communication:

**Production app**:
```javascript
// Uncomment in conversation-mode-integration.js:
// redirectToPrototype_PostMessage(recordingData);
```

**Prototype** (add to index.html):
```javascript
window.addEventListener('message', (event) => {
  if (event.data.type === 'conversation_complete') {
    localStorage.setItem('hw_recording_data', JSON.stringify(event.data.data));
    window.location.href = 'post-recording-flow.html';
  }
});
```

## Audio Handling

### No Audio (Text Only)

```javascript
await completeConversation({
  qaPairs: [...],
  audioBlob: null,
  fullTranscript: "...",
  totalDuration: 0
});
```

### Single Audio Recording

```javascript
await completeConversation({
  qaPairs: [...],
  audioBlob: singleRecordingBlob,
  fullTranscript: "...",
  totalDuration: 180
});
```

### Multiple Audio Segments

```javascript
// Combine segments first
const combinedBlob = await combineAudioSegments([blob1, blob2, blob3]);

await completeConversation({
  qaPairs: [...],
  audioBlob: combinedBlob,
  fullTranscript: "...",
  totalDuration: 180
});
```

The `combineAudioSegments()` function is included in `conversation-mode-integration.js`.

## Example: Integrate with Existing Chat

If your current interview-chat app has this structure:

```javascript
const conversationState = {
  messages: [
    { role: 'assistant', content: 'Tell me about...' },
    { role: 'user', content: 'I remember when...', audioBlob: blob1 },
    { role: 'assistant', content: 'What happened next?' },
    { role: 'user', content: 'Then we...', audioBlob: blob2 }
  ]
};
```

Transform it to prototype format:

```javascript
// Extract Q&A pairs
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

// Generate transcript
const fullTranscript = qaPairs.map(p => p.answer).join(' ');

// Complete conversation
await completeConversation({
  qaPairs,
  audioBlob: combinedAudio,
  fullTranscript,
  totalDuration: audioSegments.length * 60 // Estimate
});
```

## Testing Checklist

### Basic Flow Test

1. [ ] Open `index.html`
2. [ ] Click "Let's Talk" (Conversation Mode)
3. [ ] Interview window opens at `dev.heritagewhisper.com/interview-chat`
4. [ ] Complete conversation (answer 2-3 questions)
5. [ ] Click "Complete" or equivalent button
6. [ ] Interview window closes (or redirects)
7. [ ] **Prototype auto-detects data** and redirects to `post-recording-flow.html`
8. [ ] Screen 1: Add title and year → Next
9. [ ] Screen 2: Skip photos → Next
10. [ ] Screen 3: Review AI-enhanced story → Next
11. [ ] Screen 4: Edit or skip lesson → Save Story
12. [ ] **Redirects to `view-stories.html`**
13. [ ] Story appears with mode badge: "conversation"

### Audio Test

1. [ ] Record audio during conversation
2. [ ] Audio blob saves to localStorage
3. [ ] Audio player appears in `view-stories.html`
4. [ ] Audio plays correctly

### Edge Cases

1. [ ] Test with 10+ Q&A pairs (long conversation)
2. [ ] Test with no audio (text only)
3. [ ] Test localStorage quota (large audio = warning)
4. [ ] Test browser refresh mid-conversation (resume)
5. [ ] Test mobile Safari and Chrome

## Troubleshooting

### "No recording found" alert

**Cause:** `localStorage['hw_recording_data']` wasn't saved

**Fix:**
1. Check browser console for errors
2. Verify `completeConversation()` was called
3. Check localStorage in DevTools → Application → Local Storage
4. Ensure audio isn't too large (>8MB rejects)

### Conversation data not detected by prototype

**Cause:** Different domains or localStorage not shared

**Fix:**
1. Check if prototype and production are same domain
2. Use Option B (window close + polling) or Option C (postMessage)
3. Verify `hw_awaiting_conversation` flag is set in localStorage

### Audio not playing in viewer

**Cause:** Blob URL expired or audio not saved

**Fix:**
1. Check if `audioBlob` is base64 string in localStorage
2. Verify audio size <8MB
3. Try text-only conversation first to isolate audio issues

### TypeError: combineAudioSegments is not a function

**Cause:** Integration script not loaded

**Fix:**
1. Add `<script src="/conversation-mode-integration.js"></script>` to HTML
2. Verify script path is correct
3. Check browser console for 404 errors

## Production Deployment

### Same Domain Setup (Easiest)

1. Host prototype at `dev.heritagewhisper.com/prototype/`
2. Production app at `dev.heritagewhisper.com/interview-chat`
3. localStorage automatically shared
4. Change redirect in `conversation-mode-integration.js`:
   ```javascript
   window.location.href = '/prototype/post-recording-flow.html';
   ```

### Different Domain Setup

1. Keep current domains
2. Use Option B (window close + polling) - **already implemented**
3. No code changes needed in prototype
4. Just add integration script to production app

## Files Reference

- **`conversation-mode-integration.js`** - Main integration script (add to production)
- **`index.html`** - Home screen (already has polling logic)
- **`post-recording-flow.html`** - 4-screen review flow (already supports conversation mode)
- **`view-stories.html`** - Story viewer (shows conversation badge)

## Next Steps

1. Add `conversation-mode-integration.js` to your production app
2. Call `completeConversation()` when interview ends
3. Test the full flow from index.html
4. Deploy to production when ready

For React/Next.js integration, see `INTEGRATION_GUIDE.md` Phase 1-3.
