# Interview Chat V2 - Conversational AI with Pearl's Voice

Full conversational AI interview experience where Pearl (the AI interviewer) speaks and asks follow-up questions in real-time.

## 📌 Current Status & Usage

**Status:** ✅ **PRODUCTION READY** (as of November 2025)

**How it's used:**
- **Route:** `/interview-chat-v2` (accessible but NOT linked in main navigation)
- **Purpose:** Premium conversational AI alternative to standard interview flow
- **Cost:** ~$3-5 per 15-minute interview (vs $1.13 for V1)

**Navigation:**
- Standard interview: `/interview-chat` (text-based with written question options)
- Premium interview: `/interview-chat-v2` (voice-based with spoken questions)

**Recommendation:** This can be offered as:
- A premium tier feature for paying subscribers
- An optional upgrade during interview creation
- A feature flag toggle (`NEXT_PUBLIC_ENABLE_CONVERSATIONAL_AI`)

---

## 🎯 What Makes V2 Different?

### V1 (Standard Interview - `/interview-chat`)
- ✅ Live transcription only
- ✅ User speaks → transcript appears
- ✅ AI generates 3 written question options
- ✅ User selects which question to answer
- ✅ Structured, user-controlled experience
- ✅ Cost: ~$1.13 per 15-minute interview

### V2 (Conversational Interview - `/interview-chat-v2`)
- ✅ Live transcription + AI voice responses
- ✅ User speaks → Pearl **responds with voice**
- ✅ Pearl asks ONE follow-up question automatically
- ✅ Natural back-and-forth conversation
- ✅ Conversational, flowing experience
- ✅ Cost: ~$3-5 per 15-minute interview

---

## 🔊 Pearl's Voice & Personality

### Voice Configuration
**Current Voice:** `alloy` (neutral, clear female voice)

**Available Voices:**
- `alloy` - Neutral, clear (current default)
- `echo` - Male, warm
- `shimmer` - Female, bright
- Change in `page.tsx` line 133

### Pearl's Instructions
Pearl is configured to be:
- **Warm and empathetic** - Creates safe space for sharing
- **Brief and focused** - Asks ONE question at a time (10-20 words max)
- **Actively listening** - References what user just said
- **Curious and respectful** - Never rushes the storyteller

**Question Types Pearl Asks:**
- Emotions: "How did that make you feel?"
- Sensory details: "What do you remember most vividly?"
- Lessons: "What did that teach you about yourself?"
- Relationships: "Who else was there, and how did they react?"

---

## 📁 File Structure

```
/app/interview-chat-v2/
├── page.tsx                          # Main interview route (20,873 lines)
├── README.md                         # This file
└── components/
    ├── AudioLevelIndicator.tsx       # Visual audio feedback
    ├── ConnectionStatus.tsx          # Connection state display
    ├── LiveTranscript.tsx            # Real-time transcript viewer
    ├── PearlVoiceToggle.tsx          # Enable/disable Pearl's voice
    ├── StartButton.tsx               # Session start control
    └── [Additional components]
```

---

## 🚀 How to Use

### For Developers (Testing)

1. **Start the app:** `npm run dev`
2. **Navigate to:** `http://localhost:3000/interview-chat-v2`
3. **Allow microphone access** when prompted
4. **Click "Start Speaking"** to begin
5. **Toggle Pearl's voice** on/off as desired
6. **Speak naturally** - Pearl will respond after you pause
7. **Click "Stop"** when done
8. **Click "Complete Interview"** to save

### For End Users (When Enabled)

1. Choose "Conversational Interview" option
2. Start speaking about a memory
3. Listen to Pearl's follow-up questions
4. Answer naturally - like a real conversation
5. Complete when satisfied with the story

---

## 🔧 Technical Implementation

### OpenAI Realtime API Configuration

```typescript
{
  instructions: PEARL_INSTRUCTIONS,   // Pearl's personality and behavior
  modalities: ['text', 'audio'],      // Enable both text and voice
  voice: 'alloy',                     // Pearl's voice selection
  temperature: 0.8,                   // Conversational warmth
  turn_detection: {
    type: 'server_vad',              // Voice Activity Detection
    threshold: 0.5,
    silence_duration_ms: 300         // Wait 300ms of silence before responding
  }
}
```

### Key Technologies
- **OpenAI Realtime API** - Live voice conversation
- **WebRTC** - Real-time audio streaming
- **Voice Activity Detection (VAD)** - Detects when user stops speaking
- **Mixed Audio Recording** - Captures both user and Pearl's voice
- **TanStack Query** - State management
- **Next.js 15 App Router** - React server components

### Hooks Used
- `useRealtimeInterview()` - Main interview orchestration
- `useAuth()` - Authentication state
- `useRouter()` - Navigation
- Custom hooks in `/hooks/use-realtime-interview.tsx`

---

## 💰 Cost Analysis

### Per 15-Minute Interview

**Input Audio (User Speaking):** ~$0.60
- User voice streaming to OpenAI
- Live transcription processing

**Output Audio (Pearl Speaking):** ~$1.20
- AI-generated voice responses
- Follow-up question synthesis

**Total Cost:** ~$3-5 per interview
- Token-based pricing (varies by conversation length)
- ~3x more expensive than V1 ($1.13)

### Cost Optimization Ideas
- Offer as premium tier ($5-10/month unlock)
- Limit to X interviews per month
- Charge per interview ($2-3 each)
- Use for special occasions only

---

## 🎨 User Experience Flow

### 1. Connection Phase
- User clicks "Start Speaking"
- Microphone permission requested
- WebRTC connection established
- Status shows "Connected"

