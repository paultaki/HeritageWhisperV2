import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { toast } from "@/hooks/use-toast";
import { type PostRecordingData, type WizardStep, type WizardState } from "@/types/recording";
import { type StoryPhoto } from "@/components/MultiPhotoUploader";

interface UseRecordingWizardOptions {
  initialData: Partial<PostRecordingData>;
  onComplete?: () => void;
}

/**
 * Hook for managing 4-step post-recording wizard state.
 *
 * Steps:
 * 1. Title & Year
 * 2. Photos (optional)
 * 3. Review transcript
 * 4. Lesson learned (optional)
 */
export function useRecordingWizard({
  initialData,
  onComplete,
}: UseRecordingWizardOptions): WizardState {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize wizard data from NavCache or defaults
  const [data, setData] = useState<PostRecordingData>({
    title: initialData.title || "",
    year: initialData.year,
    photos: initialData.photos || [],
    originalTranscript: initialData.originalTranscript || initialData.recording?.rawTranscript || "",
    enhancedTranscript: initialData.enhancedTranscript || "",
    useEnhanced: initialData.useEnhanced ?? true,
    lessonLearned: initialData.lessonLearned || "",
    recording: initialData.recording!,
    userBirthYear: user?.birth_year,
  });

  // Update a single field
  const updateData = useCallback(<K extends keyof PostRecordingData>(
    key: K,
    value: PostRecordingData[K]
  ) => {
    setData((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Navigation
  const nextStep = useCallback(() => {
    if (currentStep < 4) {
      setCurrentStep((prev) => (prev + 1) as WizardStep);
    }
  }, [currentStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as WizardStep);
    }
  }, [currentStep]);

  const goToStep = useCallback((step: WizardStep) => {
    setCurrentStep(step);
  }, []);

  // Validation
  const canGoNext = currentStep === 1 ? data.title.trim().length > 0 : true;
  const canGoPrev = currentStep > 1;

  // Submit story to API
  const submitStory = useCallback(async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Upload audio if exists
      let audioUrl: string | null = null;
      if (data.recording.audioBlob) {
        const formData = new FormData();
        formData.append("audio", data.recording.audioBlob, "story.webm");

        const audioResponse = await fetch("/api/upload/audio", {
          method: "POST",
          body: formData,
        });

        if (!audioResponse.ok) {
          throw new Error("Failed to upload audio");
        }

        const { audioUrl: uploadedUrl } = await audioResponse.json();
        audioUrl = uploadedUrl;
      }

      // 2. Upload photos and get paths
      const photoUploads = await Promise.all(
        data.photos.map(async (photo) => {
          // If photo already has a URL (from edit mode), keep it
          if (photo.url && !photo.url.startsWith("blob:")) {
            return photo;
          }

          // Otherwise, upload it
          if (photo.file) {
            const formData = new FormData();
            formData.append("photo", photo.file);

            const response = await fetch("/api/upload/photo", {
              method: "POST",
              body: formData,
            });

            if (!response.ok) {
              throw new Error("Failed to upload photo");
            }

            const { filePath } = await response.json();
            return {
              ...photo,
              url: filePath,
              file: undefined, // Remove file object
            };
          }

          return photo;
        })
      );

      // 3. Create story
      const storyPayload = {
        title: data.title.trim(),
        year: data.year,
        transcript: data.useEnhanced ? data.enhancedTranscript : data.originalTranscript,
        audioUrl,
        duration: data.recording.duration,
        wisdomClipText: data.lessonLearned.trim() || null,
        photos: photoUploads,
        metadata: {
          recordingMode: data.recording.mode,
          qaPairs: data.recording.qaPairs || null,
          originalTranscript: data.originalTranscript,
          enhancedTranscript: data.enhancedTranscript,
          useEnhanced: data.useEnhanced,
        },
      };

      const response = await fetch("/api/stories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(storyPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save story");
      }

      const { story } = await response.json();

      toast({
        title: "Story saved!",
        description: `"${data.title}" has been added to your timeline.`,
      });

      onComplete?.();

      // Navigate to timeline
      router.push("/timeline");
    } catch (err) {
      console.error("[useRecordingWizard] Error saving story:", err);
      setError(err instanceof Error ? err.message : "Failed to save story");
      toast({
        title: "Error saving story",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [data, router, onComplete]);

  return {
    currentStep,
    nextStep,
    prevStep,
    goToStep,
    canGoNext,
    canGoPrev,
    data,
    updateData,
    submitStory,
    isSubmitting,
    error,
  };
}
