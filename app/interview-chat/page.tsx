"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { WelcomeModal } from "./components/WelcomeModal";
import { ChatMessage } from "./components/ChatMessage";
import { QuestionOptions } from "./components/QuestionOptions";
import { TypingIndicator } from "./components/TypingIndicator";
import { ChatInput } from "./components/ChatInput";
import { StorySplitModal } from "./components/StorySplitModal";
import {
  completeConversationAndRedirect,
  extractQAPairs,
  combineAudioBlobs,
} from "@/lib/conversationModeIntegration";
import { useRecordingState } from "@/contexts/RecordingContext";

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
  lastBytePosition: number;
  fullTranscript: string;
};

export default function InterviewChatPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { startRecording, stopRecording } = useRecordingState();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [followUpCount, setFollowUpCount] = useState(0);
  const [showStorySplit, setShowStorySplit] = useState(false);

  // Audio state for incremental transcription
  const [audioState, setAudioState] = useState<AudioState>({
    chunks: [],
    lastBytePosition: 0,
    fullTranscript: '',
  });

  // Redirect if not authenticated (only after loading completes)
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
      // Stop recording if user navigates away
      stopRecording();
    };
  }, [stopRecording]);

  // Initialize conversation after welcome dismissed
  const handleWelcomeDismiss = () => {
    setShowWelcome(false);

    // Start recording state for the interview
    startRecording('conversation');

    // Add initial greeting
    const greeting: Message = {
      id: `msg-${Date.now()}`,
      type: 'system',
      content: `Welcome, ${user?.user_metadata?.full_name || 'friend'}! I'm Pearl, your Heritage Whisper guide. Let's begin your interview.`,
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

  // Handle audio response
  const handleAudioResponse = async (audioBlob: Blob, duration: number) => {
    // Add user's audio message to chat
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
      // Get new audio chunk (only the part we haven't transcribed)
      const newChunk = getNewAudioChunk(audioBlob);

      if (!newChunk || newChunk.size === 0) {
        throw new Error("No new audio to process");
      }

      // Transcribe ONLY the new chunk
      const transcription = await transcribeChunk(newChunk);

      // Update full transcript
      const updatedTranscript = audioState.fullTranscript + ' ' + transcription;
      setAudioState(prev => ({
        ...prev,
        fullTranscript: updatedTranscript,
        lastBytePosition: audioBlob.size,
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
        await generateFollowUpQuestions(updatedTranscript);
      }, 1500);

    } catch (error) {
      console.error('Error processing audio:', error);
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

    // Update transcript with text
    const updatedTranscript = audioState.fullTranscript + ' ' + text;
    setAudioState(prev => ({
      ...prev,
      fullTranscript: updatedTranscript,
    }));

    // Show typing indicator
    addTypingIndicator();

    // Generate follow-up questions
    setTimeout(async () => {
      await generateFollowUpQuestions(updatedTranscript);
    }, 1500);
  };

  // Add typing indicator
  const addTypingIndicator = () => {
    const typingMsg: Message = {
      id: 'typing',
      type: 'typing',
      content: '',
      timestamp: new Date(),
      sender: 'hw',
    };

    setMessages(prev => [...prev, typingMsg]);
  };

  // Remove typing indicator
  const removeTypingIndicator = () => {
    setMessages(prev => prev.filter(msg => msg.type !== 'typing'));
  };

  // Get only NEW audio chunk (incremental processing)
  const getNewAudioChunk = (currentBlob: Blob): Blob | null => {
    if (audioState.lastBytePosition >= currentBlob.size) {
      return null;
    }

    const newChunk = currentBlob.slice(audioState.lastBytePosition, currentBlob.size);
    return newChunk;
  };

  // Transcribe audio chunk
  const transcribeChunk = async (audioBlob: Blob): Promise<string> => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'chunk.webm');

    const response = await fetch('/api/interview-test/transcribe-chunk', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Transcription failed');
    }

    const data = await response.json();
    return data.transcription;
  };

  // Generate follow-up questions
  const generateFollowUpQuestions = async (fullTranscript: string) => {
    try {
      const response = await fetch('/api/interview-test/follow-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullTranscript,
          followUpNumber: followUpCount + 1,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate follow-up');
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

      // Check if we should suggest story splitting (after 5+ exchanges)
      if (followUpCount >= 4) {
        setTimeout(() => {
          checkStorySplit(fullTranscript);
        }, 2000);
      }

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

  // Check if stories should be split
  const checkStorySplit = async (fullTranscript: string) => {
    try {
      const response = await fetch('/api/interview-test/analyze-topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullTranscript,
          messages: messages.filter(m => m.type !== 'typing'),
        }),
      });

      if (!response.ok) return;

      const data = await response.json();

      if (data.shouldSplit && data.stories?.length > 1) {
        setShowStorySplit(true);
      }
    } catch (error) {
      console.error('Error analyzing topics:', error);
    }
  };

  // Complete interview and redirect to post-recording flow prototype
  const handleCompleteInterview = async () => {
    console.log('🎬 [Interview] handleCompleteInterview called');

    try {
      // Require at least one Q&A exchange
      const userResponses = messages.filter(m =>
        m.type === 'audio-response' || m.type === 'text-response'
      );

      console.log('📊 [Interview] User responses:', userResponses.length);

      if (userResponses.length === 0) {
        alert('Please answer at least one question before completing the interview.');
        return;
      }

      // Confirm completion
      const confirmComplete = confirm(
        `Complete this interview with ${userResponses.length} ${userResponses.length === 1 ? 'response' : 'responses'}?\n\n` +
        'You\'ll be taken to review and finalize your story.'
      );

      console.log('✅ [Interview] User confirmed:', confirmComplete);

      if (!confirmComplete) return;

      // Extract Q&A pairs from messages
      console.log('🔍 [Interview] Extracting Q&A pairs from', messages.length, 'messages');
      const qaPairs = extractQAPairs(messages);
      console.log('📝 [Interview] Extracted Q&A pairs:', qaPairs.length);

      // Collect all audio blobs (if any)
      const audioBlobs = messages
        .filter(m => m.audioBlob)
        .map(m => m.audioBlob as Blob);

      console.log('🎵 [Interview] Audio blobs found:', audioBlobs.length);

      // Combine audio blobs if multiple
      let combinedAudio: Blob | null = null;
      if (audioBlobs.length > 0) {
        console.log('🔄 [Interview] Combining audio blobs...');
        combinedAudio = await combineAudioBlobs(audioBlobs);
        console.log('✅ [Interview] Audio combined:', combinedAudio?.size, 'bytes');
      }

      // Calculate total duration
      const totalDuration = messages
        .filter(m => m.audioDuration)
        .reduce((sum, m) => sum + (m.audioDuration || 0), 0);

      console.log('⏱️  [Interview] Total duration:', totalDuration, 'seconds');
      console.log('📄 [Interview] Full transcript length:', audioState.fullTranscript?.length || 0);

      // Complete conversation and redirect
      console.log('🚀 [Interview] Calling completeConversationAndRedirect...');
      await completeConversationAndRedirect({
        qaPairs,
        audioBlob: combinedAudio,
        fullTranscript: audioState.fullTranscript,
        totalDuration,
      });

      console.log('✅ [Interview] completeConversationAndRedirect finished');

      // Stop recording state when interview is completed
      stopRecording();

    } catch (error) {
      console.error('❌ [Interview] Error completing interview:', error);
      alert('Failed to complete interview. Please try again.');
    }
  };

  // Show loading state while checking auth
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

  // Don't render if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-page)' }}>
      {/* Welcome Modal */}
      {showWelcome && (
        <WelcomeModal
          userName={user.user_metadata?.full_name || 'friend'}
          onDismiss={handleWelcomeDismiss}
        />
      )}

      {/* Story Split Modal */}
      {showStorySplit && (
        <StorySplitModal
          stories={[]} // Will be populated from API
          onKeepTogether={() => setShowStorySplit(false)}
          onSplit={() => {
            setShowStorySplit(false);
            // Handle split logic
          }}
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
                src="/HW_text-compress.png"
                alt="Heritage Whisper"
                width={200}
                height={50}
                className="h-8 sm:h-10 w-auto"
                priority
              />
              <button
                onClick={handleCompleteInterview}
                disabled={isProcessing}
                className="bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-semibold px-5 py-2 sm:px-6 sm:py-3 rounded-full text-sm transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                style={{ minHeight: '36px' }}
              >
                Complete Interview
              </button>
            </div>
          ) : (
            // Original layout when no complete button
            <div className="flex flex-col items-center gap-0.5 sm:gap-2">
              <Image
                src="/HW_text-compress.png"
                alt="Heritage Whisper"
                width={200}
                height={50}
                className="h-10 w-auto"
                priority
              />
              <p className="text-lg font-medium text-gray-600">Guided Interview</p>
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
          disabled={isProcessing}
        />
      </div>
    </div>
  );
}
