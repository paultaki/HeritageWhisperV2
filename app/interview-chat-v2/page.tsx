"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { WelcomeModal } from "./components/WelcomeModal";
import { ChatMessage } from "./components/ChatMessage";
import { QuestionOptions } from "./components/QuestionOptions";
import { TypingIndicator } from "./components/TypingIndicator";
import { ChatInput } from "./components/ChatInput";
import { StorySplitModal } from "./components/StorySplitModal";
import { ThemeSelector } from "./components/ThemeSelector";
import { useRealtimeInterview } from "@/hooks/use-realtime-interview";
import { type InterviewTheme, getFirstMainPrompt } from "@/lib/interviewThemes";
import {
  completeConversationAndRedirect,
  extractQAPairs,
  combineAudioBlobs, // This might become redundant if we use getMixedAudioBlob/getUserAudioBlob
} from "@/lib/conversationModeIntegration";
import { useRecordingState } from "@/contexts/RecordingContext";
import { Loader2, Check, RefreshCw, AlertTriangle, Mic, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";


export type MessageType =
  | 'system'
  | 'question'
  | 'audio-response'
  | 'text-response'
  | 'typing'
  | 'question-options';

export type Message = {
  id: string;
  type: MessageType;
  content: string;
  audioBlob?: Blob;
  audioDuration?: number;
  timestamp: Date;
  sender: 'hw' | 'user' | 'system';
  options?: string[];
  selectedOption?: number;
};

export type AudioState = {
  chunks: Blob[];
  fullTranscript: string;
  totalDuration: number;
};

export default function InterviewChatPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Traditional recording state
  const {
    isRecording,
    startRecording: startTraditionalRecording,
    stopRecording: stopTraditionalRecording,
    // getRecordedBlob, // Not available in this hook version?
    // getRecordedDuration, // Not available?
  } = useRecordingState();

  // Realtime interview state
  const {
    startSession,
    stopSession,
    status,
    conversationPhase,
    getMixedAudioBlob,
    getUserAudioBlob,
    recordingDuration,
    handleTranscriptUpdate: handleRealtimeTranscriptUpdate,
    handleAudioResponse: handleRealtimeAudioResponse,
  } = useRealtimeInterview();

  const [showWelcome, setShowWelcome] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [followUpCount, setFollowUpCount] = useState(0);

  // Interview phase tracking (research-backed warm-up flow)
  type InterviewPhase = 'theme_selection' | 'warmup' | 'main';
  const [interviewPhase, setInterviewPhase] = useState<InterviewPhase>('theme_selection');
  const [selectedTheme, setSelectedTheme] = useState<InterviewTheme | null>(null);
  const [warmUpIndex, setWarmUpIndex] = useState(0); // Track which warm-up question we're on

  // Story Mode state
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [detectedStories, setDetectedStories] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSplitting, setIsSplitting] = useState(false);

  // Session timer state
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0); // in seconds
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Check if feature is enabled (for beta launch)
  // Default to true for development/testing if env var is not set
  const isFeatureEnabled = process.env.NEXT_PUBLIC_FEATURE_REALTIME_INTERVIEW !== 'false';

  // Check if Realtime API is enabled
  const isRealtimeEnabled = process.env.NEXT_PUBLIC_ENABLE_REALTIME !== 'false';

  const [audioState, setAudioState] = useState<AudioState>({
    chunks: [],
    fullTranscript: '',
    totalDuration: 0,
  });

  // Auto-save draft state
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [existingDraft, setExistingDraft] = useState<{
    id: string;
    transcriptJson: Message[];
    theme: string | null;
    sessionDuration: number;
    updatedAt: string;
  } | null>(null);
  const [draftCheckComplete, setDraftCheckComplete] = useState(false); // Track if we've checked for drafts
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Error handling state
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [showErrorFallback, setShowErrorFallback] = useState(false);

  // Custom confirmation modal state (replaces browser confirm dialogs)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [pendingResponseCount, setPendingResponseCount] = useState(0);

  // Helper to convert base64 to blob
  const dataURItoBlob = (dataURI: string) => {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  };

  const proceedWithSingleStory = async (analyzedStory?: any) => {
    setIsProcessing(true);
    try {
      let mixedBlob: Blob | null = null;
      let userBlob: Blob | null = null;
      let finalDuration = 0;

      if (isRealtimeEnabled) {
        mixedBlob = getMixedAudioBlob();
        userBlob = getUserAudioBlob();
        finalDuration = recordingDuration;
      } else {
        mixedBlob = await combineAudioBlobs(audioState.chunks); // Combine traditional chunks
        userBlob = mixedBlob; // In traditional, user and mixed are the same
        finalDuration = audioState.totalDuration;
      }

      const qaPairs = extractQAPairs(messages);

      const fullTranscript = messages
        .filter(m => m.type !== 'system')
        .map(m => `${m.sender === 'user' ? 'User' : 'Pearl'}: ${m.content}`)
        .join('\n\n');

      // Delete draft before redirecting (draft no longer needed after successful save)
      await deleteDraft();

      await completeConversationAndRedirect({
        qaPairs,
        audioBlob: mixedBlob,
        userOnlyAudioBlob: userBlob,
        fullTranscript: analyzedStory?.bridged_text || fullTranscript, // Use bridged text if available
        totalDuration: finalDuration
      }, analyzedStory ? [analyzedStory] : []); // Pass as an array if it's a single story

    } catch (error) {
      console.error('Failed to complete conversation:', error);
      setIsProcessing(false);
    } finally {
      setIsAnalyzing(false);
      setIsProcessing(false);
    }
  };

  const handleSplitConfirm = async () => {
    setIsSplitting(true);
    try {
      let userAudioBlob: Blob | null = null;
      let finalDuration = 0;

      if (isRealtimeEnabled) {
        userAudioBlob = getUserAudioBlob();
        finalDuration = recordingDuration;
      } else {
        userAudioBlob = await combineAudioBlobs(audioState.chunks);
        finalDuration = audioState.totalDuration;
      }

      if (!userAudioBlob) throw new Error('No user audio found to split.');

      // The analysis API returns start/end indices of TEXT.
      // We need to map char index to time.
      // For now, let's assume the `detectedStories` from `/api/analyze-stories`
      // already contains `start_time` and `end_time` for each story segment.
      // This would require the `analyze-stories` API to perform this mapping or estimation.

      const splitSegments = detectedStories.map(s => ({
        start: s.start_time || 0, // Assuming start_time is provided by API
        end: s.end_time || finalDuration, // Assuming end_time is provided by API
        title: s.title
      }));

      const splitFormData = new FormData();
      splitFormData.append('audio', userAudioBlob);
      splitFormData.append('segments', JSON.stringify(splitSegments));

      const splitRes = await fetch('/api/process-audio/split', {
        method: 'POST',
        body: splitFormData
      });

      if (!splitRes.ok) throw new Error('Splitting failed');

      const { files } = await splitRes.json();

      // Map back to stories
      const finalStories = detectedStories.map((story, i) => {
        const file = files.find((f: any) => f.index === i);
        // Convert base64 url to blob
        const blob = file ? dataURItoBlob(file.url) : userAudioBlob; // Fallback to full blob if split fails for a segment

        return {
          title: story.title,
          bridged_text: story.bridged_text,
          audioBlob: blob,
          duration: file ? file.duration : finalDuration // Fallback to full duration
        };
      });

      // We still need to pass the full conversation data for overall context
      const qaPairs = extractQAPairs(messages);
      const fullTranscript = messages.map(m => m.content).join('\n');
      const mixedAudioBlob = isRealtimeEnabled ? getMixedAudioBlob() : await combineAudioBlobs(audioState.chunks);

      await completeConversationAndRedirect({
        qaPairs,
        audioBlob: mixedAudioBlob, // Original full mixed audio
        userOnlyAudioBlob: userAudioBlob, // Original full user audio
        fullTranscript,
        totalDuration: finalDuration
      }, finalStories); // Pass the array of split stories

    } catch (error) {
      console.error('Split error:', error);
      // Fallback to single story flow if splitting fails
      await proceedWithSingleStory();
    } finally {
      setIsSplitting(false);
      setShowSplitModal(false);
      setIsAnalyzing(false);
      setIsProcessing(false);
    }
  };

  // Handle conversation completion - step 1: show confirmation modal
  const handleComplete = useCallback(async () => {
    // Require at least one Q&A exchange
    const userResponses = messages.filter(m =>
      m.type === 'audio-response' || m.type === 'text-response'
    );

    if (userResponses.length === 0) {
      alert('Please answer at least one question before completing the interview.');
      return;
    }

    // Show custom confirmation modal instead of browser confirm
    setPendingResponseCount(userResponses.length);
    setShowCompleteConfirm(true);
  }, [messages]);

  // Handle confirmed completion - step 2: actually process
  const handleConfirmedComplete = useCallback(async () => {
    setShowCompleteConfirm(false);

    // Stop recording if active
    if (isRealtimeEnabled && status === 'connected') {
      stopSession();
    } else if (isRecording) {
      stopTraditionalRecording();
    }

    setIsAnalyzing(true);

    try {
      // 1. Get full transcript
      const fullTranscript = messages
        .filter(m => m.type !== 'system')
        .map(m => `${m.sender === 'user' ? 'Grandparent' : 'Grandchild'}: ${m.content}`)
        .join('\n');

      // 2. Analyze for stories
      const response = await fetch('/api/analyze-stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: fullTranscript,
          userName: user?.name
        }),
      });

      if (!response.ok) throw new Error('Analysis failed');

      const result = await response.json();

      if (result.stories && result.stories.length > 1) {
        // Found multiple stories! Show modal
        setDetectedStories(result.stories);
        setShowSplitModal(true);
        setIsAnalyzing(false);
      } else {
        // Just one story, proceed as normal
        await proceedWithSingleStory(result.stories?.[0]);
      }
    } catch (error) {
      console.error('Analysis error:', error);
      // Fallback to single story flow
      await proceedWithSingleStory();
    }
  }, [messages, isRealtimeEnabled, status, isRecording, stopSession, stopTraditionalRecording, user?.name, audioState.chunks, audioState.totalDuration, recordingDuration, getMixedAudioBlob, getUserAudioBlob, proceedWithSingleStory]);

  // Redirect if not authenticated (only after loading completes)
  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, isAuthLoading, router]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Session timer - starts when welcome is dismissed
  useEffect(() => {
    if (sessionStartTime) {
      // Update timer every second
      sessionTimerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
        setSessionDuration(elapsed);

        // Show warning at 25 minutes (1500 seconds)
        if (elapsed === 1500) {
          setShowTimeWarning(true);
        }

        // Auto-complete at 30 minutes (1800 seconds)
        if (elapsed >= 1800) {
          handleComplete(); // Use the new handleComplete
        }
      }, 1000);

      return () => {
        if (sessionTimerRef.current) {
          clearInterval(sessionTimerRef.current);
        }
      };
    }
  }, [sessionStartTime, handleComplete]); // Add handleComplete to dependencies

  // Warn user before leaving during active interview
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Only warn if session is active and user has given at least one response
      const hasResponses = messages.some(m =>
        m.type === 'audio-response' || m.type === 'text-response'
      );

      if (sessionStartTime && hasResponses) {
        e.preventDefault();
        e.returnValue = 'You have an interview in progress. Your responses will be lost if you leave. Are you sure?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [sessionStartTime, messages]);

  // Clean up recording state on unmount
  useEffect(() => {
    return () => {
      // Stop recording if user navigates away
      stopTraditionalRecording();
      stopSession(); // Stop realtime session too
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
      }
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [stopTraditionalRecording, stopSession]);

  // Check for existing draft on mount - MUST complete before showing welcome
  useEffect(() => {
    const checkForDraft = async () => {
      if (!user) {
        setDraftCheckComplete(true);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          setDraftCheckComplete(true);
          return;
        }

        const response = await fetch('/api/interview-drafts', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.draft && data.draft.transcriptJson?.length > 0) {
            setExistingDraft(data.draft);
            setShowResumeModal(true);
            setShowWelcome(false); // Hide welcome when resume modal shows
          }
        }
      } catch (error) {
        console.error('Failed to check for draft:', error);
      } finally {
        setDraftCheckComplete(true);
      }
    };

    checkForDraft();
  }, [user]);

  // Auto-save interval (every 60 seconds during active session)
  useEffect(() => {
    // Only auto-save if session is active and has responses
    const hasResponses = messages.some(m =>
      m.type === 'audio-response' || m.type === 'text-response'
    );

    if (!sessionStartTime || !hasResponses) {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
      return;
    }

    const saveDraft = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;

        // Serialize messages (remove non-serializable audioBlob)
        const serializableMessages = messages.map(m => ({
          id: m.id,
          type: m.type,
          content: m.content,
          timestamp: m.timestamp.toISOString(),
          sender: m.sender,
          options: m.options,
          selectedOption: m.selectedOption,
          // Note: audioBlob is not serialized - transcript is saved instead
        }));

        await fetch('/api/interview-drafts', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            transcriptJson: serializableMessages,
            theme: selectedTheme?.id || null,
            sessionDuration: sessionDuration,
          }),
        });
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    };

    // Save immediately on first mount with responses
    saveDraft();

    // Then save every 60 seconds
    autoSaveTimerRef.current = setInterval(saveDraft, 60000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
    };
  }, [sessionStartTime, messages, selectedTheme, sessionDuration]);

  // Delete draft after successful story completion
  const deleteDraft = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      await fetch('/api/interview-drafts', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
    } catch (error) {
      console.error('Failed to delete draft:', error);
    }
  };

  // Handle resume from draft
  const handleResumeDraft = () => {
    if (!existingDraft) return;

    // Restore messages (convert timestamp strings back to Date objects)
    const restoredMessages: Message[] = existingDraft.transcriptJson.map(m => ({
      ...m,
      timestamp: new Date(m.timestamp),
    }));

    setMessages(restoredMessages);
    setSessionDuration(existingDraft.sessionDuration || 0);
    setSessionStartTime(Date.now() - (existingDraft.sessionDuration || 0) * 1000);

    // Find and restore theme if available
    if (existingDraft.theme) {
      // Theme restoration would require importing interviewThemes
      // For now, just skip to main phase
      setInterviewPhase('main');
    } else {
      setInterviewPhase('main');
    }

    setShowResumeModal(false);
    setShowWelcome(false);

    // Start recording session
    if (isRealtimeEnabled) {
      startSession(
        (text) => handleTranscriptUpdate(text, true),
        undefined, // onError
        undefined, // config
        handlePearlResponse, // onAssistantResponse
        undefined, // onUserSpeechStart
        user?.name // userName
      );
    } else {
      startTraditionalRecording('conversation');
    }
  };

  // Handle starting fresh (discard draft)
  const handleStartFresh = async () => {
    await deleteDraft();
    setExistingDraft(null);
    setShowResumeModal(false);

    // Reset all interview state to start fresh
    setMessages([]);
    setSelectedTheme(null);
    setInterviewPhase('theme_selection');
    setWarmUpIndex(0);
    setFollowUpCount(0);
    setSessionStartTime(null);
    setSessionDuration(0);
    setAudioState({ chunks: [], fullTranscript: '', totalDuration: 0 });
    setShowWelcome(true); // Show welcome modal again
  };

  // Handle retry connection after error
  const handleRetryConnection = async () => {
    if (!selectedTheme) {
      setShowErrorFallback(false);
      setConnectionError(null);
      setInterviewPhase('theme_selection');
      return;
    }

    setShowErrorFallback(false);
    setConnectionError(null);

    try {
      await startSession(
        (text) => handleTranscriptUpdate(text, true),
        (error) => {
          console.error('Realtime session retry error:', error);
          setConnectionError(error.message);
          setShowErrorFallback(true);
        },
        undefined, // config
        handlePearlResponse, // onAssistantResponse
        undefined, // onUserSpeechStart
        user?.name // userName
      );
    } catch (error) {
      console.error('Failed to retry realtime session:', error);
      setConnectionError(error instanceof Error ? error.message : 'Failed to connect');
      setShowErrorFallback(true);
    }
  };

  // Handle fallback to standard recording
  const handleFallbackToRecording = () => {
    router.push('/recording');
  };

  // Handle cancel interview - step 1: check if confirmation needed
  const handleCancelInterview = () => {
    // Show confirmation if session has started (regardless of whether user has responded)
    // This prevents accidental cancellation when Pearl is speaking or user is about to respond
    if (sessionStartTime) {
      setShowCancelConfirm(true);
      return;
    }

    // No session started yet, cancel immediately (shouldn't happen in normal flow)
    performCancelInterview();
  };

  // Handle confirmed cancel - step 2: actually cancel
  const performCancelInterview = () => {
    setShowCancelConfirm(false);

    // Clean up session
    stopSession();
    stopTraditionalRecording();
    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
    }

    // Delete any draft
    deleteDraft();

    // Navigate back
    router.push('/timeline');
  };

  // Initialize conversation after welcome dismissed
  const handleWelcomeDismiss = () => {
    setShowWelcome(false);
    // Show theme selector (don't start session yet)
    setInterviewPhase('theme_selection');
  };

  // Handle theme selection - start the warm-up phase
  const handleThemeSelect = async (theme: InterviewTheme) => {
    console.log('[InterviewChat] 🎯 handleThemeSelect called with theme:', theme.id);
    console.log('[InterviewChat] isRealtimeEnabled:', isRealtimeEnabled);

    setSelectedTheme(theme);
    setInterviewPhase('warmup');
    setWarmUpIndex(0);
    setConnectionError(null);
    setShowErrorFallback(false);

    // Start session timer
    setSessionStartTime(Date.now());

    // Build custom instructions for Pearl based on selected theme
    const customInstructions = `You are a curious, loving, and patient grandchild interviewing your grandparent (or elder relative) for HeritageWhisper.

CRITICAL: You MUST speak ONLY in English. Never speak Spanish or any other language.

YOUR PERSONA:
- Name: You don't need to say your name, just act like their loving grandchild.
- Tone: Warm, enthusiastic, respectful, and genuinely curious.
- Voice: You are talking to your grandparent. Be gentle but engaged.

=== SESSION START ===
When the conversation FIRST begins (your very first response), ask this warm-up question to get started:
"${theme.warmUpQuestions[0]}"

Do NOT add a greeting or introduction before the question. Just ask the question warmly and naturally.

=== YOUR GOAL ===
- Help them tell RICH, VIVID stories full of sensory details and emotion.
- Make them feel listened to and valued.
- Go DEEP on each topic before moving to new ones.

=== SENSORY PROBING TECHNIQUES (Use these!) ===
When they mention a memory, help them "place themselves there" with these probes:

PLACE: "Picture yourself there. What do you see around you?"
SENSES: "What did it smell like? Sound like? Feel like?"
PEOPLE: "Who else was there? What were they wearing or doing?"
TIME: "What time of year was this? How old were you?"
OBJECTS: "What were you holding? What was in the room?"

Example:
User: "I remember my grandmother's kitchen."
You: "Oh, her kitchen! Close your eyes for a moment - what's the first thing you smell when you walk in?"
User: "Cinnamon. She was always baking."
You: "Cinnamon! Was there a favorite thing she baked? What did it look like coming out of the oven?"

=== 3-LAYER DEPTH STRATEGY ===
Stay on the SAME topic until you've explored all three layers:

Layer 1 (FACTS): "What happened next?" / "Then what?"
Layer 2 (FEELINGS): "How did that make you feel in that moment?"
Layer 3 (MEANING): "Looking back now, why do you think that mattered?"

ONLY move to a new topic after exploring all three layers, or if they signal they want to move on.

=== HOW TO SPEAK ===
- Use simple, natural language. Don't sound like a robot or a professor.
- Say things like: "Wow!", "Really?", "That's amazing!", "I never knew that!"
- If they mention a specific person or place, ask about it: "Who was that?", "What did it look like?"
- If they pause, give them time. Say: "Take your time... I'm right here."
- If they get emotional, be supportive: "It's okay to feel that way. I'm here listening."
- Acknowledge what they said before asking the next question.

=== KEY RULES ===
- Ask ONE question at a time.
- Keep your responses short (1-2 sentences max) so they can talk more.
- NEVER make up facts. If you don't know something, ask them!
- If their answer is short or surface-level, gently probe for more detail using sensory questions.`;

    // Start recording state for the interview
    if (isRealtimeEnabled) {
      console.log('[InterviewChat] 🚀 Starting Realtime session...');
      try {
        await startSession(
          (text) => handleTranscriptUpdate(text, true),
          (error) => {
            // Error callback from hook
            console.error('[InterviewChat] ❌ Realtime session error:', error);
            setConnectionError(error.message);
            setShowErrorFallback(true);
          },
          { instructions: customInstructions }, // Pass custom instructions
          handlePearlResponse, // onAssistantResponse
          undefined, // onUserSpeechStart
          user?.name // userName
        );
        console.log('[InterviewChat] ✅ Realtime session started successfully');
      } catch (error) {
        console.error('[InterviewChat] ❌ Failed to start realtime session:', error);
        setConnectionError(error instanceof Error ? error.message : 'Failed to connect');
        setShowErrorFallback(true);
        return; // Don't proceed if connection fails
      }
    } else {
      console.log('[InterviewChat] 📼 Using traditional recording (Realtime disabled)');
      startTraditionalRecording('conversation');
    }

    // Add initial greeting
    const greeting: Message = {
      id: `msg-${Date.now()}`,
      type: 'system',
      content: `Welcome, ${user?.name?.split(' ')[0] || 'friend'}! I'm Pearl, your Heritage Whisper guide. Let's explore "${theme.title}" together.`,
      timestamp: new Date(),
      sender: 'system',
    };

    setMessages([greeting]);

    // Pearl will ask the first warm-up question via Realtime API
    // (her spoken response will be captured via handlePearlResponse and added to messages)
    // For traditional mode, add the warm-up question manually
    if (!isRealtimeEnabled) {
      setTimeout(() => {
        addWarmUpQuestion(theme, 0);
      }, 800);
    }
  };

  // Add a warm-up question (ice-breaker)
  const addWarmUpQuestion = (theme: InterviewTheme, index: number) => {
    const warmUpQuestions = theme.warmUpQuestions;
    if (index >= warmUpQuestions.length) {
      // All warm-up done, transition to main interview
      transitionToMainInterview(theme);
      return;
    }

    const warmUpMsg: Message = {
      id: `msg-warmup-${Date.now()}`,
      type: 'question',
      content: warmUpQuestions[index],
      timestamp: new Date(),
      sender: 'hw',
    };

    setMessages(prev => [...prev, warmUpMsg]);
    setWarmUpIndex(index);
  };

  // Transition from warm-up to main interview
  const transitionToMainInterview = (theme: InterviewTheme) => {
    setInterviewPhase('main');

    // Add transition message
    const transitionMsg: Message = {
      id: `msg-transition-${Date.now()}`,
      type: 'system',
      content: "Wonderful! Now let's dive a little deeper...",
      timestamp: new Date(),
      sender: 'system',
    };

    setMessages(prev => [...prev, transitionMsg]);

    // Add first main question
    setTimeout(() => {
      addFirstQuestion(theme);
    }, 1000);
  };

  // Add the first main interview question (themed)
  const addFirstQuestion = (theme?: InterviewTheme) => {
    const questionContent = theme
      ? getFirstMainPrompt(theme.id)
      : 'Tell me about a moment that changed how you saw yourself.';

    const firstQuestion: Message = {
      id: `msg-${Date.now()}`,
      type: 'question',
      content: questionContent,
      timestamp: new Date(),
      sender: 'hw',
    };

    setMessages(prev => [...prev, firstQuestion]);
  };

  // Handle transcript updates from Realtime API
  const handleTranscriptUpdate = (text: string, isFinal: boolean) => {
    console.log('[InterviewChat] 📝 handleTranscriptUpdate called:', { text: text?.substring(0, 50), isFinal });

    if (isRealtimeEnabled) {
      handleRealtimeTranscriptUpdate(text, isFinal);
      if (isFinal && text && text.trim()) {
        // Final transcript received - add as user message
        console.log('[InterviewChat] Adding user message bubble');
        const userMessage: Message = {
          id: `msg-${Date.now()}`,
          type: 'audio-response',
          content: text,
          timestamp: new Date(),
          sender: 'user',
        };

        setMessages(prev => [...prev, userMessage]);

        // Handle based on interview phase
        if (interviewPhase === 'warmup' && selectedTheme) {
          // In warmup phase, Pearl naturally continues the conversation
          // After 2 user responses, transition to main interview
          const userResponseCount = messages.filter(m => m.type === 'audio-response' || m.type === 'text-response').length + 1;

          if (userResponseCount >= 2) {
            // Warm-up complete, transition to main interview
            setTimeout(() => {
              transitionToMainInterview(selectedTheme);
            }, 1000);
          }
          // Otherwise, Pearl will naturally ask the next question via Realtime API
          // Her response will be captured by handlePearlResponse
        } else {
          // Main interview - show typing indicator and generate follow-up
          addTypingIndicator();
          setTimeout(async () => {
            await generateFollowUpQuestions(text); // Pass the current response text for context
          }, 1500);
        }
      }
    }
    // Provisional transcripts are displayed in ChatInput component
  };

  // Handle audio response (traditional mode or from Realtime API after stop)
  const handleAudioResponse = async (audioBlob: Blob, duration: number) => {
    if (isRealtimeEnabled) {
      // In Realtime mode, transcripts are handled via handleTranscriptUpdate
      // This is just called to store the audio blob for archival
      handleRealtimeAudioResponse(audioBlob, duration); // Store blob in realtime hook
      return;
    }

    // Traditional mode - add user's audio message to chat
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      type: 'audio-response',
      content: '', // Will be filled with transcript
      audioBlob,
      audioDuration: duration,
      timestamp: new Date(),
      sender: 'user',
    };

    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);

    try {
      // Transcribe the COMPLETE audio blob (not sliced chunks)
      // Slicing WebM creates invalid audio files - we need the full blob with headers
      const transcription = await transcribeChunk(audioBlob);

      // Update full transcript by appending this response
      const updatedTranscript = audioState.fullTranscript
        ? audioState.fullTranscript + ' ' + transcription
        : transcription;

      setAudioState(prev => ({
        ...prev,
        fullTranscript: updatedTranscript,
        chunks: [...prev.chunks, audioBlob],
      }));

      // Update message with transcript
      setMessages(prev => prev.map(msg =>
        msg.id === userMessage.id
          ? { ...msg, content: transcription }
          : msg
      ));

      // Show typing indicator
      addTypingIndicator();

      // Generate follow-up questions
      setTimeout(async () => {
        await generateFollowUpQuestions(transcription); // Pass the current response text for context
      }, 1500);

    } catch (error) {
      console.error('Error processing audio:', error);

      // Show error message to user
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        type: 'question',
        content: error instanceof Error
          ? `Sorry, there was an error transcribing your audio: ${error.message}. Please try recording again.`
          : 'Sorry, there was an error processing your response. Please try again.',
        timestamp: new Date(),
        sender: 'hw',
      };

      setMessages(prev => {
        // Remove typing indicator if present
        const filtered = prev.filter(msg => msg.type !== 'typing');
        return [...filtered, errorMsg];
      });

      setIsProcessing(false);
    }
  };

  // Handle text response
  const handleTextResponse = async (text: string) => {
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      type: 'text-response',
      content: text,
      timestamp: new Date(),
      sender: 'user',
    };

    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);

    // Update transcript with text (for traditional mode tracking)
    if (!isRealtimeEnabled) {
      const updatedTranscript = audioState.fullTranscript + ' ' + text;
      setAudioState(prev => ({
        ...prev,
        fullTranscript: updatedTranscript,
      }));
    }

    // Handle based on interview phase
    if (interviewPhase === 'warmup' && selectedTheme) {
      // Progress to next warm-up question or transition to main
      const nextIndex = warmUpIndex + 1;
      setIsProcessing(false);
      if (nextIndex < selectedTheme.warmUpQuestions.length) {
        setTimeout(() => {
          addWarmUpQuestion(selectedTheme, nextIndex);
        }, 1000);
      } else {
        setTimeout(() => {
          transitionToMainInterview(selectedTheme);
        }, 1000);
      }
    } else {
      // Main interview - show typing indicator and generate follow-up
      addTypingIndicator();
      setTimeout(async () => {
        await generateFollowUpQuestions(text);
      }, 1500);
    }
  };

  // Add typing indicator (only if not already present)
  const addTypingIndicator = () => {
    setMessages(prev => {
      // Don't add if already showing typing indicator
      if (prev.some(msg => msg.type === 'typing')) {
        return prev;
      }

      const typingMsg: Message = {
        id: `typing-${Date.now()}`, // Unique ID to prevent React key warnings
        type: 'typing',
        content: '',
        timestamp: new Date(),
        sender: 'hw',
      };

      return [...prev, typingMsg];
    });
  };

  // Remove typing indicator
  const removeTypingIndicator = () => {
    setMessages(prev => prev.filter(msg => msg.type !== 'typing'));
  };

  // Handle Pearl's realtime responses (from OpenAI Realtime API)
  const handlePearlResponse = useCallback((text: string) => {
    console.log('[InterviewChat] 🎙️ handlePearlResponse called:', text?.substring(0, 50) + '...');

    if (text === '__COMPOSING__') {
      // Pearl started speaking - show typing indicator
      console.log('[InterviewChat] Pearl started composing...');
      addTypingIndicator();
      return;
    }

    // Pearl finished - remove typing indicator and add her message
    console.log('[InterviewChat] Pearl finished speaking, adding message bubble');
    removeTypingIndicator();

    if (text && text.trim()) {
      const pearlMessage: Message = {
        id: `msg-pearl-${Date.now()}`,
        type: 'question', // Pearl's responses are displayed as questions
        content: text.trim(),
        timestamp: new Date(),
        sender: 'hw',
      };

      setMessages(prev => [...prev, pearlMessage]);
    }
  }, []);

  // Transcribe audio blob (traditional mode only)
  const transcribeChunk = async (audioBlob: Blob): Promise<string> => {
    // Determine file extension based on MIME type
    const mimeType = audioBlob.type;
    let extension = 'webm';
    if (mimeType.includes('mp4')) extension = 'mp4';
    else if (mimeType.includes('mpeg')) extension = 'mpeg';
    else if (mimeType.includes('wav')) extension = 'wav';
    else if (mimeType.includes('ogg')) extension = 'ogg';

    const formData = new FormData();
    // Use the blob directly with proper file extension
    formData.append('audio', audioBlob, `chunk.${extension}`);

    const response = await fetch('/api/interview-test/transcribe-chunk', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('[TranscribeChunk] Failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      });
      throw new Error(`Transcription failed: ${errorData.error || response.statusText}`);
    }

    const data = await response.json();
    return data.transcription;
  };

  // Generate follow-up questions
  const generateFollowUpQuestions = async (lastUserResponse: string) => {
    try {
      // For follow-up, we need the full transcript up to this point.
      // If realtime, the hook manages it. If traditional, audioState.fullTranscript.
      const currentFullTranscript = isRealtimeEnabled ?
        messages.filter(m => m.type === 'audio-response' || m.type === 'text-response').map(m => m.content).join(' ') :
        audioState.fullTranscript;

      const response = await fetch('/api/interview-test/follow-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullTranscript: currentFullTranscript,
          lastUserResponse, // Provide the last response for better context
          followUpNumber: followUpCount + 1,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[GenerateFollowUp] API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });
        throw new Error(`Failed to generate follow-up: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();

      removeTypingIndicator();

      // Add question options
      const optionsMessage: Message = {
        id: `msg-${Date.now()}`,
        type: 'question-options',
        content: '',
        options: data.questions || [data.followUp], // Support both new multi-question and old single
        timestamp: new Date(),
        sender: 'hw',
      };

      setMessages(prev => [...prev, optionsMessage]);
      setFollowUpCount(prev => prev + 1);
      setIsProcessing(false);

    } catch (error) {
      console.error('Error generating follow-up:', error);
      removeTypingIndicator();
      setIsProcessing(false);
    }
  };

  // Handle question option selection
  const handleQuestionSelect = (messageId: string, optionIndex: number, questionText: string) => {
    // Immediately remove the question-options message for clean flow
    setMessages(prev => prev.filter(msg => msg.id !== messageId));

    // Add selected question as new HW question with smooth transition
    setTimeout(() => {
      const newQuestion: Message = {
        id: `msg-${Date.now()}`,
        type: 'question',
        content: questionText,
        timestamp: new Date(),
        sender: 'hw',
      };

      setMessages(prev => [...prev, newQuestion]);
    }, 200); // Reduced delay for snappier feel
  };




  // Show "Coming Soon" if feature is disabled
  if (!isFeatureEnabled) {
    return (
      <div className="hw-page flex items-center justify-center" style={{ background: 'var(--color-page)' }}>
        <div className="text-center max-w-md px-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-rose-500 mx-auto mb-6 flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m9-7a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Coming Soon</h1>
          <p className="text-gray-600 mb-6">
            Our AI-powered interview feature is currently being enhanced with improved security and performance.
          </p>
          <p className="text-sm text-gray-500 mb-8">
            In the meantime, you can record your stories using our standard recording feature.
          </p>
          <button
            onClick={() => router.push('/recording')}
            className="bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-semibold px-6 py-3 rounded-full transition-all shadow-md"
          >
            Go to Recording
          </button>
        </div>
      </div>
    );
  }

  // Show loading state while checking auth OR checking for drafts
  if (isAuthLoading || !draftCheckComplete) {
    return (
      <div className="hw-page flex items-center justify-center" style={{ background: 'var(--hw-page-bg)' }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[var(--hw-primary)]/20 border-t-[var(--hw-primary)] rounded-full mx-auto mb-4 animate-spin" />
          <p className="text-[var(--hw-text-secondary)] text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  return (
    <div className="hw-page" style={{ background: 'var(--hw-page-bg)' }}>
      {/* Resume Draft Modal */}
      {showResumeModal && existingDraft && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full mx-4 shadow-xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-[var(--hw-primary-soft)] rounded-full flex items-center justify-center mx-auto mb-4">
                <RefreshCw className="w-8 h-8 text-[var(--hw-primary)]" />
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
                Continue Previous Interview?
              </h2>
              <p className="text-gray-600 text-base">
                You have an unfinished interview from{' '}
                {new Date(existingDraft.updatedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </p>
              {existingDraft.sessionDuration > 0 && (
                <p className="text-[var(--hw-primary)] text-base mt-1">
                  {Math.floor(existingDraft.sessionDuration / 60)} min {existingDraft.sessionDuration % 60} sec recorded
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <Button
                onClick={handleResumeDraft}
                className="w-full min-h-[48px] bg-[var(--hw-primary)] hover:bg-[var(--hw-primary-hover)] text-white font-medium"
              >
                Continue Interview
              </Button>
              <Button
                onClick={handleStartFresh}
                variant="outline"
                className="w-full min-h-[48px] border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Start Fresh
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Connection Error Fallback Modal */}
      {showErrorFallback && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full mx-4 shadow-xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
                Connection Issue
              </h2>
              <p className="text-gray-600 text-base">
                We're having trouble connecting to Pearl. This could be a temporary network issue.
              </p>
              {connectionError && (
                <p className="text-red-600 text-xs mt-2 bg-red-50 rounded-lg p-2">
                  {connectionError}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <Button
                onClick={handleRetryConnection}
                className="w-full min-h-[48px] bg-[var(--hw-primary)] hover:bg-[var(--hw-primary-hover)] text-white font-medium"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Button
                onClick={handleFallbackToRecording}
                variant="outline"
                className="w-full min-h-[48px] border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <Mic className="w-4 h-4 mr-2" />
                Record Story Instead
              </Button>
            </div>

            <p className="text-xs text-gray-500 text-center mt-4">
              You can still record your story using our standard recording feature
            </p>
          </div>
        </div>
      )}

      {/* Story Split Modal */}
      <StorySplitModal
        isOpen={showSplitModal}
        onClose={() => setShowSplitModal(false)}
        stories={detectedStories}
        onConfirmSplit={handleSplitConfirm}
        onKeepOne={() => proceedWithSingleStory(detectedStories[0])}
        isProcessing={isSplitting}
      />

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full mx-4 shadow-xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
                Cancel Interview?
              </h2>
              <p className="text-gray-600 text-base">
                Your responses will be lost. Are you sure you want to cancel?
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                onClick={() => setShowCancelConfirm(false)}
                className="w-full min-h-[48px] bg-[var(--hw-primary)] hover:bg-[var(--hw-primary-hover)] text-white font-medium"
              >
                Keep Recording
              </Button>
              <Button
                onClick={performCancelInterview}
                variant="outline"
                className="w-full min-h-[48px] border-red-300 text-red-700 hover:bg-red-50"
              >
                Yes, Cancel Interview
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Confirmation Modal */}
      {showCompleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full mx-4 shadow-xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-[var(--hw-primary-soft)] rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-[var(--hw-primary)]" />
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
                Finish Interview?
              </h2>
              <p className="text-gray-600 text-base">
                You've shared {pendingResponseCount} {pendingResponseCount === 1 ? 'response' : 'responses'}.
                You'll be taken to review and finalize your story.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                onClick={handleConfirmedComplete}
                className="w-full min-h-[48px] bg-[var(--hw-primary)] hover:bg-[var(--hw-primary-hover)] text-white font-medium"
              >
                Finish & Review Story
              </Button>
              <Button
                onClick={() => setShowCompleteConfirm(false)}
                variant="outline"
                className="w-full min-h-[48px] border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Keep Recording
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Welcome Modal */}
      {showWelcome && (
        <WelcomeModal
          userName={user?.name || 'friend'}
          onDismiss={handleWelcomeDismiss}
        />
      )}

      {/* Theme Selector - shown after welcome, before interview starts */}
      {!showWelcome && interviewPhase === 'theme_selection' && (
        <ThemeSelector
          userName={user?.name}
          onSelectTheme={handleThemeSelect}
        />
      )}

      {/* Chat Container - full height (bottom nav hidden during interview) */}
      {/* Hide when showing theme selector */}
      <div className={`max-w-3xl mx-auto flex flex-col ${interviewPhase === 'theme_selection' && !showWelcome ? 'hidden' : ''}`} style={{ height: '100dvh' }}>
        {/* Header - design guidelines compliant */}
        <div className="sticky top-0 z-10 bg-[var(--hw-surface)] border-b border-[var(--hw-border-subtle)] px-4 py-3">
          {/* Always show: Cancel on left, Logo center, Finish on right (when available) */}
          <div className="flex items-center justify-between gap-2">
            {/* Cancel Button */}
            <button
              onClick={handleCancelInterview}
              className="min-w-[48px] min-h-[48px] flex items-center justify-center text-[var(--hw-text-secondary)] hover:text-[var(--hw-text-primary)] transition-colors"
              aria-label="Cancel interview"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Center: Logo + Timer */}
            <div className="flex-1 flex flex-col items-center">
              <Image
                src="/final logo/logo-new.svg"
                alt="Heritage Whisper"
                width={140}
                height={35}
                className="h-7 w-auto"
                priority
              />
            </div>

            {/* Finish Button (when user has responses) */}
            {messages.some(m => m.type === 'audio-response' || m.type === 'text-response') ? (
              isAnalyzing ? (
                <div className="min-w-[48px] flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-[var(--hw-primary)]" />
                </div>
              ) : (
                <Button
                  onClick={handleComplete}
                  className="min-h-[48px] px-4 bg-[var(--hw-primary)] hover:bg-[var(--hw-primary-hover)] text-white font-medium rounded-xl"
                  size="sm"
                  disabled={isProcessing}
                >
                  <Check className="w-4 h-4 mr-1" />
                  Done
                </Button>
              )
            ) : (
              <div className="min-w-[48px]" />
            )}
          </div>

          {/* Session Timer & Status - compact row below header */}
          {sessionStartTime && (
            <div className="mt-2 flex items-center justify-center gap-3 text-sm">
              {/* Timer */}
              <span className={`tabular-nums font-medium ${
                sessionDuration >= 1740 ? 'text-[var(--hw-error)] animate-pulse' :
                sessionDuration >= 1500 ? 'text-[var(--hw-warning-accent)]' :
                'text-[var(--hw-text-muted)]'
              }`}>
                {Math.floor(sessionDuration / 60)}:{(sessionDuration % 60).toString().padStart(2, '0')}
              </span>

              {/* Status Indicator */}
              {isRealtimeEnabled && status === 'connected' && conversationPhase !== 'idle' && (
                <span className="flex items-center gap-1.5 text-[var(--hw-text-secondary)]">
                  <span className={`w-2 h-2 rounded-full animate-pulse ${
                    conversationPhase === 'listening' ? 'bg-[var(--hw-success)]' :
                    conversationPhase === 'thinking' ? 'bg-[var(--hw-warning-accent)]' :
                    'bg-[var(--hw-primary)]'
                  }`} />
                  <span>
                    {conversationPhase === 'listening' && 'Listening'}
                    {conversationPhase === 'thinking' && 'Processing'}
                    {conversationPhase === 'speaking' && 'Pearl speaking'}
                  </span>
                </span>
              )}

              {/* Time Warning */}
              {showTimeWarning && sessionDuration < 1740 && (
                <span className="text-[var(--hw-warning-accent)]">5 min left</span>
              )}
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.map((message) => (
            <div key={message.id}>
              {message.type === 'typing' ? (
                <TypingIndicator />
              ) : message.type === 'question-options' ? (
                <QuestionOptions
                  messageId={message.id}
                  options={message.options || []}
                  selectedOption={message.selectedOption}
                  onSelect={handleQuestionSelect}
                />
              ) : (
                <ChatMessage message={message} />
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <ChatInput
          onAudioResponse={handleAudioResponse}
          onTextResponse={handleTextResponse}
          onTranscriptUpdate={handleTranscriptUpdate}
          disabled={isProcessing}
          useRealtime={isRealtimeEnabled}
          userName={user?.name}
          realtimeConnected={isRealtimeEnabled && status === 'connected'}
        />
      </div>
    </div>
  );
}