### 2. Conversation Phase
- **User speaks:** "I remember my first day of school..."
- **Live transcript:** Gray box shows words as they're spoken
- **User pauses:** 300ms silence triggers finalization
- **Final transcript:** Locked in and displayed in chat
- **Pearl responds:** Voice plays: "How did that make you feel?"
- **User answers:** Continues the conversation

### 3. Completion Phase
- User clicks "Stop Recording"
- Mixed audio saved (user + Pearl)
- Click "Complete Interview"
- Redirect to review page with full transcript

---

## 🐛 Known Behavior & Quirks

### Expected Behavior
- **Provisional text:** Appears character-by-character as you speak (gray box)
- **300ms delay:** Pearl waits for 300ms of silence before responding
- **Barge-in support:** If you speak while Pearl is talking, she stops automatically
- **Mixed audio:** Final recording includes BOTH voices (for playback authenticity)

### Limitations
- No offline support
- Requires stable internet connection
- Browser must support WebRTC (Chrome, Safari, Edge)
- Microphone access required

---

## 🔐 Security & Privacy

### Authentication
- Requires authenticated session
- Redirects to `/auth/login` if not logged in

### Data Storage
- Full transcript saved to database
- Mixed audio blob stored in Supabase Storage
- User ID linked to interview session

### API Keys
- `NEXT_PUBLIC_OPENAI_API_KEY` required (browser-side for WebRTC)
- OpenAI Realtime API access needed

---

## 📊 Comparison Matrix

| Feature | V1 (Standard) | V2 (Conversational) |
|---------|--------------|---------------------|
| **Live Transcription** | ✅ | ✅ |
| **Voice Output** | ❌ | ✅ Pearl speaks |
| **Follow-up Questions** | 3 written options | 1 spoken question |
| **User Control** | Pick from menu | Natural flow |
| **Cost per 15min** | ~$1.13 | ~$3-5 |
| **UX Style** | Guided, structured | Conversational |
| **Setup Complexity** | Simple | Moderate |
| **Internet Dependency** | Moderate | High (streaming) |

---

## 🎯 Use Cases

### When to Use V2 (Conversational)
- ✅ Premium tier subscribers
- ✅ Users who enjoy voice interaction
- ✅ Quality/experience over cost
- ✅ Marketing demos or special occasions
- ✅ Users with limited tech skills (easier than clicking options)

### When to Use V1 (Standard)
- ✅ Cost-conscious users
- ✅ Users who prefer control over question direction
- ✅ Users who prefer reading over listening
- ✅ Poor internet connections
- ✅ Free tier users

---

## 🔄 Integration Options

### Option 1: Premium Feature Flag
```typescript
// Add to .env.local
NEXT_PUBLIC_ENABLE_CONVERSATIONAL_AI=true

// Conditional rendering
{process.env.NEXT_PUBLIC_ENABLE_CONVERSATIONAL_AI === 'true' && (
  <Link href="/interview-chat-v2">Try Conversational Interview</Link>
)}
```

### Option 2: Subscription Tier
```typescript
// Check user tier
const { subscription } = useAuth();
const canUseConversational = subscription?.tier === 'premium';

// Conditional routing
<Button
  onClick={() => router.push(
    canUseConversational ? '/interview-chat-v2' : '/interview-chat'
  )}
>
  Start Interview
</Button>
```

### Option 3: User Preference
```typescript
// Store preference in user profile
const { conversationalMode } = useUserPreferences();

// Route based on preference
const interviewRoute = conversationalMode
  ? '/interview-chat-v2'
  : '/interview-chat';
```

---

## 🛠️ Customization Guide

### Changing Pearl's Voice
**File:** `page.tsx` (line 133)
```typescript
voice: 'shimmer'  // Change from 'alloy' to 'shimmer' or 'echo'
```

### Adjusting Pearl's Personality
**File:** `/hooks/use-realtime-interview.tsx` (lines 22-36)
```typescript
const PEARL_INSTRUCTIONS = `
You are Pearl, a [YOUR PERSONALITY HERE]...
`;
```

### Modifying Response Timing
**File:** `page.tsx` (VAD configuration)
```typescript
turn_detection: {
  silence_duration_ms: 500  // Increase for slower responses
}
```

### Changing Temperature (Creativity)
**File:** `page.tsx`
```typescript
temperature: 0.9  // Higher = more creative (0.0 - 1.0)
```

---

## 📝 Testing Checklist

- [ ] Microphone permission works
- [ ] Connection status shows "Connected"
- [ ] Live transcription appears as user speaks
- [ ] Pearl responds after user pauses
- [ ] Voice toggle mutes/unmutes Pearl
- [ ] Barge-in works (user can interrupt Pearl)
- [ ] Stop button ends session
- [ ] Mixed audio includes both voices
- [ ] Complete Interview saves transcript
- [ ] Redirect to review page works

---

## 📚 Related Documentation

- **Main Documentation:** `/CLAUDE.md`
- **V2 Details:** `/INTERVIEW_CHAT_V2.md`
- **AI Prompting:** `/AI_PROMPTING.md`
- **Realtime Client:** `/lib/realtimeClient.ts`
- **Interview Hook:** `/hooks/use-realtime-interview.tsx`
- **Standard Interview (V1):** `/app/interview-chat/` (if exists)

---

## 🔗 External Resources

- [OpenAI Realtime API Docs](https://platform.openai.com/docs/guides/realtime)
- [WebRTC API Reference](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [Voice Activity Detection](https://platform.openai.com/docs/guides/realtime#server-vad)

---

**Version:** 2.0.0
**Status:** ✅ Production Ready (Premium Feature)
**Last Updated:** November 17, 2025
**Author:** Paul Takisaki
