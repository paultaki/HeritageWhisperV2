"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { WelcomeModal } from "../interview-chat/components/WelcomeModal";
import { ChatMessage } from "../interview-chat/components/ChatMessage";
import { TypingIndicator } from "../interview-chat/components/TypingIndicator";
import {
  completeConversationAndRedirect,
  extractQAPairs,
} from "@/lib/conversationModeIntegration";
import { useRecordingState } from "@/contexts/RecordingContext";
import { useRealtimeInterview, PEARL_INSTRUCTIONS } from "@/hooks/use-realtime-interview";
import { Mic, Square, Volume2, VolumeX } from "lucide-react";

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

export default function InterviewChatV2Page() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { startRecording: startRecordingState, stopRecording: stopRecordingState } = useRecordingState();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Realtime API integration
  const {
    status: realtimeStatus,
    provisionalTranscript,
    voiceEnabled,
    error: realtimeError,
    startSession,
    stopSession,
    toggleVoice,
    getMixedAudioBlob,
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
  const handleWelcomeDismiss = () => {
    setShowWelcome(false);
    startRecordingState('conversation');

    // Add initial greeting
    const greeting: Message = {
      id: `msg-${Date.now()}`,
      type: 'system',
      content: `Welcome, ${user?.name?.split(' ')[0] || 'friend'}! I'm Pearl, your Heritage Whisper guide. Click the microphone when you're ready to share a story.`,
      timestamp: new Date(),
      sender: 'system',
    };

    setMessages([greeting]);
  };

  // Start recording with Realtime API
  const handleStartRecording = async () => {
    try {
      setIsRecording(true);
      startTimeRef.current = Date.now();

      // Update duration timer
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setRecordingDuration(elapsed);
      }, 1000);

      // Start Realtime session with conversational AI configuration
      await startSession(
        (finalText) => {
          // Handle final user transcript
          console.log('[InterviewChatV2] User transcript:', finalText);

          const userMessage: Message = {
            id: `msg-${Date.now()}`,
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
          handleStopRecording();
        },
        {
          // Enable conversational AI with Pearl's personality
          instructions: PEARL_INSTRUCTIONS,
          modalities: ['text', 'audio'],
          voice: 'alloy',
          temperature: 0.8,
        }
      );
    } catch (error) {
      console.error('[InterviewChatV2] Failed to start recording:', error);
      alert('Failed to start voice session. Please try again.');
      setIsRecording(false);
      setRecordingDuration(0);
    }
  };

  // Stop recording
  const handleStopRecording = () => {
    const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

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

    console.log('[InterviewChatV2] Recording stopped. Mixed audio:', mixedBlob?.size || 0, 'bytes');
  };

  // Complete interview
  const handleCompleteInterview = async () => {
    const userResponses = messages.filter(m => m.type === 'audio-response');

    if (userResponses.length === 0) {
      alert('Please answer at least one question before completing the interview.');
      return;
    }

    const confirmComplete = confirm(
      `Complete this interview with ${userResponses.length} ${userResponses.length === 1 ? 'response' : 'responses'}?\n\n` +
      'You\'ll be taken to review and finalize your story.'
    );

    if (!confirmComplete) return;

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

      {/* Chat Container */}
      <div className="max-w-3xl mx-auto flex flex-col" style={{ height: 'calc(100vh - 80px)', marginBottom: '80px' }}>
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 sm:px-6 py-2 sm:py-4">
          <div className="flex flex-col items-center gap-2">
            <Image
              src="/HW_text-compress.png"
              alt="Heritage Whisper"
              width={200}
              height={50}
              className="h-8 sm:h-10 w-auto"
              priority
            />
            <p className="text-lg font-medium text-gray-600">Conversational Interview (V2)</p>
            {messages.some(m => m.type === 'audio-response') && (
              <button
                onClick={handleCompleteInterview}
                className="bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-semibold px-5 py-2 sm:px-6 sm:py-3 rounded-full text-sm transition-all shadow-md"
              >
                Complete Interview
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3 sm:py-6 space-y-4">
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

        {/* Voice Controls */}
        <div className="sticky left-0 right-0 border-t border-gray-200 bg-white px-4 sm:px-6 py-3 sm:py-4 z-40" style={{ bottom: '0px' }}>
          {/* Provisional Transcript Display */}
          {isRecording && provisionalTranscript && (
            <div className="mb-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Live transcription:</p>
              <p className="text-sm text-gray-600 italic">{provisionalTranscript}</p>
            </div>
          )}

          {/* Voice Toggle and Status */}
          <div className="flex justify-center mb-3 gap-2">
            {isRecording && (
              <button
                onClick={toggleVoice}
                className={`flex items-center px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                  voiceEnabled
                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={voiceEnabled ? 'Pearl is speaking - Click to mute' : 'Pearl is muted - Click to unmute'}
              >
                {voiceEnabled ? (
                  <><Volume2 className="w-4 h-4 mr-1" /> Pearl ON</>
                ) : (
                  <><VolumeX className="w-4 h-4 mr-1" /> Pearl OFF</>
                )}
              </button>
            )}
          </div>

          {/* Recording Controls */}
          <div className="flex items-center justify-center gap-3">
            {!isRecording ? (
              <button
                onClick={handleStartRecording}
                disabled={realtimeStatus === 'connecting'}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-semibold transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Mic className="w-5 h-5" />
                {realtimeStatus === 'connecting' ? 'Connecting...' : 'Start Speaking'}
              </button>
            ) : (
              <>
                <div className="flex-1 text-center">
                  <p className="text-sm text-gray-600 mb-1">Recording...</p>
                  <p className="text-2xl font-mono font-bold text-red-600">{formatTime(recordingDuration)}</p>
                </div>
                <button
                  onClick={handleStopRecording}
                  className="flex items-center gap-2 px-6 py-3 rounded-full bg-red-500 hover:bg-red-600 text-white font-semibold transition-all shadow-md"
                >
                  <Square className="w-5 h-5" />
                  Stop
                </button>
              </>
            )}
          </div>

          {/* Error Display */}
          {realtimeError && (
            <div className="mt-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-600">{realtimeError}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
