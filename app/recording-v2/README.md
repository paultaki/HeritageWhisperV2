# Recording V2 - State Machine Flow

Experimental recording flow using state machine pattern with three distinct screens: Home → Recording → Review.

## 📌 Current Status & Usage

**Status:** 🧪 **EXPERIMENTAL** (kept for future testing/migration)

**How it's used:**
- **Route:** `/recording-v2` (accessible but NOT linked in navigation)
- **Purpose:** Testing alternative state machine architecture
- **Production Route:** `/recording` (current active recording page)

**Why it exists:**
- Cleaner separation of concerns with distinct screens
- Explicit state machine prevents edge cases
- Better testability and debugging
- Potential future migration candidate

**Recommendation:** Keep for future testing. If this approach proves superior during testing, it could replace `/app/recording/` in the future.

---

## 🎯 Concept: State Machine Architecture

### Three-Screen Flow

```
┌──────────────┐
│  HomeScreen  │  Initial state: Select prompt or start recording
└──────┬───────┘
       │ onStartRecording(prompt?)
       ↓
┌──────────────┐
│  Recording   │  Recording in progress
│    Screen    │
└──────┬───────┘
       │ onFinish(audioBlob, duration)
       ↓
┌──────────────┐
│ ReviewScreen │  Preview, transcribe, save
└──────────────┘
       │ onSave(storyData)
       ↓
   /timeline
```

### State Type Definition

```typescript
type RecordingState =
  | { screen: "home" }
  | { screen: "recording"; prompt?: string; startTime: number }
  | {
      screen: "review";
      audioUrl: string;
      audioBlob: Blob;
      duration: number;
      prompt?: string;
      transcription?: string;
      lessonOptions?: { practical?: string; emotional?: string; character?: string };
      isTranscribing?: boolean;
    };
```

**Benefits:**
- ✅ Impossible states are unrepresentable (TypeScript enforces valid transitions)
- ✅ Clear data flow between screens
- ✅ Easy to add new states (e.g., "paused", "uploading")
- ✅ Predictable behavior

---

## 📁 File Structure

```
/app/recording-v2/
├── page.tsx                      # State machine coordinator (230 lines)
├── README.md                     # This file
└── components/
    ├── HomeScreen.tsx            # Initial screen: prompt selection
    ├── RecordingScreen.tsx       # Active recording UI
    └── ReviewScreen.tsx          # Preview and save
```

---

## 🔧 How It Works

### 1. HomeScreen (Starting Point)

**File:** `components/HomeScreen.tsx` (3,709 bytes)

**Purpose:**
- Display prompt suggestions
- "Start Recording" button
- Pass selected prompt to recording screen

**Key Props:**
```typescript
{
  onStartRecording: (prompt?: string) => void;
}
```

**User Actions:**
- Click a prompt card → Start recording with that prompt
- Click "Start Recording" → Start freeform recording

---

### 2. RecordingScreen (Active Recording)

**File:** `components/RecordingScreen.tsx` (11,866 bytes)

**Purpose:**
- Display countdown (3-2-1)
- Show recording timer
- Audio level visualization
- Stop/Cancel controls

**Key Props:**
```typescript
{
  prompt?: string;                // Optional prompt being answered
  onFinish: (audioBlob: Blob, duration: number, usedPrompt?: string) => void;
  onCancel: () => void;
}
```

**User Actions:**
- Wait through 3-2-1 countdown
- Speak their story
- Click "Stop" → Move to review screen
- Click "Cancel" → Return to home (discard recording)

**Validation:**
- Minimum duration: 30 seconds
- Shows error toast if too short

---

### 3. ReviewScreen (Preview & Save)

**File:** `components/ReviewScreen.tsx` (13,856 bytes)

**Purpose:**
- Audio playback preview
- Show transcription (auto-generated in background)
- Edit story metadata (title, year, lesson learned)
- Save to database

