"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useAuth } from "@/lib/auth";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { WelcomeModal } from "../interview-chat/components/WelcomeModal";
import { ChatMessage } from "../interview-chat/components/ChatMessage";
import { TypingIndicator } from "../interview-chat/components/TypingIndicator";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import {
  completeConversationAndRedirect,
  extractQAPairs,
} from "@/lib/conversationModeIntegration";
import { useRecordingState } from "@/contexts/RecordingContext";
import { useRealtimeInterview, PEARL_WITNESS_INSTRUCTIONS } from "@/hooks/use-realtime-interview";
import { Mic, Square, Volume2, VolumeX, MessageSquare, Play, Pause, RotateCcw } from "lucide-react";

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

function InterviewChatV2Content() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { startRecording: startRecordingState, stopRecording: stopRecordingState } = useRecordingState();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('voice');
  const [textInput, setTextInput] = useState('');
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeAccumulatedRef = useRef<number>(0);

  // Check for prompt question in URL params
  const promptQuestion = searchParams.get('prompt');

  // Pause start time tracker
  const pauseStartTimeRef = useRef<number>(0);

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

  // Handler for sending text messages
  const handleSendTextMessage = () => {
    if (!textInput.trim()) return;

    console.log('[InterviewChatV2] Sending text message:', textInput);

    const messageText = textInput;

    // Add user message to chat immediately
    const userMessage: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'text-response',
      content: messageText,
      timestamp: new Date(),
      sender: 'user',
    };
    setMessages(prev => [...prev, userMessage]);

    setTextInput(''); // Clear input immediately

    // Send text to Realtime API immediately (no artificial delay)
    sendTextMessage(messageText);
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

  // Clean up recording state on unmount
  useEffect(() => {
    return () => {
      stopRecordingState();
      stopSession();
    };
  }, [stopRecordingState, stopSession]);

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
          console.log('[InterviewChatV2] User transcript:', finalText);

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
          console.error('[InterviewChatV2] Realtime error:', error);
          setErrorMessage(`Realtime API error: ${error.message}`);
          setShowErrorModal(true);
        },
        {
          // Enable conversational AI with PEARLS v1.1 Witness system
          instructions: sessionInstructions,
          modalities: ['text', 'audio'],
          voice: 'alloy',
          temperature: 0.6, // Minimum allowed by Realtime API (was 0.5 but API requires ≥ 0.6)
        },
        (assistantText) => {
          // Handle Pearl's response
          console.log('[InterviewChatV2] Pearl said:', assistantText);

          // Check if this is the "composing" signal
          if (assistantText === '__COMPOSING__') {
            console.log('[InterviewChatV2] Pearl is composing...');
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
      console.log('[InterviewChatV2] Session started, triggering Pearl to speak first...');
      setTimeout(() => {
        triggerPearlResponse();
      }, 1500); // Delay to ensure WebRTC data channel is fully open
    } catch (error) {
      console.error('[InterviewChatV2] Failed to start session:', error);
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

    console.log('[InterviewChatV2] Conversation ended. Mixed audio:', mixedBlob?.size || 0, 'bytes');
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

    console.log('[InterviewChatV2] Audio blobs:', {
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

  // Format recording time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-page)' }}>
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-rose-500 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-page)' }}>
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

      {/* Chat Container */}
      <div className="max-w-3xl mx-auto flex flex-col h-screen">
        {/* Header - Compact */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-2">
          <div className="flex flex-col items-center gap-1">
            <Image
              src="/Logo hw.svg"
              alt="Heritage Whisper"
              width={300}
              height={75}
              className="h-10 w-auto"
              priority
            />

            {/* Status and Timer */}
            {isRecording && (
              <div className="flex items-center gap-2 text-xs">
                <div className={`w-2 h-2 rounded-full ${isPaused ? 'bg-red-500' : 'bg-green-500 animate-pulse'}`}></div>
                <span className="font-medium text-gray-700">
                  {isPaused ? 'Paused' : 'Active'}
                </span>
                <span className="text-gray-500">•</span>
                <span className="tabular-nums text-gray-600">{formatTime(recordingDuration)}</span>
              </div>
            )}

            {/* Action Buttons */}
            {isRecording && (
              <div className="flex gap-2">
                <button
                  onClick={handleCompleteInterview}
                  className="bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-medium px-3 py-1 rounded-full text-xs transition-all shadow-md"
                >
                  Complete Interview
                </button>
                {isPaused && (
                  <button
                    onClick={handleRestartConversation}
                    className="bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium px-3 py-1 rounded-full text-xs transition-all flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Restart
                  </button>
                )}
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium px-3 py-1 rounded-full text-xs transition-all"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3 sm:py-6 space-y-4 pb-80 md:pb-96"> {/* Added large padding for footer and text input */}
          {messages.map((message) => (
            <div key={message.id}>
              {message.type === 'typing' ? (
                <TypingIndicator />
              ) : (
                <ChatMessage message={message} />
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Voice Controls - Minimal Footer Above Nav */}
        <div className="fixed bottom-16 md:bottom-24 left-0 right-0 border-t border-gray-200 bg-white/95 backdrop-blur-sm px-3 py-1.5 z-30 shadow-sm">
          {/* Provisional Transcript Display - Smaller */}
          {isRecording && provisionalTranscript && (
            <div className="mb-1 px-2 py-0.5 rounded bg-gray-50 border border-gray-100">
              <p className="text-xs text-gray-600 italic truncate">{provisionalTranscript}</p>
            </div>
          )}

          {/* Compact Control Bar */}
          {isRecording && (
            <div className="flex items-center justify-center gap-3">
              {/* Pause/Continue Toggle */}
              <button
                onClick={handlePauseContinue}
                className={`flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  isPaused
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
                title={isPaused ? 'Continue conversation' : 'Pause conversation'}
              >
                {isPaused ? (
                  <Play className="w-4 h-4" />
                ) : (
                  <Pause className="w-4 h-4" />
                )}
                <span className="ml-1.5">{isPaused ? 'Continue' : 'Pause'}</span>
              </button>

              {/* Pearl Voice Toggle */}
              <button
                onClick={toggleVoice}
                className={`flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  voiceEnabled
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={voiceEnabled ? 'Mute Pearl' : 'Unmute Pearl'}
              >
                {voiceEnabled ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4" />
                )}
                <span className="ml-1.5">{voiceEnabled ? 'Mute Pearl' : 'Unmute Pearl'}</span>
              </button>

              {/* Mode Toggle */}
              <div className="flex bg-gray-100 rounded-full p-0.5">
                <button
                  onClick={() => setInputMode('voice')}
                  className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-all ${
                    inputMode === 'voice'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Voice
                </button>
                <button
                  onClick={() => setInputMode('text')}
                  className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-all ${
                    inputMode === 'text'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Type
                </button>
              </div>
            </div>
          )}

          {/* Text Input */}
          {inputMode === 'text' && isRecording && (
            <div className="flex flex-col gap-2 mt-2">
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && textInput.trim()) {
                    e.preventDefault();
                    handleSendTextMessage();
                  }
                }}
                placeholder="Type your response..."
                rows={4}
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-base resize-none"
              />
              <button
                onClick={handleSendTextMessage}
                disabled={!textInput.trim()}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-rose-500 text-white rounded-lg text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-amber-600 hover:to-rose-600 transition-all shadow-md"
              >
                Send
              </button>
            </div>
          )}

          {/* Error Display */}
          {realtimeError && (
            <div className="mt-1 px-2 py-1 rounded bg-red-50 border border-red-100">
              <p className="text-xs text-red-600">{realtimeError}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function InterviewChatV2Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-page)' }}>
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-rose-500 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <InterviewChatV2Content />
    </Suspense>
  );
}
