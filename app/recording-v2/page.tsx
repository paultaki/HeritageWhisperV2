"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { HomeScreen } from "./components/HomeScreen";
import { RecordingScreen } from "./components/RecordingScreen";
import { ReviewScreen } from "./components/ReviewScreen";
import { toast } from "sonner";

// State machine types
type RecordingState =
  | { screen: "home" }
  | { screen: "recording"; prompt?: string; startTime: number }
  | {
      screen: "review";
      audioUrl: string;
      audioBlob: Blob;
      duration: number;
      prompt?: string;
      transcription?: string;
      lessonOptions?: {
        practical?: string;
        emotional?: string;
        character?: string;
      };
      isTranscribing?: boolean;
    };

export default function RecordingV2Page() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [state, setState] = useState<RecordingState>({ screen: "home" });

  // Protected route - redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, isLoading, router]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="hw-page flex items-center justify-center bg-[#FFFDF7]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#2C5282] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!user) {
    return null;
  }

  // Event handlers for state transitions
  const handleStartRecording = (prompt?: string) => {
    setState({
      screen: "recording",
      prompt,
      startTime: Date.now(),
    });
  };

  const handleFinishRecording = async (
    audioBlob: Blob,
    duration: number,
    usedPrompt?: string
  ) => {
    // Check minimum duration (30 seconds)
    if (duration < 30) {
      toast.error("Recording must be at least 30 seconds long");
      return;
    }

    // Move to review screen immediately
    setState({
      screen: "review",
      audioUrl: URL.createObjectURL(audioBlob),
      audioBlob,
      duration,
      prompt: usedPrompt,
      isTranscribing: true,
    });

    // Start upload and transcription in background
    try {
      // Upload audio
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");

      const uploadResponse = await fetch("/api/upload/audio", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload audio");
      }

      const { url: uploadedAudioUrl } = await uploadResponse.json();

      // Start transcription
      const transcribeFormData = new FormData();
      transcribeFormData.append("audioUrl", uploadedAudioUrl);

      const transcribeResponse = await fetch("/api/transcribe", {
        method: "POST",
        body: transcribeFormData,
      });

      if (!transcribeResponse.ok) {
        throw new Error("Failed to transcribe audio");
      }

      const { transcription, lessonOptions } = await transcribeResponse.json();

      // Update state with transcription results
      setState((prev) => {
        if (prev.screen !== "review") return prev;
        return {
          ...prev,
          audioUrl: uploadedAudioUrl, // Replace blob URL with uploaded URL
          transcription,
          lessonOptions,
          isTranscribing: false,
        };
      });

      toast.success("Transcription complete!");
    } catch (error) {
      console.error("Error processing recording:", error);
      toast.error("Failed to process recording. You can still save it without transcription.");

      setState((prev) => {
        if (prev.screen !== "review") return prev;
        return {
          ...prev,
          isTranscribing: false,
        };
      });
    }
  };

  const handleCancelRecording = () => {
    setState({ screen: "home" });
  };

  const handleSaveStory = async (storyData: {
    title: string;
    storyYear?: number;
    transcription?: string;
    lessonLearned?: string;
  }) => {
    if (state.screen !== "review") return;

    try {
      const response = await fetch("/api/stories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: storyData.title,
          transcription: storyData.transcription || "",
          audioUrl: state.audioUrl,
          durationSeconds: Math.floor(state.duration),
          storyYear: storyData.storyYear,
          lessonLearned: storyData.lessonLearned,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save story");
      }

      toast.success("Memory saved successfully!");

      // Redirect to timeline after brief delay
      setTimeout(() => {
        router.push("/timeline");
      }, 500);
    } catch (error) {
      console.error("Error saving story:", error);
      toast.error("Failed to save memory. Please try again.");
    }
  };

  const handleBackFromReview = () => {
    // Go back to home (discard the recording)
    if (state.screen === "review") {
      URL.revokeObjectURL(state.audioUrl);
    }
    setState({ screen: "home" });
  };

  // Render appropriate screen based on state
  return (
    <div className="hw-page bg-[#FFFDF7]">
      {state.screen === "home" && (
        <HomeScreen onStartRecording={handleStartRecording} />
      )}

      {state.screen === "recording" && (
        <RecordingScreen
          prompt={state.prompt}
          onFinish={handleFinishRecording}
          onCancel={handleCancelRecording}
        />
      )}

      {state.screen === "review" && (
        <ReviewScreen
          audioUrl={state.audioUrl}
          duration={state.duration}
          prompt={state.prompt}
          transcription={state.transcription}
          lessonOptions={state.lessonOptions}
          isTranscribing={state.isTranscribing || false}
          onSave={handleSaveStory}
          onBack={handleBackFromReview}
        />
      )}
    </div>
  );
}
