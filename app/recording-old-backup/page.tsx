"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { navCache } from "@/lib/navCache";
import {
  type FlowStep,
  type RecordingMode,
  type StoryDraft,
  type RecordingNavCache,
} from "./types";
import { StartStoryScreen } from "./components/StartStoryScreen";
import { PhotoTitleScreen } from "./components/PhotoTitleScreen";
import { AudioRecordingScreen } from "./components/AudioRecordingScreen";
import { TextEntryScreen } from "./components/TextEntryScreen";
import "./recording.css";

/**
 * Recording Flow - State Machine Orchestrator
 * Manages navigation between Start → PhotoTitle → Audio/Text → Review
 * Based on heritage-whisper-recorder with Next.js router integration
 */
function RecordingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<FlowStep>("start");
  const [originStep, setOriginStep] = useState<FlowStep | null>(null);
  const [draft, setDraft] = useState<Partial<StoryDraft>>({
    recordingMode: "audio",
  });

  // Restore state from URL params on mount
  useEffect(() => {
    const stepParam = searchParams.get("step") as FlowStep | null;
    const navId = searchParams.get("nav");

    if (stepParam) {
      setStep(stepParam);
    }

    if (navId) {
      const cachedData = navCache.get(navId) as Partial<StoryDraft> | null;
      if (cachedData) {
        setDraft(cachedData);
      }
    }

    // Get source prompt ID if coming from prompts page
    const promptId = searchParams.get("prompt");
    if (promptId) {
      setDraft((prev) => ({ ...prev, sourcePromptId: promptId }));
    }

    // Check for starter template from timeline ghost stories
    const starterTemplateJson = sessionStorage.getItem('starterTemplate');
    if (starterTemplateJson) {
      try {
        const template = JSON.parse(starterTemplateJson);
        let title = template.title;

        // Special case for birth story
        if (template.id === 'birth-story') {
          title = "When I was born";
        }

        setDraft((prev) => ({ ...prev, title }));

        // Clear it so it doesn't persist if they come back later
        sessionStorage.removeItem('starterTemplate');
      } catch (e) {
        console.error("Failed to parse starter template", e);
      }
    }
  }, []);

  // Update URL when step changes
  useEffect(() => {
    const params = new URLSearchParams();
    params.set("step", step);

    if (draft.sourcePromptId) {
      params.set("prompt", draft.sourcePromptId);
    }

    router.replace(`/recording?${params.toString()}`, { scroll: false });
  }, [step]);

  // Handlers
  const handleSelectMode = (mode: RecordingMode) => {
    setDraft((prev) => ({ ...prev, recordingMode: mode }));

    if (mode === "photo_audio") {
      // Photo + audio flow: go to photo/title screen
      setStep("photoTitle");
      setOriginStep("start");
    } else if (mode === "audio") {
      // Audio only: skip to recording
      setStep("audio");
      setOriginStep("start");
    } else if (mode === "text") {
      // Text only
      setStep("text");
      setOriginStep("start");
    }
  };

  const handleCancel = () => {
    if (confirm("Are you sure you want to cancel? Your progress will be lost.")) {
      router.push("/timeline");
    }
  };

  const handlePhotoTitleBack = () => {
    setStep("start");
  };

  const handlePhotoTitleContinue = () => {
    setStep("audio");
    setOriginStep("photoTitle");
  };

  const handleAudioBack = () => {
    if (originStep === "photoTitle") {
      setStep("photoTitle");
    } else {
      setStep("start");
    }
  };

  const handleAudioFinish = async (completeDraft: StoryDraft) => {
    // Create NavCache entry
    const navId = `recording-${Date.now()}`;
    const cacheData: RecordingNavCache = {
      audioBlob: completeDraft.audioBlob,
      title: completeDraft.title,
      photoUrl: completeDraft.photoUrl,
      photoFile: completeDraft.photoFile,
      duration: completeDraft.durationSeconds,
      transcription: completeDraft.transcription,
      lessonOptions: completeDraft.lessonOptions,
      recordingMode: completeDraft.recordingMode,
      sourcePromptId: completeDraft.sourcePromptId,
      storyYear: completeDraft.storyYear,
    };

    navCache.set(navId, cacheData);

    // Navigate to book-style review
    router.push(`/review/book-style?nav=${navId}`);
  };

  const handleSaveForLater = (draftToSave: Partial<StoryDraft>) => {
    // TODO: Implement draft persistence
    console.log("Save for later:", draftToSave);
    alert("Draft saved! (Feature coming soon)");
    router.push("/timeline");
  };

  const handleSwitchToText = () => {
    setDraft((prev) => ({ ...prev, audioBlob: undefined, durationSeconds: undefined }));
    setStep("text");
    setOriginStep("audio");
  };

  const handleTextBack = () => {
    if (originStep === "audio") {
      setStep("audio");
    } else {
      setStep("start");
    }
  };

  const handleTextSave = async (completeDraft: StoryDraft) => {
    // Create NavCache entry for text-only story
    const navId = `recording-${Date.now()}`;
    const cacheData: RecordingNavCache = {
      textBody: completeDraft.textBody,
      title: completeDraft.title,
      photoUrl: completeDraft.photoUrl,
      photoFile: completeDraft.photoFile,
      recordingMode: "text",
      sourcePromptId: completeDraft.sourcePromptId,
      storyYear: completeDraft.storyYear,
    };

    navCache.set(navId, cacheData);

    // Navigate to book-style review
    router.push(`/review/book-style?nav=${navId}`);
  };

  const handleBackToAudio = () => {
    setDraft((prev) => ({ ...prev, textBody: undefined }));
    setStep("audio");
    setOriginStep("text");
  };

  const handleDraftChange = (newDraft: Partial<StoryDraft>) => {
    setDraft(newDraft);
  };

  // Render current step
  return (
    <>
      {step === "start" && (
        <StartStoryScreen onSelectMode={handleSelectMode} onCancel={handleCancel} />
      )}

      {step === "photoTitle" && (
        <PhotoTitleScreen
          draft={draft}
          onChange={handleDraftChange}
          onBack={handlePhotoTitleBack}
          onContinue={handlePhotoTitleContinue}
        />
      )}

      {step === "audio" && (
        <AudioRecordingScreen
          draft={draft}
          onChange={handleDraftChange}
          onBack={handleAudioBack}
          onFinishAndReview={handleAudioFinish}
          onSaveForLater={handleSaveForLater}
          onSwitchToText={handleSwitchToText}
        />
      )}

      {step === "text" && (
        <TextEntryScreen
          draft={draft}
          onChange={handleDraftChange}
          onBack={handleTextBack}
          onSaveStory={handleTextSave}
          onBackToAudio={handleBackToAudio}
        />
      )}
    </>
  );
}

export default function RecordingPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <RecordingContent />
    </Suspense>
  );
}
