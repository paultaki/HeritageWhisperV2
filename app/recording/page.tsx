"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AudioRecorder, AudioRecorderHandle } from "@/components/AudioRecorder";
import { InFlowPromptCard } from "@/components/InFlowPromptCard";
import { useAuth } from "@/lib/auth";
import { ArrowLeft, Heart, Mic, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { navCache } from "@/lib/navCache";
import { findMatchingPrompt, getFallbackPrompt } from "@/utils/keywordPrompts";

// Helper function to convert blob to base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      resolve(base64.split(',')[1]); // Remove data:audio/webm;base64, prefix
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Helper function to combine audio blobs
const combineAudioBlobs = async (blob1: Blob, blob2: Blob): Promise<Blob> => {
  const combinedArray = new Uint8Array(blob1.size + blob2.size);

  const buffer1 = await blob1.arrayBuffer();
  combinedArray.set(new Uint8Array(buffer1), 0);

  const buffer2 = await blob2.arrayBuffer();
  combinedArray.set(new Uint8Array(buffer2), blob1.size);

  return new Blob([combinedArray], { type: blob1.type });
};

// Wisdom Clip Screen Component
function WisdomClipScreen({
  onRecord,
  onSkip,
  onBack,
  isVisible
}: {
  onRecord: (audioBlob: Blob, duration: number) => void;
  onSkip: () => void;
  onBack: () => void;
  isVisible: boolean;
}) {
  if (!isVisible) return null;

  const handleWisdomRecordingComplete = (audioBlob: Blob, duration: number) => {
    console.log('[WisdomClip] Recording complete - Size:', audioBlob.size, 'Type:', audioBlob.type, 'Duration:', duration);
    if (audioBlob && audioBlob.size > 0) {
      onRecord(audioBlob, duration);
    } else {
      console.error('[WisdomClip] ERROR: Empty audio blob received!');
      alert('Recording failed: No audio was captured. Please check your microphone and try again.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 text-center">
      <Button
        variant="ghost"
        onClick={onBack}
        className="absolute top-6 left-6 p-3 rounded-full shadow-lg"
        data-testid="button-back-to-recording"
      >
        <ArrowLeft className="w-6 h-6" />
      </Button>

      <div className="mb-12">
        <Heart className="w-16 h-16 text-accent mx-auto mb-6" />
        <h1 className="text-4xl font-bold text-foreground mb-4">One Last Thing...</h1>
        <p className="text-xl text-muted-foreground mb-8">
          If you had 60 seconds with your grandchild,<br />
          what would you say?
        </p>
        <p className="text-lg text-muted-foreground">
          This becomes the wisdom clip of your story
        </p>
      </div>

      <Card className="mb-8">
        <CardContent className="pt-8 pb-8">
          <AudioRecorder
            onRecordingComplete={handleWisdomRecordingComplete}
            maxDuration={10}
            className="mb-4"
          />
        </CardContent>
      </Card>

      <div className="flex space-x-4">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex-1 py-3 text-lg whitespace-nowrap overflow-hidden text-ellipsis"
          data-testid="button-go-back"
        >
          ← Back to Recording
        </Button>

        <Button
          variant="outline"
          onClick={onSkip}
          className="flex-1 py-3 text-lg whitespace-nowrap overflow-hidden text-ellipsis"
          data-testid="button-skip-wisdom"
        >
          Skip This Step
        </Button>
      </div>
    </div>
  );
}

// Post-Recording AI Follow-up Component
function PostRecordingFollowUp({
  question,
  onRecord,
  onSkipToWisdom
}: {
  question: string;
  onRecord: () => void;
  onSkipToWisdom: () => void;
}) {
  return (
    <div className="max-w-2xl mx-auto p-6 text-center">
      <div className="mb-12">
        <Mic className="w-16 h-16 text-accent mx-auto mb-6" />
        <h2 className="text-3xl font-bold text-foreground mb-4">One Follow Up Question</h2>
        <p className="text-xl text-foreground bg-gradient-to-r from-amber-50 to-rose-50 dark:from-amber-900/20 dark:to-rose-900/20 rounded-lg p-6 mb-8">
          {question}
        </p>
      </div>

      <div className="flex space-x-4">
        <Button
          onClick={onRecord}
          className="flex-1 py-4 text-lg bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white whitespace-nowrap overflow-hidden text-ellipsis"
          data-testid="button-record-answer"
        >
          <Mic className="w-5 h-5 mr-2 shrink-0" />
          <span className="truncate">Record your answer</span>
        </Button>

        <Button
          variant="outline"
          onClick={onSkipToWisdom}
          className="flex-1 py-4 text-lg whitespace-nowrap overflow-hidden text-ellipsis"
          data-testid="button-skip-to-wisdom"
        >
          Skip to wisdom clip →
        </Button>
      </div>
    </div>
  );
}

function RecordingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();

  // State Management
  const [recordingState, setRecordingState] = useState<'recording' | 'processing' | 'post-followup' | 'wisdom' | 'complete'>('recording');
  const [showInFlowPrompt, setShowInFlowPrompt] = useState(false);
  const [currentInFlowPrompt, setCurrentInFlowPrompt] = useState<string>("");
  const [inFlowPromptCount, setInFlowPromptCount] = useState(0);
  const [usedPrompts, setUsedPrompts] = useState<string[]>([]);
  const [lastPromptTime, setLastPromptTime] = useState<number>(0);
  const [postRecordingFollowUp, setPostRecordingFollowUp] = useState<string>("");
  const [hasRecording, setHasRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [displayPrompt, setDisplayPrompt] = useState<string>("");
  const [showWisdomClip, setShowWisdomClip] = useState(false);
  const [isAnsweringFollowUp, setIsAnsweringFollowUp] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  // Refs
  const audioRef = useRef<Blob | null>(null);
  const followUpAudioRef = useRef<Blob | null>(null);
  const wisdomClipRef = useRef<Blob | null>(null);
  const transcriptionRef = useRef<string>("");
  const followUpTranscriptionRef = useRef<string>("");
  const formattedContentRef = useRef<any>(null);
  const audioDurationRef = useRef<number>(0);
  const audioRecorderRef = useRef<AudioRecorderHandle>(null);
  const speechDetectedTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get prompt from navigation or use default
  const getNavDataFromURL = () => {
    const navId = searchParams.get('nav');

    if (navId) {
      const navData = navCache.retrieve(navId);
      if (navData) {
        return navData;
      }
    }
    return null;
  };

  const [navData] = useState(getNavDataFromURL());
  const [isReturningFromReview] = useState(navData?.returnToReview || false);
  const [isReRecording] = useState(navData?.isReRecording || false);
  const [storyId] = useState(navData?.storyId || null);
  const [returnToEdit] = useState(navData?.returnToEdit || false);
  const [currentPrompt] = useState(() => {
    if (navData?.prompt) {
      return navData.prompt;
    }
    if (navData?.isReRecording && navData?.title) {
      return {
        title: navData.title,
        text: "Re-record your story. Take your time and speak from the heart."
      };
    }
    return {
      title: "Record a New Memory",
      text: "Share any story from your life - a special moment, a lesson learned, or just something you'd like to remember. Take your time and speak from the heart."
    };
  });

  // Transcription function
  const transcribeAudio = async (audioBlob: Blob): Promise<{ text: string; formattedContent: any }> => {
    const formData = new FormData();

    let extension = 'webm';
    if (audioBlob.type.includes('ogg')) extension = 'ogg';
    else if (audioBlob.type.includes('mp4')) extension = 'mp4';
    else if (audioBlob.type.includes('wav')) extension = 'wav';

    console.log('[Transcribe] Sending audio - Type:', audioBlob.type, 'Size:', audioBlob.size, 'Extension:', extension);
    formData.append('audio', audioBlob, `recording.${extension}`);

    if (currentPrompt?.title) {
      formData.append('title', currentPrompt.title);
    }

    const res = await fetch("/api/audio/transcribe", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      if (res.status === 401) {
        throw new Error('Authentication required. Please log in to continue.');
      }
      throw new Error(errorData?.message || `Transcription failed: ${res.statusText}`);
    }

    return res.json();
  };

  // Follow-up generation function
  const generateFollowUp = async (transcription: string): Promise<{ questions: string[] }> => {
    const res = await fetch("/api/followups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transcript: transcription,
        prior: usedPrompts
      }),
    });

    if (!res.ok) {
      throw new Error('Failed to generate follow-up');
    }

    return res.json();
  };

  // Initialize display prompt
  useEffect(() => {
    setDisplayPrompt(currentPrompt.text);
  }, [currentPrompt]);

  // Redirect to login if no user
  useEffect(() => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to record memories.",
        variant: "destructive",
      });
      router.push("/auth/login");
    }
  }, [user, router, toast]);

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Please Log In</h1>
        <p className="text-muted-foreground mb-6">You need to be logged in to record memories.</p>
        <Button onClick={() => router.push('/auth/login')} data-testid="button-go-to-login">
          Go to Login
        </Button>
      </div>
    );
  }

  // Function to return to review with preserved form data
  const returnToReview = () => {
    if (!navData || !isReturningFromReview) return;

    const navId = navCache.generateId();
    navCache.set(navId, {
      ...navData,
      transcription: transcriptionRef.current || navData.transcription,
      formattedContent: formattedContentRef.current || navData.formattedContent,
      audioDuration: audioDurationRef.current || navData.audioDuration,
      mainAudioBase64: audioRef.current ? undefined : navData.mainAudioBase64,
      mainAudioType: audioRef.current ? undefined : navData.mainAudioType,
      wisdomClipBase64: wisdomClipRef.current ? undefined : navData.wisdomClipBase64,
      wisdomClipType: wisdomClipRef.current ? undefined : navData.wisdomClipType,
      timestamp: Date.now()
    });

    router.push(`/review?nav=${navId}`);
  };

  // Silence Detection Handler
  const handleSilenceDetected = async (recordingDuration: number) => {
    console.log('[In-Flow Prompts] Silence detected at', recordingDuration, 'seconds');

    if (recordingDuration < 30) {
      console.log('[In-Flow Prompts] Too early for prompt, need 30 seconds. Current:', recordingDuration);
      return;
    }

    if (inFlowPromptCount >= 2) {
      console.log('[In-Flow Prompts] Maximum prompts reached:', inFlowPromptCount);
      return;
    }

    const now = Date.now();
    if (lastPromptTime && (now - lastPromptTime) < 25000) {
      const timeLeft = Math.ceil((25000 - (now - lastPromptTime)) / 1000);
      console.log('[In-Flow Prompts] Cooldown period active. Time left:', timeLeft, 'seconds');
      return;
    }

    console.log('[In-Flow Prompts] All conditions met! Attempting to show prompt...');

    if (audioRecorderRef.current?.isRecording) {
      const currentAudio = audioRecorderRef.current.getCurrentRecording();

      if (currentAudio && currentAudio.size > 0) {
        console.log('[In-Flow Prompts] Got audio blob, size:', currentAudio.size);
        try {
          console.log('[In-Flow Prompts] Starting transcription...');
          const transcriptionResult = await transcribeAudio(currentAudio);
          transcriptionRef.current = transcriptionResult.text;
          formattedContentRef.current = transcriptionResult.formattedContent;
          console.log('[In-Flow Prompts] Transcription complete, text length:', transcriptionResult.text?.length || 0);

          const matchedPrompt = findMatchingPrompt(transcriptionResult.text, usedPrompts);
          const promptToShow = matchedPrompt?.prompt || getFallbackPrompt(usedPrompts);
          console.log('[In-Flow Prompts] Selected prompt:', promptToShow?.substring(0, 50) + '...');

          setCurrentInFlowPrompt(promptToShow);
          setShowInFlowPrompt(true);
          setInFlowPromptCount(prev => prev + 1);
          setUsedPrompts(prev => [...prev, promptToShow]);
          setLastPromptTime(now);
          console.log('[In-Flow Prompts] Prompt shown! Count now:', inFlowPromptCount + 1);

          audioRecorderRef.current.pauseRecording();
          console.log('[In-Flow Prompts] Recording paused');
        } catch (error) {
          console.error('[In-Flow Prompts] Error processing silence detection:', error);
        }
      }
    }
  };

  // Speech Detected Handler
  const handleSpeechDetected = () => {
    console.log('Speech detected');

    if (speechDetectedTimeoutRef.current) {
      clearTimeout(speechDetectedTimeoutRef.current);
      speechDetectedTimeoutRef.current = null;
    }

    if (showInFlowPrompt) {
      speechDetectedTimeoutRef.current = setTimeout(() => {
        setShowInFlowPrompt(false);
        if (audioRecorderRef.current?.isPaused) {
          audioRecorderRef.current.resumeRecording();
        }
      }, 500);
    }
  };

  // In-Flow Prompt Handlers
  const handleAnswerPrompt = () => {
    setShowInFlowPrompt(false);
    setDisplayPrompt(currentInFlowPrompt);

    if (audioRecorderRef.current?.isPaused) {
      audioRecorderRef.current.resumeRecording();
    }
  };

  const handleKeepTalking = () => {
    setShowInFlowPrompt(false);

    if (audioRecorderRef.current?.isPaused) {
      audioRecorderRef.current.resumeRecording();
    }
  };

  const handlePromptAutoDismiss = () => {
    if (showInFlowPrompt) {
      setShowInFlowPrompt(false);
      if (audioRecorderRef.current?.isPaused) {
        audioRecorderRef.current.resumeRecording();
      }
    }
  };

  // Recording Handlers
  const handleRecordingStart = () => {
    setIsRecording(true);

    if (!isAnsweringFollowUp) {
      setInFlowPromptCount(0);
      setUsedPrompts([]);
      setLastPromptTime(0);
    }
  };

  const handleRecordingStop = () => {
    setIsRecording(false);
  };

  const handleMainRecordingComplete = async (audioBlob: Blob, duration: number) => {
    console.log('[Recording] Audio recording complete - Size:', audioBlob.size, 'Type:', audioBlob.type, 'Duration:', duration);

    if (!audioBlob || audioBlob.size === 0) {
      console.error('[Recording] ERROR: Received empty audio blob!');
      toast({
        title: "Recording Failed",
        description: "No audio was captured. Please check your microphone and try again.",
        variant: "destructive",
      });
      return;
    }

    if (duration < 1) {
      console.error('[Recording] ERROR: Recording too short:', duration, 'seconds');
      toast({
        title: "Recording Too Short",
        description: "Please record for at least 1 second.",
        variant: "destructive",
      });
      return;
    }

    if (isAnsweringFollowUp) {
      followUpAudioRef.current = audioBlob;

      try {
        const followUpResult = await transcribeAudio(audioBlob);
        followUpTranscriptionRef.current = followUpResult.text;

        if (audioRef.current && followUpAudioRef.current) {
          const combinedAudio = await combineAudioBlobs(audioRef.current, followUpAudioRef.current);
          audioRef.current = combinedAudio;
          audioDurationRef.current = audioDurationRef.current + duration;

          if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
          }
          const newUrl = URL.createObjectURL(combinedAudio);
          setAudioUrl(newUrl);
        }
      } catch (error) {
        console.error('Error transcribing follow-up:', error);
      }

      await navigateToReview();
    } else {
      audioRef.current = audioBlob;
      audioDurationRef.current = duration;

      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
      setHasRecording(true);

      await handleSave();
    }
  };

  const handleSave = async () => {
    if (!audioRef.current) return;

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to save your recording.",
        variant: "destructive",
      });
      router.push('/auth/login');
      return;
    }

    setRecordingState('processing');
    setIsTranscribing(true);

    try {
      if (!transcriptionRef.current) {
        console.log('[Recording] Starting transcription of main audio...');
        const transcriptionResult = await transcribeAudio(audioRef.current);
        transcriptionRef.current = transcriptionResult.text;
        formattedContentRef.current = transcriptionResult.formattedContent;
        console.log('[Recording] Transcription complete:', transcriptionResult.text?.length || 0, 'characters');
      }

      const followUpResult = await generateFollowUp(transcriptionRef.current);

      if (followUpResult?.questions && followUpResult.questions.length > 0) {
        const question = followUpResult.questions[0];
        const words = question.split(/\s+/);
        const truncatedQuestion = words.slice(0, 15).join(' ');
        setPostRecordingFollowUp(truncatedQuestion);
        setRecordingState('post-followup');
      } else {
        await navigateToReview();
      }
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Processing Error",
        description: "Could not process your recording. Please try again.",
        variant: "destructive"
      });
      await navigateToReview();
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleRecordFollowUpAnswer = () => {
    setIsAnsweringFollowUp(true);
    setRecordingState('recording');
    setHasRecording(false);
    setDisplayPrompt(postRecordingFollowUp);

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
  };

  const handleSkipToWisdomFromFollowUp = async () => {
    await navigateToReview();
  };

  const handleWisdomClipComplete = async (audioBlob: Blob, duration: number) => {
    console.log('[Recording] Wisdom clip complete - Size:', audioBlob.size, 'Type:', audioBlob.type, 'Duration:', duration);

    if (!audioBlob || audioBlob.size === 0) {
      console.error('[Recording] ERROR: Received empty wisdom clip audio blob!');
      toast({
        title: "Wisdom Clip Failed",
        description: "No audio was captured for the wisdom clip. Please check your microphone.",
        variant: "destructive",
      });
      audioBlob = new Blob([], { type: 'audio/webm' });
    }
    wisdomClipRef.current = audioBlob;
    setRecordingState('complete');

    try {
      let wisdomTranscript = "";
      if (audioBlob && audioBlob.size > 0) {
        const wisdomResult = await transcribeAudio(audioBlob);
        wisdomTranscript = wisdomResult.text;
      }

      const fullTranscription = followUpTranscriptionRef.current
        ? transcriptionRef.current + "\n\n" + followUpTranscriptionRef.current
        : transcriptionRef.current;

      const mainAudioBase64 = await blobToBase64(audioRef.current!);
      const wisdomClipBase64 = audioBlob && audioBlob.size > 0 ? await blobToBase64(audioBlob) : undefined;

      const navId = navCache.generateId();
      const payload = {
        transcription: fullTranscription,
        wisdomTranscription: wisdomTranscript,
        audioDuration: audioDurationRef.current,
        mainAudioBase64,
        mainAudioType: audioRef.current?.type || 'audio/webm',
        wisdomClipBase64,
        wisdomClipType: audioBlob?.type || 'audio/webm',
        prompt: currentPrompt,
        timestamp: Date.now(),
        isReRecording,
        storyId,
        title: navData?.title || currentPrompt.title,
        formattedContent: formattedContentRef.current
      };

      navCache.set(navId, payload);
      const reviewUrl = returnToEdit && storyId
        ? `/review?edit=${storyId}&nav=${navId}`
        : `/review?nav=${navId}`;
      router.push(reviewUrl);
    } catch (error) {
      console.error('Wisdom clip processing error:', error);
      const mainAudioBase64 = await blobToBase64(audioRef.current!);
      const navId = navCache.generateId();
      navCache.set(navId, {
        transcription: transcriptionRef.current,
        formattedContent: formattedContentRef.current,
        wisdomTranscription: "",
        audioDuration: audioDurationRef.current,
        mainAudioBase64,
        mainAudioType: audioRef.current?.type || 'audio/webm',
        prompt: currentPrompt,
        timestamp: Date.now(),
        isReRecording,
        storyId,
        title: navData?.title || currentPrompt.title
      });
      const reviewUrl = returnToEdit && storyId
        ? `/review?edit=${storyId}&nav=${navId}`
        : `/review?nav=${navId}`;
      router.push(reviewUrl);
    }
  };

  const navigateToReview = async () => {
    const fullTranscription = followUpTranscriptionRef.current
      ? transcriptionRef.current + "\n\n" + followUpTranscriptionRef.current
      : transcriptionRef.current;

    const mainAudioBase64 = await blobToBase64(audioRef.current!);
    const navId = navCache.generateId();
    navCache.set(navId, {
      transcription: fullTranscription,
      formattedContent: formattedContentRef.current,
      wisdomTranscription: "",
      audioDuration: audioDurationRef.current,
      mainAudioBase64,
      mainAudioType: audioRef.current?.type || 'audio/webm',
      prompt: currentPrompt,
      timestamp: Date.now(),
      isReRecording,
      storyId,
      title: navData?.title || currentPrompt.title
    });
    const reviewUrl = returnToEdit && storyId
      ? `/review?edit=${storyId}&nav=${navId}`
      : `/review?nav=${navId}`;
    router.push(reviewUrl);
  };

  const handleSkipWisdom = async () => {
    await navigateToReview();
  };

  const handleBackFromWisdom = () => {
    setShowWisdomClip(false);
    setRecordingState('recording');
    setIsAnsweringFollowUp(false);
  };

  const handleDelete = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    audioRef.current = null;
    setAudioUrl(null);
    setHasRecording(false);
    transcriptionRef.current = "";
    setDisplayPrompt(currentPrompt.text);
    setInFlowPromptCount(0);
    setUsedPrompts([]);
  };

  const handleRecordAgain = () => {
    handleDelete();
  };

  const handleSkipRecording = () => {
    const navId = navCache.generateId();
    navCache.set(navId, {
      transcription: '',
      formattedContent: null,
      wisdomTranscription: '',
      audioDuration: 0,
      prompt: currentPrompt,
      timestamp: Date.now()
    });
    router.push(`/review?nav=${navId}`);
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (speechDetectedTimeoutRef.current) {
        clearTimeout(speechDetectedTimeoutRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // Render different screens based on state
  if (recordingState === 'wisdom' || showWisdomClip) {
    return (
      <div className="min-h-screen bg-background album-texture md:pl-20">
        <WisdomClipScreen
          onRecord={handleWisdomClipComplete}
          onSkip={handleSkipWisdom}
          onBack={handleBackFromWisdom}
          isVisible={true}
        />
      </div>
    );
  }

  if (recordingState === 'post-followup' && postRecordingFollowUp) {
    return (
      <div className="min-h-screen bg-background album-texture md:pl-20">
        <PostRecordingFollowUp
          question={postRecordingFollowUp}
          onRecord={handleRecordFollowUpAnswer}
          onSkipToWisdom={handleSkipToWisdomFromFollowUp}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background album-texture pb-20 md:pb-0 md:pl-20">
      <div className="max-w-2xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-12 pt-16">
          <Button
            variant="ghost"
            onClick={() => isReturningFromReview ? returnToReview() : router.push("/timeline")}
            className="absolute top-6 left-6 p-3 rounded-full shadow-lg bg-background/90 border-2 border-muted-foreground/20 hover:bg-accent hover:border-accent transition-all"
            data-testid={isReturningFromReview ? "button-back-to-review" : "button-back-to-timeline"}
          >
            <ArrowLeft className="w-6 h-6 text-foreground" />
          </Button>

          <h1 className="text-3xl font-bold text-foreground mb-2">Tell Me About...</h1>
          <h2 className="text-2xl text-primary" data-testid="recording-prompt">
            {currentPrompt.title}
          </h2>
        </div>

        {/* Current Prompt Display */}
        <Card className="max-w-lg mx-auto mb-8">
          <CardContent className="pt-6 pb-6 relative">
            <div className="min-h-[130px] flex flex-col justify-center">
              <p className="text-2xl md:text-3xl text-muted-foreground italic text-center font-medium">
                &ldquo;{displayPrompt}&rdquo;
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Recording Interface */}
        <div className="mb-8">
          {!hasRecording ? (
            <>
              <AudioRecorder
                ref={audioRecorderRef}
                onRecordingComplete={handleMainRecordingComplete}
                maxDuration={120}
                onStart={handleRecordingStart}
                onStop={handleRecordingStop}
                onSilenceDetected={handleSilenceDetected}
                onSpeechDetected={handleSpeechDetected}
                silenceThreshold={0.01}
                silenceDuration={1000}
                className="mb-8"
              />
              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
                <Button
                  onClick={() => isReturningFromReview ? returnToReview() : router.push("/timeline")}
                  variant="outline"
                  size="lg"
                  className="px-6 py-2 text-base font-medium border-2 hover:bg-muted/50 transition-colors"
                  data-testid="button-cancel-recording"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSkipRecording}
                  variant="outline"
                  size="lg"
                  className="px-6 py-2 text-base font-medium border-2 hover:bg-muted/50 transition-colors"
                  data-testid="button-skip-recording"
                >
                  Skip recording - I&apos;ll type my story instead
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-6">
              {/* Audio Playback */}
              <Card>
                <CardContent className="pt-6 pb-6">
                  <audio
                    controls
                    src={audioUrl || undefined}
                    className="w-full"
                    data-testid="audio-playback"
                  >
                    Your browser does not support the audio element.
                  </audio>
                </CardContent>
              </Card>

              {/* Decision Buttons */}
              <div className="flex justify-center space-x-4">
                <Button
                  variant="outline"
                  onClick={handleDelete}
                  className="px-6 py-3"
                  data-testid="button-delete-recording"
                >
                  Delete
                </Button>

                <Button
                  variant="outline"
                  onClick={handleRecordAgain}
                  className="px-6 py-3"
                  data-testid="button-record-again"
                >
                  Record Again
                </Button>

                <Button
                  onClick={handleSave}
                  disabled={isTranscribing}
                  className="px-6 py-3"
                  data-testid="button-save-recording"
                >
                  {isTranscribing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Save"
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* In-Flow Prompt Card */}
        <InFlowPromptCard
          prompt={currentInFlowPrompt}
          isVisible={showInFlowPrompt}
          onAnswer={handleAnswerPrompt}
          onKeepTalking={handleKeepTalking}
          onDismiss={handlePromptAutoDismiss}
          autoDismissDelay={undefined}
        />
      </div>
    </div>
  );
}

export default function Recording() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background album-texture pb-20 md:pb-0 md:pl-20 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading recording interface...</p>
        </div>
      </div>
    }>
      <RecordingContent />
    </Suspense>
  );
}
