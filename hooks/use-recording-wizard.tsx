import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
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
  const { user, session } = useAuth();
  const queryClient = useQueryClient();
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
    userBirthYear: user?.birthYear,
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
      if (!session?.access_token) {
        throw new Error("You must be logged in to save a story");
      }

      // 1. Upload audio if exists
      let audioUrl: string | null = null;
      if (data.recording.audioBlob) {
        const formData = new FormData();
        formData.append("audio", data.recording.audioBlob, "story.webm");

        const audioResponse = await fetch("/api/upload/audio", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: formData,
        });

        if (!audioResponse.ok) {
          const errorText = await audioResponse.text();
          console.error("[useRecordingWizard] Audio upload failed:", errorText);
          throw new Error("Failed to upload audio");
        }

        const { url: uploadedUrl } = await audioResponse.json();
        audioUrl = uploadedUrl;
      } else {
        console.warn("[useRecordingWizard] ⚠️ No audio blob found in recording data");
      }

      // 2. Upload photos and get paths
      const photoUploads = await Promise.all(
        data.photos.map(async (photo, index) => {
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
              headers: {
                Authorization: `Bearer ${session?.access_token}`,
              },
              body: formData,
            });

            if (!response.ok) {
              const errorText = await response.text();
              console.error(`[useRecordingWizard] Photo ${index} upload failed:`, errorText);
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
        transcription: data.useEnhanced ? data.enhancedTranscript : data.originalTranscript,
        audioUrl,
        durationSeconds: data.recording.duration || 1, // Minimum 1 second (database constraint requires 1-120)
        wisdomClipText: data.lessonLearned?.trim() || "",
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
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(storyPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("[useRecordingWizard] API error response:", errorData);
        console.error("[useRecordingWizard] Validation details:", errorData.details);
        throw new Error(errorData.error || "Failed to save story");
      }

      const { story } = await response.json();

      toast({
        title: "Story saved!",
        description: `"${data.title}" has been added to your timeline.`,
      });

      // Invalidate queries to fetch fresh data
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      queryClient.invalidateQueries({ queryKey: ["stories"] });

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
  }, [data, router, onComplete, session]);

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
