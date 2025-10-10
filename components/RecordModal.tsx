import React, { useState, useEffect, useRef } from 'react';
import { X, Mic, Square, Sparkles, ChevronRight, Volume2, Timer, Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { AudioRecorder, AudioRecorderHandle } from './AudioRecorder';
import { VoiceVisualizer } from './VoiceVisualizer';
import { toast } from '@/hooks/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import designSystem from '@/lib/designSystem';
import { motion, AnimatePresence } from 'framer-motion';
import { getApiUrl } from '@/lib/config';
import { supabase } from '@/lib/supabase';

interface RecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (recording: {
    audioBlob: Blob;
    transcription?: string;
    wisdomClip?: string;
    followUpQuestions?: string[];
    title?: string;
    year?: number;
  }) => void;
  initialPrompt?: string;
  initialTitle?: string;
  initialYear?: number;
}

export default function RecordModal({
  isOpen,
  onClose,
  onSave,
  initialPrompt,
  initialTitle,
  initialYear
}: RecordModalProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [allTranscriptions, setAllTranscriptions] = useState<string[]>([]);
  const [isContinuingRecording, setIsContinuingRecording] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState(initialPrompt || '');
  const [storyTitle, setStoryTitle] = useState(initialTitle || '');
  const [storyYear, setStoryYear] = useState(initialYear || null);
  const [followUpPrompts, setFollowUpPrompts] = useState<string[]>([]);
  const [showTranscription, setShowTranscription] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [editedTranscription, setEditedTranscription] = useState('');
  const [showGoDeeperOverlay, setShowGoDeeperOverlay] = useState(false);
  const [goDeeperQuestions, setGoDeeperQuestions] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [formattedContent, setFormattedContent] = useState<any>(null);
  const [silenceTimer, setSilenceTimer] = useState(0);
  const [isTypingMode, setIsTypingMode] = useState(false);

  const audioRecorderRef = useRef<AudioRecorderHandle>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const silenceRef = useRef<NodeJS.Timeout | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Fetch personalized prompt based on profile
  const { data: profileData } = useQuery({
    queryKey: ['/api/profile'],
    enabled: isOpen && !initialPrompt,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Generate context-aware initial prompt
  useEffect(() => {
    if (!initialPrompt && profileData && isOpen) {
      const prompts = [];

      if (profileData.workEthic > 7) {
        prompts.push("Your profile shows you have a strong work ethic. Tell me about a time your dedication surprised even yourself.");
      }

      if (profileData.familyOrientation > 7) {
        prompts.push("Family seems important to you. What's a family memory that still makes you smile?");
      }

      if (profileData.riskTolerance > 6) {
        prompts.push("You seem comfortable with taking risks. What leap of faith changed your life?");
      }

      const currentYear = new Date().getFullYear();
      const age = currentYear - profileData.birthYear;
      if (age > 70) {
        prompts.push("With all your years of experience, what wisdom would you share with someone just starting out?");
      }

      if (prompts.length === 0) {
        prompts.push("Let's start with something meaningful to you. What story have you been wanting to share?");
      }

      setCurrentPrompt(prompts[Math.floor(Math.random() * prompts.length)]);
    }
  }, [profileData, isOpen, initialPrompt]);

  // Recording timer
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording, isPaused]);

  // Silence detection for follow-up prompts
  useEffect(() => {
    if (isRecording && !isPaused && recordingTime > 10) {
      // Simulate silence detection (in real app, would analyze audio levels)
      silenceRef.current = setTimeout(() => {
        generateFollowUp();
      }, 5000); // After 5 seconds of "silence"
    } else {
      if (silenceRef.current) {
        clearTimeout(silenceRef.current);
      }
    }

    return () => {
      if (silenceRef.current) {
        clearTimeout(silenceRef.current);
      }
    };
  }, [isRecording, isPaused, recordingTime]);

  const generateFollowUp = async () => {
    // In production, this would call AI to generate contextual follow-ups
    const contextualPrompts = [
      "That's interesting. How did that make you feel?",
      "What happened next?",
      "Who else was involved in this story?",
      "Looking back, what would you have done differently?",
      "What did you learn from this experience?",
    ];

    const newPrompt = contextualPrompts[Math.floor(Math.random() * contextualPrompts.length)];
    setFollowUpPrompts(prev => [...prev, newPrompt].slice(-3)); // Keep last 3
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = () => {
    setIsRecording(true);
    setIsPaused(false);
    setRecordingTime(0);
    setFollowUpPrompts([]);
  };

  const pauseRecording = () => {
    setIsPaused(true);
    audioRecorderRef.current?.pauseRecording();
  };

  const resumeRecording = () => {
    setIsPaused(false);
    audioRecorderRef.current?.resumeRecording();
  };

  const handleRecordingComplete = async (blob: Blob, duration: number) => {
    console.log('[RecordModal] handleRecordingComplete called with blob:', blob.size, 'duration:', duration);
    setAudioBlob(blob);
    // Keep isRecording true while transcribing so we stay on the recording screen
    setIsPaused(false);
    setRecordingTime(duration);
    setIsTranscribing(true); // Show processing state

    toast({
      title: 'Recording complete!',
      description: 'Transcribing your story...',
    });

    console.log('[RecordModal] Starting transcription process...');
    try {
      // Convert blob to base64 for transcription
      console.log('[RecordModal] Converting blob to base64...');
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Data = (reader.result as string).split(',')[1];
          console.log('[RecordModal] Blob converted to base64, length:', base64Data.length);
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      // Get Supabase session for authorization
      let { data: { session }, error: sessionError } = await supabase.auth.getSession();

      // If no session, try to refresh
      if (!session || sessionError) {
        console.log('[RecordModal] No session or error, attempting refresh...');
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshedSession) {
          session = refreshedSession;
          console.log('[RecordModal] Session refreshed successfully');
        } else {
          console.error('[RecordModal] Failed to refresh session:', refreshError);
          throw new Error('Authentication failed. Please sign in again.');
        }
      }

      // Call transcription API with authorization
      console.log('[RecordModal] Preparing API call to /api/transcribe...');
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };

      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
        console.log('[RecordModal] Session token found, adding to headers');
      } else {
        console.error('[RecordModal] No authentication token found!');
        throw new Error('No authentication token. Please sign in again.');
      }

      console.log('[RecordModal] Calling /api/transcribe with blob type:', blob.type);
      const response = await fetch(getApiUrl('/api/transcribe'), {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          audioBase64: base64,
          mimeType: blob.type || 'audio/webm',
          title: storyTitle || undefined,
        }),
      });

      console.log('[RecordModal] API response status:', response.status, response.statusText);
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please refresh the page and sign in again.');
        }
        throw new Error(`Transcription failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[RecordModal] Transcription successful, transcription length:', data.transcription?.length || 0);
      console.log('[RecordModal] Response data:', { 
        hasTranscription: !!data.transcription, 
        hasFormattedContent: !!data.formattedContent,
        hasLessonOptions: !!data.lessonOptions 
      });

      // Save and navigate to BookStyleReview immediately
      console.log('[RecordModal] Calling onSave with transcription length:', (data.transcription || '').length);
      onSave({
        audioBlob: blob,
        transcription: data.transcription || '',
        formattedContent: data.formattedContent,
        followUpQuestions: data.formattedContent?.questions?.map((q: any) => q.text) || [],
        title: storyTitle || undefined,
        year: storyYear || undefined,
        wisdomClipText: data.lessonOptions?.practical || '', // Add practical lesson as default
      });

    } catch (error) {
      console.error('[RecordModal] Transcription error:', error);
      console.error('[RecordModal] Error stack:', error instanceof Error ? error.stack : 'No stack trace');

      // Clean up state
      setIsTranscribing(false);
      setIsRecording(false);

      // Determine the error message to show
      let errorMessage = 'Failed to transcribe audio. You can still save your recording.';
      if (error instanceof Error) {
        if (error.message.includes('Authentication')) {
          errorMessage = error.message;
        } else if (error.message.includes('Transcription failed')) {
          errorMessage = error.message;
        }
      }

      toast({
        title: 'Transcription Error',
        description: errorMessage,
        variant: 'destructive',
      });

      // Even on error, save with the audio blob
      console.log('[RecordModal] Calling onSave with empty transcription due to error');
      onSave({
        audioBlob: blob,
        transcription: '',
        title: storyTitle || undefined,
        year: storyYear || undefined,
      });
    }
  };

  const stopRecording = () => {
    // This will trigger handleRecordingComplete via the AudioRecorder component
    // The stop button is handled by the AudioRecorder component itself
    setIsRecording(false);
    setIsPaused(false);
  };

  const generateGoDeeperQuestions = async (transcriptionText: string) => {
    try {
      // Get auth session for API call
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No auth session');
      }

      const response = await fetch('/api/followups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ transcription: transcriptionText })
      });

      if (!response.ok) {
        throw new Error('Failed to generate questions');
      }

      const data = await response.json();
      const questions = [
        data.followUps.emotional,
        data.followUps.wisdom,
        data.followUps.sensory
      ];
      setGoDeeperQuestions(questions);
    } catch (error) {
      console.error('Error generating Go Deeper questions:', error);
      // Fallback to generic questions
      const questions = [
        "Can you tell me more about how that made you feel in that moment?",
        "What do you think that experience taught you about yourself?",
        "Looking back now, what impact did that have on your life?",
      ];
      setGoDeeperQuestions(questions);
    }
  };

  const togglePlayback = () => {
    if (!audioPlayerRef.current) {
      audioPlayerRef.current = new Audio(audioUrl!);
      audioPlayerRef.current.onended = () => setIsPlaying(false);
    }

    if (isPlaying) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    } else {
      audioPlayerRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleGoDeeperContinue = () => {
    // Mark that we're continuing an existing recording
    setIsContinuingRecording(true);

    // Hide overlays and show recording UI
    setShowGoDeeperOverlay(false);
    setShowTranscription(false);

    // Update the current prompt to the selected question
    setCurrentPrompt(goDeeperQuestions[currentQuestionIndex]);

    // Show recording UI again (will start fresh recording that we'll append)
    setIsRecording(true);
    setIsPaused(false);

    // Note: AudioRecorder will create a new recording segment
    // We'll concatenate transcriptions when processing
  };

  const saveRecording = () => {
    if (audioBlob) {
      onSave({
        audioBlob,
        transcription: editedTranscription || transcription,
        followUpQuestions: goDeeperQuestions,
        formattedContent: formattedContent,
        title: storyTitle || undefined,
        year: storyYear || undefined,
      });

      // Cleanup
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }

      // Reset state
      setIsRecording(false);
      setRecordingTime(0);
      setAudioBlob(null);
      setFollowUpPrompts([]);
      setShowTranscription(false);
      setTranscription('');
      setEditedTranscription('');
      setGoDeeperQuestions([]);
      setAudioUrl(null);
      setAllTranscriptions([]);
      setIsContinuingRecording(false);
      setIsTypingMode(false);

      onClose();

      toast({
        title: 'Story saved!',
        description: 'Your story has been saved successfully.',
      });
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-end md:items-center justify-center"
          style={{ background: 'rgba(0, 0, 0, 0.5)' }}
        >
          {/* Modal Content */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full md:max-w-2xl bg-white rounded-t-3xl md:rounded-3xl max-h-[90vh] overflow-hidden flex flex-col"
            style={{ background: designSystem.colors.background.creamLight }}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <h2
                className="text-[15px] sm:text-base md:text-lg font-bold mr-3"
                style={{
                  fontFamily: designSystem.typography.fontFamilies.serif,
                  // Fix for vertical text wrapping on mobile
                  flex: '1 1 auto',
                  minWidth: '200px',
                  maxWidth: 'calc(100% - 50px)',
                  wordBreak: 'keep-all',
                  overflowWrap: 'break-word',
                  wordWrap: 'break-word',
                  whiteSpace: 'normal',
                  hyphens: 'none',
                  WebkitHyphens: 'none',
                  msHyphens: 'none',
                  lineHeight: '1.4'
                }}
              >
                {isRecording ? 'Recording Your Story' : 'Ready to Share a Story?'}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  // Stop and cleanup audio recorder before closing
                  audioRecorderRef.current?.cleanup();

                  // Reset typing mode when closing
                  setIsTypingMode(false);
                  setShowTranscription(false);
                  setEditedTranscription('');
                  onClose();
                }}
                className="rounded-full p-1.5 -mr-2"
                style={{ flexShrink: 0 }}
              >
                <X className="w-5 h-5 text-gray-600" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {!isRecording && !showTranscription && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Initial Prompt */}
                  <Card className="p-8" style={{
                    background: 'linear-gradient(135deg, white 0%, #FFF8F3 100%)',
                    borderRadius: designSystem.spacing.borderRadius.card,
                    boxShadow: designSystem.shadows.md,
                  }}>
                    <div className="flex items-start gap-3 mb-6">
                      <Sparkles className="w-6 h-6 mt-2" style={{ color: designSystem.colors.primary.coral }} />
                      <div className="flex-1">
                        <h3 className="font-semibold mb-4 text-2xl">Your Personalized Prompt</h3>
                        <p className="text-4xl leading-relaxed italic text-gray-700">
                          &ldquo;{currentPrompt || "What's a story from your life that you've been wanting to share?"}&rdquo;
                        </p>
                      </div>
                    </div>
                    <p className="text-2xl leading-relaxed text-gray-600">
                      Take a moment to think about this. When you're ready, press record and just start talking.
                    </p>
                  </Card>

                  {/* Tips */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-700 text-xl">Tips for a great recording:</h4>
                    <ul className="space-y-2 text-lg text-gray-600">
                      <li className="flex items-start gap-2">
                        <span className="text-coral-500 mt-0.5">•</span>
                        <span>Speak naturally, as if telling a friend</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-coral-500 mt-0.5">•</span>
                        <span>Don't worry about perfect grammar</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-coral-500 mt-0.5">•</span>
                        <span>Include details that make the story come alive</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-coral-500 mt-0.5">•</span>
                        <span>We'll ask follow-up questions if you pause</span>
                      </li>
                    </ul>
                  </div>
                </motion.div>
              )}

              {isRecording && !showTranscription && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6"
                >
                  {isTranscribing ? (
                    // Processing state - show spinner and message
                    <div className="flex flex-col items-center justify-center py-12 space-y-6">
                      <div className="relative">
                        <div className="w-24 h-24 rounded-full border-4 border-gray-200 border-t-coral-500 animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Sparkles className="w-10 h-10" style={{ color: designSystem.colors.primary.coral }} />
                        </div>
                      </div>
                      <div className="text-center space-y-2">
                        <h3 className="text-2xl font-semibold" style={{ fontFamily: designSystem.typography.fontFamilies.serif }}>
                          Processing your recording...
                        </h3>
                        <p className="text-lg text-gray-600">
                          We're transcribing your story. This will just take a moment.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Prompt reminder */}
                      <Card className="p-6 bg-gray-50">
                        <p className="text-2xl text-gray-700 italic leading-relaxed">
                          "{currentPrompt || "Tell your story..."}"
                        </p>
                      </Card>

                      {/* Embedded Audio Recorder */}
                      <div className="flex flex-col items-center space-y-4">
                        <AudioRecorder
                          ref={audioRecorderRef}
                          onRecordingComplete={handleRecordingComplete}
                          maxDuration={300} // 5 minutes max
                          className="w-full"
                        />
                      </div>

                      {/* Follow-up Prompts */}
                      {followUpPrompts.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-3"
                        >
                          <p className="text-sm text-gray-500">Keep going, or consider:</p>
                          {followUpPrompts.map((prompt, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                            >
                              <Card className="p-4" style={{
                                background: 'white',
                                borderLeft: `3px solid ${designSystem.colors.primary.coral}`,
                              }}>
                                <p className="italic text-gray-700">&ldquo;{prompt}&rdquo;</p>
                              </Card>
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </>
                  )}
                </motion.div>
              )}

              {showTranscription && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: designSystem.typography.fontFamilies.serif }}>
                      {isTypingMode ? 'Type Your Story' : 'Review Your Story'}
                    </h3>
                    <p className="text-gray-600">
                      {isTypingMode
                        ? 'Type your story below. Take your time and include all the details you want to share.'
                        : (isTranscribing ? 'Transcribing your story...' : 'You can edit the transcription below')}
                    </p>
                  </div>

                  {/* Audio Playback - Only show if not in typing mode */}
                  {!isTypingMode && (
                    <Card className="p-4 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={togglePlayback}
                            disabled={!audioUrl}
                          >
                            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </Button>
                          <span className="text-sm text-gray-600">
                            {isPlaying ? 'Playing...' : 'Listen to your recording'}
                          </span>
                        </div>
                        <span className="text-sm font-medium">{formatTime(recordingTime)}</span>
                      </div>
                    </Card>
                  )}

                  {/* Transcription */}
                  <Card className="p-6" style={{
                    background: 'white',
                    borderRadius: designSystem.spacing.borderRadius.card,
                  }}>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <Sparkles className="w-5 h-5 mt-1" style={{ color: designSystem.colors.primary.coral }} />
                        <div className="flex-1">
                          <h4 className="font-semibold mb-2">{isTypingMode ? 'Your Story' : 'Your Transcription'}</h4>
                          {isTranscribing ? (
                            <div className="flex items-center gap-2 text-gray-500">
                              <div className="animate-pulse">Processing audio...</div>
                            </div>
                          ) : (
                            <Textarea
                              value={editedTranscription}
                              onChange={(e) => setEditedTranscription(e.target.value)}
                              className="min-h-[200px] resize-none"
                              placeholder={isTypingMode
                                ? `Start typing your story here...\n\nConsider the prompt: "${currentPrompt}"`
                                : "Your story transcription will appear here..."}
                              autoFocus={isTypingMode}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Go Deeper Button - Don't show in typing mode since it's for recorded stories */}
                  {!isTranscribing && transcription && !isTypingMode && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowGoDeeperOverlay(true);
                        setCurrentQuestionIndex(0);
                      }}
                      className="w-full"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Go Deeper
                    </Button>
                  )}
                </motion.div>
              )}

              {/* Go Deeper Overlay */}
              <AnimatePresence>
                {showGoDeeperOverlay && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="fixed inset-0 z-[60] flex items-center justify-center p-4"
                    style={{ background: 'rgba(0, 0, 0, 0.7)' }}
                  >
                    <motion.div
                      className="w-full max-w-md bg-white rounded-2xl p-6 space-y-4"
                      style={{ background: designSystem.colors.background.creamLight }}
                    >
                      <div className="text-center">
                        <h3 className="text-xl font-bold mb-2" style={{ fontFamily: designSystem.typography.fontFamilies.serif }}>
                          Maybe go deeper here?
                        </h3>
                      </div>

                      <Card className="p-4" style={{
                        background: `linear-gradient(135deg, ${designSystem.colors.primary.coralLight} 0%, white 100%)`,
                      }}>
                        <p className="text-lg italic text-gray-700">
                          &ldquo;{goDeeperQuestions[currentQuestionIndex]}&rdquo;
                        </p>
                      </Card>

                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                          disabled={currentQuestionIndex === 0}
                          className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                          aria-label="Previous question"
                        >
                          <ChevronRight className="w-5 h-5 rotate-180 text-gray-600" />
                        </button>

                        <div className="flex items-center gap-2">
                          {goDeeperQuestions.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentQuestionIndex(index)}
                              className={`w-2.5 h-2.5 rounded-full transition-all ${
                                index === currentQuestionIndex
                                  ? 'bg-coral-500 scale-125'
                                  : 'bg-gray-300 hover:bg-gray-400'
                              }`}
                              aria-label={`Question ${index + 1}`}
                            />
                          ))}
                        </div>

                        <button
                          onClick={() => setCurrentQuestionIndex(Math.min(goDeeperQuestions.length - 1, currentQuestionIndex + 1))}
                          disabled={currentQuestionIndex === goDeeperQuestions.length - 1}
                          className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                          aria-label="Next question"
                        >
                          <ChevronRight className="w-5 h-5 text-gray-600" />
                        </button>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          onClick={() => setShowGoDeeperOverlay(false)}
                          className="flex-1"
                        >
                          Skip
                        </Button>
                        <Button
                          onClick={handleGoDeeperContinue}
                          className="flex-1"
                          style={{
                            background: designSystem.colors.primary.coral,
                            color: 'white',
                          }}
                        >
                          Continue Recording
                        </Button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 border-t bg-white">
              {!isRecording && !showTranscription && (
                <div className="space-y-3">
                  <Button
                    onClick={startRecording}
                    className="w-full flex items-center justify-center gap-3"
                    style={{
                      background: designSystem.colors.gradients.coral,
                      color: 'white',
                      borderRadius: designSystem.spacing.borderRadius.full,
                      padding: '16px',
                      minHeight: '60px',
                      fontSize: designSystem.typography.sizes.lg,
                      fontWeight: designSystem.typography.weights.semibold,
                      boxShadow: designSystem.shadows.lg,
                    }}
                  >
                    <Mic className="w-6 h-6" />
                    Start Recording
                  </Button>

                  {/* Type Story Option - More discrete */}
                  <button
                    onClick={() => {
                      // Go directly to transcription screen for typing
                      setShowTranscription(true);
                      setTranscription('');
                      setEditedTranscription('');
                      setIsTranscribing(false);
                      setIsTypingMode(true);
                      // Create an empty audio blob so save button works
                      setAudioBlob(new Blob([''], { type: 'audio/webm' }));
                    }}
                    className="w-full text-center text-gray-600 hover:text-gray-800 transition-colors py-2 text-sm underline decoration-dotted underline-offset-4"
                  >
                    I want to type my story instead
                  </button>
                </div>
              )}

              {/* Recording controls are now handled by AudioRecorder component */}

              {showTranscription && !isTranscribing && (
                <div className="flex gap-3">
                  {!isTypingMode && (
                    <Button
                      onClick={() => {
                        setShowTranscription(false);
                        setIsRecording(true);
                      }}
                      variant="outline"
                      className="flex-1"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Re-record
                    </Button>
                  )}
                  <Button
                    onClick={saveRecording}
                    className={isTypingMode ? "w-full" : "flex-1"}
                    style={{
                      background: designSystem.colors.primary.coral,
                      color: 'white',
                      borderRadius: designSystem.spacing.borderRadius.button,
                    }}
                  >
                    Save Story
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}