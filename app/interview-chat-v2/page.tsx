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
import { useRealtimeInterview } from "@/hooks/use-realtime-interview";
import {
  completeConversationAndRedirect,
  extractQAPairs,
  combineAudioBlobs, // This might become redundant if we use getMixedAudioBlob/getUserAudioBlob
} from "@/lib/conversationModeIntegration";
import { useRecordingState } from "@/contexts/RecordingContext";
import { Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";


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

  // Handle conversation completion
  const handleComplete = useCallback(async () => {
    // Require at least one Q&A exchange
    const userResponses = messages.filter(m =>
      m.type === 'audio-response' || m.type === 'text-response'
    );

    if (userResponses.length === 0) {
      alert('Please answer at least one question before completing the interview.');
      return;
    }

    // Confirm completion
    const confirmComplete = confirm(
      `Complete this interview with ${userResponses.length} ${userResponses.length === 1 ? 'response' : 'responses'}?\n\n` +
      'You\'ll be taken to review and finalize your story.'
    );

    if (!confirmComplete) return;

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
  }, [messages, isRealtimeEnabled, status, isRecording, stopSession, stopTraditionalRecording, user?.name, audioState.chunks, audioState.totalDuration, recordingDuration, getMixedAudioBlob, getUserAudioBlob]);

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

  // Clean up recording state on unmount
  useEffect(() => {
    return () => {
      // Stop recording if user navigates away
      stopTraditionalRecording();
      stopSession(); // Stop realtime session too
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
      }
    };
  }, [stopTraditionalRecording, stopSession]);

  // Initialize conversation after welcome dismissed
  const handleWelcomeDismiss = () => {
    setShowWelcome(false);

    // Start session timer
    setSessionStartTime(Date.now());

    // Start recording state for the interview
    if (isRealtimeEnabled) {
      startSession((text) => handleTranscriptUpdate(text, true));
    } else {
      startTraditionalRecording('conversation');
    }

    // Add initial greeting
    const greeting: Message = {
      id: `msg-${Date.now()}`,
      type: 'system',
      content: `Welcome, ${user?.name?.split(' ')[0] || 'friend'}! I'm Pearl, your Heritage Whisper guide. Let's begin your interview.`,
      timestamp: new Date(),
      sender: 'system',
    };

    setMessages([greeting]);

    // Add first question after brief delay
    setTimeout(() => {
      addFirstQuestion();
    }, 800);
  };

  const addFirstQuestion = () => {
    const firstQuestion: Message = {
      id: `msg-${Date.now()}`,
      type: 'question',
      content: 'Tell me about a moment that changed how you saw yourself.',
      timestamp: new Date(),
      sender: 'hw',
    };

    setMessages(prev => [...prev, firstQuestion]);
  };

  // Handle transcript updates from Realtime API
  const handleTranscriptUpdate = (text: string, isFinal: boolean) => {
    if (isRealtimeEnabled) {
      handleRealtimeTranscriptUpdate(text, isFinal);
      if (isFinal) {
        // Final transcript received - add as user message
        const userMessage: Message = {
          id: `msg-${Date.now()}`,
          type: 'audio-response',
          content: text,
          timestamp: new Date(),
          sender: 'user',
        };

        setMessages(prev => [...prev, userMessage]);

        // Show typing indicator and generate follow-up
        addTypingIndicator();
        setTimeout(async () => {
          await generateFollowUpQuestions(text); // Pass the current response text for context
        }, 1500);
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

    // Show typing indicator
    addTypingIndicator();

    // Generate follow-up questions
    setTimeout(async () => {
      await generateFollowUpQuestions(text); // Pass the current response text for context
    }, 1500);
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

  // Show loading state while checking auth
  if (isAuthLoading) {
    return (
      <div className="hw-page flex items-center justify-center" style={{ background: 'var(--color-page)' }}>
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-rose-500 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  return (
    <div className="hw-page" style={{ background: '#fdfbf7' }}>{/* Warm paper-like background */}
      {/* Story Split Modal */}
      <StorySplitModal
        isOpen={showSplitModal}
        onClose={() => setShowSplitModal(false)}
        stories={detectedStories}
        onConfirmSplit={handleSplitConfirm}
        onKeepOne={() => proceedWithSingleStory(detectedStories[0])}
        isProcessing={isSplitting}
      />

      {/* Welcome Modal */}
      {showWelcome && (
        <WelcomeModal
          userName={user?.name || 'friend'}
          onDismiss={handleWelcomeDismiss}
        />
      )}

      {/* Chat Container - adjust height to account for bottom nav on mobile */}
      <div className="max-w-3xl mx-auto flex flex-col" style={{ height: 'calc(100vh - 80px)', marginBottom: '80px' }}>
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 sm:px-6 py-2 sm:py-4">
          {/* Mobile Layout - stacked when complete button is visible */}
          {messages.some(m => m.type === 'audio-response' || m.type === 'text-response') ? (
            <div className="flex flex-col items-center gap-2">
              <Image
                src="/final logo/logo-new.svg"
                alt="Heritage Whisper"
                width={200}
                height={50}
                className="h-8 sm:h-10 w-auto"
                priority
              />
              {isAnalyzing ? (
                <div className="flex items-center gap-2 text-amber-800">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="font-medium">Analyzing your story...</span>
                </div>
              ) : (
                <Button
                  onClick={handleComplete}
                  className="bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-200 shadow-sm transition-all"
                  size="sm"
                  disabled={isProcessing}
                >
                  <Check className="w-4 h-4 mr-1.5" />
                  Finish Interview
                </Button>
              )}
            </div>
          ) : (
            // Original layout when no complete button
            <div className="flex flex-col items-center gap-1 sm:gap-2">
              <Image
                src="/final logo/logo-new.svg"
                alt="Heritage Whisper"
                width={200}
                height={50}
                className="h-10 w-auto opacity-90" // Slightly softer logo
                priority
              />
              <p className="text-xl font-serif text-amber-900/80 italic">Sharing your story</p>
            </div>
          )}

          {/* Session Timer & Warning */}
          {sessionStartTime && (
            <div className="mt-2 flex flex-col items-center gap-1">
              {/* Timer Display */}
              <div className={`text-sm font-medium tabular-nums transition-colors ${sessionDuration >= 1740 // Last 60 seconds (29 minutes)
                ? 'text-red-600 font-bold text-base animate-pulse'
                : sessionDuration >= 1500 // After 25 minutes
                  ? 'text-amber-600'
                  : 'text-gray-500'
                }`}>
                {Math.floor(sessionDuration / 60)}:{(sessionDuration % 60).toString().padStart(2, '0')}
                {sessionDuration >= 1740 && ' remaining'}
              </div>

              {/* Warning Banner */}
              {showTimeWarning && sessionDuration < 1740 && (
                <div className="text-xs text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                  5 minutes remaining
                </div>
              )}

              {/* Final Minute Countdown */}
              {sessionDuration >= 1740 && (
                <div className="text-xs text-red-600 bg-red-50 px-3 py-1 rounded-full font-medium">
                  Interview will auto-complete at 30:00
                </div>
              )}
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3 sm:py-6 space-y-4">
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
        />
      </div>
    </div>
  );
}
