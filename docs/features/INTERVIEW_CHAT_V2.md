# Interview Chat V2 - Full Conversational AI

## Overview

This is the V2 version of the interview chat with **full conversational AI** enabled - Pearl actually speaks and asks follow-up questions!

## What's Different from V1?

### V1 (Original - `/interview-chat`)
- ✅ Live transcription only
- ✅ User speaks → transcript appears
- ✅ Separate API call generates 3 written question options
- ✅ User selects one option
- ✅ Cheaper (~$1.13 per 15-min interview)

### V2 (Conversational - `/interview-chat-v2`)
- ✅ Live transcription + AI voice responses
- ✅ User speaks → Pearl **responds with voice**
- ✅ Pearl asks ONE follow-up question automatically
- ✅ Natural back-and-forth conversation
- ✅ More expensive (~$3-5 per 15-min interview)

## How to Test

Navigate to: **http://localhost:3001/interview-chat-v2**

### Testing Flow

1. **Start Session**
   - Click "Start Speaking" button
   - Allow microphone access
   - Wait for "Connected" status

2. **Voice Toggle**
   - **Pearl ON** = You hear Pearl speaking (conversational mode)
   - **Pearl OFF** = Silent mode (transcription only)
   - Toggle anytime during recording

3. **Speak & Listen**
   - Say something (e.g., "I remember when I was 10 years old...")
   - After you pause (~300ms), Pearl will:
     - Transcribe what you said
     - Ask a follow-up question out loud
   - You'll see:
     - Your transcript appear in chat
     - Live transcription box showing what you're saying in real-time
     - Pearl's voice asking a question

4. **Stop Recording**
   - Click red "Stop" button
   - Session ends
   - Mixed audio blob saved (your voice + Pearl's voice)

5. **Complete Interview**
   - Answer a few questions back-and-forth
   - Click "Complete Interview"
   - Redirects to review page with full transcript

## Pearl's Personality

Pearl is configured with these instructions:

```
You are Pearl, a warm and empathetic interview guide for Heritage Whisper,
helping seniors capture their life stories.

Your role:
- After the user shares something, ask ONE brief follow-up question (10-20 words max)
- Dig deeper into emotions, sensory details, relationships, or lessons learned
- Show you're actively listening by referencing what they just said
- Be warm, curious, and respectful - never rush them

Good questions explore:
- "How did that make you feel?"
- "What do you remember most vividly about that moment?"
- "What did that teach you about yourself?"
- "Who else was there, and how did they react?"

Keep it conversational and natural. One question at a time.
```

## Technical Details

### Realtime API Configuration

```typescript
{
  instructions: PEARL_INSTRUCTIONS,
  modalities: ['text', 'audio'],  // Enable voice output
  voice: 'alloy',                  // Pearl's voice
  temperature: 0.8,                // Conversational warmth
}
```

### Voice Options

You can change Pearl's voice in [page.tsx](app/interview-chat-v2/page.tsx:133):
- `'alloy'` - Neutral, clear (current)
- `'echo'` - Male, warm
- `'shimmer'` - Female, bright

### Cost Breakdown

**Per 15-minute interview:**
- Input audio: ~$0.60 (user speaking)
- Output audio: ~$1.20 (Pearl speaking)
- Token-based pricing
- **Total: ~$3-5** depending on conversation length

Compare to V1: ~$1.13 (transcription only)

## Console Logs to Watch

```
[Realtime] Setting instructions: You are Pearl, a warm and empathetic interview guide...
[Realtime] Setting modalities: ['text', 'audio']
[Realtime] Setting voice: alloy
[RealtimeInterview] Connected successfully
[RealtimeInterview] Final transcript: [user speech]
[RealtimeInterview] Starting mixed recorder...
```

## Known Behavior

- **Provisional text**: Appears character-by-character in gray box as you speak
- **Final transcript**: Locks in after 300ms silence (VAD threshold)
- **Pearl's response**: Comes ~1-2 seconds after you stop speaking
- **Barge-in**: If you start speaking while Pearl is talking, she pauses automatically
- **Mixed audio**: Captures both your voice AND Pearl's responses for playback

## Comparison

| Feature | V1 (Transcription Only) | V2 (Conversational) |
|---------|------------------------|---------------------|
| Live transcription | ✅ | ✅ |
| Voice output | ❌ | ✅ |
| Follow-up questions | 3 written options | 1 spoken question |
| User control | Pick from options | Natural conversation |
| Cost | ~$1.13 per 15min | ~$3-5 per 15min |
| UX | Guided, structured | Conversational, natural |

## When to Use Which?

**Use V1 if:**
- Cost is a concern
- Users want to control question direction
- Users prefer reading over listening

**Use V2 if:**
- Natural conversation is priority
- Users enjoy voice interaction
- Quality over cost

## Files Modified

- `/lib/realtimeClient.ts` - Added `RealtimeConfig` support for instructions/modalities/voice
- `/hooks/use-realtime-interview.tsx` - Added `PEARL_INSTRUCTIONS` and config parameter
- `/app/interview-chat-v2/page.tsx` - New V2 page with conversational flow

## Next Steps

If you want to iterate on Pearl's personality:
1. Edit `PEARL_INSTRUCTIONS` in [use-realtime-interview.tsx](hooks/use-realtime-interview.tsx:22-36)
2. Change voice in [page.tsx](app/interview-chat-v2/page.tsx:133)
3. Adjust temperature for more/less creativity

Try it out and see how it feels! 🎙️