**Key Props:**
```typescript
{
  audioUrl: string;               // Blob URL or uploaded URL
  duration: number;
  prompt?: string;
  transcription?: string;
  lessonOptions?: {
    practical?: string;
    emotional?: string;
    character?: string;
  };
  isTranscribing?: boolean;       // Show loading state
  onSave: (storyData) => void;
  onBack: () => void;
}
```

**Background Processing:**
- Upload audio to `/api/upload/audio`
- Transcribe via `/api/transcribe`
- Update state when transcription completes

**User Actions:**
- Play audio to preview
- Edit title, year, lesson learned
- Click "Save" → Navigate to `/timeline`
- Click "Back" → Discard and return to home

---

## 🔄 State Transitions

### Managed in page.tsx

```typescript
const [state, setState] = useState<RecordingState>({ screen: "home" });

// Handler functions trigger transitions
handleStartRecording()    → { screen: "recording" }
handleFinishRecording()   → { screen: "review", audioUrl, ... }
handleCancelRecording()   → { screen: "home" }
handleSaveStory()         → Navigate to /timeline
handleBackFromReview()    → { screen: "home" }
```

**State Immutability:**
- All transitions create new state objects
- No direct mutations
- TypeScript ensures valid state shapes

---

## 🆚 Comparison to Current Recording Page

| Feature | Current `/recording` | V2 `/recording-v2` |
|---------|---------------------|-------------------|
| **Architecture** | Single page with conditional rendering | State machine with separate screens |
| **State Management** | Multiple useState hooks | Single state machine |
| **Type Safety** | Loose (multiple booleans) | Strong (discriminated union) |
| **Debugging** | Can have impossible states | Always valid state |
| **Code Organization** | Mixed concerns | Clean separation by screen |
| **Testability** | Moderate | High (screen components isolated) |
| **Complexity** | Lower (simpler) | Higher (more structure) |
| **Flexibility** | Moderate | High (easy to add states) |

**Trade-offs:**
- V2 has more boilerplate but is more maintainable
- Current version is simpler but harder to extend
- V2 is better for complex flows (e.g., pause, retake, edit during recording)

---

## 🎨 Design Consistency

### Colors
- **Background:** `#FFFDF7` (warm cream)
- **Primary:** `#2C5282` (blue for buttons)
- **Text:** Gray scale

### Typography
- Matches main app design system
- Large touch targets for seniors

### Loading States
- Spinner while checking auth
- Transcription progress indicator
- Upload feedback

---

## 🚀 How to Test

### 1. Access the Route
```bash
npm run dev
# Navigate to http://localhost:3000/recording-v2
```

### 2. Test Full Flow
1. **HomeScreen:** Click a prompt or "Start Recording"
2. **RecordingScreen:**
   - Wait for countdown
   - Speak for at least 30 seconds
   - Click "Stop"
3. **ReviewScreen:**
   - Wait for transcription to complete
   - Edit title and metadata
   - Click "Save"
4. **Verify:** Story appears on `/timeline`

### 3. Test Error Cases
- **Too short:** Record < 30 seconds → Should show error
- **Cancel:** Click cancel during recording → Should return to home
- **Transcription failure:** Disconnect internet → Should still allow save without transcription
- **Upload failure:** Test network error handling

---

## 🐛 Known Issues & Limitations

### Current Issues
- Not linked in main navigation (intentional - experimental)
- No pause/resume functionality
- No retry if transcription fails (just allows save without it)
- Cancel during recording discards without confirmation

### Future Enhancements (If Migrating)
- [ ] Add "paused" state for pause/resume functionality
- [ ] Add confirmation dialog before canceling
- [ ] Retry button for failed transcription
- [ ] Progress indicator during upload
- [ ] Auto-save draft to local storage
- [ ] Real-time transcription preview
- [ ] Multiple recording takes (retake button)

---

## 🔐 Security & Privacy

### Authentication
- Protected route (redirects to `/auth/login` if not authenticated)
- Uses `useAuth()` hook for session management
- Loading state while checking auth

### Data Handling
- Audio uploaded to `/api/upload/audio`
- Transcription via `/api/transcribe`
- Story saved to database via `/api/stories`
- All API calls use user's session token

