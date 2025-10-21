# OpenAI Realtime API Testing Guide

## Overview

The OpenAI Realtime API integration is ready for testing. This guide walks through testing the WebRTC connection and understanding the new architecture.

## What Changed?

**Problem:** Guided interview transcription was failing after 1-2 chunks because slicing WebM blobs creates invalid file fragments without proper container headers.

**Solution:** OpenAI Realtime API with WebRTC transport provides live streaming audio and real-time transcription without blob processing.

## Architecture

### Before (Broken):
1. Record audio → Create blob
2. Slice blob incrementally
3. Send chunks to Whisper API
4. ❌ **FAILS**: Sliced WebM fragments are invalid

### After (Realtime API):
1. Stream mic directly to OpenAI via WebRTC
2. Receive live transcripts via DataChannel
3. No blob slicing needed
4. ✅ **WORKS**: Continuous audio stream

## Files Created

### Backend
- `/app/api/realtime-session/route.ts` - Creates ephemeral client secrets for WebRTC
- Uses `POST /v1/realtime/client_secrets` endpoint (NOT `/sessions` - that's Azure)
- Model: `gpt-realtime-mini` (~$1.13 per 15-min interview)

### Client Libraries
- `/lib/realtimeClient.ts` - WebRTC peer connection management
  - Handles SDP offer/answer flow
  - DataChannel for transcript events
  - No `sampleRate` constraint (WebRTC negotiates 48kHz Opus)
  - Explicit `session.update` with `whisper-1` transcription model
  - Barge-in support (server VAD + client audio pause)

- `/lib/mixedRecorder.ts` - Enhanced mixed audio recording
  - Records mic + assistant audio for family book playback
  - WebM Opus at 48kHz (WebRTC standard)
  - Safari compatibility notes added

### React Integration
- `/hooks/use-realtime-interview.tsx` - React hook abstraction
  - Status management (disconnected/connecting/connected/error)
  - Provisional → final transcript flow
  - Voice toggle support
  - Mixed recording lifecycle
  - Proper cleanup on unmount

### Test Page
- `/app/realtime-test/page.tsx` - Standalone test environment
  - Independent testing before interview-chat integration
  - Feature flag check
  - Auth validation
  - Live transcript display
  - Voice toggle UI
  - Connection status indicators

## Testing Steps

### 1. Enable Feature Flag

Already set in `.env.local`:
```bash
NEXT_PUBLIC_ENABLE_REALTIME=true
```

### 2. Start Dev Server

```bash
npm run dev
```

Server runs on http://localhost:3001 (or 3002 depending on what ports are available)

### 3a. Test Standalone Page (Completed ✅)

Navigate to: **http://localhost:3001/realtime-test**

**What to test:**
1. ✅ **Authentication** - Page should redirect to login if not authenticated
2. ✅ **Feature Flag** - Page should show test UI (not "disabled" message)
3. ✅ **Session Creation** - Click "Start Session" → Status should change to "Connecting" → "Connected"
4. ✅ **Mic Access** - Browser should prompt for microphone permission
5. ✅ **Live Transcription** - Speak into mic → Text appears in "Provisional (live)" section → Moves to "Final transcripts" when you pause
6. ✅ **Voice Toggle** - Click "Voice ON" → Should hear AI assistant responses (test by having it speak)
7. ✅ **Barge-in** - When AI is speaking, start talking → AI audio should pause immediately
8. ✅ **Mixed Recording** - Check console for "Mixed audio: X.XX MB" message when stopping session
9. ✅ **Stop Session** - Click "Stop Session" → Connection closes cleanly

### 3b. Test Interview-Chat Integration (NEW - Ready for Testing)

Navigate to: **http://localhost:3001/interview-chat**

**What's Different from Standalone Test:**
- Integrated into full guided interview flow
- Realtime transcription appears automatically as you speak
- AI generates follow-up questions after each response
- Mixed audio recording saved for family book
- Voice toggle button appears while recording
- Live transcription box shows provisional text in real-time

**What to Test:**

1. **Initial Setup**
   - Click past welcome modal
   - Pearl's greeting should appear
   - First question should load automatically

2. **Recording with Realtime API** (when `NEXT_PUBLIC_ENABLE_REALTIME=true`)
   - Click microphone button to start recording
   - Speak your answer to Pearl's question
   - **Live transcription** should appear in gray box below mode toggle
   - Voice toggle button should appear (ON/OFF)
   - Recording timer should increment

3. **Voice Toggle** (click while recording)
   - OFF = Pearl won't speak out loud (silent mode)
   - ON = Pearl will speak responses (conversational mode)
   - Toggle should persist between recording sessions

4. **Stop Recording**
   - Click red stop button
   - Final transcript should appear in chat as your message
   - Typing indicator should appear
   - AI should generate 3 follow-up question options

5. **Question Options**
   - Select one of the 3 AI-generated options
   - Selected question becomes Pearl's next question
   - Recording interface ready for next response

6. **Complete Interview**
   - Answer at least 2-3 questions
   - Click "Complete Interview" button
   - Should redirect to review page with:
     - Full combined transcript
     - Q&A pairs from conversation
     - Mixed audio blob (mic + Pearl's responses)

7. **Fallback Mode** (when `NEXT_PUBLIC_ENABLE_REALTIME=false`)
   - Set feature flag to `false` in `.env.local`
   - Restart dev server
   - Interview should fall back to traditional MediaRecorder + Whisper API
   - No voice toggle, no provisional transcripts
   - Transcription happens after stopping recording

**Console Logs to Watch For:**

```
[RealtimeInterview] Connected successfully
[RealtimeInterview] Final transcript: [your speech]
[RealtimeInterview] Starting mixed recorder...
[RealtimeInterview] Mixed recording stopped: X bytes
[ChatInput] Final transcript: [your speech]
[InterviewChat] Realtime audio blob received: X bytes
```

**Known Behavior:**
- Provisional text appears character-by-character as you speak (may be fast/slow depending on network)
- Final transcript locks in when you pause for ~300ms (server VAD threshold)
- AI follow-up generation takes ~1-2 seconds after final transcript
- Mixed audio includes both your voice AND Pearl's audio responses

### 4. Check Console Logs

Look for these log patterns:

```
[Realtime] Starting session...
[Realtime] Client secret expires at: [timestamp]
[Realtime] Received assistant audio track
[Realtime] DataChannel open, sending session.update
[Realtime] Connected!
[Realtime] Delta: [partial text]
[Realtime] Final: [complete sentence]
[MixedRecorder] Starting...
[MixedRecorder] Recording started (WebM Opus, 48kHz)
[MixedRecorder] Stopped. Size: X.XX MB
```

### 5. Verify Event Handling

The DataChannel should handle these event types:

**User Speech (Canonical Names):**
- `conversation.item.input_audio_transcription.delta` - Provisional transcript chunks
- `conversation.item.input_audio_transcription.completed` - Final transcript
- `conversation.item.input_audio_transcription.failed` - Error handling

**Assistant Text (Both Variants):**
- `response.text.delta` OR `response.output_text.delta` - Text streaming
- `response.text.done` OR `response.output_text.done` - Text complete

**Speech Detection (for Barge-in):**
- `input_audio_buffer.speech_started` - User started speaking
- `input_audio_buffer.speech_stopped` - User stopped speaking

**Session:**
- `session.updated` - Confirmation of configuration

## Cost Monitoring

**Per-Session Costs (gpt-realtime-mini):**
- Input: $10 per 1M audio tokens (~$0.60 per hour)
- Output: $20 per 1M audio tokens (~$1.20 per hour)
- **Total: ~$1.13 per 15-minute interview**

Compare to previous broken Whisper flow: ~$0.09 per 15 minutes (but didn't work!)

## Known Limitations

1. **Safari WebM Playback**: Safari has inconsistent WebM Opus support in `<audio>` tags
   - **Solution**: Keep WebM as source format, transcode to MP3/AAC server-side for playback
   - Source recording stays WebM Opus (WebRTC standard)

2. **Session Expiry**: Client secrets expire in ~60 seconds
   - **Current**: No explicit expiry handling
   - **Future**: Add reconnection logic with fresh session tokens

3. **Rate Limiting**: Session endpoint needs Upstash Redis integration
   - **Placeholder**: 5 sessions per user per 10 minutes (not enforced yet)

## Next Steps

### Immediate (Testing):
1. ✅ Test standalone page end-to-end
2. ✅ Verify transcription accuracy
3. ✅ Test barge-in behavior
4. ✅ Check mixed audio recording quality

### Integration (Complete):
1. ✅ Integrate Realtime API into `/interview-chat` page
2. ✅ Add fallback to existing Whisper blob flow when Realtime disabled
3. ✅ Handle session expiry and reconnection (auto-reconnect in realtimeClient)
4. ⏳ Add rate limiting to session endpoint (not needed - using direct API key now)

### Production (Future):
1. ⏳ Monitor costs in production
2. ⏳ A/B test Realtime vs Whisper accuracy
3. ⏳ Add server-side MP3/AAC transcode for Safari playback
4. ⏳ Gradual rollout (5% → 25% → 100%)

## Troubleshooting

### "No client_secret in response"
- Check `OPENAI_API_KEY` is set in `.env.local`
- Verify API key has Realtime API access
- Check OpenAI dashboard for API quota/limits

### "Failed to connect to Realtime API"
- Check browser console for ICE connection failures
- Verify firewall/network allows WebRTC connections
- Try different network (corporate firewalls may block WebRTC)

### "Microphone permission denied"
- Browser must have mic access
- Check browser settings → Privacy → Microphone
- Try HTTPS (some browsers require secure context)

### No transcripts appearing
- Check `session.update` was sent (console log should show it)
- Verify `whisper-1` model is in session config
- Check DataChannel is open before speaking

### Audio cuts out during playback
- Barge-in is working correctly - this is expected behavior
- When you speak, assistant audio pauses
- Check `onSpeechStarted` callback is pausing audio element

## Documentation Links

- OpenAI Realtime API: https://platform.openai.com/docs/guides/realtime-webrtc
- WebRTC API: https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API
- MediaStream API: https://developer.mozilla.org/en-US/docs/Web/API/MediaStream
- Mixed Audio Recording: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API

## Support

If you encounter issues not covered here:
1. Check console logs for error details
2. Verify all environment variables are set
3. Test with `/realtime-test` page first
4. Check OpenAI API dashboard for quota/usage
5. Review WebRTC connection state in browser DevTools

---

**Status**: ✅ Standalone test page ready for testing
**Next**: Integration into `/interview-chat` page
