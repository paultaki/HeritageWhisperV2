"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useAuth } from "@/lib/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { WelcomeModal } from "./components/WelcomeModal";
import { ChatMessage } from "./components/ChatMessage";
import { TypingIndicator } from "./components/TypingIndicator";
import { StatusBar } from "./components/StatusBar";
import { DayPillBar } from "./components/DayPillBar";
import { BottomGlassBar } from "./components/BottomGlassBar";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import {
  completeConversationAndRedirect,
  extractQAPairs,
} from "@/lib/conversationModeIntegration";
import { useRecordingState } from "@/contexts/RecordingContext";
import { useRealtimeInterview, PEARL_WITNESS_INSTRUCTIONS } from "@/hooks/use-realtime-interview";

export type MessageType =
  | 'system'
  | 'question'
  | 'audio-response'
  | 'text-response'
  | 'typing';

export type Message = {
  id: string;
  type: MessageType;
  content: string;
  audioBlob?: Blob;
  audioDuration?: number;
  timestamp: Date;
  sender: 'hw' | 'user' | 'system';
};

function InterviewChatContent() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { startRecording: startRecordingState, stopRecording: stopRecordingState } = useRecordingState();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeAccumulatedRef = useRef<number>(0);
  const pauseStartTimeRef = useRef<number>(0);

  // Check for prompt question in URL params
  const promptQuestion = searchParams.get('prompt');

  // Reduced motion preference
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduceMotion(mq.matches);
    onChange();
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  // Handler for pause/continue
  const handlePauseContinue = () => {
    if (isPaused) {
      // Continue - calculate paused duration and add to accumulated time
      const pausedDuration = Date.now() - pauseStartTimeRef.current;
      pausedTimeAccumulatedRef.current += pausedDuration;
      setIsPaused(false);
      setIsMicMuted(false);
      toggleMic(true); // Unmute mic when continuing

      // Restart the timer
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current - pausedTimeAccumulatedRef.current) / 1000);
        setRecordingDuration(elapsed);
      }, 1000);
    } else {
      // Pause - record when we paused and stop the timer
      pauseStartTimeRef.current = Date.now();
      setIsPaused(true);
      setIsMicMuted(true);
      toggleMic(false); // Mute mic when pausing

      // Stop the timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  // Handler for restart conversation
  const handleRestartConversation = () => {
    const confirmRestart = confirm(
      'Are you sure you want to restart the conversation? This will clear all messages and start over.'
    );

    if (confirmRestart) {
      // Stop session
      stopSession();

      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Reset all state
      setMessages([]);
      setIsRecording(false);
      setRecordingDuration(0);
      setIsPaused(false);
      setIsMicMuted(false);
      startTimeRef.current = 0;
      pausedTimeAccumulatedRef.current = 0;

      // Stop recording state
      stopRecordingState();

      // Restart by showing welcome modal again
      setShowWelcome(true);
    }
  };

  // Realtime API integration
  const {
    status: realtimeStatus,
    provisionalTranscript,
    voiceEnabled,
    error: realtimeError,
    startSession,
    stopSession,
    toggleVoice,
    toggleMic,
    getMixedAudioBlob,
    getUserOnlyAudioBlob,
    sendTextMessage,
    triggerPearlResponse,
  } = useRealtimeInterview();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, isLoading, router]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-scroll to latest when typing indicators change
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages.length]);

  // Clean up recording state on unmount
  useEffect(() => {
    return () => {
      stopRecordingState();
      stopSession();
    };
  }, [stopRecordingState, stopSession]);

  // Dynamic page title for quick glance
  useEffect(() => {
    const formatTime = (sec: number) => {
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    };
    document.title = `${isRecording ? (isPaused ? "Paused" : "Listening") : "Interview"} — ${formatTime(recordingDuration)}`;
  }, [isRecording, isPaused, recordingDuration]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return;

      if (e.code === "Space" && isRecording) {
        e.preventDefault();
        handlePauseContinue();
      } else if ((e.key === "e" || e.key === "E") && (e.metaKey || e.ctrlKey) && isRecording) {
        e.preventDefault();
        handleCompleteInterview();
      } else if (e.key === "Escape" && isRecording) {
        e.preventDefault();
        setShowCancelConfirm(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isRecording, isPaused]);

  // Initialize conversation after welcome dismissed
  const handleWelcomeDismiss = async () => {
    setShowWelcome(false);
    startRecordingState('conversation');

    // Add initial greeting
    const greeting: Message = {
      id: `msg-${Date.now()}`,
      type: 'system',
      content: `Welcome, ${user?.name?.split(' ')[0] || 'friend'}! I'm Pearl, your Heritage Whisper guide. ${promptQuestion ? 'I have a question for you!' : 'Let me ask you a question to get started.'}`,
      timestamp: new Date(),
      sender: 'system',
    };

    setMessages([greeting]);

    // Start Realtime session immediately (continuous conversation)
    setIsRecording(true);
    setIsPaused(false);
    startTimeRef.current = Date.now();
    pausedTimeAccumulatedRef.current = 0;

    // Update duration timer
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current - pausedTimeAccumulatedRef.current) / 1000);
      setRecordingDuration(elapsed);
    }, 1000);

    // Build instructions with prompt question if provided
    let sessionInstructions = PEARL_WITNESS_INSTRUCTIONS;
    if (promptQuestion) {
      sessionInstructions = `${PEARL_WITNESS_INSTRUCTIONS}

IMPORTANT OPENING INSTRUCTION:
Your FIRST message must be asking this specific question (do NOT greet first, jump straight to the question):
"${promptQuestion}"

After they answer, continue the conversation naturally with follow-up questions based on their response.`;
    }

    // Start continuous conversation session
    try {
      await startSession(
        (finalText) => {
          // Handle final user transcript
          console.log('[InterviewChat] User transcript:', finalText);

          const userMessage: Message = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'audio-response',
            content: finalText,
            timestamp: new Date(),
            sender: 'user',
          };

          setMessages(prev => [...prev, userMessage]);
        },
        (error) => {
          console.error('[InterviewChat] Realtime error:', error);
          setErrorMessage(`Realtime API error: ${error.message}`);
          setShowErrorModal(true);
        },
        {
          // Enable conversational AI with PEARLS v1.1 Witness system
          instructions: sessionInstructions,
          modalities: ['text', 'audio'],
          voice: 'alloy',
          temperature: 0.6, // Minimum allowed by Realtime API
        },
        (assistantText) => {
          // Handle Pearl's response
          console.log('[InterviewChat] Pearl said:', assistantText);

          // Check if this is the "composing" signal
          if (assistantText === '__COMPOSING__') {
            console.log('[InterviewChat] Pearl is composing...');
            // Add typing indicator
            const typingMessage: Message = {
              id: 'typing-indicator',
              type: 'typing',
              content: '',
              timestamp: new Date(),
              sender: 'hw',
            };
            setMessages(prev => [...prev, typingMessage]);
          } else {
            // Remove typing indicator if present, then add actual message
            setMessages(prev => {
              const withoutTyping = prev.filter(m => m.id !== 'typing-indicator');
              const pearlMessage: Message = {
                id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                type: 'question',
                content: assistantText,
                timestamp: new Date(),
                sender: 'hw',
              };
              return [...withoutTyping, pearlMessage];
            });
          }
        }
      );

      // After session successfully starts, trigger Pearl to speak first
      console.log('[InterviewChat] Session started, triggering Pearl to speak first...');
      setTimeout(() => {
        triggerPearlResponse();
      }, 1500); // Delay to ensure WebRTC data channel is fully open
    } catch (error) {
      console.error('[InterviewChat] Failed to start session:', error);
      setErrorMessage('Failed to start voice session. Please try again.');
      setShowErrorModal(true);
      setIsRecording(false);
    }
  };

  // End conversation (stop session)
  const handleEndConversation = () => {
    // Clean up timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setIsRecording(false);
    setRecordingDuration(0);

    // Stop Realtime session and get mixed audio
    const mixedBlob = getMixedAudioBlob();
    stopSession();

    console.log('[InterviewChat] Conversation ended. Mixed audio:', mixedBlob?.size || 0, 'bytes');
  };

  // Complete interview
  const handleCompleteInterview = async () => {
    const userResponses = messages.filter(m => m.type === 'audio-response');

    if (userResponses.length === 0) {
      setErrorMessage('Please answer at least one question before completing the interview.');
      setShowErrorModal(true);
      return;
    }

    // Show confirmation modal instead of browser confirm
    setShowCompleteConfirm(true);
  };

  // Confirm complete handler
  const confirmCompleteInterview = async () => {
    setShowCompleteConfirm(false);

    // Extract Q&A pairs from messages
    const qaPairs = extractQAPairs(messages);

    // Get both audio blobs
    const mixedBlob = getMixedAudioBlob(); // User + Pearl (for debugging)
    const userOnlyBlob = getUserOnlyAudioBlob(); // User voice only (for final story)

    console.log('[InterviewChat] Audio blobs:', {
      mixed: mixedBlob?.size || 0,
      userOnly: userOnlyBlob?.size || 0
    });

    // Combine all transcripts
    const userResponses = messages.filter(m => m.type === 'audio-response');
    const fullTranscript = userResponses.map(m => m.content).join(' ');

    const totalDuration = messages
      .filter(m => m.audioDuration)
      .reduce((sum, m) => sum + (m.audioDuration || 0), 0);

    // Complete conversation and redirect
    await completeConversationAndRedirect({
      qaPairs,
      audioBlob: mixedBlob, // Mixed audio (optional, for debugging)
      userOnlyAudioBlob: userOnlyBlob, // User-only audio (preferred for final story)
      fullTranscript,
      totalDuration,
    });

    stopRecordingState();
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F0]">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-rose-500 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      {/* Welcome Modal */}
      {showWelcome && (
        <WelcomeModal
          userName={user?.name || 'friend'}
          onDismiss={handleWelcomeDismiss}
        />
      )}

      {/* Complete Interview Confirmation */}
      <ConfirmModal
        isOpen={showCompleteConfirm}
        title="Complete Interview?"
        message={`Complete this interview with ${messages.filter(m => m.type === 'audio-response').length} ${messages.filter(m => m.type === 'audio-response').length === 1 ? 'response' : 'responses'}?\n\nYou'll be taken to review and finalize your story.`}
        confirmText="Complete Interview"
        cancelText="Keep Going"
        onConfirm={confirmCompleteInterview}
        onCancel={() => setShowCompleteConfirm(false)}
      />

      {/* Cancel Interview Confirmation */}
      <ConfirmModal
        isOpen={showCancelConfirm}
        title="Cancel Interview?"
        message="Are you sure you want to cancel this interview? Your progress will be lost."
        confirmText="Yes, Cancel"
        cancelText="Keep Recording"
        onConfirm={() => {
          setShowCancelConfirm(false);
          handleEndConversation();
          stopRecordingState();
          router.push('/timeline');
        }}
        onCancel={() => setShowCancelConfirm(false)}
        variant="danger"
      />

      {/* Error Modal */}
      <ConfirmModal
        isOpen={showErrorModal}
        title="Error"
        message={errorMessage}
        confirmText="OK"
        onConfirm={() => setShowErrorModal(false)}
        onCancel={() => setShowErrorModal(false)}
        variant="primary"
      />

      {/* Layout container */}
      <div className="min-h-screen flex justify-center">
        <div className="w-full max-w-md flex flex-col">
          {/* Top status bar */}
          {isRecording && (
            <StatusBar
              listening={!isPaused}
              seconds={recordingDuration}
              onToggle={handlePauseContinue}
              reduceMotion={reduceMotion}
            />
          )}

          {/* Scrollable content area */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto relative"
            style={{
              paddingBottom: "120px",
            }}
          >
            {isRecording && <DayPillBar />}

            <div className="w-full">
              <div className="max-w-md mx-auto px-4">
                <div className="flex flex-col gap-4 py-2" role="log" aria-live="polite" aria-relevant="additions">
                  {messages.map((message) => (
                    <div key={message.id}>
                      {message.type === 'typing' ? (
                        <TypingIndicator reduceMotion={reduceMotion} />
                      ) : (
                        <ChatMessage message={message} />
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            </div>

            {/* Soft bottom fade to separate content from action bar */}
            {isRecording && (
              <div className="pointer-events-none sticky bottom-0 h-14 bg-gradient-to-t from-[#F5F5F0] via-[#F5F5F0]/60 to-transparent -mb-2"></div>
            )}
          </div>

          {/* Bottom glass actions */}
          {isRecording && (
            <BottomGlassBar
              onEnd={handleCompleteInterview}
              onPauseResume={handlePauseContinue}
              onCancel={() => setShowCancelConfirm(true)}
              isPaused={isPaused}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function InterviewChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F0]">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-rose-500 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <InterviewChatContent />
    </Suspense>
  );
}