### Cleanup
- Blob URLs revoked when going back from review
- No orphaned audio files

---

## 📊 API Endpoints Used

### POST /api/upload/audio
**Purpose:** Upload audio blob to Supabase Storage
**Input:** FormData with audio file
**Output:** `{ url: string }`

### POST /api/transcribe
**Purpose:** Transcribe audio and generate lesson options
**Input:** FormData with audioUrl
**Output:** `{ transcription: string, lessonOptions: {...} }`

### POST /api/stories
**Purpose:** Save story to database
**Input:** JSON with title, transcription, audioUrl, etc.
**Output:** Story object

---

## 🎓 Code Patterns

### State Machine Pattern
```typescript
// Define all possible states
type State = { screen: "a" } | { screen: "b"; data: string };

// Initialize
const [state, setState] = useState<State>({ screen: "a" });

// Transition
setState({ screen: "b", data: "hello" });

// Render based on state
{state.screen === "a" && <ScreenA />}
{state.screen === "b" && <ScreenB data={state.data} />}
```

### Discriminated Union Benefits
```typescript
// TypeScript knows the shape based on screen value
if (state.screen === "review") {
  // state.audioUrl is available here (TypeScript knows!)
  console.log(state.audioUrl);
}
```

### Props Flow
```typescript
// Parent passes handlers to children
<RecordingScreen
  onFinish={(blob, duration) => {
    // Parent handles state transition
    setState({ screen: "review", ... });
  }}
/>
```

---

## 🧪 Testing Scenarios

### Happy Path
1. ✅ Select prompt → Record 60s → Stop → Save with title → See on timeline

### Error Handling
1. ✅ Record 20s → Stop → See "too short" error
2. ✅ Start recording → Cancel → Back to home (no save)
3. ✅ Record → Upload fails → Still see review screen, allow save without transcription

### Edge Cases
1. ✅ Navigate away during recording → Blob URL cleaned up
2. ✅ Not authenticated → Redirect to login
3. ✅ Network slow during transcription → Show loading state

---

## 📝 Migration Considerations

### If Replacing Current /recording

**Pros:**
- ✅ Cleaner code architecture
- ✅ Easier to add features (pause, retake, multi-step)
- ✅ Better type safety
- ✅ Easier to test individual screens

**Cons:**
- ⚠️ More files to maintain
- ⚠️ Slightly more complex for simple use cases
- ⚠️ Need to migrate existing tests

**Migration Path:**
1. Add comprehensive tests to V2
2. Test with real users
3. Add missing features (if any)
4. Archive current `/recording`
5. Rename `/recording-v2` → `/recording`
6. Update navigation links

---

## 📚 Related Documentation

- **Main Documentation:** `/CLAUDE.md`
- **Current Recording:** `/app/recording/` (if exists)
- **Data Model:** `/DATA_MODEL.md`
- **API Routes:** `/app/api/CLAUDE.md`

---

## 🔗 Hooks & Utilities Used

- `useAuth()` - Authentication state
- `useRouter()` - Navigation (Next.js)
- `toast()` - User notifications (Sonner)
- `useState()` - State machine management

---

## ✅ Testing Checklist

- [ ] Authentication redirect works
- [ ] Prompt selection passes to recording screen
- [ ] 3-2-1 countdown displays correctly
- [ ] Recording timer shows elapsed time
- [ ] Audio level visualization works
- [ ] Cancel button returns to home
- [ ] Stop button validates 30-second minimum
- [ ] Review screen shows audio player
- [ ] Transcription loads in background
- [ ] Title, year, lesson fields editable
- [ ] Save button creates story
- [ ] Navigation to /timeline works
- [ ] Back button discards recording
- [ ] Toast notifications appear
- [ ] Loading states display properly

---

**Version:** 2.0.0
**Status:** 🧪 Experimental (For Future Testing)
**Last Updated:** November 17, 2025
**Author:** Paul Takisaki
