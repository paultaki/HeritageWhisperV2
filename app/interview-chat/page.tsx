"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useAuth } from "@/lib/auth";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { WelcomeModal } from "../interview-chat/components/WelcomeModal";
import { ChatMessage } from "../interview-chat/components/ChatMessage";
import { TypingIndicator } from "../interview-chat/components/TypingIndicator";
import { ConfirmModal } from "../interview-chat/components/ConfirmModal";
import {
  completeConversationAndRedirect,
  extractQAPairs,
} from "@/lib/conversationModeIntegration";
import { useRecordingState } from "@/contexts/RecordingContext";
import { useRealtimeInterview, PEARL_WITNESS_INSTRUCTIONS } from "@/hooks/use-realtime-interview";
import { Mic, Square, Volume2, VolumeX, MessageSquare } from "lucide-react";

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
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('voice');
  const [textInput, setTextInput] = useState('');
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Check for prompt question in URL params
  const promptQuestion = searchParams.get('prompt');

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

    // Calculate thoughtful delay based on message length
    const wordCount = messageText.split(/\s+/).length;
    const baseDelay = 800;
    const perWordDelay = 60;
    const maxDelay = 2500;
    const thinkingDelay = Math.min(baseDelay + (wordCount * perWordDelay), maxDelay);

    console.log('[InterviewChatV2] Pearl composing... (delay:', thinkingDelay, 'ms for', wordCount, 'words)');

    // Show composing indicator first
    const typingMessage: Message = {
      id: 'typing-indicator',
      type: 'typing',
      content: '',
      timestamp: new Date(),
      sender: 'hw',
    };
    setMessages(prev => [...prev, typingMessage]);

    // Send text to Realtime API after delay (so Pearl has time to "think")
    setTimeout(() => {
      sendTextMessage(messageText);
    }, thinkingDelay);
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
    startTimeRef.current = Date.now();

    // Update duration timer
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
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
          alert(`Realtime API error: ${error.message}`);
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
      alert('Failed to start voice session. Please try again.');
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
      alert('Please answer at least one question before completing the interview.');
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

    // Get mixed audio blob
    const mixedBlob = getMixedAudioBlob();

    // Combine all transcripts
    const fullTranscript = userResponses.map(m => m.content).join(' ');

    const totalDuration = messages
      .filter(m => m.audioDuration)
      .reduce((sum, m) => sum + (m.audioDuration || 0), 0);

    // Complete conversation and redirect
    await completeConversationAndRedirect({
      qaPairs,
      audioBlob: mixedBlob,
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
          stopRecording();
          stopRecordingState();
          router.push('/timeline');
        }}
        onCancel={() => setShowCancelConfirm(false)}
        variant="danger"
      />

      {/* Chat Container */}
      <div className="max-w-3xl mx-auto flex flex-col h-screen">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 sm:px-6 py-2 sm:py-3">
          <div className="flex flex-col items-center gap-1.5">
            <Image
              src="/HW_text-compress.png"
              alt="Heritage Whisper"
              width={200}
              height={50}
              className="h-7 sm:h-9 w-auto"
              priority
            />
            <p className="text-base font-medium text-gray-600">Whisper Storyteller Conversation</p>

            {/* Status and Timer */}
            {isRecording && (
              <div className="flex items-center gap-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${isMicMuted ? 'bg-red-500' : 'bg-green-500 animate-pulse'}`}></div>
                <span className="font-medium text-gray-700">
                  {isMicMuted ? 'Mic Paused' : 'Conversation Active'}
                </span>
                <span className="text-gray-500">•</span>
                <span className="tabular-nums text-gray-600">{formatTime(recordingDuration)}</span>
              </div>
            )}

            {/* Action Buttons */}
            {isRecording && (
              <div className="flex gap-2 mt-1">
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium px-4 py-1 rounded-full text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCompleteInterview}
                  className="bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-medium px-4 py-1 rounded-full text-sm transition-all shadow-md"
                >
                  Complete Interview
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3 sm:py-6 space-y-4 pb-24 md:pb-32"> {/* Added padding for footer and nav */}
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
        <div className="fixed bottom-16 md:bottom-20 left-0 right-0 border-t border-gray-200 bg-white/95 backdrop-blur-sm px-3 py-1.5 z-30 shadow-sm">
          {/* Provisional Transcript Display - Smaller */}
          {isRecording && provisionalTranscript && (
            <div className="mb-1 px-2 py-0.5 rounded bg-gray-50 border border-gray-100">
              <p className="text-xs text-gray-600 italic truncate">{provisionalTranscript}</p>
            </div>
          )}

          {/* Compact Control Bar */}
          {isRecording && (
            <div className="flex items-center justify-center gap-3">
              {/* Mic Toggle */}
              <button
                onClick={() => {
                  const newMutedState = !isMicMuted;
                  setIsMicMuted(newMutedState);
                  toggleMic(!newMutedState);
                }}
                className={`flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                  isMicMuted
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
                title={isMicMuted ? 'Unmute mic' : 'Mute mic'}
              >
                {isMicMuted ? (
                  <VolumeX className="w-3.5 h-3.5" />
                ) : (
                  <Mic className="w-3.5 h-3.5" />
                )}
                <span className="ml-1">{isMicMuted ? 'Muted' : 'Active'}</span>
              </button>

              {/* Pearl Voice Toggle */}
              <button
                onClick={toggleVoice}
                className={`flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                  voiceEnabled
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={voiceEnabled ? 'Mute Pearl' : 'Unmute Pearl'}
              >
                {voiceEnabled ? (
                  <Volume2 className="w-3.5 h-3.5" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5" />
                )}
                <span className="ml-1">Pearl</span>
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
            <div className="flex gap-2 mt-1">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && textInput.trim()) {
                    handleSendTextMessage();
                  }
                }}
                placeholder="Type your response..."
                className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              />
              <button
                onClick={handleSendTextMessage}
                disabled={!textInput.trim()}
                className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-rose-500 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:from-amber-600 hover:to-rose-600 transition-all"
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
