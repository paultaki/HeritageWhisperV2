"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { WelcomeModal } from "./components/WelcomeModal";
import { ChatMessage } from "./components/ChatMessage";
import { QuestionOptions } from "./components/QuestionOptions";
import { TypingIndicator } from "./components/TypingIndicator";
import { ChatInput } from "./components/ChatInput";
import { StorySplitModal } from "./components/StorySplitModal";

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

  // Initialize conversation after welcome dismissed
  const handleWelcomeDismiss = () => {
    setShowWelcome(false);

    // Add initial greeting
    const greeting: Message = {
      id: `msg-${Date.now()}`,
      type: 'system',
      content: `Welcome, ${user?.user_metadata?.full_name || 'friend'}! Let's begin your Heritage Whisper guided interview.`,
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
    // Mark the selected option in the message
    setMessages(prev => prev.map(msg =>
      msg.id === messageId
        ? { ...msg, selectedOption: optionIndex }
        : msg
    ));

    // Add selected question as new HW question
    setTimeout(() => {
      const newQuestion: Message = {
        id: `msg-${Date.now()}`,
        type: 'question',
        content: questionText,
        timestamp: new Date(),
        sender: 'hw',
      };

      setMessages(prev => [...prev, newQuestion]);
    }, 400);
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

      {/* Chat Container */}
      <div className="max-w-3xl mx-auto h-screen flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-rose-500 flex items-center justify-center text-white font-semibold">
              HW
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Heritage Whisper</h1>
              <p className="text-sm text-gray-500">Guided Interview</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
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
